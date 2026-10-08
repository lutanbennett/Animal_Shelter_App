# Feature test plan — website-content-grant

## Header

| | |
|---|---|
| Feature | Management holds `website.content`, and the three site tables' write policies ask that cell instead of `is_admin()` |
| Backlog item | `docs/backlog.md` → **Let Management edit the impact figures: decide whether Management holds `website.content`** (ticked) |
| Branch / worktree | `claude/website-content-grant` @ `C:\Development\Animal_Shelter_website-content-grant` |
| Dev server | not started — the change is a permission cell and three policies; the page and its actions are unchanged code, proved under each role's own login in the database |
| PR | opened from this commit |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | yes — `0163_management_website_content.sql` |
| Tested at SHA | `90ce89bb` (after sync with `origin/main` `52b7f02a`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's own answer (Lutan, 2026-10-08): Management holds `website.content`, which is "the cell plus those three policies rewritten to `has_permission('website.content')`"
- [x] Files/areas touched listed — `supabase/migrations/0163_management_website_content.sql`; `scripts/check-website-content-grant.mjs` (new proof); `scripts/check-permission-parity.mjs` (`WIDENED_BY_DECISION`); `docs/roles-and-permissions.md` (§4 Mgmt column); `src/lib/manual/en.ts` (website topic roles, two role summaries); `src/lib/releases.ts`; `docs/backlog.md`; `docs/decisions/2026-10-08-management-website-content.md`
- [x] Roles affected identified — management gains the cell and the three tables' writes; admin unchanged (has_permission admits Admin first); 2IC, staff, vet, volunteer, public viewer and signed-out unchanged
- [x] Anything explicitly **out of scope** written down — the 2IC is **not** given the cell (the decision named Management only; a new decision if wanted). No page, action or menu code changes: `/admin/website` already asks `website.content` and already sits under Management (`section: "management"`, #448)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `52b7f02a` merged in cleanly (one backlog line)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 257s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — the commit hook's `migration numbers: ok — 0163 (against origin/main 52b7f02a, highest 0162_zone_colour.sql)`; the brief names this as the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 162 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0163_management_website_content.sql … ok`; the consumer warning names `routes.ts` as differing from release 0.21.0, which is expected (the menu entry is #448's, and reads the cell)
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: not yet — applied from this branch only on Lutan's go to merge (CLAUDE.md), and this line is ticked in that commit
- [x] File is re-runnable — `on conflict do nothing` for the cell; `alter policy` sets the same expression each time. The harness replays the file on a dev that already has the "before" state put back, then asserts
- [x] Existing rows still read correctly after the change — no table or row changes; public reads (`public_read_*`) are untouched. `check-app-access-gate.mjs` HARNESS-OK: every login reads the 12 public objects exactly as anon
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev — `node scripts/check-website-content-grant.mjs`. Asserted, under each role's own JWT, against the real `site_content`, `site_pages` and `impact_baselines` rows: *before* (no cell, the three `is_admin()` policies put back) only admin holds the cell and writes `site_content`, `site_pages` and `site_content_photos`, and management is refused all three; *after* (the 0163 file replayed) admin and management hold the cell (read and edit) and write all three plus `impact_baselines`; the 2IC, staff, volunteer, vet and public viewer hold nothing and write 0 rows in both phases; anon refused. Unedited output:

```
HARNESS-OK website-content-grant | before: only admin holds the cell and writes site_content, site_pages, site_content_photos; management refused on all three | after (0163 replayed): admin and management hold it and write all three; 2IC, staff, volunteer, vet, public_viewer still no and 0 rows; anon refused | before/admin: cell edit=1, cell read=1, impact_baselines update (control)=1, site_content update=1, site_content_photos insert=1, site_pages update=1 | before/management: cell edit=0, cell read=0, impact_baselines update (control)=0, site_content update=0, site_content_photos insert=-1, site_pages update=0 | before/sic: cell edit=0, cell read=0, impact_baselines update (control)=0, site_content update=0, site_content_photos insert=-1, site_pages update=0 | after/admin: cell edit=1, cell read=1, impact_baselines update (control)=1, site_content update=1, site_content_photos insert=1, site_pages update=1 | after/management: cell edit=1, cell read=1, impact_baselines update (control)=1, site_content update=1, site_content_photos insert=1, site_pages update=1 | after/sic: cell edit=0, cell read=0, impact_baselines update (control)=0, site_content update=0, site_content_photos insert=-1, site_pages update=0
```

- [x] Down-migration written, or the reason one is not needed is stated — not written: the undo is in the file's header (delete the cell, restore the three `is_admin()` expressions from `0153`), and the harness's "before" block is exactly that undo, run against dev
- [x] Production apply plan stated for the release manager — `0163_management_website_content.sql` on `dbkodyyxxhtygxcxmfcu` with the next release. No code depends on it to work (Admin's bypass is unchanged); without it, a Management login simply does not see the page

## 4. Functional checks

- [x] Happy path works end to end — at the database, which is where it was broken: a Management login's `has_permission('website.content')` (what `requirePermission` and every action's `can()` ask) and its writes to all three site tables succeed after 0163 and fail before it (§3)
- [ ] Data persists — n/a: no new data path; the writes are the existing actions' own statements, unchanged
- [x] Create / edit / delete all exercised — update on `site_content` and `site_pages` and insert on `site_content_photos` (the `for all` policy also covers its update and delete, same expression) under each login, §3
- [ ] Empty state renders sensibly — n/a: no new screen
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input changed; the actions' own validation is untouched
- [ ] Boundary cases checked — n/a: no threshold; the boundary is who holds the cell, and every role was run on both sides of it

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management → Website, all writes | unchanged: yes | yes before and after (harness) |
| management | Management → Website, all writes | no before, yes after | 0 / refused before; cell and all writes after (harness) |
| staff | nothing on the website | no | no cell, 0 rows, both phases (harness) |
| vet | nothing on the website | no | no cell, 0 rows, both phases (harness) |
| volunteer | nothing on the website | no | no cell, 0 rows, both phases (harness) |
| signed out | public reads only | refused | anon refused every probe (harness); app-access gate HARNESS-OK |

The 2IC and the public viewer were also run: no cell and 0 rows in both phases.

- [x] Every role above tested — in one rolled-back transaction on dev, each under its own login
- [x] A role that should not have access is blocked server-side — the policies refuse the writes, not the menu; staff, vet, volunteer, 2IC and public viewer wrote 0 rows

## 5. Cross-cutting

- [x] Nav entry correct — no nav code changed; `src/lib/permissions/routes.ts` gives `/admin/website` `section: "management"` explicitly, and `sectionOf()` returns that before falling back to the path (`/admin/` would mean Settings). Visibility is `canOpen(perms, route)` on the `activity`, so with the cell a Management login sees it under Management only
- [x] Manual updated — the website topic's `roles` now include management; the admin role summary no longer lists the website under Settings, and the management summary names it. `check-permission-catalogue.mjs` all ok
- [ ] Translatable strings go through the translation path — n/a: no new interface text; the manual is English-only and the release line is a release note
- [ ] Mobile viewport (375px) — n/a: no layout changed; the page is already `device: "any"`
- [ ] Browser console clean — n/a: no client code changed
- [ ] Network clean — n/a: no client code changed

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles `/admin/website` and the manual; `check-perm-convert-admin.mjs` GREEN before apply (134 checks); `check-role-write-policies.mjs`, `check-migration-grants.mjs`, `check-policy-role-names.mjs` (GREEN), `check-new-policy-role-names.mjs` (ok), `check-view-write-grants.mjs` (GREEN), `check-app-access-gate.mjs` (HARNESS-OK) all pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared file is `src/lib/manual/en.ts`, and the change is two strings and one `roles` array; nothing else reads those values. The build compiled every page that imports it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought one backlog line; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — and the menu-split item's "still open elsewhere: the `website.content` grant" note now says it closed with `0163`. Searched the open items for `website`, `site_content`, `site_pages`, `is_admin` and `impact fig`: none other is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-management-website-content.md` (why the policies ride with the cell, the 2IC left out, how the menu section is decided, the parity widening)
- [x] `README.md` still accurate — it does not list who holds which cell
- [x] **Release notes.** — one line in `unreleased`: Management can now edit the public website. The Director will notice it the first time she opens the menu as Management on her phone
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — "no role held the cell" and "the saves would be refused" are the harness's *before* phase; the menu claim is read from `sectionOf()` and `canOpen()`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold; every role was run on both sides of the one cutoff (holding the cell)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates and harness output above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: public reads are untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no new reader: the page, actions and menu entry already ask `website.content`. Order does not matter for safety; until `0163` is on production, Management simply does not see the page
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: it rewrites three policy expressions and adds one row; no data is touched
- [x] Apply plan stated — `0163` on production with the next release

### Rollback

- [x] Rollback position stated — a code rollback does not revert `0163` and does not need to: no code depends on it. To take the website back from Management, the undo in the file's header (delete the cell, restore the three `is_admin()` expressions) as a new migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `check-permission-parity.mjs` is RED on dev before this change (vet mismatches recorded and left red by design, plus nine broken probes); not caused here | not this PR — with the paper updated and 0163 not yet applied it shows the expected website rows until the apply; `WIDENED_BY_DECISION` covers the retired `isAdminRole` predicate after it |
| 2 | info | Accepted consequence: anyone holding the Management role can change the public site | accepted — Lutan, 2026-10-08 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as Management (ideally the Director on her phone), the menu's Management section shows Website, it opens, and a small save (e.g. the tagline) works | Management → Website on dev, after `0163` is applied |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — one item is waiting for a Management login to look, after the apply

Manual verification by: pending: a Management login opens Management → Website and saves, after 0163 is applied to dev

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — set at merge
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
