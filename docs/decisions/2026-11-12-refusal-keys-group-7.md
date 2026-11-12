# Refusal keys, group 7: the placements pair (#3nuwy)

`undo_deceased_placement` and `record_deceased_archive` (both last defined in `0178`) now raise keys. Migration `0359`; bodies are
0178's with only the raise lines changed. Who may call each is untouched (`placement.death_withdraw`, `placement.death`); no
permission check was edited. `-- consumer:` names the two lib files, both opened and confirmed to call the functions.

## Count: 6 raises, 5 keys
`deceased.archive_not_allowed`, `deceased.not_deceased` (raised by BOTH functions, one key), `deceased.withdraw_not_allowed`,
`deceased.reason_required`, `deceased.no_earlier_placement`. The brief's seventh sentence, *"This resident is deceased — their
record is read-only."*, is not raised by either function's body: it comes from the closed-record triggers
(`enforce_deceased_lock`, `enforce_deceased_lock_attachment`), which have no caller. As in group 6 it is NOT converted and is
reached through `databaseFailure`'s rules. SQLSTATE stays the default (P0001) as before.
"Only an admin can withdraw a recorded death" is decided by `has_permission('placement.death_withdraw')` today, not by a role name; the key is worded by access, not by role.

## The five raw `error.message` forwards in `deceased.ts`
Line 156 (the `undo_deceased_placement` RPC) is the keyed one. Lines 74-76 (three table reads) and 112 (a `placement_history`
insert) raise no function key; they now go through `dbRefusal`, which hands a non-key to `databaseFailure`'s rules, so no raw
database text reaches the screen and no key is invented. `archive-deceased-resident.ts`: the residents read and the RPC likewise.
The `catch` at the end still returns a thrown Drive/PDF error's message: those are not database refusals.
Callers checked: `actions.ts` (deceased) and the assistant action only pass `result.error` on, so they needed no change; the undo
`page.tsx` throws on a resident read error and never prints a refusal key.

## Proof (dev, 2026-11-12)
Harness in `begin … rollback`, no signed-in login: **seen 2 of 6** — `deceased.archive_not_allowed`, `deceased.withdraw_not_allowed`.
**Not provoked:** `reason_required`, `not_deceased`, `no_earlier_placement` (all sit behind the permission check; an admin/placement login
inside the harness was not built, and no resident with these states was sought). Wording of all five is covered by
`check-sql-refusal-keys.mjs`. Unknown-key fallback: `src/lib/db-refusal.test.mjs`, 8 pass, 0 fail. Not driven on screen in Thai.

## Meter
Before: 16 functions / 53 keyed, 36 person-read still English. After: **18 / 59, 30**.

## Thai
My own wording, unreviewed; for the planner to file onto `#y1dqu`.

## Found, not fixed (for batch 3)
The control gating on the placement forms was not inspected.

## Next group (mechanism file's table)
Placements is done. Remaining per `2026-11-08-db-refusal-keys-mechanism.md`'s table: resident photos and the three merge screens, and
whatever the table lists beyond them; the planner names the next.
