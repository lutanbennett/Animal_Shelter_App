# Feature test plan

## Header

| | |
|---|---|
| Feature | The product lockup (mark + name) in the platform front door's header |
| Backlog item | `docs/backlog.md` → none; asked in chat 2026-11-20 ("add the lockup to the public website header", then answered: cooperjaidee.org's header, not a shelter's site) |
| Branch / worktree | `claude/platform-lockup` @ `C:\Development\Animal_Shelter_platform-lockup` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | #1776 |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | f31630699 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the platform console's header shows the product mark beside the name instead of the plain string "Cooper Jaidee platform"
- [x] Files/areas touched listed — `src/components/CooperJaideeLockup.tsx` (new), `src/app/platform/layout.tsx` (header + its doc comment). No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified — **none.** The platform console is not card-governed: who may see it is `is_product_admin()`, the PADMIN list of people (Lutan, 2026-11-18, the third named exception). This PR changes no grant, no card, no cell and no policy; it changes what the header draws. Admin is unaffected, and the signed-out public cannot reach `/platform` at all
- [x] Anything explicitly **out of scope** written down — the shelter public site's header (`src/app/adopt/PublicHeader.tsx`) is deliberately untouched: it carries each shelter's own name and logo, and must keep doing so. A "powered by" lockup in that site's footer was offered and not chosen. Found and not fixed: that header hard-codes one shelter's logo file (`/lca-logo-transparent.png`) for every tenant — the same tenancy fault the favicon had in #1774. Filed on the backlog rather than fixed here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
<gates output pasted here from the real run>
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — signed in as a dev product administrator, `/platform` renders with the lockup in the header. Screenshot taken at 800x600
- [x] Data persists — reload the page and the change is still there — reloaded; the header is server-rendered from the layout and is identical after a fresh navigation
- [ ] Create / edit / delete all exercised — n/a: the lockup is a header, it has no create, edit or delete
- [ ] Empty state renders sensibly — n/a: the lockup takes one prop, which is a dictionary string and is never empty
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the size boundary is the real one here and it was tested, not reasoned. At 32px the tag's ring (an open circle, 1.9px of stroke around a 1.6px hole at that size) closed into a solid dot; at 40px it is open and reads as a ring. The mark is drawn at 40px for that reason. The brand sheet already recorded that the ring closes below about 20px — the finding here is that in a header bar the threshold is higher than that
- [x] The heart's hole was proved, not assumed — the heart is a cut-out (`fill-rule="evenodd"`), so it shows whatever is behind it. Checked on the app's dark surface (heart reads dark) and again with the header's background forced to the brand cream (heart reads cream, ring goes dark). One file is therefore correct on both grounds, with no second variant to keep in step

### Role access matrix

Analysed by card, per `CLAUDE.md`. The page under test is not card-governed: it
is PADMIN, a list of people, which is why the second row names a card and finds
it makes no difference.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/platform` | not-found unless also on the PADMIN list — Admin's all-access is inside a shelter, and the console is outside every shelter | not re-tested here: this PR does not touch the gate. Unchanged from #shmgt's own plan |
| a product administrator (PADMIN list; the dev login used holds the Admin role too) | `/platform` | the console, now with the lockup in the header | ✓ reached, header shows the lockup |
| exactly any one card, no PADMIN | `/platform` | not-found — no card opens this page, by design | not re-tested here: this PR does not touch the gate |
| signed out | `/platform` | redirected to `/login` | not re-tested here: this PR does not touch the gate |

- [ ] Every login above tested — pending: the three unchanged rows are the gate's own behaviour, which this PR does not touch; they were tested by the PR that built the gate. Only the row this PR changes was re-tested
- [x] A login that should not have access is blocked server-side — unchanged and still server-side: `/platform` calls `notFound()` before rendering unless `is_product_admin()` answers `true`, and the database refuses everything the page reads to anyone not on the list. Hiding was never the security here and nothing in this PR weakens it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; the platform console is outside the app chrome (`PublicPathGate` hides it) and has no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter staff, and no shelter user can reach this page
- [x] Translatable strings go through the translation path — the one string is `t.admin.productAdmin.platformName`, which already existed and is unchanged in both dictionaries. The two words of the name itself are artwork, not copy: they are `aria-hidden` and the accessible name a screen reader hears is the translated string, so nothing was taken out of the translation path
- [x] Mobile viewport (375px) — no overflow, controls reachable — the header is `flex-wrap`, the mark is `shrink-0` and the name does not wrap; at 375px the brand sits on the first line and the email and Sign out wrap below it, as they did before
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the mark is inline SVG, so it adds no request at all

## 6. Regression

- [x] The pages nearest the change still work — `/platform` itself (the only page in this layout) and `/login` both load
- [x] Any shared file touched — none. `CooperJaideeLockup.tsx` is new and has exactly one caller; `platform/layout.tsx` serves one route. Nothing else in the app imports either, so there is no second page whose runtime value could change
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a as a tick: there was no item, the work was asked for in chat. The follow-up this work found (the shelter header's hard-coded logo) goes on the `backlog` branch, not here
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-product-lockup-on-the-platform-door.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nobody who reads `/releases` can see this page. It is the platform console, reachable only by someone on the PADMIN list, which is outside every shelter; a shelter user cannot reach it and neither can a shelter's Admin, so an `admin: true` note would be shown to people who will never see the change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the two claims worth doubting were both measured rather than argued. "The ring closes up at 32px" is a screenshot at 32 and another at 40. "One file works on both grounds" is a screenshot on the dark surface and another with the ground forced to cream; it was not inferred from the fill rule

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the change draws a header and derives no date
- [ ] **Boundary or banding change: both edges covered** — n/a: no threshold, window or cutoff. The size boundary this change does have is in section 4, where it was measured
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the run's own closing lines
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched. `/platform` is `noindex` and is never served anonymously

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive or rewriting migration: a fresh production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — a rebuild on the Pi at the previous SHA (`./scripts/pi/deploy-pi.sh --ref <sha>`) puts the old header back. There is nothing else to undo: no migration, no secret, no stored value, no file written anywhere. The flat brand files on the Desktop are outside the repo and are not touched by a rollback either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | At 32px the tag's ring closed into a solid dot, so the mark read as an amber blob with a speck above it | fixed — the mark is drawn at 40px in the lockup, verified in the browser |
| 2 | low | `node scripts/dev-signin.mjs admin --port <n>` now fails with `PGRST116 … Results contain 5 rows` — since the per-shelter work there are five Admin roles on dev and the script asks for one. `--shelter <id>` is the way round it | deferred to backlog — not this change's doing, and the workaround is documented in `CLAUDE.md` |
| 3 | low | `src/app/adopt/PublicHeader.tsx` serves one shelter's logo file (`/lca-logo-transparent.png`) to every tenant, so a second shelter's own website would show the first shelter's logo. Same shape as the favicon fault fixed in #1774 | deferred to backlog — out of scope here, and the fix needs a per-shelter logo upload, which is its own piece of work |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the lockup reads right to you at the size it is drawn — a brand is a judgement, and mine is that 40px is the smallest size at which the tag is still a tag | `/platform` on `cooperjaidee.org` after the next release, or `http://localhost:3007/platform` now |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

pending: Lutan to say whether the lockup reads right at header size — the one row in the table above

Result: pass
