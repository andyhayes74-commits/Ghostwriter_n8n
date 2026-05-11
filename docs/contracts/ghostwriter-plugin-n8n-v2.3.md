# Ghostwriter Plugin ↔ n8n Live Bridge Contract v2.3

## Purpose

This file defines the live bridge contract between the Ghostwriter Automation WordPress plugin and `workflows/ghostwriter-story-generator-v2.import.json`.

The contract keeps the existing story-generation stages and prompt logic intact. It only defines the request fields n8n must preserve, the callback authentication header, and the callback payloads WordPress expects.

## Dispatch: WordPress to n8n

WordPress dispatches a JSON object to the n8n webhook path `ghostwriter/v2/story`.

### Required Fields

| Field | Type | Notes |
|---|---|---|
| `session_id` | string | Stable ID used to correlate progress, completion, and failure callbacks. |
| `story_prompt` | string | User prompt. The workflow validates a minimum useful length. |

### Optional Preserved Fields

| Field | Type | n8n behavior |
|---|---|---|
| `author_name` | string | Defaults to `Ghostwriter` when absent. |
| `mode` | string | Defaults to `public`; valid values are `public` and `internal`. |
| `requested_length_profile` | string or null | Treated as a hint. |
| `genre` | string or null | Preserved in `input.genre`; defaults to `null` when absent. |
| `contract` | string or null | Preserved in `input.contract`; defaults to `null` when absent. |
| `callback_url` | string or null | Callbacks are sent only when it starts with `https://`. |
| `metadata` | object | Opaque pass-through metadata. |
| `constraints` | object | User/site constraints; defaults to general-audience constraints when absent. |

The workflow also accepts the same fields nested under `input` for manual testing and replay.

## Callback Authentication

Every callback from n8n to WordPress uses the shared secret header:

```http
X-Ghostwriter-Secret: <GHOSTWRITER_CALLBACK_SECRET>
```

n8n reads the value from the environment variable `GHOSTWRITER_CALLBACK_SECRET`.

`X-Ghostwriter-Token` and `GHOSTWRITER_CALLBACK_TOKEN` are legacy names only if the deployed plugin explicitly accepts them. They are not part of the v2.3 live bridge contract.

## Callback URL Rules

- `callback_url` must start with `https://`.
- If `callback_url` is missing, null, or not HTTPS, the workflow skips callbacks.
- The workflow still returns the final package through the webhook response when callbacks are skipped.

## Progress Callback

Progress callbacks are sent after major telemetry nodes. Delivery failures are caught and must not fail the workflow.

```json
{
  "session_id": "gw_20260507_001",
  "callback_type": "progress",
  "status": "running",
  "event": {
    "event_id": "evt_001",
    "session_id": "gw_20260507_001",
    "stage": "storyboard",
    "status": "complete",
    "progress": 45,
    "message": "Executable storyboard plan created.",
    "timestamp": "2026-05-07T12:00:00Z",
    "severity": "info"
  }
}
```

## Complete Callback

WordPress saves the final story from `result`.

```json
{
  "session_id": "gw_20260507_001",
  "callback_type": "complete",
  "status": "complete",
  "result": {
    "title": "The Listening Pond",
    "author_name": "Andy Hayes",
    "genre": "Whimsical Fantasy",
    "synopsis": "A lonely frog learns that love begins with listening.",
    "story_body": "...",
    "cover_image_url": null
  }
}
```

## Failure Callback

WordPress stores or displays the failure from `error`.

```json
{
  "session_id": "gw_20260507_001",
  "callback_type": "failure",
  "status": "failed",
  "error": {
    "stage": "section_drafter",
    "error_code": "INVALID_JSON",
    "message": "The drafting model returned invalid JSON after repair.",
    "retryable": true
  }
}
```

## Compatibility Requirements

- Do not change story-generation stage order for this contract.
- Do not change prompt logic unless a future plugin contract requires it.
- Preserve `genre` and `contract` in normalized input.
- Keep completion and failure callback shapes exactly as defined above.
- Use `X-Ghostwriter-Secret` for callback authentication.
