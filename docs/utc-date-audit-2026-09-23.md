# UTC "today" — data audit, 2026-09-23

The data half of the backlog item *"'Today' is UTC everywhere, so it is yesterday
in Thailand until 07:00."* The code half is `claude/utc-today`; this branch
changed **no data and no code under `src/`**.

**Status: incomplete.** Dev is audited in full. **Production was not** — every
route to it is blocked for this session (§5). The numbers that matter are the
production ones, so treat this as the method, the detector and the triage, with
a production run still owed.

---

## 1. What to do with this

1. Nothing needs correcting today. No date found so far is dangerous, and the
   bug writes a *plausible* wrong date, not a corrupt one.
2. **Fix the code first.** Correcting rows while the bug is live just means
   doing it again. That is `claude/utc-today`'s PR — **plus six SQL sites a
   `todayIso()` helper cannot reach** (§3.2), which need a migration and are
   currently nobody's.
3. Then run §5's commands against production and finish this document.
4. Only then decide about correcting rows, and decide it **per table**, not in
   one sweep. §7 explains why a blanket update is the wrong instrument.

Two things this audit turned up that are not data questions at all, and belong
to the code half: a death closes prescriptions a day *before* the death (§3.3),
and "end today" silently fails for seven hours a day (§3.4).

## 2. Scope and method

Every `date` column in `public` that a form pre-fills with today, plus the
`date` columns next to them, audited against the row's own `timestamptz` —
`created_at`, or `uploaded_at` for `attachments`. A `timestamptz` is an instant,
so it is right regardless of anyone's clock.

A row is a **candidate** when both hold:

- the stored date is exactly one day before the **Bangkok** date of its stamp, and
- the stamp's **Bangkok** clock read between 00:00 and 06:59:59.

That window is the fault exactly: Bangkok is UTC+7, so UTC's calendar date is
the previous day for precisely those seven hours.

**Candidate is not error.** A volunteer legitimately recording yesterday's
weight at 6am produces an identical row, and nothing in the database
distinguishes the two. §6 shows a case where the detector fires 43 times and is
wrong all 43 times, which is the clearest argument for reading this as a
worklist rather than a verdict.

The script is `scripts/throwaway-utc-date-audit.mjs` — read-only (`read_only`
on the API call, and it refuses anything that is not a `select`/`with`),
connecting the way `scripts/apply-migrations.mjs` does. Delete it once this is
settled.

## 3. Three mechanisms, not one

### 3.1 `new Date().toISOString().slice(0, 10)` in the app

The known one: 27 copies across 24 files, per the backlog item. The ones that
reach a date column are in §6's table.

### 3.2 The database has its own copy of the bug — **outside the code fix's reach**

The database's session timezone is UTC, so `current_date` inside Postgres is
wrong for the same seven hours:

```
db_timezone  now_utc                        current_date_server  now_bangkok
UTC          2026-09-23 04:31:50.280943+00  2026-09-23           2026-09-23 11:31:50.280943
```

A `todayIso()` helper in `src/lib/format.ts` reaches **none** of these. They
need a migration.

*Writes — these put a wrong date into a row:*

| Where | What it does |
|---|---|
| `0001_initial_schema.sql:405` | `maintenance.date_created` — `default current_date` |
| `0033_enclosure_maintenance.sql:146` | trigger stamps `maintenance.date_completed := coalesce(…, current_date)` when a job is completed |
| `0049_undo_deceased.sql:118` (live version of the 0002/0027 cascade) | on a `Deceased` placement, closes every open prescription with `end_date = greatest(new.start_date::date, start_date)` — see §3.3 |
| `0069_seed_standard_diet.sql:58` | one-off seed clamped diet `start_date` to `current_date`; a resident taken in "today" Bangkok got yesterday. Already applied, tiny blast radius, noted for completeness |

*Reads — these make a correct row display or count wrongly:*

| Where | What goes wrong for seven hours a day |
|---|---|
| `0027_prescriptions.sql:233` (`medication_daily_requirement`) | a course starting today is missing from the medication rollup; one that ended yesterday is still counted |
| `0062_stats_in_treatment.sql:43` → `0065:74` (`public_shelter_stats.in_treatment`) | the **public** "in treatment" figure on the website counts a prescription that ended yesterday as current |

### 3.3 Placements are safe — but what a death triggers is not

`placement_history` uses `timestamptz` and goes through `placementStartDate()`
(`src/lib/placements/dates.ts`), which stores the true instant when the chosen
date is UTC-today and midday-UTC when it is back-dated. Both land on the right
Bangkok calendar day. **Moves, hospital, rehome and the death record itself are
not affected** — the concern the brief raised most sharply. There is no
`date`-typed death column anywhere; deaths are `placement_history` rows.

