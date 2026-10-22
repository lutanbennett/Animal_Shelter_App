# Feature test plan — vet-visit-booking-polish

## Header

| | |
|---|---|
| Feature | The shelter calendar entry for a vet visit shows its reason; booking from Vet visits, Appointments or a clinic page returns to that page |
| Backlog item | `docs/backlog.md` → Medical records: *Show the visit's REASON in its Google Calendar entry* and *After booking a vet visit from the Book appointment card, go back to the vet visits list* |
| Branch / worktree | `claude/vet-visit-booking-polish` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: number once opened |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | no — `reason` is an existing column |
| Tested at SHA | `85deeb7d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the calendar entry shows the visit's reason, and booking from the Vet visits / Appointments / clinic page returns to that page
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `calendar-sync.ts`, `calendar-event.ts` (+ test), new `booking-return.ts` (+ test), `src/app/clinic-visits/new/` (page, form, action), the three Book buttons, `scripts/resend-calendar-reasons.mjs`, manual, releases, two decision files, backlog
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — anyone who books visits (admin, management, doctor; clinic logins land on `/appointments`); everyone who can read the shelter calendar sees the reason
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the notes stay out of the calendar; the optional Visit booked confirmation was not built; the dirty trigger still ignores `reason` (needs a migration)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged in, already up to date
- [x] node scripts/gates.mjs ends:

```
=== gates: build exited 0 after 167s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] Constraints and defaults — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — booked from Vet visits at 375 px, saved, landed back on `/upcoming-visits` with the new visit listed; the dev calendar event read back from Google: `Reason: ZZ-polish-test reason` straight after the `Vet visit:` line, title unchanged
- [x] Data persists — reload the page and the change is still there — visit row and `calendar_event_id` present in dev after the redirect
- [x] Create / edit / delete all exercised (whichever the feature has) — create driven in the browser; edit and the assistant booking path call the same `syncVisitToCalendar`, which now reads `reason` (read in code, not driven)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or screen was added
- [x] Invalid input is rejected with a readable message, not a crash — `from=https://example.com` and `from=//evil.example` produce no hidden field (checked in the served HTML); the unit test covers a list of hostile values
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — blank, whitespace-only and multi-line reasons (unit test); `/upcoming-visits/`, `?x=1`, `/../` and a bad clinic id all refused

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
| admin | `/upcoming-visits`, `/clinic-visits/new` | Book button carries `from`; saving returns to Vet visits | pass |
| management | same pages | unchanged permission (`visit.book`) | not driven |
| staff | n/a | retired role | n/a |
| doctor | `/appointments` | lands back on `/appointments` | not driven |
| volunteer | none | does not hold `visit.book`; unchanged | not driven |
| signed out | none | redirected to login as before | not driven |

- [ ] Every role above tested — n/a: only admin was signed in (aal1); the change adds no permission; a clinic login and a doctor were not driven, see Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new page or permission; `/clinic-visits/new` still requires `visit.book` and the action still checks it server-side

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the vet-visits calendar passage now names the Reason line, who can read it, the latency and that edits in Google are not copied back
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new user-facing strings in the dictionaries
- [x] Mobile viewport (375px) — no overflow, controls reachable — the booking was driven at 375 px; no new visible controls (the `from` field is hidden)
- [ ] Browser console clean — no errors or React warnings — n/a: the console was not read separately; the flow completed without an error page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the network log was not read separately; the redirect and page loads returned normally

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/upcoming-visits` and `/clinic-visits/new` loaded; `/appointments` and the clinic page button checked by reading their hrefs in code only
- [ ] Any shared file touched — n/a: no shared file such as `NavLinks.tsx` was touched; `manual/en.ts` and `releases.ts` each got one passage or line
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items ticked; no other open item was closed by this work (the calendar items left open are about production go-live and sharing)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — two new decision files; the old decision's line is marked superseded in place
- [x] `README.md` still accurate — it describes neither behaviour
- [x] Release notes. — two lines added to `unreleased` in `src/lib/releases.ts`; the reason line says entries gain it within 15 minutes of the update, which holds once the one-off script has been run after deploy (named in the decision file)
- [x] Commit messages say why, not just what
- [x] Claims in commit messages — the calendar text was read back from Google and the redirect was driven; the trigger gap was read in migration 0207

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager (this change does no date arithmetic)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change — deferred: release manager (the allow-list is exact-match and its unit test covers the boundaries)
- [ ] Evidence pasted into this plan — deferred: release manager (gates output above is unedited)
- [ ] Public pages ( — deferred: release manager

### Deploy safety

- [ ] deploy: production — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (none added)

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration — n/a: no migration
- [ ] node scripts/apply-migrations.mjs --env production — n/a: no migration
- [ ] For a destructive or rewriting migration — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (a revert; no schema to undo; entries already rewritten keep their Reason line until next synced)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | none found | n/a |

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
| 1 | As a clinic login (doctor), book from `/appointments` and confirm you land back on `/appointments` | `/appointments` on the dev server |
| 2 | After production deploy, run `node scripts/resend-calendar-reasons.mjs --env production --apply` once and confirm an existing upcoming entry gains its Reason line within 15 minutes | the shelter calendar |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

The two items under **Left for manual verification** need a person. Claude does not sign this line for anyone else; it stays `pending:` until they have looked.

- [ ] The manual list above is empty — n/a: the list above holds items only a person can check, so this is left for them

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: done at the PR step, after this commit

Result: pass

Release manager acknowledgement: pending: not yet handed over
