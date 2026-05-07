# WordPress Integration Contract

## Status

This is a callback-ready contract for a future Ghostwriter Automation WordPress plugin integration. It does not claim that a live WordPress endpoint currently exists.

## Input Payload From WordPress or Manual Testing

```json
{
  "session_id": "gw_20260507_001",
  "story_prompt": "A frog named Jim who cannot find love until he learns to listen.",
  "author_name": "Andy Hayes",
  "mode": "public",
  "requested_length_profile": "short_story",
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
- `callback_url`: optional future callback destination.
- `metadata`: opaque object passed through final payload.
- `constraints`: user or site constraints.

## Public Mode Limits

Public mode caps at `long_short_story` and 7,500 target words. If a user requests `novelette` or `novella`, the workflow should emit a warning and normalize to `long_short_story` unless internal mode is explicitly enabled.

## Callback Payload Types

All callback payloads validate against `schemas/wordpress-callback.schema.json`.

### Progress Callback

```json
{
  "session_id": "gw_20260507_001",
  "callback_type": "progress",
  "status": "running",
  "event": {
    "event_id": "evt_001",
    "session_id": "gw_20260507_001",
    "stage": "storyboard",
    "status": "running",
    "progress": 45,
    "message": "Designing scene beats and act progression.",
    "timestamp": "2026-05-07T12:00:00Z",
    "severity": "info"
  }
}
```

### Failure Callback

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
- If `callback_url` is present, send progress and terminal callbacks with HTTP Request nodes.
- Callback HTTP failures should be logged as warnings and should not corrupt the final story package.
- The WordPress side should verify `session_id` and, in production, authenticate requests with a shared secret or signed header.
