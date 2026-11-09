# Control sweep 11: the count of pages no sweep has driven (2026-11-08 brief, measured 2026-11-09)

Item `#79sqf`. This stream **counts**; it does not walk. It drove three pages to measure what a drive costs, and found
two small faults on one of them (section 5). No application source was changed. Stated by card and activity throughout;
Admin is outside the card system and is never counted as a gap.

**Measured on** `claude/control-sweep-11-count` at `81f21d04` (= `origin/main` on 2026-11-09), dev, port 3005.
**Card count: 54**, read from `src/lib/permissions/cards.ts` through `scripts/lib/load-cards.mjs` on 2026-11-09. It
becomes 55 when `diets-one-card` merges. Every "which cards open it" below is computed the way the app computes it
(`bundleOfCards([card])`, one card alone), not by grepping `cards.ts`. The classifier is a throwaway script (not
committed); its method is: each `src/app/**/page.tsx`, its guard call (`requirePermission`, `requireAnyPermission`,
`requireFullResident`, `requireAdminUser`, `requireAnyPageIn`, `requirePageVisible`), and the single cards whose bundle
meets that guard.

## 1. The denominator: 167 pages, and the registry holds 54 of them

- **167 `page.tsx` files** under `src/app/` (dynamic segments counted once: `/residents/[id]` is one page).
- **54 entries in `ROUTES`** (`src/lib/permissions/routes.ts`). Every one of them has a page. **113 pages are not in
  the registry** — not only `/manual`. The registry lists the pages a person opens *because they hold an activity* and
  reaches from a tile; detail pages (`/maintenance/[id]`), forms (`/weight/new`), the resident hub, the public site and
  own-login pages are all outside it by design. So **the registry is not a denominator for this question**; the
  `page.tsx` count is, and that is the one used here.

The 167 split like this; only the last class can carry a card-gated control that a one-card login can test:

| Class | Pages | Why it is not a sweep's ground |
|---|---|---|
| Public site, sign-in, `/no-access` | 25 | no card; a visitor's own form (sweep-3 §5) |
| Own-login pages (`/my`, `/home*`, `/account/*`, `/manual`, `/releases`, `/assistant`, `/e/[id]`, `/r/[code]`) | 11 | no card by the sweep-3 §5 rule, or a redirect on a card read; `/assistant`'s panel was driven by sweep-8 |
| Redirect only (`/admin/role-draft`, `/management/medication-list`) | 2 | draws nothing |
| Section landings (`/admin`, `/management`, `/operations`) | 3 | tiles from the registry; no action control |
| Admin only (`requireAdminUser`): `/admin/assistant`, `/admin/recent-changes`, `/admin/security`, `/admin/security/verify`, `/admin/stocktaking` | 5 | outside the card system |
| **Opened by no card at all** (below) | 15 | no one-card login can open them, so none can be driven |
| **Card-reachable** | **106** | the ground |

**The 15 no card can open.** Each page's guard asks an activity at a level no card grants, so today only Admin sees
them. `check-ungranted-activities.mjs` already names every one of these activities (17 UNRULED, 2 ruled Admin-only,
2026-11-09 run):

- `reference.types` at edit (9): `/admin/blood-test-types`, `/admin/immunization-types`, `/admin/procedure-types`,
  `/admin/medications`, `/admin/units`, `/admin/diets`, `/admin/diets/[id]`, `/admin/diets/ingredients`,
  `/admin/diets/ingredients/[id]`. **`/admin/diets` is being fixed in this batch by `diets-one-card`.**
