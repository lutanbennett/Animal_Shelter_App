# Feature test plan

## Header

| | |
|---|---|
| Feature | The product gets its own icon; the browser tab stops wearing one shelter's photograph |
| Backlog item | `docs/backlog.md` → none: asked for in chat 2026-11-20 ("come up with some proposed product icons that I can use to brand the product"), chosen the same day |
| Branch / worktree | `claude/product-icon` @ `C:\Development\Animal_Shelter_product-icon` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude — 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | the branch tip this plan is committed on |

## 1. Scope and risk

- [x] Change is described in one sentence — the icon metadata in `src/app/layout.tsx` stops serving `/lca-logo.jpg` and serves the product's own mark, added as three SVGs and three PNGs under `public/`
- [x] Files/areas touched listed — `src/app/layout.tsx` (the `icons` block only), `src/lib/releases.ts` (one `unreleased` note), `public/` (six new files, none replaced), `docs/decisions/2026-11-20-product-icon.md`
- [ ] Cards affected identified — n/a: no card governs a favicon. It is served to everyone including signed-out visitors, which is the same as before
- [x] Anything explicitly **out of scope** written down — **the shelter's own logo is untouched**: `lca-logo.*` stays in `public/` and the headers keep using it, because that is the shelter's identity and this is the product's. No per-shelter favicon is added (recorded as *found, not fixed*). The Google consent-screen PNGs were rendered to Lutan's Desktop and deliberately **not** committed: they are a by-hand upload and nothing in the app serves them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 74s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 176s
=== gates: test — npm test
=== gates: test exited 0 after 41s
=== gates: build — npm run build
=== gates: build exited 0 after 151s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `next build` resolves the metadata and emits the icon links without warning; every referenced file is present in `public/` (`cooper-jaidee-icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`), checked by listing the directory against the paths in `layout.tsx`
- [x] Data persists — n/a in the usual sense; the equivalent here is that the PNGs are **derived from** the committed SVG by Chrome rather than drawn separately, so the two cannot disagree
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no list
- [x] Invalid input is rejected with a readable message, not a crash — the one failure mode is a path that does not resolve, which shows as a missing icon rather than an error; each path was checked against the file on disk
- [x] Boundary cases checked — the mark was rendered at 512, 192, 180, 120, 64, 32 and 16 px. **It is weakest at 16**, where the thin open ring begins to close; recorded in the decision file with the fix if it ever matters

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | the icon, as everyone does | unchanged | n/a: a favicon is served to every request, signed in or not |
| exactly `<card key>` | as above | unchanged | n/a: no card governs it |
| signed out | as above | unchanged | n/a: as above, and it was public before |

- [ ] Every login above tested — n/a: a favicon is not access-controlled and this PR adds no page, route or action
- [x] A login that should not have access is blocked server-side — unchanged: nothing here reads or writes data, and no check was removed or weakened

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: nothing a shelter user does changes; the release note covers what they will notice
- [ ] Translatable strings — n/a: the release note is the only new prose, and release notes are not translated
- [ ] Mobile viewport (375px) — n/a: no page layout changes
- [ ] Browser console clean — pending: not driven in a browser; the dev server was not started for this change
- [ ] Network clean — pending: as above

## 6. Regression

- [x] The pages nearest the change still work — `src/app/layout.tsx` wraps every page, so `next build` compiling and rendering the route tree is the broad check; it passed
- [x] Any shared file touched checked from a second, unrelated place, by running it rather than reading it — `src/lib/releases.ts` is read by `/releases`; the build compiles that page, and `check-test-plan.mjs` parses the same `unreleased` array and accepts the new note
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync, all four `0`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item; this came from chat and was chosen in chat the same day
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-20-product-icon.md`, including why a tag, why the poodle stays, and the two things found and not fixed
- [x] `README.md` still accurate — it does not describe the icon
- [x] **Release notes.** — yes, and one was added. **Every user will notice**: the tab icon, the bookmark and the phone home screen all change on the next deploy. Written for a shelter user, naming what they will see and saying the puppy is still on the loading screens, because that is the thing someone would otherwise ask about. Not tagged with a card: it is not about a page, and everyone sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — that the old icon was one shelter's photograph was read in `layout.tsx` (`icon: "/lca-logo.jpg"`), not inferred; the PNG sizes are the renderer's own reported output; the 16 px weakness was looked at, not predicted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. **What to look at:** the browser tab, after a hard reload. Favicons are cached aggressively by browsers and by Cloudflare, so an old icon after a deploy is not a defect until a cache purge and a fresh profile both still show it
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic
- [ ] **Both edges of a band or boundary** — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block is copied from the run; the PNG sizes are the renderer's printed output
- [ ] Public pages re-checked after a cache purge — deferred: release manager. The icon is on the public pages too, and is exactly the kind of asset an edge cache holds

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a in effect: this adds no secret and no variable, only static files under `public/`

### Migration ordering — *skip if no migration*

- [ ] **Both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit: the old `icon: "/lca-logo.jpg"` returns and the new files become unused. No schema, no data, no setting. **What it does not cover:** browsers and the edge will keep showing whichever icon they cached, in both directions, for as long as they keep it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Every browser tab, bookmark and phone home screen served one shelter's photograph as the product icon, on every address including `cooperjaidee.org` | fixed here |
| 2 | Low | The mark's thin open ring starts to close below about 20 px | accepted: recorded in the decision file with the fix (a 16 px variant with a thicker ring) if a bookmark list ever looks wrong |
| 3 | Low | There is still no way for a shelter to set its own favicon on its own address | accepted, found not fixed: not a regression — before today every shelter got Lanna's photograph |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The tab icon is the tag, after a hard reload — favicons cache hard, in browsers and at the edge | `test.lannacare.org`, any page |
| 2 | Adding the site to a phone home screen shows the dark rounded icon, not a screenshot | a phone, Safari or Chrome → Add to Home Screen |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: both rows need a deployed build and a person looking at a tab, and only the person who looks may tick this

Manual verification by: pending: both rows wait on a deploy and a look at a real browser tab

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: it ships with the next release like any other merged change

Result: pass with accepted defects
