# Feature test plan

## Header

| | |
|---|---|
| Feature | The last topic in `/manual` can scroll to the top of the window |
| Backlog item | `docs/backlog.md` → **The last topics in the manual cannot scroll to the top of the window.** |
| Branch / worktree | `claude/manual-scroll-padding` @ `C:\Development\Animal_Shelter_manual-scroll-padding` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-09-29 (gates only; the page itself was not loaded) |
| Carries a migration? | no |
| Tested at SHA | `f24deb8` (code) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the last topic on show gets `min-height: calc(100dvh - 3rem)`, so it can reach the top of the window; the blank space is only that topic's shortfall, not a flat screenful
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/manual/page.tsx` only, plus docs. No `worker/`, no migration, no manual content
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role that reads `/manual`; the "last topic" follows the role filter, so it differs by role
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the `/manual` PNG screenshots (one full rerun is planned later); a tucked (hidden-until-found) last topic revealed by Find on page does not get the extra height

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `8c876f9`, no conflict
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 253s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

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

- [ ] Happy path works end to end — n/a: not driven; `/manual` redirects to `/login` and no test credentials were available, so `/manual#getting-help` landing at the top is under Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: layout only
- [ ] Empty state renders sensibly (no rows yet) — n/a: layout only, no rows involved
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven; short/tall last topic and the role filter are under Left for manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /manual | unchanged | not checked |
| management | /manual | unchanged | not checked |
| staff | /manual | unchanged | not checked |
| vet | /manual | unchanged | not checked |
| volunteer | /manual | unchanged | not checked |
| signed out | /manual | redirects to /login, unchanged | 307 to `/login?next=%2Fmanual` seen with curl |

- [ ] Every role above tested — n/a: layout change identical for every role; no access change
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: layout only, no topic content changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven, see Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: /manual could not be loaded (login required)
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: /manual could not be loaded (login required)

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: none loaded; other topics' deep links are under Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing merged touches `/manual`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate — n/a: no README-visible change
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: only the very end of the manual gains blank space so a deep link can land at the top; nobody would notice a difference in use
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — n/a: the sizing (100dvh - 3rem = window minus scroll-mt-6 minus the page's bottom padding) is reasoned from the CSS and not yet measured in a browser; that is why the landing check is left to a person

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold logic
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: no evidence pasted
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: `/manual` is signed-in and not edge-cached
- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] Rollback position stated, including what it does not cover — n/a: a CSS class; `wrangler rollback` reverts it and no migration is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `/manual#getting-help` lands with the topic at the top of the window, and the blank space under it looks acceptable | `/manual`, ~900px-tall window |
| 2 | Deep links to the first and a middle topic still land at the top with no jump | `/manual#…` |
| 3 | Same on a phone-width window; and with `?view=all` and as a role whose last topic differs | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: a person has not looked yet; see the pending line below

Manual verification by: pending: Lutan to look at the three rows above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: linked from the PR instead
- [ ] Handed to the production release manager — n/a: not yet

Result: pass

Release manager acknowledgement: pending
