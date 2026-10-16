# Feature test plan — release-check-distinguish

## Header

| | |
|---|---|
| Feature | The Release tile on /admin/status says whether the Worker is untagged or tagged as another release |
| Backlog item | `docs/backlog.md` → "The production Worker's release check is amber: `wrangler secret put` leaves the live version untagged" |
| Branch / worktree | `claude/release-check-distinguish` @ `C:\Development\Animal_Shelter_release-check-distinguish` |
| Dev server | not started — the amber state exists only on the Worker (CF_VERSION_METADATA); a local server reads "elsewhere" and shows no warning |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | 1bdce913 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the tile keeps its amber for an untagged Worker but words it differently from a Worker tagged as another release, with a runbook line saying a hand-set secret is expected to do this
- [x] Files/areas touched listed — `src/lib/status/health.ts`, `src/app/admin/status/page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/releases.ts` (unreleased), `docs/release-procedure.md`, `docs/backlog.md`, one decision file. No `worker/`, no migration, `deploy.mjs` untouched
- [x] Roles affected identified — admin only (the status page); no other role and no signed-out visitor reaches it
- [x] Anything explicitly **out of scope** written down — the check never goes green on an untagged Worker (the decision file explains why no signal inside the Worker can justify that); the live production tile is not read, because sessions cannot

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from current main minutes earlier; origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 22s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 87s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 34s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the warning states only render on the Worker, so they cannot be driven locally; the new code paths were read in the diff and typechecked, and the live tile is left for a person (see Left for manual verification)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is stored, the tile is computed on each render
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list on this tile
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the only boundary is tag empty versus different versus equal, three separate branches in checkRelease() reviewed in the diff

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/status | sees the tile, access unchanged | unchanged, no permission code touched |
| management | nothing new | unchanged | unchanged |
| staff | retired role | not applicable | not applicable |
| doctor | nothing new | unchanged | unchanged |
| volunteer | nothing new | unchanged | unchanged |
| signed out | nothing new | unchanged | unchanged |

- [ ] Every role above tested — n/a: no access rule changed, only text and one fact field on an existing admin page
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route or permission added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe this tile's warning wording
- [x] Translatable strings go through the translation path — the new `untagged` string and the reworded `mismatch` are in both the English and Thai dictionaries, and typecheck enforces the Dictionary shape
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: one paragraph of text in an existing tile, no layout change
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser, the warning cannot be produced off the Worker
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no new requests

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: the build compiled every route including /admin/status, and the tile off the Worker is unaffected because the new code sits inside the existing branch for a Worker whose tag differs
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared files are the two dictionaries, which gained one key and one reworded string under the status release block
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — with a note that confirming the live production tile is green is still outstanding and is Lutan's
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-untagged-worker-stays-amber.md`, including the rejected option
- [x] `README.md` still accurate
- [x] **Release notes.** A line was added to `unreleased` in `src/lib/releases.ts` describing the Release tile's new wording, written for the Director
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision record were measured, not reasoned.** What the Worker can and cannot know about itself was read from `next.config.ts`, `api/version/route.ts`, `health.ts` and `wrangler.jsonc`, not assumed

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the SHA is recorded; the release manager confirms it against main at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no threshold or banding, only a three-way string comparison
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the script's own stdout lines
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret or env var added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR
- [x] Rollback position stated, including what it does not cover — reverting this PR restores the old single amber wording; nothing about what is deployed or tagged changes, and no migration is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After this ships, the production Release tile: green if the Worker is tagged with the current release; if it is untagged (for example after a hand-set secret) it should read "The Worker has no release tag…" in amber. Sessions cannot read production | /admin/status on lannacare.org, signed in as admin |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick it

Manual verification by: pending: row 1 above, the live production tile; nothing here blocks the merge

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass
