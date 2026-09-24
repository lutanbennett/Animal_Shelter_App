# Feature test plan

## Header

| | |
|---|---|
| Feature | Archive contacts instead of deleting them (the app half; schema was 0075, #86) |
| Backlog item | `docs/backlog.md` → Management → **Archive contacts instead of deleting them.** |
| Branch / worktree | `claude/contacts-archive` @ `C:\Development\Animal_Shelter_contacts-archive` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | #90 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no (reads 0075, already on `main` and applied to dev) |
| Tested at SHA | `995c49d` (code), merged with `origin/main` after; this file is the commit after that |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Archive (with an optional reason) and Restore on `/management/contacts` and `/contacts/[id]`. Archived contacts are hidden from both lists and from the carer picker, but come back under Show archived (muted, with the badge and the reason) and in any `/contacts` search. Housing history still names an archived carer, with the badge. Rehome refuses an archived carer. Delete is kept for contacts with no placements
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/management/contacts/{actions.ts,page.tsx,ContactsTable.tsx}`, `src/app/contacts/{page.tsx,ContactList.tsx}`, `src/app/contacts/[id]/ContactHub.tsx`, `src/app/residents/[id]/[section]/page.tsx` (housing tab), `src/components/{ArchiveContactControl,ArchivedBadge}.tsx` (new), `src/lib/contacts/{contacts,carers}.ts`, `src/lib/placements/rehome.ts`, both dictionaries, `src/lib/manual/en.ts` (the contacts and manage-contacts topics only), `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — archive/restore is management and admin (`assertManagementRole`, the same guard as delete); the control on `/contacts/[id]` shows only when `canManage`. Every signed-in role sees the badge, the list toggle and the search change. No RLS or route guard changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no vendor/donor pickers exist yet, so `loadCarerOptions` is the only picker filtered; archiving does not return a resident in care (it links the return form instead, `docs/decisions.md` 2026-09-24); `/manual` screenshots not regenerated (full rerun planned after this batch); no `refresh()` added (see section 4)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in 0076 shelter-friends schema; `docs/decisions.md` auto-merged)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 186s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #90, run 35988339258: `check` pass (1m29s). `test-plan` shows pass only because the soft gate doesn't block; its step exited 1, "1 item(s) await a person" (the manual items below)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR (0075 merged as #86)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; 0075 was applied with #86
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data) — every dev contact loaded on both lists with `archived_at` null, and none showed a badge until one was archived
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the 0075 constraint was harnessed in #86 (`scripts/check-contacts-archive.mjs`), and the app's restore was checked against it on a real row (section 4)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration here. This code selects 0075's columns, so 0075 must be applied to production before this deploys. That ordering belongs to #86's apply plan

## 4. Functional checks

All driven in the in-app browser against `next dev` on :3010 (dev database), signed in as admin, UI in English. Database state was read back through the Management API (dev only).

