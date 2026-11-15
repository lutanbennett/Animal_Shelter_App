# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover `751`, plus the two edits `750` left owed (`SKILL.md`'s floor row and a caveat in the report-photo retention decision file) |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping and owns no item; nothing is ticked by this PR |
| Branch / worktree | `claude/handover-751` @ `C:\Development\Animal_Shelter_handover-751` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not started — see 1) |
| PR | opened from `claude/handover-751` (number assigned at `gh pr create`, in the same session as this plan) |
| Tested by / date | Claude (planner session)  Date: 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | `e95fd4bdc` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **three Markdown files: edition `751` of the planner handover, `SKILL.md`'s floor row (with a new paragraph saying the scale rows were deliberately not shifted), and one caveat added to `docs/decisions/2026-11-14-report-photo-retention.md`.** No backlog item, by design: `SKILL.md` step 8 makes the handover a deliverable of the plan's last batch
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten, edition `750` → `751`), `.claude/skills/plan-day/SKILL.md` (one table row changed, one paragraph added), `docs/decisions/2026-11-14-report-photo-retention.md` (one bullet extended). **No `src/`, no `worker/`, no `supabase/migrations/`, no `package.json`**
- [x] Cards affected identified — **none.** No code path, no permission, no card, no role is touched. Admin and the signed-out public are unaffected because nothing the app serves changes
- [x] Anything explicitly **out of scope** written down — **the correction owed to `docs/decisions/2026-11-15-report-form-rate-limit.md` is NOT in this PR**: it is deliverable 5 of the `worker-rate-limit-binding` stream, which owns that file this batch. Putting it here as well would mean two branches editing one file. The release manager is not affected either way

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 39s
=== gates: lint exited 0 after 121s
=== gates: test exited 0 after 32s
=== gates: build exited 0 after 117s
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

- [ ] Happy path works end to end — n/a: three Markdown documents, no runtime behaviour
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
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter users; the handover and `SKILL.md` are planner-facing and are not in the manual
- [ ] Translatable strings go through the translation path — n/a: no user-facing string is added or changed
- [ ] Mobile viewport (375px) — n/a: no rendered page changes
- [ ] Browser console clean — n/a: no rendered page changes
- [ ] Network clean — n/a: no rendered page changes

## 6. Regression

- [x] The pages nearest the change still work — **no pages are near the change.** Verified by the diff: the three files are read by a planner session and by nothing the app serves. `node scripts/gates.mjs` building clean is the positive evidence that nothing importable was touched
- [x] Any shared file touched checked from a second, unrelated page — **`SKILL.md` is the one shared file, and its reader is `/plan-day`, not a page.** Checked by re-reading the edited band section in full after the edit: the floor row still parses as a table row, and the new paragraph sits above *"The questions that move a band, in order"* where a reader meets it before using the table
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR owns no backlog item, and the three findings it reports were filed on the `backlog` branch as `4ab881679`, which is where filings belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover IS the record of this plan's judgements, and the one judgement worth keeping beyond it (do not shift the scale rows with the floor row) is written into `SKILL.md` itself, where the next editor will meet it
- [x] `README.md` still accurate — unchanged by this PR and still accurate; it does not describe the handover or the band table
- [ ] **Release notes.** n/a: no shelter user can see any of this — a planner handover, a planning skill's band table and a caveat in a decision file. Nothing under `src/`, `worker/`, `src/lib/manual/` or `src/lib/i18n/` is touched
- [x] Commit messages say why, not just what — the commit explains the lead, and states why the scale rows were deliberately not shifted with the floor row, which is the part a later editor would otherwise undo
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the floor figures are the nine `stream-usage:` comments' own `tokens − messages`, read from the PRs; the `1/1 rules` reading is Lutan's own screenshot of the Cloudflare screen; `#w2knt`'s closure was read from the ticked item, not inferred. **The one thing explicitly marked unmeasured is marked as such:** the handover says it does not know whether the speed stream's mitigation will fire, and tells its successor to check

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code, no clock, no date logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the band table is planner guidance read by a person, not a threshold any code evaluates. **Named here on purpose, because "banding" in this PR means the handover's token bands and NOT a code boundary** — a reader skimming for the word should not have to wonder
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is the run's own output, pasted whole
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

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this commit, and it covers everything this PR does**, because all three files are read by people and by `/plan-day`, never by the running app. **What it does not cover:** nothing. No deploy, no migration, no Worker change, so neither the Pi rebuild nor `wrangler rollback` is involved

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
