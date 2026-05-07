# Ghostwriter n8n

## v2.0 Status

Ghostwriter n8n is now a **v2.0 transfer-ready workflow specification package** for recreating a Ghostwriter Story Generator workflow in n8n.

This repository contains documentation, prompts, JSON schemas, examples, test cases, validation guidance, and a transfer checklist. It is not a live n8n export yet, and it does not claim that a WordPress callback endpoint already exists.

## Repository Purpose

Ghostwriter n8n specifies an AI narrative orchestration workflow that transforms a compact user idea into a structured final story package through staged interpretation, planning, drafting, editing, polishing, cover brief creation, telemetry, and optional callback-ready packaging.

The goal is to provide everything needed to recreate or import the workflow into n8n later without inventing the design during transfer.

## Required v2.0 Package Structure

```text
docs/
  workflow-overview.md
  node-by-node-build.md
  build-roadmap.md
  wordpress-integration-contract.md
  telemetry-events.md
  testing-plan.md
  transfer-checklist.md
  importing-into-n8n.md

prompts/
  01-creative-interpretation.md
  02-story-bible.md
  03-story-architecture.md
  04-storyboard-builder.md
  05-section-drafter.md
  06-continuity-editor.md
  07-final-polish.md
  08-cover-brief.md

schemas/
  creative-interpretation.schema.json
  story-bible.schema.json
  story-architecture.schema.json
  storyboard.schema.json
  section-draft.schema.json
  continuity-report.schema.json
  final-story-package.schema.json
  telemetry-event.schema.json
  wordpress-callback.schema.json

examples/
  input-payload.json
  final-story-package.example.json
  telemetry-events.example.json
  test-prompts.md

workflows/
  ghostwriter-story-generator-v2.import.json
```

## Core Workflow Design

The transfer target is a single n8n workflow:

```text
Webhook or Manual Trigger
→ Normalize Input
→ Validate Input
→ Creative Interpretation
→ Length Profile Selection
→ Narrative Framework Selection
→ Act Structure Selection
→ Story Bible
→ Story Architecture
→ Storyboard
→ Split Storyboard Sections
→ Loop Over Sections
→ Draft Each Section
→ Merge Drafted Sections
→ Continuity / Editorial Check
→ Final Polish
→ Cover Brief Generation
→ Final Story Package
→ Telemetry Events
→ Optional Callback Payload
```

The workflow is intentionally not split into separate workflows by length. Length profile, framework, act structure, scene count, and drafting section count are selected dynamically.

## Design Principles

The workflow should:

- interpret ideas rather than merely expand them
- choose appropriate narrative structures automatically
- dynamically determine suitable story length
- maintain pacing and emotional progression
- preserve thematic consistency
- produce stories that feel intentionally structured
- validate strict JSON contracts between every AI stage
- fail transparently when inputs or model outputs are invalid

The workflow should avoid:

- rigid fixed chapter counts
- hardcoding exactly three chapters or three sections
- bloated filler prose
- disconnected emotional beats
- grammar-only editing in place of narrative continuity review
- false claims that n8n import or WordPress integration has already happened

## Length Profiles

The creative interpretation stage chooses the smallest suitable story length.

| Profile | Target Words | Notes |
|---|---:|---|
| Micro fiction | 250-500 | Internal mode or special handling; public mode should generally raise very small requests to at least 500 words. |
| Flash fiction | 500-1,000 | Public mode allowed. |
| Short story | 1,500-3,500 | Public mode allowed. |
| Long short story | 4,000-7,500 | Initial public website cap. |
| Novelette | 7,500-17,500 | Internal mode only until scaling is approved. |
| Novella | 17,500-40,000 | Internal mode only until scaling is approved. |

Public website generation initially caps at `long_short_story` and 7,500 target words.

## Narrative Frameworks

Creative interpretation selects one primary narrative framework:

- **Emotional Character Arc:** isolation, disruption, resistance, connection, vulnerability, transformation.
- **Mystery Discovery Arc:** normal state, strange discovery, investigation, escalation, revelation, consequence.
- **Adventure Escalation Arc:** call to action, obstacle, progress, major setback, final confrontation, resolution.
- **Tragic Spiral:** desire, compromise, escalation, collapse, loss, aftermath.
- **Circular Fairytale Structure:** lack, journey into strange world, symbolic encounters, emotional revelation, transformed return.

## Act Structures

Creative interpretation also selects one macro act structure:

- **3-Act Structure:** setup, escalation, resolution.
- **4-Act Escalation Structure:** establish flaw/world, change, crisis or confrontation, resolution and aftermath.
- **Hero Transformation Structure:** incomplete self, resistance and journey, transformation event, return changed.
- **Mystery Revelation Structure:** question, clues, false theories, revelation, consequence.

## Storyboard System

The storyboard is the executable narrative plan before drafting. Each section defines:

