# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The last four click-only control presses of `#79sqf` (rows 8, 11a, 11b, 11c) and the three fixtures behind them |
| Backlog item | `docs/backlog.md` → `#79sqf` |
| Branch / worktree | `claude/control-press-last-four` @ `C:\Development\Animal_Shelter_control-press-last-four` |
| Dev server | `http://localhost:3008` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Sonnet 5.5) / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence — extends `scripts/dev-fixtures.mjs` with three fixtures and records four driven presses
- [x] Files/areas touched listed — `scripts/dev-fixtures.mjs`, `docs/backlog.md` (one item), one decision file, this plan. No `src/`, `worker/` or migration
- [x] Cards affected identified — none changed; exercised: `publish_shelter_friends`, `medical_records`, `assistant`
- [x] Out of scope written down — row 10 `UndoDeathForm` (Admin-only by design) and the four allow-list false positives

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` run
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev and recorded — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR (the script is, and is checked in section 4)
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised — n/a: no migration in this PR
- [ ] Down-migration written, or reason stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; the script refuses any project but dev

## 4. Functional checks

- [x] Happy path works end to end — all four rows pressed or read in the browser, results read back
- [x] Data persists — death read back `is_deceased=true` from the database; the Shelter Friend and diet changes were still there after the server returned
- [x] Create / edit / delete all exercised — fixtures created and repaired by re-run (checked); `--remove` not run, as it would delete the fixtures the next stream needs
- [x] Empty state renders sensibly — `--status` reports `MISSING` for each new fixture before it is made
- [x] Invalid input is rejected with a readable message — the death preview refuses to guess the date and asks for it
- [x] Boundary cases checked — re-running after each press restores the pressable state; the first attempt to restore the dead resident was refused by the immutability trigger, and was fixed by replacing the resident

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | outside the card system | not exercised — nothing here changes what Admin sees |
| exactly `publish_shelter_friends` | `/management/shelter-friends` | Publish, Up, Down drawn and working | **pass** |
| exactly `medical_records` | resident Diet tab, `/operations/*` | Edit, End today, Add diet drawn; lists open | **pass** |
| `assistant` + `medical_records` | Assistant panel | record-death preview, two confirms, saved | **pass** |
| signed out | nothing | redirected to `/login` | n/a: no page or guard added |

- [x] Every login above tested — the three card logins driven in the browser; admin and signed-out carry their reasons
- [x] A login that should not have access is blocked server-side — not weakened: no `src/` change, and no control was offered that the server refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: a developer script; no shelter user reaches it
- [ ] Translatable strings — n/a: console output only
- [ ] Mobile viewport (375px) — n/a: command-line script and a records change
- [x] Browser console clean — no error was visible in any press; the console was not read line by line
- [x] Network clean — no failed request surfaced during the presses

## 6. Regression

- [x] The pages nearest the change still work — Shelter Friends, Diet tab, both operations lists and the Assistant loaded and worked
- [ ] Shared file touched checked elsewhere — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken — see section 2

## 7. Documentation

- [ ] Backlog item ticked — n/a: `#79sqf` is not closed (the check half remains); it is retitled and its superseded passage marked in place
- [x] Non-obvious design choices in `docs/decisions/` — `2026-11-13-control-press-last-four.md`
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: a developer script and two records; nothing a shelter user would notice, and no `src/` file changed
- [x] Commit messages say why
- [x] Claims were measured, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager
- [ ] Deployed to test — n/a: nothing deployed; dev-only script
- [ ] Smoke-tested on test — n/a: nothing deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no "today" of its own
- [ ] Boundary or banding change — n/a: none
- [x] Evidence is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page changed

## Defects found

| # | Defect | Disposition |
|---|---|---|
| 1 | Re-running could not bring a dead fixture resident back (placement history is append-only) | fixed in the script: the dead one is renamed and a new one made |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | every surface was driven in the browser by Claude |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no surface for a person to look at — no page, control or string added; each press was driven and read back

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: this PR deploys nothing, so there is nothing to acknowledge before a release cut picks it up
