# Control listing sweep 5: the remaining ground sized, the pages that gate below their actions, and the ruling on a shape check (2026-11-02)

Stream `control-listing-sweep-5`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that
action", with sweep 3 §5 (a control needs a gate when its destination is a card-governed write). Everything is stated
by activity; Admin is the documented bypass and is untouched. **No code changed: no ungated control was found.**
No server or database check was touched. Nothing was driven in a browser (code read only).

## 1. The real count of the ground

136 `.tsx` files under `src/` import a server `actions` module (131 client components, 5 server files). Sweeps 1 to 4
named about 55 of them (every `admin/*` file, the diets / medications / donations / drives / map / card board files, the
placement forms, `PhotoGallery`, the tag-picker forms). **About 80 had not been opened.** Sweeps 3 and 4 described that
remainder as large; in practice most of it is one kind of file.

How a control in those files is protected comes in three shapes, counted by reading the importing pages:

- **Whole-page gate at the level the action asks (the large majority, roughly 95 files).** The page calls
  `requirePermission("<activity>")` (edit level by default) and the component sits only on such pages, so a login that
  cannot perform the action never gets the page. The component takes no gate prop by design.
- **A gate prop the page fills from `can(perms, "<activity>")`** (about 25 files). Every one that has a default has it
  `= false`; the few without a default are required booleans, so the compiler forces every caller to say.
- **A page gated at READ level that draws write controls.** This is the only shape where a fault can live. There are 24
  `requirePermission(..., "read")` pages in `src/app`; section 2 reads every one that is in scope.

## 2. Pages gated at read level, control by control

| Page and control | Action | Activity the action itself asks | How drawn | Verdict |
|---|---|---|---|---|
| `upcoming-visits`: Confirm form (`ConfirmEntryForm`), Dismiss (`DismissEntryButton`) | `confirmCalendarEntry`, `dismissCalendarEntry` | `visit.book` (`confirm-actions.ts:34`) | whole block built only when `can(perms,"visit.book")` (page :32, :74) | correct |
| `upcoming-visits`: row edit affordances | visit edits | `medical.visits` edit | `canEdit={can(perms,"medical.visits","edit")}` (:116) | correct |
| `memes`: add / make links, `MemeView` edit | `createMeme`, `updateMeme`, share, archive | `social.library` (`memes/actions.ts:74,169,224,250`) | `can(perms,"social.library")` for the links and `canEdit` | correct |
| `outreach`: record link, Edit link per row | `createOuting`, `updateOuting` | `community.outings` | `canWrite = can(perms,"community.outings")` on both | correct |
| `outreach/new`, `outreach/[id]/edit` (+ `OutingPhotos`) | outing and photo actions | `community.outings` | page `requirePermission("community.outings")` at edit | correct |
| `projects`, `projects/[id]`: new folder, edit, move, photos, publish | folder and photo actions | `projects.folders`; publish `projects.publish` (`projects/actions.ts:147`) | `canWrite`, `canPublish`, `canManageTranslations` props (required booleans, no default) | correct; see section 5 |
| `maintenance`: New job link, board drag | `createMaintenanceJob`, `setMaintenanceStatus` | job write `maintenance.jobs`; status `maintenance.progress` (not re-read in the action body, section 5) | `canWrite = can(perms,"maintenance.jobs")`, `canMove = can(perms,"maintenance.progress")` | correct as far as read |
| `my`: task list | `setMaintenanceStatus`, `recordRecurringJob` | `maintenance.progress`; recurring done per task | `canEditMaintenance = can(perms,"maintenance.progress")`, `canMarkDone` from the task | correct |
| `management/cashflow/fixed-outgoings` | create / update / delete outgoing | `reports.cashflow` (`actions.ts:47,85,108`) | page `requirePermission("reports.cashflow")` at edit | correct |
| `management/diets`, `management/medications` | stock edits | `stock.diets` / `stock.medications` edit | sweep 4 rows, re-read | correct |
| Resident clinic-visits section: Retry calendar | `retryCalendarSync` | `medical.visits` (`calendar-actions.ts:36`) | `canRetry={can(perms,"medical.visits")}` | correct |
| Resident blood-tests / procedures sections: delete attachment | `deleteBloodTestAttachment`, `deleteProcedureAttachment` | `medical.blood_tests`, `medical.procedures` (`actions.ts:25` in each) | `canManage={can(perms, ...)}`, prop defaults `false` in both lists | correct |
| Resident photos: the uploader | `uploadResidentPhoto` | categories by `photos.resident_publish` / `.shelter_add` / `.medical_add` | drawn only when `photoCategoriesFor(perms).length > 0` (`drive-client.ts:65`), the list built from the same activities; `canSeeMedical` defaults `false` | correct |
| Deliveries: record, steps, delete | `recordDelivery`, `attachCardToDelivery`, `deleteDelivery` | `stock.delivery`; attaching a bill asks `stock.delivery` for a stock receipt (`bills/actions.ts:48`) | page `requirePermission("stock.delivery")` | correct |
| `admin/website`, `admin/shop`, `admin/who-does-what` | all | listed by sweeps 1, 2 and 4 | `canEdit` / `canChange` default `false`; who-does-what is Admin plus two-step | correct (already listed) |

