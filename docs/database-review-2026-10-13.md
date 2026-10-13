# Database review — requested 2026-10-13, written 2026-10-13

A read-only review of the database behind Lanna Care for Animals: the 194 migration files in
`supabase/migrations/`, the decisions that explain them, and the **dev** database's own
catalogue as it stood on 2026-10-13 (every migration up to `0193` applied). Production was
not read, not connected to, not looked at — by the brief's rule, and because the only
production question that matters (does it match the files?) is answered under *What could
not be established*. Nothing was written: every statement sent was a `select` or an
`explain`, run as Supabase's read-only role, and all of them are listed in the test plan.

It builds on the architecture review of 2026-09-22 (`docs/architecture-review-2026-09-22.md`,
all fifteen items since closed) and says where it confirms, deepens or disagrees with it.

This repository is public. The report names tables, columns, functions and counts, and never
a person, animal, carer, adopter, donor, clinic or doctor. Where an example needs a value the
value is invented and says so.

---

## The five-minute version

**What it is.** One Postgres database on Supabase's free plan, about 30 MB used of the
500 MB allowed. Seventy-two tables, forty-nine views, a hundred and thirty functions, two
hundred and ninety row-level security policies, built in 194 numbered migration files over
twenty-four days. It holds the residents and where each one is, their medical history, the
food and medicine stock, the maintenance board, the people (logins, carers, volunteers,
vendors, clinics), the public website's text and pictures, and the donations register.

**Is it well built?** Yes, in the parts that matter. Who can see what is decided in one
place (`has_permission()` plus a handful of scope helpers) and every one of the 290 policies
uses it the efficient way. A visitor with no login can read exactly fourteen views and five
harmless functions, and nothing else — the best-constructed part of the database, and still
true. The audit log cannot be edited or deleted by anyone, including the database owner.
Donation receipts are numbered from a register row and never rewritten. A dead resident's
record is locked. Every migration is applied by one script that records what it did. None of
that needs touching.

**Is anything losing data or open to the wrong people?** No data loss was found. Nothing new
is open to the public. Of the four surprises the 2026-10-09 security probe found, three are
fixed on dev (`0170`, `0174`); the fourth — a clinic login can see the names and roles of
every login — is unchanged and was a deliberate choice, worth confirming once more. One small
thing is wider than intended: the website's text table (`site_content`) can be read by every
login including the public-viewer and clinic logins, and it carries one internal number (the
vet-visit budget estimate) that the public view deliberately leaves out.

**The one thing to act on this week.** The cutover plan (tentatively Friday 16 October)
builds the new production database from the migration files alone. **No database has ever
been built from all 194 files in one go**, and dev no longer matches the files in two
places: a column the files say is a whole number is a decimal on dev, and a column the files
say must always be filled in is optional on dev. Neither came from a file in the repository,
so they were changed by hand. A rebuild will reproduce the files, not dev, and the app was
tested against dev. The fix is a rehearsal: build a throwaway free project from zero, compare
its shape with dev's, and write one small migration that makes the files and dev agree. Half
a day, and it is the finding ranked first below.

**Wrong answers.** Three places still use the server's UTC date instead of the shelter's
Bangkok date (`0073` gave every later file `shelter_today()` for exactly this): the default
date on a maintenance bill, and two round-status views that nothing in the app reads any
more. A bill entered between midnight and 7 am Thai time without a date would be dated
yesterday; the forms always send a date, so this bites only a script. Ten minutes to fix.

**Speed.** Everything the app does is in milliseconds except the forecasts: the food forecast
averages 0.6 s and has taken 4 s, because each call rebuilds every resident's current state
and the cashflow page calls it once per month shown. On a page a manager opens now and then
this is fine; it is the first thing that will feel slow as the shelter grows, and the fix is
inside one function. Indexes: 11 are never used and one is an exact duplicate, which is what
you expect when every table fits on a few pages; drop the duplicate, leave the rest.

**Several shelters.** The 2026-10-09 spike's numbers hold (57 owner-run functions today
against its 58; 40 owner-run views against its 38, two added since). Nothing found here
changes its estimate. The earlier review's suggestion — one free Supabase project per shelter,
no `shelter_id` at all — remains the zero-cost shape for the first few shelters.

**What was not checked.** Production (by rule). Whether the policies behave as written when a
real login hits them — this review read them; the 2026-10-09 probe ran them, and nothing
read here contradicts what it found. The slow functions could not be `EXPLAIN`ed, because the
read-only role may not call them and the one way round that was refused by this session's
permission guard, so their cost is taken from the server's own statement statistics instead.
And the walkthrough of this summary with Lutan, which is the step after this PR.

**The findings, ranked** (details and ready-to-paste backlog items in §2):

| # | Finding | Why it matters | Fix |
|---|---|---|---|
| F1 | A from-zero rebuild has never been rehearsed, and dev drifts from the files in two columns | The cutover builds production from the files on Friday | Rehearsal on a throwaway project, one small migration — half a day |
| F2 | `site_content`, `site_pages`, `site_content_photos` readable by every login | One internal number visible to the public-viewer and clinic logins | Replace three `using (true)` policies — an hour |
| F3 | Deleting a login from the Supabase dashboard fails or silently succeeds depending on what they touched | Mixed delete rules on 54 links to `auth.users` | Decide one rule, one migration — an hour |
| F4 | The audit log watches 18 tables; 43 writable tables are outside it, including placements, logins' roles and the bills | No record of who moved a resident or added a bill | Add the trigger to the ones that matter — an hour |
| W1 | Three UTC-day leftovers (`bill_date` default, two unused views) | A bill dated yesterday before 7 am | Ten minutes, one migration |
| W2 | Food cost uses 0 to mean "no price"; medicine cost uses empty | Two conventions for the same thing; the forecast special-cases one | Small migration plus one form |
| P1 | Forecast functions cost 0.2–0.6 s a call, up to 4 s | The first slow page as the shelter grows | Rework one function body — half a day |
| P2 | `is_public_drive_file()` reads ~700 pages to answer yes or no | Every uncached public photo pays 30 ms | None now; shape noted |
| P3 | One duplicate index, 11 never used, 72 foreign keys without one | Nothing at today's sizes | Drop the duplicate |
| T1 | Leftover tables, views and functions nothing reads | Clutter that still has policies and grants | One drop migration |
| T2 | 76 policies say `to public`, the rest `to authenticated`; two FOR ALL doctor policies beside read ones | Harmless today; a trap for the next edit | Tidy when next touched |
| T3 | Early migrations are not re-runnable; one `add value` without `if not exists` | Only a replay harness notices | Nothing; know it |
| T4 | Naming: three vocabularies for the vet, three for dates | Reading cost | Nothing |
| T5 | Code numbers come from sequences that burn on every failed insert | Gaps in resident codes are normal, not lost animals | Tell the Director |
| T6 | Six polymorphic links with no foreign key; `updated_at` without a trigger on ten tables | Orphans are possible; all zero on dev today | A release-time orphan check |

---

## 0. Coverage: what was read, what was asked, and what was not

**Read in full.** All 194 files in `supabase/migrations/` (`0001` to `0193`, with `0191`
twice — `docs/decisions/2026-10-13-duplicate-0191-cannot-be-caught-by-the-number-check.md`);
`docs/architecture-review-2026-09-22.md`; `docs/decisions/2026-10-09-multi-tenancy-spike.md`;
`docs/security/security-assessment-2026-10-09-dynamic.md`; `docs/roles-and-permissions.md`;
`docs/utc-date-audit-2026-09-23.md`; `README.md`; `docs/test-plan-template.md`; the migration
runner (`scripts/apply-migrations.mjs`, `scripts/lib/migrations.mjs`, `scripts/lib/env.mjs`)
and the grants lint (`scripts/check-migration-grants.mjs`); and about thirty decision files on
the database (audit log, placement guards, medical soft delete, view grants, the over-grant
closures, `has_permission` without a cache, the enum drop, the service-role fence, the receipt
register, the red harnesses, the 0191 duplicate, `can_see_drive_file`).

