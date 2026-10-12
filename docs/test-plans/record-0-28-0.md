# Feature test plan — record-0-28-0

## Header

| | |
|---|---|
| Feature | The `0.28.0` release record (`docs/releases/2026-10-13.md`) and the rewritten `docs/release-handover.md` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-28-0` @ `C:\Development\Animal_Shelter_record-0-28-0` |
| Dev server | not started — this PR adds no code and no page |
| PR | PR_NUMBER |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.28.0` actually did, and rewrite the handover for whoever runs `0.29.0`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-13.md` (new), `docs/release-handover.md` (rewritten), and this plan. Markdown only: no route, no `worker/`, no migration, no shared lib, no code of any kind
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing in `docs/` is served by the app; these files are read by people in the repository
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the five defects the record names. Four are filed on the `backlog` branch or already there; none is fixed here, deliberately, because the release is already cut and deployed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, bringing the branch to `b5fd020d`, the release SHA
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 56s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 247s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 357s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's five are applied and recorded; the next free number is `0192`, which the handover states
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; both databases were read as a release step and the figures are quoted in the record
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev reads `192 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and nothing here reads or writes a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; the release's apply is history and is recorded

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour. Its "happy path" is a person reading two markdown files
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows, no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing | `docs/` is not served by the app; no role reaches these files through any URL | unchanged by this PR |

- [ ] Every role above tested — n/a: there is nothing for a role to reach. These files are read in the repository, not in the app
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release record is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; release records are English-only repository documents
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page is loaded by this PR
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: same reason

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — **the release this record describes is the regression check, and it was run against the deployed build**: `lannacare.org/api/version` and `test.lannacare.org/api/version` both answer `0.28.0` at `b5fd020d` with `x-lanna-served-by: pi`, and `/api/releases/current` answers `0.28.0` on both, so neither Worker is behind its Pi. Quoted in the record
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched; nothing in `src/` or `worker/` is changed by this PR
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought the branch from `863a0a75` to `b5fd020d` (the cut merge) and the gates were run after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release record closes no backlog item. The one follow-up this release found — `--drift` crashing — went on the `backlog` branch during the release, which is where follow-ups belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: this PR *is* the record of the decisions; the major-versus-minor call and the five defects are written up in it rather than in a separate decision file, as every previous release record has done
- [x] `README.md` still accurate — no README statement is about a release record or the handover
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody would notice. These are two markdown files in `docs/`, read by whoever runs the next release. No shelter user can reach them, and `unreleased` is deliberately left empty so the next release starts from zero
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — **this is the whole substance of the record and was the main thing attended to.** Every figure in it is quoted from the tool that produced it: the version endpoints, the migration counts, the drift comparisons, the deploy lines, the mail's own timestamp and subject read from the inbox, and the two Next.js version banners that found Defect 2. Where something could not be measured it says so — the apply's timing is recorded as not measured, because it ran in Lutan's terminal

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the branch is at the release SHA `b5fd020d`; this PR ships no build
- [x] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — read for the release this records: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (b5fd020d)`, quoted in the record

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — done as a release step, from the same commit; test Worker version `4a1fac1b-b329-41b3-aa12-79dd223a0fb2`
- [x] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — `/api/version` answers `0.28.0` at `b5fd020d` and `/api/releases/current` answers `0.28.0`, so the Pi and the Worker agree. **What was not done: anything behind sign-in**, which this session has no account for — recorded in the record's "What this record cannot say" and in Left for manual verification below
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: this PR derives no date. The release's own dates were checked: none of the five migrations touches a date column or a `shelter_today()` bound
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: not reachable. `PUBLIC_SITE` is `locked`, so an anonymous visitor gets the staff-testing gate instead of the public pages. A standing gap, named in the record

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — read from `deploy-0.28.0.log`: `dbkodyyxxhtygxcxmfcu (b5fd020d)`, which is production
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — `removed 11 env var(s)`, listed in the record
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a in effect: neither this PR nor the release adds a secret or an env var. The production bindings were printed by the deploy and read

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR; run twice for the release it records, clean both times, exit 0
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR. For the release: none of the five holds or rewrites a row, and three backups from 2026-10-12 exist — but see the record's Defect 4, the daily cron has not written one since 2026-10-11
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; the release's apply plan is history and is recorded

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — **for this PR there is nothing to roll back**: it changes two markdown files and no running system reads them. Reverting the commit is the whole of it. The release it describes rolls back with `./scripts/pi/deploy-pi.sh --ref 3c7632ca` on the Pi plus `npx wrangler rollback --env production`, which does **not** revert the five migrations (none has a down-migration) and **cannot unsend the release mail**, which has already gone

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up.

| # | What to check | Where |
|---|---|---|
| 1 | The record reads as a true account of what happened, to the person who ran the production deploy and the migration apply | `docs/releases/2026-10-13.md`, read by Lutan |
| 2 | The handover is usable cold by whoever runs `0.29.0` — in particular that the stale-`node_modules` trap is stated clearly enough to act on | `docs/release-handover.md`, read at the start of the next release |
| 3 | The `0.28.0` entry on `/releases`, and the new **Add photos** button and flow on a phone. Behind sign-in, so this session could not look, and it is the release's only user-facing change | `/releases` and the home screen, production, any signed-in role |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-13

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the three rows above — the record read back by Lutan, the handover read cold by whoever runs `0.29.0`, and the release's note read on a screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | None in this PR itself. The five defects of the release are in `docs/releases/2026-10-13.md`, where they belong — a record's own plan should not give them a second home that nothing closes | n/a |
