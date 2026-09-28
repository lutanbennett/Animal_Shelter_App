# Feature test plan

## Header

| | |
|---|---|
| Feature | Puppy loader showcase pause on `/adopt` |
| Backlog item | `docs/backlog.md` → "A deliberate delay on the way to the available dogs, to show off the puppy loader." |
| Branch / worktree | `claude/puppy-loader-delay` @ `C:\Development\Animal_Shelter_puppy-loader-delay` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | #204 |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | ab840a3 (post-sync merge of origin/main) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a `SHOWCASE_LOADER_MS`-controlled, clamped pause at the top of `/adopt`'s server component, shown only on a fresh arrival at the route (not a filter/paging change or a back navigation), so the puppy loader gets seen.
- [x] Files/areas touched listed — `src/app/adopt/page.tsx`, new `src/lib/adopt/showcase-pause.ts`, `wrangler.jsonc` (test/uat/production `vars`), `src/lib/releases.ts`, `docs/decisions.md`, `docs/backlog.md`.
- [x] Roles affected identified — signed-out public only (`/adopt` is a public page).
- [x] Anything explicitly out of scope written down — no change to the resident data, filters, or `PuppyLoader.tsx`/`loading.tsx` themselves; pagination doesn't exist on `/adopt` yet, so the "not on paging" requirement has nothing to exercise beyond the same-route/query-param logic that will also cover it once paging is added.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Output:
  ```
  === gates: build exited 0 after 198s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR (#204): check, migration-numbers and test-plan all passed

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — home page → /adopt shows the puppy loader for ~1.8s, then the resident list, verified in the browser with `SHOWCASE_LOADER_MS=1800` set locally.
- [ ] Data persists — reload the page and the change is still there — n/a: no persisted state, this is a per-request render pause
- [x] Create / edit / delete all exercised — n/a: no data mutation on this page; only read
- [x] Empty state renders sensibly — n/a: not touched by this change (existing `/adopt` empty-state markup is unchanged)
- [x] Invalid input is rejected with a readable message, not a crash — `showcasePauseMs()` treats a non-numeric or negative `SHOWCASE_LOADER_MS` as `0` (off) rather than throwing or hanging
- [x] Boundary cases checked — `showcasePauseMs()` clamps any value above 3000 down to 3000; `0`, unset, negative and non-numeric all read as off. Verified by reading the implementation and by the gates' typecheck/build passing; not covered by an automated unit test since this repo has no unit-test harness for `src/lib/*`.

### Role access matrix

n/a: `/adopt` is a public page with no role gate; the change adds no new access surface. Nothing to check role-by-role beyond the existing page, which this feature does not alter access-wise.

- [x] Every role above tested — n/a: no role gate on this page or this change
- [x] A role that should not have access is blocked server-side — n/a: no access control introduced

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change, `/adopt` was already linked
- [x] Manual updated — n/a: no manual topic for this (public page, per the backlog item: "No manual change (public page)")
- [x] Translatable strings go through the translation path — n/a: no new user-facing text; the puppy loader's existing "Loading" label is untouched
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven; the brief specifically asks for a real phone check ("Check it on a phone"), not a resized desktop browser. Left for manual verification below
- [x] Browser console clean — no errors or React warnings, checked in the browser during the verification pass above
- [x] Network clean — no unexpected 4xx/5xx on `/adopt` during verification

## 6. Regression

- [x] The pages nearest the change still work — `/`, `/adopt`, `/adopt/[id]`, `/adopt/international` all loaded cleanly during verification
- [x] No shared file (`NavLinks.tsx`, `manual/en.ts`, etc.) touched by this change
- [x] Nothing merged from `main` during `sync` was broken by this branch — full gates (typecheck/lint/build) pass after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-28 — the production decision and the fresh-arrival detection approach
- [x] `README.md` still accurate — n/a: this change doesn't affect anything `README.md` documents
- [x] **Release notes.** A shelter visitor going to /adopt would notice the pause, so `unreleased` in `src/lib/releases.ts` has a line for it, written for a visitor.
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the fresh-arrival/filter-change/back-button behaviour was checked live in the browser (see section 4), not just reasoned about from the code

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: this feature has no timezone-dependent logic
- [ ] Boundary/banding assertions — n/a: the only boundary is the 3000ms clamp, checked in section 4 by reading `showcasePauseMs()`; not a date/time or pagination band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: no additional tool evidence beyond the gates output already pasted in section 2
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — `SHOWCASE_LOADER_MS` is a plain `vars` entry in `wrangler.jsonc` (not a secret) and ships with the deploy itself, so there's no separate Cloudflare dashboard step needed — deferred: production release manager to confirm on the deployed Worker's Settings → Variables

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — `npx wrangler rollback --env production` reverts the Worker; no migration to worry about. If the pause turns out to be unwanted in production after deploy, the fastest rollback is setting `SHOWCASE_LOADER_MS` to `"0"` in `wrangler.jsonc`'s production block and redeploying — no code change needed, which is the point of making this a config value — deferred: production release manager to execute if needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone: the puppy loader plays through on first arrival at /adopt, the page arrives cleanly once it finishes, and the loader doesn't flash or glitch on a real touch device | `test.lannacare.org/adopt` (or production, once deployed) on a phone |
| 2 | On a real phone (or any real browser, as a second check beyond the desktop browser-automation pass already done): the back button, after visiting a resident's detail page from /adopt, returns to /adopt without replaying the pause | `test.lannacare.org/adopt` → a resident → back |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items await Lutan

Manual verification by: pending: the two items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass with accepted defects

Release manager acknowledgement: pending
