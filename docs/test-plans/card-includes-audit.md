# Feature test plan

## Header

| | |
|---|---|
| Feature | A change to which cards include which is recorded and shown on Settings → Recent changes |
| Backlog item | `docs/backlog.md` → `#q8m4t`, `card_includes` has no audit trigger |
| Branch / worktree | `claude/card-includes-audit` @ `C:\Development\Animal_Shelter_card-includes-audit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (Opus 5.5), 2026-11-09 |
| Carries a migration? | yes, `0341_card_includes_audit.sql` |
| Tested at SHA | abf40aab (code; this plan is committed on top) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `card_includes` gets an audit trigger (and the `id` column `record_audit()` needs), and Recent changes lists its rows as "<card> includes <card>" by title in English and Thai
- [x] Files/areas touched listed: `supabase/migrations/0341_card_includes_audit.sql`; `src/lib/audit/recent-changes.ts`, `src/lib/audit/undo.ts`; `src/app/admin/recent-changes/page.tsx`; `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/releases.ts`; `docs/backlog.md` (tick), `docs/decisions/2026-11-09-card-includes-audit.md`, `docs/test-plans/shots/card-includes-audit-{en,th}.jpg`
- [x] Cards affected identified: none change what they grant. An audit trigger grants nothing, and the new `id` column is not read by the recompute or by any card check. Recent changes is Admin-only (outside the card system), so Admin alone sees the new rows. Signed-out public unaffected
- [x] Anything explicitly out of scope written down: `role_cards` and `card_grants` rows still show card keys rather than titles (decision file, *Found, not fixed*); `check-audited-tables.mjs` cannot see a table with neither trigger nor listing, reported for the planner, not rebuilt

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`176e98d0`, merge of `73222512`)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Pasted from this branch's run:

```
=== gates: typecheck exited 0 after 163s
=== gates: lint exited 0 after 463s
=== gates: test exited 0 after 66s
=== gates: build exited 0 after 291s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `0340_diet_settings_card.sql` is the highest on `origin/main`; the commit hook's `migration numbers: ok` confirmed it; this is the only migration stream in the batch
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: dev at 342 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0341_card_includes_audit.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0341_card_includes_audit.sql … ok`
- [x] File is re-runnable: `add column if not exists`, `create unique index if not exists`, `drop trigger if exists`
- [x] Existing rows still read correctly after the change: dev's 13 `card_includes` rows all have an `id`; `role_permissions` hashed identical before and after a delete-and-restore of one edge
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev, which reached its final `raise exception 'REACHED END: ALL PASS (rows before 13)'`. Asserted: an insert naming no id gets one and is logged as INSERT under it with both card keys; an update is logged as UPDATE under the same id with the old and new `included_card`; a delete is logged as DELETE under it with no new image; a duplicate `id` and a duplicate `(card, included_card)` are each refused with `unique_violation`; both `audit_card_includes` and `card_includes_recompute` exist; no row lacks an id. After rollback: 13 rows, none from the harness
- [x] Down-migration written, or the reason one is not needed is stated: not needed. Purely additive; to reverse, `drop trigger audit_card_includes`, `drop index card_includes_id_key`, `alter table card_includes drop column id`, and remove the table from `AUDITED_TABLES`
- [x] Production apply plan stated for the release manager: apply `0341_card_includes_audit.sql` to production (`dbkodyyxxhtygxcxmfcu`) **before** the deploy carrying this code. Order matters only for the page: the code reads only `audit_log` rows, so it is harmless without the migration; the migration is harmless without the code (rows log, labelled only by key in the filter until the code lands)

## 4. Functional checks

- [x] Happy path works end to end: one edge deleted and restored on dev in one transaction; both rows shown on Recent changes as "Adoption news includes View residents" / "ข่าวจากผู้รับเลี้ยง รวม ดูสัตว์ในความดูแล ไว้ด้วย" under "Cards a card brings with it" / "การ์ดที่การ์ดหนึ่งพ่วงมาด้วย" (screenshots in `docs/test-plans/shots/`)
- [x] Data persists — the rows are in `audit_log` (275851, 275852) and were read by the page after a full navigation
- [x] Create / edit / delete all exercised: insert, update and delete each logged, in the harness; insert and delete seen on screen
- [ ] Empty state renders sensibly — n/a: the page's empty state is unchanged; a `card_includes` filter with no rows uses the same list as every other table
- [x] Invalid input is rejected with a readable message, not a crash: duplicate id and duplicate key refused by the database in the harness; the page has no input for this table
- [x] Boundary cases checked: a card key `cards.ts` no longer knows falls through to the key itself (`isCardKey` guard in `page.tsx`); a row missing either column gets no pair and shows the plain name

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Recent changes | the two rows, readable, in both languages | as expected |
| any card login | Recent changes | refused: the page is Admin-only (`requireAdminUser`), unchanged by this PR | not re-tested, unchanged |
| signed out | Recent changes | sent to sign-in, unchanged | not re-tested, unchanged |

- [ ] Every login above tested — n/a: only Admin can open Recent changes and this PR does not change who can; the RLS on `card_includes` and `audit_log` is untouched
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed; the trigger is `security definer` through the existing `record_audit()`, adding no read path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual's Recent changes topic (`src/lib/manual/en.ts`, "Who changed what") already says changes to "roles and permissions" are recorded and that "Roles and permissions are not undone here at all", which is now true of a card's includes too; read, not changed
- [x] Translatable strings go through the translation path: both strings are in `en.ts` and `th.ts` dictionaries, seen rendered in Thai
- [x] Mobile viewport (375px) — no horizontal overflow on Recent changes in Thai (`scrollWidth` 375)
- [x] Browser console clean — no errors on Recent changes
- [x] Network clean — `/admin/recent-changes` 200; one RSC request aborted by the language switch's own refresh, not an error

## 6. Regression

- [x] The pages nearest the change still work: other rows on Recent changes (Role given to a login, Meme resident link) render as before, with their own Undo reasons; the table filter lists the new table in Thai
- [x] Shared file touched (`en.ts`, `th.ts`) checked from a second page by loading it: Settings (`/admin`) and the sidebar rendered in English and Thai
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (`#q8m4t`); the other open items mentioning `audit_log` (`#314hq`, `#ykefa`) are not closed by this
- [x] Non-obvious design choices added as a new file: `docs/decisions/2026-11-09-card-includes-audit.md`
- [x] `README.md` still accurate: it names neither `card_includes` nor an audited-table count
- [x] **Release notes.** `unreleased` gained an `admin: true` line: Recent changes is Admin-only, and Admin holds no card
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim is measured except one, labelled in the decision file as read from code: that the trigger without the `id` column would have failed every write (from `audit_log.row_id uuid not null` in `0121` and `record_audit()` in `0195`; not run, because it would break the shared dev table)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes; the code reads only `audit_log`, so either order is safe, and the apply plan in §3 says apply first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: additive (a new column with a default on a 13-row table, an index and a trigger)
- [x] Apply plan stated: `0341_card_includes_audit.sql`, production `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated: code rolls back with the usual Pi `--ref` rebuild; the migration is additive and safe to leave; reversing it is the four statements in §3

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high (latent) | Copying `0257`'s three trigger lines as briefed would have made every write to `card_includes` fail (`audit_log.row_id` not null, no `id`) | fixed in `0341` by adding the `id` column first |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording reads naturally: "การ์ดที่การ์ดหนึ่งพ่วงมาด้วย" and "<card> รวม <card> ไว้ด้วย" | Settings → Recent changes, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: a Thai speaker to read the two Thai strings

Manual verification by: pending: a Thai speaker to read the two Thai strings on Recent changes

Result: pass
