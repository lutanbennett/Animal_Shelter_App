# Feature test plan

## Header

| | |
|---|---|
| Feature | A donation receipt's issuer is built by the database; a caller can no longer choose it |
| Backlog item | `docs/backlog.md` → "`issue_donation_receipt` takes the issuer from the caller, so the API can issue a receipt naming any organisation" |
| Branch / worktree | `claude/receipt-issuer-server-side` @ `C:\Development\Animal_Shelter_receipt-issuer-server-side` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not used: no screen changed) |
| PR | see the PR this file ships in |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | yes, `0176_receipt_issuer_server_side.sql` |
| Tested at SHA | `bf981077` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `issue_donation_receipt()` stores `receipt_issuer(country)`, a SQL copy of `receiptIssuer()`, and ignores `p_issuer`
- [x] Files/areas touched listed: `supabase/migrations/0176_receipt_issuer_server_side.sql`, `scripts/check-donation-receipts-schema.mjs`, comments only in `src/app/management/donations/actions.ts` and `src/lib/donations/issuer.ts`, docs
- [x] Roles affected identified: only roles holding `donation.receipt` (admin, management) could issue at all, and still can; what changes is that the issuer they pass is discarded
- [x] Anything explicitly **out of scope** written down: `p_content` (donor name, lines, total) is still taken from the caller, the same hole for the figures. On the backlog branch as its own item; and dropping the now-ignored `p_issuer` argument is a later, optional migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one auto-merge in `docs/backlog.md`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run after the sync at `bf981077`:

  ```
  === gates: build exited 0 after 287s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR: all seven checks passed on #510 at `bf3fc356` (check, public-views, test-plan, migration-numbers, new-policy-role-names, script-integrity, audit)

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0175), and no other in-flight branch carries one: the brief gave this batch's only slot to this branch, and `post-commit`'s number check printed `migration numbers: ok`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (175 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0176_receipt_issuer_server_side.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `--status` afterwards shows 176 applied rows, the only extra being `0176` (on this branch, not yet on `main`)
- [x] File is re-runnable: `create or replace function` for both functions, `comment on`, revoke/grant
- [x] Existing rows still read correctly after the change: no table or column changed, and the register's guard trigger means existing receipts cannot be rewritten anyway; the receipt list and PDF read `donation_receipts.issuer`, whose shape is unchanged
- [x] **Constraints and defaults exercised against real rows** in `check-donation-receipts-schema.mjs` (a `begin … ` harness ended by a raise, so nothing is kept), under the real dev Management and 2IC logins with the JWT claims PostgREST sets for an `/rest/v1/rpc` call. Every issue passes a forged issuer (`"Forged Org Ltd"`, a fake address, a fake tax line and a 501(c)(3)-style statement). Asserted: the TH and US receipts store the real issuer, not the forged one; `receipt_issuer('TH')` and `('US')` equal `receiptIssuer()` as imported from `issuer.ts`; an unknown country is refused (22023 from the function, 23514 from the RPC, as before, without moving the counter); and the 35 checks from 0168 still hold. **Before** `0176`, the same run failed 5 of 40: both receipts stored `"name": "Forged Org Ltd"`, and `receipt_issuer` did not exist. **After**: `all 40 held`. Both outputs are under *Evidence* below
- [x] Down-migration written, or the reason one is not needed is stated: not needed, because nothing was added to any table. Undoing would mean restoring 0168's function body, which reopens the hole, so it should not be done
- [x] Production apply plan stated: see section 8

## 4. Functional checks

- [x] Happy path works end to end, at the database: the harness issues TH and US receipts and checks numbering, void and re-issue. Issuing from the Donations page itself is under *Left for manual verification*
- [ ] Data persists — reload the page and the change is still there — n/a: no screen changed; persistence is the register row, asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: the change is to issuing only, which the harness exercises; edit and delete of receipts are refused, as before, and asserted
- [ ] Empty state renders sensibly — n/a: no screen changed
- [x] Invalid input is rejected with a readable message, not a crash: unknown country raises "Receipt country must be TH or US" (23514) before a number is taken
- [ ] Boundary cases checked — n/a: no length, amount or date handling changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | issue_donation_receipt | issues; issuer forced to the real one | n/a: not separately driven; admin passes `has_permission` like management, and the issuer code path does not depend on the role |
| management | issue_donation_receipt | issues; issuer forced to the real one | harness, real dev Management login: forged issuer discarded on TH and US receipts |
| second in command | issue_donation_receipt | refused | harness: `ERR:42501` (the role that replaced staff in 0173) |
| doctor | issue_donation_receipt | refused | n/a: no `donation.receipt` cell; permission unchanged by 0176 |
| volunteer | issue_donation_receipt | refused | n/a: no `donation.receipt` cell; permission unchanged by 0176 |
| signed out | issue_donation_receipt | refused | n/a: execute revoked from `anon`, unchanged by 0176 (the harness checks anon cannot reach donations) |

- [ ] Every role above tested — n/a: management and 2IC driven; 0176 changes no permission or grant, only what an allowed caller's receipt stores
- [x] A role that should not have access is blocked server-side: 2IC's direct call is refused with 42501

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user does changed
- [ ] Translatable strings go through the translation path — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no screen changed
- [ ] Browser console clean — n/a: no screen changed
- [ ] Network clean — n/a: no screen changed

## 6. Regression

- [x] The pages nearest the change still work: the 0168 harness, which covers everything issuing does, still passes in full (35 original checks)
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; the two source files gained comments only
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge touched only `docs/backlog.md`, and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the `p_content` follow-up went on the `backlog` branch (`d8b030af`). Swept the backlog for `issue_donation_receipt`, `receiptIssuer`, `issuer.ts` and `donation.receipt`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-10-receipt-issuer-server-side.md`, which covers the function versus a table, and ignoring versus dropping the parameter
- [x] `README.md` still accurate (it does not describe the issuer)
- [ ] **Release notes.** — n/a: no shelter user would notice; the screens always passed the correct issuer, so every receipt issued from the app already named the foundation. What changed is only that a direct API call can no longer name anyone else
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions/` were measured, not reasoned**: the "before" claim (a forged issuer was stored) is the harness's failing run, not an inference from reading 0168

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both runs below are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No code reads anything new. The app still sends `p_issuer`, which 0176 accepts and ignores, so migration and deploy can go in **either order** without breaking receipt issuing
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Fresh production backup for a destructive migration — n/a: not destructive; it replaces one function body and adds another, and touches no rows
- [x] Apply plan stated: `0176_receipt_issuer_server_side.sql` on production (`dbkodyyxxhtygxcxmfcu`), any time; before or after the deploy makes no difference. Worth running once afterwards, to find out whether the hole was ever used: `select number, issued_at, issuer->>'name' from donation_receipts where issuer <> receipt_issuer(country);` should return no rows

### Rollback

- [x] Rollback position stated: a Pi rollback of the app changes nothing here, because the app change is comments only. Do not roll the migration back. Restoring 0168's function body reopens the hole, and the new function is harmless to leave

## Evidence

Before `0176` (dev, `node scripts/check-donation-receipts-schema.mjs`, passing lines omitted by `grep -v "^ok"`):

```
FAIL forged issuer ignored: TH receipt stores the real issuer: got {"name": "Forged Org Ltd", "addressLines": ["1 Fake Street"], "statementLines": ["No goods or services were provided"], "registrationLines": ["Tax ID: 000"]} want {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
FAIL receipt_issuer(TH) mirrors issuer.ts: got ERR:42883 want {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
FAIL receipt_issuer(US) mirrors issuer.ts: got ERR:42883 want {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
FAIL receipt_issuer(FR) refused: got ERR:42883 want ERR:22023
FAIL forged issuer ignored: US receipt stores the US issuer: got {"name": "Forged Org Ltd", "addressLines": ["1 Fake Street"], "statementLines": ["No goods or services were provided"], "registrationLines": ["Tax ID: 000"]} want {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
5 FAILED
```

After `0176` (the issuer lines and the summary):

```
ok   forged issuer ignored: TH receipt stores the real issuer: got {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
ok   receipt_issuer(TH) mirrors issuer.ts: got {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
ok   receipt_issuer(US) mirrors issuer.ts: got {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
ok   receipt_issuer(FR) refused: got ERR:22023
ok   bad country refused: got ERR:23514
ok   forged issuer ignored: US receipt stores the US issuer: got {"name": "Lanna Care for Animals Foundation", "addressLines": ["291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,", "Mae Wang District, Chiang Mai 50360, Thailand"], "statementLines": [], "registrationLines": []}
all 40 held (rolled back, nothing kept)
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | Anyone holding `donation.receipt` could issue a numbered receipt in any organisation's name by calling the RPC directly (the item itself) | fixed: 0176 |
| 2 | major | The same is true of the receipt's content (donor name, lines, total) through `p_content` | deferred to backlog: own item on the `backlog` branch, needs a schema slot |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Record a donation and issue its receipt from the Donations page; the PDF names Lanna Care for Animals Foundation at the Mae Wang address | Management → Donations on Test, after the deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; one item waits for Lutan

Manual verification by: pending: issue one receipt from the Donations page and check the organisation on it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
