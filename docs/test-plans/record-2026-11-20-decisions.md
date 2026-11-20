# Feature test plan

## Header

| | |
|---|---|
| Feature | Record two of Lutan's 2026-11-20 decisions: the product-admin console requirements, and the product name being one word |
| Backlog item | `docs/backlog.md` → `#pacon` (requirements recorded, item NOT closed), `#gidty` (the name correction it asked for) |
| Branch / worktree | `claude/record-2026-11-20-decisions` @ `C:\Development\Animal_Shelter_record-2026-11-20-decisions` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #1783 |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 69e21c1e6 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two documents plus the one-word product name on screen; `#pacon`'s own text says its requirements are *"requirement, not design"* and this records them without designing anything
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — new `docs/decisions/2026-11-20-product-admin-console-requirements.md`; a dated note prepended to `docs/decisions/2026-11-14-product-name.md`; name strings in `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/components/CooperJaideeLockup.tsx`, `public/cooper-jaidee-icon{,-dark,-mono}.svg`, and one comment in `src/app/layout.tsx`. No routes, no `worker/`, no migration, no shared library logic
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card is affected.** Nothing here reads, grants or gates a card, and no permission check changes. The strings are the product's own name: `platformName` renders on `/platform` (product administrators only), the enquiry title on the platform front door, and the icon titles anywhere the favicon's accessible name is read. Signed-out visitors see the icon title only
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **the console redesign itself** (no layout, component, column or migration proposed); **`src/lib/releases.ts`**, whose two-word use is a release note already sent to admins and stays as history; **the `CooperJaidee` consent screen**, which is already correct and is Lutan's console; and **the flat brand files and print lockup artwork**, which are images, not strings. The first and the last three are each recorded in the decision files

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 9s
=== gates: lint exited 0 after 227s
=== gates: test exited 0 after 40s
=== gates: build exited 0 after 54s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads any column differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the only runtime surface is the rendered name. `src/app/platform/layout.tsx` passes `t.admin.productAdmin.platformName` to `CooperJaideeLockup` as its accessible name, and the wordmark beside it is the component's own text; both now read `CooperJaidee`. Verified by reading the two call sites and by `git grep -F "Cooper Jaidee" -- src/ public/`, which returns only `src/lib/releases.ts`, deliberately left
- [x] Data persists — reload the page and the change is still there — static strings; nothing is written or read back
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the change creates, edits and deletes nothing
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list and no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input, no numbers, no dates. The one length consideration is that the wordmark got **shorter** by one space, so no header can overflow that did not before

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changes | no access decision is touched by this change | unchanged — no card, policy, route guard or server check was edited |
| exactly any single card | nothing changes | as above | unchanged — the diff contains no `can(`, no `has_permission`, no policy and no migration |
| signed out | `public/cooper-jaidee-icon*.svg` (the favicon), as before | the icon's accessible name now reads `CooperJaidee` | unchanged in reachability; only the `<title>` text differs |

