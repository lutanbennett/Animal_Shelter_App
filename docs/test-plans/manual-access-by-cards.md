# Feature test plan — manual-access-by-cards

## Header

| | |
|---|---|
| Feature | The manual stops describing access by naming roles, and *Translating* describes the real screen |
| Backlog item | `docs/backlog.md` → `## Documentation`, the two last open items (role-named access sentences; the stale *Translating* topic) |
| Branch / worktree | `claude/manual-access-by-cards` @ `C:\Development\Animal_Shelter_manual-access-by-cards` |
| Dev server | `preview_start` name `dev` → `http://localhost:3005` |
| PR | #TBD |
| Tested by / date | Claude (stream 12, batch 7) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | see the PR's head commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for

  Every sentence in the in-app manual that described access by naming a role now names the activity
  the app actually asks, by its catalogue label; and *Translating*'s steps describe the page as it is
  since the label drafts shipped in `0.41.0`.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)

  `src/lib/manual/en.ts` (prose only), `src/lib/releases.ts` (two `unreleased` notes),
  `docs/backlog.md`, `docs/decisions/2026-11-01-manual-access-by-cards.md`, this plan. No route, no
  component, no `worker/`, no migration, no dictionary.
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: this PR changes no access, and per `CLAUDE.md` the durable statement is by card — every topic keeps the `activity` it had, so who the manual opens on is unchanged for every card
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

  Out of scope and left untouched on purpose: `src/lib/i18n/dictionaries/` (owned by another stream
  this batch, and the two strings that name a role there are their own backlog item);
  `src/lib/manual/manual-pdf.tsx`; the *Translating* topic's Thai (the Thai edition is its own item
  and waits on the real-use review); and the four classes the item named as not-this-fault — a role
  as a contact type, a volunteer as a person, the *Roles and cards* topic, and the public website's
  Volunteer page.

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
  === gates: build exited 0 after 267s

  gates: typecheck=0 lint=0 test=0 build=0
  ```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; this PR adds no file under `supabase/migrations/`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and this PR reads and writes no database row
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration — in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end

  `/manual` loaded on a signed-in dev login holding only the `translations` card, reached by clicking
  through from Management (never by typing the address). The rewritten *Translating* steps render as
  written, and the manual's own card index still lists every card. 63 places changed in all: 57
  sentences that described access by naming a role, plus 6 `path:` lines reading "(the 2IC)" or
  "(Head of Medical)".
- [x] Data persists — reload the page and the change is still there

  n/a as a data check — the manual is a module constant, not a row. Ticked instead on the page
  surviving a reload: `location.reload()` on `/manual` re-rendered the new *Translating* steps.
- [x] Create / edit / delete all exercised (whichever the feature has)

  n/a as CRUD — this PR creates no writable surface; it changes prose that *describes* writes.
- [x] Empty state renders sensibly (no rows yet)

  n/a as an empty state — no data-driven list was added. The nearest equivalent is the manual's
  "Showing the N topics for the cards you hold" line, which rendered correctly (18 topics) on a
  one-card login.
- [x] Invalid input is rejected with a readable message, not a crash

  n/a as input handling — no form or input was touched. Checked instead that no rewrite invented a
  behaviour: each one is anchored on the activity the code asks, named per line under section 6.
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

  The boundary here is "an activity with no readable label", and it was hit twice.
  `placement.death_withdraw` has a catalogue label but **no card bundles it** (`cards.ts` kept it out
  of Manage medical on purpose), so the manual names the activity and promises no card.
  `reference.types` reads *"Setup lists: immunization, procedure and blood-test types, frequencies"*,
  which does not mention Medications, Diets or Units although the same activity opens all three — so
  those sentences say "a login whose cards include the setup lists" and name the page rather than
  coining wording. Both are written up in the decision file and the second is on the backlog.

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

Recorded as transient context only, per `CLAUDE.md`: this PR changes no access, and the roles are a
transient grouping of cards that will be rebuilt. The durable statement is the card one — every
topic keeps the `activity` it had, so which topics the manual opens on is unchanged for every set
of cards, and the only thing that changed is the words inside them.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual` | every topic, as before | unchanged by this PR |
| management | `/manual` | the topics its cards grant, as before | unchanged by this PR |
| staff | — | retired role (`0173`); not tested | n/a |
| doctor | `/manual` | the topics its cards grant, as before | unchanged by this PR |
| volunteer | `/manual` | the topics its cards grant, as before | unchanged by this PR |
| signed out | `/manual` | never reaches it | unchanged by this PR |

Driven for real on a disposable login holding **exactly one card** (`translations`) — the strongest
card-shaped check the tooling offers — which is how `/management/translations` and `/manual` were
read.

