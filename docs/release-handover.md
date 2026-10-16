# Release handover — written 2026-10-16, after `0.33.0`

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

- **`release-prs.mjs` exited 1 again, for the third release running.** The warning
  stands exactly as written. **Keep the reconciliation drill**, and see the new
  point about the record-PR orphan below, which explains one of the three.
- **The per-file dry-run trap did NOT apply this time**, where `0.32.1` had it
  *fire* and `0.32.0` had it *not apply*. All three files dry-ran `ok`. The
  three statements remain genuinely different; say which one you got.
- **`npm ci` as step 1 earned its keep a sixth time**, and all four builds printed
  `Next.js version : 16.3.8` against `package.json`. Keep doing it.
- **Defect 1 is now provably closed.** The previous edition said it was fixed;
  this release is the evidence. `--drift test` reports `No drift`, the guard
  merged as #658, and there is nothing carried forward.
- **The two-touch budget BROKE this release — three touches.** See the standing
  rule immediately below, which is the single most important thing in this file.
- **The build order is still right and still untested.** `main` held still for a
  third release, so the thing it exists to prevent has not happened yet. Do not
  read that as the precaution being unnecessary.
- **`--drift <env>` is still fine**, and both environments are clean. Run it on both.
- **The three `ERROR Failed to copy …` lines**: none appeared on either build this
  release, where previous ones saw zero on production and three on test. Any of
  those counts is normal. Keep not investigating it.

---

## Read this first: copy the deploy command out of the runbook, do not compose one

**`0.33.0` cost him a third touch for this, and it was entirely avoidable.** The
production Worker deploy was handed over as `npm run deploy:prod`. PowerShell on
his machine refuses npm's `.ps1` shim —

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running
scripts is disabled on this system.
```

— so the deploy did not start, and he had to come back and say so at the one
moment in the release where his attention is most expensive.

**And the answer was already written down, in the right place.**
`docs/release-procedure.md`, under *Worker, production — Lutan runs this*, gives
the command to hand over, says **"Not `npm run deploy:prod`"** in bold, quotes the
exact error, and explains that `npm.cmd` works but the bare `node` form "has no
wrapper to go wrong and is what should be handed over". It even tells you to add
the `tee`. The same quirk is in the session memory, and it stalled `0.15.0` on
2026-10-02.

**So the rule is not "remember the quirk".** Remembering failed twice. The rule is
mechanical:

> **Before the deploy steps, open `docs/release-procedure.md` and copy the
> production deploy command out of it verbatim.** Do not compose one.

That is this file's *Read these first* item 1, and skipping it is what cost the
third touch. For reference, the form the runbook gives is:

```bash
node scripts/deploy.mjs --env production | tee deploy-<version>.log
```

Two things that make the trap easy to walk into, worth knowing:

- It applies only to **his** terminal. Commands you run yourself through the Bash
  tool are fine as `npm`, so it works everywhere you test it.
- The production Worker deploy is the **only** command of a release he runs, so
  there is exactly one line per release to get right — and no second chance at it,
  because it is the irreversible step.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.33.0`** @ `83ff5a86` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`83ff5a86`** — `node scripts/release-prs.mjs 83ff5a86 <the new release SHA>` |
| Production database | `210 applied`, `No drift` **at the moment of the release**. It has since gone to **1 pending** — `0210_appeals.sql`, merged as #667 after the release. That is the normal case: production carries the last release, and whatever merged since is pending for the next one. **Run `--status --env production` yourself; do not trust this number.** |
| Dev database | `No drift` at the time of writing — **clean for the first time since Defect 1 was opened.** It went one-sided for an hour in between, while #667 had `0210` applied to dev but unmerged, and clean again when that merged. **That cycle is the schema-first rule working and will happen most days. Run `--drift test`; this row will be out of date.** |
| Next free migration number | **`0211`**, not `0210`. `origin/main`'s highest is `0209`, so the rule would say `0210` — but **#667 (`claude/appeals-schema`) already carries `0210` and has applied it to dev.** Check `git branch -a`, `gh pr list` and dev's ledger before numbering; `0.32.1` handed over exactly this trap and it has recurred within the hour |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | **run `gh pr list`.** At the time of writing: #665 `script-fixes-fold` and #666 `book-clinic-card-tile-fix`, both of which were red only because of the `public-views` coupling below and should clear now #667 has merged. #653–#664 and #667 are merged |

**All four builds came from the release SHA**, for the tenth release running — and
for the third running it cost nothing to make true, because `main` did not move
after the cut.

