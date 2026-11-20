# Release handover — written 2026-11-20 after `0.47.6`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-20-0-47-6.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.6`** — a **minor release that mailed nobody**.
`cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` serve `0.47.6` too. **All four hosts
answer on both endpoints and all three Workers are `0.47.6`.**

**Production and UAT both hold every migration on `main`: 427 applied, 0 pending, 0 drift.**

**Re-measure before trusting any of this, and read BOTH endpoints on all four hosts.**
`/api/releases/current` reports the **Worker's** version whatever the Pi serves. `0.47.3` shipped in
that half-state.

## What `0.47.6` was

11 PRs (#1745–#1755), five migrations `0422`–`0426`, **two notes, both `admin: true`**: a product
administrator can create a shelter's first Admin login (closing `#flogn`), and a Website save on a
shelter with no settings row now says so. **And the fault it existed to fix:** `#plhbd`, the
`cooperjaidee.org` buttons.

## THE RELEASE WENT TO TARGET FOR THE FIRST TIME: ONE TOUCH

**Lutan did one thing — the deploy.** Target is two. Three things made that happen, and they are worth
keeping:

- **Meshnet did not drop.** It has on the last two releases, and restoring it was his second touch each
  time. Nothing was done to achieve this; it simply held. **Do not read it as fixed.**
- **The Pi's `sudo -n -l` and `lanna-pi-mesh` were checked BEFORE anything was built**, so neither a
  missing rule nor a dead route turned into a mid-release question. Thirty seconds, and it is now the
  first thing to do.
- **The scoped Cloudflare API token held again.** His log said *"API token from
  `.env.deploy.production`"*, not wrangler's OAuth login, so the `0.47.1` mid-upload expiry cannot
  recur. His deploy did not fail once.

## THE ONE TECHNIQUE TO TAKE FROM THIS RELEASE: PROVE A BAKED VALUE BY READING THE BUILD

`#plhbd` was a build-time value missing from a build — and **the page rendered perfectly while it was
broken**, so nothing observable from outside said whether the fix had landed. Rather than wait for a
person to press a button, the list was read out of the running build:

```bash
ssh lanna-pi-mesh 'cd ~/Animal_Shelter_App && node -e "console.log(JSON.stringify(require(\"./.next/required-server-files.json\").config.experimental.serverActions.allowedOrigins))"'
["lannacareforanimals.org","www.lannacareforanimals.org","cooperjaidee.org","www.cooperjaidee.org"]
```

**`.next/required-server-files.json` holds the config the build was made with**, which is what the
origin check actually reads. The general form: **when a value has to travel to be true, read it at the
far end.** This works for any baked setting — `allowedOrigins`, anything in `next.config.ts`.

**What it does not replace:** the saving proof itself. A baked list is strong evidence; only a real
save proves the whole path, and that is still outstanding (below).

## Traps that cost something, or nearly did

- **`check-release-order.mjs` is SILENT about migrations that must come BEFORE the Worker.** `0426`
  was one: `worker/shelter.mjs` calls `resolve_shelter_site`, and if it is absent the RPC 404s, the
  lookup returns no shelter id, and **since `0392` no shelter header means no rows** — the public
  website blanks. The guard models only `MUST_FOLLOW_WORKER` and answered *"no guarded migration is
  pending here, nothing to prove"*. **Not wrong, silent — and silence reads as "order does not
  matter".** The ordinary order (§5 before §6) saves you; a hotfix Worker deploy between releases
  would not be. Filed as `#rlord`.
- **The harness notification reports the WRAPPER's exit code**, still. Write
  `cmd > log 2>&1; echo "EXIT=$?"` and read **that** line. The three Pi builds were read that way.
- **`Tee-Object` writes his deploy log as UTF-16LE**, still. A plain `grep` of a 26,756-byte
  `.local/deploy-0.47.6.log` matches **nothing**. `tr -d '\000' < <file> | grep …`. Filed as `#utf16`.
  **"The log is empty" is the wrong conclusion and has been drawn before.**
- **A `fetch failed` from `apply-migrations.mjs` is the network, not the SQL.** The first production
  apply died on `0422`. The runner says *"nothing from it was kept"* — **confirm that with `--status`
  rather than believing it**, then retry. All five applied.
- **`apply-migrations.mjs` cried wolf on `0425`'s consumer header**, reporting
  `src/app/platform/actions.ts (createShelterAdminLogin)` as *"not on origin/main at all"* because the
  parenthetical defeats its path lookup. `git grep` settled it in one line. **A warning that is wrong
  on a correct header will be ignored on the day it is right.**
- **`--verify` needed NO base-building this time.** Two releases running had to work out that
  `origin/main` stops being the pre-cut state when the cut *adds* a note. **This cut added none**, so
  plain `origin/main` was right and all 17 passed. Check which case you are in before building a base.
- **`n/a: ` still needs its reason immediately**, and a **cut plan cannot tick the release-notes line**,
  by construction.

## The release-notes route WORKED this time, and that is the news

`0.47.5`'s handover opened with *"`unreleased` MAY BE EMPTY AND WRONG"* — eleven streams, 23 PRs, no
notes, and the cut had to write its own. **This release, two of eleven streams wrote notes in their own
PRs and the cut had nothing to invent.** Keep measuring anyway:

```bash
git log <previous deployed SHA>..HEAD --name-only -- src/app src/components src/lib/manual src/lib/i18n worker
node scripts/check-deferred-notes.mjs <prev> HEAD
```

**Ask who the change is visible to, not whether it is visible.** `admin: true` exists for the product
administrator and for Admin, who are the only people who read release notes.

**One note was considered and declined, and the reasoning is in the record:** `#plhbd` itself. Nobody
at a shelter can reach `cooperjaidee.org`, `0.47.5`'s published note already says the new address needs
set-up before it will open, and a third platform-console note would reach every shelter Admin about an
address none of them can open. **It could go the other way; do not treat it as settled precedent.**

**`check-deferred-notes.mjs` over-lists, third release running:** 75 plans read for a range of 11 PRs,
and 7 of 20 candidates were the test-plan template's own text printed as a "reason". **Budget one
lookup per candidate and do not try to narrow it** — under-listing is the fault it exists to prevent.

## What is still open

- **THE SAVING PROOF ON `cooperjaidee.org`, and it is the first thing to ask him about.** Sign in, do
  the authenticator step, **save** a web address or a shelter's name. It is the only check that closes
  `#plhbd`, and the baked-list read above is evidence, not proof.
- **`#hostx` — a whole environment can be locked out by ONE missing `shelter_hosts` row, and to every
  user it looks like their own account being deleted.** That is what happened to `test.lannacare.org`
  this morning. **The item asks that UAT and production be checked the same way and that was NOT
  done**, because no script in this repository reads `shelter_hosts` and an ad-hoc production read is
  refused. What exists instead is behavioural evidence for production only: `/` serves the shelter's
  own name out of the database, and people sign in all day. **Nothing is established about UAT's host.**
  The release did not make it worse — `0426` keeps `resolve_shelter_host` and both need the same row.
- **`shelterError` still maps every `42501` to "your second step has expired"**, which is why six
  broken writes hid for a day. A policy refusal is not an expired step-up.
- **`dev-signin.mjs <role>` breaks (`PGRST116`) once two shelters each hold a role keyed `admin`** —
  the state dev is in now, so plan around it. `--cards` still works.
- **The Thai sign-off, NINTH release running** (`#y1dqu`). **Still the largest standing gap.** Likewise
  **a signed-in look at production**, which Claude cannot do: no account there.
- Carried: the per-shelter policy click-throughs, `/admin/security` with a real code, the Cloudflare
  rate-limit rule (`#8t3rk`), the PromptPay id, the e-Donation screens.
- Seven of the eleven PRs' plans carry a `pending:` line. All eight outstanding presses are tabulated
  in the record under *the gaps*; they are shipped on his instruction, not absorbed.

## Now routine — stop treating these as open

- **`PUBLIC_SITE=locked` on production**, so every signed-out page `307`s to `/login` and the template's
  own `n/a: vacuous (site locked)` is the right answer. **`0426` did not change this** —
  `publicSiteStateFor()` takes the more closed of the floor and the shelter's value, and a `locked`
  floor beats Lanna's `'open'` row. Check it rather than reporting a regression.
- **`sync-home-icons.mjs`**: 536 images, 536 unchanged. Run it; a missed one costs nothing.
- **`#flogn` is CLOSED** (`0425`, a narrow product-administrator definer function — **not** a widening
  of `security.createUser`). **`#pdmin` and `#fntlc` stay closed.** Do not re-raise any of them.
- **Merge on green with no approval round-trip**, every PR. **`test-plan` is advisory, permanently.**
  Neither is a decision he owes.
- **`audit` runs for real on a cut** (it changes `package.json`) and `skipped` elsewhere is not a pass.
  `audit:register` exiting 0 means *registered and unreachable*, which is what to write — not "clean".
- **IPv6 is still preferred on this machine and it still has no IPv6 address.** Use `curl -4` for
  everything. Nothing failed because of it.

## The two touches that are his, and stay his

**Major versus minor**, and the **production Worker deploy**. `0.47.6` cost him **one** — he had already
answered the mail question before the release began. **Do not read one as the new target**; two is the
target and the second was simply not needed.
