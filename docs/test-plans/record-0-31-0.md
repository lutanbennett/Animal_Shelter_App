# Feature test plan — record-0-31-0

## Header

| | |
|---|---|
| Feature | The `0.31.0` release record (`docs/releases/2026-10-15.md`) and the rewritten handover for whoever runs `0.32.0` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-31-0` @ `C:\Development\Animal_Shelter_record-0-31-0` |
| Dev server | not started — the diff is `docs/` markdown only, which the app never imports |
| PR | #628 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, created from `c1026407` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write the `0.31.0` release record and rewrite `docs/release-handover.md` for the next release manager
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-15.md` (new), `docs/release-handover.md` (rewritten) and this plan. No `src/`, no `worker/`, no migration, no shared lib, no `package.json`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. No role can reach any of these files; they are repository documentation and the app never imports `docs/`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: anything that would change what is deployed. `0.31.0` is already live on all four builds and verified; this PR describes a release that has already shipped and **is not a gate**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Run **twice**: once when the worktree was created during the CI wait (before the cut merged) and again after `#627` moved `main`, which is why the branch sits on `c1026407`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 184s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 394s
=== gates: test — npm test
=== gates: test exited 0 after 12s
=== gates: build — npm run build
=== gates: build exited 0 after 249s
gates: typecheck=0 lint=0 test=0 build=0
```

Slower than the cut's run throughout, because it shared the machine with the
test Worker redeploy — contention, not a fault. Each gate's own exit code is what
was read.

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at the commit this plan was written in

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. The release's three were applied and confirmed as a release step: `198 applied, 0 pending` on both databases
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this PR writes no rows anywhere
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR; the release's apply is recorded in the record itself, already done

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour — two markdown files under `docs/`
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary; the dates in the record are fixed strings

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | `docs/` is not served | unchanged |
| management | nothing | as above | unchanged |
| second_in_command | nothing | as above | unchanged |
| head_of_maintenance | nothing | as above | unchanged |
| head_of_medical | nothing | as above | unchanged |
| doctor | nothing | as above | unchanged |
| volunteer | nothing | as above | unchanged |
| signed out | nothing | as above | unchanged |

- [ ] Every role above tested — n/a: no role can reach a `docs/` markdown file; nothing is served from `docs/` and the app never imports it
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string; repository documentation is English
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, no page
- [ ] Browser console clean — n/a: no page is rendered by this PR
- [ ] Network clean — n/a: same reason

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page is near the change, and the deployed release was verified independently: `/api/version` on both environments returns `0.31.0` @ `c1026407`, both `/api/releases/current` return `0.31.0`, and both Pi services are `active`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — no shared file touched; the diff is two markdown files under `docs/` plus this plan
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in `#627` and the branch adds no code

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release record closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The one judgement this release produced — that the Worker deploy cannot be pinned to a ref while the Pi builds can, so a late merge to `main` has asymmetric consequences — is written up in the record's Defect 1 and carried into the handover as the thing to decide next time, which is where the next release manager will actually read it
- [x] `README.md` still accurate — no README statement is about release records
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside the repository can see either file. `docs/` is not served, not imported and not bundled, and a release record describes a release that has already been announced by its own mail
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the record is quoted from a command's own output: the migration lines, both drift checks, the four `/api/version` responses, the Server Actions fingerprints on both pairs, the backup filename and byte count, and the release mail's delivery time and subject read from the inbox rather than from `sent 1`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `c1026407`, the deployed SHA of the release this record describes
- [x] Deployed SHA matches the tested SHA — read from the deploy log rather than assumed: `deploy: production ... Supabase project dbkodyyxxhtygxcxmfcu (c1026407)`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: this PR ships no code, so there is nothing of it to deploy. The release it records was deployed to test and verified independently, and the test Worker was redeployed at `c1026407` so all four builds match
- [ ] Smoke-tested on `test.lannacare.org` — n/a: this PR adds no behaviour to smoke-test. The release's own verification is in the record
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: this PR contributes nothing to any build
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is the script's own stdout, and every quoted line in the record is copied from the command or log that produced it
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: unanswerable and recorded as such. `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate and there is no cacheable public page

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu`, read from `deploy-0.31.0.log`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `removed 11 env var(s)`, the eleven named
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither did the release

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: this PR carries no migration. The release's own dry-run was run twice and was clean both times, all three files `ok`, exit 0
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: this PR carries no migration. The release's gate was satisfied and is recorded there
- [ ] Apply plan stated — n/a: nothing to apply; the release's three are applied and both databases read `198 applied, 0 pending` with no drift

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes two markdown files and changes nothing that runs. The deployed release's own rollback position is stated in the record, including the part a Pi rebuild would not undo (`0195`'s narrowed read policy) and the part nothing undoes (the release mail)

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The record reads true to someone who was there: that Defect 1's account of the two `main` moves matches what happened, and that the two-touch count is right | `docs/releases/2026-10-15.md` |
| 2 | The handover read **cold** by whoever runs `0.32.0` — that is the only real test of it, and the previous edition's standing instruction is to come back and correct what it got wrong | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the record read back, and the handover read cold by whoever runs `0.32.0`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |
