# n8n GitHub Auto-Deploy Rollout Guide

This guide explains how the GitHub-to-n8n auto-update system works, what it requires, and how to roll the pattern out across other n8n workflow repositories.

The aim is simple:

```text
GitHub is the source of truth.
A merge to main updates the matching n8n workflow automatically.
Bad workflow JSON is blocked before it reaches n8n.
```

---

## 1. What the auto-update system does

The system uses a GitHub Action to deploy a workflow JSON file from a repository into an existing self-hosted n8n workflow.

There are two run modes:

| Trigger | What happens | Deploy mode |
|---|---|---|
| Manual `workflow_dispatch` | User chooses dry-run or live deploy | `DRY_RUN=true` or `DRY_RUN=false` |
| Push or merge to `main` | Action runs automatically when relevant files change | `DRY_RUN=false` |

On automatic runs, the Action:

1. Checks out the repository.
2. Sets up Node.js.
3. Resolves deploy mode.
4. Checks the deploy script syntax.
5. Checks the audit script syntax.
6. Validates the workflow JSON.
7. Runs the workflow audit.
8. Sends the safe update payload to n8n.

---

## 2. Required files

Each n8n workflow repository should contain these files:

```text
.github/workflows/deploy-n8n.yml
scripts/deploy-n8n-workflow.mjs
scripts/audit-workflow.mjs
workflows/<workflow-name>.import.json
docs/n8n-auto-deploy-rollout-guide.md
```

For this Ghostwriter repository, the workflow file is:

```text
workflows/ghostwriter-story-generator-v2.import.json
```

For other workflow projects, replace that path with the relevant exported n8n workflow JSON file.

---

## 3. Required GitHub secrets

Each repository needs these GitHub Actions secrets:

| Secret | Required | Purpose |
|---|---:|---|
| `N8N_BASE_URL` | Yes | Base URL of the n8n instance, for example `https://n8n.example.com` |
| `N8N_API_KEY` | Yes | n8n API key used by GitHub Actions |
| `N8N_WORKFLOW_ID` | Yes | The target n8n workflow ID to update |
| `N8N_DEPLOY_ACTIVE` | Optional | Set to `true` or `false` only when the Action should force activation state |

Recommended default:

```text
Leave N8N_DEPLOY_ACTIVE unset.
```

That lets the deployed workflow keep its existing active/inactive state in n8n.

---

## 4. Required n8n setup

Before enabling auto-deploy, the target workflow must already exist in n8n.

Setup steps:

1. Import or create the workflow in n8n manually once.
2. Copy the workflow ID from n8n.
3. Add that ID to GitHub as `N8N_WORKFLOW_ID`.
4. Create any required credentials inside n8n.
5. Export the workflow JSON into the GitHub repository.
6. Make GitHub the source of truth from this point onward.

Important:

```text
Do not store live API keys directly inside workflow JSON.
Use n8n credentials wherever possible.
```

For Ghostwriter, Gemini uses a stored Header Auth credential named:

```text
Header Auth account
```

It supplies:

```text
x-goog-api-key
```

---

## 5. How the GitHub Action works

The Action supports both manual and automatic execution.

The key trigger pattern is:

```yaml
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Validate only, do not deploy"
        required: true
        default: "true"
        type: choice
        options:
          - "true"
          - "false"
  push:
    branches:
      - main
    paths:
      - "workflows/<workflow-name>.import.json"
      - "scripts/deploy-n8n-workflow.mjs"
      - "scripts/audit-workflow.mjs"
      - ".github/workflows/deploy-n8n.yml"
```

The path filter prevents unrelated documentation or README changes from redeploying n8n.

The deploy mode is resolved like this:

```yaml
- name: Resolve deploy mode
  run: |
    if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
      echo "DRY_RUN=${{ github.event.inputs.dry_run }}" >> "$GITHUB_ENV"
    else
      echo "DRY_RUN=false" >> "$GITHUB_ENV"
    fi
```

That means:

```text
Manual run: user chooses dry-run or live deploy.
Merge to main: deploys live automatically.
```

---

## 6. How the deploy script works

The deploy script reads the workflow JSON, validates it, removes unsafe fields, and updates the target n8n workflow through the n8n API.

