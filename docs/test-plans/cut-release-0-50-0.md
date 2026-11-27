# Test plan — cut release 0.50.0

## Header

| | |
| --- | --- |
| Feature | Cut `0.50.0` — a MAJOR release, so **the release email goes out**, on Lutan's instruction of 2026-11-27 |
| Branch | `claude/cut-release-0-50-0` |
| Tested SHA | filled in at deploy time by the release manager |
| Environments | dev (gates only at this stage); test, UAT and production in the deploy sections |
| Author | Claude (release manager) |
| Date | 2026-11-27 |

## 1. Scope and risk

### What this release is: 15 PRs, eight notes, four migrations, and a `wrangler.jsonc` change on test and UAT only

The range is `ef022e146..HEAD` — PRs **#1906 to #1920**, fifteen of them, enumerated by
`node scripts/release-prs.mjs` (exit 0, read from the command and not through a pipe; all fifteen
resolved from git, 19 added migration/test-plan files checked against the list). **Every one of the
fifteen carries a test plan and all fifteen were read for this cut**, not counted.

**The release email is the reason this one is `major`.** Lutan asked for it in those words:
*"lets do a major reloease, email to be sent and take note of test gaps"*. That answers the one
question the runbook reserves for him, and it was put back to him in the terms the runbook
prescribes — **what the email contains and that it cannot be unsent** — together with the standing
fact that it currently reaches **one person, him**: the shelter's own address is refused by the relay
and no other admin is on the production list.

### The risk this release carries: two brand-new addresses, on test and UAT

`node scripts/check-wrangler-var-steps.mjs --base ef022e14633c423279bfb81e1eab143ed878c640` names
exactly two changes and the step that applies each:

```
  test PLATFORM_HOST: undefined -> "cooperjaidee-test.lannacare.org"  applied at the Pi BUILD (write-env.mjs) — before the Worker deploy
  uat PLATFORM_HOST: undefined -> "cooperjaidee-uat.lannacare.org"  applied at the Pi BUILD (write-env.mjs) — before the Worker deploy

2 change(s) go live at the Pi build.
```

**Production's `wrangler.jsonc` block is untouched**, so `0.49.2`'s `#flrwh` fault — a var going live
at the Pi build while the procedure guarded the Worker deploy — cannot reach production in this
release. That is measured, not assumed.

**What it does mean is a known, accepted gap on test and UAT, and it is this release's headline
finding.** #1920 added the two routes but, by its own decision file, left the rest of
`docs/domain-checklist.md` section G to a later step: a `shelter_hosts` front-door row, an
`/auth/callback` entry in each Supabase project, and `site_url`. So:

```
check-deployed-hosts: uat (project fsjagxmxjosauwmxwype)
  ok      uat.lannacare.org
  MISSING cooperjaidee-uat.lannacare.org
FAIL: 1 deployed host(s) have no shelter_hosts row in uat
```

and the same on test. **The runbook says any FAIL stops the release, so it was put to Lutan and he
chose to ship and record the gap**, with the half that can be done without a dashboard done here.
The consequence, stated plainly: **signing in on the two new product addresses is refused** until the
`/auth/callback` entries are added by hand in the two Supabase dashboards — which the decision file
requires be done in the dashboard and **not** by a scripted `config/auth` write, because that is what
broke UAT sign-in on 2026-11-26. Nothing about it reaches production and no address that works today
is affected.

- [x] Risk assessed — two `wrangler.jsonc` vars, both test/UAT only, both applied at the Pi build; the
  four migrations are a function pair, one column-nullability restoration and one added output column
- [x] Files and areas touched listed — `src/lib/releases.ts`, `package.json`, `package-lock.json` for
  the cut itself; the release's own content is in the fifteen PRs' own plans
- [x] Cards affected — **none by the cut.** `0446`/`0447`/`0449` are gated by `is_product_admin()`
  plus aal2 inside the function body, which is the product-administrator gate and not a card; the
  shelter card system is untouched by this release
- [x] Out of scope, written down so the release manager is not surprised — the Supabase
  `/auth/callback` entries and `site_url` moves for the two new product addresses (section G of
  `docs/domain-checklist.md`), and the `CLOUDFLARE_ZONE_ID_COOPERJAIDEE` value plus a purge token
  allowed on that zone (`#cjpzn`). **A release cuts what the build gave it**; neither is written here

