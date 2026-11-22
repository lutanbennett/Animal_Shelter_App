# Release handover — written 2026-11-22 after `0.47.10`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-22-0-47-10.md`. **Both outrank this file.** Its predecessor was written after
`0.47.9` the previous day.

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.10`** — **a release that mailed nobody.**
`cooperjaidee.org` and `uat.lannacare.org` are fully on it too, and **all four Pi apps report one SHA,
`7a1aae4ea`**. Both endpoints were read on all four hosts and `/icon-192.png` answers 200 on each.

**ONE EXCEPTION, AND IT IS THE RELEASE'S HEADLINE: `test.lannacare.org`'s WORKER IS STILL `0.47.9`.**
Its Pi app is `0.47.10`, so test's **pages** are the release and only the fallback is behind. The cause is
named below; it is not an oversight, and nothing will fix it without one new value.

**Production and UAT both hold every migration on `main`: 435 applied, 0 pending, `No drift` both ways.**
Dev still has its one extra `schema_migrations` row for the renumbered `0422_keep_an_admin_per_shelter.sql`
— known since `0.47.6`, 0 missing, **not drift**.

**`0.47.10` cost Lutan two touches: one answer and one command. That is target** — and a **third is owed**,
below, which is the one thing to settle before the next release.

**Re-measure before trusting any of this.**

## THE LESSON OF THIS RELEASE: TEST IS THE ONLY ENVIRONMENT WITH NO DEPLOY CREDENTIAL OF ITS OWN

`deploy.mjs --env test` reads `.env.local`, which has **no `CLOUDFLARE_API_TOKEN`**, so it falls back to
wrangler's own browser login. Production reads `.env.deploy.production` and UAT reads `.env.deploy.uat`,
and **each of those holds its own token** (counted, never printed). So the day wrangler's stored login
expires, **test and only test cannot deploy** — which is today.

**Two errors, and the second one is the tell. Read it before reaching for the runbook's remedy:**

1. `wrangler deploy --env test` exited 1 with *"Your auth token has expired and could not be refreshed
   because the Cloudflare auth server could not be reached."*
2. The retry — correctly reusing the same `.open-next`, which was demonstrably test's own build — exited 1
   with *"In a non-interactive environment, it's necessary to set a `CLOUDFLARE_API_TOKEN`."*

**THAT IS NOT THE `0.47.1` FAILURE, AND THE PRESCRIBED REMEDY DOES NOT APPLY.** `docs/release-procedure.md`
says an `Authentication error [code: 10000]` mid-upload is a token expiring part-way through and *"the
remedy is the same command again — NOT `wrangler login`"*. That is still right for that failure. **Here the
retry is what proved the login is gone**, and no non-interactive shell can redo a browser login. The
runbook's own line *"the durable fix is a scoped `CLOUDFLARE_API_TOKEN`"* is the answer — it has simply
never been done for test.

- **The third touch this release owes him: one Cloudflare API token for the test deploy**, the same three
  permissions as 2026-11-16's production one, pasted into `.env.local` as `CLOUDFLARE_API_TOKEN`. Then
  `node scripts/deploy.mjs --env test` brings test's Worker up in one command. Filed as `#tstok`.
- **Borrowing production's or UAT's token was considered and deliberately not done.** It would have
  worked. It would also have put a production credential to work in another environment with nothing
  recording it, which is the quiet kind of fault.
- **`--skip-build` was the right call for the retry, and it is worth knowing why:** the leftover
  `.open-next` was the build that had just failed to upload, from that same run, pointing at the dev
  project. The runbook's caution is about reusing a bundle belonging to *another* environment.

## WHAT `0.47.9` LEFT OPEN AND THIS RELEASE CLOSED — STOP CARRYING EITHER

