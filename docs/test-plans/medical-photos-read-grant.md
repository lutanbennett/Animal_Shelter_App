# Feature test plan — medical-photos-read-grant

## Header

| | |
|---|---|
| Feature | Grant `photos.resident_medical` (read) to the Add medical photos card |
| Backlog item | `docs/backlog.md` → **Add medical photos should also see medical photos** (ticked) |
| Branch / worktree | `claude/medical-photos-read-grant` @ `C:\Development\Animal_Shelter_medical-photos-read-grant` |
| Dev server | not started — no code change |
| PR | see PR description |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | yes — `0279_add_medical_photos_reads_medical_photos.sql` |
| Tested at SHA | tip of this branch after sync |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `card_grants` row: Add medical photos reads Medical photos
- [x] Files/areas touched listed — `supabase/migrations/0279_*.sql`, `docs/backlog.md`, `docs/decisions/2026-10-28-add-medical-photos-reads-medical-photos.md`, this plan
- [x] Roles affected identified — roles holding the `add_medical_photos` card gain the Medical folder read; nothing is removed from anyone
- [x] Anything explicitly **out of scope** written down — no app or policy change; write access untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `check-migration-numbers`: ok, 0279 against highest 0278
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 279 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0279 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0279_… ok`
- [x] File is re-runnable — `on conflict (card, activity) do update`
- [x] Existing rows still read correctly after the change — additive single row; no table or policy altered
- [ ] Constraints and defaults exercised against real rows — n/a: one upsert into an existing table; no new constraint exists
- [x] Down-migration not needed: deleting the one row restores the previous behaviour
- [x] Production apply plan stated — `0279` on `dbkodyyxxhtygxcxmfcu` with the next release, any time (`consumer: none`)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no signed-in browser check run; the app already asks `photos.resident_medical` and the grant is the only change
- [ ] Data persists — n/a: no UI surface changed
- [ ] Create / edit / delete all exercised — n/a: no UI surface changed
- [ ] Empty state renders sensibly — n/a: no UI surface changed
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | n/a — outside the card system |
| management | n/a | unchanged | n/a — no grant to them changed |
| staff | n/a | retired | n/a |
| doctor | n/a | unchanged | n/a |
| volunteer | n/a | unchanged | n/a |
| signed out | nothing | nothing | n/a — no policy changed |

- [ ] Every role above tested — n/a: only the `add_medical_photos` card's grants changed; no browser session driven
- [ ] A role that should not have access is blocked server-side — n/a: no policy changed; `attachments_select_perm` untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: none added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed; build gate passed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — reverses `0276` note 4
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: production still needs `0279` applied before any user would see it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — mechanism read from `0276`'s source

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates line above is verbatim
- [ ] Public pages re-checked — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and code that reads it in one PR? No: `consumer: none`; the code already exists on `main`
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive, one row
- [x] Apply plan stated — `0279` on production with the next release

### Rollback

- [x] Rollback position stated — delete the one `card_grants` row via a new migration; code rollback does not revert it and does not need to

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI change; behaviour follows existing `can()` checks | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: committed in the branch and linked from the PR
- [ ] Handed to the production release manager — n/a: not yet, release time

Result: pass

Release manager acknowledgement: n/a: not yet released
