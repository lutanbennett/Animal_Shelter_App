# Feature test plan — the `0.40.3` release record and handover

## Header

| | |
|---|---|
| Feature | The `0.40.3` release record, the rewritten release handover, and one rule promoted into the runbook |
| Backlog item | `docs/backlog.md` → n/a: release bookkeeping is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/record-0-40-3` @ `C:\Development\Animal_Shelter_cut-release-0-40-2` — **the cut's own worktree, reused**, which is paperwork rule 2 |
| Dev server | n/a: three markdown files, no page |
| PR | opened after this commit; the number is filled in by the follow-up commit below |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-25 |
| Carries a migration? | **no** |
| Tested at SHA | branched from `b02864e7`, the deployed SHA |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds `docs/releases/2026-10-25-0-40-3.md`, rewrites `docs/release-handover.md` as a delta, and promotes one durable rule into `docs/release-procedure.md`
- [x] Files/areas touched listed — three files, all under `docs/`. No route, no component, no `worker/`, no migration, no script
- [x] Roles affected identified — none: these documents are read by the next release manager and by Lutan, and change nothing a shelter user can reach
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate and must not be presented as one.** `0.40.3` is deployed and verified; this describes a release that already shipped. The release's open items are listed in the record and are **not** closed here

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `b02864e7` and `git reset --hard origin/main` run, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: a documents-only PR, which `scripts/check-docs-only.mjs` detects and `ci.yml` uses to skip the heavy jobs. **Running the gates to make a check fire would be the specific thing paperwork rule 1 forbids.** The diff is three markdown files, confirmed by `git diff --cached --name-only` resolving to `docs` alone
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-test-plan.mjs --base origin/main` run locally, the way CI runs it — exit 0

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration. The release's own applies are recorded in the record
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration and no row is written
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime surface. The equivalent check is that every factual claim came from a command's output, covered in section 7
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no such surface
- [ ] Empty state renders sensibly — n/a: no such surface
- [ ] Invalid input is rejected with a readable message — n/a: no input surface
- [ ] Boundary cases checked — n/a: no logic. The one boundary that applies to a handover is its length ceiling, checked in section 7

### Role access matrix

- [ ] Every role above tested — n/a: three documents under `docs/`, readable by anyone with the repository and reachable by no role in the app
- [ ] A role that should not have access is blocked server-side — n/a: adds no route and no server action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no page added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does has changed
- [ ] Translatable strings go through the translation path — n/a: internal English documents, not UI strings
- [ ] Mobile viewport (375px) — n/a: markdown files, not a rendered page
- [ ] Browser console clean — n/a: nothing to load
- [ ] Network clean — n/a: nothing to load

## 6. Regression

