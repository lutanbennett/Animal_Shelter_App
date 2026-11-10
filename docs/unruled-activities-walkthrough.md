# The fourteen unruled activities — one sheet each (prepared 2026-11-10, backlog `#c4vn7`)

**For Lutan's own session. Nothing here is a ruling.** No card was made, no allowlist line edited, nothing put to him.
Re-measured today with `node scripts/check-ungranted-activities.mjs`: `84 catalogue activities; 5 Admin-only on purpose, 14 UNRULED; 56 cards`.

**How to read a sheet.** Each says: what it lets a person do · which screen and button asks it (file and line, read from the
code, not guessed from a label) · what happens today because no card holds it · the three answers (**a card**, **Admin-only
on purpose**, **no control exists**) with one line on which I think it is. "Edit" below means the edit level of a level
activity; read is already held by cards in every such case. Everything is about **cards**: who holds a card today changes
whenever the assignments are rebuilt, so no sheet names a role.

**What "no button behind it" means** (he asked, 2026-11-09): the activity exists in the list and the list shows an Edit
setting for it, but no screen or save in the app ever asks for that setting. Giving a card that setting would change nothing
anyone could see. For those the honest answer is "no control exists" — and the question left is whether to **remove the edit
setting from the list** (or leave it for a future screen), not which card carries it.

**What I did not do:** I drove no pages and ran no one-card login. This is a reading job; every statement below comes from
the file and line quoted. Where I could not establish something the sheet says so.

---

## Deliverable 2 first: the "settled on 2026-11-09" discrepancy — explained

The planner handover said `stock.correct`, `system.status` and `photos.resident_publish` were settled, yet the check still
prints them UNRULED. **Which of the three explanations it is: the ruling was given but never written into the allowlist.**

- Where the answers are recorded: only in the backlog item `#av8rq`'s text (docs/backlog.md line 267), as his quoted answers
  of 2026-11-09 — *"Yes they are Admin only"* (`system.status`, `reference.types`), *"Correcting a stock count is Admins
  role"* (`stock.correct`), *"Publishing a resident photo is part of the photo approval process (2 step) so only approvals
  needs a card"* (`photos.resident_publish`). A search of `docs/` for those phrases finds them in `docs/backlog.md` only: **no decision file**.
- Where they are not: `docs/ungranted-activities-allowlist.json` still lists all three under `foundNotRuled`. Only
  `reference.types` moved to `adminOnlyOnPurpose`, because `#j8vt4` (commit `46a1f0af`) recorded it. `#av8rq` itself says
  recording the other three "is `#c4vn7`'s first work".
- A small wrinkle: for `photos.resident_publish` his answer is "no card", not the words "Admin-only". In effect they are the
  same (only Admin holds it, so every non-Admin photo goes through the approval queue), but the allowlist's two lists only
  have "found, not ruled" and "Admin-only on purpose", so recording it means filing it as Admin-only with that reason.
- **I did not edit the allowlist** (that applies a ruling). What it is missing: dated records for `stock.correct`,
  `system.status`, `photos.resident_publish` (all 2026-11-09, by Lutan), ideally with a decision file quoting the answers.
  Sheets 3, 10 and 14 below are therefore **already answered**; they need recording, not asking again.

## The three unsettled things from `#av8rq`

- **(a) No card reaches `projects.publish`.** Confirmed from the code: `website_photos` is `website.content` read plus
  `website.gallery`, and `project_folders` is exactly `projects.folders` at edit
  (`src/lib/permissions/cards.ts:249`; its comment at 247–248 says it deliberately leaves out `projects.publish`).
  So the "Show on the website" tickbox for a project folder (sheet 5) is reachable by no card.
- **(b) His "manage appeal card" answer contradicts `0216`.** That migration says the new activity is *"narrower than
  `appeal.run`. Editing an appeal and publishing a wound photo are different powers."* Both are his; the sheet 1 question is
  which one stands. Not resolved here.
- **(c) His two questions, answered.** *Difference between changing stock and stocktake:* the stocktake page records a
  physical count of everything on a shelf (asks `stock.count`, e.g. the Stocktake link at
  `src/app/management/medications/page.tsx:205`); "changing stock" is typing a corrected figure for one item outside a
  stocktake, which goes through `record_stock_correction()` (`src/app/management/diets/actions.ts:123`,
  `.../medications/actions.ts:148`) and needs `stock.correct`. *What "no button behind them" means:* see above.