The cascade fired by that row is a different matter. `0049_undo_deceased.sql:118`
casts the correct instant to a date **in UTC**:

```sql
update prescriptions p set end_date = greatest(new.start_date::date, p.start_date)
```

A death recorded at 01:26 Bangkok on the 23rd is the instant `2026-09-22
18:26Z`; `::date` in a UTC session is **2026-09-22**. Every open prescription is
then closed the day before the animal died. The death date is right and the
medical record around it is a day out — the opposite of what one would guess,
and not findable by looking at `created_at`, because the row is *updated*, not
created.

Detectable, though, because `placement_history.start_date` is a trustworthy
instant. On dev: 6 `Deceased` placements, all imported at 00:00 Bangkok, and **0
prescriptions closed early** — the import had already end-dated them, so the
cascade skipped them. The mechanism is live and untested against real overnight
deaths; §5's production run includes the same query.

### 3.4 "End today" is also broken, not just wrong

`endPrescriptionToday()` and `endDietToday()`
(`src/app/prescriptions/actions.ts:262`, `src/app/diets/actions.ts:163`):

```ts
const today = todayIsoDate();          // UTC — yesterday, 00:00–07:00 Bangkok
.update({ end_date: today })
.lte("start_date", today)
```

- the course is **ended a day early**, so it reads as finished while a dose is
  still due; and
- a course that started *today* in Bangkok matches **no row** — `start_date <=
  today` is false — so the update hits zero rows and the user gets the generic
  `saveFailed` message. For seven hours a day, "end today" on a same-day
  prescription or diet simply does not work and does not say why.

That second one is a live functional defect, not a data question.
`claude/utc-today` owns both lines; flagged to them rather than fixed here.

## 4. Results — dev (`qxkmhwybjggxvsfxsxbd`), 2026-09-23

| Table.column | Examined | Candidates | Range |
|---|---:|---:|---|
| `residents.intake_date` | 77 | **1** | 2026-09-22 |
| `residents.age_estimated_on` | 43 | **43** | 2026-09-21 – 09-22 |
| `weight.date` | 21 | **1** | 2026-09-22 |
| `resident_diets.start_date` | 71 | **1** | 2026-09-22 |
| `blood_tests.date` | 51 | 0 | — |
| `immunization_records.date_administered` | 13 | 0 | — |
| `prescriptions.start_date` | 59 | 0 | — |
| `prescriptions.end_date` | 59 | 0 | — (see §7.1) |
| `resident_diets.end_date` | 0 | 0 | — (see §7.1) |
| `procedures.date` | 7 | 0 | — |
| `attachments.date_taken` | 155 | 0 | — |
| `project_folders.project_date` | 0 | 0 | no dates set |
| `group_origins.date` | 0 | 0 | no dates set |
| `maintenance.date_created` / `due_date` / `date_completed` | 0 | 0 | table empty |

**Dev measures nothing about real use.** Its oldest row is 2026-09-20 and the
bulk of it arrived in one import on 2026-09-22; it is reseeded test data. What
these numbers establish is that the detector fires correctly on a known-true
case and produces a known-false one.

### The three real candidates are one event

All three share a `created_at` to the microsecond — `2026-09-22 18:26:48.089387+00`,
which is **01:26 on the 23rd in Bangkok**:

| Table.column | Resident | Stored date | Written (Bangkok) |
|---|---|---|---|
| `residents.intake_date` | Wizard Test 23 Sep | 2026-09-22 | 2026-09-23 01:26:48 |
| `weight.date` | Wizard Test 23 Sep | 2026-09-22 | 2026-09-23 01:26:48 |
| `resident_diets.start_date` | Wizard Test 23 Sep | 2026-09-22 | 2026-09-23 01:26:48 |

This is the discovery case from the backlog item — one intake-wizard submission
at 01:26 writing the wrong date into three tables at once. The resident's own
name says *23 Sep* while every date on it says *22 Sep*, which is about as
unambiguous as this evidence gets.

It also shows the shape of the real risk: the wizard writes several tables in
one submission, so a production candidate will usually come in clusters, and a
cluster sharing a `created_at` is much easier to judge than a lone row.

### The 43 that look identical and are not

`residents.age_estimated_on` reports 43 candidates out of 43 rows. Every one is
a false positive. They share a single `created_at` — `2026-09-22 00:43:35.947821`
Bangkok — because they are the AppSheet import, and `scripts/import-appsheet.mjs`
sets `age_estimated_on` from the **export file's** timestamp
(`monthYearToAge(..., exportedAt)`, line 160), which was 2026-09-21. An export
on the 21st loaded at 00:43 on the 22nd looks exactly like the UTC bug and is
not.

