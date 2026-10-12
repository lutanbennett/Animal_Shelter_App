# Test plan — search-path-pin

| | |
|---|---|
| Feature | No change built: the `search_path` item was measured and found already true. This PR records the measurement and ticks the item |
| Backlog item | `docs/backlog.md` → **Pin `search_path` on every `security definer` function** (review S7), moved to Completed → Security in this PR |
| Branch / worktree | `claude/search-path-pin` @ `C:\Development\Animal_Shelter_search-path-pin` |
| Dev server | not started — no runtime surface |
| PR | #560 |
| Tested by / date | Claude (Daily Planner session), 2026-10-12 |
| Carries a migration? | no — **`0188` is deliberately NOT taken and stays free** |
| Tested at SHA | `4b2d1a29` |

## 1. Scope and risk

- [x] Change is described in one sentence: a decision file and a backlog tick recording that all 57 `security definer` functions on dev already pin `search_path`, so the planned migration was not written
- [x] Files touched: `docs/decisions/2026-10-12-search-path-already-pinned.md` (new), `docs/backlog.md` (item ticked and moved), this plan. No code, no migration
- [x] Roles affected: none — no behaviour changes anywhere
- [x] Out of scope, written down: **no migration `0188`**; no change to `scripts/check-migration-grants.mjs`, whose existing check at line 261 already enforces this; **production was not read** and is recorded as a release-manager check

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — pasted below, unedited
- [ ] CI green on the PR. `n/a: not yet — the PR does not exist at this commit`

```
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number one above the highest on `main` — `n/a: no migration written; 0188 stays free`
- [ ] `--status` reviewed — `n/a: no migration`
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to dev — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration, and no row or column is touched`
- [x] **Constraints exercised against real rows** — the measurement *is* the database check, and it was run against dev rather than reasoned from files: `select n.nspname, p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.prosecdef and n.nspname in ('public','private')` returned **57 definer functions, 57 pinned, 0 unpinned** (40 `search_path=public`, 17 `search_path=""`). Read-only; nothing was written or rolled back because nothing was changed
- [ ] Down-migration written — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: nothing to apply`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the PR is two documentation files`
- [ ] Data persists — `n/a: no data written`
- [ ] Create / edit / delete exercised — `n/a: no CRUD`
- [ ] Empty state renders sensibly — `n/a: nothing renders`
- [ ] Invalid input rejected readably — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no values`

### Role access matrix

- [ ] Every role tested — `n/a: no behaviour changes for any role; the functions are unchanged`
- [ ] A role that should not have access is blocked server-side — `n/a: nothing reachable changed`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: nothing a shelter user does has changed`
- [ ] Translatable strings — `n/a: no user-facing strings`
- [ ] Mobile viewport 375px — `n/a: nothing renders`
- [ ] Browser console clean — `n/a: nothing renders`
- [ ] Network clean — `n/a: no requests`

## 6. Regression

- [x] The pages nearest the change still work: none exist; `gates.mjs` builds the whole app and reports `build=0` with these files present
- [x] Any shared file touched, checked from a second place — **`scripts/check-migration-grants.mjs` was not edited but was run**, because its existing rule is the item's proposed gate: `migration grants: ok (110 file(s) checked)`. It is wired into `npm run lint`, so CI exercises it on every PR
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked **on this branch** and moved to Completed → Security, with the measurement in the note
- [x] Non-obvious finding recorded as `docs/decisions/2026-10-12-search-path-already-pinned.md`
- [x] `README.md` still accurate — it does not describe `search_path` pinning
- [ ] **Release notes.** `n/a: nothing changed. No function, screen, permission or script behaves differently — this PR records that work believed outstanding was already done`
- [x] Commit messages say why, not just what — the commit states the measurement and why the file counts disagreed with it
- [x] **Claims were measured, not reasoned** — this is the whole PR. The 57/57 figure is a live query, not a grep; the 173/165/179 file counts are quoted from the greps that produced them; and the existing gate was *run*, not read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — `n/a: no dates or clocks in this change`
- [ ] Boundary or banding assertions cover both edges — `n/a: no threshold or band`
- [ ] Evidence pasted is the tool's actual output, unedited — deferred: production release manager
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] Supabase project ref line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — `n/a: this PR adds no secret or env var`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Backup exists and is fresh — `n/a: no migration`
- [ ] Apply plan stated — `n/a: nothing to apply`

### Rollback

- [x] Rollback position stated, including what it does not cover: reverting this commit restores the backlog item to open and removes the decision file. Nothing else is affected, because no code, schema or deployed artifact changed. **What it does not cover:** it would not undo the finding — the functions were already pinned before this branch existed

## Defects found

None. The absence of a defect *is* the finding.

## Left for manual verification

| what | who | why it needs a person |
|---|---|---|
| Run the same `pg_proc` query against **production** and confirm 0 unpinned there too | production release manager, before the next deploy | These sessions cannot read production. If production is behind on migrations it may still hold an older, unpinned body that dev has since replaced. The query is read-only and takes a minute. Recorded in the decision file, deliberately not left as an open backlog item, because there is no work to do unless it comes back dirty |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is not empty, so only the person who looked may tick this — `n/a: the one item is a production read, which no session can perform and which is owed before the next deploy, not before this merge`

Manual verification by: pending: the same query run against production by the release manager before the next deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — the production query is in the table above

Result: pass
