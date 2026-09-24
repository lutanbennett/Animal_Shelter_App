# Feature test plan — test-plan-red-when-broken

## Header

| | |
|---|---|
| Feature | `test-plan` goes red only when the plan is actually wrong: the checker exits 0 for a correct-but-unsigned plan, so `continue-on-error: true` can come off the CI job. Plus the release record for 2026-09-24 |
| Backlog item | `docs/backlog.md` → Architecture → the `test-plan` promotion item covers the surrounding ground; this PR is not that item and does not tick it (promotion to a required check is still the user's call) |
| Branch / worktree | `claude/test-plan-red-when-broken` @ `C:\Development\Animal_Shelter_test-plan-red-when-broken` |
| Dev server | not started — no runtime surface; the change is to a CI script, a workflow and docs |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `2b706f5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan chose option **A** in chat: move the pass/fail distinction into the checker rather than suppressing the job
- [x] Files/areas touched listed — `scripts/check-test-plan.mjs` (exit code for the awaiting-only case), `.github/workflows/ci.yml` (remove `continue-on-error`), `docs/test-plan-template.md` and `CLAUDE.md` (wording this change makes false), `docs/releases/2026-09-24.md` (new). No `src/`, no `worker/`, no migrations
- [x] Roles affected identified — **none** in the app. This changes what CI reports to whoever opens a PR; no route, query or policy is touched
- [x] Anything explicitly **out of scope** written down — (a) making `test-plan` a **required** check in branch protection, which stays the user's call; (b) the CRLF and dry-run findings, which belong in README and CLAUDE.md's migrations section respectively and should not ride on this; (c) the `docs/releases/<date>.md` naming collision, recorded as a finding in the record itself rather than fixed here

**Why the obvious change was the wrong one.** I first proposed simply deleting `continue-on-error: true`, and Lutan approved that, before I had read the comment above it. That comment records a real reason for the suppression: a correct plan is unsigned for most of its life, and with several sessions pushing, the workflow failed every few minutes — a red people are emailed about hourly is one they filter. Deleting the line alone would have restored that noise. Suppressing the job, though, also hid genuinely broken plans. Option A gets both: the script distinguishes the two cases, so red is rare and always actionable.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a-adjacent but honest: the worktree was created from `origin/main` at `2b706f5` immediately before this work and is 0 commits behind. No sync was needed
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`, in 143s
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported. **Note this PR changes what the `test-plan` job does**, so its own CI run is the first real exercise of the new behaviour: `check` should pass and `test-plan` should pass despite this plan's `pending:` signature

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration. Production is at 76 applied, 0 pending
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — a correct-but-unsigned plan now exits **0** and still prints `1 item(s) await a person` plus what is outstanding. Verified against a real plan (a copy of `cut-release-0-2-1.md` with its signature replaced by `pending:`)
- [x] Data persists — n/a-adjacent: nothing is stored. The equivalent check is that the *printed* output still names the outstanding item, which it does — the information is not lost along with the exit code
- [x] Create / edit / delete all exercised — the three outcomes the script can reach were all exercised: **ok** (signed plan), **awaiting** (exit 0, new behaviour), **problem** (exit 1, unchanged)
- [x] Empty state renders sensibly — with the probe plan removed and no plan of its own, the checker said `no completed test plan in this PR` and exited 1, which is correct and is what it would say to a PR that forgot one
- [x] Invalid input is rejected with a readable message — a plan with an unticked line and no `n/a:` reason still fails, naming the file, line number and the offending text
- [x] Boundary cases checked — the case that matters is **problems *and* awaiting together**: that path is untouched and still exits 1, so an unsigned plan cannot mask a real defect. Confirmed in probe B, whose output was `1 problem(s), and 1 item(s) awaiting a person`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | no change | no change |
| management | nothing changed | no change | no change |
| staff | nothing changed | no change | no change |
| vet | nothing changed | no change | no change |
| volunteer | nothing changed | no change | no change |
| signed out | nothing changed | no change | no change |

- [ ] Every role above tested — n/a: no route, query or RLS policy changed. The audience for this change is whoever opens a PR, not any signed-in role
- [ ] A role that should not have access is blocked server-side — n/a: no new surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter staff; this is developer tooling
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings. The script's output is developer-facing English
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no pages to load

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route at `2b706f5`; nothing in `src/` is touched
- [x] Any shared file touched checked from a second, unrelated page — `check-test-plan.mjs` is shared by every PR and by CI. Checked it against **all 24 existing plans on `main`**: with the probe removed it behaves as before on them, and the three-outcome probe confirmed each branch
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 commits behind `2b706f5`, which CI had already passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: the Architecture item this touches is about promoting `test-plan` to a **required** check, which this PR deliberately does not do. Ticking it would claim the promotion happened
- [ ] **Release notes.** — n/a: no shelter user would notice. This changes what CI reports on a pull request and adds a release record; there is no route, screen or behaviour a staff member, volunteer or visitor can reach
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a as a separate entry, and deliberately so: the reasoning is long and belongs where someone will hit it, so it is written into the `ci.yml` comment and the CLAUDE.md bullet instead. Both say **not** to reintroduce `continue-on-error` and **not** to make the script fail on an unsigned plan, which is the specific mistake a future reader would otherwise make
- [x] `README.md` still accurate — unaffected; it does not describe the CI jobs
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `2b706f5`, the tip of `main`, 0 behind, CI green on it
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy. CI scripts and docs ship no runtime code

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime change. Both environments are on `0.2.1` from `2b706f5` and this PR does not alter what they serve
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed by this PR
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed. Note the record added by this PR flags that the cache check has **never** been done, which is a real outstanding gap but not one this PR creates or closes

### Deploy safety

- [ ] `deploy: ... → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR. Nothing to roll back at runtime: no Worker version, no schema, no data, and no deploy. Reverting restores `continue-on-error: true` and the old exit code together, which is the correct pairing — reverting only half would either restore the noise or restore the blind spot. What a revert does **not** undo: nothing, since nothing was deployed or sent

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | `test-plan` reported **green on a genuinely broken checklist**, because the job carried `continue-on-error: true`. Every "test-plan is red, correctly" said during the 0.1.0–0.2.1 releases was true of the script's own output, read by hand, and not of the GitHub check — which was green throughout | fixed by this PR — the script now distinguishes broken from unsigned, so the suppression is unnecessary and is removed |
| 2 | medium | My first proposal was to delete `continue-on-error: true` and nothing else, and it was approved before I had read the comment explaining why it was added. That would have restored a near-permanent red and the alarm fatigue it caused | caught before implementing — raised in chat, Lutan chose option A instead. Recorded here because the near miss is the useful part: the line looked like a mistake and was a considered trade-off |
| 3 | low | `docs/releases/<date>.md` assumes one release per day; three shipped on 2026-09-24, so the record is a day's log rather than a release's | accepted and recorded as a finding inside the record; the fix is either a version in the filename or an explicit day-log convention, and it is the test manager's file to shape |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That red-only-when-broken is the trade-off you want. It makes red rare, which is the point — but it only works if a red then gets acted on rather than assumed to be the usual unsigned-plan noise. That habit is the thing this change depends on and the thing I cannot test | `.github/workflows/ci.yml`, `scripts/check-test-plan.mjs` |
| 2 | The browser items the release record lists as **not done** — the Dev badge and palette, both sign-in paths, and `x-lanna-cache: HIT` on a second load. The cache one matters most: it has never been verified across three releases, and the edge cache is what keeps public pages off the CPU-limited render path while `ORIGIN_HOST` is empty | `docs/releases/2026-09-24.md`, and a browser on `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — item 1 confirmed by Lutan in chat, 2026-09-24, recorded at his request. Item 2 is **not** done and is not claimed to be; it stays outstanding in the release record

Manual verification by: Lutan Bennett — confirmed the red-only-when-broken trade-off by choosing option A in chat and instructing this merge; line written by Claude at his request. **Item 2 remains undone**: the browser checks (Dev badge, both sign-in paths, x-lanna-cache HIT) have still not been run by anyone, and stay recorded as outstanding in docs/releases/2026-09-24.md rather than resolved here  Date: 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
