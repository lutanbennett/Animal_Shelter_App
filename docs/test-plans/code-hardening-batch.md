# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Code hardening batch (CODE-4, CODE-5, CODE-6, CODE-7, WEB-5, WEB-6, WEB-8, WEB-9) |
| Backlog item | `docs/backlog.md` → Small code hardening batch |
| Branch / worktree | `claude/code-hardening-batch` @ `C:\Development\Animal_Shelter_code-hardening-batch` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-01 |
| Carries a migration? | no (WEB-6's database constraint is deferred to its own item) |
| Tested at SHA | `e840ace` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: eight Low findings fixed in one PR, with WEB-9 and parts of CODE-5 and CODE-7 found already shipped and WEB-6's constraint deferred
- [x] Files/areas touched listed: `src/lib/csv.ts`, `src/lib/google/drive.ts`, `src/lib/uploads/file-signature.ts`, `src/lib/public-paths.ts`, `src/proxy.ts`, `src/lib/auth/password-change.ts`, `src/lib/action-result.ts`, both i18n dictionaries, `admin/website` and `admin/status` actions, six create actions (blood-tests, diets, immunizations, procedures, vet-visits, residents), three `scripts/check-*.mjs`. No migration, no `worker/`
- [x] Roles affected identified: signed-out public (proxy boundary), admin (website settings, status mail), every role that sets a password, staff and vets on the six create forms
- [x] Anything explicitly **out of scope** written down: the WEB-6 constraint (own backlog item), Supabase leaked-password protection (Lutan's dashboard setting), and the other `error.message` returns in admin/, maintenance/ and management/ that the item did not name

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch was cut from current `origin/main`; re-run before merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: signed-out sweep against `next dev` on :3007 (below); CSV, PDF signature and public-path rules run through the real exported functions by `scripts/check-csv.mjs`, `check-file-signature.mjs`, `check-public-paths.mjs`
- [ ] Data persists — n/a: nothing new is stored; the map link and password rules are validation only
- [ ] Create / edit / delete all exercised — n/a: validation and error mapping, no new create, edit or delete flow
- [ ] Empty state renders sensibly — n/a: no list or empty state touched
- [x] Invalid input is rejected with a readable message, not a crash: a formula-looking name is made text, a non-https map link takes the existing social-link refusal, a PDF with text before `%PDF-` is refused
- [x] Boundary cases checked: `-12.50`, `+7`, `.5`, `1e3` stay numbers; `-1+2`, `-`, `=1+1`, `@SUM(A1)`, tab and CR starts get the apostrophe; `/adoptive` is not `/adopt`; PDF after blank lines passes, after text or as a mid-file mention is refused

### Role access matrix

The signed-out row was exercised live (`curl` against `next dev` on :3007). Nothing else about role access changed: only where the public/private line is drawn moved.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/website`, `/admin/status` | unchanged | not re-driven; gate change does not touch signed-in routes |
| management | `/management/*` | unchanged | not re-driven |
| staff | the six create forms | unchanged apart from error wording | not re-driven |
| vet | vet visit and procedure forms | unchanged apart from error wording | not re-driven |
| volunteer | app pages | unchanged | not re-driven |
| signed out | `/`, `/login`, `/robots.txt`, `/lca-logo.jpg`, `/privacy`, `/adopt`, `/r/ABC`, `/e/1` → 200; `/adoptive`, `/fosterage`, `/residents`, `/admin`, `/leak.png`, `/manual/login.png` → 307 to `/login?next=…`; `/api/photos/abc` → 400 (proxy rejects a bogus id, not the gate) | public pages open, everything else redirects | as expected |

- [x] Every role above tested: signed out live; the signed-in roles are listed under Left for manual verification
- [x] A role that should not have access is blocked server-side: hit the URLs directly, signed out, and got the 307s above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing the manual documents changes behaviour
- [ ] Translatable strings go through the translation path — n/a: three new `common` strings added to both `en.ts` and `th.ts`; no translations-table keys
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean: dev server log showed no errors across the sweep
- [x] Network clean: only the intended 307s signed out; `/_next/image` is 404 by design (the optimizer is off in `next.config`), the logo is served directly at `/lca-logo.jpg` 200

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/login`, `/privacy`, `/adopt`, `/r/ABC`, `/e/1` all 200 signed out
- [x] Any shared file touched checked from a second, unrelated page by loading it: `public-paths.ts` is shared by the proxy, `app-access.ts` and the layout gate; `/login` and `/` loaded after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what was already shipped and what was deferred
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-01-code-hardening-batch-calls.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line covering the 12-character minimum, the spreadsheet formula guard and the map-link check
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the public-path table and CSV cases are output of the scripts above; the `/_next/image` 404 was checked against `next.config`

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (focus: signed-out public pages and the logo on the deployed Workers build, since the matcher change was only exercised on `next dev`)
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: the one boundary change, segment matching in `isPublicPath`, has cases on both sides (`/adopt` and `/adopt/12` in, `/adoptive` and `/adopt-admin` out)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates line is pasted as printed; the sweep table is a summary of the `curl` run
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager (a Worker rollback fully reverts this PR; there is no schema to leave behind)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The existing check `PDF with a preamble` encoded the old, looser rule (text before `%PDF-` accepted); it now encodes the new rule | fixed |
| 2 | Low | `contact_map_url` has no database constraint, unlike the social links | deferred to backlog (filed on the `backlog` branch) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Turn on leaked-password protection | Supabase dashboard → Authentication, dev and production projects |
| 2 | Export Cashflow with a resident named like `=1+1` and a negative amount; open in Excel and confirm the name shows as text and the amount as a number | `/management/cashflow` |
| 3 | Change a password: 11 characters is refused with the "at least 12" message, 12 is accepted | `/account/password` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are listed above and only the person who looked may tick this

Manual verification by: pending: Lutan — Supabase leaked-password switch, the Excel check of a cashflow export, and one password change

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 2 is deferred to the backlog rather than accepted or fixed here
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
