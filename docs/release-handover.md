# Release handover — written 2026-10-09, after `0.23.0`

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
2. `docs/releases/2026-10-09.md` — `0.23.0`, one release, one file
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.23.0`** @ `7928bd7a` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`7928bd7a`** — `node scripts/release-prs.mjs 7928bd7a HEAD` |
| Production database | `171 applied`, **0 pending**, `No drift` |
| Dev database | `171 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0172`** — no branch carries one, so a schema stream can start immediately |
| `unreleased` notes already waiting | **0**, as of the cut |
| Open PRs | the record/handover PR this file is in, and whatever has landed since |

**Both databases read `No drift`, which is rarer than it looks.** The last two
handovers each had to explain a legitimate one-sided disagreement. This release
absorbed every pending migration and left no schema PR open, so the pair agrees.

The pair is still worth knowing, because it will recur:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

---

## In flight

**Nothing was left open by the release itself**, and no branch carries a
migration.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried and it was stale within the hour: the three
leftovers this section originally named were cleared by another session while
this PR was open, and three new streams had started in the meantime. What is
durable is the shape, not the names:

- The release's own worktrees — the cut, and this record — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears. There was one at the time of writing, `Animal_Shelter_planner-handover-81`, left behind by #490.
- Several feature streams run in parallel with a release and are nothing to do with it. A release manager's business is the two it created.

---

## The one thing to read before the next release

**The silent-failure question answered *yes* this time, and the shape of what
followed is the template.** `0.21.0` established the question and held the
release; `0.22.0` asked it and answered no. `0.23.0` is the first yes, and
nothing about it was dramatic — which is the point.

`0170_close_the_over_grants` narrowed the `contacts` read policy to
`contacts.browse`, a cell staff do not hold, while the code that reads the
replacement `picker_contacts` view shipped in the same release. The *live* code
read the table directly. So between the production apply and the Pi finishing its
build, **a staff login's carer picker returned no rows — and an empty picker
reads as "no carers", not as an error**.

What made it a non-event:

1. **It was found by reading the code, not by reasoning about the migration.**
   `git show <previous release sha>:src/lib/contacts/carers.ts` against the
   current file is two commands and it settles the question outright. The
   migration header alone would not have: it says this branch's app code reads
   the view first, which is true of *this* release's code and says nothing about
   what is live.
2. **It was put to Lutan before the cut**, in the same round as major/minor, as
   its own question with three real options — go ahead with the window kept
   short, wait for a quiet hour, or hold on test. Not as a warning, and not
   folded into the count of unsigned plans.
3. **The mitigation was mechanical**: apply the migrations and start the Pi
   production build in the same breath. The Pi is what serves users, so the Pi
   build is what closes the window — **not** the Worker deploy, which is the
   fallback and takes four times as long.
4. **It was measured**: the Pi build took about three minutes, so the window was
   about three minutes, and that number is in the record rather than an estimate.

The rule is unchanged and now has an example on both sides: **look at whether
anything fails quietly, do the reading before asking, and name it on its own if
it does.**

---

## Lessons from `0.23.0` worth not re-learning

### 1. The apply-runner's reassuring note does not cover a *narrowing* migration

`apply-migrations.mjs` prints, for any pending file whose consumers differ from
what is live:

> *These tables/columns land before the code that reads them is live. That is the
> safe direction - nothing is blocked - but do not deploy the reader before this
> is applied, and expect nothing to use it yet.*

That is exactly right for a file that **adds** a table or column, which is six of
this release's seven. It is **wrong for a file that narrows an existing policy**,
because there the apply changes behaviour for code that is already live, and
"expect nothing to use it yet" is the opposite of the truth.

The runner cannot tell the difference and prints the same note either way. So:
when a consumer warning names files that already exist, open the migration and
ask whether it **adds** or **restricts**. Only the additive case is the safe
direction it describes.

### 2. The two-endpoint check has three meanings, not two

`/api/version` (the app, on the Pi) and `/api/releases/current` (from the Worker
bundle) disagreeing means one of:

- the Worker is **lagging** between two deploys — `0.21.0`'s reading
- the Worker deploy **failed** — `0.22.0`'s, and it caught a release that looked complete
- the Worker deploy **has not been run yet** — `0.23.0`'s, because the Pi build finished while the handover was still outstanding

All three look identical. What distinguishes them is knowing *which* deploy you
are waiting on at the moment you read it. Run the check before **and** after the
Worker deploy, and say in the record which meaning applied — a disagreement is
never "wait a bit".

### 3. Where the thirty minutes went

`0.22.0` took ~75 minutes; `0.23.0` took **~45**, with twenty-four PRs instead of
sixteen. Two causes, both repeatable:

- **No failed deploy.** The handover was not made until the main checkout was
  confirmed free, and that was stated as part of the handover rather than assumed.
- **No idling.** Both Pi builds, both drift checks, the mail check, the edge-cache
  check and the whole release record were done *while* the Worker deploy was
  outstanding. The Pi runs on the Pi; it collides with nothing.

Refreshed figures, measured not estimated:

| Step | Measured |
|---|---|
| `worktree.mjs new` | ~2–3 min, almost all `npm ci` |
| `gates.mjs` | ~4 min (build alone 205s, cold) |
| Full CI run on a PR | ~2 min (`check` 1m53s, `public-views` 1m28s, the rest under 15s) |
| Production migration apply | under a minute — **seven** files, so file count barely matters |
| **Worker deploy, production** | **~12 min** — still the long pole |
| Pi build + restart | **~3 min** each, faster than the ~4–5 budgeted |
| Whole release, first command to admin mail | **~45 min** |

Still budget the Worker deploy at ~13 minutes and never overlap it with anything
building in the same checkout.

### 4. `gh pr merge` was not refused this time

The last handover said to expect the auto-mode classifier to refuse it as *"Merge
Without Review"* and to ask rather than treat it as a fault. On `0.23.0` it
**succeeded on the first attempt** with no refusal, the user having asked for the
release in chat. So: try it, expect it to work, and treat a refusal as the
exception that needs a sentence in chat — not as the default.

### 5. Git Bash and Node disagree about CRLF in this repo

The cut script failed to find `export const unreleased: ReleaseNote[] = [` plus a
newline in `src/lib/releases.ts`. Investigating, `grep -c $'\r'` returned **0**
and `awk` counted **0** CRLF lines — while Node read the very same bytes as
ending `[\r\n`. Node was right; the file is CRLF.

Any script that edits a source file by string matching must detect the file's own
line ending and write it back unchanged. **When the shell tools and Node disagree
about bytes on this machine, believe Node.**

### 6. Things that look alarming but are not

- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise; the deploy continues and exits 0.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. Green throughout `0.23.0`.
- A deploy log that looks like gibberish: `| tee` writes **UTF-16**. `tr -d '\000'` before grepping.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.
- A backgrounded `deploy.mjs` writing **nothing** to its log for ten minutes: output is buffered when it is not a terminal. Not a hang.

---

## Outstanding verification — what actually matters

Seventeen of `0.23.0`'s twenty-four plans are `pending:`, by Lutan's decision at
the cut. The repo-wide `pending:` count is the normal standing state and is
**not** a release blocker — do not try to clear it.

What is worth carrying forward, most valuable first:

| Item | Where | Note |
|---|---|---|
| **A donation receipt issued on production** | `docs/test-plans/donation-receipts.md` | The highest-value check outstanding. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. It also writes the PDF to Drive |
| **A phone-width sweep, at all** | `docs/release-smoke-test.md`, "Before the deploy" | `node scripts/check-phone-width.mjs` has **not been run at any of the last three releases**, and nobody wrote that down until now. `0.23.0` added three whole sections, none measured at 375 px |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | Carried from `0.22.0`. It is also what *creates* the Storage bucket — `ensureBucket()` runs on first use |
| **A Management login saving Management → Website** | `docs/test-plans/website-content-grant.md` | Carried from `0.22.0`. Verified only by the migration applying cleanly |
| **`0.20.0`'s Contacts pass** | `docs/test-plans/cut-release-0-20-0.md` | Open for **five releases**. `0170` has now changed what staff may read of a contact, so the pass it was waiting for is not the same pass any more. **Close it and write a new item, or do it against the new behaviour** — carrying it unchanged a sixth time is not a decision |
| Thai wording on the Operations menu | `docs/test-plans/shelter-operations-nav.md` | Carried from `0.21.0`, and the menu has since been **renamed** to Operations, so the wording to check has changed |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-09.md` end to end.** One release, one file this time — no second section to find.
2. **Range starts at `7928bd7a`.** Run `release-prs.mjs 7928bd7a HEAD` and read its exit code directly, not through a pipe.
3. **No migrations are pending on either database.** Whatever merges next sets that; `--status --env production` first, as always.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. `0.21.0`, `0.22.0` and `0.23.0` were all major for the same reason each time: pages moved, or a role gained a section.
5. **Ask whether anything in the release can fail silently** — and read the candidates in code before asking, so the question carries an answer. See the section above for what a *yes* looks like.
6. **Budget the Worker deploy at ~13 minutes**, do not overlap it with anything building in the same checkout, and fill the wait with the Pi builds, the drift checks and the record.
7. Four production-only checks are owed: a donation receipt, a facility-map upload, a Management → Website save, and a phone-width sweep that has never happened.
8. `/clean-streams`, and read **In flight** on why this file no longer lists worktrees by name.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.23.0` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, `gh pr merge` and
the test Worker deploy, none of which were refused.

Two things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and
  say so when you hand it over. That is `0.22.0`'s lesson, and following it is
  most of why `0.23.0` took thirty minutes less.
- Hand it over as **one command per line** — `&&` does not parse in Windows
  PowerShell 5.1 — and always with the `| tee`.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
