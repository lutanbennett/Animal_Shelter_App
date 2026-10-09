# 2026-10-09 — The parity check read against §11: what checks each layer, and what it found

`roles-parity-reconcile`. Scripts and documentation only, no migration. The backlog
item *"Roles build, foundation 2: the parity check"* had been open for a week with a
contradiction in it: `scripts/check-permission-parity.mjs`'s header said *"Layer 1 of
§11 only … Layers 2 and 3 are not here"*, while
`2026-10-03-permission-parity-check.md` described a working Layer 2. This reads the
script against `docs/roles-and-permissions.md` §11 once, against a live run, and
records the answer. It does not rewrite the check.

## First: the check had stopped working the day Staff was retired

Run on `main` as it stood (dev at `0173`), the script **crashed before probing
anything**:

```
Error: harness did not return a result (status 400): Failed to run sql query:
ERROR:  23514: The Staff role is retired: choose another role for this login.
```

Its harness creates one login per role, Staff included, and `0173`'s new
`user_roles_take_live_role` trigger refuses a live login on an archived role. That is
the trigger doing its job; the check had not followed it. Nobody had noticed because
no conversion ran it between `0173` merging and this stream.

Fixed here, small and in the check only:

- **Staff is no longer a principal** in layer 1, nor compared with a default in layer 2.
  No live login can hold it, so there is nothing to reproduce. Its rows stay in
  `scripts/fixtures/legacy-predicates.json` as the record of what the old predicates
  said. The *archived person* still holds Staff, which is now exactly the
  retired-role case, and section Z still proves an archived role answers no.
- **Section Z's two controls** (an unknown activity answers no; a seeded cell answers
  yes) used the Staff login. They use Management, which holds `stock.delivery`.
- **C7's `known` entry** named staff and doctor; the staff half closed in `0147`, so it
  names the doctor only (keeping staff would have been a STALE failure for a role the
  check no longer runs).

And one more fault the first clean run showed, not caused by `0173`:

- **The immunization insert probe looked up a vaccine type under the role's own
  login**, `(select id from immunization_types limit 1)`. Management and Doctor
  cannot read `immunization_types` (the app reads `picker_immunization_types`, which
  needs `medical.immunizations` Read, and a doctor has no such cell), so the lookup
  returned null and the insert failed on the not-null column: a **harness fault**,
  so the probe tested nothing for either role. The harness now creates its own type
  and the probe names it (`$IMM_TYPE`). What a role can *look up* is not what that
  probe is asking.

**Result after the fixes:** layer 1 1,777 match / 22 known tightening / 21 mismatch /
0 harness fault; layer 2 clean; exit 1. The 21 are all the doctor's `has_permission()`
lines, which are a recorded decision, not a fault (below).

## What checks each of §11's three layers

| §11 layer | Checked by | Covered? |
|---|---|---|
| — (layer 0: the seeded cells) | `check-permission-parity.mjs`: `has_permission()` under each login against the paper's §4 table, both levels, all 60 activities | yes. Not one of §11's three, but it is what makes layer 3 provable for registered pages |
| **1. The database** | `check-permission-parity.mjs`: 260 probe runs × 7 principals (admin, management, doctor, volunteer, public_viewer, no role, archived person) in rolled-back transactions under each login's own JWT | **yes**, with the ten activities that have no database statement named and reasoned in `NO_DB_PROBE` (a new unprobed, unreasoned activity fails the run) |
| **2. The app's predicates** | `check-permission-parity.mjs`: 35 predicates × 6 roles including no role, against the default; the deleted ones compared through `legacy-predicates.json`. `canDoJob`'s rule for `/admin /management /maintenance` is `check-recurring-job-eligibility.mjs` | **yes**. The header said otherwise; the header was stale since the day layer 2 was added |
| **3. The routes** | `check-permission-catalogue.mjs` section E: every entry in `src/lib/permissions/routes.ts` has a `page.tsx` and that page guards with `requirePermission()` on the registry's own activity. With layer 0 proving the cells, that fixes who may open each registered page | **split, and incomplete** (below) |

