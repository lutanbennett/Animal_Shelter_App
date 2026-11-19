# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `763` — a delta against `762` covering the nine streams merged since it |
| Backlog item | `docs/backlog.md` → none. The handover cadence is a `CLAUDE.md` / `plan-day` process, not a backlog item |
| Branch / worktree | `claude/handover-763` @ `C:\Development\Animal_Shelter_handover-763` |
| Dev server | not started — `n/a: one markdown document, no runtime surface` |
| PR | opened from this commit on `claude/handover-763` |
| Tested by / date | Claude (planner session) / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `df6cf52d7` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `763`; asked for by Lutan in chat (*"write the handover now please and merge it"*), which is the trigger the skill names
- [x] Files/areas touched listed — exactly one file, `docs/planner-handover.md`, plus this test plan. No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Cards affected identified — none. The document is read by a planner chat and by nobody inside the app; no card, no page and no permission changes
- [x] Anything explicitly out of scope written down — `docs/release-handover.md` is NOT touched (it is the release manager's and has its own cadence); `.plan-day.md` is gitignored and is updated separately; no band-table edit is made in `SKILL.md`, and the two recommendations that would change it are reported in the document as still unacted

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 117s
=== gates: test — npm test
=== gates: test exited 0 after 29s
=== gates: build — npm run build
=== gates: build exited 0 after 39s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a markdown document has no happy path; its correctness is checked in section 7 instead
- [ ] Data persists — n/a: no data is written by this change
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no rendered state
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: the document is not served by the app |
| exactly `<card key>` | n/a | n/a | n/a: no card gates a repository document |
| exactly `<card key>` | n/a | n/a | n/a: no card gates a repository document |
| signed out | n/a | n/a | n/a: the document is not served by the app |

- [ ] Every login above tested — n/a: the document is in the repository, not behind a login
- [ ] A login that should not have access is blocked server-side — n/a: no server route serves this file

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the document is not a page
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: the manual is for shelter users, and this document is for a planner chat
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — n/a: no requests made

## 6. Regression

- [x] The pages nearest the change still work — n/a in the page sense, so checked the way this document can regress: `docs/planner-handover.md` is the only file changed, its predecessor's content is replaced wholesale as every edition does, and `git show --stat` confirms one file plus this plan
- [x] Any shared file touched checked from a second, unrelated page — no shared file is touched. `grep -rn "planner-handover" --include="*.ts" --include="*.tsx" --include="*.mjs" src/ worker/ scripts/` returns nothing, so no code reads this document and nothing can break by its content changing
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: this change closes no backlog item; the handover cadence is a process rule, not an item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice is made here. The decisions of the day are recorded on their own backlog items, which is what the document points at
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover
- [ ] **Release notes.** — n/a: no shelter user can see a planner handover; this PR touches no `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` file
- [x] Commit messages say why, not just what — the second commit says *why* it exists: #1716 merged while the document was being written, so it covers nine streams and not eight
- [x] Claims in commit messages and decisions were measured, not reasoned — every figure in the document is from a `stream-usage:` comment read with `gh pr view`; the floor is `tokens − messages` per stream; the merged set is from `gh pr list`; the "nine, not eight" correction came from a session listing read in the same turn rather than from an assumption

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the change contains no logic, no dates and no code
- [ ] Boundary or banding change covers both edges — n/a: no boundary, threshold or band exists in a markdown document (the *token* bands it reports are prose, not code)
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above is pasted from the run's own output file
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this change introduces no secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code
- [ ] `--dry-run` against production run and clean — n/a: no migration
- [ ] A production backup exists and is fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this commit restores edition `762` exactly, and nothing else is affected: no code reads this file, so there is nothing to redeploy and no schema to undo. What a revert would NOT cover: the three backlog items this document points at (`#drvcl`, `#dscop`, `#gcnst`) and the retitles of `#cn7gk` and `#drvcl` are all on the `backlog` branch and are untouched by it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The document was first written saying it covered EIGHT streams and was "written early at 8 of 9". #1716 merged while it was being written | fixed before the PR was opened — the figure, the floor and the covered set were all corrected in the second commit |
| 2 | low | It is 237 lines against the skill's ~150-line target | accepted, and said out loud rather than hidden: `762` shipped at 219, and one trimming pass took this from 266 to 237 by replacing three narrative sections with pointers at the backlog items that hold the same reasoning in full |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: a planner handover has no surface a person needs to look at, and its accuracy is checked by the figures and the merged set, both of which were read from `gh` rather than seen on a screen

Manual verification by: n/a: nothing to look at — one markdown document, read by a planner chat, with no rendered surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here reaches production; no code, no schema, no user-visible change

Result: pass

Release manager acknowledgement: n/a: this change does not reach production
