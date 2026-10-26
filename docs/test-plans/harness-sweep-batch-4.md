# Feature test plan — harness-sweep-batch-4

## Header

| | |
|---|---|
| Feature | Harness sweep batch 4: seven red database harnesses, plus the CRLF fault in the blocking hard-coded-security check |
| Backlog item | `docs/backlog.md` → Sweep the remaining red database harnesses; and the CRLF item (on the `backlog` branch, not yet on `main`) |
| Branch / worktree | `claude/harness-sweep-batch-4` @ `C:DevelopmentAnimal_Shelter_harness-sweep-batch-4` |
| Dev server | not started: scripts only, no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | 8b253848 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the `gates:` line pasted below (it also runs the test gate)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch c — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` h — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Production apply plan stated for the release manager (which file, which project, whe — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

## 4. Functional checks

- [ ] Happy path works end to end — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Data persists — reload the page and the change is still there — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Empty state renders sensibly (no rows yet) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

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

- [ ] Every role above tested — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] A role that should not have access is blocked server-side (hitting the URL directly  — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Translatable strings go through the translation path, checked at `/management/transl — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Browser console clean — no errors or React warnings — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item stays open (more harnesses remain) and the CRLF item is on the `backlog` branch, not this one
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-harness-sweep-batch-4.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-harness-sweep-batch-4.md`
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: each harness was run before and after, and the CRLF fix was run on this CRLF checkout

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Deployed SHA matches the tested SHA — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers  — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and  — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-mai — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge  — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches produc — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy ou — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the produc — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change
- [ ] Apply plan stated: which file, which project, and whether it runs before or after th — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served — n/a: scripts and database harnesses only; no UI, route, schema or deploy surface in this change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

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
| | | |

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

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: scripts and database harnesses only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at PR time by the release manager, after this plan is written
- [ ] Handed to the production release manager — n/a: done at PR time by the release manager, after this plan is written

Result: pass

Release manager acknowledgement: n/a: acknowledged at release time
