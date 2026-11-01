# Pi failover (D): the resident write paths go through `runWriteAction()`

Stream `write-paths-residents`, batch 9 of 2026-11-01. Brief: wrap the fourteen action files under
`src/app/residents/**`, add nothing to `WRAPPED_WRITE_PATHS`. Mechanism and pattern:
`2026-10-31-write-request-wrapper.md`, `2026-11-01-write-paths-admin-sweep.md`,
`2026-11-01-header-writes-wrapped.md`.

**This PR changes no runtime behaviour on its own.** `WRAPPED_WRITE_PATHS` still holds one entry
(`/admin/units`), so `mayReplayWrite()` answers exactly as before. What changes is that the writes are
ready to be listed.

## 1. What was done

All fourteen files, every exported write in them:

| File | Writes | How the id arrives |
|---|---|---|
| `move/actions.ts` | `moveResident` | form field |
| `hospital/actions.ts` | `sendToHospital` | form field |
| `hospital/return/actions.ts` | `returnFromHospital` | form field |
| `rehome/actions.ts` | `rehome` | form field |
| `rehome/return/actions.ts` | `returnToShelter` | form field |
| `deceased/actions.ts` | `recordDeath`, `undoDeath`, `retryDeceasedArchive`, `retryDeceasedRestore` | form field |
| `edit/actions.ts` | `updateResident` | form field |
| `new/actions.ts` | `recordIntake` | form field |
| `microchip/actions.ts` | `setResidentMicrochip` | form field, set by `MicrochipForm` |
| `blood-tests/actions.ts` | `deleteBloodTestAttachment` | trailing `requestId` argument |
| `procedures/actions.ts` | `deleteProcedureAttachment` | trailing `requestId` argument |
| `archive-actions.ts` | `archiveMedicalRecord`, `restoreMedicalRecord` | trailing `requestId` argument |
| `adoption-updates/actions.ts` | `saveAdoptionUpdate`, `deleteAdoptionUpdate` | trailing `requestId` argument |
| `photos/actions.ts` | `setProfilePhoto`, `deletePhoto`, `movePhotoToFolder`, `markPhotosPosted`, `undoPhotoPosted` | trailing `requestId` argument |

Form-submitted actions moved their forms from `useKeptForm` to `useWriteForm`; direct calls go through
`useWriteCall`, **one per action** (the rule in `use-write-form.ts`). The callers that are shared
components outside `src/app/residents/**` and had to change with them (a declared crossing, forced by the
new argument): `src/components/MicrochipForm.tsx`, `BloodTestList.tsx`, `ProcedureList.tsx`,
`ArchiveRecordControl.tsx`, `PhotoGallery.tsx`.

## 2. The redirect problem, which the earlier sweeps did not meet

Nine of these writes finish with `redirect()` (the five placements, `recordDeath`, `undoDeath`, `updateResident`, `recordIntake`). A redirect is a throw, `runWriteAction()` rethrows it
(`unstable_rethrow`) **before** `finish_write_request()` runs, so a successful save would have left its
claim open and a replay of it would have read "we cannot tell" — a success reported as an unknown, on
exactly the path the Worker replays.

So the body no longer redirects. It returns `{ ok: true, redirectTo }`, `runWriteAction()` stores that,
and the redirect happens **after** it returns. A replay then gets the stored `redirectTo` and redirects
again, which is the right answer for a save that did land. `runWriteAction()` itself is untouched.
`recordIntake`'s "chip failed, send them to the edit page" branch and `updateResident`'s after-death
branch (`updateDeceasedResident`, which now returns its target instead of redirecting) follow the same
shape. **Whoever wraps the next redirecting action should do the same.**

## 3. The planner's open question, answered

*Does `claim_write_request()` make a multi-row action idempotent, or only the first write?*

