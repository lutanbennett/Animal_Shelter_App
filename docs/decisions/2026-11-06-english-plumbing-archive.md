# 2026-11-06 — `t` threaded through the archive helpers and the Drive-folder warnings (`#c7zjk`, tail)

**Stream:** `claude/english-plumbing-archive`. Thai is **unreviewed**; no Thai speaker has read it.

## Re-measured against the item

| | Item said | Measured today |
|---|---|---|
| Archive-helper strings rule 3 reports | 5 | **5** — `archive-deceased-resident.ts:137,185`, `restore-deceased-resident.ts:62,67,104` |
| Drive-warning fallbacks | 4 | **4** — `maintenance/drive-sync.ts:52` (move), `projects/drive-sync.ts:107` (rename), `:135` (move), `:151` (delete). Three distinct sentences, so three dictionary keys |
| Caller files for the archive pair | "four or more" | **7 files** that call the helpers or the refresh wrapper: `deceased/actions.ts` (4 call sites), `assistant/actions.ts`, `refresh-deceased-archive.ts`, and its four callers (`api/residents/[id]/photos/route.ts`, `adoption-updates/actions.ts`, `edit/actions.ts`, `photos/actions.ts`). Every one already held `t` |
| Callers of the Drive warnings | "two drive-sync files" | the two files plus `maintenance/actions.ts` (2 sites) and `projects/actions.ts` (3 sites); all already held `t` |

The item's counts held; "four or more" was low by three. No caller needed a new `getT()` except one reorder in the photos route (`t` was fetched after its use).

## What changed

- `archiveDeceasedResident(supabase, t, id)`, `restoreDeceasedResident(supabase, t, id)`, `refreshDeceasedArchiveIfNeeded(supabase, t, id)`, `syncJobFolderAfterChange(supabase, t, id)`, `syncProjectFolderRename/Move(supabase, t, id)`, `deleteProjectDriveFolder(t, folderId)`. `t` is required, not optional, so a caller that forgets does not compile.
- New keys: `residents.deceased.archiveErrors.{residentNotFound, archiveFailed, stillDeceased, restoreFailed}` and `common.{driveFolderMoveFailed, driveFolderRenameFailed, driveFolderDeleteFailed}`, English and Thai, appended beside neighbours (no re-sorting).
- Only two of the five reach a screen: the retry buttons on the deceased hub show `archiveFailed` / `restoreFailed` / `stillDeceased`; the first-time calls in `recordDeath`/`undoDeath`/the assistant ignore the result. `refresh…` only uses its error as a flag. They are translated anyway because the helpers return them.

## Boundary held

Files touched are exactly the callers above plus both dictionaries. Nothing else was threaded.

## Declared finding: no role-keyed selection

None of these strings is chosen by a role key.

## Rule 3 blocking preconditions (deliverable 7) — NOT flipped

1. Five archive strings translated — **met.**
2. Four Drive-warning fallbacks decided — **met** (translated). Rule 3 still cannot see the `driveErrorMessage(…, "…")` position, but no English remains there.
3. A day of PRs with no false positive — **not met**; one measurement only (0 of 5 before, 0 reported now).
4. A Thai speaker reads the 34 route strings from #1236 plus these seven keys — **not met**, waiting on a person.
5. Flipping `RULE_3_BLOCKS` — **not done, deliberately.**

## How it was exercised

`archive-messages.test.mjs` checks both dictionaries carry all seven keys and that Thai differs from English. The helpers themselves import `server-only` and the PDF stack and cannot load under the test runner, so a stub-`t` test of the helpers was tried and abandoned. TypeScript's compile of every call site is the proof the dictionary reaches them. Not driven on dev: archiving a resident writes to the shared dev database.
