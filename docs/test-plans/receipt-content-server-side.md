# Feature test plan

## Header

| | |
|---|---|
| Feature | What a donation receipt says is built by the database from its donation; a caller can no longer choose it |
| Backlog item | `docs/backlog.md` → "`issue_donation_receipt` also takes what the receipt says (`p_content`: donor name, lines, total) from the caller, so the API can issue a receipt for an amount nobody gave" |
| Branch / worktree | `claude/receipt-content-server-side` @ `C:\Development\Animal_Shelter_receipt-content-server-side` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` (not used: no screen changed) |
| PR | see the PR this file ships in |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | yes, `0177_receipt_content_server_side.sql` |
| Tested at SHA | `2814237f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `issue_donation_receipt()` stores `receipt_content(donation)`, a SQL copy of `receiptContentFor()`, and ignores `p_content`
- [x] Files/areas touched listed: `supabase/migrations/0177_receipt_content_server_side.sql`, `scripts/check-donation-receipts-schema.mjs`, comments only in `src/app/management/donations/actions.ts` and `src/lib/donations/donations.ts`, docs
- [x] Roles affected identified: only roles holding `donation.receipt` (admin, management) can issue, and still can; what changes is that the content they pass is discarded
- [x] Anything explicitly **out of scope** written down: the receipt date (`p_issued_on`) is still taken from the caller, so the API can backdate a receipt. Filed on the `backlog` branch as its own item (`776378fe`), not folded into this slot. Dropping the two now-ignored arguments is a later, optional migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run at `2814237f`:

  ```
  === gates: build exited 0 after 394s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR: all seven checks passed on #513 at `c879f82f` (check, public-views, test-plan, migration-numbers, new-policy-role-names, script-integrity, audit)

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0176), and no other in-flight branch carries one: the brief gave this batch's only slot to this branch, and `post-commit`'s check printed `migration numbers: ok`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (176 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0177_receipt_content_server_side.sql … ok`. It also printed the consumer warning (`actions.ts` differs from release 0.24.0), which is expected: the app already sends `p_content`, and nothing new needs reading
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `--status` afterwards shows 177 applied rows against 176 files on `origin/main`, the only extra being `0177` (on this branch), and nothing on `main` unapplied
- [x] File is re-runnable: `create or replace function` for both functions, `comment on`, revoke/grant
- [x] Existing rows still read correctly after the change: no table or column changed, and the register's guard trigger stops existing receipts being rewritten; the content shape is unchanged
- [x] **Constraints and defaults exercised against real rows** in `check-donation-receipts-schema.mjs` (a `begin …` harness ended by a raise, so nothing is kept), under the real dev Management and 2IC logins. Every issue passes forged content (`"Forged donor"`, one line of 1,000,000 baht). The expected value is built by **`receiptContentFor()` itself**, imported from `donations.ts`, and compared **as text** with both `receipt_content()` and the stored receipt for seven probe donations: lines entered out of position order, `0.10 + 0.20`, the largest amount a line takes plus a satang, all in kind, a Thai donor name, a linked contact with a different name, and quotes plus a backslash. It is also compared for a donation with no lines and for every real dev donation (3). **Before** `0177`: 22 of 64 failed, and the stored receipt said 1,000,000 baht from "Forged donor" for a 1,200.50-baht gift. **After**: `all 64 held`. Both are under *Evidence*
- [x] **The rebuilt content matches what was stored before `0177`, on real rows.** Every receipt on dev (`LCA0009000`–`LCA0009003`, one voided), stored before `0177` from caller-built content, is byte-identical as text to `receipt_content()` for its donation now: `content::text = receipt_content(donation_id)::text` was `true` for all four
- [x] **The harness fails against a deliberate break.** With `receiptTotal()` temporarily summing floats, it went red on 4 lines (`total 0.30000000000000004`, `1250.1499999999999`), and the change was reverted before committing
- [x] Down-migration written, or the reason one is not needed is stated: not needed, because nothing was added to any table. Undoing would restore 0176's body and reopen the hole, so it should not be done
- [x] Production apply plan stated: see section 8

