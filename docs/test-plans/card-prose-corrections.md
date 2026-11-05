# Feature test plan — card-prose-corrections

## Header

| | |
|---|---|
| Feature | Correct stale card prose: comments in cards.ts and the Who does what Details page, the website card report, a note in roles-draft/resolve.ts |
| Backlog item | `docs/backlog.md` → **FIVE PLACES STILL DESCRIBE CARDS AS THEY WERE BEFORE `0261`** (`#3cqd9`) |
| Branch / worktree | `claude/card-prose-corrections` @ `C:\Development\Animal_Shelter_card-prose-corrections` |
| Dev server | not started — comments and docs only, nothing renders differently |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | `7518eeda` (docs/backlog.md and this plan committed after) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — prose describing a role as cards plus extras, and Residents as bundling `photos.resident_publish`, now describes the post-0261 world
- [x] Files/areas touched listed — `src/lib/permissions/cards.ts` (comments), `src/app/admin/who-does-what/details/page.tsx` (comment), `src/lib/roles-draft/resolve.ts` (comment), `docs/card-reports/website.md`, `docs/decisions/2026-11-05-card-prose-corrections.md`, `docs/backlog.md` (tick)
- [x] Cards affected identified — none: no behaviour changed; admin and signed-out unaffected
- [x] Anything explicitly **out of scope** written down — the roles-draft JSON labels are left as history; the walkthrough was already correct (generated); see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, read from the output file:

```
=== gates: typecheck exited 0 after 86s
=== gates: lint exited 0 after 173s
=== gates: test exited 0 after 48s
=== gates: build exited 0 after 310s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: comments and docs only, no runtime change
- [ ] Data persists — n/a: no data touched
- [ ] Create / edit / delete all exercised — n/a: no data touched
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a: comments only |
| signed out | nothing changed | unchanged | n/a: comments only |

- [ ] Every login above tested — n/a: no access rule changed; `check-hard-coded-security.mjs` still prints "no coded security outside the Admin bypass"
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings — n/a: no strings changed
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles `details/page.tsx` and `cards.ts`; `gen-card-walkthrough.mjs` re-run produced no content change
- [ ] Any shared file touched checked from a second page — n/a: only comments changed in the shared files
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#3cqd9`, with what was found already correct and what was left
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-05-card-prose-corrections.md`
- [x] `README.md` still accurate — it does not describe extras
- [ ] **Release notes.** — n/a: comments and internal docs only, nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Residents bundle was read at `cards.ts` (no `photos.resident_publish`), `0261`'s header was read, and the walkthrough claim comes from re-running its generator

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: comments and docs only; revert the commit, nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

Manual verification by: n/a: no UI surface, comments and docs only

Result: pass
