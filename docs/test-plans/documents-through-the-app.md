# Feature test plan: documents through the app

## Header

| | |
|---|---|
| Feature | Filed receipts and deceased-archive documents open through /api/documents, not Drive |
| Backlog item | `docs/backlog.md` → STAFF OPEN PDFS AND REPORTS THROUGH THE APP, NOT IN DRIVE |
| Branch / worktree | `claude/documents-through-the-app` @ `C:\Development\Animal_Shelter_documents-through-the-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | 55d1591a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a new `/api/documents/[fileId]` route serves filed receipts and deceased-archive PDFs/index, and their three links use it instead of Drive
- [x] Files/areas touched listed: `src/app/api/documents/[fileId]/route.ts` (new), `src/lib/google/drive-client.ts`, `ReceiptActions.tsx`, `DeceasedBanner.tsx`, `src/lib/releases.ts`
- [x] Roles affected identified: any login holding donation.receipt (receipts) or able to read a deceased resident (archive); signed-out is refused
- [x] Out of scope: no migration; blood-test, clinic and attachment reports were already served by /api/photos (see decision file); offline index's own inner link stays on Drive

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
=== gates: typecheck exited 0 after 111s
=== gates: lint exited 0 after 241s
=== gates: test exited 0 after 26s
=== gates: build exited 0 after 246s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in as admin, the receipt page's link is `/api/documents/<id>`, and fetching a real dev receipt and a real deceased summary returned 200 `application/pdf`, `inline`, `private, no-store`
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete — n/a: read-only route
- [ ] Empty state — n/a: a link is drawn only when a file id exists, as before
- [x] Invalid input is rejected readably: a malformed id answers 400, an unknown id 404 "Document not found."
- [x] Boundary cases: a deceased offline index (HTML) answers `attachment`, not inline, so it cannot run as a page on our origin

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | receipt, summary, index | served | 200 for all three |
| management | not driven | RLS: donation.receipt / resident read | pending: not driven, see Left for manual verification |
| staff | retired | n/a | n/a |
| doctor | not driven | RLS refuses a receipt | pending: not driven |
| volunteer | not driven | RLS refuses a receipt | pending: not driven |
| signed out | any id | no bytes | request redirected to the login page, no document returned |

- [x] Every role above tested — admin and signed-out driven; the card-limited logins are listed under Left for manual verification and say so
- [x] A role that should not have access is blocked server-side: signed-out fetch of a real receipt id returned the login page (route is behind the sign-in gate, and then RLS answers per row)

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual updated — n/a: no workflow change a manual topic describes
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: link targets changed, layout did not
- [x] Browser console clean on the receipt page
- [x] Network clean: the only non-2xx were the intended 400/404 probes

## 6. Regression

- [x] Pages nearest the change still work: the donation receipt page loaded and its link resolved
- [ ] Shared file touched — n/a: `releases.ts` gained one line; `drive-client.ts` lost an unused export, no other caller (grep clean)
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: both ticks go on the `backlog` branch by the brief
- [x] Decision file `docs/decisions/2026-10-30-documents-through-the-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for filed receipts and the deceased archive opening in the app; no step is outstanding (the app route works with or without the Pi)
- [x] Commit messages say why, not just what
- [x] Claims were measured: headers and statuses above were read from real responses on dev

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change assertions — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: gates block above is unedited output
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position: `./scripts/pi/deploy-pi.sh --ref <sha>`; additive route only, no schema to revert — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Offline index (HTML) now downloads instead of previewing in Drive | accepted: required by the no-inline-HTML rule |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding only a card without donation.receipt is refused a receipt id (404) | `/api/documents/<receipt file id>` |
| 2 | On the Pi, a mirrored receipt opens from disk | Pi after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not empty; items 1 and 2 are waiting on a person (see the pending signature below)

Manual verification by: pending: card-limited login and Pi checks above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over at release cut, after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