- [x] Happy path works end to end — archived "Sylvia and Estella" (a Carer with 1 placement, Panda's adoption, and 0 in care) from their `/management/contacts` row with the reason "Moved to Chiang Rai". The row left the list and the heading line read "1 archived hidden". Dev row afterwards: `archived_at` 2026-09-24 09:56:22+00, `archive_reason` "Moved to Chiang Rai", `archived_by` the signed-in admin
- [x] Data persists — reload the page and the change is still there — reloading `/management/contacts?archived=1` showed the row with the badge, "Archived on 24 Sep 2026", the reason and a Restore button, under "including 1 archived" and a Hide archived toggle
- [x] Create / edit / delete all exercised (whichever the feature has) — archive (above). **Restore** from `/contacts/[id]`: badge and banner gone, button back to Archive, and the dev row has `archived_at`, `archived_by` and `archive_reason` all null (all three cleared in one update, as the constraint requires). **Delete** still works for a contact with no history: created "Typo contact (archive test)", Delete was enabled, and the row went and is gone from dev (the `window.confirm` was stubbed to accept; the dialog itself is unchanged by this PR). Delete stays disabled for carers with placements, and its message now says "Archive them instead"
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new empty state; with no archived contacts the toggle and count simply don't render (seen before the first archive)
- [x] Invalid input is rejected with a readable message, not a crash:
  - **Rehome with an archived carer.** The archived carer was absent from Panda's foster form picker (only Lutan Bennett and Test Fosterer were offered). Re-inserting their id into the select, as a stale form would post it, and submitting returned "Sylvia and Estella is archived. A manager can restore them under Management → Contacts before a resident is placed with them." No placement row was written (checked in dev).
  - **Archiving a carer with a resident in care.** Fostered Panda with Test Fosterer (on the user's go-ahead). Archive was then disabled on both the table row and the contact page, with the note and a "Return Panda to the shelter →" link. Force-enabling the button and submitting, as a stale page would, got the server refusal, shown inline (it logs as a 500, the same throw-to-refuse pattern `deleteContact` uses).
  - **Recovery.** The link opened `/residents/<Panda>/rehome/return`, and returning Panda re-enabled Archive.
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates):
  - **The search.** On `/contacts` with archived hidden (the chip counts cover the 3 live contacts), searching "sylv" found the archived contact with the badge and reason, plus the line "Archived contacts that match are shown with a badge."
  - **The list toggle.** Show archived listed all 4, with the archived one last, "including 1 archived", and `?archived=1` in the URL.
  - **The housing tab.** Panda's housing history row reads "Fostered → Adopted · Carer: Sylvia and Estella [Archived]", with the reason as the badge's tooltip.
  - **Not covered.** An archive with no reason wasn't driven separately; the code stores `null` for an empty reason.
- [x] Stale-row check from the brief (`refresh()` one-liner): not reproducible here, so not added. After Archive the row still showed at 5s and was gone at 10s, with the dev server under load from a parallel build (the archive POST took 43s). That is the slow-save reading `docs/decisions.md` (#88) describes. Every later action (restore, return, create, delete) updated the page in place

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/contacts`, `/contacts`, `/contacts/[id]` | archive / restore / toggle / search | driven in the browser: as expected |
| management | same | same (`assertManagementRole`, `canManage`) | not signed in as; same guard as delete, which management already uses |
| staff | `/contacts`, `/contacts/[id]` | list, toggle, search, badge; no Archive/Restore | not signed in as |
| vet | same as staff | same as staff | not signed in as |
| volunteer | same as staff | same as staff | not signed in as |
| signed out | nothing | sent to sign-in, as before | seen: `/management/contacts` redirected to `/login?next=…` while the pane was signed out |

- [ ] Every role above tested — n/a: only admin (and signed-out) were driven; other roles need their own passwords. The server guard is `assertManagementRole`, unchanged in kind from `deleteContact`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access granted or withdrawn; `archiveContact` / `restoreContact` call `assertManagementRole` before anything else, like the existing actions

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: updated (contacts and manage-contacts topics) but `/manual` was not loaded after the edit; it is item 3 under Left for manual verification
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new strings are static UI labels in the en/th dictionaries, not user content. The Thai wording was written by Claude and not rendered (item 2 below)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: driven only at the pane's ~590px width, where the table scrolls sideways as before and the hub control fits; 375px is item 1 below
- [x] Browser console clean — no errors or React warnings — the one console error was the 500 from the deliberate stale-page archive in section 4, which is the intended refusal
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — apart from that deliberate refusal, every page and action above returned 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/contacts`, `/contacts/[id]` (Sylvia and Estella, Test Fosterer), `/management/contacts` (both modes), `/residents/<Panda>/housing`, `/residents/<Panda>/rehome` (foster recorded with a live carer), `/residents/<Panda>/rehome/return` (return recorded), `/residents/<Panda>`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `rehome.ts` via a real foster; `carers.ts` via the rehome picker; `contacts.ts` via both lists and the hub; the dictionaries via the resident hub and housing tab
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only the 0076 schema, its harness and docs; 0076 filters `c.archived_at is null`, which is the meaning used here. Gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the archive/delete boundary; no archiving a carer with a resident in care, with a link to the return form (the user's call); rehome refusing by id; search including archived contacts
- [x] `README.md` still accurate — it does not describe contact management
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: contacts can be archived instead of deleted, from where, what it hides and keeps, Show archived / search / Restore, and that a resident can't be placed with an archived carer
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the refusals, the three-column restore, the hidden/shown behaviour and the slow-save reading were all observed (section 4). One claim was read from code, not driven: that an archived current carer would blank the rehome form's name. It follows from `carerName()` looking the carer up in the picker's options

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `archived_at` is a timestamptz set from `new Date().toISOString()` and only displayed through `formatDate`; nothing derives "today" from it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates block, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here. The code does read 0075, which must be on production first (#86's apply plan)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; 0075 precedes this deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code only; `npx wrangler rollback --env production` reverts it completely. Any contacts archived meanwhile stay archived in the database, and the old code simply ignores the columns and lists them again

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | On the contact page the disabled Archive button stretched to the width of the in-care note under it | fixed — the control's column is `items-start` |
| 2 | low | A blocked Archive only said why; staff had to find the resident and the return form themselves | fixed at the user's request — the note links each resident's Return to shelter form |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At phone width (375px): the Archive reason form and the in-care note on a contact's page, and the Show archived chip under the search box, fit without overflow | `/contacts/[id]`, `/contacts` |
| 2 | Thai wording of the new strings (เก็บเข้าคลัง / กู้คืน, the reasons, the refusals) reads naturally — written by Claude, not reviewed by a Thai speaker | switch to ไทย on `/contacts`, `/management/contacts?archived=1` |
| 3 | The contacts and Managing contacts topics read correctly at `/manual` | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are outstanding; see the pending line below

Manual verification by: pending: phone width, Thai wording and the /manual topics (Left for manual verification 1–3)

### Result

- [x] Open defects are either fixed or explicitly accepted above — both fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