**Asked of the dev database** (`qxkmhwybjggxvsfxsxbd`, Postgres 17.6), through the same
Management API endpoint the migration runner uses, with the API's `read_only` flag, which runs
the statement as `supabase_read_only_user`: fifty-odd `select`s over `pg_catalog`,
`information_schema`, `pg_stat_user_tables`, `pg_stat_user_indexes`,
`extensions.pg_stat_statements` (installed, 4,630 statements and 1.98 million calls recorded
since its reset on 2026-09-18), the enum, sequence, grant, default-privilege, trigger,
constraint, index, view-definition and function-definition catalogues, the roles and
permissions tables' shapes, and a handful of counts on the data tables (row counts,
orphan checks, audit-log shape). Two `explain analyze` runs on views succeeded; the seven on
functions did not (below). Every statement is in `docs/test-plans/fable-db-review.md`.

**Not done, by rule.** No connection to production. No write, no migration, no
`begin … rollback` harness, no `set role`, no statement run under a login's JWT. No row
data copied anywhere: the counts here are counts.

**Not done, by circumstance.** `explain analyze` on the forecast functions,
`is_public_drive_file()` and `resident_who_and_where` failed with *permission denied for
function*: the read-only role holds no `execute` on app functions (the default privileges
grant them to `authenticated` and `service_role` only, which is correct). The alternative —
the same `explain` run as `postgres` inside a read-only transaction — was refused by the
session's permission guard, which is the right outcome for a review whose rule is "never as
anything but read-only". Their cost is therefore taken from `pg_stat_statements`, which
records real calls by real logins and is the better number anyway.

**How "dead" was decided.** A table, view, function or column counts as read by nothing when
no file under `src/`, `worker/` or `scripts/` names it and no live view, function, policy or
trigger body names it either. Scripts were counted separately, because a check harness
reading a column is not the app reading it.

**Numbers on dev, 2026-10-13** (the appendix has the full table):

| | |
|---|---|
| Size | 29.7 MB of the free plan's 500 MB; largest table `audit_log` at 3.0 MB |
| Tables | 72 in `public`, none in `private` |
| Views | 49: 43 in `public` (34 run as their owner, 9 as the caller), 6 in `private`; 14 readable by `anon` |
| Functions | 130 (46 SQL, 84 PL/pgSQL); 57 `security definer`, all with `search_path` pinned |
| Policies | 290 (279 permissive, 11 restrictive); 0 bare `has_permission()` or `auth.uid()` calls |
| Triggers / indexes / constraints | 133 / 178 / 246 (150 check, 72 primary key, 23 unique, 1 constraint trigger) |
| Foreign keys | 127: 72 `no action`, 27 `set null`, 26 `cascade`, 2 `restrict` |
| Enums | 10 (`app_role` gone since `0181`) |
| Migrations applied | 194, first on 2026-09-20, last on 2026-10-13 |
| Logins and roles | 63 auth users, 62 role rows (14 archived); 9 roles (8 live, `staff` archived); 62 activities, 142 permission cells |
| Rows | the largest data tables hold a few hundred rows (attachments 342, placements 170, residents 90) |

---

## 1. The database as it is

### 1.1 In one paragraph

A single `public` schema carries the shelter; a `private` schema carries six views that the
Data API must never expose and that the public wrappers read through a gate. Residents are
the centre. Where a resident is — which enclosure, which carer, in hospital, adopted, dead —
is never stored on the resident row: it is an event log (`placement_history`), one open row
per resident enforced by a partial unique index, and the current state is a view derived from
it. Everything medical, dietary and photographic hangs off the resident id. Stock, maintenance,
people, website and donations are their own clusters, joined to the centre by foreign keys and
to each other hardly at all. Access is row-level security on every table, every policy
deciding through `has_permission(activity, level)` and a scope helper, both of which read the
`roles`, `role_permissions` and `user_roles` tables at call time so that archiving a person
bites on their next request. The public website reads fourteen `public_*` views and nothing
else. An append-only audit log, written by a trigger on eighteen tables, records before and
after images. Dates that mean "a day at the shelter" are `date` columns defaulted from
`shelter_today()`; moments are `timestamptz`. Money is `numeric` in baht, never a float.

### 1.2 The areas and how they connect

```
  VISITOR (no login)
      |  may read only these
      v
  +---------------------------------------------------------------------------+
  |  14 public_* views (run as owner; each filters to what is published)      |
  +------+--------------------------------------------------------------------+
         |  windows onto
         v
  +===========================================================================+
  |  RESIDENTS & PLACEMENTS                MEDICAL                            |
  |  residents --< placement_history       clinic_visits --< blood_tests      |
  |      |          (one open row each)        |         --< procedures       |
  |      |     resident_current_state (view)   +-- clinics --< doctor_clinics |
  |      |--< resident_diets --< *_rounds              >-- doctors (login)    |
  |      |--< prescriptions --< prescription_rounds    medication, frequency  |
  |      |--< immunization_records, weight             immunization_types     |
  |      +--< attachments (photos, PDFs; owner_type decides the parent)       |
  |                                                                           |
  |  STOCK & PURCHASING                    MAINTENANCE & BILLS                |
  |  medication, diet_types (stock cols)   zones --< enclosures               |
  |  stock_counts, stock_receipts            |-- facility_maps, map_rooms     |
  |  item_unit_conversions                 maintenance --< assignees, bills   |
  |  fixed_outgoings, cashflow functions   bills_inbox; recurring_jobs --<    |
  |                                          occurrences, assignees           |
  |  PEOPLE & ROLES                        WEBSITE & LANGUAGE                 |
  |  auth.users -- user_roles >-- roles    site_content, site_pages, photos   |
  |     roles --< role_permissions         project_folders, shelter_friends   |
  |     permission_activities              community_places, outings, photos |
  |  contacts (carers, volunteers,         translations, translatable_fields |
  |            vendors; carer on           label_sources, *_th columns       |
  |            placement_history)          impact_baselines                   |
  |                                                                           |
  |  DONATIONS                             CROSS-CUTTING                      |
  |  donations --< donation_lines          audit_log (18 tables, append-only) |
  |  donation_receipts, receipt_counters   status_alert_checks / _runs        |
  |  donation_channels                     assistant_actions, schema_migrations|
  +===========================================================================+
         ^
         |  every table: RLS on; policies ask has_permission() + a scope helper
  LOGIN (authenticated) -- user_roles -> roles -> role_permissions
```

### 1.3 Residents and placements

`residents` is the identity row: code (`R-` plus a four-digit number from a sequence), names
in two languages, species, size, sex, breed, colour, estimated age with the day it was
estimated, microchip (unique when present), temperament and public-profile fields, the Drive
folder and profile photo ids, and an optional `group_origin_id` (the batch it arrived with).
`placement_history` is the event log: `placement_type` (ten values, an enum), enclosure or
carer, `start_date`/`end_date` as `timestamptz` (the day-level rules — no tie, no move on an
earlier day — live in `src/lib/placements/dates.ts` and in the `0001` check), a `created_by`,
and `deceased_cascade`, a JSON note of what the death closed so `undo_deceased_placement()`
can reopen it. Triggers close the prior row, refuse a move into a Lifecycle pseudo-enclosure
except through the right function, and lock a dead resident's whole record unless a
transaction setting says the death is being undone. `resident_current_state` (owner-run, in
`private` with a gated wrapper in `public`) derives status, enclosure, carer and hospital
flags; `resident_list_view`, `resident_who_and_where` (`0192`) and the public views read it.
Adoption follow-ups (`adoption_updates`) and the deceased archive PDF hang off the resident.

### 1.4 Medical

`clinic_visits` (the table behind "vet visits") carries clinic, doctor, status, reason and cost;
`blood_tests`, `procedures` and prescriptions can reference a visit. `clinics` and `doctors`
(`0172`) replaced the old vet login: a doctor may hold a login, is linked to clinics through
`doctor_clinics`, and the composite foreign key on a visit guarantees the doctor works at that
clinic. `prescriptions` (medication, dose, frequency, start and end) get their rounds from
`prescription_rounds`, defaulted by trigger from the frequency's `frequency_rounds`; diets the
same through `resident_diet_rounds`. `immunization_records` and `weight` are soft-deleted
(`archived_at`, `0124`) with partial unique indexes that keep one live record per type per day
and one weight per day. `immunization_types.interval_months` drives `immunization_due_dates()`
and the compliance view. Doctor access is a second family of policies (`doctor_*`) scoped by
`current_doctor_resident_ids()` for reading and `current_clinic_resident_ids()` for writing.

### 1.5 Stock and purchasing

Stock is not a separate table: `medication` and `diet_types` carry `stock_on_hand`,
`safety_stock`, `cost_per_unit` and a label photo id; `stock_counts` records each stocktake
line (with the unit at the time), `stock_receipts` each delivery (quantity, unit, cost, a
vendor contact, and since `0189` a bill attachment), and `item_unit_conversions` says how
purchase and count units relate to the dose or serving unit. Writes go through
`record_stocktake()` and `record_stock_correction()`, definer functions that stamp the actor.
The purchasing and forecast views (`stock_medications`, `stock_diet_types`, `stock_vendors`,
the `*_forecast` functions) are read-only windows. `fixed_outgoings` and
`site_content.clinic_visit_estimate` feed `cashflow_forecast()`.

### 1.6 Maintenance and bills

`zones` and `enclosures` are the floor plan, with capacities, Thai names, a `protected` flag
for the Lifecycle pseudo-zone, map shapes and the uploaded plans in `facility_maps` (the one
private Storage bucket) and `map_rooms`. `maintenance` is the job board — status enum, zone or
enclosure, dates, estimated and actual cost, a job number from a sequence — with
`maintenance_assignees`, before/after photos as attachments, and `maintenance_bills` (`0189`)
whose sum the `maintenance_job_cost` view reconciles against `actual_cost`. `bills_inbox` is
the photographed-receipt queue. `recurring_jobs` with occurrences and assignees are the daily
chores.

### 1.7 People, logins and roles

Logins live in Supabase's `auth.users`; the app's view of them is `user_roles` (one row per
login, `archived_at` for offboarding, a deferrable constraint that keeps at least one admin)
joined to `roles` (`0132`: a row per role with `kind`, `opens_app` and five scope columns),
`role_permissions` (a cell per role and activity with a level) and `permission_activities`
(the 62 things a person can be allowed to do). `has_permission()`, `my_permissions()`,
`role_can()`, `holds_app_role()`, `is_admin()`, `is_clinic_login()` and the `sees_all_*` and
`on_volunteer_floor()` helpers all read these three tables. Changing roles needs a two-step
session: the three tables carry restrictive `*_requires_aal2` policies. `contacts` are the
non-login people — carers, volunteers, vendors — with contact channels and a soft archive;
pickers and the `doctor_contacts`/`volunteer_contacts` views narrow what each role sees of
them. `app_users` (private, gated) shows names and roles without emails to logins that open
the app.

### 1.8 Website and language

`site_content` is a one-row table (boolean primary key) for the home page — hero, tagline,
contact details, social links, visiting hours — with `site_content_photos` and the five
`site_pages`. `project_folders` with attachments are the "our work" stories; `shelter_friends`
the supporters' logos; `community_places`, `community_dog_outings` and their photos the
outreach; `impact_baselines` the starting numbers behind the public figures. Thai comes two
ways by design (`docs/decisions/2026-10-08-label-translations-schema.md`): short labels as a
twin `_th` column (`name_th`, `label_th`, `alt_th` and so on, across many tables, with
`label_sources` and `translatable_labels` tracking them), and free text through the
`translations` table (`table_name`, `row_id`, `column_name`, status enum) fed by
`translatable_fields` and queue triggers, approved rows surfacing through
`approved_translations()` and the public views.

### 1.9 Donations

`donations` (received on, channel, contact, recorded by) with `donation_lines`;
`donation_receipts` (`0168`) numbered from a `receipt_counters` row rather than a sequence
so a rolled-back issue cannot burn a number, with issuer and content snapshotted server-side
by `issue_donation_receipt()`, one live receipt per donation enforced by a partial unique
index, and `restrict` on the donation so a receipted donation cannot be deleted. `0191`
added `donation_channels` and its public view for the Donate page's buttons.

### 1.10 Cross-cutting

`audit_log` (`0121`): append-only — a trigger refuses update and delete for every role
including the owner — written only by `record_audit()`, which takes nothing from the caller;
on 18 tables today. `attachments` is the one polymorphic table: `owner_type` (nine values)
and `owner_id` with no foreign key, a sub-folder, phase (before/after), a Drive file id,
sort order, and a composite foreign key for adoption-update photos. `status_alert_checks`
and `status_alert_runs` are the System status page's memory; `assistant_actions` the
scripted assistant's log; `schema_migrations` the runner's ledger. Day handling: `0073`
introduced `shelter_time_zone()` (a constant, Asia/Bangkok), `shelter_today()` and
`shelter_date()`; 32 `date` columns carry days, 96 `timestamptz` columns carry moments, and
there are no naive timestamps and no floats anywhere.

### 1.11 Checked against README and the earlier review

README describes the roles correctly (a row of `roles`, not an enum), names the migration
folder and the runner, and does not describe the tables, so there is nothing for it to be
wrong about. The earlier review's §1.5 was written from the files and is out of date in its
counts: it said 68 tables, about 170 functions, 64 views, "roughly 90 live policies" and an
audit log on seven tables. Live on dev today: 72 tables, 130 functions, 49 views, 290
policies and 18 audited tables. The policy count matters because it was used to size the
multi-tenancy work — the spike (2026-10-09) counted 282 from the catalogue and was right. The
anonymous allow-list is fourteen views and five functions, not `0081`'s thirteen and
`0082`'s five.

---

## 2. Findings, ranked

Order: data loss and security first, then wrong results, then speed, then tidiness. Each
finding names what it touches, why a shelter would care, the fix, whether that fix is a
migration, and a rough size; the indented block under each is a backlog item written to be
pasted as it is. **This review raises none of them itself** — Lutan decides which to take.

### 2.1 Data loss and security

**F1. No database has ever been built from the files alone, and dev no longer matches them
in two columns.** — *High for the cutover; otherwise medium.*

*What.* `supabase/migrations/0001` to `0193`; `immunization_types.interval_months`;
`zones.internal`; `0159_enclosure_capacities_th.sql`; `0173`; `0020`;
`scripts/apply-migrations.mjs`.

*The facts.* Dev was baselined at `0027`. The current production project
(`dbkodyyxxhtygxcxmfcu`) was built from zero on 2026-09-21, when there were 63 files, and all
63 ran clean (README, *Deploying to Cloudflare*) — so the from-zero path has worked once, at a
third of today's length; the 131 files since have only ever run one at a time on a database
that already had the earlier state, and no database has run all 194 in one sequence. The cutover item
(`docs/backlog.md`, Deployment, tentatively Friday 16 October) stands up a new free project
and applies "every migration from zero". Two columns on dev are not what the files create:

| Column | The files say (`0007`, `0004`) | Dev has today |
|---|---|---|
| `immunization_types.interval_months` | `integer`, nullable | `numeric`, **not null** |
| `zones.internal` | `boolean not null default true` | `boolean` **nullable**, default true |

