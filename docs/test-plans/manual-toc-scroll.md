# Feature test plan

## Header

| | |
|---|---|
| Feature | The `/manual` Contents list gets its own scroll bar on desktop |
| Backlog item | `docs/backlog.md` → Documentation → **Give the manual's table of contents its own scroll bar.** |
| Branch / worktree | `claude/manual-toc-scroll` @ `C:\Development\Animal_Shelter_manual-toc-scroll` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #98 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `fc60526` (code); this file is the commit after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the desktop Contents `<aside>` is capped at `100dvh - 3rem` with the heading fixed and the list scrolling in its own `overscroll-contain` box, and the `#anchor`'s entry is highlighted and scrolled into view in the list
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/manual/page.tsx`, new `src/app/manual/TocScroller.tsx` (client wrapper), `src/lib/releases.ts` (one `unreleased` line), `docs/`. No `worker/`, no migration, `src/lib/manual/en.ts` untouched (it does not describe the Contents panel)
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role reads `/manual`; who can reach it is unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no scroll-spy (the highlight follows the address bar's `#`, not the section on screen); `/manual` screenshots not regenerated (full rerun planned); the landing position after a deep `#` link drifts because lazy screenshots load above it (pre-existing, not changed here; see Defects 2)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 192s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the manual is static content
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev, signed in, 1400×900 emulated: the scrolling element is `<html>` and no ancestor of the `<aside>` sets overflow (so sticky engages against the window). With the page scrolled to 5000 and to 15000 the aside stayed at top 24 / bottom 876 (`position: sticky`, `max-height: 852px`); the list box was 824px tall with 1688px of content. A real mouse-wheel scroll over the text moved the page 500px and left the list's `scrollTop` unchanged; a wheel scroll over the list moved the list (864 → 564) and left the page at its position
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only page
- [x] Empty state renders sensibly (no rows yet) — the "short list" case: at 1400×2000 the list (1656px) fits, `scrollHeight == clientHeight`, scroll-bar width 0, and the last entry's bottom (1708) equals the box's bottom — no stray scroll bar, nothing clipped
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a `#` naming no entry is ignored by `TocScroller`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — list end: with the list scrolled to its end (`scrollTop` 864) the last entry's bottom is exactly the box's bottom; a further wheel-down over the list left the page at 15000 (`overscroll-contain` stops the chain). Short window 1400×500: box 424px tall, still sticky at top 24 and scrollable. Anchors, both code paths: a cold load of `/manual#getting-help` (the last entry) marked only that link `aria-current`, highlighted, and scrolled the list to show it; clicking `#getting-started` with the list at the top moved the current mark to it; setting `location.hash = 'management'` from outside the list moved the mark and scrolled the list so it was fully in view; exactly one entry was current each time

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual` | scrolling Contents as above | driven in the browser, signed in by Lutan: as expected |
| management | `/manual` | same page — no role-dependent rendering in the layout | not signed in as; the layout has no role branches |
| staff | `/manual` | same | not signed in as; no role branches |
| vet | `/manual` | same | not signed in as; no role branches |
| volunteer | `/manual` | same | not signed in as; no role branches |
| signed out | nothing | sent to sign-in, as before | observed: `/manual` redirected to `/login?next=%2Fmanual` before sign-in |

- [ ] Every role above tested — n/a: the layout renders identically for every role, and access is unchanged by this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access granted or withdrawn

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual has no description of its own Contents panel to update (searched `en.ts` for "contents")
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added; the manual is English only
- [x] Mobile viewport (375px) — no overflow, controls reachable — mobile preset: `<aside>` is `display: none`, the `<details>` is shown with all 60 links, expands to its full height (1611px, no cap), carries no `aria-current` (the wrapper is desktop-only), and `scrollWidth` is not greater than 375
- [x] Browser console clean — no errors or React warnings — no errors from this change; the only errors are four 404s for manual screenshots that do not exist yet (Defects 1)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the added client chunk `src_app_manual_TocScroller_tsx` loads 200; the four 404s are the missing screenshots above

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/manual` on desktop (1400×900, ×500, ×2000) and on the phone preset
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI file touched; `releases.ts` gained only an array element, same shape, and `build` passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — which element scrolls, why the cap ignores the header, list-only `scrollTop`, no scroll-spy
- [x] `README.md` still accurate — it does not describe the manual's layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: the Contents list now stays in place with its own scroll bar, and a link to a topic highlights it and scrolls the list to it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the scrolling element, the absence of overflow ancestors, the sticky offsets, the ~160px overhang at the top of the page and the list-only scrolling were all read from the running page at the sizes stated

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/manual` requests four screenshots that do not exist (`management-diets`, `management-cashflow`, `admin-blood-test-types`, `diet-new`) — 404s in the console | deferred to backlog — pre-existing; covered by the planned full screenshot rerun |
| 2 | low | A cold load of a deep `#` link lands above its section (`#getting-help` ended 1279px short), because lazy screenshots without fixed dimensions load above it after the jump | deferred to backlog — pre-existing, not caused by this change |
| 3 | low | At the very top of the page, before the header scrolls away, the last ~160px of the list sits below the window (900px tall) until the page has scrolled ~190px | accepted — allowing for the header would cost that much list for the whole time the panel is stuck (`docs/decisions.md`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | In a normal, full-size browser window (only a scaled, emulated viewport in the app's browser pane was driven): the Contents list scrolls on its own with a mouse wheel or trackpad, the text scrolls beside it without dragging it, and reaching the end of the list does not start scrolling the page | `/manual` on dev or `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is outstanding; see the pending line below

Manual verification by: pending: a full-size-window look at the Contents scrolling (Left for manual verification 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above — 3 accepted; 1 and 2 are pre-existing and deferred to the backlog
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
