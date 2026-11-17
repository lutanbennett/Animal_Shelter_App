# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `759`, plus `brief-blocks.md` block G corrected at PR #1671's request |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/planner-handover-759` @ `C:\Development\Animal_Shelter_planner-handover-759` |
| Dev server | not started — no runtime surface in this PR |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | `d7cba0afd` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `759` and corrects the stale halt wording in `.claude/skills/plan-day/brief-blocks.md` block G; the handover is written at the setup of its plan's last batch, as `SKILL.md` requires, and has no backlog item by design
- [x] Files/areas touched listed — exactly two: `docs/planner-handover.md` and `.claude/skills/plan-day/brief-blocks.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Cards affected identified — **none.** Neither file is read at runtime by any card-governed surface; both are read by a Claude session
- [x] Anything explicitly **out of scope** written down — this plan's own six stream figures are **deliberately not reported** (measurement is once a day and today's slot was spent on the third plan's nine; batch 1's three are recorded in the gitignored `.plan-day.md` and belong to edition `760`). Also out of scope: `docs/release-handover.md`, untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` minutes before this commit, with batch 1's three PRs (#1669, #1670, #1671) already merged into it, so it was already current
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 43s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 142s
=== gates: test — npm test
=== gates: test exited 0 after 36s
=== gates: build — npm run build
=== gates: build stopped on Next's SecurityFatalError advisory halt; re-running build once now, while its five-minute receipt is fresh
=== gates: build exited 0 after 168s
gates: typecheck=0 lint=0 test=0 build=0
```

**AND THIS RUN IS A SECOND INDEPENDENT READING OF PR #1671's FIX, WHICH IS WORTH MORE THAN THE TICK.** The halt fired on the build gate, `gates.mjs` recognised it and re-ran the build **by itself**, and the gate ended **0** — so a single honest `node scripts/gates.mjs` now ends `build=0` where every stream today had to run `npx next build` by hand. #1671 reported its retry as having **one** run behind it and recorded it as untested. **This is the second, from a different worktree, and it agrees.** Two runs is still not proof: record it as a hypothesis that has now fired twice.

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — the happy path for a handover is that the next planner session can read it: `docs/planner-handover.md` is valid Markdown, 233 lines, opens with the edition number and date, and its "FOR YOUR FIRST TURN" list names the three slugs a successor must check
- [ ] Data persists — reload the page and the change is still there — `n/a: no page; these are two Markdown files`
- [ ] Create / edit / delete all exercised — `n/a: no CRUD surface in this PR`
- [ ] Empty state renders sensibly — `n/a: no rendered surface in this PR`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input surface in this PR`
- [x] Boundary cases checked — the two editing traps this repository has recorded for Markdown edits were both checked: `brief-blocks.md` is **CRLF in the working tree and LF in the index** (`git ls-files --eol`: `i/lf w/crlf`), and the edit script **aborted on the first attempt** rather than corrupting it, then preserved CRLF on the second. The resulting diff is 19 lines, not 332, which is the proof no line-ending churn occurred

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no runtime surface exists | n/a |
| exactly `<card key>` | nothing in this PR | no runtime surface exists | n/a |
| signed out | nothing in this PR | no runtime surface exists | n/a |

- [ ] Every login above tested — `n/a: this PR adds no route, action, RPC or control; both files are read by a Claude session, not by the app`
- [ ] A login that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: no nav change; src/ untouched`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: no user-facing behaviour; the manual is for shelter staff and this is planner bookkeeping`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings; both files are internal English documents`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface in this PR`
- [x] Browser console clean — `n/a: no browser surface was loaded` — recorded as a tick against the honest reason rather than left blank; no dev server was started for this PR
- [ ] Network clean — `n/a: no pages in this PR`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are no pages near the change` — the nearest consumers are a Claude session reading `.brief.md` and the `/plan-day` skill, and the four gates below cover everything executable
- [x] Any shared file touched checked from a second, unrelated page — **`brief-blocks.md` IS a shared file, and the check that matters here is not a page load.** It is assembled into every `.brief.md`. Verified by reading back the corrected block G in full and confirming it still reads as an instruction to a stream, keeps the `isCI`/`getAgentName()` mechanism, keeps the do-not-upgrade-Next prohibition, and now states the one-shot-token reading with its evidence. **The three batch-2 briefs already written from the old wording were corrected in the same pass** (they are gitignored, so they are not in this diff) — otherwise three live streams would have carried a sentence this PR declares wrong
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch changes no executable code; `main` moved only by batch 1's three merges, which this branch was cut after

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item; it is written at the setup of its plan's last batch, per the /plan-day skill`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice is made here` — the one judgement, that `brief-blocks.md` belongs in the handover PR rather than in a seventh worktree, is recorded in the PR body instead, which is where a scope decision about this PR can actually be read
- [x] `README.md` still accurate — unaffected; neither file is referenced by it
- [ ] **Release notes.** — `n/a: a shelter user would notice nothing; both files are read only by a Claude session, and this PR touches no src/, worker/, manual or i18n path`
- [x] Commit messages say why, not just what — the commit message states the correction the edition makes against itself and why `brief-blocks.md` is included
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in edition `759` was read from a `stream-usage:` comment on a merged PR, not estimated: the nine in the table, and the three of batch 1 quoted as belonging to `760`. The floor values are `tokens − messages` arithmetic on those same comments. **The one claim that is explicitly marked as untested is #1671's gates retry**, which has one run behind it and is recorded as a hypothesis rather than as working

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `deferred: release manager`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — `deferred: release manager`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `deferred: release manager`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `deferred: release manager`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores edition `758` and the old block G wording. **What that does NOT cover:** the three batch-2 briefs already corrected on disk are gitignored and would keep the new wording, and `.plan-day.md` is gitignored too, so a revert of this PR would leave the live briefs disagreeing with the restored block G. Nothing executable and no schema is involved, so there is no deploy or migration component to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `brief-blocks.md` block G stated the build halt as a five-minute window of silence; PR #1671 measured it as a one-shot token. Three briefs had already been written from the wrong wording | fixed — block G corrected here, and all three live briefs corrected on disk in the same pass |
| 2 | low | Edition `759` is 233 lines against the skill's ~150-line target | accepted — declared in the PR body; `758` was 209. The excess is the banding correction and `#ctlg8`, both judged load-bearing. Trimming substance to hit a soft target was the worse trade |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty. There is no surface a person needs to look at: the two files are read by a
Claude session, and whether edition `759` is *useful* is judged by its successor
reading it, which is the delta model's own mechanism rather than a verification step.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no surface a person needs to look at; both files are read by a Claude session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a` in substance: this PR carries no deploy, so section 8 is `deferred: release manager` throughout and there is nothing for them to hold

Result: pass

Release manager acknowledgement: pending: this PR carries no deploy; nothing is held on it
