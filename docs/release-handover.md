# Release handover — written 2026-10-15, after `0.31.0`

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

- **`npm ci` as step 1 earned its keep a third time**, and all four builds printed
  `Next.js version : 16.3.8` against `package.json`. Keep doing it.
- **The two-touch budget held for a third release**, and this time it held under
  pressure — see "`main` moved twice" below. All three allow rules worked again.
- **The three `ERROR Failed to copy …` lines are confirmed intermittent, not
  inferred.** `0.31.0` saw zero on the production Worker build and three on a
  test one, which is exactly what `0.30.0` saw. Two releases, both counts, same
  checkout minutes apart. **Closed — treat either count as normal and stop
  checking.** (If you want the belt-and-braces anyway it is one `ls` of
  `.open-next/server-functions/default/node_modules/` for `age-encryption`,
  `color-string` and `data-uri-to-buffer`.)
- **`--drift <env>` is still fine** and was quoted again on both databases.
- **`release-prs.mjs` exited 0 on the first run** — the first time in six
  releases. **Do not read that as fixed.** Nothing changed in the script; this
  range simply happened to contain no squash-merged PR. Keep the reconciliation
  drill at point 6 below.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-15.md` → the **`## 0.31.0`** section, end to end —
   especially "The migrations", **"Defect 1, and what the next release manager
   should take from it"**, and "What this record cannot say"
3. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges
   what, and the two-touch budget. `0.29.0`, `0.30.0` and `0.31.0` all ran under it
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.31.0`** @ `c1026407` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`c1026407`** — `node scripts/release-prs.mjs c1026407 <the new release SHA>` |
| Production database | `198 applied`, **0 pending**, `No drift: production matches origin/main.` |
| Dev database | `198 applied`, **0 pending**, `No drift: test matches origin/main.` |
| Next free migration number | **`0198`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA**, for the seventh release running —
**but for the first time it took three extra builds to make that true, rather
than being true by default.** Read Defect 1 in the record before planning the
next one; the short version is the new section below.

**Server Actions key checked on both pairs again** (new in `0.30.0`, now twice):
production `cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both. Two
comparisons, two greps, and it is the only thing that catches the Worker fallback
and the Pi disagreeing.

**Both databases are clean and nothing is pending anywhere**, for the eighth
release running. **So if `--status` shows you anything at all, it is new.** The
two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what the last four releases opened with.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). The same goes
for `--drift`: it is **`--drift test`**.

---

## The one new thing `0.31.0` learned: `main` moved twice, and the Worker cannot be pinned

This is the most useful thing in this file. `main` moved **twice** under the
release — `#625` between the first `release-prs.mjs` run and the cut's merge, and
`#627` *after* the cut merged, in the window between building the two Pis and
handing the production Worker deploy over.

The handover already told you `main` moves and gave the two remedies that worked:
**pin both Pi builds with `--ref <release sha>`**, and **re-run `release-prs.mjs`
against the release SHA, not `HEAD`**. Both earned their place — the re-run is the
only reason `#625` is in the record at all.

What it did not say, and is the point:

- **The Worker deploy cannot be pinned.** `deploy.mjs` takes **no `--ref`** and
  refuses a `main` that differs from `origin/main`. So the Worker is always built
  from whatever `main` is at that moment, while the Pi can be pinned to anything.
  The two have **different exposure to a moving `main`**, and the asymmetry only
  shows when it bites.
- **The window to protect runs from the cut's merge to the production Worker
  handover.** Anything built before a late merge has to be rebuilt after it if
  "all four from the release SHA" is to stay true. `0.31.0` rebuilt both Pis and
  the test Worker at `c1026407` — three builds, about fifteen minutes, and **zero
  extra touches for Lutan.**
- **The cheap fix is ordering, not vigilance. Consider handing the production
  Worker deploy over *first*, then building the two Pis pinned to the SHA that
  deploy reports.** That makes a late merge harmless at no cost.
- **But it conflicts with point 12 below**, which says to start the Pi production
  build the moment the cut is merged so it runs alongside the test Worker deploy.
  Both goals are real and they genuinely trade off: parallelism saves about ten
  minutes, pinning-after-the-Worker saves a rebuild when `main` moves.
  **This is worth deciding rather than re-deriving — put it to Lutan or write a
  decision file, and do not just pick one silently as `0.31.0` had to.**

One mitigating fact worth knowing before you panic: `#627` touched only
`.claude/`, `README.md`, a decision, a test plan and one script. **No build output
changed; only the SHA did.** Check what actually moved before deciding how much
rebuilding it is worth — a docs-only merge may not be worth three builds, and
saying so in the record is a perfectly good answer.

**The older lesson still stands and is still the most valuable one:** an option
you put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it
before offering an order that depends on it.

---

## Lutan's time: two touches, and `0.31.0` hit the budget a third time

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.31.0` cost him exactly those two**, as `0.29.0` and `0.30.0` did. `0.28.0`
cost five. It held even though the release moved under itself twice; the extra
work went into three rebuilds, not into his inbox. **That is the standard: absorb
it, do not hand it over.**

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time
  it exists the release is deployed and verified. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the
  test plans are exactly as they were. A red check is still never merged past.

### The two allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
```

alongside the older `Bash(ssh lutan@lanna-pi.local *)`. **Claude cannot read, add
or revert them** — the classifier refuses any access to that file as
self-modification. So you cannot check they are still there by looking; you find
out when a command is refused.