**The whole action, as a unit — but not atomically.** Read from `runWriteAction()` and `0292`: the claim
is taken once, before the body; the body then makes all of its writes; `finish_write_request()` stores
the result once. A second attempt with the same id never runs the body: it gets the stored result
(`replay`) or "we cannot tell" (`in_flight`). So a move that writes a history row and updates the
resident cannot write either of them twice.

What it does **not** give is atomicity. The body is ordinary JavaScript making separate PostgREST calls,
each its own transaction. If it throws after the first write, the claim stays open, the person sees the
"something went wrong" reference, and the retry reads `in_flight` and says it cannot tell — **it does
not re-run the missing second write**, and the first stays committed. That is the availability cost the
wrapper decision already names; it is now concrete for these files:

- `updateResident`: resident row, then profile photo, then housing move (its own comment already says an
  error at the move "leaves those fields saved and only the move to retry").
- `recordDeath` / `undoDeath`: the placement commits, then the Drive archive/restore runs; a Drive throw
  leaves the death recorded and the claim open. The hub's existing retry buttons
  (`retryDeceased*`, themselves wrapped) are how that is finished.
- `movePhotoToFolder`: Drive moves first, then the row; unchanged order, same exposure.
- `recordIntake`: `record_intake()` is one transaction; only the chip update after it is separate.

**This affects every stream in the sweep, and it is not a defect of this PR:** the one-statement
guarantee only exists where the write is a single RPC, which is why `docs/decisions/2026-10-31-write-request-wrapper.md`
§1 says a shared wrapper cannot give it. Anything that must be both atomic and replayable needs an RPC of
its own; none of these fourteen was rewritten as one.

## 4. Things I did not force, and one edge worth knowing

- **Nothing was refused as un-wrappable.** No write in the fourteen files needed the §3 treatment of
  `2026-11-01-write-paths-admin-sweep.md`.
- **A kept id can meet different arguments.** `useWriteCall` keeps an id while the answer is "we cannot
  tell". If the person then deletes a *different* attachment (or photo) from the same component, that id
  is sent for the second delete and `claim_write_request()` answers with the first attempt's stored result
  or `in_flight`. The database checks the *action name*, not its arguments. It fails safe (nothing is
  written twice, the person is told to look), and the same shape already exists in `admin/units`. Not
  fixed here: the clean fix is a key per target, which is a change to `useWriteCall`, not to a caller.
- **`retryDeceasedArchive` / `retryDeceasedRestore` gained a `formData` parameter** so the id reaches them;
  `useActionState` already passes it.

## 5. Which addresses this completes — for the listing stream

`node scripts/check-wrapped-write-paths.mjs --all`, before and after:

| | Before (planner, 2026-11-01) | After |
|---|---|---|
| Action modules unwrapped | 60 | **46** |
| Addresses complete | 69 | **79** |
| Addresses blocked | 80 | **69** |

Newly complete, all under `/residents`: `/residents/[id]/move`, `/hospital`, `/hospital/return`,
`/rehome`, `/rehome/return`, `/deceased`, `/deceased/undo`, `/edit`,
`/adoption-updates/new`, `/adoption-updates/[updateId]/edit`, `/residents/new`.
(`/residents` itself reads complete.) **Still blocked: `/residents/[id]` (1 unwrapped) and
`/residents/[id]/[section]` (3 unwrapped)** — measured by the check, none of the remaining blockers is a resident file:
`/residents/[id]` waits on `src/app/management/translations/actions.ts`, and `/residents/[id]/[section]` on
`src/app/clinic-visits/calendar-actions.ts`, `src/app/diets/actions.ts` and `src/app/prescriptions/actions.ts`
(plus the same translations module). They belong to other streams, and **nothing was added to the list**.

## 6. Left alone

`runWriteAction()`, `claim_write_request()`, `finish_write_request()`, `mayReplayWrite()`,
`WRAPPED_WRITE_PATHS`, `src/app/management/**`, `src/app/admin/**`, `worker/`, the dictionaries. No
permission check was moved, loosened or removed: every `can(...)` stays inside the body, where it was
inside `runAction()`.
