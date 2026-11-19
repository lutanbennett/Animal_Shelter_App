# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `764` — the nine streams merged since `763`, written on Lutan's instruction |
| Backlog item | none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` covers it under "Every PR merges on green" |
| Branch / worktree | `claude/handover-764` @ `C:\Development\Animal_Shelter_handover-764` |
| Dev server | not started — this PR replaces one document and no code |
| PR | filled in below once opened |
| Tested by / date | Claude (planner session) · 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `752ad7922` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan said *"write the handover now and merge it"*; this replaces `docs/planner-handover.md` with edition `764`
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced) and this plan. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified — **none.** No card's behaviour changes, nothing is granted or denied, and admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — `docs/release-handover.md` is untouched (it is the release manager's, and #1726 already updated it); `brief-blocks.md`'s stale build-halt block is reported as still owed rather than fixed here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — run in this worktree, output below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 67s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 276s
=== gates: test — npm test
=== gates: test exited 0 after 74s
=== gates: build — npm run build
=== gates: build exited 0 after 186s
gates: typecheck=0 lint=0 test=0 build=0
```

The build gate ended `0` on a single run, so the `SecurityFatalError` halt did not fire and `gates.mjs`'s retry was not exercised. `lint` took 276s here, well above its usual time, with no other session building — recorded as an observation, not a defect.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: nothing in this PR reads or writes the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The figures quoted in the document were read from merged PRs' `stream-usage:` comments with `gh pr view`, not from the database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

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
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported a clean merge and this branch changes a file nothing imports

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a handover has no backlog item. The backlog corrections this edition reports (`#dscop`, `#3qmzt`, `#shsed`, `#uvcls`) were made on the `backlog` branch earlier, which is where they belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice is made here. The decisions this edition reports already have their own files, including `docs/decisions/2026-11-19-drive-file-hinge-proved.md`
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the app would notice. It is an internal handover between planner chats; no behaviour changed
- [x] Commit messages say why, not just what — the commit names what the edition covers and that two streams carry no figure with neither being a fault
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every figure in the document was read from a merged PR's `stream-usage:` comment; the floor values are `tokens − messages` arithmetic on those readings; the hinge findings are HTTP statuses recorded in their own decision file. **Two claims are explicitly labelled as corrections of earlier inferences**, one of them a correction of `763`'s own band revision, and the two no-comment cases are explained rather than counted as faults

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the production release manager, at the next deploy
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: the production release manager. Nothing here reaches a deployed build
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager. There is nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date or a "today". The dates in the document are recorded facts, not computed values
- [ ] **Boundary or banding change covers both edges** — n/a: no code boundary changes. The band *table* is not edited by this PR; the edition recommends changes to it and deliberately does not make them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is pasted exactly as the run printed it, per-gate timings included
- [ ] Public pages re-checked after a cache purge — deferred: the production release manager. No public page changes
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: the production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: the production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: **no new secret or environment variable**
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither a migration nor code
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh, for a destructive or rewriting migration — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration to apply
- [ ] Rollback position stated — n/a: reverting this PR restores edition `763` and changes no behaviour

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found by this PR | The faults this edition reports were found by the streams it covers, and each is either fixed in its own PR or filed (`#uvcls`) |

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
- [ ] Handed to the production release manager — n/a: nothing here reaches production as behaviour; it is a document for the next planner chat

Automated checks by: Claude (planner session)  Date: 2026-11-19
Manual verification by: n/a: no manual list — nothing is served by this change for a person to look at

Result: pass
