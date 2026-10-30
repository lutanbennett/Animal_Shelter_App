# Assistant v2 stream 1: `assistant_actions` gains `model` and `exchange`

2026-10-30. Migration `0289`, step one of `2026-10-30-assistant-v2-scoping.md`.

- **`model text`**: the id of the model that interpreted the request. **`exchange jsonb`**: the messages and tool calls of the turn.
- **Both nullable.** Every version 1 row (keyword parser, no model) stays valid with no backfill; null *is* the version 1 answer.
  A default would invent a model name for rows no model touched.
- **`exchange` is jsonb with no declared shape.** Its shape belongs to stream 3 (the model call), which is the first thing that has
  messages and tool calls. Fixing a shape here would be inventing one.
- **No enum change**: nothing needs one, and an add-value cannot share the runner's per-file transaction anyway.
- **No policy or grant change**: the 0070 policies are row-level, so new columns are covered.
- **`audit.ts` writes both**, from optional `model` / `exchange` on `AssistantActionLog`, defaulting to null. Without a writer the
  columns would be indistinguishable from columns that do not exist.

## Is there anything meaningful to put in `exchange` before stream 3?

No. Version 1 parses in the browser and the server only executes, so there is no message list or tool call to record. No caller
passes either field yet: `model` and `exchange` stay null until stream 3 supplies them. The one thing version 1 could honestly
record in `model` is a label like `keyword`, but that would make "no model" look like a model; null stays the answer.

Applied to dev only. Production gets `0289` in a release; the code is NOT harmless against the old schema: `audit.ts`
now sends both keys, so an insert against a database without the columns fails (logged, never thrown). Release must apply `0289`
before or with this code.
