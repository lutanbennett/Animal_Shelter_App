# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `747`, and the product-name decision (Cooper Jaidee) |
| Backlog item | `docs/backlog.md` → `#ykefa` is **noted, not ticked**; the note went on the `backlog` branch, where it belongs |
| Branch / worktree | `claude/handover-747` @ `C:\Development\Animal_Shelter_handover-747` |
| Dev server | not started — no code and no page changes |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | see the gates note in section 2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — edition `747` of `docs/planner-handover.md`, written at the setup of this plan's last batch as `SKILL.md` requires, plus `docs/decisions/2026-11-14-product-name.md` recording Lutan's choice of **Cooper Jaidee** and the registration of `cooperjaidee.org`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly three markdown files: `docs/planner-handover.md`, `docs/decisions/2026-11-14-product-name.md` and this plan. **No route, no worker, no migration, no shared lib, no code of any kind**
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **none.** Neither file is served by the app; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **no rename of anything**: the app, this repository, the Supabase projects, the Pi services and the live domains are untouched. **No DNS, Cloudflare or Worker change** follows from the name decision. `lannacareforanimals.org` remains production and `lannacare.org` still 301s to it. `docs/release-handover.md` is untouched (the release side's edition is the release manager's, per `docs/release-procedure.md` rule 3). The `#ykefa` note is on the `backlog` branch, not in this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 22s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 334s
=== gates: test — npm test
=== gates: test exited 0 after 107s
=== gates: build — npm run build
=== gates: build exited 0 after 322s
gates: typecheck=0 lint=0 test=0 build=0
```

**Said plainly rather than glossed:** that run started at commit `db8f4534e`, and **two markdown edits landed in the two documents while it was running** — the correction from "he is buying it tonight" to the confirmed registration. **No code exists in this PR at all**, so none of the four gates has a different answer for the final head than for `db8f4534e`; the edits are prose inside two files neither `typecheck`, `lint`, `test` nor `build` reads. An earlier run was **stopped on purpose** (`TaskStop`) rather than reported, because it was measuring a tree that no longer existed once the decision file was added — a killed gates run proves nothing and is not pasted here.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads any table differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two markdown documents with no code path; their readers are the next planner chat and anyone grepping `docs/decisions/`
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the one checkable claim in either document is the **date**: `docs/decisions/2026-11-14-product-name.md` is dated today and `node scripts/check-decision-dates.mjs` answers `ok — 1 decision file(s) added, none dated after 2026-11-14`. That check **blocks**, and a file dated even one day ahead fails it

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | neither document is served by the app | n/a: no route, no page, no API |
| exactly `<card key>` | nothing new | as above | n/a: no card governs a repo document |
| exactly `<card key>` | nothing new | as above | n/a: no card governs a repo document |
| signed out | nothing new | as above | n/a: no route, no page, no API |

- [ ] Every login above tested — n/a: the change adds no route, page or API, so there is nothing for any login to reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a planner process document and a decision record; neither is shelter-facing help. **The product name is not yet in any user-facing text and this PR does not put it there**
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none exist; the only regression risk is at build time and `npm run build` exited 0 with both files in place
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `git show --stat` is three markdown files
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported "Already up to date", so nothing came in, and the four gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: nothing is closed by this PR. **`#ykefa` is NOTED, not ticked** — the name was its blocker, not its work, and the item is still ≈50 hours. That note went on the `backlog` branch, where backlog edits belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-14-product-name.md`, carrying the decision, the shortlist it was chosen over, the RDAP evidence, what it unblocks and the three things it does not
- [x] `README.md` still accurate — unchanged by this PR, and it does not name the product
- [ ] **Release notes.** — n/a: a planner-to-planner process document and a decision record; no shelter user can reach either, and **the name appears in no user-facing text yet.** When it does, that PR carries the note
- [x] Commit messages say why, not just what — the handover commit names the floor finding, the mis-banding and the migration-number guard; the decision commit names what the name unblocks and the three things it does not
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every usage figure in the edition was read from a `stream-usage:` comment on a merged PR with the floor computed as `tokens − messages`; the two identical **89,505** floors were read, not inferred; and the domain's state was taken from **RDAP** (registered 2026-11-14, expires 2028-11-14) rather than from the word "bought"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, so nothing derives a date at runtime. The dates in both documents are written, not computed
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary logic. The usage bands in the edition are prose read by a person, not a computed threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is the run's own lines from its output file, each gate with its own timing; the `check-decision-dates.mjs` line in section 4 is that script's own sentence; the domain's dates are RDAP's
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — **none, and this is worth stating rather than skipping:** a domain was registered today, and **nothing in this PR adds a DNS record, a Worker route, a Pages project, a binding or a secret for it.** `cooperjaidee.org` points at nothing on purpose

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of these two commits restores edition `746` and removes the decision file, and it covers everything this PR changes, because the PR changes documentation and no schema or deployed behaviour. **What a revert does NOT undo:** the domain registration (his purchase, outside git) and the `#ykefa` note (a separate commit on the `backlog` branch). Reverting would also put back `746`'s stale line saying the product name is still with him, which is the one thing worth knowing before anybody does it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **200 lines against `SKILL.md`'s ~150-line target** (`746` was 229, so it is shorter than its predecessor but still over). Accepted rather than trimmed: two plans ran on one day, the floor finding needed its evidence, and the migration-number guard needed both halves written down or it will be re-derived | accepted |
| 2 | low | The gates run began one commit before the final head; the later edits are prose in two markdown files and no code exists in this PR. Stated in section 2 rather than papered over | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | the list is empty: there is no surface a person needs to look at, and both documents' readers are the next planner chat and anyone grepping `docs/decisions/` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-14

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: two documents with no page, route or user-facing string — there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs-only, nothing to deploy
