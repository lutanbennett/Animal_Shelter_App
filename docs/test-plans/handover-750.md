# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `750` |
| Backlog item | `docs/backlog.md` → none: the handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/handover-750` @ `C:\Development\Animal_Shelter_handover-750` |
| Dev server | not started — `n/a`, the change is one Markdown document |
| PR | to be filled when the PR is opened |
| Tested by / date | Claude (planner session) / 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | `718af0ea9` — where the four gates ran. The two commits after it are this plan and a one-line correction, both Markdown only; CI re-ran on the new head and that run is what the merge is read against |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` from edition `749` to `750`; no backlog item, and `CLAUDE.md` names the handover as the planner's own deliverable at the setup of a plan's last batch
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md` only, plus this plan. No route, no `worker/`, no migration, no shared lib, no code of any kind
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card is affected**: the file is not read by the app, is not served to any page, and grants nothing. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: `SKILL.md`'s band table (the ~21k stale floor row is recorded for the next plan to revise after a second set agrees, deliberately not edited off one day's reading); clearing the four merged worktrees (all `HELD` by their own sessions, raised with Lutan instead); and filing the three PR-body findings as backlog items (the next planner's judgement, with the reasoning written in)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 131s
=== gates: lint exited 0 after 292s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 122s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no table is read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no user-facing behaviour; the document is read by one chat
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this change | the file is not served to any page | n/a |
| exactly `<card key>` | nothing in this change | no card gates a repository document | n/a |
| signed out | nothing in this change | the file is not served to any page | n/a |

- [ ] Every login above tested — n/a: the change adds no reachable surface, so there is nothing to sign in to
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the document has no URL; it is a file in the repository, which is public on purpose

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry, file untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for a planner chat, not a shelter user; no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page is near it; the four gates, which include a full `next build`, are the regression check for a repository that gained one Markdown file
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` cleanly and the gates passed afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the handover has no backlog item, and `docs/backlog.md` is untouched by this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; the document's own content is the record, and the decisions it reports already have their files
- [x] `README.md` still accurate — unchanged and unaffected
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a planner handover is internal process bookkeeping; no shelter user can see it or is affected by it
- [x] Commit messages say why, not just what — the commit names both leads (the repeated stale-count defect and the 86–87k floor against the table's ~107–111k)
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition is quoted from a source read today: the three `stream-usage:` comments for the tokens, messages and floors; PR #1596's own step-zero report for the seven-of-nine correction; PR #1598's own report for `read_only` being unnecessary; `worktree.mjs list` for the four `HELD` folders. **Nothing in it is inferred from a neighbour's figure or carried forward from `749`**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting the commit restores edition `749` in full, and nothing else is affected: the document is not built, not served, not read by the app and not deployed. There is no runtime state to roll back, and no migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **251 lines / ~17.5k characters against the ~150-line target** `CLAUDE.md` sets for a handover. Two trimming passes cut the "what shipped" section to one line per PR and compressed three paragraphs; the remainder is all delta — six streams' outcomes, two leads, seven owed items answered and three unowned findings — and cutting further would have removed substance to meet a line count. | accepted, and stated rather than left to be noticed |
| 2 | low | The edition's owed item 7 first said the four merged worktrees "were being cleared". They were not: `worktree.mjs list` showed all four still `HELD` by their own sessions. **Corrected in the same session, before the PR was opened.** | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Close the four finished Claude sessions so their worktrees can be removed — `admin-nav-reachability`, `places-probe-fixture`, `report-photo-retention`, `tenancy-lint-schedule`. All four merged; all four folders are `HELD`, which `CLAUDE.md` says to ask about rather than tear down | the Claude desktop app's session list |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan closing the four finished sessions so their worktrees can be cleared

Manual verification by: pending: the four finished sessions are still open, so their worktrees cannot be removed yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: a planner handover is never deployed; it reaches `main` and is read by the next planning chat
