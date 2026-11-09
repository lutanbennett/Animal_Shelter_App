# Test plan: cutover-tidy

---

## Header

| | |
|---|---|
| Feature | cutover-tidy |
| Backlog item | `docs/backlog.md` → #w4k9n, parts (b), (c), (d), (e); (a) and (f) wait on Lutan, recorded on the `backlog` branch |
| Branch / worktree | `claude/cutover-tidy` @ `C:\Development\Animal_Shelter_cutover-tidy` |
| Dev server | n/a: nothing served changed |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence: production's address in the Pi setup script's health probe and in `docs/pi-hosting.md` becomes `lannacareforanimals.org`, the README's backup cron line matches the Pi's real one, and the release procedure's mail check reads the title for `[Production]`
- [x] Files/areas touched listed: `scripts/pi/setup.sh` (one argument), `docs/pi-hosting.md` (seven lines), `README.md` (one line), `docs/release-procedure.md` (one paragraph)
- [x] Cards affected identified: none
- [x] Anything explicitly **out of scope** written down: (a) the visitor tile's zone, which needs the analytics token widened first (measured: refused on the new zone); (f) Email Routing verification, which needs the recipients to click

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: merged cleanly before the gates, and again before the PR (the restore-grants merge)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 73s
=== gates: lint exited 0 after 164s
=== gates: test exited 0 after 35s
=== gates: build exited 0 after 148s
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
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: setup.sh's own probe run on the Pi with the new host, `Host: lannacareforanimals.org` plus the origin key against `127.0.0.1:3000` → `200`
- [ ] Data persists — n/a: nothing stored
- [ ] Create / edit / delete all exercised — n/a: nothing stored
- [x] Empty state renders sensibly: (c) re-run on the Pi: `lannacareforanimals.org` now resolves and `check-assets.mjs` says *identical to the build*
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [x] Boundary cases checked: the README cron line now equals the Pi's `crontab -l` line character for character; the tunnel config in the repo and on the Pi already said `lannacareforanimals.org`, so only the prose describing it changed

### Role access matrix

Nothing here is reachable by a login.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a: no access rule touched |

- [ ] Every login above tested — n/a: no access rule or page was added or changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule or page was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport (375px) — n/a: no UI added
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: production answers the probe on both hosts (`200`); nothing on the Pi was changed
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran after it

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch: none yet; `#w4k9n` stays open for (a) and (f), and its title says so on the `backlog` branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; text and one probe address brought in line with what is live
- [x] `README.md` still accurate: its cron line now matches the Pi's
- [ ] **Release notes.** n/a: no shelter user sees a setup script or a runbook
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: each change was checked against the Pi's live crontab, tunnel config and probe

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the release this lands in
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the release this lands in
- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing that ships
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no banding
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: quoted lines are the tools' own output, abridged
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable
- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deployed; reverting restores the old text

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The analytics token cannot read the production zone, so (a) cannot be switched yet | deferred: Lutan widens the token, then (a) is done |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose: every change was checked against the live Pi.)

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
- [ ] Handed to the production release manager — n/a: documents and a setup script only

Result: pass

Release manager acknowledgement: pending: at the release this lands in