- what happens
- why it happens
- act mapping
- narrative purpose
- emotional progression
- motifs introduced or resolved
- target word budget
- continuity obligations
- drafting constraints

n8n splits the storyboard section array into loop items, drafts each section, then merges results in order. This supports flash fiction, short stories, long short stories, novelettes, and novellas with one workflow.

## Continuity and Editorial Pass

The continuity editor compares the merged prose against:

- original prompt
- creative interpretation
- story bible
- selected act structure
- selected narrative framework
- story architecture
- storyboard
- motifs
- emotional arc
- section continuity obligations

The editor acts as a narrative editor, not a grammar checker. It identifies continuity problems, pacing issues, unresolved motifs, prompt drift, weak structural alignment, and ending satisfaction concerns.

## Cover Image Integration Stub

Cover image generation is not implemented in v2.0. The workflow specification includes cover brief generation only.

The final package includes:

```json
{
  "cover_brief": {
    "prompt": "...",
    "negative_prompt": "...",
    "palette": [],
    "visual_motifs": [],
    "composition": "...",
    "lighting": "...",
    "typography_notes": "...",
    "aspect_ratio": "2:3"
  },
  "cover_image_url": null
}
```

## WordPress Callback-Ready Contract

The final workflow design is callback-ready for a future WordPress plugin endpoint. The contract supports progress, failure, and complete payloads, but this repository does not claim that endpoint already exists.

See `docs/wordpress-integration-contract.md` and `schemas/wordpress-callback.schema.json` before implementing WordPress delivery.

## Prompt Pack

All prompts in `prompts/` are written for strict JSON-only output and are suitable for Gemini API-style calls. Each AI stage has a corresponding schema and should be followed by JSON parsing and validation in n8n.

## JSON Schemas

Schemas in `schemas/` define the stable contracts between nodes. At transfer time, n8n should validate each AI output before downstream nodes consume it. Invalid JSON should be repaired once, then routed to a structured failure path if repair fails.

## Examples and Tests

- `examples/input-payload.json` provides a webhook/manual test payload.
- `examples/final-story-package.example.json` shows the expected final package shape.
- `examples/telemetry-events.example.json` shows progress event examples.
- `examples/test-prompts.md` covers fiction, non-fiction, public cap behavior, internal long-form behavior, and guardrails.

## Build Roadmap Summary

- **v1.0:** Local logic prototype specification.
- **v1.1:** JSON contract stabilisation.
- **v1.2:** Dynamic drafting loop design.
- **v1.3:** Editorial continuity pass.
- **v1.4:** Final story package.
- **v1.5:** Error handling and guardrails.
- **v1.6:** Webhook input mode.
- **v1.7:** Telemetry events.
- **v1.8:** WordPress callback-ready design.
- **v1.9:** Cover image integration stub.
- **v2.0:** Ready-to-transfer n8n build package.

Detailed roadmap: `docs/build-roadmap.md`.


## Importable n8n Workflow

This repository now includes a single importable n8n workflow JSON file:

```text
workflows/ghostwriter-story-generator-v2.import.json
```

Import guidance is available in `docs/importing-into-n8n.md`. The workflow uses Manual Trigger and Webhook Trigger paths that feed into the same normalized flow, Gemini HTTP Request placeholder nodes with environment variable expressions such as `{{$env.GEMINI_API_KEY}}`, dynamic storyboard looping, JSON parsing/error handling, callback-ready HTTP Request nodes, and a cover brief stub with `cover_image_url: null`.

After import, configure `GEMINI_API_KEY`, `GEMINI_MODEL`, and optionally `GHOSTWRITER_CALLBACK_TOKEN` in n8n. Do not hardcode real API keys in the workflow JSON.

## Transfer Path

1. Read `docs/workflow-overview.md`.
2. Import `workflows/ghostwriter-story-generator-v2.import.json` into n8n or recreate the workflow from `docs/node-by-node-build.md`.
3. Follow `docs/importing-into-n8n.md` to configure environment variables and review placeholder Gemini HTTP Request nodes.
4. Verify prompts from `prompts/` and parsing/validation behavior against `schemas/`.
5. Test with `examples/input-payload.json` and `examples/test-prompts.md`.
6. Complete `docs/transfer-checklist.md`.
7. Only after n8n testing, export a real n8n workflow artifact if needed.

## Definition of Done for This Repository

- README reflects v2.0 completion.
- Required folders and files exist.
- Every schema is valid JSON Schema syntax.
- Every AI prompt asks for strict JSON-only output.
- Node-by-node instructions are detailed enough to recreate the workflow in n8n.
- Test prompts cover fiction and non-fiction.
- Transfer checklist is practical and step-by-step.
- No false claims are made that the workflow is already imported into n8n.
- No false claims are made that live WordPress integration already exists.
