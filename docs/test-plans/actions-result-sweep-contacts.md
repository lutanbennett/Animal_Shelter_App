# Feature test plan — actions-result-sweep-contacts

## Header

| | |
|---|---|
| Feature | The Shelter Friend actions (called from the contact hub's card and the Friends order list) are wrapped in `runAction()` and return `ActionResult` instead of throwing; `FriendActionResult` folded into `ActionResult` (#441, part 2 — contacts area only) |
| Backlog item | `docs/backlog.md` → "Server Actions across the app: return a result instead of throwing (#441, part 2)" — left unticked (spans the whole app); its bracket note now records contacts done |
| Branch / worktree | `claude/actions-result-sweep-contacts` @ `C:\Development\Animal_Shelter_actions-result-sweep-contacts` |
| Dev server | **production build**, `next build` (via `gates.mjs`) + `next start -p 3002`. #441 exists only in production, so `next dev` would prove nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | `7d2e6d8` (after `worktree.mjs sync` merged `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `src/app/management/shelter-friends/actions.ts` (the only action file contacts uses) runs every action inside `runAction()`, refuses via `{ ok: false, error }`, and `FriendActionResult` no longer exists
- [x] Files/areas touched listed — `src/app/management/shelter-friends/{actions.ts,FriendsOrder.tsx}`, `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/lib/auth/require-management.ts` (new `hasManagementRole`), `src/lib/uploads/run-upload-action.ts`, `docs/backlog.md`, `docs/decisions/`, `src/lib/releases.ts`, this plan
- [x] Roles affected identified — admin and management (the only roles the card and list act for); no permission check moved, added or removed
- [x] Anything explicitly **out of scope** written down — every other area (management, projects, maintenance); `ProjectActionResult`, `MaintenanceActionResult`, `TranslationActionResult`; `assertManagementRole()` stays throwing for the unswept management actions

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (a release-record doc only), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 170s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; every action reads and writes the same tables as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — verified at code level only: queries, revalidation and messages are unchanged; the production build type-checks both callers against the new shape (see "Left for manual verification" 1)
- [ ] Data persists — reload the page and the change is still there — n/a: no signed-in browser session was available in this sandbox; see "Left for manual verification" 1
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: same reason; see "Left for manual verification" 1
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendering changed, only how a refusal or failure reaches the screen
- [x] Invalid input is rejected with a readable message, not a crash — every refusal keeps its message, condition and order; now `{ ok: false, error }`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unchanged: no validation rule was altered, only its delivery

### Production-build verification (the check that matters most here)

- [x] `next build` produced a real Turbopack **production** build (exit 0, all `/residents` routes in the route list), not a dev server
- [x] `next start -p 3002` served the built app; unauthenticated `/contacts` and `/management/shelter-friends` both returned `307` to `/login?next=…`, so the page guards are unaffected and the server does not crash
- [ ] **Signed in, triggered 2–3 real refusals on the production build and read the actual message (not "Minified React error #441")** — n/a: genuinely not performed, not a false tick: no signed-in session (password or Google account) was available in this sandbox. This is the check that matters most; it is item 1 under "Left for manual verification". The mechanism is the same `runAction`/`ActionResult` the Security page proved in a real browser on 2026-09-26 (`docs/test-plans/security-action-errors.md`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all Friend actions | work; refusals readable | not driven live — checks unchanged |
| management | same | same | not driven live |
| staff | none (no card, actions refuse) | refused with the management-access message | not driven live |
| signed out | nothing | redirected to `/login` | `/contacts` and `/management/shelter-friends` → `307` on the production build |

- [ ] Every role above tested — n/a: signing in as each role needs credentials this sandbox does not have; every role check is the same code as before, in the same order
- [x] A role that should not have access is blocked server-side — signed-out requests redirect on the production build; inside the actions the role check runs first, now as a returned refusal rather than a throw

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no control, page or wording changed; only what a failure looks like
- [ ] Translatable strings go through the translation path — n/a: no new string; the message is the existing `t.common.somethingWentWrong`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout or markup change
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session was driven; see "Left for manual verification" 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only signed-out `curl` was possible here (clean `307`); see "Left for manual verification" 2

## 6. Regression

- [x] The pages nearest the change still work — `/contacts`, `/contacts/[id]`, `/management/shelter-friends` and the Website photo uploaders (they share `runUploadAction`) all compile and type-check in the production build
- [x] Any shared file touched checked from a second, unrelated page — `runUploadAction` is also used by `/admin/website` (`GalleryPhotos`, `HeroPhoto`); they test `"error" in result`, still true of `{ ok: false, error }`; whole-app typecheck is clean
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought in only a release record doc

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; the item spans the whole app. Its area note now says `/residents` is done
- [x] Non-obvious design choices recorded as a new file, dated — `docs/decisions/2026-09-29-server-actions-return-a-result-not-a-throw-part-2-contacts.md`
- [x] `README.md` still accurate — n/a: README does not describe action error handling
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line (admin and management) saying a Shelter Friend's profile now shows a real message instead of a numbered code
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — "contacts has no `use server` file" is from `grep`; the gates line and `307`s are from the real runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives "today" or any instant
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold, rounding rule or permission cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates line and the `307`s come from the runs above
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched (`/adopt/[id]` is another stream's)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — `npx wrangler rollback --env production` restores the previous code in seconds; code only, no schema or data involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Merging `origin/main` emptied `unreleased` (a release was cut), so the release line had to be re-added | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as admin or management on a production build, cause a real refusal and read the message (not "Minified React error #441"): on a contact's Shelter Friend card, Save with a bad website address, and upload a file over the size limit or of the wrong type | `test.lannacare.org` → `/contacts/<id>` |
| 2 | Browser console and network tab clean during the above; move a Friend up/down and publish/unpublish on `/management/shelter-friends` still work | same, plus `/management/shelter-friends` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–2 wait for someone with a login

Manual verification by: pending: a signed-in pass on a production build (items 1–2)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect found is fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
