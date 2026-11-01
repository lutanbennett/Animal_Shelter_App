# Feature test plan — translations-propose-schema

## Header

| | |
|---|---|
| Feature | Schema half of splitting proposing a Thai label from approving one: `translations.propose` and the `propose_translations` card |
| Backlog item | `docs/backlog.md` → **SPLIT PROPOSING A THAI LABEL FROM APPROVING ONE** (left open: the app half is outstanding) |
| Branch / worktree | `claude/translations-propose-schema` @ `C:\Development\Animal_Shelter_translations-propose-schema` |
| Dev server | started on `http://localhost:3008` for a browser check that could not be signed in (see section 6) |
| PR | opened after this plan, number on the PR itself |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | yes — `0296_translations_propose_activity.sql` |
| Tested at SHA | `05179631` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `propose_label_th()` asks a new `translations.propose` activity carried by a new card while `approve_label_th()` keeps asking `translations.manage`; the item's *Done when* is met for the database half only
- [x] Files/areas touched listed — `supabase/migrations/0296_translations_propose_activity.sql`, `src/lib/permissions/catalogue.ts`, `src/lib/permissions/cards.ts`, `src/lib/permissions/cards.test.mjs`, both dictionaries (`en.ts`, `th.ts`), `scripts/check-cards-count.mjs`, `scripts/prove-translations-propose.mjs` (new), `docs/card-walkthrough.md` (generated), `docs/decisions/2026-11-01-translations-propose-schema.md`, this plan
- [x] Roles affected identified — by card, per `CLAUDE.md`: holders of the `translations` card gain proposing and lose nothing; the new `propose_translations` card is held by nobody; Admin is untouched
- [x] Anything explicitly **out of scope** written down — the propose control's gating, the route entry and page guard, `worker/translations.mjs`, `scripts/draft-label-thai.mjs`, and the machine login are all the app half's; listed in the decision file section 4

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (no migration came in with it, so `0296` is still the next number)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the file the run wrote to, not from a tail:

```
=== gates: typecheck exited 0 after 33s
=== gates: lint exited 0 after 185s
=== gates: test exited 0 after 19s
=== gates: build exited 0 after 81s
gates: typecheck=0 lint=0 test=0 build=0
```

  (A first run failed `test` on `cards.test.mjs`, which pinned thirty-nine cards. Fixed, regenerated the walkthrough, merged `main`, and re-ran; the block above is the second run.)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0296` after `0295`; `gh pr list` shows no other open schema PR, and `worktree.mjs` printed `migration numbers: ok` on commit
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 296 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; the only warning is the consumer header naming `en.ts` against release 0.41.0, which is the safe direction
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `--status` afterwards: 297 applied, 0 pending. **Dev ran the earlier text of the file**: it differs from the final only in the `do $report$` block's notices (roles named by id, no `kind` filter), edited after the apply and before any merge because `check-hard-coded-security.mjs` attributed that read to the function above it. No schema differs
- [x] File is re-runnable — `on conflict do update` throughout and `create or replace function`
- [x] Existing rows still read correctly after the change — `check-card-grants.mjs` against dev: `card_grants` holds `cards.ts` exactly (115 rows) and all 65 roles hold exactly what their cards require
- [x] **Constraints and defaults exercised against real rows** — `scripts/prove-translations-propose.mjs`, new, which signs in real logins and calls PostgREST as `authenticated` (the existing proof runs as the database owner and its header says it cannot exercise grants, and a grant is what this changes). Asserted: a `propose_translations`-only login proposes and the draft is there; the same login is refused `approve_label_th` and `discard_label_draft` with `42501`; a `translations`-card login still proposes and discards; the service key with no session is still refused `propose_label_th` with `42501`. Nothing is approved, so no Thai reaches a dev row, and both logins and roles are deleted in `finally`. `prove-label-drafts.mjs` re-run: all passed
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive. To undo, delete the three `card_grants` rows and the `card_features` row, drop the activity, and restore `propose_label_th()` from `0294`
- [x] Production apply plan stated for the release manager — `node scripts/apply-migrations.mjs --env production` for `0296` **before** the deploy: the card bundle `cards.ts` hands to `set_role_cards()` now names `translations.propose`, which production's `permission_activities` lacks until this applies. Additive, no backup needed

## 4. Functional checks

- [x] Happy path works end to end — proof 1 of `prove-translations-propose.mjs`: propose, then read the draft back
- [x] Data persists — the draft was read back through the service key after the proposing call returned
- [x] Create / edit / delete all exercised — propose (create), a second propose replaces the first (`prove-label-drafts.mjs` 8), discard (proof 5)
- [ ] Empty state renders sensibly — n/a: no UI; an empty proposal discards the draft and is covered by `prove-label-drafts.mjs` 9, which passed
- [x] Invalid input is rejected with a readable message, not a crash — an unregistered label and a missing row are refused or return false (`prove-label-drafts.mjs` 10, passed); the new gate's own refusal reads `translations.propose is required to propose a Thai label`
- [ ] Boundary cases checked — n/a: no length, number or date input is touched; the function body is `0294`'s, unchanged but for the one gate

### Role access matrix

Rows are by card, because `CLAUDE.md` says all analysis is by card and roles are a transient grouping.

| Holds exactly | Can reach | Expected | Result |
|---|---|---|---|
| `propose_translations` | `propose_label_th` | allowed | allowed (proof 1) |
| `propose_translations` | `approve_label_th`, `discard_label_draft` | refused | `42501` both (proofs 2, 3) |
| `translations` | `propose_label_th`, `discard_label_draft` | allowed | allowed (proofs 4, 5) |
| no session (service key) | `propose_label_th` | refused | `42501` (proof 6) |
| Admin | everything | allowed, unchanged | not driven; Admin is the `has_permission()` short-circuit and `0296` does not touch it |
| signed out (anon) | the three functions | refused | not driven; `execute` revoked from `anon` since `0293`, and `0296` re-states that revoke |

- [ ] Every role above tested — n/a: the matrix is by card; the Admin and anon rows are stated as not driven, with why
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — refused by the database function itself with `42501`, called directly rather than through any control

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page or nav entry added; the new card opens the existing `/management/translations`, and **that is the gap in section 7's decision file**
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a user can reach yet, so there is nothing to describe; the card's own description is in the Who does what dictionary
- [ ] Translatable strings go through the translation path — n/a: the new strings are UI dictionary entries added to both `en.ts` and `th.ts` (the `Dictionary` type makes a missing Thai key a typecheck failure, which passed), not database labels
- [ ] Mobile viewport (375px) — n/a: no layout touched
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page was changed. `check-card-grants.mjs`, `check-permission-catalogue.mjs` (`all ok`), `check-cards-count.mjs` (forty cards) and `check-hard-coded-security.mjs` (`no coded security outside the Admin bypass`, the same before and after) were run instead
- [ ] Any shared file touched checked from a second, unrelated page — n/a: **attempted and not achieved.** `cards.ts` and both dictionaries are shared. I started the dev server and signed in as Admin with `dev-signin.mjs`, but three attempts in a row bounced to `/login` (`error=expired`, then plain), including `/manual`, so no page that renders card titles was loaded. Listed under Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch — the second gates run was after the merge and all four gates passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately NOT ticked, the app half is outstanding; the item's note is a `backlog`-branch edit, not a PR edit
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-translations-propose-schema.md`, which answers the design question about a caller with no session
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: no shelter user can reach this yet — the new card is held by nobody and opens a page that a holder of it alone cannot open (the decision file's section 3 records that as a known gap), so a note would promise something that does not work yet. It belongs in the app half's PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The `42501` refusals, the 115-row and 65-role card check and the hard-coded-security result are the outputs of the scripts named above. One explanation is reasoned and is labelled so: that `check-hard-coded-security.mjs` attributed the report block's `roles.kind` read to `propose_label_th()` — measured only to the extent that it named that function and stopped naming it once the read was gone

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no threshold, band or cutoff changed
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above is the file's own lines
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; the machine login's secret is the app half's and Lutan's

### Migration ordering

- [ ] Both a migration and code that reads it: the production apply must happen before the deploy — deferred: release manager, apply `0296` first (see section 3)
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a fresh production backup — n/a: additive
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager. Purely additive schema is safe to leave; the down-steps are in section 3

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | A login holding only `propose_translations` cannot open `/management/translations` (route and page guard ask `translations.manage`), and the card's tile is silently not drawn | deferred to backlog — the app half; files and activities named in the decision file, section 3 |
| 2 | Low | `scripts/check-migration-grants.mjs` timed out at 90s when run alone while the gates were also running; it passed inside `lint` | accepted — not run to completion standalone, passed in the gates run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Who does what lists **Propose a Thai label** with its description, in English and in Thai | `/admin/who-does-what` on dev, reached by clicking through |
| 2 | The new card's tile does NOT appear for anyone, and giving it to a test role changes nothing visible (the known gap) | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet, so this is not ticked; the signature below says pending

Manual verification by: pending: the two rows in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release cut; the release manager reads this at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: read at release time
