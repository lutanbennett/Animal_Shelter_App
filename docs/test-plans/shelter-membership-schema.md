# Feature test plan

## Header

| | |
|---|---|
| Feature | One main role per shelter, not per login (schema half of #acwho) |
| Backlog item | `docs/backlog.md` → #acwho (NOT ticked: this is half of it) |
| Branch / worktree | `claude/shelter-membership-schema` @ `C:\Development\Animal_Shelter_shelter-membership-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: opened after this plan |
| Tested by / date | Claude, 2026-11-25 |
| Carries a migration? | yes — 0443 |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the one-main-role index becomes per shelter, and the callers that assumed one main role per login are made to name their shelter.
- [x] Files/areas touched listed: `supabase/migrations/0443_one_main_role_per_shelter.sql`, `supabase/harness/0443_one_main_per_shelter.sql`, `src/app/admin/security/actions.ts`, `src/app/platform/access-actions.ts`, `src/app/platform/actions.ts` (comment), `src/lib/i18n/dictionaries/{en,th}.ts`, `scripts/check-user-roles-aal2.mjs`, decision file.
- [x] Cards affected identified: none added or changed; no card grants anything different. Admin bypass untouched. Signed-out public unaffected.
- [x] Out of scope written down: the Access tab (console stream), access requests from a person already at another shelter; both in the decision file.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (gates below ran on the tree just before that merge, which brought other streams' already-gated work)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`:

```
=== gates: typecheck exited 0 after 36s
=== gates: lint exited 0 after 151s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 142s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0442), and no other in-flight branch carries one (`check-migration-numbers.mjs`: ok)
- [x] `--status` reviewed before applying (444 applied, 1 pending)
- [x] `--dry-run` reviewed (0443 ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`drop index if exists` then `create unique index if not exists`; `create or replace` for functions)
- [x] Existing rows still read correctly after the change — the harness asserts no login holds two main rows on dev today and that `user_roles.shelter_id` is not null
- [x] Constraints exercised in a `begin; … rollback;` harness (`supabase/harness/0443_one_main_per_shelter.sql`, ends `HARNESS OK 0443`): one login with a main role in two shelters; a second main role in the same shelter refused (unique_violation); an additional role refused when the main role is only in another shelter; Admin refused as additional by flag; `my_shelters()` lists both; Admin at A does not leak into B's `my_permissions()`; one login Admin at both shelters sees each shelter's own row, role and `app_users` answer; anon reads nothing (claims set to `role=anon`; anon holds no grant at all); `product_admin_access_add` adds a login that already has a main role elsewhere and a second add in the same shelter re-roles rather than duplicating
- [x] Down-migration: stated in the file header (recreate the per-login index while nobody holds two main roles; restore the 0196 guard and 0438/0421 bodies)
- [ ] Production apply plan — pending: the release manager applies 0443 to `dbkodyyxxhtygxcxmfcu` with the next release; additive and safe before the deploy

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface changes until the console stream; the database path is proved by the harness
- [ ] Data persists — n/a: no new UI; rows are asserted in the harness
- [ ] Create / edit / delete — n/a: no UI surface, harness covers add, re-role
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no new input; refusals are asserted in the harness
- [ ] Boundary cases — n/a: no UI; the same-shelter second main role is the boundary and is asserted

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no change; the Admin bypass is untouched | n/a: no page changed |
| exactly one card | n/a | no card grants anything different | n/a: no page changed |
| signed out | n/a | anon reads no user_roles rows | harness: pass |

- [ ] Every login above tested — n/a: no page or card changed; the database matrix is in the harness
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none added
- [ ] Manual — n/a: nothing a user can see changes
- [x] Translatable strings go through the dictionary: two refusal messages reworded in en and th; `check-thai-dictionary.mjs` reports every entry translated
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] Nearest pages: the shelter's Security page code path (`archiveUser`, `restoreUser`, `setMainRole`, `addExtraRole`) now names its shelter; covered by typecheck, lint and unit tests, not by a driven press — see Left for manual verification
- [ ] Shared file touched checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates run on the merged tree)

## 7. Documentation

- [ ] Backlog item ticked — n/a: #acwho is half done; the console stream closes it
- [x] Decision recorded: `docs/decisions/2026-11-25-one-main-role-per-shelter.md`, with the caller table and the console specification
- [x] `README.md` still accurate (no change needed)
- [ ] **Release notes.** n/a: nothing a user can see until the console stream ships
- [x] Commit messages say why
- [x] Claims in commit messages and decisions were measured: the unique-index, guard and `my_permissions` behaviour were run in the harness on dev, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: not a threshold change
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is a real run
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` ref read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR? — deferred: release manager; yes, the production apply of 0443 goes before the deploy, which is safe because the code works with either index
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: the migration rewrites no data; it replaces an index and three functions
- [ ] Apply plan stated — deferred: release manager; 0443 to `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; additive, safe to leave. The index only becomes un-revertable once someone holds a main role in two shelters

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high, found by the search | `archiveUser` and `restoreUser` updated `user_roles` by `user_id` only: with a login at two shelters they would archive or restore it at both | fixed in this PR (shelter condition) |
| 2 | medium | the additional-role guard looked for a main role in any shelter, and Admin by key | fixed in 0443 |
| 3 | low | a person at one shelter asking to join another is invisible to its request queue | deferred to the console stream (specified in the decision) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Archive then restore a login on the shelter's Security page and confirm only this shelter's row changed (needs a login holding a role at two shelters) | after the console stream, or on dev with `--shelter` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the archive/restore press in the list above

Manual verification by: pending: the one press listed under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: at release time

Result: pass

Release manager acknowledgement: pending: at release time

**Tail:** decision file `docs/decisions/2026-11-25-one-main-role-per-shelter.md`. Left for the console stream: the Access tab (additional roles, a note for a person who works at several shelters, requests from a person already at another shelter). `#acwho` stays open.
