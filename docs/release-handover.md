# Release handover — written 2026-10-19 after `0.37.1`

**Read this first: the last edition told you to fear the Pi's build cache. That
was right, and it is handled — but it is not what bit this release.** What bit
`0.37.1` was **the Pi's deploy script telling the exact opposite of the truth**:
it ended the production build with `DEPLOY FAILED — NOTHING NEW IS BEING SERVED`
while the site was already serving the new release correctly.

- **A red `DEPLOY FAILED` from the PRODUCTION Pi is no longer evidence of anything.** One command tells you the truth. See *THE ONE THING*.
- **Two of this release's three interventions were caused by the release manager**, not by the software: a Worker build started in the same folder as Lutan's, and a deploy command handed over without re-checking that `main` was still level.
- **A PR merged mid-release and the deploy guard forced it into the release**, changing the release SHA after the cut had already merged.

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release** and
is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction: **when something it warns about gets fixed, come back
and say so.** Honouring that, from the previous edition:

- **THE PI BUILD CACHE IS SETTLED, and now we know it regrows slowly.** `0.37.0` cleared production to 450 MB; one day later it was **689 MB**, test 1.2 GB, and both builds ran first time. **Keep checking it before the production build** — one command — but stop expecting 4.4 GB.
- **The swap fix held and is persisted.** `/swapfile2` at priority 200 ahead of zram, confirmed in `/proc/swaps`. **Stop re-checking this every release.**
- **The deploy-command rule WORKED for a fifth release running.** Copy the production deploy command out of the runbook verbatim. **Keep the rule exactly as written** — but see the new half of it below.
- **The opening-message shape has now worked seven releases running**, answered in one round of clicks again. **Still the single highest-leverage habit in this file.**
- **The record-PR prediction held for a FIFTH release.** #732 (`0.37.0`'s record) was in range and matched to its PR. Settled; stop checking.
- **The per-file dry-run trap did NOT fire** — all three files `ok`. Twice fired against six not. **Say which of the three cases you got.**
- **`npm ci` as step 1 earned its keep a twelfth time**, and `Next.js version : 16.3.8` matched `package.json` on all four builds.
- **The cut's PR-number guess was RIGHT again** (#743), two in a row. **It was still re-read after opening.** Keep writing the plan first — the first CI run was green by construction for an **eighth** release.
- **A production-only guard** has now gone **fourteen** releases without appearing.

---

## THE ONE THING THAT WILL BITE YOU: the production Pi lies about its own deploy

`deploy-pi.sh` on **production** now ends a perfectly good deploy with:

```
# deploy-pi: DEPLOY FAILED — NOTHING NEW IS BEING SERVED
# The Pi is still on the OLD version. Do not announce this release.
deploy-pi: http://localhost:3000/api/version serves 'nothing', expected '0.37.1'.
```

**On `0.37.1` every word of that was false.** The build had compiled, the Server
Actions key matched, systemd had started the new version, and `lannacare.org`
was already serving it.

> **THE DIAGNOSTIC, and it is one command. Do not trust the banner — ask the
> public hostname:**
>
> ```bash
> curl -s https://lannacare.org/api/version
> ```
>
> If it reports the release and the SHA you pinned, **the deploy worked.** Then
> run the step the script never reached:
>
> ```bash
> ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && node scripts/pi/check-assets.mjs --url https://lannacare.org'
> ```

### Why it happens, and why it is not a one-off

The script verifies itself against `http://localhost:3000/api/version`.
**Production refuses direct origin requests with `Forbidden`** — including with
`Host: lannacare.org` set. The **test** clone on port 3001 answers normally,
which is why the test build passes the same check minutes earlier.

**It is not new.** The same `Forbidden` was recorded at 15:03 that day, before
any deploy, while `0.37.0` was still live. The check has been broken for a while
and went unnoticed because `0.37.0`'s four Pi failures were **genuine** — the
script was right four times running, for a reason you should not have trusted.

