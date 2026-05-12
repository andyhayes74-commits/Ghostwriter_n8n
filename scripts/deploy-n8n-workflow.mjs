#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const WORKFLOW_PATH = resolve('workflows/ghostwriter-story-generator-v2.import.json');
const REQUIRED_FIELDS = ['name', 'nodes', 'connections', 'settings'];
const FORBIDDEN_GEMINI_ENV_REFERENCES = [
  '$env.GEMINI_API_KEY',
  '$env.GEMINI_MODEL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  '?key={{',
];
const FORBIDDEN_GEMINI_ENV_MESSAGE =
  'Blocked deploy: workflow contains forbidden Gemini environment-variable references. Use n8n stored Header Auth credentials instead.';

const EXCLUDED_UPDATE_FIELDS = [
  'id',
  'versionId',
  'active',
  'meta',
  'createdAt',
  'updatedAt',
  'triggerCount',
  'shared',
  'ownedBy',
  'homeProject',
  'usedCredentials',
  'tags',
  'pinData',
  'staticData',
];

function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required when DRY_RUN=false.`);
  }
  return value.trim();
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function redactSecrets(text, secrets) {
  let redacted = text;
  for (const secret of secrets) {
    if (secret) {
      redacted = redacted.split(secret).join('[REDACTED]');
    }
  }
  return redacted;
}

async function readJsonWorkflow() {
  const raw = await readFile(WORKFLOW_PATH, 'utf8');
  return { raw, workflow: JSON.parse(raw) };
}

function assertNoForbiddenGeminiEnvReferences(rawWorkflow) {
  const hasForbiddenReference = FORBIDDEN_GEMINI_ENV_REFERENCES.some((reference) => rawWorkflow.includes(reference));

  if (hasForbiddenReference) {
    throw new Error(FORBIDDEN_GEMINI_ENV_MESSAGE);
  }
}

function validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
    throw new Error('Workflow JSON must contain a single workflow object.');
  }

  const required = {
    name: typeof workflow.name === 'string' && workflow.name.trim().length > 0,
    nodes: Array.isArray(workflow.nodes),
    connections: workflow.connections && typeof workflow.connections === 'object' && !Array.isArray(workflow.connections),
    settings: workflow.settings && typeof workflow.settings === 'object' && !Array.isArray(workflow.settings),
  };

  return required;
}

function assertRequiredFields(required) {
  const missing = Object.entries(required)
    .filter(([, exists]) => !exists)
    .map(([field]) => field);

  if (missing.length > 0) {
    throw new Error(`Workflow JSON is missing required deployable field(s): ${missing.join(', ')}`);
  }
}

function sanitizeWorkflow(workflow) {
  const sanitized = {};

  for (const field of REQUIRED_FIELDS) {
    sanitized[field] = workflow[field];
  }

  return sanitized;
}

function summarizeWorkflow(workflow, required, targetWorkflowId, dryRun, payload) {
  console.log(`Mode: ${dryRun ? 'dry run (validate only)' : 'deploy'}`);
  console.log(`Workflow file: ${WORKFLOW_PATH}`);
  console.log(`Workflow name: ${workflow.name}`);
  console.log(`Node count: ${Array.isArray(workflow.nodes) ? workflow.nodes.length : '[invalid nodes field]'}`);
  console.log(`Target n8n workflow ID: ${targetWorkflowId || '[not set]'}`);
  console.log('Required fields:');
  for (const field of REQUIRED_FIELDS) {
    console.log(`- ${field}: ${required[field] ? 'present' : 'missing'}`);
  }

  console.log(`Read-only/excluded fields always removed from update payload when present: ${EXCLUDED_UPDATE_FIELDS.join(', ')}`);

  const excludedPresent = EXCLUDED_UPDATE_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(workflow, field));
  if (excludedPresent.length > 0) {
    console.log(`Read-only/excluded fields removed from this workflow: ${excludedPresent.join(', ')}`);
  } else {
    console.log('Read-only/excluded fields removed from this workflow: [none present]');
  }

  console.log(`Update payload fields to send: ${Object.keys(payload).join(', ')}`);
}

async function apiRequest({ baseUrl, workflowId, apiKey, method, path = '', body }) {
  const url = `${baseUrl}/api/v1/workflows/${encodeURIComponent(workflowId)}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { response, data, text };
}

async function checkedRequest(options, secrets) {
  const result = await apiRequest(options);
  if (!result.response.ok) {
    const body = result.text || JSON.stringify(result.data ?? '');
    throw new Error(
      `${options.method} ${options.path || ''} failed with HTTP ${result.response.status} ${result.response.statusText}: ${redactSecrets(body, secrets)}`,
    );
  }
  return result.data;
}

function formatFailedRequest(method, result, secrets) {
  return `${method} update failed with HTTP ${result.response.status} ${result.response.statusText}: ${redactSecrets(result.text || JSON.stringify(result.data ?? ''), secrets)}`;
}

async function updateWorkflowWithFallback({ baseUrl, workflowId, apiKey, payload, secrets }) {
  const firstMethod = 'PUT';
  const fallbackMethod = 'PATCH';
  const first = await apiRequest({ baseUrl, workflowId, apiKey, method: firstMethod, body: payload });

  if (first.response.ok) {
    return { method: firstMethod, data: first.data };
  }

  const firstError = formatFailedRequest(firstMethod, first, secrets);
  if (first.response.status !== 405) {
    throw new Error(firstError);
  }

  console.log(`${firstMethod} update returned HTTP 405; retrying once with ${fallbackMethod}.`);
  const fallback = await apiRequest({ baseUrl, workflowId, apiKey, method: fallbackMethod, body: payload });

  if (!fallback.response.ok) {
    throw new Error(`${firstError}\n${formatFailedRequest(fallbackMethod, fallback, secrets)}`);
  }

  return { method: fallbackMethod, data: fallback.data };
}

async function setActivation({ baseUrl, workflowId, apiKey, active, secrets }) {
  const endpoint = active ? '/activate' : '/deactivate';
  await checkedRequest({ baseUrl, workflowId, apiKey, method: 'POST', path: endpoint }, secrets);
}

async function main() {
  const dryRun = parseBool(process.env.DRY_RUN, true);
  const workflowId = process.env.N8N_WORKFLOW_ID?.trim() || '';
  const activeEnvProvided = process.env.N8N_DEPLOY_ACTIVE !== undefined && process.env.N8N_DEPLOY_ACTIVE !== '';
  const activeOverride = activeEnvProvided ? parseBool(process.env.N8N_DEPLOY_ACTIVE) : undefined;

  const { raw, workflow } = await readJsonWorkflow();
  assertNoForbiddenGeminiEnvReferences(raw);
  const required = validateWorkflow(workflow);
  const payload = sanitizeWorkflow(workflow);
  summarizeWorkflow(workflow, required, workflowId, dryRun, payload);
  assertRequiredFields(required);

  if (dryRun) {
    console.log('Dry run complete. No n8n API calls were made.');
    return;
  }

  const baseUrl = normalizeBaseUrl(requireEnv('N8N_BASE_URL'));
  const apiKey = requireEnv('N8N_API_KEY');
  const requiredWorkflowId = requireEnv('N8N_WORKFLOW_ID');
  const secrets = [apiKey];

  let existingWorkflow;
  try {
    existingWorkflow = await checkedRequest(
      { baseUrl, workflowId: requiredWorkflowId, apiKey, method: 'GET' },
      secrets,
    );
    if (typeof existingWorkflow?.active === 'boolean' && activeOverride === undefined) {
      console.log('Existing active state detected and will be left unchanged by omitting active from update payload.');
    }
  } catch (error) {
    console.warn(`Warning: could not fetch existing workflow before update. ${redactSecrets(error.message, secrets)}`);
    if (activeOverride === undefined) {
      console.warn('No active-state override was provided, so the update payload will omit active to avoid accidental deactivation.');
    }
  }

  if (activeOverride !== undefined) {
    console.log('Active override requested and will be applied after successful workflow update.');
  }

  const { method, data } = await updateWorkflowWithFallback({
    baseUrl,
    workflowId: requiredWorkflowId,
    apiKey,
    payload,
    secrets,
  });

  const updatedWorkflow = data?.data ?? data;
  console.log(`Workflow update succeeded via ${method}: ${updatedWorkflow?.id ?? requiredWorkflowId} / ${updatedWorkflow?.name ?? payload.name}`);

  if (activeOverride !== undefined) {
    const updatedActive = updatedWorkflow?.active;
    if (updatedActive !== activeOverride) {
      try {
        await setActivation({ baseUrl, workflowId: requiredWorkflowId, apiKey, active: activeOverride, secrets });
        console.log(`Workflow ${activeOverride ? 'activation' : 'deactivation'} succeeded for ${requiredWorkflowId}.`);
      } catch (error) {
        throw new Error(
          `Workflow updated, but ${activeOverride ? 'activation' : 'deactivation'} failed. ${redactSecrets(error.message, secrets)}`,
        );
      }
    }
  }
}

main().catch((error) => {
  console.error(redactSecrets(error.stack || error.message, [process.env.N8N_API_KEY]));
  process.exit(1);
});
