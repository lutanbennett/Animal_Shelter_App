# Feature test plan — cut release `0.40.0`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.0` — move the three `unreleased` notes into a new **mailing** entry and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-0` @ `C:\Development\Animal_Shelter_cut-release-0-40-0` (a **fresh** worktree; both of the previous release's were cleaned up by another session) |
| Dev server | not started; the cut changes two data files and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-24 |
| Carries a migration? | no — `0252` and `0253` are already on `main` from #885 and #893 and are applied at step 5 of the release |
| Tested at SHA | `492b9143` |

**This is the first release in six that actually mails.** `major: true`, so
`worker/release-mail.mjs` sends on the production deploy. That makes the note text and
the role tags the highest-risk part of this cut, and they are asserted byte-identical
below rather than read over.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three notes move from `unreleased` into a new `0.40.0` entry dated 2026-10-24, `major: true`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two: `src/lib/releases.ts` and `package.json`. `git diff --stat` reads `2 +-` and `27 +++---`. No route, no Worker, no migration, no shared lib
- [x] Roles affected identified: admin / management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer — **tags carried, not revisited.** Note 1 (Record a delivery) is an untagged plain string, so every signed-in role sees it; note 2 (Units of measure) is `admin` only; note 3 (Recurring jobs) is `admin, management, second_in_command`. Signed-out is unaffected. `staff` is retired (`0173`) and is deliberately not listed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cut is data only; the ten features merged in #884–#893 were verified by their own plans and this plan does not re-verify them. **Role tags were deliberately NOT revisited at the cut**: two notes arrived tagged and one did not, and re-tagging here would contradict the byte-identical carry-over asserted below. A tag is the feature PR's call, made by whoever knew the audience (the `0.39.4` precedent)

**The one judgement in this cut, and it was Lutan's.** `docs/release-procedure.md` says to ask
whether a release is major or minor before cutting, because it decides whether mail goes out
and cannot be undone once the production deploy has run. He was asked with the fact
`release-procedure.md:114` says to state plainly — **a major release currently mails ONE
person**, since the shelter's own address is not on the production admin list, so "mails every
admin" overstates the lever — and chose **minor**, i.e. the middle-number bump, knowing that.

**A terminology trap worth naming, because getting it backwards would silently suppress the
mail.** "Minor" in Lutan's words is the **middle-number** bump, and this repo's `major`
boolean means *"worth an email"*, not *semver major*. So minor → `0.40.0` → `major: true`.
**Verified against the data rather than reasoned**: every middle-number release in the file —
`0.39.0`, `0.38.0`, `0.37.0`, `0.36.0` — carries `major: true`, and every `x.y.Z` carries
`false`.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `3123cc45` minutes before the cut, so there was nothing to merge in. `git status -sb` showed no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see the block below, unedited, all four numbers read
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

**Step 1's `npm ci` in the main checkout was run, having been skipped on `0.39.5`.** It is
the step whose omission nearly shipped a mismatched build on `0.28.0`, and the main checkout
is where both Worker builds are made. Measured first and then run anyway: `package-lock.json`
is **unchanged** across the release range (the only `package.json` change is the `lint` script
gaining `check-activity-lists.mjs`), and installed `next` already read `16.4.2` against both
`package.json` and the lockfile — so it was almost certainly a no-op, but "installed `next`
matches" proves one package, not a tree. **Exit 0.** Stated plainly: on `0.39.5` this step was
skipped, and checking now shows it would have passed, so that release's Worker builds were not
affected.

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 80s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 116s
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-release-guards.mjs` — **16 of 16 `ok`, exit 0**, read via `PIPESTATUS[0]`
rather than the pipe's status.

The assertion run on the cut itself, unedited. It imports both the pre-cut module
(`git show origin/main:src/lib/releases.ts`, written to a temp file and imported as its own
module) and the post-cut one, and compares them:

```
1. unreleased is now empty
  ok   0 notes
2. the new entry is at the top, exactly once
  ok   releases[0] is 0.40.0
  ok   appears once
3. every note carried across BYTE-IDENTICALLY, none lost, none invented
     origin/main unreleased: 3 note(s); new entry: 3 note(s)
  ok   count matches (3)
  ok   note 1 identical (incl. roles): Record a delivery no longer ignores your first t
  ok   note 2 identical (incl. roles): Units of measure are now a list you keep yoursel
  ok   note 3 identical (incl. roles): The Recurring jobs page now opens in a few secon
4. prior released entries untouched
  ok   all 64 prior entries byte-identical
5. this IS a mailing release, asserted both ways
  ok   major: true
     majorReleasesSince('0.39.5') -> ["0.40.0"]
  ok   the mail will fire, for 0.40.0 and nothing else
     control majorReleasesSince('0.39.0') -> ["0.40.0"]
  ok   0.39.1-0.39.5 correctly absent