- [ ] Every role above tested — n/a: this PR changes no access and no guard, so there is nothing a second login would show differently; the one login used held exactly one card, which is the strongest card-shaped check available
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no guard, route or policy is touched; `/manual` is open to every signed-in login and was before

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or changed; `NavLinks.tsx` is untouched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`

  This PR *is* the manual change. `/manual` was loaded and the rewritten *Translating* steps read
  back verbatim from the rendered page.
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the manual is not translated through that page; its Thai edition is a separate `th.ts` that does not exist yet and is its own backlog item
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, component or style changed; only the words inside existing paragraphs
- [x] Browser console clean — no errors or React warnings

  No errors on `/manual` or `/management/translations` while driving them.
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

  `/manual`, `/management` and `/management/translations` all loaded 200.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)

  `/my`, `/management`, `/management/translations` (on all four Show filters including Waiting) and
  `/manual`.
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one

  `manual/en.ts` has two consumers, `/manual` and `/manual/pdf`. `/manual` was loaded and read back.
  The PDF route shares the same module and is type-checked by gate 1, but was **not** rendered — it
  is in **Left for manual verification**.

  The truth of each rewrite was established by reading the code that decides it, not by inference:
  `src/lib/permissions/routes.ts` (every page's activity and level),
  `src/lib/permissions/catalogue.ts` with `admin.whoDoesWhat.activities` for the labels,
  `src/lib/auth/app-users.ts` (`loadAssignableUsers` filters nobody),
  `src/lib/recurring-jobs/eligibility.ts` (the picker is decided by the linked page's activity),
  `supabase/migrations/0167_perm_convert_vet.sql` (`is_clinic_login()` asks
  `roles.scope_clinical = 'own_clinic'`, never a role name),
  `src/app/NavPane.tsx` (Appointments is a menu entry, not a home tile),
  `src/app/maintenance/page.tsx` (the board's Me/Everyone default asks `recurring.do_any`),
  `src/app/residents/[id]/[section]/sections/photos.tsx` (`photos.resident_manage` for Mark as
  posted), `src/app/management/appeals/[id]/page.tsx` (`appeal.medical_photo`), and
  `src/app/residents/[id]/deceased/undo/page.tsx` (`placement.death_withdraw`).
- [x] Nothing merged from `main` during `sync` was broken by this branch

  `sync` brought in `CLAUDE.md`, `docs/decisions/2026-11-01-every-pr-merges-on-green.md` and
  `docs/test-plans/merge-on-green.md` — no overlap with this branch's files. All four gates ran
  after the merge.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)

  Both items ticked separately, each with its title rewritten to say what was actually found. The
  rest of `## Documentation` was re-read: the real-use review and the Thai edition of the manual are
  both still open and neither is closed by this work.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)

  `docs/decisions/2026-11-01-manual-access-by-cards.md`.
- [ ] `README.md` still accurate — n/a: `README.md` says nothing about the manual's wording and is untouched
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what

  Each names the rule being met and, for the three sentences that were also untrue, the file that
  proves it.
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: this PR contains no date, time or clock logic — Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks:
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold, band, rounding rule or cutoff is touched — A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: the manual is behind sign-in and no public page is touched — — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: production release manager — `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager — — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration — If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration — — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration — (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**.

  Rollback is a redeploy of the previous SHA on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`),
  which fully reverts this change: it is prose in a bundled module, with no schema and no stored
  state. Nothing here needs a down-migration. Original note follows — Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The manual said "Doctors and volunteers aren't given maintenance jobs". The maintenance assignee picker filters nobody (`loadAssignableUsers`). | fixed in this PR |
| 2 | medium | The manual said the recurring-job picker "lists admin, management and staff". It is decided entirely by the page the job links to (`recurring-jobs/eligibility.ts`). | fixed in this PR |
| 3 | medium | The manual said Settings → Medications, Diets and Units are Admin's alone. All three register `reference.types`. | fixed in this PR |
| 4 | medium | The manual said Appointments is a home tile the Doctor role gets from Book clinic visits. That card opens `/upcoming-visits` for every role, and Appointments is a menu entry. | fixed in this PR |
| 5 | low | `reference.types`' catalogue label names only immunization, procedure and blood-test types and frequencies, although the same activity also opens Settings → Medications, Diets and Units. | deferred to backlog |
| 6 | low | The *Cards at a glance* text for Manage medical says "only Admin can withdraw a death", but `placement.death_withdraw` is an ordinary activity. It lives in `src/lib/i18n/dictionaries/`, which this stream must not touch. | deferred to backlog |

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
| 1 | The rewritten sentences read as plain English to someone who is not a developer — a phrase like "your cards include \"Count the stock\"" is accurate but is it readable? | `/manual`, the Residents, Photos, Maintenance, Stock and Settings topics |
| 2 | The manual PDF still renders with the new wording (the route was not driven; only `/manual` was) | `/manual/pdf` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `manual-access-by-cards`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty; both items are for a person to read, and nobody has

Manual verification by: pending: a person reads the rewritten sentences for plain English, and renders `/manual/pdf`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: a docs-and-prose PR with no deploy step of its own; it reaches production with the next release like any other merged change

Result: pass

Release manager acknowledgement: pending: not yet handed over — this PR is not in a release
