# Release handover — written 2026-10-18 after `0.36.1`

**Read this first: the two warnings this file led with have both been FIXED, and
the fixes have both been exercised.** That is unusually good news for this file, so
do not skim past it.

- **The Pi memory fault is fixed.** Swap is 6 GB and both clones built **first time** on `0.36.1` after `0.36.0`'s four consecutive kills. **And the peak is now measured** — see the Pi section.
- **The cache poisoning has a check.** `deploy-pi.sh` now fetches the served stylesheet and compares it with the build. It works — it was run by hand on both environments and passed.
- **But that safety code did NOT run on the release that shipped it**, because `deploy-pi.sh` updates itself mid-run. That is `0.36.1`'s Defect 1 and the newest thing in this file.

Three releases shipped in two days (`0.35.0`, `0.36.0`, `0.36.1`), so **every number
below has moved at least twice. Re-read, do not quote.**

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction: **when something it warns about gets fixed, come back
and say so** — a confidently wrong warning costs more than a missing one.
Honouring that, from the previous edition:

- **The deploy-command rule WORKED again, for the third release running.** Copy the production deploy command out of the runbook verbatim; do not compose one. Lutan's deploy ran clean first time on `0.35.0` and again on `0.36.0`, and `0.33.0`'s Defect 1 has now not recurred three times. **Keep the rule exactly as written** — it is still among the cheapest and most valuable things in this file.
- **The opening-message shape has now worked four releases running**, and the pending-items-as-a-question fix twice. One message carrying the version case, the silent-failure answer, the full outstanding list **as a question**, and any quietly-breaking change **named separately** — answered in one round of clicks both times. **Keep doing exactly this.** It is the single highest-leverage habit in this file.
- **But the two-touch budget was BROKEN on `0.36.0`: three touches.** The third was the Pi blocker below, and it was not avoidable — enlarging swap needs a `sudo` outside the four commands the Pi grants, so it was always his. Recorded as a cost rather than absorbed. The lesson is **"when the blocker is on his machine, bring the diagnosis, not the question"**.
- **`release-prs.mjs` exited 0 this time. Across six releases it has gone 1, 1, 1, 0, 1, 0 — so expect NEITHER.** Read the exit code directly, never through a pipe, and keep the reconciliation drill ready for when it is 1.
- **The record-PR prediction held for a THIRD release.** #693 (`0.35.0`'s record) was in range and the script matched it to its PR rather than orphaning it. Expect it, assign it to the previous release, do not expect it flagged. Settled.
- **The per-file dry-run trap FIRED** — `0217` reported `FAILED` on a column `0216` adds, overall exit 0, and the runner diagnosed its own red in plain words. **The apply then confirmed it: all four files `ok`.** That is twice fired (`0.32.1`, `0.36.0`) against four not applying. Say which of the three you got. **A red the runner explains is not a stop; a red it does not explain is.**
- **`npm ci` as step 1 earned its keep a ninth time**, and `Next.js version : 16.3.8` matched `package.json` on both Worker builds. Keep doing it.
- **The build order is still right and still untested** — a sixth release where `main` held still through the builds. Do not read that as the precaution being unnecessary.
- **`--drift <env>` is fine and both environments are clean.** Run the named check on both and quote it.
- **The `ERROR Failed to copy …` lines**: three on test, none on production — identical for three releases now. Any count is normal. Keep not investigating it.
- **The gate-script exit-code defect stays withdrawn.** Fixed in `3557e06e` and verified; nothing since has contradicted that.
- **The cut's PR-number guess was WRONG for the first time in five releases.** The plan guessed #704; another stream took it and the cut was #705. Corrected in the header with the reason. Keep writing the plan before opening the PR — the first run is still green by construction — but **re-read the number before you trust it**.

---

## THE ONE THING THAT WILL BITE YOU: the Pi now runs out of memory building this app

**Found in `0.35.0`, far worse in `0.36.0`, and now FIXED on the live Pi by a
change that is not in the repository.** Read all of this before you deploy
anything.

`./scripts/pi/deploy-pi.sh` compiles and is then **killed by the kernel**, either
during the typecheck or during the build itself:

```
✓ Compiled successfully in 55s
  Running TypeScript ...
Killed
```

