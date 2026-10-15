# Release handover — written 2026-10-15, after `0.32.0`

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

- **The build-order question is now DECIDED, and the previous edition's long
  "worth deciding rather than re-deriving" section is gone.** See "The order of
  the four builds" below. Do not re-open it from scratch; disagree with the
  decision file if you disagree.
- **`npm ci` as step 1 earned its keep a fourth time**, and all four builds printed
  `Next.js version : 16.3.8` against `package.json`. Keep doing it. `0.32.0` also
  read `node_modules/next/package.json` directly before any deploy, which is the
  cheaper half of the same check and catches it earlier.
- **The two-touch budget held for a fourth release.** All three allow rules worked
  again, `apply-migrations.mjs --env production` in its plain form included.
- **The three `ERROR Failed to copy …` lines stayed closed.** `0.32.0` saw zero on
  the production Worker build and three on the test one — the third release with
  that exact split. It was **not investigated**, which is the point of calling it
  closed. Keep not investigating it.
- **`--drift <env>` is still fine** and was quoted again on both databases.
- **`release-prs.mjs` exited 0 on the first run again** — twice in a row now, after
  five releases where it did not. **Still do not read that as fixed.** Nothing in
  the script changed; these two ranges happened to contain no squash-merged PR.
  Keep the reconciliation drill at point 6 below.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-15.md` → the **`## 0.32.0`** section, end to end —
   especially "The silent-failure question, and why the dangerous-looking file is
   the safe one", "What the next release manager should take from this one", and
   "What this record cannot say". The **`## 0.31.0`** section above it in the same
   file is still worth reading for its Defect 1, which is why the build order
   changed
3. `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md` — the build order,
   and the reasoning you would need in order to argue with it
4. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges
   what, and the two-touch budget. `0.29.0` through `0.32.0` all ran under it
5. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.32.0`** @ `038859fb` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`038859fb`** — `node scripts/release-prs.mjs 038859fb <the new release SHA>` |
| Production database | `200 applied`, **0 pending**, `No drift: production matches origin/main.` |
| Dev database | `200 applied`, **0 pending**, `No drift: test matches origin/main.` |
| Next free migration number | **`0200`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, **#638 `planner-handover-156`** (open before the release and not part of it), and whatever has landed since |

**All four builds came from the release SHA**, for the eighth release running —
**and for the first time in three releases it cost nothing to make true**, because
`main` did not move after the cut and because the build order now protects against
it when it does.

**Server Actions key checked on both pairs again** (new in `0.30.0`, now three
times): production `cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both.
Both fingerprints are unchanged from `0.31.0`, which is expected — they are
environment configuration, not build output, so **matching last release's value is
not evidence you checked.** Compare Worker against Pi, not against the record.

**Both databases are clean and nothing is pending anywhere**, for the ninth
release running. **So if `--status` shows you anything at all, it is new.** The
two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what the last five releases opened with.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). The same goes
for `--drift`: it is **`--drift test`**.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`. The order is:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan
5. build **both Pis**, pinned with `--ref` to the SHA his deploy reports

The reason, in one paragraph: a Pi build can be pinned (`deploy-pi.sh --ref <sha>`)
and a Worker build cannot (`deploy.mjs` has **no `--ref`** and refuses a `main`
that differs from `origin/main`). So the Worker is the build that cannot be made
to agree with the others, and it should therefore be the reference they are made
to agree with — not the one that has to catch up. `0.31.0` did it the other way
round, `main` moved twice, and keeping "all four from the release SHA" true cost
three rebuilds.

Two things to know before you follow it:

- **It conflicts with "Do not idle" in `docs/release-procedure.md`**, which says to
  start the Pi production build the moment the cut merges so it runs alongside the
  test Worker deploy. That advice is good in general and loses here; the decision
  file says why. The runbook has not been edited, so you will read both — this one
  is newer and more specific.
- **`0.32.0` did not test it.** `main` held still, so the new order was never
  exercised by the thing it exists to prevent. A quiet release is the expected
  shape of a correct precaution and is **not** a reason to revert it. The real fix,
  if anyone wants to spend the time, is giving `deploy.mjs` a `--ref`, which would
  dissolve the question entirely.

**The older lesson still stands and is still the most valuable one:** an option you
put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it before
offering an order that depends on it.

---

## Lutan's time: two touches, and `0.32.0` hit the budget a fourth time

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.32.0` cost him exactly those two**, as `0.29.0`, `0.30.0` and `0.31.0` did.
`0.28.0` cost five. **That is the standard: absorb it, do not hand it over.**

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

