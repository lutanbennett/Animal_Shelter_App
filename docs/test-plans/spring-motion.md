# Feature test plan: Spring motion on the public site

## Header

| | |
|---|---|
| Feature | Spring motion on the public site: blocks spring into view once, and cards and buttons lift on hover and press |
| Backlog item | `docs/backlog.md` → "Give the public site some life: spring motion on text and content blocks." |
| Branch / worktree | `claude/spring-motion` @ `C:\Development\Animal_Shelter_spring-motion` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3017` |
| PR | #153 |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | working tree on `e22d289` (`origin/main` at sync), committed as the feature commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: public-page headings, text blocks and cards rise and fade in with a spring (20 px, 600 ms, ~9% overshoot, 80 ms stagger) the first time they scroll into view, and cards and buttons lift 3 px on hover and sink on press. The feel is Lutan's pick from a three-variant preview (B scroll-in, A hover)
- [x] Files/areas touched listed: `src/app/adopt/SpringMotion.tsx` (new), `src/app/globals.css`, `src/app/adopt/PublicHeader.tsx`, `ResidentCard.tsx`, `SitePageView.tsx`, `src/app/page.tsx`, `src/app/adopt/page.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/our-work/ProjectCard.tsx`, `src/app/our-work/[id]/page.tsx`, `src/app/friends/page.tsx`, `src/app/privacy/page.tsx`, `src/components/FriendCard.tsx`, docs
- [x] Roles affected identified: signed-out public visitors, and staff browsing the public site. The staff app is untouched
- [x] Anything explicitly **out of scope** written down: the hero and anything else on screen at load never animates (decisions.md 2026-09-26); the `/r/` card page is left still; no animation library

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (fast-forward to `e22d289`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck exited 0 after 25s
=== gates: lint exited 0 after 106s
=== gates: build exited 0 after 299s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on PR #153: `check`, `migration-numbers` and `test-plan` all pass (run 36237679232)

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

- [x] Happy path works end to end: on `/` in the browser pane, blocks below the fold were `pending` after hydration; scrolling to them set `in` with `--reveal-delay` 0, 80, 160, 240, 320, 400 ms across the heading and four help cards, and all reached `done` with opacity 1 and transform none. A help card hovered afterwards computed `matrix(1, 0, 0, 1, 0, -3)` with the 6 px/18 px shadow
- [ ] Data persists — reload the page and the change is still there — n/a: no data is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete
- [x] Empty state renders sensibly (no rows yet): `/adopt` with two residents has every block above the fold, and none were held back (all three stayed untouched)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked: jumping straight to the bottom of a resident profile, past a block that never intersected, now leaves nothing hidden (all `done`; before the fix one section stayed `pending`, defect 2). A client-side navigation from `/` to `/adopt` and on to a profile picked up the new page's blocks. The server HTML carries only `data-reveal="true"` and no state, so without JavaScript nothing is hidden

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | same motion as a visitor | not separately tested: no role logic in this change |
| management | public pages | same | as above |
| staff | public pages | same | as above |
| vet | public pages | same | as above |
| volunteer | public pages | same | as above |
| signed out | public pages | motion as described | tested signed in as the dev session; the motion code has no auth path |

- [ ] Every role above tested — n/a: no role-dependent behaviour; motion is client-side CSS and one observer, identical for every viewer
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access control changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual covers the staff app; this changes only how public pages move
- [ ] Translatable strings go through the translation path — n/a: no new strings on the site
- [ ] Mobile viewport (375px) — n/a: not driven at 375 px here; only transform and opacity change, so nothing can overflow that did not before. Listed for Lutan below with the feel check on his phone
- [x] Browser console clean — no errors or React warnings from this change (only the existing logo image aspect-ratio warning)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages
- [x] No layout shift: `layout-shift` entries summed to 0 on `/` and on a resident profile across the scroll-ins

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/adopt`, a resident profile, all loaded and scrolled
- [x] Any shared file touched checked from a second, unrelated page: `FriendCard` is shared with the staff contact hub, and there `reveal` is unset, so `data-reveal` is not rendered; `globals.css` adds only rules keyed on `data-reveal-state` and `.spring-lift`, which no staff page carries
- [x] Nothing merged from `main` during `sync` was broken by this branch (the sync was a fast-forward)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate — n/a: the README does not describe public-site styling
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for visitors
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The timings, stagger, 0 layout shift and the anchor-jump behaviour were read from the browser; the overshoot percentages come from sampling the spring functions

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here depends on the date or time
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding logic beyond "below the fold at hydration", which section 4 checked on both sides
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secrets or env vars

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` reverts it completely; there is no schema or data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | In development, Strict Mode's double effect ran the cleanup, which marked every held-back block as shown, so nothing animated | fixed: cleanup now returns pending blocks to untouched |
| 2 | medium | Jumping past a block (End, an `#anchor` link) never made it intersect, so it stayed hidden above the visitor | fixed: the observer's area reaches 100 000 px above the viewport |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The feel: B's scroll-in and A's hover read right on the real pages, and nothing feels like a show | `/`, `/adopt`, a resident profile, `/our-work`, `/friends`, `/foster` on the dev server or `test.lannacare.org` |
| 2 | With the device set to reduce motion, nothing moves at all: no rise, no lift | the same pages, on a phone or with the OS setting on |
| 3 | With JavaScript disabled, every block is there on first load | `/` with JS off in the browser's site settings |
| 4 | On a phone (375 px and Safari), scroll-in and press look right and nothing overflows | `/` on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — all four looked at by Lutan, 2026-09-26

Manual verification by: Lutan — confirmed in chat; line written by Claude at their request  Date: 2026-09-26

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist linked from the PR description (`docs/test-plans/spring-motion.md`)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: after merge
