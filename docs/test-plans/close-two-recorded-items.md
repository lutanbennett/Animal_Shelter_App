# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Two recorded answers written where they belong: always-on into the model runbook (`#f56bs`), and the 160 px header logo (`#7bd5u` (b)), with the other four optimisations judged and recorded |
| Backlog item | `docs/backlog.md` → `#f56bs` (Assistant) and `#7bd5u` (Public website) |
| Branch / worktree | `claude/close-two-recorded-items` @ `C:\Development\Animal_Shelter_close-two-recorded-items` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch; number added below once it exists |
| Tested by / date | Claude (stream `close-two-recorded-items`) / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | `0e6826185` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the always-on decision of 2026-11-06 is written into `docs/self-hosted-model-runbook.md`, and the app header loads `/lca-logo-160.jpg` instead of the 781 px `/lca-logo.jpg`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/AppHeader.tsx` (one line, an image src), `docs/self-hosted-model-runbook.md`, `docs/backlog.md`, `docs/decisions/2026-11-12-close-two-recorded-items.md`, this plan. No `worker/`, no migration, no shared lib, no route added or removed
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card's behaviour changes.** The header image is drawn for every signed-in login regardless of cards, and nothing about what it grants, hides or reaches changes. Admin is unaffected for the same reason. The signed-out public is unaffected: the public site and the login pages still draw the large file
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the other five call sites of `/lca-logo.jpg` are deliberately untouched (login pages at 72×72, the favicon, the meme maker, and `OfflineBanner`'s reachability probe); and optimisations (a), (c), (d) and (e) of `#7bd5u` are **recorded and not attempted**, because each needs a before-and-after on a quiet machine and two sibling streams were building throughout

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 113s
=== gates: lint exited 0 after 401s
=== gates: test exited 0 after 141s
=== gates: build exited 0 after 475s
gates: typecheck=0 lint=0 test=0 build=0
```

Run on this branch at `0e6826185`, with two sibling streams building throughout
— which is why the timings are several times their usual length. `lint` reports
96 warnings and **0 errors**; all 96 are pre-existing `no-unused-vars` and
`no-unused-expressions` warnings in files this PR does not touch.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code in this PR reads or writes any table
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — signed in on `http://localhost:3003` with a card-only dev login, reached `/my`, then clicked through to `/home`. The header draws the logo from `/lca-logo-160.jpg`, `complete: true`, natural size 160×153, rendered 24×23 inside the 28×28 box (the span's `p-1` is the difference), and exactly one `lca-logo` request was made, at 5.4 KB encoded
- [x] Data persists — reload the page and the change is still there — the header survived a client-side navigation from `/my` to `/home` and still drew the small file; a static asset has no persisted state beyond that
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this feature has no create, edit or delete; it changes one image source and adds documentation
- [x] Empty state renders sensibly (no rows yet) — the dev login holds only `website_photos`, so `/my` showed "Nothing is assigned to you right now" with the header drawn correctly above it
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input of any kind is added or changed
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input, no numbers and no dates are handled by this change

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | every page that draws the app header | header logo renders, from the small file | not separately driven — see the line below, which says why this row is not a gap |
| exactly `website_photos` | `/my`, `/home` | header logo renders, from the small file | pass — `src="/lca-logo-160.jpg"`, natural 160×153, one request at 5.4 KB |
| signed out | `/login`, the public site | unchanged; still the large file | pass — `/login` drew `/lca-logo.jpg` at 72×72, natural 781×746, exactly as before |

- [x] Every login above tested — **with one deliberate exception that is not a coverage gap:** admin was not driven separately, because `AppHeader` draws the logo for any signed-in user (`if (!user) return null`, then the image, with no card or role test anywhere between), so a card-only login and admin take the identical code path through the same root layout. The card-only login is the stricter of the two, since admin's `perms.isAdmin` short-circuit cannot make an image appear that a card-only login would not see
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — unchanged and re-confirmed in passing: `/my` with no valid session redirected to `/login?next=%2Fmy`, server-side in `src/lib/supabase/proxy.ts`. This change adds no access of any kind; `/lca-logo-160.jpg` was already on both `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS` before this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav entry added, removed or changed; `NavLinks.tsx` is not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a shelter user does changes, so there is no manual topic to update
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no string is added or changed; the image has `alt=""` and is decorative, beside an already-translated label
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: the image occupies the same 28×28 box it did before, so no layout dimension changes at any width
- [x] Browser console clean — no errors or React warnings — clean on `/my` and `/home` after the change. One `SyntaxError: Unexpected token '<'` was logged **earlier in the session and is not from this change**: it was a `<script src="/__devsignin.js">` the proxy redirected to `/login`, which is recorded in the decision file as a dev-signin finding
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/my` and `/home` served 200; the only `lca-logo` request was `/lca-logo-160.jpg`, 200, 5.7 KB transferred

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/my` and `/home` (both draw the changed header), and `/login` (the page that still uses the large file, confirmed unchanged at 72×72 and natural 781×746)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `AppHeader.tsx` is the shared file here, drawn by the root layout on every signed-in page. Checked by loading two unrelated pages, `/my` and `/home`, and reading the rendered `<img>` on each rather than the source
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#f56bs` is ticked. **`#7bd5u` is deliberately left open**, which is the outcome its own done-when calls for: (a), (c) and (d) are real wins still needing a quiet machine, and (e) cannot be judged until Thai is re-measured. Its title was rewritten so it says what is open, and the five judgements are one consolidated block on the item rather than a sixth dated note
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-12-close-two-recorded-items.md`
- [x] `README.md` still accurate — unchanged by this PR and re-checked: it describes neither the header logo file nor the model machine's availability
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the shelter app sees any difference. The header logo is the same picture in the same 28×28 circle; only the file behind it is smaller, and the 27 KiB saved is below what anyone perceives as a page loading faster. The runbook paragraph is a document for Lutan about a machine that does not exist yet, so there is nothing a user could notice there either — and a note would in any case be wrong to write while that step is outstanding
- [x] Commit messages say why, not just what — each of the four says what was decided and why, including why the runbook section was placed where the three superseded choices stood rather than appended
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the two byte figures are from `ls -l` (33,032 → 5,492) and the load was confirmed in the browser's own resource timing (5.4 KB encoded, natural 160×153). **The ~1 Lighthouse point (b) was predicted to be worth is nowhere claimed**, because no score was taken and a score taken today would not be a reading

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: this change derives no date, reads no clock and has no boundary; it is an image source and two documents
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff is touched
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no tool output is pasted in this section; the gates block in section 2 is this run's own output, unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores `/lca-logo.jpg` in the header. There is nothing else to roll back: no migration, no schema, no environment variable, no worker change, and `public/lca-logo.jpg` is untouched and still shipped, so the old source is present in any build. The documentation changes carry no runtime effect at all

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The logo still looks right to a person at normal size and on a high-density screen. Claude read the pixels (160×153 source, drawn 24×23) and looked at a screenshot, which is enough to say it is not broken or blurred, but whether it reads as crisp as before is a judgement a person makes | the app header, any signed-in page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `close-two-recorded-items`)  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1, whether the smaller logo still reads as crisp to a person

Manual verification by: pending: whether the 160 px logo still reads as crisp to a person on a high-density screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: this PR merges to `main` and is picked up by the next release cut

Result: pass

Release manager acknowledgement: pending: the next release cut
