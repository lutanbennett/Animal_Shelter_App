# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `765` — the eleven streams merged since `764`, written on Lutan's instruction once the count reached nine |
| Backlog item | none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` covers it under "Every PR merges on green" |
| Branch / worktree | `claude/handover-765` @ `C:\Development\Animal_Shelter_handover-765` |
| Dev server | not started — this PR replaces one document and no code |
| PR | filled in below once opened |
| Tested by / date | Claude (planner session) · 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `ac648059e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — asked whether to write the handover now or when a stream merged, Lutan chose *"When one merges"*; two merged, so this replaces `docs/planner-handover.md` with edition `765`
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced) and this plan. No route, no `worker/`, no migration, no shared lib, no script
- [x] Cards affected identified — **none.** No card's behaviour changes, nothing is granted or denied, and admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — `docs/release-handover.md` is untouched (it is the release manager's, and `scripts/check-release-handover.mjs` reports it current for `0.47.4`); the band table itself is **not** edited, only recommendations about it are recorded; the eleven backlog items this edition reports were filed on the `backlog` branch, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` minutes before the commit and `git status` was clean; no merge was needed
- [x] `node scripts/gates.mjs` — run in this worktree in the background with output to a file, then read back; pasted below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 41s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 141s
=== gates: test — npm test
=== gates: test exited 0 after 32s
=== gates: build — npm run build
=== gates: build exited 0 after 122s
gates: typecheck=0 lint=0 test=0 build=0
```

The build gate ended `0` on a single run, so the `SecurityFatalError` halt did not fire and `gates.mjs`'s retry was not exercised — **a fifth consecutive clean build**, after the four #1735 measured. `lint` now runs `check-script-ts-imports.mjs` and `check-script-exits.mjs`, both added to it today, and both passed.

**Stated rather than glossed: the gates ran at `ac648059e`, and `docs/planner-handover.md` was edited afterwards.** PR #1742 merged at 16:01Z while this plan was being filled in, so the document was corrected from "ten streams, #1742 in flight" to "eleven streams", its figure was added and marked as **not a band reading** (`rescoped=yes`), and the floor line was recounted. **The gates were not re-run, because no gate reads this file**: `typecheck`, `test` and `build` do not compile `docs/`, and `lint`'s script checks read `docs/backlog.md`, `scripts/` and `src/`, none of which changed. **CI runs on the final head and is the authority on that claim.**

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. **This edition reports that `0418`-`0421` exist on #1742's branch and that production owes them; it does not carry them**
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: nothing in this PR reads or writes the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. Every figure quoted in the document was read from a merged PR's `stream-usage:` comment with `gh pr view`, not from the database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: this PR applies nothing. **The document states the apply plan it is reporting: `0418` to `0421`, in order, before the next production deploy**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no user-facing behaviour; one document is replaced
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

- [ ] Role/card access recorded — n/a: nothing in this PR is reachable by any login. A document in `docs/` is not served by the app, so there is no card, no admin case and no signed-out case. Analysed by card per `CLAUDE.md`: no card's behaviour changes

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The handover is for the next planner chat, not for a shelter user
- [ ] Translatable strings go through the translation path — n/a: no user-visible string
- [ ] Mobile viewport (375px) — n/a: no page changed
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page is near it; the diff is one document plus this plan
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is `origin/main` plus one document, and the gates above ran on it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a handover has no backlog item. The eleven items this edition reports were filed on the `backlog` branch, which is where they belong, and `#scimp` was rewritten there twice
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice is made here. The decisions this edition reports already have their own files, including `docs/decisions/2026-11-19-platform-console-finish.md` and `docs/decisions/2026-11-19-script-exit-debt.md`
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the app would notice. It is an internal handover between planner chats; no behaviour changed
- [x] Commit messages say why, not just what — the commit says why the document leads on production owing four migrations, and records the band evidence in both directions
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every figure came from a merged PR's `stream-usage:` comment; the floor values are `tokens − messages` on those readings; the six broken writes, the policy mechanism and the four migrations are quoted from #1742's own PR body; the `hard-coded-security` failure and its eight named functions were read from the CI job log, and the SQL was read in the worktree before being described. **Two claims are explicitly corrections of `764`** — that `0395` and `0415` were in fact correct, and that its band-table recommendation is now contradicted by ten readings

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the production release manager, at the next deploy
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: the production release manager. Nothing here reaches a deployed build
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager. There is nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date or a "today". The dates in the document are recorded facts, not computed values
- [ ] **Boundary or banding change covers both edges** — n/a: no code boundary changes. The band *table* is not edited by this PR; the edition records which revisions fired and which missed and deliberately leaves the table to the next planner
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is pasted exactly as the run printed it, per-gate timings included
- [ ] Public pages re-checked after a cache purge — deferred: the production release manager. No public page changes
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: the production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: the production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: **no new secret or environment variable.** `PLATFORM_HOST` is reported by this edition and was added by #1739, not here
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither a migration nor code
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh, for a destructive or rewriting migration — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration to apply from this PR
- [ ] Rollback position stated — n/a: reverting this PR restores edition `764` and changes no behaviour

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found by this PR | The faults this edition reports were found by the streams it covers. Each is fixed in its own PR, filed (`#wbsrw`, `#dvshl`, `#rcpfm`, `#adrus`, `#padpr`, `#lkaud`, `#shnms`, `#shnam`) or carried on `#scimp` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | A handover outranks nothing, is read by one chat, and is corrected by its successor rather than by a reviewer — `CLAUDE.md` gives that as the reason these merge without a review round-trip |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed
- [x] The manual list above is empty, so whoever filled the plan may tick this — there is nothing for a person to look at
- [x] Open defects are either fixed or explicitly accepted above — there are none
- [ ] Checklist pasted into the PR — pending: the PR does not exist at this commit; its body carries this checklist and is opened in the same step
- [ ] Handed to the production release manager — n/a: nothing here reaches production as behaviour. **The one thing the release manager must take from it is stated in the document itself: apply `0418` to `0421` before the next deploy**

Automated checks by: Claude (planner session)  Date: 2026-11-19
Manual verification by: n/a: no manual list — nothing is served by this change for a person to look at

Result: pass
