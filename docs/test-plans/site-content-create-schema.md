# Feature test plan

## Header

| | |
|---|---|
| Feature | Insert policy on `site_content` so a login with `website.content` can create the missing row (#ipf1z b, schema half) |
| Backlog item | `docs/backlog.md` → `#ipf1z` |
| Branch / worktree | `claude/site-content-create-8699e9` |
| PR | see the PR description |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | yes, 0344 |

## 1. Scope and risk

- [x] Change is described in one sentence — one insert policy on one table
- [x] Files touched — `supabase/migrations/0344_site_content_insert_policy.sql`, `scripts/check-site-content-insert.mjs`, a decision file
- [x] Cards affected — `website.content` only; no card is added or changed
- [x] Out of scope — the server action and button (next PR)

## 2. Automated gates

- [ ] gates — n/a: no application code changes in this PR; CI runs them
- [ ] CI green on the PR — pending: PR not yet open

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0343 → 0344)
- [x] `--status` reviewed: 1 pending (this file)
- [x] `--dry-run` reviewed: `0344 … ok`
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`drop policy if exists`, then create)
- [x] Existing rows still read correctly — n/a in effect: a new insert policy does not touch select or update
- [x] Constraints exercised against real rows — `node scripts/check-site-content-insert.mjs` ended `HARNESS-OK nocard=ERR:42501 idfalse=ERR:42501 withcard=ok second=ERR:23505` (rolled back)
- [x] Down-migration — n/a: `drop policy admin_insert_site_content on site_content;` is the whole reversal
- [x] Production apply plan — applied by the release's normal `apply-migrations.mjs --env production`

## 4. Functional checks

- [ ] All items — n/a: no UI surface, no code reads the policy yet

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `website.content` | insert id=true | allowed once | pass (harness) |
| a login without it | insert | refused | pass (harness) |

- [x] A login that should not have access is blocked server-side — harness shows 42501

## 5. Cross-cutting

- [ ] All items — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — select and update policies untouched
- [ ] Shared file touched — n/a: none

## 7. Documentation

- [x] Backlog — not ticked: the feature PR closes it
- [x] Decision file `2026-11-09-site-content-insert-policy.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: nothing a shelter user would notice until the feature PR
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
Manual verification by: n/a: no UI surface

Result: pass
