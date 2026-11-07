# Feature test plan: baseline stamp trigger

## Header

| | |
|---|---|
| Feature | impact_baselines_stamp moves set_at/set_by only when the number changes |
| Backlog item | `docs/backlog.md` → #s4t7q |
| Branch / worktree | `claude/baseline-stamp-trigger` @ `C:\Development\Animal_Shelter_baseline-stamp-trigger` |
| Dev server | n/a: no UI surface |
| PR | see PR |
| Tested by / date | Claude, 2026-11-07 |
| Carries a migration? | yes |
| Tested at SHA | d7703a25 |

## 1. Scope and risk

- [x] Change is described in one sentence: a visibility-only update of an impact_baselines row no longer rewrites set_at/set_by
- [x] Files touched: `supabase/migrations/0331_baseline_stamp_number_only.sql`, decision file, backlog tick, this plan
- [x] Cards affected: none changed; the write is `website.content` at edit. Admin and the public unaffected
- [x] Out of scope: Settings → Website screen, Recent changes labels (#a9d4v), record_audit()

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: filled with the gates result in the PR body
- [ ] `node scripts/gates.mjs` — pending: result pasted in the PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration is 0331, one above 0330 on main, no other in-flight migration
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev (qxkmhwybjggxvsfxsxbd), recorded in schema_migrations
- [x] File is re-runnable (create or replace, drop trigger if exists)
- [x] Existing rows unaffected: only function body changed, no data touched
- [x] Harness in begin…rollback asserted: (a) off/on toggle leaves set_at identical; (b) baseline_count change moves it; (c) insert stamps even with a supplied set_at; (d) forged set_at ignored on a visibility update and on a number edit
- [x] Down-migration: reverting is re-applying 0156's function body; nothing depends on the new one
- [ ] Production apply plan — pending: release manager applies 0331 to dbkodyyxxhtygxcxmfcu; additive-safe, before or after any deploy (no app change)

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; proved in the SQL harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: covered by harness insert and update
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: constraints unchanged
- [ ] Boundary cases — n/a: both sides asserted in the harness

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a: no page or permission changed | n/a | n/a |

- [ ] Every login tested — n/a: no access change
- [ ] Blocked server-side — n/a: policies untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no app code changed
- [ ] Shared file — n/a: none touched
- [x] Nothing merged from main was broken: sync was already up to date

## 7. Documentation

- [x] Backlog item ticked
- [x] Decision file `docs/decisions/2026-11-07-baseline-stamp-trigger.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: the audit stamp only; no change a shelter user would see
- [x] Commit messages say why
- [x] Claims were measured: the harness run produced them

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive — n/a: no date logic
- [ ] Boundary assertions — n/a: not a banding change
- [ ] Evidence unedited — n/a: no pasted tool output beyond the PR body
- [ ] Public pages — deferred: release manager
- [ ] deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none
- [ ] Migration with code — n/a: migration only, no code reads anything new
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — n/a: function replacement, no data rewrite
- [ ] Apply plan — deferred: release manager applies 0331 to production
- [ ] Rollback — n/a: re-apply 0156's function body; no data affected

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-07

- [x] The manual list is empty

Manual verification by: n/a: no UI surface, nothing for a person to look at

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — pending: pasted at PR creation
- [ ] Handed to release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: production apply of 0331
