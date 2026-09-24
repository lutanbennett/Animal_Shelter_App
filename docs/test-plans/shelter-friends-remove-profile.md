# Feature test plan

## Header

| | |
|---|---|
| Feature | Shelter Friends: "Remove profile" becomes "Remove Shelter Friend status", moved beside Unpublish, with a confirm that leads with "the contact stays" |
| Backlog item | `docs/backlog.md` → Public website: **Shelter Friends: make "Remove profile" clearly about the Friend status, not the contact** |
| Branch / worktree | `claude/shelter-friends-remove-profile` @ `C:\Development\Animal_Shelter_shelter-friends-remove-profile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | [#111](https://github.com/lutanbennett/Animal_Shelter_App/pull/111) |
| Tested by / date | Claude, 2026-09-25 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `0c1a745` for the browser checks; `3bdc86e` (after sync — only `releases.ts` changed) for the gates |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the action that deletes a Shelter Friend profile is relabelled after what ends (the status), moved out of Edit profile onto the card's row next to Unpublish with a line telling the two apart, and its confirm now opens with "The contact … stays"
- [x] Files/areas touched listed — `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/app/management/shelter-friends/actions.ts` (the success message only), both dictionaries (`shelterFriends.card.removeProfile`, `removeConfirm`, new `actionsHint`, `removed`), the manual's `shelter-friends` topic, `releases.ts`; docs: backlog tick, decisions, and #103's plan (`docs/test-plans/shelter-friends.md`)
- [x] Roles affected identified: admin / management see and use the action; staff / vet / volunteer see the read-only card as before; signed-out public only sees the card leave `/friends`
- [x] Anything explicitly **out of scope** written down — no schema and no change to what removal deletes (`deleteFriend` is unchanged apart from its message); Management → Shelter Friends has no remove action and gets none; the manual screenshots are not regenerated (a full rerun is planned after the feature batch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; it brought the 0.3.0 release cut (#109), which emptied `unreleased`. `src/lib/releases.ts` conflicted and was resolved to main's empty array plus this PR's one line
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 297s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #111 at `fddc887`: `check` pass, `test-plan` pass

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the removal itself was checked against dev rows in section 4
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — who can delete a `shelter_friends` row, with one real user given each role in turn and impersonated as `authenticated`, deleting supplier X's Friend row (each successful delete undone; the whole block ends in `raise exception` and `rollback`). Output as printed: `MATRIX staff: deleted=0 | vet: deleted=0 | volunteer: deleted=0 | management: deleted=1 | (rolled back) | admin: deleted=1 | (rolled back) |`. `shelter_friends` still held 2 rows afterwards
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

On `localhost:3013` against dev, signed in as admin. Database state read back
through the Management API (dev only).

- [x] Happy path works end to end — on supplier X, published first so Unpublish showed: the row read Unpublish · Edit profile · Preview · View on the website · **Remove Shelter Friend status** (far right at 1280px), with the hint line under it. Pressed Remove; the confirm (captured by stubbing `window.confirm` to record and accept) read, as printed: "The contact supplier X stays, with everything recorded on it. Only their Shelter Friend status ends: the card comes off the website and its text, logo and translations are deleted. To hide the card for now instead, cancel and use Unpublish." The card then read "No longer a Shelter Friend. The contact is unchanged." and dropped back to Make a Shelter Friend
- [x] Data persists — reload the page and the change is still there — the contact page reloaded (200) as a non-Friend. **The contact survived byte for byte**: `md5(row(contacts.*))` was `6dacc009f8c9b2579ee028f710c745f4` before and after; `placement_history` rows for it 0 → 0 (a Supplier has none; the FK is on `contacts`, which is not touched). Friend row 1 → 0, `public_shelter_friends` 1 → 0, and the queued translation (a Kind of help set on dev beforehand so one existed) 1 → 0. An anonymous `fetch('/friends', {credentials:'omit'})` no longer contains supplier X and still contains Harness Hardware
- [x] Create / edit / delete all exercised (whichever the feature has) — delete driven as above. Cancel driven too: on Harness Hardware in Thai the confirm was answered **no** and the Friend was still there in the database (published). Edit profile opened: no remove action inside the form; Cancel brought the row back with it
- [x] Empty state renders sensibly (no rows yet) — a contact that is not a Friend and not a Supplier (Lutan Bennett): no Shelter Friend card, no stray action. Supplier X after removal: the Make a Shelter Friend card only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the action takes no input; a missing row still returns the existing "That Shelter Friend profile no longer exists." (unchanged code path)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — a long contact name ("Harness Hardware (Shelter Friends test)") in the Thai confirm; the Thai label, the longest, wraps to its own line at 375px without overflow

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the action on a Friend's card | can remove | driven in the browser, above; DB harness: deleted=1 |
| management | same | can remove | DB harness: deleted=1; `deleteFriend` starts with `assertManagementRole()` (unchanged). UI not driven as this role |
| staff | read-only card | no action; refused server-side | DB harness: deleted=0. UI: the button renders only under `canManage`, the same condition as Publish / Edit profile, which Lutan saw absent as staff on #103 |
| vet | same as staff | same | DB harness: deleted=0 |
| volunteer | same as staff | same | DB harness: deleted=0 |
| signed out | `/friends` | the card is gone after removal | anonymous fetch, above |

- [x] Every role above tested — server side for all five by the harness; admin and signed-out in the browser. Other roles need their own passwords, which this session does not handle
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — `deleteFriend` is a server action gated by `assertManagementRole()`, and RLS deletes 0 rows for staff, vet and volunteer

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the "(while editing)" sentence is replaced by a step saying Unpublish and Remove Shelter Friend status sit side by side and what each does; loaded `/manual#shelter-friends`, the new text is there and "Remove profile" appears nowhere on the page
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new database text; the new strings are dictionary entries in both `en.ts` and `th.ts`, both loaded in the browser
- [x] Mobile viewport (375px) — no overflow, controls reachable — Harness Hardware in Thai at the mobile preset: `scrollWidth` = viewport; buttons wrap to three lines, Remove last and on its own
- [x] Browser console clean — no errors or React warnings — no console errors
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — contact pages 200, `/friends` 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/contacts/[id]` for a Friend (published and unpublished), a former Friend and a non-Supplier; `/friends` anonymously; `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — the dictionaries and the manual loaded on `/manual` and on a non-Friend contact's page, in both languages
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought the 0.3.0 release cut only; gates ran after it, green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — why the label names the status, why the confirm leads with the contact, why the action moved beside Unpublish, the success message, and that the server side was already correct
- [x] `README.md` still accurate — no files or scripts added or moved
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line: the new name, where it now is, the hint line, and that removing never deletes the contact
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the role matrix, the contact surviving, the translation and view rows going and the layout at both widths were all observed. "People read the first line of a confirm" is the backlog item's premise, not a measurement

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted gates line, role matrix and confirm text are copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager. A removed Friend can linger on `/friends` for signed-out visitors for up to the edge cache's ten minutes, as with Unpublish

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code and text only; `npx wrangler rollback --env production` reverts it completely, and nothing it wrote needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Removing reported the generic "Saved", which says nothing about the contact | fixed — "No longer a Shelter Friend. The contact is unchanged." |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Done — Lutan, 2026-09-25, confirmed in chat ("wording reads fine").** **The wording.** Does "Remove Shelter Friend status", the hint line under the buttons and the confirm's first line ("The contact … stays") read, to someone seeing them for the first time, as ending the Friendship and not deleting the contact? And does Unpublish vs Remove read clearly side by side? Lutan raised the concern, so it is his call | a Friend's contact page (`localhost:3013` or `test.lannacare.org`) → the Shelter Friend card; press Remove and read the confirm, then Cancel |
| 2 | **Done — Lutan, 2026-09-25, in the same confirmation.** The same in Thai: "ยกเลิกสถานะเพื่อนของศูนย์", the hint line and the confirm (written by Claude, not reviewed by a Thai speaker) | switch to ไทย on the same page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan read the wording in both languages

Manual verification by: Lutan — confirmed in chat; line written by Claude at his request  Date: 2026-09-25

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summarised in #111's description, which links this file
- [ ] Handed to the production release manager — n/a: not yet — goes with the next release cut

Result: pass
