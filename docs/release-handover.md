# Release handover — written 2026-11-20 after `0.47.8` (and `0.47.7`)

A **delta**. The durable rules are in `docs/release-procedure.md` and these releases' own records are
`docs/releases/2026-11-20-0-47-8.md` and `docs/releases/2026-11-20-0-47-7.md`. **All three outrank this
file.** Its predecessor was written after `0.47.6` the same morning; **two more releases shipped the
same day.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.8`** — **a release that mailed nobody.**
`cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` serve `0.47.8` too, and **all three
Workers are `0.47.8`**, verified on **both** endpoints on all four hosts after a fault that is this
edition's main lesson.

**Production and UAT both hold every migration on `main`: 428 applied, 0 pending, 0 drift.** Dev has one
extra `schema_migrations` row for a renumbered file (`0422_keep_an_admin_per_shelter.sql`) — known,
harmless, not drift.

**Test and UAT run commits AHEAD of production's** (test `d859c7bd9`, UAT `fab14dca5`, production
`3d93e90ec`), asserted with `git merge-base --is-ancestor`. **Ahead is expected; behind is the thing the
standing rule prevents.**

**Re-measure before trusting any of this**, and read the next section before you believe a version
number.

## THE LESSON OF THESE TWO RELEASES: THREE PI BUILDS CAN MAKE EVERY `/api/version` AGREE WHILE TWO WORKERS ARE STALE

**`0.47.6`'s handover already said "read BOTH endpoints on all four hosts", and the fault still
happened** — so the warning as written was not enough. Here is the sharper version.

**`/api/version` is answered by the app on the Pi. `/api/releases/current` is answered by the Worker.**
A Pi build does **not** deploy the Worker, and the Worker holds the **static assets**. After the
production deploy and three Pi builds, **all four hosts reported `0.47.8` on `/api/version`** and the
release looked finished. It was not: **test's Worker was still `0.47.6` and UAT's `0.47.7`.**

**The tell that settled it in one command**, and the technique to copy:

```bash
curl -s https://test.lannacare.org/api/releases/current   # the Worker's version
curl -s https://test.lannacare.org/api/version            # the Pi app's version
curl -s -o /dev/null -w '%{http_code}' https://test.lannacare.org/icon-192.png   # 307 = stale Worker
```

**A new static asset is the cheapest probe of a Worker's age**: `/icon-192.png` answered **200 on
production and 307 on test and UAT**, because a stale Worker does not know the file exists. **It was
caught while writing the record, by a disagreement between two numbers — not by any check.**

**NOTHING ASSERTS THAT AN ENVIRONMENT'S WORKER AND ITS PI APP ARE ON THE SAME RELEASE.** That is the
guard worth building, and it is filed in the record's defect table.

## What `0.47.7` and `0.47.8` were

**`0.47.7` (#1772) never reached production.** It was cut **only** to unblock UAT: `#uatsb` left UAT
refusing every sign-in because `wrangler.jsonc` set `SUPABASE_URL` for `test` and `production` and not
for `uat`, and **`deploy.mjs` ships only a written-down release**, so #1766's note had to move into an
entry before any UAT deploy could run. UAT's Worker took it; production never did.

