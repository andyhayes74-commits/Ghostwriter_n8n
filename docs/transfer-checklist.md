# Transfer Checklist

Use this checklist when recreating the Ghostwriter v2.0 specification in n8n.

## 1. Repository Readiness

- [ ] Read `README.md` and confirm v2.0 scope.
- [ ] Review `docs/workflow-overview.md` for the end-to-end flow.
- [ ] Review `docs/build-roadmap.md` to understand the staged design.
- [ ] Confirm schemas in `schemas/` are valid JSON Schema files.
- [ ] Confirm prompts in `prompts/` request strict JSON only.
- [ ] Confirm examples in `examples/` parse as JSON where applicable.

## 2. n8n Project Setup

- [ ] Create a new n8n workflow named `Ghostwriter Story Generator v2.0`.
- [ ] Add Gemini API credentials.
- [ ] Add optional HTTP credentials or headers for future WordPress callbacks.
- [ ] Add environment variables for model names, public word cap, and callback signing secret if used.
- [ ] Keep manual testing enabled before exposing webhook mode.

## 3. Node Construction

- [ ] Build nodes exactly from `docs/node-by-node-build.md`.
- [ ] Use a single workflow for all length profiles.
- [ ] Add validation after every AI JSON response.
- [ ] Add one JSON repair path per AI response.
- [ ] Add dynamic split/loop/merge for storyboard sections.
- [ ] Add continuity revision path with a maximum of one automatic revision pass.
- [ ] Add cover brief generation with `cover_image_url` set to `null`.

## 4. Prompt and Schema Transfer

- [ ] Paste `prompts/01-creative-interpretation.md` into the creative interpretation AI node.
- [ ] Paste `prompts/02-story-bible.md` into the story bible AI node.
- [ ] Paste `prompts/03-story-architecture.md` into the architecture AI node.
- [ ] Paste `prompts/04-storyboard-builder.md` into the storyboard AI node.
- [ ] Paste `prompts/05-section-drafter.md` into the drafting loop AI node.
- [ ] Paste `prompts/06-continuity-editor.md` into the continuity AI node.
- [ ] Paste `prompts/07-final-polish.md` into the final polish AI node.
- [ ] Paste `prompts/08-cover-brief.md` into the cover brief AI node.
- [ ] Configure each validation node to check the matching schema.

## 5. Test Runs

- [ ] Run `examples/input-payload.json` in manual mode.
- [ ] Run all prompts listed in `examples/test-prompts.md`.
- [ ] Verify public mode caps at `long_short_story`.
- [ ] Verify internal mode can select `novelette` or `novella` without a separate workflow.
- [ ] Verify telemetry events include accepted, drafting, final polish, and complete.
- [ ] Verify callback nodes are skipped when `callback_url` is missing.
- [ ] Verify callback payloads are generated when `callback_url` is present.

## 6. Pre-Launch Safety

- [ ] Add rate limits outside this specification before public launch.
- [ ] Add moderation and abuse handling before public launch.
- [ ] Add WordPress endpoint authentication before enabling callbacks.
- [ ] Add storage policies for user prompts and generated stories.
- [ ] Add cost controls for long-form generation.

## 7. Handoff Package

- [ ] Export the finished n8n workflow only after it has been recreated and tested in n8n.
- [ ] Store that future export separately from this specification package.
- [ ] Document any deviations from this v2.0 spec.
- [ ] Do not mark WordPress integration as live until the endpoint has been implemented and verified.
