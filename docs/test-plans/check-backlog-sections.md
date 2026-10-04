# Feature test plan

## Header

| | |
|---|---|
| Feature | `check-backlog-sections.mjs`: fail CI when an unticked backlog item is filed below `## Completed` |
| Backlog item | none — raised in chat 2026-10-04 after the fourth occurrence; see Scope |
| Branch / worktree | `claude/check-backlog-sections` @ `C:\Development\Animal_Shelter_check-backlog-sections` |
| Dev server | not started — a script and a `package.json` line, no app surface |
| PR | (filled on push) |
| Tested by / date | Claude Opus 5 / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | (tip of this branch) |

## 1. Scope and risk

- [x] Change is described in one sentence — `npm run lint` now fails if an unticked `- [ ]` item sits below the `## Completed` heading in `docs/backlog.md`, where every session's reading convention cannot see it
- [x] Files/areas touched listed — `scripts/check-backlog-sections.mjs` (new) and `package.json` (`lint` script). No app code, no routes, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified — none; nothing in the app changes for any role
- [x] Anything explicitly **out of scope** written down — see below

**Out of scope, deliberately:** a ticked item *above* the heading is **not** flagged. 133 of them live there, because items are ticked in place in their own section and only some are moved down; that is the house style, and a check that failed on it would be wrong 133 times. This was the second rule originally proposed, and measuring the file is what killed it.

Also out of scope: fixing the items themselves (four were moved on 2026-10-03 and 2026-10-04), and any similar convention in other docs.

**Why there is no backlog item:** it was raised in chat and built the same hour. The four occurrences it guards against are recorded in the commits that moved them (`be288b8`, `db9daa2b`).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch created from `origin/main` at `77b04c3f` this session; nothing merged since
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 165s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-backlog-sections.mjs` against the real `docs/backlog.md` prints `ok — 85 open items, all above ## Completed` and exits 0; `npm run lint` runs it last and passes
- [ ] Data persists — n/a: a check script holds no state
- [ ] Create / edit / delete all exercised — n/a: no CRUD
- [x] Empty state renders sensibly — a file with a `## Completed` heading and no items below it passes (fixture 1)
- [x] Invalid input is rejected with a readable message, not a crash — all four failure modes exit 1 with a message naming the line, the item's title and what to do; see below
- [x] Boundary cases checked — a file with **no** `## Completed` heading, and the sub-item case (`  - [ ]`, indented) which is a different rule from the top-level one

**The check must be able to fail, so it was made to.** Five fixtures, each run against a temporary file via the optional path argument:

| # | Fixture | Expected | Result |
|---|---|---|---|
| 1 | Clean: one open item above, one ticked below | exit 0 | `ok — 1 open items` |
| 2 | An open `- [ ]` **below** `## Completed` | exit 1, names it | `line 8: open item below ## Completed … "The lost one."` |
| 3 | An indented open `  - [ ]` below | exit 1, distinct message | `line 8: open sub-item below ## Completed … "A stranded sub-item."` |
| 4 | `- [X]` (capital X) | exit 1 | `line 8: checkbox is neither - [ ] nor - [x]` |
| 5 | No `## Completed` heading at all | exit 1 | `no ## Completed heading — every item reads as open` |

Fixture 2 is the real case: it is the shape of all four items that escaped.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | unchanged | unchanged |
| management | — | unchanged | unchanged |
| staff | — | unchanged | unchanged |
| vet | — | unchanged | unchanged |
| volunteer | — | unchanged | unchanged |
| signed out | — | unchanged | unchanged |

- [ ] Every role above tested — n/a: a build-time check; no runtime surface and no role sees it
- [ ] A role that should not have access is blocked server-side — n/a: no new surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual describes the app for shelter users; this is a developer check
- [ ] Translatable strings go through the translation path — n/a: developer-facing output, English only, as the other `check-*` scripts are
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — n/a in the usual sense (no pages), but the `build` gate exercises the whole app and exits 0
- [x] Any shared file touched checked from a second, unrelated page — `package.json`'s `lint` is shared by every stream and by CI. Checked by **running** `npm run lint` end to end, not by reading the diff: all four pre-existing checks still run and report (`acceptance-matrix: ok — 68 manual topics → 96 activities`), and the new one is appended last so a failure in it cannot mask an earlier one
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; branch is a direct descendant of `origin/main` at `77b04c3f`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item; raised in chat and built the same hour
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-04-backlog-sections-check.md`, recording why the mirror rule (ticked above the heading) is deliberately absent
- [x] `README.md` still accurate — unchanged; it does not enumerate the `check-*` scripts
- [ ] **Release notes.** — n/a: a developer check that runs in CI; no shelter user has any way to notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "133 ticked items above the heading" figure that killed the second rule was counted from the file, not estimated; the five failure modes were executed rather than argued; and the `ok` line's count (85) comes from the script itself

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: a build-time check; `scripts/` is not in the deployed bundle
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changes
- [ ] Timezone-sensitive behaviour proved — n/a: no dates or clocks involved
- [ ] Boundary or banding change covers both edges — n/a: no threshold logic. The nearest thing — above versus below the heading — is covered by fixtures 1 and 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block and every Result cell above are the scripts' own output
- [ ] Public pages re-checked after a cache purge — n/a: no pages changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes the script and the `lint` entry, and nothing else depends on either. It does **not** un-move the four items that were already relocated (`be288b8`, `db9daa2b`), which were separate commits and should stay. The only risk this adds is a new way for `lint` to fail; it is appended last, so an earlier check's failure still surfaces first

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The error header printed `docs/backlog.md` even when the script was given a different path, so a fixture run reported the wrong filename | fixed before commit — it now prints the path it actually read |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty: every claim here was executed. The script was run against the real
backlog and against five fixtures, and `npm run lint` and `node scripts/gates.mjs`
were both run to completion in this worktree.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: a developer check with no runtime surface; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: linked from the PR body, as the file is on the branch
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: after merge
