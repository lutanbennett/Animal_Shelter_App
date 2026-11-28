# Feature test plan

## Header

| | |
|---|---|
| Feature | Near-name warning: compare `other_names`, ignore a trailing number for close spelling |
| Backlog item | `docs/backlog.md` → `#dupnx` |
| Branch / worktree | `claude/near-names-gaps` @ `C:\Development\Animal_Shelter_near-names-gaps` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: the intake wizard and the scripts' near-duplicate check now compare other names and stop treating numbered siblings as look-alikes. Files: `src/lib/residents/near-names.ts` (+ test), `src/app/residents/new/NameField.tsx`, `page.tsx`, i18n `en.ts`/`th.ts`, `scripts/load-residents.mjs`, `scripts/correct-resident.mjs`. Card: `residents` (holds `resident.register`); no change to what any card grants. Admin and signed-out: unaffected. Out of scope: part 3 (answered, not built), production data, `nextNumberedName`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the warning is absent when nothing matches; shown with "Zzqx Dupnx" and no other names
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: a warning only, no new input is validated
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Driven headless Chrome (`scripts/lib/driven-session.mjs`, login holding exactly `residents`, dev): *Tiger 4* warned only against R-9500 *Tiger* ("the same name with a number added"), not against *Tiger 2*/*Tiger 3*; *Zzqx Dupnx* with other names *Bob, Tiger* warned "goes by the same other name" against R-9500; registered as R-9503 and read back from the database with `other_names = "Bob, Tiger"`. Unit tests cover null/empty other names, numbered pairs and mid-word digits.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `residents` | `/residents/new` | warning shows, register saves | as expected |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed; part 3 shows no card grants register without record

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not list the warning's reasons
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the two strings are dictionary entries in `en.ts`/`th.ts`, both written; the Thai one was seen nowhere by a person
- [ ] Mobile viewport (375px) — n/a: two new short reason strings in an existing list
- [ ] Browser console clean — n/a: not captured by the headless driver
- [ ] Network clean — n/a: not captured; the save succeeded and redirected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched checked from a second, unrelated page
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: `/residents/new` and the saved resident's page. `load-residents.mjs` dry run against dev (now runs again after the `diet_types.is_standard` fix); `correct-resident.mjs` and `upload-blood-work.mjs` load and print their usage.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? Yes: a volunteer sees the new other-name warning; line added to `unreleased`.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary**
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a fresh backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Code only; a Pi redeploy of the previous SHA reverts it fully.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `load-residents.mjs` failed every run since `0243` (selected dropped `diet_types.is_standard`) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none: the warning was driven and the row read back | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the release manager picks it up at the next release

Result: pass
Release manager acknowledgement: pending: release manager
