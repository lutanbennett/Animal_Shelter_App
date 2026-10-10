# Release handover — written 2026-10-10, after `0.24.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-10.md` — `0.24.0`, one release, one file
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.24.0`** @ `d8b19418` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`d8b19418`** — `node scripts/release-prs.mjs d8b19418 HEAD` |
| Production database | `174 applied`, **1 pending** (`0175`), `Drift` — explained below, and it is the normal kind |
| Dev database | `175 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0176`** — `0175` is on `main` and belongs to PR #506 |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**Production reads `Drift` and that is correct.** `0175_map_rooms_names_and_descriptions`
merged as PR #506 about twenty-five minutes **after** the release commit, so it is
on `main`, applied to dev under the schema-first rule, and not on production.
Against the release SHA itself, production matched exactly: `174 applied, 0 pending,
0 in each direction`. **Apply `0175` as part of `0.25.0`**, with whatever else has
merged by then.

The pair of legitimate one-sided cases, which will keep recurring:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what you are looking at now.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

---

## In flight

**Nothing was left open by the release itself.** PR #506 merged after it and
carries `0175`; that is the next release's first job, not an exception.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut, and this record — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears. There was one at the time of writing, `Animal_Shelter_planner-handover-81`, left behind by #490 and still there a day later.
- Several feature streams run in parallel with a release and are nothing to do with it. A release manager's business is the two it created.

**One live consequence of that parallelism, new this release:** other streams
share the **dev database**, and some release checks write to it.
`check-phone-width.mjs --clean` deletes every `phonewidth-*` login it finds, not
just its own, and at `0.24.0` it deleted another stream's mid-run. Dev data is
disposable, so this is a courtesy problem rather than a safety one — but do not
run `--clean` casually while other sessions are working.

---

## The one thing to read before the next release

**A migration that *renames* is a different animal from one that *adds*, and the
runner cannot tell you which you have.** `0.23.0` learned this on a narrowing
migration and wrote it down; `0.24.0` met the much bigger version of it, and the
pattern held up.

`0172_clinics_and_doctors` renamed four tables, eight columns, a view, a role
value and every function body that named them. It leaves read-only compatibility
views under the four old table names — so simple reads survived — but **every
write failed, every embed through those views failed, and the renamed columns on
`prescriptions`, `procedures`, `blood_tests`, `weight` and `site_content` had no
shim at all.** Two of those failed *quietly*: the donate page's vet-visit cost
estimate (the loader ignores the error and returns null) and the
one-weight-per-visit guard.

What made it a non-event, and what to copy:

1. **It was found by reading the live code against this release's code**, not by
   reasoning about the migration header. Two commands —
   `git grep -n '\.from("vet_appointments")' <previous release sha> -- src` and
   the same on `HEAD` — settle it outright. The header says what *this* release
   reads; it says nothing about what is live.
2. **The runner's reassuring note is wrong for this shape.** It prints *"these
   tables/columns land before the code that reads them is live… expect nothing to
   use it yet"* for every consumer warning. That fits an **additive** file. For a
   file that renames or narrows, the apply changes behaviour immediately. When a
   consumer warning names files that already exist, open the migration and ask
   whether it **adds**, **restricts** or **renames**.
3. **It was put to Lutan before the cut**, in the same round as major/minor, as
   its own question with three real options — go ahead with the window kept
   short, wait for a quiet hour, or hold on test. He chose to go ahead.
4. **The mitigation was mechanical and is now the pattern: apply the migrations
   and start the Pi production build in the same command**, with no round trip
   between them. The Pi is what serves users, so the Pi build closes the window —
   **not** the Worker deploy, which is the fallback.
5. **It was measured**: apply finished `23:25:44Z`, the Pi finished `23:27:24Z`,
   so the window was **1 minute 40 seconds**, and that number is in the record
   rather than an estimate.

**And expect a guard that asks you a question.** `0172` refused to apply to
production at all until someone decided which of one clinic's two names to keep
(`name 'Dr somchai'`, `clinic_name 'Novel'`). Dev's rows agreed, so the file had
applied cleanly there and CI was green: **this class of problem can only appear
at the production dry-run.** Leave room in the schedule for one, and treat it as
a question for Lutan, not a file to fix. His answer was `Novel`, and `Dr somchai`
was added as a doctor at it so the name was not lost.

---

## Lessons from `0.24.0` worth not re-learning

### 1. `deploy.mjs` has no `--ref`, so a slow handover can ship a different commit

Both Pi builds were pinned with `--ref d8b19418` and neither drifted. The Worker
deploy cannot be pinned: it takes whatever `main` is when Lutan runs it. Between
the handover and the command running, another stream merged and pulled the main
checkout, so the production Worker built from **`8fcb6835`**, not the release SHA:

```
deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (8fcb6835)
```

Checked rather than assumed: `git diff --name-only d8b19418 8fcb6835` returned
**only `docs/backlog.md`**, and `0175` was not in that tree. So the Worker
carries the release's application code and nothing else moved. **Read the SHA on
that line every time and diff it against the release SHA** instead of reading
past it; the guard will refuse a tree whose migrations the database lacks, which
is what keeps this merely untidy.

### 2. A red dry-run on a *later* file is the per-file rollback trap, twice now

With `0172`'s fold guard satisfied, the re-run gave `0172 ok`, `0173 ok`,
`0174 FAILED: function current_clinic_resident_ids() does not exist`. `0174`
calls it; `0172` creates it; each file dry-runs in its own
`begin … rollback`. **The correct action was to apply**, and all three went `ok`.
Read both files before concluding, and then say which it was: "the dry-run
failed" and "the file is wrong" are different statements.

### 3. The phone-width sweep is runnable against `test.lannacare.org`

It had been skipped at three releases running because it wants a dev server and
would compete with the deploys for the PC. It does not have to: the script takes
a URL, it refuses any database but dev, and **the test site *is* the dev
database**, served by the test Pi from the release SHA. So point it at
`https://test.lannacare.org` and it measures the shipped build with no local
server at all. 290 page views across six roles and both languages, all clean.

