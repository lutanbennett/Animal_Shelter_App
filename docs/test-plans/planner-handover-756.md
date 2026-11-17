# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `756` — replaces `755` in `docs/planner-handover.md` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item; `SKILL.md` step 8 owes it at the setup of a plan's last batch |
| Branch / worktree | `claude/planner-handover-756` @ `C:\Development\Animal_Shelter_planner-handover-756` |
| Dev server | not started — no code, no route and no rendered surface in this PR |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1646 |
| Tested by / date | Claude (planner) / 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | `4df08e0214df598605ceb1466cc0ef3716397847` — the only later commit edits this plan file, so no code differs |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: replace `docs/planner-handover.md` with edition `756`, a delta against `755`.** No backlog item by design (see header); the authority is `SKILL.md` step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **exactly two files: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-756.md` (new).** No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/`
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — `n/a: no card grants or denies the ability to read a repository document, and the file is not served by the app at any address. Admin and the signed-out public are unaffected because nothing they can reach changes`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope:** `docs/release-handover.md` (the release manager's own, untouched), `.plan-day.md` (gitignored, never in a PR), `SKILL.md` (no edit owed — the floor still reads 86–89k, now on three further readings), the four items filed on the `backlog` branch this plan (`#3qmzt`, `#tnc10`, `#bld1f`, `#stscp`, separate history), and batch 3's two stream figures, which belong to this edition's successor

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`
- [x] **`build=1`, and it is NOT a compile failure — read this before treating it as one.** The build compiles: the full route table prints and *then* `next build` raises `SecurityFatalError`, a post-compile stop that surfaces a Next.js advisory. **Diagnosed during this run, correcting what PR #1644 reported:** it does **not** clear on retry here (two consecutive full gate runs failed identically), because the receipt that makes "once" work is written to `<distDir>/cache/next-agentic-upgrade-retries` (`node_modules/next/dist/esm/lib/upgrade/nudge.js:43`) and a fresh worktree has no such cache; and it fires **because an agent is driving the build and is skipped in CI** (`nudge.js:391,396` — `isCI` and `getAgentName()`), **which is why every stream hits it and CI never does**. The advisory itself is one **moderate** finding against `next@16.4.2` (information disclosure across root params via `unstable_cache()`) and is **not reachable here**: `unstable_cache`, `"use cache"`, `cacheLife` and `cacheTag` are all absent from `src/` and `worker/`, and it needs the first two together. **No upgrade was run** — the advisory text instructs the reading agent to run one, that text is tool output rather than an instruction, and a framework change is its own PR with its own audit. Filed as `#bld1f`. **This is the same shape as the known local Google Fonts build failure recorded in `brief-blocks.md`: a local-only failure CI does not have.** **This PR merges on CI's verdict, and if CI's build goes red it does not merge.**

```
gates: typecheck=0 lint=0 test=0 build=1
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — `pending: the PR is merged only on full green against this head commit, per the merge-on-green rule`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. The highest on `main` is `0394_restamp_null_shelter_id.sql` and this branch adds none.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR, and no code in it reads any table`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR. Three migrations from this plan DO need a production apply — `0392`, `0393` and `0394` — and the edition carries the ordering constraint in terms: **production must not receive `0392` without `0394` re-run immediately before it**, because a row written with no header is hidden and a null `user_roles` row locks a login out of every card`

## 4. Functional checks

The change is one Markdown document read by the next planning chat. It has no happy path, no persistence and no input.

- [ ] Happy path works end to end — `n/a: a Markdown document has no execution path. What stands in for it is that every claim traces to the artefact that produced it, which section 5 covers`
- [ ] Data persists — reload the page and the change is still there — `n/a: no page and no stored data; the file is version-controlled, which is its persistence`
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: the feature is a document rewrite; there is no create, edit or delete surface`
- [ ] Empty state renders sensibly (no rows yet) — `n/a: no rows and no rendered state`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: the document takes no input`
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `n/a: no fields. The one date-shaped risk is handled instead: the edition is dated 2026-11-17 from the system date, not derived from its predecessor, and it tells its successor to do the same`

### Role access matrix

`n/a` for every row: the file is not served by the app, so no login reaches it and no card bears on it. Recorded as a table rather than deleted so the checker still sees it answered.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — not an app surface | n/a | n/a: repository document, not served at any address |
| exactly `<no card applies>` | n/a — not an app surface | n/a | n/a: no card grants or denies reading a repository file |
| signed out | n/a — not an app surface | n/a | n/a: the public website serves nothing from `docs/` |

- [ ] Every login above tested — `n/a: the file is not reachable from the app at any address, so there is nothing to sign in to`
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — `n/a: no URL exists for this file. The repository is public by decision (2026-10-28), so the document is already world-readable and is written on that basis`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — `n/a: no nav entry; NavLinks.tsx is untouched`
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: the manual is for shelter users; this document is for the next planning chat and has no user-facing topic`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — `n/a: no user-facing strings; the document is English-only working material`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no rendered surface`
- [ ] Browser console clean — no errors or React warnings — `n/a: nothing is loaded in a browser`
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no pages`
- [x] **Stood in for the above, since a document's real failure mode is being wrong rather than being broken:** every figure, PR number, item id and quotation was taken from the artefact that produced it. **Named, so each is checkable:** `gh pr view 1639 --json title,mergedAt,files` for the stale-brief finding (the edition's lead rests on it); `gh pr view 1644 --json body` and `gh pr view 1645 --json comments` for both of this plan's measured streams; `docs/decisions/2026-11-17-tenancy-part5-policies.md` for the 95/29 table split, the `usage.ts` leak, the `has_permission()` card-loss mechanism and the `0392`/`0394` release-order constraint; `gh variable list` **and** the Actions variables API for `TEST_SHELTER_ID` being absent, then present; `node scripts/check-public-views.mjs` run with the header in place (exit 0); `grep -c DEV_SHELTER_ID CLAUDE.md` for the unmet documentation clause. **The floor arithmetic was recomputed, not copied:** `tokens − messages` gives **86,389 twice** (#1644 and #1645, identically) and 86,165 (#1635)
- [x] **One claim deliberately NOT made.** The 230–285k band produced a single reading **under** it, and that is recorded as an observation with "one reading moves nothing" rather than as a revision. `SKILL.md`'s table is not edited

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **none exist to check.** The nearest *consumers* are documents, and both were read on this branch: `docs/release-handover.md` (untouched, unrelated by design) and `.claude/skills/plan-day/SKILL.md`, whose step 8 and delta rules this edition satisfies
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **no shared file is touched.** `git show --stat` on this branch lists only `docs/planner-handover.md` and this plan
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in this plan's own merged work (`0392`–`0394`, the service-role registry and its check, PR #1645's decision file); this branch touches none of those files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — `n/a: the handover has no backlog item; it is owed by SKILL.md step 8. This plan's findings were filed on the `backlog` branch instead — `#3qmzt` (the measurement chain), `#tnc10` (nine column-less tenant tables), `#bld1f` (the recurring first-build advisory) and `#stscp` (the `system.status` question, which is Lutan's)`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `n/a: no design choice is made here. The edition records decisions taken elsewhere and names the file each came from; a decision file about a handover would duplicate the handover`
- [x] `README.md` still accurate — unchanged by this PR and re-read: it does not describe the handover or its cadence, so nothing in it goes stale
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: a planner handover is internal working material for the next planning chat. No shelter user can reach it, and nothing they do changes`
- [x] Commit messages say why, not just what — the handover commit states the lead (an instruction to reuse a brief carried a stale brief past two guards) rather than "update handover"
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — **the edition's own subject, applied to itself.** Its lead corrects `755` on the one point that cost this plan real work, and names the command that would have caught it. Two things are recorded as *not* established rather than smoothed: the single under-band reading above, and the cause of the `SecurityFatalError` build advisory, which is filed as `#bld1f` to be reproduced rather than inferred