**All three were exercised on `0.31.0` and all three worked.** `gh pr merge 626
--merge` merged the cut with no prompt; `node scripts/apply-migrations.mjs --env
production` ran in its plain form and applied three files; and the Pi deploys,
rebuilds and backup-log reads all went over SSH without a prompt. **So `0.28.0`'s
Defect 3 has not recurred for three releases.** It remains unpredictable rather
than fixed: `0.27.1` got the plain form through, `0.28.0` did not, `0.29.0`,
`0.30.0` and `0.31.0` did. Send it plain, exactly
`node scripts/apply-migrations.mjs --env production` — no timestamps, no redirect,
nothing wrapped round it. **If it is refused anyway**, do not retry blind: hand it
to Lutan, say the dry-run was clean, and **ask him for the output**, or the record
cannot state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.31.0` he said it
was run and the log was there to read: `tr -d '\000' < deploy-0.31.0.log` (`tee`
writes UTF-16), then grep for the project ref, `Next.js version`,
`strip-baked-env`, the Server Actions key and the release mail line. All five were
right — but the version endpoint alone would not have told you the Server Actions
keys matched, or that the Worker had been built at `c1026407` rather than the
earlier SHA.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut. `main` *did* move under the release, twice — see above — so **do not assume
it will hold still**; it has now moved during two of the last three releases.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-31-0`) and this record (`record-0-31-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- There were already nine older leftovers before this release started, all `nothing beyond main` and all `HELD`. That is `/clean-streams` work, not a release manager's.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-15.md` → `## 0.31.0`**, especially Defect 1, then `0.28.0`'s Defect 2 in `2026-10-13.md`, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget, and a third is a defect to record. Never call the record PR "ready to merge when you say".
3. **`npm ci` in the main checkout before any deploy**, and read the `Next.js version :` line on the first Worker build against `package.json` anyway. Three releases running it has been the cheap step that would have caught the expensive fault.
4. **Check the Server Actions key on both pairs**, production Worker against production Pi and test Worker against test Pi. Two greps.
5. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.31.0` did this and got the version call in one word. The verification list has now closed nothing for **four** releases — **keep asking anyway.** The restore test into a real Supabase project has gone **five** releases unanswered and is still the cheapest item on it.
6. **Range starts at `c1026407`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. `0.31.0` exited 0 first time, which five releases before it did not; **expect exit 1 anyway**, match orphans by commit subject, then **confirm each against `gh pr view <n> --json mergeCommit`**. A PR-number range with **no gaps** is the independent check that none is missing.
7. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`, and the drift check is `--drift test`.
8. **Decide major or minor with Lutan before cutting.** `0.31.0` went major on the stated question — *can anyone do something today they could not do yesterday* — answering yes in two places. **There is no presumption either way.** Minor mails nobody.
9. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** `0.31.0`'s answer is worth reading as a worked example of the *weak* case done properly: a narrowed RLS policy over a reader that discards its error, closed by tracing every caller of the one function that reads those tables and finding exactly the two the policy allows. Also read why `0196` — which sounds far more dangerous — is the safer one, and why `0197` is the counter-example that shows the loud failure mode working.
10. **Expect a production-only guard.** There has been none for seven releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
11. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway. `0.31.0` applied three files in one run; the per-file dry-run trap did **not** fire even though the release had its exact shape, because a `create or replace function` does not need the earlier pending file's objects to exist.
12. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict.** But before you parallelise them, read the new section above: starting the Pi builds early is what made a late merge cost three rebuilds. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it** — possibly twice, if `main` moves.
13. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held eight releases running.
14. **Confirm the release mail arrived, not just `sent N`.** `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
15. `/clean-streams` for the release's own two worktrees once their PRs merge — and there are nine older leftovers waiting as well.

---

## The public site is still locked, and it is still the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate. Two consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise.
  `0.31.0` shipped **one of its five notes** about the public website, down from
  four of eight in `0.30.0` — but the blind spot is the same size, it just had
  less in it this time.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page
  to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a
  browser that will show one.

---

## Things that look alarming but are not

Everything `0.29.0`'s and `0.30.0`'s lists hold still applies, in particular: a
red `audit` never blocks (it was green again on `0.31.0`, which is still not the
usual state); `| tee` writes UTF-16 so `tr -d '\000'` before grepping, and the `→`
does not survive that conversion, so grep for the project ref; a backgrounded
`deploy.mjs` writing nothing for minutes is buffering, not hanging; `-- consumer:`
warnings naming files that differ from the live release are the safe direction;
and `deploy: release mail … [UAT]` on production is the production setting and the
mail is real. Also:

- **The `ERROR Failed to copy …` lines are closed** — see the top of this file. Either count is normal; stop investigating them.
- **A `gates.mjs` build that finishes in 59s where the last took 196s is a warm Turbopack cache.** `0.31.0`'s cut was a cold 142s. Read the exit codes, not the timings.
- **A second CI run on the cut PR is correct and expected.** Ticking the "CI green" line is itself a commit, which re-runs all seven checks. Wait for the second run before merging rather than merging on the first run's green. The **first** run on the cut branch also fails by construction, on `test-plan`, because the commit that creates the PR cannot yet contain the plan.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say `0.31.0`. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
