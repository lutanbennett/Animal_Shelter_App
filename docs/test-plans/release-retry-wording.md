# Feature test plan

## Header

| | |
|---|---|
| Feature | Runbook documents `DNS-RETRY`; handover's stale retry window corrected; `--skip-build` recipe numbered and its broken `find` fixed |
| Backlog item | `docs/backlog.md` → `#rtwrd` (ticked on the `backlog` branch, where it was filed; not on `main` yet); `#dnsgp` noted, not ticked |
| Branch / worktree | `claude/release-retry-wording` @ `C:\Development\Animal_Shelter_release-retry-wording` |
| Dev server | not started: docs-only change |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | 1b29f0d1a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: documentation only, no card, page or app behaviour changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Files: `docs/release-procedure.md`, `docs/release-handover.md`, this plan. Out of scope: the retry's behaviour and constants (unchanged), the blackout's cause (Lutan's).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run it yourself and paste its closing lines **exactly as your run printed them**, in a fenced block under this line

```
=== gates: typecheck exited 0 after 86s
=== gates: lint exited 0 after 336s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 193s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: no app surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no app surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no app surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no app surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no app surface

Happy path, for a document: every figure in the new paragraph was read from `scripts/lib/dns-retry.mjs` (`DNS_RETRY_DELAYS_MS = [5000, 10000, 20000, 30000]`, `DNS_RETRY_MAX` = its length) and every quoted line from the `console` calls in `scripts/deploy.mjs` `wrangler()`; the not-retried list matches `scripts/dns-retry.test.mjs`. The fixed `find -printf '%TH:%TM %p\n'` was checked to be one line in the file.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: docs only |
| signed out | n/a | n/a | n/a: docs only |

- [ ] Every login above tested — n/a: documentation only, nothing to sign in to
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: documentation only

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: release runbook is not the user manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no app strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no app surface
- [ ] Browser console clean — no errors or React warnings — n/a: no app surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no app surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: the neighbouring runbook sections (Worker production, the token-expiry paragraph, the Pi deploy paragraph) read correctly around the insertions; `CLAUDE.md` and `docs/decisions/2026-11-28-test-and-uat-deploys-are-claudes.md` untouched by this stream (`git diff 9b12c8205 -- CLAUDE.md docs/decisions` empty).

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: `#rtwrd` was filed on the `backlog` branch and is not on `main`, so it was ticked there (commit 102204539)
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the placement choice is a docs layout call, recorded in the PR body
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a release-runbook change; no shelter user, Admin or product administrator sees anything appear, move or disappear
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: documentation only, nothing deploys
- [ ] Deployed SHA matches the tested SHA — n/a: documentation only, nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: documentation only, nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: retry window unchanged; only described
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates block, pasted from the run
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: nothing deploys
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — n/a: documentation only; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Runbook `--skip-build` recipe's `find -printf` had a literal line break where `\n` belonged, so the command as written was broken | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: documentation, checked against the code it describes | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: documentation only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is linked from the PR body as a committed file
- [ ] Handed to the production release manager — n/a: docs only, nothing ships to production

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing deploys