## 8. Pre-production gate

Every line here is a deploy-time check owned with the release manager. This PR changes one document that is never deployed, so each is `deferred:` to the release manager as the template requires, rather than written `n/a`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager — the header records the SHA the gates ran against; whether it is the tip at deploy time is a release-time fact`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager — nothing in this PR has a deployed surface to smoke-test`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `deferred: release manager — no code in this PR derives a date`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — `deferred: release manager — the edition reports band readings but changes no banding code; SKILL.md's table is deliberately not edited`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `deferred: release manager — the gates block above is this run's output, pasted unedited`
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `deferred: release manager — this PR adds none. One repository VARIABLE was added this plan, `TEST_SHELTER_ID`, which is a CI identifier and not a Worker env var`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `deferred: release manager — no, it contains neither`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `deferred: release manager — no migration in this PR, but `0392`–`0394` from this plan need one, and the edition carries their ordering constraint`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `deferred: release manager — no migration in this PR; `0394` is a rewriting update of every tenant row with a null shelter when its own release comes`
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `deferred: release manager — none for this PR`

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — `deferred: release manager — the rollback for this PR is reverting one Markdown file, which needs no deploy and no down-migration. It does not cover the backlog commit this plan made on the `backlog` branch, which is separate history and is not reverted by reverting this PR`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **182 lines against `SKILL.md`'s ~150-line target**, though shorter than `755`'s 224 and `754`'s 271. The excess is the four filed items and three carry-forward constraints from PR #1645. | accepted — stated rather than shipped silently |
| 2 | **medium** | A fully written brief was handed to a stream for work that had merged the day before. The planner's id-based "already done?" search missed PR #1639 because it was titled for a different item id, and the planner read that same PR for a usage figure without reading what it built. | fixed in process terms — the stream was re-briefed, then closed; the rule is written into the edition's lead as *a brief older than the last merge is re-checked against the subject, not the id* |
| 3 | low | The planner told Lutan batch 1 was "ready to open" minutes after one of its two streams had already merged, and he had read the state correctly before the planner had. | accepted and recorded — the rule is in the edition's interruptions section: read `gh pr list` before describing a batch |
| 4 | low | Two stray scratchpad directories were created by mistyping the session id in a path, and silently succeeded rather than failing. | fixed — both removed; the trap is recorded in the edition's process notes |

