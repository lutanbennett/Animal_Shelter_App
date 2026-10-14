# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site trust copy: the Donate promise narrowed to what `/donate` delivers, a live 0 or 1 left off the impact band with the totals first, and a "Help us do more of this" line on every story and under the Our work list |
| Backlog item | `docs/backlog.md` → **Until sponsorship exists, promise what the Donate page delivers**, **Impact band: hide a live tile whose number is 0 or 1, and lead with the totals**, **A "Help us do more of this" line at the end of every story and under the Our work list** (all three ticked here); **Add "since <year>" to the baseline figures** deliberately not built (needs a column — see the decision file) |
| Branch / worktree | `claude/public-site-trust-copy` @ `C:\Development\Animal_Shelter_public-site-trust-copy` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #608 |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `a5227465` (the code commit; the commits after it are docs and this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the public site stops promising monthly giving and sponsorship it cannot deliver, stops printing a today's-count of 0 or 1 on the impact band (totals first), and gives every story a one-line Donate call — three of the four review items in the brief; the fourth needs schema and is left open with a note
- [x] Files/areas touched listed: `src/lib/i18n/dictionaries/en.ts` and `th.ts` (renamed/reworded strings under `home`, `nav`, `adopt.profile`, `ourWork`); `src/app/page.tsx` (hero button, help card, band order); `src/app/adopt/PublicHeader.tsx` (menu entry); `src/app/adopt/[id]/page.tsx` (care section); `src/lib/site/impact.ts` (`LIVE_TILE_MIN`, filter); `src/app/our-work/HelpUsDoMore.tsx` (new), `src/app/our-work/page.tsx`, `src/app/our-work/[id]/page.tsx`; `src/lib/releases.ts`; `docs/backlog.md`; `docs/decisions/2026-10-14-public-site-trust-copy.md`
- [x] Roles affected identified: signed-out public only. No admin page, no `worker/`, no schema, no permission changes
- [x] Anything explicitly **out of scope** written down: the §5.6 "since <year>" label (needs a `*-schema` PR and the Director's year); §6.1's DonorBox monthly link, after which "Give monthly" can return; the sponsorship item itself; `/donate` taking money. All referenced in the decision file, none built

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date; nothing landed on `main` since the branch was cut)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: typecheck exited 0 after 10s
=== gates: lint exited 0 after 118s
=== gates: test exited 0 after 3s
=== gates: build exited 0 after 163s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the band reads the same two views as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on dev, `/` shows the band as Animals rehomed 451 · Sterilisations 300 · in care 78 · adopted this year 5 · foster 2 · treatment 8 (totals first, six tiles as the brief predicted for dev); the hero's second button reads "Help feed them" → `/donate#ways-to-give`; the home card and the Get involved menu read "Help with their care" → `/donate`; `/adopt/<Markey>` reads "Can't adopt?" / "A gift towards Markey's food and care helps →" → `/donate`; `/our-work` ends with "Help us do more of this — … Donate →" and so does the story page, inside the article (read with `fetch` + DOMParser and by `find` on the rendered page)
- [x] Data persists — reload the page and the change is still there: nothing is written; the strings are in the bundle and the band is computed on every read
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has no create, edit or delete
- [x] Empty state renders sensibly (no rows yet): `/our-work` with no stories keeps its existing "No stories have been published yet" text and does not show the give line (`!error && shown.length > 0`); the band section already disappears when there are no stats at all (`stats.length > 0`), unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the filter is `value >= 2`, so 0 and 1 are dropped and 2 kept — dev's foster count is exactly 2 and shows, which is the kept edge; a baseline figure of 0 or 1 would still show because the rule is only in `impactStats()` (read, not observed — no baseline on dev is that low); the Thai animal line with a Latin name ("… ของ Markey ช่วยได้") reads correctly

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/`, `/adopt/[id]`, `/our-work` | same public pages as everyone | n/a: no role-specific surface |
| management | same | same | n/a: no role-specific surface |
| staff | same | same | n/a: role retired (0173) and no role-specific surface |
| doctor | same | same | n/a: no role-specific surface |
| volunteer | same | same | n/a: no role-specific surface |
| signed out | `/`, `/adopt/[id]`, `/our-work`, `/our-work/[id]` | the new copy, band order and give line | pass (dev, English and Thai) |

- [ ] Every role above tested — n/a: public pages only; signed-out is the role that matters and was tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: nothing here is restricted

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — the app nav is untouched; the public header's Get involved entry (`PublicHeader.tsx`) now reads "Help with their care" → `/donate` in English and "ช่วยดูแลพวกเขา" in Thai, no dead link
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a staff member does changed; Settings → Website is untouched
- [x] Translatable strings go through the translation path, checked at `/management/translations`: every new line is a dictionary string in both `en.ts` and `th.ts`, so nothing enters the queue; Thai read on dev by switching the site to ไทย (hero, card, menu, animal line, give line, band labels)
- [x] Mobile viewport (375px) — no overflow, controls reachable: the give line is a paragraph with an inline `min-h-11` link, the band's tile layout is unchanged (only the order and count of tiles changed; fewer tiles cannot overflow where more did not)
- [x] Browser console clean — no errors or React warnings (`read_console_messages` with `onlyErrors` on the story page: none)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages (the four pages fetched for the checks all returned their HTML)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/`, `/adopt`, `/adopt/[id]`, `/our-work`, `/our-work/[id]`, in English and Thai; `/donate#ways-to-give` is the existing `DonateWays` heading id
- [x] Any shared file touched checked from a second, unrelated page — the dictionaries are shared: `/adopt` (listing) and `/our-work` loaded fine after the renames, and `typecheck` holds `th.ts` to the `Dictionary` type so a missed rename would not compile
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: the three built items ticked with what closed them; the fourth annotated as not built and why
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-14-public-site-trust-copy.md` (code vs data per item, the rule's effect on baseline tiles, why "Help feed them", why §5.6 was left)
- [x] `README.md` still accurate: nothing it describes changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line in this PR, written for a shelter user, covering all three visible changes. No manual step is outstanding: it is live on the next deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The band order and the tile count were read off the rendered page on dev; "six tiles on dev" is what was printed, not inferred

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the band's "this year" count comes from the existing view, unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the one threshold (`>= 2`) was checked at 2 (kept, dev's foster count) and by reading the comparison for 0 and 1; there is no second edge
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates block above is the only pasted output and is as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager, and worth doing here since every page in this PR is a cached anonymous GET

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**: code only, so `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi reverts everything; there is no schema to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording reads naturally to a Thai reader: "ช่วยค่าอาหารของพวกเขา" (hero), "ช่วยดูแลพวกเขา" (card and menu), "รับเลี้ยงไม่ได้? / เงินบริจาคเพื่อค่าอาหารและการดูแลของ {name} ช่วยได้" (animal page), and the give line on stories | `/`, `/adopt/[id]`, `/our-work` in ไทย on Test |
| 2 | On production the band reads five tiles, totals first, with the "1 adopted" and "0 in foster" tiles gone | `lannacare.org/` after the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items wait for a person

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
