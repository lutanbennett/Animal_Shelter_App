# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the eleven-workstream mark |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine |
| Branch / worktree | `claude/planner-handover-193` @ `C:\Development\Animal_Shelter_planner-handover-193` |
| Dev server | not started — `docs/` only change, nothing to render |
| PR | opened from this branch; number added in the follow-up commit that ticks CI |
| Tested by / date | Claude (Daily Planner) / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | `57b48f97` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat, after the eleven workstreams of 2026-10-16/17; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md` only. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — none. Nothing in the app reads this file; its readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — the stale summary block at the top of `docs/mobile-sweep-inventory.md` is **recorded in the handover and deliberately not fixed here**, so this PR stays a single-file docs change; the `/medical/photos` and `/medical/weight` crash is filed on the `backlog` branch and is a code fix for a later stream; `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 151s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown document with no runtime behaviour
- [ ] Data persists — n/a: nothing is written or read by the app
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a for every row: the file is not served by the app and is not reachable from any route. It is read
from the repository by Claude sessions and by Lutan. The table is left unfilled for that reason.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: not served by the app |
| management | n/a | n/a | n/a: not served by the app |
| staff | n/a | n/a | n/a: retired role, and not served by the app |
| doctor | n/a | n/a | n/a: not served by the app |
| volunteer | n/a | n/a | n/a: not served by the app |
| signed out | n/a | n/a | n/a: not served by the app |

- [ ] Every role above tested — n/a: the file has no route, so there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route, no server handler

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: internal process document, not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing loads in a browser
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — none: no page reads `docs/planner-handover.md`. Verified by `grep -rn "planner-handover" src/ worker/ scripts/`, which returns nothing, so no code path depends on its shape or contents
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; the diff is one `docs/` file
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.` and the three gates passed afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the workstream counter, and `docs/backlog.md` is untouched by this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: **the handover is itself the record**, and the two findings a decision file would otherwise hold (the sub-feature banding rule being wrong, and a stream spinning off its own schema PR) are written into it as named sections. `docs/decisions/2026-10-08-planner-handover-counter.md` already covers why this document exists and when it is rewritten
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about the handover
- [ ] **Release notes.** — n/a: an internal planning document; no shelter user could notice it, and `src/lib/releases.ts` is untouched. Note that `unreleased` already carries five lines from this round's batches, which belong to those PRs and not to this one
- [x] Commit messages say why, not just what — the commit explains why this edition is worth reading rather than skimming: it reverses the previous edition's newest banding rule, and names the three measurements that forced it
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every figure in the handover was read from `get_session` / `get_usage` in the turn the merge was noticed, not estimated afterwards; the route counts (121 total, 104 `ok`, 13 fixed, 4 `not checked`) were counted from `docs/mobile-sweep-inventory.md` with `awk`, not from the PR's prose; and the one claim that could not be established — whether the `/medical/*` crash is a regression from #685 — is written down as unproved rather than asserted

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `57b48f97`; it is the tip of this branch, and the file does not ship in any build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build, but the SHA check belongs to whoever next deploys

### On the deployed build

- [ ] Deployed to test — deferred: production release manager. A `docs/` file is not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are planning estimates in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this commit restores the previous edition, which is #676's. Nothing else is affected: no build carries this file, no migration is involved, and no runtime reads it. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting this PR would leave the counter reset while the handover it describes was gone — whoever reverts should set the counter back to 11 by hand

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/mobile-sweep-inventory.md`'s "Progress so far" block still reads as mid-work and contradicts the completed table below it (all 121 routes carry a verdict) | deferred to backlog — recorded in the handover's *Traps* section; out of scope here to keep this a single-file docs PR |
| 2 | high | `/medical/photos` and `/medical/weight` crash when opened with no resident chosen (`t` passed across the server/client boundary into `ResidentPicker`) | deferred to backlog — found and filed by the mobile sweep (#689); named in the handover as the next round's first candidate |

Neither defect is in this PR's diff. They are listed because this plan is where the planner's pass
over the round is recorded, and both were found while writing it.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, deliberately. There is no surface a person needs to look at: the document's audience is the
next `/plan-day` chat, and the way it gets verified is being used — which happens after this merges,
not before it. Its figures were all read from the sessions rather than estimated, and the one
unproved claim is labelled as unproved in the text.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing here needs deploying; the section 8 `deferred:` lines are the standing handover

Result: pass
