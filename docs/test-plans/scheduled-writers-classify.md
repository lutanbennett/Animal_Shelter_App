# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `#ukncl`: `check-scheduled-writers.mjs` reads functions a cron command names and classifies a delete-only one |
| Backlog item | `docs/backlog.md` → `#ukncl` (ticked) |
| Branch / worktree | `claude/scheduled-writers-classify` @ `C:\Development\Animal_Shelter_scheduled-writers-classify` |
| Dev server | n/a: a command-line instrument |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | bd680ff56 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: the checker finds a cron-named invoker function and calls a delete-only one `DELETES ONLY`, not `UNKNOWN`.
- [x] Files/areas touched listed: `scripts/check-scheduled-writers.mjs`, one decision, this plan, the backlog tick.
- [x] Cards affected identified: none; a read-only developer script.
- [x] Out of scope written down: migrations, `check-label-draft-cron.mjs`, the Pi (`#pirow`), following nested function calls.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` — the four-gate line is in the PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path, dev, `node scripts/check-scheduled-writers.mjs`:

```
  3 cron job(s); 92 function(s) read (security definer, trigger, or named by a cron command); 114 tables carry shelter_id.
  [DELETEONLY] purge-assistant-actions 17 3 * * * active=true
      calls purge_assistant_actions: only deletes from assistant_actions
  [DELETEONLY] purge-write-requests 29 3 * * * active=true
      calls purge_write_requests: only deletes from write_requests
  [SENDS] purge-donation-tax-ids 41 3 * * * active=true
      calls purge_donation_tax_ids: every insert (retention_runs) names shelter_id
```

- [x] Negative case: a throwaway invoker function using `EXECUTE`, scheduled as `zz-probe` on dev, then removed (dev read 92 functions and 3 jobs again afterwards):

```
  [UNKNOWN] zz-probe 0 0 1 1 * active=true
      calls zz_probe_dynamic: uses EXECUTE (dynamic SQL), cannot read the target
```

- [ ] Production run — pending: `--env production` is the planner's; this worktree has no `.env.deploy.production` ("is missing or empty"). Tried once, not retried.
- [ ] Create / edit / delete — n/a: no data surface
- [ ] Empty state — n/a: no UI
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases — n/a: none

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | n/a | no UI | n/a: command-line script |

- [ ] Every login above tested — n/a: no UI
- [ ] A login that should not have access is blocked server-side — n/a: no permission surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The other buckets are unchanged: the 4 `CANNOT BE DETERMINED` functions and the 11 `SENDS NO SHELTER` still print.
- [ ] Shared file checked from a second page — n/a: no shared file
- [x] Nothing merged from `main` during `sync` was broken (gates ran after the merge)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (`#ukncl`)
- [x] Decision added: `docs/decisions/2026-11-18-scheduled-writers-classify.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a developer instrument; nobody at the shelter sees this output
- [x] Commit messages say why, not just what
- [x] Claims were measured: both outputs above were run, not reasoned.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: a script, nothing deploys
- [ ] Smoke-tested on test — n/a: a script, nothing deploys
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: none touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line — n/a: no deploy
- [ ] `strip-baked-env` line — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: a script; revert the PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node scripts/check-scheduled-writers.mjs --env production` | a checkout with the production env |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: row 1 above

Manual verification by: pending: row 1, the production run

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release manager

Result: pass

Release manager acknowledgement: pending: release manager
