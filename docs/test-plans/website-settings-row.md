# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Website tells "nothing set up yet" apart from "the read failed" (#ipf1z part a); part b (create the row) is blocked on a migration and not built |
| Backlog item | `docs/backlog.md` → `#ipf1z` |
| Branch / worktree | `claude/website-settings-row` @ `C:\Development\Animal_Shelter_website-settings-row` |
| Dev server | not started — see §4 |
| PR | see the PR description |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `4b3a5071` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — parts (a) and (c) of the item; (b) is not built and the item's title says so
- [x] Files/areas touched listed — `src/lib/site/content.ts` (new `readSiteContent`; `loadSiteContent` keeps its signature), `src/app/admin/website/page.tsx`, both i18n dictionaries (`nothingSetUp`), a new unit test, a decision file, the backlog title
- [x] Cards affected identified — `website.content` and `website.propose` see the new wording on a missing or failed read; no permission changes. Admin sees it too; the signed-out public is unaffected because every public page still gets `null` as before
- [x] Anything explicitly **out of scope** written down — the create button (needs an insert policy on `site_content`, so a migration, which this batch gives to another stream), and any change to `public_site_content`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 127s
=== gates: lint exited 0 after 368s
=== gates: test exited 0 after 73s
=== gates: build exited 0 after 334s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the row exists on dev (read as service role: `public_site_content` answers 200 with it), and `src/lib/site/content-read.test.mjs` proves the `ok` state returns the content
- [x] Data persists — reload the page and the change is still there — n/a in effect: nothing is written by this change; no reload check run
- [ ] Create / edit / delete all exercised — n/a: the change adds no write; the create control is the unbuilt part (b)
- [x] Empty state renders sensibly (no rows yet) — proved by unit test (`missing` returns no error and no content, and `nothingSetUp` prints); not driven in the browser, because that needs Test's row deleted while an outside tester uses it
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no input; the three read outcomes are the boundary and are all tested

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/website | unchanged; new wording only on a missing or failed read | pending: not driven in a browser |
| exactly `website_propose` | /admin/website draft path | same new wording | pending: not driven in a browser |
| signed out | public pages | unchanged; `loadSiteContent` still returns null on both failures | proved by unit test |

- [ ] Every login above tested — pending: browser run not done; only the unit test ran
- [ ] A login that should not have access is blocked server-side — n/a: access checks are untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new feature to describe; the screen's behaviour on a healthy database is unchanged
- [x] Translatable strings go through the translation path — one new string in both dictionaries; `check-thai-dictionary.mjs` passes. The Thai is a draft, unverified by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: one line of text in an existing layout
- [ ] Browser console clean — n/a: no browser run
- [ ] Network clean — n/a: no browser run

## 6. Regression

- [x] The pages nearest the change still work — `loadSiteContent` is called by about 30 public pages; its signature and its return value are unchanged and the unit test pins both failure cases to `null`
- [ ] Any shared file touched checked from a second page — n/a: `content.ts` is the shared file; its public wrapper is covered by the unit test and by the build, which prerenders pages that call it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — not ticked, because (b) is open; its title now says only (b) is open and that it needs a migration
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-09-website-settings-row-states.md`
- [x] `README.md` still accurate — nothing in it describes this
- [ ] **Release notes.** n/a: part (b), the part that lets an admin recover, is not built, and Test's row was restored by someone else, so no shelter user would see the new wording today
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The missing insert policy was read from every migration that mentions `site_content`; it was not tested against the database, which is why the decision file calls it the reason and the follow-up verifies it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change assertions — n/a: not a boundary change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above is the run's own output
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Contains both a migration and code that reads it — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code-only change; `./scripts/pi/deploy-pi.sh --ref <sha>` reverts it, and nothing in the database changed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | Part (b) cannot be built without an insert policy on `site_content` (a migration) | deferred to backlog: title of `#ipf1z` says so |

## Left for manual verification

| What | Where | Why not done |
|---|---|---|
| Empty-state wording on the real screen | `/admin/website` on a database with no `site_content` row | Needs Test's row deleted while an outside tester uses it; do it on UAT's new project or a scratch database |

---

Automated checks by: Claude  Date: 2026-11-09
Manual verification by: pending: nobody has looked at the new wording on a screen

Result: pass with accepted defects