- **`#tncy3` is fixed and proven.** `0434_tenancy_catalogue_flags.sql` (#1812) adds the missing
  `definer_all` policy on `product_admin_login_grants` and re-owns `set_shelter_logo` to `rls_definer`;
  #1812 also put `product_admin_permit_first_login` in the lint's allow-list with its `auth.users` reason.
  **`check-tenancy-catalogue.mjs --strict` now exits 0 on production, UAT and dev** — `0 flagged, 7 allowed
  by name, 0 stale` — the first green since `0.47.2`. The mechanism that handover named (*a check that
  exits 1 on a known-correct object is a check people stop running*) is closed at source.
- **`#wwwcb` is fixed and proven.** #1813 stopped `check-deployed-hosts.mjs` synthesising a `www.` form for
  an address that is not deployed. **All three environments now report `ok` on both halves**, where test and
  UAT each exited 1 last release. There is no override left to decide.
- **The per-environment Server Actions key** was promoted into the runbook last release and needed no
  thought this time. Three pairs, all matching: `cbd55beae8d8` / `ecc41837fc0b` / `cdeca9cbc4de`.

## A READING THAT CONTRADICTS THE LAST RECORD, AND IT IS WORTH NOT SMOOTHING OVER

`sync-home-icons.mjs --env production` drew 67 pages and 536 images, uploaded none because
`PLATFORM_DRIVE_FOLDER_ID` is unset for production, and **exited 1**. `0.47.9`'s record says it exited **0**,
and `git log` shows the script unchanged since 2026-11-20, before that release. **One of the two readings is
wrong.** Today's was run bare, with its exit code read from the command rather than through a pipe, which is
the form the runbook asks for. The cause is unchanged either way: #1781's Drive move is pending the platform
account's credentials and is the planner's, not a release step, and the app still draws every icon in the
browser.

## Traps that cost nothing this time but will

- **An SSH call that starts a detached Pi build can still outlive the tool's 120-second timeout**, even with
  `setsid nohup … &` and a short `sleep`. It happened on the first of the three and returned normally for
  the other two. **Nothing was lost and the build completed** — the check is the log on the Pi, not the SSH
  call's exit. Read it as a quirk of this machine, not a hung Pi.
- **`check-deferred-notes.mjs` over-listed for the SIXTH release running:** 12 candidates across 43 plans
  for a 12-PR release, 5 of them the test-plan template's own guidance printed as the "reason". The review
  table is in #1820's test plan. Budget one lookup per candidate and do not narrow the script.
- **A cut PR runs `audit` for real**, because it changes `package.json`. Do not read it as skipped; this one
  passed with the registered `glob` advisory, fifth release running.
- **UAT answered one empty `/api/version`** during the baseline read, then correctly twice. Written down
  rather than ignored, because a repeat after the deploy would have meant something else. There was none.

## What is still open

- **`#tstok` — the test deploy has no credential.** One value in `.env.local`, then one command. **Until
  then every release leaves test's Worker behind, and the release manager has to say so rather than let it
  be discovered.**
- **13 items on `0.47.10`'s record are `pending: Lutan`**, every one a press only a signed-in person on a
  deployed host can make. **The one worth asking for first is this release's own note:** Admin → Website, a
  logo **over** 1 MB refused with a message in English and Thai, then one under it showing on the public
  header.
- **This release's test gap is one plan:** #1818's shelter Drive and Calendar connect flow is unproven end
  to end and waits on **Lutan's first real Google consent** with the connect client's secret. All twelve
  plans read `Result: pass`; nothing failed.
- **`PLATFORM_DRIVE_FOLDER_ID` is unset for production**, so the icon sync is a no-op until it is set.
- **`#83137` — `.env.deploy.production` is missing seven of the eighteen secrets a `--secrets` deploy would
  push, and seven resolve to this machine's DEV values.** Filed today by another stream. **Do not run
  `--secrets` against production**, and `#drvtk` says the same for UAT, where the Drive token is revoked.
  Plain Worker deploys are unaffected and three were run today.
- **The Thai sign-off, twelfth release running** (`#y1dqu`). **Still the largest standing gap.**
- **`dev-signin.mjs <role>` still breaks (`PGRST116`)** once two shelters each hold a role keyed `admin`,
  which is the state dev is in, so a signed-in `/releases` read on dev is not available.
- **The public site is still locked** (`#pl7aq`), so the signed-out half of the smoke test is vacuous by
  design. Record it that way rather than as unchecked.

## Now routine — stop treating these as open

Everything in this list did what the runbook says it does, first time. **It is here only so the next editor
deletes it rather than re-investigating it.**

- **No cut/batch race.** `main` moved once under the cut, `docs/backlog.md` only, and the code-identity diff
  between the tested and the deployed SHA is **empty**, so nothing was chased.
- **UAT second, before his command** (the 2026-11-16 reversal) — clean, and nothing of ours ran after his.
- **Three Pi builds, one at a time, pinned with `--ref`** — all three logged `restarting under the script
  from 7a1aae4ea`, with 2.5 GiB available and `.next/cache` under its ceiling.
- **`lanna-pi-mesh` worked first time** for all three. Do not put the route to him as a question.
- **His log's UTF-16 decode** worked exactly as the runbook's three steps say, and `strip-baked-env: removed
  20` was read — which `0.47.8` could not do.
- **Both purges and all three after-checks** — one zone each for production and `lannacare.org`, every
  stylesheet *identical to the build*.

## The two touches that are his, and stay his

**Major versus minor** — asked as *"should this release email you?"*, never as the two words — and the
**production Worker deploy**.

**He answered it unprompted again** (*"lets do a minor release, no email, gaps in test noted"*), which
settled both halves in one message and cost no round trip. **The second half of that sentence is an
instruction worth keeping:** the gaps go in the record, named and attributed, rather than absorbed.
