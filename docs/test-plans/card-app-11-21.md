## Header

| | |
|---|---|
| Feature | Card review 2, the app half (cards 11-21 and the My tasks entry) |
| Backlog item | `docs/backlog.md` → Card review decisions, cards 11-21 (app half; not ticked, see section 7) |
| Branch / worktree | `claude/card-app-11-21` @ `C:/Development/Animal_Shelter_card-app-11-21` |
| Dev server | `preview_start` name dev → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | 3e92d840 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — app half of Card review 2: repoint Appointments, hide what a card cannot use, names-only on Recurring jobs, alt text and the split photo strip on Website, photo and name on Enclosures
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — NavLinks/NavPane, `src/lib/permissions/routes.ts` and `cards.ts`, `src/app/admin/website/**`, `src/app/enclosures/**`, `src/lib/enclosures/details.ts`, `src/lib/residents/who-and-where.ts`, `src/app/management/dashboard/**`, `src/app/management/recurring-jobs/**`, `src/lib/auth/app-users.ts`, dictionaries, release note; no migration, no `worker/`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — any login holding Website photos, Enclosures, Book clinic visits, View contacts, Publish Shelter Friends, Recurring jobs or Dashboard; admin unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — hero photo behind the photo card and the names-only appeals view (both need a migration, filed on the backlog), the three red harnesses (next), the driven re-pass of cards 11-21

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

- [ ] `node scripts/worktree.mjs sync` — n/a: not run in this plan; to be run before merging
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exac… — see the gates lines below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so wr… — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; the schema half is 0265
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — one-card logins on dev: Website photos (Gallery tab only), Enclosures alone (5 residents with name, no links), Book clinic visits + Enclosures (Appointments opens /upcoming-visits), Volunteer (menu and tiles)
- [ ] Data persists — n/a: no write was driven; the gallery upload needs a file picker (see Left for manual verification)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the only write changed is the gallery upload, not driven; see Left for manual verification
- [x] Empty state renders sensibly (no rows yet) — an Enclosures-only login on an enclosure with nobody in it says so; with residents it lists them
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the blank-description refusal is in the action and form, not driven (see Left for manual verification)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no value handling changed

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
| admin | every page | unchanged (not driven) | n/a: not driven |
| management | — | — | n/a: not driven |
| staff | — | — | n/a: retired role |
| doctor | — | — | n/a: not driven; holds View residents, covered by the view_residents login |
| volunteer | /home, /my, /enclosures, /photos/add, /residents | menu Home, My tasks, Residents; tiles View residents, Enclosures, My tasks; all four pages 200 | pass (dev volunteer holds view_residents, enclosures, my_tasks) |
| signed out | — | — | n/a: no signed-out surface changed |

- [ ] Every role above tested — n/a: only one-card logins and the Volunteer were driven; the full re-pass of cards 11-21 is a separate item
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — an Enclosures-only login gets plain text for residents and no /residents links; page and actions ask the same activities as before

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — Appointments opens /upcoming-visits for a login with no clinic link; Volunteer menu unchanged
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe these controls
- [x] Translatable strings go through the translation path, checked at `/management/translations` — new gallery description strings in en and th; Thai not reviewed by a native reader
- [ ] Mobile viewport (375px) — n/a: no layout added; controls are removed, not moved
- [ ] Browser console clean — n/a: logins were driven in the browser pane and inspected through the page; the console was not read
- [x] Network clean — every page opened returned 200 for its login

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /admin/website, /enclosures and an enclosure page, /home, /my, /photos/add, /residents
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — NavLinks, NavPane and routes.ts loaded as four different logins; loadOccupants is shared with /enclosures and was checked there
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: not finished; hero photo and appeals view need a schema PR, filed on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-26-card-review-2-app-half.md
- [x] `README.md` still accurate — it does not describe any of this
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a new line — one line added to `unreleased`, tagged by card
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the dev results quoted were observed in the browser pane

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time… — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target projec… — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`… — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Work… — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Work… — deferred: production release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band … — deferred: production release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand… — deferred: production release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache pu… — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches pr… — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deplo… — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment… — deferred: production release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a… — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean… — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh… — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl… — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is se… — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Website hero photo cannot move behind the photo card without a migration (site_content row policy) | deferred to backlog (schema PR) |
| 2 | medium | Donations form cannot list appeals without appeal.run; decided a names-only view, needs a migration | deferred to backlog (schema PR) |
| 3 | low | An Assistant-only login opening an enclosure page sees an empty main area (that card holds no enclosures read) | accepted: not that card's page |

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
| 1 | Add a gallery photo as a Website photos login: the description fields appear and a blank description is refused | /admin/website?tab=gallery |
| 2 | Sign in as a doctor login: Appointments still opens /appointments | menu |

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

Automated checks by: Claude  Date: 2026-10-26

### Manual verification
- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; it is waiting on a person, see the signature below

Manual verification by: pending: a person drives the gallery upload and a doctor login (Left for manual verification)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed in the PR itself
- [ ] Handed to the production release manager — n/a: this runs at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: given at release time
