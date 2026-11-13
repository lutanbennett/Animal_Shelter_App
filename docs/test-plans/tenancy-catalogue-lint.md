# Feature test plan — tenancy-catalogue-lint

## Header

| | |
|---|---|
| Feature | Catalogue lint for multi-tenancy (report-only) |
| Backlog item | `docs/backlog.md` → `#ykefa` (one part; nothing ticked) |
| Branch / worktree | `claude/tenancy-catalogue-lint` @ `C:DevelopmentAnimal_Shelter_tenancy-catalogue-lint` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | see PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — a report-only lint of ownership of API-readable views and security definer functions, as `scripts/check-tenancy-catalogue.mjs` plus `scripts/lib/tenancy-catalogue.mjs`
- [x] Files/areas touched listed — `scripts/check-tenancy-catalogue.mjs`, `scripts/lib/tenancy-catalogue.mjs`, `scripts/check-tenancy-catalogue.test.mjs`, `docs/decisions/2026-11-13-tenancy-catalogue-lint.md`, this plan
- [x] Cards affected identified — none; no card, no app code, signed-out public unaffected, Admin unaffected
- [x] Anything explicitly out of scope written down — no migration, no re-owning, no canary diff, no CI wiring (cannot read the catalogue there); see the decision file

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

- [x] `node scripts/worktree.mjs sync` — see the PR body
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — exit codes read from the file the run wrote:

```
=== gates: typecheck exited 0 after 158s
=== gates: lint exited 0 after 339s
=== gates: test exited 0 after 70s
=== gates: build exited 0 after 280s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight bran — n/a: no UI surface and no migration; a developer script that only reads
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no UI surface and no migration; a developer script that only reads
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no UI surface and no migration; a developer script that only reads
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Existing rows still read correctly after the change (checked against real dev da — n/a: no UI surface and no migration; a developer script that only reads
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Production apply plan stated for the release manager (which file, which project, — n/a: no UI surface and no migration; a developer script that only reads

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-tenancy-catalogue.mjs --env test` against dev read 62 views and 203 functions and flagged 107 (47 views, 60 functions)
- [ ] Data persists — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface and no migration; a developer script that only reads
- [x] Invalid input is rejected with a readable message — with no SUPABASE_ACCESS_TOKEN it prints NOT CHECKED and exits 2, never a clean pass; an empty catalogue read also exits 2
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, date — n/a: no UI surface and no migration; a developer script that only reads

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
| admin | | | |
| exactly `<card key>` | | | |
| exactly `<card key>` | | | |
| signed out | | | |

- [ ] Every login above tested — n/a: no UI surface and no migration; a developer script that only reads
- [ ] A login that should not have access is blocked server-side (hitting the URL dire — n/a: no UI surface and no migration; a developer script that only reads

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manua — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Translatable strings go through the translation path, checked at `/management/tr — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Mobile viewport (375px) — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Browser console clean — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Network clean — n/a: no UI surface and no migration; a developer script that only reads

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI surface and no migration; a developer script that only reads
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked fr — n/a: no UI surface and no migration; a developer script that only reads
- [x] Nothing merged from `main` during `sync` was broken by this branch — the four gates are the check

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on th — n/a: no UI surface and no migration; a developer script that only reads
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-tenancy-catalogue-lint.md`
- [ ] `README.md` still accurate — n/a: no UI surface and no migration; a developer script that only reads
- [ ] **Release notes.** n/a: a developer check, nothing a shelter user sees.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every count in the decision file is from a dev read dated 2026-11-13

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager (a developer script, nothing is deployed)
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (a developer script, nothing is deployed)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (a developer script, nothing is deployed)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (a developer script, nothing is deployed)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Work — deferred: release manager (a developer script, nothing is deployed)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band  — deferred: release manager (a developer script, nothing is deployed)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand — deferred: release manager (a developer script, nothing is deployed)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache pu — deferred: release manager (a developer script, nothing is deployed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches pr — deferred: release manager (a developer script, nothing is deployed)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deplo — deferred: release manager (a developer script, nothing is deployed)
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (a developer script, nothing is deployed)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the pr — deferred: release manager (a developer script, nothing is deployed)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (a developer script, nothing is deployed)
- [ ] For a **destructive or rewriting** migration only: a production backup exists an — deferred: release manager (a developer script, nothing is deployed)
- [ ] Apply plan stated: which file, which project, and whether it runs before or afte — deferred: release manager (a developer script, nothing is deployed)

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is se — deferred: release manager (a developer script, nothing is deployed)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | none found | — |

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
| — | Nothing: no UI surface | — |

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

Automated checks by: Claude  Date: 2026-11-13

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty — n/a: no UI surface, nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: written when the PR is opened
- [ ] Handed to the production release manager — pending: written when the PR is opened

Result: pass

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
