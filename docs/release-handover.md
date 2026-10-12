# Release handover — written 2026-10-13, after `0.28.0`

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
3. `docs/releases/2026-10-11.md` for `0.26.0`'s "order that turned out to be
   impossible" section, which still earns its place
4. this file, for what has changed since

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
two streams. Nothing is broken and renaming them is not the answer, but **"0191"
is ambiguous in conversation**: say the filename, not the number. The next free
number is `0192`. On the backlog with its cause (a schema slot released when the
schema PR merged rather than when its app PR did).

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`).

**`apply-migrations.mjs --drift <env>` is broken and crashes on every run**
(`ReferenceError: unapplied is not defined`, introduced by #570 in this release).
The comparison still prints before the crash, so you can read the substance and
quote it; the `No drift` verdict line and the exit code are gone. Two-line fix on
the backlog. **Do not read the crash as drift** — and do not skip the check: the
numbers above it are the check.

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
possible today, which is new — but it shipped with the `--drift` bug above, so
treat it as untested in anger.

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
2. **`npm ci` in the main checkout before any deploy**, or read the `Next.js version` line on the first Worker build against `package.json`. New this release; nothing else catches it.
3. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. That closed four items on `0.27.1`. On `0.28.0` the list went unanswered — **that is not a no, and it is not a reason to stop asking.** The restore-test question has now gone two releases unanswered and is the cheapest item on it.
4. **Range starts at `b5fd020d`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it. Read its exit code directly, not through a pipe. Expect exit **1** with squash-merged PRs to resolve by hand, and remember exit 0 does not prove completeness.
5. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`, and `--drift` crashes — read the comparison it prints before dying.
6. **Decide major or minor with Lutan before cutting.** The last two went opposite ways on the same stated question — *can anyone do something today they could not do yesterday* — so **the question is doing real work and there is no presumption either way.** Minor mails nobody.
7. **Ask whether anything in the release can fail silently**, and read the candidates in code first. The method is settled and is two `git grep`s at the live SHA: what does the live app pass in, and how is that value produced. **A header is a statement of intent, not evidence** — `0.28.0`'s `0189` described its own undo as "restore the old policies", which tells you it replaces live policies and nothing about whether it changes them. Diff them.
8. **Expect a production-only guard.** There was none for four releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
9. **The production migration apply may be refused by the classifier even in its plain form.** `0.27.1` got it through first time; `0.28.0` did not, with nothing wrapped round it. Do not retry blind — hand it to Lutan and say the dry-run was clean. `--status`, `--dry-run` and `--drift` all still run fine, so it is not a production-access block. **If he runs it, ask him for the output**, or the record cannot state the file order or the timing.
10. **Budget the Worker deploys at ~9–10 minutes each**, background the test one, and do not overlap either with anything building in the same checkout. Start the record worktree during the CI wait, not after the merge.
11. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held five releases running.
12. **Confirm the release mail arrived, not just `sent N`.** Two lines in Gmail. `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
13. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Things that look alarming but are not

Everything `0.27.1`'s list holds still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so `tr -d '\000'` before grepping, and the
`→` does not survive that conversion, so grep for the project ref; a
backgrounded `deploy.mjs` writing nothing for minutes is buffering, not hanging;
and a PR-number gap should be checked, not reasoned about. New this release:

- **`--drift` ending in a `ReferenceError`.** The script, not the database. Read the comparison above it.
- **A `gates.mjs` run that finishes in 2 minutes** where the previous one took 5.5. Warm Turbopack cache. Each gate's own exit code is still the thing to read — the summary line prints all four.
- **`-- consumer:` warnings naming files "not on `origin/main` at all"** — three of the five migrations declared consumers in the unmerged bills-inbox and donate-channels app code. That is the safe direction: schema lands before its reader.
- **`deploy: release mail … [UAT]`** on production. `RELEASE_MAIL_ENV` is `"UAT"` there; that is the production setting and the mail is real.