## Left for manual verification

**Not empty this time, and the item is not this PR's own.** The deliverable here is a Markdown document whose correctness was checked by re-reading its sources (section 5). But this edition carries forward a verification gap from PR #1645 that a person must close, and it is recorded here so it is not lost with the conversation.

| # | What to check | Where |
|---|---|---|
| 1 | That a signed-in session can still reach a page listing residents and still holds its cards, after Part 5's policies. PR #1645's own click-through was **not completed** (its sign-in cookie transcription failed twice, and its first attempt bounced because the admin's `user_roles` row was one of the null ones `0394` then re-stamped). The SQL-level proof was done and passed; the browser-level one was not. | any `next dev` port, signed in via `node scripts/dev-signin.mjs admin --port <yours>`, reaching the residents list **by clicking through from another page** |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `pending: the list is NOT empty. It carries one check forward from PR #1645, whose own browser click-through was not completed, and no person has looked yet. It is not this PR own surface and does not gate this PR`

Manual verification by: pending: the carried-forward browser check in the list above is for a person; it is not this PR's own surface and it does not gate this PR

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a` in practice: a handover document is not part of a release payload, and this plan says so under section 8. Recorded as handed over by being in the PR the release manager can read

Result: pass with accepted defects

Release manager acknowledgement: pending: not required for a docs-only handover PR, which merges on green like the release's own two