**Server Actions key checked on both pairs again** (now five times): production
`cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both. Both unchanged since
`0.31.0`, which is expected — they are environment configuration, not build
output, so **matching this file's values is not evidence you checked.** Compare
Worker against Pi. The Pi's second line, `the build in .next carries that key`, is
what ties the fingerprint to the artefact rather than to the config.

### This was a major release, so the mail actually went out

`deploy: release mail for 0.33.0 [UAT]: sent 1, skipped 1` — sent to
`lutan.bennett2@gmail.com`, skipped `lannacareforanimals@gmail.com` with
`E_RECIPIENT_NOT_ALLOWED`, which is expected and known. `[UAT]` on production is
the production setting and the mail is real.

Two consequences worth carrying forward:

- **The rollback position had a gap again.** `0.32.1` was minor and could report a
  rollback with no gap at all; that was a property of the minor call, not a
  standing improvement. On a major release the production Worker deploy is a real
  point of no return.
- **The mail check inverts with the version call.** On a major release confirm the
  mail *arrived*, not merely that the log says `sent N`. On a minor release confirm
  the opposite — grep the log and show there is no `deploy: release mail` line at
  all.

---

## The record PR is always an orphan in the next release's range

**New, and it will recur on every single release, so do not re-derive it.**

`release-prs.mjs` flagged three orphan files this release. Two were ordinary
squash-merged PRs. The third was `docs/test-plans/record-0-32-1.md`, introduced by
**#652 — `0.32.1`'s own record PR**.

A record PR is written and merged *after* its release's cut SHA. So it
necessarily falls inside the **next** release's range while belonging to the
**previous** release. The script cannot know the difference and never will.

**Expect exactly one orphan of this shape every release, and expect it to be the
previous release's record.** Confirm it against GitHub like any other, then assign
it to the previous release and move on. It is not a missing PR.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`. The order is:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan (**copied from the runbook** — see the rule above)
5. build **both Pis**, pinned with `--ref` to the SHA his deploy reports

The reason, in one paragraph: a Pi build can be pinned (`deploy-pi.sh --ref <sha>`)
and a Worker build cannot (`deploy.mjs` has **no `--ref`** and refuses a `main`
that differs from `origin/main` — re-confirmed this release by reading the script).
So the Worker is the build that cannot be made to agree with the others, and it
should therefore be the reference they are made to agree with.

`0.33.0` followed it and it worked smoothly. Two things to know:

- **It conflicts with "Do not idle" in `docs/release-procedure.md`**, which says to
  start the Pi production build the moment the cut merges. That advice is good in
  general and loses here; the decision file says why. The runbook has not been
  edited, so you will read both — this one is newer and more specific. **There is
  plenty to do in the gap**: `0.33.0` spent it on `npm ci`, the record worktree and
  drafting the record.
- **Three releases now and none has tested it.** `main` held still every time, so
  the new order has still never been exercised by the thing it exists to prevent.
  The real fix, if anyone wants to spend the time, is giving `deploy.mjs` a
  `--ref`, which would dissolve the question entirely.

**The older lesson still stands and is still the most valuable one:** an option you
put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it before
offering an order that depends on it.

---

## Lutan's time: two touches, and `0.33.0` missed by one

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.29.0` through `0.32.1` all hit that. `0.33.0` did not** — three, the extra one
being the `npm.ps1` refusal. `0.28.0` cost five. **The standard is still two:
absorb it, do not hand it over.**

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect. `0.33.0` does
this as its Defect 1.

**What made the version call cheap, and is worth repeating.** The opening message
carried three things at once: the case for major stated plainly, the
silent-failure answer, and the whole outstanding-verification list. He answered in
one round. Do not split these across messages.

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

**All three were exercised on `0.33.0` and all three worked.** `gh pr merge 664
--merge` merged the cut with no prompt; `node scripts/apply-migrations.mjs --env
production` ran in its plain form and applied **three** files; and both Pi deploys
and the backup-log read went over SSH without a prompt. **So `0.28.0`'s Defect 3
has not recurred for six releases.** It remains unpredictable rather than fixed.
Send it plain, exactly `node scripts/apply-migrations.mjs --env production` — no
timestamps, no redirect, nothing wrapped round it. **If it is refused anyway**, do
not retry blind: hand it to Lutan, say the dry-run was clean, and **ask him for the
output**, or the record cannot state the file order or the timing.

**Not everything over SSH is allowed, and that is correct.** A read of the Pi's
production env file — to settle whether the vet calendar is configured — was
**refused as a production read**, with the `ssh` allow rule in place. Do not work
around it. Ask Lutan, or write it down as something the record cannot say, which
is what `0.33.0` did.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.33.0` he said it
was finished and the log was there: `tr -d '\000' < deploy-0.33.0.log` (`tee`
writes UTF-16), then grep for the project ref (the arrow does not survive that
conversion), `Next.js version`, `strip-baked-env`, the Server Actions key, and the
release-mail line. All were right.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the cut,
and `main` did not move after it either.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both times.
What is durable is the shape:

- A release's own two worktrees — the cut and the record — become free leftovers once their PRs merge, and clearing them is the release manager's last step.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- **A stream can be in flight with no PR, which a PR list will not show you.** `git branch -a` is the check that sees it; `gh pr list` is not. `0.32.1` handed over exactly this case and it has since merged as #661.
- **A PR can also merge while you are mid-release.** #662 merged during `0.33.0`'s CI wait and landed *below* the cut, so it is in the release. That was harmless, but the cut's test plan had already asserted it was still open — see the next section.

**If you repeat a number from this handover, run the list first and quote what it
says** — or write "run the list" and no number at all. A count copied from a
previous edition is not a fact, it is a quotation.

---

## A test plan must not assert a state it has not just re-read

`0.33.0`'s cut test plan said PR #662 was "open on purpose" and "the only gap in
the range". It had merged twenty minutes earlier. The *intention* to leave it alone
was formed early in the session and then written down later as if it were a fact.

The outcome was harmless — #662 landed below the cut, `main` did not move after the
release SHA, and it is a docs-only change with its own completed plan. **The method
is the fault.** A test plan is exactly the wrong document in which to state
something unchecked, and the same habit applied to a migration number, a deploy
target or a backup would not have been harmless.

**Re-read the thing immediately before you write the line.** `gh pr view <n> --json
state` costs a second.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-16.md` → `## 0.33.0`**, then `0.32.1` in `2026-10-15.md` for the dry-run trap *firing* as a worked example, then `0.28.0`'s Defect 2 in `2026-10-13.md`.
2. **Copy the production deploy command out of `docs/release-procedure.md` verbatim** — the rule at the top of this file. Composing one from habit has now cost two releases, and the runbook has had the answer the whole time.
3. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget, and a third is a defect to record. Never call the record PR "ready to merge when you say".
4. **`npm ci` in the main checkout before any deploy**, read `node_modules/next/package.json` against `package.json` straight afterwards, and read the `Next.js version :` line on the first Worker build as well. Six releases running this has been the cheap step that would have caught the expensive fault.
5. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values, which have not changed in five releases and so prove nothing.
6. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.33.0` did this and the version call came back in one round. The verification list has now closed nothing for **seven** releases — **keep asking anyway.** The restore test into a real Supabase project has gone **eight** releases unanswered and is still the cheapest item on it.
7. **Range starts at `83ff5a86`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. **Expect exit 1**, three releases running. Match orphans by commit subject, then **confirm each against `gh pr view <n> --json state,mergeCommit`**, and check the merge commit really is in the range with `git merge-base --is-ancestor`. **One orphan will be the previous release's record PR** — see the section above.
8. **Read both databases rather than trusting the table above.** `--status --env production` first: expect the last release's files applied, plus one pending per migration merged since — `0210_appeals.sql` was already pending there before this handover was finished. On dev, a red `--drift test` is usually legitimate: read the names it prints and ask whether an unmerged schema branch explains each (`git branch -a`, not just `gh pr list` — a stream can be committed and applied with no PR). The dev database is `--env test` and the drift check is `--drift test`. **`--env dev` is not a thing** — the runner takes `test`, `uat` or `production`, and the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`).
9. **Decide major or minor with Lutan before cutting.** The question is *can anyone do something today they could not do yesterday*. `0.33.0` went major because three genuinely new abilities shipped. There is no presumption either way, and if the answer is yes and he still says minor, put that on the record as a decision rather than letting it read as an oversight.
10. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** The **public-view rule** is the shape to look for in anything touching the public site: a column is public only when the public view names it, and an omission is silent. `0.33.0` checked all three new public columns against the views by hand and it closed clean, the first time in three releases.
11. **Expect a production-only guard.** There has been none for ten releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
12. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway. `0.33.0` applied **three** files in one run, and the trap **did not apply**. Say which of the three cases you got.
13. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict** — but under the build order they come *after* the production Worker deploy. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**.
14. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held eleven releases running.
15. **Clear your own two worktrees — the cut and the record — once their PRs merge**, as the last step of the release. Beyond that, run `node scripts/worktree.mjs list` and read it; do not carry a leftover *count* over from this file.
16. **Writing the cut's test plan *before* opening the PR makes the first CI run green**, where the template expects it to fail on `test-plan` by construction. `0.33.0` did this and the first run was green, the third release running. The cost is that the plan's header has to guess the PR number — `0.32.0` guessed wrong, `0.32.1` and `0.33.0` guessed right. Worth doing, and worth knowing so a green first run does not look like a mistake.
17. **Settle the vet calendar question.** `0.33.0` shipped it with no release note because it may be dormant, and could not establish whether the production Pi carries `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` — the read was refused as a production read. The Worker's quarter-hourly sweep needs the token as a Worker binding and does not have one, so **that half definitely no-ops**. Ask Lutan rather than inferring. When it is confirmed working, **that** is the PR that carries the release note, per the truth rule.

