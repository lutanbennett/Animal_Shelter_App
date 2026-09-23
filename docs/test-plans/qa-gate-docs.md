# Feature test plan — qa-gate-docs

## Header

| | |
|---|---|
| Feature | Write the test-plan rule into `CLAUDE.md`, and record the build lessons from the v0.0.1 release in `README.md` / `docs/decisions.md` |
| Backlog item | `docs/backlog.md` → Architecture → "Promote the `test-plan` check from a red flag to a required check" (this PR is the documentation half; the promotion itself stays open and is the user's call) |
| Branch / worktree | `claude/qa-gate-docs` @ `C:\Development\Animal_Shelter_qa-gate-docs` |
| Dev server | not started — no runtime surface in this change |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | `c201f28` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `CLAUDE.md`, `README.md`, `docs/decisions.md`, `docs/test-plans/*.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: **none**. Documentation only; no route, query or policy is touched, so no role sees anything different
- [x] Anything explicitly **out of scope** written down — three things: (a) enabling branch protection, which is the user's call and no session's; (b) the `--autoconfig` deploy fix, already landed in PR #63; (c) release-manager acknowledgements for `cashflow.md` (#60) and `deploy-message-quoting.md` (#63), deliberately left `pending` because both are on `main` but neither is deployed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`c201f28`; `docs/decisions.md` merged by union as `.gitattributes` intends)
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0)
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported. The three gates above were run locally at `c201f28` with exit codes captured to file rather than through a pipe; see Defects #3 for why that distinction matters

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; no column, view or function is touched
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration. `0072_cashflow_forecast.sql` is pending on production from PR #60; that is that PR's apply plan, not this one's

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The "happy path" here is a person reading `CLAUDE.md`, covered under Documentation below
- [ ] Data persists — reload the page and the change is still there — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | no change | no change |
| staff | nothing changed | no change | no change |
| vet | nothing changed | no change | no change |
| volunteer | nothing changed | no change | no change |
| resident | not a role in this system — `app_role` has five values | — | — |
| signed out | nothing changed | no change | no change |

- [ ] Every role above tested — n/a: no route, query or RLS policy changed, so there is nothing per-role to exercise
- [ ] A role that should not have access is blocked server-side — n/a: no new surface to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter staff; this is repo documentation for developers
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no pages to load

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled every route at `c201f28`, which is the only regression signal a docs change can have
- [x] Any shared file touched checked from a second, unrelated page — `docs/decisions.md` is the shared file (union-merge); verified the sync merged PR #63's entry and this branch's two entries side by side with none lost
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought in #60, #62 and #63; all three gates pass on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is not complete. This PR writes the rule down; promoting `test-plan` to a required check is the remaining half and is the user's decision
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — two entries, 2026-09-23: never interrupting an OpenNext build on Windows, and the `color-string` copy errors being cosmetic
- [x] `README.md` still accurate — this change is *to* the README; verified the new paragraphs sit inside "Deploying to Cloudflare" beside the existing Windows notes and do not duplicate PR #63's decisions entry, which covers the separate wrangler/npx delegation bug
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `c201f28`; `main` was `457f395` when the gates ran, and this branch is that plus the docs commit
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy. A docs-only change ships no runtime code; it reaches production incidentally with a later release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no runtime change to observe, and `test.lannacare.org` is deliberately holding `7abc796` for the overnight UTC check, so deploying over it would destroy that
- [ ] Smoke-tested on `test.lannacare.org` — n/a: as above
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling in this change
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's commits. Nothing to roll back at runtime: no Worker version, no schema, no data. The only effect of reverting is that `CLAUDE.md` stops describing the rule, so sessions would go back to not finding it — which is the problem this PR exists to fix

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | `worktree.mjs new` printed its "next steps" and created `.port` / `.env.local` while `npm ci` was still running — about 25 minutes. Everything a session checks to decide "is this ready?" was true while the install was half-done, so a second `npm ci` was started on the same tree; the two fought and left `node_modules/.bin` empty and `next` unrunnable | deferred to backlog — same family as the existing `worktree.mjs done` item, where the script's output does not match the state it claims |
| 2 | high | After an interrupted purge, `node_modules` had all 713 packages present with their `package.json` intact while files *inside* them were missing (`next/server.d.ts`, `headers.d.ts`, `types.d.ts`). Both `npm ci` and a package-level integrity audit reported nothing wrong; only `tsc` caught it (`TS7016`). `npm rebuild` restored `.bin` but no files | fixed — full robocopy purge + `npm ci`; recipe and warning added to README in this PR |
| 3 | medium | Gates were first run as `npm run build 2>&1 \| tail`, which makes `$?` the exit status of `tail`. It reported `typecheck=0 lint=0 build=0` while the build had actually failed. Three gates were one step from being ticked on output that never passed | fixed — gates re-run with output redirected to files and `$?` read directly; warning added to README |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the new **Testing** section says what you actually decided — particularly that the soft gate is deliberate and that promoting it is yours to choose. I wrote it from rulings relayed across two sessions, so it is worth one read by you | `CLAUDE.md`, "Testing" |
| 2 | Whether the branch-protection parenthetical should stay. It records that protection was found enabled on 2026-09-23 with `enforce_admins: false` that nobody asked for. If you resolve that and remove the protection, the note becomes stale and should be deleted | `CLAUDE.md`, "Testing", third bullet |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-23

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: Lutan Bennett — confirmed the Testing wording in chat with one change (a manual signature may be written for someone who has looked and asks for it), and ruled the branch-protection note stale (`main` had no protection when checked 2026-09-23), so it was removed; line written by Claude at their request  Date: 2026-09-23

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