**Two consequences, and the second is the dangerous one:**

1. **It cries wolf**, and tells you in capitals not to announce a release that is already live and correct.
2. **It exits before `check-assets.mjs`**, which is the last step. That is the check that catches a poisoned edge cache — the failure that stays broken for a year and is invisible from the machine you deployed from. **A session that believed the banner and rolled back would have skipped it.**

**On the TEST Pi the same check works, and a failure there is real.** The clone
tells you which you have.

**Raised on the backlog.** The fix is for the self-check to ask through the public
hostname, or for the gate to allow a loopback probe. It is plausibly the same
mechanism as `PUBLIC_SITE` being locked — **worth checking those two together.**

---

## THE SECOND THING: you cannot decide to leave a mid-release PR out

A PR merged while `0.37.1` was in flight. The release manager decided
deliberately to exclude it. **That decision did not survive the deploy guard:**

```
deploy: production deploys only from a clean, pushed main:
  - main and origin/main differ (2 behind / 0 ahead)
```

There is no way past that except to pull — which takes the PR. The release SHA
moved **after the cut had already merged**, and the test Worker and test Pi both
had to be rebuilt so all four builds still came from one commit.

- **Say "I am folding it in because the guard requires it"**, not "I am excluding it". The second is not a move you have.
- **Folding in a schema-only PR is cheap; an app PR would not have been.** `0226` was `-- consumer: none`, so the bundle was behaviourally identical and no release note was owed. An app PR means re-cutting.
- **The new half of the deploy-command rule: check `git status -sb` immediately before you hand the command over**, not when the release starts. Handing over a command the guard then refuses costs Lutan a touch.

---

## THE THIRD THING: do not touch the main checkout while his deploy runs

**`0.37.1` cost Lutan a second attempt at his one job because the release manager
started the test Worker deploy while his production deploy was running.** Both run
`next build` in `C:\Development\Animal_Shelter_App`. Next refused his with
*"Suggestion: Wait for the build to complete"* and it died before deploying
anything.

**The runbook already says the Worker deploys are ~9–10 minutes each and must not
overlap.** It was done anyway, to save time, and saved none.

**While he is deploying, the useful work is on the Pi or in a worktree — not in
the main checkout.**

---

## The purge is STILL Lutan's — check before you plan the release

```bash
node scripts/purge-cache.mjs --env production --dry-run
```

- **Prints what it would purge** → the token exists, **the purge is yours**, budget two touches.
- **Refuses naming `CLOUDFLARE_PURGE_TOKEN`** → **Lutan's**, from the dashboard (Caching → Configuration → Purge Everything), budget three. **Say so in the opening message**, not at the end.

