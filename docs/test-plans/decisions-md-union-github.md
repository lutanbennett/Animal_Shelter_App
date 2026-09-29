# Feature test plan — decisions-md-union-github

## Header

| | |
|---|---|
| Feature | `docs/decisions.md` split into `docs/decisions/<date>-<slug>.md`, one file per decision, so parallel PRs stop reading CONFLICTING on GitHub |
| Backlog item | `docs/backlog.md` → Architecture → "`docs/decisions.md` merges by union locally but not on GitHub" |
| Branch / worktree | `claude/decisions-md-union-github` @ `C:\Development\Animal_Shelter_decisions-md-union-github` |
| Dev server | not used — no UI surface |
| PR | see PR |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | filled at merge |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: decisions become one file each so two streams never touch the same path, and CLAUDE.md no longer claims "merges by union, so just append"
- [x] Files/areas touched listed: `docs/decisions.md` (entries from 2026-09-24 removed, note added), `docs/decisions/` (88 entries, a README and the decision for this change), `.gitattributes`, `CLAUDE.md`, `README.md`, `docs/test-plan-template.md`, `docs/backlog.md`. Nothing under `src/`, `worker/` or `supabase/`
- [x] Roles affected identified: none, documentation only
- [x] Out of scope: about 150 citations of "docs/decisions.md" in source comments, applied migrations, test plans and the backlog are not rewritten (recorded in the decision)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the PR
- [x] `node scripts/gates.mjs` — typecheck, lint, build all 0 (output recorded on the PR)
- [x] CI green on the PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path: no decision text was lost. The 88 files plus the kept baseline account for every line of the old file; entries were cut only at `## <date> — ` headings outside code fences, and the heading became `#`
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input: the split script throws on any undated heading rather than guessing a name, and duplicate slugs get a `-2` suffix
- [ ] Boundary cases checked — n/a: no thresholds

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | documentation, not part of the app | n/a |
| management | n/a | documentation, not part of the app | n/a |
| staff | n/a | documentation, not part of the app | n/a |
| vet | n/a | documentation, not part of the app | n/a |
| volunteer | n/a | documentation, not part of the app | n/a |
| signed out | n/a | documentation, not part of the app | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no route or RPC added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page
- [ ] Manual updated — n/a: repo plumbing, not a shelter feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no `src/` file changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only docs and `.gitattributes`
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-09-29-decisions-one-file-per-decision.md`)
- [x] `README.md` still accurate (points at the folder and the frozen baseline)
- [ ] **Release notes.** n/a: repo plumbing, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions/` were measured, not reasoned.** The 88-entry and 3,410-line figures are from the split script's output; the GitHub behaviour is stated as diagnosis, and the decision says it was not run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the next production release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the next production release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed bundle changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates handled
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Nothing retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR and the entries return to `docs/decisions.md`. Decision files other streams add after this merges would need moving back by hand

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The next two PRs that each add a file under `docs/decisions/` both show MERGEABLE, not CONFLICTING. This follows from the diagnosis but only a real parallel pair proves it | GitHub PR pages |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: no screen; its one item is a GitHub PR-page observation that needs a future parallel pair, so nobody has looked yet

Manual verification by: n/a: nothing to look at in the app; item 1 above is left open for the next two PRs that add decision files

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed

Result: pass

Release manager acknowledgement: n/a: nothing deployed