6. package.json equals the newest entry
  ok   package.json 0.40.0
7. version numbering: a middle-number bump, last number reset
  ok   0.39.5 -> 0.40.0: middle +1, last reset to 0
8. file order still matches compareVersions (newest first)
  ok   all 65 entries descending
9. the new entry renders: no [object Object], no undefined, roles all live
  ok   untagged: every signed-in role sees it
  ok   roles ok: admin
  ok   roles ok: admin,management,second_in_command
     3 note(s) render as non-empty text

CUT VERIFY PASSED
```

**No assertion failed on its first run this time** — the two false positives the last two
releases recorded (a `Release`-object comparison, and an `undefined` substring flagging
`0.33.0`'s note, which legitimately quotes a date reading `"NaN undefined NaN"`) were both
designed out: object comparison is by `JSON.stringify`, and the render scan covers only the
new entry, since prior entries are already proven byte-identical.

**The cut script lifts `unreleased` by brace matching, not by regex.** A note containing a
`]` or a nested object cannot silently truncate the array, and it refuses before writing a
byte if the array is empty or its terminator is missing. That matters more here than on
`0.39.5`: that cut carried **no** notes, this one carries **three**, and a truncation would
drop a note from a release that mails.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. `0252` and `0253` are on `main`; next free is `0254`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — reviewed for the release: production reads **`252 applied, 2 pending`** (`0252`, `0253`)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — **run against production, both `ok`**: `dry-run 0252_units_of_measure_are_data.sql … ok`, `dry-run 0253_doctor_clinic_scope.sql … ok`. **The per-file-transaction caveat was watched for and did not bite**: with two pending files, a red on `0253` for something `0252` provides would have meant "apply anyway", not "the file is wrong" (`0075`/`0076`, 2026-09-24) — `0253` turns out to depend on nothing `0252` adds. `0252`'s three `-- consumer:` warnings appeared exactly as predicted and **in the safe direction**: all three declared consumers differ from live `0.39.5`, so the table lands under code that is not yet live. **This line was originally written `deferred:`, and `check-test-plan.mjs` correctly refused it** — `deferred:` belongs only to the pre-production gate, and everywhere else a check is run, `n/a`, or not done. The checker was right and the better answer was to run it, which is what happened
- [x] Applied to **dev** and recorded in `schema_migrations` — yes, with #885 and #893
- [x] File is re-runnable — both declare it; `0252` and `0253` are `if not exists` / `or replace` style, as the existing ones are
- [x] Existing rows still read correctly after the change — asserted by their own plans (#885 `pass`, #893 `pass`), not re-derived here
- [x] **Constraints and defaults exercised against real rows** — their own plans' work. **What this plan adds is the risk read that neither states in release terms**: see the box below
- [x] Down-migration written, or the reason one is not needed is stated — `0253` is policy-only and reversible by replacing the policies; `0252` is additive
- [x] Production apply plan stated for the release manager — **both to `dbkodyyxxhtygxcxmfcu`, before both deploys**, in number order. `0252`'s declared consumers (`src/app/admin/diets/AddButtons.tsx`, `IngredientDetail.tsx`, `actions.ts`) ship in **this** release via #891, so schema must precede code

### The two migrations, read rather than assumed

**`0252_units_of_measure_are_data.sql` — ordering matters.** Its header declares consumers in
`src/app/admin/diets/`, and #891 (the app half) is **in this release**. So this is the same
shape as `0.39.5`'s `0251`: apply before the deploy, or the Units page meets a table that is
not there. Safe direction confirmed by the runner's own `-- consumer:` warning at step 5.

**`0253_doctor_clinic_scope.sql` — `consumer: none`, and it is the one to watch.** Its header:
*"Closes a live permission gap: a doctor login could write outside its own clinic. Policies
only; no app code reads anything new."* Two things follow that the feature plan does not say
in release terms:

1. **It is a security fix, and it takes effect the moment it is applied** — not when the app deploys. Policies are enforced by the database. So unlike every other change in this release, `0253` changes production behaviour at step 5, before anything is served differently.
2. **`consumer: none` means no code reads anything NEW. It does not mean nothing is affected.** A policy that *narrows* writes can break an existing write path that relied on the wider access. The reassuring reading — doctors only ever write within their own clinic in practice — is **#893's to have established, and its plan reads `pass` with `Manual verification by: n/a: no UI surface`.** This plan does not promote that to a conclusion; it records that **a narrowing policy is the kind of change that fails quietly for one role**, and that the doctor role is therefore worth a look on test after the deploy. Noted in section 8's deploy safety.

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince`, `noteText`, `noteRoles` and `compareVersions` were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries three notes with their roles intact, and renders with no `[object Object]`
- [x] Data persists — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry, which is what `deploy.mjs` refuses to ship without. Asserted, and `check-release-guards.mjs` exercises that refusal in both directions
- [ ] Create / edit / delete all exercised — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty, and the one emptiness that matters, `unreleased`, is asserted empty above
- [x] Invalid input is rejected with a readable message, not a crash — the cut script throws `unreleased is empty: nothing to cut`, `unreleased marker not found` and `unreleased terminator not found` **before writing a byte**, so a second run against an already-cut file stops rather than producing a second empty entry
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **the mail boundary is the one that matters on a mailing release, and it was checked both ways**: `majorReleasesSince("0.39.5")` returns exactly `["0.40.0"]`, and the control `majorReleasesSince("0.39.0")` returns `["0.40.0"]` **without** `0.39.1`–`0.39.5`, so a function that returned every release could not have passed both. The version boundary was asserted too: `0.39.5 → 0.40.0` is a clean middle bump with the last number reset. Missing optional fields are covered: note 1 has no `roles` key, so `noteRoles` returns `undefined`, which is what makes it visible to every role

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all three notes | asserted from the data: note 2 tags `admin`, note 3 tags `admin`, note 1 is untagged |
| management, second_in_command | `/releases` | notes 1 and 3 | asserted: note 3 tags both; note 1 untagged; note 2 is `admin` only |
| head_of_maintenance, head_of_medical, doctor, volunteer | `/releases` | note 1 only | asserted: note 1 untagged; notes 2 and 3 tag none of these |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |
| every admin on the production list | **email** | the `0.40.0` notes | **deferred: release manager** — the mail is sent by the production deploy and must be confirmed to have *arrived*, not just reported `sent N` |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself, which changes no page, route or permission. The note list is asserted from the data via `noteRoles`. **The roles whose pages this release changes are verified on test at the release's own verification step**, not here
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission in this PR. **`0253` does narrow a role server-side**, and that is its own PR's check, read in section 3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by the cut
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched by the cut; #891 carried its own manual changes for the Units page
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is. **#891's own plan leaves Thai wording `pending:` a person**, which is listed in the record, not here
- [ ] Mobile viewport (375px) — n/a: no UI changed; `/releases` renders the same component
- [ ] Browser console clean — n/a: no page was driven for the cut itself
- [ ] Network clean — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only consumer, and the risk is data rather than rendering: **all 64 prior entries** were asserted byte-identical to `origin/main`'s copy, and the file is still newest-first by `compareVersions` across all 65. The `build` gate compiles the file
- [ ] Any shared file touched checked from a second, unrelated page — n/a: none touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions exercise. **`worker/release-mail.mjs` is a fourth reader on this release**, and it is the one the assertions target directly via `majorReleasesSince`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item. **Nothing needed folding in either**: `git log --oneline main..backlog` was empty at step 1, because yesterday's backlog notes were already merged overnight
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious was decided *by the cut*. The version call was Lutan's and is recorded in the cut commit and in the release record
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot tick this line, because the checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The notes users will read are in this PR, in `releases` rather than `unreleased`, and this time they will also be **mailed**
- [x] Commit messages say why, not just what — the cut commit records whose call minor was, the terminology trap and how it was verified against the data, that this release actually mails, and every assertion
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run. The claim easiest to tell as a story rather than measure — "the mail will go out" — was asserted as a **presence** and bounded by a control, which is the opposite of the previous five releases, where the same function was asserted to return nothing

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `492b9143`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (read from `deploy.mjs`'s own line on each build)
- [x] **Every PR in this release has a completed test plan** — the release-time confirmation `CLAUDE.md` requires, because `test-plan` is advisory and a PR can reach `main` unchecked. The list is **`node scripts/release-prs.mjs 55a23450 HEAD`** — **10 PRs, exit 0**, 12 added migration/test-plan files checked against the list with no orphan — not a `git log` read. All ten carry a plan and **none is red**: #884, #885, #888, #892, #893 `pass`; #886, #887, #889, #890, #891 `pass with accepted defects`. **Four are `pending:` a person** and are listed in the release record, not copied here

### On the deployed build

- [ ] Deployed to test: `node scripts/deploy.mjs --env test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in **this PR** derives "today"; the entry's date is the literal string `2026-10-24` and `compareVersions` reads no clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band, threshold or rounding rule in this PR. The two boundaries that do exist — the mail decision and the version bump — were each checked both ways anyway (section 4)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block, the guard count and the assertion block are verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. `PUBLIC_SITE` was `locked` as of `0.39.5`, which makes that check vacuous; **re-read it rather than assuming it still is**

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager (`dbkodyyxxhtygxcxmfcu`; grep the project ref, not the arrow, and read the production log with `Get-Content … | Select-String`, since PowerShell's `tee` writes UTF-16)
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager (expected **14**, the baseline confirmed on both environments for two releases; a different number means the deploy's env changed, and the log's own list is what to read)
- [ ] **The release mail actually arrived** — deferred: release manager. **This is the line that distinguishes this release.** `deploy.mjs` prints `release mail for 0.40.0: sent N, skipped M`, and that is the relay *accepting* it, not delivery. Confirm the message from `releases@lannacare.org` with `0.40.0` in the subject is in the inbox. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure, though it has not recurred in several releases
- [ ] **The doctor role still works after `0253`** — deferred: release manager. Not a line this template carries; added because `0253` narrows a doctor's writes at the database level and `consumer: none` means no *new* reads, not no effect (section 3)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, this PR contains neither. But the **release** does: `0252`'s declared consumers ship in #891, in this release, so **migration first, then deploy**. `0253` is policy-only and ordering-independent, though it takes effect on apply
- [ ] `--env production --dry-run` run and clean — deferred: release manager, at step 5. **Two pending files, so the per-file-transaction caveat is live**: if `0253` dry-runs red on something `0252` would have provided, read both files before concluding anything is broken — a red dry-run there means "apply anyway", not "the file is wrong" (`0075`/`0076`, 2026-09-24)
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **n/a, and read rather than assumed.** `0252` is additive (a new table plus seed rows). `0253` is policy-only: it drops and recreates policies, which changes no row. Neither rewrites or deletes data, so the gate does not engage. Said explicitly because `0.39.4`'s lesson was that *additive in the database is not the same as harmless* — here the harm channel is a **narrowed write path**, not data loss, and a backup would not be its remedy
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0252` then `0253`, to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `252 applied, 2 pending` → expect `254 applied, 0 pending`, re-read afterwards with a clean drift check

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref 55a23450` on each Pi returns the served app to `0.39.5`, and `npx wrangler rollback --env production` returns only the Worker fallback, also to `0.39.5`. **Neither reverts `0252` or `0253`** — and the asymmetry differs between them. `0252` is inert under `0.39.5`'s code, which does not know the table, so leaving it is harmless. **`0253` is NOT inert**: it is policy, so a rollback of the code leaves the narrowed doctor scope in place. That is the safe direction for a security fix and should not be undone casually, but it must be *known* rather than discovered. **And the mail cannot be rolled back at all** — once the production deploy sends it, it is sent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Nothing in the cut. **Two faults this release manager filed yesterday are already fixed and shipping in this very release** (#886): `dev-signin.mjs <role>` — the documented form — now works, and `check-home-screens-live.mjs` runs again | **closed by #886**, and the backlog item was **retitled** to say only part (3) remains (`--remove admin` still cannot delete that login; it now names the four dev rows holding it instead of failing opaquely). Confirmed by running the documented form, which succeeded. Noted here because it is the loop closing: filed from a verification round, fixed by a stream, verified in the next release |
| 2 | medium | **`worktree.mjs done` is worse than yesterday's note recorded.** It was filed as "offers `--force` on a false premise"; the planner traced the cause and found that because `done` resolves the folder by name and the branch by branch, **`done <orphan branch name>` can target a LIVE worktree** — on 2026-10-23 `done auto-tiles-out` resolved to the folder holding `claude/record-0-39-5`, this session's live release branch, and `--force` would have destroyed it mid-release **while deleting an unrelated branch** | **not fixed, correctly escalated**, and nothing was lost because the refusal was read rather than obeyed. Moved by the planner from the sign-in item into `## Architecture` as its own item, with this session's sharper detail merged in, because a tool fault filed under a sign-in title is invisible to anyone looking for it. **Standing consequence for any release manager: never pass `--force` to `done` on a folder whose name does not match its branch** — and a release creates exactly that state routinely |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — the cut changes two data files and no page, route or permission | — |

**The four `pending:` items among this release's ten PRs are deliberately not copied here.**
They belong to their own plans and their own signatures; a second home is how an open item
stops being closed anywhere (`CLAUDE.md`, and the `0.39.4` handover). They are listed in the
release record, and what the release manager will actually drive on test is recorded there
too — on `0.39.5` that approach closed two of three such items rather than shipping them as
gaps.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **the cut**: two data files, no page, no route, no permission. It is not a claim about the release's four `pending:` items, which are not this plan's to close

Manual verification by: n/a: the cut changes two data files and no page; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-24
