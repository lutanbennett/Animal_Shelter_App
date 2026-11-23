# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `773` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/planner-handover-773` @ `C:\Development\Animal_Shelter_planner-handover-773` |
| Dev server | not started — no runtime surface in this change |
| PR | filled in below once opened |
| Tested by / date | Claude (planner) / 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | `f7430da6a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **replaces `docs/planner-handover.md` with edition `773`, a delta covering nine merged planned streams.** No backlog item, by design
- [x] Files/areas touched listed — **exactly two: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-773.md` (this file).** No `src/`, no `worker/`, no migration
- [ ] Cards affected identified — `n/a: no card is read, written or checked; a markdown document read by one planning chat`
- [x] Anything explicitly **out of scope** written down — **out of scope: `docs/release-handover.md` (the release manager's; `check-release-handover.mjs` reports it current), `.plan-day.md` (gitignored, already updated), and the `plan-day` skill.** Edition `773` cites `SKILL.md:251` as the cause of a misreading and deliberately does **not** change it: that is `#prvln`'s parked second half and Lutan's to unpark

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 42s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 143s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 124s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration; no code reads this file`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: a markdown document has no runtime path; section 6 stands in`
- [ ] Data persists — `n/a: no data; the file is in git`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: the file is not served by the app at any address |
| exactly `<card key>` | n/a | n/a | n/a: no card governs a repository document |
| signed out | n/a | n/a | n/a: the repository is public and this file has always been readable in it |

- [ ] Every login above tested — `n/a: the document is not served by the app`
- [ ] A login that should not have access is blocked server-side — `n/a: nothing serves this file`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry`
- [ ] Manual updated — `n/a: the manual is for shelter users; the handover is read by one planning chat`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — **stands in as: every figure, PR number and claim was read from its source.** The nine `stream-usage:` comments were read with `gh pr view <n> --json comments`; PR #1853 was checked to be the planner's own and excluded; `#1862`'s `rescoped=yes` tail was read, not just its fields, which is what revealed a sibling brief was wrong
- [x] Any shared file touched checked from a second, unrelated page — **`node scripts/check-release-handover.mjs` run: exits 0, release handover current.** That is the one sibling instrument that reads a handover, and it was run rather than reasoned about
- [x] Nothing merged from `main` during `sync` was broken by this branch — **this branch touches neither `src/` nor any file the nine streams touched**

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item, and this branch deliberately touches no backlog file`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the handover IS the record; a decision file about writing one would duplicate it`
- [x] `README.md` still accurate — **read: it does not describe the handover's contents or edition number**
- [ ] **Release notes.** — `n/a: a shelter user, an Admin and a product administrator see nothing; this file is not served by the app and this PR touches no src/, components, manual, i18n or worker path`
- [x] Commit messages say why, not just what — **the commit records the day's lesson and the band finding rather than "update handover"**
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — **the riskiest claims were each checked against a primary source:** that nine streams merged (each PR read for its usage comment), that `#1853` was not one (read, no comment), that the strict guard refused the planner's own commit (it did, on this machine, and the output is quoted in `.plan-day.md`), and that production runs `0.49.0` (`/api/version`, plus the Pi's own checkout)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `n/a: nothing to deploy; this file is never bundled, served, or run on the Pi or the Worker`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no deployed surface`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: this change derives no date and runs no code`
- [ ] **For a boundary or banding change, the assertions cover both edges** — `n/a: the bands in this document are recorded forecasts, not code; nothing branches on them`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: nothing was deployed, so there is no deploy-time evidence; the gates block in section 2 is the only pasted artefact and is an unedited run`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: this change adds no secret and no environment variable`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration and no code`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit restores edition `772`, and that is complete: the file is read by a planning chat only, with no deployed state, no schema and no cached artefact behind it.** What a revert does **not** cover: the `.plan-day.md` updates (gitignored, not in this PR) and the day's `backlog` branch commits, which are independent of this file

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **This edition is 157 lines against the ~150-line target — OVER by 7.** The first draft of this row claimed 142 and called that within target; `wc -l` said otherwise before the PR was opened, which is the only reason the number here is right | **accepted, and stated rather than trimmed.** The detail is in `.plan-day.md` and its archives, which the first line points at. **For a future editor: the figures table is the first thing to cut, since `.plan-day.md` holds it too.** |
| 2 | high | **A sibling brief was wrong when written: `onboarding-runbook` said a console control had shipped when only its database setter had.** Found from `#1862`'s `rescoped=yes` tail | **fixed before the session opened**, which is the only moment a brief patch is safe. Recorded in the edition as the corollary to the frozen-brief rule |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

*Empty on purpose: every claim in this document was read from a PR, a file or the live database from a terminal. There is no screen, no deploy and no device involved.*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — **the list is empty: there is nothing for a person to look at**

Manual verification by: n/a: no screen, no deploy and no device — every check in this plan runs in a terminal

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing to hand over: no deploy, no migration, no runtime change**

Result: pass with accepted defects

Release manager acknowledgement: n/a: a documentation-only change with no deployed surface
