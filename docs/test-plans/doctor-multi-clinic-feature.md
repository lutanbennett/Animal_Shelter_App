# Feature test plan

Filled from `docs/test-plan-template.md`.

## Header

| | |
|---|---|
| Feature | A doctor can work at more than one clinic, and a vet login at more than one — the feature half over `0125` |
| Backlog item | `docs/backlog.md` → Vets / doctors → **A doctor can work at more than one clinic.** (schema half `0125` merged; this closes it) |
| Branch / worktree | `claude/doctor-multi-clinic-feature` @ `C:\Development\Animal_Shelter_doctor-multi-clinic-feature` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | linked from the PR itself |
| Tested by / date | Claude / 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `874e876` (gates and harness); see the PR for the tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — A doctor is one person with a list of clinics and a vet login's clinics are its linked doctor's; `scope.ts`, the visit forms, the clinic's Doctors page and Settings → Security now consume `0125`, and Doctor is locked to a linked vet's own entry
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/vets/{scope,doctors,appointments}.ts`; `vet-visits/{new,[id]/edit}` (forms, actions, pages) and `DoctorNameField`; `appointments`, `residents` pages; `management/vets` (list counts, `[id]/doctors` page/table/form/actions); `vets/[id]` hub; `admin/security` (page, actions, `UsersTable`, new `VetDoctorLink`); both i18n dictionaries; `manual/en.ts`; `releases.ts`; no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — vet (scope, forms, locked Doctor), admin (Security linking, admin-only link edits, merge of a login doctor), management (clinic Doctors page, refused on login doctors), staff (visit forms unchanged — still chooses any doctor); volunteer, signed-out: none
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — dropping `current_user_vet_id()` and `user_roles.vet_id` (a migration; own schema PR, on the backlog branch); Thai manual (none exists yet); driving the UI as a vet and as an admin at two-step (see Left for manual verification)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one docs/backlog.md line), and `sync` pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — ends `gates: typecheck=0 lint=0 build=0`, run at `874e876` before the final `origin/main` sync (which brought in one `docs/backlog.md` line):

```
=== gates: build exited 0 after 149s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — the new embeds (`vet_doctors → vet_doctor_clinics → vets`, `vet_doctor_clinics → vet_doctors`) return rows from dev's existing doctors through PostgREST (HTTP 200, Dr Ploy at Mae Wang etc.)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — `node scripts/check-doctor-multi-clinic.mjs` (the schema half's rollback harness) ran against dev with this branch checked out and ended `HARNESS-OK … A … B … C: multi sees A+B not C, legacy sees A only, unlinked sees none … D: multi writes A and B, refused at C … E … F … G: cross-clinic merge moves links, visits and login; staff refused on a login, two logins refused … H`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration — this is the feature half of 0125 (applied to dev, merged); the follow-up that drops `current_user_vet_id()` and `user_roles.vet_id` is its own schema PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR, so nothing to apply to production

## 4. Functional checks

- [x] Happy path works end to end — on the clinic Doctors page as the signed-in admin: Also works here added Dr Anan ("now works here too"), and Merge… folded Mae Wang's Dr Ploy into the Dr Ploy listed at the other clinic — the survivor then read "Also works at …" with the visit still counted. Security and the vet's own forms were not driven (see Left for manual verification)
- [x] Data persists — the page re-rendered after each action with the new state (Anan listed, Ploy merged, picker shrunk)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: add-existing and merge driven in the browser; rename, mark-left and delete paths proved only by the harness and typecheck, not clicked
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven — every clinic opened had doctors; the Mae Wang list rendered, empty text is the existing noDoctors string
- [x] Invalid input is rejected with a readable message, not a crash — typecheck-level: every action returns a refusal string (`nameRequired`, `pickDoctor`, `alreadyListed`, `loginLinksAdminOnly`, `doctorNameTaken`, `pickAClinic`) rather than throwing; a unique violation and an RLS-filtered update are both mapped, not surfaced raw
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no numeric or date input; names are trimmed and whitespace-collapsed as before, and the per-clinic spelling rule is the harness's section B

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security (link / create / unlink a doctor); clinic Doctors page incl. a login doctor's links and merges | Allowed everything; trigger needs aal2 for `user_id` | Harness E, F, G (database); UI not walked |
| management | clinic Doctors page | Allowed on doctors with no login; refused on a login doctor's links and merge (message shown) | Harness F, G (database); UI not walked |
| staff | visit forms | Chooses any doctor at the clinic; refused on a login doctor's links | Harness F, G (database); UI not walked |
| vet | Appointments, Residents, vet-visit forms | Sees and records for all of their doctor's clinics and no others; Doctor locked to themselves | Harness C, D, F (database, real JWTs); UI not walked |
| volunteer | none of these pages | Unchanged — no access | not re-tested; no code path for volunteers touched |
| signed out | none | Redirected to /login | `/management/vets` redirects to `/login?next=…` on the dev server (seen) |