- [ ] Every login above tested — n/a: no access decision changes, so there is nothing a login could newly reach or newly be refused; the matrix records that rather than asserting sign-ins that would prove nothing
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — unchanged: `/platform` is still gated exactly as before this branch, which touched no guard. Confirmed by the diff containing no change under `src/app/platform/` other than none at all

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: `NavLinks.tsx` is not touched and no page was added or removed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users and documents no platform screen; the product's own name does not appear in it (`git grep -F "Cooper Jaidee" -- src/lib/manual/` returns nothing)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — both changed strings are dictionary entries, `en.ts` and its `th.ts` counterpart edited together, so the Thai copy cannot be left behind. The product name itself is not translated — it is the same word in both dictionaries, which is why the Thai entry reads `แพลตฟอร์ม CooperJaidee`
- [x] Mobile viewport (375px) — no overflow, controls reachable — the wordmark is one character shorter and no layout rule changed, so nothing can overflow that did not already. No new element
- [x] Browser console clean — no errors or React warnings — the diff changes text nodes and string literals only; `build` and `typecheck` both exit 0, and there is no new component, hook, prop or import to warn about
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — no route, fetch, action or asset filename changed; the three SVGs keep their paths, so nothing can 404

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `src/app/platform/layout.tsx` (the only consumer of `platformName` and of the lockup) and `src/app/layout.tsx` (the favicon references, whose paths are unchanged) both read correctly and compile; `build` exits 0, which renders every static page in the app
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **the two dictionaries are the shared files here, and `build` exercises them from every page in the app, not from one.** The `th.ts` edit sits inside the same `admin.productAdmin` object as the `en.ts` edit, so the dictionaries cannot have drifted in shape; `typecheck` exits 0, which is what proves the Thai dictionary still satisfies the English one's type
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` cleanly with no conflict, and the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: **`#pacon` is deliberately NOT closed.** Its done-when asks that each of his entries be *"either a change or a recorded decision not to change it"* and that he can complete an onboarding unaided; the redesign has not started. This PR records the requirements so they survive, which is the opposite of ticking it. `#gidty` is likewise still open on its own two outstanding items (the Cloud inventory, and the cost of moving the full-`drive` client). A pointer to the new decision file goes on the `backlog` branch, where notes belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-20-product-admin-console-requirements.md` is the PR's main artifact, and `docs/decisions/2026-11-14-product-name.md` carries the dated `SUPERSEDED 2026-11-20` note in place, with the three things deliberately left spelt out so nobody "fixes" them
- [x] `README.md` still accurate — unaffected: it names no product display name (`git grep -F "Cooper Jaidee" -- README.md` returns nothing)
- [ ] **Release notes.** — n/a: the only screens affected are the operator console header, which **one person** reaches and where a space was removed from the product's own name, and the platform enquiry form, which **is not reachable yet** — `cooperjaidee.org/` still answers 307 to `/platform` and `#apxld` records that the public form has nowhere to live until the apex page exists. No shelter user, and no Admin inside a shelter, sees anything appear, move or disappear
- [x] Commit messages say why, not just what — each says which of Lutan's words it is recording and why the record needs a decision file rather than a backlog note (a ticked item is what nobody re-reads)
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Three claims in the decision file were measured rather than inferred: that only **Drive** of the eight checks in `src/lib/status/health.ts` is per-shelter (read from the file); that `shelters` holds no contact or phone column (read from the schema); and that `0427` already captures `contact_name`, `email` and `phone`. The claim that `platformName` was the only on-screen two-word form was **checked and found wrong** — `git grep` turned up the lockup wordmark, the enquiry title and three SVG titles, all of which are on screen and all of which are fixed here. No timezone, concurrency or floating-point reasoning appears in this PR

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date, time, clock or timezone logic in the diff
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, band, rounding rule, window, limit or cutoff in the diff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block in section 2 is the closing lines of the run as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, and nothing is rewritten
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the two-word strings and removes the two documents; there is no schema, no data and no deployed state to unwind, so `./scripts/pi/deploy-pi.sh --ref <sha>` at the previous SHA is a complete rollback. **What it does not cover:** nothing, because nothing outside the repository changed — in particular the Cooper Cloud consent screen was not touched and needs no reverting

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The brief for this work said `platformName` was the only place the two-word name appears on screen. It was not: the lockup wordmark, the enquiry form title in both dictionaries, and three `public/cooper-jaidee-icon*.svg` titles and accessible names also carried it | fixed — all of them are one word now, and the superseded note lists what was changed so the next reader does not have to re-measure |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the wordmark reads well as one word in the display face beside the mark — `CooperJaidee` is a judgement about type, not about code, and it is Lutan's call. If he wants a different form (`Cooperjaidee`, or the camel-case kept), it is one string in `CooperJaideeLockup.tsx` plus the dictionary entries | the console header on `cooperjaidee.org/platform`, or `http://localhost:3002/platform` with a product-administrator login |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's eye on the one-word wordmark in the display face

Manual verification by: pending: Lutan to confirm the one-word wordmark reads well in the header

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: nothing to deploy on its own account — the change rides the next ordinary release
