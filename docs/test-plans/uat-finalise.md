# Test plan: uat-finalise

---

## Header

| | |
|---|---|
| Feature | uat-finalise |
| Backlog item | `docs/backlog.md` → #uat7p, #u7d3b, #rqv5c, #uq4vz (retitled, none ticked) |
| Branch / worktree | `claude/uat-finalise` @ `C:\Development\Animal_Shelter_uat-finalise` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one runbook of every remaining UAT step in order, a read-only preflight for UAT's configuration, and the backlog retitled to point at it
- [x] Files/areas touched listed: `docs/uat-finalisation.md`, `docs/pi-hosting.md`, `docs/backlog.md`, `docs/decisions/2026-11-08-uat-finalisation-runbook.md`, `scripts/check-uat-ready.mjs`, `scripts/lib/uat-ready.mjs`, `scripts/check-uat-ready.test.mjs`. No routes, no `worker/`, no migrations
- [x] Cards affected identified: none. No page, action or permission changed; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down: every step marked Lutan's, `.env.deploy.uat` (not read or edited), production anything, `#w4k9n`, `#ao0jk`, `#mc6fu`, and the move of production to the shelter's Google account

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict, in `docs/backlog.md` on the `#rqv5c`/`#uq4vz`/`#xkfsv` lines, resolved by keeping this branch's two retitles and upstream's `#xkfsv`
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 62s
=== gates: lint exited 0 after 151s
=== gates: test exited 0 after 29s
=== gates: build exited 0 after 255s
gates: typecheck=0 lint=0 test=0 build=0
```

(Run at the merge commit, before the decision file and this plan were added; both are documents only.)

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `check-uat-ready.test.mjs` passes (9 tests): a correct fixture has no failures
- [ ] Data persists — n/a: the script is read-only and writes nothing
- [ ] Create / edit / delete all exercised — n/a: the script is read-only and writes nothing
- [x] Empty state renders sensibly: with no `.env.deploy.uat` (this worktree) the script prints that there is nothing to check and says to run it in the main checkout, exit 0 rather than a crash (run, output read)
- [x] Invalid input is rejected with a readable message, not a crash: fixtures for a missing key, a dev project URL, a Drive root equal to production's or Test's, either calendar key, a differing or absent `ORIGIN_KEY`, and an absent Supabase token each fail with a named reason
- [x] Boundary cases checked: an empty-string calendar key still fails, a shell-exported `SUPABASE_ACCESS_TOKEN` warns, and a fixture asserts no secret value (token, origin key, drive root, actions key) appears anywhere in the output

### Role access matrix

Nothing here is reachable by a login: a dev-machine script and documents. The one browser pass (section 5) used a disposable admin login to look at existing pages and changed nothing.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | existing pages only, unchanged | unchanged | n/a: no access rule touched |
| signed out | n/a | n/a | n/a: nothing added |

- [ ] Every login above tested — n/a: no access rule or page was added or changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule or page was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport (375px) — n/a: no UI added
- [x] Browser console clean — no errors seen on the pages visited for the colour pass; the pane's `requestAnimationFrame` never fired until a screenshot woke it, the known pane artefact (`CLAUDE.md`), so every page was reached by clicking through
- [x] Network clean — the dev server returned 200 on `/my`, `/residents`, `/admin` and `/admin/blood-test-types`

### The `#uq4vz` colour pass, and what it does NOT prove

**`data-env="uat"` was SET BY HAND on `<html>`, because a plain dev server resolves `getAppEnv()` to `dev` (the header badge read DEV throughout). So this does NOT prove that `getAppEnv()` resolves to `uat` on a real build.** That half stays open on `#uq4vz`, retitled, until a real UAT build exists (step 5 of `docs/uat-finalisation.md`).

- [x] A signed-in app page seen under all four themes with the attribute hand-set, tokens read back from the page: dark `--background #0e1220`, `--primary #7c8cff` (UAT indigo); light `#f4f4f5`, `#a84a07`; high contrast `#000`, `#b3ff1a`; magenta `#121212`, `#e033ff`. **Only the default dark theme shows UAT's indigo; the other three redefine the same tokens later and win**, so on those UAT is told apart by the header's fixed strip and badge. That is the documented design, not a fault
- [x] A real Delete button (`/admin/blood-test-types`, "Delete: Blood Chemistry Panel") and an error message (`text-danger`) both resolve to `--danger` under all four themes with the attribute set: `#ff453a` dark and magenta, `#c0261a` light, `#ff7b72` high contrast. Transitions were switched off for the read, since a button's colour otherwise reads mid-transition. The error message used was an injected `<p class="text-sm text-danger">`, the app's own class; I did not trigger a real server error
- Screenshots in the pane lag by one frame after an attribute change, so the dark-theme indigo was confirmed on a second screenshot

## 6. Regression

- [x] The pages nearest the change still work: nothing in `src/` was edited; `/my`, `/residents`, `/admin` and `/admin/blood-test-types` loaded
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the only conflict was in `docs/backlog.md`, resolved by hand and re-checked with `check-backlog-sections.mjs` and `check-backlog-ids.mjs`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: nothing is done; the four items are retitled and each stays open on purpose, so ticking would be the false assurance `#uq4vz` was filed to prevent
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-uat-finalisation-runbook.md`
- [x] `README.md` still accurate: untouched, and nothing it says changed
- [ ] **Release notes.** n/a: nothing here changes what a shelter user sees, and the runbook describes steps that have not happened yet, so a note would promise something waiting on a manual step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**, except where marked. Measured: the token readings, the script's tests, the key names. **Reasoned, and said so in the list:** that the restore needs only UAT's own connection string so the two Supabase accounts should not matter for it

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the release this lands in
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the release this lands in
- [ ] Deployed to test: `npm run deploy:test` — n/a: no code that ships; only documents and a dev-machine script
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no banding or threshold change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates block, which is the tool's own output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable
- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deployed; reverting the PR removes a document and an unused script

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `drive-copy-tree.mjs` makes a new root at the top of My Drive instead of filling UAT's empty root | deferred to backlog: carried on `#rqv5c` and in `docs/uat-finalisation.md` step 6; Lutan's step |
| 2 | low | Only the default dark theme shows UAT's indigo | accepted: by design, recorded on `#uq4vz` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose. Lutan's own steps are the content of `docs/uat-finalisation.md`, not verification of this PR.)

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-08

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no user-facing surface changed and the manual list is empty

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — n/a: documents and a dev-machine script only, nothing in the release

Result: pass

Release manager acknowledgement: pending: at the release this lands in
