# Feature test plan — roles-and-permissions-design

Filled from `docs/test-plan-template.md`. Documents only; no code and no
migration. **Who does what at Lanna is answered by Lutan, and he has decided the
fork: configured roles** (2026-10-03, each recorded in its own decision file).
**The details of how it is built are still proposed.** The Director has not yet seen the table. The checks below are about
whether what the documents say about today's system is true, not about any new
behaviour, because there is none.

---

## Header

| | |
|---|---|
| Feature | `docs/roles-and-permissions.md` (the design paper), `docs/roles-director-table.md` (the Director's one-page table, second draft), and three decision files: that there are no PCs on site, Lutan's answers on the roles, and his decision for configured roles |
| Backlog item | `docs/backlog.md` → Auth: *The roles the shelter actually has, from the Director*; Architecture: *Roles and permissions each shelter configures* |
| Branch / worktree | `claude/roles-and-permissions-design` @ `C:\Development\Animal_Shelter_roles-and-permissions-design` |
| Dev server | not used: documents |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/323 |
| Tested by / date | Claude, 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: a design paper with one activity catalogue serving both backlog items, the Director's role-by-activity table with every gap marked, and a decision file superseding part of "Admin on mobile"; which is each item's stated first deliverable ("deliverable first: a one-page table"; "deliverable: `docs/roles-and-permissions.md`")
- [x] Files touched: `docs/roles-and-permissions.md`, `docs/roles-director-table.md`, `docs/decisions/2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`, `docs/decisions/2026-10-03-lanna-roles-lutans-answers.md`, `docs/decisions/2026-10-03-configured-roles-not-enum-values.md`, a one-line pointer at the top of `docs/decisions/2026-09-24-admin-on-mobile-which-settings-and-management-pages-belong.md`, three status lines in `docs/backlog.md`, this plan. On the `backlog` branch, separately: two follow-up items (commit `d38bb0b3`)
- [ ] Roles affected identified — n/a: no app code and no policy changed; no role can do anything it could not do before, or less
- [x] Out of scope, written down: every build (the paper's §15 lists the pieces); migration `0132`, which is proposed as the permission tables and not claimed; the parity check, specified in §11 and not built; the medication round, which Lutan ruled out, and the read-only medication list that replaces it, scoped in §14 and not built; vets, on hold by Lutan's answer, with the rename to Doctor parked and only named; the Mobile responsiveness sweep, reported to Lutan and not reopened; and any decision file for the details of the design that Lutan has not ruled on (the "today" rule, the live lookup, one login for the Director, the order of the roles)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The first sync brought in the `password-change-current` merge with no conflict, including in `docs/backlog.md`; the second, after Lutan's answers were integrated, printed "Already up to date."
- [x] `node scripts/gates.mjs` closing lines, as printed by the run on the final tree (`74879969`); the earlier run, before Lutan's answers, ended the same way after 148s:

```
=== gates: build exited 0 after 27s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] The paper's claims about today's system were read from the system, not recalled. All read-only, against **dev** (`qxkmhwybjggxvsfxsxbd`), at `47691ac4`; the method is the paper's Appendix B. The scratch scripts' own output, as printed:

```
policies 243, functions 17, tables 75, app_role: admin, staff, vet, volunteer, management, public_viewer
restrictive 3
public policies 243 tables 47
{ admin: 52, management: 64, staff: 60, vet: 54, volunteer: 40 }
unwrapped current_user_role: 234
views: 31 testing a role: private.app_users, public.app_users, public.current_placement, public.immunization_compliance, public.immunization_duplicate_check, public.recurring_job_staffing, public.resident_current_state, public.translation_queue, public.vet_contacts, public.volunteer_contacts
functions: 82 definer: 26 testing a role: 15
dev user_roles: admin 4/4, management 2/3, staff 6/8, vet 4/4
inserted 47 rows
```

  The first line's "functions 17" is the first, wider filter (it also matched the two helpers that read `user_roles`); the paper uses the later count, 15 functions and 10 views. Appendix C of the paper was written by a script from the same policy dump, not typed.

- [x] Each finding in §3 of the paper was traced to the object that shows it: A1 to `src/app/prescriptions/actions.ts` and `src/app/procedures/new/actions.ts` and the insert policies on `medication`, `frequency`, `procedure_types`; A2 to `src/lib/contacts/create.ts` and `src/lib/placements/rehome.ts`; A3 to the role lists inside `delete_resident_photo()` and `set_resident_profile_photo()`; A5 to `0101`'s view body; A6, A7 to the role lists inside `record_recurring_job()` and `record_stock_correction()`; B to `set_resident_microchip()` and `MICROCHIP_WRITE_ROLES` against the manual's tag; C1 to C12 to the named policies. That the app never deletes a resident (C2) was checked by searching `src/` for a delete on `residents` and finding none
- [x] **What was not done, said plainly:** the C findings were read from policy text. None was *probed* by sending the request under that role's own JWT, which is what would prove it. The parity check specified in §11 is that proof and belongs to the next stream. Production was not read at all
- [ ] Data persists — n/a: no records
- [ ] Create / edit / delete exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: a design paper, no code changed
- [ ] A role that should not have access is blocked server-side — n/a: no endpoint added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: a design paper, no code changed
- [ ] Manual updated — n/a: a design paper; the manual changes when the roles do
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing but documents was added
- [ ] Shared file checked from a second page — n/a: the only shared file touched is `docs/backlog.md`, which no page reads
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge was clean and the build exited 0 after it

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; both items end "then build". Each has a status line saying what is written, what Lutan settled and what is still asked, and Senior Staff has a pointer to the recommendation to close it
- [x] Non-obvious design choices in `docs/decisions/`: **three files, each for something that really was settled.** One records Lutan's decision of the fork, "Lets do Configured roles", with what it does and does not carry with it. One records a fact (no PCs on site, superseding part of the 2026-09-24 decision). The other records Lutan's answers on who does what at Lanna, in his own words, with the four points they leave open listed as assumptions and a plain statement that the Director has not seen the table. The *remaining details of the design* have **no** decision file, on purpose: those questions (§17, L2 to L12) are unanswered, and a file recording an agreement that did not happen is the failure this checklist exists to prevent
- [x] `README.md` still accurate — it does not describe roles beyond what the app does today, which is unchanged
- [ ] **Release notes.** n/a: documents only; nothing ships to a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned, **where the paper states them as facts**: the counts and the findings above. **What the paper reasons and does not measure is labelled in the paper itself** (§18): the speed of `has_permission()` under RLS; whether production matches dev; eight of the ten role-testing views, counted but not read line by line; whether `resident_list_view`'s write grants can do anything. The estimate of "about one batch" against "about two" in §16 is a judgement, not a measurement, and is worded as one

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: no code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code changed
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no thresholds changed
- [ ] Evidence pasted is unedited tool output — n/a: the pasted output is the gate lines and the scratch scripts' lines above, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It adds three documents, a pointer line in one old decision file and three lines in the backlog; nothing reads any of them, and nothing in the app, the Worker, the Pi or the database changed. It does not cover the two items filed on the `backlog` branch, which are a separate commit there

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first draft counted "17 functions" with their own role list. The filter also matched the two helpers that read `user_roles`; the real figure is 15 functions, and 10 views had not been counted at all | fixed before the PR: the paper says 15 functions and 10 views |
| 2 | low | The first draft said "9 `*_ROLES` sets"; there are 16 | fixed before the PR |
| 3 | medium | The draft followed the backlog item in treating the 2IC as the Management role. Lutan corrected it mid-stream: they are separate, and the Director does Management by day and Admin at night | fixed: the paper, the Director's table and the decision file were reworked around his answer (commit `fe4e9e9b`) |
| 4 | low | The brief and the first draft called the Director "he". Lutan's own message says "her" | fixed throughout |
| 5 | low | The printed Director's table ran three rows onto a second page | fixed: one page for the table, the questions on the second |
| 6 | medium | The first complete draft scoped a medication round that recorded each dose, guessed most of the 2IC's and the Heads' cells, and staged the database work by area. Lutan's answers changed all three: nothing is recorded, the three roles are far narrower than guessed, and the build goes role by role | fixed: the paper, the table and the PDF were reworked (commits `bf76df46` and `74879969`); the cells that are still guesses dropped from most of the table to six |
| 7 | info | Found in the system, not in this PR: Management cannot record a microchip though the manual says so; a volunteer can read prices and a vet the other clinics | deferred to backlog: filed on the `backlog` branch under Auth and Security |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Answer the remaining design questions, L2 to L12.** The fork is decided (configured roles) and the eight questions about who does what are answered; what is left does not hold up the first piece | Lutan, `docs/roles-and-permissions.md` §17 |
| 2 | **Show the table to the Director** and bring back her corrections. Six cells are still a guess (`?`), covered by the six points under "Still to confirm" | The Director, with the PDF on Lutan's Desktop or `docs/roles-director-table.md` |
| 3 | **Does the Director's table read plainly to her**, and does she need it in Thai | Lutan and the Director |
| 4 | **How many volunteer logins exist in production**, and which of today's logins are the 2IC, the two Heads and plain staff. Dev has no volunteers; production was not read | Lutan, or a session he asks to read production |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see `pending:` below

Manual verification by: pending: Lutan answering L2 to L12 on the details of the build, and the Director confirming her table and its six open points

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises the plan and names this file, since every line but the gate output and the audit evidence is `n/a`
- [ ] Handed to the production release manager — n/a: nothing here ships; no code, no migration, and the design is not yet agreed

Result: pass

Release manager acknowledgement: pending
