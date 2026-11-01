# A claim inside a claim: the assistant's immunization card could never save (stream `nested-claim-one-write`, 2026-11-01)

The backlog item asked what a replay does to a claim nested inside another, and guessed the answer might be
"harmless". **It was neither a replay problem nor harmless: the nesting made the assistant's immunization write
impossible.** The shared write now lives in `src/lib/immunizations/record.ts`, the #1162 shape.

## 1. The question, answered by exercising it

`assistantRecordImmunization` claims through `runWrite()` with the card's own `requestId`, then called
`recordImmunizations`, which claims again with `writeRequestIdFrom(formData)`. The assistant built that `FormData`
by hand (`residentIds`, `immunizationTypeIds`, `dateAdministered`, `notes`) and **never set `__writeRequest`**, so
the inner id was `null` and `runWriteAction()` returned `messages.reloadToSave` before reaching the database.
So on every press: outer claim taken, inner refused with "reload to save", nothing written, refusal stored as the
outer's result, and a replay returned that same refusal.

`src/lib/nested-claim.test.mjs` runs the real `runWriteAction()` twice, composed, over an in-memory model that
follows `claim_write_request()` / `finish_write_request()` (0292) branch for branch:

- **As built** (no id on the form): refused, 0 writes, only the outer row exists.
- **Inner handed the outer's id**: refused with `22023` (same id, different action name), 0 writes. So "the inner
  call takes the outer's id" cannot work with `runWriteAction()`: the second claim finds the first, still open.
- **Inner given its own fresh id**: replay short-circuits at the outer claim, the inner never runs again, 1 write.
  This is the only shape in which the nesting is harmless, and nothing in the code produced it.
- **One claim** (the new shape): 1 write, replay answers from the stored result.

Not exercised against a live database: the model is the SQL's logic, not the SQL. The SQL branches it mirrors are
short and quoted in the test's header; no migration was added or needed.

## 2. Decision

Move the write (the third outcome in the brief was ruled out above, the first is false). `writeImmunizations(supabase,
t, locale, formData)` is a plain server function; `recordImmunizations` keeps its one claim and calls it; the
assistant claims once in `runWrite()` and calls it. `ImmunizationRecordResult` is re-exported as a type so no importer
changed. The assistant's changed lines are the import and the call; its per-tool activity checks are untouched.

**Whether it ever worked:** the nesting was introduced by Pi failover (D)'s wrap of `recordImmunizations`
(tail A, 2026-11-01), so the window is from that merge until this one. Not in a release as far as `git log` shows;
not checked against a production release tag.

## 3. A third caller

Cheap check that would catch the next one: list every `"use server"` module's exported names and fail if another
`src/**/*.ts` that is not a client component imports one. Not built: it needs the "is this a client component" test
(a `"use client"` first line) to avoid the dozens of normal importers the planner's first measurement drowned in, and
that is more than a few lines. Measured today: still exactly one server-side importer before this change, none after.

## 4. Declared crossings

None. `src/lib/action-result.ts` and `src/lib/write-requests.ts` were read only; nothing added to `WRAPPED_WRITE_PATHS`.
