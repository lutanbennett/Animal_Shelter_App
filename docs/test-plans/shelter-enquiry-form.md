# Feature test plan

## Header

| | |
|---|---|
| Feature | The shelter enquiry form on the platform front door (`/platform/enquire`): records an enquiry, mails the owner best-effort |
| Backlog item | `docs/backlog.md` → `#shsup` (app half; the table is 0427, #1770) |
| Branch / worktree | `claude/shelter-enquiry-form` @ `C:\Development\Animal_Shelter_shelter-enquiry-form` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no — uses `0427_shelter_enquiries.sql`, already applied everywhere |
| Tested at SHA | 59a438880 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: a public form that inserts one `shelter_enquiries` row and mails the owner, creating no shelter, role, login or invitation
- [x] Files touched: `src/app/platform/enquire/*` (new), `src/lib/platform/enquiry.ts` and its test, `src/lib/public-paths.ts` (exact path made public), both dictionaries, `eslint.config.mjs` and `scripts/check-permission-catalogue.mjs` (allow-list entries), `docs/hard-coded-security-registry.json`; no migration, no worker file
- [x] Cards affected: none. Admin unaffected; the signed-out public gains one page. The console `/platform` still needs sign-in and product-admin
- [x] Out of scope: approval queue, pending application, any account, the console list of enquiries (`#pacon`), setting `SHELTER_ENQUIRY_MAIL_TO` on the Pi, `scripts/lib/runtime-config.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [ ] `node scripts/gates.mjs` ends with the four exit codes — pending: test=1 locally from the Pi shell tests only, see below; CI is the Linux check

Closing lines of the run, as printed:

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 192s
=== gates: test exited 1 after 44s
=== gates: build exited 0 after 63s
gates: FAILED — test
gates: typecheck=0 lint=0 test=1 build=0
```

The one non-zero is `test`: all 7 failures are `scripts/pi/*.test.mjs` (Pi shell scripts, Windows bash here); none touches this change, and the `test` gate's other tests, including `enquiry.test.mjs`, pass. CI runs on Linux.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, the table is 0427
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; a real insert through the form was read back
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: form filled in the browser on :3008, thank-you shown, row read back with the service role (`status` new, message stored as plain text)
- [x] Data persists — the row was read back from the database after the submit
- [ ] Create / edit / delete all exercised — n/a: create only; no edit or delete exists by design
- [ ] Empty state renders sensibly — n/a: the page lists nothing
- [x] Invalid input is rejected with a readable message: unit-tested (`enquiry.test.mjs`) for blank name, bad email, long phone and message; each names only the visitor's own field
- [x] Boundary cases checked: trimming, 4001-character message, 61-character phone, throttle window; the duplicate answer equals the success answer (unit test)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/platform/enquire` | the form, as for anyone | not separately driven |
| signed out | `/platform/enquire` | the form, no redirect to `/login` | form rendered signed out on :3008 |
| signed out | `/platform` | still sent to sign-in | not driven; `/platform` was not changed |

- [ ] Every login above tested — pending: only the signed-out browser journey was driven; admin and `/platform` are unchanged code
- [x] A login that should not have access is blocked server-side: the form grants nothing and reads nothing; the table gives a stranger no access (0427) and the insert uses the service role at one named site

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the page is a front door, not an app page
- [ ] Manual updated — n/a: a page for strangers, not part of a shelter manual
- [x] Translatable strings go through the dictionaries (en and th added)
- [ ] Mobile viewport (375px) — pending: not driven
- [x] Browser console clean — no errors seen in the driven journey
- [ ] Network clean — pending: network tab not inspected

## 6. Regression

- [x] The pages nearest the change still work: `public-paths` tests pass (15), permission-catalogue check passes after the registration
- [ ] Any shared file touched checked from a second page — n/a: the `public-paths.ts` change is one exact path, covered by its test file
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — pending: left open on purpose; the mail needs `SHELTER_ENQUIRY_MAIL_TO` set on the Pi (Lutan) before the done-when is fully met
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-20-shelter-enquiry-form.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: the only people who see this are strangers who are not users yet, and no Admin sees anything appear, move or disappear because the form is not linked from any app screen
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the row insert was read back; the mail path was NOT driven and the decision file says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding; length limits are asserted at the edge in the unit test
- [ ] Evidence pasted into this plan is the actual tool output, unedited — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the form is not an edge-cached page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production environment — deferred: Lutan sets `SHELTER_ENQUIRY_MAIL_TO` on the Pi; without it the enquiry is recorded and no mail is sent

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; revert is `deploy-pi.sh --ref <sha>`, and no schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/pi/*.test.mjs` fail on this Windows machine (shell tests), unrelated to this change | deferred to backlog (for the planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After `SHELTER_ENQUIRY_MAIL_TO` is set on the Pi, submit one enquiry and confirm the mail arrives | production |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the mail check above needs Lutan

Manual verification by: pending: the mail check after the Pi setting is made

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
