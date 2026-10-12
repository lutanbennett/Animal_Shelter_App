# Feature test plan — donate-channels-schema

## Header

| | |
|---|---|
| Feature | Schema half of the donate-page buttons: `donation_channels` and `public_donation_channels` (`0191`) |
| Backlog item | `docs/backlog.md` → **Donate page: a button for each way to give** (left open; the app PR closes it) |
| Branch / worktree | `claude/donate-channels` @ `C:\Development\Animal_Shelter_donate-channels` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | yes — `0191_donation_channels.sql` |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — piece (1): a table of ways to give with a public view that shows only shown rows, link checks, Thai through translations
- [x] Files/areas touched listed — `supabase/migrations/0191_donation_channels.sql`, `scripts/check-public-views.mjs` (view registered), `scripts/check-donation-channels-schema.mjs`, `docs/decisions/2026-10-12-donation-channels.md`, this plan
- [x] Roles affected identified — none see a change; no screen reads the table yet. Write access is `website.content` Edit (Admin, Management); anon gains read of shown rows through the view only
- [x] Anything explicitly **out of scope** written down — Settings → Website → Donate and the `/donate` buttons are the app PR; knowing a payment arrived is a separate item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0191` against `0190`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev: 190 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run failed on `approved_translations` (moved to `private.` by 0076's era); fixed, second run `ok`
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: applied from the main checkout after this PR merges (the runner refuses worktrees, by design); the harness below applied the file inside a rolled-back transaction
- [x] File is re-runnable — `if not exists`, `or replace`, `drop … if exists` throughout
- [ ] Existing rows still read correctly after the change — n/a: new table; the only existing object changed is `is_public_drive_file()`, which gains one branch, and the harness shows public files still resolve through its other branches' structure unchanged
- [x] **Constraints and defaults exercised against real rows** in a rolled-back harness (`node scripts/check-donation-channels-schema.mjs`, 29 assertions, all held). Asserted: PayPal / paypal.me / DonorBox / Wise links accepted; `http://`, `paypal.com.evil.test`, `secure-paypal-donate.com`, `wise.com@evil.test`, `evil.test/donorbox.org` and a Wise link under a PayPal address refused; `other` takes any https link; bad `way` and blank label refused; Management writes, 2IC and anon refused; `created_by` from the session; anon refused on the table; **a hidden row (and its account number) is absent from `public_donation_channels`, a shown one present, showing/hiding flips it**; a shown row's QR file is served by the photo proxy and a hidden row's is not; the view carries no `created_by`; nobody can write the view; `label` is queued for Thai
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; undo steps are in the file header
- [x] Production apply plan stated for the release manager — `0191_donation_channels.sql` on `dbkodyyxxhtygxcxmfcu`, before the app PR's deploy, which reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads the table yet
- [ ] Data persists — n/a: no UI surface; row persistence exercised in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update (show/hide) exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; the table starts empty and nothing reads it
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; look-alike domains and blank label are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `donation_channels` | read and write | n/a — admin bypass; Management exercised as the cell holder |
| management | `donation_channels` | read and write | pass — harness: insert accepted, reads rows |
| staff | `donation_channels` | refused | n/a — role retired (0173) |
| doctor | `donation_channels` | refused | n/a — holds no `website.content` cell, same policy as the 2IC row |
| volunteer | `donation_channels` | refused | n/a — as above |
| signed out | `public_donation_channels` only | shown rows | pass — harness: table refused (42501), view returns shown rows only |

- [x] Every role above tested — Management, 2IC and anon exercised in the harness; the others hold no `website.content` cell and hit the same policy
- [x] A role that should not have access is blocked server-side — 2IC insert refused (-1) and select returns 0 rows; anon insert refused, anon select 42501

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the app PR writes the manual topic
- [ ] Translatable strings go through the translation path — n/a: no strings shown yet; `label` and `note` are registered and `label` queue insert asserted in §3
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-public-views.mjs` lists the new view; the build gate compiles every reader; the photo proxy function keeps all nine earlier branches verbatim
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open on purpose; the app PR on this branch ticks it and step (a) of the donate item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-12-donation-channels.md` (hidden rows, domain matching, Thai route)
- [x] `README.md` still accurate — it does not list tables
- [ ] **Release notes.** — n/a: schema only, nothing a user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the look-alike refusals and the hidden-row behaviour are harness results, not argument

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads this yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the code is the app PR, after this is applied to dev
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0191` on production before the app PR deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert `0191` and does not need to: nothing reads the table until the app PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run: `approved_translations` is now `private.approved_translations` | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing reads the table yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
