# Feature test plan

## Header

| | |
|---|---|
| Feature | Public read enumeration: what anon reads, and what carries its approval state |
| Backlog item | `docs/backlog.md` → `#7aev4` (its one stream-sized piece; the item is NOT ticked) |
| Branch / worktree | `claude/public-read-enumeration` @ `C:\Development\Animal_Shelter_public-read-enumeration` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not needed: no UI change) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (Opus 5.5), 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 149f5200 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a docs-only enumeration of the 21 public views, each classified by what carries its content's approval state, written to `docs/decisions/2026-11-09-public-read-enumeration.md`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — two new files only: the decision file and this plan. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — no card's behaviour changes. The report names `residents` (the only card granting `resident.record` at edit, measured on dev) as able to reach the profile-photo fail-open; that is a finding, not a change
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the flag itself, any schema, any view change, the fix for the profile-photo fail-open, production reads; all listed in the decision file's "What this did not do"

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge `149f5200`, `docs/backlog.md` only)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every one 0, run at `149f5200`:

```
=== gates: typecheck exited 0 after 224s
=== gates: lint exited 0 after 460s
=== gates: test exited 0 after 68s
=== gates: build exited 0 after 410s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the brief forbids one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: nothing changed in the database
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — not for a migration but for a finding: on dev, a `do $$` block set one resident's `profile_photo_drive_file_id` to an id with no `attachments` row, switched to `anon`, and raised with what anon saw. Asserted: `public_resident_cards` returned the id and `is_public_drive_file()` returned true (`PROBE cards=enum-probe-no-attachment-row is_public=t`). Re-counted after: 0 rows carry the probe id, so nothing persisted
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the enumeration's inputs ran: `node scripts/check-public-views.mjs` on dev exit 0 (473 ok, 3 skips for missing probe data); every anon-readable relation and function listed from the dev catalogue and every view definition read with `pg_get_viewdef`
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no write
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has none
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input or computation added

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page changed | n/a: no page changed | n/a: no page changed |
| signed out | the 21 public views, 4 functions | exactly those, nothing else | matches (dev catalogue and `check-public-views.mjs`) |

- [ ] Every login above tested — n/a: no access changed; the signed-out row is a reading of the catalogue, recorded above
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access changed by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user does changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no source changed; the build gate covers the tree
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only `docs/backlog.md`, and the gates ran on the merge commit

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: `#7aev4` stays open by the brief's instruction (its build waits on Lutan's three numbers); the replacement note is in the PR body for the planner
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-09-public-read-enumeration.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a shelter user would notice; a docs-only enumeration
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every claim in the decision file is marked [measured] or [judgement]; the measured ones were read on dev on 2026-11-09 (view definitions, column privilege, update policy, card grants, the rollback probe)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs-only; nothing to deploy
- [ ] Deployed SHA matches the tested SHA — n/a: docs-only; nothing to deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs-only; nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs-only; nothing to deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: no deploy evidence; the gates block above is pasted from the run
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: docs-only; nothing to deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: docs-only; nothing to deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — n/a: docs-only; reverting the commit removes two documents and changes nothing that runs

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Found, not caused, by this PR: the three profile-photo views fail open, and `residents.profile_photo_drive_file_id` is directly writable with `resident.record` edit, so that card's holder can put any non-video Drive file on the public web (decision file §3.1) | deferred to backlog: for the planner to file; this stream may not change a view |
| 2 | medium | Found, not caused: the resident edit form sets `is_public_visible = ready_for_adoption` on every save (`src/app/residents/[id]/edit/actions.ts:200`), the equality shape `#7aev4` warns against (decision file §4) | deferred to backlog: for the planner to put beside Lutan's ready/visible counts |

## Left for manual verification

Empty: the change is two documents with no surface a person needs to look at.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: docs-only enumeration, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: docs-only; nothing ships to production

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs-only, nothing deployed
