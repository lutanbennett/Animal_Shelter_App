# Feature test plan — drop-backfill-release-note

## Header

| | |
|---|---|
| Feature | Remove one line from `unreleased`: the note describing the standard-diet backfill, which did nothing on production |
| Backlog item | none — requested by Lutan on 2026-09-26 in the session that shipped #134; the brief is `.brief.md` on this worktree |
| Branch / worktree | `claude/drop-backfill-release-note` @ `C:\Development\Animal_Shelter_drop-backfill-release-note` |
| Dev server | not started — this PR deletes one line of register data and appends a documentation note |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `129fd2f` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — delete the `unreleased` line beginning "Every resident living at the shelter now has a diet recorded", and record why in `docs/decisions.md`
- [x] Files/areas touched listed — `src/lib/releases.ts` (one array element removed) and `docs/decisions.md` (addendum to the 2026-09-26 `0087`–`0089` entry). No app code, no migration, no schema
- [x] Roles affected identified — **none.** Nobody's access or behaviour changes. The only people affected are the admins who would otherwise have received this sentence in the release email
- [x] Anything explicitly **out of scope** written down — (a) `0087_standard_diet_flag.sql` itself, which stays exactly as merged; (b) the other nine `unreleased` lines, left untouched; (c) the release cut, which is a separate PR

**Why this is a deletion and not a correction.** The note said every resident living at the shelter had been put on the standard diet. On production that backfill matched **no rows**: a read-only count on 2026-09-26 found 0 backfilled rows and 0 living residents without a current diet, because all 69 already carried the `0069` seed and there have been no intakes since 2024-01-01. It only ever did anything on dev, against four test intakes. A release note is written for a shelter user, and there is no shelter user who could notice this. Rewording it would still describe nothing.

**The migration is not in question.** `0087` was right to write and stays. It is the guard that keeps "every living resident has a diet" true from now on, and a guard that finds nothing to fix is a guard doing its job. Only the claim that users would notice something is withdrawn.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run, not assumed: this worktree was **59 commits behind** `origin/main` and is now level at `129fd2f`. Worth stating because the branch had never been pushed and was created before eleven PRs landed
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] The register still parses the way `scripts/deploy.mjs` loads it — imported under Node's type stripping: `unreleased` went from **10** entries to **9**, and the removed one is the backfill note. Checked by string match, so the right line came out and not a neighbour

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database. **The production count that justifies it was run by Lutan**, not by this session, which cannot read production
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply. `0087` is already on production and is unchanged by this PR

## 4. Functional checks

- [x] Happy path works end to end — the register loads, `unreleased` has 9 entries, and the backfill line is absent
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `unreleased` still has nine entries. Its empty state is the normal post-cut state and is exercised by the release cut, not here
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — **exactly one line removed**: the edit refused to proceed unless precisely one entry matched the opening phrase, so it could not silently drop two or none. **The nine survivors were not reordered or reworded.** **Line endings**: the file is CRLF and that was preserved, so the diff is one line rather than the whole file

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | `/releases` | unchanged — this line was never on `/releases`, only in `unreleased` awaiting a cut | no behaviour change |
| admin | the release email | **will not receive this sentence** — which is the point of the PR | takes effect at the next cut |

- [x] Every role above tested — n/a as a per-role exercise: nothing this PR touches is role-dependent. `unreleased` is not rendered anywhere; it is the staging area a cut reads
- [x] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no user-facing behaviour changes, so there is nothing to document
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. Only `deploy.mjs` reads `unreleased`, and it reads the length as a deploy guard; 9 is as valid as 10. `latestRelease` and `releases` are untouched, so `/releases` and the mailer see no change at all
- [x] Nothing merged from `main` during `sync` was broken by this branch — 59 commits came in and the only conflict surface was `unreleased` itself, which is why the edit was made **after** the sync rather than before

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; requested directly in chat
- [ ] **Release notes.** — n/a: this PR *removes* a line from `unreleased` and adds none. Ticking it would claim `unreleased` gained a line and `check-test-plan.mjs` would fail it. The removal is the change; it needs no note of its own, because a note about a note nobody will see is the same problem one level up
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the 2026-09-26 `0087`–`0089` entry gains an addendum recording that the backfill was a no-op on production (0 rows, 69 living residents already seeded by `0069`, no intakes since 2024-01-01), that the note was dropped rather than reworded, and that the migration itself stays because it is the forward guard
- [x] `README.md` still accurate — unaffected; it names no release content
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `129fd2f` plus this branch's commit
- [ ] Deployed SHA matches the tested SHA — n/a: this PR deploys nothing. It changes what the *next* cut will contain

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy. `unreleased` is build-time data that no running site reads
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable change
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: nothing to apply
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [x] Apply plan stated — n/a: nothing to apply, and `0087` is already on production unchanged

### Rollback

- [x] Rollback position stated, **including what it does not cover** — nothing to roll back: no deploy, no migration, no runtime change. If the decision were reversed the line would be re-added to `unreleased` by a new commit. **The one-way part is timing**: once the next release is cut and deployed with `major: true`, the nine notes are emailed and that cannot be unsent — so this PR has to land *before* the cut, not after. That ordering is the only risk it carries

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process) | The note reached `unreleased` at all. #134's plan ticked the release-notes line honestly — on dev the backfill moved four residents, so a user-visible claim looked true. What no per-PR check can see is that the same migration is a no-op against production data | accepted, and the cause is worth naming: a release note is a claim about **production**, but every PR is verified against **dev**. Recorded in `docs/decisions.md` rather than fixed, since the fix would be a production read in every feature PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none | The production count that justifies this was run by Lutan on 2026-09-26 and is quoted in `.brief.md`; nothing else here needs eyes |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty. The one fact this PR rests on, the production row count, came from Lutan's own read on 2026-09-26

Manual verification by: n/a: the manual list is empty — no UI, no runtime change, and the production count it relies on was Lutan's own

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, which will cut the release once this merges

Result: pass