No file in the repository (`supabase/`, `scripts/`, `src/`) alters either, so both were
changed by hand or by a tool. Code was written against dev: `immunization_due_dates()`
divides by `interval_months` (numeric division today, integer division after a rebuild,
which changes the rounding of how many doses it steps through) and tests
`interval_months is not null` (true of the files, never of dev). Two more things a from-zero
run meets that an incremental one never did: `0159` is shelter data (capacities and Thai
names) in a schema file — on an empty project it updates nothing, which is fine, but it is
the reason the AppSheet import must run *after* the migrations and the same file never
re-runs; and `0173` stops if any live login still holds `staff`, which an empty project
cannot trip. The early files (`0001`–`0006`, `0012`, `0016`–`0020`, `0022`, `0024`) are not
re-runnable and `0020` adds an enum value without `if not exists`; neither matters on a
fresh database, both matter to a replay harness (T3).

*Why it matters.* The app has only ever been tested against dev's shape. A production built
from the files is a third shape nobody has run the app against, two days before go-live.

*Fix.* Rehearse: create a throwaway free project (the free tier allows two per organisation),
`node scripts/apply-migrations.mjs --env <rehearsal>` from zero, then compare its
`information_schema.columns` with dev's (two catalogue queries, diffed offline), then
`node scripts/import-appsheet.mjs --dry-run` against it. Write one migration that makes the
files say what dev has (or the other way round, chosen on purpose), apply it to dev, and
rebuild the rehearsal to prove the diff is empty. Keep the column-diff as a script so the
release manager can run it against production after the cutover. **Migration: yes, one small
file. Size: half a day.** Where the two edits came from could not be established from the
repository; the Supabase dashboard's table editor is the likely tool.

> - [ ] **Rehearse building production from zero before the cutover, and make the migration
>   files agree with dev's two hand-edited columns.** From the 2026-10-13 database review
>   (`docs/database-review-2026-10-13.md`, F1). No database has run all 194 files in one
>   sequence (dev was baselined at `0027`), and dev differs from the files in two columns:
>   `immunization_types.interval_months` is `numeric not null` on dev but `integer` nullable
>   in `0007`; `zones.internal` is nullable on dev but `not null default true` in `0004`.
>   Neither change is in any file in the repo. `immunization_due_dates()` was written against
>   dev's numeric column. **Do:** (1) a throwaway free project, `apply-migrations.mjs --env`
>   it from zero, `import-appsheet.mjs --dry-run` against it; (2) diff
>   `information_schema.columns` dev vs rehearsal and keep the diff as
>   `scripts/check-schema-drift.mjs`; (3) one migration that restates the two columns the way
>   dev has them (`alter column … type numeric`, `set not null`; `drop not null`) — or the
>   files' way, if that is decided — applied to dev, then rebuild the rehearsal until the diff
>   is empty. Migration: yes, small. Half a day. Blocks the cutover item.

**F2. The website's three content tables are readable by every login.** — *Low.*