**The history matters, because the obvious remedy is the wrong one.** On `0.35.0`
both clones were killed on their first attempt and both succeeded on a plain retry,
so the previous edition of this file told you to budget one retry each. **On
`0.36.0` the test clone was killed FOUR TIMES RUNNING.** Attempts 2–4 were identical
re-runs and two died *earlier* than the first. Between attempts the Pi showed
**3.5–3.6 GB of its 4 GB available** with nothing competing — the largest processes
were the Next server at 74 MB and `cloudflared` at 30 MB — so it was never
contention or a leak. The build's appetite simply exceeds the machine, and it grows
with every release.

**What actually fixed it: Lutan increased the Pi's swap from 2 GB to 6 GB**, adding
a 4 GB file-backed swapfile (`/swapfile2`) alongside the existing 2 GB of zram. The
next test build completed, and the production build then succeeded **first time**.
**On `0.36.1` both clones built first time** — so the fix is now exercised, not just
believed.

**AND THE PEAK IS NOW MEASURED, which settles the open question.** `0.36.1` took the
measurement the runbook asked for. A **cold** build (the first attempt was useless —
a warm Turbopack cache compiled in 7.5 s and never reached the heavy stage), sampled
every 3 s:

```
peak node RSS   : 3372 MB
peak swap used  :  947 MB
PEAK COMBINED   : 4320 MB
```

The Pi has **4,049 MB** of usable RAM, so the build needs about **270 MB more than
the machine physically has.** That is the whole story: at "4 GB RAM + 2 GB zram"
there was never really 6 GB, because **zram is compressed RAM, not extra capacity** —
the file-backed swapfile is what gave those 270 MB somewhere real to go.

**Against the threshold in `docs/decisions/2026-10-18-pi-deploy-safety.md`** (a
little over 6 GB → swap is defensible; well over → dropping the typecheck is the only
honest answer), **4,320 MB is comfortably under, so the swap is the right answer and
`ignoreBuildErrors` can wait.** Two caveats: **the margin is only 270 MB and the app
grows every release**, and **sampling every 3 s can miss a spike, so treat 4,320 MB
as a floor.** `/usr/bin/time` is not installed on the Pi; installing it would give an
exact figure next time.

