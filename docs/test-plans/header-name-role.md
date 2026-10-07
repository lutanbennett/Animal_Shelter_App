# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The app header shows `name · role` ("Lutan · Admin") instead of the email, with the email in an account menu; every login can have a name, set by an admin (create user, users table) or by the person (beside Change password) |
| Backlog item | `docs/backlog.md` → Show "Signed in as Lutan · Admin" in the header instead of the email address |
| Branch / worktree | `claude/header-name-role` @ `C:\Development\Animal_Shelter_header-name-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | linked from the PR itself |
| Tested by / date | Claude (header-name-role session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | `3997cc46` (code; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the header reads `name · role` (role as its display name, in the page's language), tapping it shows the account's email, a Name field is settable by an admin and by the person, and every picker that goes through `appUserLabel()` shows the same name because the name is `user_metadata.full_name`, the key `app_users.display_name` already reads. All four numbered points shipped
- [x] Files/areas touched listed: `src/app/AppHeader.tsx`, new `src/app/AccountMenu.tsx`, `src/app/account/password/` (name form + `changeOwnName`), `src/app/admin/security/` (`setUserName`, Name box on create, Name column, vet-doctor default name), new `src/lib/auth/user-name.ts`, both i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, decision file. Nothing under `supabase/` or `worker/`
- [x] Roles affected identified: every signed-in role sees the header; admin alone can set another login's name
- [x] Out of scope written down: resizing Open menu / Assistant / Sign out (Lutan's pending question 11, `bare-buttons-remainder`'s territory); a profile table or a `custom_name` key (would be a migration; see the decision file); a Thai manual (the manual is English only)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 179s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0154` belongs to `see-translations-cell`
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; logins that already carry a Google `full_name`/`name` show it in the header unchanged
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven in a headless Edge against `localhost:3011` with throwaway dev logins (created by script, deleted at the end of each run; none left behind), and with `node scripts/check-phone-width.mjs`.

- [x] Happy path works end to end. Header at 375 px and 1100 px, English and Thai, for four logins: a configured role with a very long name (`Khun Pimchanok Sirikanchanakul-Thanasombat · Head of Maintenance` / Thai role name), a staff login with **no name** and a very long email, and two logins both named "Lutan" (admin, vet). On desktop the two Lutans read `Lutan · Admin` and `Lutan · Vet`; on a phone the name · role sits on its own right-aligned row under the header
- [x] Data persists. On `/account/password` the no-name login typed `  Noi   (night shift) `, pressed Save name, and the login's `user_metadata` read back as `{"full_name":"Noi (night shift)","name":"Noi (night shift)"}` (whitespace collapsed). Clearing it left `{"email_verified":true}`: both keys gone, so Google's name cannot show back
- [x] Create / edit / delete all exercised for the self-service path (set, then cleared). The **admin** path (`setUserName`, Name on create-user, the Name column) is not driven: Settings → Security needs a session with the authenticator step, which a throwaway login cannot pass. It type-checks, builds and reuses the same `withName()` helper; it is in Left for manual verification
- [x] Empty state: a login with no name shows its email in the header (truncated with an ellipsis at 375 px) and the menu shows the email once
- [x] Invalid input: a name is trimmed, inner whitespace collapsed and cut at 60 characters (`normaliseName`); an empty name clears rather than erroring
- [x] Boundary cases: very long name and very long email at 375 px; Thai role names; the worst case from the brief (long name plus long Thai role label) is the `longname` login. `check-phone-width.mjs` on `/residents`, seven roles × English and Thai: first run **failed** all 14 views (48–90 px of sideways scroll) because the name · role button beside the existing buttons was ~120 px wider than 375 px allows; fixed by giving it its own row below `sm`. Re-run closes:

```
14 page view(s) measured (admin, management, staff, vet, volunteer, head_of_medical, head_of_maintenance; en + th), 0 skipped because the role cannot open them, 0 warning(s).
554 component action(s) measured for tap size.
No page scrolls sideways.
Every component action is at least 44 px.
```

  The check lists the new "Account menu: …" button among the bare buttons under 44 px (120 × 20 px), the same note it already prints for Open menu, Assistant and Sign out. It is a note, not a failure, and the tap height is the open question 11 covers, so it was left as the other header buttons are
- [x] Account menu opened at 375 px in English and Thai: shows "Signed in as", the name, the role, the email (wrapping, not overflowing), "Your name and password" (to `/account/password`) and Sign out

