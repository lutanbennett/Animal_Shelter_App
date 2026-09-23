# UTC "today" — data audit, 2026-09-23

The data half of the backlog item *"'Today' is UTC everywhere, so it is yesterday
in Thailand until 07:00."* The code half is `claude/utc-today`; this branch
changed **no data and no code under `src/`**.

**Status: complete.** Dev and production both audited (§4, §5). **No row in
production needs correcting** — but read §5's second half before filing that as
good news, because production is clean for a reason that expires.

---

## 1. What to do with this

1. **Correct nothing.** Production holds no wrong date: every candidate there
   is the AppSheet import, and the deceased cascade has never fired early
   (§5). The §9 SQL run today would damage 42 correct rows.
2. **The code is still broken**, which is the open half. `claude/utc-today`
   (PR #59) covers the call sites; the six `current_date` sites in SQL (§3.2) are
   in nobody's PR and need a migration. The deceased cascade is the one of
   those with a clinical consequence.
3. **Re-run this after a month of real overnight use** (§10). Production is
   clean because the bug has barely had the opportunity — go-live was
   2026-09-22 and almost every row is the import — not because it does not
   work. §8's triage and §9's SQL are written and unused on purpose.

Three things this audit turned up that are not "is this row wrong?" questions,
and belong to the code half: a death closes prescriptions a day *before* the
death (§3.3), a deliberately back-dated placement lands a day *after* the day
chosen (§3.3), and "end today" silently fails for seven hours a day (§3.4). The
second and third are fixed in `claude/utc-today` (PR #59); the first needs a
migration and is filed on the backlog.

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

**`src/` line numbers here are as of 2026-09-23, against `main` before the
code fix landed.** The fix (`claude/utc-today`, PR #59) rewrites 27 call sites
across 24 files and merges *after* this document, so the line numbers below go
stale on that merge and the cited code is by then the thing that was replaced —
which is the point of citing it. The behaviour each one describes is what to
match on; the file paths stay right. Migration line numbers do not move: applied
files are never edited (`CLAUDE.md`).

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

### 3.3 Placements store instants — but neither the branch nor the cascade was safe

`placement_history` uses `timestamptz`, so **every value it stores is a valid
instant** and nothing in it is corrupt. There is no `date`-typed death column
anywhere; deaths are `placement_history` rows. That much answers the concern the
brief raised most sharply — but "not affected" would be too strong, in two
different ways.

**The column is sound; the branch that fills it was not.**
`placementStartDate()` (`src/lib/placements/dates.ts`) stores the current
instant when the chosen date is UTC-today and midday-UTC when it is back-dated —
and it decided which by comparing against the **UTC** date:

```ts
const today = now.toISOString().slice(0, 10);
return date >= today ? now.toISOString() : `${date}T12:00:00.000Z`;
```

At 01:26 Bangkok on the 23rd, UTC-today is the 22nd. A volunteer deliberately
back-dating a move to the 22nd — *yesterday* to them, and the latest date the
form would let them pick, since the same UTC value is the input's `max` — hits
`"2026-09-22" >= "2026-09-22"`, takes the same-day branch, and gets stamped
18:26Z, which reads as the **23rd** in Bangkok. The placement lands a day
*after* the day they chose.

Accepting the form's default is the harmless case: the label said 22 Sep, the
stored instant is "now", and now is the truth of when they did it. It is the
deliberate back-date that moves.

This is ambiguous in the same way as everything else in §2, and worse: a
same-day placement and a mis-branched back-date are both `start_date =
created_at` to the microsecond, so no query separates them. There is nothing to
detect and nothing to correct — the values are instants and each one is a real
moment; only the volunteer knows which day they meant. Raised here so that
"`placement_history` is fine" is not read as clearing `dates.ts`. Fixed and
asserted in `claude/utc-today` (PR #59).

**The cascade a death fires is a genuine data fault.** `0049_undo_deceased.sql:118`
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
deaths. Production says the same: 6 deceased residents, 0 prescriptions closed
early (§5). The mechanism is live and has simply not been exercised yet.

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

That second one is a live functional defect, not a data question. Fixed in
`claude/utc-today` (PR #59) by the `todayIso()` substitution alone — no extra
guard needed — and the zero-row case was exercised in the browser rather than
assumed, which matters for a failure that is otherwise silent.

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

## 5. Results — production (`dbkodyyxxhtygxcxmfcu`), 2026-09-23

Run 2026-09-23 at 21:28 Bangkok, read-only, after Lutan authorised it directly.
**No row in production needs correcting.**

| Table.column | Examined | Candidates |
|---|---:|---:|
| `residents.intake_date` | 76 | 0 |
| `residents.age_estimated_on` | 42 | **42 — all one import, see below** |
| `weight.date` | 19 | 0 |
| `blood_tests.date` | 51 | 0 |
| `immunization_records.date_administered` | 13 | 0 |
| `prescriptions.start_date` | 59 | 0 |
| `resident_diets.start_date` | 70 | 0 |
| `procedures.date` | 7 | 0 |
| `attachments.date_taken` | 155 | 0 |
| `maintenance.date_created` / `due_date` / `date_completed` | 2 / 2 / 0 | 0 |
| `group_origins.date`, `project_folders.project_date` | 0 | 0 |
| **Deceased cascade** (§3.3) | 6 deceased residents | **0 prescriptions closed early** |

The 42 are the same false-positive class as dev's 43 (§4): `age_estimated_on`
came from the AppSheet export's own date, 2026-09-21, and the import ran at
**01:16 Bangkok on the 22nd** — inside the window by coincidence. Every one of
the 76 residents carries that single `created_at` to the microsecond
(`2026-09-21 18:16:46.918223+00`, one distinct value), which is the bulk-insert
signature §4 says to check for. Not the bug.

**Why production is clean, which matters more than the zeros.** The brief
expected damage accumulating "for seven hours of every local day since
go-live". That premise was wrong about the calendar, not about the mechanism:
production's data arrived in a single import on 2026-09-22 and almost nothing
has been hand-entered since. The exposure window was about a day and a half, not
months. **Production is clean because the bug barely had the chance, not because
it does not work** — dev, where someone actually used the intake wizard at 01:26,
produced a real three-table candidate immediately (§4).

So this clears the rows that exist **today**. It is not a verdict on the bug, and
it expires the moment someone works an overnight shift.

### Target verification

The script was pointed at the project ref directly (`--project`), so the
`Environment: test` label in its output is the default env name and **not** a
statement about the target. Confirmed as production independently:

| Check | Result |
|---|---|
| Residents | 76 — matches `docs/data-migration.md`'s record of the production import |
| Attachments | 205 — matches the same record exactly |
| Placements | 125 against 130 recorded; 5 fewer, consistent with normal churn since |
| Resident rows | all 76 share one `created_at`, i.e. the import and nothing hand-entered since |

Dev has 77 residents — the 76 plus the "Wizard Test 23 Sep" row from §4 — which
is the clearest single tell that these are two different databases.

Every statement was a `select` with `read_only` set. Nothing was written.

### What was refused earlier, and why it is recorded

Three earlier routes were refused by this session's permission classifier:
copying `.env.deploy.production` into the worktree (Sensitive-Source
Provenance), listing projects to confirm the ref (Credential Exploration), and
this same read-only query (Production Reads). The run above happened only after
Lutan asked for it directly.

Two things are worth keeping from that, because they will come up again:

- The rule is about **production**, not about which folder the command runs
  from. Running it from the main checkout would not have made it a different
  read.
- A peer session offered to run it and pass the output over. That was declined:
  routing refused data through a peer is laundering whether the peer offers or
  is asked, since the effect is identical. The legitimate path is the one that
  was taken — the user authorises it, or the user runs it and hands over the
  file.

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
of it is — `dueState()` (`src/lib/maintenance/status.ts:74–85`) takes `today`
from `todayIsoDate()` at all three call sites (`EnclosureHub`, `MaintenanceBoard`,
`MaintenanceJobView` all use the default), so between 00:00 and 07:00 it judges
every job against yesterday. Run at 01:26 Bangkok — UTC today `2026-09-22`,
shelter today `2026-09-23` — exactly two bands move:

| Due date | with UTC today | with shelter today |
|---|---|---|
| 2026-09-22 (yesterday in Bangkok) | `dueSoon` | **`overdue`** |
| 2026-09-26 (far edge of the band) | `none` | **`dueSoon`** |

A day **late**, not early: an overdue job is demoted to merely due-soon, and the
due-soon band is a day short at its far edge. Under-reporting on a maintenance
board, which is the worse direction. A job due *today* in Bangkok reads the same
either way, so the obvious test case is the one that would not have caught it.

The `DUE_SOON_DAYS` round trip in the same function (`new Date(today)`,
`setDate(+3)`, `toISOString().slice(0, 10)`) is *not* a fault — `new Date("YYYY-MM-DD")`
is UTC midnight, which at a positive offset is still the same local day, so it
returns the right string at UTC+7 and at UTC. Only the `today` it starts from is
wrong, one line above. Worth stating both halves together: the visibly gnarly
arithmetic is correct and the plain default argument is not, which is why this
function was called a bug, then cleared, then found to be a bug after all.
Measured independently by `claude/utc-today` (PR #59, 8311678) and here.

**Cosmetic — a day out is noise:**

`weight.date`, `attachments.date_taken`, `project_folders.project_date`,
`group_origins.date`, `residents.age_estimated_on` (it dates an estimate that is
rounded to the half-year; a day cannot move it).

**Nothing to correct:** `placement_history` — moves, hospital, rehome, deaths.
Every stored value is a valid instant, so there is no wrong date to fix; but a
*deliberately back-dated* placement made overnight landed a day later than
intended, undetectably, and that is not the same as "not affected" (§3.3).

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

**Correct nothing. Fix the rest of the bug.** Production holds no wrong date
today (§5), so the data question is closed and the code question is not.

1. **No data correction, anywhere.** Not "defer it" — there is nothing to
   correct. Every production candidate is the AppSheet import, and the deceased
   cascade has never fired early. Running the §9 SQL against production today
   would change 42 correct rows into 42 wrong ones.
2. **Finish the code fix.** `claude/utc-today` (PR #59) covers the 27 call
   sites, the placement branch and "end today". Still outstanding and owned by
   nobody's PR: the six `current_date` sites in SQL (§3.2), of which the
   **deceased cascade is the one with a clinical consequence**. It needs a
   migration, so it needs a schema slot — not a backlog entry that ages.
3. **Re-run this audit after the first month of real overnight use**, and
   before any decision that trusts a date typed at night. The command is in §10;
   it takes a minute and it is read-only. §9's SQL and §8's triage are written
   and unused on purpose — the next run is the one likely to need them.

**When there is something to correct, triage in three buckets, by table:**

- *Cosmetic* (§6) — leave alone. Correcting them is churn on medical records for
  no benefit, and every update is a chance to make something worse.
- *Clinically significant* — export the candidates with resident name, the
  Bangkok write time and the neighbouring rows, and have someone who was there
  read the list. Correct only confirmed rows, one by one. An open prescription
  whose start is a day early is worth a phone call; a course that finished in
  March is not.
- *`residents.intake_date`* — likely correctable in bulk **after** excluding
  import rows, since an intake is nearly always recorded on arrival; but it is
  the animal's official date, so confirm the list rather than assume it.

And in every bucket, **exclude imported rows** (§4, §5). They came from AppSheet
with their own dates and were never touched by this bug. That single exclusion
is the difference between this audit's real answer — zero — and a headline of
"42 wrong dates in production".

**One thing to add regardless of any of the above:** `updated_at` on
`prescriptions` and `resident_diets` (§7.1). Without it, a wrong `end_date` is
undetectable forever, and `end_date` is the field the deceased cascade and the
"end today" button both write. Backlog item, small, and it only helps if it
lands before the damage rather than after.

## 9. The SQL that would fix it — **not run, and not needed today**

None of this has been executed anywhere, and per §5 there is nothing in
production for it to fix — running it now would turn 42 correct rows into 42
wrong ones. It is written down so that when a future run *does* find something,
the correction is already reviewed and boring rather than improvised.

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
node scripts/throwaway-utc-date-audit.mjs --rows                       # dev
node scripts/throwaway-utc-date-audit.mjs --project <prod-ref> --rows  # production, read-only
node scripts/throwaway-utc-date-audit.mjs --sql "select 1"             # ad hoc, selects only
```

`--project` aims at a ref directly, which is how the production run was done: a
worktree has no `.env.deploy.production` (`scripts/worktree.mjs` copies only
`.env.local`), so `--env production` cannot resolve there. With `--project` the
`Environment:` line still prints the default env name — **read the ref, not the
label** (§5).

**Keep the script.** §8 recommends re-running this after the first month of
real overnight use, and after the code fix deploys; it is one read-only command
and it is the only way to tell whether the answer is still zero. Delete it when
the UTC item is closed in full, including the six SQL sites in §3.2 — not
before.