The update payload must stay intentionally minimal:

```text
name
nodes
connections
settings
```

Do not send these fields in the update payload:

```text
id
versionId
active
meta
createdAt
updatedAt
triggerCount
shared
ownedBy
homeProject
usedCredentials
tags
pinData
staticData
```

Why:

- n8n treats several exported fields as read-only.
- Sending them can cause HTTP 400 errors.
- Activation should be handled separately, not inside the workflow update body.
- Minimal payloads make deployments predictable.

Recommended update behaviour:

```text
PUT /api/v1/workflows/{workflowId}
Fallback to PATCH only if PUT returns HTTP 405.
```

---

## 7. How the audit script works

The audit script is project-specific safety armour. It checks that the workflow is safe before deployment.

For Ghostwriter, the audit checks:

- No forbidden Gemini environment-variable references.
- Gemini HTTP Request nodes use the n8n Header Auth credential.
- Deploy payload fields remain limited to `name`, `nodes`, `connections`, `settings`.
- Parser nodes preserve original workflow state after Gemini HTTP calls.
- Length enforcement fails cleanly instead of crashing when input state is missing.

For other workflows, adapt the audit to the workflow’s risks.

Examples:

| Workflow type | Audit should check |
|---|---|
| AI content generator | No API keys in URLs, parser nodes preserve state, strict JSON parse guards |
| WordPress publisher | Callback URLs are HTTPS, auth headers exist, final payload shape is valid |
| Image generation pipeline | Asset URLs exist, binary/image outputs are preserved, fallback paths are wired |
| Data sync workflow | Database write nodes use expected table names, destructive operations are guarded |
| Client automation | Credentials are stored in n8n, no client secrets are committed |

Audit scripts should fail loudly before deployment.

Good failure style:

```text
Workflow audit failed:
- Gemini node X does not use Header Auth account.
- Parser node Y does not preserve original workflow state.
```

---

## 8. Rollout checklist for a new n8n workflow

Use this checklist for every new workflow repo.

### A. Prepare n8n

```text
[ ] Workflow exists in n8n.
[ ] Workflow has been tested manually.
[ ] Required n8n credentials exist.
[ ] Workflow ID has been copied.
[ ] Current live workflow has been exported as rollback backup.
```

### B. Prepare GitHub repo

```text
[ ] Add workflow JSON under workflows/.
[ ] Add scripts/deploy-n8n-workflow.mjs.
[ ] Add scripts/audit-workflow.mjs.
[ ] Add .github/workflows/deploy-n8n.yml.
[ ] Add docs/n8n-auto-deploy-rollout-guide.md or project-specific equivalent.
```

### C. Add GitHub secrets

```text
[ ] N8N_BASE_URL
[ ] N8N_API_KEY
[ ] N8N_WORKFLOW_ID
[ ] Optional: N8N_DEPLOY_ACTIVE
```

### D. First deployment

```text
[ ] Run GitHub Action manually with dry_run=true.
[ ] Confirm audit passes.
[ ] Confirm update payload fields are only name, nodes, connections, settings.
[ ] Run GitHub Action manually with dry_run=false.
[ ] Open n8n and visually inspect the workflow.
[ ] Test the workflow end-to-end.
```

### E. Enable auto-deploy

```text
[ ] Add push trigger for main.
[ ] Limit trigger paths to workflow/deploy/audit files.
[ ] Merge a small test PR.
[ ] Confirm GitHub Action runs automatically.
[ ] Confirm n8n workflow updates successfully.
```

---

## 9. Standard deploy workflow template

This is the standard GitHub Action pattern to copy into other repos.

Template placeholders are intentionally marked with angle brackets and must be replaced for each workflow.

