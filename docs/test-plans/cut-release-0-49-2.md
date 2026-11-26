# Test plan — cut release 0.49.2

## Header

| | |
| --- | --- |
| Feature | Cut `0.49.2` — a MINOR release, so **no email to admins** |
| Branch | `claude/cut-release-0-49-2` |
| Tested SHA | filled in at deploy time by the release manager |
| Environments | dev (gates only at this stage); test, UAT and production in the deploy sections |
| Author | Claude (release manager) |
| Date | 2026-11-25 |

## 1. Scope and risk

### What this release is: 12 PRs, six notes, five migrations — and one ordering gate that is not in the code

The range is `ba6603e5b..HEAD` — PRs **#1878 to #1889**, twelve of them, enumerated by
`scripts/release-prs.mjs` (exit 0; one resolved from GitHub, eleven from git, 18 added
migration/test-plan files checked against the list). #1878 is `0.49.1`'s own record; the other
eleven are features. **Every one of the twelve carries a test plan and all twelve were read for
this cut**, not counted.

### THE RISK IN THIS RELEASE IS NOT THE NOTES AND NOT THE MIGRATIONS. IT IS ONE LINE OF CONFIGURATION.

`#1879` changes production's `PUBLIC_SITE` in `wrangler.jsonc` from `"locked"` to `"open"`. The
deployment floor and a shelter's own `public_site` are both inputs and **the more closed one wins**
(`publicSiteStateFor`, `src/lib/public-site.ts`). So from the moment the production Worker deploys,
**the floor stops holding anything closed and each shelter's own setting decides what a signed-out
visitor sees.**

`0426` had run `update shelters set public_site = 'open' where key = 'lanna'`. Lanna's own value was
therefore `open`, kept closed **only by the floor**. The `wrangler.jsonc` comment says it itself:

> Lanna's own value MUST read locked before this deploys, or lannacareforanimals.org goes public.

**The order, from `docs/decisions/2026-11-25-website-lock-truth.md`, is not negotiable:**

1. Lanna's own website set to **locked** (console, Website tab) — **Lutan's**, and he said on
   2026-11-25 that he has done it: *"i have set lanna to locked so we should be able to lift the
   floor now"*.
2. **Read it back on a reloaded screen** — the decision file assigns this to "the deployer", because
   no stream could read a production row. **It is a confirmation in one sentence at deploy time**,
   not a second touch.
3. Only then the production Worker deploy — **Lutan's**, by his instruction of 2026-10-02.
4. Check from outside that a signed-out visitor still gets the construction page — **mine**, after
   his deploy, allowing 60 seconds (`worker/shelter.mjs:18`).

**The before-picture for step 4, taken before anything was cut:** a signed-out GET of
`https://lannacareforanimals.org/` returns **200, 24,462 bytes, title "Lanna Care for Animals",
construction wording present**. That is what must still be true afterwards.

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a release cut: the six notes other PRs wrote are published and `unreleased` is emptied
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, `package-lock.json` (two version fields). Nothing else in this PR
- [x] Cards affected identified — n/a: a cut changes no card, no role and no policy. The five migrations' own access is in section 3, read against cards rather than roles
- [x] Anything explicitly out of scope written down — the floor lift above is **configuration already merged in #1879**, not something this PR changes; this plan carries its ordering gate so the release manager is not surprised by it

### The six notes, and who sees them

```
1. The 2-step verification page is now a plain page                            admin: true
2. Product console: every CooperJaidee feature page can carry a photo          admin: true
3. Product console: the words and photos on every page can be changed          admin: true
4. The CooperJaidee product pages now have an EN / ไทย switch                  admin: true
5. My shelters now lists every shelter you hold a role at                      admin: true
6. Product console: a shelter's website says when the deployment holds it      admin: true
```

**All six are `admin: true`**, so `/releases` shows this release's notes to Admin only and an
ordinary shelter user sees nothing new there. That is correct for this batch — every one of the six
is a Platform-console or Admin-only change — but it is worth saying out loud, because an empty
shelter-user view and a release with no notes look identical from the outside.

### Minor means NO MAIL, and that is what was asked for

Lutan's instruction, verbatim: *"lets do a minor release, no email, makew note of missing test"*. So
`major: false`, the last number bumps, and the proof that no mail will go is an assertion plus its
control — see section 2. **The gap-noting half of that instruction is the "Left for manual
verification" section**, which is the deliverable he asked for, not an afterthought.

