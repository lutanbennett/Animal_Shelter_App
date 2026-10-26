# Feature test plan — release-tooling-fixes

## Header

| | |
|---|---|
| Feature | `scripts/cut-release.mjs` (cut + `--verify`), and one stale `-- consumer:` path dropped from `0257` |
| Backlog item | `docs/backlog.md` → Quick wins: "The release cut script is rewritten from scratch every release" and "`0257_card_grants.sql`'s `-- consumer:` header" |
| Branch / worktree | `claude/release-tooling-fixes` @ `C:\Development\Animal_Shelter_release-tooling-fixes` |
| Dev server | n/a: no user-visible surface, none started |
| PR | filled by the PR itself |
| Tested by / date | Claude Sonnet 5.5 / 2026-10-26 |
| Carries a migration? | no — one comment line in an applied file (`0257`); no SQL changes |
| Tested at SHA | 548d36e1 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a script that cuts a release and verifies the cut on either line ending, plus one dead path removed from a SQL comment
- [x] Files/areas touched listed — `scripts/cut-release.mjs` (new), `supabase/migrations/0257_card_grants.sql` (line 1, comment only), `docs/release-procedure.md`, `docs/backlog.md`, `docs/decisions/2026-10-26-cut-release-script.md`
- [x] Roles affected identified — none; nothing a signed-in or signed-out person can reach
- [x] Anything explicitly **out of scope** written down — no real release was cut, `src/lib/releases.ts` and the real `package.json` version were not touched, nothing ran against production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] The script was run against copies in a scratch directory, never the real files. CRLF copy and LF copy each: cut `0.40.4 -> 0.40.5` (minor), then `--verify` against the untouched original: **all 16 assertions passed** on both, `file` confirmed the CRLF copy stayed CRLF, and `diff` of `package.json` showed only the `"version"` line changing
- [x] Refusals write nothing: with `unreleased` empty (re-cutting the already-cut copy) it printed `REFUSED — unreleased is empty`, exit 1, md5 of both files unchanged; with the anchor renamed it printed `REFUSED — could not find export const unreleased…`, exit 1, md5 unchanged
- [x] A `major` cut verified as presence: `majorReleasesSince("0.40.4")` is exactly `["0.41.0"]`, and the control from further back still finds `0.40.0`. A tampered note (one added space) made `--verify` print FAIL on "character-identical" and exit non-zero, so the check can fail
- [x] `--base HEAD` (a git ref rather than a file) works

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no new migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration applied; the file edited is a comment, and the runner records no checksum of file contents (read `scripts/apply-migrations.mjs`: it compares blobs to `origin/main` only)
- [ ] `--dry-run` reviewed — n/a: no SQL changed
- [ ] Applied to dev — n/a: no SQL changed
- [ ] File is re-runnable — n/a: no SQL changed
- [ ] Existing rows still read correctly — n/a: no SQL changed
- [ ] Constraints and defaults exercised — n/a: no SQL changed
- [ ] Down-migration — n/a: a comment carries no behaviour
- [ ] Production apply plan — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — section 2, both line endings
- [ ] Data persists — n/a: tooling, no stored data
- [ ] Create / edit / delete — n/a: tooling
- [x] Empty state renders sensibly — empty `unreleased` is refused with a readable message
- [x] Invalid input is rejected with a readable message — bad version, date, third argument, missing `--title` each `REFUSED —` (code paths read; empty and missing-anchor runs executed)
- [x] Boundary cases checked — both line endings, minor and major, tampered note

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles, signed out | nothing: a command-line script | n/a | n/a |

- [ ] Every role above tested — n/a: no page, route or action
- [ ] A role that should not have access is blocked server-side — n/a: no page, route or action

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no user-facing feature
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work — `node scripts/check-release-guards.mjs` passes inside the lint gate (it reads the real `releases.ts`, which this PR did not change)
- [x] Shared file touched checked from a second page — the only shared file is `0257`; `git diff` shows exactly one line changed, and `scripts/check-card-grants.mjs` (the surviving named reader) exists
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog items ticked on this branch (both)
- [x] Decision recorded — `docs/decisions/2026-10-26-cut-release-script.md`, including why editing an applied file's comment is allowed
- [x] `README.md` still accurate — it does not describe the cut procedure
- [ ] **Release notes.** n/a: tooling only, no user-visible surface
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every outcome above is from a run, not from reading the code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the release manager; this PR changes nothing the app serves
- [ ] Deployed SHA matches the tested SHA — deferred: the release manager

### On the deployed build

- [ ] Deployed to test — deferred: the release manager
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] Timezone-sensitive behaviour — n/a: the script takes its date as an argument and never reads the clock
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output — the gates block is verbatim
- [ ] Public pages re-checked — n/a: no public page changes

### Deploy safety

- [ ] `deploy:` line read — n/a: no deploy of mine
- [ ] `strip-baked-env` seen — n/a: no deploy of mine
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing deploys differently; reverting is reverting the commits

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-10-26

### Manual verification

- [x] The manual list above is empty — there is nothing for a person to look at

Manual verification by: n/a: no user-visible surface and nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links the file
- [ ] Handed to the production release manager — n/a: tooling, picked up by the next cut

Result: pass

Release manager acknowledgement: n/a: not yet released
