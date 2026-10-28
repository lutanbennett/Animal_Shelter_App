# Feature test plan — card-shaped-instruments

## Header

| | |
|---|---|
| Feature | The analysis instruments ask a card question: `check-menu-coverage` per card with the distinct-page figure, two card-shaped checks, and the `0279` release note |
| Backlog item | `docs/backlog.md` → Security, *THE ANALYSIS INSTRUMENTS ASK A ROLE QUESTION…* (part done) and *ADD MEDICAL PHOTOS SHOULD ALSO SEE MEDICAL PHOTOS* (note written) |
| Branch / worktree | `claude/card-shaped-instruments` @ `C:\Development\Animal_Shelter_card-shaped-instruments` |
| Dev server | n/a: no page changed; scripts and one release note |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Sonnet 5.5) / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 845775b9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — menu coverage and two checks answer per card; the `0279` note is written
- [x] Files/areas touched listed — `scripts/check-menu-coverage.mjs`, `scripts/lib/readonly-checks.mjs`, `src/lib/releases.ts` (one note), `docs/backlog.md`, one decision file
- [x] Roles affected identified — none: no permission, card, policy or migration changes; the new note is tagged `add_medical_photos`
- [x] Anything explicitly **out of scope** written down — the rest of `check-production.mjs`, page controls, the walkthrough and fault log

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; reverting the commits removes the change
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-menu-coverage.mjs` runs with no database, prints the per-card table and 64 distinct pages: 37 reached alone, 10 need two cards, 17 no card opens; exit 1 (red on purpose; the exit code now means 27 pages no single card both opens and reaches)
- [x] `node --test scripts/check-production.test.mjs` passes with the two new checks (each is one read-only SELECT)
- [x] `--roles` mode was **not run**: it needs the dev token; its logic is the old loop moved behind a function, under a transient-context heading
- [ ] Data persists — reload the page and the change is still there — n/a: no stored state
- [ ] Create / edit / delete all exercised — n/a: scripts only
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: an unknown `--card=` key throws a named error; no user input
- [ ] Boundary cases checked — n/a: no values
- [x] The 0.40.10 note carries `cards: ["add_medical_photos"]`, a valid card key (typecheck passes)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | scripts and a release line | n/a |
| management | n/a | as above | n/a |
| doctor | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | n/a | repo is public; no person named | as expected |

- [ ] Every role above tested — n/a: nothing served changes access
- [ ] A role that should not have access is blocked server-side — n/a: no access path touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no feature change
- [ ] Translatable strings go through the translation path — n/a: the release note is English like its neighbours
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: not a page
- [ ] Network clean — n/a: not a page
- [x] **`AGENTS.md` left alone**

## 6. Regression

- [x] The pages nearest the change still work — `gates.mjs` builds the app with only a release line added
- [x] Any shared file touched checked from a second place — `src/lib/releases.ts`: the note sits inside `0.40.10`'s array; typecheck and tests pass
- [x] Nothing merged from `main` during `sync` was broken (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — the medical-photos item was already ticked; its note and the three-times mechanism are recorded. The instruments item is annotated PART DONE, not ticked, because the rest of `check-production.mjs` is still role-keyed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-instruments-ask-a-card-question.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: yes, and the line is written, but in `0.40.10`'s own `notes` (a released version, amended on purpose because `0279` shipped in that release), not `unreleased`, so the checker cannot see it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 64/37/10/17 figures are the script's output

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable surface
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date arithmetic
- [ ] **For a boundary or banding change, both edges covered** — n/a: no boundary
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `apply-migrations --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting the commits restores the old script and removes the note; it does not recall any release email, and none was sent for 0.40.10

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | 27 pages (10 need two cards, 17 no card opens) are not reached by any single card; the instrument now exits 1 on them | deferred to backlog — sizes Card review 2; red on purpose |
| 2 | low | Release notes for `0275`, `0276`, `0279` were each missed by a nominated carrier | accepted — mechanism recorded on the backlog item; not built |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `card-lifecycle-enclosures` and `card-clinic-visit-save` against production; their SQL was validated by reading only (no production credentials in a worktree) | main checkout: `node scripts/check-production.mjs <check>` |
| 2 | Object, if wanted, to amending a released version (`0.40.10`) rather than using `unreleased` | PR description |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 needs production credentials, item 2 is Lutan's call

Manual verification by: pending: planner to run the two production checks; Lutan to confirm the 0.40.10 amendment

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: no deploy needed; the note ships with the next release