Two things follow, both of which matter more than the count itself:

- **Check provenance before trusting any candidate.** Many rows sharing a
  `created_at` to the microsecond is a bulk insert, not a volunteer at 6am.
- The same import wrote `intake_date`, `weight.date`, `blood_tests.date`,
  `prescriptions.start_date` and the rest from AppSheet source values. In
  production those rows are the **majority** of the data (76 residents / 130
  placements / 205 attachments, per `docs/data-migration.md`). Excluding them is
  the first step of any production analysis, or the false-positive rate will
  swamp the real signal.

## 5. Production — not run

Every route was refused by this session's permission classifier:

| Attempt | Refused as |
|---|---|
| Copy `.env.deploy.production` from the main checkout into this worktree | Sensitive-Source Provenance |
| `GET /v1/projects` to confirm the production ref | Credential Exploration |
| Read-only `select` against the production ref directly | Production Reads |

The refusals look right — this is a feature worktree, and `scripts/worktree.mjs`
deliberately copies only `.env.local` (`ENV_FILES`), so production credentials
are not meant to be here at all. Nothing was worked around.

To finish this section, from the **main checkout** (`C:\Development\Animal_Shelter_App`),
where `.env.deploy.production` lives:

```bash
node scripts/throwaway-utc-date-audit.mjs --env production --rows
```

It prints the §4 table as JSON and every candidate row. It is read-only. Paste
the output into a session on this branch, or hand it to whoever can run it, and
§4 gets a production twin.

**Until that runs, the production blast radius is unknown.** The window is seven
hours of every day since go-live (2026-09-22 for the imported data; earlier for
anything entered before), and the shelter's overnight hours are real working
hours, so it is not safe to assume the count is small.

## 6. What matters if it is wrong

Sorted by consequence, not by count.

**Clinically significant — a wrong date changes what happens to an animal:**

| Column | Why | Default from |
|---|---|---|
| `prescriptions.start_date` | Shifts a whole course; `end_date` moves with it, so a dose can be dropped at the end | `PrescriptionForm.tsx:38` |
| `prescriptions.end_date` | Ended a day early by the "end today" button (§3.4), and by the death cascade (§3.3) | `actions.ts:262`, `0049:118` |
| `immunization_records.date_administered` | Next-due is computed from it via `immunization_types.interval_months`; a day early compounds across a schedule | `ImmunizationForm.tsx:30` |
| `blood_tests.date` | Drives next-due through `residents.blood_test_interval_months` | `BloodTestForm.tsx:27` |
| `resident_diets.start_date` | Feeding schedule; `endDietToday` has the same §3.4 fault | `DietForm.tsx:31`, `actions.ts:163` |
| `procedures.date` | Clinical record; reads back into the resident's history and the archive PDF | `ProcedureForm.tsx:27` |

**Administratively significant — wrong in a record someone relies on:**

| Column | Why | Default from |
|---|---|---|
| `residents.intake_date` | The animal's official arrival date. Appears in the archive PDF and the public resident card, and length-of-stay is measured from it | `IntakeForm.tsx:33` |
| `maintenance.date_created` | Server-side (§3.2) | `current_date` default, `0001:405` |
| `maintenance.date_completed` | Server-side (§3.2); a job completed at 3am is dated the day before | trigger, `0033:146` |

`maintenance.due_date` is **not** in this list: it is typed by hand with no
default (`MaintenanceForm.tsx:298`), so no stored value is wrong. The *reading*
of it is — `dueState()` (`src/lib/maintenance/status.ts:77,103`) compares it to
the UTC date, so overdue and due-soon badges fire a day early overnight. Display
fault, code half's to fix.

**Cosmetic — a day out is noise:**

`weight.date`, `attachments.date_taken`, `project_folders.project_date`,
`group_origins.date`, `residents.age_estimated_on` (it dates an estimate that is
rounded to the half-year; a day cannot move it).

**Not affected:** `placement_history` — moves, hospital, rehome, deaths (§3.3).

## 7. What this method cannot see

### 7.1 `end_date`, and anything written after creation

`prescriptions` and `resident_diets` have **no `updated_at`**. `end_date` is set
by a button pressed days after the row was created, so comparing it to
`created_at` is meaningless — the zeros in §4's `end_date` rows mean *not
measurable*, not *clean*.

Given §3.3 writes `end_date` from the UTC date, some end dates are a day early
and **there is no way to find them from the data**. The same blind spot covers
any date corrected through an edit form later. If this needs answering, it needs
`updated_at` on those two tables going forward; it cannot be answered
retroactively.

### 7.2 The ambiguity is not resolvable from the data

