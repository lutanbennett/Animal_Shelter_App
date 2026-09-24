# Feature test plan

## Header

| | |
|---|---|
| Feature | Release notes as an accordion on `/releases` |
| Backlog item | `docs/backlog.md` → Documentation → **Release notes as an accordion: version and title first, details on click.** |
| Branch / worktree | `claude/release-notes-accordion` @ `C:\Development\Animal_Shelter_release-notes-accordion` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #92 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `930579f` (code), synced as `d5ae348`; this file is the commit after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each release on `/releases` is a native `<details>` whose summary is version · title, date and badges, the newest open and the rest closed, and a `#v<version>` link opens the release it targets
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/releases/page.tsx`, new `src/app/releases/OpenReleaseFromHash.tsx` (client child, renders nothing), `src/lib/releases.ts` (one `unreleased` line, no restructuring), `src/lib/manual/en.ts` (release-notes topic only), `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role reads `/releases`; who can reach it is unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no Expand all / Collapse all (three releases; `docs/decisions.md`); `/manual` screenshots not regenerated (full rerun planned after this batch); the release mail (`worker/release-mail.mjs`) is untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in #89, shelter-friends schema; no overlap)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 103s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #92, run 35988993224: `check` pass (1m28s), `test-plan` pass

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads a static TypeScript register, not the database
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev, signed in, `/releases` rendered three `<details>`: `v0.2.0` open, `v0.1.0` and `v0.0.1` closed; each summary's text was exactly version · title, date and badges (e.g. "0.1.0 · Dates, navigation and the cashflow forecast 24 September 2026 Major Dev"). Clicking the 0.0.1 heading opened it, clicking again closed it
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved; open/closed state is deliberately not remembered, and a reload returns to newest open, the rest closed (observed)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only page
- [x] Empty state renders sensibly (no rows yet) — the dev-only "Not released yet" block is still a plain section, not a `<details>` (checked: not inside one), and fully expanded; `releases` is never empty (0.0.1 is the baseline)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a hash naming no release (or a non-`<details>` id) is ignored by the effect
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — keyboard: focused a summary, a real Enter keypress opened it, Space closed it, Tab moved focus to the next summary with a visible outline. Anchors, both code paths: `/releases#v0.1.0` and `#v0.0.1` loaded cold in fresh tabs each landed on that release **open** (others unchanged, newest still open) and scrolled as far as the page allows (with three releases the last two can't reach the top of the viewport; the page was at its maximum scroll); an in-page `<a href="#v0.0.1">` clicked while already on `/releases` fired `hashchange` once and opened 0.0.1 (link injected for the test and removed — no such link exists on the page yet). Long two-line title: the chevron sits on the first line (Defect 1)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | accordion as above | driven in the browser, signed in by Lutan (admin: the menu shows Security): as expected |
| management | `/releases` | same page — no role-dependent rendering | not signed in as; the page has no role branches |
| staff | `/releases` | same | not signed in as; no role branches |
| vet | `/releases` | same | not signed in as; no role branches |
| volunteer | `/releases` | same | not signed in as; no role branches |
| signed out | nothing | sent to sign-in, as before | observed: `/releases` redirected to `/login?next=%2Freleases` before sign-in |

- [ ] Every role above tested — n/a: the page renders identically for every role (no role checks in it), and access is unchanged by this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access granted or withdrawn

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the release-notes topic's new step ("Click a release to see what changed in it…") is present on `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: `/releases` and the manual are English only; no dictionary strings added
- [x] Mobile viewport (375px) — no overflow, controls reachable — `scrollWidth` not greater than 375; the title wraps beside the chevron and the badges sit on the date line; collapsed rows readable
- [x] Browser console clean — no errors or React warnings — a fresh tab loading `/releases#v0.1.0`, then a hash change, logged only the DevTools info line and `[HMR] connected`. An earlier tab showed one E394 "unexpected response was received from the server"; it had been through a dev-server restart, sign-in and a hot reload of this page's edit, and did not recur on a fresh load
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every request on that fresh load returned 200; the only client chunk added is `OpenReleaseFromHash`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/releases` (all three releases), `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `manual/en.ts` loaded via `/manual`; `releases.ts` is also read by `scripts/deploy.mjs` and the Worker — only an array element was added, the shape is unchanged, and `build` passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought #89 (migration 0076, scripts, docs); none of it touches `/releases`, and the gates above ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — `<details>`, newest open, the hash effect on mount and `hashchange`, no Expand all
- [x] `README.md` still accurate — it does not describe the release notes page's layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: release notes now show each release as a single line, click one to see what changed, the newest opens by itself
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "only the in-page click fires `hashchange`" was observed (counter at 1 after the click; the cold loads opened via the mount path); the page staying a server component is from the build output and the single client chunk on the network log

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; release dates are formatted in UTC as before
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
| 1 | low | On a title that wraps to two lines the chevron was centred between the lines, detached from the version number | fixed — pinned to the first line (`self-start mt-1.5`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, ideally an iPhone in Safari (only Chromium's phone emulation was driven): each release shows **one** chevron (no default triangle beside it), tapping a release opens and closes it, and the chevron turns | `/releases` on `test.lannacare.org` or dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is outstanding; see the pending line below

Manual verification by: pending: a real-phone (Safari) look at the accordion (Left for manual verification 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is fixed
- [x] Checklist pasted into the PR — in #92’s description
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
