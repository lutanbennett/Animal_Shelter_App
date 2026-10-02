# Feature test plan — pi-failover-paper

Filled from `docs/test-plan-template.md`. A document, no code changed. The paper
is **proposed, not agreed**, and **no outage drill has been run**: every timing in
it is marked "unmeasured". The checks below are about whether the paper's claims
are true of the code and whether its drill is runnable, not about the Pi.

---

## Header

| | |
|---|---|
| Feature | `docs/pi-failover.md`: a plain-English options paper on what happens to a save when the Pi goes down, with a drill Lutan can run alone |
| Backlog item | `docs/backlog.md` → Rethink Pi failover: today a power cut still refuses writes |
| Branch / worktree | `claude/pi-failover-paper` @ `C:\Development\Animal_Shelter_pi-failover-paper` |
| Dev server | not used: a document |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: a paper that sets out the four outage cases, five options and a proposed recommendation, with a copy-paste drill, which is the first half of the item ("options paper, then build")
- [x] Files touched: `docs/pi-failover.md`, this plan, and a status line on the item in `docs/backlog.md`
- [ ] Roles affected identified — n/a: no app code; no role's request takes a different route
- [x] Out of scope, written down: the build (option 1 needs its own schema PR, migration `0131` is being kept free for it), every measurement (they need hands on the Pi), and `docs/decisions/2026-10-02-pi-failover.md`, which is not written because Lutan has not agreed the recommendation

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; it printed "Already up to date."
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the first push of PR #310 is not green by construction; ticked in a follow-up once the run has actually gone green

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] The paper's claims about current behaviour were checked against the code, not recalled: `worker/origin.mjs` (530 is the only status that lets a write fall back; 502/503/504/521/522/523 and a thrown fetch are refused for a write; reads time out at 20 s and a write has **no** time limit, which corrected a "20 s" the first draft carried over from the backlog), `wrangler.jsonc` (no KV or Durable Object bound; a `*/15` cron on test and production), `docs/decisions/2026-10-02-pi-down-alert.md` (the alert is a 15-minute cron needing two red runs, so it is not a heartbeat), `scripts/pi/cloudflared-config.yml` (test and production share one tunnel)
- [ ] Data persists — n/a: no records
- [ ] Create / edit / delete exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no code

**The drill's timer was run, three iterations, against the test site on 2026-10-03.** It posts to a page that does not exist, so nothing is saved. Output as printed:

```
00:04:39 307 0.283145s served-by=pi
00:04:42 307 1.387489s served-by=pi
00:04:45 307 0.218286s served-by=pi
```

It proves the loop runs, the header is read and `served-by` shows `pi` in the healthy state. It does **not** prove what the line says during an outage; that is what the drill is for. The `kill -STOP` wedge, the `systemctl` commands and the router/plug cases were **not run**.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: no app code
- [ ] A role that should not have access is blocked server-side — n/a: no endpoint

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: a design paper, not a feature a user operates
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing but a document was added
- [ ] Shared file checked from a second page — n/a: no shared file touched except one line of `docs/backlog.md`
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (already up to date), and the build exited 0

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; the item ends "then build" and a paper is not the build. A status line naming the PR and what remains was added instead
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: nothing is decided. A decision file recording an agreement that did not happen would be the failure this checklist exists to prevent; it is written once Lutan agrees
- [x] `README.md` still accurate — it does not describe failover behaviour
- [ ] **Release notes.** n/a: a document only, nothing ships to a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned **where the paper makes them as facts**: the Worker's behaviour is read from the code, and the three-iteration timer output is above. **Everything the paper reasons rather than measures is labelled as such in the paper itself**: the timing of every outage, whether saving fits the Worker's CPU limit, and the Workers KV free-plan write limit, which is recalled and flagged "check before choosing". The cross-build form failure is **another session's measurement, reported in a message and credited as such in the paper, not re-run here**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: no code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code changed; the site was only probed by the timer above
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no thresholds changed
- [ ] Evidence pasted is unedited tool output — n/a: the only pasted output is the gate line and the three timer lines, both copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It adds two documents and one line to the backlog; nothing reads them, and nothing in the Worker, the Pi or the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first draft of the paper said a write fails after "20 s". The Worker sets no time limit on a write; the 20 s is for reads only | fixed: corrected before the first commit was pushed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Read the paper and answer its two questions:** is a small refused window acceptable, and should the drills run first. Until then no decision file is written | Lutan |
| 2 | **Run the drill** (section "Running the drill") for the five cases and fill in the results table. It uses test, but stopping `cloudflared` or pulling the plug also takes production's Pi away, so pick a quiet moment | The Pi |
| 3 | **Does the paper read as clear English** to someone with no context, which is the point of it | Lutan |
| 4 | **Option 5 stays on hold on CPU.** The form-key question was answered by `server-actions-encryption-key` on 2026-10-03 (fails with different keys, works with a shared one; plain Node builds, **not reproduced here** and the Worker's own build not yet checked). Still open: whether saving fits the Worker's CPU limit | that stream, then a CPU measurement |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see `pending:` below

Manual verification by: pending: Lutan, reading the paper, agreeing or changing the recommendation, and running the drill

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body (#310) summarises the plan and names its file rather than pasting it, since every line but the gate output is `n/a`
- [ ] Handed to the production release manager — n/a: nothing here ships; the paper is not deployed and no decision is made yet

Result: pass

Release manager acknowledgement: pending
