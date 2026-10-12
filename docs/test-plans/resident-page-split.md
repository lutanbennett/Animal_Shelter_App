# Feature test plan

## Header

| | |
|---|---|
| Feature | Split the resident record page: one renderer per section (no behaviour change) |
| Backlog item | `docs/backlog.md` → "Split the resident record page: one file per section (architecture review C5)" |
| Branch / worktree | `claude/resident-page-split` @ `C:\Development\Animal_Shelter_resident-page-split` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `ee1aa594` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the 1,465-line `[section]/page.tsx` is now a ~210-line page (guard, shared loads, header, map) plus ten renderers in `sections/`
- [x] Files/areas touched listed: `src/app/residents/[id]/[section]/page.tsx`, `sections/*` (ten renderers, `shared.tsx`, `types.ts`), `scripts/check-resident-sections.mjs` (new proof script), `scripts/check-permission-catalogue.mjs` (pin reads the folder), backlog, decision note, this plan
- [x] Roles affected identified: none changed. Admin and Management read all ten tabs; head of medical, doctor, volunteer, head of maintenance and second in command are refused or 404 on dev data; signed-out public is redirected. All eight probed
- [x] Anything explicitly **out of scope** written down: any query, markup, prop or name change; a shared abstraction over the renderers. Noticed and left: the unused `kind` parameter of `canArchive` (a lint warning that predates this)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 36s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`. n/a: no migration
- [ ] `--status` reviewed before applying. n/a: no migration
- [ ] `--dry-run` reviewed. n/a: no migration
- [ ] Applied to dev. n/a: no migration
- [ ] File is re-runnable. n/a: no migration
- [ ] Existing rows still read correctly. n/a: no migration; the same rows are read by the same queries, proved by the probes in section 4
- [ ] Constraints and defaults exercised against real rows. n/a: no migration
- [ ] Down-migration written. n/a: no migration
- [ ] Production apply plan stated. n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: every tab of five dev residents loads as Admin and Management, rendered markup identical before and after
- [ ] Data persists. n/a: nothing is written; the page only reads
- [ ] Create / edit / delete exercised. n/a: no write path touched; the buttons that lead to them render identically
- [x] Empty state renders sensibly: a resident with no prescriptions, visits or weights is one of the five, all ten tabs compared
- [ ] Invalid input is rejected. n/a: no input on this page
- [x] Boundary cases checked: deceased (locked record, add buttons dropped), adopted, fostered and empty residents; `?archived=1` on the four tabs with an archive; a non-existent section name (404)

**Proof, not assertion.** `scripts/check-resident-sections.mjs` signs in as eight throwaway roles on dev and requests 15 URLs for each of five residents on the old page and on the new, then compares the whole rendered body. Result: **600 probes, 0 differences**. 150 of them are tabs with real content (Admin and Management); the rest are refusals, compared on status and target. A deliberate break (the Log immunization button shown on a deceased resident) was caught: 2 differences. The first version of the probe compared only `<main>`, which is just the loading shell; that gave a meaningless 0, was found, and was fixed before the numbers above.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all ten tabs | unchanged | 75 probes identical |
| management | all ten tabs | unchanged | 75 probes identical |
| second_in_command | refused on dev data | unchanged | identical (refusals) |
| head_of_medical | refused on dev data | unchanged | identical (refusals) |
| head_of_maintenance | refused | unchanged | identical (refusals) |
| doctor | refused / 404 on dev data | unchanged | identical |
| volunteer | refused | unchanged | identical (refusals) |
| signed out (public_viewer login) | redirected to `/` | unchanged | identical |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly): that is what the refusal probes are

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: no nav change
- [ ] Manual updated. n/a: no user-visible change; the pages are the same
- [ ] Translatable strings. n/a: no strings added or moved
- [ ] Mobile viewport (375px). n/a: markup compared byte for byte, no layout change
- [x] Browser console clean: `next dev` logged no error or React warning across the 600 requests (server log read)
- [x] Network clean: no 5xx in the probes; the only non-200 are the intended 307s and 404s, identical before and after

## 6. Regression

- [x] The pages nearest the change still work: all ten tabs, loaded by the probes; `/residents/[id]` untouched
- [x] Any shared file touched checked from a second page: `check-permission-catalogue.mjs` is shared, and `npm run lint` (which runs it) passes for every other page
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; no other open item described this outcome (searched `residents/[id]`, `[section]`, `sections/`)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-12-resident-page-split.md`
- [ ] `README.md` still accurate. n/a: it does not describe this file
- [ ] **Release notes.** n/a: no change a shelter user could notice, the same pages reorganised in the code
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision note were measured: the probe count, the mutant catch and the permission-check failure were all observed in runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: no date logic changed
- [ ] Boundary or banding change covers both edges. n/a: no boundary changed
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked. n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no migration
- [ ] `--env production --dry-run` run and clean. n/a: no migration
- [ ] Destructive migration backup. n/a: no migration
- [ ] Apply plan stated. n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR; no schema, no data, nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: the list is empty; rendered markup was compared, nothing is left for eyes

Manual verification by: n/a: nothing to look at, the rendered pages are byte-identical

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager. n/a: not yet merged

Result: pass

Release manager acknowledgement: pending
