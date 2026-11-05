# Feature test plan — release-0-43-0-fixes

## Header

| | |
|---|---|
| Feature | Three 0.43.0 faults: Who does what server error, adoption-update Publish saving nothing, no menu way in to the approval page |
| Backlog item | `docs/backlog.md` → kx8mg, kg6t6, sadb0 (all ticked) |
| Branch / worktree | `claude/release-0-43-0-fixes` @ `C:\Development\Animal_Shelter_release-0-43-0-fixes` |
| Dev server | not started — checked by gates, a dev round-trip script and source reading |
| PR | pending |
| Tested by / date | Claude / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | `30012ea1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a label passed as a template string, three columns added to the adoption-update write, and a menu entry gated on photos.approve or website.approve
- [x] Files/areas touched listed — `CreateRoleForm.tsx`, `en.ts`, `th.ts`, `adoption-updates/actions.ts`, `NavLinks.tsx`, `NavPane.tsx`, `hub-icons.ts`, `releases.ts`, `scripts/check-adoption-publish-roundtrip.mjs`
- [x] Cards affected identified — `adoption_news` (publish now saves), `approve_photos` and `approve_website` (menu entry); Admin gets the entry through the isAdmin short-circuit; signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — the other pages reachable only by a card tile are listed in the decision file, not fixed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `docs/backlog.md` (the kx8mg item was reworded on main) resolved by hand
- [x] `node scripts/gates.mjs` ends with the four exit codes:

```
=== gates: typecheck exited 0 after 68s
=== gates: lint exited 0 after 188s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 247s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-adoption-publish-roundtrip.mjs` inserted an adoption update with share_publicly true, a story and the first name Susan on dev, read all three back, and rolled back; it also asserts the action's row names all three columns
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the round-trip script writes then reads the three publish values; the menu and label changes are covered by typecheck and build
- [ ] Data persists — n/a: persistence asserted by the round-trip script; no browser pass was driven
- [ ] Create / edit / delete all exercised — n/a: only the save write path changed
- [ ] Empty state renders sensibly — n/a: no list or empty state changed
- [x] Invalid input is rejected with a readable message — the existing story-required and one-word first-name errors are untouched; the first-name test now means whitespace
- [ ] Boundary cases checked — n/a: the 40-character limit is unchanged and not re-exercised

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | menu entry Photos to approve | shown, no card held | not driven: read from the can.ts short-circuit |
| exactly `approve_photos` or `approve_website` | menu entry | shown | not driven: read from the can() condition |
| exactly `adoption_news` | menu entry | not shown | not driven: read from the can() condition |
| signed out | menu | no menu | unchanged |

- [ ] Every login above tested — n/a: not driven in a browser; see Left for manual verification
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed, the page still asks photos.approve

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — one entry added, gated on canApprove from NavPane
- [ ] Manual updated — n/a: no workflow the manual describes changed
- [ ] Translatable strings checked at `/management/translations` — n/a: the Thai label is a changed string in th.ts, and the menu reuses the existing photoApproval.title
- [ ] Mobile viewport (375px) — n/a: one extra menu link, no new layout
- [ ] Browser console clean — n/a: no browser pass
- [ ] Network clean — n/a: no browser pass

## 6. Regression

- [x] The pages nearest the change still work — typecheck, lint, the test suite and a production build all passed
- [ ] Shared file touched checked from a second page — n/a: NavLinks was not loaded in a browser; the build compiled every page that renders it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates ran after the merge

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-05-release-0-43-0-fixes.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` has three new lines, one each for the Who does what fix (admin), the adoption publish fix (adoption_news card) and the approval menu entry (approve cards). None is live until the Pi is deployed, which is Lutan's step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the missing writes were found by reading the action; the round trip was run; the other card-only pages were listed from routes.ts and NOT opened one by one

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: Lutan at the Pi deploy
- [ ] Deployed SHA matches the tested SHA — deferred: Lutan at the Pi deploy

### On the deployed build

- [ ] Deployed to test — deferred: Lutan
- [ ] Smoke-tested on test.lannacare.org — deferred: Lutan, as an Admin who has entered the authenticator code (see manual table)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is unedited
- [ ] Public pages re-checked — n/a: the public views and their queries are unchanged

### Deploy safety

- [ ] Production project ref read — deferred: Lutan at the Pi deploy
- [ ] strip-baked-env seen — deferred: Lutan at the Pi deploy
- [ ] New secret or env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: Lutan; nothing here touches the schema, so `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi reverts it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | The first-name check used the letter s, refusing names such as Susan | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As an Admin who has entered the authenticator code, open Settings → Who does what: the page loads and the Create a role box types a short name | test.lannacare.org after deploy |
| 2 | Admin sees Photos to approve in the menu and it opens | test.lannacare.org after deploy |
| 3 | On an adopted resident, tick Publish with a story and first name, save, and it still shows as published | test.lannacare.org after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1–3 are for after the deploy, so this stays unticked

Manual verification by: pending: the three checks above on the deployed build

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet

Result: pass

Release manager acknowledgement: pending
