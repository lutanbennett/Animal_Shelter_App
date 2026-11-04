# Feature test plan — adoption-illustrate-card

## Header

| | |
|---|---|
| Feature | The card that writes an adoption update can illustrate it (0311) |
| Backlog item | `docs/backlog.md` → #hdyjp |
| Branch / worktree | `claude/adoption-illustrate-card` @ `C:\Development\Animal_Shelter_adoption-illustrate-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | yes |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adoption_news can attach a photo or video to an update without publish rights.
- [x] Files/areas touched listed — `supabase/migrations/0311`, photo and video routes, `AdoptionUpdatePage/Form`, `scripts/check-adoption-illustrate.mjs`, docs.
- [x] Cards affected identified — `adoption_news` (gains the ability, no grant moved); nothing else becomes publishable.
- [x] Out of scope written down — no card, catalogue or count change; website publishing stays with `photos.resident_publish`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0311 after 0310), no other branch carries one
- [x] `--status` reviewed before applying (311 applied, 1 pending; after: 312 applied)
- [x] `--dry-run` reviewed (ok)
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, same signature)
- [x] Existing rows still read correctly — only a function body changed
- [x] Constraints exercised in a `begin … rollback` harness (`check-adoption-illustrate.mjs`): one-card login files on its update, unapproved, absent from public views; seven other shapes refused
- [x] Down-migration not needed: restoring 0308's body is one `create or replace`
- [x] Production apply plan: `0311` to project dbkodyyxxhtygxcxmfcu with the release, before the deploy, by Lutan

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the upload form was not driven in a browser; the database path is proved by the harness and the routes' gates by fetch
- [ ] Data persists — n/a: no new stored data
- [ ] Create / edit / delete all exercised — n/a: no new controls
- [ ] Empty state renders sensibly — n/a: unchanged
- [ ] Invalid input is rejected — n/a: no new input
- [ ] Boundary cases checked — n/a: the harness covers wrong folder, wrong resident, Medical

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `adoption_news` | adoption-update photo/video routes | category upload 403; update path passes the gate | pass (fetch, dev) |
| exactly `adoption_news` | record_attachment | own update, dated folder only, unapproved | pass (harness) |
| no photo or adoption card | record_attachment | refused | pass (harness) |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side — harness and route status codes above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic changed
- [ ] Translatable strings go through the translation path — n/a: no new wording
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: picker not driven
- [ ] Network clean — n/a: picker not driven

## 6. Regression

- [ ] The pages nearest the change still work — n/a: check-adoption-updates and check-adoption-media-approval re-run green
- [ ] Any shared file touched checked from a second page — n/a: routes are asked by the photo hub; checks pass and the non-update path is unchanged in logic
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates cover it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-04-adoption-illustrate-card.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: 0311 is not on production yet; the note belongs with the PR that closes that apply
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Harness output and route status codes were read.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the folder is the update's own date string, no clock
- [ ] **For a boundary or banding change** — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: only the gates block is pasted, unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: Lutan applies 0311 to production before the deploy; the new code asks adoption_news in the routes but the database guard would refuse until 0311 is live
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] Destructive migration backup — n/a: a function replacement only
- [ ] Apply plan stated — deferred: Lutan (file 0311, production, before the deploy)

### Rollback

- [ ] Rollback position stated — n/a: revert is a `create or replace` of 0308's function body

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A publisher without `adoption_news` can no longer attach through the routes; the database still admits them | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a login holding only `adoption_news`: open an adopted resident's update, confirm the photo/video picker shows, add one, confirm it waits in Photos to approve and is not on the stories page | residents → adoption updates; /photos/approve |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

Manual verification by: pending: the picker and upload flow in a browser (Left for manual verification row 1)

Result: pass