## 4. Functional checks

- [x] Happy path works end to end, at the database: the harness issues receipts for nine donations and checks each one's stored content. Issuing from the Donations page itself is under *Left for manual verification*
- [ ] Data persists — reload the page and the change is still there — n/a: no screen changed; persistence is the register row, asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: only issuing changed, and the harness exercises it; edit and delete of receipts are refused as before, and that is asserted
- [x] Empty state renders sensibly: a donation with no lines stores `lines: []`, `total: 0`, the same as `receiptContentFor()`; `receipt_content()` of a missing donation is `null`
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the content is no longer input; the RPC's other refusals are unchanged and still asserted
- [x] Boundary cases checked: the largest line amount (`9999999999.99`) plus `0.01` totals `10000000000` in both copies; `0.10 + 0.20` totals `0.3`; in kind totals `0`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | issue_donation_receipt | issues; content forced to the donation's | n/a: not separately driven; admin passes `has_permission` like management, and the content code path does not depend on the role |
| management | issue_donation_receipt, receipt_content | issues; content forced to the donation's | harness, real dev Management login: forged content discarded on all nine receipts |
| second in command | issue_donation_receipt, receipt_content | refused; reads nothing | harness: issue `ERR:42501`; `receipt_content` returns `null` (RLS hides donations) |
| doctor | issue_donation_receipt | refused | n/a: no `donation.receipt` cell; permission unchanged by 0177 |
| volunteer | issue_donation_receipt | refused | n/a: no `donation.receipt` cell; permission unchanged by 0177 |
| signed out | receipt_content | refused | harness: `ERR:42501` (execute revoked from `anon`) |

- [ ] Every role above tested — n/a: management, 2IC and anon driven; 0177 changes no permission, only what an allowed caller's receipt stores
- [x] A role that should not have access is blocked server-side: the 2IC's issue is refused, and `receipt_content()` shows the 2IC nothing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user does changed
- [ ] Translatable strings go through the translation path — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no screen changed
- [ ] Browser console clean — n/a: no screen changed
- [ ] Network clean — n/a: no screen changed

## 6. Regression

