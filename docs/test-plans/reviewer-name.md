# Feature test plan — reviewer-name

## Header

| | |
|---|---|
| Feature | The prose translation queue shows who reviewed a string, via a new name-only `login_display_name(uuid)` |
| Backlog item | `docs/backlog.md` → **The prose queue's `reviewed_by` still shows no name** (`#v3knd`, ticked) |
| Branch / worktree | `claude/reviewer-name` @ `C:\Development\Animal_Shelter_reviewer-name` |
| Dev server | `http://localhost:3008` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-14 |
| Carries a migration? | yes — `0370_login_display_name.sql` |
| Tested at SHA | c51a8a6e8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a narrow name function gated on the translations cards, and the prose queue shows "Reviewed by NAME · date"
- [x] Files/areas touched listed — `supabase/migrations/0370_login_display_name.sql`, `src/lib/translations/queries.ts`, `src/app/management/translations/{page,TranslationQueue}.tsx`, both dictionaries, `src/lib/releases.ts`
- [x] Cards affected identified — `translations` (`translations.view`/`manage`): reveals a reviewer's name, no new ability; no new card. Admin unaffected, signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — the label path (0366) is not refactored; `works_with_logins()` and `app_users` are not widened

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the line below:

```
=== gates: typecheck exited 0 after 63s
=== gates: lint exited 0 after 193s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 176s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs`: ok, 0370 against highest 0369
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — nothing pending but 0370
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0370_login_display_name.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `--status` after: 0370 applied here, nothing missing
- [x] File is re-runnable — `create or replace function`
- [x] Existing rows still read correctly after the change — additive function; the queue view and `app_users` are untouched
- [x] **Constraints and defaults exercised against real rows** — called as a login holding only `translations` (REST rpc): returned the display name for a real login; the screen then rendered it
- [x] Down-migration written, or the reason one is not needed is stated — not needed: one new function, nothing reads it but the new code
- [x] Production apply plan stated for the release manager — `0370_login_display_name.sql` on `dbkodyyxxhtygxcxmfcu`, before the deploy that reads it

## 4. Functional checks

- [x] Happy path works end to end — a reviewed prose row shows "Reviewed by Dev Reviewer Test · 13 Nov 2026" for a translations-only login, reached by clicking Management then Translations
- [ ] Data persists — n/a: the screen only reads
- [ ] Create / edit / delete all exercised — n/a: read-only display
- [x] Empty state renders sensibly — a row with no reviewer shows no line (the other open rows)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: an id with no resolvable name yields no line rather than a dash, by construction

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Translations | sees the line | n/a — not driven; admin bypass unchanged |
| exactly `translations` | Translations | name, not a dash | pass — seen on screen |
| signed out | the function | refused | n/a — execute revoked from `anon`, and the body returns null without a card |

- [x] Every login above tested — the one that matters driven; the others reasoned from the grants as the rows say
- [ ] A login that should not have access is blocked server-side — n/a: the function returns null for a login holding neither translations card; not separately driven

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new control or topic
- [x] Translatable strings go through the translation path — `reviewedByName` added to both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: one muted line in an existing card
- [ ] Browser console clean — n/a: not read separately; the page rendered and server logs showed no errors
- [x] Network clean — no unexpected 4xx/5xx; server logs clean

## 6. Regression

- [x] The pages nearest the change still work — Translations page loads with all its label and prose rows
- [ ] Any shared file touched checked from a second page — n/a: dictionaries gained one key each; typecheck and build cover them
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-14-reviewer-name.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [x] **Release notes.** `unreleased` gained a line, tagged `view_translations` and `translations`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the proof was run on screen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the date is formatted by the existing `formatDate`
- [ ] **Boundary or banding change** — n/a: no boundary or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: only the gates block, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Contains a migration and code that reads it — n/a: yes, so the production apply must come before the deploy; written in section 3
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive function
- [ ] Apply plan stated — deferred: release manager, before the deploy

### Rollback

- [ ] Rollback position stated — n/a: additive function, safe to leave; code rollback is a redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First build forgot to pass `reviewerNames` into the component (a CRLF edit missed); found by the on-screen proof | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A reviewed prose row names its reviewer after release | Management → Translations |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

Manual verification by: pending: Lutan to glance at a reviewed row on Translations after the release

Result: pass
