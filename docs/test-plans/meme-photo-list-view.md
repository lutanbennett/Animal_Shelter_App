# Feature test plan — meme-photo-list-view

## Header

| | |
|---|---|
| Feature | The meme maker lists a resident's photos through `resident_photo_list`, readable by `resident.who_and_where` |
| Backlog item | `#m8kq4` (ticked) |
| Branch / worktree | `claude/meme-photo-list-view` @ `C:\Development\Animal_Shelter_meme-photo-list-view` |
| Dev server | `http://localhost:3010` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | yes — `0354_resident_photo_list_view.sql` |
| Tested at SHA | `a7125bad` |

## 1. Scope and risk

- [x] One sentence: a login holding only Add memes picks a resident and is offered that resident's approved non-medical photo
- [x] Files: `supabase/migrations/0354_resident_photo_list_view.sql`, `src/app/memes/make/page.tsx`, `docs/backlog.md`, decision file, this plan
- [x] Roles affected: any login whose cards hold `resident.who_and_where` at read now sees approved non-medical resident photo names in this view
- [x] Out of scope: cards, `attachments` policy, the rest of `#79sqf`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` — `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number one above `main`'s highest (`0353`); `check-migration-numbers` ok
- [x] `--status` reviewed: 1 pending
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev: `applying 0354 … ok`
- [x] Re-runnable: `create or replace view`, grants idempotent
- [x] Existing rows unaffected: additive view only
- [x] Constraints exercised: n/a: a read-only view; behaviour driven in §4
- [x] Down-migration: not needed, additive; old code ignores the view
- [x] Production apply plan: `0354` goes with the next release, after `0348` and `0350`–`0353`
- [x] `check-migration-grants` ok (279 files); `check-hard-coded-security` clean

## 4. Functional checks

- [x] Happy path: `meme_add`-only login (dev-signin --cards) clicked Memes → Make a meme → Test 1 and was offered the photo (1 image, no "no photos" message)
- [x] Data persists: n/a: nothing is written
- [ ] Create / edit / delete: n/a: read-only change
- [x] Empty state: unchanged text path, still shown when the view returns nothing
- [ ] Invalid input: n/a: resident id is UUID-checked as before
- [ ] Boundary cases: n/a: medical-folder exclusion uses the policy's own expression

### Role access matrix

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | the photo list | offered the photo | driven by request: page shows the picker, no "no photos" |
| `meme_add` only | the photo list | offered the photo | driven in the pane: offered |
| signed out | nothing | nothing | n/a: anon has no grant on the view |

- [x] Every row above tested
- [x] A login without the card is blocked server-side: the view's `where` asks `has_permission`; anon has no grant

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no wording changed
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not inspected; page rendered
- [ ] Network clean — n/a: server-side read

## 6. Regression

- [x] The nearest pages work: /memes and /memes/make loaded under the one-card login
- [ ] Shared file touched checked elsewhere — n/a: no shared file touched
- [x] Nothing merged from `main` was broken: sync was a no-op

## 7. Documentation

- [x] Backlog item ticked (`#m8kq4`)
- [x] Decision file `2026-11-11-meme-photo-list-view.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: `0354` is pending on production behind `0348` and `0350`–`0353`, so the fix is inert there until they apply
- [x] Commit messages say why
- [x] Claims measured: dead-end read identified in the page source, behaviour driven

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: nothing pasted beyond the gates line
- [ ] Public pages re-checked — n/a: public site reads none of this
- [ ] Production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [x] Migration and its reader in one PR: yes, stated in the brief
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive
- [x] Apply plan stated
- [x] Rollback: code rollback needs nothing; the view can stay

## Defects found

| # | Severity | What | Status |
|---|---|---|---|

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-11

- [x] The manual list above is empty

Manual verification by: n/a: driven in the pane by Claude, nothing left for a person

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
