# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `753` |
| Backlog item | `docs/backlog.md` → n/a: the handover is a process document and closes no backlog item. The finding it reports was filed separately as `#w4t9k` on the `backlog` branch |
| Branch / worktree | `claude/planner-handover-753` @ `C:\Development\Animal_Shelter_planner-handover-753` |
| Dev server | n/a: no runtime surface |
| PR | see below |
| Tested by / date | Claude (planner) / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | 45a66d526 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `753`, a delta on `752`. Written at batch 3's setup, as `SKILL.md` step 8 requires of a plan's last batch
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly one file, `docs/planner-handover.md`. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card is affected, and no card gates this file.** It is a repository document read by one chat; admin and the signed-out public are unaffected because nothing in the running app reads it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: `docs/release-handover.md` (the release side writes its own), `.plan-day.md` (gitignored, not in this PR), and **fixing `#w4t9k`**, which this edition reports and files but deliberately does not fix

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 85s
=== gates: lint exited 0 after 134s
=== gates: test exited 0 after 34s
=== gates: build exited 0 after 128s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no table read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown document with no runtime behaviour
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | nothing — the file is not served by the app | n/a | n/a |

- [ ] Every login above tested — n/a: the file has no route and no card gates it; there is nothing for a login to reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL serves this file. **The repository is public, so the file is readable by anyone** — which is why it carries no network values, no personal data and no credentials, checked before committing

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for a planning chat, not a shelter user; the manual is unaffected
- [ ] Translatable strings go through the translation path — n/a: no user-facing string added
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — n/a in the browser sense; the gates' `build` is what proves no page broke, and it exited 0. Nothing imports this file
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — no shared file was touched: the diff is one Markdown file. `git show --stat` confirms it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in `docs/backlog.md` only (4 insertions, 3 deletions) and the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. `#w4t9k`, the finding this edition reports, was filed on the `backlog` branch as `CLAUDE.md` requires, and is **not** ticked by this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover records no design choice of its own; it reports the plan's and names their existing decision files
- [x] `README.md` still accurate — unaffected: it does not describe the handover's contents
- [ ] **Release notes.** — n/a: a planner-to-planner document inside the repository. No shelter user can see it, and nothing in the running app reads it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition was read rather than recalled: the five actuals from their `stream-usage:` comments, the floors computed from them, the nightly's run id, timestamp, exit and flagged table from `gh run view 43716500145`, and the production table count from `check-tenancy-catalogue.mjs --env production`. **One claim was NOT measured and was corrected:** the second commit's message first said the trim ran "255 to 229 lines" — a guess. The real figure is 238. **The commit was amended and says so**, because this edition's own correction section is about exactly that fault

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: documentation only. This PR changes no shipped code, so there is no build whose SHA a deploy could match
- [ ] Deployed SHA matches the tested SHA — n/a: documentation only; nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: documentation only; no deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only; no deployed surface changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic. The edition contains dates as prose, and each was read from a tool's output rather than computed
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding logic. The band *figures* discussed in the edition are forecasts, not code
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is this run's own output, pasted whole
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting the commit restores edition `752`, and that is the whole of it: nothing deploys, no schema moves, and no running system reads this file. **What it does NOT cover:** `#w4t9k` stays filed on the `backlog` branch whatever happens to this PR, and `.plan-day.md` is gitignored and unaffected either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a — found, not caused | The nightly tenancy lint's first scheduled run failed on 2026-11-15 naming `public.donation_tax_ids` as missing its `definer_all` policy, and nothing reported it for ~24 hours | deferred to backlog as `#w4t9k`, with a note that it wants fixing before `0381` reaches production |
| 2 | low | This edition's second commit message stated a line count that had been guessed, not read (229 for 238) | fixed — commit amended and the correction stated in it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | the change has no surface a person needs to look at |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-16

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planner-to-planner document with no runtime surface; the manual list is empty

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in the deploy sense: nothing here reaches a release. **Defect 1 is the part a release manager needs**, and it is on the backlog as `#w4t9k` rather than only here

Result: pass
