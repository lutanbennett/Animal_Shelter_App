# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `757` — replaces `756` in `docs/planner-handover.md`, and re-measures the band table's floor row |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item; `SKILL.md` step 8 owes it at the setup of a plan's last batch |
| Branch / worktree | `claude/planner-handover-757` @ `C:\Development\Animal_Shelter_planner-handover-757` |
| Dev server | not started — no code, no route and no rendered surface in this PR |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1655 |
| Tested by / date | Claude (planner) / 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | `98231d1e2eeae7d1a677184adcc2b794bd01e64c` — the only later commit adds this plan file, so no other file differs |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: replace `docs/planner-handover.md` with edition `757`, a delta against `756`, and re-measure `SKILL.md`'s floor row from nine streams.** No backlog item by design (see header); the authority is `SKILL.md` step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **exactly three files: `docs/planner-handover.md` (rewritten), `.claude/skills/plan-day/SKILL.md` (ONE table row) and `docs/test-plans/planner-handover-757.md` (new).** No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/`. **The `SKILL.md` line is called out separately because it is the only change outside the handover's own two documents, and `756`'s equivalent line said no such edit was owed:** the floor row instructs *"re-measure, never carry forward"*, and **two of today's nine readings sit above the old `~86–89k`**, so it now reads `~86–90k`. **The scale rows below it are deliberately untouched**, and the edition says why
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — `n/a: no card grants or denies the ability to read a repository document, and the file is not served by the app at any address. Admin and the signed-out public are unaffected because nothing they can reach changes`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope:** `docs/release-handover.md` (the release manager's own, untouched), `.plan-day.md` (gitignored, never in a PR), the four items filed on the `backlog` branch this plan (`#shtci`, `#lklst`, `#trnsc`, `#expgp`, `#cchgd` and five amendments, separate history), **the band table's SCALE rows** (deliberately not moved — see the defects table), and **batch 3's three stream figures**, which belong to this edition's successor

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`
- [x] **`build=1` TWICE, AND THE CAUSE IS A FIVE-MINUTE TIMER NOBODY HAD FOUND — THIS BOX NOW CARRIES A MEASUREMENT THAT CORRECTS BOTH `756` AND PR #1652.** The build is not failing to compile: the full route table prints and *then* `next build` raises `SecurityFatalError` to surface a Next.js advisory, because an agent is driving the build and the check is **skipped in CI** (`node_modules/next/dist/esm/lib/upgrade/nudge.js:391,396`). **The halt writes a receipt — `{"issuedAt":<ms>}` at `.next/cache/next-agentic-upgrade-retries/<hash>.json` — and suppresses itself only while that receipt is younger than `RETRY_TTL`, which is `5 * 60 * 1000`: FIVE MINUTES** (`nudge.js:17,43,70`). **A full `gates.mjs` run takes about five to six minutes on this machine (typecheck 43s, lint ~3min, tests, build 124s), so by the time a RE-RUN reaches its build step the receipt has already expired and the halt fires again.** Measured on this branch: **run 1 `build=1`; run 2, nothing touched, `build=1`** — and `gates.mjs` does **not** remove `.next`, so that was a genuine retry, and the receipt file was present throughout. **Then the decisive test: `npx next build` on its own, started with the receipt 88 seconds old — exit 0, no halt, no advisory text in the log at all.** **So `756` (*"it does not clear on retry"*) and PR #1652 (*"it does clear"*) were each half right, and neither was reproducible as stated: it clears only if the retry's build STARTS INSIDE FIVE MINUTES — which re-running the build alone does, and re-running the whole gates does not.** **The practical consequence, which three briefs and `#bld1f` currently get wrong: tell a stream to re-run `npx next build`, not `node scripts/gates.mjs`.** The advisory itself is unchanged — one **moderate** finding against `next@16.4.2`, **not reachable here** (`unstable_cache`, `"use cache"`, `cacheLife` and `cacheTag` are all absent from `src/` and `worker/`, and it needs the first two together), recorded in `docs/decisions/2026-11-17-next-agent-upgrade-halt.md`, with the unguarded condition filed as `#cchgd`

```
gates: typecheck=0 lint=0 test=0 build=1
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — `pending: the PR is merged only on full green against this head commit, per the merge-on-green rule`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. The highest on `main` is `0396_tenancy_unscoped_tables.sql` and this branch adds none. **Two of batch 3's live streams are each carrying one (`0397` and `0398` expected), and neither is in this PR.**

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR, and no code in it reads any table`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR. Migrations DO need a production apply and NONE of them has had one: `0392`, `0393`, `0394` (the first plan of 2026-11-17), `0395` and `0396` (this plan), with `0397`/`0398` expected from batch 3. **The ordering constraint that spans them, carried forward because it is still live: production must not receive `0392` without `0394` re-run immediately before it**, because a row written with no header is hidden and a null `user_roles` row locks a login out of every card`

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
- [x] **Stood in for the above, since a document's real failure mode is being wrong rather than being broken:** every figure, PR number, item id and quotation was taken from the artefact that produced it. **Named, so each is checkable:** `gh pr list --state all --head claude/<slug>` per slug for every merge state in the edition — **which is the fix for the edition's own lead finding, so it was used rather than the worktree table**; `gh pr view <n> --json comments` on **#1644, #1645, #1647, #1648** (plan one) and **#1649, #1650, #1651, #1652, #1653, #1654** (plan two) for all ten figures, with #1647's `.comments | length` answering **0**; `gh pr view 1647 --json body` beside `node -e` on `docs/service-role-sites-registry.json` for the 57-versus-36 discrepancy; that same `node -e` for the registry's progression **36 → 27 → 0** across the three Part 7 slices; `docs/decisions/2026-11-17-tenancy-part5-policies.md` for the 95/29 table split; `grep -rn "alter table shelters add column"` for `shelters` holding only six columns, which is why Part 8's migration is certain; and `grep -rn "cron.schedule"` plus a definer-function scan for the `NOT NULL` writer set, **recorded in the edition as a shape and explicitly not as a worklist, because they count files and a later file supersedes an earlier one**. **The build-halt mechanism was read and then tested, not reasoned:** `nudge.js:17,43,70` for `RETRY_TTL = 5 * 60 * 1000`, the receipt file's own `{"issuedAt":…}` read off disk, two full `gates.mjs` runs at `build=1`, and `npx next build` alone at exit 0 with the receipt 88 seconds old. **The floor arithmetic was recomputed, not copied:** `tokens − messages` over all nine streams gives 86,389 · 86,389 · 87,299 · 87,364 · 87,418 · 87,707 · 88,549 · 89,684 · 90,365
- [x] **One claim deliberately NOT made, and it is the same shape as `756`'s.** The 230–285k band produced a single reading **under** it, and that is recorded as an observation with "one reading moves nothing" rather than as a revision. `SKILL.md`'s table is not edited

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **none exist to check.** The nearest *consumers* are documents, and both were read on this branch: `docs/release-handover.md` (untouched, unrelated by design) and `.claude/skills/plan-day/SKILL.md`, whose step 8 and delta rules this edition satisfies
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **no shared file is touched.** `git show --stat` on this branch lists only `docs/planner-handover.md` and this plan
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in this plan's own merged work (`0396`, the shared-tables and service-role registries and their checks, the per-shelter export scripts, six decision files); this branch touches none of those files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — `n/a: the handover has no backlog item; it is owed by SKILL.md step 8. This plan's findings were filed on the `backlog` branch instead — `#3qmzt` (the measurement chain), `#tnc10` (nine column-less tenant tables), `#bld1f` (the recurring first-build advisory) and `#stscp` (the `system.status` question, which is Lutan's)`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `n/a: no design choice is made here. The edition records decisions taken elsewhere and names the file each came from; a decision file about a handover would duplicate the handover`
- [x] `README.md` still accurate — unchanged by this PR and re-read: it does not describe the handover or its cadence, so nothing in it goes stale
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: a planner handover is internal working material for the next planning chat. No shelter user can reach it, and nothing they do changes`
- [x] Commit messages say why, not just what — the handover commit states the lead (two corrections against the planner itself: misreporting merged work as running, and "correcting" a true claim into a false one) and says why the `SKILL.md` row moved with it rather than "update handover"
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
- [ ] Any new secret/env var exists in the production Cloudflare environment — `deferred: release manager — this PR adds none, and this plan added none. (`TEST_SHELTER_ID` was added in the FIRST plan of 2026-11-17, not this one — a CI identifier, not a Worker env var.)`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `deferred: release manager — no, it contains neither`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `deferred: release manager — no migration in this PR. This plan shipped `0396` (PR #1650) and two more are in flight on batch 3 (`0397`/`0398` expected); `#stmp5`s `NOT NULL` carries a release-order constraint the edition names`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `deferred: release manager — no migration in this PR. The rewriting one in flight is `#stmp5`s `NOT NULL` over 105 columns, which needs the headerless SQL and cron writers stamped first — the edition says why`
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `deferred: release manager — none for this PR`

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — `deferred: release manager — the rollback for this PR is reverting one Markdown file, which needs no deploy and no down-migration. It does not cover the backlog commit this plan made on the `backlog` branch, which is separate history and is not reverted by reverting this PR`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **The planner twice told Lutan that work was still running when it had already merged**, and he had to say so: *"thats twice that you have made a false statement about open wiork without actually checking teh status"*. Both times it read `0 ahead` / `nothing beyond main` from `worktree.mjs list` and inferred — **a squash-merged branch is indistinguishable there from one that never committed**, which `SKILL.md` already warns about. | **fixed** — the edition carries the rule narrowly: never describe a stream's state from the worktree table, only from `gh pr list --state all --head claude/<slug>`. Used that way for batch 2 and batch 3 in this plan |
| 2 | **medium** | **The planner "corrected" a true claim into a false one.** PR #1644 reported the `next build` halt *clears on retry*; the planner contradicted it and wrote *"it does NOT clear on retry"* onto `#bld1f` **as a measurement**, from two runs that were never a controlled retry. **PR #1652 settled it: it does clear.** | **fixed** — `#bld1f` was downgraded to *not established* before briefing (which is why the stream was asked to settle it rather than told), the item now carries the measurement, and the edition carries the lesson: a measured-sounding sentence that was never a controlled measurement is worse than an open question |
| 3 | low | The edition is **200 lines against `SKILL.md`'s ~150-line target**, though shorter than `755`'s 224 and `754`'s 271. Two bullets were cut rather than shipping it longer. The excess is the two corrections above plus a programme-state section. | **accepted** — the programme-state section exists so a fresh chat does not re-derive thirteen parts' status, which `756` and `755` both had to do. Recorded rather than shipped silently |
| 4 | low | A `worktree.mjs new` was wasted: the background job created `tenancy-not-null`'s folder before the measurement came back that showed its gate was shut. | **fixed** — folder cleared the same session; the edition's rule is to measure a named gate **before** step (a), not during it |
| 5 | low | `check-backlog-sections.mjs` reported 36 open items while the backlog worktree held 39, which reads exactly like items going missing. | **accepted, not a defect in the script** — it reads `main`'s copy by design (`CLAUDE.md` says so) and the pre-commit hook, which reads the staged file, was correct. Recorded in the edition so the next planner does not chase it |

