# Test plan: restore-grants

---

## Header

| | |
|---|---|
| Feature | restore-grants |
| Backlog item | `docs/backlog.md` → #rg7pv (ticked here) |
| Branch / worktree | `claude/restore-grants` @ `C:\Development\Animal_Shelter_restore-grants` |
| Dev server | n/a: nothing served changed |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence: after a `--no-privileges` restore, `scripts/restore-grants.mjs` resets the backup's `public`/`private` objects to their built-in privileges and replays the backup's own, in one transaction, then proves the target matches the backup line for line; the rehearsal runs the same step as a check
- [x] Files/areas touched listed: `scripts/lib/restore-grants.mjs`, `scripts/restore-grants.mjs`, `scripts/restore-grants.test.mjs`, `scripts/restore-rehearsal.mjs`, `README.md` (Backups), `docs/uat-finalisation.md` (Part 2), `docs/backlog.md` (one tick), `docs/decisions/2026-11-09-restore-puts-back-the-backups-privileges.md`
- [x] Cards affected identified: none in code. UAT's database privileges were changed to production's (that is the fix applied, recorded in §4)
- [x] Anything explicitly **out of scope** written down: a restore into production itself; ownership (still `--no-owner`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: merged cleanly (brought in the test-purge merge), before the gates
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 69s
=== gates: lint exited 0 after 292s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 277s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; UAT's privileges before the run were saved as statements to the session scratchpad, the way back if it had been needed
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: rehearsal on the 2026-11-08 production backup, *privileges: all 903 of the backup's statements are back, none extra* (382 missing, 541 extra before the step), REHEARSAL PASSED; on UAT from a fresh production backup at the same migration, `--check-only` first (173 missing, 202 extra), then the run: *923 of the backup's privilege statements are on the target … MISSING none … EXTRA none … OK*
- [ ] Data persists — n/a: no rows are written; privileges only
- [ ] Create / edit / delete all exercised — n/a: no rows are written
- [x] Empty state renders sensibly: a backup with no privilege entries refuses with a reason; `--env` without `--confirm <ref>` refuses
- [x] Invalid input is rejected with a readable message, not a crash: a wrong `--confirm` refuses naming the project; an `.age` file without `--identity` refuses; the replay runs under `ON_ERROR_STOP` in one transaction, so a failure reports *rolled back; nothing changed*
- [x] Boundary cases checked: only objects the backup holds are reset (test); Supabase's own `supabase_admin` default privileges are compared, not replayed (UAT's 12 match the backup's 12); 11 unit tests pass

### Role access matrix

Privileges, measured on UAT after the run (rolled-back reads through the Management API).

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| a signed-in login (`authenticated`) | 163 public tables/views | all but the server-only tables | 156 read, 7 refused; the same 7 are refused on Test, revoked by `0168`, `0229`, `0232`, `0292` |
| the public website (`anon`) | 21 `public_*` views, `shelter_today()` | all readable | 21 of 21, function ok |
| a signed-in login | `database_health()` | refused, as production | refused |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side: `database_health()` and the 7 server-only tables refuse `authenticated`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport (375px) — n/a: no UI added
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: `uat.lannacare.org/` and `/login` 200 after the run; `/adopt` sends a signed-out visitor to sign in, as before
- [x] Any shared file touched checked from a second page: `restore-rehearsal.mjs`'s existing checks all still pass on the same backup (128 tables, 9,847 rows, 58 views, 193 functions, 330 policies, 214 triggers)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran after it

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch: `#rg7pv`, with what closed it
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-09-restore-puts-back-the-backups-privileges.md`
- [x] `README.md` still accurate: Backups restore recipe has the new step 4, and the rehearsal paragraph says it checks privileges
- [ ] **Release notes.** n/a: no shelter user sees a restore script
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: every figure above is a script's own output from this session

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the release this lands in
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the release this lands in
- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing that ships
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no banding
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: quoted lines are the scripts' own output, abridged to the line that matters
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable
- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deployed; UAT's prior privileges are saved, and reverting the code restores the old recipe

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A `--no-privileges` restore left ~890 revoked privileges re-granted and 26 missing (UAT, live) | fixed: UAT run, recipe changed |
| 2 | medium | First rehearsal left 3 extra default-privilege lines (`anon`) | fixed: reset clears `postgres`'s per-schema defaults |
| 3 | medium | A reset of every object would strip grants from objects newer than the backup | fixed: reset touches only the backup's objects |
| 4 | low | `.env.deploy.uat`'s database password no longer worked | fixed by Lutan (new password) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose: every check above was run from this session; the UAT app's signed-in reads were checked at the database.)

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no user-facing surface changed and the manual list is empty

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — n/a: a restore tool, used only in a disaster

Result: pass

Release manager acknowledgement: pending: at the release this lands in
