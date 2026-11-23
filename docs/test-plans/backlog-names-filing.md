# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The backlog branch may commit `docs/backlog-names.json`, and a corrupt one is refused instead of waved through |
| Backlog item | `docs/backlog.md` → none: filing one would have needed the very commit this change unblocks (`docs/decisions/2026-11-23-backlog-names-on-the-backlog-branch.md`) |
| Branch / worktree | `claude/backlog-names-filing` @ `C:\Development\Animal_Shelter_backlog-names-filing` |
| Dev server | n/a: no app surface — the change is a git hook and a check script |
| PR | |
| Tested by / date | Claude (backlog manager) / 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `.githooks/pre-commit` lets the `backlog` branch stage `docs/backlog-names.json` as well as `docs/backlog.md`, and `check-backlog-waiting.mjs` now **refuses** (exit 3) a names file that is present but corrupt instead of crashing (exit 1), which the hook waves through. There is no backlog item by design; Lutan approved the change, including the `CLAUDE.md` edit, in chat on 2026-11-23
- [x] Files/areas touched listed — `.githooks/pre-commit`, `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, `scripts/check-backlog-waiting.test.mjs` (new), `CLAUDE.md`, `docs/decisions/2026-11-23-backlog-names-on-the-backlog-branch.md` (new). No route, no `worker/`, no migration, no shared app lib
- [x] Cards affected identified — **none.** Nothing here grants, denies or decides the ability to do anything in the app: it is a local git hook and a repository check. No card, card grant, page rule or permission-catalogue entry is read or changed, so admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — the `since:` UTC-versus-Thailand-clock rough edge is **not** fixed here (recorded in the decision file; the Planner is filing it as its own item); the name lock (`BACKLOG_RENAME_ALLOW=1`) is untouched; and nothing is done about the three items that had no name, because that was already fixed on `main` before this branch existed (see Defects)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Confirmed afterwards rather than taken on trust: `git rev-list --count HEAD..origin/main` is `0` and `git merge-base --is-ancestor fcdb4901e HEAD` passes, so the branch holds every commit `origin/main` has
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every exit code `0`:

```
=== gates: typecheck exited 0 after 43s
=== gates: lint exited 0 after 154s
=== gates: test exited 0 after 33s
=== gates: build exited 0 after 142s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and nothing here reads the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — proved twice in a throwaway git repository on a branch named `backlog` with the new hook copied in: **(1)** `docs/backlog.md` and `docs/backlog-names.json` staged together → the hook exits **0**; **(2)** `CLAUDE.md` staged alongside them → the hook exits **1** and names `CLAUDE.md` as what it refused. A throwaway repository rather than the real backlog worktree, because that worktree still holds the **old** hook until this merges — which is the one thing left for manual verification below
- [x] Data persists — reload the page and the change is still there — read as "the behaviour is reproducible, not a first-run artefact": both cases above run from a script against a freshly initialised repository, so re-running reproduces them from nothing
- [x] Create / edit / delete all exercised (whichever the feature has) — the feature's only action is a commit being allowed or refused, and both outcomes are exercised, in the hook above and in the eight unit tests
- [x] Empty state renders sensibly (no rows yet) — `parseNames("{}")` returns an empty map and does not throw; an empty names file against a backlog that has open items then produces ordinary "no name" findings (exit 3), which is the right answer rather than a crash
- [x] Invalid input is rejected with a readable message, not a crash — the central claim. `scripts/check-backlog-waiting.test.mjs` asserts exit **3** for invalid JSON, for a top level that is an array, a string, `null` or a number, and for a name that is not text; and asserts the message says the file *is unusable* and that *nothing at all was verified*, so nobody reads it as the item's fault. The old message said `could not read docs/backlog.md or docs/backlog-names.json`, which also pointed at the wrong file
- [x] Boundary cases checked — the boundary that matters here is **absent versus corrupt**, and both are pinned: a names file that cannot be read at all still exits **1** (a crash the hook allows, so a branch cut before `#bkwai` can still tick its own item), while a present-but-unusable one exits **3**. Also checked that an ordinary finding in the items themselves (a missing `waiting:` tag) still exits 3, so the new names path did not swallow the normal case

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | n/a | n/a: no app surface — a git hook and a repository check script, reachable by no login and served on no route |