---

## 1. `appeal.medical_photo` (yes/no) — show a medical photo on a fundraising appeal

- **Lets a person:** tick a resident's *medical* photo to appear on a public appeal. Editing the appeal itself is a different power.
- **Screen and button:** Management → Campaigns → open an appeal → the photo chooser (`AppealPhotosEditor`). A medical photo's
  tickbox is disabled unless the login holds this (`src/app/management/campaigns/AppealPhotosEditor.tsx:88`, set from
  `can(perms, "appeal.medical_photo")` at `src/app/management/campaigns/[id]/page.tsx:170`). The save is guarded again by
  `canMedical()` at `.../campaigns/actions.ts:55` and by the database trigger, `has_permission('appeal.medical_photo')`
  (`supabase/migrations/0216_appeal_medical_photos.sql:90`) — it raises "You do not have permission to show a medical photo on an appeal".
- **Without it today:** a login that can edit appeals (`appeal.run`, card `run_appeals`) sees the medical photos but cannot
  tick them; the page says *"You can see these photos but only someone allowed to show medical photos can choose them."*
  (`en.ts:8821`). The control is correctly drawn disabled, so nothing is silent.
- **Answers:** card / Admin-only / no-control-exists is not the question here — a control definitely exists. **The question is the
  `0216` conflict (b).** My lean: **a card of its own** (or one added to `run_appeals` if he now prefers), because a wound
  photo going public is the kind of thing `0216` was written to keep apart. His call.

## 2. `photos.resident_medical` at edit (level) — the Medical photo folder

