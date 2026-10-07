# Feature test plan

## Header

| | |
|---|---|
| Feature | Explain the two overnight `public-views` failures; stop a migration the grants check refuses from reaching the shared dev database |
| Backlog item | `docs/backlog.md` → "Two `public-views` failures overnight on 2026-10-07 that nothing explains" |
| Branch / worktree | `claude/public-views-overnight` @ `C:\Development\Animal_Shelter_public-views-overnight` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not used: no UI change) |
| PR | opened after this commit |
| Tested by / date | Claude (Opus 5.5), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `d32519e8` (the code change; later commits are documentation) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the two failures are explained (0153's first draft let `anon` execute `is_admin()` on dev from 00:19:57Z to ~00:36Z), and the gap that let it happen is closed: `apply-migrations.mjs` refuses to apply a file `check-migration-grants` rejects; `check-public-views.mjs` repeats its FAIL lines at the end
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/apply-migrations.mjs`, `scripts/check-public-views.mjs`; docs: `docs/decisions/2026-10-07-public-views-overnight.md`, defect 2 in `docs/test-plans/public-views-impact-figures.md`, `docs/backlog.md`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — none; developer scripts only. The signed-out tier is what the diagnosis is *about*, and it was re-checked (§6)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — how `check-public-views` decides pass/fail is unchanged (the failures were a correct assertion, not flakiness); no workflow file changed; production was not queried from this worktree (the decision file gives the reasoning why it never had the grant)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in 0159's file and plan from #439; exit 0)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 309s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration (run anyway, read-only: 159 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration of this branch's own; the dry-run path of the new guard was exercised with a probe file, see §4
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the diagnosis: `gh run view --log-failed` on both runs shows one FAIL each, `is_admin(): anon EXECUTE is refused — HTTP 200: false` (00:25:31Z, 00:32:39Z); `schema_migrations` dates 0153 to 00:19:57Z; `git show 67d5914b` has the anon grant, `d7ae1572` removes it; the job across 12 CI runs 00:00–01:17Z failed exactly inside the window. The guard: with a probe `0160_zz_probe.sql` (a function with no revoke, ending `select 1/0` so no path could keep it), a real apply printed the grants finding and `check-migration-grants refuses the pending file(s) above, so nothing was applied`, exit 1, before any SQL was sent; the probe was then deleted
- [x] Data persists — reload the page and the change is still there — the inverse is what matters here, and was checked: after both probe runs (and the post-sync re-run), `--status` reads `159 applied, 0 pending` and `159 file(s), 159 applied row(s)` against `origin/main`; no `0160` row
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: scripts with no create/edit/delete surface
- [x] Empty state renders sensibly (no rows yet) — with nothing pending the guard is skipped (`if (pending.length)`); `--status` and an ordinary run print as before. And `check-public-views` against today's dev passes all 245 checks with no failure block printed, exit 0
- [x] Invalid input is rejected with a readable message, not a crash — the refusal names the file and the finding and says why the shared database matters
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `--dry-run` with the failing file prints the finding, `Dry run continues; a real apply would refuse these files.`, then runs the file in `begin…rollback` (the database rejected the probe at `division by zero`; nothing kept)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app change | n/a |
| management | n/a | no app change | n/a |
| staff | n/a | no app change | n/a |
| vet | n/a | no app change | n/a |
| volunteer | n/a | no app change | n/a |
| signed out | `is_admin()` via `/rest/v1/rpc/` on dev | refused | `ok is_admin(): anon EXECUTE is refused — HTTP 401`; `has_function_privilege('anon','public.is_admin()','execute')` = false |

- [ ] Every role above tested — n/a: no role-visible change; the signed-out row is the one the diagnosis concerns and it was tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — anon calling `is_admin()` directly is refused (401), and the app-access gate harness reports `HARNESS-OK` (`anon refused all`, `public_viewer read 0 rows of 18 internal objects`)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: developer scripts, nothing a shelter user reads about
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no pages; the nearest things are the two scripts and the checks that guard the public tier — `node scripts/check-public-views.mjs` (exit 0, 245 ok, `is_admin()` refused 401), `node scripts/check-app-access-gate.mjs` (`HARNESS-OK app access gate`, exit 0), `apply-migrations.mjs --status` (unchanged output)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought only 0159's file and test plan; gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with what closed it; `grep` for `apply-migrations`, `check-migration-grants`, `check-public-views`, `is_admin` across open items found nothing else this closes
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-07-public-views-overnight.md` (the cause, the run-by-run window, why it is a real defect and not flakiness, why production never had it, the two changes, what was rejected); open defect 2 in `docs/test-plans/public-views-impact-figures.md` updated to point to it
- [x] `README.md` still accurate — it does not describe what `apply-migrations.mjs` checks before applying; the script's own header now does
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no user-visible change — a CI check and a developer script
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The window's start is `schema_migrations.applied_at`; its end is bracketed by the last failing and first passing run timestamps, not the fix commit; "every run inside failed, every run outside passed" is from `gh run view` on all 12 runs 00:00–01:17Z. The one reasoned claim — production never held the grant — is labelled as reasoning in the decision file, with the guard it rests on

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; both changed files are developer scripts outside the app bundle
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic changed; the overnight timing was coincidence of when 0153 was applied, not a clock dependency
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: no deploy-time evidence; the gates lines in §2 are pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing deploys

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: nothing deploys
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit; both changes are in developer scripts nothing imports at runtime. Reverting removes the pre-apply grants check (lint still catches the file, but only after it has reached dev) and the failure summary. It does not touch any database: nothing here changed a grant

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low (dev only, no row exposed) | From 00:19:57Z to ~00:36Z on 2026-10-07 `anon` could execute `is_admin()` on dev (0153's first draft); two unrelated branches' `public-views` went red | fixed: the grant was already gone; `apply-migrations.mjs` now refuses such a file before it reaches the database |
| 2 | low (diagnosability) | `check-public-views` printed its one FAIL among ~245 ok lines with only passes at the tail, so the cause read as "nothing explains" | fixed: FAIL lines repeated after the summary. Only the passing path was run live; the failure block is four lines and was not exercised against a real failure, since producing one would mean granting something to anon on the shared dev database |

## Left for manual verification

Empty. There is no screen, wording or role behaviour to look at: the change is two developer scripts and their records.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below

Manual verification by: n/a: no user-visible surface — two developer scripts and documentation

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links this file instead of duplicating it
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys; both files are developer scripts outside the app bundle

Result: pass

Release manager acknowledgement: pending: not acknowledged yet — nothing in this PR deploys  Date: —
