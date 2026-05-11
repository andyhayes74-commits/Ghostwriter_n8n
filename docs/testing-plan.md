# Testing Plan

## Goals

Validate that the v2.3 specification can be recreated in n8n with predictable JSON contracts, dynamic drafting behavior, useful telemetry, and plugin-synced callback output.

## Static Repository Checks

1. Confirm all required files exist.
2. Validate every file in `schemas/` as JSON.
3. Validate sample JSON in `examples/`.
4. Confirm every prompt requires strict JSON-only output.
5. Confirm README states this is a specification package, not a live n8n export.

## n8n Transfer Checks

1. Create credentials for Gemini API and optional HTTP callback.
2. Create the node sequence from `docs/node-by-node-build.md`.
3. Paste prompts from `prompts/` into the corresponding AI nodes.
4. Paste schemas or validation snippets into Code nodes.
5. Run manual mode with `examples/input-payload.json`.
6. Confirm telemetry events progress from accepted to complete.
7. Confirm final package validates against `schemas/final-story-package.schema.json`.

## Functional Test Matrix

| Case | Prompt Type | Expected Length | Key Validation |
|---|---|---|---|
| Fiction micro/flash | Tiny whimsical premise | flash fiction in public mode | Raises too-small public target to at least 500 words. |
| Fiction short | Character-driven premise | short story | Emotional arc and motifs persist. |
| Fiction long short | Rich adventure premise | long short story | Dynamic 6-10 section storyboard. |
| Public cap | User asks for novella in public mode | long short story | Emits warning and caps at 7,500 words. |
| Internal long form | Internal novelette request | novelette | Allows larger section count without separate workflow. |
| Mystery | Detective-style premise | short/long short | Uses Mystery Discovery or Mystery Revelation structures. |
| Tragedy | Downfall premise | short story | Uses Tragic Spiral and avoids upbeat false ending. |
| Non-fiction parable | Reflective essay-like prompt | flash/short | Produces narrative non-fiction or allegorical structure. |
| Invalid input | Empty prompt | failure | Stops before AI calls and emits validation failure. |

## JSON Validation in n8n

Recommended validation options:

- Use a Code node with a bundled JSON Schema validator if available in the n8n environment.
- At minimum, assert required fields and enum values before downstream nodes.
- Store raw model output separately from parsed JSON for diagnostics.
- On parse failure, call the same model once with a JSON-repair prompt and the target schema.
- If repair fails, emit a failure event and stop.

## Acceptance Criteria

- No drafted section is lost during split/loop/merge.
- Final prose is derived from storyboard order, not from a fixed chapter template.
- Continuity report explicitly references prompt, bible, act structure, storyboard, motifs, emotional arc, and framework.
- Final package includes `cover_image_url: null` until image generation is implemented.
- Callback payloads are optional and schema-defined.