## 2. Automated gates

- [x] `node scripts/cut-release.mjs 0.49.2 2026-11-25 minor --verify` — **all 17 assertions passed**
- [x] **mail ABSENCE proved, both directions.** `mail ABSENCE: majorReleasesSince(previous) is empty [[]]` and its control `from further back, an older major release is still found [0.49.0 in ["0.49.0"]]`. The control is what stops the absence being a broken query
- [x] Six notes carried across character-identical, with their tags and order — `nothing invented (note count equal) [6 vs 6]`
- [x] `unreleased` empty after the cut; `package.json`, lock top level and lock root package all read `0.49.2`
- [x] `npm run audit:register` — exit 0, one high advisory (`GHSA-5j98-mcp5-4vw2`, glob CLI command injection), registered and still unreachable. It notes it could not check the built bundle because no build was present at that moment; the gates build follows
- [x] `check-deployed-hosts.mjs` — test, UAT and production all **ok**, every deployed address has an `/auth/callback` entry. UAT and production must be run from the main checkout: a fresh worktree has no `.env.deploy.*` files and the script exits 2 saying so
- [x] `check-dev-aal2-absent.mjs` — the dev-only aal2 step-up is absent from every deployed path; `0411`'s two restrictive policies still stand and no later migration alters them (444 files read)
- [x] `check-release-order.mjs` — **ok, both directions**: must-follow-Worker and must-precede-Worker each have nothing pending
- [x] `check-hard-coded-security.mjs` — **no coded security outside the Admin bypass**
- [x] `check-backlog-sections.mjs`, `-ids`, `-titles`, `-waiting` — all ok after the daily backlog merge (31 open items)
- [x] `check-deferred-notes.mjs` — exit 0, **read in full from a file rather than through `tail`**, and reviewed below
- [x] `node scripts/gates.mjs` — **gates: typecheck=0 lint=0 test=0 build=0**, compiled in 84s, run on the cut commit itself. No `SecurityFatalError` halt, so the build-gate retry was not exercised
- [x] CI green on the PR — **17/17 passed**, `headSha` read and confirmed equal to the pushed head `5aef4f6f4`. `audit` ran for real (a cut changes `package.json`) and passed

### The deferred-note review, and the one real gap in it

`check-deferred-notes.mjs` defaults to the last `Cut x.y.z` commit, which is `0.49.0`'s
(`397eb37e`) — **a wider window than this release**, so its 15-may-owe list includes plans that
`0.49.1` already reviewed. Re-run with `--since ba6603e5b` it reports this release's own window:
**13 plans changed, 3 may owe a note, 5 others for a skim.**

Of the three:

| Plan | Owed? |
| --- | --- |
| `product-content-console` | **No — false positive.** Its release-notes line (line 122) is **ticked**, and notes 2 and 3 are its own. The guard matched the template's own explanatory prose about `admin: true` notes, not an answer |
| `product-site-finish` | **No — same false positive**, same ticked line; note 2 is its own |
| `shelter-membership-schema` | **Its reason is wrong, and no note is written anyway — deliberately.** See below |

