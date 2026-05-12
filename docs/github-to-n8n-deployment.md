# GitHub-to-n8n deployment

## Purpose

GitHub is the source of truth for the Ghostwriter n8n workflow file:

```text
workflows/ghostwriter-story-generator-v2.import.json
```

The manual GitHub Action in `.github/workflows/deploy-n8n.yml` validates that JSON file and can deploy it into an existing self-hosted n8n workflow by using n8n's public API.

## Required n8n setup

Before running a live deployment, n8n must already have a workflow to update. Create that target workflow by either:

1. importing `workflows/ghostwriter-story-generator-v2.import.json` into n8n once manually, or
2. creating the workflow through the n8n API.

Then:

1. create an API key in n8n,
2. copy the target workflow ID from n8n, and
3. keep a manual export or backup of the current n8n workflow before the first GitHub-driven deployment.

## Required GitHub secrets

Add these repository secrets before running a live deployment:

| Secret | Required | Description |
| --- | --- | --- |
| `N8N_BASE_URL` | Yes | Base URL for the self-hosted n8n instance, for example `https://n8n.example.com`. |
| `N8N_API_KEY` | Yes | n8n API key used for the public API request. |
| `N8N_WORKFLOW_ID` | Yes | Existing n8n workflow ID to update. |
| `N8N_DEPLOY_ACTIVE` | No | Optional boolean. Normally leave unset so the current n8n active state remains unchanged. Set only when the deployment should explicitly activate or deactivate the workflow after a successful update. |

Dry runs do not require n8n secrets. If `N8N_WORKFLOW_ID` is present during a dry run, the action prints it; the API key is never printed.

## First-time deployment process

1. Merge the workflow PR to `main`.
2. Manually import `workflows/ghostwriter-story-generator-v2.import.json` into n8n once if the target workflow does not already exist.
3. Copy the workflow ID from n8n.
4. Add the required GitHub repository secrets:
   - `N8N_BASE_URL`
   - `N8N_API_KEY`
   - `N8N_WORKFLOW_ID`
5. Normally leave `N8N_DEPLOY_ACTIVE` unset. Add `N8N_DEPLOY_ACTIVE=true` or `N8N_DEPLOY_ACTIVE=false` only when the GitHub deployment should explicitly activate or deactivate the workflow after a successful update.
6. Run **Deploy Ghostwriter workflow to n8n** from the GitHub Actions tab with `dry_run=true`.
7. Confirm the dry-run output shows the expected workflow name, node count, required fields, target workflow ID, read-only fields removed, and update payload fields.
8. Run the same action with `dry_run=false`.
9. Open the n8n editor and visually inspect the workflow.
10. Test the full WordPress → n8n → WordPress generation flow.

## Safety notes

- Do not commit n8n API keys, credentials, or secret values.
- Deployment is manual-only through `workflow_dispatch` until manual deployments are proven stable.
- Do not enable automatic deployments until the manual process is tested and trusted.
- Keep a manual export or backup of the current n8n workflow before the first deployment.
- If deployment fails, n8n may still have the previous workflow active.
- The deploy script removes read-only or instance-specific fields such as `id`, `versionId`, `active`, `meta`, timestamps, trigger counts, ownership fields, sharing fields, project fields, and credential usage fields before sending the update payload.
- This self-hosted n8n instance treats `meta` as read-only, so the deploy script never sends `meta` in the update payload, even if the exported value appears generic or non-instance-specific.
- This self-hosted n8n instance currently accepts workflow updates with `PUT /api/v1/workflows/{id}` and returns HTTP 405 for `PATCH /api/v1/workflows/{id}`. The deploy script tries `PUT` first and only falls back to `PATCH` if `PUT` returns HTTP 405.
- n8n treats `active` as read-only in workflow update payloads, so the deploy script never sends `active` in the PUT or PATCH body. Existing active state is left unchanged by omitting `active` from the update payload.
- `N8N_DEPLOY_ACTIVE` should normally be left unset. If it is explicitly set, the deploy script updates the workflow first and then changes active state only through `POST /api/v1/workflows/{id}/activate` or `POST /api/v1/workflows/{id}/deactivate`.

## Future option: path-filtered automatic deployment

After manual deployment is stable, automatic deployment can be added for pushes to `main` when files under `workflows/` change. A future trigger could look like this:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - "workflows/**"
```

Keep the initial rollout manual-only. Add automatic deployment only after the team has validated the dry-run and live deployment process repeatedly.
