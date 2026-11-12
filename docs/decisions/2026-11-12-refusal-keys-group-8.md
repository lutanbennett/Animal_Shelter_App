# Refusal keys, group 8: the three merge screens (#3nuwy)

`merge_medication` (live in `0043`), `merge_procedure_type` (`0047`) and `merge_blood_test_type` (`0050`) now raise keys. Migration
`0363`; bodies are the live ones with only the raise lines changed (generated from the files, not retyped). `0124` only mentions
them in a comment; the measuring tool names 0043/0047/0050 as live. All three are `security invoker`, so row-level security
decides who may delete and `0262`'s security-definer rule does not apply; no permission check was edited. `-- consumer:` names the
three caller files, each opened and confirmed to call its function.

## Count: 10 raises, 10 keys
Prefix **`merge.`**, one for the group: the three screens share one vocabulary (same record / not found / not allowed to remove the
duplicate), as group 5 did for its pair. Each key names its kind (`merge.medication_same`, `…_not_found`, `…_not_allowed`,
`merge.medication_unit_mismatch` with `from`/`into` parameters, then the same three for `procedure_type` and `blood_test_type`),
because a Thai sentence cannot be built by dropping a noun into an English frame. SQLSTATE stays P0001. "Not allowed" is decided by
row-level security at the delete, not by a role name; the sentence is worded by access.

## Callers
All three now `if (error) return dbRefusal("<where>", error, t)` in place of `refuse(error.message)`. None carried a regex
rewording or a P0001 allow-list, so nothing was deleted. The callers' own pre-checks (mergeSelf, notFound, unit mismatch in
`medications/actions.ts`) are left; they run first and are already translated.

## Fallback proof
`src/lib/db-refusal.test.mjs`: 8 pass, 0 fail, including a key-shaped string the dictionary does not know, which gives the generic
"something went wrong + reference" and never the raw key.

## Proof (dev, 2026-11-12)
Harness in `do $$ … $$` (nothing kept), fixtures named `ZZ fixture merge A/B`: **seen 7 of 10**: medication same / not_found /
unit_mismatch (detail `{"from":"mg","into":"ml"}`), procedure_type same / not_found, blood_test_type same / not_found.
**Not provoked:** the three `*_not_allowed` (they need a login whose RLS refuses the delete; the harness runs as the database
owner). Not driven on screen in Thai.

## Meter
Before: 18 functions / 59 messages keyed, 30 person-read still English. After: **21 / 69, 20**.

## Thai
My own wording, unreviewed; for the planner to file onto `#y1dqu`.

## Next group
Remaining per `2026-11-08-db-refusal-keys-mechanism.md`'s table: the rest of the `user` class and the six
forwarded-and-masked functions. The planner names the next.