```yaml
name: Deploy <PROJECT_NAME> workflow to n8n

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Validate only, do not deploy"
        required: true
        default: "true"
        type: choice
        options:
          - "true"
          - "false"
  push:
    branches:
      - main
    paths:
      - "workflows/<WORKFLOW_FILE>.import.json"
      - "scripts/deploy-n8n-workflow.mjs"
      - "scripts/audit-workflow.mjs"
      - ".github/workflows/deploy-n8n.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Resolve deploy mode
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "DRY_RUN=${{ github.event.inputs.dry_run }}" >> "$GITHUB_ENV"
          else
            echo "DRY_RUN=false" >> "$GITHUB_ENV"
          fi

      - name: Check deploy script syntax
        run: node --check scripts/deploy-n8n-workflow.mjs

      - name: Check workflow audit script syntax
        run: node --check scripts/audit-workflow.mjs

      - name: Validate workflow JSON
        run: python3 -m json.tool workflows/<WORKFLOW_FILE>.import.json > /tmp/workflow.json

      - name: Audit workflow runtime stability
        run: node scripts/audit-workflow.mjs

      - name: Deploy workflow to n8n
        env:
          N8N_BASE_URL: ${{ secrets.N8N_BASE_URL }}
          N8N_API_KEY: ${{ secrets.N8N_API_KEY }}
          N8N_WORKFLOW_ID: ${{ secrets.N8N_WORKFLOW_ID }}
          N8N_DEPLOY_ACTIVE: ${{ secrets.N8N_DEPLOY_ACTIVE }}
        run: node scripts/deploy-n8n-workflow.mjs
```

---

## 10. Standard rollout prompt for Codex

Use this prompt when rolling the system out to another n8n workflow repository.

```text
Repository:
<OWNER>/<REPO>

Task:
Implement the standard GitHub-to-n8n auto-deploy pattern for this n8n workflow repository.

Required behaviour:
- GitHub remains the source of truth for the workflow JSON.
- Manual workflow_dispatch deploy remains available with dry_run true/false.
- Push or merge to main automatically deploys live with DRY_RUN=false.
- Auto-deploy only triggers when relevant workflow/deployment files change.

Required files:
- .github/workflows/deploy-n8n.yml
- scripts/deploy-n8n-workflow.mjs
- scripts/audit-workflow.mjs
- workflows/<WORKFLOW_FILE>.import.json
- docs/n8n-auto-deploy-rollout-guide.md or project-specific equivalent

GitHub secrets required:
- N8N_BASE_URL
- N8N_API_KEY
- N8N_WORKFLOW_ID
- Optional: N8N_DEPLOY_ACTIVE

Deploy script requirements:
- Read the workflow JSON.
- Validate required fields: name, nodes, connections, settings.
- Send only name, nodes, connections, settings to n8n.
- Never send active, meta, tags, pinData, staticData, credentials ownership, timestamps, or instance-specific fields.
- PUT first, PATCH only if PUT returns HTTP 405.
- Never print secrets.
- Support dry-run mode.

Audit script requirements:
- Check for workflow-specific forbidden strings.
- Check that credentials are referenced through n8n credentials, not hardcoded keys.
- Check that important node contracts are intact.
- Fail before deployment if the workflow is unsafe.

Do not change:
- Workflow business logic unless required for deploy safety.
- Live credentials.
- Production URLs unless explicitly requested.

Testing:
- node --check scripts/deploy-n8n-workflow.mjs
- node --check scripts/audit-workflow.mjs
- node scripts/audit-workflow.mjs
- python3 -m json.tool workflows/<WORKFLOW_FILE>.import.json
- git diff --check

Final response:
- PR number
- files changed
- tests run
- confirm manual dry-run works
- confirm push-to-main auto-deploy is configured
- confirm auto-deploy path filters are limited
- confirm workflow audit runs before deploy
```

---

## 11. Rollback process

Before enabling auto-deploy, keep a known-good export from n8n.

Rollback options:

1. Revert the GitHub PR and let auto-deploy restore the previous JSON.
2. Manually run the GitHub Action against a known-good branch.
3. Manually import the backup JSON into n8n.

Recommended rollback habit:

```text
Before large workflow changes, export the current n8n workflow and save it outside n8n.
```

---

## 12. Rules of the road

Use these rules for every auto-deployed n8n workflow.

```text
GitHub owns workflow structure.
n8n owns live credentials.
GitHub Actions owns deployment.
Audit scripts own safety checks.
Manual dry-run comes before first live deploy.
Auto-deploy only runs after the workflow has passed manual deploy once.
```

The system is deliberately boring. Boring deployment is good deployment. The fireworks belong in the content, not in production.
