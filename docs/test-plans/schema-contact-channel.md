# Feature test plan

## Header

| | |
|---|---|
| Feature | `site_content.preferred_channels`: the shelter's ordered contact channels for the public site. Schema half only |
| Backlog item | `docs/backlog.md` → Public website → **Settings → Website: let the shelter choose its preferred contact channel** (not ticked here; `contact-channel-picker` closes it) |
| Branch / worktree | `claude/schema-contact-channel` @ `C:\Development\Animal_Shelter_schema-contact-channel` |
| Dev server | not started. This change ships no runtime code |
| PR | see PR description |
| Tested by / date | Claude (automated) / 2026-09-29 |
| Carries a migration? | yes: `0111_site_content_preferred_channels.sql` |
| Tested at SHA | branch on `main` @ `fe53d6a`; the migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds a `not null text[]` column `preferred_channels`, default `{line}`, to the `site_content` singleton. The item asked for a defaulted-to-LINE column and suggested an ordered list; the list was chosen
- [x] Files/areas touched listed: `supabase/migrations/0111_site_content_preferred_channels.sql`; `scripts/check-preferred-channels.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: no policy or grant changed. `site_content`'s public-read and admin-update policies (0018) and table grants (0077) cover the new column. No code reads it yet
- [x] Anything explicitly **out of scope** written down: the picker, the `preferredChannels()` helper and every public page that hard-codes LINE first belong to `contact-channel-picker` (batch 8), as does the backlog tick

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (`build exited 0 after 240s`)
- [ ] CI green on the PR (runs the same three) — n/a: PR not open when this was written; the result is read from the PR check list and recorded in the next commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0110`), and no other in-flight branch carries one: this stream holds batch 7's only slot; `check-migration-numbers` reports ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `110 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `--dry-run` reviewed: `dry-run 0111_site_content_preferred_channels.sql … ok`
- [x] Applied to **dev** and recorded in `schema_migrations`: `applying 0111_site_content_preferred_channels.sql … ok`, then `111 applied, 0 pending`
- [x] File is re-runnable (`add column if not exists`, `drop constraint if exists` before `add constraint`). The harness runs the file again over the already-migrated table and asserts exactly one check remains
- [x] Existing rows still read correctly after the change: harness step A, the one row reads `{line}`, today's behaviour
- [x] **Constraints and defaults exercised against real rows** in `begin; … rollback;`: `scripts/check-preferred-channels.mjs`. Asserted: (A) singleton reads `{line}`; (B) `NOT NULL` array column, one check; (C) all six channels in a non-default order round-trip in order; (D) unknown channel, upper-case `LINE` and seven entries refused; (E) NULL refused, empty allowed; (F) `anon` reads it. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK singleton reads {line} | NOT NULL text[], 1 check after two runs | full ordered list round-trips | unknown / upper-case / 7 entries refused | NULL refused, empty allowed | anon reads it
  CONTEXT:  PL/pgSQL function inline_code_block line 56 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; exit 0 only on `HARNESS-OK`.) I did not run a deliberately broken copy to show the harness can fail
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive; undoing it is `alter table site_content drop column if exists preferred_channels`
- [x] Production apply plan stated for the release manager: Lutan applies `0111` to production `dbkodyyxxhtygxcxmfcu` from the main checkout (`--env production --dry-run`, then without), **before** `contact-channel-picker` deploys, because that code will select the column

## 4. Functional checks

- [x] Happy path works end to end: harness steps C and F are the admin save and the anon public read the feature will make
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads this column yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface; set and clear exercised in SQL (steps C, E)
- [x] Empty state renders sensibly: an empty array is allowed and documented as "built-in order" (step E)
- [x] Invalid input is rejected with a readable message, not a crash: at the schema level `check_violation` / `not_null_violation` (steps D, E); the readable message is the picker's job
- [x] Boundary cases checked: empty list, NULL, six entries (allowed) and seven (refused), wrong case, unknown value

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route; existing `admin_update_site_content` covers the column | — | — |
| management | n/a: no policy change | — | — |
| staff | n/a: no policy change | — | — |
| vet | n/a: no policy change | — | — |
| volunteer | n/a: no policy change | — | — |
| signed out | `site_content` via the anon key | SELECT the new column | read as `anon` (harness step F) |

- [ ] Every role above tested — n/a: no route, policy or grant changed; the one access the feature relies on (anon read) was tested
- [ ] A role that should not have access is blocked server-side — n/a: no new access granted; writes remain admin-only under the unchanged 0018 policy

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated and reads correctly at `/manual` — n/a: nothing visible; the picker PR documents it
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work: no page was loaded, because nothing in `src/` reads the column. Default `{line}` and no reader means the public pages, which hard-code LINE first, are unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: only the schema half is done; a note recording the shape chosen went on the `backlog` branch instead
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: ordered list vs one choice, array vs table, what is and is not checked in SQL
- [x] `README.md` still accurate. It does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: one defaulted column no page reads; nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The `{line}` reading of the existing row, the single check after a re-run and the anon read are all harness assertions. The claim that the public pages hard-code LINE first is from the backlog item, not re-read from source

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy; SQL only, already on the dev database)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the only bound is six entries; step C asserts six allowed and step D asserts seven refused
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads the new column

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No; the follow-on `contact-channel-picker` will, so production must have `0111` before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: additive column, nothing rewritten beyond the default on one row
- [x] Apply plan stated: file `0111`, production project, before the picker deploys. See §3

### Rollback

- [x] Rollback position stated, including what it does not cover: no Worker change, so `wrangler rollback` does not apply. The column is additive and safe to leave; the drop in §3 removes it, and once the picker ships dropping it breaks the public pages' query

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. Nothing here has a surface for a person to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output
- [x] Handed to the production release manager: the PR states that the production apply is Lutan's and must happen before the picker deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
