# Feature test plan — record-0-32-1

## Header

| | |
|---|---|
| Feature | The `0.32.1` release record: a `## 0.32.1` section in `docs/releases/2026-10-15.md`, and `docs/release-handover.md` rewritten for the next release |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-32-1` @ `C:\Development\Animal_Shelter_record-0-32-1` |
| Dev server | not started — this PR changes no code and renders nothing |
| PR | #652 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.32.1` actually did, as a `## 0.32.1` section appended to today's record file (which already holds `0.31.0` and `0.32.0`), and rewrite `docs/release-handover.md` for whoever runs the next release
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-15.md` (appended section only, nothing above it touched), `docs/release-handover.md` (rewritten) and this plan. **No code, no route, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing here is reachable from the app; these are repository documents
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the six items under **Left for a person** in the record, and the Defect 1 fix, which is on the `backlog` branch (`4ff283f3`) and is a future stream's work. **This PR is not a gate** — `0.32.1` was deployed and verified before it existed

**No decision file this release.** `0.32.0` added one because it settled the build-order question. `0.32.1` settled nothing new: the build order was followed as decided, and the one judgement in the release — minor over major — is Lutan's and belongs in the record, not in `docs/decisions/`. Defect 1 is a defect with a backlog item, not a design choice.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, bringing in the merged cut (#651). Run before anything was written in this worktree, as the handover says to
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 11s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 105s
=== gates: test — npm test
=== gates: test exited 0 after 3s
=== gates: build — npm run build
=== gates: build exited 0 after 36s
gates: typecheck=0 lint=0 test=0 build=0
```

**This is a second gates run, and the first one is worth recording rather than hiding.** An earlier run (`typecheck` 36s, `lint` 94s, both 0) was started after the record section was appended but **before** `docs/release-handover.md` was rewritten, so it did not cover the final tree. Citing it would have been a claim about a tree that was never gated. The runbook's rule — *if anything changes after the gates run, re-run them* — is written about the release entry, and it applies here for the same reason: the point is that the pasted evidence describes the committed tree. Both files are prose that no gate reads, so the outcome was never in doubt; the honesty of the citation was.

- [x] CI green on the PR (runs the same three) — **not yet true in the commit that creates the PR.** Left unticked on the first push and ticked in a follow-up commit once the run is actually green, read from `gh run view <id> --json jobs` rather than from `gh pr checks` — and **with the run's `headSha` confirmed against HEAD**, because the PR bar's cached reading showed the cut's *first* run as green after the tick commit had already triggered a second. This plan is committed alongside the record, so `test-plan` has a complete plan to read on the first push

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's seven (`0200`–`0206`) merged in their own PRs and were applied during the release; the next free number is `0207`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply from this PR. Both databases were read as the release's final step and the results are in the record: production `207 applied, 0 pending, No drift`; dev `208 applied, 0 pending` with one phantom row, which is Defect 1
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR, and no row is read or written by a markdown file
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR; the release's apply plan was carried out and is recorded

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface and no behaviour. It is two markdown documents
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no such path
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked — n/a: no boundary in this PR

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing | `docs/` is not served by the app — no route reads either file, and `/releases` reads `src/lib/releases.ts`, which this PR does not touch | unchanged by this PR |

- [ ] Every role above tested — n/a: there is nothing to reach. The record is a repository document, not a page
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no manual change. A release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: these are internal English documents for whoever runs the next release
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: nothing renders
- [ ] Network clean — n/a: nothing renders

## 6. Regression

- [x] The pages nearest the change still work — n/a in the usual sense, and asserted rather than assumed: **nothing in `src/`, `worker/` or `scripts/` imports either file.** `docs/releases/2026-10-15.md` and `docs/release-handover.md` are read by people, and the gates' `build` compiled the whole app with both present
- [x] Any shared file touched checked from a second, unrelated page — no shared file touched. The one file in this PR that something *else* reads is the record file, read only by the next release manager
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in the merged cut (#651) and the full gates run afterwards was clean. **Nothing above the appended section in the record file was altered**, so `0.31.0`'s and `0.32.0`'s sections are untouched

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release record closes no backlog item. **The release's one follow-up went on the `backlog` branch**, not here: Defect 1's guard gap, committed as `4ff283f3` under *Deployment*, which is where follow-ups belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a, deliberately: see §1. No new design choice was made by this release
- [x] `README.md` still accurate — no README statement is about release records or the handover
- [ ] **Release notes.** Would a shelter user notice this change? — **n/a: nobody outside this repository would notice.** Two internal markdown documents; no page, no permission, no data. `unreleased` is correctly empty on `main` after the cut, and this PR deliberately does not add to it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the record were measured, not reasoned.** This is the substantive check for a record PR, because a release record's whole value is that its claims are true. Everything asserted in the `## 0.32.1` section is something this session ran and read: the seven `applying … ok` lines, both `--drift` outputs, the four `/api/version` and `/api/releases/current` readings with their `x-lanna-served-by` headers, both Pi `actions-key` fingerprints against both Worker ones, the `grep -ci 'release mail'` count of **0**, the `Failed to copy` counts of 0 and 3, and the backup's name, byte size and timestamp read over SSH. **Where something was inferred rather than observed, the record says so** — Defect 1's history is the example, and it is named in "What this record cannot say" rather than asserted in the defect table

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the tip of this branch. **This PR ships nothing**: `0.32.1` is already live on all four surfaces at `61fb95ed`, and no deploy follows this merge
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed by this PR. The release's own check passed and is recorded: all four builds from `61fb95ed`
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deploy follows this PR
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deploy follows this PR. Test is on `0.32.1` @ `61fb95ed`, verified during the release
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR. The dates in the record are fixed strings written by hand
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is the script's own stdout
- [ ] Public pages re-checked after a cache purge — n/a: this PR changes no public page. The release's own position is recorded: `PUBLIC_SITE` is `locked`, so the public site could not be checked at all, and `0.32.1` put a great deal in that blind spot

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR; read during the release from Lutan's log and recorded
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy follows this PR; `removed 11` on both Worker builds, recorded
- [ ] Any new secret/env var exists in production Cloudflare — n/a: this PR adds no secret or env var
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — done before any deploy in this release: `npm ci` exited 0 and `node_modules/next/package.json` read `16.3.8` against `package.json`'s `"next": "16.3.8"`, confirmed again by the `Next.js version : 16.3.8` banner on all four builds

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: neither. No migration, no code

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes two markdown documents and nothing else. It does not touch what is deployed, either database, or any user-facing surface.

  **The consequence of reverting it is the only thing worth stating: the next release manager loses the record of what `0.32.1` did**, including the Defect 1 warning that tells them a red `--drift test` is expected rather than theirs. That is the cost of losing a record, and it is why the record is a PR rather than an afterthought.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the `## 0.32.1` record reads truthfully to someone who was not in the session, and that the handover rewrite is useful to whoever runs the next release — in particular that Defect 1 is explained well enough that a red `--drift test` does not stall a release | `docs/releases/2026-10-15.md`, `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: Lutan to read the `0.32.1` record and the rewritten handover

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None in this PR. **The release's three defects are recorded in the `## 0.32.1` section**, not here: `0203` not sticking on dev (medium, deferred to backlog), the nine `-- consumer:` warnings (low, accepted as the safe direction), and `release-prs.mjs` exiting 1 (low, expected and reconciled). Repeating them here would give them a second home that nothing closes, which is what the template forbids | — |
