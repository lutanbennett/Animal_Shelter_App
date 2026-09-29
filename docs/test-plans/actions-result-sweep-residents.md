# Feature test plan — actions-result-sweep-residents

## Header

| | |
|---|---|
| Feature | Server Actions under `/residents` are wrapped in `runAction()` and return `{ ok: false, error }` instead of letting a failure throw (#441, part 2 — the `/residents` area only) |
| Backlog item | `docs/backlog.md` → "Server Actions across the app: return a result instead of throwing (#441, part 2)" — left unticked (spans the whole app); its bracket note now records `/residents` done |
| Branch / worktree | `claude/actions-result-sweep-residents` @ `C:\Development\Animal_Shelter_actions-result-sweep-residents` |
| Dev server | **production build**, `next build` + `next start -p 3009` (the worktree's `.port`). #441 exists only in production, so `next dev` would prove nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | `33cc7c2` (`worktree.mjs sync` reported already up to date with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every `"use server"` file under `src/app/residents/**` now runs its body inside `runAction()` (an unexpected throw becomes a readable message with a reference, not #441) and returns `{ ok: false, error }` for a refusal
- [x] Files/areas touched listed — the eleven `actions.ts` files under `src/app/residents/` (`new`, `[id]/{blood-tests,deceased,edit,hospital,hospital/return,move,photos,procedures,rehome,rehome/return}`; `adoption-updates` was already converted); callers `src/components/{PhotoGallery,BloodTestList,ProcedureList}.tsx`; `docs/backlog.md`, `docs/decisions.md`, `src/lib/releases.ts`, this plan
- [x] Roles affected identified — every role that uses these actions (admin, management, staff, vet, volunteer for photos); no permission check moved, added or removed
- [x] Anything explicitly **out of scope** written down — (a) every other area (contacts, management, projects, maintenance); (b) the near-duplicate types `FriendActionResult`, `ProjectActionResult`, `MaintenanceActionResult`, `TranslationActionResult`, owned by other areas — residents has none of its own; (c) the shared helpers in `src/lib/placements/*`, `src/lib/archive/*`, `src/lib/residents/*`, which the assistant also uses and still return `{ error }` (the actions translate at the boundary)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` had nothing new; "Already up to date", pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 46s

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

- [x] Happy path works end to end — verified at code level only: each action keeps its queries, `revalidatePath` calls and `redirect()`; the production build type-checks every caller against the new return shapes (see "Left for manual verification" 1)
- [ ] Data persists — reload the page and the change is still there — n/a: no signed-in browser session was available in this sandbox; see "Left for manual verification" 1
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: same reason; see "Left for manual verification" 1
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rendering changed, only how a refusal or failure reaches the screen
- [x] Invalid input is rejected with a readable message, not a crash — every validation refusal keeps its exact message, condition and order; it is now `{ ok: false, error }` (confirmed by reading `git diff -w` for each file)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unchanged: no validation rule was altered, only its delivery

### Production-build verification (the check that matters most here)

- [x] `next build` produced a real Turbopack **production** build (exit 0, all `/residents` routes in the route list), not a dev server
- [x] `next start -p 3009` served the built app; an unauthenticated request to `/residents/new` returned `307` to `/login?next=%2Fresidents%2Fnew`, so the page guard is unaffected and the production server does not crash
- [ ] **Signed in, triggered 2–3 real refusals on the production build and read the actual message (not "Minified React error #441")** — n/a: genuinely not performed, not a false tick: no signed-in session (password or Google account) was available in this sandbox. This is the check that matters most; it is item 1 under "Left for manual verification". The mechanism is the same `runAction`/`ActionResult` the Security page proved in a real browser on 2026-09-26 (`docs/test-plans/security-action-errors.md`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all residents actions | work; refusals readable | not driven live — checks and their order unchanged |
| management | as admin except death undo | same | not driven live |
| staff | intake, edit, move, hospital, rehome, photos | same | not driven live |
| vet | photos (Medical folder), procedures, blood-test files | same | not driven live |
| volunteer | photos where allowed | refused with the existing message | not driven live |
| signed out | nothing | redirected to `/login` | `/residents/new` → `307` to `/login` on the production build |

- [ ] Every role above tested — n/a: signing in as each role needs credentials this sandbox does not have; every role check is the same code as before, in the same order
- [x] A role that should not have access is blocked server-side — signed-out `/residents/new` redirected to `/login` on the production build; inside the actions every existing role check still runs first, unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no control, page or wording changed; only what a failure looks like
- [ ] Translatable strings go through the translation path — n/a: no new string; the message is the existing `t.common.somethingWentWrong`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout or markup change
- [ ] Browser console clean — no errors or React warnings — n/a: no browser session was driven; see "Left for manual verification" 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: only signed-out `curl` was possible here (clean `307`); see "Left for manual verification" 2

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — all converted routes compile, type-check and appear in the production route list: `/residents/new`, `/residents/[id]/{edit,move,hospital,hospital/return,rehome,rehome/return,deceased/*}`, and the photo, blood-test and procedure lists that call the converted deletes
- [x] Any shared file touched checked from a second, unrelated page — no shared library was touched; the three components edited (`PhotoGallery`, `BloodTestList`, `ProcedureList`) are used only for residents, and the whole-app typecheck is clean
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; the item spans the whole app. Its area note now says `/residents` is done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "2026-09-29 — Server Actions return a result, not a throw (part 2: `/residents`)"
- [x] `README.md` still accurate — n/a: README does not describe action error handling
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line saying resident pages now show a real message instead of a numbered code
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — "only `adoption-updates` was already converted" and "eleven files returned `{ error }`" come from `grep -c runAction` and `grep "export type"` over every residents `actions.ts`, not from memory; the gates line and `307` are pasted from the real runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives "today" or any instant
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold, rounding rule or permission cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates line and the `307` are copied from the runs above
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
| 1 | low | `runAction<{}>` failed lint (`no-empty-object-type`) in seven places | fixed — dropped the generic (`33cc7c2`) |

Pre-existing, not changed: `BloodTestList` and `ProcedureList` show nothing when a delete is refused; noted in decisions.md as a small follow-up.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in on a production build, cause a real refusal and read the message (not "Minified React error #441"): submit `/residents/new` with the name blank; try Move to the enclosure the resident is already in; refile a photo as a vet into a folder other than Medical | `test.lannacare.org` → `/residents/new`, `/residents/<id>/move`, the photo gallery |
| 2 | Browser console and network tab clean during the above | same pages |

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