The other `read`-level pages (`clinics`, `clinics/[id]`, `enclosures`, `enclosures/[id]`, `appointments`, the medical
diet / feeding / medication lists) draw links to other pages, not action forms; each link target gates itself. That is
the display side of sweep 3 §5.

## 3. Everything else, grouped

Single-activity pages (clinics list and doctors, contacts, recurring jobs, shelter friends, translations queue,
appeals, donors, donation form, bills inbox, photo approve queues, stocktake sheet, the admin forms): in every one I
compared, the importing page's activity and the action file's `can(...)` activity are the same. Assistant panel:
`assistant.ask`, drawn from `canAsk` / `canConfirm`. Login, forgot password, password and name change, two-step forms:
a login's own account, no card.

## 4. Ruling on item 2: a shape-only check ("does every importer of an `actions` module take a gate prop defaulting to false?")

**Not worth building. Recorded as: no check, and what should happen instead.**

1. **It would be false for about 95 of the 136 files.** Most components are forms that only exist on a page gated at the
   action's own activity, and correctly take no prop. A check that flagged all of those would need an allow-list of
   the 95, and a hand-kept allow-list is the noise people stop reading.
2. **For the ~25 that do take a prop it would pass and say nothing about the half that matters.** Every fault this
   repo has had here (the one in sweep 1, the gallery on 2026-10-27) was a prop given the wrong activity or a page
   gated below its action, never a missing default.
3. **`CLAUDE.md` already records what a green check that cannot see the question does** ("called by nothing" from a
   pattern that could never match). A pass labelled "gate props default to false" would read as "controls are gated".
4. Five passes finding one fault says the ground is nearly clean; it does not say a check would catch the next one.

**What should happen instead.** A fault can only live on a page gated at `"read"` that draws write controls (section 1,
third shape). That is 24 pages, found by one grep (`requirePermission(.*"read")` in `page.tsx`), and this sweep has read
every in-scope one. A new page of that shape is reviewed when it is written: the rule is in `CLAUDE.md` and the gallery
pattern (`can…` prop, default false) is the template. **The per-stream re-listing should stop.** If a check is ever
wanted, the useful one is this, not the shape: *for each `page.tsx` gated at read, does every imported component that
reaches an `actions` module receive a `can(...)` expression?* It still could not tell the right activity from a wrong
one, so it is a separate, later item and is not built here.

## 5. Found, not fixed, and not reached

- **Found, not fixed: none.** No ungated control.
- **Note, not a fault:** `FolderGrid`, `FolderView`, `PhotoSection` and `MaintenanceBoard` take required booleans
  (`canWrite`, `canMove`, ...) rather than optional props defaulting to false. A forgetful caller is stopped by the
  compiler instead of by a default, so nothing is offered by mistake. Left alone.
- **Not reached, no verdict implied:** `setMaintenanceStatus`'s own activity was not read to the line (the action
  guards through a helper; the board asks `maintenance.progress`). Server route handlers (`/api/*`, the photo upload
  route) were not re-read. For the roughly 95 whole-page-gated files I checked the importing page's activity against the
  action's, not every render site. Nothing was driven in a browser.
- **The sweep item stays open** for exactly those residues; everything else in sweeps 3 and 4's remainder is now read.
