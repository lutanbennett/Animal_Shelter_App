# Release handover — written 2026-10-16, after `0.34.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction for this file: **when something it warns about gets
fixed, come back and say so** — a confidently wrong warning costs more than a
missing one. Honouring that, from the previous edition:

- **The deploy-command rule WORKED, first time.** This was the previous edition's
  headline: copy the production deploy command out of the runbook verbatim, do not
  compose one. It was followed, Lutan's deploy ran clean on the first attempt, and
  `0.33.0`'s Defect 1 did not recur. **Keep the rule exactly as written** — it is
  still among the most valuable things in this file, and it is cheap.
- **`release-prs.mjs` exited 0, with no orphans — the warning is withdrawn.** It had
  exited 1 for three releases running and this file said to keep the reconciliation
  drill. It exited 0 cleanly. **Keep running it and keep reading the exit code
  directly, but do not expect a non-zero.**
- **The record-PR orphan prediction was wrong in its mechanism.** The last edition
  said to expect exactly one orphan every release, being the previous release's
  record PR. The *situation* occurred — #668 is `0.33.0`'s record and is in this
  range — but the script **matched it to its PR instead of orphaning it**, so there
  was nothing to reconcile. Corrected below.
- **The per-file dry-run trap did NOT apply**, as in `0.32.0` and `0.33.0`, where
  `0.32.1` had it *fire*. All three files dry-ran `ok`. Say which of the three you got.
- **`npm ci` as step 1 earned its keep a seventh time**, and the `Next.js version :
  16.3.8` line matched `package.json` on both Worker builds. Keep doing it.
- **The two-touch budget was MET**, after `0.33.0` broke it with three. See the one
  honest caveat under *Lutan's time* below, and the small fix that closes it.
- **The build order is still right and still untested.** `main` held still for a
  fourth release, so the thing it exists to prevent has not happened yet. Do not
  read that as the precaution being unnecessary.
- **`--drift <env>` is still fine**, and both environments are clean. Run it on both.
- **The three `ERROR Failed to copy …` lines**: three on the test Worker build, none
  on production. Previous releases saw zero/zero and zero/three. Any count is normal.
  Keep not investigating it.

---

## Read this first: a gate script's exit code can contradict its own verdict

**New, and it is the one thing in this file that could make you do the wrong thing
with production.**

`node scripts/facility-map-holders.mjs --env production` is the gate before
`0212`. It exits 1 when a role would be stranded, so **non-zero means "DO NOT
APPLY"**. On `0.34.0` it printed its table and:

```
Environment: production. Roles holding facility.map: 6. Without facility.enclosures at Read: 0 (safe to retire)
```

and then died with

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94
```

exiting **127**. Reproduced twice before the apply and again after it. The
script's own `process.exit(stranded.length ? 1 : 0)` had already decided `0`; the
127 is libuv tearing down with the `fetch` keep-alive socket still open on
Windows, and says nothing about the check.

**The danger is the direction.** A session reading only the exit code would
conclude a passing safety gate had failed, and would refuse to apply a migration
that was provably safe. Worse, it might learn to wave away a non-zero exit from
this family of scripts and one day wave away a real one.

> **The rule: for these one-shot fetch-and-report scripts, read the printed
> verdict and the table. A non-zero exit accompanied by an `async.c` assertion
> line is noise. A non-zero exit WITHOUT one is a real verdict.**

Most `scripts/check-*.mjs` share the shape, and CI reads some of their exit
codes. A fix is filed on the `backlog` branch (a shared drain-then-exit helper in
`scripts/lib/`, plus a check of which CI jobs are exposed). Until it lands, the
rule above is what you have.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.34.0`** @ `598c2e56` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`598c2e56`** — `node scripts/release-prs.mjs 598c2e56 <the new release SHA>` |
| Production database | `213 applied`, `No drift`, **at the moment of the release**. Expect it to have gone to one or more pending by the time you read this — that is the normal case. **Run `--status --env production` yourself; do not trust this number.** |
| Dev database | `No drift` at the time of writing. It will go one-sided whenever a schema branch is applied to dev before merging, which is the schema-first rule working and happens most days. **Run `--drift test`; this row will be out of date.** |
| Next free migration number | **`0213`**, cleanly. `origin/main`'s highest is `0212`, and **no unmerged branch carries anything above it** — checked by listing `supabase/migrations` on every unmerged `origin/claude/*`. This is the first release in three where the obvious answer is the right one, so still check (`git branch -a`, `gh pr list`, dev's ledger) rather than trusting this row |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | **run `gh pr list`.** At the time of writing: **#676 `claude/planner-handover-182`**, opened by another stream *during* this release and deliberately left out of it, so `main` would not move after the cut. It is docs-only and should be an easy first merge. #665–#675 and #677 are merged |

