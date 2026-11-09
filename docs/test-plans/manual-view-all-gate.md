# Feature test plan: manual-view-all-gate

## Header

| | |
|---|---|
| Feature | Cards at a glance lists only held cards; `?view=all` is Admin-only on /manual and /manual/pdf |
| Backlog item | `docs/backlog.md` #ia85b |
| Branch / worktree | `claude/manual-view-all-gate` |
| Carries a migration? | no |
| Tested at SHA | pending |

## 1. Scope and risk

- [x] Change is described in one sentence: the manual page and PDF list only held cards, and ignore `?view=all` unless the reader is Admin
- [x] Files touched: `src/app/manual/page.tsx`, `src/app/manual/pdf/route.ts`, `src/lib/manual/for-topic.ts`, `src/lib/manual/manual-pdf.tsx`, the test, release note, decision file
- [x] Cards affected: none changed; every card's reader now sees fewer rows. Admin keeps everything; signed-out public is not affected (manual needs sign-in)
- [x] Out of scope: `/releases?view=all` (decision file), the hidden-until-found rendering, topic tags in `en.ts`

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — pending: run just before the PR
- [ ] `node scripts/gates.mjs` — pending: result goes in the PR
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] No migration in this change — n/a: no migration, no schema

## 4. Functional checks

- [x] `for-topic.test.mjs`: non-Admin and no-card and signed-out `?view=all` refused; Admin allowed; table for two-card holder versus Admin versus none
- [ ] Browser check with a three-card login — pending: signed-in dev check to be run before merge
- [ ] Role access matrix — n/a: card-driven, no role is read

## 5. Cross-cutting

- [ ] Nav, translations, mobile, console, network — n/a: no new strings, no layout change

## 6. Regression

- [x] Topic filtering untouched; existing 10 for-topic tests still pass

## 7. Documentation

- [x] Backlog #ia85b ticked
- [x] Decision recorded in `docs/decisions/2026-11-09-manual-whole-catalogue-is-admin-only.md`
- [ ] README — n/a: not affected
- [x] **Release notes.** `unreleased` gained a line in `src/lib/releases.ts`

## 8. Pre-production gate

- [ ] Pre-production gate — deferred: release manager at the next release

## Left for manual verification

| What | Why |
|---|---|
| Open /manual on Test as a three-card login, then as Admin | needs a person looking |

Result: pass

Automated checks by: pending
Manual verification by: pending: Lutan to look at /manual on Test
