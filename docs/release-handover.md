# Release handover — written 2026-10-13, after `0.29.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The previous edition warned at length about `--drift` crashing and about who
merges a release's PRs. **Both were resolved before the next release ran**, and
`0.29.0` used both fixes in anger. That is the standing instruction for this
file: **when something it warns about gets fixed, come back and say so** — a
confidently wrong warning costs more than a missing one.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-13.md` → the **`## 0.29.0`** section, end to end. That
   day's file holds two releases; `0.28.0` is above it and is still worth reading
   for its **Defect 2**, which became a release step
3. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges
   what, and the two-touch budget for Lutan's time. Short, and `0.29.0` is the
   first release run under it
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.29.0`** @ `9cb36eea` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`9cb36eea`** — `node scripts/release-prs.mjs 9cb36eea <the new release SHA>` |
| Production database | `194 applied`, **0 pending**, `No drift: production matches origin/main.` |
| Dev database | `194 applied`, **0 pending**, `No drift: test matches origin/main.` |
| Next free migration number | **`0194`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA exactly**, for the fifth release
running — and this time without a scare, because `0.28.0`'s stale-install fault
is now a release step that is actually run. See "the step that earned its place".

**Both databases are clean and nothing is pending anywhere**, for the sixth
release running. **So if `--status` shows you anything at all, it is new.** The
two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what both of the last two releases opened with.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). The same goes
for `--drift`: it is **`--drift test`**, not `--drift dev`, whatever
`release-procedure.md` §7 still says.

**`--drift <env>` works and has now been used in a real release.** It prints the
comparison and ends `No drift: <env> matches origin/main`, exit 0. Quote that
line — it is what reads as a drift check to whoever reads the record afterwards.
`0.28.0` could not print it (its Defect 5); #579 fixed it and added a guard
assertion to `check-release-guards.mjs`, because nothing in CI runs `--drift`.
**That is closed. Do not re-derive it.**

**Numbering is sequential again.** `0.28.0`'s two files both numbered `0191` are
a closed matter — neither is renamed, the number check is deliberately not
changed, and the lesson is only that **"0191" is ambiguous in conversation**: say
the filename. `0192` and `0193` are clean, and the next free number is `0194`.

---

## The step that earned its place

**`npm ci` in the main checkout, before any deploy.** It is now step 1 of the
runbook, and `0.29.0` is the release that shows why: it cost **four minutes** and
the first Worker build printed `Next.js version : 16.3.8`, matching
`package.json` and the lockfile, with nothing to investigate.

`0.28.0` found that out the hard way. Its first test Worker build printed
`16.3.5` while both Pi builds printed `16.3.8`, because a merged PR had bumped
the lockfile and `npm ci` had never been re-run in the main checkout. **Every
guard passed** — `deploy.mjs` verifies the commit, the project ref and the env
vars, and says nothing about `node_modules` — so "all four builds came from the
release SHA" would have been literally true and materially false, with the Worker
fallback running a different Next from the Pi that serves everyone.

So: **run `npm ci`, and read the `Next.js version :` line on the first Worker
build against `package.json` anyway.** The Pi clones run `npm ci` inside
`deploy-pi.sh`, which is why they were right and the laptop was wrong — that
asymmetry recurs every time a dependency bump merges between releases.

**The older lesson still stands and is still the most valuable one:** an option
you put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it
before offering an order that depends on it.

---

## Lutan's time: two touches, and `0.29.0` hit the budget

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.29.0` cost him exactly those two**, the first release since the budget was
written down. `0.28.0` cost five. The three that went are both PR merges and the
production migration apply, all now Claude's.

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect. That is the
mechanism that stops this creeping back.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time
  it exists the release is deployed and verified. Merge it, then tell him.
  `0.28.0` said *"ready to merge when you say"* about it and that was its single
  largest avoidable delay.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the
  test plans are exactly as they were. What went is Claude *waiting for a yes* on
  a PR that had already passed every one of them. A red check is still never
  merged past.

