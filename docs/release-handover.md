# Release handover — written 2026-10-13, after `0.28.0`

**Revised the same day**, after two things overtook the first draft within hours:
`--drift` was fixed (#579), and Lutan changed who merges a release's PRs. Both
are below. A handover that is stale in its own first afternoon is worth noticing:
**when something this file warns about gets fixed, come back and say so**, because
the next person reads this before they read anything else, and a confidently
wrong warning costs more than a missing one.

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
2. `docs/releases/2026-10-13.md` — `0.28.0` end to end, and in particular its
   **Defect 2**, which is the one new trap this release found and the reason it
   is at the top of this file
3. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges
   what, and the two-touch budget for Lutan's time. Short, and it changes how you
   run the release rather than what you check
4. `docs/releases/2026-10-11.md` for `0.26.0`'s "order that turned out to be
   impossible" section, which still earns its place
5. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.28.0`** @ `b5fd020d` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`b5fd020d`** — `node scripts/release-prs.mjs b5fd020d <the new release SHA>` |
| Production database | `192 applied`, **0 pending**, comparison clean both ways |
| Dev database | `192 applied`, **0 pending**, comparison clean both ways |
| Next free migration number | **`0192`** — and note **two files share `0191`** (see below) |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA exactly**, for the fourth release
running — **but that claim nearly became true and worthless this time.** Read
**the new trap** below before you deploy anything.

**Both databases are clean and nothing is pending anywhere**, for the fifth
release running. **So if `--status` shows you anything at all, it is new.** The
two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what `0.28.0` opened with: five pending, all merged after the previous cut.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**Two migration files are both numbered `0191`** —
`0191_donation_channels.sql` and `0191_stock_receipts_update_policy.sql`, from
two streams. Nothing is broken, **neither file is renamed**, and the number check
is deliberately not being changed to catch it. But **"0191" is ambiguous in
conversation**: say the filename, not the number. The next free number is `0192`.
Decided and closed — `docs/decisions/2026-10-13-duplicate-0191-cannot-be-caught-by-the-number-check.md`.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`).

