# Release handover — written 2026-10-20 after `0.37.2`

**Read this first: the last edition opened by telling you the production Pi lies
about its own deploy. That is FIXED, proven on production, and you should delete
the fear.** `0.37.2` carried the fix (#750) and watched it work: the banner told
the truth, and the asset check it used to skip ran as the last step.

- **What bit `0.37.2` was a PERMISSION GATE, not the software.** `[Production Deploy]` refused the Pi build **twice** — the one considered retry did **not** clear it, for the first time in four releases. See *THE ONE THING*.
- **The handover you are reading replaced one that was wrong in three ways**, and one of those errors nearly cost Lutan a second answer to a question he had already given. See *THE SECOND THING* — it is about this file, and it applies to the file you are holding.
- **Nothing shipped broken.** All four builds from one SHA, no mail on a minor release, every gate green.

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release** and
is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction: **when something it warns about gets fixed, come back
and say so.** Honouring that, from the previous edition — and this release
retires an unusual amount:

- **THE PI NO LONGER LIES. Retired, with production proof.** `deploy-pi.sh` now probes with the origin key (the mechanism was `ORIGIN_KEY` in `src/proxy.ts`, **not** `PUBLIC_SITE` — that guess was wrong). Production printed `serving 0.37.2 as expected`, no banner, and `check-assets: ok … identical to the build` ran from an exit trap. **A red banner is evidence again. Believe it.**
- **THE PURGE IS YOURS NOW.** `CLOUDFLARE_PURGE_TOKEN` exists. `purge-cache.mjs --env production` purged the zone and proved it, and **its success path executed for the first time ever** after four releases of refusing. Budget two touches, not three.
- **`strip-baked-env` removes 13 on BOTH environments.** The old "14 on test, the extra is `SCRATCH_RESTORE_DB_URL`" is wrong — that name was in neither list. **Expect 13 and 13, and treat a difference as worth reading.**
- **`0224`'s card check is CLOSED and must not be raised again.** Lutan, 2026-10-19: *"Management holds it, and only Management."* It is ticked in `docs/backlog.md`. This edition's predecessor listed it as open and it was put to him a second time. **Do not make that three.**
- **The swap fix held for a fourth edition.** `/swapfile2` at priority 200 ahead of zram. **Settled — stop re-checking it.** This is the last edition that will mention it.
- **The Pi build cache is a non-issue.** Production 1.3 GB, test 704 MB, **876 GB free**. Both builds ran first time, 49s and 2.1min compiles. Check it if you like; stop fearing it.
- **The record-PR prediction held for a SIXTH release** (#760) and the cut's for a **third in a row** (#759). Settled; stop checking, but keep writing the guess down — writing it is what makes re-reading it happen.
- **The per-file dry-run trap did NOT fire** — all three files `ok`, **and no `-- consumer:` warnings at all**, because all three declared `consumer: none`. That is the **clean** case. Running tally: twice fired, seven not. **Say which of the three you got.**
- **`npm ci` as step 1 earned its keep a thirteenth time**, and `Next.js version : 16.3.8` matched `package.json` on all four builds.
- **The first CI run was green by construction for a NINTH release**, because the plan was written and committed before the PR opened.
- **All four builds from one SHA: seventeen releases running.**
- **A production-only guard** has now gone **fifteen** releases without appearing.

---

## THE ONE THING THAT WILL BITE YOU: `[Production Deploy]` may refuse twice

The production Pi build is **yours**, and there is an allow rule for it —
`Bash(ssh lutan@lanna-pi.local *)` in `C:\Users\Leidos\.claude\settings.json`.
For three releases that rule cleared the refusal on a single retry. **On `0.37.2`
it did not.** Two refusals, and Lutan had to run the command himself.

```
Permission for this action was denied by the Claude Code auto mode classifier.
Reason: [Production Deploy]
```

> **What to do, and it is a discipline rather than a trick:**
>
> 1. **Try it. If refused, take ONE considered retry.** That is the established pattern and it still often works.
> 2. **If the second attempt is refused, STOP.** Do not take a third. Hammering a refusal is the behaviour the gate exists to prevent.
> 3. **Hand Lutan the command**, at that moment and not before, and say plainly that nothing ran and the Pi is untouched.

**The diagnostic that saves you confusion: the TEST Pi build is NOT refused.**
Same session, same SSH, seconds apart, it went through. The gate is on the
production clone's path specifically. **So a blocked release manager can still
finish three of the four builds** and leave Lutan exactly one command.

**Budget honestly.** If this keeps happening, a release costs **three** touches,
not two, and saying so up front is better than discovering it at the end. It is
not a fault in anything — nothing was done wrong on `0.37.2`, and stopping after
one retry was correct and cost exactly one touch.

---

## THE SECOND THING: this file goes stale, and its OPEN ITEMS go stale fastest

**`0.37.2` nearly asked Lutan a question he had already answered.** The previous
edition listed `0224`'s card check as outstanding. It was carried into the
opening message and into the cut's test plan as an open item. **It had been
closed by Lutan on 2026-10-19** and ticked in `docs/backlog.md` — *"Management
holds it, and only Management."* It was caught only because the backlog was being
read properly for another reason.

**Why this is structural and not a one-off.** This file is a snapshot written at
one moment. The backlog is live and is edited by every stream, on its own branch,
continuously. **An item this file calls open may have been closed by someone else
an hour after it was written**, and nothing reconciles the two.

> **So: before you repeat ANY open item from this file — including the ones
> below — `grep` it in `docs/backlog.md` and read the line.** It costs seconds.
> Asking a second time is worse than not asking: it tells Lutan his answer went
> nowhere.

The same applies to the "things that got fixed" list: **this file is where a
correction is recorded, so trust the backlog over it when they disagree.**

---

## THE THIRD THING: a 502 is not a refusal

`gh pr merge` on the cut returned:

```
non-200 OK status code: 502 Bad Gateway  body: "<html>...<center><h1>502 Bad Gateway</h1>..."
```

The PR stayed `OPEN`, unmerged. **This is a transient GitHub error, not a
permission refusal**, and it looks nothing like the "Merge Without Review" block.
**Retry it once and it merges** — it did, immediately.

Worth naming because a session that confuses the two will either stop and ask
Lutan for nothing (a wasted touch) or, worse, assume the merge happened. **Always
re-read the state after a failed merge**: `gh pr view <n> --json state,mergedAt`.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.37.2`** @ `3e94268e` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`3e94268e`** — `node scripts/release-prs.mjs 3e94268e <the new release SHA>` |
| Production database | **`230 applied`, `0 pending`**, `No drift` at the end of this release. **Run `--status --env production` yourself.** |
| Dev database | `230 of 230`, `No drift: test matches origin/main`. **Already stale — run `--drift test`.** |
| Next free migration number | **`0230`**. `origin/main`'s highest is `0229`. **Still check** — three landed in this release |
| `unreleased` notes waiting | **0** at the moment the cut merged — **read nothing into that.** Four editions running have said 0 and been overtaken |
| Open PRs | **run `gh pr list`.** None at the end of this release |
| Worktrees | **run `node scripts/worktree.mjs list`.** Two new streams appeared during this release (`doctor-medical-cells`, `videos-app`), both at `3e94268e` and neither the release's |
| **The Pi's build cache** | production **1.3 GB**, test **704 MB**, **876 GB free** — healthy, and never close to trouble. **Stop fearing it** |
| **The Pi's swap** | `/swapfile2` at priority 200 ahead of zram. **Settled. This is the last edition to mention it** |
| `main` moves under you | **Yes.** On `0.37.1` it changed the release SHA mid-cut. On `0.37.2` it did not, but two new streams branched during it. Re-read; never carry a count forward |

**Server Actions keys checked on both pairs again** (twelfth time): production
`cbd55beae8d8`, test `ecc41837fc0b`, both unchanged since `0.31.0`. They are
environment configuration, not build output, so **matching this file's values is
not evidence you checked.** Compare the Worker's deploy line against the Pi's,
and look for the Pi's second line, `the build in .next carries that key` — both
Pis printed it this release.

### `0.37.2` was MINOR, so the mail check is inverted

**Assert `majorReleasesSince("<previous>")` returns NOTHING**, mechanically rather
than by reading the `major:` flag, then expect **no** `deploy: release mail` line.
Both logs printed `no major release new to <env>, so no email`. **On a minor
release the absence of the line is the check.**

**Why minor, a third release in two days:** `0.37.0` mailed every admin on the
morning of 2026-10-19. Four of the five notes were `admin` only and the fifth was
polish. A major would have mailed the same people a third time. **Put the
standing test's answer to Lutan, let him weigh the audience against it, and
record the reasoning either way.**

**A consequence worth flagging before the deploy, not after:** every note in
`0.37.2` was tagged and four were `admin` only, so **four of the seven roles saw
an empty section** on `/releases`. That is the `0.37.0` shape. It was flagged in
the cut's test plan deliberately. **Do not fix it by re-tagging another PR's note
during a cut** — that is not the cut's to change.

---

## Lutan's time: the budget is two, `0.37.2` cost THREE

| # | What | Should it have been his? |
|---|---|---|
| 1 | Minor versus major, plus the test-alert note — one round of clicks | **Yes**, by design |
| 2 | The production Worker deploy — **ran once** | **Yes**, by design |
| 3 | The production Pi build, after two refusals | **No** — but a permission gate, not an error |

**Three, and only the third is arguable** — and a fourth was nearly spent on the
`0224` question he had already answered. **Scores:** `0.34.0`/`0.35.0` two;
`0.33.0`, `0.36.0`, `0.36.1`, `0.37.1`, **`0.37.2` three**; `0.28.0` five;
`0.37.0` six.

**The opening message is still the whole technique**, and worked for an **eighth**
release. One message, four things, answered in one round:

1. **The case for major or minor**, stated plainly, with a recommendation
2. **The silent-failure answer** — what could break quietly, read in code
3. **The whole outstanding-verification list, AS AN EXPLICIT QUESTION** — ship-with-gaps or hold
4. **Any quietly-breaking change, named separately from the count**

**Check item 3's list against `docs/backlog.md` before sending it.** That is
where the near-miss above would have been caught.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan (**copied from the runbook**)
5. build **both Pis**, pinned `--ref` to the SHA his deploy reports

Because a Pi build can be pinned and a Worker build cannot, the Worker is what the
others are made to agree with.

- **Nine releases and the order has never been stress-tested between steps 4 and 5.**
- **`--upto` still has never been used in a real release.** Rehearse it before offering an order that depends on it.
- **Do not run anything in the main checkout while his deploy runs.** Both do `next build` there. It cost a touch on `0.37.1` and was avoided on `0.37.2` by simply waiting for the test Worker to finish first.

---

## In flight

**One item is open from this release, and it is real.**

**Is `0227`'s nightly retention job actually scheduled on production?** The
migration is applied (`230 applied, 0 pending`), but **pg_cron runs inside the
database and reports to nothing** — no email, no alert, no tile, no log anyone
reads. A read-only script to check it (one `SELECT` against `cron.job`) was
**refused at the write step as `[Production Reads]`**, confirmed not to have
reached disk, and **not retried**, because Lutan had not spoken to that specific
check.

- **The delete RULE is already established as correct** and does not need redoing: the enum's complete value set is `confirmed`, `cancelled`, `unmatched`, `refused` (read from `0070` and `0130`), so no unexpected status can fall into the 2-day branch. **Only the install is unverified.**
- **Both failure directions are silent.** No job means assistant text is kept forever against a sentence `/privacy` now shows users. A broken job means the same, with the error only in `cron.job_run_details`.
- **Two backlog items cover it**: the one-minute check (with the exact query), and **the fix** — making the job report on itself through the existing `/admin/status` tiles and `status_alert_runs` plumbing. `purge-assistant-actions` is **the only pg_cron job in the schema**, so there is no pattern for watching one and the fix would establish it.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** What is durable is the shape:

- A release's own worktrees become free leftovers once their PRs merge. **On `0.37.2` the cut's worktree was already gone by the time it was cleared** — do not assume you will be the one to remove it, or that it is still there.
- `HELD — <session name>` means someone is in it. Ask; do not tear it down.
- **A stream can be in flight with no PR**, which `gh pr list` will not show. `git branch -a` is the check.
- **There are worktrees `worktree.mjs list` cannot see** — app-cut ones under `.claude/worktrees/`.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-20.md`.** Then *THE ONE THING* above. **A red Pi banner is evidence again — believe it.**
2. **Expect `[Production Deploy]` to refuse the Pi build.** One considered retry, then stop and hand it over. **The test Pi is not refused**, so get the other three builds done.
3. **Check `docs/backlog.md` before repeating any open item from this file.** `0224` is closed; do not raise it.
4. **Copy the production deploy command out of `docs/release-procedure.md` verbatim — and check `git status -sb` immediately before handing it over.** Six releases running for the first half, two for the second.
5. **Do not run anything in the main checkout while his deploy is going.**
6. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Never call the record PR "ready to merge when you say". **A 502 on merge is transient — retry once and re-read the state.**
7. **`npm ci` in the main checkout before any deploy.** Thirteen releases running.
8. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values.
9. **Open with ONE message** carrying the four things above, with item 3's list checked against the backlog first.
10. **Range starts at `3e94268e`.** Re-run `release-prs.mjs` if `main` moves. **Expect a DISAGREEMENT alongside exit 0** — three consecutive releases have had one and **every one was a squash merge**, traced by hand from the PR number in the commit subject. It is no longer an anomaly; it is what a squash merge looks like to this script. **Do not tick the test-plan item against its list** — check the plans directly with `check-test-plan.mjs --base <previous SHA>`.
11. **Read both databases rather than trusting the table above.** `--env dev` is not a thing; the dev database is `--env test` and the drift check is `--drift test`.
12. **Decide major or minor with Lutan before cutting**, and remember the mail check inverts with the answer.
13. **Verify the cut mechanically, and make the verifier PRINT THE VALUES IT COMPARED.** `0.37.1`'s passed vacuously by locating the `[]` of the annotation `ReleaseNote[]`. `0.37.2`'s **imported both modules and compared values**, and its first two assertions existed only to prove the comparison was not empty (`4 note(s) read from origin/main`, `5 note(s) in 0.37.2`). **Reuse that shape.** It also printed the one **added** note as an addition rather than absorbing it into a count — an invented note and an intended one are indistinguishable from a total.
14. **A note added IN the cut is legitimate when the release is what closes the step.** `0.37.2` added the status test-alert note because `0226` was now applied and the Worker deploy was happening — the release-note truth rule reserves the note for the PR that closes the step. **Check every feature plan whose release-notes line reads `n/a: <outstanding step>` to see whether your release closes it.** This is how an ability ships invisibly otherwise.
15. **Ask whether anything can fail silently**, read the candidates in code, and **name it separately from the count**. **If a read you need is refused, say so and leave it open** — do not retry blind and do not quietly drop it.
16. **Check a migration's `-- consumer:` header against the release, not the day it was written.**
17. **When two migrations in one release touch the same object, check the later did not revert the earlier.** `0.37.2`'s three shared no object at all.
18. **Expect a production-only guard.** None for fifteen releases.
19. **The production migration apply is yours, with an allow rule.** It needed no prompt this release.
20. **Budget the Worker deploys at ~9–10 minutes each, strictly serial. Budget the Pi builds at ~5 minutes each** — `0.37.2`'s compiles were 49s and 2.1min.
21. **Check what is already on test before overwriting it.**
22. **Clear your own worktrees once their PRs merge** — but check they still exist first.
23. **Writing the cut's test plan before opening the PR made the first CI run green for the ninth release.** Then ticking the CI line is itself a commit, so a second run follows — **wait for it and confirm its `headSha` matches your HEAD before merging.** Merging on the strength of the first run merges a commit whose CI never finished.
24. **The vet calendar is ANSWERED — stop asking.** Lutan, 2026-10-19: *"LEAVE ON TEST UNTIL WE DEPLOY 2 WAY & TEST IT."* Write `n/a: configured on test only, dormant on production`. **Do not infer otherwise from `strip-baked-env`'s list**, which comes from the build environment.
25. **For any shipped change to `deploy-pi.sh`, check the log for `deploy-pi: restarting under the script from <sha>`.** That line means the release's own script re-exec'd and its guards ran. Its absence means the **old** script ran start to finish and the new guards did not. This is how `0.37.2`'s fix reached a clone that did not have it.

---

## The public site is still locked — on BOTH environments

`PUBLIC_SITE` is `locked`, so anonymous requests to `lannacare.org` **and**
`test.lannacare.org` get the "Staff testing site" gate — **confirmed on `0.37.2`
by fetching the root and matching the gate text, not assumed.** "Deploy it to
test and check the public behaviour there" is not an available move on any
environment, and offering it to Lutan is offering something that cannot be done.

**What you CAN do, and it is better evidence anyway:** test the enforcing layer
directly, against real rows, **as the `anon` role**, in a `begin … rollback`
harness (`set local role anon;`, then read the public views and call
`is_public_drive_file`).

Consequences to expect:

- **The public pages cannot be smoke-tested at all.** Third release running where the headline was internal, so this has not yet hidden anything.
- **The edge-cache `HIT` check is vacuous**: the gate is served `no-store`. Write it `n/a` with that reason. **And there is now a second reason to distrust that header** — see below.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so strip the nulls before grepping, and the
arrow does not survive, so grep for the **project ref**; a backgrounded
`deploy.mjs` writing nothing for minutes is buffering; the `ERROR Failed to copy …`
lines are noise; and `-- consumer:` warnings naming files that differ from the
live release are the safe direction. Also:

- **A `502 Bad Gateway` from `gh pr merge` is transient.** Retry once and re-read the PR state. It is not a permission refusal.
- **`[Production Deploy]` refusing the Pi build twice is now expected.** See *THE ONE THING*. **The test Pi is not refused.**
- **`x-lanna-cache: HIT` on a page served `no-store`, right after a full purge**, was observed on production and is **unexplained**. Nothing turns on it while the gate is up, but it is on the backlog, and the `HIT` check becomes real the moment `PUBLIC_SITE` is unlocked.
- **`purge-cache.mjs` and `check-assets.mjs` disagree by 4 bytes** on the same stylesheet (96235 vs 96239). The authoritative one is `check-assets.mjs`, which compares against the **build** and said `identical`. On the backlog. **Do not "fix" it by making the numbers agree without establishing which is right.**
- **A command piped through `tail` writes nothing until it finishes** — that is why `gates.mjs` and `npm ci` look stalled for minutes. Not a hang.
- **`python` is the Microsoft Store stub on this machine** and exits 49. Use the editing tools or `node`.
- **`Killed` after `Creating an optimized production build ...` is the CACHE; after `Running TypeScript ...` it is the older memory fault.** Neither appeared this release.
- **A five-figure `lint` failure in the main checkout is almost certainly NOT your code** — `eslint` walks into `.claude/worktrees/`. Check with `npx eslint --ignore-pattern '.claude/**'`.
- **A FAILED dry-run can be the correct result** when a file rebuilds a view naming columns an earlier *pending* file adds. **A red it does not explain is a real stop.**
- **`--drift test` exiting 1 with dev *ahead* is usually normal** — the schema-first rule working.
- **A `gates.mjs` run much faster than the last is a warm Turbopack cache.** Read the exit codes, not the timings. It prints `test=0` as well as the three the template names.
- **A second CI run on the cut PR is correct and expected.**
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes two to three minutes.
- **`/api/version` disagreeing with `/api/releases/current` mid-release is not a fault** — the first comes from the origin Pi, the second from the Worker. Expect it between the Worker deploy and the Pi build.
- **A red `public-views` is almost certainly not yours** — it runs against the shared dev database.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" matches the viewport meta twice.