*What.* `site_content`, `site_pages`, `site_content_photos`; policies
`public_read_site_content`, `public_read_site_pages`, `public_read_site_content_photos`
(`0018`, `0059`): `for select using (true)` to `public`. `0122` revoked `anon`'s grant, so a
visitor cannot reach them; the fourteen `public_site_*` views carry the public read. But every
`authenticated` login — the public-viewer role, an archived person, a login with no role, a
clinic login — reads the tables directly. `public_site_content` deliberately omits
`clinic_visit_estimate` (the cashflow page's vet budget); the table policy does not.

*Why it matters.* One internal number, and the contact and social columns, are readable by
logins the roles paper says see only the website's published face. The 2026-10-09 probe
recorded the five tables such logins can read and did not flag these three, so this is
confirmation plus one column, not a new hole.

*Fix.* Drop the three policies and replace them with
`using ((select has_permission('website.content', 'read')))`, which is what the admin
website page holds; the public views are unaffected (owner-run). **Migration: yes, a dozen
lines. Size: an hour with `check-public-views.mjs` and `check-app-access-gate.mjs` as the
proof.**

> - [ ] **The three website tables (`site_content`, `site_pages`, `site_content_photos`) are
>   readable by every login, not just the website editors — including the public-viewer and
>   clinic logins, and including `clinic_visit_estimate`, which the public view hides.** From
>   the 2026-10-13 database review (F2). `public_read_site_*` (`0018`, `0059`) are
>   `using (true)`; `0122` only revoked `anon`. Replace them with
>   `(select has_permission('website.content', 'read'))`; the `public_site_*` views keep the
>   public read. Migration: yes, small. An hour; `check-public-views.mjs` and
>   `check-app-access-gate.mjs` are the proof.

**F3. Deleting a login succeeds or fails depending on what that person once touched.** —
*Low.*

*What.* 54 foreign keys reference `auth.users(id)`: 30 with no delete rule (`no action`), 20
`on delete set null`, 4 `on delete cascade` (the assignee tables and `user_roles`). The
`no action` ones include `attachments.uploaded_by`, `residents.created_by`,
`placement_history.created_by`, `prescriptions.created_by`, `maintenance.created_by`,
`site_content.updated_by`; the `set null` ones include the receipt issuer, the archiver
columns and `stock_receipts.recorded_by`. `audit_log.actor` has no foreign key, on purpose.

*Why it matters.* The app never deletes a login — it archives the `user_roles` row — so
nothing is lost today. But the Supabase dashboard offers "delete user", and on dev
`supabase_auth_admin` has run that delete 1,018 times (harness users). The first time it is
used on a real person it either fails with a foreign-key error (they uploaded a photo) or
succeeds and quietly blanks their name from receipts and stocktakes (they only issued
receipts). Two outcomes for one action, decided by history.

*Fix.* Decide one rule and write it down. The defensible one is the current app behaviour:
logins are archived, never deleted, so every `created_by`/`updated_by` becomes `no action`
(a delete is refused, which protects the record) — or every one becomes `set null` if "delete
user" must work. **Migration: yes, mechanical. Size: an hour.**

> - [ ] **Decide what deleting a login does to the rows it created, and make all 54 links
>   to `auth.users` say the same thing.** From the 2026-10-13 database review (F3). Today 30
>   are `no action` (the delete fails), 20 `set null` (authorship vanishes), 4 `cascade`. The
>   app only archives logins, so the simplest rule is "never deleted": make the remaining
>   `set null` authorship columns `no action` and record the rule in `docs/decisions/`; the
>   alternative is `set null` everywhere so the dashboard's delete works. Migration: yes,
>   mechanical. An hour.

**F4. The audit log watches 18 tables; 43 writable tables are outside it, and script writes
carry no actor.** — *Low to medium (accountability, not loss).*

*What.* `record_audit()` (`0121`) runs on `residents`, `attachments`, `contacts`,
`clinic_visits`, `prescriptions`, `immunization_records`, `weight`, the donation tables,
`roles`, `role_permissions`, the community tables, `facility_maps` and `impact_baselines`.
Not on `placement_history` (every move, adoption, hospital stay and death),
`user_roles` (who holds which role), `maintenance`, `maintenance_bills`, `bills_inbox`,
`stock_receipts`, `blood_tests`, `procedures`, `resident_diets`, `zones`, `enclosures`,
`site_content`, `site_pages`, `recurring_jobs` or `medication`. Separately, `actor` is
`auth.uid()`, which is null for the service role: 1,402 of dev's 1,529 audit rows have no
actor. On production, `scripts/correct-resident.mjs` (the chat-driven duplicate delete) and
any other service-role write will log *what* changed with nobody named.

*Why it matters.* The decision of 2026-10-01 chose the list deliberately, and
`placement_history` has its own guards; but "who moved this dog on Tuesday" and "who gave
that person the management role" are the two questions an audit log exists to answer, and
neither is answerable today. Money tables (`maintenance_bills`, `stock_receipts`,
`bills_inbox`) are the third.

*Fix.* Extend the trigger to `placement_history`, `user_roles`, `maintenance`,
`maintenance_bills`, `bills_inbox`, `stock_receipts`, `blood_tests`, `procedures`,
`resident_diets` (nine `create trigger` lines). For scripts, let `record_audit()` fall back
to a transaction setting (`current_setting('app.actor', true)`) that the service-role scripts
set before writing, so the log names the person who asked. **Migration: yes, small. Size: an
hour, plus a line in each script.**

> - [ ] **Audit the moves, the role grants and the money: add `record_audit()` to
>   `placement_history`, `user_roles`, `maintenance`, `maintenance_bills`, `bills_inbox`,
>   `stock_receipts`, `blood_tests`, `procedures` and `resident_diets`, and let service-role
>   scripts name an actor.** From the 2026-10-13 database review (F4): 18 tables audited, 43
>   writable ones not, and 1,402 of dev's 1,529 audit rows have no actor because
>   `auth.uid()` is null for the service role. Nine trigger lines; `record_audit()` falls back
>   to `current_setting('app.actor', true)`, which `correct-resident.mjs` and friends set.
>   Migration: yes, small. An hour. Extends the 2026-10-01 audit-log decision rather than
>   reversing it.

**The 2026-10-09 probe's four surprises, re-read today.** (1) The clinic login's attachment
and translation policies are allow-lists now (`0174`): `owner_type` must be resident, blood
test or procedure, and the resident must be in the clinic's set — *closed*. (2)
`reset_prescription_rounds()`, `reset_frequency_rounds()`, `reset_diet_rounds()` are
executable by `postgres` and `service_role` only (`0170`) — *closed*. (3) `facility_maps` and
`map_rooms` are read through `private.has_app_access()` — *closed*. (4) `app_users` (names
and roles, no emails) is readable by any login whose role opens the app, which includes a
clinic login; `docs/decisions/2026-10-09-clinic-login-allow-lists.md` is where that was
weighed — *unchanged, by decision; not re-run with a doctor session here.*

**Things that look like findings and are not.** `receipt_counters`, `status_alert_checks`,
`status_alert_runs` and `schema_migrations` have RLS on and no policies: closed to the Data
API, reachable only by the service role and definer functions, which is the design.
`rounds_read using (true)` exposes the names of the medicine rounds to every login — the
probe recorded it, and it is a list of four words. The 76 policies written `to public` (T2)
reach only `authenticated` in practice, because `anon` holds no grant on any table — the
default privileges in `public` name `authenticated` and `service_role` only, and the grants
catalogue shows `anon` on nothing but the fourteen views and five functions. `anon` holds
`usage` on the `private` schema, as `0081` intends, and no object in it.

### 2.2 Wrong results

**W1. Three UTC-day leftovers.** — *Low (one real, two dead).*

*What.* `maintenance_bills.bill_date default current_date` (`0189`), while every other day
default in the database is `shelter_today()` or `shelter_date(now())`
(`maintenance.date_created`, `recurring_jobs.starts_on`, `overdue_from`,
`community_dog_outings.outing_on`). And `prescription_round_status` and
`resident_diet_round_status` (`0137`, `0138`) filter on `CURRENT_DATE` — the only two
`CURRENT_DATE` occurrences in any live view or function body — but nothing under `src/` or
`worker/` reads either view, nor `frequency_round_status`.

*Why it matters.* Between midnight and 07:00 in Thailand the server's date is yesterday. Both
bill forms send the date explicitly (`input.date || todayIso()`), so the default is reached
only by a direct insert — a script or a future assistant action — and then dates the bill a
day early. The two views give the wrong "due today" for seven hours a day to anyone who
starts reading them.

*Fix.* `alter table maintenance_bills alter column bill_date set default shelter_today()`;
drop the three `*_round_status` views or rewrite them on `shelter_today()`.
**Migration: yes, ten lines. Size: ten minutes.**

> - [ ] **`maintenance_bills.bill_date` defaults to the UTC day, and two round-status views
>   nobody reads filter on `CURRENT_DATE`.** From the 2026-10-13 database review (W1).
>   `0189` wrote `default current_date` where `0073`'s `shelter_today()` is the rule; the
>   forms send a date, so only a direct insert is dated a day early before 07:00 Thai.
>   `prescription_round_status`, `resident_diet_round_status` and `frequency_round_status`
>   (`0137`/`0138`) have no reader in `src/` or `worker/`: drop them, or move them to
>   `shelter_today()` if they are wanted. Migration: yes, ten lines. Ten minutes.

**W2. Food uses `0` for "no price yet"; medicine uses empty.** — *Low.*

*What.* `diet_types.cost_per_unit numeric not null default 0` (`0051`), the Diets form says
"leave 0 until you have a price", and `cashflow_forecast()` (`0183`) carries a comment
explaining that a zero food price is therefore a *missing* price and counts it as one.
`medication.cost_per_unit numeric` (`0071`) is nullable and null means unpriced, which the
same function handles the other way. `immunization_types.cost` follows the medicine
convention.

*Why it matters.* `diet_forecast()` returns `cost = 0` for an unpriced diet and only the
cashflow wrapper knows to distrust it; a free diet (a donation of food) cannot be told from
an unpriced one; and the next reader of `diet_forecast()` will get it wrong.

*Fix.* Make the column nullable, migrate `0` to null, change the form's hint, and let
`diet_forecast()` return null cost like the medicine side. **Migration: yes, small, plus one
form and one function. Size: a couple of hours.**

> - [ ] **One convention for "no price yet": make `diet_types.cost_per_unit` nullable like
>   `medication.cost_per_unit`, migrate `0` to null, and let `diet_forecast()` return a null
>   cost.** From the 2026-10-13 database review (W2). Today food says 0 and medicine says
>   null for the same state; `cashflow_forecast()` (`0183`) special-cases the food side and
>   a free diet cannot be told from an unpriced one. Migration: yes, small; the Diets form's
>   hint and one function body change with it. Two hours.

**Not a wrong result, but worth knowing.** Resident codes are `'R-' || lpad(nextval(...), 4)`
and maintenance job numbers come from a sequence too; a sequence value is consumed by any
insert that later fails or rolls back, so codes will have gaps — on dev the sequence stands
near 10,000 against 90 residents and a highest code under 3,000, from harness churn. On
production the gaps will be rare and are normal; a gap is not a missing animal (T5).

### 2.3 Speed

All figures are from `pg_stat_statements` on dev since 2026-09-18: real calls by real
logins and harnesses, on the free plan's shared CPU. Every table fits in a few pages, so
nothing here is a problem today; it is a map of where the first problem will appear.

**P1. The forecast functions are the only slow thing in the database.** — *Low today; the
first thing that will grow.*

| Function (called by `authenticated`) | Calls | Mean | Max | Pages read per call |
|---|---|---|---|---|
| `diet_forecast(p_from, p_to)` | 662 | 585 ms | 4.1 s | ~3,900 (≈31 MB) |
| `medication_forecast(p_from, p_to)` | 708 | 232 ms | 2.4 s | ~1,400 |
| `cashflow_forecast(p_from, p_to)` | 149 | 209 ms | 1.5 s | ~8,000 |
| `stock_medication_forecast` | 709 | 63 ms | 1.0 s | ~350 |
| `stock_diet_forecast` | 709 | 57 ms | 1.0 s | ~270 |

For comparison, `resident_list_view` reads in 14–40 ms, `my_permissions()` in 1.8 ms and
`current_user_role()` in 0.7 ms; the slowest plain table read in the top forty is the
recurring-jobs list at 3.9 ms.

*Why.* `diet_forecast()` joins `resident_current_state`, which derives every resident's state
from `placement_history` on each call, and `cashflow_forecast()` calls it once per calendar
month in the window through a lateral join (plus `medication_forecast()` the same way, plus
`immunization_due_dates()`); `medication_forecast()` calls
`prescription_doses_between()` per prescription. Thirty-one megabytes of buffer reads to
forecast ninety residents' food is the state view being rebuilt many times over. A plan could
not be captured (see §0); the shape is read from the bodies.

*Fix.* None needed before go-live. When it is wanted: compute the state once in a CTE inside
each function (or read `placement_history` with the open-row index directly), and have
`cashflow_forecast()` call each forecast once for the whole window and bucket by month,
rather than once per month. **Migration: yes (function bodies only). Size: half a day with a
before/after from `pg_stat_statements`.**

> - [ ] **Speed up the forecast functions: compute `resident_current_state` once per call
>   and call each forecast once per window, not once per month.** From the 2026-10-13
>   database review (P1). `diet_forecast()` averages 585 ms (max 4.1 s, ~3,900 buffer pages a
>   call) and `cashflow_forecast()` calls it and `medication_forecast()` once per month shown.
>   Not urgent — a page a manager opens now and then — but it is the only thing in the
>   database above 40 ms. Migration: yes, function bodies only. Half a day; prove it with
>   `pg_stat_statements` before and after.

**P2. `is_public_drive_file()` reads about 700 pages to answer yes or no.** — *Low.*

Called 3,328 times by `anon` (every uncached public photo request) and 994 by logins: mean
30 ms, max 2.3 s. It is `exists (… union all …)` over ten owner-run public views, each of
which joins and filters; a hit stops early, a miss walks all ten. `can_see_drive_file()`
(`0193`, C7's fix) is the cheaper shape — seven plain table lookups. The edge cache and the
photo route's own caching make the call rare in practice. Nothing to do now; if it shows up,
order the branches by likelihood or give the public views a shared "published file ids" view.
**Migration: would be; not proposed.**

**P3. Indexes: one duplicate, eleven never used, seventy-two foreign keys without one.** —
*Low.*

`placement_history_active_idx` is an exact duplicate of
`placement_history_one_active_per_resident` (same column, same `where end_date is null`);
drop it. Eleven non-unique indexes have never been scanned (`maintenance_status_idx`,
`maintenance_zone_id_idx`, `prescriptions_active_idx`, the three `*_round_id_idx`,
`assistant_actions_unmatched_idx`, `bills_inbox_created_idx`,
`community_dog_outings_place_idx`, `donation_receipts_issued_on_idx` and the duplicate),
because on tables of ten to three hundred rows the planner reads the table. Seventy-two
foreign-key columns have no index, which matters for deletes and joins only once a table is
large; `audit_log` (1,529 rows, three indexes) and `status_alert_runs` (1,608) are the only
tables over a thousand rows and both are append-only. Revisit when any table passes ten
thousand rows. **Migration: yes, one `drop index`. Size: minutes.**

> - [ ] **Drop `placement_history_active_idx` — an exact duplicate of
>   `placement_history_one_active_per_resident`.** From the 2026-10-13 database review (P3).
>   Eleven other non-unique indexes have never been used either, which is expected at
>   today's row counts; leave them and look again when a table passes ten thousand rows.
>   Migration: yes, one line. Minutes.

**P4. Policies cost nothing measurable.** `has_permission()` and every zero-argument helper
are wrapped `(select …)` in all 290 policies (zero bare calls, zero bare `auth.uid()`), so
Postgres evaluates them once per statement. The four helpers that take row columns
(`clinic_login_owns_visit`, `clinic_login_may_edit_doctor`, `attachment_resident_id`,
`doctor_can_write_attachment`, 29 uses) are per row by nature and sit on tables of at most
342 rows. `user_roles` shows 4.8 million sequential scans and `roles` 790 thousand — that
is the helpers reading a 62-row and a 9-row table the fast way. The 2026-10-09 measurement
(`has_permission()` ≈ 26 µs, no cache needed) stands.

**P5. Size and growth.** 29.7 MB used. `audit_log` is 3.0 MB (10% of the database) at about
1.4 kB per row, growing with every audited write; `status_alert_runs` adds roughly 65 rows a
day. At production rates — a few dozen writes a day, not dev's harness churn — the free
plan's 500 MB is years away, and neither table needs a retention rule yet. (The assistant
text retention question, DB-11, is already on the backlog.) The one large statement by a
non-app role — `pg_timezone_names` at 350 ms, 655 calls by `authenticator` — is PostgREST
reloading its schema cache after each migration on dev, not the app.

### 2.4 Tidiness

**T1. Leftovers nothing reads.** — *Low.*

- Tables `maintenance_photos` and `project_photos` (`0001`): zero rows; `0033` and `0034`
  moved both to `attachments`; still carry policies (`0152`), are still counted by the System
  status uploads tile (`src/lib/status/usage.ts`) and are still two of the seven branches of
  `can_see_drive_file()` (`0193`). `bulk_appointments` (9 rows) and
  `clinic_visits.bulk_appointment_id` (null on every row): no reader under `src/`.
- Views `frequency_round_status`, `prescription_round_status`, `resident_diet_round_status`
  (W1) and `immunization_duplicate_check` (both the `public` wrapper and the `private` view):
  read only by check scripts.
- Functions `record_immunization()` and `record_immunizations_bulk()`: executable by any
  login, called only by a check script; the app inserts into `immunization_records` directly.

*Fix.* One migration that drops them, after removing the two tile counts and the two
`can_see_drive_file()` branches in the same PR. **Migration: yes. Size: an hour.**

> - [ ] **Drop what nothing reads: `maintenance_photos`, `project_photos`,
>   `bulk_appointments` (+ `clinic_visits.bulk_appointment_id`), the three
>   `*_round_status` views, `immunization_duplicate_check`, `record_immunization()` and
>   `record_immunizations_bulk()`.** From the 2026-10-13 database review (T1). Check scripts
>   that name them go first; `src/lib/status/usage.ts` counts the two photo tables and
>   `can_see_drive_file()` (`0193`) still unions them. Migration: yes. An hour.

**T2. Two policy styles, and two doctor policies that both read.** — *Low.* 76 of the 290
policies (on 33 tables, the `doctor_*` family and the older `public_read_*`/`admin_*` ones)
are `to public`; the 214 written since the permission conversion are `to authenticated`. The
difference is invisible today because `anon` holds no table grant, and would stay invisible
unless someone granted `anon` a table — at which point `is_clinic_login()` is false for
`anon` anyway. On `immunization_records` and `weight`, `doctor_rw_*` is `for all` (which
includes select, scoped to the clinic's residents) beside `doctor_read_*` (scoped to the
wider doctor set); the union is what is intended, but a `for all` that also reads is the
kind of policy the next edit narrows by accident. `schema_migrations` grants `select` to
`authenticated` with no policy, so the grant is a no-op. Tidy when each table is next
touched; nothing to schedule.

**T3. Early migrations are not re-runnable, and twenty-eight check scripts still read
migration files.** — *Low.* `0001`–`0006`, `0012`, `0016`–`0020`, `0022`, `0024` predate the
rule; `0020` adds an enum value without `if not exists`. A database only ever runs each file
once, so this bites only a harness that replays old files — which the 2026-10-02 rule says
not to do (`docs/decisions/2026-10-02-replay-or-assert-live.md`); the grants lint reads the
files legitimately, and thirteen harnesses are red by decision (`2026-10-13-red-harnesses.md`).
Nothing to change; know it when a replay fails.

**T4. Naming.** — *Cosmetic.* Singular `weight`, `frequency`, `medication` beside plural
everything else. The vet appears as `clinic_visits` (table), `vet-visits` (route), `doctor_*`
(policies) and `clinic_login_*`/`current_clinic_*`/`current_doctor_*` (helpers) — three
vocabularies left by the `0172` rename, each internally consistent. The 32 `date` columns are
named `date`, `*_date` and `*_on` (`blood_tests.date`, `bill_date`, `received_on`). Thai
labels are `_th` twins on a dozen tables while free text goes through `translations`, which
is a design (2026-10-08), not drift. None of it is worth a migration.

**T5. Sequences burn.** — *Cosmetic.* See the note under §2.2. `donation_receipts` avoids this
with a counter row and is the pattern if resident codes ever need to be gapless.

**T6. Links without foreign keys, and `updated_at` without a trigger.** — *Low.*
`attachments.owner_id`, `translations.row_id`, `label_sources.row_id`, `audit_log.row_id`,
`stock_counts.stocktake_id` and `assistant_actions.result_row_id` point at rows by id with no
constraint, by design (polymorphic or historical). Orphan checks on dev: zero attachments
without an owner across all five owner types, zero resident translations without a resident,
zero residents without an open placement, one login without a `user_roles` row (a probe
user), and one resident whose `profile_photo_drive_file_id` has no matching attachment row
(dev data; the real-world case would be a profile photo deleted from the gallery). Of the
sixteen tables with `updated_at`, ten have no trigger setting it (`maintenance`,
`project_folders`, `site_content`, `site_pages`, `translations`, `donation_channels`,
`immunization_records`, `shelter_friends`, `community_dog_outings`, `status_alert_checks`),
so the column is only as true as every writer remembering it. *Fix:* a `check-orphans.mjs`
for the release smoke test, and one `set_updated_at()` trigger function on the ten. **Migration:
yes for the trigger, small. Size: an hour.**

> - [ ] **A release-time orphan check for the six id links that have no foreign key, and one
>   `updated_at` trigger for the ten tables that set it by hand.** From the 2026-10-13
>   database review (T6): `attachments.owner_id`, `translations.row_id`,
>   `label_sources.row_id`, `audit_log.row_id`, `stock_counts.stocktake_id`,
>   `assistant_actions.result_row_id` are unconstrained by design; all zero orphans on dev
>   today except one profile-photo id without an attachment row. `scripts/check-orphans.mjs`
>   for `docs/release-smoke-test.md`; a `set_updated_at()` trigger on the ten tables.
>   Migration: yes, small. An hour.

---

## 3. Against the 2026-09-22 architecture review

That review read the code; this one read the database. Where they overlap:

**Confirmed.**

- *The anonymous tier is the best-constructed part of the database* (§3 there). Still true, and
  now measured: `anon` holds `select` on fourteen views and `execute` on five functions
  (`is_public_drive_file`, `shelter_date`, `shelter_time_zone`, `shelter_today`,
  `approved_translations`) and nothing else — not one table, not one `private` object. The
  default privileges for new objects in `public` name only `authenticated` and `service_role`.
- *`has_permission()` in every policy, a live lookup rather than a JWT claim* (§3). All 290
  policies, all wrapped `(select …)`; `my_permissions()` and `current_user_role()` are the
  two most-called functions in the database and cost under 2 ms.
- *The audit log is append-only and written by a definer function that takes nothing from the
  caller* (§3). Confirmed from the live trigger and function bodies. Deepened: it covers 18
  tables, not seven, and 43 writable tables are outside it (F4).
- *The migration runner's discipline* (§3). Confirmed; `--upto` has since landed. Deepened by
  F1: the runner is sound, the files are not the whole truth about dev.
- *S6, the service-role fence.* Twelve importers of the admin client today (the review counted
  thirteen); the 2026-10-12 fence decision stands.
- *C8, multi-tenancy.* Agreed, and the spike's counts re-checked (§4).

**Resolved since, and verified here.**

- *S7 — some `security definer` functions do not pin `search_path`.* All 57 definer functions
  on dev carry a `search_path` setting (`''`, `public` or `pg_catalog, public`). Zero
  exceptions. The 2026-10-12 "search-path already pinned" decision was right.
- *C7 — an internal photo costs seven queries.* `can_see_drive_file()` (`0193`) exists, is
  security-invoker and `stable` as recommended, and the route calls it once. Two of its seven
  branches are the dead photo tables (T1).

**Corrected.** §1.5's numbers were derived from the files and undercount the live database
by a wide margin — 290 policies, not "roughly 90"; 72 tables, not 68; 130 functions, not
about 170; 49 views, not 64. The method (creates minus drops across files) cannot see
`create or replace`, which is most of the history. Anyone sizing database work should count
from the catalogue, as the 2026-10-09 spike did.

**Disagreed with, mildly.** Nothing in the earlier review's database statements is wrong in
substance. The one difference of emphasis: that review's §1.5 called the `0180`/`0181` pair
"the migration discipline at its best and its limit", meaning the runner's lack of `--upto`.
From the database's side the limit is different — the discipline governs what the files do
to the database, and nothing today checks what the database is against what the files say
(F1). `--drift` compares the ledger of applied filenames with `origin/main`, which is the
right first check and cannot see a hand edit.

**New here, not in scope there.** Everything in §2.3 (the earlier review did not look at
database speed), the column drift (F1), the website tables' read policy (F2), the login
delete rules (F3), the UTC leftovers (W1) and the two price conventions (W2).

---

## 4. Readiness for several shelters (briefly)

The 2026-10-09 spike (`docs/decisions/2026-10-09-multi-tenancy-spike.md`) is the reference and
nothing here changes its estimate (about 50 hours, pooled, one restrictive `shelter_id`
policy per table, re-owning the owner-run objects to a non-BYPASSRLS role). Re-checked
against the live catalogue:

| The spike counted | Today | Note |
|---|---|---|
| 69 tables (63 tenant, 6 global) | 72 | `donation_channels`, `maintenance_bills`, `bills_inbox` since |
| 58 `security definer` functions | 57 | one fewer after the `0180`/`0181` enum drop |
| 39 owner-run views (+13 public) | 40 owner-run of which 14 public | `public_donation_channels` since |
| 282 policies | 290 | |
| 19 per-shelter unique keys | 23 unique constraints + 19 unique partial indexes | the singletons are unchanged |

The things that "fought back" in the spike are all still present and unchanged:
`site_content`'s boolean primary key, `facility_maps_one_overview`,
`map_rooms_one_per_kind`, `diet_types_one_standard`, the receipt series literal, the
constant `shelter_time_zone()`, `user_roles` as one login one role (the two-roles backlog
item will meet this first), and triggers that stamp derived rows. Two things found here
would be cheaper to settle before a pooled build than after: F3 (one delete rule for logins,
because a pooled database shares `auth.users`) and T1 (fewer objects to re-own).

The earlier review's C8 note still reads right: for the first few shelters, **one free
Supabase project per shelter** needs no `shelter_id`, no re-owning and no new policies, only
the deploy tooling learning a shelter name — the zero-cost shape. The pooled build earns its
50 hours when a shared adoption listing or shared reporting needs one query across shelters
(the Chiang Mai five question on the backlog), not before.

---

## 5. What is good and should be left alone

Examined and found sound. Listed so the next reader can tell "checked and fine" from "never
looked at".

- **The anonymous tier**: allow-list by object (`0081`, `0082`, `0084`, `0191`), default
  privileges closed, a `private` schema for what the API must not see, the `has_app_access()`
  gate on the wrappers, `check-public-views.mjs` holding the list in CI. Fourteen views, five
  functions, nothing else.
- **One permission model, applied one way**: `has_permission()` and the scope helpers, every
  policy `(select …)`-wrapped, restrictive `*_requires_aal2` policies on the three role tables,
  a deferrable constraint trigger that keeps at least one admin, `roles` as rows so a shelter
  can one day have its own.
- **Residents as an event log**: `placement_history` with one open row per resident enforced
  by an index, the close-prior trigger, the Lifecycle pseudo-enclosure guard, the deceased lock
  with an explicit bypass setting, `deceased_cascade` so a wrong death can be undone, and the
  state derived in one view that every reader shares (`0192` finished the job).
- **Soft delete on the medical tables** (`0124`) with partial unique indexes that keep "one
  per day" true of live rows only.
- **The audit log** (`0121`): append-only for everyone including the owner, before and after
  images, writer takes nothing from the caller.
- **The receipt register** (`0168`, `0176`, `0177`, `0186`): a counter row, not a sequence;
  issuer, content and date decided server-side; one live receipt per donation; a receipted
  donation cannot be deleted.
- **Day handling** (`0073`): `shelter_today()`/`shelter_date()` are the default on every day
  column but one (W1); 32 `date` columns for days, 96 `timestamptz` for moments, no naive
  timestamps, no floats, money as `numeric`.
- **The composite foreign keys**: `clinic_visits (clinic_id, doctor_id)` onto `doctor_clinics`
  so a visit's doctor must work at that clinic; `attachments (adoption_update_id, owner_id)`
  onto `adoption_updates (id, resident_id)` so a follow-up photo cannot be attached to the
  wrong resident. Cheap, and exactly the kind of rule a form forgets.
- **Check constraints that carry the business rules**: 150 of them, 35 of which pin a text
  column to a list of values — `roles.kind`, the four scope columns, translation tiers, hex
  colours — so a typo in a script cannot create a sixth scope.
- **Stock writes through definer functions** (`record_stocktake()`,
  `record_stock_correction()`) that stamp the actor and the unit at the time.
- **The migration runner and its ledger**: per-file transaction, `schema_migrations` by
  filename (which is why the duplicate `0191` is harmless), `--dry-run`, `--status`,
  `--drift`, `--upto`, the `-- consumer:` header, the grants lint refusing a file that forgets
  its grants or its view revokes.
- **The decision record.** Forty-odd files explain why the database is the way it is; this
  review could answer "is that deliberate?" for every oddity it met from those files alone.

---

## 6. What could not be established

- **Production.** By the brief's rule it was not read. So: whether production carries the same
  two hand edits as dev (F1), whether it has any of its own, its sizes, its statement
  statistics and whether its `schema_migrations` matches `origin/main` are all unknown here.
  The release manager's `--drift --env production` answers the last; the column diff proposed
  in F1 answers the first two.
- **How the policies behave for a real login.** This review read the 290 policy bodies and
  the helper functions; it did not run a statement under any login's JWT (no `set role`, no
  harness). The 2026-10-09 dynamic assessment did, and nothing read here contradicts it. The
  reading is reassurance, not proof; a repeat of `probe-role-surface.mjs` is the proof.
