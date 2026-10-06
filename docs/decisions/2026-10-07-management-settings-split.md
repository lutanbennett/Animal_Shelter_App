# 2026-10-07 — Management, Settings and Shelter Operations: every page slotted against Lutan's rule

**Status: PROPOSED. Nothing is moved by this PR.** The backlog item says to agree the
table with Lutan before building, so this is the table and the order of work.
Where a row is a judgement call it is marked **ASK** and listed at the end.

## The rule (Lutan, 2026-09-27, backlog item "Maintenance versus Setup")

- **Settings** = configurable items for the system: the lists and options other screens
  pick from, set up once and changed rarely.
- **Management** = operational information that is dynamic: records about real people and
  things that change as the shelter runs.
- **Shelter Operations** (new, same item) = doing the daily work.
- **The test:** if editing it changes what a dropdown elsewhere offers, it is Settings; if
  it is a record someone looks up or updates in the course of the work, it is Management.
  A page that mixes the two is split along that line.

## What the rule says about the inconsistency that prompted this

Four pages are on the wrong side by the rule, and one is on both:

1. `/management/diets` and `/management/medications` are, in part, **option lists** — the
   medication names, dose units, unit conversions and per-size diet quantities that
   prescription and diet pickers read — and they sit under Management.
2. Both pages are **also** live records: stock on hand, reorder lead time, safety stock,
   cost, and the 7/30-day forecast. That half *is* Management. So the rule does not move
   these two pages; it **splits** them (below), which is what the item itself says to do.
3. `/admin/enclosures` is a setup list (what exists) while `/enclosures` is the daily
   board (who is where). Both are right where they are; the board is the one that goes to
   Shelter Operations.
4. `/management/medication-list` is a read-only walking list for the round. It is neither
   a record nor a setting: it is daily work. It belongs in Shelter Operations.

## Every tile on both landing pages

