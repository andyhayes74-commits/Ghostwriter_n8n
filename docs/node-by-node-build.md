# Node-by-Node n8n Build Instructions

## Build Assumptions

- This is a single n8n workflow named `Ghostwriter Story Generator v2.0`.
- Gemini-compatible AI calls return strict JSON only.
- Each AI node is followed by JSON parse and schema validation.
- Manual trigger and webhook trigger should normalize into the same internal input shape.
- WordPress callbacks are optional and callback-ready only; no live endpoint is assumed.

## Data Naming Convention

Use these top-level keys as the workflow progresses:

- `input`
- `creative_interpretation`
- `story_bible`
- `story_architecture`
- `storyboard`
- `draft_sections`
- `merged_draft`
- `continuity_report`
- `final_story_package`
- `telemetry_events`
- `callback_payload`

## Node 01 — Manual Trigger

**Type:** Manual Trigger

**Purpose:** Local testing before webhook activation.

**Output:** Use `examples/input-payload.json` as the test item body.

## Node 02 — Webhook Trigger

**Type:** Webhook

**Method:** POST

**Path suggestion:** `/ghostwriter/v2/story`

**Purpose:** Future external input mode. Do not expose publicly until rate limits, auth, and moderation are configured.

**Expected body:** See `docs/wordpress-integration-contract.md`.

## Node 03 — Normalize Input

**Type:** Code

**Purpose:** Convert manual and webhook items into one internal shape.

**Logic:**

- Read payload from manual test item or webhook body.
- Default `author_name` to `Ghostwriter`.
- Default `mode` to `public`.
- Default missing arrays and objects to empty values.
- Preserve opaque `metadata`.
- Initialize `telemetry_events` array.

**Output key:** `input`.

## Node 04 — Emit Accepted Telemetry

**Type:** Code

**Purpose:** Append an `accepted` telemetry event with progress `2`.

**Validation:** Event must match `schemas/telemetry-event.schema.json`.

## Node 05 — Validate Input

**Type:** Code or IF + Code

**Purpose:** Stop invalid requests before AI calls.

**Rules:**

- `session_id` is required and must be non-empty.
- `story_prompt` is required and should be 10-2,000 characters.
- `mode` must be `public` or `internal`.
- If public mode requests `novelette` or `novella`, preserve the request as a warning but cap later.
- Reject obviously empty, placeholder, or unsupported payloads.

**Failure path:** Node 06.

**Success path:** Node 07.

## Node 06 — Validation Failure Response

**Type:** Respond to Webhook or Set

**Purpose:** Return or store a structured failure payload.

**Output:** A `failure` telemetry event and an error object compatible with `wordpress-callback.schema.json` failure shape.

## Node 07 — Build Creative Interpretation Prompt

**Type:** Set

**Purpose:** Compose the model input using `prompts/01-creative-interpretation.md` plus normalized input.

**Important:** Include public mode cap guidance: public mode cannot exceed `long_short_story` or 7,500 words.

## Node 08 — AI Creative Interpretation

**Type:** Gemini Chat / HTTP Request to Gemini API

**Prompt:** `prompts/01-creative-interpretation.md`

**Expected schema:** `schemas/creative-interpretation.schema.json`

**Output key:** raw model text.

## Node 09 — Parse and Validate Creative Interpretation

**Type:** Code

**Purpose:** Parse strict JSON and validate required fields and enums.

**Failure behavior:** route once to Node 10 for JSON repair; if repair fails, route to Node 38.

## Node 10 — JSON Repair for Creative Interpretation

**Type:** Gemini Chat / HTTP Request

**Purpose:** Ask the model to convert the raw response into valid JSON matching the schema without changing content.

**Guardrail:** One repair attempt only.

## Node 11 — Emit Interpretation Telemetry

**Type:** Code

**Purpose:** Add `creative_interpretation` event at progress `12`.

## Node 12 — Enforce Length Profile and Public Cap

