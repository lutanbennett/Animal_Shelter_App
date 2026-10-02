# Feature test plan

## Header

| | |
|---|---|
| Feature | Shelter Friend wizard — add a Shelter Friend in one guided path |
| Backlog item | `docs/backlog.md` → "A step-by-step wizard to add a Shelter Friend, like intake." |
| Branch / worktree | `claude/shelter-friend-wizard` @ `C:\Development\Animal_Shelter_shelter-friend-wizard` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-02 (automated); the browser pass is left for Lutan, see below |
| Carries a migration? | no |
| Tested at SHA | `d63ffbf` (after sync; later commits touch only docs) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Management → Shelter Friends and Management → Contacts get an **Add a Shelter Friend** button opening a five-step wizard (Who, How they help, Logo and links, What the public may see, Review) that saves the contact, the profile and the publish flag in one action and uploads the logo afterwards
- [x] Files/areas touched listed: new `src/app/management/shelter-friends/new/` (`page.tsx`, `FriendWizard.tsx`, `steps.ts`); `src/app/management/shelter-friends/actions.ts` (new `addShelterFriend`, shared `checkFriendFields` / `nextSortOrder`); new `src/lib/contacts/create.ts` shared by `management/contacts/actions.ts`; `src/app/residents/new/WizardChrome.tsx` and `steps.ts` parametrised (intake unchanged by default); the two Management pages' headers; both dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; docs. No `worker/`, no migration
- [x] Roles affected identified: admin and management (the wizard and its action, same as the card); staff / vet / volunteer / signed out: nothing new reachable
- [x] Out of scope: the existing card (kept for editing), the public `/friends` and `/friends/join`, widening the Vendor gate, a Thai manual (there is none), a security-definer RPC (decided against, see `docs/decisions/2026-10-02-shelter-friend-wizard.md`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in the version-endpoint work; no overlap)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 24s
=== gates: lint exited 0 after 39s
=== gates: build exited 0 after 116s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, everything behind the wizard already exists (0076)
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

No signed-in browser session was available to Claude (sign-in goes to Supabase, which is not a local credential), so **none of the browser behaviour below was driven**. Each line says so rather than ticking; Left for manual verification is the list for Lutan.

- [ ] Happy path works end to end — n/a: not driven in a browser; **a new contact and an existing contact each reaching a published Friend** are items 1 and 2 under Left for manual verification
- [ ] Data persists — n/a: not driven; item 1
- [ ] Create / edit / delete all exercised — n/a: not driven; the wizard only creates, and edit/delete are the unchanged card (its `updateFriend` now shares `checkFriendFields`, covered by typecheck only), item 7
- [ ] Empty state renders sensibly — n/a: not driven; with no supplier left the picker shows its own message (item 4)
- [ ] Invalid input is rejected with a readable message — n/a: not driven; the same `checkHttpsUrl` / `checkFacebookUrl` run on the page and again in the action (item 6)
- [ ] Boundary cases checked — n/a: not driven; **a refresh mid-wizard keeping the step and the typing** is item 3, and **the opt-ins arriving off** is item 5

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/shelter-friends/new` | allowed | not driven; `requireManagementUser()` as every Management page |
| management | same | allowed | not driven |
| staff | same URL | refused | not driven; page and `addShelterFriend` both check the role |
| vet | same URL | refused | not driven |
| volunteer | same URL | refused | not driven |
| signed out | same URL | redirected to login | seen: the dev server answered `/management/shelter-friends/new` with a redirect to `/login?next=…` |

- [ ] Every role above tested — n/a: no signed-in session; only the signed-out redirect was seen
- [ ] A role that should not have access is blocked server-side — n/a: not driven; `addShelterFriend` begins with `hasManagementRole()` and every write is also under 0076's RLS

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change; the entry points are buttons on the two Management pages
- [x] Manual updated (`src/lib/manual/en.ts`, the Shelter Friends topic rewritten around the wizard); that it reads correctly at `/manual` is item 8 below
- [ ] Translatable strings through the translation path — n/a: the new strings are UI dictionary entries (en and th); the wizard saves the profile prose through the unchanged insert whose trigger queues translations, but that was not looked at at `/management/translations`
- [ ] Mobile viewport (375px) — n/a: not driven; the sticky bar carries Back plus two buttons (item 9)
- [ ] Browser console clean — n/a: no browser session was driven
- [ ] Network clean — n/a: no browser session was driven

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven; the two Management pages got a header button and the intake wizard got a parametrised chrome (item 10); typecheck, lint and the production build pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: not driven; `WizardChrome.tsx` is shared with intake (item 10), `manual/en.ts` and both dictionaries are shared and compile in the build
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file: `docs/decisions/2026-10-02-shelter-friend-wizard.md`
- [x] `README.md` updated (the `src/lib/shelter-friends/` entry)
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for admins and managers about the guided path, the opt-ins left off for them to tick, and the logo fallback
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions/` were measured, not reasoned: the claims about behaviour (clean-up of a new contact, opt-ins cleared on switching contact, refresh keeping answers) are what the code does and are listed for the browser pass rather than stated as seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date (Friend since is left empty)
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

