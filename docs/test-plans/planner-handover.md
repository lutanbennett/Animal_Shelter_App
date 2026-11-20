# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `766` — the delta covering the ten streams merged since `765` |
| Backlog item | `docs/backlog.md` → n/a: not a backlog item. The handover is written every nine merged stream PRs under `CLAUDE.md`'s *"Every PR merges on green"* and `/plan-day` step 8 |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover` |
| Dev server | n/a: documentation only; no dev server was started |
| PR | PR_PLACEHOLDER |
| Tested by / date | Claude (planner session) / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | see the gates block in section 2 — run on the merge commit of `origin/main` into `claude/planner-handover` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *replaces `docs/planner-handover.md` with edition `766`; no other file changes*
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **`docs/planner-handover.md` only**, plus this plan. No route, no `worker/`, no migration, no shared lib
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: no card grants or denies the ability to read a repository document, and nothing in the app reads this file
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope: `docs/release-handover.md`** (the release manager's own, and `check-release-handover.mjs` reads it as current at `0.47.5`), **the two owed `/plan-day` skill-file edits** (the floor row and the stale 135k note, both recorded in `766` as still owed), and **the production apply of `0424`/`0425`**, which `766` names as the next release's first item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — *one file, `docs/backlog.md`, 3 insertions 2 deletions; pushed*
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 86s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 220s
=== gates: test — npm test
=== gates: test exited 0 after 56s
=== gates: build — npm run build
=== gates: build exited 0 after 285s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: this PR carries no migration. **`766` itself states the outstanding one: `0424` and `0425` to production before its next deploy**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the deliverable is a Markdown document read by a chat
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

n/a: no card, role or signed-out state can reach this change — it is a file in a public repository and no code reads it.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | n/a | n/a: documentation only |

- [ ] Every login above tested — n/a: no access surface
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `src/` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for a planner chat, not for shelter users; the manual says nothing about it
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — n/a as pages; **the nearest *consumers* were checked instead and both read correctly**: `node scripts/check-release-handover.mjs` prints *"Current: the handover names 0.47.5"*, and the four gates below cover every script that reads `docs/`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched. `git diff --stat` against `origin/main` is `docs/planner-handover.md` alone
- [x] Nothing merged from `main` during `sync` was broken by this branch — *the sync brought one `docs/backlog.md` change; this branch does not touch that file*

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the handover is not a backlog item, so there is nothing to tick. **Nine items were ticked by their own streams and are already on `main`**; `766` lists them
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The handover's *shape* was decided on 2026-10-20 (a delta, ~150 lines) and its *trigger* on 2026-11-18 (every nine merged stream PRs); both are already recorded
- [x] `README.md` still accurate — *unchanged and does not describe the handover's contents*
- [ ] **Release notes.** — n/a: an internal planning document read by one Claude chat. No shelter user can reach it or would notice it
- [x] Commit messages say why, not just what — *the commit says what `766` corrects in `765` and why that correction is the one that matters*
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — *every figure in `766` comes from a `stream-usage:` comment read off its own merged PR; the production migration correction comes from a bare `apply-migrations.mjs --status --env production` read, not from a stream's report. The two floors that repeat to the digit are recorded as unexplained rather than theorised, and the one unmeasured stream is written `unmeasured` rather than estimated*

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships no code, so no build of it is ever deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: documentation only; nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only; no deployed surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic. The document *states* dates, and the one date ambiguity of the day (the machine clock reading 2026-11-19 while the system date read 2026-11-20) is written into `766`'s first turn as a thing to re-read rather than resolved silently
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: the bands in this document are forecasts in prose, not code; nothing computes them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — *the gates block above is the run's own closing lines, pasted from the file the background run wrote*
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: nothing deployed
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — *`git revert` of this one commit restores edition `765` exactly. **What it does not cover: nothing, and that is the point** — no deployed artefact, no database row and no user-visible behaviour depends on this file, so reverting it has no effect beyond the document a planner chat reads*

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `scripts/check-script-exits.mjs` prints a stale exemption reason for `scripts/dev-signin.mjs`: *"owned by the product-admin stream (#1736); for the planner to convert"*, while #1736 and #1748 have both merged | deferred — **not fixed here on purpose:** this is a documentation PR and `scripts/` is not its surface. Recorded in `766`'s *what is owed now* for whoever is next in that file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty)* | Nothing in this change has a surface a person must look at. The document's audience is the next planner chat, which reads it as its first act and corrects it in its successor — that is the mechanism `766` states in its own opening lines, in place of review |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface to look at; it is read and corrected by the next planner chat, not by a reviewer

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — *via `766` itself, which names `0424` and `0425` as the next release's first item*

Result: pass with accepted defects

Release manager acknowledgement: pending: the release manager reads `766` at the next release cut
