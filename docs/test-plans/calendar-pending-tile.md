# Feature test plan — calendar-pending-tile

## Header

| | |
|---|---|
| Feature | System status calendar tile names the waiting visits, shows their errors, says when the 15-minute sweep has gone quiet; two read-only production checks |
| Backlog item | `docs/backlog.md` → **BUG (production): System status → Shelter calendar says "6 vet visit(s) still waiting"** (ticked) |
| Branch / worktree | `claude/calendar-pending-tile` @ `C:\Development\Animal_Shelter_calendar-pending-tile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | filled in when opened |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | `6303fda3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the tile lists the visits it counts with their last error and flags a silent sweep; cause established from production (the Worker cron stopped 2026-10-23 10:00 UTC)
- [x] Files/areas touched listed — `src/lib/clinics/calendar-sync.ts`, `calendar-quiet.ts` (+test), `src/app/admin/status/page.tsx`, both i18n dictionaries, `scripts/lib/readonly-checks.mjs`, backlog, decision file, this plan
- [x] Roles affected identified — admin only (System status); no permission, card or policy touched
- [x] Anything explicitly **out of scope** written down — restoring the production cron (Lutan, Cloudflare; filed as its own backlog item); manual topic (owned by `claude/manual-by-card`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (first attempt refused for an uncommitted backlog edit; committed, rerun clean)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines, as printed:

```
=== gates: build exited 0 after 102s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev, with seeded visits (pending, failing, past) the tile listed all three with dates, resident and links; the errored one showed its error and turned the tile red
- [ ] Data persists — n/a: the tile reads, it writes nothing
- [ ] Create / edit / delete all exercised — n/a: read-only tile
- [x] Empty state renders sensibly — with no waiting visits `calendar-pending` prints "No vet visit is waiting" on dev, and the tile shows the connected line
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — `calendar-quiet.test.mjs`: never run, exactly 45 min, 45 min + 1 s, the real production timestamp, an unreadable timestamp

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/status | tile shown | driven on dev, screenshots taken |
| management | n/a | unchanged | n/a: no access rule touched |
| staff | n/a | unchanged | n/a: no access rule touched |
| doctor | n/a | unchanged | n/a: no access rule touched |
| volunteer | n/a | unchanged | n/a: no access rule touched |
| signed out | n/a | unchanged | n/a: no access rule touched |

- [ ] Every role above tested — n/a: the page's gate is unchanged; only the admin tile's content changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: `src/lib/manual/` belongs to `claude/manual-by-card`; no topic describes this tile's wording
- [x] Translatable strings go through the dictionaries — `failing`, `past`, `lastError`, `sweepQuiet`, `sweepNever` added to en and th (the Thai wording is mine and unreviewed)
- [ ] Mobile viewport (375px) — n/a: not driven; the list uses the tile's existing wrapping classes
- [x] Browser console clean — no errors read during the dev drive
- [ ] Network clean — n/a: server-rendered page, no client requests of its own

## 6. Regression

- [x] The pages nearest the change still work — /admin/status loaded in full with every other tile
- [x] Any shared file touched checked from a second page — dictionaries and `calendar-sync.ts` are shared; the build and typecheck compile every reader, and `checkCalendar` has one caller
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the cron follow-up is on the `backlog` branch. Searched for `calendar`: the items at lines 110 (Pi holds the four calendar settings) and 519 (Director's hand-typed copies) are not closed by this
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-calendar-tile-honest.md`
- [x] `README.md` still accurate — it does not describe this tile
- [ ] **Release notes.** — n/a: the new tile wording reaches admins only after the production Worker deploy, and the cron it reports on is still stopped; the note goes in the PR that closes those steps
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the cause comes from production output of `calendar-pending` and `calendar-cron`, not from reading code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the only clock logic is an elapsed-time comparison in milliseconds; dates shown go through the existing `formatDate`
- [ ] **Boundary or banding change** — n/a: the 45-minute limit's two edges are asserted in the unit test (section 4)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates lines above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — Pi `--ref <previous sha>` reverts the tile; nothing in the database changed, so nothing else needs reverting

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Production's 15-minute cron stopped 2026-10-23 10:00 UTC (calendar sweep, alert mail, translations) | deferred to backlog — filed as its own item; Lutan is checking Cloudflare |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the cron is restored: `calendar-cron` shows a recent last run and `calendar-pending` reaches zero; the tile goes green | production, from the main checkout |
| 2 | The tile wording reads well, including the Thai | /admin/status on production after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, the two rows above are for a person and are pending on the signature line below

Manual verification by: pending: the two rows above need Lutan after the cron fix and the production deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over through the PR

Result: pass with accepted defects

Release manager acknowledgement: pending
