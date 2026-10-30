# Feature test plan: security-mobile-width

## Header

| | |
|---|---|
| Feature | Settings -> Security fits a 375 px phone |
| Backlog item | `docs/backlog.md` -> Mobile, "Settings -> Security is 631 px wide" |
| Branch / worktree | `claude/security-mobile-width` |
| Carries a migration? | no |
| Tested at SHA | a67a8417 |

## 1. Scope and risk

- [x] Change is described in one sentence: the access-request role select and its row now shrink and wrap inside the viewport, and the role-picker harness asserts no sideways scroll
- [x] Files touched: `src/app/admin/security/AccessRequests.tsx` (class names only), `scripts/check-security-role-picker.mjs`, `src/lib/releases.ts`, backlog, decision file, this plan
- [ ] Roles affected — n/a: layout only, no access, gate or action changed
- [x] Out of scope: tap-size of the people-table chips (listed by the phone check, untouched), any access change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in
- [x] `node scripts/gates.mjs` ends with the line below, as printed

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] No migration in this change — n/a: no migration, no schema

## 4. Functional checks

- [x] Before: `check-security-role-picker` reported scrollWidth 631 at 375 px and timed out on the submit click ("fixed inset-0 z-40 ... intercepts pointer events")
- [x] After: the same harness prints "All checks passed." including the new width check; the interception was the overflow
- [ ] Role access matrix — n/a: no access change; the harness still checks the created logins' cells and refusals

## 5. Cross-cutting

- [x] Mobile viewport (375px): `check-phone-width --pages=/admin/security --roles=admin --locales=en --no-public` reports "No page scrolls sideways"
- [x] Browser console clean — the harness check "no browser console errors on Settings -> Security" passed
- [ ] Nav, manual, translations — n/a: no new string, no nav change

## 6. Regression

- [x] The create-person form, role changes and sign-ins on the same page are exercised by the harness and pass

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md on this branch
- [x] Decision recorded in `docs/decisions/2026-10-30-security-mobile-width.md`
- [ ] README — n/a: not affected
- [x] **Release notes.** `unreleased` gained a line for the Security screen on a phone

## 8. Pre-production gate

- [ ] Pre-production gate — deferred: release manager at the next release

## Left for manual verification

| What | Why |
|---|---|
| Look at the access-request rows on a real phone | the harness measures width, not appearance; needs a pending request to exist |

Result: pass

Automated checks by: Claude  Date: 2026-10-30
Manual verification by: pending: a person looks at Security on a real phone
