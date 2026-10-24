# Feature test plan — who-does-what-features-app

## Header

| | |
|---|---|
| Feature | The app half of grouping Who does what's Available cards by feature: collapsible feature sections, Not yet sorted, and an Admin Features panel |
| Backlog item | `docs/backlog.md` → **Who does what: group the Available cards column into sections by FEATURE** (ticked) |
| Branch / worktree | `claude/who-does-what-features-app` @ `C:\Development\Animal_Shelter_who-does-what-features-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no (reads the tables `0255` added) |
| Tested at SHA | `547259a1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Available cards are sections by feature (data, from `features`), with Not yet sorted, and Admin can edit features and move a card
- [x] Files/areas touched listed — `src/app/admin/who-does-what/{page,CardBoard,actions}` and new `FeaturesPanel.tsx`, `src/lib/audit/recent-changes.ts`, `src/app/admin/recent-changes/page.tsx`, both dictionaries, manual, releases; the two `scripts/` registration files were NOT needed (no new page or topic)
- [x] Roles affected identified — Admin (edits); Management sees the grouped column read-only; no role's access changes
- [x] Anything explicitly **out of scope** written down — no migration, `cards.ts` untouched, held-cards side and tile groups untouched, `src/app/admin/diets/` untouched; the four guessed mappings left as seeded

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 185s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0255` landed in #902
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply; `--status` read at the start: 256 applied, 0 pending
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the real 13 features and 28 card rows were read through the page instead (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the schema PR's `check-features-schema.mjs` proved delete-unsorts and the write rules
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0255` must be applied to production before this deploys, because the page reads both tables and throws without them

## 4. Functional checks

Driven on dev. The dev sign-in is aal1, so the board opened read-only (the page said *verify with your authenticator app*) and no Admin write could be driven from the browser.

- [x] Happy path works end to end — as Admin at aal1, Management showed 12 feature sections (17 cards) and the volunteer role 12 sections plus Not yet sorted, in features.position order; the Features panel lists all 13 features
- [x] Data persists — reload the page and the change is still there — the grouping is read from the rows on each load; the one change made (below) showed after a reload
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the five server actions need the second step and could not be driven at aal1; see Left for manual verification
- [x] Empty state renders sensibly (no rows yet) — with no features the panel says so and every card falls into Not yet sorted (written in code; not reproduced, since all 13 features exist)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the refusal wording is in the actions (empty name, over 80 characters) but not drivable at aal1
- [x] Boundary cases checked — a card with no `card_features` row: `assistant`'s row was deleted on dev, the volunteer role then showed 12 sections plus *Not yet sorted (1 card)* holding Assistant, and held (3) + available (25) = 28, each once; the row was then put back (28 rows, 28 with a feature)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/who-does-what` | sections shown; edits need aal2 | sections and panel shown; locked note at aal1 |
| management | same page | read-only | same guard as before, not changed |
| staff | — | retired role | n/a |
| doctor | — | refused as before | not driven |
| volunteer | — | refused as before | not driven |
| signed out | — | sent to sign in | not driven |

- [ ] Every role above tested — n/a: only Admin driven; the page's guard (`opensWhoDoesWhat`) is unchanged and the new actions use the Admin + 2-step guard
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the new actions call `hasAdminRole()` and `hasTwoStep()` first, and the tables' policies repeat it (proved by the schema PR)

## 5. Cross-cutting

- [x] Nav entry correct — no new page; Who does what is where it was
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — a new step in *Who does what*; written and built, not opened in the browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: static dictionary strings in `en.ts` and `th.ts` (typecheck proves the shapes match); feature names are rows with their own Thai column
- [x] Mobile viewport (375px) — the Features panel at 375 px: `scrollWidth` 375, nothing past the right edge, name fields stacked
- [x] Browser console clean — no app errors on the page
- [x] Network clean — no failed requests on the page

## 6. Regression

- [x] The pages nearest the change still work — Who does what loaded for Management and the volunteer role with the cards, search box and groups as before
- [x] Any shared file touched checked from a second, unrelated page by loading it — `recent-changes.ts`, its page and both dictionaries compile in the full build; the Recent changes page itself was not opened
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-who-does-what-features-app.md`
- [ ] `README.md` still accurate — n/a: the README does not describe Who does what's board
- [ ] **Release notes.** — n/a: this was correctly **ticked** when the plan was written (#906, `e1d9c63`): `unreleased` then held a line for admins, nothing was outstanding, and the one hand step it named — `0255` applied to production — **was done by the release, before either deploy**, so the note was true the moment it became visible. **That note shipped in `0.40.1` and now lives in `releases`, not `unreleased`**, so no later diff can ever satisfy the tick again — and this PR adds a signature only. Untick-with-reason is therefore the honest state, exactly as it is on a cut PR, and the original tick stands in git history
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 28-once count and the unsorted case were read off the running page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines above are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads `0255`, which landed first in #902
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR; production's `0255` status is the release manager's to read with `--status --env production`
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated — redeploy the previous ref; no migration is involved, and the tables are left in place

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The Admin writes (add, rename, reorder, delete a feature; move a card) were not driven in a browser, only built and type-checked | accepted: needs the authenticator step; listed below |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **DONE 2026-10-24 by Lutan** — verified with the authenticator app: add a feature, rename it in English and Thai, move it up and down, move a card into it, delete it, and see its card under Not yet sorted | Settings → Who does what → Features |
| 2 | **STILL OPEN** — move a card, then pick a second role: the card is in the same section there | Settings → Who does what |
| 3 | **STILL OPEN, and it is a decision rather than a check** — move the four guessed cards if they belong elsewhere: Donations and receipts, Add medical photos, and the two landing pages | Settings → Who does what |
| 4 | **DONE 2026-10-24 by Lutan** — the Thai wording of the new lines reads naturally | Who does what with ไทย selected |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 and 4 were checked by Lutan on 2026-10-24; **items 2 and 3 were not**, so this line stays unticked rather than being ticked on a partial pass

**Lutan looked at this screen on 2026-10-24 and said so in chat, and he explicitly asked for
the plan to be signed in his name.** `CLAUDE.md` permits that only on both of those conditions,
and requires the line to say so — which is what the signature below does. **The scope was
confirmed with him before anything was ticked**: asked directly whether the Thai lines read
correctly as well as the panel working, he answered that they do.

**What is deliberately not signed.** Item 2 (move a card, then check a second role shows it in
the same section) is a real check nobody has run — it is the one that would catch the feature
grouping being stored per-role instead of once for every role, which is exactly what the release
note promises. Item 3 is not a check at all but a **decision** about where four guessed cards
belong, and only Lutan can make it. Neither is covered by "both tested and working", so neither
is ticked.

Manual verification by: Lutan Bennett — items 1 and 4 only, confirmed in chat 2026-10-24 (the Features panel adds, renames in both languages, reorders, moves a card and deletes; the Thai reads naturally); items 2 and 3 remain open and are NOT signed for  Date: 2026-10-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass

Release manager acknowledgement: n/a: not yet released
