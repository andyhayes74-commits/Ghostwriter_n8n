# Ghostwriter n8n v2.0 Workflow Overview

## Purpose

Ghostwriter n8n v2.0 is a transfer-ready specification package for recreating a single n8n workflow that turns a compact user idea into a structured story package. This repository does not claim that a live n8n workflow has already been imported or that a WordPress endpoint already exists.

## Single Workflow Principle

All story lengths use one workflow. Length, narrative framework, act structure, scene count, and drafting section count are selected dynamically during creative interpretation and story planning. The workflow must never hardcode exactly three chapters.

## End-to-End Flow

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

## Length Profiles

| Profile | Target Words | Public Website Availability | Drafting Guidance |
|---|---:|---|---|
| `micro_fiction` | 250-500 | Allowed for internal mode; public requests below 500 should be raised to flash fiction unless explicitly enabled. | Usually 1 compact scene. |
| `flash_fiction` | 500-1,000 | Allowed. | 1-2 scenes, one decisive turn. |
| `short_story` | 1,500-3,500 | Allowed. | 3-6 scenes, one central arc. |
| `long_short_story` | 4,000-7,500 | Public cap. | 6-10 scenes, richer act progression. |
| `novelette` | 7,500-17,500 | Internal mode only until public scaling is approved. | 10-20 scenes, multi-thread planning. |
| `novella` | 17,500-40,000 | Internal mode only until public scaling is approved. | 20+ scenes, chapter-like sectioning. |

Public website mode initially caps output at `long_short_story` with an effective maximum of 7,500 target words.

## Narrative Frameworks

The creative interpretation stage selects one primary framework and may identify one supporting framework.

- **Emotional Character Arc:** isolation, disruption, resistance, connection, vulnerability, transformation.
- **Mystery Discovery Arc:** normal state, strange discovery, investigation, escalation, revelation, consequence.
- **Adventure Escalation Arc:** call to action, obstacle, progress, major setback, final confrontation, resolution.
- **Tragic Spiral:** desire, compromise, escalation, collapse, loss, aftermath.
- **Circular Fairytale Structure:** lack, journey into strange world, symbolic encounters, emotional revelation, transformed return.

## Act Structures

- **3-Act Structure:** setup, escalation, resolution.
- **4-Act Escalation Structure:** establish flaw/world, change, crisis/confrontation, resolution/aftermath.
- **Hero Transformation Structure:** incomplete self, resistance/journey, transformation event, return changed.
- **Mystery Revelation Structure:** question, clues, false theories, revelation, consequence.

## Storyboard as Executable Plan

The storyboard is the last planning artifact before drafting. Each storyboard item must include section identifiers, act mapping, scene purpose, emotional shift, motifs, continuity obligations, target words, and drafting constraints. n8n splits this array into loop items; each drafted section is expected to fulfill exactly one storyboard item or a deliberate grouped range.

## AI Stage Responsibilities

| Stage | Output Schema | Primary Responsibility |
|---|---|---|
| Creative Interpretation | `creative-interpretation.schema.json` | Interpret prompt, select length profile, framework, act structure, constraints. |
| Story Bible | `story-bible.schema.json` | Define characters, world, voice, motifs, themes, continuity anchors. |
| Story Architecture | `story-architecture.schema.json` | Convert selected structures into acts, beats, pacing and word budget. |
| Storyboard | `storyboard.schema.json` | Create executable section plan for drafting. |
| Section Drafter | `section-draft.schema.json` | Draft one section from one storyboard item. |
| Continuity Editor | `continuity-report.schema.json` | Compare prose against prompt, bible, act structure, storyboard, motifs, emotional arc, and framework. |
| Final Polish | `final-story-package.schema.json` | Produce final readable story package and metadata. |
| Telemetry | `telemetry-event.schema.json` | Emit progress, warning, failure, and completion events. |
| Callback | `wordpress-callback.schema.json` | Shape optional future WordPress callback payloads. |

## Failure Handling Summary

- Invalid input stops before AI calls and emits a validation failure event.
- Invalid AI JSON is repaired once through a JSON repair instruction, then fails with stage details.
- Unsupported length requests are normalized according to mode and cap.
- Empty or unsafe drafting output triggers a targeted redraft for the affected section only.
- Continuity failures can trigger one revision pass; repeated failure returns a package with warnings rather than silently claiming perfection.