Two things about actually running it:

- **Its own role list still has `staff`**, retired by `0.24.0`, so a default run
  dies at setup. Name the six surviving roles:
  `--roles=admin,management,doctor,volunteer,head_of_medical,head_of_maintenance`.
  It has no `second_in_command`, so **2IC is still unmeasured**. Both on the backlog.
- **Slice it by role.** One run covering three roles in both languages was killed
  at 560 s having printed nothing, because the output is buffered. One role at a
  time finishes comfortably.

### 4. Where the time went, and why the headline figure is not a regression

`0.23.0` took ~45 minutes; `0.24.0` took **~65** — and the difference is entirely
the gap between handing the deploy over and it being run. Everything Claude owed
was done inside that gap: both Pi builds, both drift checks, the mail check, the
edge-cache check, the phone-width sweep and most of the record. Budget from the
per-step figures, not the total.

| Step | Measured at `0.24.0` |
|---|---|
| `worktree.mjs new` | ~3 min, almost all `npm ci` |
| `gates.mjs` | ~5 min (build alone 279 s, cold) |
| Full CI run on a PR | ~2 min (`public-views` 1m38s, `check` ~2 min, the rest under 20 s) |
| Production migration apply | **7 seconds** for three files |
| **Worker deploy, production** | ~13 min of work — still the long pole |
| Pi build + restart | **~1m40s**, and it is what closes a migration window |
| Phone-width sweep, all six roles | ~25 min in slices, over the network |

### 5. `gh pr merge` was not refused, for the second release running

`0.23.0` recorded it working on the first attempt; so did this one, with the
release asked for in chat. Try it, expect it to work, and treat a refusal as the
exception that needs a sentence in chat.

### 6. Things that look alarming but are not

- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise; the deploy continues and exits 0.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. Green throughout `0.24.0`.
- A deploy log that looks like gibberish: `| tee` writes **UTF-16**. `tr -d '\000'` before grepping.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.
- `release mail for <version> [off]: sent 0, skipped 16` on the **test** deploy: correct by construction, `RELEASE_MAIL_ENV` is `""` there.
- A backgrounded `deploy.mjs` writing **nothing** to its log for ten minutes: output is buffered when it is not a terminal. Not a hang. The same is true of `check-phone-width.mjs`.
- `test-plan` red on the commit that *opens* a cut PR: the "CI green" line cannot honestly be ticked before CI has run. Complete it in a follow-up commit; the next run goes green.

---

## Outstanding verification — what actually matters

Ten of `0.24.0`'s thirteen plans are `pending:`, by Lutan's decision at the cut.
The repo-wide `pending:` count is the normal standing state and is **not** a
release blocker — do not try to clear it.

What is worth carrying forward, most valuable first:

| Item | Where | Note |
|---|---|---|
| **Somebody using the renamed Clinics screens on production** | `docs/test-plans/vet-to-doctor-rename.md` | New, and the largest thing in the release. The rename passed every script and the phone-width sweep; nobody has read the Thai wording or worked a doctor login's day |
| **A donation receipt issued on production** | `docs/test-plans/donation-receipts.md` | Carried from `0.23.0`. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. It also writes the PDF to Drive |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | Carried from `0.22.0`, now a third release. It is also what *creates* the Storage bucket — `ensureBucket()` runs on first use |
| **A Management login saving Management → Website** | `docs/test-plans/website-content-grant.md` | Carried from `0.22.0`. Verified only by the migration applying cleanly |
| **`0.20.0`'s Contacts pass** | `docs/test-plans/cut-release-0-20-0.md` | Open for **six** releases, and the thing it was waiting for has changed twice since (`0170` narrowed what staff may read of a contact; `0172` renamed the clinic a contact can be). **Close it and write a new item against current behaviour** — carrying it a seventh time is not a decision |
| 2IC at phone width | `scripts/check-phone-width.mjs` | The sweep now runs, but the script has no `second_in_command` role, so the 2IC — who has no PC on site — is the one role never measured |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-10.md` end to end.** One release, one file.
2. **Range starts at `d8b19418`.** Run `release-prs.mjs d8b19418 HEAD` and read its exit code directly, not through a pipe.
3. **`0175` is pending on production** and nothing else is. `--status --env production` first, as always, and expect that one.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. `0.21.0` through `0.24.0` were all major for the same reason each time: pages moved, or a role gained or lost a section.
5. **Ask whether anything in the release can fail silently** — and read the candidates in code before asking, so the question carries an answer. Two releases running have answered yes; see the section above for what a renaming migration does.
6. **Expect a production-only guard.** If a migration refuses on production data, that is a question for Lutan and it cannot appear any earlier.
7. **Budget the Worker deploy at ~13 minutes**, do not overlap it with anything building in the same checkout, and fill the wait with the Pi builds, the drift checks, the phone-width sweep and the record.
8. Four production-only checks are owed: the Clinics screens, a donation receipt, a facility-map upload and a Management → Website save.
9. `/clean-streams`, and read **In flight** on why this file no longer lists worktrees by name.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.24.0` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, the one-row clinic
correction, `gh pr merge` and the test Worker deploy, none of which were refused.

Two things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and
  say so when you hand it over.
- Hand it over as **one command per line** — `&&` does not parse in Windows
  PowerShell 5.1 — and always with the `| tee`.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
