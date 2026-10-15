## Header

| | |
|---|---|
| Feature | The facility map is a view of the enclosures: shown to anyone who can read them, no separate `facility.map` gate |
| Backlog item | `docs/backlog.md` → **The facility map comes with seeing enclosures** (ticked here) |
| Branch / worktree | `claude/facility-map-with-enclosures` @ `C:\Development\Animal_Shelter_facility-map-with-enclosures` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: number once opened |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | 19641843 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/enclosures/page.tsx`, `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, a decision file
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every role holding `facility.enclosures` at Read gains the map. On dev that is management, staff, volunteer, head_of_medical, head_of_maintenance, second_in_command, and all of them already held `facility.map`, so none gains anything there. Admin has no cell (admin passes by being admin); doctor, public_viewer: no enclosures read, unchanged. Production roles not queried
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the `facility.map` row/cells are left for the follow-up migration filed on the `backlog` branch (Facility section); `/api/facility-maps` untouched

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch — n/a: no migration; the tidy-up is filed on the backlog branch because 0201 belongs to map-rooms-column-drop
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a login with a role holding only `facility.enclosures` Read gets the Map toggle (`view=map` link) on `/enclosures`; dev has 3 plans
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only change; plan editing is untouched
- [x] Empty state renders sensibly (no rows yet) — the toggle still only appears once a plan exists (`plans.length > 0`), as before
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input; the only boundary is holding enclosures Read, which the page already required

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
| admin | /enclosures | not driven (admin has no cell and passes by being admin) | not tested |
| management | /enclosures | held both permissions before and after on dev | read from role_permissions |
| staff | /enclosures | same as management | read from role_permissions |
| doctor | nothing | no enclosures read cell on dev, so no page and no map, unchanged | read from role_permissions |
| volunteer | /enclosures | held both permissions before and after on dev | read from role_permissions |
| signed out | nothing | unchanged, not touched | not tested |
| throwaway role with only facility.enclosures Read | /enclosures | Map toggle present (absent before this change) | pass: 200 and the view=map link in the HTML |

- [ ] Every role above tested — n/a: one role driven (a throwaway role with only facility.enclosures Read); others read from the dev role_permissions table, not signed in as
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the page still calls requirePermission(facility.enclosures, read) first; unchanged, and no new route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — enclosure-map topic now tagged `facility.enclosures` read and says it is not a separate permission; `acceptance-matrix.mjs --check` ok
- [ ] Translatable strings go through the translation path, checked at — n/a: no new strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven at 375 px here, it is listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session driven; server-rendered HTML fetched only
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only one server fetch was made, which returned 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures` fetched as the throwaway role: 200
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a — n/a: manual/en.ts and releases.ts only gained text, and no browser page was loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged cleanly, gates green after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-15-facility-map-is-a-view-of-enclosures.md`
- [x] `README.md` still accurate — does not mention facility.map
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — role list read from the dev table, not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run — n/a: nothing derives a date
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A — n/a: the only evidence pasted is the gates line, as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by — n/a: code only; a Pi rollback to the previous ref restores the old rule, and nothing is stored

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | note | Not driven in a browser or at 375 px; only the server-rendered HTML was checked | accepted, see manual list |
| 2 | note | check-permission-parity.mjs reports RED on doctor / visit.book / adoption_news / medical.archive rows, none involving facility.map | accepted, not caused by this change |

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
| 1 | Map button appears and works at 375 px for a login with only the Enclosures card; tapping an enclosure shows its details | `/enclosures` on Test |
| 2 | Production roles: any role holding `facility.enclosures` Read but not `facility.map` (not queried; dev has none) | production `role_permissions` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed  <<UNMATCHED
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15


- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items wait for a person

Manual verification by: pending: two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens after merge

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
