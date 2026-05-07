# Ghostwriter n8n

## Overview

Ghostwriter n8n is a structured AI narrative orchestration workflow designed for use with the Ghostwriter Automation WordPress plugin.

The system transforms a tiny user prompt into a fully structured story artifact through staged creative interpretation, narrative planning, storyboard generation, drafting, editorial continuity checking, and final packaging.

This is not a simple prompt wrapper.

The workflow is designed as a procedural narrative production pipeline.

---

# Core System Philosophy

The workflow should:

- interpret ideas rather than merely expand them
- choose appropriate narrative structures automatically
- dynamically determine suitable story length
- maintain pacing and emotional progression
- preserve thematic consistency
- produce stories that feel intentionally structured

The workflow should avoid:

- rigid fixed chapter counts
- bloated filler prose
- aimless scene generation
- disconnected emotional beats
- purely reactive text generation

---

# High-Level Workflow

```text
User Prompt
↓
Creative Interpretation
↓
Narrative Framework Selection
↓
Act Structure Selection
↓
Story Architecture
↓
Storyboard Generation
↓
Dynamic Section Drafting
↓
Continuity & Editorial Pass
↓
Final Story Packaging
↓
Cover Brief Generation
↓
WordPress Callback
```

---

# System Components

## WordPress Plugin

Responsible for:

- frontend display
- workflow animation window
- story collections
- modal reader
- story library
- visitor interaction
- session handling

## n8n Workflow

Responsible for:

- orchestration
- AI routing
- generation logic
- continuity management
- telemetry generation
- final packaging

## AI Models

Planned usage:

| Role | Suggested Model |
|---|---|
| Creative interpretation | Gemini |
| Story bible | Gemini |
| Story architecture | Gemini |
| Drafting | Gemini or cheaper drafting model |
| Continuity editor | Gemini Pro |
| Cover prompt generation | Gemini |

---

# Narrative System Design

## Creative Interpretation

The workflow should determine:

- genre
- tone
- themes
- emotional direction
- length profile
- narrative framework
- act structure

Example output:

```json
{
  "interpreted_genre": "Whimsical fantasy",
  "tone": "bittersweet, warm, gently comic",
  "themes": ["loneliness", "belonging"],
  "recommended_length_profile": "short_story",
  "target_word_count": 2200,
  "selected_story_structure": "circular_fairytale",
  "selected_act_structure": "4_act_escalation"
}
```

---

# Length Profiles

The workflow should automatically choose the smallest suitable story structure.

| Profile | Target Words |
|---|---:|
| Micro fiction | 250–500 |
| Flash fiction | 500–1,000 |
| Short story | 1,500–3,500 |
| Long short story | 4,000–7,500 |
| Novelette | 7,500–17,500 |
| Novella | 17,500–40,000 |

Public website generation should initially cap at:

```text
Long short story
```

---

# Narrative Framework Library

The workflow should select a suitable narrative framework.

## Emotional Character Arc

```text
Isolation
↓
Disruption
↓
Resistance
↓
Connection
↓
Vulnerability
↓
Transformation
```

## Mystery Discovery Arc

```text
Normal state
↓
Strange discovery
↓
Investigation
↓
Escalation
↓
Revelation
↓
Consequence
```

## Adventure Escalation Arc

```text
Call to action
↓
Obstacle
↓
Progress
↓
Major setback
↓
Final confrontation
↓
Resolution
```

## Tragic Spiral

```text
Desire
↓
Compromise
↓
Escalation
↓
Collapse
↓
Loss
↓
Aftermath
```

## Circular Fairytale Structure

```text
Character lacks something
↓
Journey into strange world
↓
Symbolic encounters
↓
Emotional revelation
↓
Return transformed
```

---

# Act Structures

The workflow should also select a macro story progression system.

## 3-Act Structure

```text
Act 1: Setup
Act 2: Escalation
Act 3: Resolution
```

## 4-Act Escalation Structure

```text
Act 1: Establish flaw/world
Act 2: Something changes
Act 3: Crisis or confrontation
Act 4: Resolution and aftermath
```

## Hero Transformation Structure

```text
Act 1: Character incomplete
Act 2: Resistance and journey
Act 3: Transformation event
Act 4: Return changed
```

---

# Storyboard System

The storyboard acts as the executable narrative plan.

Each scene should define:

- what happens
- why it happens
- emotional progression
- motifs introduced
- narrative purpose

Example:

```json
{
  "scene": 1,
  "summary": "Jim watches other frogs rehearsing songs.",
  "purpose": "Show loneliness and social pressure.",
  "emotional_shift": "comfort → shame",
  "motifs": ["music", "distance", "lantern light"]
}
```

---

# Drafting System

The workflow should dynamically generate sections based on the storyboard.

No fixed chapter count should exist.

The same workflow should support:

- 1-scene flash fiction
- 3-section short stories
- 7-section long stories

using a single drafting loop.

---

# Continuity & Editorial Pass

Gemini Pro should receive:

- original prompt
- creative interpretation
- story bible
- act structure
- storyboard
- all drafted sections

The editor should validate:

- character consistency
- emotional progression
- thematic cohesion
- pacing
- unresolved motifs
- structural integrity
- ending satisfaction

The editor should behave like:

```text
Narrative editor
```

not:

```text
Grammar checker
```

---

# WordPress Integration Goal

Final workflow output should eventually be sent back to WordPress.

Example final payload:

```json
{
  "session_id": "gw_123456",
  "status": "complete",
  "result": {
    "title": "The Last Song of Jim",
    "author_name": "Andy Hayes",
    "genre": "Whimsical Fantasy",
    "synopsis": "A lonely frog discovers that love is not earned by singing the loudest.",
    "story_body": "...",
    "cover_prompt": "...",
    "cover_image_url": null
  }
}
```

---

# Build Roadmap

## v1.0 — Local Logic Prototype

Build core logic only.

Includes:

- manual trigger
- creative interpretation
- story bible
- narrative structure selection
- storyboard generation
- drafting loop
- continuity pass
- final output

No WordPress.
No webhooks.
No image generation.

---

## v1.1 — JSON Contract Stabilisation

Define strict schemas for:

- creative interpretation
- story bible
- architecture
- storyboard
- continuity report
- final package

Goal:

Prevent broken downstream nodes.

---

## v1.2 — Dynamic Drafting Loop

Implement:

```text
Storyboard
↓
Split Sections
↓
Loop Over Items
↓
Draft Each Section
↓
Merge Drafts
```

Goal:

Support variable story sizes using one workflow.

---

## v1.3 — Editorial Continuity Pass

Implement Gemini Pro editorial validation.

Checks:

- continuity
- pacing
- emotional arc
- structural integrity
- unresolved motifs

---

## v1.4 — Final Story Packaging

Create stable final package object.

Includes:

- metadata
- story body
- structure
- cover brief
- automation notes

---

## v1.5 — Error Handling & Guardrails

Add:

- prompt validation
- word-count caps
- fallback behaviour
- stage failure reporting
- JSON validation

Public limits:

```text
Minimum: 500 words
Maximum: 7,500 words
```

---

## v1.6 — Webhook Input Mode

Replace manual trigger with webhook trigger.

Input:

```json
{
  "session_id": "test_001",
  "story_prompt": "A frog named Jim who can't find love"
}
```

---

## v1.7 — Telemetry Events

Generate workflow progress events.

Example:

```json
{
  "stage": "storyboard",
  "progress": 45,
  "message": "Designing scene beats and act progression."
}
```

These will later power the frontend animation window.

---

## v1.8 — WordPress Callback Ready

Prepare:

- progress callbacks
- failure callbacks
- final story callbacks

No hard dependency on WordPress yet.

---

## v1.9 — Cover Image Integration Stub

Generate:

- cover prompts
- motifs
- palettes
- placeholder image URL field

Image generation itself can be added later.

---

## v2.0 — Ready-to-Transfer n8n Build

Deliver:

- node-by-node workflow specification
- prompt pack
- JSON schemas
- telemetry definitions
- test prompts
- transfer checklist

At v2.0 the system should be:

- logically complete
- schema-defined
- prompt-defined
- ready to recreate/import into n8n
- ready to connect to WordPress later

---

# Recommended Development Philosophy

Build:

```text
Structure first
Automation second
Presentation third
Scale last
```

The system should prioritise:

- narrative quality
- pacing
- emotional coherence
- intentional structure

before adding:

- image generation
- realtime orchestration
- public scaling
- moderation systems

---

# Repository Purpose

This repository exists to develop:

```text
An AI narrative orchestration workflow
```

not merely:

```text
an AI story prompt generator
```