**`0.47.8` (#1775) is what production runs: 17 PRs, one migration (`0427`), two notes.** The sign-in
`?next=` fix (#1773) and the app's own icon (#1774). **Yesterday's nine streams are in it** — they
merged after `0.47.6` had already deployed.

## A RELEASE CUT AND A MERGING BATCH RACE, AND THE CUT LOSES

**#1774 merged a release note between `0.47.7`'s cut and its production deploy, so that deploy refused**
and a second cut was needed within the hour. **No rule was broken by either side:** the stream was right
to write a note, and the guard was right to refuse rather than ship user-visible code with nothing
written down. **Cut after a batch has drained, not during it.** Both cuts were otherwise clean, 17
assertions each.

## THE ONE PROOF THAT COUNTED, AND IT WAS A PRESS

`#uatsb` is the mirror of `#hostx`, and together they are worth one sentence you should not have to
re-derive: **`#hostx` was the rows being missing; `#uatsb` was the Worker not reading them.**

**A `resolve_shelter_site()` read and `check-deployed-hosts.mjs` BOTH PASSED while every UAT sign-in was
still refused.** The data was right and the Worker was broken, and **only a pressed sign-in can tell
those apart.** Lutan pressed it — *"I have successfully logged in"* — which closed `#hostx` outright.

**It also answered a setting that cannot be read back.** `SUPABASE_SERVICE_ROLE_KEY` for `uat` was
unprovable; a **plain** deploy fixed sign-in, so it is set, and **no `--secrets` deploy is needed for
it** — which matters because `--secrets` would push this PC's **revoked** Drive token.

## Traps that cost something, or nearly did

- **`deploy.mjs` refuses UAT and production while `unreleased` holds anything.** It is why a one-command
  UAT fix became a release cut. **Read it as the guard working, and check `unreleased` before promising
  anyone a deploy.**
- **UAT also refuses while `main` and `origin/main` differ** (*"3 behind / 0 ahead"*). On a day with
  streams merging, **pull immediately before the deploy** — and know that pulling may bring in a new
  note, which puts you back in the previous trap.
- **A grep that matches part of a document is not a reading of it.** A search for `Result: fail` across
  17 test plans appeared to find a failing one; it had matched **the template's own prose quoted inside
  the plan**. Its verdict was `pass`. **Read the sign-off section.**
- **`check-deferred-notes.mjs` over-lists, fourth release running:** 22 PRs flagged for the `0.47.7`
  cut, **nine of them parse artefacts** where a plan's `n/a` reason quotes the release-note truth rule
  itself. The gate is right to refuse until a person reviews. **Review it once and quote the review into
  the next cut** — the range resets after each cut, so `0.47.8`'s cut needed no sweep at all.
- **`check-release-order.mjs` is still silent about migrations that must come BEFORE the Worker.**
  Nothing to prove this time (`0427` is additive with no reader), but the silence still reads as *"order
  does not matter"*.
- **Meshnet dropped mid-day and came back on its own.** Two SSH attempts timed out **while the Pi was
  serving happily** — the route, not the machine. A third attempt an hour later worked. **Do not
  diagnose the Pi from a failed ssh; check what it is serving first.**
- **`git fetch` failures hit `worktree.mjs done` twice and cleared on a plain retry.** One of them left a
  **merged branch alive on `origin`** after its folder and local branch were gone: check
  `git ls-remote origin refs/heads/claude/<slug>` after a failed `done`, and confirm the commit is an
  ancestor of `origin/main` before deleting it.

## What is still open

- **12 items on `0.47.8`'s record are `pending: Lutan`**, every one a press only a signed-in person on a
  deployed host can make. **The one worth asking for first is this release's headline:** start from a
  link that bounces you to the sign-in page, sign in with Google, and confirm you land on the page you
  asked for rather than the shelter home.
- **`#drvtk` — this PC's `.env.deploy.uat` still holds a revoked Drive refresh token.** The rule is
  narrow and exact: **fix it before any `--secrets` deploy or any rewrite of the Pi's env.** A plain
  Worker deploy is unaffected and three were run today.
- **`#uatsb`'s registry half shipped as #1777** (`SUPABASE_URL` declared in `runtime-config.mjs`, the
  host check derived from it) — **after** this release's cut, so it is **not** in `0.47.8`. It will be in
  the next one.
- **The Thai sign-off, tenth release running** (`#y1dqu`). **Still the largest standing gap.**
- **`dev-signin.mjs <role>` still breaks (`PGRST116`) once two shelters each hold a role keyed `admin`**,
  which is the state dev is in, so a signed-in `/releases` read on dev is not available.
- **The public site is still locked** (`#pl7aq`), so the whole signed-out half of the smoke test is
  vacuous by design. Record it that way rather than as unchecked.

## Now routine — stop treating these as open

- **Merge on green with no approval round-trip**, every PR, releases included. **`test-plan` is
  advisory, permanently.**
- **`audit` runs for real on a cut** (it changes `package.json`); `skipped` elsewhere is not a pass. One
  registered, unreachable `glob` advisory; `audit:register` exits 0.
- **The Pi's `sudo -n -l` now covers all three services**, `lanna-care-uat` included. Checking it before
  a build still costs thirty seconds and is still worth it.
- **`cut-release.mjs --verify` needed no base-building for either cut**, because neither published a note
  of its own. Build a base only when the cut itself adds one.
- **A cut PR cannot tick the release-notes line**, and `n/a:` needs its reason immediately.

## The two touches that are his, and stay his

**Major versus minor** — asked as *"should this release email you?"*, never as the two words — and the
**production Worker deploy**.

**`0.47.8` cost him two touches: one answer and one command.** That is target. **`0.47.7` cost one
answer and no command**, and it was superseded, so the pair together cost him **three** against a target
of two — **and the extra one was caused by the cut/batch race above, not by anything he did.**
