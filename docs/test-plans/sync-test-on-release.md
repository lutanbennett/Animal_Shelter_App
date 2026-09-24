# Feature test plan — sync-test-on-release

## Header

| | |
|---|---|
| Feature | Record the standing rule that a production release also goes to test from the same commit, in `docs/release-smoke-test.md` and README "Deploying to Cloudflare" |
| Backlog item | none — a process rule Lutan set in chat on 2026-09-24, not a backlog feature. The follow-up (`deploy.mjs --also-test`) goes on the backlog branch |
| Branch / worktree | `claude/sync-test-on-release` @ `C:\Development\Animal_Shelter_sync-test-on-release` |
| Dev server | not started — documentation only, no runtime surface |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `06e208c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two documentation files gain the same rule: a production release also deploys the same commit to test
- [x] Files/areas touched listed — `docs/release-smoke-test.md` (new "Test gets the same release" section), `README.md` (step 3 of "Deploying to Cloudflare"). No `src/`, no `worker/`, no `supabase/migrations/`, no scripts
- [x] Roles affected identified — **none**. Documentation for whoever runs a release; no route, query or policy is touched
- [x] Anything explicitly **out of scope** written down — `deploy.mjs --also-test`, which would make the rule mechanical rather than remembered. Deliberately not in this PR: it is a change to the deploy path, which is the most load-bearing script in the repo and broke twice on 2026-09-23, so it deserves its own PR and its own testing rather than riding on a docs change. Filed on the backlog instead

**The rule as Lutan set it (chat, 2026-09-24):** "when we release to Prod also release the branch to test to keep the two in sync."

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a-adjacent but honest: the worktree was created from `origin/main` minutes before and is at `06e208c`, 0 commits behind. No sync was needed
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0). Exit codes captured to file, not read after a pipe
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration. Production is at 72 applied, 0 pending

## 4. Functional checks

- [x] Happy path works end to end — **the rule was executed before being written down.** `npm run deploy:test` from `main` brought `test.lannacare.org` from `0.0.1` to `0.1.0`, matching production; both endpoints were then confirmed to report `0.1.0` and `/`, `/login`, `/adopt` to return 200 on each. The checklist steps in the new section are the steps actually taken, not steps imagined
- [ ] Data persists — reload the page and the change is still there — n/a: documentation, nothing written
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | no change | no change |
| management | nothing changed | no change | no change |
| staff | nothing changed | no change | no change |
| vet | nothing changed | no change | no change |
| volunteer | nothing changed | no change | no change |
| signed out | nothing changed | no change | no change |

- [ ] Every role above tested — n/a: no route, query or RLS policy changed. These are two markdown files read by whoever deploys
- [ ] A role that should not have access is blocked server-side — n/a: no surface added

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter staff; this is repo documentation for whoever runs a deploy
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no pages to load

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled every route at `06e208c`, the only regression signal a docs change has
- [x] Any shared file touched checked from a second, unrelated page — `README.md` and `docs/release-smoke-test.md` are both shared, and neither is imported by code. Checked that the README addition sits inside step 3 and does not break the numbered sequence into step 4
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync was needed; the branch is 0 commits behind

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is a process rule set in chat
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: the reasoning belongs with the procedure rather than in the decisions log, and both files now carry it inline. The rule is operational, not an architectural choice with alternatives weighed
- [x] `README.md` still accurate — this change is *to* the README, added under step 3 where someone deploying will meet it rather than in a section they would have to go looking for
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `06e208c`
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy. A docs-only change ships no runtime code and reaches production incidentally with a later release

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — done, and it is the subject of this PR rather than a check on it: `f0fc305` deployed to `test.lannacare.org` as Worker `32d425c7`, bringing test from `0.0.1` to `0.1.0`
- [x] Smoke-tested on `test.lannacare.org` — `/api/releases/current` returns `0.1.0`; `/`, `/login` and `/adopt` all 200
- [ ] Timezone-sensitive behaviour checked on test — n/a: this PR changes no date handling. #59's timezone fix is in the build now on both environments and carries Lutan's own signature on `utc-today.md` from the overnight check
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed by this PR

### Deploy safety

- [x] `deploy: ... → Supabase project <ref>` line read and the ref matches the intended environment — read for the test deploy: `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (f0fc305)`, which is the **dev** project as intended, not production
- [x] `strip-baked-env: removed N env var(s)` seen — 10 removed on the test deploy, named in the output
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's commit. Nothing to roll back at runtime: no Worker version, no schema, no data. Reverting only removes the written rule; the test environment stays on `0.1.0` either way, since that deploy already happened and is not undone by reverting its documentation

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Test's release-mail recipient list comes from the **dev** database, so it differs from production's. The test deploy tried to mail `claude@lutan.com`, an account production has never had. Harmless — test cannot send at all (`RELEASE_MAIL_ENV` is `""`) — but the two `sent/skipped` outputs will never match, which would look alarming to anyone comparing them | fixed by documentation — noted in the new section so it is expected rather than discovered |
| 2 | low | `lannacareforanimals@gmail.com` was skipped on the production `0.1.0` mail with `E_RECIPIENT_NOT_ALLOWED` — it is not a verified Cloudflare destination address. Unrelated to this PR but found by the same deploy, and it means the shelter's own account received no release mail | deferred — needs someone with access to that inbox to click Cloudflare's confirmation link; raised with Lutan in chat |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether "deploy test first where the release allows it" is the sequencing you want. Today production went first out of necessity, and I wrote test-first as the preference because a build that is going to fail should fail somewhere that is not the live site — but it is your call, and if you would rather it were always production-first, that sentence should change | `docs/release-smoke-test.md`, "Test gets the same release"; the same wording in README step 3 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not mine to tick. The list is **not** empty and the template reserves this tick for the person who looked; the `pending:` signature below is the true state

Manual verification by: pending: Lutan to confirm test-first is the sequencing he wants, since today's release went production-first out of necessity

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
