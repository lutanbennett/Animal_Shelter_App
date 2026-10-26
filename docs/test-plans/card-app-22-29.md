## Header

| | |
|---|---|
| Feature | Card review 2, the app half for cards 22-29 (Add photos, Approve photos, Run appeals; migration 0269) |
| Backlog item | `docs/backlog.md` → Card review decisions, cards 22-29 (not ticked: the My tasks menu entry belongs to card-app-11-21) |
| Branch / worktree | `claude/card-app-22-29` @ `C:/Development/Animal_Shelter_card-app-22-29` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-26 |
| Carries a migration? | yes: 0269 |
| Tested at SHA | bc9cd57c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — app half of Card review 2 for cards 22-29: make the Add photos resident save and Approve / Wrong animal work, the conditional publish warning, Run appeals reading the setting, plus migration 0269 (Run appeals medical read, Send to hospital to Manage medical)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0269`, `src/lib/permissions/cards.ts`, `src/lib/photos/approval.ts`, `src/app/photos/approve/ApproveQueue.tsx`, `src/app/management/appeals/**`, i18n en/th, docs; no `worker/`, no NavLinks or routes
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — logins holding add_photos, approve_photos, residents and medical_records (one-card logins on dev); production roles read via check-production with `staff` discounted as a retired phantom; admin untouched
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — My tasks residents menu entry and all nav hiding (card-app-11-21 owns NavLinks and routes); the three red harnesses; record_death; Management and the 2IC losing Send to hospital is accepted by Lutan

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — already up to date with origin/main
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exac… — see the gates lines below (typecheck, lint, test and build all 0 at bc9cd57c)

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so wr… — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — 0269; highest on origin/main was 0268, and the apply-migrations number check passed
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev read 269 applied, 1 pending before the apply
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — dry-run 0269 ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied once to dev (shared by every stream); applying again is a no-op
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — create or replace, alter policy, on conflict do nothing, delete where
- [x] Existing rows still read correctly after the change (checked against real dev data) — check-card-grants: all 37 roles hold exactly what their cards require; NOTICE report prints per-role cells gained and lost
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no new constraint or default; a policy and a function changed, exercised through the live saves below
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: grants and a policy only; reversed by a new migration that restores the old guard, the old function and the card rows
- [x] Production apply plan stated for the release manager (which file, which project, when) — apply 0269 to project dbkodyyxxhtygxcxmfcu with `node scripts/apply-migrations.mjs --env production` after reading --status; it applies every pending file, so check how far behind production is first. Management and the 2IC lose Send to hospital there.

## 4. Functional checks

- [x] Happy path works end to end — Add Shelter Photos saved a photo (HTTP 200, before: 500 Not authorized to add attachments); Approve showed 1 photo approved (before: could not be approved); Wrong animal moved a photo to another resident (before: could not be moved); Remove worked; the enclosure route saved
- [x] Data persists — the approved and moved photos left the waiting list after refresh; the saved photo got an attachments row
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: only create (upload), approve, move and remove were exercised; there is no edit surface
- [x] Empty state renders sensibly (no rows yet) — Approve photos with nothing waiting reads No photos are waiting
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no value handling changed

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every page | unchanged (outside the card system, not driven) | n/a: not driven |
| management | — | loses Send to hospital until given Manage medical | n/a: not driven; accepted by Lutan |
| staff | — | — | n/a: retired role (0173); production output naming it is a phantom |
| doctor | — | — | n/a: not driven |
| volunteer | /photos/add | add_photos (volunteer's card) now saves a tagged photo; enclosures and my_tasks not touched | pass: saved with HTTP 200 as a one-card add_photos login |
| signed out | — | — | n/a: no signed-out surface changed |

- [ ] Every role above tested — n/a: only one-card logins were driven (add_photos, approve_photos, medical_records, residents); the full per-role pass belongs to Lutan's rebuild of card assignments
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the DB guard still refuses a Medical-only login moving a photo out of Medical (condition untouched); a Residents-only login no longer gets Send to hospital (page and button checked)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: NavLinks and routes belong to card-app-11-21
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe these screens
- [x] Translatable strings go through the translation path, checked at `/management/translations` — two new Approve strings added to en and th; Thai wording not reviewed by a native reader
- [ ] Mobile viewport (375px) — n/a: no layout added; one confirmation dialog
- [ ] Browser console clean — n/a: checked through script-driven page interactions, console not read
- [x] Network clean — the only non-200s were Drive thumbnails for dev photos that no longer exist (404 before and after)

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /photos/add, /photos/approve, /residents/<id>/housing, /management/appeals/<id> (code path), /admin/who-does-what (read only, writes are Admin-only)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — cards.ts is read by every card page; the card-grants check and a full build passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged from main during this work

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: not ticked: the item also covers the My tasks residents menu entry, which card-app-11-21 owns
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-26-card-review-2-app-half.md
- [x] `README.md` still accurate — README does not describe any of this
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a… — one line added to unreleased, tagged by card
- [x] Commit messages say why, not just what — commit messages give the why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typec… — the failures, the 500 and the RLS refusal, were reproduced on dev before the fix and the saves re-driven after

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time… — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target projec… — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`… — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Work… — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Work… — deferred: production release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band … — deferred: production release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand… — deferred: production release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache pu… — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches pr… — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deplo… — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment… — deferred: production release manager

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** If yes, the production a… — yes: 0269 plus the code that reads it. Apply 0269 to production BEFORE the deploy, so the Approve guard, the record function and the card grants exist when the new code runs
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean… — to be run by the release manager; dev dry-run was clean
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh… — n/a: not destructive; no rows are rewritten, a function and a policy are replaced and card_grants rows move
- [x] Apply plan stated: which file, which project, and whether it runs before or after the depl… — 0269, project dbkodyyxxhtygxcxmfcu, before the Worker deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is se… — deferred: production release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Run appeals medical read and the setting notice were not driven in a browser (no appeal on dev to open); the logic is a null check and a card include | accepted: covered by check-card-grants and the build |
| 2 | low | Management and the second-in-command lose Send to hospital on production until given Manage medical | accepted: Lutan, asked directly, let them lose it; he rebuilds card assignments later |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Look at Photos to approve with an approver login: the warning dialog wording for a public animal, and no dialog for a private one | dev, scripts/dev-signin.mjs --cards approve_photos |
| 2 | The Thai wording of the new warning | /photos/approve |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification
- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; it is waiting on a person, see the signature below

Manual verification by: pending: a person reads the new warning wording (English and Thai) on Photos to approve

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed in the PR itself
- [ ] Handed to the production release manager — n/a: this runs at release time

Result: pass with accepted defects

Release manager acknowledgement: n/a: given at release time
