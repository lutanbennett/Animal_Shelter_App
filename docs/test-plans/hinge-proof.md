# Feature test plan

## Header

| | |
|---|---|
| Feature | The `drive.file` hinge, measured against Google: can an app holding only `drive.file` see a file a human puts into a folder it created? |
| Backlog item | `docs/backlog.md` → `#dscop` (the hinge was its deliverable 5, left unproven by PR #1717) |
| Branch / worktree | `claude/hinge-proof` @ `C:\Development\Animal_Shelter_hinge-proof` |
| Dev server | not started — this PR adds one document and no code |
| PR | filled in below once opened |
| Tested by / date | Claude (planner session, with Lutan at the console) · 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `17a21670f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one new decision file recording a measurement `#dscop` asked for and could not make
- [x] Files/areas touched listed — exactly one file added, `docs/decisions/2026-11-19-drive-file-hinge-proved.md`. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified — **none.** No card's behaviour changes, no card is added or removed, nothing is granted or denied, and admin and the signed-out public are unaffected. This is a document
- [x] Anything explicitly **out of scope** written down — the decision file's *What is still not established* names all three: how much of the full tree is visible (the probe hit the 100-file page limit and did not paginate), whether the Google Picker recovers a human-added file, and the calendar scope's sensitive/non-sensitive class

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — run in this worktree, output below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 41s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 120s
=== gates: test — npm test
=== gates: test exited 0 after 39s
=== gates: build — npm run build
=== gates: build exited 0 after 177s
gates: typecheck=0 lint=0 test=0 build=0
```

The build gate ended `0` on a single run, so the `SecurityFatalError` halt did not fire and `gates.mjs`'s retry was not exercised here.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and nothing in this PR reads or writes the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The measurement this PR records was made against Google's Drive API, not against our database, and its method and statuses are in the decision file
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no user-facing behaviour; one document is added
- [ ] Data persists — n/a: no data is written by this change
- [ ] Create / edit / delete all exercised — n/a: no feature surface in this PR
- [ ] Empty state renders sensibly — n/a: no surface in this PR
- [ ] Invalid input is rejected with a readable message — n/a: no input in this PR
- [ ] Boundary cases checked — n/a: no input in this PR

### Role access matrix

- [ ] Role/card access recorded — n/a: nothing in this PR is reachable by any login. A document in `docs/decisions/` is not served by the app, so there is no card, no admin case and no signed-out case to record. Analysed by card per `CLAUDE.md`: no card's behaviour changes

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no nav entry is added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. This is an internal engineering record, not something a shelter user does
- [ ] Translatable strings go through the translation path — n/a: no user-visible string is added
- [ ] Mobile viewport (375px) — n/a: no page is added or changed
- [ ] Browser console clean — n/a: no page is added or changed
- [ ] Network clean — n/a: no page is added or changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page is near this change; the diff is one file under `docs/decisions/`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched. The diff adds one file and modifies none
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported a clean merge and this branch adds a file nothing imports

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — **n/a: `#dscop` is not closed by this PR.** The hinge is answered, but its done-when also needs the calendar scope's class read from the Cloud Console and Lutan's Web OAuth client, neither of which this PR does. The planner records the answer on the item on the `backlog` branch instead, which is where an answer that is not a tick belongs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-19-drive-file-hinge-proved.md`. It is the whole PR
- [x] `README.md` still accurate — untouched and unaffected; nothing it describes changed
- [ ] **Release notes.** — n/a: nobody using the app would notice. This records a measurement about a scope the self-service screen has not been built with yet; no behaviour changed and no screen exists for a user to see a difference on
- [x] Commit messages say why, not just what — the commit says what was measured, what it corrects in the earlier decision, and that the live token was checked before and after
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every claim in the decision file is an HTTP status from Google, recorded with the operation that produced it. The one mechanism offered as an explanation (that the access record is created when the app creates or opens a file by id) is **explicitly labelled as likely rather than proved**, and the file says to rely on the measured statuses instead. Two inferences from the *earlier* decision file are marked corrected, one of them measured false

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the production release manager, at the next deploy
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: the production release manager. Nothing in this PR reaches a deployed build
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager. There is nothing to smoke-test: the diff is one document
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date or a "today"
- [ ] **Boundary or banding change covers both edges** — n/a: no boundary, threshold, rounding rule, retry window, pagination limit or permission cutoff is changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a for this plan's own body: the gates block is pasted unedited, and the probe's own HTTP statuses are quoted in the decision file as the runs printed them
- [ ] Public pages re-checked after a cache purge — deferred: the production release manager. No public page changes
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: the production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: the production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: **no new secret or environment variable.** The throwaway OAuth client's file was kept in the gitignored `.local/`, its token was revoked, and neither is referenced by any code
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither a migration nor code
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh, for a destructive or rewriting migration — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration to apply
- [ ] Rollback position stated — n/a: reverting this PR removes one document and changes no behaviour. Nothing to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A Node teardown crash (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`) exits non-zero **after** the work completes. Hit twice today: `scripts/check-shelter-settings.mjs`, and the probe's own mint step after the token was minted and saved | **deferred to backlog** — recorded in the decision file's closing section for the planner to file. Not caused by this PR and not a Drive finding |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | The measurement itself was made with Lutan at the console and its results are in the decision file; there is no screen to look at |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed
- [x] The manual list above is empty, so whoever filled the plan may tick this — there is nothing for a person to look at
- [x] Open defects are either fixed or explicitly accepted above — the one defect is deferred to the backlog with its reason
- [ ] Checklist pasted into the PR — pending: the PR does not exist at this commit; its body carries this checklist and is opened in the same step
- [ ] Handed to the production release manager — n/a: nothing in this PR reaches production as behaviour; it is a document

Automated checks by: Claude (planner session)  Date: 2026-11-19
Manual verification by: n/a: no manual list — nothing is served by this change for a person to look at

Result: pass
