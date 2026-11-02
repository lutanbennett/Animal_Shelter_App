# Feature test plan — resident-tags-schema

## Header

| | |
|---|---|
| Feature | Schema half of hashtags in resident notes: link table `resident_note_tags`, registry `resident_note_sources`, policies through `has_permission()` |
| Backlog item | `docs/backlog.md` → **#TAGS IN A RESIDENT'S NOTES LINK TWO RESIDENTS BOTH WAYS** (left open, schema half struck in place) |
| Branch / worktree | `claude/resident-tags-schema` @ `C:\Development\Animal_Shelter_resident-tags-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | #1194 |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | yes — `0299_resident_note_tags.sql` and `0300_resident_note_tags_owner_check_refuses_cleanly.sql` |
| Tested at SHA | `b7b48e53` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one link table keyed on note source, note row and column, from-resident and to-resident, with card-derived policies
- [x] Files/areas touched listed — `supabase/migrations/0299_*.sql`, `0300_*.sql`, `docs/decisions/2026-11-02-resident-tags-schema.md`, `docs/backlog.md` (strike), this plan. No `src/`
- [x] Roles affected identified — none see a change: nothing reads the new tables yet, and no existing policy or grant changed
- [x] Anything explicitly **out of scope** written down — the picker, the save that writes links, the Mentioned in list, dictionary and release note are the next stream's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `ce51eea9` already contained, nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0299` over `0298`; `0300` follows it in the same PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 299 applied, 0 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0299 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0299 … ok`, then `0300 … ok`
- [x] File is re-runnable — tables `if not exists`, functions `or replace`, policies and trigger `drop … if exists`, registry rows `on conflict do update`
- [x] Existing rows still read correctly after the change — additive: two new tables, three functions, no existing object altered
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev. Asserted: a login holding medical.visits and resident.record writes and reads a link in a clinic-visit note; a forged owner is refused (23514); a login with only resident.record can neither read nor write that link; the same login can use a resident-record note; a login with no relevant card reads nothing and cannot write; anon is refused. Result: `HARNESS-OK 0299 H1-H8`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive, and nothing reads the tables yet
- [x] Production apply plan stated for the release manager — `0299` and `0300` on `dbkodyyxxhtygxcxmfcu` with the next release, any time before the app half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads these columns yet
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; database refusals asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface, no code reads these columns yet

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | new tables | passes by is_admin() inside has_permission() | n/a — not exercised as a role; no code path yet |
| management | new tables | by cards held | n/a — cards, not roles, asserted in §3 |
| staff | nothing | retired | n/a — retired |
| doctor | new tables | by cards held | n/a — as management |
| volunteer | new tables | by cards held | n/a — as management |
| signed out | nothing | refused | anon refused in the §3 harness |

- [ ] Every role above tested — n/a: access is by card, proved per card combination in the §3 harness
- [ ] A role that should not have access is blocked server-side — n/a: proved at the database in §3 (H3, H4, H6, H7, H8)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, the app half writes it
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app file touched and no existing database object altered
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, schema half struck in place and the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-02-resident-tags-schema.md`
- [x] `README.md` still accurate — it lists no tables of this kind
- [ ] **Release notes.** — n/a: nothing a shelter user can see ships until the app half
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the manifest and activities were read from the live tables and policies, the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer:` names the app half's paths, which are not in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0299` then `0300` on production before the app half deploys

### Rollback

- [x] Rollback position stated — additive tables nothing reads yet, safe to leave; code rollback does not touch them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 0299's owner trigger raised an internal error (22004) for a login that cannot read the registry | fixed — 0300 refuses with 42501 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
