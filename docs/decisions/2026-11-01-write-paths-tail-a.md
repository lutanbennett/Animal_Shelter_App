# (D) tail A: the sixteen widest shared write modules, wrapped, and nothing listed

Stream `write-paths-tail-a`, 2026-11-01, stream (D) of the PI FAILOVER programme over the widest
shared modules outside `residents/`, `management/` and `admin/`. Authority:
`2026-10-31-write-request-wrapper.md` (the mechanism), `2026-11-01-write-paths-admin-sweep.md`
(the pattern, and why nothing is listed) and `2026-11-01-header-writes-wrapped.md` (the whole-page rule).

**The outcome:** every write in the sixteen modules goes through `runWriteAction()`, or is declared
read-only. **Nothing was added to `WRAPPED_WRITE_PATHS`**, so this PR changes no runtime behaviour.

## 1. What `medical/scan-actions.ts` unblocked (deliverable 1)

It was the widest file in the app: one module on twelve addresses (`ScanCardButton` is the resident
picker's NFC button and the picker is everywhere). Its two writes set and clear a cookie, so a replay
would have been harmless; they are wrapped anyway, because the rule is *every write reachable at the
address*, not *every harmful one* (sweep paper section 6 — that weakening is Lutan's call). Both actions
now take a `FormData` holding only the request id, and the button holds **one `useWriteCall` per action**.

Measured with `node scripts/check-wrapped-write-paths.mjs --all` (before → after, this stream only):
`scan-actions.ts` no longer appears on any address's blocked list; the totals are in section 5.

## 2. What was wrapped (deliverable 2)

`bills`, `blood-tests/new`, `clinic-visits/[id]/edit`, `clinic-visits/[id]/report-actions`,
`clinic-visits/calendar-actions`, `clinic-visits/new`, `deliveries`, `diets`, `immunizations/new`,
`maintenance/actions`, `maintenance/bills-actions`, `medical/scan-actions`, `medical/weight`, `memes`
and `outreach`: **fifty-two writes** across fifteen modules. The sixteenth, `enclosures/map/actions.ts`
(`loadEnclosurePanel`), is a **read**, so it carries the `// write-requests: read-only -- <why>`
declaration the check already understands (it selects through `loadEnclosureDetails` and records
nothing).

Judgements worth not re-deriving:

- **A redirect is taken after the wrapper returns.** `runWriteAction()` rethrows `redirect()` and leaves
  the claim open, so a replay of a save that happened would answer "cannot tell". The body returns
  `{ ok: true, redirectTo }` and the action calls `redirect()` after. Used in `createDiet`, `updateDiet`,
  `updateClinicVisit`, `bookClinicVisit`, `saveMedicalWeight` and `deleteMaintenanceJob`. A replay therefore
  redirects too.
- **State types gained `ok`.** `BloodTestFormState`, `ImmunizationFormState`, `ClinicVisitState`,
  `ClinicVisitEditState`, `RecordWeightState`, `DietFormState` were `{ error } | { success }` shapes;
  `runWriteAction` needs `ActionResult`, so they are `{ ok: false; error }` / `{ ok: true, … }`. The
  diets refusal keeps its extra `confirm` field at runtime (the wrapper stores the whole object).
- **One `useWriteCall` per action, never shared across two actions** (`create` vs `update`, `status` vs
  `delete`) — an id kept from an unknown save and sent to another action is refused by
  `claim_write_request()`. Where two call sites run the *same* action in one component
  (`MyTaskList`'s two `setMaintenanceStatus`), they share one.
- **Shared components that other streams use were widened, not broken.** `RecordRowActions`'s
  `endToday` prop now receives a request id; `prescriptions.tsx`'s zero-argument bound action still
  type-checks and ignores it, so the next batch's prescriptions stream wraps `endPrescriptionToday`
  without touching the component again. `src/app/my/MyTaskList.tsx` (a `/my` caller of
  `setMaintenanceStatus`) and `src/app/deliveries/*` callers of `attachCardToDelivery` (a `bills` action)
  were updated because the signature changed.
- **A forbidden folder was touched once, with the brief's permission clause.**
  `src/app/residents/[id]/[section]/sections/clinic-visits.tsx` drew `retryCalendarSync` as a
  server-component `<form action>`, which cannot carry a request id. The form is now the client
  `RetryCalendarForm.tsx` and the section file only swaps one block for it. No other `residents/**` file changed.

## 3. `retryCalendarSync` and Google Calendar (deliverable 6, the open question)

**Is a replay safe? Yes, and it is wrapped anyway.** Reading `syncRow()` in
`src/lib/clinics/calendar-sync.ts`: the event id is derived from the visit (`calendarEventIdFor`), a
create that meets a 409 becomes a PATCH, a PATCH of a deleted event re-creates it, a DELETE answering
404/410 counts as done, and `syncVisitToCalendar()` catches everything and returns `"failed"` rather than
throwing. Running it twice converges on the same calendar. `claim_write_request()` cannot roll the outside
service back, but nothing here needs it to: on a replay the stored answer is returned and the body does
not run again; on an in-flight claim the person is told it cannot tell.

**For the GoTrue question the next batch carries,** the difference is that this call is *convergent by
construction* (deterministic id, upsert-shaped) while a TOTP confirm is single-use; the wrapper is
meaningful for the first and meaningless for the second, which is the line to draw there.

Not changed, but worth knowing: `updateClinicVisit` and `bookClinicVisit` also call the calendar
(`syncVisitToCalendar` / `syncPendingVisits`) *inside* the claimed body. A throw cannot happen there
(both catch), so the claim always finishes.

## 4. Nothing added to `WRAPPED_WRITE_PATHS` (deliverable 4)

Per the brief. **Which addresses this work completes:** none is *claimed* complete — an address is
complete only when every write reachable at it is wrapped, including writes in other areas that this
stream does not own (`residents/**`, `management/**`, the eleven next-batch modules). The check, not
this file, says which are: see section 5. The brief's separate listing stream owns the list.

## 5. The check, before and after (deliverable 5)

`node scripts/check-wrapped-write-paths.mjs --all`: the brief measured **60 modules unwrapped, 80
addresses blocked, 69 complete**. **After: 44 modules unwrapped (was 60), 59 addresses blocked (was 80), 90 complete (was 69), of 149.** The
sixteen modules of section 2 appear in no `NOT` line. (The 69 and 90 are the number of `(complete)` addresses
the script prints.) The 59 left are other streams' modules: `residents/**`, `management/**`, `admin/**`, the
eleven next-batch modules and the five auth modules.

## 6. Not driven, said out loud

One of the fifteen was driven in the browser: the **new outing** form (`createOuting`), as Admin on
dev, reached by clicking through `/operations` → `/outreach` → `/outreach/new`, with
`requestAnimationFrame` confirmed firing. It saved, redirected to the list, showed the row, raised no
"reload to save" refusal (so the id arrived and the claim passed) and the dev log showed no error. The
other fourteen are covered by typecheck, lint, the test suite, the shared mechanism and
`prove-write-requests.mjs` — a weaker thing, said here rather than implied.

## 7. Found, not fixed

- **Buttons follow cards** (`CLAUDE.md`): this stream changed how controls *call*, not whether they are
  *drawn*. No control's gate was re-listed per page.
- **`MyTaskList` also calls `recordRecurringJob`** (`management/recurring-jobs`, the management stream's),
  which stays unwrapped; `/my` cannot be listed until it is.
- **`RecordRowActions` is shared with `prescriptions.tsx`**: its end-today action is still unwrapped until
  the next batch, and the component already passes it an id it ignores.
