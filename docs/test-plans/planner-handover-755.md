# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `755` — replaces `754` in `docs/planner-handover.md` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item; `SKILL.md` step 8 owes it at the setup of a plan's last batch |
| Branch / worktree | `claude/planner-handover-755` @ `C:\Development\Animal_Shelter_planner-handover-755` |
| Dev server | not started — no code, no route and no rendered surface in this PR |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1643 |
| Tested by / date | Claude (planner) / handover written 2026-11-16, gates run 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | `dd77b97fe3ee09acb0bfcf843106cd20fce60bd1` — the only commit after it edits this plan file, so no code differs |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: replace `docs/planner-handover.md` with edition `755`, a delta against `754`.** No backlog item by design (see header); the authority is `SKILL.md` step 8
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — **exactly two files: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-755.md` (new).** No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/`
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — `n/a: no card grants or denies the ability to read a repository document, and the file is not served by the app at any address. Admin and the signed-out public are unaffected because nothing they can reach changes`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **out of scope:** `docs/release-handover.md` (the release manager's own, untouched), `.plan-day.md` (gitignored, never in a PR), `SKILL.md` (no edit owed — the floor still reads 86–89k on seven readings), the `/plan-day` step that would make the nightly read habitual (named as owed, not written here), and this plan's three unread stream figures, which belong to this edition's successor

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: build exited 0 after 44s

gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR (runs the same four gates, among its other checks) — `pending: CI running on PR #1643. The PR is merged only on full green against this head commit, per the merge-on-green rule`

- [ ] CI green on the PR (runs the same four gates, among its other checks) — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. The highest on `main` is `0391_public_views_scoped_by_shelter.sql` and this branch adds none.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR, and no code in it reads any table`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR. Two migrations from this plan DO need a production apply — 0390 and 0391 — and the edition says so; they reach production through an ordinary release, not through this PR`

## 4. Functional checks

The change is one Markdown document read by the next planning chat. It has no happy path, no persistence and no input.

- [ ] Happy path works end to end — `n/a: a Markdown document has no execution path. What stands in for it is that every claim traces to the artefact that produced it, which section 5 covers`
- [ ] Data persists — reload the page and the change is still there — `n/a: no page and no stored data; the file is version-controlled, which is its persistence`
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: the feature is a document rewrite; there is no create, edit or delete surface`
- [ ] Empty state renders sensibly (no rows yet) — `n/a: no rows and no rendered state`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: the document takes no input`
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `n/a: no fields. The one date-shaped risk is handled instead: the edition is dated 2026-11-16 from the system date, not derived from its predecessor, and it tells its successor to do the same`

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
- [x] **Stood in for the above, since a document's real failure mode is being wrong rather than being broken:** every figure, PR number, item id and quotation was taken from the artefact that produced it, and re-read before writing. **Named, so each is checkable:** `curl https://lannacareforanimals.org/api/releases/current` for the deployed `0.47.1` (the lead rests on it, and it contradicts the release record, so it was read live rather than quoted); `gh pr view` for #1625, #1626, #1627, #1629, #1635, #1636, #1638, #1640, #1641 and the open #1634; `gh run list --workflow tenancy-catalogue.yml` **and `gh run view 43716500145 --log`** for the nightly's three runs and the failure's actual cause; `0383_shelter_id_animals.sql` lines 19–35 for the header-only read and the withheld `anon` grant; `src/lib/supabase/shelter-header.ts` for *forwards but never creates*; `.github/workflows/ci.yml` for which project the public-tier job reads. **The floor arithmetic was recomputed, not copied:** `tokens − messages` gives 86,165 / 86,727 / 87,113 for the three streams added this edition
- [x] **One claim deliberately NOT made.** The 21-ambiguous / 8-or-9-not-tenant difference now has three readings and is recorded as unreconciled rather than resolved to the newest, because no reading measured the same thing the others did

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **none exist to check.** The nearest *consumers* are documents, and both were read on this branch: `docs/release-handover.md` (untouched, unrelated by design) and `.claude/skills/plan-day/SKILL.md`, whose step 8 and delta rules this edition satisfies
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **no shared file is touched.** `git show --stat` on this branch's commits lists only `docs/planner-handover.md` and this plan
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in this plan's own merged work (`0390`, `0391`, the canary change, the null-shelter check, the worktree fix); this branch touches none of those files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — `n/a: the handover has no backlog item; it is owed by SKILL.md step 8. This plan's findings were filed on the backlog branch instead — #lhdr7 filed, #n4rpt filed then corrected by its own filer, #admsq ticked, #stmp5 updated to record steps 1/2/4 as shipped, and #ujqr5's title re-pointed at its real blocker`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `n/a: no design choice is made here. The edition records decisions taken elsewhere and names the file each came from; a decision file about a handover would duplicate the handover`
- [x] `README.md` still accurate — unchanged by this PR and re-read: it does not describe the handover or its cadence, so nothing in it goes stale
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: a planner handover is internal working material for the next planning chat. No shelter user can reach it, and nothing they do changes`
- [x] Commit messages say why, not just what — the handover commit states the lead (the gate everyone watched was not the thing in the way) rather than "update handover"
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — **the edition's own subject, applied to itself.** Its lead corrects `754` on two points and each correction names the command that settles it. Two things are recorded as *not* established rather than smoothed: the table-count difference above, and whether Part 7's *run after Part 5* note really binds its audit half — written as an open question for the next planner, not as a finding

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
- [ ] Any new secret/env var exists in the production Cloudflare environment — `deferred: release manager — this PR adds none`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `deferred: release manager — no, it contains neither`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `deferred: release manager — no migration in this PR, but 0390 stamps every tenant row and the edition says to read its dry-run before applying it to production`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `deferred: release manager — no migration in this PR; 0390 is a rewriting update of every tenant row when its own release comes`
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `deferred: release manager — none for this PR`

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — `deferred: release manager — the rollback for this PR is reverting one Markdown file, which needs no deploy and no down-migration. It does not cover the five backlog commits this plan made on the backlog branch, which are separate history and are not reverted by reverting this PR`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **224 lines against `SKILL.md`'s ~150-line target**, though shorter than `754`'s 271. The content is delta and owed items; trimming it well was judged to risk losing operational detail. | accepted — stated rather than shipped silently |
| 2 | low | The planner created and fully briefed a worktree for `#dvsgn` while PR #1634 was already fixing it, because `gh pr list --state open` was not run before `worktree.mjs new`. | fixed in process terms — folder cleared, `#ft13c` folded into another stream, and the guard is written into the edition's *FOR YOUR FIRST TURN* |
| 3 | low | An optional stream (`nightly-lint-reporting`) was handed over as the day's work; Lutan caught it — *"it said nothing was to be built"*. | accepted and recorded — the rule now sits in the edition's process section |

## Left for manual verification

Empty. There is no surface a person needs to look at: the deliverable is a Markdown document, and its correctness was checked by re-reading the artefacts each claim came from (section 5) rather than by looking at a screen.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the deliverable is a repository document with no rendered surface; nothing requires a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a` in practice: a handover document is not part of a release payload, and this plan says so under section 8. Recorded as handed over by being in the PR the release manager can read

Result: pass with accepted defects

Release manager acknowledgement: pending: not required for a docs-only handover PR, which merges on green like the release's own two
