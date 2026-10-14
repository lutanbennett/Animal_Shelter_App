# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site visitor fold: a branded not-found page, the first language from the phone, the "English for now" note on two call sites, and the adoption list's intro and one name |
| Backlog item | `docs/backlog.md` → **A branded "not found" page** (ticked, with the one part not built), **Rewrite the adoption list's intro**, **Pick the first language from the phone**, **Show the "English for now" note** |
| Branch / worktree | `claude/public-site-visitor-fold` @ `C:\Development\Animal_Shelter_public-site-visitor-fold` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | pending |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `3b5a4982` (the code commit; the commits after it are docs and this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a missing public page shows a kind page with ways on, a Thai phone opens in Thai once, two English-only blocks say so in Thai, and the adoption list reads as an invitation under one name. One sub-part of the first item is not built, on purpose (see out of scope)
- [x] Files/areas touched listed: `src/app/adopt/PublicNotFound.tsx`, `HappyEndings.tsx` (new, extracted from `adopt/page.tsx`), `not-found.tsx` in `adopt/`, `our-work/`, `r/`, `e/`; `src/proxy.ts`, `src/lib/i18n/locales.ts` (+ `locales.test.mjs`), `worker/index.mjs` (cache key); `src/app/page.tsx`, `src/app/adopt/page.tsx`; both dictionaries; `src/lib/releases.ts`; `docs/backlog.md`; `docs/decisions/2026-10-14-public-site-visitor-fold.md`
- [x] Roles affected identified: signed-out public visitors. The proxy change runs for every GET but only acts for a visitor with no `locale` cookie and Thai first in `Accept-Language`
- [x] Anything explicitly **out of scope** written down: separate wording for an animal that is adopted, hidden or deceased (cannot be done from the public views without reading `residents`, which could expose a hidden animal; reasons in the decision file); a real 404 status (Next streams 200 past the loading boundary, `noindex` is added); the other review items named in the brief

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR is opened; recorded in the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: the PR is not open yet; read from the PR status before merge

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the only data read is `public_recent_adoptions`, already read by `/adopt`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, run against the dev server with `curl`: a missing `/adopt/<uuid>` returns the not-found page ("find that page", the three links, "Happy endings", `noindex`); `Accept-Language: th-TH,th` on `/adopt` returns the Thai heading and `set-cookie: locale=th`; the Thai home page and `/adopt` each show one `role="note"` (English for now)
- [x] Data persists — reload the page and the change is still there: the cookie is set for a year and later requests read it; nothing else is written
- [ ] Create / edit / delete all exercised — n/a: the feature has no create, edit or delete
- [x] Empty state renders sensibly: with no recent adoptions `HappyEndings` renders nothing, so the not-found page shows the message and links only
- [ ] Invalid input is rejected with a readable message — n/a: the only input is a URL id, which gets the not-found page
- [x] Boundary cases checked: `Accept-Language: th-TH,th;q=0.9` gives Thai; `en-GB,en;q=0.9,th;q=0.5` gives English and no cookie; `th` with an existing `locale=en` cookie gives English (the toggle wins); empty and missing headers give English; `tha` and `fr` give English (unit tests in `src/lib/i18n/locales.test.mjs`, and the live requests)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | same as a visitor | n/a: no role-specific surface |
| management | public pages | same as a visitor | n/a: no role-specific surface |
| staff | public pages | same as a visitor | n/a: role retired (0173) and no role-specific surface |
| doctor | public pages | same as a visitor | n/a: no role-specific surface |
| volunteer | public pages | same as a visitor | n/a: no role-specific surface |
| signed out | `/adopt`, `/adopt/<missing>`, `/` | new pages, language from header | pass (dev, curl) |

- [ ] Every role above tested — n/a: public pages only; signed-out is the role that matters and was tested
- [ ] A role that should not have access is blocked server-side — n/a: nothing here is restricted. The not-found page reads only `public_recent_adoptions` and never `residents`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the staff app's menu is untouched; the public header's first Adopt entry now reads "Meet the animals" (`publicNav.meetResidents`)
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a staff member does changed; the manual's mention of the "Meet our residents" menu entry is a wording tidy, not a behaviour
- [x] Translatable strings go through the translation path: the new strings are dictionary entries in both `en.ts` and `th.ts`, so nothing enters the translation queue; the Thai wording is the review's
- [ ] Mobile viewport (375px) — n/a: not driven in a browser pane this session; the not-found links are `min-h-11` and wrap; listed below
- [ ] Browser console clean — n/a: checked with `curl` only this session; listed below
- [x] Network clean — the pages checked returned their HTML; the missing-id page and `/our-work/nope` return 200 with `noindex` by design

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/adopt` in English and Thai; the `/adopt` Happy endings block is now the extracted `HappyEndings` component with the same markup
- [x] Any shared file touched checked from a second, unrelated page: `proxy.ts` and the dictionaries are shared; the full build and typecheck passed and `/` and `/adopt` both loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: confirmed at sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: all four, the first with the not-built part named
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-14-public-site-visitor-fold.md` (why no adopted/hidden wording, why the Worker cache key changed, which routes vary by language)
- [x] `README.md` still accurate: nothing it describes changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line in this PR, written for a shelter user. No manual step is outstanding: it is live on the next deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The header and cookie behaviour above was read off live responses; the claim that `public_recent_adoptions.id` is the placement id is read from migration 0123 (`p.id`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Worth doing here: open `/adopt` on Test with `Accept-Language: th` and no cookie, then with English, and confirm the English visit is never Thai (the edge cache key change)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the `Accept-Language` rule has no numeric boundary; its edges are in the unit test
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates line above is the only pasted output and is as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**: code only, so redeploying the previous SHA reverts it. A Thai visitor who already got a `locale=th` cookie keeps it, which is harmless (it is what the toggle would have set)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A missing page returns HTTP 200 with `noindex`, not 404 | accepted: the item allowed it; reason in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The not-found page looks right at phone width, in both languages, with the header, footer and Happy endings row | `/adopt/anything` on Test |
| 2 | A real Thai-language phone opens `/adopt` in Thai the first time, and the language button switches it to English and it stays there | Test site, from a phone |
| 3 | The Thai wording of the not-found message and the new list heading reads naturally | `/adopt`, `/adopt/anything` in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for a person

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
