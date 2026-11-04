# Feature test plan — adoption-media-approval

## Header

| | |
|---|---|
| Feature | An adoption-update photo or video waits for approval (0309) |
| Backlog item | `docs/backlog.md` → #7v6d0 |
| Branch / worktree | `claude/adoption-media-approval` @ `C:\Development\Animal_Shelter_adoption-media-approval` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | yes |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adoption-update files stop being approved on save.
- [x] Files/areas touched listed — `supabase/migrations/0309`, `scripts/check-adoption-media-approval.mjs`, `src/lib/releases.ts`, docs.
- [x] Cards affected identified — `approve_photos` (queue), `adoption_news`; the signed-out public sees less until approval.
- [x] Out of scope written down — no card and no policy changed; attaching without publish stays refused (decision file, deliverable 2).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — SYNC_NOTE
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0309 after 0308), no other branch carries one
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed (ok)
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`)
- [x] Existing rows still read correctly — the function only changes how new rows are stamped; no existing row is touched
- [x] Constraints exercised in a `begin … rollback` harness: unapproved file born for a non-publisher, absent from `public_adoption_updates` and the proxy, non-approver refused, approval publishes only that file, script filing still approved
- [x] Down-migration not needed: restoring 0224's body is the revert and is one `create or replace`
- [x] Production apply plan: `0309` to project dbkodyyxxhtygxcxmfcu with the release, before the deploy, by Lutan

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the upload form was not driven in a browser; the database behaviour is proved by the harness (see Left for manual verification)
- [ ] Data persists — n/a: no new stored data
- [ ] Create / edit / delete all exercised — n/a: no new controls
- [ ] Empty state renders sensibly — n/a: the queue and its empty state are unchanged
- [ ] Invalid input is rejected — n/a: no new input
- [ ] Boundary cases checked — n/a: no new input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | not driven |
| exactly `approve_photos` | /photos/approve | unchanged | not driven in a browser |
| signed out | public stories | sees only approved files | harness |

- [ ] Every login above tested — n/a: only the non-approver and signed-out cases are covered, by the harness
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed; the harness shows a non-approver cannot approve

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic changed
- [ ] Translatable strings go through the translation path — n/a: no new wording
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed other than the release note
- [ ] Any shared file touched checked from a second page — n/a: only `releases.ts` (a data list) changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates cover it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-04-adoption-media-approval.md`
- [x] `README.md` still accurate
- [x] **Release notes.** A line was added to `unreleased` in `src/lib/releases.ts`, tagged to the `adoption_news` and `approve_photos` cards, saying a shared update shows nothing until approved and that the earlier video note holds only after approval.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The harness failed before 0309 and passed after.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [ ] **For a boundary or banding change** — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates block, unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: Lutan applies 0309 to production before the deploy
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] Destructive migration backup — n/a: a function replacement only
- [ ] Apply plan stated — deferred: Lutan (file 0309, production, before the deploy)

### Rollback

- [ ] Rollback position stated — n/a: reverting is a `create or replace` of 0224's function body; no data is changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Attaching to an adoption update still needs the publish activity, so a login holding only the `residents` card cannot attach (#hdyjp stays open) | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a login that can publish but not approve, or Admin: add a photo and a video to a shared adoption update, confirm they wait in Photos to approve (video plays), and appear on the stories page only after approval | residents → adoption updates; /photos/approve |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

pending: the upload-to-approval flow in a browser (Left for manual verification row 1)

Result: pass
