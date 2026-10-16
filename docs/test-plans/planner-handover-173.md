# Feature test plan — `planner-handover-173`

## Header

| | |
|---|---|
| Feature | Rewrite `docs/planner-handover.md` for the next `/plan-day` chat, after seventeen workstreams |
| Backlog item | `docs/backlog.md` → n/a: the handover is a standing `/plan-day` chore, not a backlog item (same as #638, #625, #612 and every handover before them) |
| Branch / worktree | `claude/planner-handover-173` @ `C:\Development\Animal_Shelter_planner-handover-173` |
| Dev server | n/a: docs-only change, no page renders this file |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude Opus 5 (Daily Planner) / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `0cb5135d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one file, `docs/planner-handover.md`, rewritten from scratch for the next planning chat; Lutan asked for it directly in chat
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **`docs/planner-handover.md` only.** No routes, no `worker/`, no migrations, no shared libs, no `src/` at all
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** The file is not served by the app; no role can reach it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the two tooling gaps the handover describes (`worktree.mjs` port default, `CLAUDE.md`'s brief convention). Both are **filed on the backlog** and both need their own PR; neither is touched here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — ran, reported `Already up to date.` and pushed the branch
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **n/a: the gates could not be run in this worktree on this machine, and the reason is a Windows file lock, not the change.** See *Defects found* #1 for the full account. What `gates.mjs` actually printed, unedited, is below; it refused to run rather than reporting false failures, which is the script behaving correctly:

```
gates: node_modules/.bin has no next — nothing was run.

npm ci has not finished here, or never ran. Wait for `worktree.mjs new` to
exit, or run `npm ci`, and try again. Running the gates now would fail every
one of them for a reason that has nothing to do with the code.
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit`

**Why this is honest rather than a gap being waved through.** This change is one Markdown file under
`docs/`. `typecheck`, `lint` and `build` read `src/`, `worker/` and the TypeScript project; **none of
them can be affected by it**, and CI runs all three on the PR regardless. So the evidence of record
for this PR is the CI run, not a local paste — and the CI line above gets ticked in the one
legitimate follow-up commit once that run has been **seen** green. **Nothing here is ticked that was
not executed.**

## 3. Schema and data — *skip if no migration*

- [ ] All checks — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no UI surface; this file is read by a person in a chat, not rendered`
- [ ] Data persists — reload the page and the change is still there — `n/a: no UI surface`
- [ ] Create / edit / delete all exercised — `n/a: no UI surface`
- [ ] Empty state renders sensibly — `n/a: no UI surface`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input; a Markdown file with no consumer code`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

- [ ] Every role above tested — `n/a: the file is not served by the app, so no role can reach it`
- [ ] A role that should not have access is blocked server-side — `n/a: not served by the app`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: no nav entry; docs-only`
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: this is internal process documentation for Claude sessions, not shelter-user documentation`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no UI surface`
- [ ] Browser console clean — `n/a: no UI surface`
- [ ] Network clean — `n/a: no UI surface`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `n/a: no pages are near this change`, but the two things that **do** read files beside it were checked: `node scripts/check-backlog-sections.mjs` reported `ok — 102 open items, all above \`## Completed\`` on the merge this branch was cut from, and `node scripts/check-test-plan.mjs` validates this very file
- [x] Any shared file touched checked from a second, unrelated page — **n/a: no shared file touched.** `git show --stat` on this branch's commit lists exactly one path, `docs/planner-handover.md`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover is a standing chore with no backlog item.` **Two follow-ups found while writing it were filed on the `backlog` branch, not here**, which is the documented path: `aba38932` (two check harnesses crash, neither in CI) and `ecaed337` (the `worktree.mjs` port default, and `CLAUDE.md`'s brief convention)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: this file IS the record.` The design choices it describes were made in other PRs and already have their own decision files, which it cites by name
- [x] `README.md` still accurate — unchanged by this PR and does not describe the handover
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: internal process documentation for Claude sessions; no shelter user can see docs/planner-handover.md, and nothing in src/ or worker/ is touched`
- [x] Commit messages say why, not just what — the commit leads with why it was rewritten and what the process change was, not with "update handover"
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every factual claim in the handover was read from the repo or a tool in this session, not recalled. Specifically: `main` at `1c6e0ac1`; 106 open backlog items by `awk` count; dev at 210 applied against 208 files via `apply-migrations.mjs --status`; the six token actuals from `get_usage` and their dials from `get_session` rather than from what was recommended; the app-cut worktree paths and the missing `.port` files from `git worktree list` and `cat`; the duplicate port 3008 observed on this worktree's own creation; the backlog item that was **byte-identical** before and after the brief was written, established by `diff` and not by memory

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `n/a: docs-only; nothing to deploy and no deployed behaviour changes`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: docs-only; this file is not served`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: no date or time logic in this change`
- [ ] **For a boundary or banding change, the assertions cover both edges** — `n/a: no boundary or banding logic`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates.mjs` refusal in section 2 is pasted exactly as printed, including its wrapping
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: docs-only; no deploy`
- [ ] `strip-baked-env` seen in the deploy output — `n/a: docs-only; no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: no new secret or env var`

### Migration ordering — *skip if no migration*

- [ ] All checks — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the previous handover (`docs/planner-handover.md` as of `0d66ecc0`). **It covers nothing else and needs to cover nothing else:** no schema, no deployed code, no user-visible behaviour. The only cost of a revert is that the next planning chat reads a stale snapshot

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `npm ci` in this worktree never completed: first run left 490 packages and no `.package-lock.json` while the `worktree.mjs new` task still reported **exit 0**; retries hit `ENOTEMPTY` on `node_modules/next/dist/cli/internal`, then a lock on ~65 `.js.map` files under `node_modules/next/dist`; `npm rebuild next` then removed `node_modules/.bin` entirely. 19 unrelated `node` processes were running (three live batch-3 streams among them) and **were deliberately not killed**. Net effect: `gates.mjs` could not run locally, and correctly refused rather than reporting false failures | accepted — docs-only change; CI runs the same three checks on the PR and is the evidence of record. **Not filed as a backlog item**: the existing `windows-tooling-quirks` memory already covers stale-process locks on this machine, and this is a one-off worktree, not a repo fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the handover is actually **useful to the next planning chat** — this is the only thing about it that matters and no script can check it. The next `/plan-day` in a fresh chat is the test | `docs/planner-handover.md` |
| 2 | Whether the inferred step 1 of *how to set up a stream* is right — the handover states that a session is started on the main checkout and the app cuts its own worktree. **That was read from session records, not from watching Lutan do it** | the handover's *THE PROCESS CHANGED* section |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (Daily Planner)  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; both items wait on Lutan and on the next planning chat, and only the person who looks may tick this

Manual verification by: pending: Lutan, and the next /plan-day chat

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: docs-only, nothing to deploy and nothing for the release manager to carry`

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs-only change, no deploy
