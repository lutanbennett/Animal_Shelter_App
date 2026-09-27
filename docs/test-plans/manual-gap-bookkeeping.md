# Feature test plan — manual-gap-bookkeeping

## Header

| | |
|---|---|
| Feature | Close the six `--drift production` rows that were already satisfied, and stop deploy-time checks accumulating in manual-verification lists |
| Backlog item | none — asked for in chat by Lutan, 2026-09-27, after the release-manager session measured the manual backlog at 97 open items across 37 plans |
| Branch / worktree | `claude/manual-gap-bookkeeping` @ `C:\Development\Animal_Shelter_manual-gap-bookkeeping` |
| Dev server | not started — documentation and checklist bookkeeping only |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `e42677f` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — record the `--drift production` checks that were actually run, and change the template so deploy-time checks stop being listed twice
- [x] Files/areas touched listed — `docs/test-plan-template.md` and six files under `docs/test-plans/`. No `src/`, no `worker/`, no migrations, no runtime code of any kind
- [x] Roles affected identified — **none.** Nothing in the app changes
- [x] Anything explicitly **out of scope** written down — (a) `cut-release-0-7-0`'s `--drift` row, which is **not** closed because that deploy has not happened; (b) the other ~91 open manual items, which need the testing day Lutan is planning and are not bookkeeping; (c) signing any plan on Lutan's behalf beyond the checks he personally ran

**Why this is worth a PR rather than a quiet fix.** The manual-verification list is the project's handover device, and the rule is explicit that a signature which does not correspond to someone having looked is worse than none. So closing rows needs the same care as writing them: each one below names what was run, when, and what it produced.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified: `git rev-list --count HEAD..origin/main` returned **0**, at `e42677f`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] `node scripts/check-test-plan.mjs` exits 0 across the whole tree after the edits — run, because this PR edits six existing checklists and a malformed one would fail CI for reasons unrelated to its content

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — `check-test-plan.mjs` exits 0 over the tree, so every edited checklist is still well-formed: no unticked-and-unreasoned lines, no placeholders, signatures parse
- [ ] Data persists — n/a: documentation
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input. The checker is what rejects a malformed plan and it was run
- [x] Boundary cases checked — **each closure was verified against evidence before it was written**, and one was deliberately left open:

  | Plan | Evidence the check was actually run | Closed? |
  |---|---|---|
  | `production-drift-visible` | Lutan ran `--drift production` from the main checkout; 2026-09-25 against `7bf0e9c` (82 files, 82 applied, no drift) and 2026-09-26 against `8cc4880` (91 files, 90 applied, `0091` named) | **yes — its only item, so the plan is now signed** |
  | `cut-release-0-4-0` | the 2026-09-25 run, which also settled that plan's defect 1 | item 3 only; item 1 stays open |
  | `cut-release-0-5-0` | drift run, `0085` and `0086` applied together as the plan required, no drift reported before deploying | item 3 only; items 1 and 4 stay open |
  | `cut-release-0-6-0` | the 2026-09-26 run against `8cc4880`, which corrected this plan's own claim that five migrations were pending | item 3 only; items 1, 4, 5 stay open |
  | `cut-release-0-6-1` | drift run, no drift with everything applied, then deployed | item 2 only; items 1, 3, 4 stay open |
  | `cut-release-0-7-0` | **none — this release has not been deployed** | **no.** The row was removed as a duplicate of section 8, not closed as done |

- [x] The distinction between "done" and "not a row here" was kept — `0.7.0`'s `--drift` is still a hard prerequisite and still owned, in section 8 as `deferred: Lutan`. Removing its manual row does not weaken it; the plan says so in place of the row

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | no behaviour change — these files are not served by the app | unchanged |

- [x] Every role above tested — n/a: `docs/` is not rendered by the app at any URL. Nothing here is reachable by any role
- [x] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does has changed
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route; nothing imports `docs/`
- [x] Any shared file touched checked from a second, unrelated page — `docs/test-plan-template.md` is consumed by people and by `check-test-plan.mjs`. The checker was run over the whole tree after the edit and exits 0, so the new paragraph does not introduce text the parser mistakes for a checklist line
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `e42677f`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; asked for in chat
- [ ] **Release notes.** — n/a: no shelter user could notice this. It changes checklists and a template, not the app
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a as a design decision; the reasoning is written into `docs/test-plan-template.md` itself, which is where someone filling in a plan will actually meet it. A `decisions.md` entry would be read by nobody at the moment it matters
- [x] `README.md` still accurate — unaffected
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `e42677f` plus this branch's commit
- [ ] Deployed SHA matches the tested SHA — n/a: this PR changes nothing that deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: `docs/` is not part of the Worker bundle. Nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable change
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling. The dates written into the plans are records of past runs, not computed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: nothing to apply
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [x] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — nothing to roll back: no deploy, no migration, no runtime change. If reverted, six plans regain rows that were already satisfied and the template loses a paragraph. **The one thing a revert could not undo is judgement already recorded**: the closures name Lutan as having run the checks, and that claim should only ever be reverted if it is untrue — not to tidy a diff

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (process) | Deploy-time checks were being listed in both section 8 (`deferred:`, which passes and names an owner) and the manual-verification table (which nothing ever closes). Five release-cut plans accumulated permanently-open rows that way, inflating the manual backlog with work that had actually been done | fixed: the template now says section 8 owns them, the five rows are closed against evidence, and `0.7.0`'s duplicate row is removed |
| 2 | low | Claude wrote those rows in the first place, release after release, without noticing they could never be closed | accepted and named here rather than quietly fixed. The measurement that exposed it — 97 items across 37 plans — only happened because Lutan asked how to fix the gap, which is a poor way to find a process fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the closures are a fair account of what he actually ran. Every one names a date and a result, and Lutan is the only person who can confirm they match what he did. Nothing here was signed on a guess, but he is the authority on it | the six plans in this PR |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is Lutan's to confirm, and it is the one claim in this PR that rests on his memory rather than on a file

Manual verification by: pending: Lutan to confirm the closures match the `--drift production` runs he actually made

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session

Result: pass
