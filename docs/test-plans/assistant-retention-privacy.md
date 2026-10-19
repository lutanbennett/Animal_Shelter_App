# Feature test plan — assistant-retention-privacy

## Header

| | |
|---|---|
| Feature | App half of assistant retention (DB-11): the /privacy notice and the manual say typed requests are kept 2 days, or 90 days when unanswered |
| Backlog item | `docs/backlog.md` → **Assistant retention (DB-11)** (ticked) |
| Branch / worktree | `claude/assistant-retention-privacy` @ `C:\Development\Animal_Shelter_assistant-retention` |
| Dev server | `node scripts/worktree.mjs dev` on :3003 |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | no — the schema half was #749 (`0227`) |
| Tested at SHA | `b9115e66` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a retention paragraph on /privacy in English and Thai, and the manual's assistant topic corrected
- [x] Files/areas touched listed — `src/lib/i18n/dictionaries/en.ts` and `th.ts` (privacy block), `src/lib/manual/en.ts` (assistant topic), `docs/backlog.md`, this plan
- [x] Roles affected identified — everyone who reads /privacy (public) and the manual
- [x] Anything explicitly **out of scope** written down — the assistant's features; the schema (merged as #749)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0227 applied with #749)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; but see section 8, this text is only true once 0227 is on production

## 4. Functional checks

- [x] Happy path works end to end — dev server on :3003: `/privacy` renders the new paragraph in English
- [ ] Data persists — n/a: static text
- [ ] Create / edit / delete all exercised — n/a: static text
- [ ] Empty state renders sensibly — n/a: static text
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /privacy, manual | sees new text | n/a — same public page and same manual for all |
| management | /privacy, manual | sees new text | n/a — as above |
| staff | /privacy, manual | sees new text | n/a — as above |
| vet | /privacy | sees new text | n/a — as above |
| volunteer | /privacy | sees new text | n/a — as above |
| signed out | /privacy | sees new text | fetched signed out on dev: paragraph present |

- [ ] Every role above tested — n/a: no permission involved; one public page and one manual topic
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated — assistant topic: a note and the warning line now say 2 days / 90 days / Admin-only
- [x] Translatable strings go through the translation path — both dictionaries; Thai fetched with the locale cookie and the paragraph rendered
- [ ] Mobile viewport (375px) — n/a: one more paragraph in an existing text column
- [ ] Browser console clean — n/a: not checked; no script or markup changed
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [x] The pages nearest the change still work — /privacy renders in both languages on dev; the build compiled every page
- [ ] Any shared file touched checked from a second, unrelated page — n/a: dictionaries are shared, but only the privacy block changed and the typecheck and locales test passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — DB-11 ticked; the companion Auth item was ticked in #749
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: recorded in `2026-10-19-assistant-retention.md` with #749
- [x] `README.md` still accurate — it does not describe retention
- [ ] **Release notes.** — n/a: the privacy sentence is true only once 0227 is applied on production, which the release itself does; no shelter user needs a note for a policy paragraph
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the page text was fetched from the running dev server in both languages

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates computed
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: none pasted
- [ ] Public pages re-checked after a cache purge — deferred: release manager (/privacy is a public page)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no migration here; the policy text depends on 0227 (#749), which must reach production in the same release or before
- [ ] `--env production --dry-run` — deferred: release manager (for 0227)
- [ ] Destructive migration backup — n/a: no migration in this PR
- [x] Apply plan stated — 0227 with this release; the dry-run shows whether production allows pg_cron

### Rollback

- [x] Rollback position stated — revert the text; nothing else depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The text is false on production until 0227 is applied there | deferred to backlog: release manager applies 0227 with this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the new paragraph reads naturally | /privacy in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is listed and stays pending on the signature line below

Manual verification by: pending: Thai wording read by a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