- `facility.enclosures` at edit (3, **Admin-only by Lutan's ruling of 2026-11-06**): `/admin/enclosures`,
  `/admin/facility-map` (sweep-8 drove its refusal half), `/admin/zones`.
- `system.status` at edit: `/admin/status`. `reports.cashflow` at edit: `/management/cashflow/fixed-outgoings`.
  `stock.usage` at edit: `/management/stock-usage`.

These are not undriven pages waiting for a sweep; they are **unopenable** until a card grants the activity, which is
`#n5r7k`'s unruled list, not this item's.

## 2. The numerator: 13 card-reachable pages have been driven

Read out of the decision files, not the item's prose:

| Page | Driven by |
|---|---|
| `/clinic-visits/[id]`, `/clinic-visits/[id]/edit` | sweep-6 (`2026-11-03-control-listing-sweep-6.md` §4) |
| `/projects/[id]` | sweep-9 §5, sweep-10 |
| `/projects`, `/maintenance/new`, `/photos/add` | sweep-10 (`2026-11-06-control-listing-sweep-10.md`) |
| `/maintenance/[id]` | sweep-10 (edit login), sweep-11 (read login) |
| `/management/sterilisation-drives` | `2026-11-07-control-gates-list-pages.md` |
| `/maintenance`, `/residents`, `/residents/[id]`, `/management/diets` | sweep-11 (this file, section 5) |
| `/residents/[id]/[section]` | sweep-11, **Housing and Photos tabs only** of the hub's ten sections |

Plus `/admin/facility-map`'s refusal (sweep-8), which sits in the no-card class above. Sweeps 1–5 and 7 drove nothing
(each file says so); sweep-8 drove only the header's `AssistantPanel` and that refusal.

**Undriven card-reachable pages: 106 − 13 = 93.**

## 3. The complement: 93 pages, and the 44 worth driving

The 93 split by how the page opens, which decides whether a drive can find anything:

### 3a. Opened at READ, or by a guard narrower than its controls: 37 pages

These are where a fault lives: a login that may only read reaches a page that draws write controls. **26 are worth
driving**; 11 are already proved in code (3c).

| Page | Guard | One-card logins that open it |
|---|---|---|
| `/admin/shop` | `shop.manage` read | `manage_shop_page` (it grants edit, so the read half needs no card; **edit is the only drivable half**) |
| `/admin/website`, `/admin/website/pages/[slug]` | `website.content` read + `website.propose` | `website`, `website_photos` |
| `/admin/who-does-what` | `roles.view` read | `who_does_what` |
| `/admin/who-does-what/details`, `/features` | own `refuseFor` | `who_does_what`; edit is Admin-only and aal2 |
| `/appointments`, `/upcoming-visits` | `medical.visits` read | `view_medical`, `medical_records`, `book_clinic_visits`, `dashboard`, `run_appeals`, `record_vet_care` |
| `/bills` | own, per-card content | `bills`, `record_delivery`, `do_maintenance`, `medical_records`… (each tab its own activity) |
| `/clinics`, `/clinics/[id]` | `clinics.list` read | 8 cards incl. `view_contacts`, `view_medical` |
| `/enclosures`, `/enclosures/[id]` | `facility.enclosures` read | 14 cards |
| `/management/cashflow` | `reports.cashflow` read | `view_cashflow` |
| `/management/expenses` | `reports.expenses` read | `view_expenses` |
| `/management/medications` | `stock.medications` read | `medicine_forecast` (edit granted by no card) |
| `/medical/diets`, `/operations/feeding-list` | `medical.diet` read | `feed_special_diets` + 5 |
| `/operations/medication-list` | `medical.prescriptions` read | `administer_medication` + 5 |
| `/memes`, `/memes/[id]` | `social.library` read | `meme_library`, `meme_add`, `meme_view` |
| `/reels`, `/reels/[id]` | `social.reels` read | `reel_library`, `reel_add`, `reel_view` |
| `/outreach` | `community.outings` read | `outreach_notes` |
| `/suppliers`, `/suppliers/[id]` | `suppliers.directory` read | `suppliers` (grants edit; `/suppliers/[id]` also asks `friends.manage`) |

### 3b. Opened at EDIT but drawing a control that asks ANOTHER activity: 18 pages

This is the class that produced `#d3cw7`: a page one card opens, with a control only a second card should see. Worth
driving with the opening card alone, to see the second card's control absent.

| Page | Opens on | Also asks |
|---|---|---|
| `/clinic-visits/new` | `visit.book` | `medical.visits`, `clinics.doctors` |
| `/contacts`, `/contacts/[id]` | `contacts.browse` | `contacts.directory`, `friends.manage` |
| `/deliveries` | `stock.delivery` | `stock.usage` (no card grants it) |
| `/management/campaigns`, `/[id]`, `/[id]/preview` | `appeal.run` | `donation.receipt`, `appeal.medical_photo` (no card) |
| `/management/events/[id]`, `/new` | `events.run` | `appeal.run`, `projects.folders` |
| `/management/purchasing` | `stock.purchasing` | `stock.count` |
| `/management/translations` | `translations.view` | `translations.manage`, `translations.propose` |
| `/medical/photos` | `photos.medical_add` | `photos.resident_medical` (no card) |
| `/outreach/[id]/edit` | `community.outings` | `social.library` |
| `/photos/approve` | `photos.approve` | `website.approve`, `photos.resident_manage` |
| `/procedures/new` | `medical.procedures` | `resident.microchip` |
| `/reels/[id]/edit`, `/reels/new` | `social.reels` | `resident.who_and_where` |
| `/stocktake` | `stock.count` | `stock.delivery` |

"Also asks" is a `can(perms, …)` found in the page's own folder; a control in a shared component further away would
not show here, so this list is a floor.

### 3c. NOT worth driving, and why: 49 pages

- **38 whole-page edit gates** — opened at edit on one activity and asking no other in their folder: the opening
  login can already do everything the page offers, so a drive can only confirm the page opens. Sweep-9 established
  mechanically that their action components reach a guarded page, and sweeps 2–5 compared each page's activity with its
  action's. They are: `/admin/intake-date`, `/bills/general`, `/bills/settings`, `/bills/utilities`, `/blood-tests/new`,
  `/diets/[id]/edit`, `/diets/new`, `/immunizations/new`, `/management/campaigns/new`, `/management/clinics`,
  `/management/clinics/[id]/doctors`, `/management/contacts`, `/management/contacts/new`, `/management/dashboard`, the
  six `/management/donations*` pages, `/management/events`, `/management/recurring-jobs`,
  `/management/shelter-friends`, `/management/shelter-friends/new`, `/management/sterilisation-drives/[id]`, `/new`,
  `/management/suppliers`, `/management/suppliers/new`, `/medical/weight`, `/memes/[id]/edit`, `/memes/make`,
  `/memes/new`, `/outreach/new`, `/prescriptions/[id]/edit`, `/prescriptions/new`, `/residents/new`,
  `/weight/[id]/edit`, `/weight/new`.
- **11 proved in code here**, read-opened but with a second gate on the action's own activity before any form draws:
  `/residents/[id]/edit` (`resident.record` edit, `placement.hospital`, `placement.rehome`), `/move`
  (`placement.move`), `/hospital` and `/hospital/return` (`placement.hospital`), `/rehome` and `/rehome/return`
  (`placement.rehome`), `/deceased` (`placement.death`), `/deceased/undo` (`placement.death_withdraw`, Admin-only by
  ruling), `/adoption-updates/new` and `/[updateId]/edit` (`AdoptionUpdatePage.tsx:67`, `resident.adoption_news`,
  also sweep-8), and `/maintenance/[id]/edit` (`can(perms, "maintenance.jobs")` at edit, `page.tsx:27`).

**So the drivable remainder is 26 + 18 = 44 pages**, of which the 18 in 3b are the likeliest to repay a drive.

## 4. What one card cannot show

Reachability is not a property of one card alone, and this count meets it in two places:

- **A page opened by a card that cannot test its write half.** `/admin/shop` opens on `shop.manage` read, but the only
  card holding it grants edit; `/suppliers*` likewise (`suppliers` grants edit). The read-only half of those pages can
  be reached by no one-card login. Not a fault — a limit of the method, said so.
- **Pages needing two cards together:** none found in this count beyond `/admin/diets` (`#d3cw7`, being fixed). The 15
  in section 1 need a card that does not exist, which is a different thing.

## 5. The three drives (dev, port 3005, one-card logins, reached by clicking from `/my`)

Chosen as the likeliest places for an ungated control: a page opened at read that carries writes, the most-opened
page in the app, and a page whose edit activity no card grants (so any write control drawn would be ungated).

1. **`dashboard` card on `/maintenance` → a job** (`maintenance.jobs` read). Dev held no jobs at all, so a job was made
   first with a `do_maintenance` login (**M-6932, "sweep11 drive job (disposable)"**, left in dev). Board: no *Log
   maintenance*, no drag hint (the `do_maintenance` login has both: correct). Job page: no status buttons, no photo add,
   no edit (correct). **Two faults found, not fixed** (another area's file, for the planner):
   - **F1. The enclosure name on a job is a link the login is refused.** `src/app/maintenance/[id]/MaintenanceJobView.tsx:177-184`
     draws `<Link href="/enclosures/{id}">` with no check; `/enclosures/[id]` asks `facility.enclosures` read
     (`routes.ts`). Pressed: **sent to `/no-access`.** The cards that open the job but not the enclosure are
     **`dashboard` and `bills`** (both carry `maintenance.jobs` read and no `facility.enclosures`). Fix shape: draw the
     link only when `can(perms, "facility.enclosures", "read")`, else the plain span the zone-wide branch already uses.
     Same shape as sweep-6's vet-visit "view" link.
   - **F2. The read-only notice promises photos the card does not grant.** The job page says *"You can view maintenance
     jobs and add photos, but not log or update them."* (`en.ts` `maintenance…readOnly`, shown at
     `MaintenanceJobView.tsx:248` whenever the login cannot edit). A `dashboard` or `bills` login holds no
     `maintenance.photos` and is shown no photo control, so the sentence is false for them. Wording, not access; the
     sentence should follow `canPhotos`.
2. **`view_residents` card on `/residents` → a resident → Housing, Photos** (`resident.record` read). List: no Register;
   ticking a row offers only *Download spreadsheet (1)*, which asks `resident.record` read (correct). Hub: no Edit,
   no Move/Hospital/Rehome/Deceased. Housing: history only. Photos: filters and the full-size viewer; no upload, delete,
   set-as-profile or move-folder (the 2026-10-27 fault that started the rule stays fixed). **Nothing found.**
3. **`food_forecast` card on `/management/diets`** (`stock.diets` read; no card grants edit). Draws only the date-window
   inputs (display, sweep-4's rule). Every link out is gated (`page.tsx:56,199-239`). **Nothing found.**

Screenshots were taken of each page in the session; none is committed (the repo is public and they show dev data).

## 6. The cost of the walk, from that measurement

- **Measured:** three drives took **10 minutes of wall clock** (00:03–00:13 UTC), the first 6½ of them because dev had
  no maintenance job and one had to be made with a second card. **Five logins** for three pages.
- **Context:** this session read 215k at the end of the drives, of which the transcript ("Messages") was 109k. The
  pre-drive figure was not recorded, so the drives' share is **an estimate, about 60k for three pages — call it 20k a
  page**, most of it the 2.7 kB sign-in snippet passing through twice per login and the screenshots.
- **The remainder:** 44 pages × ~20k ≈ **880k of context growth**, and each turn re-sends the whole session. **That is
  not one stream.** At 12–19 pages a stream (≈250–380k growth on a ~110k base) it is **three streams**, cut by area so each
  shares logins and dev data:
  - **(A) medical and residents' neighbours:** `/appointments`, `/upcoming-visits`, `/clinics*`, `/clinic-visits/new`,
    `/procedures/new`, `/medical/diets`, `/operations/feeding-list`, `/operations/medication-list`, `/medical/photos`,
    `/photos/approve`, `/enclosures*` (13).
  - **(B) stock, bills, suppliers, contacts:** `/management/medications`, `/deliveries`, `/stocktake`,
    `/management/purchasing`, `/bills`, `/suppliers*`, `/contacts*`, `/admin/shop`, `/management/cashflow`,
    `/management/expenses` (12).
  - **(C) fundraising, website, social, settings:** `/management/campaigns*` (3), `/management/events/[id]`, `/new`,
    `/management/translations`, `/admin/website*` (2), `/admin/who-does-what*` (3), `/memes`, `/memes/[id]`, `/reels*`
    (4), `/outreach`, `/outreach/[id]/edit` (19).
- **Or one stream, if a planner wants a cheaper answer first:** only 3b's 18 pages. Ten sweeps found nothing; this one
  found two small faults, both the *link offered then refused* shape. That shape — a link or notice that does not ask
  the destination's activity — is now the only kind any drive has found since sweep-6, which argues for a **code check
  for it** (every `href` to a registered route compared with the drawing page's `can`) before more browser walking.
  That is a suggestion for the planner, not filed.

## 7. Tooling notes

- `scripts/check-menu-coverage.mjs` was **not needed**: the count came from `page.tsx` + `routes.ts` + `load-cards.mjs`.
  It answers per role, which is `#av8rq`'s subject; this count did not block on it.
- `dev-signin.mjs` re-keys a `--cards` login each time it is run, so only the latest snippet works; switching cards
  costs one script run and one paste.
- Test data left in dev (disposable): job **M-6932** in Cat Zone / Cat Enclosure.
