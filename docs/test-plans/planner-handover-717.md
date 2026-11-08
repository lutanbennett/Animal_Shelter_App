# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `717` — a delta against `708` |
| Backlog item | `docs/backlog.md` → none. The handover is written by `.claude/skills/plan-day` step 8 at the setup of a plan's last batch; it carries no backlog item and never has |
| Branch / worktree | `claude/planner-handover-717` @ `C:\Development\Animal_Shelter_planner-handover-717` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` — **not started: this PR changes one documentation file and has no runtime surface** |
| PR | [#1403](https://github.com/lutanbennett/Animal_Shelter_App/pull/1403) |
| Tested by / date | Claude (planner session) / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | `5eeab63d` — the commit the gates above ran on. **This PR's head moves by one commit when this plan is filled in**, which is the commit the merge reads CI for |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: `docs/planner-handover.md` is replaced with edition `717`, a delta against `708`.** There is no backlog item by design; the skill's step 8 is what asks for it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **`docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-717.md` (new). No `src/`, no `worker/`, no `supabase/migrations/`, no `package.json`.** Verified with `git diff --stat` against `origin/main`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **none. This file is not served by the app, is not imported by any code, and is read only by a planner chat.** Nothing a card could grant or deny changes, and the signed-out public cannot reach it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope: `docs/release-handover.md`** (the release manager's own document, untouched), **`.plan-day.md`** (gitignored, amended outside this PR), **and the three batch-3 briefs** (gitignored, in their own worktrees). **Also out of scope: acting on anything the handover reports.** It records and hands over; the owed items are closed by whoever owns them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — **nothing to merge: this branch was cut from `origin/main` minutes before, and `git rev-list --count HEAD..origin/main` answered `0`.** `sync` itself was declined from the main checkout by its own guard (*"run 'git pull' in the main checkout instead"*), which is correct behaviour and not a failure; the gates were then run in the worktree
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 62s
=== gates: lint exited 0 after 312s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 132s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and no code in it reads a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. **One production step IS reported inside the handover's text — `0338`'s back-fill — but it belongs to `0338`, which merged in PR #1399, not to this PR**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The document's "happy path" is a planner reading it, which is section 6's regression line
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no user-facing create, edit or delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows, no rendering
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input and no computation. **The dates in the document are prose and were checked by reading, not by a boundary test**

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no change — the file is not served by the app | no change, by inspection of the diff |
| exactly `<any card key>` | nothing in this PR | no change — no card gates a repository file | no change, by inspection of the diff |
| signed out | nothing in this PR | no change — the file is not served by the app | no change, by inspection of the diff |

- [x] Every login above tested — **tested by inspection rather than by signing in, and the reason is the test: the diff touches no route, no component and no permission file**, so there is nothing a login could reach differently. Driving a login would have produced a screenshot that proved nothing about this change
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the changed file has no URL. It is read from the repository by a planner chat, never served

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` not touched and no new destination exists
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is a note between sessions, not something a shelter user does. **Nothing in the user manual refers to it**
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string. The document is written for one Claude session and is never shown to a user, so it is deliberately English-only
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: no rendered surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **no pages. The "nearest thing" to this change is the document itself, and it was re-read whole after writing**: 174 lines, the edition number in the first line, every one of `708`'s six owed items accounted for (five restated, one — the six leftover worktrees — reported done), and every figure in it traced back to a `stream-usage:` comment or a command run today
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — **no shared file is touched.** Confirmed from `git diff --name-only origin/main`, which lists exactly two paths, both under `docs/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — **nothing was merged** (0 commits behind at the time of writing), and the gates above ran on the tree as it stands

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the handover closes no backlog item. **One follow-up WAS filed, and it went on the `backlog` branch where it belongs**: `#k3mqp`, `0338`'s catch-up back-fill being unexercised on production, committed as `cf49a4c4`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — **none added, and that is the choice: the handover is a report, and its one genuinely non-obvious judgement already has a decision file from the PR that made it** (`docs/decisions/2026-11-08-plan-day-skill-cut.md`, PR #1396). Writing a second decision file to say "the handover reports what the skill cut did" would be a decision about nothing
- [x] `README.md` still accurate — **unchanged and still accurate: it does not mention the planner handover at all**, checked with `grep -i handover README.md`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a note between Claude sessions, in a file the app never serves and no user can open. No shelter user can notice it by any route
- [x] Commit messages say why, not just what — **the commit says why this edition exists (the counter, not a request), what it corrects in `708`, and why the band miss is recorded as a wrong ROW rather than a wrong number**
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — **this is the line that mattered most on this PR, because a handover is almost entirely claims.** Every figure in the document was read from a command or a PR comment today, not recalled: the three token figures and the three floor figures from the `stream-usage:` comments on #1397, #1398 and #1399 (`gh pr view <n> --json comments`); the refusal counts from `node scripts/measure-sql-refusals.mjs` at `8c9722aa`; the three file line counts from `wc -l`; and the `/manual` and `homeTilesBase` facts from `grep` and from reading `src/lib/home/tiles.ts`. **Where something was not measured it is written as not established** — `#40oz4`'s cause, the Pi's `sshd` config, and whether any live role holds exactly one of `/admin/diets`' pair of cards

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the production release manager. **This PR ships no build**: nothing in it reaches a bundle, so its SHA will never be the subject of a deploy
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: the production release manager. **Nothing in this PR can be observed on a deployed build**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: the production release manager. **No code in this PR derives a date**; the dates in the document are written-down facts
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — deferred: the production release manager. **The document discusses token bands, which are a planning estimate and not a boundary in code** — nothing computes from them
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: the production release manager. **The gates block in section 2 is pasted from the run's own output**, and the figures quoted in section 7 are from the commands named there
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. **This PR cannot change a public page**

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: the production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: the production release manager. **This PR adds no secret and no environment variable**

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this PR's single commit restores edition `708` exactly, and that is the whole rollback**: no build, no schema, no data and no deployed artifact is involved. **What it does not cover:** the `#k3mqp` backlog item, which is on the `backlog` branch and is not part of this PR, and `.plan-day.md`, which is gitignored and not versioned at all. **Nor does reverting undo anything the handover describes** — the skill cut, the merges and the worktrees are all facts on `main` already, and a reverted handover would simply stop reporting them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `Write` refused `docs/planner-handover.md` with *"File has not been read yet"*, so the first attempt to install the text failed and wrote nothing. The skill's own prescribed route (write to the scratchpad, then `cat <scratch> > <file>`) was used instead | fixed — no content was lost, and the refusal is the harness working as designed on a file this session had not read |
| 2 | low | `node scripts/worktree.mjs sync` was declined with *"run 'git pull' in the main checkout instead"* because the shell's working directory had been reset to the main checkout between calls. Re-run inside the worktree in a subshell | fixed — and the branch was 0 commits behind `origin/main` anyway, so nothing was skipped |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether edition `717` reads usefully to the next planner, which is the only thing about it that can fail.** A handover is judged by whether its successor can act on it, and that cannot be tested here. The specific thing to watch: `717` reports the skill cut and says *"you are the first edition after the cut — say whether it held"*, so **edition `718` either answers that or does not**, and if it does not, this document failed at the one job it set itself | `docs/planner-handover.md` on `main`, read by the next `/plan-day` chat; answered in edition `718` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: whether edition `717` reads usefully to the next planner, which only the next planner can answer

Manual verification by: pending: edition `718` reports whether `717` held, per the row above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **by this file reaching `main`. There is nothing for them to deploy**: every section 8 line is `deferred:` or `n/a:` because this PR ships no build, no schema and no public surface

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches a build, a schema or a deployed surface
