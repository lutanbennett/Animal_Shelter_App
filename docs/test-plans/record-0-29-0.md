# Feature test plan — record-0-29-0

## Header

| | |
|---|---|
| Feature | The `0.29.0` release record: a `## 0.29.0` section appended to `docs/releases/2026-10-13.md`, and `docs/release-handover.md` rewritten for whoever runs `0.30.0` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-29-0` @ `C:\Development\Animal_Shelter_record-0-29-0` |
| Dev server | not started — this PR changes two documentation files and no code |
| PR | #593 |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.29.0` actually did, as a second section in that day's release file, and rewrite the handover so the next release manager reads what is true now rather than what was true before `0.29.0`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-13.md` (appended to) and `docs/release-handover.md` (rewritten), plus this plan. No code, no route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Neither file is served by the app or bundled into the Worker; they are read in the repository by whoever runs the next release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the release itself, which is already deployed and verified. **This PR is a record, not a gate**, and it must not be presented as one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 67s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 119s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 148s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a` on the first push and tick it in a follow-up commit once the run is actually green — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's two (`0192`, `0193`) merged in their own PRs and were applied to production during the release; the next free number is `0194`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed during the release and recorded in the record — production `194 applied, 0 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run twice against production during the release, both files `ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev is `194 applied, 0 pending` with `No drift: test matches origin/main.`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: this PR touches no database object and no row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; the release's apply is already done and recorded

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface and no code path. Its "happy path" is a person reading two Markdown files, which is section 6's regression check instead
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list and no rows in this PR
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; every date in both files is a fixed written string

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | Neither file is served by the app | unchanged — no route, no bundle |
| management | nothing | as above | unchanged |
| second_in_command | nothing | as above | unchanged |
| head_of_maintenance | nothing | as above | unchanged |
| head_of_medical | nothing | as above | unchanged |
| doctor | nothing | as above | unchanged |
| volunteer | nothing | as above | unchanged |
| signed out | nothing | as above | unchanged |

- [ ] Every role above tested — n/a: no role can reach either file; they are repository documentation, not app content
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release record is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; both files are English-only repository documentation
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change and no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: no browser surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no browser surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — not pages but documents, and both were read back after writing: `docs/releases/2026-10-13.md` now holds **two** release sections (`## 0.28.0` at line 3 and `## 0.29.0` at line 334) with the `0.28.0` text unmodified, and `docs/release-handover.md` was rewritten whole and reads as a standalone briefing with no reference to a `0.28.0`-era state as though it were current
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — no shared file touched. `check-test-plan.mjs` was run against this plan and `gates.mjs` over the whole tree, which is the only runtime either file has
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was created from `origin/main` and `sync` merged the cut (`9cb36eea`) in cleanly; the only conflict risk, `docs/release-handover.md`, is rewritten whole by this PR by design

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release record closes no backlog item. One follow-up was noticed and belongs on the `backlog` branch, not here: `release-procedure.md` §7 still says `--drift dev`, and `dev` is not an environment the runner accepts
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no new design choice. Everything this PR records was decided earlier and already has its own decision file — the merge-without-asking rule (2026-10-13) and the duplicate-`0191` ruling (2026-10-13)
- [x] `README.md` still accurate — no README statement is about release records or the handover
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody at the shelter can see either file. They are repository documentation for whoever runs the next release, and `unreleased` is deliberately left empty at `[]` so the next cut starts clean
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — **this plan's whole subject is prose, so this line carries more weight here than anywhere else.** Every figure in the record is copied from the tool that printed it: the version IDs and the four deploy lines from the deploy logs, the migration counts and both `No drift` lines from `apply-migrations.mjs`, the gate timings from `gates.mjs`, the backup's name and byte count from `ls` and `backup.log` on the Pi, and the mail's timestamp and subject from the inbox. The three `ERROR Failed to copy` lines were **checked before being called benign** — the packages were listed in the bundle and the Worker's own endpoint was fetched — rather than assumed from their looking familiar

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: this PR deploys nothing. The release it describes was deployed at `9cb36eea`, read off the deploy line `deploy: production -> Supabase project dbkodyyxxhtygxcxmfcu (9cb36eea)`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: this PR ships no code, so there is nothing to deploy. The release's own test deploy is recorded in the record
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: this PR ships no code to smoke-test
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: no logic in this PR. Every date in both files is a written string, and the two timestamps quoted (the 03:00 backup and the mail's `06:34:49Z`) are copied from the tools that printed them, with the Pi's local time and UTC distinguished where both appear
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no logic in this PR
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no code in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the gates block below is pasted as printed, and so is every quoted line in the record
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: this PR changes no public page and ships no code

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy in this PR; the release's line was read and is quoted in the record
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy in this PR; `removed 11 env var(s)` was seen on both Worker deploys and is quoted in the record
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR; run twice during the release, both `ok`, exit 0
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: this PR writes nothing to any database. The release's own gate was satisfied by the cron's backup of 03:00 on 2026-10-13, recorded in the record
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — **this PR needs no rollback position of its own**: it ships no code, so reverting it would change nothing that any user or any build can see. `git revert` is the whole of it. **What that does not cover is the record's accuracy** — a wrong figure in a release record is not fixed by reverting the commit but by a follow-up that says what was wrong, because the record is read historically. The release it describes rolls back as its own record states: `./scripts/pi/deploy-pi.sh --ref b5fd020d` on the Pi for `0.28.0`, with the two migrations staying and the mail unsendable

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
| 1 | The `0.29.0` record read back by Lutan — in particular that "Run by" is right (the production Worker deploy was his and nothing else was), and that the two-touch claim matches his experience of the release | `docs/releases/2026-10-13.md` → `## 0.29.0` |
| 2 | The handover read **cold** by whoever runs `0.30.0`, which is the only test of it that means anything. The previous edition was stale within its own first afternoon | `docs/release-handover.md` |
| 3 | The release's four notes read on a screen, and the role tag on note 4 — Admin and Management see the maintenance-bills note, a 2IC or volunteer does not. Behind sign-in, so no session could look | `/releases`, production |

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

Manual verification by: pending: the three rows above — the record read back by Lutan, the handover read cold by whoever runs `0.30.0`, and the release's notes and note 4's role tag read on a screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/release-procedure.md` §7 tells the release manager to run `node scripts/apply-migrations.mjs --drift dev`, and **`dev` is not an environment the runner accepts** — the dev database is `--env test` / `--drift test`. `0.28.0`'s record noted the same thing about `--env dev` and the runbook was not corrected | deferred to backlog — it is a one-word fix in a file this PR has no other reason to touch, and correcting it here would put a runbook edit in a record PR. The handover rewritten in this PR says plainly that it is `--drift test`, so the next release manager is not misled in the meantime |
