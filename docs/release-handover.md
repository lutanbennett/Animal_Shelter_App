# Release handover — written 2026-10-11, after `0.26.0`

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
2. `docs/releases/2026-10-11.md` — `0.26.0`, one release, read it end to end
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.26.0`** @ `c3862e52` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`c3862e52`** — `node scripts/release-prs.mjs c3862e52 HEAD` |
| Production database | `181 applied`, **0 pending**, `No drift` |
| Dev database | `181 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0182`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA exactly** — both Pis and both
Workers. That is the first time, and it happened because the handover gap was
short and no `docs/backlog.md` commit landed inside it. Do not read it as
"`deploy.mjs` has been fixed": it still has no `--ref` and still takes whatever
`main` is when it runs. **Read the project-ref line's SHA on every deploy and
diff it against the release SHA.**

**Both databases are clean and nothing is pending anywhere**, for the second
release running. **So if `--status` or `--drift` shows you anything at all, it is
new.** The two legitimate one-sided cases, which keep recurring:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut, so there is no first job waiting for you.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut, and this record — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
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

**An option you put to Lutan is a commitment that it can be carried out. Verify
the mechanism before offering the choice, not after he has taken it.**

This is new, it is the one real failure of `0.26.0`, and it was entirely the
release manager's fault. `0181` could not safely be applied before the new app
was live, so Lutan was offered three orders, including one with no user-facing
window: apply the three safe migrations, put the new app on the Pi with
`--force`, then apply the fourth. He chose it. **It cannot be done.**
`apply-migrations.mjs` applies every pending file or none — there is no `--upto`
— and it deliberately refuses to run when a file on `origin/main` is missing from
the checkout, so moving the file aside is defeating a guard rather than working
around a limitation.

That was discovered **after the cut PR had merged**, with `main` already carrying
the release. The recovery was to go back, say plainly what had happened, and
offer three orders that had been checked; he accepted a 1m38s outage instead.

The cost this time was a round trip and some trust. The next version of it is a
plan abandoned half-applied. So: **before you write the options down, open the
script and confirm each one has a flag, a path or a command that performs it.**
It takes a minute and it is the difference between a choice and a guess.

A backlog item now asks for `--upto`. If it has been built by the time you read
this, the no-window order becomes available and is the right one for any
migration whose header says to apply it after the deploy.

---

## Lessons from `0.26.0` worth not re-learning

### 1. A migration can make the *release order* the hazard, and its header will tell you

`0.23.0` and `0.24.0` learned that a migration can break a live app. `0.26.0` is
the case where the migration **said so in its own header** and had been written
specifically to be applied last:

> *Apply only once the new app is live: the previous release still selects
> `app_users.role`, calls `current_user_role()` and writes `user_roles.role`, and
> fails the moment this lands.*

**Believe it, then check it** — `0.25.0`'s lesson 2, and it held. Reading the live
release's source found that `current_user_role()` was called on **every
non-public app request** through `src/lib/supabase/proxy.ts`, and that
`loadCurrentRole` discards the rpc's error, so a dropped function reads as
*no role* rather than raising. Closed, silent, total: every signed-in person
bounced out of the app with nothing shown.

The six consumer warnings said, as always, *"expect nothing to use it yet"* —
the opposite of the truth, for the third release out of four. **The header
warning is not the finding.** The two commands that separate the cases are in
`0.25.0`'s lesson 1 and take under a minute.

**What to do when you meet one:** this is a question for Lutan, not a file to
fix, and it must be asked *before* the cut merges, with the mechanism of each
option already verified (see above).

### 2. Measure the Pi window from systemd, not from the log

`0.25.0`'s record said nothing in `deploy-pi.sh` timestamps its own finish and
budgeted from a bracket. It does not need to:

```
systemctl show lanna-care --property=ActiveEnterTimestamp
```

is the moment the new build began serving, which is the moment the window closed.
`0.26.0` got **1 minute 38 seconds**, exact, against an apply that ended at
`07:16:38Z`. Use it. The bracket was never necessary, and a window you can state
to the second is a different kind of claim from one you can state to the minute.

The `0.23.0` mitigation is now standard and worth keeping: **apply the migrations
and start the Pi build in the same command**, so no round trip sits inside the
window.

### 3. `gh pr merge` is refused as the norm now, not the exception

Refused again, `Reason: [Merge Without Review]`, cleared by Lutan saying
*"Merge it"* in chat. That is **two releases running**. `0.24.0`'s advice to
treat a refusal as the exception is retired.

Expect it, do not retry it blind, and above all do not route around it. One
sentence in chat is the whole remedy, so ask for the merge in the same message
that says the PR is green.

### 4. A red `--dry-run` on a correct file is now a recurring tax, not a curiosity

Third recorded instance (`0076`, `0174`, `0180`), and the second in three
releases to land on the file blocking a release:

```
dry-run 0180_perm_drop_enum_readers.sql … FAILED
ERROR:  2BP01: cannot drop function has_shelter_floor() because other objects depend on it
DETAIL:  policy maintenance_delete_perm on table maintenance depends on function has_shelter_floor()
```

`0179` recreates that policy without the function; each file dry-runs in its own
`begin … rollback`, so `0179`'s change was gone before `0180` ran. **The correct
action was to apply, and all four applied `ok`.**

The trap is that a red dry-run means *do not apply* everywhere else. Read both
files before concluding, and **report which it was** — "the dry-run failed" and
"the file is wrong" are different statements. A backlog item now asks for this to
be fixed in the tool rather than re-reasoned every time.

### 5. `test-plan` green on the opening commit is achievable, and `0.25.0` was wrong that it is not

`0.25.0` predicted another red `test-plan` on the commit that opens a cut PR.
It was **green**, because the CI line was left `n/a: not yet — the PR does not
exist at this commit` rather than pre-ticked, and ticked in a follow-up commit
once the run existed. That is exactly what the template says to do. The red is
avoidable, not structural.

### 6. Where the time went

`0.24.0` ~65 min, `0.25.0` ~50 min, `0.26.0` **~45 min** end to end, including the
round trip caused by the unexecutable apply plan. Budget from the per-step
figures, not the total.

| Step | Measured at `0.26.0` |
|---|---|
| `worktree.mjs new` | ~3 min, almost all `npm ci` |
| `gates.mjs` | ~6 min (build alone 347 s) |
| Full CI run on a PR | ~2 min (`check` 1m57s, `public-views` 1m24s, `test-plan` 14s, rest under 12s) |
| Production migration apply | **17 seconds** for four files |
| **Pi build + restart** | **1m38s**, measured from systemd |
| Worker deploy, production | under 8 min (bracketed: handover to mail delivery) |
| Worker deploy, test | ~7 min |

### 7. Things that look alarming but are not

- Six `WARNING … declared consumer … differs from release` lines: see lesson 1. They fire for harmless files and dangerous ones alike.
- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise; the deploy continues and exits 0.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. Green throughout `0.26.0`.
- A deploy log that looks like gibberish: `| tee` writes **UTF-16**. `tr -d '\000'` before grepping.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.
- `release mail for <version> [off]: sent 0, skipped 19` on the **test** deploy: correct by construction, `RELEASE_MAIL_ENV` is `""` there.
- A backgrounded `deploy.mjs` writing **nothing** to its log for many minutes: output is buffered when it is not a terminal. Not a hang.
- An edge-cache check reading `HIT, HIT, HIT` instead of `MISS, HIT, HIT`: fine if you loaded the page in the pane first — that load was the cache-filling request. What must not happen is a fresh query string each time, which gives `MISS` three times and proves nothing.
- `release-prs.mjs` exiting 1 on a squash-merged PR: it has done this twice now (#213, #530). The script is right; add the PR by hand and say so.

---

## Outstanding verification — what actually matters

All fourteen of `0.26.0`'s plans are `pending:`, by Lutan's decision at the cut.
The repo-wide `pending:` count is the normal standing state and is **not** a
release blocker — do not try to clear it.

What is worth carrying forward, most valuable first:

| Item | Where | Note |
|---|---|---|
| **The five roles nobody has signed in as on production** — Management, Head of Maintenance, Head of Medical, Doctor, Volunteer | the permissions PRs in `0.26.0` | **Partly done on release day, and smaller than it looks.** Lutan signed in as **Admin and 2IC** after the deploy and both work (chat, 2026-10-11), which rules out the silent lock-out `0181` risked, and 2IC is the role the release changed most. He intended to cycle the rest the same evening — **check whether he did before carrying this forward**. The failure mode left is a role quietly losing something it needs, which nobody reports as a bug. **But from `0.26.0` on, that is fixable without a release**: Settings → Who does what is editable, so a wrong permission is an audited correction an Admin makes in minutes. Do not carry this at the old severity |
| **A donation receipt issued on production** | `docs/test-plans/receipt-content-server-side.md`, `receipt-issuer-server-side.md` | Carried from `0.23.0`, now **four** releases. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. It also writes the PDF to Drive |
| **Somebody using the renamed Clinics screens on production** | `docs/test-plans/vet-to-doctor-rename.md` | Carried from `0.24.0`, the largest thing in that release. Nobody has read the Thai wording or worked a doctor login's day |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | Carried from `0.22.0`, now a **fifth** release. It is also what *creates* the Storage bucket — `ensureBucket()` runs on first use |
| **A Management login saving Management → Website** | `docs/test-plans/website-content-grant.md` | Carried from `0.22.0`. Verified only by the migration applying cleanly |
| **A fresh production backup, and the restore recipe exercised once** | `backlog` → Deployment | **Raised by this release.** `0181` is the most destructive migration the project has applied and it went in with no fresh backup and a restore recipe that has never been run. Nothing went wrong, which is luck, not evidence. The backlog item now says the next destructive migration should wait for this |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |
| 2IC at phone width | `scripts/check-phone-width.mjs` | Not a release item (2026-10-10 decision), listed so it is not lost. The script has no `second_in_command`, so the 2IC, who has no PC on site, has never been measured. On the backlog |

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-11.md` end to end.** One release in it.
2. **Range starts at `c3862e52`.** Run `release-prs.mjs c3862e52 HEAD` and read its exit code directly, not through a pipe. Expect it to exit 1 if any PR was squash-merged.
3. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new — see **Where things stand**.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. `0.26.0` was the fifth consecutive major, but on `0.21.0`–`0.24.0`'s grounds (a page appears, a role gains or loses something) rather than `0.25.0`'s. Do not present five consecutive majors as one precedent.
5. **Ask whether anything in the release can fail silently** — and read the candidates in code before asking. Four of the last five answered yes. Read every pending migration's header before the cut, not at the apply: `0.26.0`'s answer was sitting in `0181`'s first paragraph the whole time.
6. **If the answer is yes, verify each option before you offer it.** This is the lesson of `0.26.0` and the reason this file opens with it.
7. **Expect a production-only guard.** There was none this time. It can only ever appear at the production dry-run, and it is a question for Lutan, not a file to fix.
8. **Budget the Worker deploy at ~8–13 minutes**, do not overlap it with anything building in the same checkout, and fill the wait with the Pi builds, the drift checks and the record. The test Worker deploy also builds in the main checkout — **do not start it while his production deploy is running.**
9. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it held at `0.26.0` and should keep holding.
10. **Five production-only checks are owed**, and the role pass is now the biggest of them. See the table above.
11. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.26.0` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, the test Worker
deploy and the merge, none of which were refused once the merge was asked for in
chat.

Three things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and say so when you hand it over.
- Hand it over as **one command per line** — `&&` does not parse in Windows PowerShell 5.1 — and always with the `| tee`.
- **Do not show it to him before then.** A command shown for context is indistinguishable from a command handed over, because the desktop app puts a Run button on every shell block.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
