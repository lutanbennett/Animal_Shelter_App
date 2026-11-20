# Feature test plan — lanna-leftovers

## Header

| | |
|---|---|
| Feature | A second shelter no longer sees Lanna: adopt-page email fallback removed, Security string neutral, header badge reads the shelter's short name |
| Backlog item | `docs/backlog.md` → `#lnlft` |
| Branch / worktree | `claude/lanna-leftovers` @ `C:\Development\Animal_Shelter_lanna-leftovers` |
| Dev server | `http://localhost:3012` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 5228d1086 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: no shelter's adopt page offers another shelter's email, the Security code prompt names no shelter, and the header badge shows the shelter's own short name
- [x] Files touched: `src/app/adopt/[id]/page.tsx`, `src/app/AppHeader.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/manual/en.ts`, one decision file, `docs/backlog.md`, `src/lib/releases.ts`
- [x] Cards affected: none (no access rule changed); admin and the signed-out public see the new adopt page behaviour; every signed-in login sees the header badge
- [x] Out of scope: `totpIssuer()` in `two-step.ts` (recorded in the register, the label inside the authenticator app), the header logo image, `src/lib/shelter-names-default.ts`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: not run separately, the branch was cut from current main today and the gates ran on it
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 136s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 395s
=== gates: test — npm test
=== gates: test exited 0 after 71s
=== gates: build — npm run build
=== gates: build exited 0 after 293s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration, `site_content.contact_email` already exists (0018)
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: browser check on test-shelter-2 not driven by this stream (deliverable 6); see Left for manual verification
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete — n/a: read-only display change
- [ ] Empty state renders sensibly — pending: the no-phone-no-email case (button hidden) is the new empty state, to be looked at on a second shelter
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases — n/a: the only boundary is phone/email absent, covered by the empty-state line above

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no access rule changed | | |
| signed out | adopt page | shelter's own phone/email only | pending |

- [ ] Every login above tested — n/a: display change, no access rule touched
- [ ] A login that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: only the wording "Lanna Animal Care" became "this shelter" in the Security topic, already updated
- [ ] Translatable strings — n/a: the two changed strings are in the dictionaries in en and th
- [ ] Mobile viewport — n/a: no layout change, a button is conditionally omitted
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [ ] Nearest pages still work — pending: header is on every page, build passing is the only evidence so far
- [ ] Shared file touched checked from a second page — pending: `AppHeader.tsx` loaded in the browser, not done
- [ ] Nothing merged from `main` was broken — n/a: branch cut from current main today

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices recorded in `docs/decisions/2026-11-20-lanna-leftovers.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line in this PR
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the lanna-literal check printed 39 recorded, no unrecorded

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — n/a: gates block above is the unedited run
- [ ] Public pages re-checked after purge — deferred: release manager
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added
- [ ] Migration and code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback stated — n/a: code-only change, revert the commit and redeploy

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a shelter with no phone and no email, the adopt page shows no Book a visit button; with an email set, the mailto goes to that email | any adopt page, second shelter |
| 2 | Header badge shows the shelter's own short name | any signed-in page, second shelter |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two items above

Manual verification by: pending: the two items in the manual list

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: release time

Result: pass
