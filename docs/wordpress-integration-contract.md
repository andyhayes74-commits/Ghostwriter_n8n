# WordPress Integration Contract

## Status

This contract is synced to the current Ghostwriter Automation WordPress plugin bridge. The n8n workflow accepts plugin dispatch payloads, preserves plugin-owned fields, and posts callback payloads that WordPress can use to show progress and save the final story.

For the exact live bridge version, see `docs/contracts/ghostwriter-plugin-n8n-v2.3.md`.

## Input Payload From WordPress or Manual Testing

```json
{
  "session_id": "gw_20260507_001",
  "story_prompt": "A frog named Jim who cannot find love until he learns to listen.",
  "author_name": "Andy Hayes",
  "mode": "public",
  "requested_length_profile": "short_story",
  "genre": "Speculative Fiction",
  "contract": {
    "name": "ghostwriter-plugin-n8n",
    "version": "2.3"
  },
  "callback_url": "https://example.com/wp-json/ghostwriter/v1/callback",
  "metadata": {
    "source": "wordpress",
    "visitor_id": "anon_123"
  },
  "constraints": {
    "content_rating": "general",
    "avoid": ["graphic violence"]
  }
}
```

## Required Input Fields

- `session_id`: stable request ID used for telemetry and callback matching.
- `story_prompt`: user idea, preferably 10-2,000 characters.

## Optional Input Fields

- `author_name`: displayed author attribution; default `Ghostwriter`.
- `mode`: `public` or `internal`; default `public`.
- `requested_length_profile`: hint only; creative interpretation may adjust within allowed limits.
- `genre`: plugin-selected or user-selected genre. The workflow preserves this value in normalized input and defaults it to `null` only when absent.
- `contract`: plugin bridge contract object. The workflow preserves this value in normalized input and defaults it to `null` only when absent.
- `callback_url`: optional callback destination. Callbacks are attempted only when this value starts with `https://`.
- `metadata`: opaque object passed through final payload.
- `constraints`: user or site constraints.

## Public Mode Limits

Public mode caps at `long_short_story` and 7,500 target words. If a user requests `novelette` or `novella`, the workflow should emit a warning and normalize to `long_short_story` unless internal mode is explicitly enabled.

## Callback Authentication

n8n sends the shared secret in this header:

```http
X-Ghostwriter-Secret: <GHOSTWRITER_CALLBACK_SECRET>
```

Configure the secret in n8n with the environment variable `GHOSTWRITER_CALLBACK_SECRET`. When the WordPress plugin has a shared secret configured, this variable is required for WordPress to accept callbacks and save completed n8n stories.

The v2.3 live bridge contract uses only `X-Ghostwriter-Secret` for callback authentication.

## Callback Payload Types

All callback payloads validate against `schemas/wordpress-callback.schema.json`.

### Progress Callback

Progress callbacks are optional and are sent by HTTP Request nodes after major telemetry events when `callback_url` starts with `https://`. Code nodes build the payload only; they do not make internal HTTP requests. A progress callback failure must not fail the workflow. Progress callbacks include Living Storyboard state in `build_state`, `changed_fields`, `details.build_state`, and `details.changed_fields`; this state is partial and accumulative by stage, and the workflow must not fabricate story data that is not available yet.

```json
{
  "session_id": "gw_20260507_001",
  "callback_type": "progress",
  "status": "running",
  "stage": "storyboard",
  "progress": 45,
  "message": "Executable storyboard plan created.",
  "build_state": {
    "synopsis": [],
    "structure": {},
    "generation_details": {
      "stage": "storyboard",
      "progress": 45
    }
  },
  "changed_fields": [
    "synopsis",
    "structure",
    "generation_details"
  ],
  "event": {
    "event_id": "evt_001",
    "session_id": "gw_20260507_001",
    "stage": "storyboard",
    "status": "complete",
    "progress": 45,
    "message": "Executable storyboard plan created.",
    "timestamp": "2026-05-07T12:00:00Z",
    "severity": "info",
    "details": {}
  },
  "details": {
    "build_state": {
      "synopsis": [],
      "structure": {},
      "generation_details": {
        "stage": "storyboard",
        "progress": 45
      }
    },
    "changed_fields": [
      "synopsis",
      "structure",
      "generation_details"
    ],
    "event": {
      "event_id": "evt_001",
      "session_id": "gw_20260507_001",
      "stage": "storyboard",
      "status": "complete",
      "progress": 45,
      "message": "Executable storyboard plan created.",
      "timestamp": "2026-05-07T12:00:00Z",
      "severity": "info",
      "details": {}
    }
  }
}
```

### Failure Callback

Keep this exact terminal failure shape so WordPress can associate the failure with the originating session:

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

### Complete Callback

Keep this exact terminal completion shape so WordPress can save the generated story from `result`:

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
    "cover_brief": {
      "prompt": "...",
      "negative_prompt": "...",
      "palette": ["moss green", "lantern gold"],
      "aspect_ratio": "2:3"
    },
    "cover_image_url": null
  }
}
```

## n8n Callback Behavior

- If `callback_url` is absent, skip HTTP callbacks and return the final package in the webhook response.
- If `callback_url` does not start with `https://`, skip callbacks and continue the workflow.
- If `callback_url` starts with `https://`, send progress callbacks through HTTP Request nodes after major telemetry events and terminal complete/failure callbacks at the end.
- Progress callback failures are ignored by the progress HTTP Request nodes and should not corrupt the final story package.
- Terminal callback HTTP Request nodes ignore non-2xx response codes.
- The WordPress side should verify `session_id` and `X-Ghostwriter-Secret` before saving a result or showing progress.
