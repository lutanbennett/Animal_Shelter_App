# Release handover — written 2026-10-12, after `0.27.1`

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
2. `docs/releases/2026-10-12.md` — `0.27.1` end to end. Then
   `docs/releases/2026-10-11.md` for `0.26.0`'s "order that turned out to be
   impossible" section, which is still the one lesson that keeps earning its place
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.27.1`** @ `3c7632ca` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`3c7632ca`** — `node scripts/release-prs.mjs 3c7632ca <the new release SHA>` |
| Production database | `187 applied`, **0 pending**, `No drift` |
| Dev database | `187 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0188`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA exactly** — both Pis and both
Workers, for the third release running. Do not read it as "`deploy.mjs` has been
fixed": it still has no `--ref` and still takes whatever `main` is when it runs.
**Read the project-ref line's SHA on every deploy and diff it against the release
SHA.** Both Pi builds were pinned with `--ref`, which is what actually guarantees
their half.

**Both databases are clean and nothing is pending anywhere**, for the fourth
release running. **So if `--status` or `--drift` shows you anything at all, it is
new.** The two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what `0.27.1` opened with: two pending, both merged after the previous cut.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**Note `--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat`
or `production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). Asking for
`dev` costs you a round trip and a confusing error.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut, so there is no first job waiting for you.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-27-1`) and this record (`record-0-27-1`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- Several feature streams run in parallel with a release and are nothing to do with it. A release manager's business is the two it created.

**`main` moved under this release** — a planner-handover PR merged between the PR
list being built and the cut merging. That is normal on this repo and is the
reason for lesson 2 below. Expect it.

---

## The one thing to read before the next release

**`0.26.0`'s lesson stands unchanged and is still the most valuable thing here:
an option you put to Lutan is a commitment that it can be carried out. Verify the
mechanism before offering the choice, not after he has taken it.**

It has not bitten for two releases, for the plain reason that no choice of
ordering was needed either time — luck of the releases' contents, not a process
improvement. `apply-migrations.mjs` **still** applies every pending file or none:
there is no `--upto`, and it still refuses to run when a file on `origin/main` is
missing from the checkout. The backlog item asking for `--upto` is still open.
**If your release needs a partial apply, it cannot be done today**, and that is
the sentence to check before you write any option down.

**`0.27.0` added the cheaper half — verify the premise of your question, not just
your options. `0.27.1` adds the cheapest half of all: ask.**

Nine production-only checks had been carried for up to six releases, two of them
described in `0.27.0`'s handover as unknown. They were put to Lutan in one
message at the **start** of this release, and he answered all nine. **Four
closed immediately**, including the three-page check the previous release had
named as the single highest-value outstanding item — and **one of them turned out
to have been done all along** and was being carried as a gap wrongly.

The previous handover had itself said *"ask before carrying it forward at full
weight"* about one of them. Following that instruction cost one message and
closed four items. **Put the whole outstanding list to him in the opening round,
together with major-versus-minor.** The cost is a few lines; the alternative is
writing "unknown" into a record for the sixth time.

---

## Lessons from `0.27.1` worth not re-learning

### 1. The major-versus-minor argument can come out *minor*, and this is the release that proves the stated ground was the real ground

Six consecutive majors ended here. `0.26.0`'s record had warned that the six were
not major for the same reason and must not be read as one precedent six times
over; `0.27.1` is the test of that, and it passed. The ground every major since
`0.21.0` was called on — **a page appears, or a role gains or loses something** —
was simply absent, both notes being fixes to things that already existed. Lutan
called it minor in one round.

So: **put the case for minor properly, every time.** `0.27.0`'s record said it
was close and ticked major anyway; this one was not close. The useful question is
not "how many notes" but *can anyone do something today they could not do
yesterday*.

**A minor release mails nobody**, and after six majors that silence looks like a
failure. `majorReleasesSince("<previous>")` returning `[]` before you commit the
cut is the check, and there is no `sent N, skipped M` line to go looking for
afterwards.

### 2. Build the PR list against the **release SHA**, after the cut merges — not against `HEAD` before it

`release-prs.mjs 47760a81 HEAD` was run before the cut, and a planner-handover PR
(#562) merged into `main` in the gap between that and the cut PR merging. The
release therefore contained a PR that was not in the list, and it was only caught
because `worktree.mjs sync` happened to create a test-plan file the list did not
mention.

`0.21.0`'s "**`main` moves under you during a release**" trap, in a new place: it
has always been described as hitting the *builds* and the *diffs*, and the
remedy — pin the Pi builds with `--ref` — does nothing for the PR list. **Run
`release-prs.mjs <prev release SHA> <this release SHA>` after the cut has merged**,
and treat an earlier run as provisional. Also re-read `unreleased` on `main`
afterwards and confirm it is empty: a note added by a PR that landed in that gap
would otherwise be silently stranded.

### 3. Four squash merges in one range — the script's exit 1 is now the normal case

`release-prs.mjs` exited 1 naming four orphaned test plans, all belonging to real
PRs (#546, #549, #557, #562) that were **squash-merged** and so carry no merge
commit with their number. The previous worst was one.

`0.27.0`'s record listed this under "things that look alarming but are not" and
that is still right, but the frequency has changed: **plan on reading the exit-1
list and resolving it by hand as a routine step**, not as an exception. The
resolution is quick — `gh pr list --state merged` over the number range, then
match the commit subject's `(#NNN)` — but it is not optional, and `0.27.0`'s
warning that **exit 0 does not prove completeness either** still stands.

### 4. Read CI from the run, not from `gh pr checks`

All seven jobs read `completed success` from `gh run view <run id> --json jobs`
while `gh pr checks <pr>` was still reporting `check` as `pending`. The PR-checks
view is a cache; the run is what did the work.

This is the same shape as the `| tail` exit-code trap the runbook already names,
and it is worth stating because the failure direction is benign-looking —
you wait on a green you already have. The dangerous version is the mirror image,
so **do not invert this into trusting `gh pr checks`' green either**: read the run.

### 5. A compound command can be refused where the plain one is not

The production migration apply was refused by the auto-mode classifier when sent
as one command with `date -u` stamps and a redirect wrapped around it. The plain
`node scripts/apply-migrations.mjs --env production` went through immediately,
first attempt, no retry of the refused form.

Two things follow. **Send the release's mutating commands in their plain form** —
the timestamps and the tee are a convenience and they are what got it refused.
And **the cost was real**: the apply's start and end timestamps were lost, so
`0.27.1`'s record cannot state the apply duration, which the previous three all
could. If you want the timing, read it from somewhere that is not wrapped around
the command itself.

Do not read the refusal as a production-access block. `--status`, `--dry-run`,
`--drift` and the apply all ran fine. `0.27.0`'s lesson 6 — the classifier *will*
refuse an ad-hoc production read, and you must not work around it — is unchanged
and separate.

### 6. The silent-failure question answered *no*, and the thing that made it safe was not in the header

Fifth of eight to answer `no`. The release carried `0186`, which replaces
`issue_donation_receipt` and adds `received_on <= issued_on <= shelter_today()`,
and the header says the signature is unchanged so any app keeps working. **True
and not sufficient.** What matters is whether what the live app *sends* satisfies
the new rule:

```
git grep 'p_issued_on' <live sha> -- src     → p_issued_on: todayIso()
git grep -A6 'function todayIso' <live sha>  → SHELTER_DATE_FORMAT.formatToParts(now)
```

`todayIso()` formats in the shelter's own zone, so it *is* `shelter_today()`.
Had it been UTC-based — which is the default mistake on this codebase and the
subject of its own runbook trap — every receipt issued between midnight and 07:00
Thai would have been refused with `22023`, on a path that takes a receipt number.

**So the method is settled and it is two commands: find what the live app passes
in, and find how that value is produced.** A signature check alone would have
reported this file safe for the wrong reason. Three minutes, and it is the same
`git grep` at the live SHA that `0.26.0` and `0.27.0` used.

The second file, `0187`, called itself *"defence in depth, not a live hole"*. That
was checked too, and the line worth checking was not the obvious one: the app
gates **both** the archive and the **restore** path on `medical.archive`
(`archive-actions.ts:49` and `:92`), and restore changes the same column. A guard
covering only the first would have broken restoring.

### 7. Budget both Worker deploys as background jobs, and the `npm ci` runs as the real cost

The test Worker deploy was backgrounded from the start on `0.27.0`'s advice and
that was right. What `0.27.1` adds: **the two `worktree.mjs new` runs were the
single largest cost of the release**, about 6 minutes each, almost all `npm ci` —
double `0.27.0`'s figure. Neither produces anything but a working tree.

Overlap them deliberately: create the cut worktree first, and create the **record**
worktree during the CI wait on the cut PR rather than after the merge. Both Pi
builds, by contrast, finished in well under a minute each off warm clones.

### 8. Things that look alarming but are not

Everything `0.27.0`'s list holds still applies, in particular: a red `audit` never
blocks; `| tee` writes UTF-16 so `tr -d '\000'` first, and the `→` does not
survive that conversion so grep for the project ref; a backgrounded `deploy.mjs`
writing nothing for minutes is buffering, not hanging; and a PR-number gap should
be checked, not reasoned about. New this release:

- **No release mail at all, and no `sent N, skipped M` line.** Correct on a minor release. See lesson 1.
- **A `-- consumer:` header firing no warning.** `0186` has one and printed nothing, because the file is in the release assumed live. Three releases running the *wording* of these warnings has been the opposite of the situation; this is the first where the useful behaviour is their silence.
- **`--env dev` rejected.** The dev database is `--env test`.
- **The note lines in the new entry indented four spaces** where the other 41 use six. Cosmetic, all gates pass, recorded as a defect rather than fixed against a shipped entry.
- **`ERROR Failed to copy C:…
ode_modules<pkg>` during the test Worker build**, three of them, mid-`Building server function`. **Non-fatal**: the build continued, uploaded 178 assets and exited 0, and the deployed build answers `0.27.1`. This is the known Windows OpenNext file-lock noise. Before treating it as a failure, check the process is still burning CPU (`Get-Process node`) — it was, 177 CPU seconds, which is what distinguishes this from a genuine stall.

### 9. Where the time went

`0.25.0` ~50 min, `0.26.0` ~45 min, `0.27.0` ~75 min, `0.27.1` **~105 min** end
to end — but most of that was waiting on two `npm ci` runs and a 13-minute Worker
deploy, all of which were overlapped with other work. **Budget from the per-step
figures, not the total.**

| Step | Measured at `0.27.1` |
|---|---|
| `worktree.mjs new` | ~6 min, almost all `npm ci` — and it happens twice |
| `gates.mjs` | ~5.6 min (typecheck 41 s, lint 126 s, build 169 s) |
| Full CI run on a PR | ~2 min, 7 checks |
| Production migration apply | not measured — see lesson 5 |
| Pi build + restart | **under 20 s** off a warm clone. `ActiveEnterTimestamp` is the moment it began serving |
| Worker deploy, production | ~13 min |
| Worker deploy, test | **9 min 31 s** — background it anyway; it was 10+ min on `0.27.0` |

---

## Outstanding verification — what actually matters

**Four items closed this release, by asking.** Read the top of this file before you
carry any of the rest forward: the list below is shorter than it has been since
`0.22.0`, and it got that way in one message.

| Item | Where | Note |
|---|---|---|
| **A donation receipt issued on production** | `docs/test-plans/receipt-content-server-side.md`, `receipt-issuer-server-side.md` | Carried from `0.23.0`, now **six** releases, and **Lutan asked to be reminded**. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. It also writes the PDF to Drive. **`0186` now bounds the receipt date** between the donation and Thai today, which is new behaviour on this exact path and has never been exercised on production — so this item is worth more than it was |
| **Somebody using the renamed Clinics screens on production** | `docs/test-plans/vet-to-doctor-rename.md` | Carried from `0.24.0`; **Lutan asked to be reminded**. Nobody has read the Thai wording or worked a doctor login's day, and `0184` dropped the last `vet*` compatibility views, so there is no fallback behind those screens |
| **The restore recipe exercised once** | `backlog` → Deployment | **Was in progress on release day.** Lutan said *"Restore to be tested later today"* and the three production backups he took that morning (11:40, 11:42, 11:46 Pi local) are what satisfied this release's backup gate. **Ask him how it went** — if it completed, this is the first time ever and the item closes; the backup half has been covered by the weekly cron for some time, and the restore is the half that proves anything |
| The three smaller ones: a Management login saving Management → Website; the signed-out public tour; 2IC at phone width | `docs/test-plans/website-content-grant.md`; every release record; `scripts/check-phone-width.mjs` | All carried, all **"still to be done, remind me later"**. The public tour is blocked by `PUBLIC_SITE` being `locked`, so it is a standing gap rather than a task. 2IC at phone width is explicitly **not** a release step (2026-10-10 decision) and the script has no `second_in_command`; it is on the backlog |
| **The release's own two notes read on a screen** | `docs/test-plans/cut-release-0-27-1.md` | Raised by this release and the cheapest thing here. The `0.27.1` entry on `/releases`, and the new "not allowed" message on `/maintenance` and `/projects`. Behind sign-in, so this session could not look. Two minutes |

**Closed this release, so that nobody carries them again:** the three pages `0182`
narrowed (*"All operate correctly"*); the five roles nobody had signed in as
(*"This is not accurate, all roles have been checked"* — it had been recorded as a
gap wrongly); and the first facility-map upload (*"I have uploaded 3 facility maps
already"*, which also means `ensureBucket()` has run for real).

**The repo-wide `pending:` count is the normal standing state and is not a release
blocker** — do not try to clear it. Four of this release's sixteen plans carry one.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-12.md`**, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. That last part closed four items this release; see the top of this file.
3. **Range starts at `3c7632ca`** — and run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it (lesson 2). Read its exit code directly, not through a pipe. Expect exit **1** with squash-merged PRs to resolve by hand (lesson 3), and remember exit 0 does not prove completeness.
4. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`.
5. **Decide major or minor with Lutan before cutting.** `0.27.1` broke a run of six majors, so **there is no longer a presumption either way** — put both cases and let him choose. Minor mails nobody.
6. **Ask whether anything in the release can fail silently**, and read the candidates in code first. The method is two `git grep`s at the live SHA: what does the live app pass in, and how is that value produced (lesson 6). A matching signature is not an answer.
7. **If the answer is yes, verify each option before you offer it** — and verify the premise of your question too. There is still no `--upto`.
8. **Expect a production-only guard.** There was none for three releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
9. **Send mutating commands in their plain form**, without timestamps or redirects wrapped round them (lesson 5).
10. **Budget the Worker deploys at ~8–13 minutes each**, background the test one, and do not overlap either with anything building in the same checkout. Start the record worktree during the CI wait, not after the merge.
11. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held four releases running.
12. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.27.1` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, the test Worker
deploy and the merge. **`gh pr merge` was not refused this time** (two refusals in
the last four releases); ask for the merge in the same message that says the PR is
green, and do not retry a refusal blind.

Three things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and say so when you hand it over.
- Hand it over as **one command per line** — `&&` does not parse in Windows PowerShell 5.1 — and always with the `| tee`.
- **Do not show it to him before then.** A command shown for context is indistinguishable from a command handed over, because the desktop app puts a Run button on every shell block.

The Worker production deploy deliberately has **no allow rule** and should not get
one: it is his by his own instruction of 2026-10-02, and on a major release it is
what mails every admin.