- [x] The pages nearest the change still work — nothing in `src/` or `worker/` is touched, so there is no page near this change. Confirmed by the diff resolving to `docs` alone rather than by assertion
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-procedure.md` is the shared file here, and the check that matters is that the promoted rule does not contradict what already stands. It is placed immediately after **Do not idle**, names that rule as the one it narrows, and cites the existing *"Two builds in one worktree collide"* trap as the same hazard — so the three now agree rather than compete
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; `main` has not moved since `b02864e7`, confirmed by `git log --oneline b02864e7..origin/main` being empty

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. The one item this release *found* — `opensWhoDoesWhat()` — was filed on the `backlog` branch, which is where follow-ups belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately none, and that is the choice.** The one durable lesson is a change to how a release is run, so it was **promoted into `docs/release-procedure.md`** rather than filed as a decision nobody would read at the moment it matters. Paperwork rule 4 says durable things are promoted once rather than recopied
- [x] `README.md` still accurate — unchanged by this PR and re-read: it quotes no version number and describes no release step this PR alters
- [ ] **Release notes.** — n/a: this PR adds and rewrites three documents and no page; no shelter user could notice it. The release's own note shipped in the cut, #932
- [x] Commit messages say why, not just what — the commit records that the record's headline fault is the release manager's own and why the rule was promoted rather than filed
- [x] **Claims in commit messages and decisions were measured, not reasoned.** This is the substantive check for a record, and it was done line by line: the before/after `role-cells` tables are the script's own output; `262 of 262` and `No drift` are quoted from the named drift check rather than from `--status`; the Server Actions fingerprints are two separately read values, not one inferred from the other; the Worker version `db93bdc2` is matched between `wrangler deployments list` and the deploy log's `Current Version ID`; `0 created` comes from the icon sync; and `PUBLIC_SITE=locked` was read from the Pi this release rather than carried over
- [x] **The handover is a delta and stays under its ceiling** — 131 lines against a limit of 150 and an aim of about 100. It is above the aim because it carries a new rule and a mid-release question with a lasting answer; nothing in it restates the runbook
- [x] **The record states the release's own fault plainly, as its own fault.** The build collision is in *What broke* as item 1, in the START HERE of the handover, and in the touch count — not softened, and attributed to the release manager rather than to circumstance

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — branched from `b02864e7`, which is the deployed SHA
- [ ] Deployed SHA matches the tested SHA — n/a: **these documents are not deployed.** `0.40.3` was deployed from `b02864e7` before this PR existed, and the record is the evidence of it

### On the deployed build

- [ ] Deployed to test — n/a: documents are not deployed; `0.40.3` already went to test from `b02864e7`
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR reaches a running app
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code. The one date is the literal `2026-10-25`, which is the release date in Thailand and the day both deploys ran
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the record's fenced blocks are the unedited stdout of the drift checks, `check-production.mjs` and the deploy logs. The `role-cells` comparison is laid out side by side for reading, and both columns are the script's own lines
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR changes a page. The release's own purge and asset checks are in the record

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: already read during the release and quoted in the record as `dbkodyyxxhtygxcxmfcu (b02864e7)`
- [ ] `strip-baked-env` seen in the deploy output — n/a: already read during the release, **14 on both environments**, quoted in the record
- [x] Any new secret/env var exists in the production Cloudflare environment — none: three markdown files add no secret and no env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: it contains neither. The release's three migrations, and the measurement that fixed their ordering, are recorded in the record
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; the release's dry-run was clean and is recorded
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes three documents and restores the previous handover. **It does not and cannot roll back `0.40.3`**, which is live and whose schema is not purely additive; the rollback position for the release itself is stated in the record, and it is forward-fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | **The test and production Worker deploys collided over `next build` in the main checkout**, killing Lutan's deploy and costing him two extra touches | **Fixed as a rule, not as a one-off apology** — promoted into `docs/release-procedure.md` immediately after the "Do not idle" paragraph that misled me, naming the two Worker deploys as strictly sequential and the Pi builds as the thing that genuinely parallelises |
| 2 | medium | **"It looks like it has deployed" was wrong**, and a failed deploy finishes just as a successful one does | **Fixed as a rule** — the same promotion adds that a deploy is confirmed from `wrangler deployments list` matched against the log's `Current Version ID`, never from the command having ended |
| 3 | low | `audit` showed `skipping` on the cut PR although it changed `package.json`, so the job's gate is narrower than the 2026-10-25 decision's wording implies | **Recorded, not acted on** — a skip is not a pass, and the release-time `npm run audit:prod` was run and is recorded. Changing the job during a release is forbidden by the standing rule |

## Left for manual verification

| What | Why it needs a person | Who |
|---|---|---|
| Nothing in this PR | Three documents with no surface to look at. **The release's** outstanding checks are listed in the record and in the handover, and are deliberately **not** copied here — copying them would give them a second home that nothing closes | — |

## Sign-off

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-25

Manual verification by: n/a: this PR adds and rewrites three documents and no page; there is nothing for a person to look at. The release's own open items are recorded in `docs/releases/2026-10-25-0-40-3.md` and are not signed here

Result: pass with accepted defects
