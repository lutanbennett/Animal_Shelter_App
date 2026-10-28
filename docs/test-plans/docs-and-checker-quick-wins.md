# Feature test plan: docs-and-checker-quick-wins

## Header

| | |
|---|---|
| Feature | check-test-plan fenced-block rule; CLAUDE.md behaviour claims dated |
| Backlog item | `docs/backlog.md` lines 393 and 396 (Quick wins) |
| Branch / worktree | `claude/docs-and-checker-quick-wins` |
| Carries a migration? | no |
| Tested at SHA | 264735ef |

## 1. Scope and risk

- [x] Change is described in one sentence: the checker now fails an empty or placeholder fenced block under a ticked line, and CLAUDE.md's checkable behaviour claims carry a date and a re-check command
- [x] Files touched: `scripts/check-test-plan.mjs`, `CLAUDE.md`, one decision file, this plan. Nothing under `src/`, no migration
- [ ] Roles affected — n/a: tooling and docs only, no role sees anything
- [x] Out of scope: `planner-handover-411.md` is deliberately left failing the new rule; CLAUDE.md decisions untouched; the aal1 list is not turned into a script (see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in (already up to date)
- [x] `node scripts/gates.mjs` ends with the line below, as printed

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] No migration in this change — n/a: no migration, no schema

## 4. Functional checks

- [x] `node scripts/check-test-plan.mjs --fences-all` read 947 plans and reported one fence problem, `planner-handover-411.md:28`, the plan the rule exists for; every other plan passes
- [x] A first draft of the rule also flagged `cut-release-0-23-0.md` (pasted guard output containing the lowercase word "placeholder"); the pattern was made case-sensitive instead of editing the plan
- [ ] Role access matrix — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav, manual, translations, mobile, console, network — n/a: no UI surface

## 6. Regression

- [x] This plan itself passes `node scripts/check-test-plan.mjs` with the new rule active

## 7. Documentation

- [x] Backlog items 393 and 396 ticked in docs/backlog.md on this branch
- [x] Decision recorded in `docs/decisions/2026-10-28-aal1-list-stays-prose.md`
- [ ] README — n/a: not affected
- [ ] **Release notes.** n/a: tooling and docs only, nothing a shelter user sees

## 8. Pre-production gate

- [ ] Pre-production gate — deferred: release manager at the next release (no deploy needed for scripts and docs)

## Left for manual verification

| What | Why |
|---|---|
| Production-side claims in CLAUDE.md (Admin holds no cards, role-cards-coverage on production) | need a production read; marked unverified in the decision file |

Result: pass

Automated checks by: Claude  Date: 2026-10-28
Manual verification by: n/a: scripts and docs only, nothing to look at
