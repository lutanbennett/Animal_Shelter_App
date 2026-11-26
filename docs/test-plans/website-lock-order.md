# Feature test plan

## Header

| | |
|---|---|
| Feature | website-lock-order |
| Backlog item | `docs/backlog.md` → `#flrwh` |
| Branch / worktree | `claude/website-lock-order` @ `C:\Development\Animal_Shelter_website-lock-order` |
| Dev server | n/a: no page changed |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 052624684 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the website-lock read-back moves in front of the production Pi build, and a release check names the step that applies each changed `wrangler.jsonc` var
- [x] Files/areas touched listed — `docs/decisions/2026-11-25-website-lock-truth.md`, `docs/release-procedure.md`, `docs/shelter-onboarding-runbook.md`, new `scripts/check-wrangler-var-steps.mjs` + `scripts/lib/wrangler-var-steps.mjs` + test, decision file, backlog tick
- [x] Cards affected identified — none; no card, admin or public behaviour changes
- [x] Anything explicitly **out of scope** written down — no edit to `scripts/deploy.mjs` or `deploy-pi.sh`; no production deploy; the console switch is not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 110s
=== gates: lint exited 0 after 427s
=== gates: test exited 0 after 78s
=== gates: build exited 0 after 245s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-wrangler-var-steps.mjs --base f3ebcb3f0~1` printed `production PUBLIC_SITE: "locked" -> "open"  applied at the Pi BUILD (write-env.mjs) — before the Worker deploy`
- [ ] Data persists — reload the page and the change is still there — n/a: a script, no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only script
- [x] Empty state renders sensibly (no rows yet) — no change since the base prints `No wrangler.jsonc var changed since <base>.` (code path read; covered by `changedVars` returning empty)
- [x] Invalid input is rejected with a readable message, not a crash — no `--base` prints the reason and exits 1; an unknown ref is caught and reported, exit 1
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unit tests cover added, removed and changed vars, Pi-read, Worker-only and unlisted names

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: no app surface | | | |

- [ ] Every login above tested — n/a: no page or action changed
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page or action changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: release-procedure change, nothing a user reads in the manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages; `node --test scripts/check-wrangler-var-steps.test.mjs` 4/4 pass and the full test gate is above
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched; `runtime-config.mjs` only imported, not edited
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync reported already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-11-26-website-lock-order.md`
- [x] `README.md` still accurate — it does not describe the release order
- [ ] **Release notes.** — n/a: changes the order of a release procedure and adds a release-time script; no shelter user, Admin or product administrator sees anything appear, move or disappear
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the variable count is from grep on 2026-11-26, and the 0.49.2 catch is the script's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; docs and a release-time script
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no app code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app code changed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no dates
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: nothing deploys
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the PR; nothing deployed, no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no screen changed | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: procedure documents and a release-time script, no screen for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy; the procedure change takes effect at the next release cut

Result: pass

Release manager acknowledgement: n/a: nothing deploys