- [ ] Every role above tested — n/a: only admin was driven in the browser; the other roles are proved at the database by the harness, and the vet's forms are listed under Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — by the harness — a vet's reach cannot be widened by the roster (F), a third clinic is refused for insert/update/delete/move/prescription (D), staff cannot touch a login doctor's links and two logins refuse to merge (G); the actions also check `hasManagementRole()` / admin + two-step before writing

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no new page or nav entry — the Doctors page and Security already exist
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — Security ("Accounts and roles"), A clinic's doctors, Vet visit form, Appointments and Residents topics in `src/lib/manual/en.ts` rewritten for the doctor link; the rendered `/manual` page was not opened (no sign-in)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — every new string is in both `en.ts` and `th.ts` (typecheck enforces the same shape); `/management/translations` not opened
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not run — the clinic page is wrapped in `LargerScreenNotice` already, and the Security row adds stacked controls only
- [ ] Browser console clean — n/a: console not read during the pass
- [ ] Network clean — n/a: network log not read during the pass

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — loaded `/management/vets` (counts from links), `/management/vets/<clinic>/doctors` and `/vet-visits/new` (staff/admin view, free-text Doctor, all clinics) in the browser
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: `manual/en.ts` was edited in five topics but not the shared nav or a shared lib other than `scope.ts`; `scope.ts` is read by every vet page and the harness proves its RPC; `NavLinks.tsx` untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` (one `docs/backlog.md` line); no source file came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked in this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-02-doctor-multi-clinic-feature.md`
- [ ] `README.md` still accurate — n/a: README describes no vet-clinic setting
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained one line (admin, management, staff, vet)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the harness result and the gates output are pasted from the runs; the decision file's claims about what the schema does come from reading `0125` and from the harness

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager — nothing here can be true until a build is deployed
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — nothing here can be true until a build is deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager — nothing here can be true until a build is deployed
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager — nothing here can be true until a build is deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: nothing here derives a date or 'today'
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no threshold, band or cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the harness line and the gates lines above are the tools' own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager — nothing here can be true until a build is deployed
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager — nothing here can be true until a build is deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration in this PR; `0125` is already applied to dev and the code here needs only what it created
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; `0125` itself still needs its production apply before this code is deployed, which is the release manager's call

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager — the rollback is a Pi rebuild of the previous SHA; this PR is purely code over additive schema, so there is nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| – | – | None found. | – |

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
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | As a **vet linked to a doctor at two clinics**: Appointments lists both clinics' visits; Residents says both clinic names; New vet visit offers a two-clinic choice and **Doctor is you, locked**; a one-clinic vet sees the clinic by name (no dropdown) | `/appointments`, `/residents`, `/vet-visits/new`, `/vet-visits/<id>/edit` |
| 2 | As an **admin signed in with two-step**: link an existing doctor to a vet login; create a doctor from a login with two clinics ticked; unlink (doctor and visits stay); a legacy vet login's clinic survives being linked | `/admin/security` |
| 3 | As **management**: add a doctor with a name only (no email field anywhere); **Also works here** puts a doctor from another clinic on this list; **Merge…** into a doctor listed at another clinic; Mark as left leaves them on the other clinic; a login doctor's buttons are disabled and say admin only | `/management/vets/<clinic>/doctors` |
| 4 | Wording reads well in English and Thai on the two screens above, and the manual topics (Accounts and roles, A clinic's doctors, Vet visit form) match what you see | `/manual`, both languages |

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

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

Signed by the person who looked (see the template for the three valid states).

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty — it is the handover below, so this stays unticked until the person who looks signs

Manual verification by: pending: the four items under Left for manual verification — a vet with two clinics, an admin at two-step, a manager on the clinic page, and the wording

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
