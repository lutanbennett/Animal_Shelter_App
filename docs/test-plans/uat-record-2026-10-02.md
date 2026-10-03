# Feature test plan

## Header

| | |
|---|---|
| Feature | Preserve the 2026-10-02 role walkthrough record on `main` |
| Backlog item | `docs/backlog.md` → **Re-run the role walkthrough from the top — the 2026-10-02 attempt was blocked on its first step** (Next up) |
| Branch / worktree | `claude/uat-record-2026-10-02` @ `C:\Development\Animal_Shelter_uat-record-2026-10-02` |
| Dev server | not started — this PR adds one documentation file and runs no code |
| PR | pending |
| Tested by / date | Claude (QA session) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | tip of `main` at branch creation |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *move `docs/uat/2026-10-02.md` onto `main` so the blocked walkthrough's record survives the deletion of `claude/uat-vet-pass`*
- [x] Files/areas touched listed — exactly two files added, both documentation: `docs/uat/2026-10-02.md` and this plan. No source, no scripts, no schema, no config
- [x] Roles affected identified — none. Nothing in the running app reads `docs/`
- [x] Anything explicitly **out of scope** written down — see below

Out of scope:

- **Re-running the walkthrough.** That is the backlog item this record belongs to, and it needs a person driving the app as each role.
- **The branch's other content.** `claude/uat-vet-pass` is 172 commits behind `main`; its diff against `main` shows the whole repo's progress as deletions. Nothing from it is carried across except this one file, which is the only thing it ever added. The file is taken verbatim with `git show claude/uat-vet-pass:docs/uat/2026-10-02.md`, not retyped or summarised.
- **The findings themselves.** The diagnosis in that record is already on the backlog (commit `74985d7`), including the verification that its 1102 blocker is fixed. This PR preserves the detail behind that summary, it does not restate it.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` minutes before, so `origin/main` was already in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — evidence pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 33s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 97s
=== gates: build — npm run build
=== gates: build exited 0 after 165s
gates: typecheck=0 lint=0 build=0
```


## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour; the app never reads `docs/`
- [ ] Data persists — n/a: writes no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — a repo file | unchanged | n/a: not served by the app |
| management | nothing — a repo file | unchanged | n/a: not served by the app |
| staff | nothing — a repo file | unchanged | n/a: not served by the app |
| vet | nothing — a repo file | unchanged | n/a: not served by the app |
| volunteer | nothing — a repo file | unchanged | n/a: not served by the app |
| signed out | nothing — a repo file | unchanged | n/a: not served by the app |

- [ ] Every role above tested — n/a: `docs/` is not served by the app at any route
- [ ] A role that should not have access is blocked server-side — n/a: nothing is exposed by this change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: an internal test record, not something a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — there are none; the file is additive and nothing imports or links to `docs/uat/`. Confirmed no reference exists: the only mentions of `docs/uat/` in the repo are in `docs/` prose and `docs/role-walkthrough.md`
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance, and recorded honestly: **no shared file is touched.** The two paths added are new and unreferenced
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is a fresh cut of `origin/main` with one file added

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item is **not** completed by this PR. It asks for the walkthrough to be re-run; this only preserves the blocked attempt's record. Ticking it would be false
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. Moving a file verbatim to the directory its siblings already live in needs no rationale beyond this plan
- [x] `README.md` still accurate — unaffected; it does not enumerate `docs/uat/`
- [ ] **Release notes.** — n/a: no shelter user could notice this. It adds one internal document to the repository and changes nothing that is built, served or rendered
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The record asserts its blocker was a Worker CPU limit and not the Pi. That claim is now **out of date in the reader's favour**, and I checked rather than repeating it: `ORIGIN_HOST` for `test` is `test-pi.lannacare.org` on `main`, `test.lannacare.org` answers `x-lanna-served-by: pi`, and `/admin` returns `307`, not 1102. The backlog item carries that correction so nobody reads the record and concludes test is still on the Worker path

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deployable changes. No build output differs
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: a documentation-only change ships with the next release and needs no deploy of its own
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no runtime surface to smoke-test
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below is verbatim
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting the commit removes the file again, and nothing else is affected because nothing reads it. Note what rollback would then cost: `claude/uat-vet-pass` is to be deleted once this merges, so after that **this PR is the only copy** of the record and a revert would lose it a second time

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | `docs/uat/2026-10-02.md` existed only on an unmerged branch due for deletion, so a 466-line walkthrough record was one `worktree.mjs done` away from being lost | fixed by this PR |
| 2 | Low | The record's own statement that test renders in the CPU-limited Worker is now out of date — #293 moved test to the Pi in `0.14.0` | accepted: the file is preserved verbatim as a record of what was true on 2026-10-02; the correction lives on the backlog item (`74985d7`) rather than being edited into the record |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty — nothing in this change has a surface a person needs to look at)* | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (QA session)  Date: 2026-10-03

### Manual verification

The **Left for manual verification** list is empty: this PR adds one documentation file, which nothing builds, serves or renders, so there is nothing for a person to look at and nothing is being signed for.

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: n/a: a documentation-only change with no runtime surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — the PR is opened first, then the release manager is told

Result: pass with accepted defects

Release manager acknowledgement: pending
