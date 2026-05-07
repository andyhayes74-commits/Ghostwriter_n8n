# v1.0 to v2.0 Build Roadmap

## v1.0 — Local Logic Prototype

**Goal:** prove the narrative pipeline locally using manual input.

Includes manual trigger, normalized input object, creative interpretation, story bible, architecture, storyboard, dynamic section drafting loop, continuity report, and a final output object. No WordPress callbacks, webhook dependency, or image generation are required.

**Review check:** the design has a complete story-production path and avoids fixed chapter counts.

## v1.1 — JSON Contract Stabilisation

**Goal:** every stage produces strict JSON validated before downstream use.

Add schemas for creative interpretation, story bible, architecture, storyboard, section drafts, continuity report, final package, telemetry events, and callback payloads. n8n Code or IF nodes should validate required keys and route invalid results to repair or failure handling.

**Review check:** downstream nodes consume schema-defined keys only.

## v1.2 — Dynamic Drafting Loop

**Goal:** make one workflow support all length profiles.

Storyboard sections become loop items. Each item carries target words, act, purpose, emotional shift, motifs, and continuity obligations. The drafting node processes one item at a time and merge logic reassembles by `section_index`.

**Review check:** no branch creates separate workflows for micro, flash, short story, novelette, or novella.

## v1.3 — Editorial Continuity Pass

**Goal:** add a narrative editor pass rather than a grammar-only pass.

The editor compares final prose against the original prompt, creative interpretation, story bible, act structure, storyboard, motifs, emotional arc, selected narrative framework, and drafted sections. It returns severity-ranked issues and revision instructions.

**Review check:** the prompt asks for structural and emotional validation, not just copyediting.

## v1.4 — Final Story Packaging

**Goal:** create a stable final story object.

The package includes session metadata, title, author name, genre, synopsis, story body, length profile, word count, selected structures, cover brief, `cover_image_url`, warnings, telemetry summary, and automation notes.

**Review check:** package shape is stable enough for future WordPress consumption.

## v1.5 — Error Handling and Guardrails

**Goal:** make failure behavior explicit.

Add prompt validation, minimum and maximum word-count rules, public-mode cap to `long_short_story`, JSON parsing repair, stage failure reporting, redraft fallback, and safety/moderation notes.

**Review check:** the workflow can fail transparently without returning malformed success payloads.

## v1.6 — Webhook Input Mode

**Goal:** accept external requests while keeping manual testing easy.

Primary input is a webhook payload. Manual trigger uses the same normalized shape. Expected minimal payload: `session_id`, `story_prompt`; optional fields include `author_name`, `mode`, `requested_length_profile`, `callback_url`, `metadata`, and `constraints`.

**Review check:** webhook mode is specified, but no live endpoint is claimed.

## v1.7 — Telemetry Events

**Goal:** support frontend progress animation later.

Emit events for accepted, interpreting, planning, storyboarding, drafting, editing, polishing, cover_brief, packaging, callback_ready, complete, warning, and failure. Events include progress percentage, message, severity, timestamp, stage, and session ID.

**Review check:** telemetry is defined independently of a live frontend.

## v1.8 — WordPress Callback-Ready Design

**Goal:** prepare callback payloads without depending on WordPress availability.

Define progress, failure, and complete callback bodies. If callback URL is absent, the workflow still returns the final package directly. If callback is present, n8n HTTP Request nodes should post callback payloads and log failures.

**Review check:** docs clearly state that the WordPress plugin endpoint must be created/configured later.

## v1.9 — Cover Image Integration Stub

**Goal:** prepare future image generation.

Generate a cover brief with prompt, negative prompt, aspect ratio, palette, typography notes, visual motifs, and a placeholder `cover_image_url` set to `null` until image generation is implemented.

**Review check:** no claim that cover images are generated now.

## v2.0 — Ready-to-Transfer n8n Build Package

**Goal:** complete repo-based specification for recreating/importing in n8n later.

Deliver documentation, prompts, schemas, examples, validation guidance, node-by-node instructions, tests, telemetry definitions, WordPress callback contract, and transfer checklist.

**Review check:** the repository is specification-complete but does not misrepresent itself as a live n8n export.
