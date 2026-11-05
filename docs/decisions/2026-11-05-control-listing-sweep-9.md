# Control listing sweep 9: the 23 `/api` handlers, the whole-page group's render sites, two faults fixed (2026-11-05)

Stream `control-listing-sweep-9`, item `#79sqf`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that action".
Stated by card; Admin untouched (`perms.isAdmin` short-circuit not touched). **Step zero:** sweeps 5, 7 and 8 read; `find src/app/api -name route.ts | wc -l` is **23**
(sweep-8 said 28; that was wrong). The gap was still there, so the work went ahead.

## 1. The 23 route handlers: activity asked, the control that calls it, verdict

| # | Handler | Activity it asks (file:line) | Calling control and what it is drawn on | Verdict |
|---|---|---|---|---|
| 1 | `bills/new` | `mayFileBill` any of five (`lib/bills/upload.ts:39`) | BillsInbox "Add bills"; page `canUseBills`, the same five (`lib/bills/access.ts:10`) | match |
| 2 | `bills/[kind]/[id]` | per owner (`upload.ts:35-38`): `stock.delivery`, `medical.visits` edit, `maintenance.bills`, `bills.utilities` | `BillPhotosSection canAdd`: `deliveries/page.tsx:305,310` `stock.delivery`; `clinic-visits/[id]/edit/page.tsx:72` `medical.visits` edit; `maintenance/[id]/page.tsx:28` `maintenance.bills`; inbox card under `canUseBills`. No caller draws `utility_bill` (the utilities page asks `bills.utilities` for the whole page) | match |
| 3 | `blood-tests/[id]/attachments` | `medical.blood_tests` (`route.ts:39`) | form page `requirePermission("medical.blood_tests")`; list `canManage` = same (`sections/blood-tests.tsx:69`) | match |
| 4 | `calendar/sweep` | Bearer service key (`route.ts:17`), no card | no control; called by the Worker schedule | n/a |
| 5 | `clinic-visits/[id]/report` | `medical.visits` edit (`route.ts:29`) | `ReportSection canEdit` = edit and not deceased (`clinic-visits/[id]/page.tsx:133`) | match |
| 6 | `documents/[fileId]` | RPC `can_see_drive_file` (`route.ts:28`) | display only, no control | n/a |
| 7 | `events/[id]/photos` | `events.run` (`route.ts:30`) | `EventPhotos` on a page that is `requirePermission("events.run")` (`management/events/[id]/page.tsx:15`) | match |
| 8 | `facility-maps/[...path]` | `facility.enclosures` read (`route.ts:34`) | image URL on pages gated `facility.enclosures` | match |
| 9 | `maintenance/[id]/attachments` | `maintenance.photos` (`route.ts:60`) | job page `canPhotos` = same (pinned by `photo-controls-follow-cards.test.mjs`); **the new-job form drew its picker on `maintenance.jobs`** | **FAULT, FIXED** (section 2) |
| 10 | `medical/residents/[id]/photos` | `photos.medical_add` (`route.ts:42`) | page `requirePermission("photos.medical_add")` (`medical/photos/page.tsx:25`) | match |
| 11 | `outreach/[id]/photos` | `community.outings` (`route.ts:37`) | new and edit pages `requirePermission("community.outings")` | match |
| 12 | `photos/[fileId]` | RPC `can_see_drive_file` / public (`route.ts:92,146`) | display only | n/a |
| 13 | `photos/pending` | `photos.shelter_add` or `photos.resident_publish`, and Shelter in the login's folders (`route.ts:40`) | enclosure chooser offered when the folders include Shelter and the route is not Medical (`photos/add/page.tsx:38`) | match |
| 14 | `photos/shelter/[id]` | `photos.shelter_add` and the folder (`route.ts:39`) | `/photos/add` chose this route only for a Shelter-only login; **a login with Shelter and Medical but not `photos.resident_add` was sent to the hub route, which refuses it** | **FAULT, FIXED** (section 2) |
| 15 | `procedures/[id]/attachments` | `medical.procedures` (`route.ts:47`) | form page requires it; list `canManage` = same (`sections/procedures.tsx:74`) | match |
| 16 | `projects/[id]/photos` | `projects.photos` (`route.ts:44`); the attachments policies ask the same (`0314:130`, `0316:34-68`) | **`PhotoSection` drew Add (ungated), remove and caption on `projects.folders`** | **FAULT, FIXED** (section 2) |
| 17 | `residents/[id]/photos` | `photos.resident_add` or `resident.adoption_news` (`route.ts:45`) | hub Photos tab draws `PhotoUploader` when `photoCategoriesFor(perms)` is non-empty (`sections/photos.tsx:44`) | **MISMATCH, reported, not fixed** (section 3) |
| 18 | `residents/[id]/videos/start` | same pair (`route.ts:33`) | `AdoptionUpdateForm` (adoption news) and the same `PhotoUploader` | same as 17 |
| 19 | `residents/[id]/videos/finish` | same pair (`route.ts:30`) | same | same as 17 |
| 20 | `residents/tag-search` | `resident.record` read (`route.ts:12`) | `TagNoteField canTag`, default false, closed by sweep-3 | match |
| 21 | `status/alerts` | Bearer service key | no control | n/a |
| 22 | `version` | none, public build id | no control | n/a |
| 23 | `videos/[fileId]` | `is_public_drive_file` / `can_see_drive_file` (`route.ts:32,37`) | display only | n/a |