---

## The public site is still locked, and it is still the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate — re-confirmed this release. Three consequences a
release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise.
  `0.33.0` put the "since &lt;year&gt;" home-page label and Thai breed and colour on
  `/adopt` in that blind spot; the deploy proves only that the code and schema
  shipped.
- **A note that asserts a number is hidden more completely than one that asserts a
  layout.** `0.32.0`'s "about a third smaller" images is the standing example;
  nothing on the live site measured it, and nothing has since.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page
  to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a
  browser that will show one.

---

## Things that look alarming but are not

Everything `0.32.0`'s and `0.32.1`'s lists hold still applies, in particular: a red
`audit` never blocks (green again on `0.33.0`); `| tee` writes UTF-16 so strip the
nulls before grepping, and the arrow does not survive that conversion, so grep for
the project ref; a backgrounded `deploy.mjs` writing nothing for minutes is
buffering, not hanging; `-- consumer:` warnings naming files that differ from the
live release are the safe direction; and `deploy: release mail … [UAT]` on
production is the production setting and the mail is real. Also:

- **A FAILED dry-run can be the correct result** — when a file rebuilds a view naming columns an earlier *pending* file adds, because the dry-run rolls each file back before the next. The runner says so itself and still exits 0. `0.33.0` had no such case; `0.32.1` is the worked example. A red that the runner does *not* explain is a real stop.
- **`--drift test` exiting 1 with dev *ahead* is usually normal.** It means a schema branch has been applied to dev before merging, which is the schema-first rule working. Both environments are clean as of this writing.
- **A `gates.mjs` run that is much faster than the last one is a warm Turbopack cache.** `0.33.0`'s ran at 34/86/91 seconds against `0.32.1`'s 69/144/144 and was equally green. Read the exit codes, not the timings.
- **A second CI run on the cut PR is correct and expected.** Ticking the "CI green" line is itself a commit, which re-runs all seven checks. Wait for the second run before merging. **Confirm the run's `headSha` matches your HEAD** with `gh run list --json databaseId,headSha,conclusion,status` — the PR bar's cached reading can still show the *first* run's result.
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes about four minutes; reading the run three times in the first ninety seconds tells you nothing. Do productive work in the gap instead.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. Under the build order this window is **longer**, because the Pi builds come last. `0.33.0` observed it and it closed on schedule.
- **The test Pi may be sitting on a feature-branch build, not a stale release.** `0.33.0` found it on `3fee5b3d` from the vet-calendar verification. Check what is on test before overwriting it, and ask whether anyone is mid-test.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say the release. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
- **A red `lint` on a fresh release-cut branch may not be yours.** Check whether the failure exists on `main` before debugging your own branch.

**Update 2026-10-16 (`claude/ci-script-fixes-fold`): the stopgap below is mostly retired.** `check-public-views.mjs` now prints `WARN` and skips a view that another unmerged `origin/*` branch's migration creates, so that collision no longer turns your branch red. A `FAIL ... a new public view?` that remains means **no other branch claims the view**: it is on `main`, in your own migrations, or unaccounted for, and that is a real finding, not noise. The manual hunt below is only needed for the rare case where the foreign branch has not been pushed.

**And a red `public-views` is almost certainly not yours — but unlike the others it
genuinely blocks you.** This bit `0.33.0`'s record PR. The mechanism, because it will
recur and cost someone an hour:

- `public-views` runs against the **shared dev database**, not against your branch.
- The schema-first rule says a schema branch applies its migration to dev **before it
  merges**. So the moment another stream applies a migration that adds a public view,
  that view **exists in dev** while `scripts/check-public-views.mjs` on `main` does
  not list it.
- The check then fails on **every branch cut from `main`**, with
  `FAIL public_<thing>: anon SELECT is refused — HTTP 200 (a new public view? add it
  to PUBLIC_VIEWS)`.
- The fix lives on the *other* stream's branch, which normally does update
  `PUBLIC_VIEWS` — so **there is nothing to fix on yours.** It clears when that PR
  merges.

**What to do:** read the failing view name and look for an unmerged schema branch that
owns it (`git ls-tree -r origin/claude/<branch> --name-only -- supabase/migrations`,
then `git grep` the view name on that branch). If one does, say so and wait for that
merge rather than changing anything. **Do not add the view to `PUBLIC_VIEWS` on your
own branch to go green** — that duplicates the other stream's change and will conflict.

On 2026-10-16 this was `0210_appeals.sql` (#667), applied to dev about a minute after
that PR's own CI had passed — which is why its run was green and every other branch's
went red.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" to rule out a Dev badge matches the viewport meta tag twice. Read the context before treating it as a rollback signal.
