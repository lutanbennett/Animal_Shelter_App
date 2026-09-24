# Feature test plan

## Header

| | |
|---|---|
| Feature | On-site / Off-site filter on `/enclosures`, cascading into multi-select zone chips |
| Backlog item | `docs/backlog.md` → Facility → **Filter the enclosures page by Internal / External, cascading into the zone filter.** |
| Branch / worktree | `claude/enclosures-internal-external` @ `C:\Development\Animal_Shelter_enclosures-internal-external` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-25 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `cd04aaa` (code + merge of `origin/main`; this file is the commit after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an Everywhere / On-site / Off-site choice (`?place=`, from `zones.internal`) above the zone chips, which narrow to that place's zones and become multi-select (`?zone=<id>,<id>`); switching place drops zones that no longer belong
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/enclosures/page.tsx`, `src/app/enclosures/EnclosureFilters.tsx`, new `src/lib/enclosures/place.ts`, `src/lib/i18n/dictionaries/en.ts` + `th.ts` (two keys, `enclosures.placeLabel` / `placeAll`), `src/lib/manual/en.ts` (browse-enclosures topic only), `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role that reaches `/enclosures` sees the control. It reads only `zones`, which the page already queried for every role before this change (the query is unchanged), so unlike `?maint=open` there is nothing to hide from vets. Signed-out users never reach `/enclosures`. No policy or route guard changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `/residents`' zone filter does not get the cascade (backlog follow-up added on the `backlog` branch); zones with no enclosures still get a chip, as before; `/manual` screenshots not regenerated (full rerun deferred)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (`assistant-nav-link`'s `unreleased` line beside this one), resolved by keeping both lines, committed as `cd04aaa`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 245s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page was checked against real dev zones in §4
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, no constraint
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

Driven in the in-app browser against `next dev` on :3001 (dev database), signed in as admin. Filter states were checked by fetching each URL's server-rendered page and reading the place control, chips (`*` = `aria-current`), zone headings, card count, the Lifecycle cards and the form's hidden inputs. Dev has 16 physical zones (13 on-site, 3 off-site: Offsite, Orchard, Village) plus Lifecycle.

- [x] Happy path works end to end — On-site: 13 chips, 7 zone headings, 59 cards, no Lifecycle cards. Off-site: 3 chips (Offsite, Orchard, Village), 5 cards. Everywhere: all 16 zones + Lifecycle chip, 67 cards including Hospital / Unassigned / Fostered, same as before the change. By real clicks: On-site → Cat Zone chip → `?place=internal&zone=<cat>`; Left Zone chip → `zone=<cat>,<left>`, headings "Cat Zone, Left Zone"; then Off-site → `?place=external`, headings "Offsite, Orchard, Village" (both on-site zones dropped, whole off-site list shown, not empty)
- [x] Data persists — reload the page and the change is still there — `?place=internal&zone=<cat>,<front>` loaded fresh gives On-site selected, Cat Zone* and Front Zone - White* chips, exactly those two headings (13 cards), and the hidden inputs carry `place=internal&zone=<cat>,<front>`
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only filter; it writes nothing
- [x] Empty state renders sensibly (no rows yet) — Off-site + Orchard + search `zzz` (typed and submitted in the form) shows "No enclosures match these filters." with the controls intact and the URL keeping `place=external&zone=<orchard>&q=zzz`
- [x] Invalid input is rejected with a readable message, not a crash — stale ids are dropped rather than obeyed: `?place=external&zone=<cat>,<front>` (on-site zones) shows the whole of Off-site with All zones selected; `?place=external&zone=<orchard>,<cat>` keeps Orchard only; `?place=internal&zone=<Lifecycle>` shows all of On-site. `?place=` other than internal/external falls back to Everywhere (`parseEnclosurePlace`)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — Lifecycle under each state: `?zone=<Lifecycle>` shows only the three status cards; `?zone=<cat>,<Lifecycle>` shows them plus Cat Zone; `?zone=<cat>,<front>` (Everywhere, Lifecycle not picked) shows no status cards, as before; any On-site / Off-site view shows none. Combined filters: `?place=internal&maint=open` → one enclosure (Main Zone - Blue), and the place links keep `maint=open`; `?place=internal&q=a&sort=name` → flat list of 10, place links keep `q` and `sort`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/enclosures` | place control, chips, filters as above | **pass** — driven in the browser on dev |
| management | `/enclosures` | same as admin | not signed in as; the control reads only the `zones` rows the page already fetched for this role, and no guard changed |
| staff | `/enclosures` | same as admin | not signed in as; same reason |
| vet | `/enclosures` | place control and chips, no maintenance tick | not signed in as; `vet_read_zones` (0001) lets vets read `zones`, and the control has no role branch — the only role-dependent part of the page is the maintenance tick, unchanged. Listed for a look below |
| volunteer | `/enclosures` | same as admin | not signed in as; `volunteer_read_zones` (0001) |
| signed out | nothing | sent to sign-in | **pass** — `/enclosures` before signing in served `/login?next=%2Fenclosures` |

- [ ] Every role above tested — n/a: only admin was signed in; the change adds no role branch and reads no table the page did not already read for every role, so per-role sign-ins would exercise nothing this PR altered. The vet view is listed for a look anyway, since the brief asks for it
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed out, `/enclosures` by URL served the sign-in page; no guard changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new step in *Browsing by zone and enclosure*, read at `/manual#browse-enclosures`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: UI strings only (dictionaries), no user-written public text
- [x] Mobile viewport (375px) — no overflow, controls reachable — at the mobile preset and in the narrow pane: page `scrollWidth` equals viewport width (no page overflow); the place control sits on one line (266px); zone chips scroll horizontally in their own row as before. Screenshot taken
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors) empty; dev server error log "No server errors found."
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every fetched filter URL returned a rendered page; no server errors logged

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures` with no params (same 16 zone chips + Lifecycle, 10 headings, 67 cards incl. the three status cards), `?maint=open` combined with place, search + sort, `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `manual/en.ts`: `/manual` loaded and rendered with the new step. i18n dictionaries: switched to ไทย on `/enclosures` — place control reads ทุกที่ / ภายในศูนย์ / ภายนอกศูนย์, aria-label ภายในหรือภายนอกศูนย์, chips ทุกโซน, and the nav and header rendered in Thai; switched back to EN
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge; the only overlap was `releases.ts` `unreleased`, both lines kept

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a Done note; the `/residents` cascade follow-up committed on `backlog`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — Lifecycle is neither place; stale zones dropped silently, on place switch and from links
- [x] `README.md` still accurate — it does not describe the enclosure filters
- [x] **Release notes.** Would a shelter user notice this change? Yes — a new control on a page staff use daily; `unreleased` gained one line written for a user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the drop-stale-zones and Lifecycle behaviour in both were each observed in §4 against dev data

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the place boundary (Lifecycle vs physical, internal vs external) is covered in §4
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied as printed; §4 is a description of what was observed, not pasted evidence
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it entirely; no schema, no data written. Old `?zone=<single id>` links keep working, since one id is a one-item list

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet**: `/enclosures` shows Everywhere / On-site / Off-site and the zone chips narrow with it; no Has open maintenance tick | `test.lannacare.org/enclosures` or :3001 |
| 2 | On a real phone: tap On-site, pick two zones, switch to Off-site — the picked zones go and all off-site enclosures show; the chips row scrolls sideways comfortably | `test.lannacare.org/enclosures` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items await a person

Manual verification by: pending: vet view and a real-phone pass (items 1–2)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — no release is being cut; the release manager's pre-deploy pass picks it up

Result: pass

Release manager acknowledgement: pending
