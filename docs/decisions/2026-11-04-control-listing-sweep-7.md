# Control listing sweep 7: the gate-less leaf components traced to their parents (2026-11-04)

Stream `control-listing-sweep-7`, item `#79sqf`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that action".
Stated by activity and card; Admin untouched. **No code changed. No server or database check was touched. Nothing was driven in a browser:
this sweep is a code read.**

## 1. Step zero: the read-level half was already done
`src/app/clinic-visits/[id]/page.tsx:43` asks `requirePermission("medical.visits", "read")` (PR #1242, merged after sweep-6's file was
written). The edit page asks edit, which is correct: `requirePermission` defaults to edit. Sweep-6's finding was true when written and
was overtaken. The item's title still named it as open; it is retitled.

## 2. Re-measure (deliverable 10), dated 2026-11-04 on `main` @ `5501f10d`
- **142** files under `src/` import an actions module (`…actions` / `…-actions`), `.ts` and `.tsx` together.
- Of the `.tsx` ones, **76** mention no `can…`, `perms`, `isAdmin`, `readOnly` or `requirePermission` of their own. Those are the leaf
  components that draw a write control and rely on whoever renders them. Sweep-5's "about 95 behind a whole-page gate" counted a
  different thing (pages whose own gate matches the action); it is not comparable and is not repeated.

## 3. The trace
Method: for each of the 76, find every file that imports it and read the gate that file applies (`requirePermission(...)`, `can(perms, …)`,
a `can…` prop), then compare with the activity the action asks. Where the parent's gate was absent or looked different, the action file was
opened.
- **Gate at the parent equals the action's activity** (the large majority): the setup-list pages (`reference.types`: units, blood-test /
  procedure / immunization types, medications, diets), enclosures and zones (`facility.enclosures`), status (`system.status`), bills settings
  and utilities, the management pages (`clinics.list`, `clinics.doctors`, `contacts.directory`, `donation.receipt`, `appeal.run`,
  `recurring.manage`, `friends.manage`, `reports.cashflow`, `website.content`), deliveries (`stock.delivery`, asked by `deliveries/actions.ts`
  at lines 125 and 270), stocktake (`stock.count`), weight (`medical.weight`), memes (`social.library`), outings (`community.outings`),
  maintenance form (`maintenance.jobs`), photo approval (`photos.approve`, with `photos.resident_manage` for reassign and remove).
- **Opened because the parent's gate looked different, all consistent:**
  - `UnitsPanel` (shared): on the management diets and medications pages it is drawn only under `canEdit`; its actions
    (`management/units/actions.ts`) ask `canEditItemSettings` = `reference.types` **and** the item's stock card, and the admin pages that
    draw it refuse a login lacking both (`canEditItemSettings` at `admin/medications/page.tsx:26`, `admin/diets/ingredients/[id]/page.tsx:14`).
  - `ArchiveContactControl`: drawn under `canManage` = `contacts.directory` on the contact page and by the contacts table, and
    `archiveContact` / `restoreContact` ask `contacts.directory`.
  - `ConfirmList` / `DismissEntryButton` (upcoming visits): drawn only when `visit.book` and the calendar is configured
    (`upcoming-visits/page.tsx:32`); `confirm-actions.ts:34` asks the same two.
  - `DeleteDeliveryButton`, `DeliverySteps`, `RecordDeliveryForm`: page gate `stock.delivery`, actions ask `stock.delivery`.
  - `StocktakeSheet`: imports only a **type** from the stocktaking switches file; the switch control itself lives on
    `admin/stocktaking` and its action checks Admin (`hasAdminRole`).
  - `SignupControls` and `DriveForm`: page gate `website.content`, actions ask `website.content`.
- **No card by design:** `account/password` (the login's own name and password), the login, forgot-password and request-access forms, the public
  desexing sign-up.
- **Not read to the control, so NOT claimed:** `admin/security` (`UsersTable`, `CreateUserForm`, `DoctorLoginLink`, `AccessRequests`),
  `AssistantPanel`, `MemeMaker`'s `UploadPicker`, `MoveFolderDialog` (its `canWrite` prop was seen, its action not read), `CardControls`
  (`canEdit` seen on its page, not read inside the board), `PlanUpload` (parent `MapEditor` passes `canManage`, not read against the action),
  `AdoptionUpdateActions`, `UndoDeathForm`. These are the declared remainder.

## 4. Found
**Nothing.** No control was found drawn for a login whose cards the action would refuse. Nothing fixed, nothing left in a sibling's files.

## 5. Deliverable 11: is this the right remaining shape?
Partly. A leaf-to-parent read finds a mismatch only where the parent's gate names a *different* activity from the action's, and it found none.
What it cannot see is a leaf that is rendered inside a *read-level* page without its own prop (the gallery shape): the 24 read-level pages that
could do this were each read in sweep-5. So the one thing a further code read would add is the 8 files in the remainder above. A browser
drive of those with one-card logins is the better use of any sweep-8 than another full pass. I recommend the item be reduced to that list.

## 6. Left / for the planner
Not ticked. Remainder for sweep-8: the files named under "Not read to the control". No backlog item to file beyond that.
Release note: `n/a`, nothing changed.