## Left for manual verification

**Not empty this time, and the item is not this PR's own.** The deliverable here is a Markdown document whose correctness was checked by re-reading its sources (section 5). But this edition carries forward a verification gap from PR #1645 that a person must close, and it is recorded here so it is not lost with the conversation.

| # | What to check | Where |
|---|---|---|
| 1 | **Press an upload on the facility map and confirm the image stores and serves.** PR #1653 filtered the storage paths by shelter and browser-checked the **read** side only (a stored plan image served `200 image/webp` through the new ownership check), saying in terms *"No upload was pressed"*. The write side of that filter has not been exercised by a person. | `/admin/facility-map`, signed in as admin |

**AND ONE ITEM `756` CARRIED FORWARD IS NOW CLOSED, WHICH IS WHY THIS LIST IS SHORTER RATHER THAN LONGER.** `756` left *"that a signed-in session can still reach a page listing residents and still holds its cards, after Part 5's policies"*. **PR #1651 drove it:** signed in as admin, it reached Recent changes and saw rows with actor names, and Who does what listing roles — i.e. a signed-in session kept its cards and read rows after the policies. **Closed by that run, not by this plan.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `pending: the list is NOT empty. It carries one upload check forward from PR #1645, whose own browser click-through was not completed, and no person has looked yet. It is not this PR own surface and does not gate this PR`

Manual verification by: pending: the carried-forward browser check in the list above is for a person; it is not this PR's own surface and it does not gate this PR

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a` in practice: a handover document is not part of a release payload, and this plan says so under section 8. Recorded as handed over by being in the PR the release manager can read

Result: pass with accepted defects

Release manager acknowledgement: pending: not required for a docs-only handover PR, which merges on green like the release's own two