- **The plans of the slow functions.** `explain analyze` on the forecast functions,
  `is_public_drive_file()` and `resident_who_and_where` could not run as the read-only role,
  and the alternative was refused (§0). The timings here are from `pg_stat_statements`; the
  cause is read from the function bodies.
- **Where the two column edits came from.** Not in any file in the repository. A dashboard
  edit is the likely tool; the date is unknown.
- **Whether the statistics describe production.** `pg_stat_statements` on dev records
  harness churn (hundreds of resident inserts and deletes, a thousand login deletes) alongside
  real use; the per-call costs are real, the call counts are not production's.
- **The walkthrough.** The five-minute summary is written for Lutan and has not yet been read
  with him; that is the next step after this PR.

---

## Appendix A — numbers measured on dev, 2026-10-13

| | |
|---|---|
| Server | Postgres 17.6 (Supabase free plan) |
| Database size | 29,674,643 bytes (29.7 MB); `audit_log` 3.0 MB, `status_alert_runs` 312 kB, `attachments` 296 kB |
| Schemas | `public` (72 tables, 43 views), `private` (6 views), plus Supabase's own |
| Views | 34 public owner-run, 9 public invoker, 6 private owner-run; 14 readable by `anon` |
| Functions | 130 (46 `sql`, 84 `plpgsql`); 57 `security definer` (36 volatile — triggers and writers), 57 of 57 with `search_path` set; 5 executable by `anon`; 110 by `authenticated` |
| Policies | 290: 279 permissive, 11 restrictive; 76 `to public`, 214 `to authenticated`; 0 bare `has_permission()`, 0 bare `auth.uid()` |
| Triggers | 133 |
| Indexes | 178; 11 non-unique never scanned; 1 exact duplicate; 72 foreign-key columns without an index; 19 unique partial indexes |
| Constraints | 246: 150 check (35 value lists), 72 primary key, 23 unique, 1 constraint trigger (deferrable); every table has a primary key |
| Foreign keys | 127: 72 `no action`, 27 `set null`, 26 `cascade`, 2 `restrict`; 54 reference `auth.users`; 11 reference `residents` (9 `no action`, 2 `set null`) |
| Enums | 10, 12 columns typed by them |
| Column types | 32 `date` (5 with a default, 4 of them shelter-day), 96 `timestamptz`, 0 naive timestamps, 0 floats, 29 `numeric` |
| Extensions | `pg_stat_statements` 1.11 (in `extensions`), `pgcrypto`, `uuid-ossp`, `supabase_vault`; `pg_graphql` not installed |
| Storage | one bucket, `facility-maps`, private, 5 MB limit, images and JSON only |
| Migrations | 194 rows in `schema_migrations` (two `0191`), 2026-09-20 → 2026-10-13 |
| Roles | 9 rows: admin 18 live logins, management 16, doctor 6, volunteer 3, second_in_command 2, head_of_medical 2, head_of_maintenance 1, public_viewer 0, staff (archived) 0; 62 activities, 142 cells |
| Logins | 63 in `auth.users`, 62 `user_roles` rows (14 archived), 1 login with no role row |
| Rows | residents 90, placement_history 170, attachments 342, clinic_visits 92, translations 96, audit_log 1,529 (1,402 without actor), status_alert_runs 1,608; `maintenance_photos` and `project_photos` 0 |
| Sequences | `residents_resident_number_seq` 9,851; `maintenance_job_number_seq` 4,790; `audit_log_id_seq` 127,731 against 1,529 rows |
| Statement statistics | 4,630 statements, 1,979,195 calls, 3,149 s total since 2026-09-18; by role: `authenticated` 1,546 s, `postgres` 724 s (harnesses), `authenticator` 352 s (PostgREST), `anon` 218 s, `service_role` 157 s |
| Hot tables | `clinic_visits_pkey` 4.7 M index scans; `user_roles` 4.8 M sequential scans; `roles` 790 k; `recurring_job_assignees` 393 k |

