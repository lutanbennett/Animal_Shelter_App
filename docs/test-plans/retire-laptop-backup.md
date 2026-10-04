# Feature test plan

## Header

| | |
|---|---|
| Feature | Retire the laptop's weekly backup schedule, now the Pi's first scheduled run is confirmed |
| Backlog item | `docs/backlog.md` → **Confirm the Pi's first scheduled backup (Sunday 2026-10-04, 03:00 Thailand), then retire the laptop's.** |
| Branch / worktree | `claude/retire-laptop-backup` @ `C:\Development\Animal_Shelter_retire-laptop-backup` |
| Dev server | not started — documentation only |
| PR | (filled on push) |
| Tested by / date | Claude Opus 5 / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | (tip of this branch) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — README "Backups" item 4 now says the Pi's cron is the only schedule, and the backlog item is ticked with the evidence
- [x] Files/areas touched listed — `README.md` (the "Backups" section only) and `docs/backlog.md`. No code, no routes, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified — none. Nothing in the app changes for admin, management, staff, vet, volunteer or signed-out visitors
- [x] Anything explicitly **out of scope** written down — the operational acts themselves were done outside this PR and are recorded in the backlog tick: the laptop's scheduled task was unregistered, the laptop's `backup.log` truncated, the Drive trash emptied, the Pi re-checked. Also out of scope: the misfiled open item below `## Completed` (see Defects), and DB-2's restore rehearsal, which remains open

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (branch created from `origin/main` this session; nothing merged since)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — output pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 142s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only, no runtime behaviour
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete all exercised — n/a: documentation only
- [ ] Empty state renders sensibly — n/a: documentation only
- [ ] Invalid input is rejected with a readable message — n/a: documentation only
- [ ] Boundary cases checked — n/a: documentation only

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | unchanged | unchanged |
| management | — | unchanged | unchanged |
| staff | — | unchanged | unchanged |
| vet | — | unchanged | unchanged |
| volunteer | — | unchanged | unchanged |
| signed out | — | unchanged | unchanged |

- [ ] Every role above tested — n/a: no code path changes, so no role's access differs
- [ ] A role that should not have access is blocked server-side — n/a: no new surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the backup schedule; README does
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no pages changed
- [x] Any shared file touched checked from a second, unrelated page — `docs/backlog.md` is shared with every stream; checked by confirming the file still parses as the open-items convention expects (`awk` over `- [ ]` above `## Completed`), which found one pre-existing misfiled item (Defects)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; branch is a direct descendant of `origin/main`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with the evidence for each claim
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice was made here. The decisions behind it are already recorded — DB-1's encryption rollout and `docs/pi-hosting.md` "Backups on this Pi" — and the operational findings are written into the backlog tick rather than inventing a decision record for them
- [x] `README.md` still accurate — this is the change; "Backups" item 4 now matches reality
- [ ] **Release notes.** — n/a: a shelter user never saw the laptop's scheduled task, and the backup continues on the same weekly cadence with no visible difference
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every factual claim in the backlog tick was checked rather than inferred: the Drive listing, the Pi's local copy at 03:00 (`ls -l ~/backups/lannacare`), `Get-ScheduledTaskInfo` (LastRunTime 2026-10-04 03:00, result 0), the decrypt, and `pg_restore --list` for the TOC counts and the absent session rows. The UTC-versus-Thai reading of the filename (`2026-10-03T2000Z` = 03:00 ICT on the 4th) is arithmetic on UTC+7, and it is stated in the tick so the next reader is not confused by a file that looks a day old

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: documentation only; neither file is in the build
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only; nothing deployed changes
- [ ] Timezone-sensitive behaviour proved — n/a: no code. The one timezone claim made (the filename's `Z` suffix versus Thai local time) is stated in the backlog tick and is arithmetic, not behaviour
- [ ] Boundary or banding change covers both edges — n/a: no boundary logic changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the figures quoted in §7 are from the commands as run; nothing was retyped or tidied
- [ ] Public pages re-checked after a cache purge — n/a: no pages changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration. (Noted anyway: one does, confirmed today)
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the previous README wording and un-ticks the backlog item. It does **not** restore the laptop's scheduled task, which was unregistered outside git; re-registering it is `powershell -ExecutionPolicy Bypass -File scripts\backup-schedule.ps1`, and the script is deliberately kept in the repo for that. It also does not restore the truncated `backup.log` or the emptied Drive trash, both of which were deliberate and are not recoverable

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium (security) | The laptop's `backup.log` held live Drive links to the **unencrypted** production dumps of 21 and 26 September. DB-1's rollout truncated the Pi's log but the laptop's was missed | fixed 2026-10-04 — log truncated, Drive trash emptied by Lutan |
| 2 | Low (process) | One open item (`release-smoke-test.md` still says to commit the release record "on whatever branch is to hand") is filed **below** the `## Completed` heading, so the open-items convention skips it. Third occurrence of this class; three others were moved out on 2026-10-03 | deferred to backlog — belongs on the `backlog` branch, not in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty: the operational acts this PR documents were all carried out and their
output read before the text was written — the Drive listing and trash by Lutan,
the Pi checks by Lutan with the output pasted into chat and read here, and the
laptop-side task, log, decrypt and `pg_restore --list` run here directly.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: documentation of operational work already carried out and evidenced; this PR adds no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: linked from the PR body rather than pasted, as the file is on the branch
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: after merge
