# Feature test plan — hero-photo-shelter-scope

## Header

| | |
|---|---|
| Feature | #h3ro9: `set_hero_photo()` and `approve_website_draft()` write only the request's shelter |
| Backlog item | `docs/backlog.md` → #h3ro9 (ticked) |
| Branch / worktree | `claude/hero-photo-shelter-scope` @ `C:\Development\Animal_Shelter_hero-photo-shelter-scope` |
| Dev server | not started — no UI surface changed |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-21 |
| Carries a migration? | yes — `0432_definer_setters_scoped.sql` |
| Tested at SHA | `3bf901cbb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two definer setters now scope their writes to the request's shelter
- [x] Files/areas touched listed — `0432`, `supabase/harness/hero_photo_scope.sql`, decision file, backlog tick, this plan
- [x] Roles affected identified — none by role; the checks still ask `website.gallery` and `website.approve`
- [x] Anything explicitly **out of scope** written down — `src/`, `HeroPhoto.tsx`, `check-hard-coded-security.mjs` and the public views are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0432`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 433 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0432 … ok`
- [x] File is re-runnable — `create or replace`
- [x] Existing rows still read correctly after the change — no data touched
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`supabase/harness/hero_photo_scope.sql`), ending `HARNESS OK hero scope`: set and clear touch only the request's shelter, no header writes nothing, a draft on another shelter cannot be approved, own draft changes only own row, a shelter with no row changes nothing
- [x] Down-migration written, or the reason one is not needed is stated — in the file header
- [x] Production apply plan stated for the release manager — with the next release; additive `create or replace`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface changed; the harness runs both call paths
- [ ] Data persists — n/a: no UI surface; asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: set, clear and approve are in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; refusal keys unchanged
- [ ] Boundary cases checked — n/a: covered in the harness (no header, row-less shelter)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed in, `website.gallery` / `website.approve` | own shelter's hero and drafts | writes only that shelter | pass — harness |

- [ ] Every role above tested — n/a: access classes, not app roles; no card changed (`check-card-grants` ok)
- [ ] A role that should not have access is blocked server-side — n/a: the permission checks are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in `src/` changed; the call signatures are identical
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — #h3ro9
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-21-hero-photo-shelter-scope.md`
- [x] `README.md` still accurate — unaffected
- [ ] **Release notes.** — n/a: nobody sees this until there are two live shelters
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — harness run on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output
- [ ] Public pages re-checked after a cache purge — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no code change; existing callers keep their signatures
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: function bodies only
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — re-run 0351's `set_hero_photo` and 0315's `approve_website_draft`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `set_hero_photo` updated every shelter's row | fixed — 0432 |
| 2 | high | `approve_website_draft` read drafts and wrote `site_content` and `site_pages` across shelters | fixed — 0432 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