- **Lets a person:** nothing at edit. The activity is the *right to see* the Medical folder; it was made a level only so read
  could be handed out (`0276_medical_photos_card.sql` comments: insert/update/delete policies "already ask
  `photos.resident_add` / `photos.resident_manage`, never the read").
- **Screen and button:** none. The only callers ask read: `src/app/medical/photos/page.tsx:95`,
  `src/app/residents/[id]/[section]/sections/photos.tsx:24`, and the attachments policy (`0276`). I found no `edit` ask anywhere.
- **Without it today:** nothing is blocked; no edit control exists to be missing.
- **Answers: no control exists.** Question for him: leave the edit setting on the list as a placeholder, or remove it. (Removing a catalogue edit level is a build, not a ruling.)

## 3. `photos.resident_publish` (yes/no) — file a resident photo straight to a public folder

- **Lets a person:** add a resident photo that goes live in the shared gallery at once, skipping the approval queue.
- **Screen and button:** Photos → Add (`src/app/photos/add/page.tsx:37` decides whether the person's photos *wait*;
  `:58` offers "store for later"); the folder list comes from `drive-client.ts:68`; the pending-photos route checks it at
  `src/app/api/photos/pending/route.ts:43`.
- **Without it today:** every photo from anyone not holding it goes into the approval queue — the two-step process he described.
- **Answers: ALREADY ANSWERED 2026-11-09 — "no card" (see Deliverable 2).** Effectively Admin-only on purpose. It needs recording,
  not asking. (`approve_photos` grants `photos.approve` and `photos.resident_manage`, not this.)

## 4. `projects.photos` (yes/no) — add and remove photos on a project folder

- **Lets a person:** upload a photo to a project folder, and delete one.
- **Screen and button:** Projects → open a folder → the photos section: the **Add** button and each photo's **remove** (bin)
  icon (`src/app/projects/[id]/PhotoSection.tsx:82` and `:137`, from `canPhotos` at `projects/[id]/page.tsx:61`). The upload
  route refuses without it (`src/app/api/projects/[id]/photos/route.ts:44`, "403 not authorised"); the database also asks it
  (`0152`).
- **Without it today:** a login that can edit project folders (`project_folders` card, `projects.folders` edit) sees the photos
  but no Add and no remove, and no message says why. The card's own comment (`cards.ts:247–248`) says it leaves this out on purpose.
- **Answers: a card.** Everyday work; I lean **a card** — either its own or added to `project_folders` (that card's comment
  says it was kept narrow, so adding is a change to that stated shape). His call which.

## 5. `projects.publish` (yes/no) — put a project folder on the public website

- **Lets a person:** tick **"Show on the website"** for a project folder.
- **Screen and button:** Projects → open a folder → the info form's "Show on the website" tickbox and the separate
  "Show on website" switch (`src/app/projects/[id]/FolderView.tsx:293` and `:334`; `canPublish` from `page.tsx:62`). The save
  only changes the public flag when it holds this (`src/app/projects/actions.ts:147`), and the database refuses
  (`0182_perm_policy_cleanup.sql:112`).
- **Without it today:** the tickbox is not drawn; nobody but Admin can publish or un-publish a project folder. He asked if it
  was in the manage-website card (a) — **it is not**.
- **Answers:** card or Admin-only. He appeared to assume it was already on a website card, which suggests **a card**
  (the website-photos card is the natural home), but publishing is outward-facing like photos, so Admin-only is a fair answer. Genuinely his.

## 6. `reports.cashflow` at edit (level) — change the fixed monthly outgoings

- **Lets a person:** add, edit and delete the *fixed monthly cost lines* (rent, salaries as one total…) that the cash-flow forecast adds up.
- **Screen and button:** Management → Cash flow → **"Edit fixed outgoings"** link (`en.ts:4021`, drawn at
  `src/app/management/cashflow/page.tsx:161`), then the page `/management/cashflow/fixed-outgoings` that asks edit
  (`.../fixed-outgoings/page.tsx:20`); its three saves ask the same (`.../fixed-outgoings/actions.ts:47, :85, :108`); the "fix"
  link in the forecast at `page.tsx:170`.
- **Without it today:** the `view_cashflow` card (read only) opens the forecast; the link and the fix-it shortcut are not drawn.
  No message. Only Admin can edit.
- **Answers:** card or Admin-only. It is ordinary bookkeeping with a built-in cap of lines; I lean **a card** ("Edit fixed
  outgoings"), but it is money, so Admin-only is reasonable. His call.

## 7. `reports.expenses` at edit (level) — the Expenses report

- **Lets a person:** nothing at edit. The report is read-only (`0317_expense_report_card.sql` comment: "Read only"; the card
  `view_expenses` holds read alone and the migration raises if it ever grants anything else).
- **Screen and button:** none. `src/app/management/expenses/page.tsx:30` asks read; the report functions ask read
  (`0317:87, :133`); the `not p_write` branches (`0317:47–56`) grant read only.
- **Without it today:** nothing is blocked.
- **Answers: no control exists.** Same question as sheet 2: keep or remove the edit setting.

## 8. `resident.who_and_where` at edit (level) — see who a resident is and where they are

- **Lets a person:** nothing at edit. It is the "name, code and enclosure only" view of a resident, a lighter version of the full record.
- **Screen and button:** none at edit. Every caller asks read (`src/app/api/reels/resident-search/route.ts:13`,
  `src/app/enclosures/page.tsx:217`, `src/app/enclosures/[id]/page.tsx:23`) or reads the view `resident_who_and_where`
  (`src/app/assistant/lookups.ts:221`, `src/app/medical/photos/page.tsx:18`). About a dozen cards hold the read (`0268`, `0326`, `0329`).
- **Without it today:** nothing is blocked.
- **Answers: no control exists.** Keep or remove the edit setting.

## 9. `roles.view` at edit (level) — Settings → Who does what

- **Lets a person:** at read, open the Who-does-what screen. At edit, nothing is asked of this activity.
- **Screen and button:** the page asks read (`src/app/admin/who-does-what/page.tsx:40`; card `who_does_what`, `cards.ts:372`).
  The saves on that page do **not** ask this activity: they ask `hasAdminRole()` (`src/app/admin/who-does-what/actions.ts:46`), plus the
  authenticator-app step, by the page's own written rule ("Admin is the only editor… so there is always someone able to
  edit", `actions.ts:24–25`).
- **Without it today:** a holder of the read card sees the screen but cannot change it — correctly, and that is Admin's own power.
- **Answers: no control exists** at this activity's edit. Note: whether editing who-does-what should remain an Admin check outside
  `can()` is covered by the settled Admin rule in `CLAUDE.md`. (Less sure: I did not trace the database policies on `role_cards`
  for a `roles.view` ask; the code comment says they are Admin's.)

## 10. `stock.correct` (yes/no) — type a corrected stock figure for one item

- **Lets a person:** override one medication's or food's recorded stock count outside a stocktake, to match what is physically there.
- **Screen and button:** Management → Medications (or Diets) → the **count box** on an item, saved by `updateMedicationStock`
  / `updateDietTypeStock` (`medications/actions.ts:138`, `diets/actions.ts:114`) → RPC `record_stock_correction`, which requires
  **`stock.correct` and** the list's own edit (`0178_perm_functions.sql:149`).
- **Without it today:** the RPC refuses everyone but Admin ("Not authorized to edit stock.").
- **Answers: ALREADY ANSWERED 2026-11-09 — Admin** ("Correcting a stock count is Admins role"). Needs recording.
- **For the planner to file (found, not fixed):** the two pages draw the count box for anyone with edit on the list
  (`diets/page.tsx:55`, `medications/page.tsx:59`), not for `stock.correct`, so once sheets 11 and 12 get a card, that card's
  holders would see a count box the database always refuses. Control and action disagree.

## 11. `stock.diets` at edit (level) — change a food's stock settings

- **Lets a person:** on Management → Diets: the per-food stock settings (reorder point, lead time…), the **Order** view link,
  moving a food up/down the cupboard order, and typing a count (see sheet 10).
- **Screen and button:** `src/app/management/diets/page.tsx:55` sets `canEdit`; it gates the Order link (`:206`, `:62`) and the
  item controls (`:273`, `:280`); saves ask it at `diets/actions.ts:63, :118, :143`. It also gates the "fix food" link on the forecast
  (`cashflow/page.tsx:165`). Setting up the diets themselves is a separate card, `diet_settings` (`diets.settings`, `0340`), not this.
- **Without it today:** `food_forecast` (read) opens the page read-only; none of those controls are drawn; no message.
- **Answers:** card. **Card** — ordinary stock keeping. Less sure which people it should sit with, and the count box (sheet 10) travels with it.

## 12. `stock.medications` at edit (level) — change a medication's stock settings

- **Lets a person:** same as sheet 11 for medicines, plus **upload/remove the medicine's label** and reorder.
- **Screen and button:** `medications/page.tsx:59` → Order link (`:213`), controls (`:285`, `:301`); saves at
  `medications/actions.ts:84, :142, :200 (label upload), :265 (label remove), :288`; also the unit list (`management/units/actions.ts:180`).
- **Without it today:** `medicine_forecast` (read) opens the page read-only; those controls are not drawn, silently.
- **Answers: a card.** Same shape as 11; one card for both lists is possible (his call).

## 13. `stock.usage` (yes/no) — Stock between counts

- **Lets a person:** open the "Stock between counts" report: what each medication and food used between two stocktakes, against what was planned.
- **Screen and button:** the page `src/app/management/stock-usage/page.tsx:98`, reached by the **"Stock between counts"** link on Medications
  (`medications/page.tsx:221`), Diets (`diets/page.tsx:214`) and Deliveries (`deliveries/page.tsx:208`); the route table asks it (`routes.ts:380`).
- **Without it today:** the three links are not drawn and the address is refused for everyone but Admin. No message.
- **Answers: a card.** It is a read-only report, so I lean **a card**, probably folded onto an existing stock-viewing card or its own "View stock between counts". Note it is a yes/no with no read/edit split, which fits.

## 14. `system.status` (yes/no) — the system status page

- **Lets a person:** see the live health tiles, press **Check now**, **Run the alert check now**, and **Send a test alert** (which mails every admin).
- **Screen and button:** Admin → Status (`src/app/admin/status/page.tsx:33`); buttons in `CheckNowButton.tsx` and
  `AlertActions.tsx`; saves at `admin/status/actions.ts:31, :60, :84`; the Drive-health strip on the Admin landing
  (`src/app/admin/page.tsx:161`); the environment line on Releases (`src/app/releases/page.tsx:55`).
- **Without it today:** only Admin sees any of it.
- **Answers: ALREADY ANSWERED 2026-11-09 — Admin-only** ("Yes they are Admin only"). Needs recording.

---

## How sure I am

- **Complete (fully read, button and file/line quoted):** 1, 3, 4, 5, 6, 10, 11, 12, 13, 14.
- **Complete but "no control exists" rests on finding no caller:** 2, 7, 8 (searched `src` and `scripts/lib` for every use; none at edit).
- **Partial:** 9 — the page's saves use an Admin check and not this activity, but I did not trace the database policies on the
  role tables. 11 and 12 — I listed the gated controls from the `canEdit` uses; I did not open every sub-component to name each
  button label.
- No sheet was checked by driving the app or a one-card login.
