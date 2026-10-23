# Feature test plan — cut release `0.39.3`

## Header

| | |
|---|---|
| Feature | Cut release `0.39.3` — move the three `unreleased` notes into a new minor entry and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-39-3` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` (a free leftover reused, per the paperwork budget's rule 2) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no — `0248` is already on `main` from PR #861 and is applied at step 5 of the release |
| Tested at SHA | `b236996f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three notes move from `unreleased` into a new `0.39.3` entry dated 2026-10-23, `major: false`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two: `src/lib/releases.ts` and `package.json`. No route, no Worker, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees all three notes at `/releases`, because all three are untagged. Signed-out is unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cut is data only. The three features themselves merged in PRs #855–#862 and were verified by their own plans; this plan does not re-verify them. **Role tags were considered and deliberately not taken**: the vet-visit notes could be narrowed to who holds `medical.visits`, but whether the 2IC holds that grant is data rather than source, and a wrong tag hides a note from someone who needs it. Put to Lutan; he chose untagged

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was created from `origin/main` at `0b38b9bf` minutes before the cut, so there was nothing to merge in. `git status -sb` read `...origin/main` with no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed — see the block below, unedited
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

Unedited, as printed. Note there are **four** gates, not three — a `test` gate runs between lint and build:

```
=== gates: typecheck exited 0 after 20s
=== gates: lint exited 0 after 174s
=== gates: test exited 0 after 14s
=== gates: build exited 0 after 170s
gates: typecheck=0 lint=0 test=0 build=0
```

The assertion run on the cut itself, also unedited:

```
ok    unreleased is now empty — 0 left
ok    note count carried across — 3 before, 3 after
ok    note 1 byte-identical
ok    note 1 roles identical — undefined -> undefined
ok    note 2 byte-identical
ok    note 2 roles identical — undefined -> undefined
ok    note 3 byte-identical
ok    note 3 roles identical — undefined -> undefined
ok    nothing invented
ok    nothing lost
ok    new entry version — 0.39.3
ok    new entry date — 2026-10-23
ok    new entry is minor — false
ok    package.json matches newest entry — 0.39.3 vs 0.39.3
ok    previous release untouched
ok    release count grew by exactly 1
ok    file order matches compareVersions (newest first)
ok    no mail: majorReleasesSince('0.39.2') is empty — []
ok    presence check: majorReleasesSince('0.38.2') still finds 0.39.0 — ["0.39.0"]
ok    renders cleanly
ok    every note is a non-empty string

ALL CUT ASSERTIONS PASSED
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; `0248`'s production apply is section 8's
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev already reads `249 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0248`'s plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince` and the `/releases` data were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries three notes, and renders with no `[object Object]` or `undefined`
- [x] Data persists — reload the page and the change is still there — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry's version, which is what `deploy.mjs` refuses to ship without. Asserted and passing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty, and the one emptiness that matters — `unreleased` — is asserted empty above
- [x] Invalid input is rejected with a readable message, not a crash — the cut script refuses rather than half-writing: it threw `releases anchor not found` on CRLF line endings, and a `captured too much` guard was added against the `ReleaseNote[]` bracket. The first attempt was reverted with `git checkout --` and redone, so nothing malformed reached the commit
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the version boundary is the one that matters here: `compareVersions` still orders the file newest-first with `0.39.3` above `0.39.2`, and the mail decision was checked at the boundary **both ways** (section 8)

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`), and the template's row for it is left out deliberately.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every live signed-in role | `/releases` | all three notes, since all three are untagged | asserted from the data: `noteRoles` is `undefined` for all three, so nothing is filtered for anyone |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself. The cut changes no page, no route and no permission, so there is nothing a role could see differently beyond the note list, which is asserted from the data instead
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new page or permission; `/releases` is unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; the cut adds no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched; a release entry is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI changed; `/releases` renders the same component it did before
- [ ] Browser console clean — no errors or React warnings — n/a: no page was driven for the cut itself. The browser work this session was the note-1 verification, whose console was read and was clean
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/releases` is the only consumer, and the risk is data rather than rendering: `0.39.2`'s entry was asserted **byte-identical** to `origin/main`'s copy, and the release count grew by exactly one. The `build` gate compiles the file
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: none of those files is touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions above exercise
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (see section 2), and the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious was decided. The version call was Lutan's and is recorded in the release record; the untagged-notes reasoning is in section 1 above
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot gain a line, because its whole purpose is to empty `unreleased` by moving its three user-written lines into the published `0.39.3` entry. The notes a user will read are in this PR, in `releases` rather than `unreleased`; the checker holds this line to the diff, and the diff correctly shows `unreleased` going to `[]`
- [x] Commit messages say why, not just what — the cut commit says why minor was chosen and lists what was asserted mechanically
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run below, which imports both the pre-cut and post-cut modules and compares them. The claim easiest to tell as a story rather than measure — "no admin mail goes out" — was asserted as an absence **and** a presence

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `b236996f`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (read from `deploy.mjs`'s own line on each of the four builds)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (as `node scripts/deploy.mjs --env test`, since `npm run` is blocked by this machine's execution policy)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today". The entry's date is a literal string, `2026-10-23`, and `compareVersions` does not read a clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: there is no band, threshold or rounding rule in this PR. The one boundary present was checked both ways anyway: `majorReleasesSince("0.39.2")` returns `[]`, so no mail; `majorReleasesSince("0.38.2")` still returns `["0.39.0"]`, so a function that always returned `[]` could not have passed both. An absence-check alone would have been vacuous
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block and the assertion block are both verbatim
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager (and `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff-testing gate)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager (expected to read 14, the baseline `0.39.1` set; a different number means the deploy's env changed, and the log's own list is what to read)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR contains no migration. `0248` is already on `main`, and its declared consumer `src/lib/enclosures/options.ts` merged with it in PR #861
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (`0248`, before the deploy)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0248` changes a function and its policies, additively and re-runnably; nothing is dropped, rewritten or back-filled
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager. The plan, stated: `0248_residents_card_can_register.sql` to `dbkodyyxxhtygxcxmfcu`, **before** any deploy, because `main` already carries the code that calls the changed function

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref 6764913d` on each Pi returns the served app to `0.39.2`, and `npx wrangler rollback --env production` returns only the Worker fallback. Neither reverts `0248`, which is additive and safe to leave in place

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | My own cut script's first version matched the `[` in `ReleaseNote[]` rather than the array opener, and wrote `notes: [] = [` into the file | **fixed** before any commit — reverted with `git checkout --`, a `captured too much` guard added, and the cut redone. Nothing malformed was committed |
| 2 | low | `scripts/dev-signin.mjs --remove --cards residents` could not delete the throwaway dev login, because it is now `created_by` on the resident created during the note-1 check: `violates foreign key constraint "user_roles_role_id_fkey"` | **accepted.** Dev-only, a disposable `@example.invalid` login whose password nobody holds, on a database whose test data is disposable. Written down so the next session does not read it as a new fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a clinic login (doctor), book from `/appointments` and confirm you land back on `/appointments` — the half of note 3 a Residents-card session could not reach | `/appointments` on a dev server |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item left is a clinic-login view that needs a person, so it is left for them

Manual verification by: pending: item 1 above, the clinic-login return path for note 3

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
