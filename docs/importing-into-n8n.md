# Importing the Ghostwriter Story Generator v2.0 Workflow into n8n

## Import File

The importable workflow specification is:

```text
workflows/ghostwriter-story-generator-v2.import.json
```

It is a single n8n workflow. It includes both Manual Trigger and Webhook Trigger paths that feed into the same normalized flow. Do not split it into separate workflows by story length.

## What the Import Contains

The imported workflow includes:

- Manual Trigger for local testing.
- Webhook Trigger at `ghostwriter/v2/story` for future external calls.
- Shared input normalization and validation Code nodes.
- Set/Code prompt builder equivalents implemented as Code nodes for all prompt stages.
- Gemini AI calls represented as HTTP Request nodes.
- JSON parsing and required-key validation nodes after AI stages.
- A practical JSON repair branch for creative interpretation, where the length/framework/act decision is most critical.
- Failure handling and optional failure callback nodes.
- Dynamic storyboard splitting and Loop Over Items / Split in Batches drafting.
- Draft collection and merge logic.
- Continuity editor, final polish, cover brief stub, final packaging, telemetry, progress callback payload Code nodes, progress callback HTTP Request nodes, and optional complete callback nodes.
- Callback-ready terminal HTTP Request nodes that are skipped unless `callback_url` is present and starts with `https://`.
- Progress callback payload Code nodes after major telemetry nodes, followed by HTTPS guards and HTTP Request nodes configured so callback delivery cannot fail story generation.

## Required Environment Variables

Configure these in the n8n environment before executing AI or callback nodes:

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes for AI calls | Placeholder Gemini API key used by HTTP Request nodes. |
| `GEMINI_MODEL` | Yes for AI calls | Gemini model path segment, for example `gemini-1.5-pro` or the model selected for your environment. |
| `GHOSTWRITER_CALLBACK_SECRET` | Required when the plugin shared secret is configured | Shared secret sent as `X-Ghostwriter-Secret` so WordPress can accept callbacks and save completed n8n stories. |

Do not hardcode real API keys in the workflow JSON. The import file uses placeholder expressions such as `{{$env.GEMINI_API_KEY}}`.

## Import Steps

1. Open n8n.
2. Select **Workflows → Import from File**.
3. Choose `workflows/ghostwriter-story-generator-v2.import.json`.
4. Save the imported workflow as `Ghostwriter Story Generator v2.3`.
5. Confirm the workflow is inactive while configuring credentials and environment variables.
6. Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in the n8n runtime environment.
7. If using callbacks, configure `GHOSTWRITER_CALLBACK_SECRET` and a secure HTTPS callback endpoint in the caller payload.
8. Run a manual execution first.
9. Test with `examples/input-payload.json`.
10. Review each AI HTTP Request node and adjust Gemini API body shape if your deployed Gemini endpoint requires a different version, model name, or authentication method.

## Manual Test Payload

Use `examples/input-payload.json` as the first manual test. The Normalize Input node also includes a safe fallback prompt so that a manual trigger can proceed during setup, but the example payload should be used for realistic testing.

## Webhook Test Payload

POST a JSON body matching `docs/wordpress-integration-contract.md` to the Webhook Trigger URL shown by n8n after import. Minimal body:

```json
{
  "session_id": "gw_test_001",
  "story_prompt": "A frog named Jim cannot find love until he learns to listen.",
  "mode": "public"
}
```

## Gemini HTTP Request Nodes

AI stages are represented as HTTP Request nodes rather than provider-specific credential nodes so the workflow can be imported without real secrets. Each Gemini node uses:

```text
https://generativelanguage.googleapis.com/v1beta/models/{{$env.GEMINI_MODEL}}:generateContent?key={{$env.GEMINI_API_KEY}}
```

The request body asks Gemini for JSON output using the prompt assembled in the previous Code node. After import, verify the exact Gemini API version and model name you want to use.

## JSON Parsing and Repair

Each model response is parsed by a Code node that:

1. Extracts Gemini response text.
2. Removes accidental Markdown JSON fences.
3. Parses JSON.
4. Checks required keys.
5. Routes invalid output to a failure handler or, for creative interpretation, to one JSON repair attempt.

The creative interpretation stage includes a repair branch because it selects the length profile, narrative framework, and act structure used by the rest of the workflow. Additional repair branches can be copied from that pattern if you want every AI stage to retry once before failing.

## Callback Behavior

Callbacks are optional.

- If `callback_url` is missing, the workflow skips callbacks and returns the final package.
- If `callback_url` starts with `https://`, progress callback payload Code nodes build a payload and dedicated HTTP Request nodes post it with `callback_type: "progress"`, `status: "running"`, top-level `stage`, `progress`, and `message`, plus the nested telemetry `event`. Progress callback HTTP Request nodes ignore delivery failures so they do not fail the workflow.
- Complete callbacks keep `{ session_id, callback_type: "complete", status: "complete", result: final_story_package }`.
- Failure callbacks keep `{ session_id, callback_type: "failure", status: "failed", error }`.
- Terminal callback HTTP Request nodes send `X-Ghostwriter-Secret: {{$env.GHOSTWRITER_CALLBACK_SECRET}}` and ignore non-2xx response codes so story generation is not converted into a failed generation solely because the callback endpoint returned an error.

## Cover Image Stub

The workflow does not generate cover images. It generates a cover brief and forces:

```json
{
  "cover_image_url": null
}
```

Add a real image-generation node only after v2.3 text generation, validation, callbacks, and storage behavior have been tested.

## Post-Import Review Checklist

- Confirm there is only one workflow.
- Confirm both trigger paths connect to `Normalize Input`.
- Confirm every AI stage is followed by a parse/validation node.
- Confirm the storyboard array feeds the loop node.
- Confirm section drafts loop back until all storyboard sections are processed.
- Confirm the cover stage is a brief-only stub.
- Confirm optional callbacks are skipped when `callback_url` is absent.
- Confirm callback authentication uses `X-Ghostwriter-Secret` and `GHOSTWRITER_CALLBACK_SECRET`.
- Confirm progress callback delivery uses HTTP Request nodes, not Code-node internal HTTP calls.
- Confirm progress callback HTTPS guards continue the story path when `callback_url` is absent or non-HTTPS.
- Confirm no real API keys are stored in the JSON.
