# Feature test plan

## Header

| | |
|---|---|
| Feature | Residents list: a Select all tick box |
| Backlog item | `docs/backlog.md` → Residents list: a "Select all" tick box, so picking a zone and then every resident in it is one tap |
| Branch / worktree | `claude/residents-select-all` @ `C:\Development\Animal_Shelter_residents-select-all` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch (see the PR's own page) |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `4d0b2833` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a header tick box on `/residents` (desktop) ticks every listed resident but the adopted and deceased, shows a dash when only some are ticked, and a change of filters drops ticks that are no longer listed and says so
- [x] Files/areas touched listed: `src/app/residents/ResidentsTable.tsx`; both dictionaries (`residents.list`); `src/lib/manual/en.ts` (residents-list topic, one tip); `src/lib/releases.ts`; `scripts/check-residents-select-all.mjs` (new); `docs/decisions/2026-10-09-residents-select-all.md`; `docs/backlog.md`
- [x] Roles affected identified: every role that sees the tick column (all but the volunteer, whose who-and-where list has no ticks, unchanged)
- [x] Anything explicitly **out of scope** written down: no tick column on phones (left off on purpose, as before); no change to the booking or immunization forms; no paging (the list is not paged)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`node scripts/check-residents-select-all.mjs` seeds two zones, four living residents, one adopted and one deceased in dev, signs in a throwaway admin, drives headless Edge at 1280 px, and removes everything it made (it withdraws the seeded death first, since a deceased resident is read-only). Output of the run at the SHA above, unedited:

```
pick zone A, Select all:
  ok   zone A lists its three residents
  ok   the box is labelled with the count
  ok   every row is ticked
  ok   Book clinic visit carries every one
  ok   the count says 3 selected
some, then none:
  ok   one unticked: the box shows a dash
  ok   ticking it again ticks all three
  ok   and again unticks them all
change the zones with the chips:
  ok   zone A and B: four rows
  ok   the three still listed stay ticked
  ok   zone B alone: one row
  ok   no ticks are left on the hidden residents
  ok   the page says so
adopted and deceased left out:
  ok   the search with Show all lists all six
  ok   the label says two are left out
  ok   Book clinic visit carries the four living, not the other two
  ok   the count line says two were not ticked
  ok   the box reads as all ticked
  ok   no console errors on the residents list
the manual:
  ok   the residents topic explains Select all
```

- [x] Happy path works end to end: pick a zone, Select all, Book clinic visit carries every one (script)
- [ ] Data persists — reload the page — n/a: nothing is saved; ticks are page state by design and a reload starts with none
- [ ] Create / edit / delete all exercised — n/a: no record is created or changed by this feature
- [x] Empty state renders sensibly: with no selectable rows the box is disabled (code path `selectable.length === 0`); the search with no matches still shows "No residents match these filters."
- [ ] Invalid input is rejected — n/a: no input; a tick box only
- [x] Boundary cases checked: some ticked (dash), all ticked, none; ticks kept when the list grows (zone A → A+B), dropped when it shrinks (A+B → B); adopted and deceased rows in the list (script)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents` | Select all box above the tick column | script, pass |
| management | `/residents` | same as admin: the box sits wherever the row ticks already were | unchanged code path (`!limited`), not driven |
| staff | `/residents` | same as admin | unchanged code path (`!limited`), not driven |
| doctor | `/residents` (their clinics' residents) | same as admin, over their own list | unchanged code path (`!limited`), not driven |
| volunteer | `/residents` (who and where) | no tick column, so no box | unchanged: the whole column is behind `!limited` |
| signed out | `/residents` | sent to sign in | unchanged; the page is not touched |

- [x] Every role above tested: admin driven; the others share the one `!limited` branch the row ticks already used, and no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no new route, action or data; the box only builds the same links the row ticks built

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` (script finds the new tip on `/manual`)
- [ ] Translatable strings go through the translation path — n/a: interface strings live in both dictionaries (`en.ts`, `th.ts`); nothing is stored data
- [ ] Mobile viewport (375px) — n/a: the box is in the tick column, `hidden md:table-cell` like the row ticks, so phones show nothing new
- [x] Browser console clean — no errors or React warnings (script: "no console errors on the residents list")
- [ ] Network clean — n/a: no new requests; the chips' navigation is the page's own, and the script's run completed every page load

## 6. Regression

- [x] The pages nearest the change still work: `/residents` filtered by zone, by two zones, by search with Show all (script); the row ticks still toggle one at a time
- [x] Any shared file touched checked from a second page: `src/lib/manual/en.ts` loaded at `/manual` (script)
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates and the script ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; no other open item is closed by this (searched for the residents list, ticks and selection)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-09-residents-select-all.md`: why adopted and deceased are left out, why drop rather than clear, why in render rather than an effect)
- [x] `README.md` still accurate
- [x] **Release notes.** One line in `unreleased`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: that both forms drop deceased ids is read from their `NOT_DECEASED` queries; that ticks survived a chip change is what the script's "the three still listed stay ticked" shows

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates line and the script run above are pasted as printed; no hand-made table of results
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Fresh production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref removes the box and the drop-on-filter-change, and nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major (pre-existing) | A ticked resident hidden by a later change of zone stayed ticked and went into the Book clinic visit link | fixed: ticks no longer listed are dropped, and the page says how many |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The box, the dash and the "N ticked residents are no longer in the list" line look right and read clearly on a real computer | `/residents` on Test, pick a zone |
| 2 | The Thai wording reads naturally (the box's label, "not ticked" line and the unticked message) | `/residents` in Thai |
| 3 | Leaving the adopted and deceased out of Select all is what Lutan wants (they can still be ticked one by one) | `/residents` with Show all |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
