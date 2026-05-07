# Telemetry Events

## Purpose

Telemetry events describe workflow progress for logs and future frontend animation. They are generated inside the n8n workflow and may be returned in the final package or sent to a future callback endpoint.

## Event Shape

All events must validate against `schemas/telemetry-event.schema.json`.

Required fields:

- `event_id`: unique event identifier.
- `session_id`: request/session identifier.
- `stage`: canonical workflow stage.
- `status`: `queued`, `running`, `complete`, `warning`, or `failed`.
- `progress`: integer from 0 to 100.
- `message`: human-readable progress text.
- `timestamp`: ISO 8601 date-time.

Optional fields:

- `severity`: `info`, `warning`, or `error`.
- `details`: object containing machine-readable metadata.

## Canonical Stages and Progress

| Stage | Suggested Progress | Message |
|---|---:|---|
| `accepted` | 2 | Request accepted and normalized. |
| `validate_input` | 5 | Validating prompt, mode, and length limits. |
| `creative_interpretation` | 12 | Interpreting premise and selecting creative strategy. |
| `story_bible` | 22 | Building characters, world, voice, themes, and motifs. |
| `story_architecture` | 32 | Mapping acts, beats, pacing, and word budget. |
| `storyboard` | 45 | Designing executable scene and section plan. |
| `drafting` | 50-75 | Drafting storyboard sections. |
| `merge_drafts` | 78 | Reassembling drafted sections in order. |
| `continuity_editor` | 84 | Checking continuity, emotional arc, motifs, and structure. |
| `final_polish` | 91 | Polishing final prose and metadata. |
| `cover_brief` | 95 | Creating cover image integration brief. |
| `package` | 98 | Packaging final story payload. |
| `complete` | 100 | Story generation complete. |
| `failure` | current | Workflow failed at a named stage. |

## Drafting Progress Formula

When looping over storyboard sections, calculate drafting progress dynamically:

```text
progress = 50 + floor((section_index / total_sections) * 25)
```

Clamp the value between 50 and 75.

## Failure Events

A failure event should include:

- failed `stage`
- `status: "failed"`
- `severity: "error"`
- a clear user-safe `message`
- `details.error_code`
- `details.retryable`
- `details.raw_node_name` for n8n diagnostics when safe

## Callback Use

Telemetry can be sent to WordPress later through optional progress callbacks. This repository only defines the payload contract; it does not assert that the WordPress callback endpoint exists.