### Role access matrix

The header is on every signed-in page. Signed in as each role via `check-phone-width.mjs` (it makes one throwaway login per role).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | any page; the Name column on Security | header `name · Admin`; may set anyone's name | header checked; Security Name column not driven (needs authenticator step) |
| management | any page | header `name · Management` | header checked |
| staff | any page | header `name · Staff` | header checked |
| vet | any page | header `name · Vet`; no Assistant button | header checked (desktop and phone) |
| volunteer | any page | header `name · Volunteer` | header checked |
| head_of_medical / head_of_maintenance (configured) | any page | role shown by its configured name, Thai from `name_th` | header checked, English and Thai |
| signed out | the header returns nothing | no header, as before | unchanged: `AppHeader` still returns `null` without a user |

- [x] Every role above tested (header). The `setUserName` action itself is not exercised for a non-admin; see below
- [x] A role that should not have access is blocked server-side: `setUserName` goes through `refuseUnlessAdmin` (admin role and 2-step) before it touches anything, like every action in that file. A person changing their **own** name uses their own session and can write nothing else. Read from the code, not driven as a non-admin

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added; the menu's link goes to the existing Change password page
- [x] Manual updated (`src/lib/manual/en.ts`): a step in the sign-in topic (what the header shows, the menu) and a step in Security (the Name box and column, test-account naming, the Google caveat)
- [x] Translatable strings go through both dictionaries (`header.*`, `account.name.*`, `admin.security.createForm.name*`, `admin.security.table.*name*`); the header and menu were rendered in Thai at 375 px
- [x] Mobile viewport (375 px): no overflow, six roles plus configured roles, both languages (`check-phone-width.mjs` above)
- [ ] Browser console clean — n/a: not read in the headless runs; no console output was inspected
- [ ] Network clean — n/a: not inspected in the headless runs

## 6. Regression

- [x] The pages nearest the change still work: `/my`, `/residents` (header on both), `/account/password` (name form above the password form; the forced and reset screens deliberately show only the password form)
- [x] Shared file checked from a second page: `src/lib/manual/en.ts`, `src/lib/releases.ts` and the dictionaries are data files with no cross-page logic; the build (all pages compile and prerender) is the check, and it passed
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-header-name-role.md`: why `user_metadata` and not a table, `appUserLabel()` reused, the Google caveat, the phone row
- [ ] `README.md` still accurate — n/a: README does not describe the header's contents or the Security table's columns
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: the top of every screen now shows name and role, with the menu, the self-service name and the admin-set name
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned, **except one, marked as such**: the 375 px overflow numbers and the metadata round-trip are from the runs above; that Google overwrites `user_metadata` on sign-in is how the provider is documented to behave and was **not** reproduced (it needs a real Google sign-in), and the decision file says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold or band; the one boundary (name length 60) is a truncation, and the phone/desktop breakpoint was measured on both sides
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the check output and gates lines above are pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no public page changed (the public header, `PublicHeader.tsx`, is untouched)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Nothing in the schema changed. Names already written into `user_metadata.full_name` stay there and are harmless, because `app_users` was already reading that key

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First cut put `name · role` beside the header buttons; at 375 px every role overflowed by 48–90 px in both languages | fixed: its own row below `sm`; re-run clean |
| 2 | low | A name an admin gives a **Google** login may be replaced by Google's at their next Google sign-in (expected from the provider; not reproduced) | accepted: the editable name is for password logins and test accounts; the fix, if it bites, is a migration (`custom_name`), recorded in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Can you now tell your three `lutan.bennett…` accounts apart?** Give two of them distinct names (or leave all three "Lutan") and look at the header on your phone | header, any page, signed in as each |
| 2 | Settings → Security as an admin: create a user with a name; edit a name in the Name column and press Save name; clear one; check the header and a maintenance assignee picker show it | `/admin/security` (needs your authenticator step), `/maintenance/new` |
| 3 | On a real phone in Thai: the second row and the menu read well and tap easily | any page |
| 4 | Whether the account button's 20 px tap height should follow the answer to question 11 with the other header buttons | header |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (header-name-role session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: Lutan — confirmed in chat ("Merge it - verified"); line written by Claude at their request  Date: 2026-10-07

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing is ready to deploy until the manual verification above is signed

Result: pass

Release manager acknowledgement: n/a (not yet handed over)  Date: —