- [x] The pages nearest the change still work: the 0168 and 0176 harness lines (40) all still pass in the same run
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; the two source files gained comments only
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**. Swept the backlog for `issue_donation_receipt`, `p_content`, `receiptContentFor`, `donation.receipt` and caller input: no other open item is closed. The multi-tenancy items cite the receipt series and the per-shelter issuer, which are still true. The only text saying the RPC takes caller input is the spike's dated decision file, which is left as a record. The new backdating item went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-10-receipt-content-server-side.md`, which covers the helper versus inline SQL, the match table, and the evidence
- [x] `README.md` still accurate (it does not describe receipt content)
- [ ] **Release notes.** — n/a: no shelter user would notice; the screens always passed the donation's own figures, so every receipt issued from the app was already right. What changed is only that a direct API call can no longer put other figures on one
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions/` were measured, not reasoned**: the "before" claim is the harness's failing run, and the "matches the app" claim is the text comparison on dev's four receipts and the harness's comparison with `receiptContentFor()`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The lines below are copied as printed; the selection is stated above each block
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No code reads anything new. The app still sends `p_content`, which 0177 accepts and ignores, so migration and deploy can go in **either order** without breaking receipt issuing. **Nothing has to be done by hand at release time**, as with `0176`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Fresh production backup for a destructive migration — n/a: not destructive; it replaces one function body and adds another, and touches no rows
- [x] Apply plan stated: `0177_receipt_content_server_side.sql` on production (`dbkodyyxxhtygxcxmfcu`), any time, before or after the deploy. It needs `0176` first, and the runner applies them in order. Worth running once afterwards, to find out whether the hole was ever used: `select number, issued_on from donation_receipts where content::text <> receipt_content(donation_id)::text;`. A row there is either a forged receipt, or a donation edited after its receipt was issued. The second is legitimate: the receipt keeps what was printed

### Rollback

- [x] Rollback position stated: a Pi rollback of the app changes nothing here, because the app change is comments only. Do not roll the migration back. Restoring 0176's body reopens the hole, and the new function is harmless to leave

## Evidence

Before `0177` (dev, `node scripts/check-donation-receipts-schema.mjs`): the content lines for the harness's two original probe donations, and the summary. The other 20 failures were the seven probe cases and the three real donations, failing the same way or with `ERR:42883` (no `receipt_content` yet):

```
FAIL forged content ignored: the receipt says what the donation says: got {"lines": [{"amount": 1000000, "description": "Forged gift"}], "total": 1000000, "currency": "THB", "donorName": "Forged donor"} want {"lines": [{"amount": 1200.5, "description": "Dog food"}, {"amount": null, "description": "Blankets"}], "total": 1200.5, "currency": "THB", "donorName": "Probe ผู้บริจาค จำกัด"}
FAIL forged content ignored: a donation with no lines prints none, total 0: got {"lines": [{"amount": 1000000, "description": "Forged gift"}], "total": 1000000, "currency": "THB", "donorName": "Forged donor"} want {"lines": [], "total": 0, "currency": "THB", "donorName": "Probe two"}
22 FAILED
```

After `0177`: a selection of content lines, and the summary:

```
ok   forged content ignored: the receipt says what the donation says: got {"lines": [{"amount": 1200.5, "description": "Dog food"}, {"amount": null, "description": "Blankets"}], "total": 1200.5, "currency": "THB", "donorName": "Probe ผู้บริจาค จำกัด"}
ok   forged content ignored: a donation with no lines prints none, total 0: got {"lines": [], "total": 0, "currency": "THB", "donorName": "Probe two"}
ok   forged content ignored: satang that floats would get wrong: got {"lines": [{"amount": 0.1, "description": "A"}, {"amount": 0.2, "description": "B"}], "total": 0.3, "currency": "THB", "donorName": "Probe satang"}
ok   2IC cannot read a donation through receipt_content: got null
ok   anon cannot call receipt_content: got ERR:42501
ok   receipt_content mirrors receiptContentFor: real donation a4229435: got {"lines": [{"amount": 2500.5, "description": "บริจาคค่าอาหารสุนัข เดือนตุลาคม (น้ำและอาหาร)"}, {"amount": 1800, "description": "Vet costs for Tia (spay)"}], "total": 4300.5, "currency": "THB", "donorName": "บริษัท ล้านนา พัฒนา จำกัด (คุณสมศรี ใจดี)"}
ok   receipt_content mirrors receiptContentFor: real donation ca28577a: got {"lines": [{"amount": null, "description": "Two bags of blankets and 20 kg of rice"}], "total": 0, "currency": "THB", "donorName": "Jane Doe (test)"}
ok   receipt_content mirrors receiptContentFor: real donation c2d63a93: got {"lines": [{"amount": 100, "description": "Picker test gift"}], "total": 100, "currency": "THB", "donorName": "Harness donor (picker test)"}
all 64 held (rolled back, nothing kept)
```

Real receipts against `receipt_content()` on dev, after `0177` (`select number, voided_at is not null as voided, content::text = receipt_content(donation_id)::text as identical_text from donation_receipts`, one row per line):

```
{"number":"LCA0009000","voided":true,"identical_text":true}
{"number":"LCA0009001","voided":false,"identical_text":true}
{"number":"LCA0009002","voided":false,"identical_text":true}
{"number":"LCA0009003","voided":false,"identical_text":true}
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | Anyone holding `donation.receipt` could issue a numbered receipt for any donor and any amount by calling the RPC directly (the item itself) | fixed: 0177 |
| 2 | major | The same is true of the receipt date through `p_issued_on`: a receipt can be backdated into another tax year | deferred to backlog: own item on the `backlog` branch (`776378fe`), needs a decision and a schema slot |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Record a donation with two lines (one with satang, e.g. 1,200.50 and 300) and issue its receipt from the Donations page. The PDF shows the donor's name as typed, both lines in the order entered, and a total of 1,500.50 | Management → Donations on Test, after the deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; one item waits for Lutan

Manual verification by: pending: issue one receipt from the Donations page and check the donor, lines and total on it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