## 2. Fixed (controls drawn where the action refuses)
- **`maintenance.photos`, new-job form.** `MaintenanceForm` takes `canPhotos` (default false); `maintenance/new/page.tsx` passes `can(perms, "maintenance.photos")`. The picker and its line on the review step
  are drawn only then. Before, the picker showed on `maintenance.jobs` and the upload after Save was refused.
- **`projects.photos`, project folder page.** `PhotoSection` takes `canPhotos` (default false) from `projects/[id]/page.tsx`: Add photos, the uploader, remove and caption now ask it. The cover-photo switch stays on
  `projects.folders` (`setProjectCoverPhoto` writes the folder row).
- **`/photos/add` route choice.** For a login with more than one folder and no `photos.resident_add` or `resident.adoption_news`, each folder files through the route that asks its own activity
  (`photos/add/page.tsx` builds `routes`; `AddPhotosFlow` reads `routes?.[folder] ?? route`). No change for any other login.

## 3. Found, not fixed (for the planner to file)
- **Hub Photos tab, `src/app/residents/[id]/[section]/sections/photos.tsx:44` (another stream's file).** `PhotoUploader` is drawn on "any folder at all", but its default route asks `photos.resident_add` or `resident.adoption_news`.
  A login holding `photos.shelter_add` or `photos.medical_add` without either gets a drop zone the route refuses. Fix: pass `route` from the login as `/photos/add` does, or gate on the route's pair. Whether such a login can reach the tab was not established.
- **No card grants `projects.photos`, `maintenance.photos`, or the edit levels of `maintenance.jobs` and `projects.folders`** (`grep -c` on `cards.ts` is 0 for the first two). So the three fixes above change what Admin and a future card see; today no one-card login holds those activities. Same gap class as `#wdjt0`.

## 4. The whole-page group, traced to render sites
Scratch script (not committed) walked the import graph from every `.tsx` importing an `actions` module up to every `page.tsx` that draws it: **149 components** (sweep-5 counted 136 before later work).
- **118 reach only pages that call `requirePermission`, `requireAnyPermission` or `requireAdminUser`**: the gate is there at the render site, mechanically established. It does not prove the page's activity equals the action's; sweeps 2 to 8 compared those.
- **31 reach a page with no such call**, each read: public or own-login forms (`LoginForm`, `ForgotPasswordForm`, `login/request`, `SignupForm` for sterilisation, `ChangePasswordForm`, `ChangeNameForm`): no card by the sweep-3 §5 rule; components with their own prop or `can()` gate
  already read by sweeps 3 to 8 (hub sections, `ArchiveRecordControl` `medical.archive`, `RetryCalendarForm` `medical.visits`, `MyTaskList`, `FeaturesPanel` admin-only, `BillsInbox`, assistant cards); `UndoDeathForm` and `AdoptionUpdateActions` (sweep-8).
- **One orphan:** `AssistantPanel` is rendered by `AppHeader`, not a page (sweep-8 drove it).
- **Not established:** that every one of the 31 prop-gated callers passes the action's own activity, beyond the rows above and sweeps 3 to 8.

## 5. Driven in a browser (port 3009)
**2 halves driven, 1 control family.** `donations_receipts` card (reads project folders, nothing else): project folder page shows Photos (0) with **no** Add or caption control. Admin: Add photos and Add a caption shown (both halves).
**Not driven:** the new-job form's both halves and `/photos/add` for a Shelter+Medical login (no one-card login holds `maintenance.photos`; the mixed login needs two cards and was not built), the hub Photos tab, and every other row (read in code).

## 6. The remainder, stated once
1. The two found-not-fixed items in section 3.
2. A browser drive of rows 9 and 14's both halves, once a card holds `maintenance.photos`.
3. Whether the 31 prop-gated callers each pass the action's own activity (read per page, not mechanically).
Sweep-8's remainder (route handlers, render-site trace) is closed here and is not to be read as current. Release note: `n/a`, only Admin sees the changed controls today.
