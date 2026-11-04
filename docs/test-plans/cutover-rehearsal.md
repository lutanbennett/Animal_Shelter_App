# Feature test plan: cutover-rehearsal

## Header

| | |
|---|---|
| Feature | The cutover to `lannacareforanimals.org`: pre-flight check, ordered runbook, UAT tunnel answer, unapplied production diff |
| Backlog item | `docs/backlog.md` → `#ki6cx` (NOT ticked: the cutover has not happened) |
| Branch / worktree | `claude/cutover-rehearsal` @ `C:\Development\Animal_Shelter_cutover-rehearsal` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | to be opened from this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | 594f6c0c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: it extends `check-site-hosts.mjs` with cutover pre-flight rules, adds the day's runbook to `docs/domain-checklist.md`, and records the UAT-tunnel answer and the unapplied production diff in a decision file.
- [x] Files/areas touched listed: `scripts/check-site-hosts.mjs`, `scripts/lib/site-hosts-problems.mjs`, `docs/domain-checklist.md`, `docs/decisions/2026-11-04-cutover-preflight.md`, this plan. No `src/`, no `worker/`, no `wrangler.jsonc`, no `cloudflared-config.yml`.
- [x] Cards affected identified: none. Nothing a login can do changes; admin and the signed-out public are unaffected.
- [x] Out of scope written down: the Supabase project move, the Drive copy, DNS, and any edit to production's hosts or routes (the diff is text in the decision file, not applied).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (reported "Already up to date" before the gates run)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`; the run's closing lines:

```
=== gates: typecheck exited 0 after 22s
=== gates: lint exited 0 after 257s
=== gates: test exited 0 after 22s
=== gates: build exited 0 after 127s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end: `timeout 60 node scripts/check-site-hosts.mjs` prints `all right`; it passes the real files and the complete cutover edit (wrangler plus tunnel).
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete — n/a: no UI or data
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected: five deliberately broken copies (missing `PUBLIC_HOST`, a route claimed by two environments, a route outside its environment, production moved but still locked, tunnel still presenting the old host to production) each make the check fail, and the check fails itself if any does not.
- [x] Boundary cases checked: test has no `www` route, so "routed" is required of `APP_HOST`/`PUBLIC_HOST` only (found by the first run failing, fixed).

### Role access matrix

No page, route or action changed.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no surface changed | n/a | n/a |
| signed out | n/a: no surface changed | n/a | n/a |

- [ ] Every login above tested — n/a: no surface changed
- [ ] A login that should not have access is blocked server-side — n/a: no surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `check-site-hosts.mjs` still performs its three original jobs (every environment sets both hosts, `httpHostHeader` is a configured address, `next.config.ts` takes `allowedOrigins` from the settings) and still prints `all right` on the real files.
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing.

## 7. Documentation

- [ ] Backlog item ticked — n/a: `#ki6cx` stays open on purpose, the cutover has not happened; the one clause struck was done on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-04-cutover-preflight.md`
- [x] `README.md` still accurate: the environments table is not changed by this PR; the decision file lists it for the cutover commit
- [ ] **Release notes.** n/a: the cutover has not happened; nothing a user can see changes in this PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: every host literal in section 2 of the decision file was found by grep and a read of the file; the UAT-tunnel answer rests on `"ORIGIN_HOST": ""` in the `uat` block and the Worker's comment that an empty value renders locally. Two things are written down as NOT established (whether `wrangler deploy` releases removed custom domains; whether the parking DNS records block custom-domain creation).

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: no code the Worker or the app runs changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code the Worker or the app runs changed
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds involved
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted evidence is the gates block above, which is a real run's output
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR is not deployed to production
- [ ] `strip-baked-env` seen — n/a: this PR is not deployed to production
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing deployed; revert the PR. It adds a check and documents, and changes no running configuration.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First version of the "routed" rule demanded a `www.` route on test, which has none; the check failed on the real file | fixed in the same branch before the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The runbook in `docs/domain-checklist.md` section E reads right to the person who will run it, especially step order 4 → 5 → 6 → 7 | Release manager / Lutan before Friday |
| 2 | Whether `wrangler deploy` of production releases `lannacare.org` custom domains, and whether the parking A/CNAME on the new zone block new routes | Cloudflare dashboard, cutover day |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; its two rows are for the cutover day and are carried by the pending signature below

Manual verification by: pending: the runbook read-through and the two Cloudflare behaviours above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file and accounts for each deliverable
- [ ] Handed to the production release manager — n/a: handed at the cutover, after merge

Result: pass

Release manager acknowledgement: pending: not yet acknowledged
