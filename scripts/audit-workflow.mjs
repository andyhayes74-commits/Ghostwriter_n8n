#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WORKFLOW_PATH = resolve('workflows/ghostwriter-story-generator-v2.import.json');
const DEPLOY_SCRIPT_PATH = resolve('scripts/deploy-n8n-workflow.mjs');
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const HEADER_AUTH_CREDENTIAL_NAME = 'Header Auth account';
const DEPLOYABLE_FIELDS = ['name', 'nodes', 'connections', 'settings'];
const FORBIDDEN_GEMINI_REFERENCES = [
  '$env.GEMINI_API_KEY',
  '$env.GEMINI_MODEL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  '?key={{',
];

const workflowRaw = readFileSync(WORKFLOW_PATH, 'utf8');
const workflow = JSON.parse(workflowRaw);
const deployScript = readFileSync(DEPLOY_SCRIPT_PATH, 'utf8');
const failures = [];

function fail(message) {
  failures.push(message);
}

function getNode(name) {
  return workflow.nodes.find((node) => node.name === name);
}

function codeFor(name) {
  return getNode(name)?.parameters?.jsCode || '';
}

function outgoingNodeNames(name) {
  const outputs = workflow.connections?.[name]?.main || [];
  return outputs.flat().map((connection) => connection.node).filter(Boolean);
}

function incomingNodeNames(name) {
  return Object.entries(workflow.connections || {})
    .filter(([, connection]) => (connection.main || []).flat().some((target) => target.node === name))
    .map(([source]) => source);
}

function assertNoForbiddenGeminiReferences() {
  const found = FORBIDDEN_GEMINI_REFERENCES.filter((reference) => workflowRaw.includes(reference));
  if (found.length > 0) {
    fail(`Workflow contains forbidden Gemini environment/key reference(s): ${found.join(', ')}`);
  }
}

function assertGeminiHttpCredentialShape() {
  const geminiNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.url === GEMINI_URL);
  if (geminiNodes.length === 0) {
    fail('No Gemini HTTP Request nodes were found.');
  }

  for (const node of geminiNodes) {
    if (node.parameters?.authentication !== 'genericCredentialType') {
      fail(`${node.name} does not use Generic Credential Type authentication.`);
    }
    if (node.parameters?.genericAuthType !== 'httpHeaderAuth') {
      fail(`${node.name} does not use Header Auth generic auth type.`);
    }
    if (node.credentials?.httpHeaderAuth?.name !== HEADER_AUTH_CREDENTIAL_NAME) {
      fail(`${node.name} does not use the ${HEADER_AUTH_CREDENTIAL_NAME} credential.`);
    }
    if (String(node.parameters?.url || '').includes('?key={{')) {
      fail(`${node.name} URL contains an inline Gemini API key expression.`);
    }
  }
}

function assertDeployPayloadFields() {
  const requiredFieldsMatch = deployScript.match(/const REQUIRED_FIELDS = \[([^\]]+)\]/m);
  if (!requiredFieldsMatch) {
    fail('Deploy script does not declare REQUIRED_FIELDS.');
    return;
  }

  const declaredFields = [...requiredFieldsMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  if (JSON.stringify(declaredFields) !== JSON.stringify(DEPLOYABLE_FIELDS)) {
    fail(`Deploy script REQUIRED_FIELDS differ from ${DEPLOYABLE_FIELDS.join(', ')}: ${declaredFields.join(', ')}`);
  }

  for (const field of DEPLOYABLE_FIELDS) {
    if (!deployScript.includes(`sanitized[field] = workflow[field]`)) {
      fail('Deploy script sanitizeWorkflow no longer copies only REQUIRED_FIELDS via sanitized[field] = workflow[field].');
      break;
    }
  }
}

function assertParserPreservesOriginalItemState() {
  const geminiNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.url === GEMINI_URL);

  for (const httpNode of geminiNodes) {
    const [promptNodeName] = incomingNodeNames(httpNode.name);
    const parserNodeNames = outgoingNodeNames(httpNode.name);
    if (!promptNodeName) {
      fail(`${httpNode.name} has no upstream prompt-building node.`);
    }
    if (parserNodeNames.length === 0) {
      fail(`${httpNode.name} has no downstream parser node.`);
      continue;
    }

    for (const parserNodeName of parserNodeNames) {
      const parserNode = getNode(parserNodeName);
      const code = parserNode?.parameters?.jsCode || '';
      if (parserNode?.type !== 'n8n-nodes-base.code') {
        fail(`${httpNode.name} downstream node ${parserNodeName} is not a Code parser node.`);
        continue;
      }
      if (!/^const aiResponse = \$input\.first\(\)\.json;/m.test(code)) {
        fail(`${parserNodeName} does not treat $input.first().json as aiResponse.`);
      }
      if (!code.includes(`$('${promptNodeName}').item.json`) && !code.includes(`$('${promptNodeName}').first().json`)) {
        fail(`${parserNodeName} does not retrieve original item state from ${promptNodeName}.`);
      }
      if (!code.includes('extractText(aiResponse)')) {
        fail(`${parserNodeName} does not parse text from aiResponse.`);
      }
      if (!code.includes('...item')) {
        fail(`${parserNodeName} does not merge parsed fields onto original item state.`);
      }
      if (code.includes('...aiResponse')) {
        fail(`${parserNodeName} merges output onto aiResponse instead of original item state.`);
      }
      if (/const item = \$input\.first\(\)\.json;/.test(code)) {
        fail(`${parserNodeName} still treats the Gemini response as the workflow item.`);
      }
    }
  }
}

function assertLengthEnforcementDefensive() {
  const code = codeFor('Enforce Length Profile and Public Cap');
  if (!code) {
    fail('Enforce Length Profile and Public Cap node is missing or has no code.');
    return;
  }

  const guardIndex = code.indexOf("if (!input || typeof input !== 'object')");
  const modeIndex = code.indexOf('input.mode');
  if (guardIndex === -1) {
    fail('Enforce Length Profile and Public Cap does not guard missing item.input.');
  }
  if (modeIndex === -1) {
    fail('Enforce Length Profile and Public Cap no longer checks input.mode.');
  }
  if (modeIndex !== -1 && (guardIndex === -1 || modeIndex < guardIndex)) {
    fail('Enforce Length Profile and Public Cap can still crash by reading input.mode before the missing-input guard.');
  }
  for (const requiredSnippet of [
    "workflow_failed: true",
    "error_code: 'MISSING_INPUT_STATE'",
    "message: 'Missing input state before length enforcement.'",
    'retryable: false',
  ]) {
    if (!code.includes(requiredSnippet)) {
      fail(`Enforce Length Profile and Public Cap missing defensive failure snippet: ${requiredSnippet}`);
    }
  }
}

assertNoForbiddenGeminiReferences();
assertGeminiHttpCredentialShape();
assertDeployPayloadFields();
assertParserPreservesOriginalItemState();
assertLengthEnforcementDefensive();

if (failures.length > 0) {
  console.error('Workflow audit failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Workflow audit passed.');
console.log(`- Gemini HTTP nodes use ${HEADER_AUTH_CREDENTIAL_NAME}.`);
console.log(`- Deploy payload fields are limited to ${DEPLOYABLE_FIELDS.join(', ')}.`);
console.log('- Gemini parser nodes preserve original workflow item state.');
console.log('- Length enforcement is defensive for missing input state.');
