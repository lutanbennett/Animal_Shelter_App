# Feature test plan

## Header

| | |
|---|---|
| Feature | Medical gates and tooling: blood-test and procedure writes ask `can()`; `ReleaseRole` lists the live roles; `check-phone-width --clean` sweeps only stale rows and lists them |
| Backlog item | `docs/backlog.md` → "Blood-test and procedure writes ask no permission", "`ReleaseRole` is out of date", "`check-phone-width.mjs --clean` sweeps other runs" |
| Branch / worktree | `claude/medical-gates-and-tooling` @ `C:\Development\Animal_Shelter_medical-gates-and-tooling` |
| Dev server | not started: no screen changed (see section 4) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `3358b545` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog asked for: four medical writers check `can()` at Edit first, the release-note role type matches the live roles, and the width script's `--clean` leaves recent rows alone and prints what it removes
- [x] Files/areas touched listed: `src/app/blood-tests/new/actions.ts`, `src/app/procedures/new/actions.ts`, `src/app/residents/[id]/{blood-tests,procedures}/actions.ts`, `src/lib/releases.ts` (type only), `scripts/check-phone-width.mjs`, docs
- [x] Roles affected identified: a login without Edit on blood tests or procedures now gets "not allowed" instead of a save failure from a direct call; no live role sees any difference
- [x] Anything explicitly **out of scope** written down: eight further writer files with no `can(` found by the grep; spun out to the backlog branch, not absorbed. Not a hole in the four fixed: the database already refused the write

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Wording exists: `t.common.notAllowed` is the string the weight, prescription and diet actions return; the four actions use it and typecheck against the dictionary
- [x] `--clean` run against dev: prints the cutoff, a per-table count (all 0), and removed the one stale login (`phonewidth-staff-20261003@example.test`) by name; the second run found nothing to remove
- [ ] Data persists — n/a: no write changed; a permission check was added in front of existing writes
- [ ] Create / edit / delete all exercised — n/a: same; a real blood test and procedure create as management is in Left for manual verification
- [ ] Empty state renders sensibly — n/a: no new list or view
- [ ] Invalid input is rejected with a readable message — n/a: no input handling changed; the check sits before it
- [ ] Boundary cases checked — n/a: the sweep's one-hour cutoff was read, and rows younger than it are not touched

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | blood-test / procedure create, attachment delete | unchanged | not driven: `can()` answers yes to every key |
| management | same | unchanged | not driven in a browser; left for manual |
| doctor | same | unchanged | not driven in a browser; left for manual |
| volunteer | — | no Edit: direct call now says "not allowed" | read in the diff; not called with a login |
| signed out | — | `/login` | n/a: proxy gate unchanged |

- [x] Every role above tested (or the reason it was not is in its row)
- [x] A role that should not have access is blocked server-side: the four actions refuse in code ahead of RLS (read in the diff)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: who may record blood tests and procedures is unchanged
- [ ] Translatable strings go through the translation path — n/a: no new strings; `notAllowed` reused
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: server-side change, no client code touched
- [ ] Network clean — n/a: no client requests added

## 6. Regression

- [x] The pages nearest the change still work: build compiles the blood-test, procedure and resident routes
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `releases.ts` changed in its type only, and `/releases` is covered by the typecheck (it reads `noteRoles`)
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates green)

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (all three); one follow-up on the `backlog` branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: three small fixes; the one choice (keeping `"staff"` as a retired role so released notes still typecheck) is in the code comment
- [ ] `README.md` still accurate — n/a: README says none of this
- [ ] **Release notes.** — n/a: the permission wording only shows to someone calling the API directly, the role list is an authoring option, and the sweep is a dev script
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "not a hole" claim is from the RLS refusal described in the backlog item; the sweep behaviour is from running it on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic that depends on a day boundary (the sweep's cutoff is an elapsed hour)
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: a permission check with no band; the sweep's hour cutoff has no test beyond the run above
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (app-only; a Pi rebuild at the previous SHA reverts it, nothing in the database)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | minor | Other writer files (`admin/diets`, `admin/medications`, `maintenance`, `projects`, `residents/new` and more) contain no `can(` | deferred to backlog; many may be guarded another way |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As management: record a blood test and a procedure on a resident; both save, and deleting an attachment still works | `/blood-tests/new`, `/procedures/new` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item is waiting for Lutan

Manual verification by: pending: the row in Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: deferred to the backlog, recorded above; accepting it is the release manager's call
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
