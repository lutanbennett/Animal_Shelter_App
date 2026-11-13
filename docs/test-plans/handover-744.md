# Feature test plan — handover-744

## Header

| | |
|---|---|
| Feature | Planner handover edition `744`: a delta against `743` that corrects its `attachment_owner_type` claim, reports the third 2026-11-12 plan's figures, and carries the day's two incidents |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping and closes no item |
| Branch / worktree | `claude/handover-744` @ `C:\Development\Animal_Shelter_handover-744` |
| Dev server | not started — docs only |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | `334bcc4bb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one file, `docs/planner-handover.md`, rewritten as edition `744`
- [x] Files/areas touched listed — `docs/planner-handover.md` and this plan only
- [x] Cards affected identified — none; no login, card or activity is touched
- [x] Anything explicitly **out of scope** written down — no `docs/release-handover.md` (the release manager's), no backlog edits, no `src/`, `scripts/`, `worker/` or `supabase/` changes, and no change to `.plan-day.md`, which is gitignored and stays so

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `origin/main` minutes before the commit; the closing sync is run before merge
- [x] `node scripts/gates.mjs`, closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 48s
=== gates: lint exited 0 after 142s
=== gates: test exited 0 after 33s
=== gates: build exited 0 after 155s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, a document read by one chat
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a: docs only |
| signed out | nothing changed | unchanged | n/a: docs only |

- [ ] Every login above tested — n/a: docs only, no access rule touched
- [ ] A login that should not have access is blocked server-side — n/a: docs only

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: the shelter manual is for shelter users; a planner handover is not in it
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates passed on a tree containing only this change

## 7. Documentation

- [ ] Backlog item ticked — n/a: a handover closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover IS the record, and a decision file about writing one would be bookkeeping about bookkeeping
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** n/a: a planner handover; no shelter user would notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — see the two verification lines below

### Verification specific to this edition

- [x] **The correction to `743` was read from the files, not reasoned.** `743` lines 32–33 assert `0188_bills_owner_types.sql` adds *"no `general_bill`"*. Checked: `supabase/migrations/0304_bills_owner_types_sites.sql` adds `general_bill` **and** `utility_bill`; `src/lib/bills/upload.ts:18,39` carries the type and asks `bills.general`; `src/app/bills/general/page.tsx:95` renders the gallery
- [x] **Every figure in the figures table was read from a merged PR's `stream-usage:` comment**, with `gh pr view <n> --json comments`, not from a live process and not from memory
- [x] **The one claim taken from a stream's own report was re-measured before it was published.** The edition says the refusal meter reads **0 person-read English messages** and that `#3nuwy` is ticked. Both were asserted by the stream; both were then run and read independently — `node scripts/measure-sql-refusals.mjs` printed *"of the person-read (user + forwarded-and-masked), 0 messages are still English"* (28 functions, 89 keyed messages), and the item's box is `- [x]`. **Checked precisely because this edition's lead is a handover claim that nobody re-measured**
- [x] **Each of `743`'s seven owed items is answered or explicitly superseded**, and each answer names what closed it
- [x] **The edition says which plan's figures it reports**, and says plainly that its own plan's twelve belong to `745` — so a missing set is not read as a lost one
- [x] **Nothing is asserted that was not established.** The one observation that is not established — brief length possibly moving the floor — is labelled **NOT ESTABLISHED** with the counter-example that weakens it
- [x] **Length against the ~150-line target — measured, not hidden.** This edition is **244 lines**; `743` was **224**. **The target has now been exceeded twice running, so either it is wrong or it is being ignored**, and the edition itself asks the next one to settle which. **Ticked rather than left pending** because the check is whether the length was measured and recorded, which it was: a `pending:` here would wait on nobody, since a handover has no release-manager pass to resolve it.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — n/a: nothing deploys; the SHA is in the header
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: docs only, nothing deploys
- [ ] Smoke-tested on test — n/a: docs only, nothing deploys
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date; the dates in the document are stated, not computed
- [ ] **Boundary or banding change** — n/a: the bands quoted are a report of measurements, not a change to the bands table
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code reading it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a document; revert the commit, no database, Worker or app effect. A wrong line is corrected by the next edition rather than rolled back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `743` asserted `attachment_owner_type` holds no `general_bill`; `0304` adds it. A stream was briefed on the false premise and spent a worktree, a brief and a session before step zero stopped it | fixed — corrected as this edition's lead, with the mechanism that caused it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — documents only, and no line of it is visible to a shelter user | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: documents only

Manual verification by: n/a: nothing to look at, a process document read by one chat

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the plan
- [ ] Handed to the production release manager — n/a: docs only, nothing deploys

Result: pass

Release manager acknowledgement: n/a: not a release