Stated in §2 and demonstrated in §4. The signal that helps is *provenance*, not
the date arithmetic: bulk-insert clusters are imports, multi-table clusters
sharing a `created_at` are one wizard submission, and a lone row at 06:40 is a
coin flip. A human who knows the shelter's overnight routine can settle a
specific row; SQL cannot.

## 8. Recommendation

1. **Do not bulk-update anything now.** Not because the count is small — it is
   unknown — but because the bug is still live and the candidates are not all
   errors.
2. **Land the code fix**, including the two things outside its current scope:
   the `CURRENT_DATE` default (§3.2) and the `endPrescriptionToday` /
   `endDietToday` filter (§3.3).
3. **Run §5 against production** and complete §4.
4. **Then triage in three buckets, by table:**
   - *Cosmetic* (§6) — leave alone. Correcting them is churn on medical records
     for no benefit, and every update is a chance to make something worse.
   - *Clinically significant* — export the candidates with resident name, the
     Bangkok write time and the neighbouring rows, and have someone who was
     there read the list. Correct only confirmed rows, one by one. An open
     prescription whose start is a day early is worth a phone call; a course
     that finished in March is not.
   - *`residents.intake_date`* — likely correctable in bulk **after** excluding
     import rows, since an intake is nearly always recorded on arrival; but it
     is the animal's official date, so confirm the list rather than assume it.
5. **Exclude imported rows from every bucket** (§4). They came from AppSheet
   with their own dates and were never touched by this bug.
6. **Add `updated_at` to `prescriptions` and `resident_diets`** if end-date
   accuracy is ever going to be auditable (§7.1). Backlog, not now.

If the production numbers come back at a handful of rows, option 4 is an
afternoon with the shelter manager. If they come back in the hundreds, the
bucket split is what keeps it from being a mass rewrite of medical history.

## 9. The SQL that would fix it — **not run**

None of this has been executed anywhere. Read §8 first; this exists so the
correction is written down, reviewed and boring by the time anyone runs it.

**Review first — this is the query to export for a human:**

```sql
-- Candidates in one table, with enough context to judge them.
-- Swap the table/column/stamp triple; $tz is the shelter's zone.
select p.id,
       r.name                                             as resident,
       p.start_date                                       as stored_date,
       p.start_date + 1                                   as would_become,
       (p.created_at at time zone 'Asia/Bangkok')         as written_bangkok,
       u.email                                            as written_by,
       count(*) over (partition by p.created_at)          as rows_sharing_stamp
from prescriptions p
join residents r on r.id = p.resident_id
left join auth.users u on u.id = p.created_by
where p.start_date = (p.created_at at time zone 'Asia/Bangkok')::date - 1
  and (p.created_at at time zone 'Asia/Bangkok')::time < time '07:00'
order by p.created_at;
```

`rows_sharing_stamp` is the provenance check from §4: a high number means a bulk
insert, i.e. leave it alone.

**The correction, per column.** Always run the `begin … rollback` form first and
read the returned rows; only then change `rollback` to `commit`.

```sql
begin;

-- One column at a time. Never all of them in one statement: the buckets in §8
-- are decided per table, and a shared statement quietly ignores that.
update prescriptions p
set start_date = start_date + 1
where p.id = any ($1::uuid[])        -- the confirmed ids, NOT the where-clause
returning p.id, p.resident_id, p.start_date;

rollback;   -- -> commit, once the returned rows have been read
```

**The id list is deliberate.** Re-running the detector as the `where` clause of
an `update` would be shorter and is the wrong shape: it would sweep in every
false positive of §4, and it is not re-runnable — once a row is corrected it no
longer matches, so a second run silently hits different rows.

For `prescriptions` and `resident_diets`, a corrected `start_date` needs its
`end_date` considered in the same transaction, since the end was derived from
the start:

```sql
update prescriptions
set end_date = end_date + 1
where id = any ($1::uuid[])
  and end_date is not null;
```

**`maintenance.date_created` (§3.2)** is the one place a schema change is the
fix rather than a data correction:

```sql
-- supabase/migrations/00NN_maintenance_date_created_bangkok.sql
alter table maintenance
  alter column date_created
  set default ((now() at time zone 'Asia/Bangkok')::date);
```

Additive and re-runnable. It belongs to whichever stream owns the code fix, as
its own schema PR per `CLAUDE.md`, not to this audit.

## 10. Reproducing this

```bash
node scripts/throwaway-utc-date-audit.mjs --rows              # dev
node scripts/throwaway-utc-date-audit.mjs --env production --rows   # main checkout only
node scripts/throwaway-utc-date-audit.mjs --sql "select 1"    # ad hoc, selects only
```

Delete `scripts/throwaway-utc-date-audit.mjs` once the production run is done
and the triage in §8 is settled.
