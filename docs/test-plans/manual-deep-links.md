# Feature test plan

Filled from `docs/test-plan-template.md`. See the template for what each state
(`[x]`, `n/a:`, `deferred:`) means.

## Header

| | |
|---|---|
| Feature | Manual screenshots carry their size, so a link to `/manual#topic` lands on the topic |
| Backlog item | `docs/backlog.md` → Documentation → "Deep links into the manual land short of their topic." |
| Branch / worktree | `claude/manual-deep-links` @ `C:\Development\Animal_Shelter_manual-deep-links` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | #113 |
| Tested by / date | Claude, 2026-09-25 (browser pane signed in by Lutan) |
| Carries a migration? | no |
| Tested at SHA | `3a122c6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each manual `<img>` gets its PNG's intrinsic `width`/`height` (plus `h-auto`) so the space is reserved before the lazy image loads, and a deep link is no longer pushed off its topic
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/manual/page.tsx` (`Screenshot`), `scripts/manual-screenshots.mjs` (writes sizes; new `--sizes`), new generated `src/lib/manual/screenshot-sizes.json`, `src/lib/releases.ts`, `README.md`, `docs/backlog.md`, `docs/decisions.md`. `en.ts` and `ManualScreenshot` are untouched
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role reads `/manual`; who can reach it is unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — (a) `#getting-help`, the last topic, still lands about 800px down a 900px window: the page is at maximum scroll, which is page geometry, not image shift (backlog item added); (b) four screenshots referenced by `en.ts` do not exist on disk and 404, as before (backlog item added); (c) no PNG was re-captured — the full re-run stays deferred

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date", before and after the feature commit)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — run on the working tree that was then committed unchanged as `3a122c6`:

```
=== gates: build exited 0 after 221s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #113: `check` pass (1m33s), `test-plan` pass, run 36042670643

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

All browser checks in the app's browser pane (Chromium), signed in on dev, at an emulated 1400×900 unless stated. **Cold load:** each measurement is a fresh navigation to `/releases` then to `/manual#<topic>` in the same tab, read 6s later. The browser cache was not cleared, but the dev server sends `/manual/*.png` with `cache-control: public, max-age=0`, so every image revalidates with the server (the network log shows a 304 or 200 per PNG per load), and the page's own layout starts with no image sizes each time. The offset is `getBoundingClientRect().top` of the topic; 24 is correct (`scroll-mt-6`).

**Chromium hides the bug.** Its scroll anchoring compensates for images loading above the viewport; Safari has none. So the before/after comparison was also run with `html{overflow-anchor:none}` added to the page temporarily (removed before the commit; `overflowAnchor` read back as `none` during, `auto` after) to stand in for Safari.

