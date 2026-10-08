# 2026-10-07 — Management, Settings and Shelter Operations: every page slotted against Lutan's rule

**Status: AGREED with Lutan on 2026-10-08.** He printed the proposal, marked it up by hand
(`Menu items.pdf`, under `LCA\` on his Desktop) and the rest was settled in chat. **31 of 35
rows matched the proposal**; the four he changed are folded into the tables below, so this file
is the single record. The questions it asked are answered at the end. The backlog item is
*"Review which pages belong under Management and which under Settings"* (agreement recorded in
`10bf3026`).

Proposed 2026-10-07, when nothing was moved. Building it is three PRs (order of work below);
**PR 1, the Shelter Operations landing and nav, is `claude/shelter-operations-nav`.**

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

| Page | Was | Agreed | Why | Phone? |
|---|---|---|---|---|
| `/admin/website` | Settings | **Management** (changed by Lutan) | The Director is Admin at night on her PC but **Management by day on her phone**, and the website is her job, so it must be reachable from the Management side. He said it twice. Keeps its `/admin` address | Fits; keep |
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
| `/management/contacts` | Management | **Management** | The contact **records**: add, edit, archive. Its lookup door, `/contacts`, is Shelter Operations | See "device notice" below |
| `/management/vets` | Management | **Management** | The clinic **records editor**. Its lookup door, `/vets`, is Shelter Operations | See below |
| `/management/shelter-friends` | Management | **Management** (answered) | Records of real businesses | See below |
| `/management/recurring-jobs` | Management | **Management** | Rules, but who does them and the done/skipped record are live | Phone work for the 2IC |
| `/management/cashflow` | Management | **Management** | Spending forecast: dynamic | Phone-first, no notice |
| `/management/purchasing` | Management | **Management** | Orders: dynamic; already phone-first (#334) | Phone-first |
| `/management/stock-usage` | Management | **Management** | How counts moved: dynamic. Lutan left the row blank; confirmed in chat as a skip, not a doubt | Notice should come off |
| `/management/translations` | Management | **Management** | A work queue: rows appear and clear as people write | Phone-first |
| `/management/medication-list` | Management | **Shelter Operations**, at `/operations/medication-list` | Read-only list used on the round; staff, Head of Medical, Management all open it | Phone-first |
| `/management/medications` | Management | **Split** (answered) | Names, dose units, unit conversions → Settings; stock, cost, reorder, forecast → Management | Settings half: notice stands. Stock half: no notice (§ below) |
| `/management/diets` | Management | **Split** (answered) | Diet names, units, per-size daily quantities → Settings; stock, cost, forecast → Management | Same |

## Every left-nav entry

| Entry | Was | Agreed | Who, how often | Why |
|---|---|---|---|---|
| Home | top-level | **top-level** | Everyone, daily | The sign-in landing |
| My day / Appointments | top-level | **top-level** | Staff, volunteers daily; vets | Personal, not a section |
| Residents | top-level | **top-level** | Everyone, daily | The shelter's core record: too central to bury |
| Enclosures (`/enclosures`) | top-level | **Shelter Operations** | Staff daily | The board of who is where: daily work |
| Maintenance | top-level | **Shelter Operations** | Staff, Management | Jobs done daily |
| Stocktake | top-level | **Shelter Operations** | Staff, volunteers weekly | A field job (0091) |
| Deliveries | top-level | **Shelter Operations** | 2IC on delivery days | Recording a delivery is daily work |
| Projects | top-level | **Shelter Operations** (answered) | Management | Closer to running the shelter than to a record |
| Vets (`/vets`, the lookup) | top-level | **Shelter Operations** (changed by Lutan: the doors split) | Management and staff; a lookup a few times a week | Checked on dev 2026-10-08: **`clinics.list` is held by `management = 2` and `staff = 1` (read)**. Staff look vets up. Management is a gated section they never see, so putting the lookup there would have taken it out of their menu: the page's own guard would not change, but nobody finds a page by URL on a phone. `/management/vets` stays as the record editor, so the same data has two doors with different jobs |
| Contacts (`/contacts`, the lookup) | top-level | **Shelter Operations** (answered; records stay Management) | **Management and the 2IC only** | The read side, as for Vets. *Correction:* this row said *"everyone but a vet"* when it was proposed, which was already stale — **`0155` restricted `contacts.browse` to `management` and `second_in_command`**, so staff and volunteers cannot browse contacts at all. The tile is simply absent for them |
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

**Cost per unit stays on the Management side** (answered): it changes as suppliers change, so it
passes the "dynamic" test even though it sits on a list row.

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
- Shelter Operations is gated per tile, by each page's own activity, like Management's tiles. It
  opens for anyone who can open at least one tile, so **staff and volunteers will see a section in
  their sidebar that Management and Settings never showed them.** That is the intent, but it is the
  user-visible change.

Moving **medication-list** and **enclosures** from Management / top-level to Shelter Operations
changes no one's access: each is guarded by its own activity, not by its section. Moving a page
is cosmetic for access and real for navigation.

**The one deliberate access change is the website.** Moving `/admin/website` to Management only
works if Management can open it, and today it cannot: Admin reaches it because `can()` passes Admin
everything (`src/lib/permissions/can.ts`, `if (perms.isAdmin) return true`), so `website.content`
is held by **nobody**. Lutan's decision therefore means **granting the `management` role
`website.content` at Edit**, and accepting what follows from it: **anyone holding the Management
role can change the public site.** It also answers the question `baseline-impact-figures` filed
rather than granting itself — *does Management hold `website.content`?* — **yes.**

Found while building PR 1: the cell alone is not enough. The tables the page writes —
`site_content`, `site_content_photos` and `site_pages` — still have write policies of
`is_admin()` (as `0153` left them), so with only the cell a Management login would open the page
and have every save refused by the database. Making the grant real also means rewriting those three
policies to `has_permission('website.content')` (Admin is unchanged: `has_permission` passes
Admin through). That is a wider schema change than the single row the brief described, so it is
Lutan's to approve before it rides in a migration.

## How the sections are decided in code (PR 1)

The landings and the sidebar used to ask "can this person open any page whose URL is under
`/management` (or `/admin`)?". That stops being true the moment a page keeps its address and moves
section, which is most of this table: `/enclosures` and the rest keep their URLs and sit under
Shelter Operations, and `/admin/website` keeps its URL and sits under Management. So the route
registry (`src/lib/permissions/routes.ts`) now carries the section: an entry's own `section`, or,
when it has none, the one its URL is under (`sectionOf`). The three landing guards
(`requireAnyPageIn`) and the three sidebar entries (`opensAnyIn`) ask that one question, so a page
is counted in exactly one section and the menu and the landing can never disagree. A section's
menu entry also lights up while you are on any page in it.

## URLs and the redirect stubs

- Nothing in code, scripts or the manual links to `/admin/contacts` or `/admin/vets`. The only
  references are in decisions and the backlog. They are bookmarks and nothing else.
- **Deleted in PR 1** (answered): they had been stubs since 2026-09-21.
- **Policy for the moves this table makes:** keep a redirect from each old URL for **one release
  cycle after the move**, then delete it in the next release's clean-up. Record the removal date in
  the stub's comment so the next person does not have to guess.
- URLs that actually move: `/management/medication-list` → `/operations/medication-list`;
  `/enclosures`, `/maintenance`, `/stocktake`, `/deliveries`, `/projects`, `/vets`, `/contacts`
  and `/admin/website` **keep their URLs** and only change where they sit in the menu (they are
  linked from the manual, notifications, email and the home tiles; the menu entry moves, the
  address does not).
  `/management/medications` and `/management/diets` stay as the Management stock halves; the new
  Settings halves are `/admin/medications` and `/admin/diets`.
- The **section name in the URL** is only worth a new prefix for the new landing (`/operations`).
  Renaming `/admin` to `/settings` was already judged not worth it (decisions.md, 2026-09-23).

## Order of work (three PRs, in this order)

1. **Shelter Operations landing + nav.** New `/operations` page of tiles, nav entry, en/th, manual
   topic, release note. Moves **medication-list** under it with a redirect, and moves the nav
   entries listed above. No page guard changes. Delete the two old stubs. Website moves to the
   Management landing. Touches `NavLinks.tsx`, `routes.ts` (registry rows), the dictionaries and
   manual: conflict-prone, so it goes alone. *(`claude/shelter-operations-nav`.)*
2. **Split medications and diets.** Settings halves as new `/admin/medications` and `/admin/diets`;
   Management halves lose the option-list parts. Needs a guard decision with `admin-role`:
   Settings halves use the existing activities with level `edit`, Admin only, unless the Director's
   draft says otherwise. Migration-free (same tables).
3. **Device-notice sweep.** Drop `LargerScreenNotice` from the Management pages that lose it, and
   make `check-phone-width.mjs` the proof. Folds into the bare-buttons stream if that is still live.

Order matters: 1 first, because it removes nav churn; 2 only after `admin-role` has merged its guards.
The `website.content` grant is a schema change, so it rides in whichever migration is in flight when
Lutan approves it (only one branch may carry one), not in PR 1.

## The questions, answered (Lutan, 2026-10-08)

1. **Split medications and diets?** **Yes.** PR 2.
2. **Cost per unit: Management or Settings?** **Management**, because prices change.
3. **Projects, Vets and Contacts as Shelter Operations tiles, or top-level?** **Shelter Operations,
   all three.** He confirmed this over the table's `M` marks. It is consistent with the Vets and
   Contacts rows above because **only the lookup doors move**; the records pages stay in Management.
4. **Shelter Friends: Management or Settings?** **Management.**
5. **Delete the `/admin/contacts` and `/admin/vets` stubs now?** **Yes, in PR 1.**

The backlog item is ticked when all three PRs have landed, not before.
