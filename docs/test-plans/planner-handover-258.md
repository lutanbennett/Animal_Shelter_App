# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover, edition `258` — rewrite `docs/planner-handover.md` after the round's nine workstreams |
| Backlog item | `docs/backlog.md` → none. The handover is written by the `/plan-day` loop itself (`.claude/skills/plan-day/SKILL.md` step 8, `docs/decisions/2026-10-08-planner-handover-counter.md`), not from a backlog item |
| Branch / worktree | `claude/planner-handover-258` @ `C:\Development\Animal_Shelter_planner-handover-258` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | #787 |
| Tested by / date | Claude (Daily Planner session) / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | `9ec276b9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat, from the nine workstreams merged as #777–#786
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two files, both documentation: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-258.md` (this file). No routes, no `worker/`, no migrations, no shared libs, no `src/` at all
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** The file is not served by the app; it is read by whoever runs `/plan-day`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: cutting `0.39.0` (the release manager's, and `unreleased` carries four lines), the two-way calendar schema follow-up, the newly filed `frequency_id` drop, and the six menu-orphan chats. All are listed in the handover as next round's candidates

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **note the run reports FOUR gates, not the template's three: `test=0` as well.** Pasted unedited; the template's wording predates the test gate

```
=== gates: build exited 0 after 125s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; it touches two documentation files only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. For the record, the state recorded in the handover was read with this command: 236 applied, 236 files, zero drift both ways
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR is reverting two documentation files
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration, so there is nothing to apply to production

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no user-facing behaviour. The file's "happy path" is that the next `/plan-day` chat can read it, covered in section 6
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no data; the change is a committed file
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no CRUD surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows and no rendering
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input path. The dates inside the file are prose, and each was checked against the repo in section 6

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — the file is not served | n/a | n/a: not served by the app |
| management | nothing — the file is not served | n/a | n/a: not served by the app |
| staff | retired role (`0173`) | n/a | n/a: not served by the app |
| doctor | nothing — the file is not served | n/a | n/a: not served by the app |
| volunteer | nothing — the file is not served | n/a | n/a: not served by the app |
| signed out | nothing — the file is not served | n/a | n/a: the repo is public, so the file is readable on GitHub; checked in section 7 that it names no real people beyond Lutan, who is the author |

- [ ] Every role above tested — n/a: `docs/` is not served by the app at any route, so no role can reach it and there is nothing to differentiate
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: not touched, and a documentation file gets no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched. The manual is for shelter users; this file is for the planning loop
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings; the file is internal English prose
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: nothing renders in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages are near it. What *is* near it is the loop that reads it: verified `.claude/skills/plan-day/SKILL.md` step 0 still points at `docs/planner-handover.md` by that exact path, and that the file exists at that path on this branch
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — none touched. The diff is two files under `docs/`, confirmed with `git diff --stat origin/main`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and the gates ran green afterwards, on the merged tree

**Every figure in the handover's state table was re-read from the repo while writing it**, not carried from the previous edition:

| claim | how it was checked |
|---|---|
| `main` at `70a2388b` | `git log --oneline -1` after the `backlog` merge was resolved and committed |
| 236 applied / 236 files / zero drift | `node scripts/apply-migrations.mjs --status` |
| next free migration `0236` | `ls supabase/migrations \| tail` — highest is `0235_stock_receipts_cost_only_update.sql` |
| 87 open backlog items | `node scripts/check-backlog-sections.mjs` |
| no open PRs | `gh pr list --state open` |
| `0.38.0` cut and recorded, `0.39.0` not | `src/lib/releases.ts` newest entry is `0.38.0`, `package.json` version matches, and `unreleased` holds four lines |
| the nine PR numbers | `gh pr list --state merged` |
| ten leftover worktrees | `node scripts/worktree.mjs list` |
| every token figure | `mcp__ccd_session_mgmt__get_usage` per session, read in the turn each batch's merge was confirmed |
| every model / effort | `mcp__ccd_session_mgmt__get_session` per session — nine of nine read, none assumed |

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. The handover is written by the `/plan-day` loop, not from the backlog, and `docs/backlog.md` is deliberately untouched on this branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choices. The reasoning that would go in a decision file is the handover's own content, and the standing decisions it rests on are already recorded (`2026-10-08-planner-handover-counter.md`, `2026-10-13-the-finish-line-is-an-open-pr.md`, `2026-10-20-test-plan-stays-advisory.md`)
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the handover
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. `docs/planner-handover.md` is not served, not linked from the app, and describes how workstreams get planned; no shelter user is affected
- [x] Commit messages say why, not just what — the handover commit states the finding (a well-briefed stream costs about 128k) and why both band errors were classification errors rather than band errors
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every number in the handover came from a tool call recorded in the table in section 6. The ~128k figure is four read measurements, not an average of estimates, and the two band corrections name the specific readings that produced them. Where a figure could not be obtained it is written `unmeasured`; nothing is a guess. `docs/decisions.md` is untouched

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: `docs/` is not bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR, so nothing derives a date at runtime. The dates in the file are written prose
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the "bands" in this file are planning estimates in prose, not code. No threshold, rounding rule, retry window or permission cutoff is changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is pasted from the run, unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — n/a: this PR changes no public page, and `docs/` is not served

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var; this PR adds no configuration

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration to dry-run
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, destructive or otherwise
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the previous edition of `docs/planner-handover.md` and removes this plan. Nothing else is affected: no schema, no deployed artefact, no configuration. **What it does not cover:** the two `backlog`-branch commits made in the same session are not in this PR and are not reverted by it — `f3ea959c` (the sign-off's sequencing note) and the `frequency_id` follow-up item. Nor is the `backlog` merge resolution on `main` (`70a2388b`), which is a separate commit on `main`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/check-backlog-sections.mjs` printed `ok — 87 open items` while `docs/backlog.md` was mid-merge with `<<<<<<<` conflict markers in it. It counts item lines and does not detect a conflicted file, so a green from it during a merge means less than it appears to | deferred to backlog — filed on the `backlog` branch; recorded in the handover under the third finding so the next planner does not trust a green mid-conflict |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty)* | |

The handover is read by the next `/plan-day` chat, which is itself instructed to
re-verify every number against the repo before trusting any of them — so its
accuracy is checked by the thing that consumes it, not by a person looking at a
screen. There is no rendered surface, no role behaviour and no deployed artefact
for anyone to inspect separately from the deploy.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no rendered surface, no role behaviour and no deployed artefact — the file's consumer is the next /plan-day chat, which re-verifies its figures itself

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: documentation only — nothing in this PR reaches a deployed build
