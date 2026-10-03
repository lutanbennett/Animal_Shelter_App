# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The status alert run counts a Pi that is not answering as red, so the existing mail-once / mail-on-recovery path fires for it, with what to check in the body |
| Backlog item | `docs/backlog.md` → Next up: the Pi is a single point of failure, piece (b); the item stays open for (c) and the `ORIGIN_HOST` lever |
| Branch / worktree | `claude/pi-down-alert` @ `C:\Development\Animal_Shelter_pi-down-alert` |
| Dev server | `next dev -p 3008` with `ORIGIN_HOST` set to a dead address, then empty |
| PR | linked from the PR itself |
| Tested by / date | Claude (pi-down-alert session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches piece (b): the alert run treats `origin` `warn` as red (page tile unchanged) and the Pi mail carries advice
- [x] Files/areas touched: `src/lib/status/alerts.ts`, `docs/backlog.md`, `docs/decisions/2026-10-02-pi-down-alert.md`, this plan. Nothing under `worker/`, `supabase/` or `wrangler.jsonc`
- [x] Roles affected: admins receive the mail; no one else sees anything
- [x] Out of scope: (c) the weekly backup, the `ORIGIN_HOST=""` lever, a faster interval for the Pi alone

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (it brought the 0.15.0 release cut: `package.json`, `src/lib/releases.ts`, its test plan)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run after that merge. Closing lines as printed:

```
=== gates: build exited 0 after 336s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the run writes `state = 'warn'` for origin, already allowed by 0098's check
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Drove the real `POST /api/status/alerts` (what the cron calls) against the dev database on a local server, `ORIGIN_HOST=127.0.0.1:9` (nothing listens). Dev mail is written to the server log and counted as sent.

- [x] Happy path, **fire**: run 1 `failing:["origin"]`, no mail; run 2 `failed:["origin"]`, mail to the four dev admins, subject `Not working: Pi origin`, body with the error line and the advice. **Recover**: server restarted with `ORIGIN_HOST` empty, run 1 `recovered:["origin"]`, mail `Working again: Pi origin (last error: …)`
- [x] Data persists — `status_alert_checks` carried the fail count and `alerted_at` across runs and across the server restart (run 2 mailed because run 1 was remembered; recovery found `alerted_at` after the restart)
- [ ] Create / edit / delete — n/a: no user-facing data
- [ ] Empty state — n/a: no UI
- [x] Alert once: after the fire, run 3 and run 4 (both still red) returned `failed:[]`, `sent:[]`; after recovery, the next run was quiet too
- [x] Boundary: one red run (run 1) mails nothing, two do; a check that was never alerted does not send a recovery

### Role access matrix

n/a for every role: no page, route or permission changed. The endpoint is still Bearer-authenticated with the service-role key (unchanged).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a |
| management | n/a | n/a | n/a |
| staff | n/a | n/a | n/a |
| vet | n/a | n/a | n/a |
| volunteer | n/a | n/a | n/a |
| signed out | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no role-specific behaviour
- [ ] A role that should not have access is blocked server-side — n/a: no access rules touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: mail goes to admins and the System status topic is unchanged; the tile still reads amber
- [ ] Translatable strings — n/a: the mail is English and sent to admins, as the existing alert mail is
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Other checks still alert as before: `isRed` is `fail` for every key but `origin`; the recovery run on the restarted server showed the other six checks not failing and not mailing. The simulated-failure path (`STATUS_ALERT_SIMULATE_FAIL`) sets `fail` and so still counts
- [ ] Shared file loaded from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken: see the gates above

## 7. Documentation

- [ ] Backlog item ticked — n/a: only (b) of three pieces is done; a status line was added and the item stays open
- [x] Design choices in `docs/decisions/2026-10-02-pi-down-alert.md`
- [ ] `README.md` still accurate — n/a: not touched, nothing it describes changed
- [ ] **Release notes.** n/a: the mail goes to the admins, not shelter users, and nothing on any page changed
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned.** The fire/quiet/recover sequence was observed on a running server; the 15-30 minute latency is arithmetic from the cron and the threshold, and the decision says what a sub-15-minute outage does. That a real Pi outage turns the probe red is reasoned from `checkOrigin()`'s code and today's 530/timeout evidence; it was not watched on the real tunnel

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager (it cannot prove this: the Pi serves test too)
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions cover both sides — n/a: covered in section 4
- [ ] Evidence is the tool's actual output — n/a: no output pasted
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback: revert the PR and redeploy (`./scripts/pi/deploy-pi.sh --ref <sha>` for the Pi, `npx wrangler rollback --env <env>` for the Worker, which is where the cron runs); no migration involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A Pi outage shorter than about 15 minutes may never mail, and one outage mails once from test and once from production (same Pi) | accepted: recorded in the decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The real thing: with this deployed, stop `cloudflared` (or unplug the Pi) for over 30 minutes and confirm one mail arrives with the advice, and one when it is back | the Pi, admin inbox |
| 2 | The mail wording reads usefully to the person who gets it | decision file / `ADVICE` in `alerts.ts` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (pi-down-alert session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1 and 2 above are outstanding and nobody has looked

Manual verification by: pending: Lutan to run the real outage drill after deploy and read the mail wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR not opened yet
- [ ] Handed to the production release manager — n/a: not yet

Result: pass
