# Feature test plan

| signed out | none | redirected to login | not driven || volunteer | none | refused | not driven || doctor | none | refused | not driven || staff | none | refused by the contacts.directory guard (unchanged) | n/a: retired role || management | same | same | not driven (manual) || admin | /management/contacts, /new | list first; New contact; icons | not driven (manual) |## Header

| | |
|---|---|
| Feature | Management → Contacts: list first, New contact on its own page, contact details as icons |
| Backlog item | `docs/backlog.md` → **Management → Contacts: the list first…** and **Contacts list: show phone, LINE… as tappable icons** (both ticked here) |
| Branch / worktree | `claude/contacts-list-and-icons` @ `C:DevelopmentAnimal_Shelter_contacts-list-and-icons` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | `6243dd97` |

## 1. Scope and risk

- [x] Change is described in one sentence, and: Contacts opens on the list with a New contact button (own page); list rows show contact methods as icons
- [x] Files/areas touched listed (routes, work: `src/app/management/contacts/*`, `src/components/ContactActions.tsx`, both dictionaries, manual, releases, `scripts/check-permission-catalogue.mjs`
- [x] Roles affected identified: admin / staff: admin and management (`contacts.directory`); no other role reaches these pages
- [x] Anything explicitly out of scope written: out of scope: brand-mark SVGs (existing icon set reused), the `/contacts` directory (already icon-based), see the decision file

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync`: branch cut from current `origin/main` today; re-run before the PR opens
- [x] `node scripts/gates.mjs` ends typecheck=0 lint=0 build=0 (lint first failed on the permission-catalogue check for the new page; fixed by pinning it, then re-run)

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, — n/a: no migration in this PR
- [ ] node scripts/apply-migrations.mjs --status reviewe — n/a: no migration in this PR
- [ ] node scripts/apply-migrations.mjs --dry-run review — n/a: no migration in this PR
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded — n/a: no migration in this PR
- [ ] File is re-runnable (if not exists / or replace /  — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the chang — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real ro — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not n — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manag — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Data persists — reload the page and the change is still ther — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: not driven in a browser this session; listed under Left for manual verification

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] A role that should not have access is blocked server-side (h — n/a: not driven in a browser this session; listed under Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav entry added; New contact is a button on the existing page
- [x] Manual updated (Managing contacts topic); `/manual` page itself not loaded
- [x] New strings added to en and th together; `/management/translations` not opened
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser this session; listed under Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Any shared file touched checked from a second page — n/a: ContactActions defaults are unchanged for /contacts; not loaded in a browser, see manual list
- [ ] Nothing merged from main broke this — n/a: nothing merged from main since the branch was cut

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md o: both items ticked
- [x] Non-obvious design choices added as a ne: `docs/decisions/2026-10-17-contacts-list-first-icons.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for the list-first page and the icons
- [x] Commit messages say why, not just what: said why
- [x] Claims in commit messages and the decision file were read from the code, not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of main — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deploy.mjs prints both — deferred: release manager

### On the deployed build

- [ ] Deployed to test: npm run deploy:test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — the happy path works on — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed at a conve — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both  — deferred: release manager
- [ ] Evidence pasted into this plan is the tool's actual output,  — deferred: release manager
- [ ] Public pages (/, /adopt, /our-work, /donate) re-checked afte — deferred: release manager

### Deploy safety

- [ ] deploy: production → Supabase project <ref> line read and th — deferred: release manager
- [ ] strip-baked-env: removed N env var(s) from the Worker bundle — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] node scripts/apply-migrations.mjs --env production --dry-run — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production  — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it — n/a: no migration

### Rollback

- [ ] Rollback position stated, including what it does not cover.  — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | n/a |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | At 375 px: list is first, New contact is 44 px high, Thai label fits | /management/contacts |
| 2 | New contact opens the form; Cancel and back return; Save returns to the list with "Added: name" and the row is there | /management/contacts/new |
| 3 | A contact with all five methods shows five icons on one line, one with only a phone shows one; each opens the right app; value readable by long-press | the list |
| 4 | A role without contacts.directory is refused /management/contacts/new | direct URL |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything verifiable without human eyes was run (gates, permission-catalogue check)
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

Signed only by the person who looked; `pending:` means nobody has yet.

- [ ] The manual list above — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: Lutan to look at 375 px and the five-icon row

### Result

- [x] Open defects are either fixed or explicitly accepted above (none found)
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass

Release manager acknowledgement: pending: at release
