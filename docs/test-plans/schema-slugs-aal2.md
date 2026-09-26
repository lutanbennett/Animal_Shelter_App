# Feature test plan

## Header

| | |
|---|---|
| Feature | Schema half for three batch-4 features: `site_pages` slugs `relocation` and `shelter-friends-join`, and `aal2` required for writes to `user_roles` |
| Backlog item | `docs/backlog.md` → **A "Pet relocation" information page on the public site**, **A "Become a Shelter Friend" page for businesses that want to help**, **Settings → Security requires 2-step verification** (none ticked here; each is ticked by its feature PR) |
| Branch / worktree | `claude/schema-slugs-aal2` @ `C:\Development\Animal_Shelter_schema-slugs-aal2` |
| Dev server | not started — this change ships no runtime code |
| PR | #164 |
| Tested by / date | Claude (automated) / 2026-09-27 |
| Carries a migration? | yes — `0099_site_pages_relocation_friends_join.sql`, `0100_user_roles_require_aal2.sql` |
| Tested at SHA | `d760cf4` on `main` @ `6b383fd` (#162); the two migrations, the harness, `decisions.md` and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `0099` widens `site_pages_slug_check` and seeds the two new page rows; `0100` adds restrictive RLS policies so an insert/update/delete on `user_roles` made with a user's JWT needs `aal2`, as the 2-step item's "small schema PR first" asks
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — the two migrations; `scripts/check-user-roles-aal2.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin only, and only on the direct Data API path: an admin's aal1 JWT can no longer write `user_roles`. Every app write to `user_roles` uses the service role and is unaffected (harness E). No other role could write `user_roles` before or after (harness D)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the pages, their routes, `/admin/website` editors and links (batch 4); 2-step enrolment, step-up and the `aal2` check inside each `src/app/admin/security/` action (batch 4 — the policy does **not** cover those, since they bypass RLS); a factor-removal mode for `scripts/bootstrap-admin.mjs` (batch 4; it currently only creates the first admin). See `docs/decisions.md`, 2026-09-27

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — "Already up to date", then pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 297s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR (runs the same three) — all 3 checks pass on #164 (run 36266975726)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `origin/main` tops out at `0098_status_alerts.sql`; `gh pr list --state open` returned `[]`; the commit hook printed `migration numbers: ok — 0099…, 0100… (against origin/main 6b383fd, highest 0098_status_alerts.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `98 applied, 2 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0099_site_pages_relocation_friends_join.sql … ok`, `dry-run 0100_user_roles_require_aal2.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0099… ok`, `applying 0100… ok`; `--status` afterwards lists both as applied here and not yet on `origin/main`, as expected before merge
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `0100` is executed twice inside the harness; `0099` is `drop constraint if exists` + re-add and `insert … on conflict (slug) do nothing`
- [x] Existing rows still read correctly after the change (checked against real dev data) — on dev after the apply, the two new `site_pages` rows exist (`relocation` / "Pet relocation", `shelter-friends-join` / "Become a Shelter Friend", one translation queued each) and the constraint accepts the five old slugs (the existing rows survived re-adding it); dev's 2 live admins still resolve and read (harness A)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-user-roles-aal2.mjs`, against dev's real `user_roles` plus throwaway logins. Asserted: (A) an admin at aal1 still resolves as `admin` via `current_user_role()` and reads every `user_roles` row — i.e. **no admin is locked out of anything today**; (B) the same admin at aal1 is refused an insert (`insufficient_privilege`) and updates/deletes 0 rows, and a JWT with no `aal` claim updates 0 rows; (C) at aal2 the same insert, update and delete each affect 1 row, so the policy is satisfiable once TOTP exists; (D) staff at aal2 are still refused — aal2 grants nothing by itself; (E) the service role, used by every `/admin/security` action and by `scripts/bootstrap-admin.mjs`, inserts, upserts, archives, restores and deletes 1 row each. Output, unedited (run after the apply):

  ```
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0100_user_roles_require_aal2.sql ran twice | 2 real live admin(s) on dev | A: admin aal1 resolves admin, reads 8 rows | B: admin aal1 insert refused, update 0, delete 0; no aal claim update 0 | C: admin aal2 insert 1, update 1, delete 1 | D: staff aal2 insert refused, update 0 | E: service role insert, upsert, archive, restore, delete all 1
  CONTEXT:  PL/pgSQL function inline_code_block line 71 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.) `service_role` and `postgres` have `rolbypassrls = true` on dev, `authenticated` false — checked in `pg_roles`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: `0100` is undone by dropping its three policies, and nothing depends on them; `0099`'s rows are unused until the feature halves ship, and narrowing the constraint back means deleting them first
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0099` and `0100` to production `dbkodyyxxhtygxcxmfcu` by Lutan from the main checkout after merge (`--env production --dry-run`, then without). Order-independent of any deploy: no code reads either yet. `0100` must be on production **before** the 2-step feature deploys

## 4. Functional checks

- [x] Happy path works end to end — harness C (an aal2 admin writes) and E (the service-role path every current action uses)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these yet
- [x] Create / edit / delete all exercised (whichever the feature has) — insert, update and delete on `user_roles` at aal1, aal2, as staff and as service role (harness B–E)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; `/admin/website` filters rows to `SITE_PAGE_SLUGS`, so the new rows are not shown
- [x] Invalid input is rejected with a readable message, not a crash — at schema level: an aal1 insert raises `insufficient_privilege` (harness B)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the missing-claim case (no `aal` in the JWT) is refused the same as aal1

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `user_roles` via own JWT | reads at aal1; writes only at aal2 | harness A, B, C — as expected |
| management | `user_roles` via own JWT | no access, unchanged | n/a: no policy grants management anything on `user_roles`, and a restrictive policy cannot add access |
| staff | `user_roles` via own JWT | no writes even at aal2 | harness D — as expected |
| vet | `user_roles` via own JWT | no access, unchanged | n/a: same as management |
| volunteer | `user_roles` via own JWT | no access, unchanged | n/a: same as management |
| signed out | `user_roles` | no access, unchanged | n/a: anon has no policy on `user_roles`; not changed |

- [x] Every role above tested — admin and staff driven in the harness; the others are reasoned `n/a` in the table: restrictive policies only narrow
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — harness B and D are exactly the direct Data API path

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PRs document the pages and 2-step
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the two seed titles went through the `site_pages` insert trigger: one `translations` row each on dev (queried, not viewed on the page)
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded; `/admin/security` writes with the service role, which harness E shows is unaffected, and `/admin/website` reads only known slugs. Loading `/admin/security` is left for manual verification below
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing; gates green on the tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this stream closes no item; the brief leaves all three to their batch-4 feature PRs
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the slug names, why the aal2 policy is unconditional and safe before 2-step exists, that it is defence in depth and not the enforcement, and the bootstrap-admin recovery gap
- [x] `README.md` still accurate — it does not list policies or slugs; the recovery write-up is the feature half's
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: no screen shows the new rows yet, and the only path the policy closes is one no user takes (writing roles straight to the Data API)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — no lock-out, service-role unaffected, staff still refused, missing claim refused: harness output above; `BYPASSRLS` from `pg_roles`; seeded rows and queued translations queried on dev. "No app code writes `user_roles` with a user JWT" is from reading every reference in `src/` and `supabase/migrations/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already on the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the aal1/aal2/no-claim cases are all asserted anyway
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: public pages read `public_site_pages` by known slug; no new slug is routed yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — no; the batch-4 features will, so production needs `0099`/`0100` before they deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive — a widened check, two inserted rows, three new policies
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change. `0100`: drop the three `user_roles_*_requires_aal2` policies. `0099`: safe to leave; to undo, delete the two rows (and their queued translations) and restore the five-slug constraint

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As an admin, change a test login's role (or archive and restore it) on Settings → Security and see it save — confirms the page's service-role path is untouched by `0100`, from the page rather than the harness | `http://localhost:3007/admin/security` or `test.lannacare.org/admin/security` (dev database) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 awaits Lutan

Manual verification by: pending: item 1, a role change saved on /admin/security on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager — the PR states the production apply as Lutan's

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
