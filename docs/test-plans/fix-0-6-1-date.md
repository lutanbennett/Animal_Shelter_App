# Feature test plan — fix-0-6-1-date

## Header

| | |
|---|---|
| Feature | Correct the `0.6.1` release entry's date from `2026-09-27` to `2026-09-26`, the day it actually shipped |
| Backlog item | none — a correction to an error made in #156 |
| Branch / worktree | `claude/fix-0-6-1-date` @ `C:\Development\Animal_Shelter_fix-0-6-1-date` |
| Dev server | not started — this PR changes one string in register data |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `6fe5265` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one character-level edit: `date: "2026-09-27"` becomes `date: "2026-09-26"` in the `0.6.1` entry
- [x] Files/areas touched listed — `src/lib/releases.ts`, one line. Nothing else
- [x] Roles affected identified — **none.** Everyone who can reach `/releases` sees a corrected date; nobody's access changes
- [x] Anything explicitly **out of scope** written down — (a) the other nine entries' dates, which were checked and are correct; (b) a redeploy, which this does not justify on its own (see Rollback); (c) `0.6.1`'s content, which is right — only the date was wrong

**How it happened, since a date typo is worth one sentence of cause.** The `0.6.1` cut wrote the date from context rather than reading the clock, and `2026-09-27` went through the cut, the test plan, review and the deploy without anyone comparing it to the day. The release shipped on 2026-09-26 at 19:21 local; the deploy log and the release record both say so.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified: `git rev-list --count HEAD..origin/main` returned **0**, at `6fe5265`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] The register still parses the way `scripts/deploy.mjs` loads it — `latestRelease` is `0.6.1` / **`2026-09-26`** / `major: false`, `unreleased` is still empty and `package.json` still says `0.6.1`, so **both deploy guards still pass**. Checked because this file is the one `deploy.mjs` refuses to deploy against if it disagrees with `package.json`
- [x] Every other entry's date checked while here — `0.6.0`=2026-09-26, `0.5.0`/`0.4.0`=2026-09-25, `0.3.0`–`0.1.0`=2026-09-24, `0.2.2`/`0.2.1`=2026-09-24, `0.0.1`=2026-09-23. All consistent with their release records. `0.6.1` was the only wrong one

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — the register loads and the `0.6.1` entry reports `2026-09-26`
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has ten entries; `unreleased` is empty and stays empty
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — **one line changed**, confirmed by `git diff --stat`: 1 insertion, 1 deletion. **The version string was not touched**, which matters because `deploy.mjs` compares it with `package.json`. **Line endings**: CRLF preserved

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every signed-in role | `/releases` | `0.6.1` dated 26 September 2026 | takes effect on the next deploy |
| signed out | the sign-in lock | unchanged | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: the date renders identically for everyone who can see the page, and nothing role-dependent is touched
- [x] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no behaviour changes
- [ ] Translatable strings go through the translation path — n/a: release notes and their dates are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers. `/releases` renders the date; `worker/release-mail.mjs` and `scripts/deploy.mjs` read `latestRelease` and `majorReleasesSince`, neither of which depends on `date`. `majorReleasesSince` compares versions only, so no mail behaviour can change — and `0.6.1` is `major: false` regardless
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `6fe5265`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; a correction
- [ ] **Release notes.** — n/a: this PR adds no line to `unreleased` and must not. A date correction to an already-published entry is not something a shelter user would notice as a change to the app, and adding a note about it would put a second wrong-looking date in front of them
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice. The error and its cause are already recorded in `docs/releases/2026-09-26.md` under "What broke, if anything"
- [x] `README.md` still accurate — unaffected
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `6fe5265` plus this branch's commit
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Not worth a deploy of its own**; see Rollback
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — n/a: the register's `date` is a display string, not a computed date. Nothing reads it as a date or compares it to today
- [ ] Public pages re-checked after a cache purge — n/a: `/releases` is staff-only and not edge-cached for signed-in requests

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: production release manager. **Use `>>` not `>`** when logging, so a second run cannot destroy the first's evidence
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: nothing to apply
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [x] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — nothing to roll back: no migration, no runtime behaviour, no mail. If reverted, `/releases` would simply show the wrong date again. **The deliberate recommendation is not to deploy for this alone**: a full rebuild to correct one display date is a poor trade, and the register on `main` being right is what stops the error propagating into future work. It should ride to the site with the next release's deploy

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The `0.6.1` entry shipped dated `2026-09-27` for a release deployed on `2026-09-26` | fixed by this PR on `main`; reaches the site with the next deploy |
| 2 | low (process) | Nothing in the cut checks the entry's date against the clock. `check-test-plan.mjs` validates the plan, and `deploy.mjs` guards the version and `unreleased`, but no gate looks at `date` — so a wrong one passed CI, review and a deploy unchallenged | accepted, not fixed here. Worth a guard in `deploy.mjs` (refuse a newest-entry date in the future) if it recurs; one instance is not yet a pattern, and the cheaper fix is the cut reading the clock |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none | One string, verified by loading the register. Nothing here needs eyes |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty

Manual verification by: n/a: the manual list is empty — one data string, no UI behaviour and no runtime change

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session; the fix rides to the site with the next deploy rather than justifying one

Result: pass