| Page | Today | Proposed | Why | Phone? |
|---|---|---|---|---|
| `/admin/website` | Settings | **Settings** | Public-site wording and photos: configuration, changed rarely | Fits; keep |
| `/admin/enclosures` | Settings | **Settings** | The list of enclosures other screens pick from | Admin's, at night: desktop-only notice stands |
| `/admin/zones` | Settings | **Settings** | Same, for zones | Admin's: notice stands |
| `/admin/facility-map` | Settings | **Settings** | Drawing plans is setup; desk work | Admin's: notice stands (decision 2026-10-04) |
| `/admin/immunization-types` | Settings | **Settings** | Option list | Admin's: notice stands |
| `/admin/procedure-types` | Settings | **Settings** | Option list | Fits |
| `/admin/blood-test-types` | Settings | **Settings** | Option list | Fits |
| `/admin/frequencies` | Settings | **Settings** | Option list; already moved here 2026-09-24 | Admin's: notice stands |
| `/admin/security` | Settings | **Settings** | Accounts, roles, requests: system configuration | Fits |
| `/admin/recent-changes` | Settings | **Settings** | Audit of the system, not a record anyone works from | Fits |
| `/admin/status` | Settings | **Settings** | System health | Fits |
| `/admin/role-draft` | Settings (no tile) | **Settings** | Admin-only review aid, goes away when the draft is signed | n/a |
| `/management/dashboard` | Management | **Management** | The month's figures: derived from the dynamic records | Phone-first, no notice |
| `/management/contacts` | Management | **Management** | Records about real people | See "device notice" below |
| `/management/vets` | Management | **Management** | Records about real clinics | See below |
| `/management/shelter-friends` | Management | **Management** — **ASK** | Records of real businesses, but it also drives the public site, which is Settings-like | See below |
| `/management/recurring-jobs` | Management | **Management** | Rules, but who does them and the done/skipped record are live | Phone work for the 2IC |
| `/management/cashflow` | Management | **Management** | Spending forecast: dynamic | Phone-first, no notice |
| `/management/purchasing` | Management | **Management** | Orders: dynamic; already phone-first (#334) | Phone-first |
| `/management/stock-usage` | Management | **Management** | How counts moved: dynamic | Notice should come off |
| `/management/translations` | Management | **Management** | A work queue: rows appear and clear as people write | Phone-first |
| `/management/medication-list` | Management | **Shelter Operations** | Read-only list used on the round; staff, Head of Medical, Management all open it | Phone-first |
| `/management/medications` | Management | **Split** | Names, dose units, unit conversions → Settings; stock, cost, reorder, forecast → Management | Settings half: notice stands. Stock half: no notice (§ below) |
| `/management/diets` | Management | **Split** | Diet names, units, per-size daily quantities → Settings; stock, cost, forecast → Management | Same |

## Every left-nav entry

| Entry | Today | Proposed | Who, how often | Why |
|---|---|---|---|---|
| Home | top-level | **top-level** | Everyone, daily | The sign-in landing |
| My day / Appointments | top-level | **top-level** | Staff, volunteers daily; vets | Personal, not a section |
| Residents | top-level | **top-level** | Everyone, daily | The shelter's core record: too central to bury |
| Enclosures (`/enclosures`) | top-level | **Shelter Operations** | Staff daily | The board of who is where: daily work |
| Maintenance | top-level | **Shelter Operations** | Staff, Management | Jobs done daily |
| Stocktake | top-level | **Shelter Operations** | Staff, volunteers weekly | A field job (0091) |
| Deliveries | top-level | **Shelter Operations** | 2IC on delivery days | Recording a delivery is daily work |
| Projects | top-level | **Shelter Operations** — **ASK** | Management | Closer to running the shelter than to a record |
| Vets (`/vets`) | top-level | **Shelter Operations** — **ASK** | Everyone but a vet; a lookup a few times a week | The read side. `/management/vets` stays as the record editor, so the same data has two doors with different jobs |
| Contacts (`/contacts`) | top-level | **Shelter Operations** — **ASK** | Same | Same |
| Management | top-level | **Management** | Director by day on her phone; the 2IC | The records |
| Settings | top-level | **Settings** | The Director, at night | The setup |
| Medication list | tile under Management | **Shelter Operations** | Staff and the Head of Medical, each round | As above |

## The split pages

**Medications.** Today one table holds name, dose unit, cost, stock, reorder lead, safety stock,
label photo and the forecast, plus `UnitsPanel` (unit conversions) and the Merge action.
- **Settings → Medications:** name, dose unit, merge duplicates, unit conversions. Admin only,
  desktop-only notice stands.
- **Management → Medication stock:** stock on hand, count date, reorder lead, safety stock, cost,
  label photo, forecast, and the links to Stocktake / Deliveries / Purchasing. This is the
  phone page for the 2IC. The notice comes off.

**Diets** is the same shape: option list (diet name, unit, per-size daily quantities) in Settings;
stock, cost and forecast in Management.

**Cost per unit** stays on the Management side: it changes as suppliers change, so it passes the
"dynamic" test even though it sits on a list row. **ASK** if Lutan would rather prices be setup.

The split is the one piece of real engineering here: two pages over the same table, both guarded
by `stock.medications` / `stock.diets` today. The guards must be decided with `admin-role`.

## The device notice: partly overtaken, and the rule that replaces it

`2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md` already says: *a page may be
desktop-only only if Admin is the only role that can open it.* Applied to this table:

- **Keeps the notice:** every Settings page the Director uses at night (enclosures, zones, facility
  map, immunization types, frequencies, the new Settings halves of medications and diets).
- **Loses the notice:** `/management/contacts`, `/management/vets`, `/management/stock-usage`,
  `/management/purchasing` (already), and the Management halves of medications and diets. Each is
  opened by Management or the 2IC on a phone.
- The splits therefore have a second payoff: the half that is Admin's keeps its notice, the half that
  is the 2IC's drops it, instead of one page wearing a notice that is wrong for one of its two users.

## Who sees each side

A page's side implies who reaches it.
- Settings is gated to Admin (the Director at her desk, at night).
- Management is Admin and Management (the Director by day on her phone, the 2IC).
- Shelter Operations is gated per tile, by each page's own activity, like Management's tiles
  (`requireAnyPageUnder`). It opens for anyone who can open at least one tile, so **staff and
  volunteers will see a section in their sidebar that Management and Settings never showed them.**
  That is the intent, but it is the user-visible change.

Moving **medication-list** and **enclosures** from Management / top-level to Shelter Operations
changes no one's access: each is guarded by its own activity, not by its section. Moving a page
is cosmetic for access and real for navigation.

## What the home screens change

`src/lib/home/tiles.ts` and the jobs layer decide what each role's home offers, so Staff,
Volunteer and the Head of Medical mostly never open a sidebar section. The sections matter for
Admin and Management, who see the full sidebar, and for anyone following a link. That is why
Shelter Operations is cheap (one landing, one nav entry, nothing re-guarded) and the moves are
cheaper than they look: the value is for two roles, and the risk is in URLs, not in access.

## URLs and the redirect stubs

- Nothing in code, scripts or the manual links to `/admin/contacts` or `/admin/vets`. The only
  references are in decisions and the backlog. They are bookmarks and nothing else.
- **Recommendation: delete both stubs now, in the Shelter Operations PR.** They have been stubs
  for 16 days; the only readers are two people on phones, who open the app from Home. A stub that
  nobody removes is how `/admin/contacts` got here.
- **Policy for the moves this table makes:** keep a redirect from each old URL for **one release
  cycle after the move**, then delete it in the next release's clean-up. Record the removal date in
  the stub's comment so the next person does not have to guess.
- URLs that actually move: `/management/medication-list` → `/operations/medication-list`;
  `/enclosures`, `/maintenance`, `/stocktake`, `/deliveries`, `/projects`, `/vets`, `/contacts`
  **keep their URLs** and only change nav home (they are linked from the manual, notifications,
  email and the home tiles; the sidebar entry moves, the address does not).
  `/management/medications` and `/management/diets` stay as the Management stock halves; the new
  Settings halves are `/admin/medications` and `/admin/diets`.
- The **section name in the URL** is only worth a new prefix for the new landing (`/operations`).
  Renaming `/admin` to `/settings` was already judged not worth it (decisions.md, 2026-09-23).

## Proposed order of work (three PRs, in this order)

1. **Shelter Operations landing + nav.** New `/operations` page of tiles, nav entry, en/th, manual
   topic, release note. Moves **medication-list** under it with a redirect, and moves the nav
   entries listed above. No schema, no guard change. Delete the two old stubs. Touches
   `NavLinks.tsx`, `routes.ts` (registry rows), the dictionaries and manual: conflict-prone, so it
   goes alone.
2. **Split medications and diets.** Settings halves as new `/admin/medications` and `/admin/diets`;
   Management halves lose the option-list parts. Needs a guard decision with `admin-role`:
   Settings halves use the existing activities with level `edit`, Admin only, unless the Director's
   draft says otherwise. Migration-free (same tables).
3. **Device-notice sweep.** Drop `LargerScreenNotice` from the Management pages that lose it, and
   make `check-phone-width.mjs` the proof. Folds into the bare-buttons stream if that is still live.

Order matters: 1 first, because it removes nav churn; 2 only after `admin-role` has merged its guards.

## ASK (what this table cannot settle alone)

1. **Splitting medications and diets,** or leaving them whole under Management with the option-list
   parts (names, units, merge, conversions) simply left there? The rule says split; the cost is two
   pages where there is one today.
2. **Cost per unit:** Management (my proposal: prices change) or Settings (a figure you set once)?
3. **Projects, Vets and Contacts** as Shelter Operations tiles, or stay top-level?
4. **Shelter Friends:** Management (records of real businesses) or Settings (it configures the
   public site)?
5. **Stubs:** delete `/admin/contacts` and `/admin/vets` now?

When these are answered the item can be ticked as the PRs land. **The backlog item is not ticked
by this PR**: the rule is applied and the table is here, but nothing is built.