**All three were exercised on `0.32.0` and all three worked.** `gh pr merge 639
--merge` merged the cut with no prompt; `node scripts/apply-migrations.mjs --env
production` ran in its plain form and applied two files; and both Pi deploys and
the backup-log read went over SSH without a prompt. **So `0.28.0`'s Defect 3 has
not recurred for four releases.** It remains unpredictable rather than fixed:
`0.27.1` got the plain form through, `0.28.0` did not, `0.29.0` through `0.32.0`
did. Send it plain, exactly `node scripts/apply-migrations.mjs --env production` —
no timestamps, no redirect, nothing wrapped round it. **If it is refused anyway**,
do not retry blind: hand it to Lutan, say the dry-run was clean, and **ask him for
the output**, or the record cannot state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.32.0` he said it
was run and the log was there: `tr -d '\000' < deploy-0.32.0.log` (`tee` writes
UTF-16), then grep for the project ref, `Next.js version`, `strip-baked-env`, the
Server Actions key and the release mail line. All five were right — but the version
endpoint alone would not have told you the Server Actions keys matched, or which
SHA the Worker bundle was built at.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the cut,
and `main` did not move after it either — the first release in three where it held
still.

**#638 `claude/planner-handover-156` was open before the release and is not part of
it.** That is the one thing to know about this release's PR range: it has a
**gap**, and the gap is explained rather than missing. If you meet a gap, the check
is one command — `gh pr view <n> --json state,mergeCommit` — not an argument from
the numbering, in either direction.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-32-0`) and this record (`record-0-32-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- There were already nine older leftovers before `0.31.0` started, all `nothing beyond main` and all `HELD`, and nothing has been done about them since. That is `/clean-streams` work, not a release manager's, and it is now two releases old.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-15.md` → `## 0.32.0`**, then the `## 0.31.0` section above it for Defect 1, then `0.28.0`'s Defect 2 in `2026-10-13.md`, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget, and a third is a defect to record. Never call the record PR "ready to merge when you say".
3. **`npm ci` in the main checkout before any deploy**, read `node_modules/next/package.json` against `package.json` straight afterwards, and read the `Next.js version :` line on the first Worker build as well. Four releases running this has been the cheap step that would have caught the expensive fault.
4. **Check the Server Actions key on both pairs**, production Worker against production Pi and test Worker against test Pi. Two greps — and compare Worker against Pi, not against this file's values, which have not changed in three releases and so prove nothing.
5. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.32.0` did this and got the version call in one word. The verification list has now closed nothing for **five** releases — **keep asking anyway.** The restore test into a real Supabase project has gone **six** releases unanswered and is still the cheapest item on it.
6. **Range starts at `038859fb`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. It exited 0 first time on the last two releases; **expect exit 1 anyway**, match orphans by commit subject, then **confirm each against `gh pr view <n> --json mergeCommit`**. A no-gap PR range is the independent check that none is missing — and when there *is* a gap, the one-command check under "In flight" above is how to close it cheaply.
7. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`, and the drift check is `--drift test`.
8. **Decide major or minor with Lutan before cutting.** `0.32.0` went major on the stated question — *can anyone do something today they could not do yesterday* — answering yes in two places. **There is no presumption either way.** Minor mails nobody.
9. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** `0.32.0` is the release where that finally caught a header that was actually *wrong* rather than merely unproven: `0199` says `-- consumer: none` while `src/lib/units.ts` reads its new column. Read `0.32.0`'s silent-failure section as a worked example of two useful habits — closing a discarded-error path by **diffing two RLS policies character by character** rather than trusting one's header, and noticing that the file which *sounds* most dangerous (dropping unique indexes) was the safe one while the quiet new table was the real candidate.
10. **Expect a production-only guard.** There has been none for eight releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
11. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway. `0.32.0` applied two files in one run, and the per-file dry-run trap **did not apply at all** this time: the two files touch disjoint tables, so there was nothing for the rollback to take away. Say which it was — "the trap did not fire" and "the trap did not apply" are different statements.
12. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict** — but under the new order they come *after* the production Worker deploy, not alongside the test one. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**.
13. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held nine releases running.
14. **Confirm the release mail arrived, not just `sent N`.** `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
15. `/clean-streams` for the release's own two worktrees once their PRs merge — and the nine older leftovers have now been waiting two releases.
16. **Writing the cut's test plan *before* opening the PR makes the first CI run green**, where the template expects it to fail on `test-plan` by construction. `0.32.0` did this. The one cost is that the plan's header has to guess the PR number — it guessed #638 and got #639 — which the CI-green commit then corrects. Worth doing, and worth knowing so a green first run does not look like a mistake.

---

## The public site is still locked, and it is still the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate. Three consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise.
  `0.32.0` shipped **three of its six notes** about the public website — the most
  of any release so far, up from one of five in `0.31.0` and four of eight in
  `0.30.0`. The blind spot is not growing; what sits in it varies release by
  release, and this time it was half the release.
- **One of those notes makes a measurable claim** — images "about a third smaller"
  — which nothing on the live site measured. Worth noticing as a category: a note
  that asserts a number is hidden by this blind spot more completely than a note
  that asserts a layout.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page
  to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a
  browser that will show one.

---

## Things that look alarming but are not

Everything `0.30.0`'s and `0.31.0`'s lists hold still applies, in particular: a
red `audit` never blocks (green again on `0.32.0`); `| tee` writes UTF-16 so
`tr -d '\000'` before grepping, and the `→` does not survive that conversion, so
grep for the project ref; a backgrounded `deploy.mjs` writing nothing for minutes
is buffering, not hanging; `-- consumer:` warnings naming files that differ from
the live release are the safe direction; and `deploy: release mail … [UAT]` on
production is the production setting and the mail is real. Also:

- **The `ERROR Failed to copy …` lines are closed** — zero on the production Worker build, three on the test one, for the third release running. Either count is normal. `0.32.0` is the first release that did not check, which is what closed means.
- **A `gates.mjs` run that is much faster than the last one is a warm Turbopack cache.** `0.32.0`'s cut ran `typecheck` in 28s and `build` in 103s where `0.31.0`'s cold run took 179s and 142s. Read the exit codes, not the timings.
- **A second CI run on the cut PR is correct and expected.** Ticking the "CI green" line is itself a commit, which re-runs all seven checks. Wait for the second run before merging. **But the *first* run is no longer necessarily red** — see point 16 above.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. Under the new build order this window is longer, because the Pi builds now come last.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say `0.32.0`. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
- **A red `lint` on a fresh release-cut branch may not be yours.** `0.32.0`'s first gates run failed on `check-backlog-sections` over a `docs/backlog.md` item that had arrived on `main` with the morning's backlog merge — red on `main` too. Check whether the failure exists on `main` before debugging your own branch.
