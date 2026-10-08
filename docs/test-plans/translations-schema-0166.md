# Feature test plan — translations-schema-0166

## Header

| | |
|---|---|
| Feature | Schema half of "One place to translate everything": Thai columns for the labels that had none (diets first), a label registry with an English snapshot, a reader and writer for the Translations page, recurring jobs in the prose queue |
| Backlog item | `docs/backlog.md` → **One place to translate everything** (left open, status note added) |
| Branch / worktree | `claude/translations-schema-0166` @ `C:\Development\Animal_Shelter_translations-schema-0166` |
| Dev server | not started — no screen reads the new columns until batch 79; the one visible change needs `0166` applied to dev, which happens at merge |
| PR | see the PR this plan is in |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | yes — `0166_label_translations.sql` |
| Tested at SHA | `99037afb` (after sync with `origin/main` `c827c8a9`, already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's piece (2), "add the missing Thai fields … starting with diets", plus the storage the item's piece (1) asked to be decided in the decision file
- [x] Files/areas touched listed — `supabase/migrations/0166_label_translations.sql`; `src/lib/i18n/dictionaries/en.ts` and `th.ts` (two field names); `src/lib/releases.ts`; `docs/backlog.md` (status notes); `docs/decisions/2026-10-08-label-translations-schema.md`; this plan
- [x] Roles affected identified — Management and anyone holding `translations.view` / `translations.manage` see recurring jobs on the Translations page once applied. No other role sees a change: no screen reads the new columns. The nine views keep their filters and grants
- [x] Anything explicitly **out of scope** written down — the page, the Thai field on each list's screen, every reader showing Thai, the permissions catalogue note and the manual are batch 79. Resident breed and colour are a new backlog item (public views)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `c827c8a9`, already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly (`exit 0`), output redirected to a file:

```
=== gates: build exited 0 after 173s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit; ticked from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0166` against highest `0165`; the brief names this as the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 165 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0166_label_translations.sql … ok`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: not yet — applied only when Lutan says merge, and this line is ticked in that commit
- [x] File is re-runnable — the whole file ran **twice** in one transaction on dev, then rolled back: `RERUN-OK labels=18 sources=88 recurring=18` (no duplicates on the second run)
- [x] Existing rows still read correctly after the change — every view rewritten from its latest migration text with one trailing column; `check-view-write-grants.mjs`: 292 statements, 0 failed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev, signed in as a Management login and then a Staff login (`request.jwt.claims`). Results:
  - Management: `label_translations()` returns 195 rows across every group; "Standard Kibble + Chicken" is `missing`
  - `set_label_th('diet_types', …, 'name', 'อาหารเม็ดมาตรฐาน + ไก่')` returns true, status becomes `current`, and `picker_diet_types.name_th` shows the Thai
  - English renamed afterwards with the Thai untouched → `stale`
  - an unregistered column (`diet_types.unit`) and an unregistered table (`residents.name`) are refused: "not a translatable label"
  - a row id that does not exist → false
  - 18 recurring job rows in `translation_queue`, labelled "Recurring job · …" and linked to `/management/recurring-jobs`
  - Staff: reads the 195 rows (holds `translations.view`, as for prose) but `set_label_th` is refused: "translations.manage is required to translate a label"
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive (nullable columns, two new tables, functions, triggers, views gaining a trailing column). The one data write is the recurring-jobs backfill of `pending` rows, which `drop_translations` style cleanup would remove with the registry rows if ever needed
- [x] Production apply plan stated for the release manager — `0166` on `dbkodyyxxhtygxcxmfcu` with the next release. Its `-- consumer:` header names the Translations page, which reads it on apply (recurring jobs appear in the queue), and the batch 79 screens

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface reads the new columns yet; the database path is exercised in §3
- [ ] Data persists — n/a: no UI surface; persistence of a Thai label and its snapshot asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; write, clear-by-English-change and refusal exercised in §3
- [ ] Empty state renders sensibly — n/a: no UI surface; every new column is null today, which is what every screen already sees
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the function refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; blank Thai (cleared), missing row and unregistered column are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | label reader and writer | as Management | n/a — holds `translations.manage` as Management does; not run separately |
| management | `label_translations()`, `set_label_th()` | read and write | pass — §3 harness |
| staff | `label_translations()` | read only | pass — reads, write refused |
| vet | views only | unchanged | n/a — no vet policy changed; `check-view-write-grants` ran every role |
| volunteer | nothing new | unchanged | n/a — no translations permission |
| signed out | `public_site_content_photos` | gains `alt_th`, public as `alt` is | pass — `check-app-access-gate.mjs` HARNESS-OK on dev before apply; re-run after apply is deferred with the apply |

- [ ] Every role above tested — n/a: Admin and Vet not run separately; no policy on an existing table changed, and the new functions ask permissions, not roles (`check-new-policy-role-names.mjs`: ok)
- [x] A role that should not have access is blocked server-side — Staff's write refused in §3; `check-policy-role-names.mjs` GREEN

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the Translations topic is batch 79's, when the page changes; recurring jobs joining the queue needs no new instruction
- [x] Translatable strings go through the translation path — the two new field names are in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: no new UI
- [ ] Browser console clean — n/a: no new UI
- [ ] Network clean — n/a: no new UI

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of the nine views; the views only gain a trailing column
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the dictionaries gained two keys and nothing else
- [x] Nothing merged from `main` during `sync` was broken by this branch — already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, as the brief says; status note added. Searched the backlog for `thai`, `_th`, `translat`, `diet`, `frequency`: F-11's "Thai names for immunization, procedure and blood-test types" is partly closed and noted as such
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-label-translations-schema.md` (the audit, storage kept, the snapshot, optional lists, views changed and not)
- [x] `README.md` still accurate — it does not list these columns or the translations plumbing
- [x] **Release notes.** — `unreleased` gained "Recurring job titles and descriptions now wait on Management → Translations …"
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — columns from `information_schema`, sample labels from dev rows, the views from `pg_depend`, behaviour from the harness

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
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads `alt_th` yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — only the two dictionary labels for recurring jobs, which are harmless without the migration (an unused key). The batch 79 feature will read the columns, so `0166` must be on production before it deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0166` on production with the next release, any time before the feature half deploys

### Rollback

- [x] Rollback position stated — code rollback via the Pi `--ref` does not revert `0166`, and does not need to: older code ignores the columns, the trailing view columns and the two functions; recurring jobs would stay in the queue, which older code shows with the raw field name

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Resident breed and colour have no Thai and are shown publicly | deferred to backlog — needs the two public resident views changed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After `0166` is applied to dev: recurring jobs appear on Management → Translations with "Recurring job title" / "Recurring job description" and a working link | `/management/translations` on the dev server |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 can only be looked at once `0166` is applied to dev at merge

Manual verification by: n/a: the one visible change appears only after 0166 is applied to dev at merge; item 1 above is the handover

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
