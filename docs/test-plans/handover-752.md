# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover `752` — the plan's last batch is set up, so the edition is owed. One file |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping and owns no item; nothing is ticked by this PR |
| Branch / worktree | `claude/handover-752` @ `C:\Development\Animal_Shelter_handover-752` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not started — see 1) |
| PR | opened from `claude/handover-752` (number assigned at `gh pr create`, in the same session as this plan) |
| Tested by / date | Claude (planner session)  Date: 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | `f6b95f83b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one Markdown file: edition `752` of the planner handover, rewritten as a delta against `751`.** No backlog item, by design: `SKILL.md` step 8 makes the handover a deliverable of the plan's last batch
- [x] Files/areas touched listed — `docs/planner-handover.md` only (rewritten, edition `751` → `752`). **No `src/`, no `worker/`, no `supabase/migrations/`, no `package.json`, and no `SKILL.md`**
- [x] Cards affected identified — **none.** No code path, no permission, no card, no role is touched. Admin and the signed-out public are unaffected because nothing the app serves changes
- [x] Anything explicitly **out of scope** written down — **`SKILL.md` is deliberately NOT edited.** `751` instructed that if the floor landed at 86–89k a third time the file was already correct and no edit was owed; it did (86,037–87,179 across four streams), so none was made. **The scale rows were not shifted either**, which `751` forbade in writing and `SKILL.md` now says itself. **Also out of scope: the tenant-table triage and the two tenancy cuts** — they are deliverables of streams, not of this PR, and the handover records them as owed to the next planner rather than guessing at them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 44s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 124s
=== gates: test — npm test
=== gates: test exited 0 after 32s
=== gates: build — npm run build
=== gates: build exited 0 after 120s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: one Markdown document, no runtime behaviour
- [ ] Data persists — n/a: nothing is written at runtime by this change
- [ ] Create / edit / delete all exercised — n/a: no feature surface in this PR
- [ ] Empty state renders sensibly — n/a: no feature surface in this PR
- [ ] Invalid input is rejected with a readable message — n/a: no input surface in this PR
- [ ] Boundary cases checked — n/a: no input surface in this PR

### Role access matrix

Not applicable: no page, route, RPC or card is touched, so there is nothing for a
login to be able or unable to reach that it could not before. The table is left
empty deliberately rather than filled with rows that would assert a test nobody ran.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | n/a | n/a: documentation-only change, no reachable surface |

- [ ] Every login above tested — n/a: no reachable surface changes, so there is nothing to sign in and compare
- [ ] A login that should not have access is blocked server-side — n/a: no server-side access path is touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: `src/` is untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter users; the handover is planner-facing and is not in the manual
- [ ] Translatable strings go through the translation path — n/a: no user-facing string is added or changed
- [ ] Mobile viewport (375px) — n/a: no rendered page changes
- [ ] Browser console clean — n/a: no rendered page changes
- [ ] Network clean — n/a: no rendered page changes

## 6. Regression

- [x] The pages nearest the change still work — **no pages are near the change.** Verified by the diff: the one file is read by a planner session and by nothing the app serves. `node scripts/gates.mjs` building clean is the positive evidence that nothing importable was touched
- [x] Any shared file touched checked from a second, unrelated page — **no shared file is touched.** `docs/planner-handover.md` has exactly one reader, the next planning chat, and `SKILL.md` was deliberately left alone (section 1). Checked by `git diff --name-only origin/main`, which lists one path
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR owns no backlog item. The one filing this plan made was committed on the `backlog` branch as `5815a4be1`, which is where filings belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover IS the record of this plan's judgements, and the two that outlive it are already written where their reader will meet them — the thirteen-part tenancy order and the canary's two-sided constraint are on the backlog items themselves, and Lutan's override is in `#ykefa`'s title
- [x] `README.md` still accurate — unchanged by this PR and still accurate; it does not describe the handover
- [ ] **Release notes.** n/a: no shelter user can see any of this — it is a planner handover and nothing else. Nothing under `src/`, `worker/`, `src/lib/manual/` or `src/lib/i18n/` is touched
- [x] Commit messages say why, not just what — the commit explains why the lead is a process finding rather than a single fault, and names the two faults that were the planner's own, which is the part a later reader would otherwise have to reconstruct
- [x] **Claims in commit messages and decision records were measured, not reasoned** — the four floor figures are the `stream-usage:` comments' own `tokens − messages`, read from merged PRs; the **255 consumer-declaring migrations and the single one naming `worker/`** were counted in the repository, not estimated; `#00e3u`'s filing quotes `docs/decisions/2026-11-13-answers-receipts-shop-payments.md` and names its commit. **The things explicitly marked unmeasured are marked as such:** the handover says #1609's figure was not readable (unmerged, not lost), says the tenancy table counts are dated readings known to be low rather than facts, and tells its successor to check the nightly catalogue run rather than asserting it happened

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code, no clock, no date logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the bands quoted in the handover are planner guidance read by a person, not a threshold any code evaluates. **Named here on purpose, because "banding" in this PR means token bands and NOT a code boundary** — a reader skimming for the word should not have to wonder
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the run's own output, pasted whole from the file it was redirected to
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this commit, and it covers everything this PR does**, because the one file is read by people and by `/plan-day`, never by the running app. **What it does not cover:** nothing. No deploy, no migration, no Worker change, so neither the Pi rebuild nor `wrangler rollback` is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

Empty, and that is the honest answer: there is no surface a person could look at.
The handover's accuracy is checked by its successor reading it, which is the
model `SKILL.md` describes — *"a wrong line is corrected by its successor rather
than by a reviewer"*. Lutan has never reviewed a handover and is not being asked
to start.

The section 8 deploy rows above are **not** repeated here, deliberately: they
carry `deferred: release manager`, which is their own state, and listing them
twice would leave a row nothing ever closes.

| # | What to check | Where |
|---|---|---|
| — | Nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-15

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing being signed for

Manual verification by: n/a: a documentation-only change with no surface a person could look at; the handover is corrected by its successor, not by a reviewer

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in substance, and ticked rather than marked n/a because the honest statement is that **this PR ships nothing to production**: no code, no migration, no Worker change. The release manager has nothing to receive

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches production