## Appendix B — the queries

Sixty distinct read-only statements (fifty-one numbered queries; a few re-run for a JSON copy, and three statement-statistics queries first written against the unqualified `pg_stat_statements` name, which failed, then against `extensions.pg_stat_statements`), every one listed with its SQL in `docs/test-plans/fable-db-review.md`. By purpose: q01–q07 tables,
views, functions, policies, grants, indexes and table statistics; q08 extensions and version;
q09 foreign keys and foreign keys without an index; q10–q13 columns, constraints, triggers,
enums; q14–q16 migrations ledger, roles, default privileges; q17–q18 view and function
definitions; q19–q25 sequences, schemas, other relations, storage buckets, the ledger's
grants, login and role counts; q26–q27 statement statistics (total, mean, by role, app reads);
q28–q30 unused and duplicate indexes, sizes; q31–q33 policy shapes, tables without policies,
owner-run views; q34–q35 date and numeric columns, all-null columns; q36–q41 audit-log shape
and size, translations, row counts, sequences against rows, orphan checks; q42–q49 the
`explain` batch and function volatility (two succeeded, seven refused for lack of `execute`);
q50–q51 function grants and numeric precision. All ran as `supabase_read_only_user` through
the Management API's `read_only` mode; none returned a row of personal data that was kept.
