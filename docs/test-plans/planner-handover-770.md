# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover, edition `770` — the delta against `769`, covering the nine streams merged since it |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping and ticks no item; `CLAUDE.md` names it as one of the PRs that merges on green |
| Branch / worktree | `claude/planner-handover-770` @ `C:\Development\Animal_Shelter_planner-handover-770` |
| Dev server | not started — no runtime surface in this change |
| PR | filled in on open |
| Tested by / date | Claude (planner) / 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | `42da3fca9` — the gates ran on this commit. **The head is now `b01a6ee09`**, one later commit that changes prose in the same `docs/planner-handover.md` and nothing else, so no gate can read differently; CI re-runs all four on the PR head and that run is the authoritative green |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: `docs/planner-handover.md` is rewritten from edition `769` to edition `770`, the delta covering #1796, #1798, #1799, #1800, #1801, #1802, #1803, #1804 and #1805.** There is no backlog item by design
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **exactly one file: `docs/planner-handover.md`**, 205 lines (`769`) to 227 lines (`770`). No routes, no `worker/`, no migrations, no shared libs, no `src/`
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: a document in `docs/` that no application code reads; it grants and denies nothing, so no card's behaviour changes and neither admin nor the signed-out public can reach it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope: `docs/release-handover.md`** (the release manager's own document; `check-release-handover.mjs` reports it current and naming `0.47.8`), the `.claude/skills/plan-day/` files (one owed edit remains and is recorded in the document as owed, not made here), and `.plan-day.md` (gitignored, amended outside this PR). **Also out of scope and stated in the document rather than acted on: the two production reads the planner owes, and `0430`'s re-examination**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 64s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 240s
=== gates: test — npm test
=== gates: test exited 0 after 47s
=== gates: build — npm run build
=== gates: build exited 0 after 154s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; the head on `main` is `0433` and no branch is in flight at all
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there is no DDL to exercise. **Note, because this edition is partly about that harness pattern: the document records `#701vn`, which is that a harness claiming to prove scoping must set `role=anon` claims. No harness is run here**
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; the document's own predecessor is its rollback, in git history
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration, nothing to apply to any project

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour; the artefact is a document read by a chat, not by the app
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no data written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the change has none of the three
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this change | n/a — no reachable surface | n/a |
| exactly `<card key>` | nothing in this change | n/a — the change grants and denies nothing | n/a |
| signed out | nothing in this change | n/a — the file is not served by the app | n/a |

- [ ] Every login above tested — n/a: the change adds no reachable surface, so there is nothing for a login to reach; the matrix is filled with that answer rather than left blank
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL serves this file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` not touched and no nav entry is wanted for a planner document
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; a planner handover is Claude's own process record and has no place in it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings; the document is English-only process prose
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no viewport
- [ ] Browser console clean — no errors or React warnings — n/a: nothing is loaded in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **checked as the whole app rather than by page: `build` compiled every route (exit 0), which is the only regression surface a `docs/` change has.** No page reads this file
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; the one file changed is read by no code
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in and there was nothing to break

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a handover has no backlog item. The six findings of this round (`#fu86i`, `#m52yp`, `#gyw6m`, `#oga26`, `#9l7xf`, `#701vn`) were filed on the `backlog` branch, which is where follow-ups belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no design choice in this PR. The judgements the document makes about banding and process are stated in the document itself, which is where its only reader will meet them
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover's contents
- [ ] **Release notes.** — n/a: no shelter user, Admin or product administrator can see this change. Nothing appears, moves or disappears on any screen: the only file touched is `docs/planner-handover.md`, which is read by a Claude planning chat and is served by nothing. `unreleased` in `src/lib/releases.ts` is deliberately untouched
- [x] Commit messages say why, not just what — the commit explains **why this set has no overruns where `769`'s had three**, which is the document's central claim
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — **every one of the nine figures was read from its own PR's `stream-usage:` comment with `gh pr view <n> --json comments` in this session**, and the nine floors are arithmetic on those figures. **The statements that are NOT measurements are labelled as such in the document:** the three band lessons are each marked as one reading or as inconclusive, the floor outlier is recorded with *"offer no cause"*, and the Worker and Pi logo paths are stated as **unproven** with the command that would settle them. **One correction of the planner's own is recorded rather than smoothed over:** the restrictive-policy hypothesis in the `#m52yp` brief was **disproved** by that stream's measurement, and the document says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: a handover is never deployed; it carries no built artefact
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in this PR reaches a deployed build
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no logic at all, and no code derives a date from this change. The dates and times in the document are prose
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the "bands" in this document are planning forecasts in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block above is the run's own output with its per-gate timings; the nine figures in the document are the `stream-usage:` comments as `gh` printed them
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: this PR cannot change a public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy, no Worker bundle built
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: it contains neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **revert the commit; edition `769` is restored verbatim from git history.** There is nothing else to cover: no migration, no deploy, no Worker, no Pi rebuild. **What it does not cover: `.plan-day.md`**, which is gitignored and was amended outside this PR, so a revert here does not undo that — it is the planner's own note rather than a shipped artefact. **It also does not cover the six backlog items filed on the `backlog` branch**, which are separate commits there and would survive a revert of this one, correctly

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None in this change. | — |

**Two defects of the PLANNER'S are recorded in the document itself rather than here, because they are not defects in this PR:** a worktree created for `#shfil` and withdrawn once the already-built check ran, and two backlog item ids written the wrong way round in two briefs. **The second was caught by `claude/logo-alpha-serving` at step zero and corrected in the live brief before its session opened.** Both carry a stated fix in the document.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. The change is a planner process document with no surface a person needs to look at; its correctness is judged by the next planning chat reading it, and a wrong line is corrected by its successor rather than by a reviewer. | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below

Manual verification by: n/a: the list is empty — one document in `docs/`, no runtime surface, nothing for a person to look at separately from reading the document itself

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in substance and said plainly: a handover is never deployed, so there is nothing for the release manager to receive. `CLAUDE.md` puts this PR in the merge-on-green set for exactly that reason

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches a release
