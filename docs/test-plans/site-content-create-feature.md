# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Website offers to create the missing site_content row (#ipf1z b, feature half) |
| Backlog item | `docs/backlog.md` → `#ipf1z` |
| Branch / worktree | `claude/site-content-create-8699e9` |
| PR | see the PR description |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no (0344 merged in #1424) |

## 1. Scope and risk

- [x] Change is described in one sentence — one insert policy on one table
- [x] Files touched — `actions.ts`, `page.tsx`, `CreateSiteContentRow.tsx`, both dictionaries, a structural test, decision file, backlog tick
- [x] Cards affected — `website.content` only (button + action); `website.propose`-only logins see no button
- [x] Out of scope — the migration (merged in #1424); production/UAT reads of `public_site_content`

## 2. Automated gates

- [x] `node scripts/gates.mjs` ended `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — pending: PR not yet open

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: migration shipped in #1424
- [ ] `--status` reviewed: 1 pending — n/a: migration shipped in #1424
- [ ] `--dry-run` reviewed: `0344 … ok` — n/a: migration shipped in #1424
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: migration shipped in #1424
- [ ] File is re-runnable — n/a: migration shipped in #1424
- [x] Existing rows still read correctly — n/a in effect: a new insert policy does not touch select or update
- [ ] Constraints exercised against real rows — n/a: migration shipped in #1424
- [ ] Down-migration — n/a: migration shipped in #1424
- [ ] Production apply plan — n/a: migration shipped in #1424

## 4. Functional checks

- [ ] All items — n/a: no UI surface, no code reads the policy yet

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `website.content` (and admin) | /admin/website, missing state | button drawn; press inserts the row | pending: not driven in a browser (would delete Test's live row); structural test + #1424 harness |
| a login without it | insert | refused | pass (harness) |

- [ ] A login that should not have access is blocked server-side — n/a here: action checks website.content, policy refuses otherwise (#1424 harness)

## 5. Cross-cutting

- [ ] All items — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — select and update policies untouched
- [ ] Shared file touched — n/a: none

## 7. Documentation

- [x] Backlog — `#ipf1z` ticked
- [x] Decision file `2026-11-09-site-content-insert-policy.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: production still needs migration 0344 applied at the next release, so the button would not work there yet
- [x] Commit messages say why
- [x] Claims were measured — by the harness above

## 8. Pre-production gate

- [ ] All items — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| What | Where | Why not done |
|---|---|---|
| nothing | | |

---

Automated checks by: Claude  Date: 2026-11-09
Manual verification by: pending: nobody has pressed the button on a screen

Result: pass
