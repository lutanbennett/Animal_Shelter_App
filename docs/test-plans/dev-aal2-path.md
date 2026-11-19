# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `dev-signin --aal2`: a dev-only TOTP step-up, and `check-dev-aal2-absent.mjs` proving it absent from production and UAT (#dvaal) |
| Backlog item | `docs/backlog.md` → `#dvaal` (Auth), ticked on this branch |
| Branch / worktree | `claude/dev-aal2-path` @ `C:\Development\Animal_Shelter_dev-aal2-path` |
| Dev server | http://localhost:3006 |
| PR | opened after this commit |
| Tested by / date | Claude Sonnet 5.5 / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | cce1b2165 |

## 1. Scope and risk

- [x] Change is described in one sentence — `dev-signin.mjs --aal2` enrols a TOTP factor on a disposable dev login, computes the code and verifies it, so GoTrue mints a real aal2 session; a check script proves none of that exists on production or UAT
- [x] Files/areas touched — `scripts/` only (dev-signin, lib/dev-aal2, check-dev-aal2-absent), `docs/`, `CLAUDE.md` one line. **No `src/`, no `worker/`, no migration**
- [x] Cards affected identified, plus whether admin and the signed-out public are affected — none. The step-up gives no role or card; Admin, cards and the public are untouched, and 0411/0100 policies are not edited
- [x] Out of scope — the product-admin screen (batch 3), putting a login on the PADMIN list (`add-product-admin.mjs`), any production or UAT read

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged before the PR
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — see PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration
- [x] Dev data: the script rewrites factors on disposable `dev-signin-*@example.invalid` logins only (guarded by `assertDevLogin`)
- [ ] Production data touched — n/a: nothing reads or writes production

## 4. Functional checks

- [x] Happy path — `dev-signin.mjs volunteer --aal2` printed a snippet whose access token decodes to `aal: aal2`, `amr: totp, password`
- [x] Behaviour at the gate — with the same cookies against `next dev`: `/admin/security` as admin at aal1 redirects to `/admin/security/verify`; with `--aal2` it loads (494 KB, no redirect)
- [x] Guards fire — `check-dev-aal2-absent.mjs` exits 0 on dev, and exits 1 for a planted `src/zz.ts` mention and for a planted migration that drops an aal2 policy (both removed)
- [x] Live read on dev — 113 dev-signin logins reported as expected there
- [ ] Press the `/admin/product-admin` controls at aal2 — n/a: the screen's presses belong to batch 3; this PR makes them drivable

### Role access matrix

- [ ] Every login tested / blocked server-side — n/a: no app code changed; a login with no card still gets none from `--aal2`

## 5. Cross-cutting

- [ ] Nav entry / manual / strings / mobile / console / network — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — plain `dev-signin.mjs admin` without the flag is unchanged (aal1, redirect as before)
- [ ] Shared file touched, checked from a second page — n/a: `dev-signin.mjs` is a script
- [ ] Nothing merged from main broke — n/a: nothing merged in so far

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file — `2026-11-19-dev-aal2-path.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing on production changes
- [x] Commit messages say why

## 8. Pre-production gate

- [ ] Deployed SHA / smoke test / deploy safety / UAT project line — n/a: ships nothing to any environment
- [ ] Production proof — pending: `node scripts/check-dev-aal2-absent.mjs --env production`, for the planner or Lutan to run from the main checkout
- [ ] UAT proof — pending: `node scripts/check-dev-aal2-absent.mjs --env uat`, for the planner or Lutan to run from the main checkout

### Rollback

- [x] Revert the PR; it removes only scripts and docs

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `check-dev-aal2-absent.mjs` without `--live` reads dev only on request; production/UAT always read live | by design |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | Run the two production/UAT commands above | planner / Lutan | open |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: production and UAT proof commands

Manual verification by: pending: planner or Lutan to run the two production/UAT commands

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no deploy step

Result: pass
