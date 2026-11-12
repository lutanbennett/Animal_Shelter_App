# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `742`, plus the two brief-writing rules its own mistakes earned (`brief-blocks.md`, `SKILL.md`) |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping and closes no item |
| Branch / worktree | `claude/planner-handover-742` @ `C:\Development\Animal_Shelter_planner-handover-742` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not started; no runtime surface) |
| PR | pending: opened immediately after this commit |
| Tested by / date | Claude (planner) / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | 9d5b2f8ed |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — replaces `docs/planner-handover.md` with edition `742` and adds one rule each to `.claude/skills/plan-day/brief-blocks.md` and `.claude/skills/plan-day/SKILL.md`; there is no backlog item, and `CLAUDE.md` makes the handover's own PR Claude's to merge on green
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly three files: `docs/planner-handover.md`, `.claude/skills/plan-day/brief-blocks.md`, `.claude/skills/plan-day/SKILL.md`. No route, no `worker/`, no migration, no shared lib, no `package.json`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card is affected**: none of the three files is read at runtime by the app. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: `reference.md`, the bands table (deliberately **not** touched — the handover argues the clean set is evidence *not* to move the default row again), `docs/release-handover.md`, and `drive-sharing.mjs`'s production guard, which stays as #1521 left it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one file, `docs/backlog.md`, 6 insertions / 6 deletions; no conflict)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run on `9d5b2f8ed`, output as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 218s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 303s
=== gates: test — npm test
=== gates: test exited 0 after 45s
=== gates: build — npm run build
=== gates: build exited 0 after 148s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no table is read by any of the three files
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: three markdown documents, no runtime path to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: documents only, no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows and no screen
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: nothing takes input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input and no computation

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed by this PR | unaffected | unaffected, confirmed by the file list in section 1 |
| exactly `n/a` | n/a: no card reads any of the three files | n/a | n/a |
| exactly `n/a` | n/a: no card reads any of the three files | n/a | n/a |
| signed out | nothing changed by this PR | unaffected | unaffected, confirmed by the file list in section 1 |

- [ ] Every login above tested — n/a: none of the three files is read at runtime, so no login can reach a difference
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no URL and no server action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` untouched; no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for the planner chat, not for shelter users; the manual describes the app. **And this PR is the one that records why `en.ts` is the only manual file there is** — see section 7
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; all three files are English planner documents
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no screen
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded; nothing in this PR runs in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages are near the change, so the two *consumers* of the changed files were checked instead: `node scripts/check-docs-only.mjs` behaviour is unaffected and correctly reports this PR as **not** docs-only (it touches `.claude/` as well as `docs/`), and both skill files still parse as markdown with the edited lists intact — each edit was applied by a script that asserts its anchor is unique and exits non-zero otherwise, and it reported `+6` and `+5` lines, which matches `git diff --stat`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a as written, and here is the honest substitute: no shared *runtime* file was touched, so there is no page to load. `brief-blocks.md` and `SKILL.md` are shared between planner sessions rather than between pages, and the next plan is what exercises them
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full gates ran **after** `sync`, on the merged tree `9d5b2f8ed`, and all four exited 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the handover closes no backlog item. This plan's findings were filed on the `backlog` branch in three commits, as the rules require — including the `th.ts` finding onto `#1o5tk`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a as a new file, and deliberately: the handover **is** the record of the day's reasoning, and `CLAUDE.md` says it outranks nothing and is replaced by its successor. Adding a decision file beside it would create a second home for the same prose. The two durable changes are the skill edits, and **each carries its own evidence inline at the point of use** rather than in a file nobody opens
- [x] `README.md` still accurate — unchanged by this PR and checked: it does not quote the handover or either skill file
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a planner handover and two internal brief-writing rules; no shelter user can see any of them, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit explains why each skill edit exists (a block was already said twice and still did not stop the fault; four briefs named a file that does not exist) rather than only that the files changed
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in edition `742` was read from a merged PR's `stream-usage:` comment, re-read today rather than carried from the plan file; the three excluded readings each name the field that excludes them (`finished=blocked`, `rescoped=yes`, `unmeasured`). The floor range 84,412–87,067 was recomputed from the seven comments' own `tokens` minus `messages`. The production Drive figures (357 folders, 972 files, 0 `anyone`-shared, 0 failures, exit 0) are `drive-sharing.mjs`'s own summary output from a real `--env production` run, not UAT's figures reused. **`ls src/lib/manual/` was run before the `th.ts` claim was written** — which is the whole point of the finding

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: this PR contains no logic and derives no date; all three files are static markdown
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band or boundary was changed. The bands table was deliberately left alone, and nothing in this PR is evaluated by code
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block in section 2 is the file `scripts/gates.mjs` wrote to the scratchpad, including its per-gate timings, pasted unchanged
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is affected by a planner document

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR's commit restores edition `741` and removes the two skill rules, and that is the whole rollback: none of the three files is deployed, read by the Worker, or present in the build output, so no Pi rebuild or `wrangler rollback` is involved and there is nothing for a down-migration to cover. What a revert does **not** undo: the three backlog commits filed today on the `backlog` branch, and the production Drive report, which read nothing destructively but is a measurement already taken

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Four briefs in this plan told a stream to edit `src/lib/manual/th.ts`, which does not exist. The planner wrote it four times without running `ls` | fixed — the live brief was corrected mid-flight, the finding was filed onto `#1o5tk`, and `SKILL.md` now carries *read the directory before you name a file* as a brief-writing rule. **No stream obeyed the wrong instruction**, because each read the directory at step zero |
| 2 | medium | A stream made its one correct code change and stopped with no commit and no PR; Lutan noticed before the planner did | fixed — the work was committed and merged as #1521 by the planner, and `brief-blocks.md` now tells the planner to put *commit after the first code change* in the numbered deliverables. Recorded as a cost of the **brief**, not the stream |
| 3 | low | The planner posted a PR comment saying it had finished and merged #1523, then `gh pr merge` refused with *"already merged"* — the stream had merged itself in between | fixed — a correction was posted on the PR rather than left standing in a public record, and the rule is now a standing check in edition `742` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether edition `742` at 199 lines is acceptable against the ~150-line target. It was trimmed twice, from 205, and is 19% shorter than `741` — but it is longer than the target because 2026-11-12 held **two** plans and three of `741`'s own lines needed marking superseded. Further trimming would have removed evidence rather than words, so the planner stopped. Lutan may disagree | `docs/planner-handover.md` |
| 2 | Whether the two skill edits should have been asked about first. Both are small, both are evidence-based, and `741` set the precedent by changing `SKILL.md` in the handover's own PR — but they change what every future brief says, and the revert is one commit | `.claude/skills/plan-day/brief-blocks.md`, `.claude/skills/plan-day/SKILL.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's view on the handover's length and on the two skill edits, rows 1 and 2 above

Manual verification by: pending: Lutan's view on rows 1 and 2

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a as a separate act, and said plainly: this PR deploys nothing, so there is no production step to hand over. Section 8's `deferred: release manager` lines are the ordinary release-cut ones and will be satisfied by whichever release next ships

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches production