### The two allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
```

alongside the older `Bash(ssh lutan@lanna-pi.local *)`. **Claude cannot read, add
or revert them** — the classifier refuses any access to that file as
self-modification, which is why Lutan added them by hand. So you cannot check
they are still there by looking; you find out when a command is refused.

**Both were exercised on `0.29.0` and both worked.** `gh pr merge` merged the cut
with no prompt, and `node scripts/apply-migrations.mjs --env production` ran —
**so `0.28.0`'s Defect 3, where the plain form was refused anyway, did not
recur.** It remains unpredictable rather than fixed: `0.27.1` got the plain form
through, `0.28.0` did not, `0.29.0` did. Send it plain, exactly
`node scripts/apply-migrations.mjs --env production` — no timestamps, no redirect,
nothing wrapped round it, because a wrapped form may not match the rule. **If it
is refused anyway**, do not retry blind: hand it to Lutan, say the dry-run was
clean, and **ask him for the output**, or the record cannot state the file order
or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut, and `main` did not move under the release — the first time in three, so do
not assume it will hold.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-29-0`) and this record (`record-0-29-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- There were already free leftovers from the earlier batches before this release started. That is `/clean-streams` work, not a release manager's.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-13.md` → `## 0.29.0`**, then `0.28.0`'s Defect 2 above it, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget — the major-versus-minor call and the deploy command — and a third is a defect to record. Never call the record PR "ready to merge when you say".
3. **`npm ci` in the main checkout before any deploy**, and read the `Next.js version :` line on the first Worker build against `package.json` anyway. Four minutes, and it is the only place that fault is visible.
4. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.29.0` did this and got the version call in one round; the verification list came back **"None yet"**, which is an answer, not a silence. It has now closed nothing for two releases — **keep asking anyway.** The restore test has gone three releases unanswered and is still the cheapest item on it.
5. **Range starts at `9cb36eea`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it. Read its exit code directly, not through a pipe. **Expect exit 1**: four releases running have had squash-merged PRs with no merge commit carrying their number, and `0.29.0` had three. Match them by commit subject and add them by hand. A PR-number range with **no gaps** is a good independent check that none is missing.
6. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`, and the drift check is `--drift test`.
7. **Decide major or minor with Lutan before cutting.** Three of the last four went major on the same stated question — *can anyone do something today they could not do yesterday* — and `0.27.1` went minor on it. **The question is doing real work in both directions and there is no presumption either way.** Minor mails nobody.
8. **Ask whether anything in the release can fail silently**, and read the candidates in code first. The method is settled and is two `git grep`s at the live SHA: what does the live app pass in, and how is that value produced. **A header is a statement of intent, not evidence** — `0.29.0`'s `0192` claimed "same columns, same order" and was diffed rather than believed (it happened to be true). Diff them.
9. **Expect a production-only guard.** There was none for five releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
10. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway.
11. **Budget the Worker deploys at ~9–10 minutes each**, background the test one, and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. Start the record worktree during the CI wait, not after the merge.
12. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held six releases running.
13. **Confirm the release mail arrived, not just `sent N`.** Two lines in Gmail. `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
14. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Things that look alarming but are not

Everything `0.27.1`'s and `0.28.0`'s lists hold still applies, in particular: a
red `audit` never blocks; `| tee` writes UTF-16 so `tr -d '\000'` before grepping,
and the `→` does not survive that conversion, so grep for the project ref; a
backgrounded `deploy.mjs` writing nothing for minutes is buffering, not hanging;
a `gates.mjs` run that finishes in 2 minutes where the last took 6 is a warm
Turbopack cache; `-- consumer:` warnings naming files "not on `origin/main` at
all" are the safe direction; and `deploy: release mail … [UAT]` on production is
the production setting and the mail is real. New this release:

- **Three `ERROR Failed to copy …\node_modules\…` lines on every Worker build**, naming `age-encryption`, `color-string` and `data-uri-to-buffer`, printed just before `strip-baked-env`. **Benign**, and now checked rather than assumed: all three are present in `.open-next/server-functions/default/node_modules/`, so the copy retried and succeeded; the Worker answers `/api/releases/current` correctly on both environments; and nothing in `src/` or `worker/` imports any of them directly. A Windows file-lock during OpenNext bundling, the same family as the stale `workerd` processes that lock `.open-next`. It is in no release record before `0.29.0`, which is why a release manager meeting it cold would reasonably stop — see that record's Defect 3.
- **A second CI run on the cut PR.** Ticking the "CI green" line in the test plan is itself a commit, which re-runs all seven checks. That is correct and expected; wait for the second run before merging rather than merging on the first run's green.
