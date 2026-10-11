# Release handover — written 2026-10-11, after `0.27.0`

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
2. `docs/releases/2026-10-11.md` — **two** releases in it now, `0.26.0` and `0.27.0`. Read `0.27.0` end to end; read `0.26.0`'s "order that turned out to be impossible" section too, because it is the one lesson that keeps earning its place
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.27.0`** @ `47760a81` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`47760a81`** — `node scripts/release-prs.mjs 47760a81 HEAD` |
| Production database | `185 applied`, **0 pending**, `No drift` |
| Dev database | `185 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0186`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, **#546** (planner handover, open and not part of `0.27.0`), and whatever has landed since |

**All four builds came from the release SHA exactly** — both Pis and both
Workers, for the second release running. Do not read it as "`deploy.mjs` has been
fixed": it still has no `--ref` and still takes whatever `main` is when it runs.
**Read the project-ref line's SHA on every deploy and diff it against the release
SHA.**

**Both databases are clean and nothing is pending anywhere**, for the third
release running. **So if `--status` or `--drift` shows you anything at all, it is
new.** The two legitimate one-sided cases, which keep recurring:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal. This is what `0.27.0` opened with: four pending, all four merged after the previous cut.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut, so there is no first job waiting for you.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-27-0`) and this record (`record-0-27-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- Several feature streams run in parallel with a release and are nothing to do with it. A release manager's business is the two it created.

**The shared-dev-database courtesy still applies to whoever runs the phone-width
script in testing** (it is not a release step —
`docs/decisions/2026-10-10-phone-width-is-not-a-release-step.md`):
`check-phone-width.mjs --clean` deletes every `phonewidth-*` login it finds, not
just its own. Leave it alone unless you are cleaning up after a killed run and
nobody else is working.

---

## The one thing to read before the next release

**`0.26.0`'s lesson stands unchanged and is still the most valuable thing here:
an option you put to Lutan is a commitment that it can be carried out. Verify the
mechanism before offering the choice, not after he has taken it.**

It did not bite at `0.27.0`, for the plain reason that no choice of ordering was
needed — but that is luck of the release's contents, not a process improvement.
`apply-migrations.mjs` **still** applies every pending file or none: there is no
`--upto`, and it still refuses to run when a file on `origin/main` is missing from
the checkout. The backlog item asking for `--upto` is still open. **If your release
needs a partial apply, it cannot be done today**, and that is the sentence to check
before you write any option down.

**What `0.27.0` adds to it is the cheaper half of the same lesson: verify the
premise of the question, not just your own options.** Lutan was asked whether he
had edited the permission grid, because `0182` narrows it. He said he had, and
added *"it is ok if they revert back"* — and the migration does not revert
anything. It writes no grid data at all; it changes the rules under the boxes, so a
half-given box **keeps displaying as ticked and silently stops working**. His
answer was fine, but his reason for being relaxed was the opposite of the truth,
and it would have been easy to take the "it's ok" and move on. **A reassuring
answer built on a wrong model is not an answer.** Say what will actually happen
before you accept the go-ahead.

---

## Lessons from `0.27.0` worth not re-learning

### 1. The silent-failure question can answer *no* — but only after the same work a *yes* takes

Four of the previous six answered `yes`. This one answered `no`, with four
migrations in it and drops in two of them. **The answer came from reading the live
release's source, not from the headers**, and that is now the settled method:

- `git grep '<thing being dropped>' <live sha> -- src worker` — if there are no hits outside scripts and comments, a drop is safe
- compare a replaced function's **signature**, not its body: `0183` changed `cashflow_forecast`'s numbers with an identical signature, so the live app could not break
- a narrowing policy change is safe in the **database-before-app** direction, and its decision file usually states who holds what

That is under two minutes of work and it is what separates this release from
`0.26.0`, where the same two commands found a total silent lock-out.

**The consumer warnings are now actively worth distrusting.** Four fired here with
the usual *"expect nothing to use it yet"*, which for a file that **drops** things
is simply the wrong sentence. **Third release running where the wording is the
opposite of the situation.** Read the file, not the warning.

### 2. A clean `--dry-run` is possible, so do not pre-write the excuse

`0.26.0` called the red dry-run "a recurring tax, not a curiosity" after a third
instance. `0.27.0`'s was **clean, all four `ok`**. The per-file
`begin … rollback` trap fires only when one pending file depends on an earlier
pending file's change; these four were independent. So the tax is real but
conditional — **read the files when it goes red, and do not assume it will.**

### 3. A false red can come from your own tooling, and LF vs CRLF is the one to expect

My cut-verification script reported `every previous entry is byte-identical` as
**FAILED** when the entries were identical — it compared a git blob (LF) against
the working file (CRLF). Three later scripts in the same release hit the same
thing on multi-line matches.

This matters more than it sounds. That assertion is precisely the one a cut cannot
afford to get wrong, so a false red on it is the one most likely to be shrugged
off next time. **Normalise `\r\n` before any multi-line compare on this machine**,
and when an assertion fails, confirm with `diff` and byte counts before touching
anything.

### 4. Budget the test Worker deploy as a background job

It **exceeded a 600-second foreground limit** and was moved to the background
mid-run. No harm — exit 0, read from its output file — but plan for it: the
production deploy is Lutan's and the test deploy is yours, and yours is the one
that will outrun a foreground command. Do not start it while anything else is
building in the main checkout.

### 5. `gh pr merge` — keep the practice, drop the prediction

`0.26.0` said treat the refusal as the norm. `0.27.0` was **not** refused, merged
first attempt after Lutan said *"Merge it"*. Two refusals in the last three
releases, and what differs is not visible from this side.

So the useful rule is not a forecast but a habit: **ask for the merge in the same
message that says the PR is green.** Then a refusal costs nothing, and its absence
costs nothing either. Do not retry blind, and do not route around it.

### 6. The classifier will refuse a production read, including a legitimate one

A read-only query of production's `role_permissions` was refused
(`Production Reads`) — and it fell on the one migration in the release that
narrows access, so it was the one check a release manager most wanted. It was
closed by asking Lutan plus a grep of the migration, which was enough here
because his edits were nowhere near the tightened pairs.

**Do not work around it.** But know that it can happen, that `--status`,
`--dry-run`, `--drift` and the apply itself all run fine, and that the gap is
specifically *ad-hoc queries*. If you need one, say what you were trying to
establish and let Lutan decide.

### 7. Where the time went

`0.25.0` ~50 min, `0.26.0` ~45 min, `0.27.0` **~75 min** end to end. Longer, and
honestly so — three questions to Lutan, the S1 security check he asked for, and a
backlog write-up were all inside that total. **Budget from the per-step figures,
not the total.**

| Step | Measured at `0.27.0` |
|---|---|
| `worktree.mjs new` | ~3 min, almost all `npm ci` |
| `gates.mjs` | ~5.7 min (typecheck 42 s, lint 126 s, build 171 s) |
| Full CI run on a PR | ~2 min, 7 checks |
| Production migration apply | **10 seconds** for four files |
| Pi build + restart | ~2 min, `ActiveEnterTimestamp` is the moment it began serving |
| Worker deploy, production | under ~11 min (bracketed: handover to mail delivery) |
| Worker deploy, test | **over 10 min** — exceeded a foreground limit; see lesson 4 |

### 8. Things that look alarming but are not

- Four `WARNING … declared consumer … differs from release` lines: see lesson 1. They fire for harmless files and dangerous ones alike, and their note is often the wrong way round.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. Green throughout `0.27.0`.
- A deploy log that looks like gibberish: `| tee` writes **UTF-16**. `tr -d '\000'` before grepping — **and note the `→` does not survive that conversion**, so grepping for the arrow in the project-ref line finds nothing. Grep for the project ref instead.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.
- `release mail for <version> [off]: sent 0, skipped 17` on the **test** deploy: correct by construction, `RELEASE_MAIL_ENV` is `""` there.
- A backgrounded `deploy.mjs` writing **nothing** to its log for many minutes: output is buffered when it is not a terminal. Not a hang.
- An edge-cache check reading `HIT, HIT, HIT` instead of `MISS, HIT, HIT`: fine if you loaded the page in the pane first — that load was the cache-filling request. What must not happen is a fresh query string each time, which gives `MISS` three times and proves nothing.
- A **gap in the PR numbers**: check it, do not reason about it. `0.27.0`'s gap at #546 was a PR still **open**, confirmed with `gh pr view 546`. And note `release-prs.mjs` exiting 0 does **not** by itself rule out a missed PR, because it only cross-checks migrations and test plans — a merged PR carrying neither would not be named.

---

## Outstanding verification — what actually matters

Seven of `0.27.0`'s eleven plans are `pending:`, by Lutan's decision at the cut.
The repo-wide `pending:` count is the normal standing state and is **not** a
release blocker — do not try to clear it.

What is worth carrying forward, most valuable first:

| Item | Where | Note |
|---|---|---|
| **One Admin or Management login opening Contacts, Shelter friends and Clinics** | `0182`, `docs/test-plans/perm-policy-cleanup.md` | **Raised by this release and the cheapest thing on this list.** `0182` narrows four read policies. The decision file says nobody loses anything because Management holds both cells of every pair — and that was measured on **dev**; the production grid became editable in `0.26.0` and could not be read from the release session. The failure shape is a page that comes back **empty**, not an error. Three pages, two minutes |
| **The five roles nobody has signed in as on production** — Management, Head of Maintenance, Head of Medical, Doctor, Volunteer | the permissions PRs in `0.26.0` | Carried from `0.26.0`, where Lutan did Admin and 2IC on release day and intended to cycle the rest that evening. **Nobody asked him again during `0.27.0`, so it is unknown whether he did — ask before carrying it forward at full weight.** Still fixable without a release, since Settings → Who does what is editable |
| **A donation receipt issued on production** | `docs/test-plans/receipt-content-server-side.md`, `receipt-issuer-server-side.md` | Carried from `0.23.0`, now **five** releases. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. It also writes the PDF to Drive |
| **Somebody using the renamed Clinics screens on production** | `docs/test-plans/vet-to-doctor-rename.md` | Carried from `0.24.0`. Nobody has read the Thai wording or worked a doctor login's day. **`0184` dropped the last four `vet*` compatibility views in this release**, so there is no fallback behind those screens any more |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | Carried from `0.22.0`, now a **sixth** release. It is also what *creates* the Storage bucket — `ensureBucket()` runs on first use. `0184` also changed who can read a room's Thai description, which is note 4 |
| **The restore recipe exercised once** | `backlog` → Deployment | **Half-closed.** A fresh encrypted production backup existed before `0.27.0`'s apply (the Pi's weekly cron, 03:00 that morning), so the backup half is covered by schedule rather than by anyone's action. **The restore has still never been run**, which is the half that actually proves anything |
| **The Pi's `SUPABASE_ACCESS_TOKEN`** | `backlog` → Security, architecture review S1 | **Confirmed present** 2026-10-11 and the item updated (`715039b1`). Not read by the running app, but **the weekly production backup needs it**, so step (1) must come before step (2) or the Sunday backup fails silently. The test clone's copy is excess and can go now |
| A Management login saving Management → Website | `docs/test-plans/website-content-grant.md` | Carried from `0.22.0`. Verified only by the migration applying cleanly |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |
| 2IC at phone width | `scripts/check-phone-width.mjs` | Not a release item (2026-10-10 decision), listed so it is not lost. The script has no `second_in_command`, so the 2IC, who has no PC on site, has never been measured. On the backlog |

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-11.md`.** Two releases in it now — read `0.27.0` end to end, and `0.26.0`'s apply-plan failure as well.
2. **Range starts at `47760a81`.** Run `release-prs.mjs 47760a81 HEAD` and read its exit code directly, not through a pipe. Expect it to exit 1 if any PR was squash-merged — and remember exit 0 does not prove the list is complete (lesson 8).
3. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new — see **Where things stand**.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. `0.27.0` was the **sixth** consecutive major, but on `0.21.0`–`0.24.0`'s grounds. Do not present six consecutive majors as one precedent; put the case for *minor* too, as `0.27.0` did — it was close.
5. **Ask whether anything in the release can fail silently** — and read the candidates in code before asking. Four of the last seven answered yes. Read every pending migration's header before the cut, then check each one against the live release's source. Two commands, under two minutes, in lesson 1.
6. **If the answer is yes, verify each option before you offer it** — and verify the premise of your question too. Both halves are at the top of this file. There is still no `--upto`.
7. **Expect a production-only guard.** There was none this time or last. It can only ever appear at the production dry-run, and it is a question for Lutan, not a file to fix.
8. **Budget the Worker deploys at ~8–13 minutes each**, do not overlap either with anything building in the same checkout, and expect the **test** one to outrun a foreground command. Fill the wait with the Pi builds, the drift checks and the record. **Do not start the test deploy while his production deploy is running.**
9. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held three releases running.
10. **Nine production-only checks are owed**, and the cheapest of them — three pages on one Admin login — was raised by this release. See the table above.
11. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.27.0` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, the test Worker
deploy and the merge, none of which were refused.

Three things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and say so when you hand it over.
- Hand it over as **one command per line** — `&&` does not parse in Windows PowerShell 5.1 — and always with the `| tee`.
- **Do not show it to him before then.** A command shown for context is indistinguishable from a command handed over, because the desktop app puts a Run button on every shell block.

The Worker production deploy deliberately has **no allow rule** and should not get
one: it is his by his own instruction of 2026-10-02, and it is what mails every
admin.