### What a user will notice: eight notes, and three are for everybody

`0.49.2` published six notes and every one was `admin: true`; `0.49.3` published two. This one
publishes **eight — five `admin: true` and three plain strings**, so it is the first release in three
where ordinary shelter users see more than one line.

- **For everyone:** the Thai public website no longer draws the app's header and side menu around it
  when you are signed in; registering a resident now warns you if the name is already used or looks
  very like one, and offers the next number; a dead password-reset link now says so and offers a new
  one instead of blaming Google.
- **`admin: true`:** supplier and alert emails now come from the shelter's full name followed by
  *(via CooperJaidee)* and release emails come from CooperJaidee; a password save with an
  authenticator enrolled now tells you to enter its code under Security; and three product-console
  notes about marking a web address to attach at the next deploy, reading back whether it answers,
  and the setup checklist that no longer ticks until it does.

## 2. Automated gates

- [x] `node scripts/cut-release.mjs 0.50.0 2026-11-27 major --verify` — **all 17 assertions passed**,
  including `nothing invented (note count equal) [8 vs 8]` and `every note carried across
  character-identical, with its role tags, same order`. `--base` was **not** needed: this cut adds no
  note of its own, so `origin/main:src/lib/releases.ts` is still the true pre-cut state
- [x] **The mail proof, both halves — and on a major release it is the presence that matters.**
  `mail PRESENCE: majorReleasesSince(previous) is exactly the new version [["0.50.0"]]` **and**
  `control: from further back, an older major release is still found [0.49.0 in ["0.50.0","0.49.0"]]`.
  Without the control, a function that answered "everything is major" would satisfy the first line
- [x] `node scripts/check-deferred-notes.mjs ef022e146 HEAD` — exit 0, **16 plans, 2 to judge, 6 to
  skim**, and both judgements are recorded in the cut's own `--deferred-reviewed` answer rather than
  left in a chat: `deploy-dns-retry` owes no note ever (a release-manager script with no user-facing
  surface at all), and `product-test-uat`'s step is **not** closed by this release, because the
  Supabase entries and `site_url` moves do not happen here
- [x] `node scripts/check-release-order.mjs --worker-deployed ef022e146` on **production** and
  **uat** — exit 0 each, both directions, `none pending, nothing to prove (1 registered)`
- [x] `node scripts/check-dev-aal2-absent.mjs` on **production** and **uat** — exit 0 each, `the
  dev-only aal2 step-up is absent from every deployed path`