**`apply-migrations.mjs --drift <env>` works. It was broken for a few hours on
2026-10-13 and is fixed** (#579) — if you are reading a `0.28.0`-era note saying
it crashes, that note is stale. Verified after the fix: `--drift production`
prints the comparison and then `No drift: production matches origin/main`, exit
0. The history is worth one line because it says what the check is *for*: #570
read two variables outside their scope, so every run died **after** printing the
comparison, losing only the verdict line and the exit code — and **nothing in CI
runs `--drift`**, which is why it reached `main` at all. #579 added a guard
assertion to `check-release-guards.mjs` to cover that gap.

---

## The one thing to read before the next release

**New, and it is the first trap in a while that no existing rule covered:
`deploy.mjs` verifies the commit, the project ref and the env vars, and says
nothing about what is in `node_modules`.**

`0.28.0`'s first test Worker build printed `Next.js version : 16.3.5` while both
Pi builds printed **16.3.8** — what `package.json` and the lockfile pin. The main
checkout's install was stale: a merged PR had bumped the lockfile and `npm ci`
had never been re-run there. Every guard passed. The release SHA was correct on
all four builds. **"All four builds came from the release SHA exactly" would have
been literally true and materially false**, and the Worker fallback would have
been running a different Next from the Pi that serves everyone.

It was caught by reading the build banner. Nothing else would have caught it.

**So, as a release step before any deploy: `npm ci` in the main checkout, or at
minimum read the `Next.js version` line on the first Worker build and compare it
against `package.json`.** The Pi clones run `npm ci` inside `deploy-pi.sh`, which
is exactly why they were right and the laptop was wrong — the asymmetry is the
tell, and it will recur every time a dependency bump merges between releases.

**The older lesson still stands and is still the most valuable one:** an option
you put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. It has not bitten for three releases because no
ordering choice was needed; `--upto` now exists (#570), so a partial apply *is*
possible today, which is new. The `--drift` bug it shipped alongside is fixed, so
that is no longer a reason to distrust it — but **it has still never been used in
a real release**, which is the reason that matters. Rehearse it before offering
an order that depends on it.

---

## Lutan's time: two touches, and count them

**Decided 2026-10-13, straight after `0.28.0`, in his words:** *"Why do I need to
merge multiple times for a release, this is not efficient… it is delaying
releases."*

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**Everything else is Claude's, and that now includes both PR merges.** The cut PR
and the record PR are merged **as soon as CI is green, without asking.** So is the
production migration apply, under an allow rule added the same day.

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect. That is the
mechanism that stops this creeping back.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time
  it exists the release is deployed and verified. `0.28.0` said *"ready to merge
  when you say"* about it and that was the single largest avoidable delay in the
  release. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the
  test plans are exactly as they were. What went is Claude *waiting for a yes* on
  a PR that had already passed every one of them. A red check is still never
  merged past.

`docs/decisions/2026-10-13-release-prs-merge-without-asking.md` has the full
reasoning, including the contradiction it resolved: the runbook had always listed
"Cut PR, gates, CI, merge" as Claude's while `CLAUDE.md` said "once the user says
so", and sessions reading both followed the stricter one.

### The two allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
```

alongside the older `Bash(ssh lutan@lanna-pi.local *)`. **Claude cannot read,
add or revert them** — the classifier refuses any access to that file as
self-modification, which is why Lutan added them by hand. So you cannot check
they are still there by looking; you find out when a command is refused. If the
migration apply or a merge is suddenly refused, **that is the first thing to
suspect**, and the fix is Lutan editing that file, not a workaround.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-28-0`) and this record (`record-0-28-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- At the time of writing there were several free leftovers from the nine-stream batch and one `STALE (not a repo)` entry. That is `/clean-streams` work, not a release manager's.

**`main` moved under this release** — #575 merged between the PR list being built
and the cut merging, exactly as it did last release. Expect it, and build the
final list after the cut merges.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-13.md`**, especially Defect 2, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget for Lutan's time — the major-versus-minor call and the deploy command — and a third is a defect to record. Never call the record PR "ready to merge when you say"; it describes a release that already shipped.
3. **`npm ci` in the main checkout before any deploy**, or read the `Next.js version` line on the first Worker build against `package.json`. New this release; nothing else catches it.
4. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. That closed four items on `0.27.1`. On `0.28.0` the list went unanswered — **that is not a no, and it is not a reason to stop asking.** The restore-test question has now gone two releases unanswered and is the cheapest item on it.
5. **Range starts at `b5fd020d`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it. Read its exit code directly, not through a pipe. Expect exit **1** with squash-merged PRs to resolve by hand, and remember exit 0 does not prove completeness.
6. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`. `--drift <env>` works again (#579) and ends in `No drift: <env> matches origin/main` with exit 0 — quote that line, it is what reads as a drift check to whoever reads the record afterwards.
7. **Decide major or minor with Lutan before cutting.** The last two went opposite ways on the same stated question — *can anyone do something today they could not do yesterday* — so **the question is doing real work and there is no presumption either way.** Minor mails nobody.
8. **Ask whether anything in the release can fail silently**, and read the candidates in code first. The method is settled and is two `git grep`s at the live SHA: what does the live app pass in, and how is that value produced. **A header is a statement of intent, not evidence** — `0.28.0`'s `0189` described its own undo as "restore the old policies", which tells you it replaces live policies and nothing about whether it changes them. Diff them.
9. **Expect a production-only guard.** There was none for four releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
10. **The production migration apply is yours, and there is now an allow rule for it** (added 2026-10-13 after `0.28.0`, where the classifier refused it even in its plain form and it became a hand-off). Send it plain, exactly `node scripts/apply-migrations.mjs --env production` — the rule matches that form, and timestamps or a redirect wrapped round it may not match and may be refused. **If it is refused anyway**, do not retry blind: the rule lives in a file Claude cannot read, so suspect it is missing, hand the command to Lutan, say the dry-run was clean — and **if he runs it, ask him for the output**, or the record cannot state the file order or the timing, which is exactly what `0.28.0` lost.
11. **Budget the Worker deploys at ~9–10 minutes each**, background the test one, and do not overlap either with anything building in the same checkout. Start the record worktree during the CI wait, not after the merge.
12. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held five releases running.
13. **Confirm the release mail arrived, not just `sent N`.** Two lines in Gmail. `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
14. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Things that look alarming but are not

Everything `0.27.1`'s list holds still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so `tr -d '\000'` before grepping, and the
`→` does not survive that conversion, so grep for the project ref; a
backgrounded `deploy.mjs` writing nothing for minutes is buffering, not hanging;
and a PR-number gap should be checked, not reasoned about. New this release:

- ~~**`--drift` ending in a `ReferenceError`.**~~ Fixed by #579 on 2026-10-13, hours after it was found. Kept struck through rather than deleted, because `0.28.0`'s record describes it at length as an open defect and a reader moving between the two documents should see which one is current.
- **A `gates.mjs` run that finishes in 2 minutes** where the previous one took 5.5. Warm Turbopack cache. Each gate's own exit code is still the thing to read — the summary line prints all four.
- **`-- consumer:` warnings naming files "not on `origin/main` at all"** — three of the five migrations declared consumers in the unmerged bills-inbox and donate-channels app code. That is the safe direction: schema lands before its reader.
- **`deploy: release mail … [UAT]`** on production. `RELEASE_MAIL_ENV` is `"UAT"` there; that is the production setting and the mail is real.