- [x] Rollback position: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, or `npx wrangler rollback --env production` for the Worker fallback; no schema, so nothing else to undo. A profile saved by the wizard is an ordinary Friend row and stays valid either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | build-breaking | First draft restored the saved answers with `setState` inside an effect, which lint refuses (`react-hooks/set-state-in-effect`) | fixed: the form is now drawn client-side only and reads `sessionStorage` in its initial state |

## Left for manual verification

Look-and-feel is Lutan's call. Sign in as a management user on the dev server (`node scripts/worktree.mjs dev`, port 3008) and go to Management → Shelter Friends → **Add a Shelter Friend**.

| # | What to check | Where |
|---|---|---|
| 1 | **A new business reaches a published Friend:** Add a new business (name, a phone), fill the steps, Publish now. It appears under Management → Shelter Friends as published, on `/friends`, and as a new Supplier under Contacts | `/management/shelter-friends/new` |
| 2 | **An existing supplier reaches a published Friend:** search and pick one, Publish now; it is not offered again afterwards. Also try **Save as a draft**, then publish from the contact's card | same |
| 3 | **A refresh mid-wizard keeps the step and the typing:** type on steps 1–2, go to step 3, refresh — you land on step 3 with the answers there; with a logo chosen, the page says to choose it again. Typing a bad `?step=` value starts at step 1 | same |
| 4 | Steps hidden not unmounted: Back and forward through the steps loses nothing; Next on Who with nothing chosen stays put and says why; if every supplier already is a Friend the picker says so | same |
| 5 | **The opt-ins arrive off:** every box on step 4 is unticked, "ask first" wording is beside them, ticking Phone shows the phone on the Review card, and picking a different business afterwards clears the ticks. After saving, the contact's card shows nothing ticked that you did not tick | step 4, Review, then the contact's card |
| 6 | A bad website or a non-Facebook Facebook link is refused with a readable message and blocks Next | step 3 |
| 7 | A failed logo upload (a file the Drive path refuses, or Drive disconnected): the Friend is still saved and the last screen says "Saved without a logo — add it from the friend's card" with the reason; a non-image or oversize file is refused beside the logo | step 3, done screen |
| 8 | The Shelter Friends manual topic reads correctly and describes this path | `/manual` → Shelter Friends |
| 9 | Phone width (375px): the progress row, the picker, and the sticky bar with Back, Save as a draft and Publish now fit and are reachable; and the look-and-feel of the whole wizard | all steps |
| 10 | Intake still works after the shared chrome change: register a resident from the first step to Register, including Back and Edit links on Review | `/residents/new` |
| 11 | The Thai strings read naturally | switch to ไทย on the wizard |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: the browser pass in the table above (items 1 to 11), signed by whoever looks

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release time

Result: pass