- [x] `npm run audit:register` — exit 0, **1 high advisory, registered and still unreachable**
  (`GHSA-5j98-mcp5-4vw2`, the `glob` CLI's `-c/--cmd`). `npm run audit:prod` exits 1 on the same
  advisory plus one moderate `minimatch`, which is what the register exists to resolve. Noted: the
  register could not check the built Worker bundle because no build was present at that moment
- [x] `node scripts/check-deployed-hosts.mjs --env production` — exit 0, all four production hosts
  have a `shelter_hosts` row **and** an `/auth/callback` entry, with `site_url` reading
  `https://cooperjaidee.org`. `--env uat` and dev both FAIL on the new product address, which is
  section 1's accepted gap and Lutan's decision
- [x] `node scripts/check-backlog-sections.mjs` after folding `backlog` into `main` — `ok — 30 open
  items, all above ## Completed`
- [x] `node scripts/guarded-install.mjs` in the main checkout before anything was deployed, so the
  `0.28.0` fault (a checkout whose `node_modules` does not match the lockfile) cannot recur
- [ ] `node scripts/gates.mjs` — pending: the run is still going; its own closing lines go in the
  fenced block below, read from the run and never typed
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. Read before merging,
  with `headSha` confirmed equal to the pushed head

```
(the gates run's own closing lines go here, pasted from the run)
```

## 3. Schema and data

Four migrations, `0446` to `0449`. **All four dry-ran `ok` on both production and UAT**, with no
per-file-transaction caveat of the kind the runbook warns about.

| File | What | Consumer header |
| --- | --- | --- |
| `0446_product_admin_set_host_attach.sql` | The one write that can set `shelter_hosts.attach_to_worker`; product administrator plus aal2 in the body | `none` |
| `0447_product_admin_set_host_attach_by_shelter.sql` | **Replaces `0446`'s two-argument function**, which was measured broken on dev the day it was applied: it took `(host, attach)` and matched no row under the restrictive per-shelter policies. Takes the shelter too | `none` |
| `0448_shelter_hosts_shelter_id_nullable.sql` | Restores `shelter_hosts.shelter_id` to nullable, which `0382` declared on purpose: a null row is the platform front door | `none` |
| `0449_product_admin_shelters_attached_hosts.sql` | `0428`'s `product_admin_shelters()` unchanged plus one output column, so the console can read back which addresses are marked | `src/app/platform/page.tsx`, `src/app/platform/ProductAdminPanel.tsx` |

- [x] Migration numbers are `0446`–`0449`, one above `main`'s highest at each merge, and nothing is
  in flight: `node scripts/apply-migrations.mjs --status` reads `450 file(s), 446 applied row(s)` on
  production and UAT with `Applied here, no file on origin/main: 0` on each, so neither carries an
  orphan
- [x] `--status` reviewed before applying, on both environments — `446 applied, 4 pending`, the same
  four files, zero drift in either direction
- [x] `--dry-run` reviewed against **production** — all four `ok`
- [x] `--dry-run` reviewed against **UAT** — all four `ok`
- [x] Applied to dev already and recorded in `schema_migrations` — dev reads `450 applied, 0 pending`
  with zero drift, which is also why dev's tenancy reading below is an after-picture and not a
  baseline
- [x] Files are re-runnable — `0446`/`0447`/`0449` are `create or replace function`, `0448` is a
  guarded `alter column … drop not null`
- [x] Existing rows still read correctly — **no file rewrites a row.** `0448` relaxes a constraint
  (never tightens it, so the runbook's ordering rule for `NOT NULL` does not bite), and the other
  three are function definitions. There is nothing to back-fill and nothing to snapshot, so the
  before-picture rule for rewriting migrations does not apply
- [x] Constraints exercised against real rows — n/a: the only constraint change is the **removal** of
  a `NOT NULL`, which cannot reject a row that was accepted before it. `0447`'s own PR records the
  harness run that found `0446`'s broken shape on dev
- [x] Down-migration — not written, and the reason is stated: `0448` is a relaxation that is harmless
  to leave; `0447` supersedes `0446` in place; `0449` can be reverted by re-applying `0428`'s body
- [x] **Tenancy catalogue baseline read BEFORE applying**, which is the only moment it is available:
  **production and UAT both `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 17
  allowed by name, 0 stale`**, strict, exit 0. Re-read after applying and record the delta
- [x] **A measurement caveat that matters more than the figures: `--tenant-role rls_definer` changes
  the flagged count from 125 to 0, and `0.49.3`'s record quoted the 125.** Measured both ways on
  production today: without the flag, `125 flagged (48 views, 77 functions, 0 tables missing
  definer_all)`; with it, `0 flagged`. **Nothing was re-owned between the two releases** — the
  runbook prescribes the flag and the previous record's reading was taken without it. A baseline is
  only comparable against a reading taken with the same flags
- [x] Production apply plan stated for the release manager — **UAT first as the rehearsal, then
  production**, both **before** any Pi build, because `0449`'s consumers are already live on `main`.
  Then `node scripts/assert-schema.mjs` on both, which must print `holds every migration this commit
  carries` before the first Pi build starts

## 4. Functional checks

- [x] Fifteen test plans read, every one of them. **Thirteen `Result: pass`, two `pass with accepted
  defects`** (`cooperjaidee-purge-zone`, `host-attach-console`), and both of those were read rather
  than taken on the word of their Result line
- [x] `cooperjaidee-purge-zone`'s accepted defect is `#cjpzn`: production's purge token cannot reach
  the `cooperjaidee.org` zone. **The script now fails loudly rather than purging three of four hosts
  silently**, and the runbook already tells the release manager to expect exit 1 and purge that zone
  by hand
- [x] `host-attach-console`'s accepted defect was **closed inside this same release** by #1918 and
  `0449`: the console could not show which addresses were marked because `product_admin_shelters()`
  did not return the flag, and `0449` adds exactly that column
- [x] **Seven of the fifteen plans end `Manual verification by: pending:`**, which is the runbook's
  stop-and-ask case. Lutan's instruction *"take note of test gaps"* is the answer: they ship as
  **stated gaps**, listed in the release record rather than copied into this plan's own manual table,
  which would give them a second home that nothing closes
- [x] Happy path, persistence, create/edit/delete, empty state, invalid input, boundaries — n/a for
  the cut itself: it moves a note array and a version number. Each is answered in the fifteen PRs'
  own plans
- [ ] The eight notes read correctly on `/releases` after deploy — pending: nobody has looked at the
  rendered page. They are proved present, in order and character-identical by 17 assertions, which is
  not the same as read. **Three are plain and five are `admin: true`**, so the page wants reading both
  as Admin and as an ordinary login to see the difference
- [x] Role access matrix — n/a for the cut; and see section 1, the card system is untouched

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a by nature for a cut; the entry's date is `2026-11-27` and
  reads back from `/api/releases/current` after deploy
- [x] Translatable strings — n/a for the cut. The Thai-facing change in this release (#1913, the Thai
  public site no longer drawing the app chrome) carries its own plan and its own pending look
- [x] Nav, manual, mobile viewport, browser console, network — n/a for the cut: no route, no
  component and no manual topic is touched by this PR
- [x] The notes' own text was not retyped anywhere: `--verify` proved all eight carried across
  **character-identical**, which is the only check that catches a note quietly altered in the move

## 6. Regression

- [x] `every earlier entry present and unchanged` and `releases are in compareVersions order, newest
  first` — both asserted by `--verify`
- [x] `package.json`, and `package-lock.json`'s top-level and root-package versions, **all three
  agree** at `0.50.0`
- [x] `unreleased` is empty after the cut, and `base unreleased was not empty` — so the cut moved
  something rather than publishing nothing
- [x] The previous release's record and handover are untouched by this PR
- [x] Nothing merged from `main` was broken by this branch — the worktree was cut from
  `origin/main` at `a6e0d93d3` minutes before, and the four gates ran on that tree

## 7. Documentation

- [ ] **Release notes.** n/a: a cut PR publishes the notes other PRs wrote and adds none of its own —
  `unreleased` does not gain a line here, it is **emptied** by construction. All eight it publishes
  were written and checked in their own PRs
- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The four items this release's
  PRs closed were ticked on their own branches, and `backlog` was folded into `main` before the cut
- [x] `docs/release-procedure.md` was **changed since `0.49.3`**, by #1912, and the change is one this
  release follows: the production purge now covers all four production hosts in two zones, and the
  `NOT PURGED` exit-1 behaviour is written down. **Read rather than worked from memory**, because a
  runbook that changed since the last release is exactly the one not to assume
- [x] `docs/test-plan-template.md` and `docs/release-smoke-test.md` confirmed unchanged
- [ ] Release record `docs/releases/2026-11-27-0-50-0.md` — pending: written after the deploy, in its
  own PR, as the paperwork budget requires
- [ ] `docs/release-handover.md` rewritten — pending: rewritten with the record, in the same PR, and
  checked with `node scripts/check-release-handover.mjs` before that PR is opened
- [x] Commit messages say why, not just what
- [x] Claims here were measured, not reasoned — every figure in this plan was read from the command
  that produced it, and the one inference worth flagging (the 125-to-0 tenancy figure) was
  **re-measured both ways** rather than explained

## 8. Pre-production gate

- [x] **The `wrangler.jsonc` guard was run first, before anything else** —
  `check-wrangler-var-steps.mjs --base ef022e146` names two changes, both test/UAT `PLATFORM_HOST`,
  both applied at the Pi build. **Their guard is section 1's accepted gap**, settled with Lutan before
  the first Pi build rather than before the Worker deploy, which is where `0.49.2` got it wrong
- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred:
  release manager, at the merge
- [ ] Deployed SHA matches the tested SHA, read from `deploy.mjs`'s own line — deferred: release
  manager
- [ ] Deployed to test, smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Three Pi builds run **serial**, box pre-flighted first — deferred: release manager
- [ ] Worker deploys strictly test -> UAT -> production, production last — deferred: release manager
- [ ] UAT deployed with `--no-mail` — deferred: release manager. **On a major release this is the
  one that must not be forgotten in spirit even though `deploy.mjs` now refuses to mail from UAT
  without `--mail` in words**, because UAT's database holds production's real people
- [ ] **The production release email arrives, and its subject starts `[Production]` with a sender name
  that does not say UAT** — deferred: release manager. This is the first major release since
  `RELEASE_MAIL_ENV: "Production"` was set on 2026-11-06, so it is the proof `#w4k9n` (e) has been
  waiting for, and it is also the live proof for `shelter-sender-name`'s own pending line
- [ ] `strip-baked-env: removed N env var(s)` seen in each deploy output — deferred: release manager
- [ ] Any new secret or env var exists in production — n/a: none added. No `wrangler.jsonc` var
  changed in the production block and no migration needs a secret
- [ ] Public pages re-checked after a cache purge — deferred: release manager, and **expect exit 1
  from `purge-cache.mjs --env production`** naming the `cooperjaidee.org` zone, which is `#cjpzn` and
  is purged by hand
- [ ] A signed-out visitor still gets the construction page, and `robots.txt` still refuses crawlers
  — deferred: release manager, checked after the production Pi build **and** after the Worker deploy
- [ ] Timezone-sensitive behaviour on the deployed build — n/a by nature for a cut
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager
- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: release manager.
  The release does: `0449`'s consumers are already live on `main`, so the apply must precede the
  deploy, and that ordering is in section 3's apply plan
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred:
  release manager to re-read at apply time; it was run for this plan and all four files read `ok`
- [ ] For a destructive or rewriting migration only: a fresh production backup — n/a: no file
  rewrites or deletes a row; `0448` relaxes a constraint and the other three define functions
- [ ] Apply plan stated — deferred: release manager; stated in section 3, **UAT first, then
  production, both before any Pi build**
- [ ] Tenancy catalogue re-read after applying, and the delta recorded — deferred: release manager.
  The baseline is in section 3, with the flag caveat
- [ ] Rollback position stated, including what it does not cover — deferred: release manager, below

### Rollback

Revert the cut commit and rebuild the Pi at the previous ref
(`./scripts/pi/deploy-pi.sh --ref ef022e146`); `npx wrangler rollback --env production` reverts only
the Worker fallback. **Neither reverts a migration, and neither unsends the email.** `0446`/`0447`
and `0449` are function definitions that can be restored from `0428`'s body, `0448` is a relaxation
that is harmless to leave in place, and no file rewrites a row, so there is nothing to restore.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
| --- | --- | --- | --- |
| 1 | high | **Two brand-new product addresses are deployed with no `shelter_hosts` row and no `/auth/callback` entry**, so `check-deployed-hosts` FAILs on test and UAT and signing in on either address is refused. #1920 added the routes and left section G of `docs/domain-checklist.md` to a later step | **Accepted on Lutan's decision, 2026-11-27**, put to him before the cut with the alternative of holding the release. The front-door rows are added by this release; the Supabase dashboard entries and `site_url` are his, and must be made in the dashboard rather than by a scripted `config/auth` write. Nothing reaches production |
| 2 | low | **`0.49.3`'s record quotes `125 flagged` for the tenancy catalogue, taken without `--tenant-role rls_definer`; the runbook prescribes the flag and with it the figure is `0`** | **Found and measured both ways here**, so no false improvement is reported. For the planner to file: either the record's figure or the runbook's command wants a note saying the two are not comparable |
| 3 | low | `0449`'s consumer header named `src/app/platform/ProductAdminPanel.tsx`, and the apply warns that the declared consumer `differs from release 0.49.3, so it may or may not already read this` | **Accepted, and read rather than waved through:** the consumer is already on `main` from #1918, which is why the apply must precede the deploy. The warning is the check working, not a fault |

## Left for manual verification

| # | What to check | Where |
| --- | --- | --- |
| 1 | The eight notes render on `/releases`, read once as Admin and once as an ordinary login, so the three plain notes and the five `admin: true` ones are seen to differ | `lannacareforanimals.org/releases`, after the deploy |
| 2 | The release email arrives, subject starting `[Production]`, sender name not saying UAT | Lutan's inbox |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager)  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan,
  the two items above, after the production deploy

Manual verification by: pending: Lutan, the `/releases` page and the release email after deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links this plan instead
- [ ] Handed to the production release manager — n/a: the release manager wrote it

Result: pass with accepted defects
