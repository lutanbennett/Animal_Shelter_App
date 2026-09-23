# Feature test plan

## Header

| | |
|---|---|
| Feature | Cashflow follow-ups: the "not priced yet" card becomes a link, plus CSV export of the cashflow table |
| Backlog item | `docs/backlog.md` → Management → **Make the "not priced yet" card on /management/cashflow actionable** (ticked); **Cashflow follow-ups** (c) CSV export (marked done, item stays open); **Base the vet forecast on recent visit frequency** (measured, left open on Lutan's call) |
| Branch / worktree | `claude/cashflow-followups` @ `C:\Development\Animal_Shelter_cashflow-followups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this branch; number recorded in the follow-up commit |
| Tested by / date | Claude (automated) 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `c7ab5bb`, the branch after syncing with `origin/main`. The only change `sync` brought in was `.github/workflows/ci.yml` (test-plan made `continue-on-error`), and none of the feature files were touched |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the third card on `/management/cashflow` links to the page where the missing prices are entered (or to the table's "Not priced yet" row when they span categories), and the table can be downloaded as CSV.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/management/cashflow/{CashflowView,page}.tsx`, `src/lib/management/cashflow.ts` (two new pure functions), `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions.md`. No `worker/`, no `supabase/migrations/`, no shared component changed (`StatCard` already took `href`).
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Only admin and management can reach the page, and that is unchanged. No data path, RPC or grant is touched.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised. The vet frequency rule is **not** built. Dev has 71 completed visits and none carries a cost; the rule needs a migration while 0073 is in flight; Lutan chose to keep the flat figure (see `docs/decisions.md`, 2026-09-24). Cashflow follow-ups (a), (b), (d), (e) and (f) are untouched.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (exit 0, one file: `.github/workflows/ci.yml`)
- [x] `npm run typecheck`: clean (exit 0)
- [x] `npm run lint`: clean (exit 0)
- [x] `npm run build`: succeeds (exit 0, with the dev server stopped first so they do not share `.next`)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data (no migration)

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the page reads the same `cashflow_forecast` rows as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, no constraint or default changed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end. On dev at 90 days the card read "8 — All in Medication", its link was `/management/medications`, and Download CSV produced `cashflow-2026-09-24-to-2026-12-22.csv`, whose figures matched the table (Sep: food 19061, medication 685.5 shown as ฿686, vet 800).
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page, the feature has no create, edit or delete
- [x] Empty state renders sensibly (no rows yet). With Medication switched off nothing was missing: the card lost its link and read "Everything in the window has a price." With every category off, the CSV button is disabled.
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the feature adds no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates). I ran `notPricedTarget()` and `cashflowCsv()` on hand-made grids covering: gaps in two categories (href `#not-priced`), the same grid with one category hidden (links straight to that category's page), and nothing missing (`null`). A category label containing a quote and a comma came out RFC 4180-quoted; 1234.567 rounded to 1234.57; unpriced counts appeared in their own column. The UTF-8 BOM was checked in the blob's bytes (`EF BB BF`). The multi-category anchor was checked in the browser: navigating to `#not-priced` scrolled the row into view and applied the highlight.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/cashflow` | page, card link, CSV | driven in the browser on dev (the signed-in dev session) |
| management | `/management/cashflow` | same as admin | unchanged guard, not retested |
| staff | redirected | refused by `requireManagementUser()` | unchanged guard, not retested |
| vet | redirected | refused | unchanged guard, not retested |
| volunteer | redirected | refused | unchanged guard, not retested |
| signed out | redirected to sign-in | refused | unchanged guard, not retested |

- [ ] Every role above tested — n/a: access is untouched; `page.tsx` changes only by passing the window dates to the view, and the route guard, RPC and grants are byte-identical to `main`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access path changed; the CSV is built client-side from rows the page already had, with no new route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): two steps added to the cashflow topic, for the card shortcut and for Download CSV
- [x] Translatable strings go through the translation path. The new strings are in both the `en` and `th` dictionaries, which typecheck requires to match. They are static UI strings, not free-text rows for `/management/translations`
- [x] Mobile viewport (375px) — no overflow, controls reachable. The browser pane was 590px wide, which is the phone layout: two-column cards, no chart. The card and the CSV button were both visible and reachable, and the table scrolls inside its own container as before
- [x] Browser console clean — no errors or React warnings (none reported during the run)
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the feature makes no new request; the CSV is a local blob

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/management/cashflow` at 90 days, including the chart and table, the category toggles and the vet note
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file. `/` loaded 200 on this branch's dev server (it was the first page compiled). `manual/en.ts` changed by two array entries in the cashflow topic and the build prerendered it without error
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought only a CI workflow line, and typecheck, lint and build all ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead). The card item is ticked into Completed → Management. The vet item and Cashflow follow-ups stay open, with the outcome noted on each
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: vet left flat (with the dev measurements and the worked-out design), card target rule, CSV "not priced" column
- [ ] `README.md` still accurate — n/a: README does not describe the cashflow page's controls
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The vet figures (71 completed, 0 with cost, 20 in the last quarter, 1 of 2 booked with a cost, estimate 800.00) came from a read-only query against dev in this session. The card and CSV behaviour came from the browser and from the function runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the CSV filename uses the window the server already resolved
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the one branch (one category vs several) was tested on both sides
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: no tool output is pasted; section 4 describes the checks in prose
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering (no migration)

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts it completely: the change is UI and docs only, with no schema or data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the downloaded CSV in Excel (or Google Sheets) with the site in Thai and confirm the headings read correctly. The BOM was checked in the bytes; no spreadsheet app was opened | `/management/cashflow` → Download CSV |
| 2 | Click the "Not priced yet" card and confirm it takes you where you expect: medication only on dev today, so it opens Medications | `/management/cashflow` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await a person

Manual verification by: pending: CSV opened in a spreadsheet in Thai, and the card click, by Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — awaiting manual verification

Result: pass
