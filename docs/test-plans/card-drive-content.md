# Test plan: card-drive-content

## Header

| | |
|---|---|
| Feature | Card review driven pass over `translations`, `website_photos` and `website`: all 14 numbered walkthrough steps driven, findings recorded and nothing fixed |
| Backlog item | `docs/backlog.md` → the card review's driven pass over the nineteen undriven cards (this stream covers 3 of the 19; **sixteen remain, the box is left open for the planner**) |
| Branch / worktree | `claude/card-drive-content` @ `C:\Development\Animal_Shelter_card-drive-content` |
| Dev server | `next dev` on port 3003, stopped before the gates ran. Dev schema 272 applied, 0 pending; each login read back as one card via `dev-signin.mjs --cards <card>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | a083487a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three cards driven as logins holding only that card, findings recorded and nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md` (one dated section appended), `docs/decisions/2026-10-27-card-drive-content.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes (the hero gap's fix is `0274` in `claude/card-review-2-schema`), no new or proposed cards, the other sixteen cards, the backlog tick, any file under `src/`, `worker/`, `supabase/migrations/`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (7 commits, `docs/backlog.md` only)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 115s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration (dev schema read as 272 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The review itself is the functional check. Three card-only logins were driven on the dev project at 375 px, aal1, and no page asked for a
second step. Results are in `docs/decisions/2026-10-27-card-drive-content.md`.

- [x] Happy path works end to end for the steps driven: two Thai translations saved on the Translations page; a gallery photo added, moved and removed; a Contact and settings field saved and cleared; and the medication list refused for each of the three logins
- [x] Data persists: the translations were read back under All and in the Website count, the Contact field after a reload, and the gallery order and removal on the page
- [ ] Create / edit / delete all exercised — n/a: a review of access, not a feature; the writes driven are listed above
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input changed (the missing description on a gallery photo was not tried)
- [ ] Boundary cases checked — n/a: no input changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no code changed |
| management | nothing new | no change | n/a: no code changed |
| staff | nothing new | no change | n/a: no code changed |
| doctor | nothing new | no change | n/a: no code changed |
| volunteer | nothing new | no change | n/a: no code changed |
| signed out | nothing new | no change | n/a: no code changed |

- [ ] Every role above tested — n/a: no code changed, and the review is about three cards with no reference to roles
- [ ] A role that should not have access is blocked server-side — n/a: no code changed; the medication list was opened directly under each login and refused, as were seven kinds of record link under `translations`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout changed (the pass itself was driven at 375 px)
- [ ] Browser console clean — n/a: no UI change (one hydration warning was read and traced to test ids added during the pass)
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` brought in `docs/backlog.md` only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item covers nineteen cards and this stream drove three, so the box stays open for the planner
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-27-card-drive-content.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a recording pass; nothing a user sees changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each row records what was seen; what was only read from the code (the hero actions' `website.content` check) is labelled as read, and what was not done is listed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only evidence is the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this change
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this change
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documents only; reverting the merge removes them, nothing else is affected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | none in this change. The review's own findings are rows in `docs/card-access-faults.md`; the ones that stop a step are the hero gap on `website_photos` (`0274` is the fix in flight) and the unwired Contact form on a direct load | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the two Thai translations and the gallery photo were really seen by a reader (the public site was not fetched) | the public site in Thai, and the Our story photo strip |
| 2 | Whether the direct-load Contact form fault also happens on a production build, and on the other tabs | `/admin/website?tab=contact` on test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are outstanding and are carried as `pending:` on the signature line below

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: documents only, nothing to deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: documents only
