## Header

| | |
|---|---|
| Feature | The Worker and the Pi build with one Server Actions encryption key |
| Backlog item | `docs/backlog.md` → Deployment: *The Pi and the Worker are separate builds with no shared `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`…* |
| Branch / worktree | `claude/server-actions-encryption-key` @ `C:\Development\Animal_Shelter_server-actions-encryption-key` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not used: no `src/` change) |
| PR | pending |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | ec85338 plus the test-plan commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *reproduce the cross-build failure, and if real make the Worker and Pi build with one shared key*
- [x] Files/areas touched listed — `scripts/deploy.mjs`, `scripts/pi/write-env.mjs`, `scripts/pi/deploy-pi.sh`, new `scripts/actions-key.mjs`, `scripts/check-actions-key.mjs`, `scripts/lib/actions-key.mjs`, `.github/workflows/ci.yml`, `.env.example`, `README.md`, `docs/`. No `src/`, no `worker/`, no migration
- [x] Roles affected identified — none directly: a deploy-tooling change. Every role benefits when a form crosses between the Pi and the Worker builds, because it stops failing once
- [x] Anything explicitly **out of scope** written down — a deploy landing while a form is open (code skew, not key skew; not tested, said so in the decision); a Cloudflare secret (the build embeds the key, nothing runs from a secret)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 build=0
```

Also run, and exit 0: `node scripts/check-actions-key.mjs` (24 checks, all `ok`), `node scripts/check-script-integrity.mjs`.
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — the `do $$ … $$ — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the experiment in the decision file: a form rendered by one build is accepted by another build made with the same key, for both kinds of build the Pi and the Worker use (plain `next build`, OpenNext)
- [ ] Data persists — n/a: the change writes no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no list or table
- [x] Invalid input is rejected with a readable message, not a crash — a missing, non-base64 or wrong-length key stops both deploys before building, with the command to generate one (`check-actions-key.mjs`)
- [x] Boundary cases checked — 16, 24 and 32-byte keys accepted, 10 bytes refused, empty and missing refused; a build with another key and a manifest with no key both caught

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |
| management | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |
| staff | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |
| vet | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |
| volunteer | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |
| signed out | nothing — deploy tooling only | unchanged | n/a: no permission logic touched |

- [ ] Every role above tested — n/a: no permission logic touched; no page rendered differently
- [ ] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a reader of the manual would do differently
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no UI surface; the experiment drove HTTP posts, not a browser
- [x] Network clean — the cross-build POSTs return 500 with different keys and 200/303 with the same key, recorded in the decision file; the control (same build) is clean

## 6. Regression

- [x] The pages nearest the change still work — `/login` renders and posts on a build made with the key (the experiment loaded it from builds A and C)
- [x] Any shared file touched checked from a second, unrelated page, by loading it — `scripts/deploy.mjs` and `write-env.mjs` are the shared files. `node --check` passes, `check-script-integrity.mjs` parses every `.mjs`, the OpenNext build ran with the key and a plain build ran with it in `.env.production.local`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-03-server-actions-encryption-key.md`, with the experiment and its table
- [x] `README.md` still accurate — its Environments section now names the key; `docs/pi-hosting.md` step 1b is the procedure
- [ ] **Release notes.** n/a: nobody would notice — a form that failed once after a Pi-to-Worker handover stops doing so, and no shelter user has been seen to hit it; the change is in deploy tooling only
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The backlog item was reasoned from the guide; this PR replaces it with a measurement, and the one claim in the guide that turned out too weak (every action fails, not just closures) is stated as measured. One thing written from memory — that a changed action module gets a new id — was removed as untested

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this change derives a date, a time or a "today"
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** — n/a: no threshold, band, window or retry limit
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block is verbatim; the experiment's output is recorded in the decision file as a table of what the runs printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no Cloudflare secret; the key is a build input read from `.env.deploy.production` on the dev machine and the Pi (Left for manual verification, item 1)

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply must happen * — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL  — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the PR and redeploy both (`deploy-pi.sh --ref <sha>` on the Pi; `npm run deploy:*` for the Worker): each build is then back on its own random key, which is exactly today's behaviour. The key lines left in the values files are inert once nothing reads them. No migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | A form rendered by the Pi and posted to the Worker's build (or the reverse) fails with "Failed to find Server Action" whenever the two builds have different keys; reproduced, and every action fails, not only ones that close over values | fixed (shared key) — takes effect only once both machines carry the key and have deployed |
| 2 | Low | Nothing stopped a deploy shipping a random key: before this PR both builds silently invented their own | fixed — both deploys refuse without the key and check the finished build |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | **Before the next deploy of either:** run `node scripts/actions-key.mjs --generate`, put `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<it>` in `.env.deploy.production` (and in `.env.local` for test) on the dev machine AND the same line in the same file on the Pi, then run `node scripts/actions-key.mjs --env production` on both and confirm the fingerprints are identical. Both deploys refuse until the line is there | dev machine and Pi |
| 2 | After both have deployed: with `/login` open from the Pi-served site, `sudo systemctl stop lanna-care`, submit the form, and confirm it signs in (the Worker accepts the Pi's form); test environment first (`lanna-care-test`) | `test.lannacare.org` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

The items in **Left for manual verification** above, for the person who looked. Not signed: nobody has looked yet.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: items 1-2 above — the key is not yet in any values file, and the cross-over check needs both deploys

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened first, then the checklist is pasted
- [ ] Handed to the production release manager — n/a: not yet — the PR is opened first, then the release manager is told

Result: pass

Release manager acknowledgement: pending