> **The rules, corrected:**
> 1. **"Budget one retry" is WITHDRAWN as a remedy.** It worked once by luck. Retrying is not a fix.
> 2. **The swap IS now in the repo** — `scripts/pi/setup.sh` creates `/swapfile2` and `docs/pi-hosting.md` explains the number (#708, merged in `0.36.1`). A rebuilt Pi gets it. `deploy-pi.sh` also refuses below 5.5 GiB — **but see Defect 1 below: that refusal did not actually run on `0.36.1`.** Check it yourself with `cat /proc/swaps` (`swapon` is not on the non-interactive `ssh` PATH); expect ~6 GB.
> 3. **If a build is killed, stop and tell Lutan — do not improvise on the machine that serves users.** That rule held and is what produced the fix. But bring the **diagnosis**, not the question: `free -m` between attempts, the biggest processes, and what you have already ruled out.
> 4. **A restart does not help.** He asked; the answer was no, with numbers — a restart reclaims memory that is already free, the box had been up 15 days without leaking, and it briefly drops the Pi as the production origin for no gain.

**Why it is worse than "just retry", and this is the part to actually internalise.**
`deploy-pi.sh` builds into a fresh `.next` before swapping, so the running service
keeps serving. That design is what contained this — nothing went down. But it also
means **a failed build is silent**:

- `systemctl is-active lanna-care` said `active`
- the clone's `git log -1` said the release SHA, because the script fetches before it builds
- **only `/api/version` gave it away**

That is the runbook's "a git-updated clone is not a deployed clone" trap, met for
real. For the window between Lutan's deploy and the successful retry:

| Surface | Reported |
|---|---|
| Production Pi — **what users are served** | `0.34.0` @ `598c2e56` (old) |
| Production Worker | `0.35.0` |

So **production served the previous release while the mail announcing this one had
already gone out.** Nothing broke for users and schema-ahead-of-code is the safe
direction, but the announcement briefly preceded the thing it described. **Check
`/api/version` on both hosts after every Pi build; never infer success from the
service being up or the clone being at the right SHA.**

**What was deliberately NOT done, and should stay not done mid-release:** no
`NODE_OPTIONS` heap cap, no swap change, no edit to `deploy-pi.sh`. Changing how
production builds in order to work around a fault discovered in that release is
how a small problem becomes a shipped one. A backlog item is raised under
*Deployment (before go-live)* with the three candidate fixes — capping V8's heap,
more swap, or dropping the typecheck from the Pi build given `gates.mjs` and CI
have already typechecked the same commit. **That is its own PR with its own test
plan, not a release step.**

---

## THE NEWEST THING: `deploy-pi.sh` updates itself, so a fix to it lands ONE DEPLOY LATE

**`0.36.1` shipped #708's Pi safety work — the swap gate, the `.next.prev` fallback
and the automatic asset check — and NONE of it ran.** Not on either clone.

The new script **is** on disk afterwards, `scripts/pi/check-assets.mjs` exists, and
the clone sits at the release SHA. It was checked out and simply not used.

**Why:** `deploy-pi.sh` runs `git fetch` and checks out the target ref near the top,
which **replaces the very file bash is executing**. Bash reads a script
incrementally, so it carries on with the copy it already had open.

> **A self-updating deploy script always runs the OLD version on the deploy that
> introduces the new one. So any change to `deploy-pi.sh` takes effect on the NEXT
> deploy, not the one that ships it.**

**What this means for you, concretely:**

- **On the release that ships a `deploy-pi.sh` change, run its new checks by hand.** `0.36.1` did: `node scripts/pi/check-assets.mjs --url https://lannacare.org/` from the clone, and the same against test. Both passed — `check-assets: ok … 95277 bytes, identical to the build`. **The tool works; it simply was not invoked.**
- **Do not read "this is now guarded" and believe it for that release.** The two faults #708 exists to prevent were unprotected on exactly the deploy that shipped their protection.
- **Check the preconditions by hand too.** `0.36.1` confirmed swap at 6,143 MB itself, which was just as well since the script's own gate never fired.

Raised on the backlog with three options (accept and document; `exec "$0" "$@"` after
checkout with a loop guard; split into a thin launcher plus payload). **Accepting it
is defensible — but it has to be written down**, because "I fixed the deploy script
and the next deploy will still be broken" is the kind of surprise that costs an hour
at the wrong moment.

---

## THE SECOND THING: a Pi deploy can poison the edge cache, and you cannot see it from your machine

**`0.36.0` passed every release check and the app was still broken for a real person
on a real phone.** Read this before you call a release verified.

**Symptom:** the app renders with **no styling at all** — white background, default
serif text, no brand colour — while the page content is current and correct. It
looks like "the CSS is gone".

**Mechanism:** `/_next/static/**` is served
`Cache-Control: public, max-age=31536000, immutable`, so Cloudflare caches it for a
year and never revalidates. `deploy-pi.sh` builds into a fresh `.next` and then
**swaps it**, so there is a window where an asset request can be answered with a 404
or a half-written file — and **whichever Cloudflare location serves that request
keeps the failure for a year.**

> **The trap: a phone on mobile data and a laptop on wifi reach different Cloudflare
> locations. So this presents as "only broken on mobile" and is INVISIBLE from the
> machine you deployed from.** Every check in `0.36.0` passed — four surfaces
> agreeing on version and SHA, both databases clean, keys matched, mail arrived —
> while this was live. **None of those checks touch whether the stylesheet a browser
> actually fetches is intact.**

**Do not chase it in the build.** On `0.36.0` the origin was healthy throughout:
the stylesheet was complete and **byte-identical to test (92,570 bytes)** on 20
consecutive fetches, `x-lanna-served-by: pi` with `200` twelve times out of twelve,
and a fresh browser rendered it correctly both at desktop and at 375 px with a phone
user agent. **Nothing was wrong with the build, the HTML, the CSP or the file** —
only with what some edge nodes had stored.

**What tells you it is this and not a stale browser cache:** clearing the browser
fixes it *and then it breaks again*. A one-off stale cache does not do that.

**Partly fixed since.** `scripts/pi/check-assets.mjs` (#708) fetches the served
stylesheet and compares it byte-for-byte with the build, and `deploy-pi.sh` runs it
as its last step — **once the self-updating problem above lets it**. On `0.36.1` it
was run by hand against both environments and passed, including against production
**before** the purge (`CF-Cache-Status: MISS`, 95,277 bytes identical), so that
deploy poisoned nothing.

**But the purge is still Lutan's, and it is now a required runbook step after every
Pi deploy** (`docs/release-procedure.md`). He has done it by hand twice in two days.
**He ruled on 2026-10-18 for automating it** — a scoped Cloudflare token on the Pi —
and that is raised as its own PR rather than folded into a release.

**Purge even when the check is green.** The check only sees the edge location it
reaches; a phone on mobile data may reach another. That is exactly how `0.36.0`'s
fault hid from the deploy machine, and it is why the runbook says to purge anyway.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.36.1`** @ `e581c631` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`e581c631`** — `node scripts/release-prs.mjs e581c631 <the new release SHA>` |
| Production database | **`221 applied`, `0 pending`** at the end of this release, `No drift`. The normal between-releases state is that this grows one pending per migration merged since. **Run `--status --env production` yourself; do not trust this number.** |
| Dev database | `No drift: test matches origin/main`, 221 of 221. It goes one-sided whenever a schema branch is applied to dev before merging, which is the schema-first rule working and happens most days. **Run `--drift test`; this row will be out of date.** |
| Next free migration number | **`0221`** as of the end of this release. `origin/main`'s highest is `0220`. **Still check** (`git branch -a`, `gh pr list`, dev's ledger) rather than trusting this row — across the last three releases, four then one migration landed between one release and the next |
| `unreleased` notes already waiting | **0** at the moment the cut merged — and **do not read anything into that.** `0.36.0`'s edition said the same and there were **seven** waiting hours later, one of which fixed a defect `0.36.0` had just shipped |
| Open PRs | **run `gh pr list`.** #704–#718 are merged; **#697 is CLOSED, never merged** (superseded by #699), which is why that numbering has a gap. `0.36.1`'s own gap was #717, a planner handover that merged and is **in** the release |
| **The Pi's swap** | **6 GB, and now IN THE REPO** — `scripts/pi/setup.sh` creates `/swapfile2`, `docs/pi-hosting.md` explains the size (#708). Check it with `cat /proc/swaps`; `swapon` is not on the non-interactive `ssh` PATH |
| **The build's peak memory** | **4,320 MB measured on a cold build** against 4,049 MB of RAM — see the Pi section. A floor, not a ceiling |
| `main` moves under you — including mid-cut | **Yes, every time.** On `0.36.0` it moved three `backlog` commits between the gates running and the cut PR opening, which is why the gates were re-run against the merged tree. **Do not expect `main` to be anywhere near the release SHA when you begin** — `0.36.1`'s range was 72 commits |

**All four builds came from the release SHA**, for the fourteenth release running,
with both Pis pinned `--ref e581c631` to the SHA Lutan's deploy reported.

**Server Actions key checked on both pairs again** (now nine times): production
`cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both. Both unchanged since
`0.31.0`, which is expected — they are environment configuration, not build
output, so **matching this file's values is not evidence you checked.** Compare
Worker against Pi. The Pi's second line, `the build in .next carries that key`, is
what ties the fingerprint to the artefact rather than to the config.

### `0.36.1` was MINOR, so the mail check inverted — and this is the worked example

**On a major release, confirm the mail ARRIVED.** `0.35.0` and `0.36.0` both did:
`deploy: release mail for <version> [UAT]: sent 1, skipped 1` — sent to
`lutan.bennett2@gmail.com`, skipped `lannacareforanimals@gmail.com` with
`E_RECIPIENT_NOT_ALLOWED`, which is expected and known — and the message was then
found in the inbox rather than inferred from `sent N`. That costs one call and turns
an inference into a fact.

**On a minor release, confirm its ABSENCE, in both directions.** `0.36.1` is the
worked example:

1. **Before the deploy**, assert `majorReleasesSince("<previous>")` returns **`[]`**. This is the *inverse* of the usual assertion and it is the whole difference between the release and an email to every admin, so assert it mechanically rather than reading the `major:` flag.
2. **After each deploy**, grep the log for `release mail` and expect **no line at all**. Both of `0.36.1`'s deploys instead printed `deploy: no major release new to production (was 0.36.0), so no email.`

**Why minor was chosen, since it is a precedent:** three genuinely new abilities
shipped, so the standing test pointed at major — but it was the **third release of
one day** and the headline was a fix for buttons broken that morning. A third email
in a day to say "we fixed what we shipped" reads worse than a quiet release.
**Lutan's call; the reasoning is in `docs/releases/2026-10-18.md`.**

**And note the ordering risk this release exposed:** the mail goes out at Lutan's
Worker deploy, which under the build order is *before* the Pi builds. If the Pi
build then fails, the announcement is live and the feature is not. That is an
argument for checking `/api/version` promptly, not for changing the order.

---

## Lutan's time: the budget says two, the runbook now needs THREE — say so

A release has always cost him **two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**But since 2026-10-18 the runbook adds a third**, and this is a genuine conflict
rather than an overrun to apologise for:

3. **Purging the Cloudflare cache after every Pi deploy** — `docs/release-procedure.md`, added by #708 in response to `0.36.0`'s cache-poisoning defect

**So the honest position is that a release costs three until the purge is
automated.** He ruled for automating it on 2026-10-18 (a scoped Cloudflare token on
the Pi), raised as its own PR. **Until that lands, plan for three and do not record
the third as a defect** — it is the runbook working as written. When it lands,
restore the budget to two here.

**Scores:** `0.34.0` and `0.35.0` cost two; `0.33.0` three; `0.36.0` three (the Pi
blocker, unavoidable — enlarging swap needs a `sudo` outside the four commands the
Pi grants); `0.36.1` three (the purge, by design); `0.28.0` five.

**The opening message is the whole technique, and it now has a proven shape.**
One message, four things, answered in one round of clicks:

1. **The case for major or minor**, stated plainly, with a recommendation
2. **The silent-failure answer** — what could break quietly, read in code
3. **The whole outstanding-verification list, AS AN EXPLICIT QUESTION** — ship-with-gaps or hold. Not information with "say the word if you'd rather hold", which cost `0.34.0` a separate message
4. **Any quietly-breaking change, named separately from the count** — its own question, with the offer to hold and check

Add housekeeping the cut needs (an open green PR to fold in or leave) to the same
round. **Do not split these across messages.**

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it, the same as any other defect.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time it exists the release is deployed and verified. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all eight CI checks and the test plans are exactly as they were. A red check is still never merged past.

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

**All three were exercised on `0.35.0` and all three worked.** `gh pr merge 692
--merge` merged the cut with no prompt; `node scripts/apply-migrations.mjs --env
production` ran in its plain form and applied **three** files; and both Pi deploys
— including **four** SSH invocations, two of them retries — went over SSH without
a prompt. **So `0.28.0`'s Defect 3 has not recurred for eight releases.** It
remains unpredictable rather than fixed. Send the migration command plain, exactly
`node scripts/apply-migrations.mjs --env production` — no timestamps, no redirect,
nothing wrapped round it. **If it is refused anyway**, do not retry blind: hand it
to Lutan, say the dry-run was clean, and **ask him for the output**, or the record
cannot state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.35.0` he said
"it's released" and the log was there: `tr -d '\000' < deploy-0.35.0.log` (`tee`
writes UTF-16), then grep for the **project ref** (the arrow does not survive that
conversion), `Next.js version`, `strip-baked-env`, the Server Actions key, and the
release-mail line. All were right.

---

## Copy the deploy command out of the runbook, do not compose one

**Unchanged, because it has now worked twice running.** `docs/release-procedure.md`,
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

- It applies only to **his** terminal. Commands you run yourself through the Bash tool are fine as `npm`, so it works everywhere you test it.
- The production Worker deploy is the **only** command of a release he runs, so there is exactly one line per release to get right — and no second chance, because it is the irreversible step.

**And hand it over only at the moment he should run it.** Describe upcoming steps
in words, never in a code block; he once ran the production deploy three steps
early. That rule has now held thirteen releases.

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

`0.35.0` followed it and it worked. Three things to know:

- **It conflicts with "Do not idle" in `docs/release-procedure.md`**, which says to start the Pi production build the moment the cut merges. That advice is good in general and loses here; the decision file says why. The runbook has not been edited, so you will read both — the decision is newer and more specific. **There is plenty to do in the gap**: `0.35.0` spent it on `npm ci`, the record worktree, the production dry-run, reading the smoke-test pass and checking what was already on test.
- **Five releases now and none has tested it.** `main` held still every time. The real fix, if anyone wants to spend the time, is giving `deploy.mjs` a `--ref`, which would dissolve the question entirely.
- **The Pi-last order plus the Pi OOM fault is the combination to watch.** The mail goes out at step 4 and the thing it announces goes live at step 5. With step 5 now expected to fail on its first attempt, the gap between announcement and reality is real. Check `/api/version` on both hosts as soon as each Pi build claims to be done.

**The older lesson still stands and is still the most valuable one:** an option you
put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it before
offering an order that depends on it.

---

## In flight

**Nothing was left open by the release itself.** `main` moved during the cut
(three `backlog` commits) and will move again; that is the next release beginning,
not a problem with this one.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both times.
What is durable is the shape:

- A release's own two worktrees — the cut and the record — become free leftovers once their PRs merge, and clearing them is the release manager's last step.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- **A stream can be in flight with no PR, which a PR list will not show you.** `git branch -a` is the check that sees it; `gh pr list` is not.
- **A branch that is not an ancestor of `main` has not necessarily been left behind.** Check whether the work shipped (`git ls-tree -r origin/main` for its files, `gh pr view <n> --json mergeCommit`, `merge-base --is-ancestor`) before concluding anything is missing.
- **A PR can merge while you are mid-release.** Decide deliberately whether to fold it in or leave it, and if you fold it in, re-run `release-prs.mjs` and re-check the plan count.

**If you repeat a number from this handover, run the list first and quote what it
says** — or write "run the list" and no number at all. A count copied from a
previous edition is not a fact, it is a quotation.

---

## A test plan must not assert a state it has not just re-read

`0.33.0`'s cut test plan said PR #662 was "open on purpose" and "the only gap in
the range". It had merged twenty minutes earlier. The *intention* to leave it alone
was formed early and then written down later as if it were a fact.

**Re-read the thing immediately before you write the line.** `gh pr view <n> --json
state` costs a second.

`0.35.0` hit the mild version of this and caught it: the cut plan asserted the
longest release note was 592 characters, estimated rather than measured. It is 600.
Corrected before the commit. **A number you did not measure is a guess wearing a
measurement's clothes** — and the plan's whole argument is that the notes were
asserted mechanically rather than read over.

**If a number you have already told him changes, say so.** `0.34.0` corrected an
outstanding-item count from six to seven out loud rather than quietly.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-18.md` → *Defect 1* first** (the self-updating deploy script), then its *The Pi* section for the peak-memory number, then `docs/releases/2026-10-17-0-36-0.md` → *Defect 2* (the cache poisoning, and how it hid). `0.36.1`'s dry-run was a single file; `0.36.0` and `0.32.1` are the worked examples of the per-file trap *firing*.
1b. **After both Pi builds, run the asset check — by hand if the script did not.** `node scripts/pi/check-assets.mjs --url https://lannacare.org/` from the clone. Then **ask Lutan to purge the Cloudflare cache and check again**, even if it was green: the check only sees the edge it reaches. See *THE SECOND THING*.
2. **Check the Pi's swap with `cat /proc/swaps` before you start** — expect ~6 GB (`swapon` is not on the non-interactive `ssh` PATH). `deploy-pi.sh` now refuses below 5.5 GiB, **but do not rely on that gate for the release that ships a change to it** — see *THE NEWEST THING*. **Do not budget "one retry" as a remedy; that was withdrawn.** After every Pi build read `/api/version` on both hosts rather than trusting the service state or the clone's SHA.
3. **Copy the production deploy command out of `docs/release-procedure.md` verbatim.** It has worked three releases running after costing `0.33.0` a third touch. Do not compose one.
4. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Never call the record PR "ready to merge when you say".
5. **`npm ci` in the main checkout before any deploy**, read `node_modules/next/package.json` against `package.json` straight afterwards, and read the `Next.js version :` line on the first Worker build as well. Ten releases running this has been the cheap step that would have caught the expensive fault.
6. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values, which have not changed in nine releases and so prove nothing.
7. **Open with ONE message to Lutan** carrying the version case, the silent-failure answer, the pending-items list **as a question**, and any quietly-breaking change **named separately**. That shape has now produced a one-round answer **five releases running** — it is the highest-leverage habit in this file. The outstanding-verification list has closed **three** items in eleven releases (`0212`'s production gate; the Pi first-deploy and peak-memory items on `0.36.1`). **The restore test into a real Supabase project has gone twelve releases unanswered** and is still the cheapest item on it.
8. **Range starts at `e581c631`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. **Expect neither 0 nor 1**: it has gone 1,1,1,0,1,0,1. **The previous release's record PR will be in your range and will not be flagged** (held four releases running). **And check any gap in the PR numbers with `gh pr view <n>` rather than reasoning about it** — `0.36.0`'s gap at #697 was a PR closed without merging; `0.36.1`'s at #717 was a PR that had merged and belonged in the release. One call each.
8b. **Do not trust the PR number your cut's test plan guessed.** Four correct guesses then **two wrong in a row** (#704→#705, #717→#718). Keep writing the plan before opening the PR — the first CI run is still green by construction, six releases running — but re-read the number afterwards and correct the header.
9. **Read both databases rather than trusting the table above.** `--status --env production` first: expect the last release's files applied, plus one pending per migration merged since. On dev, a red `--drift test` is usually legitimate: read the names it prints and ask whether an unmerged schema branch explains each (`git branch -a`, not just `gh pr list`). The dev database is `--env test` and the drift check is `--drift test`. **`--env dev` is not a thing.**
10. **Decide major or minor with Lutan before cutting.** The question is *can anyone do something today they could not do yesterday* — **but it is not the only consideration, and `0.36.1` is the precedent.** Three new abilities shipped there, so the test said major; he called it **minor** because it was the third release of one day and the headline was a fix for what the morning's release broke. **A third email in a day to say "we fixed what we shipped" reads worse than a quiet release.** So: put the test's answer to him, then let him weigh the audience's experience against it, and **record the reasoning either way** rather than letting a departure from the test read as an oversight. And remember the mail check inverts with the answer — see the mail section.
11. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** `0.35.0`'s worked example: `0214` claimed a public view carrying nothing but the agreed words, and the view was checked to select five columns with `note`, `sender_contact_id` and `created_by` absent, the opt-in `not null default false` and never backfilled. **And check the consumer, not only the view** — the photo proxy was the subtle one, and it is right because it asks the view *as the caller* and only then reads its disk cache. **The public-view rule** is the shape to look for in anything touching the public site: a column is public only when the public view names it, and an omission is silent.
11b. **When two migrations in one release touch the SAME view, check the later one did not revert the earlier.** `0.36.0`'s worked example: `0216` relaxed `public_appeals` to allow a ticked Medical photo, and `0217` then recreated that same view to add its approval filter. Had `0217` been written against the pre-`0216` definition it would have silently dropped the medical rule. It did not — its definition carries **both** conditions plus `0216`'s appended column — but **no per-feature test plan could have caught that**, because each plan only sees its own file. Grep the release's migrations for `create or replace view` and look for repeats. (`create or replace view` cannot drop or reorder columns, so the *column* half fails loudly; it is the *`where` clause* that can go quiet.)
12. **A migration whose guard is false on dev has never run anywhere.** `0.35.0`'s `0213` is the worked example: `if v_type = 'integer'` is false on dev, so its view-rebuilding block was dead code there and **production was the first place it ever executed**. A wrong grant or a lost `security_invoker` would have been silent. **Read the guard, ask "is this true on dev?", and if not, verify the block's effect against production before and after** — the "after" read is what makes the record evidence rather than assertion.
13. **Name a quietly-breaking change separately from the count.** `0.35.0`'s was the 121-screen phone sweep with four screens never seen by a person: a form unusable at phone width would fail silently, and Management on a phone is the Director's main surface by day. Put to him as its own question; he accepted the risk. **He holds a release for a change that breaks quietly, so give him the chance to.**
14. **Expect a production-only guard.** There has been none for twelve releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
15. **The production migration apply is yours, with an allow rule.** `0.35.0` applied **three** files in one run and the trap **did not apply**. Say which of the three cases you got. **Where a migration is non-additive, verify its precondition against production and re-verify its effect afterwards** — see item 12.
16. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict with the Workers** — but they now need retries, so budget more than you used to, and do not run the two Pi clones at once. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**.
17. **Check what is already on test before overwriting it.** `0.35.0` found both hosts on a clean `0.34.0` with nobody mid-test. Ask before destroying it.
18. **Clear your own two worktrees — the cut and the record — once their PRs merge**, as the last step. Beyond that, run `node scripts/worktree.mjs list` and read it; do not carry a leftover *count* over from this file.
19. **Writing the cut's test plan *before* opening the PR makes the first CI run green**, where the template expects it to fail on `test-plan` by construction. `0.35.0` did this and the first run was green, the **fourth release running**. The cost is that the plan's header has to guess the PR number — `0.32.0` guessed wrong; `0.32.1`, `0.33.0`, `0.34.0` and `0.35.0` guessed right. **Then ticking the CI line is itself a commit, so a second run follows — wait for it and confirm its `headSha` matches your HEAD** with `gh run list --json databaseId,headSha,conclusion,status`, because the PR bar's cached reading can show the first run's result. **Also re-run the gates if `main` moves into your branch after they ran**, even for a documentation-only change: `0.35.0` did, and the re-run is what the plan cites.
20. **The vet calendar is ANSWERED — stop asking, and do not infer it from the build environment.** Lutan, 2026-10-17: **"The vet calendar is only setup on test right now."** So on **production** it is dormant, by configuration and on purpose; on **test** it is configured. (a) **Two releases of guessing are closed.** `0.34.0` noted that `strip-baked-env` listed `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` among the 13 it removed and wondered whether production was configured after all. **It did not mean that**: the list comes from the build environment, not production's own secrets, so it was never evidence either way. Do not repeat that inference. (b) **No release note is owed yet**, and ticking the release-notes line for the calendar would be exactly the false promise the truth rule exists to stop. (c) **When he sets it up on production, that is the PR that carries the note.** Until then write `n/a: configured on test only, dormant on production (Lutan, 2026-10-17)`. The backlog item is annotated accordingly; its open half is the Worker binding and the decision whether to configure production at all.

---

## The public site is still locked — and **test is locked too**, which this file used to get wrong

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate.

**Corrected on `0.36.0`: this is NOT a production-only blind spot.**
`test.lannacare.org` is gated in exactly the same way — an anonymous request to
`/api/photos/<id>` there answers `307 → /login` **before** any of the feature's own
logic runs. So "deploy it to test and check the public behaviour there" is not an
available move, on any environment, and offering it to Lutan as one is offering
something that cannot be carried out. `0.36.0` offered exactly that, he chose it,
and half of it then proved impossible.

**What you CAN do instead, and it is better evidence anyway:** test the enforcing
layer directly, against real rows, **as the `anon` role**, in a `begin … rollback`
harness (`set local role anon;` inside the transaction, then read the public views
and call `is_public_drive_file`). `0.36.0`'s worked example proved a waiting photo is
absent from the public view, suppressed as a card photo, and refused by the photo
proxy — then flipped all three by approving it. That is the layer that actually
enforces the claim, and a browser could only have agreed with it less precisely.
**Three release pages were also confirmed deployed rather than missing** by checking
they answer `307 → /login` and not `404`.

Three further consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise. **`0.36.0` put its headline feature in that blind spot for the third release running:** volunteer photo approval is about what strangers see. `0.35.0`'s success stories and `0.34.0`'s appeal pages were the same story.
- **A note that asserts a number is hidden more completely than one that asserts a layout.** `0.32.0`'s "about a third smaller" images is the standing example; nothing on the live site measured it, and nothing has since.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served `Cache-Control: private, no-cache, no-store`, so there is no cached public page to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a browser that will show one.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks (green again on `0.35.0`); `| tee` writes UTF-16 so strip the nulls
before grepping, and the arrow does not survive that conversion, so grep for the
project ref; a backgrounded `deploy.mjs` writing nothing for minutes is buffering,
not hanging; `-- consumer:` warnings naming files that differ from the live release
are the safe direction; and `deploy: release mail … [UAT]` on production is the
production setting and the mail is real. Also:

- **`Killed` after `Running TypeScript ...` on the Pi IS alarming and is not in this list** — see the top of this file. It is the one thing this release found that you must act on rather than wave through.
- **A gate script's 127 with an `async.c` assertion is noise** — fixed in `3557e06e`, so it should no longer appear; if you meet it in an older checkout, read the printed verdict.
- **A FAILED dry-run can be the correct result** — when a file rebuilds a view naming columns an earlier *pending* file adds, because the dry-run rolls each file back before the next. The runner says so itself and still exits 0. `0.35.0` had no such case; `0.32.1` is the worked example. A red that the runner does *not* explain is a real stop.
- **`--drift test` exiting 1 with dev *ahead* is usually normal.** It means a schema branch has been applied to dev before merging, which is the schema-first rule working.
- **`--drift production` exiting 1 mid-release is normal and the runner says so** — it prints `Expected if a release staged these on purpose` and names the release record as the place to check.
- **A `gates.mjs` run that is much faster than the last one is a warm Turbopack cache.** `0.35.0` ran the gates twice on the same tree: **112 s then 34 s**, both `typecheck=0 lint=0 test=0 build=0`. Read the exit codes, not the timings. Note `gates.mjs` prints `test=0` as well as the three the template's expected line names.
- **A second CI run on the cut PR is correct and expected.** See item 19.
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes about four minutes; reading the run three times in the first ninety seconds tells you nothing. Do productive work in the gap instead.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. Under the build order this window is **longer**, and with the Pi OOM fault it can be longer still — **which is exactly why you check it rather than assume it will close.**
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say the release. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
- **A red `lint` on a fresh release-cut branch may not be yours.** Check whether the failure exists on `main` before debugging your own branch.
- **A red `public-views` is almost certainly not yours.** It runs against the shared dev database. Since `claude/ci-script-fixes-fold` (2026-10-16), `check-public-views.mjs` prints `WARN` and skips a view that another unmerged `origin/*` branch's migration creates, so that collision no longer turns your branch red. A `FAIL ... a new public view?` that remains means **no other branch claims the view**: it is on `main`, in your own migrations, or unaccounted for, and that is a real finding, not noise.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" to rule out a Dev badge matches the viewport meta tag twice. `0.35.0` checked this and found exactly those two matches and nothing else.