**All four builds came from the release SHA**, for the eleventh release running —
and for the fourth running it cost nothing to make true, because `main` did not
move after the cut.

**Server Actions key checked on both pairs again** (now six times): production
`cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both. Both unchanged since
`0.31.0`, which is expected — they are environment configuration, not build
output, so **matching this file's values is not evidence you checked.** Compare
Worker against Pi. The Pi's second line, `the build in .next carries that key`, is
what ties the fingerprint to the artefact rather than to the config.

### This was a major release, so the mail went out — and this time arrival was confirmed

`deploy: release mail for 0.34.0 [UAT]: sent 1, skipped 1` — sent to
`lutan.bennett2@gmail.com`, skipped `lannacareforanimals@gmail.com` with
`E_RECIPIENT_NOT_ALLOWED`, which is expected and known. `[UAT]` on production is
the production setting and the mail is real.

**New, and worth repeating: the mail was then found in the inbox** — from
`releases@lannacare.org`, 13:19:58Z, unread, with the appeals note in the body.
This file has asked for arrival rather than `sent N` on a major release for two
editions; previous records settled it from the log alone. Searching the inbox
takes one call and turns an inference into a fact.

**Two consequences worth carrying forward:**

- **The rollback position has a real gap this release, and it is not only the mail.**
  `0212` retires a permission and has **no down-migration**, so a rollback to
  `0.33.0` code would meet a database where `facility.map` is gone. The condition
  that makes that harmless was verified on production before *and* after the apply.
  Code is reversible; schema and mail are not.
- **The mail check inverts with the version call.** On a major release confirm the
  mail *arrived*. On a minor release confirm the opposite — grep the log and show
  there is no `deploy: release mail` line at all.

---

## Lutan's time: two touches, and the fix for the near-miss

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.34.0` met that**, after `0.33.0`'s three. `0.28.0` cost five.

**What made the version call cheap, and is worth repeating.** One opening message
carried four things at once: the case for major stated plainly, the
silent-failure answer, the whole outstanding-verification list, and the one
housekeeping question (whether to fold an open green PR into the release). It
came back in a single round of three clicks. **Do not split these across
messages.**

**The near-miss, and the mechanical fix.** The runbook's §3 makes a `pending:`
manual verification *his* call. The full list did go out in the opening round —
but as information, with a trailing "say the word if you'd rather hold" rather
than as a question to answer. He sent a separate "continue with the release".
Nothing waited on it and it cost one short message, but it is avoidable:

> **Make the pending-items decision an explicit question in the opening round,
> alongside major-versus-minor.** Ship-with-gaps or hold — one more click, in the
> same round, instead of an invitation that needs a reply.

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time
  it exists the release is deployed and verified. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the
  test plans are exactly as they were. A red check is still never merged past.

### The three allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
"Bash(ssh lutan@lanna-pi.local *)"
```

**Claude cannot read, add or revert them** — the classifier refuses any access to
that file as self-modification. So you cannot check they are still there by
looking; you find out when a command is refused.

**All three were exercised on `0.34.0` and all three worked.** `gh pr merge 677
--merge` merged the cut with no prompt (and `gh pr merge 670 --merge` before it);
`node scripts/apply-migrations.mjs --env production` ran in its plain form and
applied **three** files; and both Pi deploys, the backup listing and the service
checks went over SSH without a prompt. **So `0.28.0`'s Defect 3 has not recurred
for seven releases.** It remains unpredictable rather than fixed. Send it plain,
exactly `node scripts/apply-migrations.mjs --env production` — no timestamps, no
redirect, nothing wrapped round it. **If it is refused anyway**, do not retry
blind: hand it to Lutan, say the dry-run was clean, and **ask him for the
output**, or the record cannot state the file order or the timing.

**Not everything over SSH is allowed, and that is correct.** A read of the Pi's
production env file — to settle whether the vet calendar is configured — was
refused as a production read on `0.33.0`, and was not retried on `0.34.0`. Do not
work around it. Ask Lutan, or write it down as something the record cannot say.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.34.0` he said it
was done and the log was there: `tr -d '\000' < deploy-0.34.0.log` (`tee` writes
UTF-16), then grep for the project ref (the arrow does not survive that
conversion), `Next.js version`, `strip-baked-env`, the Server Actions key, and the
release-mail line. All were right.

---

## Copy the deploy command out of the runbook, do not compose one

