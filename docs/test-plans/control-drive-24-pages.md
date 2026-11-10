# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Control sweep 13: drive the remaining read-opened pages |
| Backlog item | `docs/backlog.md` → #79sqf (retitled, not ticked); #t3n9r stays open |
| Branch / worktree | `claude/control-drive-24-pages` in the control-drive-24-pages worktree |
| Dev server | `http://localhost:3008` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | a85c2994 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Drove 22 of sweep 12's 24 undriven pages under one-card logins; fixed two notices that promised an ability the login lacks (`docs/decisions/2026-11-10-control-listing-sweep-13.md`)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/suppliers/[id]/page.tsx`, `src/app/admin/who-does-what/page.tsx`, `en.ts`/`th.ts` (five keys each), `releases.ts`, backlog, one decision file
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — `suppliers` (intro now names only Archive unless the login also holds `friends.manage`); `who_does_what` (Features link reads See, not Edit, unless Admin); Admin unaffected, signed-out unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: pressing controls in the pane (render-only drive), `/memes/make` canvas, pages with no dev rows; all listed in the decision file

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the gates
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot b — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight bran — n/a: no migration, schema or data change in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration, schema or data change in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration, schema or data change in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration, schema or data change in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration, schema or data change in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev da — n/a: no migration, schema or data change in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback — n/a: no migration, schema or data change in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration, schema or data change in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, — n/a: no migration, schema or data change in this PR

## 4. Functional checks

- [x] Happy path works end to end — `suppliers` login on `/suppliers/[id]` now reads "Archive it here."; `who_does_what` login on `/admin/who-does-what` reads "See the features (Features)" (curl of the server-rendered page, not pressed in the pane)
- [ ] Data persists — n/a: no migration, schema or data change in this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no migration, schema or data change in this PR
- [ ] Empty state renders sensibly (no rows yet) — n/a: no migration, schema or data change in this PR
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no migration, schema or data change in this PR
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, date — n/a: no migration, schema or data change in this PR

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/who-does-what` | Edit the features link | unchanged path, not re-driven |
| exactly `suppliers` | `/suppliers/[id]` | intro names only Archive | "Archive it here." |
| exactly `who_does_what` | `/admin/who-does-what` | See the features link | "See the features (Features)" |
| signed out | any | redirected to sign-in | unchanged, not re-driven |

- [x] Every login above tested — the two logins above; Admin not re-driven (its path is unchanged)
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails — n/a: no access rule changed, only wording; server checks untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: neither sentence is in the manual
- [x] Translatable strings go through the translation path, checked at `/management/translations` — both new sets of strings added to en.ts and th.ts
- [ ] Mobile viewport (375px) — n/a: one sentence and one link label, no layout
- [ ] Browser console clean — n/a: pages fetched with curl, console not read
- [x] Network clean — every page returned 200 under its one-card login

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/management/suppliers` (redirect target) and `/admin/who-does-what/details` still load
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a secon — n/a: en.ts/th.ts are shared but only gained keys; the two pages above load
- [x] Nothing merged from `main` during `sync` was broken by this branch — origin/main merged cleanly, gates run after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — #79sqf retitled to name what is left (not ticked: not all 24 were pressed)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-10-control-listing-sweep-13.md`
- [x] `README.md` still accurate — not affected
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — one line added to `unreleased`
- [x] Commit messages say why, not just what — says why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — every claim above was seen in a fetched page

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.** It was
production until 2026-11-05 and UAT from then until 2026-11-08, so a plan written
from this template before today may name it as either, and both readings were
correct when written. **UAT is deployed on every release since 2026-11-08**
(`docs/release-procedure.md`, step 6), last of the three.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Work — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band  — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache pu — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches pr — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deplo — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the pr — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists an — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or afte — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is se — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Supplier page intro promised Shelter Friend to a login without `friends.manage` | fixed |
| 2 | low | Who does what labelled the Admin-only Features page Edit for every viewer | fixed |

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
| 1 | pressing Archive and the Shelter Friend card as a real login (this drive was render-only) | `/suppliers/[id]` |

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

Automated checks by: Claude  Date: 2026-11-10

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above — pending: one press-through by a person

Manual verification by: pending: a person pressing the supplier page controls in the pane

### Result

- [x] Open defects are either fixed or explicitly accepted above — no defects
- [ ] Checklist pasted into the PR — n/a: not pasted into the PR body; the file is in the PR
- [ ] Handed to the production release manager — n/a: not at release time

Result: pass

Release manager acknowledgement: pending: release

