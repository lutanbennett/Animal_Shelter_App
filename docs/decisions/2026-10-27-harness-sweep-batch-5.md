# Harness sweep, batch 5 (2026-10-27)

Backlog item "Sweep the remaining red database harnesses in bounded batches". Batch 5 is the permissions-first ten that batches 2–4 named.
**Scripts only: no migration, nothing under `src/`.** Every figure below is from the **dev** database, run on 2026-10-27. Dev and production
differ today: `0270` (delete the archived `staff` role) is applied on dev and pending on production.

## Step zero: five of the ten were already green

Batch 4 (2026-10-26) had fixed them. A `HARNESS-OK` printed through an error is how these SQL harnesses report success (the closing
`raise exception` is what keeps the transaction from committing); the exit code and the `HARNESS-OK` line are the result.

| Harness | Last touched | State on 2026-10-27 |
|---|---|---|
| `check-director-answers-schema` | 2026-10-26 `d7e40247` | green, 41 checks held |
| `check-security-schema-fold` | 2026-10-26 `3ef5a8cf` | green (`HARNESS-OK`) |
| `check-weight-one-per-day` | 2026-10-26 `1281ea94` | green (`HARNESS-OK`) |
| `check-preferred-channels` | 2026-10-26 `4c6f2a1b` | green (`HARNESS-OK`) |
| `check-social-shares-schema` | 2026-10-26 `b8d90947` | green, all checks passed |

Nothing was changed in these five.

## The other five

| Harness | Verdict | What it was, and what happened |
|---|---|---|
| `check-weigh-first` | **FIX, green** | One failure: the doctor reads `weight` directly. The doctor holds live cards that Lutan edits one at a time, so that line stops pinning the doctor, exactly as the line above it already did for `clinic_visits`. 60 checks held. |
| `check-recurring-jobs` | **FIX, green** | The "clerk" logins copied their cells from the `staff` role, which `0270` deleted on dev, so they held nothing and the first function call was refused. They now hold a throwaway custom role with the one cell the checks need (`recurring.do_own`). The "archived" login joined `staff` too; it now holds the same throwaway role with an archived assignment, which is the case it means to test. Every section runs and ends in `HARNESS-OK`. |
| `check-who-does-what` | **FIXED TO RUN, stays RED for a real reason** | See below. |
| `check-menu-coverage` | **FIXED, stays RED for a real reason** | See below. |
| `check-resident-sections` | **Not a pass/fail harness; works** | See below. |

### `check-who-does-what`: runs again, red because the page's list is out of date

It crashed on the first fixture (`diet_types.daily_qty_*` is gone; `resident_diets` points at a recipe in `diets`). Fixed with the same
trick `check-permission-parity` uses (one id for the ingredient and the recipe). Then four faults in the harness itself:

1. **A `medication` probe used the default unit `tablet`**, which `0252` refuses when the units table has no such unit (dev has none).
   The probe now reads a live medicine unit in setup and passes it through a transaction-local setting; the probe is marked
   `refusedBy: ["P0001"]`, because `check_unit_in_units` reads `units` as the caller, so a role that cannot read units is refused there first
   (the same shape as the `projects.folders` probe). `check-permission-parity` shares the probe file and got the same setup line; its
   harness-fault count is 0.
2. **Disposable roles.** The role list included every `dev_signin_cards_*` and `dryrun_*` login the card streams leave on the shared dev
   database (about forty roles, 7,694 probes). They are now skipped; the six live roles remain (312 boxes). Without this the counts moved under the run.
3. **`photos.resident_add` and `photos.resident_publish`** reported WRONG/STICKY for four roles. `0269` made `photos.shelter_add` a second
   door into `record_attachment`, deliberately, so the add box is now declared `sharedWith: ["photos.shelter_add"]`, which the harness then
   proves (refused once both are taken away). The publish probe wrote to the **Shelter** folder, which `shelter_add` also opens; it now
   writes to a folder only publishing opens, so it tests the real boundary.

