# Test plan: supporters-list-app

## Header

| | |
|---|---|
| Feature | Donors list, gift history and inline add on the donation form (app half of 0244) |
| Backlog item | `docs/backlog.md` → Donors get their own supporters list |
| Branch / worktree | `claude/supporters-list-app` @ `C:\Development\Animal_Shelter_supporters-list-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude (automated only) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | 22644687 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out publ
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries — n/a: no migration; 0244 landed in #817
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; 0244 landed in #817
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration; 0244 landed in #817
- [ ] Applied to **dev** — n/a: no migration; 0244 landed in #817
- [ ] File is re-runnable — n/a: no migration; 0244 landed in #817
- [ ] Existing rows still read correctly after the change — n/a: no migration; 0244 landed in #817
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; 0244 landed in #817
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; 0244 landed in #817
- [ ] Production apply plan stated for the release manager — n/a: no migration; 0244 landed in #817

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Data persists — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Create / edit / delete all exercised — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [x] Invalid input is rejected — checkDonation refuses a contact plus a donor, checkSupporter refuses blank name and bad email
- [ ] Boundary cases checked — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification

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
| admin | donors, new, [id] | allowed | pending |
| management | donors, new, [id] | allowed if the Donations cell is on | pending |
| staff | n/a: role is retired | | |
| doctor | the same URLs | refused by requirePermission and RLS | pending |
| volunteer | the same URLs | refused by requirePermission and RLS | pending |
| signed out | the same URLs | redirected to /login (seen in the browser pane) | seen |

- [ ] Every role above tested — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification

## 5. Cross-cutting

- [x] Nav entry correct — Donors button on the donations page, no NavLinks change
- [x] Manual updated — new step in the donation-receipts topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations — n/a: dictionary strings only, both languages added; nothing user-written is stored for translation
- [ ] Mobile viewport — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Browser console clean — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Network clean — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [ ] Any shared file touched — n/a: not driven in a browser this session (sign-in needs a dev login I may not use); listed under Left for manual verification
- [x] Nothing merged from main during sync was broken — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Design choices in `docs/decisions/2026-10-21-donors-list-app.md`
- [x] README.md still accurate — it does not describe donations
- [x] README.md still accurate — it does not describe donations
- [x] Commit messages say why
- [x] Claims were measured: tsc, lint, build and the permission catalogue ran

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintaine — deferred: release manager
- [ ] Public pages — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Browser checks not driven by Claude: no dev login available to it | accepted, handed to manual verification |

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
| 1 | Add, find, edit, archive a donor; archived keeps its history | /management/donations/donors |
| 2 | Record a gift against a donor; amount shows in their history | donation form, donor page |
| 3 | Inline Add a new donor on the form links the new gift to it | /management/donations/new |
| 4 | Gift against an existing contact is unchanged | /management/donations/new |
| 5 | A login without donation.receipt is refused on all three pages | the same URLs |
| 6 | Thai wording and a phone width | all donor pages |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assume
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

The items in **Left for manual verification** above; a person has not looked yet.

- [ ] The manual list above is empty, or checked by a person — n/a: the list is not empty; a person has to look

Manual verification by: pending: a person signs in with donation.receipt and checks add, edit, archive, history, inline add, the existing-contact path, a role without donation.receipt refused, Thai and phone width

### Result

- [x] Open defects are fixed or accepted: none found
- [ ] Checklist pasted into the PR — n/a: not yet — done when the PR is opened
- [ ] Handed to the production release manager — n/a: not yet — done when the PR is opened

Result: pass with accepted defects

Release manager acknowledgement: pending