**Type:** Code

**Purpose:** Normalize model-selected length profile.

**Rules:**

- Keep the selected profile when allowed.
- In public mode, cap `novelette` and `novella` to `long_short_story`.
- Public mode target words must be between 500 and 7,500.
- Internal mode may allow all defined profiles.
- Add a warning telemetry event if capping occurs.

## Node 13 — Build Story Bible Prompt

**Type:** Set

**Prompt:** `prompts/02-story-bible.md`

**Inputs:** original prompt, normalized input, creative interpretation, selected length profile, framework, and act structure.

## Node 14 — AI Story Bible

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/story-bible.schema.json`

## Node 15 — Parse and Validate Story Bible

**Type:** Code

**Failure behavior:** one JSON repair attempt, then Node 38.

## Node 16 — Emit Story Bible Telemetry

**Type:** Code

**Progress:** `22`.

## Node 17 — Build Story Architecture Prompt

**Type:** Set

**Prompt:** `prompts/03-story-architecture.md`

**Inputs:** original prompt, creative interpretation, story bible.

## Node 18 — AI Story Architecture

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/story-architecture.schema.json`

**Requirements:** Architecture must include selected narrative framework and selected act structure names, beat plan, pacing plan, and word budget.

## Node 19 — Parse and Validate Story Architecture

**Type:** Code

**Failure behavior:** one JSON repair attempt, then Node 38.

## Node 20 — Emit Architecture Telemetry

**Type:** Code

**Progress:** `32`.

## Node 21 — Build Storyboard Prompt

**Type:** Set

**Prompt:** `prompts/04-storyboard-builder.md`

**Inputs:** original prompt, creative interpretation, story bible, architecture.

## Node 22 — AI Storyboard

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/storyboard.schema.json`

**Requirement:** Storyboard must contain dynamic `sections` array and must not force exactly three chapters.

## Node 23 — Parse and Validate Storyboard

**Type:** Code

**Validation rules:**

- `sections.length >= 1`.
- Sum of section target words should approximately match target word count.
- Every section has `section_index`, `act_id`, `purpose`, `emotional_shift`, `motifs`, and `continuity_obligations`.

## Node 24 — Emit Storyboard Telemetry

**Type:** Code

**Progress:** `45`.

## Node 25 — Split Storyboard Sections

**Type:** Split Out / Item Lists / Code

**Purpose:** Convert `storyboard.sections` into n8n loop items.

**Each loop item includes:**

- original input
- creative interpretation
- story bible
- architecture
- complete storyboard summary
- current section object
- previous section summary if available
- total section count

## Node 26 — Loop Over Sections

**Type:** Loop Over Items / Split in Batches

**Purpose:** Process one storyboard section per iteration.

## Node 27 — Emit Drafting Telemetry Per Section

**Type:** Code

**Progress:** Use `50 + floor((section_index / total_sections) * 25)`.

## Node 28 — Build Section Draft Prompt

**Type:** Set

**Prompt:** `prompts/05-section-drafter.md`

**Inputs:** current storyboard item plus all planning context.

## Node 29 — AI Draft Section

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/section-draft.schema.json`

**Requirements:** Draft only the current section, preserve continuity obligations, and return JSON only.

## Node 30 — Parse and Validate Section Draft

**Type:** Code

**Validation rules:**

- `section_index` matches the current loop item.
- `draft_text` is non-empty.
- `actual_word_count` is plausible.
- `fulfilled_storyboard_items` references the current storyboard section.

**Failure behavior:** targeted redraft once for this section, then Node 38.

## Node 31 — Collect Draft Sections

**Type:** Merge / Code

**Purpose:** Accumulate all section drafts in an array.

## Node 32 — Merge Drafted Sections

**Type:** Code

**Purpose:** Sort draft sections by `section_index`, join `draft_text` with separators, and calculate total word count.

**Output key:** `merged_draft`.

