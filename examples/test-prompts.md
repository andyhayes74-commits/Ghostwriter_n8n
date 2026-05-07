# Test Prompts

Use these prompts to verify the transferred n8n workflow supports fiction, non-fiction, dynamic lengths, framework selection, public caps, and failure handling.

## Fiction Tests

1. **Flash fiction / whimsical:** A teacup dragon guards the last sugar cube in a closed seaside cafe.
2. **Short story / emotional arc:** A retired lighthouse keeper receives letters from ships that sank decades ago.
3. **Long short story / adventure:** Three children discover that the town's abandoned train station still sells tickets to places people forgot.
4. **Mystery discovery:** A museum cleaner notices that one painted figure changes position every morning.
5. **Tragic spiral:** A gifted clockmaker learns how to pause time, then begins stealing seconds from people who trust her.
6. **Circular fairytale:** A baker who cannot taste sweetness travels into a moonlit orchard to bargain with the bees.
7. **Public cap test:** In public mode, write a novella about a floating city, a vanished cartographer, and a civil war among cloud sailors.
8. **Internal long-form test:** In internal mode, write a novelette about a generation ship where the plants remember Earth better than the humans do.

## Non-Fiction and Hybrid Tests

1. **Narrative non-fiction:** Explain how a community garden can change a neighborhood, using a narrative structure and one recurring image.
2. **Memoir-like reflection:** Write a reflective piece about learning to cook after leaving home for the first time.
3. **Essayistic parable:** Turn the idea of digital burnout into a modern parable about a village that never lets its lanterns go out.
4. **Explanatory narrative:** Explain why sleep matters by following one fictional but realistic day in the life of an exhausted student.

## Guardrail Tests

1. **Empty prompt:** `""` should fail input validation before AI calls.
2. **Too-short prompt:** `"frog"` should request clarification or fail validation depending on site policy.
3. **Unsupported public length:** A public `novella` request should be capped at `long_short_story` and emit a warning.
4. **No callback URL:** Workflow should skip callback nodes and still return the final package.
5. **Callback URL present:** Workflow should build callback payloads but only call the URL if configured in the transferred n8n workflow.
