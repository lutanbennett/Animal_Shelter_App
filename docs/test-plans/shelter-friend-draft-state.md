# Feature test plan

## Header

| | |
|---|---|
| Feature | Shelter Friend draft state — an unpublished profile says it is a draft |
| Backlog item | `docs/backlog.md` → "Saving a Shelter Friend does not publish it, and nothing says so." |
| Branch / worktree | `claude/shelter-friend-draft-state` @ `C:\Development\Animal_Shelter_shelter-friend-draft-state` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` |
| PR | [#129](https://github.com/lutanbennett/Animal_Shelter_App/pull/129) |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | no |
| Tested at SHA | `5642202` (after sync; later commits touch only docs) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an unpublished Shelter Friend profile of a live contact now says it is a draft (badge, card notice, after-Save message), and signed-in viewers of `/friends` are told drafts are waiting; the Save/Publish behaviour itself is unchanged, as the brief required
- [x] Files/areas touched listed: `src/app/contacts/[id]/ShelterFriendCard.tsx`, `src/app/management/shelter-friends/FriendsOrder.tsx`, `src/app/contacts/ContactList.tsx` and `src/app/management/contacts/ContactsTable.tsx` (tooltip only), `src/app/friends/page.tsx`, new `src/lib/shelter-friends/staff-drafts.ts`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, docs. No `worker/`, no migration, `actions.ts` untouched
- [x] Roles affected identified: admin / management (badge, notice, message, note with link); staff / vet / volunteer (badge, and the `/friends` note without the link, via their read policies on `shelter_friends`); signed-out public (nothing changes)
- [x] Out of scope: the publish flow, the `public_shelter_friends` view, the visitor-facing empty state wording, a publish-on-Save prompt (rejected, see `docs/decisions.md`), the Thai manual (there is none)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in `0085_public_viewer_role.sql`, `0086_app_access_gate.sql` and their plan; no overlap with these files)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 147s
=== gates: lint exited 0 after 323s
=== gates: build exited 0 after 397s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #129, run 36142190060 — `check` pass (1m37s), `migration-numbers` pass (9s), `test-plan` pass (6s)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, driven in the browser pane on :3015 signed in as a manager-level account: Make a Shelter Friend on the dev contact "supplier X" → card shows **Draft — not on the website** and the draft notice while the form is open → filled Kind of help, Save → "Saved as a draft. Publish to show this on the website.", badge and notice still there → `/friends` shows "Only signed-in staff see this · 1 Shelter Friend profile is a draft… Publish from Management → Shelter Friends." → Management → Shelter Friends lists it as Draft → Publish there → badge **On the website**, `/friends` note gone → Unpublish from the card → "Taken off the website.", back to Draft
- [x] Data persists — each state above was read after a fresh navigation, not only from the client after the action
- [x] Create / edit / delete all exercised: create and edit as above; delete (Remove Shelter Friend status) is unchanged code and was not re-run
- [x] Empty state renders sensibly: with no drafts the `/friends` note is absent (checked after Publish); the draft count query returns 0 on dev with no drafts (run once through the service key against `qxkmhwybjggxvsfxsxbd` to validate the PostgREST embed filter shape)
- [ ] Invalid input is rejected with a readable message — n/a: no new input; the existing link and date validation paths are unchanged and still return their own errors rather than the draft message (the override applies only to a `success` result)
- [ ] Boundary cases checked — n/a: the only new branch points are published / unpublished / archived; archived keeps "Not on the website" and is covered by the code path, not driven (no archived Friend on dev)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | card, Management list, `/friends` | badge, notice, draft message; note with link | driven with a manager-level account — as expected |
| management | same | same | same account class as above — as expected |
| staff | card (read-only), `/friends` | Draft badge; note ending "A manager can publish them." | not driven — left for manual verification |
| vet | same as staff | same | not driven — left for manual verification |
| volunteer | same as staff | same | not driven — left for manual verification |
| signed out | `/friends` | no note, visitor page unchanged | `curl` of `/friends` with no cookie: 200, no "Only signed-in staff" text, the published Friend rendered |

- [ ] Every role above tested — n/a: staff / vet / volunteer not driven, handed over below; nothing new is writable by them (actions unchanged, still `assertManagementRole`)
- [x] A role that should not have access is blocked server-side: the only new read runs as the viewer under 0076's RLS; signed out it never runs (no user), confirmed by the no-cookie fetch

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, Shelter Friends step "Save, then tap Publish") to say saving keeps a draft and where the Draft marker and the `/friends` note appear
- [ ] Translatable strings through the translation path — n/a: new strings are UI dictionary entries (en and th), not translatable record prose
- [x] Mobile viewport (375px): contact card with the Draft badge and notice, `scrollWidth` 375 = `innerWidth`, no overflow
- [x] Browser console clean after the fix: the only errors logged were from an earlier edit (a duplicate `draft` name, fixed before any check above) and none recurred
- [x] Network clean — the pages above loaded 200; no failed requests seen on the actions

## 6. Regression

- [x] Nearest pages still work: contact hub, Management → Shelter Friends (publish, order list), `/friends` with a published Friend
- [x] Shared files touched (`manual/en.ts`, i18n dictionaries) checked from a second page: `/friends` and Management render their other existing strings; the build prerenders every page that reads them
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-25 (persistent marker over one-off line, no publish prompt, archived wording, the one staff-only read on `/friends`)
- [x] `README.md` updated: the `src/lib/shelter-friends/` entry names `staff-drafts.ts` as the one read beyond the public view
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for shelter users about the Draft marker and the `/friends` note
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured: each behaviour described was seen in the browser run above; the RLS claim for signed-out viewers was checked by the no-cookie fetch

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts it entirely; no schema, nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | build-breaking | First edit named the new flag `draft`, which the card already uses for its edit-form state; dev server showed a build error | fixed (renamed `isDraft`) before any check was recorded |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The card after Save on a draft reads clearly to you — Draft badge, notice, "Saved as a draft…" — "supplier X" on dev is left as a draft for this | `http://localhost:3015/contacts/980c27fb-0c14-538d-a2e4-48847ddd2a33` |
| 2 | Signed in as a staff, vet or volunteer account: `/friends` shows the note ending "A manager can publish them." with no Management link | `/friends` on :3015 or `test.lannacare.org` |
| 3 | The Thai strings (badge, notice, message, `/friends` note) read naturally | switch to ไทย on the pages above |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items await Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release time

Result: pass