- [ ] Every login above tested — n/a: no app surface, no route, no server action, no RPC
- [ ] A login that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page, so no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter users, and this is a developer git hook they never meet
- [ ] Translatable strings go through the translation path — n/a: the only new strings are a hook refusal and a check's console output, both read in a terminal by whoever is committing
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no browser surface
- [ ] Network clean — n/a: nothing here makes a request; the check reads two files and calls `git show`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — read as "the neighbouring checks still work". The `lint` gate runs twenty-odd `check-*.mjs` scripts, among them `check-backlog-sections.mjs` and `check-script-exits.mjs --strict-widened`, which judges the `exit-ok` comment on the very file I edited; the `test` gate runs every `scripts/*.test.mjs`. Both read off the gates block in section 2
- [x] Any shared file touched checked from a second, unrelated place — `scripts/lib/backlog-waiting.mjs` is shared by the check, the reader and the page generator (`#bkwai`). The change is **additive**: `node -e` lists the module's exports as `DECIDERS, STATES, TAG_RE, openItems, parseNames, parseTag, stripTag, validDate` — `parseNames` added and nothing else altered. Rather than reason from that, I ran a consumer: `node scripts/backlog-waiting.mjs` and `node scripts/backlog-waiting.mjs --stale` both still group and list the open items
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, and the ancestry check in section 2 confirms the branch is level with `origin/main` at `fcdb4901e`; the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no item, for the reason in the header and in the decision file
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-23-backlog-names-on-the-backlog-branch.md`: the wedge, why the names file is backlog data rather than code, why a crash and a finding are now separated, and the UTC rough edge left alone on purpose
- [x] `README.md` still accurate — unaffected: it does not describe the backlog branch's file allowance. `CLAUDE.md`'s "The backlog branch" section, which does, is updated in this PR
- [ ] **Release notes.** — n/a: nobody using the app would notice. No shelter user, and no Admin or product administrator, sees anything appear, move or disappear — this changes a local git hook and a repository check script, which only a session committing to the backlog branch ever meets
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Each factual claim was read off the artefact or run, not inferred. That the hook refuses only on exit 3 and allows the rest: the `[ "$rc" -eq 3 ] && return 1` line and the "commit allowed" message in `.githooks/pre-commit`. That the old check waved a corrupt names file through: **run side by side** — the previous version from `HEAD~1` against a `{oh dear` names file exits **1**, the new one exits **3**. That the names file is in every live branch (so nothing is broken by the absent-file path): `git ls-tree` on all three. That `main`'s red had already been fixed elsewhere: `check-backlog-waiting.mjs` run on this branch reports 35 open items, each tagged and named

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing here reaches a deployed build. The hook runs on a developer's machine and the check runs in CI
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this change reads, derives or compares a date. Worth saying plainly though, because the change is **adjacent** to a real timezone fault and does not fix it: `check-backlog-waiting.mjs` compares `since:` against today in **UTC**, so a tag dated by the Thailand clock reads as being in the future until 07:00 local. Untouched here, recorded in the decision file, and the Planner is filing it as its own item
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: not a boundary or banding change in the sense meant here, which is a deploy-time check; this change's one boundary (absent versus corrupt) is asserted from both sides in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block in section 2 is the closing lines of the run as it printed them. An earlier draft of this plan had a gates block written **before** the run; it was refused and rewritten from the real output, which is the fault this line exists to catch
- [ ] Public pages re-checked after a cache purge — n/a: no public page is affected

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's merge commit restores the old hook, the old check and the old `CLAUDE.md` wording in one step. Nothing is deployed and there is no schema, so nothing survives the revert. **What it does not cover:** a commit already made on the `backlog` branch under the new rule. A revert makes the hook refuse the *next* such commit; it does not unpick one already pushed, and if it took the names file back out while the items naming it stayed, `check-backlog-waiting` would go red on `main`. So a revert has to be paired with a look at what the backlog branch has committed since

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | `check-backlog-waiting.mjs` exited **1** on a corrupt `docs/backlog-names.json`, and `.githooks/pre-commit` refuses only on 3 and allows every other non-zero exit — so the commit passed with nothing verified, and the message blamed `docs/backlog.md` as well. The guard failed in the wrong direction, on the one file this change lets onto the branch. Found by reading the hook for the first half of this change; no check reported it | **fixed** in this PR: the read and the parse are separated, a present-but-unusable file exits 3 with a message saying nothing was verified, and `scripts/check-backlog-waiting.test.mjs` pins both halves so a later tidy-up cannot collapse them back into one `try` |
| 2 | Low | `main` was red (`script-integrity`) because `#rlbat`, `#fnbnd` and `#psubp` were filed before `#bkwai` merged and so had no name — the breakage that made this change urgent | **already fixed before this branch existed**, not by me and not in this PR: the names reached `main` in `fcdb4901e` (PR #1842). Verified rather than assumed — `check-backlog-waiting.mjs` on this branch reports *ok — 35 open items, each tagged and named*. So this PR inherits no red and needs no merge-order dance |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That filing a real backlog item now works end to end — add an item with its name on the `backlog` branch and watch the commit be accepted. It could not be checked from here because the real backlog worktree still runs the **old** hook until this merges and the daily sync carries the new one in; the equivalent was proved in a throwaway repository instead (section 4) | `C:\Development\Animal_Shelter_Backlog`, after this merges |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (backlog manager)  Date: 2026-11-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the one row needs the new hook to be in the backlog worktree, which happens when this merges

Manual verification by: pending: filing a real item on the `backlog` branch once this has merged and the sync has carried the new hook into `C:\Development\Animal_Shelter_Backlog`

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 is fixed in this PR, defect 2 is accepted with the evidence that it was already closed on `main`
- [ ] Checklist pasted into the PR — pending: the PR does not exist at this commit
- [x] Handed to the production release manager — n/a as a handover: nothing in this change reaches a deployed build or the production database, and the one outstanding row is a developer check rather than a release one

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this change reaches a deployed build or the production database