**Unchanged from the previous edition, because it worked.** `docs/release-procedure.md`,
under *Worker, production — Lutan runs this*, gives the command, says **"Not
`npm run deploy:prod`"** in bold, quotes the exact PowerShell error and explains
why the bare `node` form is what to hand over. It also tells you to add the `tee`.

> **Before the deploy steps, open `docs/release-procedure.md` and copy the
> production deploy command out of it verbatim.** Do not compose one.

For reference, the form the runbook gives is:

```bash
node scripts/deploy.mjs --env production | tee deploy-<version>.log
```

Two things that make the trap easy to walk into, worth keeping:

- It applies only to **his** terminal. Commands you run yourself through the Bash
  tool are fine as `npm`, so it works everywhere you test it.
- The production Worker deploy is the **only** command of a release he runs, so
  there is exactly one line per release to get right — and no second chance at it,
  because it is the irreversible step.

**And hand it over only at the moment he should run it.** Describe upcoming steps
in words, never in a code block; he once ran the production deploy three steps
early. That rule has now held twelve releases.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`. The order is:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan (**copied from the runbook** — see above)
5. build **both Pis**, pinned with `--ref` to the SHA his deploy reports

The reason, in one paragraph: a Pi build can be pinned (`deploy-pi.sh --ref <sha>`)
and a Worker build cannot (`deploy.mjs` has **no `--ref`** and refuses a `main`
that differs from `origin/main`). So the Worker is the build that cannot be made
to agree with the others, and it should therefore be the reference they are made
to agree with.

`0.34.0` followed it and it worked smoothly again. Two things to know:

- **It conflicts with "Do not idle" in `docs/release-procedure.md`**, which says to
  start the Pi production build the moment the cut merges. That advice is good in
  general and loses here; the decision file says why. The runbook has not been
  edited, so you will read both — the decision is newer and more specific. **There
  is plenty to do in the gap**: `0.34.0` spent it on `npm ci`, the record worktree,
  the production dry-run, reading the smoke-test pass and checking what was already
  on test.
- **Four releases now and none has tested it.** `main` held still every time. The
  real fix, if anyone wants to spend the time, is giving `deploy.mjs` a `--ref`,
  which would dissolve the question entirely.

**The older lesson still stands and is still the most valuable one:** an option you
put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it before
offering an order that depends on it.

---

## The record PR belongs to the previous release, but will not show as an orphan

**Corrected from the previous edition, which got the mechanism wrong.**

A record PR is written and merged *after* its release's cut SHA, so it
necessarily falls inside the **next** release's range while belonging to the
**previous** release. That much is right and will recur every release.

What the last edition got wrong is the consequence. It said to expect exactly one
**orphan** of this shape per release. On `0.34.0`, #668 (`0.33.0`'s record) was in
the range and `release-prs.mjs` **matched it to its PR normally** — exit 0, no
orphans at all.

**So: expect the previous release's record PR in your range, assign it to the
previous release, and do not expect the script to flag it.** If the script does
report an orphan, it is something else and needs the reconciliation drill
(match by commit subject, confirm with `gh pr view <n> --json state,mergeCommit`,
and check the merge commit is in the range with `git merge-base --is-ancestor`).

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the cut,
and `main` did not move after it either.

**#676 is open on purpose.** `claude/planner-handover-182` was opened by another
stream mid-release and left out so the cut would stay the tip. It is docs-only.
**Re-read its state before you assert anything about it** — `gh pr view 676 --json
state` costs a second, and `0.33.0`'s cut plan asserted a PR was open twenty
minutes after it had merged.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both times.
What is durable is the shape:

- A release's own two worktrees — the cut and the record — become free leftovers once their PRs merge, and clearing them is the release manager's last step.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- **A stream can be in flight with no PR, which a PR list will not show you.** `git branch -a` is the check that sees it; `gh pr list` is not.
- **A branch that is not an ancestor of `main` has not necessarily been left behind.** On `0.34.0`, `claude/weigh-first-app-3636d4` had six commits beyond `main` and looked like a finished stream with no PR. Its PR (#663) had merged that morning and the feature **is** on `main`; the branch tip just carried later test-plan commits. **Check whether the work shipped (`git ls-tree -r origin/main` for its files, `gh pr view <n> --json mergeCommit`, `merge-base --is-ancestor`) before concluding anything is missing.** Its release note was also already in `0.33.0`'s entry, not missing from `unreleased`.
- **A PR can merge while you are mid-release.** Decide deliberately whether to fold it in or leave it, and if you fold it in, re-run `release-prs.mjs` and re-check the plan count.

**If you repeat a number from this handover, run the list first and quote what it
says** — or write "run the list" and no number at all. A count copied from a
previous edition is not a fact, it is a quotation.

---

## A test plan must not assert a state it has not just re-read

`0.33.0`'s cut test plan said PR #662 was "open on purpose" and "the only gap in
the range". It had merged twenty minutes earlier. The *intention* to leave it alone
was formed early in the session and then written down later as if it were a fact.

**Re-read the thing immediately before you write the line.** `gh pr view <n> --json
state` costs a second.

`0.34.0` hit the same class of problem in a milder form and caught it: the
outstanding-manual-item count was given to Lutan as **six**, then #670 was folded
into the release and brought a seventh. The count was corrected to him explicitly
rather than quietly updated in the record. **If a number you have already told him
changes, say so.**

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-16.md` → `## 0.34.0`**, then `## 0.33.0` in the same file, then `0.32.1` in `2026-10-15.md` for the dry-run trap *firing* as a worked example.
2. **Copy the production deploy command out of `docs/release-procedure.md` verbatim.** It worked on `0.34.0` after costing `0.33.0` a third touch. Do not compose one.
3. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget. Never call the record PR "ready to merge when you say".
4. **`npm ci` in the main checkout before any deploy**, read `node_modules/next/package.json` against `package.json` straight afterwards, and read the `Next.js version :` line on the first Worker build as well. Seven releases running this has been the cheap step that would have caught the expensive fault.
5. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values, which have not changed in six releases and so prove nothing.
6. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, **the whole outstanding-verification list**, and **the pending-items decision as an explicit question** (the new item — see *Lutan's time*). Add any housekeeping the cut needs, such as an open green PR to fold in or leave. `0.34.0` did all but the pending-items question and the call came back in one round. The verification list has now closed **one** item in eight releases, which is better than none: `0212`'s production gate. The restore test into a real Supabase project has gone **nine** releases unanswered and is still the cheapest item on it.
7. **Range starts at `598c2e56`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. It exited 0 on `0.34.0`; do not assume a non-zero. **The previous release's record PR will be in your range and will not be flagged** — see the section above.
8. **Read both databases rather than trusting the table above.** `--status --env production` first: expect the last release's files applied, plus one pending per migration merged since. On dev, a red `--drift test` is usually legitimate: read the names it prints and ask whether an unmerged schema branch explains each (`git branch -a`, not just `gh pr list`). The dev database is `--env test` and the drift check is `--drift test`. **`--env dev` is not a thing** — the runner takes `test`, `uat` or `production`, and the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`).
9. **Decide major or minor with Lutan before cutting.** The question is *can anyone do something today they could not do yesterday*. `0.34.0` went major because three genuinely new abilities shipped — two majors in a row, which is a first. There is no presumption either way, and if the answer is yes and he still says minor, put that on the record as a decision rather than letting it read as an oversight.
10. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** `0.34.0`'s worked example: `0211`'s header claimed a safe fallback, and the SQL was checked to be `coalesce(latest_delivery_cost, typed_price)` over a `LEFT JOIN` before the claim was repeated. The **public-view rule** is the shape to look for in anything touching the public site: a column is public only when the public view names it, and an omission is silent. **And check the consumer, not only the view** — `0.34.0`'s appeal views *carry* `is_graphic`, but the blur only happens because `AppealCard.tsx` and `AppealGallery.tsx` actually read it.
11. **Name a quietly-breaking change separately from the count.** `0211` moves money figures on Cashflow wherever a priced delivery exists, and nobody has checked the new numbers against reality. That was put to Lutan as its own item, with an offer to hold the release and check one real item before and after; he accepted the risk and it is recorded. **He holds a release for a change that breaks quietly, so give him the chance to.**
12. **Expect a production-only guard.** There has been none for eleven releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
13. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway. `0.34.0` applied **three** files in one run, and the trap **did not apply**. Say which of the three cases you got. **Where a migration is non-additive, verify its precondition against production and re-verify its effect afterwards** — `0212`'s holders query was run before and after, and the "after" (`Roles holding facility.map: 0`) is what makes the record evidence rather than assertion.
14. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict** — but under the build order they come *after* the production Worker deploy, and they are quick. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**.
15. **Check what is already on test before overwriting it.** `0.33.0` found the test Pi on a feature-branch build from a verification; `0.34.0` found it on a clean `0.33.0` with nobody mid-test. Ask before destroying it.
16. **Clear your own two worktrees — the cut and the record — once their PRs merge**, as the last step of the release. Beyond that, run `node scripts/worktree.mjs list` and read it; do not carry a leftover *count* over from this file.
17. **Writing the cut's test plan *before* opening the PR makes the first CI run green**, where the template expects it to fail on `test-plan` by construction. `0.34.0` did this and the first run was green, the third release running. The cost is that the plan's header has to guess the PR number — `0.32.0` guessed wrong; `0.32.1`, `0.33.0` and `0.34.0` guessed right. **Then ticking the CI line is itself a commit, so a second run follows — wait for it and confirm its `headSha` matches your HEAD** with `gh run list --json databaseId,headSha,conclusion,status`, because the PR bar's cached reading can show the first run's result.
18. **Settle the vet calendar question.** Unresolved for two releases now. It was put to Lutan on `0.34.0` and not answered; nothing depends on it and no note promises it, so the release is safe either way. The Worker's quarter-hourly sweep has no token binding and **definitely** no-ops; whether the production Pi carries `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` cannot be read (refused as a production read, correctly). **Ask him directly rather than inferring, and when it is confirmed working, that is the PR that carries the release note**, per the truth rule.

---

## The public site is still locked, and it is still the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate — re-confirmed this release (`200`,
`Cache-Control: private, no-cache, no-store`, `x-lanna-cache: MISS`,
`x-lanna-served-by: pi`). Three consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise.
  **`0.34.0` put its headline feature squarely in that blind spot:** the public
  appeal pages are the entire point of fundraising appeals, and the deploy proves
  only that the code and schema shipped. The Medical-photo exclusion and the
  distressing-photo blur are correct in the views and in the components, and
  neither has been seen working on the live site.
- **A note that asserts a number is hidden more completely than one that asserts a
  layout.** `0.32.0`'s "about a third smaller" images is the standing example;
  nothing on the live site measured it, and nothing has since.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page
  to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a
  browser that will show one.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks (green again on `0.34.0`); `| tee` writes UTF-16 so strip the nulls
before grepping, and the arrow does not survive that conversion, so grep for the
project ref; a backgrounded `deploy.mjs` writing nothing for minutes is buffering,
not hanging; `-- consumer:` warnings naming files that differ from the live release
are the safe direction; and `deploy: release mail … [UAT]` on production is the
production setting and the mail is real. Also:

- **A gate script's 127 with an `async.c` assertion is noise** — the new section at the top of this file. Read the printed verdict.
- **A FAILED dry-run can be the correct result** — when a file rebuilds a view naming columns an earlier *pending* file adds, because the dry-run rolls each file back before the next. The runner says so itself and still exits 0. `0.34.0` had no such case; `0.32.1` is the worked example. A red that the runner does *not* explain is a real stop.
- **`--drift test` exiting 1 with dev *ahead* is usually normal.** It means a schema branch has been applied to dev before merging, which is the schema-first rule working.
- **`--drift production` exiting 1 mid-release is normal and the runner says so** — it prints `Expected if a release staged these on purpose` and names the release record as the place to check. Before the apply on `0.34.0` it listed exactly the three pending files.
- **A `gates.mjs` run that is much faster than the last one is a warm Turbopack cache.** `0.34.0`'s build was 112 s; `0.33.0`'s ran 34/86/91 against `0.32.1`'s 69/144/144 and all were equally green. Read the exit codes, not the timings. Note `gates.mjs` prints `test=0` as well as the three the template's expected line names.
- **A second CI run on the cut PR is correct and expected.** See item 17 above.
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes about four minutes; reading the run three times in the first ninety seconds tells you nothing. Do productive work in the gap instead.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. Under the build order this window is **longer**, because the Pi builds come last.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say the release. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
- **A red `lint` on a fresh release-cut branch may not be yours.** Check whether the failure exists on `main` before debugging your own branch.
- **A red `public-views` is almost certainly not yours — but unlike the others it genuinely blocks you.** It runs against the **shared dev database**, so when another stream applies a migration adding a public view before its PR merges, the check fails on **every branch cut from `main`** with `FAIL public_<thing>: anon SELECT is refused — HTTP 200 (a new public view? add it to PUBLIC_VIEWS)`. The fix lives on the other stream's branch. Read the failing view name, look for an unmerged schema branch that owns it (`git ls-tree -r origin/claude/<branch> --name-only -- supabase/migrations`, then `git grep` the view name there), and **wait for that merge rather than adding the view to `PUBLIC_VIEWS` on your own branch**, which duplicates their change and will conflict. On 2026-10-16 this was `0210_appeals.sql` (#667); #670 is the PR that records the whole mechanism, and it merged in `0.34.0`.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" to rule out a Dev badge matches the viewport meta tag twice. Read the context before treating it as a rollback signal — `0.34.0` checked this and found exactly those two matches and nothing else.
