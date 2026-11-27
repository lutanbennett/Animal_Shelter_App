# Feature test plan

## Header

| | |
|---|---|
| Feature | Intake wizard warns when a resident name is taken or similar, and offers the next number |
| Backlog item | `docs/backlog.md` → `#dupnm` |
| Branch / worktree | `claude/intake-duplicate-name` @ `C:\Development\Animal_Shelter_intake-duplicate-name` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 6df2bcce1 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the name box on `/residents/new` warns when the name is taken or looks like an existing resident's, and offers *Name N* as one press; never a refusal
- [x] Files/areas touched listed: `src/lib/residents/near-names.ts` (moved from `scripts/lib/near-names.mjs`) and its test, `scripts/load-residents.mjs`, `scripts/correct-resident.mjs`, `scripts/upload-blood-work.mjs` (import path only), `src/app/residents/new/` (`page.tsx`, `IntakeForm.tsx`, new `NameField.tsx`), both dictionaries, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-11-27-intake-duplicate-name.md`
- [x] Cards affected identified: whatever card grants `resident.register` (the page's gate) now also sees the resident names its RLS lets it read from `resident_list_view`; no access changes, and the one new control only fills the name box (it performs no action). Admin as before; the signed-out public is unaffected
- [x] Anything explicitly **out of scope** written down: renumbering existing residents, matching-rule changes, `other_names`, a bare-fact warning for logins that cannot read residents (decision file, "Not done")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Pasted from this run:

```
=== gates: typecheck exited 0 after 27s
=== gates: lint exited 0 after 268s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 143s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: driven headless Chrome (`scripts/lib/driven-session.mjs`, management login, port 3002) registered *Tiger*, then a second *Tiger*; the warning read "There is already a resident called this. R-9500 Tiger … Use “Tiger 2”"; pressed it and registered
- [x] Data persists — reload the page and the change is still there: after the redirect the page was reloaded and its heading read *Tiger 2*; a third run offered and saved *Tiger 3*
- [x] Create / edit / delete all exercised (whichever the feature has): create only; rows left on dev as disposable test data
- [x] Empty state renders sensibly (no rows yet): a name with no match (the first *Tiger*) showed no warning
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: nothing new is rejected; the warning never blocks and the existing required-name check is unchanged
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): in `near-names.test.mjs` — case and accents, bracket tags, Thai names, 3-letter names left out, numbered names (Tiger 2 typed when taken, a gap Tiger 5 → Tiger 6, a lone Tiger 2 is no clash)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents/new` | warning shows (reads every row) | not run: page access unchanged |
| management role, holds the `resident.register` card (transient context) | `/residents/new` | warning, number offered, saves | pass |
| a card without resident reads | `/residents/new` if it grants `resident.register` | no warning (its list reads empty) | not run: recorded as a gap for the planner |
| signed out | nothing | redirect to sign-in | not run: page access unchanged |

- [ ] Every login above tested — n/a: page access is unchanged by this PR; the only new read goes through RLS on `resident_list_view`
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new route or action; `requirePermission("resident.register")` is untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the warning explains itself on screen; no manual topic describes the name box
- [x] Translatable strings go through the translation path, checked at `/management/translations`: new strings in both `en.ts` and `th.ts`, including the four rule reasons (dictionary strings, not database translations)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — pending: a person to look at the warning box on a phone
- [ ] Browser console clean — no errors or React warnings — n/a: headless run, console not captured
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no new requests; the list loads with the page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): the full intake wizard was driven to Register three times, and each resident page loaded
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI touched; the three scripts' new import was checked by the rule tests and loading each module
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged; already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-11-27-intake-duplicate-name.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line for volunteers registering a resident
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The faithful move: the same five rule tests pass on the old and new file; the numbering: three driven registrations

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing date-based
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold changed; the rules are unchanged
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first build read `current_status` from `residents`, where it does not exist, so the warning stayed silent | fixed: reads `resident_list_view` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The warning box reads well and fits on a phone, in English and Thai | `/residents/new`, type an existing resident's name |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to look at the warning on a phone

Manual verification by: pending: Lutan to look at the warning on a phone in both languages

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect found is fixed
- [ ] Checklist pasted into the PR — pending: the PR body links this plan
- [ ] Handed to the production release manager — pending: the next release

Result: pass
