# Feature test plan — thai-added-since

## Header

| | |
|---|---|
| Feature | `scripts/list-thai-added.mjs`: a worklist of Thai strings added or changed since a date or commit |
| Backlog item | `docs/backlog.md` → `#y1dqu` (retitled, left open for the cadence) |
| Branch / worktree | `claude/thai-added-since` @ `C:\Development\Animal_Shelter_thai-added-since` |
| Dev server | not started — a script over files, no UI surface |
| PR | pending: number is assigned when the PR opens |
| Tested by / date | Claude / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | `1051863b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a script that lists every Thai string added since a date or commit, English beside Thai, so a reader has a worklist
- [x] Files/areas touched listed — `scripts/list-thai-added.mjs`, `scripts/list-thai-added.test.mjs`, `docs/decisions/2026-11-10-thai-added-since.md`, `docs/backlog.md` (retitle only), this plan
- [x] Cards affected identified — none: no card, page or permission is touched; admin and the signed-out public see no change
- [x] Anything explicitly **out of scope** written down — the cadence and handing-over, translating anything, the dictionaries and `check-thai-dictionary.mjs` (all read, none changed)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code 0. Output redirected to a file and read:

```
=== gates: typecheck exited 0 after 111s
=== gates: lint exited 0 after 287s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 281s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, the script touches no database
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/list-thai-added.mjs 2026-11-01` ran against the live dictionaries and wrote a readable markdown worklist (English beside Thai, grouped by kind then area)
- [ ] Data persists — n/a: the script reads files and writes only a file the caller names
- [ ] Create / edit / delete all exercised — n/a: nothing is created, edited or deleted in the app
- [x] Empty state renders sensibly — unit test: an empty list prints "Nothing to read."
- [x] Invalid input is rejected with a readable message, not a crash — no start point prints the usage line and exits 2
- [x] Boundary cases checked — unit tests on fixtures: new key, English-only change, Thai change, unchanged, dash-only English, missing Thai, templated entries, empty base

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: no UI, no route | nothing | not applicable | n/a |

- [ ] Every login above tested — n/a: no page or route to reach
- [ ] A login that should not have access is blocked server-side — n/a: no page or route; the script runs on a developer machine

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings go through the translation path — n/a: the script adds no app wording
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — n/a in effect: no app file changed; the full `npm test` (638 tests) and the build passed
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched; `docs/backlog.md` changed in one line
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item `#y1dqu` retitled on this branch (deliberately not ticked: the cadence and the ask are still a person's)
- [x] Design choices added in `docs/decisions/2026-11-10-thai-added-since.md`
- [ ] `README.md` still accurate — n/a: README does not list scripts at this level
- [ ] **Release notes.** — n/a: a developer script; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the counts in the PR body are the script's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the script handles dates only as git `--before` text and no app logic derives "today"
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager, for deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Production Supabase ref line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a script not used at runtime; reverting the commit removes it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First draft read `--count` as having no start point when the date was the first argument; found by running it, fixed before commit | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A Thai reader finds the worklist's layout usable (English beside Thai, grouped) | the markdown the script writes |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: a Thai reader opening the worklist

Manual verification by: pending: a Thai reader looking at the worklist layout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy; it merges with the next release

Result: pass

Release manager acknowledgement: pending: next release