**`shelter-membership-schema` (#1889) answered `n/a: nothing a user can see until the console stream
ships`, and that is not accurate.** `0443` rewrites `product_admin_access_add` so that a login
already working at another shelter is now **inserted** rather than refused, and two Platform-console
messages changed with it (`otherShelter` became `alreadyHere`; `loginUnavailable` reworded). So
something did change that a person can see.

**No note is written for it, and this is a judgement rather than an oversight:**

- The only person who can see it is a **product administrator**, which today is one person.
- The *usable* half — a person moving between their two shelters — is deferred to `#acwho`'s console
  stream by the item's own words: *"The console surface that uses it is a later stream."*
- A note now would read as "you can work at two shelters", which is **not yet true** through any
  screen. The release-note truth rule exists to stop exactly that.

**Recorded as this release's note gap** (defect 1), for the console stream to carry.

## 3. Schema and data

Five migrations are pending on **both** production and UAT, with **no drift on either** (`--status`:
439 applied, 5 pending, nothing applied that has no file on `main`). All five were read in full.

| File | What it does | Risk |
| --- | --- | --- |
| `0439_my_shelters_says_what_it_found.sql` | the shelter list says why a shelter is not listed | low — one definer function, read-only |
| `0440_product_admin_reown_site.sql` | re-owns one definer function (tenancy catalogue) | low — ownership only; `consumer: none` |
| `0441_platform_content.sql` | creates `platform_content` + its public view and policy | additive; a new table |
| `0442_platform_content_seed.sql` | seeds **330 content rows** into the table `0441` creates | **writes rows** — see below |
| `0443_one_main_role_per_shelter.sql` | `user_roles_one_main` becomes per shelter; four functions updated | **changes a uniqueness rule** — see below |

### 0442 writes rows, and why no before-picture or backup is claimed

The runbook wants a before-picture of the table a writing migration writes. **Here the table does
not exist yet** — `0441` creates it in the same release — so on production and UAT there is nothing
to picture and nothing to lose. The seed ends `on conflict (page, key) do nothing`, so **a re-run
never overwrites a line somebody has edited**, which is what matters once Lutan starts using the
editor.

### 0443 changes a uniqueness rule, which is the one that could fail quietly

`user_roles_one_main` moves from `(user_id) where is_main` to `(user_id, shelter_id) where is_main`.
That is a **widening**: every existing row satisfies the new index, which #1889 proved in a
`begin … rollback` harness (`supabase/harness/0443_one_main_per_shelter.sql`, 123 lines) and which
the dry-run confirms.

- [x] **It never writes `roles`, `role_cards` or `card_grants`** — so a role is still exactly the set of cards it holds, and this adds no way to change that
- [x] **The restriction he kept is still enforced**: a second main role in the *same* shelter is still refused
- [x] **Every function stays gated**: `is_product_admin()` plus aal2 inside each definer body; the no-Admin-left refusal (23514) is unchanged
- [x] The three consumer files named in its header were all changed in the same PR, each narrowing its `user_roles` writes to one `shelter_id` — the failure mode this guards is a caller that still assumes one main role

### The dry-runs, and the one expected failure

- [x] `--dry-run --env production` — 0439, 0440, 0441, 0443 **ok**; 0442 **FAILED** on `relation "public.platform_content" does not exist`
- [x] `--dry-run --env uat` — identical result
- [x] **The 0442 failure is the documented per-file-transaction caveat, not a fault**, and the script says so itself: each file is dry-run in its own `begin … rollback`, so `0441`'s new table is gone before `0442` runs. A real apply commits each file first. **A red dry-run normally means "do not apply"; here the correct action is to apply**, and that is why this line exists rather than a tick alone
- [x] Migration numbers are one above the highest on `main`, contiguous 0439–0443, no gaps
- [x] `--status` reviewed on dev, UAT and production before applying
- [x] Applied to dev and recorded in `schema_migrations` — all five already applied there (445 applied, 0 pending)
- [x] Files are re-runnable — `if not exists` / `or replace` / `drop … if exists` throughout; `0442` additionally `on conflict do nothing`
- [x] Down-migration — n/a, and stated instead: `0443` carries its own undo in a comment (recreate `user_roles_one_main` on `(user_id) where is_main`, valid only while nobody holds a main role in two shelters). The rest are drop-the-function or drop-the-table
- [x] Production apply plan stated: all five, UAT first as the rehearsal, then production, **before** the Worker deploys
- [x] Production backup for a destructive migration — n/a: nothing is dropped or rewritten. `0442` seeds a table created in the same release; `0443` widens an index
- [x] Existing rows still read correctly after the change — proved on dev, where all five are already applied, and by #1889's harness for the one rule that changed

### One finding on dev, not a blocker

`--status` on dev reports **one row applied with no file on `origin/main`:
`0422_keep_an_admin_per_shelter.sql`.** That is the signature of an abandoned branch's migration
that was applied and never reverted (`CLAUDE.md`, "Database migrations"). Production and UAT are
both clean. Recorded as defect 2; it does not touch this release.

### The tenancy catalogue, baselined BEFORE applying

`check-tenancy-catalogue.mjs --env production` is **report-only and always exits 0**, which is
exactly why it gets skipped. Baseline taken before applying anything: **124 flagged (47 views, 77
functions, 0 tables missing `definer_all`), 13 allowed by name, 0 stale.**

- [x] Baseline recorded above
- [x] **`#tnycl` is closed by #1880**, which is the measurement that proves it: `0.49.1` ended at 130 flagged / 83 functions / 7 allowed, and production now reads 124 / 77 / 13 — six moved onto the allow-list with a reason in checkable terms, and `0440` re-owns the seventh when it applies
- [x] **Delta after applying, read on BOTH environments and identical on each: 124 to 128 flagged (views 47 to 48, functions 77 to 79, tables missing `definer_all` 0 to 1), allowed 13, stale 0.** The four new objects are all `0441`'s: `view:public.public_platform_content`, `function:public.product_admin_set_platform_content`, `function:public.product_admin_delete_platform_content` and `table:public.platform_content`, which has RLS on and **no `definer_all` policy**. **Nothing left the flagged list**, so `0440`'s re-own changed an owner without clearing its flag. Not a blocker (report-only, and the two functions are gated inside their own bodies), and **filed on the backlog** so the debt `#tnycl` just cleared does not silently re-accumulate

## 4. Functional checks

- [x] `/releases` renders the new entry — verified by the cut's own assertions (newest entry, `latestRelease`, compareVersions order)
- [ ] The six notes read correctly on `/releases` after deploy — pending: nobody has looked at the rendered page. They are proved present, in order and character-identical by 17 assertions, which is not the same as read. **All six are `admin: true`, so the page must be read as Admin**
- [x] Boundary cases checked — n/a: a cut moves an array and bumps three version fields; no date, length or banding logic
- [x] Data persists — n/a: no row is written by this PR
- [x] Empty state renders sensibly — n/a: no list is rendered by this PR
- [x] Invalid input rejected — n/a: the cut takes its arguments from the command line and refuses before writing a byte, which is how the `0.49.1` guard refusal was caught

### Role access matrix

n/a: a release cut changes no card, no role and no policy. The migrations' access is in section 3,
read against cards rather than roles.

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a: the release date is a string the cut is given, not computed
- [x] Thai strings — n/a: no copy changed in this PR. The Thai in the 330 seeded content rows is `0442`'s, generated from the dictionaries with **0 rows missing Thai** by its own header, and read by a Thai speaker is a gap below
- [x] Mobile viewport — n/a: this PR renders nothing. Three phone-width looks are gaps below
- [x] Browser console / network clean — n/a: no page changed here
- [x] Nav entry correct — n/a: no nav entry changed
- [x] Manual updated — n/a: a release cut is not a feature anyone reads about in the manual
- [x] Translatable strings — n/a: none added here

## 6. Regression

- [x] Every earlier release entry present and unchanged — asserted by the verify
- [x] Release order and `latestRelease` correct — asserted by the verify
- [x] No `[object Object]` or `undefined` in the new entry — asserted by the verify
- [x] Nothing merged from `main` was broken — the branch was cut from `main` at `50c35619b` and carries three files
- [x] The pages nearest the change still work — n/a: `/releases` is the only page reading this file, and it is covered above
- [x] Shared file touched, checked from a second page — n/a: `releases.ts` is plain data with no imports, read by `/releases` and the Worker only

## 7. Documentation

- [ ] **Release notes.** n/a: a cut PR publishes the notes other PRs wrote and adds none of its own — `unreleased` does not gain a line here, it is **emptied** by construction. The six it publishes were each written and checked in their own PR
- [x] `docs/release-procedure.md`, `docs/release-smoke-test.md` and `docs/test-plan-template.md` confirmed **unchanged** since `0.49.1`, so the runbook this release follows is the one that was followed last time. `CLAUDE.md` changed in one place (#1883, migration numbering) and that change was read
- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The ticks for this release's eleven features came in their own PRs
- [x] Non-obvious design choices — n/a for the cut itself; the release record carries the reasoning, in its own PR after the deploy
- [x] `README.md` still accurate
- [x] Commit messages say why, not just what — the cut commit carries the ordering gate in full, so a reader of `git log` alone meets it
- [x] Claims were measured, not reasoned — every figure here was read from a command's own output, written to a file first
- [x] Release record `docs/releases/2026-11-25-0-49-2.md` — written, in the PR that carries this tick
- [x] `docs/release-handover.md` rewritten — 131 lines, within the 150-line ceiling, in this same PR

## 8. Pre-production gate

- [x] Baseline read before touching anything: all four hosts answered `0.49.1 @ ba6603e5b` on **both** `/api/version` and `/api/releases/current`, all `x-lanna-served-by: pi`
- [x] Every PR in the release has a test plan — all twelve read for this cut, not counted. Nine `Result: pass`, two `pass with accepted defects`, none `fail`
- [x] **LANNA'S OWN WEBSITE READS `locked` ON PRODUCTION** — **and this line guarded the wrong step, which is the finding of this release.** The floor lifts at the **production Pi build**, not the Worker deploy (`PUBLIC_SITE` is `where: "pi"` in `runtime-config.mjs`; `write-env.mjs` applies it into the Pi's env file at build time). His 2026-11-25 console change had **not** taken, so the Pi build put the real public site on the internet: `/` 200 at 78,877 bytes, `/adopt`, `/our-work` and `/donate` all 200, `CF-Cache-Status: DYNAMIC`, `robots.txt` serving `Allow: /` with a sitemap. He set it `locked` on 2026-11-26 and it closed within a minute. Filed as `#flrwh`; full account in the record
- [x] Tested SHA `5344c037a` recorded, and it was the tip of `main` at deploy time
- [x] Deployed SHA matches: all four hosts report `5344c037a85720b2ffb8ca68a3a5a99eea8b8c51` on `/api/version`
- [x] Deployed to test; `test.lannacare.org` answers `0.49.2` on both endpoints, `served-by: pi`
- [x] Three Pi builds run **serial**, each log read before the next started. Box pre-flighted first: 3238 MB -> 3389 MB available, load 0.00, uptime 13 days, 872 G free. Each logged its own correct Server Actions fingerprint (test `ecc41837fc0b`, UAT `cdeca9cbc4de`, production `cbd55beae8d8`) and `check-assets: ok`. **`deploy-pi.sh`'s machine-wide `flock -n` refuses rather than waits, so stacking was impossible by construction** — read after fearing it
- [ ] Worker deploys strictly test -> UAT -> production, production last — deferred: release manager
- [x] UAT deployed with `--no-mail`, and it reported `no major release new to uat (was 0.49.1), so no email`. **UAT can mail**: `RELEASE_MAIL_ENV="UAT"` with a live `RELEASE_MAIL` binding, and its database holds production's real people, so its silence is the strongest of the three mail proofs
- [x] `strip-baked-env` seen in both of ours (23 on `0.49.1`)
- [ ] Any new secret or env var exists in production — deferred: release manager. **`PUBLIC_SITE` is a `vars` entry in `wrangler.jsonc`, not a secret**, so it ships with the bundle; what must be checked is `GOOGLE_DRIVE_ROOT_FOLDER_ID` on the production Worker, because the new content editor uploads photos through it
- [ ] Public pages re-checked after a cache purge — deferred: release manager. **Production's zone alone went stale on `0.49.0`** and passed first time on `0.49.1`; purge both zones regardless
- [x] **Checked from outside — and it FAILED, at the step before the one this line names.** After the production **Pi build** a signed-out visitor got the real site (`/` 200 at 78,877 bytes, construction wording gone; `/adopt`, `/our-work`, `/donate` all 200). After Lutan locked Lanna on 2026-11-26: `/` back to 200 at **24,468 bytes with construction wording present**, the other three **307 to `/login`**. Before-picture was 200, 24,462 bytes
- [x] `robots.txt` — **it did NOT refuse crawlers after the floor lift.** It served `Allow: /` with a sitemap while the floor was open and Lanna's value was still `open`. Back to `Disallow: /` with `x-robots-tag: noindex, nofollow` once Lanna was locked
- [x] Timezone-sensitive behaviour — n/a by nature for a cut; the entry reads back correctly from `/api/releases/current`
- [x] Evidence pasted into this plan is the tool's actual output, unedited. **One exception recorded rather than hidden:** `guarded-install.mjs` was read through `| tail -4` and reported as success when the install had not finished — the figures above are from unpiped reads, and that fault is written up in the record and the handover
- [x] Migration ordering: applied before every deploy. UAT first as the rehearsal, then production; both read 444 applied, 0 pending, zero drift afterwards
- [x] `apply-migrations.mjs --env production --dry-run` — the one failure is the documented per-file-transaction caveat (`0441` creates the table `0442` seeds, and the dry-run rolls it back). The correct action on that output is to apply, and all five applied cleanly

### Rollback

Revert the cut commit and redeploy: `releases.ts` returns to `0.49.1` and the six notes go back to
`unreleased`. **The floor is the part a revert does not cover**: `PUBLIC_SITE` merged in #1879, so
undoing the lift is its own `wrangler.jsonc` change plus another production deploy — which is why
step 2's confirmation matters more than any rollback. For the migrations: `0439`, `0440` and `0443`
are drop-or-restore-the-function (`0443`'s undo is in its own comment), `0441` is drop the table,
and `0442`'s rows go with it.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
| --- | --- | --- | --- |
| 1 | medium | #1889's release-notes answer says "nothing a user can see until the console stream ships", but `0443` changed two Platform-console messages and made a second-shelter grant succeed | **Accepted, and no note written.** The only viewer is a product administrator and the usable surface is deferred to `#acwho`'s console stream; a note now would overpromise. **For the planner to file** so the console stream carries it |
| 2 | low | Dev has `0422_keep_an_admin_per_shelter.sql` applied with no file on `main` — an abandoned branch's migration never reverted | **Not a blocker for this release.** Production and UAT are both clean. **For the planner to file** |
| 3 | low | `check-deferred-notes.mjs`'s default window is the last cut commit, which on a release following a release is wider than the release — and it matches the template's own prose about `admin: true`, producing false positives on ticked lines | **Accepted, worked around** by re-running with `--since`. **For the planner to file**: the two false positives cost real reading twice now |

## Left for manual verification

**This is the "note of missing test" half of the instruction.** Six of the twelve plans end with a
`pending:` line. They are listed here so the release record carries them rather than losing them.

| # | What to check | Where |
| --- | --- | --- |
| 1 | **Lanna's own website reads `locked`, before the deploy** — Lutan's, and the gate of this release. No stream could read a production row | production console, Website tab |
| 2 | Lutan types the `cooper` lines and says the content is right — `#cpstr`'s own proof; the page appears once its heading is typed, so until then there is nothing to read | `/platform/content` |
| 3 | Cooper's page and a feature page with a real photo, at phone width (portrait 4:5, feature 16:9) — needs a real photo, so it waits on rows 5 and 2 | `/platform/cooper`, `/platform/features/*` |
| 4 | The content editor's layout for 330 lines, and on a phone | `/platform/content` |
| 5 | `GOOGLE_DRIVE_ROOT_FOLDER_ID` on the **production** Worker, so a product photo uploads from the platform host — checkable at deploy time, and it blocks rows 3 and 2 | deploy |
| 6 | `/platform/shelters` at 375px, and its console | `/platform/shelters` |
| 7 | A real authenticator code on both step-up journeys — Lutan's; no stream has an authenticator, and `--aal2` on dev does not prove the real journey | production or test |
| 8 | Archive then restore a login on a shelter's Security page, with a login holding a role at **two** shelters — exercises `0443`'s per-shelter narrowing; needs the console stream, or dev with `--shelter` | Settings → Security |

**Rows 3, 4 and 6 are phone-width looks that can be DRIVEN rather than handed over** — headless
Chrome with a mobile user agent through `scripts/lib/driven-session.mjs` (`#bprf7`). Driving them is
offered after the deploy, not assumed: Lutan said *"Leave them"* to the same offer on `0.49.1`.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed
- [x] **Every exit code read from the command itself and every output read from a file, never through a pipe** — the `0.49.1` lesson, where `tail -6` produced a false claim about this very guard
- [x] Gates — `gates: typecheck=0 lint=0 test=0 build=0`, read from the output file rather than a pipe
- [x] CI — read against this head commit before merging

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

- [x] The manual list above is **not** empty: eight rows, each with its owner named. Row 1 was done by Lutan on 2026-11-26 and is the finding of this release; the rest are carried into the record

Manual verification by: pending: the eight rows above, and the post-deploy read of `/releases` as Admin. Nothing in this cut PR itself needs a person's eyes — the version bump and the note array are proved by 17 assertions

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed over: `docs/release-handover.md` is rewritten in this same PR, leading on the floor-trigger finding

Result: pass