**It refused on `0.37.1`**, so it is still his, four releases running. The
automation (#720) is built and needs one value in `.env.deploy.production`. It is
**not** a Worker secret. Its success path has **still never executed**.

**Purge even when the asset check is green.** The check only sees the edge it
reaches.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.37.1`** @ `9804e211` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`9804e211`** — `node scripts/release-prs.mjs 9804e211 <the new release SHA>` |
| Production database | **`227 applied`, `0 pending`**, `No drift` at the end of this release. **Run `--status --env production` yourself.** |
| Dev database | read at 226 of 226 **before `0226` merged**. **This row is already stale — run `--drift test`.** |
| Next free migration number | **`0227`**. `origin/main`'s highest is `0226`. **Still check** — three landed in this release and one arrived mid-release |
| `unreleased` notes waiting | **0** at the moment the cut merged — **read nothing into that.** Three editions running have said 0 and been overtaken, and this one was overtaken by a whole PR before the deploy |
| Open PRs | **run `gh pr list`.** None open at the cut; #744 appeared and merged during the release |
| **The Pi's build cache** | production **689 MB**, test **1.2 GB** — healthy. It regrew from 450 MB in one day, so **it does grow, slowly**. Check it; stop fearing it |
| **The Pi's swap** | `/swapfile2` at priority 200 ahead of zram, persisted. **Settled — stop re-checking** |
| `main` moves under you — including mid-cut | **Yes, and on `0.37.1` it changed the release SHA after the cut had merged.** Re-read; never carry a count forward |

**All four builds came from the release SHA**, for the sixteenth release running
— but only because the test pair was rebuilt after the SHA moved.

**Server Actions key checked on both pairs again** (eleven times now): production
`cbd55beae8d8`, test `ecc41837fc0b`, both unchanged since `0.31.0`. They are
environment configuration, not build output, so **matching this file's values is
not evidence you checked.** Compare Worker against Pi, and look for the Pi's
second line, `the build in .next carries that key`.

**`strip-baked-env` removed 13 on production and 14 on test.** The extra is
`SCRATCH_RESTORE_DB_URL`, which exists only on test. **That asymmetry is expected
and is not a missing production secret.**

### `0.37.1` was MINOR, so the mail check is inverted

**Assert `majorReleasesSince("<previous>")` returns NOTHING**, mechanically rather
than by reading the `major:` flag, then expect **no** `deploy: release mail` line
— both logs instead printed `no major release new to <env>, so no email`.
**On a minor release the absence of the line is the check.**

**Why minor, two releases on one day:** `0.37.0` had mailed every admin hours
earlier; four of the five notes were fix bundles and the one new ability was
tagged `admin` only. The standing test and the audience argument agreed, as they
did for `0.36.1` and in the opposite direction for `0.37.0`. **Put the standing
test's answer to Lutan, let him weigh the audience against it, and record the
reasoning either way.**

---

## Lutan's time: the budget is two, `0.37.1` cost THREE

| # | What | Should it have been his? |
|---|---|---|
| 1 | Minor versus major, ship-with-gaps and the `0224` risk — one round of clicks | **Yes**, by design |
| 2 | The production Worker deploy — **run twice** | **Yes** once, **no** twice |
| 3 | The Cloudflare cache purge | **Yes for now**, until the token exists |

**Three is the best score since `0.35.0` and it should have been two.** The second
attempt is entirely the release manager's fault — see *THE THIRD THING*.

**Scores:** `0.34.0`/`0.35.0` two; `0.33.0`, `0.36.0`, `0.36.1`, **`0.37.1` three**;
`0.28.0` five; `0.37.0` six.

**The opening message is the whole technique.** One message, four things,
answered in one round:

1. **The case for major or minor**, stated plainly, with a recommendation
2. **The silent-failure answer** — what could break quietly, read in code
3. **The whole outstanding-verification list, AS AN EXPLICIT QUESTION** — ship-with-gaps or hold
4. **Any quietly-breaking change, named separately from the count**

### One thing `0.37.1` left open, and it is the fourth item

`0224` removes `photos.resident_publish` from any role holding the Approve photos
card but **not** the Residents card — that role's uploads would silently queue for
approval instead of publishing. Lutan accepted it on the stated condition that
**only Management holds the card**.

**It was never verified against production.** A read-only query was **refused by
the classifier as `[Production Reads]`** and was deliberately **not** retried,
because he had not said to proceed on that specific thing. **It is a thirty-second
look at Who does what and it is still open.**

### The three allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json`:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
"Bash(ssh lutan@lanna-pi.local *)"
```

**Claude cannot read, add or revert them.** You find out when a command is refused.

**On `0.37.1`:** the production migration apply went through with **no prompt**;
the production Pi deploy was refused as `[Production Deploy]` and **worked on one
considered retry** (three releases running); a read-only production query was
refused as `[Production Reads]` and **was not retried**.

**So: do not retry blind. One considered retry after Lutan has said to proceed is
the established pattern. A refusal on something he has not spoken to stays
refused and gets reported.**

**The production Worker deploy deliberately has no allow rule and must never get
one.** It is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.37.1` "that is
done" was said when the deploy had in fact been refused by the guard, and again
when it had died on a build collision. **Both times, reading the log and
`/api/version` is what established the truth.** `tr -d '\000' < deploy-0.37.1.log`
(`tee` writes UTF-16), then grep for the **project ref** (the arrow does not
survive that conversion), `Next.js version`, `strip-baked-env`, the Server Actions
key, and the release-mail line.

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

- **Eight releases now and the order has never been stress-tested between steps 4 and 5** — though `0.37.1` came closest, with `main` moving between the cut and step 4.
- **`--upto` still has never been used in a real release.** Rehearse it before offering an order that depends on it.

---

## In flight

**Nothing was left open by the release itself**, apart from the `0224` check above.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** What is durable is the shape:

- A release's own two worktrees become free leftovers once their PRs merge. Do not assume you will be the one to clear them, and do not assume they are still there.
- `HELD — <session name>` means someone is in it. Ask; do not tear it down.
- **A stream can be in flight with no PR**, which `gh pr list` will not show. `git branch -a` is the check.
- **A PR can merge while you are mid-release — on `0.37.1` one did, and it changed the release SHA.** See *THE SECOND THING*.
- **There are worktrees `worktree.mjs list` cannot see** — app-cut ones under `.claude/worktrees/`. They are not tracked by git, they can hold build output, and one has held a stale `next dev`.

**If you repeat a number from this handover, run the list first and quote what it
says** — or write "run the list" and no number at all.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-19-0-37-1.md` → *THE DEFECT THAT MATTERS* first.** Then *THE ONE THING* above. **A red production Pi banner is not evidence.**
2. **After both Pi builds, read `/api/version` on both hosts** — and on production, **run `check-assets.mjs` by hand**, because the script exits before it. Then **purge**, and find out at the **START** whose job the purge is.
3. **Copy the production deploy command out of `docs/release-procedure.md` verbatim — and check `git status -sb` immediately before handing it over.** Five releases running for the first half; the second half is new.
4. **Do not run anything in the main checkout while his deploy is going.** It cost a touch this release.
5. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Never call the record PR "ready to merge when you say".
6. **`npm ci` in the main checkout before any deploy.** Twelve releases running.
7. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values.
8. **Open with ONE message** carrying the four things above. Seven releases running.
9. **Range starts at `9804e211`.** Re-run `release-prs.mjs` if `main` moves. **Expect a DISAGREEMENT alongside exit 0** — it reported two files belonging to no PR in both runs, and both were squash merges traced by hand. **That is a third case the old "expect NEITHER" advice does not name.**
10. **Read both databases rather than trusting the table above.** `--env dev` is not a thing; the dev database is `--env test` and the drift check is `--drift test`.
11. **Decide major or minor with Lutan before cutting**, and remember the mail check inverts with the answer.
12. **Verify the cut mechanically, and make the verifier PRINT THE VALUES IT COMPARED.** `0.37.1`'s verifier passed vacuously on its first run: it located the `[]` of the type annotation `ReleaseNote[]` instead of the array literal, compared two empty arrays, and reported `ok`. It only surfaced because a later assertion crashed. **A verifier that reports success without comparing anything is worse than none**, and ticks alone cannot tell you which you have.
13. **Ask whether anything can fail silently**, read the candidates in code, and **name it separately from the count**. **If a read you need is refused, say so and leave it open** — do not retry blind and do not quietly drop it.
14. **Check a migration's `-- consumer:` header against the release, not the day it was written.**
15. **When two migrations in one release touch the same object, check the later did not revert the earlier.** `0.37.1` had none; `0224` rebuilt `set_role_cards()` from the **live definition** with one string swapped rather than restating a body, which is the safe shape — nothing can be silently dropped because nothing is retyped.
16. **Expect a production-only guard.** None for fourteen releases.
17. **The production migration apply is yours, with an allow rule.** It needed no prompt this release.
18. **Budget the Worker deploys at ~9–10 minutes each, strictly serial. Budget the Pi builds at 5 minutes each while the cache is healthy.**
19. **Check what is already on test before overwriting it.**
20. **Clear your own worktrees once their PRs merge** — but check they still exist first.
21. **Writing the cut's test plan before opening the PR made the first CI run green for the eighth release.** Then ticking the CI line is itself a commit, so a second run follows — **wait for it and confirm its `headSha` matches your HEAD.**
22. **The vet calendar is ANSWERED — stop asking.** Lutan, 2026-10-17: *"The vet calendar is only setup on test right now."* Dormant on production by configuration. **Do not infer otherwise from `strip-baked-env`'s list**, which comes from the build environment. Write `n/a: configured on test only, dormant on production (Lutan, 2026-10-17)`.

---

## The public site is still locked — on BOTH environments

`PUBLIC_SITE` is `locked`, so anonymous requests to `lannacare.org` **and**
`test.lannacare.org` get the "Staff testing site" gate. **"Deploy it to test and
check the public behaviour there" is not an available move on any environment**,
and offering it to Lutan is offering something that cannot be carried out.

**What you CAN do, and it is better evidence anyway:** test the enforcing layer
directly, against real rows, **as the `anon` role**, in a `begin … rollback`
harness (`set local role anon;`, then read the public views and call
`is_public_drive_file`).

Consequences to expect:

- **The public pages cannot be smoke-tested at all.** `0.37.1`'s headline is internal, so this is the second release running where that did not hide it.
- **A note asserting a number is hidden more completely than one asserting a layout.**
- **The edge-cache `HIT` check is vacuous**: the gate is served `no-store`. Write it `n/a` with that reason.
- **This may also be why the production Pi's self-check gets `Forbidden`.** Unproven, but the two are worth investigating together.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so strip the nulls before grepping, and the
arrow does not survive, so grep for the project ref; a backgrounded `deploy.mjs`
writing nothing for minutes is buffering; the `ERROR Failed to copy …` lines are
noise; and `-- consumer:` warnings naming files that differ from the live release
are the safe direction. Also:

- **`DEPLOY FAILED — NOTHING NEW IS BEING SERVED` on the PRODUCTION Pi is not evidence.** See *THE ONE THING*. **On the TEST Pi the same banner is real.**
- **`Forbidden` from `localhost:3000` on the production Pi is normal** — production refuses direct origin requests, with or without the right `Host`. The test clone on 3001 answers.
- **`strip-baked-env` removing a different count on test and production is expected** — 14 and 13.
- **`Killed` after `Creating an optimized production build ...` is the CACHE; after `Running TypeScript ...` it is the older memory fault.** Neither appeared this release, and the cache is healthy.
- **A five-figure `lint` failure in the main checkout is almost certainly NOT your code** — `eslint` walks into `.claude/worktrees/`. Check with `npx eslint --ignore-pattern '.claude/**'`.
- **A `git merge backlog` can be left mid-conflict in the main checkout**, blocking every git command there. Keep the new items and `main`'s ticked versions, and verify the result is additions only.
- **A FAILED dry-run can be the correct result** when a file rebuilds a view naming columns an earlier *pending* file adds. **A red it does not explain is a real stop.**
- **`--drift test` exiting 1 with dev *ahead* is usually normal** — the schema-first rule working.
- **A `gates.mjs` run much faster than the last is a warm Turbopack cache.** Read the exit codes, not the timings. It prints `test=0` as well as the three the template names.
- **A second CI run on the cut PR is correct and expected.**
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes about four minutes.
- **`/api/version` disagreeing with `/api/releases/current` mid-release is not a fault** — the first comes from the origin Pi, the second from the Worker.
- **A foreground deploy past the ten-minute tool cap is moved to the background, not killed.** Read its log file.
- **A red `public-views` is almost certainly not yours** — it runs against the shared dev database.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" matches the viewport meta twice.