**Result: 0 harness faults.** What is left is the harness doing its job: comparing the database with `FIXED_FOR_NOW`
(`src/lib/permissions/fixed-for-now.ts`, the list the Who-does-what page uses to mark a box "fixed for now"):

- `STALE`: `whoAndWhere` and `nameAndPhone` cover boxes that are obeyed now.
- `OVERLISTED`: 18 `clinicRule` entries for the **doctor** and two `databaseWider` entries for management. The doctor ones are **expected**: the
  doctor holds live cards that Lutan edits one at a time (see `doctor-cells`), so its boxes are obeyed now and the list still marks them.
- `UNLISTED`: `photos.resident_add` for the Head of Medical, Management and the 2IC is shared with `photos.shelter_add` and not listed;
  `photos.resident_add` for the doctor (allowed with the box at no) and `recurring.do_own` for management (a prerequisite rule).

**Why it was left red.** The list is app source (it changes what the page draws), the doctor entries move every time Lutan edits a card, and
the brief for this batch is scripts only. The fix is a short edit to `fixed-for-now.ts` once the doctor card testing settles; a stream that
does it should start from this list, then run this harness. It asserts no role holds any card: it measures whether each box on the grid is
followed by the database, for whatever the roles hold on the day.

**Decision recorded (Lutan, 2026-10-27):** the Who-does-what service-role read stays where it is and does **not** move behind a policy on
`roles.view` (*"Leave it"*). It remains a named service-role site in `docs/hard-coded-security-registry.json`. It is not debt; do not
re-raise it.

### `check-menu-coverage`: red, 30 orphans, real

It printed 137 unexplained orphans. 107 of those were the disposable `dev_signin_cards_*` / `dryrun_*` logins; the script now skips them
(naming one with `--role=` still checks it). **Across the six live roles it reports 30**, the same figure the planner took on 2026-10-26:
doctor 9, management 8, 2IC 5, Head of Medical 4, Head of Maintenance 3, volunteer 1 (dev, 2026-10-27, on the cards held today).
These are pages a role's cells let it open that no held card puts in front of it, so the menu cannot go yet. The check asserts no count and
no particular role holding a particular card; the number moves when Lutan reassigns cards, which is the point. It is the right harness for
the rebuild, and it stays red until the cards cover those pages. No `ACCEPTED` entries were added.

### `check-resident-sections`: a snapshot tool, not a green/red check

It exits 1 with a usage message when run bare because it is a before/after tool for a refactor (`--out a.json`, `--out b.json`,
`--compare a b`), needing a dev server. It was not red for any reason in its code. I ran it against a dev server on the current roles
(`admin`, `management`, `head_of_medical` first, then the full set) to check it still works; it makes and deletes its own throwaway
logins. The first attempt was killed by my timeout before its cleanup ran and left four `harness-sections-*` logins on dev, which I deleted
by hand. Result of two full runs compared: see the test plan. Nothing in it asserts a role name or a role column; the role list is the
set of logins it signs in as, not a rule. No change.

## `check-recurring-jobs`: a job with no page link (Lutan, 2026-10-27)

Asked about a recurring job that links to no page: *"they should be able to see it in my tasks and manage it as a normal everyday task."*
So **no card gates being given an unlinked job**. It is ordinary work and the `my_tasks` card governs it. This is already the behaviour
(`canDoJob()` returns true with no rule for the link; `src/lib/my-tasks/recurring.ts` keeps the job on the assignee's list). **No
activity, card or eligibility rule is created for it.**

## What did not change

`node scripts/check-hard-coded-security.mjs` still prints `no coded security outside the Admin bypass`. No harness here asserts that a role
column or a role key is consulted. The throwaway roles are named `harness_*`, and the role filters in `check-who-does-what` and
`check-menu-coverage` are fixture hygiene in scripts, not app code and not access.

**Of the ten:** eight are green (five already, `weigh-first` and `recurring-jobs` fixed, and `resident-sections` works as a snapshot tool); two stay red for real reasons (`who-does-what`, `menu-coverage`). The red count in the backlog item is the planner's to restate; I have not re-run the other harnesses.