**One caveat on the delegates: `check-recurring-job-eligibility.mjs` is red today**
(exit 1 on this branch and on `main`, run 2026-10-09). Three FAILs: E9 (`/contacts`
eligible roles are admin, management, second_in_command; the script wants admin,
management, staff, volunteer) and the fixture rows for `canDoJob(/management)` and
`canDoJob(/admin)`. It is not in `npm run lint`, so nothing saw it. It is already the
backlog item *"Eight dev check harnesses no longer start since the Staff retirement and
the doctor rename"* (found by `close-the-remaining-over-grants` the same day), which
leaves this stream's two scripts to it and the eligibility script to that item. Note for
whoever takes it: E9 is not only the Staff column (volunteer is missing and 2IC is
present, which looks like `0170`/`0171`'s contacts change), so "drop the staff
column" will not be enough to make it green.

### Layer 3 in detail

§11 asks for *"every route in the registry and every role: the registry's answer
against the page's guard today"*. The 2026-10-03 decision deferred it because the
registry did not exist. It does now (37 entries), and the comparison has been made
unnecessary for those pages in a better way: once every registered page *is* guarded by
`requirePermission(activity)`, the guard and the registry cannot disagree about a role
except through the activity key, which section E pins, or the cells, which layer 0
pins. **So layer 3 is consciously split across two scripts for registered pages, and
that is a legitimate answer.** The old guards' truth tables are layer 2's fixture.

**What nothing checks.** Counting every `page.tsx` under `src/app` on this branch:

| Pages | Guard | In the registry | Checked |
|---|---|---|---|
| 37 | `requirePermission()` | yes | yes (section E) |
| 26 | `requirePermission()` | **no** | **no** |
| 45 | something else, or public | no | partly, case by case |

The 26 are the detail, *new* and *edit* pages under a registered list:
`/residents/new`, `/weight/new`, `/weight/[id]/edit`, `/prescriptions/new`,
`/prescriptions/[id]/edit`, `/procedures/new`, `/blood-tests/new`, `/immunizations/new`,
`/diets/new`, `/diets/[id]/edit`, `/clinic-visits/new`, `/clinic-visits/[id]/edit`,
`/clinics/[id]`, `/contacts/[id]`, `/enclosures/[id]`, `/maintenance/new`,
`/maintenance/[id]`, `/maintenance/[id]/edit`, `/management/cashflow/fixed-outgoings`,
`/management/clinics/[id]/doctors`, `/management/donations/new`,
`/management/donations/[id]`, `/management/shelter-friends/new`, `/outreach/new`,
`/outreach/[id]/edit`, `/projects/[id]`. Each does guard itself, but **nothing asserts
which activity**, so an edit page guarded at Read, or on the wrong area's key, would
pass every check. The registry's own header says *"A page under it inherits nothing:
list each page"*; these 26 are not listed.

Of the 45, most are public (`/`, `/adopt…`, `/donate`, `/our-work…`, `/login…`) or the
hubs (`/admin`, `/management`, `/operations`, which ask `requireAnyPageIn()` and so
derive from the registry). **The resident pages are the gap worth naming:**
`/residents/[id]/edit`, `/move`, `/deceased`, `/hospital`, `/rehome` and their returns
open on `requireFullResident()` and then decide what to show with `can(perms, …)` in
the page body. No script checks those. (`check-placement-guards.mjs` and
`check-lifecycle-guards.mjs` are database triggers, not routes.) §11's suggested source
for this, the walkthrough's "must not" lines, is used by `acceptance-matrix.mjs` to
write the testers' sheets, not as an automated check.

**This is a finding, not a failure of this stream**, and it is now its own backlog item
(on the `backlog` branch, *"Parity layer 3: the pages outside the route registry"*).

## The twelve tightenings of §3 C, by name, both directions

§11: fail on a difference not in the list, and on a listed entry that no longer
differs. Both hold, and were shown to (test plan §4): `PARITY_FLIP` produced unlisted
MISMATCHes, `PARITY_FLIP_DB` a seeded-cell MISMATCH, and flipping the doctor's
`clinics.list` expectation turned C10's entry STALE ("Remove the entry").

Where the twelve stand on this run:

| Row | State |
|---|---|
| C3, C4, C5, C7, C10, C11 | **listed, still differ**, doctor only (the vet's access was deliberately left as it was: `2026-10-09-perm-convert-vet.md`) |
| C8, C12 | **listed as not a difference**, printed with the reason on every run (`NOT_A_DIFFERENCE`) |
| C1, C2, C6, C9 | **closed** (`0145`, `0144`/`0153`, `0147`, `0134`); their entries were removed when they went STALE, as the rule intends. Admin's outright resident delete (C2) is kept on purpose and matches the delete probes' admin-only expectation |

Plus N1 and N4, the check's own findings, still listed for the doctor. So *"listed by
name"* now means the open ones and the two non-differences; a closed row leaves the
script. That is the STALE rule working, not the list rotting, but it does mean the
script alone no longer shows all twelve: §3 C does.

## The standing red

The run ends `RESULT: RED` with exactly 21 lines, every one the doctor's
`has_permission()` answer: the paper gives a doctor 13 cells, the Director's draft
gives the microchip only, and the doctor's column was deliberately **not**
re-baselined (the script's own `RE-BASELINED` note; foundation 3's DECIDED note,
2026-10-07: *"do not tidy them"*). The header now says so, so a session does not take
the red for a regression, and so that any *other* line stands out: a 22nd mismatch, a
STALE or a harness fault is a real finding.

## What the backlog wording got wrong, for the next reader

- **"the six legacy roles"**: now five live ones. Staff is retired (`0173`); vet is
  `doctor` (`0172`). The check had already followed the rename.
- **The configured roles (2IC, Head of Maintenance, Head of Medical) are not
  principals of this check, on purpose**: they have no §4 column, so there is no
  "today" to reproduce; their cells are decisions, checked by `check-2ic-role.mjs`,
  `check-maintenance-role.mjs` and `check-medical-role.mjs`. Worth knowing for the
  *one role at a time* item: when a role converts there, parity is not the check that
  proves it.
- **"Green against today's policies"**: it is not green and will not be while the
  doctor decision stands. Green-but-for-the-21 is the bar.
- **"in CI once the tables exist"**: still not in CI (it needs dev credentials, as the
  2026-10-03 decision says). This stream did not change that; the crash above is what
  running it only by hand costs.
