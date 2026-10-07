# Feature test plan

## Header

| | |
|---|---|
| Feature | Home page impact band: drop "About" and the estimate note |
| Backlog item | `docs/backlog.md` → Home page impact band: drop the word "About" in front of the backfilled figures, and the estimate note under them |
| Branch / worktree | `claude/impact-band-about` @ `C:\Development\Animal_Shelter_impact-band-about` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | af774e59 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the home page's impact figures show the plain number, with no "About"/"ประมาณ" in front and no estimate note under the band, and the Settings hint and manual stop promising the page explains the estimate
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/page.tsx`, `src/lib/site/impact.ts`, both dictionaries (`home.stats` and the Settings → Website impact-figures hint), `src/lib/manual/en.ts` (Website topic), `src/lib/releases.ts`, docs
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — signed-out public sees the band; Admin sees the reworded hint on Settings → Website
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the baselines, their dates and how totals are counted are unchanged; who may edit the figures (Management) is a separate open item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 219s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: home page at 375 px against dev, English band reads 89 / 5 / 2 / 8 / 451 Animals rehomed / 300 Sterilisations in local villages, no "About", no note under the band
- [x] Data persists — reload the page and the change is still there (reloaded, then switched to ไทย and back)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: display-only change; the editor's save path is untouched
- [ ] Empty state renders sensibly (no rows yet) — n/a: the band's empty handling (`stats.length > 0`) is unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input on this surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: only a prefix and a note were removed; values render as before

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: access unchanged | n/a | n/a |
| management | n/a: access unchanged | n/a | n/a |
| staff | n/a: access unchanged | n/a | n/a |
| vet | n/a: access unchanged | n/a | n/a |
| volunteer | n/a: access unchanged | n/a | n/a |
| signed out | home page | band without "About" or note | pass (EN and TH, 375 px) |

- [ ] Every role above tested — n/a: no access rule changed; only the public band was looked at
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: nav not touched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — Website topic's Impact figures paragraph reworded; checked by reading the string, the /manual page needs a sign-in
- [x] Translatable strings go through the translation path, checked at `/management/translations` — strings removed from and reworded in both dictionaries; grep finds no remaining `stats.about`, `estimateNote` or `approximate` reader
- [x] Mobile viewport (375px) — no overflow, controls reachable: horizontal overflow 0 in English and Thai, screenshots taken
- [x] Browser console clean — no errors or React warnings
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no request changed; the page reads the same two views as before

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): home page in English and Thai; Shelter Friends strip below the band renders as before
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: the manual edit is one sentence inside a string and /manual needs a sign-in; typecheck and build cover the dictionary shape
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync brought a migration and a test plan only; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `2026-10-07-impact-band-plain-figures.md`, with superseded notes added to the two earlier impact-figure files
- [x] `README.md` still accurate
- [x] **Release notes.** One line added to `unreleased`, written for a visitor
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "No other reader of `approximate`" was checked by grep across `src`, `scripts` and `worker`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here depends on the date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates line in section 2, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan: the band reads the way you wanted — "451 Animals rehomed" with nothing in front and no note under the band, in English and ไทย, on your phone | home page |
| 2 | The reworded hint under Impact figures reads right (Claude could not sign in to look) | Settings → Website → Home page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items wait for Lutan

Manual verification by: pending: Lutan to confirm the band and the Settings hint (items 1 and 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — happens at the next release cut

Result: pass

Release manager acknowledgement: pending: at release  Date: —