| Deep link, cold | Before, Chromium | Before, no anchoring | After, no anchoring | After, Chromium |
|---|---|---|---|---|
| `#weight` (mid-page, many images above) | 24 | **2546** | **24** | 24 |
| `#dashboard` | — | 24 | 24 | — |
| `#frequencies` (end of the long Settings section) | 27 | 24 | 24 | — |
| `#getting-help` (last topic; the backlog item's link) | 800, `scrollY` = max | 800, `scrollY` = max | 824, `scrollY` 24 below max | 800, `scrollY` = max |

The backlog item recorded 1279 for `#getting-help`; that number did not reproduce on this build before the fix. Its 800 is the page being at maximum scroll with 100px of document below the topic, and stays after the fix — out of scope, backlog item added.

- [x] Happy path works end to end — cold `/manual#weight` with anchoring off: 2546 → 24. The weight screenshot carries `width=1898 height=1272` and renders 766×513 (same ratio)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved; the sizes are a committed file, read at build time
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page
- [ ] Empty state renders sensibly (no rows yet) — n/a: no data; the nearest thing, a `src` with no PNG and so no size, renders as before (checked: the four missing PNGs render with no `width` attribute and nothing else changed)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. `--sizes` throws naming the file if a `.png` in `public/manual/` is not a PNG
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the phone-width screenshot (`nav-mobile`, 585×1266, `max-w-xs`) renders 318×688, ratio 2.164 against the file's 2.164; a full-page capture (`public-home`, 1898×3840) sized from the header; sizes for four files cross-checked against Windows' own image reader (System.Drawing), all equal

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual` | page as before, deep links land on the topic | driven in the browser, signed in by Lutan: as expected |
| management | `/manual` | same page — no role-dependent rendering in the layout | not signed in as; `Screenshot` has no role branches |
| staff | `/manual` | same | not signed in as; no role branches |
| vet | `/manual` | same | not signed in as; no role branches |
| volunteer | `/manual` | same | not signed in as; no role branches |
| signed out | nothing | sent to sign-in, as before | observed: `/manual` redirected to `/login?next=%2Fmanual` before sign-in |

- [ ] Every role above tested — n/a: the change is to how an image is sized, with no role-dependent code; admin driven, the rest reasoned from the code as stated in the table
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: access is unchanged; signed-out redirect observed as above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: nav untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual text changed; the fix is to the manual page itself, driven above
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — `resize_window` mobile (375×812): cold `/manual#weight` → 24; `scrollWidth` not wider than the window; opening the Contents `<details>` and clicking "Blood tests" → `#blood-tests` at 24. Reset to desktop afterwards
- [x] Browser console clean — no errors or React warnings — no warnings from the `<img>` change; the only errors are `404 (Not Found)` for `admin-blood-test-types.png` (and the other missing PNGs), the same pre-existing 404s recorded in `manual-toc-scroll`'s plan
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — PNG requests are 200/304 except the four files missing from disk, as above

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — in-page click from the desktop Contents list: "Foster or adopt" → `#foster-adopt` at 24, `location.hash` `#foster-adopt`, and the Contents entry with `aria-current` is `#foster-adopt`. Highlight also right on cold loads: `#getting-help` and `#weight` each marked current
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `screenshot-sizes.json` is new and imported only by `/manual`, and `releases.ts` only gained a string in `unreleased`
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing ("Already up to date"); gates green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — follow-ups on `backlog` in `a53923d`: the four missing screenshots (two have no entry in the capture script at all), and the last topics being unable to reach the top of the window
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-25, "Manual screenshot sizes come from the PNGs, not from `en.ts`"
- [x] `README.md` still accurate — the `src/lib/manual/` paragraph now mentions the sizes file and `--sizes`
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. — yes: "A link to a topic in the user manual now opens on that topic. …"
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every number is from the table above; that Safari lacks scroll anchoring is the reason for the no-anchoring stand-in and is left for a real iPhone check below, not asserted as measured. An unmeasured explanation of the backlog's 1279 was cut from `decisions.md` rather than kept

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no dates involved
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: not a boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` lines are pasted as printed; the offsets in the table are the values `javascript_tool` returned, collected into a table (the only hand-assembled evidence, and it says so)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

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

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it fully; no schema, no data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Deep links land short of their topic where the browser has no scroll anchoring: cold `#weight` 2546px down | fixed — 24 |
| 2 | low | `#getting-help`, the last topic, lands about 800px down a 900px window because the page is already at maximum scroll | deferred to backlog — pre-existing, not image shift; needs a design call on blank space under the manual |
| 3 | low | Four screenshots referenced in `en.ts` do not exist (`diet-new`, `management-diets`, `management-cashflow`, `admin-blood-test-types`); `diet-new` and `management-cashflow` have no entry in the capture script, so the planned re-run will not produce them | deferred to backlog — pre-existing |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real iPhone or iPad (Safari — no scroll anchoring, which is where the bug was real; only a Chromium stand-in was driven), open a deep link to a topic halfway down, e.g. `/manual#weight`, in a fresh tab: the topic's heading should be at the top of the screen once the pictures have loaded, not somewhere further down the page | `test.lannacare.org/manual#weight` once deployed, or dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 awaits a person with an iPhone or iPad

Manual verification by: pending: Lutan to open a manual deep link on an iPhone or iPad (item 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 fixed; 2 and 3 pre-existing and deferred to the backlog
- [ ] Checklist pasted into the PR — n/a: the PR body links this file and summarises its measurements rather than pasting it
- [ ] Handed to the production release manager — n/a: not yet — no release is being cut; the release manager's pre-deploy pass picks it up

Result: pass with accepted defects

Release manager acknowledgement: pending
