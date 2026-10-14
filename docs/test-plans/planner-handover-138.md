# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite after eleven workstreams |
| Backlog item | `docs/backlog.md` → none: the handover rewrite is a `plan-day` SKILL.md step, not a backlog item |
| Branch / worktree | `claude/planner-handover-138` @ `C:\Development\Animal_Shelter_planner-handover-138` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | #610 |
| Tested by / date | Claude (Daily Planner)  Date: 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | 0002bc81 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `docs/planner-handover.md` is replaced with a snapshot written after batches 4, 5 and 6; Lutan asked for the rewrite directly
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly one file, `docs/planner-handover.md`. No routes, no `worker/`, no migrations, no shared libs
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. The file is developer documentation and is not read by the app at runtime
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `.plan-day.md` is gitignored local state and is not in this PR; the two `backlog`-branch commits of 2026-10-14 (`fde71aaa` the F2/F4/W1 filings, `b31be632` the `deploy.mjs --secrets` guard) are on `backlog`, not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 126s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a `docs/` markdown file with no runtime behaviour
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, nothing is stored
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | no change | no change: file is not served |
| management | nothing changed | no change | no change: file is not served |
| staff | nothing changed | no change | no change: retired role (`0173`), and file is not served |
| doctor | nothing changed | no change | no change: file is not served |
| volunteer | nothing changed | no change | no change: file is not served |
| signed out | nothing changed | no change | no change: file is not served |

- [x] Every role above tested — by inspection, not by signing in: `docs/` is not routed, so no role can reach it. `git show --stat` confirms the diff is one `docs/` file
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — there is no URL. `docs/` has no route; Next.js serves `src/app/`, and nothing under `docs/` is imported by the app or the Worker

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: `NavLinks.tsx` not touched; no nav surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: planner documentation, not a shelter-user feature; the manual has no topic for it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-visible strings; the file is English developer prose by design
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none are near it; `build` compiled every route with exit 0, which is the whole app's surface
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — no shared file was touched: the diff is one `docs/` file, so there is no runtime value for another page to depend on
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing was merged in; gates then passed on the branch tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — no item to tick: the rewrite is a `SKILL.md` step. The two follow-ups found this round went on the `backlog` branch as instructed (`fde71aaa`, `b31be632`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — the handover is itself the record, and `docs/decisions/2026-10-08-planner-handover-counter.md` already holds the reasoning for when it is rewritten. The substantive rulings of this round are recorded in it and in memory (`never-block-paid-usage`, `fable-counts-against-weekly`); nothing here is a code design choice
- [x] `README.md` still accurate — unaffected; it does not describe the handover file
- [ ] **Release notes.** — n/a: a planner handover document is developer-facing and invisible to a shelter user; nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit leads with the usage-blocking ruling and why it mattered, then the two Fable corrections, rather than listing sections changed
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every figure in the new file was read from `get_usage` / `get_session` in the same turn the PR merged (219,364 · 187,886 · 259,167 · 545,745 · 129,868), and batch 3's three are written `unmeasured` rather than estimated. The `deploy.mjs --secrets` fall-through was verified by reading `scripts/lib/env.mjs` and `scripts/deploy.mjs:259`, not inferred from the peer report that raised it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date or time logic; the file contains no code
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary, threshold or banding logic in this change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only evidence is the `gates:` block above, pasted exactly as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this change adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit. The file is developer documentation read by future planner sessions, so a revert restores the 2026-10-13 snapshot with no runtime effect of any kind and nothing to re-deploy. It does not cover the two `backlog`-branch commits (`fde71aaa`, `b31be632`), which are separate history, nor the memory files written this round

## Defects found

None.

## Left for manual verification

| What | Why it needs a person | Owner |
|---|---|---|
| Whether the new file actually prevents the mistakes it records | Only observable on the next `/plan-day` run in a fresh chat — the test is whether that session stops re-deriving the Fable bands and does not reintroduce a usage gate | The next planner session |
| Section 8's deploy gates | No deployed build exists at PR time; a `docs/` change rides along with whatever release ships next | Production release manager |

## Sign-off

Automated checks by: Claude (Daily Planner)  Date: 2026-10-14

Manual verification by: n/a: no UI surface and no runtime behaviour — the diff is one `docs/` markdown file, which no role can reach and the app never imports

Result: pass
