# Feature test plan — inline-edit-refresh

## Header

| | |
|---|---|
| Feature | Investigate "inline-edited rows show stale data until reload"; closed as not reproducible, no code change |
| Backlog item | `docs/backlog.md` → Mobile → **Inline-edited rows show stale data until reload.** |
| Branch / worktree | `claude/inline-edit-refresh` @ `C:\Development\Animal_Shelter_inline-edit-refresh` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | #88 |
| Tested by / date | Claude, 2026-09-24 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | browser checks on `c50a13b` plus temporary uncommitted control edits (below); gates on `789f537` (synced tip) plus this PR's docs |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item asked for `refresh()` in seven actions files to fix a stale row after a button-driven save; measured, the stale row does not occur on Next 16.3.5, so the item is closed with a `docs/decisions.md` entry and no code change. Lutan chose this over shipping the one-liners anyway (in chat, 2026-09-24)
- [x] Files/areas touched listed: `docs/backlog.md` (tick), `docs/decisions.md` (entry), this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Roles affected identified: none; no code changed. The pages investigated are admin/management only
- [x] Out of scope: `src/app/management/contacts/actions.ts` is the `contacts-archive` stream's today and was not touched or tested. The four actions that already call `refresh()` (procedure-types, blood-test-types, security, diets) keep it; removing it is not part of this item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (fast-forward to `789f537`, #86)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 147s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three): `check` and `test-plan` both passed on #88 at `cd2b9a0`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The check here is the bug itself, run as a control: with `refresh()` taken
**out**, does a button-driven save leave the row stale? Driven in the browser
pane on `next dev` at :3003, signed in as admin, after restarting the dev
server so it was certainly serving the edited actions. Both control edits
were reverted afterwards (`git status` clean apart from this PR's docs).

| Page | `refresh()` | Action (table button) | Row updated without reload? |
|---|---|---|---|
| `/admin/zones` | removed | rename `ZZ Refresh Test` → `ZZ Renamed Stale` (before the server restart) | yes |
| `/admin/zones` | removed, fresh server | rename → `ZZ Control Two` | yes; one POST, no follow-up GET |
| `/admin/zones` | removed, fresh server | delete `ZZ Control Two` | yes, row gone (16 rows) |
| `/admin/procedure-types` | removed | rename `Ear cleaning` → `Ear cleaning ZZ` | yes |
| `/admin/procedure-types` | removed | rename back → `Ear cleaning` | read at 5 s: still `Ear cleaning ZZ`; a reload showed `Ear cleaning` saved. Not re-read before navigating, so stale vs slow is unknown |
| `/admin/procedure-types` | removed | rename → `Ear cleaning A`, read at 10 s | yes |
| `/admin/procedure-types` | removed | rename → `Ear cleaning B`, read at 10 s | yes |
| `/admin/procedure-types` | removed | rename back → `Ear cleaning`, read at 10 s | yes |

- [x] Happy path works end to end: every save read at 8–10 s had updated in place without `refresh()` (table above)
- [x] Data persists — reload the page and the change is still there: `/admin/procedure-types` reloaded after the ambiguous reading showed the saved value
- [x] Create / edit / delete all exercised: create through the zones form (a `<form action>`, not the path in question), rename and delete through the table buttons
- [ ] Empty state renders sensibly — n/a: no code changed
- [ ] Invalid input is rejected with a readable message — n/a: no code changed
- [ ] Boundary cases checked — n/a: no code changed. The one ambiguous reading is recorded in the table rather than ticked

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no code changed | n/a |
| management | n/a | no code changed | n/a |
| staff | n/a | no code changed | n/a |
| vet | n/a | no code changed | n/a |
| volunteer | n/a | no code changed | n/a |
| signed out | n/a | no code changed | n/a |

- [ ] Every role above tested — n/a: no code changed, so no access changed
- [ ] A role that should not have access is blocked server-side — n/a: no route or action changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: no behaviour changed
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI changed
- [ ] Browser console clean — n/a: no UI changed
- [ ] Network clean — n/a: no UI changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed; the test rows were deleted and the renamed procedure type restored to `Ear cleaning`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only docs touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates ran at the synced tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, annotated as closed not reproducible
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why no `refresh()` was added, the evidence, and what to check first if a row really does go stale
- [ ] `README.md` still accurate — n/a: README does not describe server-action refreshing
- [ ] **Release notes.** n/a: no code changed, so no shelter user sees any difference
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts, the single-POST observation and the 5 s / 10 s readings are from the runs above; the docs quote is from `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`; the four files that keep `refresh()` were grepped. The entry says it was measured on `next dev` only

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the next production release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the next production release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed bundle changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates handled
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or banding logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block is the closing lines of the run's log
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR changes nothing that is deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: this PR changes nothing that is deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Nothing is deployed or migrated

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found; the reported defect did not reproduce | — |

## Left for manual verification

None: no code changed, so there is nothing for a person to look at.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no code changed; the browser checks were driven by Claude and are signed above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR (#88 description)
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed

Result: pass

Release manager acknowledgement: n/a: nothing deployed