## Node 33 — Build Continuity Editor Prompt

**Type:** Set

**Prompt:** `prompts/06-continuity-editor.md`

**Inputs:** original prompt, creative interpretation, story bible, act structure, storyboard, motifs, emotional arc, selected narrative framework, and merged prose.

## Node 34 — AI Continuity Editor

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/continuity-report.schema.json`

**Purpose:** Act as a narrative editor and identify structural or continuity revisions.

## Node 35 — Parse and Validate Continuity Report

**Type:** Code

**Decision:**

- If `approval_status` is `approved` or only low-severity suggestions exist, continue.
- If blocking issues exist and revision count is 0, route to targeted revision using section drafter or final polish context.
- If blocking issues persist after one revision, continue with warnings in final package.

## Node 36 — Build Final Polish Prompt

**Type:** Set

**Prompt:** `prompts/07-final-polish.md`

**Inputs:** merged prose, continuity report, and all planning artifacts.

## Node 37 — AI Final Polish

**Type:** Gemini Chat / HTTP Request

**Expected schema:** `schemas/final-story-package.schema.json`

**Purpose:** Return final package metadata, polished story body, warnings, and automation notes. Cover brief may be stubbed here or completed by Node 39.

## Node 38 — Stage Failure Handler

**Type:** Code + Respond to Webhook / optional HTTP Request

**Purpose:** Build a failed terminal payload and optional failure callback.

**Rules:**

- Include failed stage, error code, retryable flag, and safe message.
- Append failure telemetry.
- Do not return partial prose as a completed story.

## Node 39 — Build Cover Brief Prompt

**Type:** Set

**Prompt:** `prompts/08-cover-brief.md`

**Inputs:** final title, synopsis, genre, motifs, tone, and story body excerpt.

## Node 40 — AI Cover Brief

**Type:** Gemini Chat / HTTP Request

**Expected output:** `cover_brief` object compatible with `final-story-package.schema.json`.

**Important:** Do not call an image generation model. Set `cover_image_url` to `null`.

## Node 41 — Attach Cover Brief and Finalize Package

**Type:** Code

**Purpose:** Insert cover brief, set `cover_image_url: null`, attach telemetry summary, and validate final package.

## Node 42 — Emit Complete Telemetry

**Type:** Code

**Progress:** `100`.

## Node 43 — Callback URL Present?

**Type:** IF

**Condition:** `input.callback_url` exists and is a valid HTTPS URL.

**True path:** Node 44.

**False path:** Node 46.

## Node 44 — Build Complete Callback Payload

**Type:** Code

**Schema:** `schemas/wordpress-callback.schema.json`

**Purpose:** Create `callback_type: "complete"` payload.

## Node 45 — Optional HTTP Callback

**Type:** HTTP Request

**Method:** POST

**URL:** `input.callback_url`

**Failure behavior:** Log a warning telemetry event; do not change final story status to failed if story generation completed.

## Node 46 — Respond With Final Package

**Type:** Respond to Webhook / Set for manual mode

**Purpose:** Return the final v2.0 story package.

## JSON Parsing Guidance

For each AI node:

1. Trim whitespace and remove Markdown code fences only if present.
2. Parse JSON.
3. Validate required fields, enums, and arrays.
4. Preserve raw response for troubleshooting.
5. Attempt JSON repair once on parse or validation failure.
6. Stop with a structured failure after repeated invalid output.

## Section-by-Section Review Checks

After building each major section in n8n, compare against README requirements:

- Input and validation match webhook/manual goals.
- Creative interpretation chooses length profile, framework, and act structure.
- Length profiles include micro fiction through novella and public mode caps at long short story.
- Storyboard is executable and dynamic.
- Drafting loop handles variable section counts.
- Continuity editor validates against all planning artifacts.
- Cover brief exists but image generation does not.
- Final callback structure is ready without claiming a live WordPress endpoint.
