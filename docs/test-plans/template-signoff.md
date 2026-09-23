# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Test-plan template: allow a manual signature written at the signer's request |
| Backlog item | none; asked for in chat on 2026-09-23 after PR #64 changed CLAUDE.md |
| Branch / worktree | `claude/template-signoff` @ `C:\Development\Animal_Shelter_template-signoff` |
| Dev server | n/a: no UI change, dev server not started |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | the commit that adds this file, on `5246e7a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked: the template's manual-signature rule now allows a line written on request, matching CLAUDE.md after PR #64
- [x] Files/areas touched listed: `docs/test-plan-template.md`, `docs/decisions.md`, this plan. No `src/`, `scripts/`, `worker/` or `supabase/`
- [ ] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [x] Out of scope written down: already-filled plans in `docs/test-plans/` keep their wording, and `check-test-plan.mjs` is unchanged (it validates the line's shape, not who wrote it)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync`: branched from `origin/main` at `5246e7a` minutes ago, 0 behind
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0, captured to a log)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Data persists — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

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
| admin | n/a | n/a | n/a: docs only |
| management | n/a | n/a | n/a: docs only |
| staff | n/a | n/a | n/a: docs only |
| vet | n/a | n/a | n/a: docs only |
| volunteer | n/a | n/a | n/a: docs only |
| signed out | n/a | n/a | n/a: docs only |

- [ ] Every role above tested — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Mobile viewport (375px) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Browser console clean — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Network clean — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; Lutan asked for this directly in chat
- [x] Design choice appended to `docs/decisions.md`, dated 2026-09-23
- [x] `README.md` still accurate: it doesn't restate the signing rule
- [x] Commit messages say why, not just what
- [ ] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Deployed SHA matches the tested SHA — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

### Rollback

- [ ] Rollback position stated, including what it does not cover — n/a: docs-only wording change (test-plan template and decisions.md); no code, UI, schema or deploy surface

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

| # | What to check | Where |
|---|---|---|
| — | nothing to check by eye: the change is the wording itself, which Lutan asked for | — |

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

Automated checks by: Claude  Date: 2026-09-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: it is empty

Manual verification by: n/a: the wording was dictated in chat; there is no behaviour to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file, which is the checklist
- [ ] Handed to the production release manager — n/a: nothing to deploy; docs only

Result: pass

Release manager acknowledgement: n/a: docs only, nothing ships
