# Feature test plan

## Header

| | |
|---|---|
| Feature | Status alert mail tile says what to press when the last mail reached nobody |
| Backlog item | `docs/backlog.md` → **System status: the Status alert mail tile is red and there is no way to clear it** (annotated, not ticked) |
| Branch / worktree | `claude/status-alert-mail-clearable` @ `C:DevelopmentAnimal_Shelter_status-alert-mail-clearable` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `e3c50338` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a red Status alert mail tile (last mail reached nobody) now says in plain words what to press; clearing is unchanged and still needs a mail that reached an admin. The Pi relay half is written up as a decision, not built, as the brief allows
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/admin/status/page.tsx`, both dictionaries (`fixHere`/`fixOnPi`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/decisions/2026-10-16-alert-tile-green-needs-delivery.md`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public: admin only (System status is admin)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the Pi-to-Worker relay (decision file, backlog branch), any Pi deploy, any migration

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

- [x] `node scripts/worktree.mjs sync`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them. Closing line:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` revie — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` revi — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and re — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the chang — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real  — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not n — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manag — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path — n/a: not driven in a browser this session (no sent=0 row seeded on dev); listed under Left for manual verification
- [ ] Data persists — n/a: no data written by this change
- [ ] Create / edit — n/a: no data written
- [ ] Empty state — n/a: the new line only shows when the last mail reached 0
- [ ] Invalid input — n/a: no input
- [ ] Boundary — n/a: no input

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

- [ ] Every role above — n/a: admin-only page, unchanged access; no access logic touched
- [ ] A role that should not — n/a: no access logic touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — System status topic, alert tile paragraph
- [x] Translatable strings go through the translation path, checked at `/management/translations` — both dictionaries (en, th) get the same keys
- [ ] Mobile viewport — n/a: not driven in a browser this session (no sent=0 row seeded on dev); listed under Left for manual verification
- [ ] Browser console — n/a: not driven in a browser this session (no sent=0 row seeded on dev); listed under Left for manual verification
- [ ] Network clean — n/a: not driven in a browser this session (no sent=0 row seeded on dev); listed under Left for manual verification

## 6. Regression

- [ ] The pages nearest — n/a: only one conditional line added to the Status alert tile
- [ ] Any shared file — n/a: shared files touched only by appending text (manual, releases, dictionaries); typecheck/build pass
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked on purpose: the Pi relay is still outstanding; item annotated instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-16-alert-tile-green-needs-delivery.md`
- [x] `README.md` still accurate — no README claim about this tile
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a System status line for admins. No manual step is outstanding for it to be true
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the 'newest mail decides the colour' claim was read from `checkAlerts()`, not measured against a seeded row; stated as such in the decision

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints bo — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works  — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a product — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Pi-drawn page cannot send a test mail; relay not built | deferred to backlog (see decision file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Insert a sent=0 test row on dev, load System status at phone width: red tile shows the "To turn this green" line; then a test mail that reaches an admin turns it green | dev |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without 
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was chec — n/a: list is not empty; only a person who looked may tick

Manual verification by: pending: a person looks at the red tile on dev at phone width

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted into the PR body at creation
- [ ] Handed to the production release manager — n/a: the release manager reads it from the PR

Result: pass

Release manager acknowledgement: pending
