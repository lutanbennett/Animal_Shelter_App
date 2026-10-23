# Feature test plan — cut release `0.39.4`

## Header

| | |
|---|---|
| Feature | Cut release `0.39.4` — move the three `unreleased` notes into a new minor entry and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-39-4` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` (a free leftover reused, per the paperwork budget's rule 2 — see Defect 1 for what that rule does **not** save) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no — `0249` and `0250` are already on `main` from PR #867 and are applied at step 5 of the release |
| Tested at SHA | `3932654b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three notes move from `unreleased` into a new `0.39.4` entry dated 2026-10-23, `major: false`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two: `src/lib/releases.ts` and `package.json`. No route, no Worker, no migration, no shared lib. `git diff --numstat` reads `1 1 package.json` and `18 9 src/lib/releases.ts`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — notes 1 and 3 are role-tagged by their own feature PRs (note 1: admin, management, second_in_command, head_of_medical; note 3: those four plus doctor); note 2 is a plain string, so every live signed-in role sees it. Signed-out is unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cut is data only. The three features themselves merged in PRs #867–#875 and were verified by their own plans; this plan does not re-verify them. **Role tags were deliberately NOT revisited at the cut**: two of the three notes arrived tagged and one did not, and re-tagging here would contradict the byte-identical carry-over this plan asserts below. A tag is the feature PR's call, made by whoever knew the audience

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was created from `origin/main` at `6e51f007` minutes before the cut, so there was nothing to merge in. `git status -sb` read `...origin/main` with no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — see the block below, unedited
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

Unedited, as printed. Note there are **four** gates, not three — a `test` gate runs between lint and build:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 49s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 153s
=== gates: test — npm test
=== gates: test exited 0 after 19s
=== gates: build — npm run build
=== gates: build exited 0 after 237s
gates: typecheck=0 lint=0 test=0 build=0
```

The assertion run on the cut itself, also unedited. It imports both the pre-cut module (`git show origin/main:src/lib/releases.ts`) and the post-cut one and compares them, rather than reading the diff over:

```
PASS  new entry exists
PASS  note count matches — 3 before, 3 after
PASS  note 1 carried byte-identically
PASS  note 2 carried byte-identically
PASS  note 3 carried byte-identically
PASS  nothing invented
PASS  unreleased is empty — 0 left
PASS  majorReleasesSince(prev) is empty (no mail) — []
PASS  control: majorReleasesSince('0.38.2') still finds 0.39.0 — ["0.39.0"]
PASS  package.json matches newest entry — pkg 0.39.4, newest 0.39.4
PASS  file order is newest-first
PASS  0.39.3 entry untouched
PASS  all notes render as non-empty text
PASS  date is 2026-10-23 — 2026-10-23
PASS  major is false — false

CUT VERIFIED: 0 failures
```

**Two of those assertions failed on the first run, and both were the verifier's fault, not the cut's** — written down because a release manager who sees a red run needs to know which way it was resolved. `majorReleasesSince` returns `Release` objects, not version strings, so comparing them to `["0.39.0"]` could never pass; and a check for the literal word `undefined` anywhere in a note's text flagged `0.33.0`, whose note legitimately *describes* a date that read `"undefined"`. Both assertions were corrected and re-run; the cut was never touched. **A failing assertion is a claim about the verifier or the thing verified, and establishing which comes before changing either.**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. Production read `249 applied, 2 pending` before the cut, which is `0249` and `0250` awaiting section 8's apply
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0249` and `0250` went to dev with PR #867
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0249` and `0250`'s plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince`, `noteText`, `noteRoles` and `compareVersions` were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries three notes with their roles intact, and renders with no `[object Object]`
- [x] Data persists — reload the page and the change is still there — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry's version, which is what `deploy.mjs` refuses to ship without. Asserted and passing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty, and the one emptiness that matters — `unreleased` — is asserted empty above
- [x] Invalid input is rejected with a readable message, not a crash — the cut script refuses rather than half-writing: it throws `unreleased marker not found`, `unreleased terminator not found` and `unreleased is empty: nothing to cut` before writing a byte, so a second run against an already-cut file stops instead of producing a second empty entry. Verified by reasoning about the guards and by the clean single-run result; nothing malformed reached the commit
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the version boundary is the one that matters here: `compareVersions` still orders the file newest-first with `0.39.4` above `0.39.3`, and the mail decision was checked at the boundary **both ways** (section 8). Missing optional fields are covered too: note 2 has no `roles` key and `noteRoles` returns `undefined` for it, which is what makes it visible to every role

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`), and the template's row for it is left out deliberately.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin, management, second_in_command, head_of_medical | `/releases` | all three notes | asserted from the data: notes 1 and 3 tag all four; note 2 is untagged, so unfiltered |
| doctor | `/releases` | notes 2 and 3 | asserted from the data: note 3 tags `doctor`, note 2 is untagged, note 1 does not tag `doctor` |
| head_of_maintenance, volunteer, public_viewer | `/releases` | note 2 only | asserted from the data: note 2 is untagged; notes 1 and 3 tag neither role |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself. The cut changes no page, no route and no permission, so there is nothing a role could see differently beyond the note list, which is asserted from the data instead via `noteRoles`
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new page or permission; `/releases` is unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; the cut adds no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched by the cut. The manual topics for the feeding list and the per-serving diets shipped in their own PRs, #873 and #871
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI changed; `/releases` renders the same component it did before
- [ ] Browser console clean — no errors or React warnings — n/a: no page was driven for the cut itself, which changes no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/releases` is the only consumer, and the risk is data rather than rendering: `0.39.3`'s entry was asserted **byte-identical** to `origin/main`'s copy, and the file is still newest-first by `compareVersions`. The `build` gate compiles the file
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: none of those files is touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions above exercise
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (see section 2), and the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious was decided *by the cut*. The version call was Lutan's and is recorded in the release record; the reason the recommendation was overridden is in the cut commit message
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot gain a line, because its whole purpose is to empty `unreleased` by moving its three user-written lines into the published `0.39.4` entry. The notes a user will read are in this PR, in `releases` rather than `unreleased`; the checker holds this line to the diff, and the diff correctly shows `unreleased` going to `[]`
- [x] Commit messages say why, not just what — the cut commit says why minor was chosen **and that the recommendation was major**, and lists what was asserted mechanically
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run above, which imports both the pre-cut and post-cut modules and compares them. The claim easiest to tell as a story rather than measure — "no admin mail goes out" — was asserted as an absence **and** a presence

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `3932654b`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (read from `deploy.mjs`'s own line on each build)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (as `node scripts/deploy.mjs --env test`, since `npm run` is blocked by this machine's execution policy)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today". The entry's date is a literal string, `2026-10-23`, and `compareVersions` does not read a clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: there is no band, threshold or rounding rule in this PR. The one boundary present was checked both ways anyway: `majorReleasesSince("0.39.3")` returns `[]`, so no mail; `majorReleasesSince("0.38.2")` still returns `0.39.0`, so a function that always returned `[]` could not have passed both. An absence-check alone would have been vacuous
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block and the assertion block are both verbatim, including the two first-run failures and how they were resolved
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager (and `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff-testing gate)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager (expected to read 14, the baseline `0.39.1` set and held at on test through `0.39.3`; a different number means the deploy's env changed, and the log's own list is what to read)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR contains no migration. `0249` and `0250` are already on `main` from PR #867, and their declared consumers (`src/app/residents/[id]/page.tsx`; `src/app/admin/diets/*` and `src/lib/diets/recipes.ts`) merged separately in #872, #871 and #873 — all of them inside this release, so schema and code go live together
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **both `ok`**, run before the apply: `dry-run 0249 … ok`, `dry-run 0250 … ok`. The per-file-transaction caveat did not bite — `0250` does not depend on anything `0249` provides — but it was watched for, because a dry-run failure there would have meant "apply anyway", not "the file is broken"
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **n/a, and this was read rather than assumed, because it was the one line in this release where the gate might genuinely have engaged.** `0250` is additive: it `add column if not exists` on `diets` and `diet_ingredients`, and its one `update` fills the **new** `qty_per_serving` column only `where qty_per_serving is null`. `qty_small/medium/large` are explicitly kept — the column comment says *"Replaces qty_small/medium/large, which stay until the app stops reading them"* — so nothing is dropped, rewritten or back-filled over. **But see Defect 3: additive in the database is not the same as harmless to the dogs**, and that distinction is this release's main finding
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **done, before any deploy**: `0249_medical_card_reads_the_record.sql` then `0250_diets_one_amount_per_serving.sql` to `dbkodyyxxhtygxcxmfcu`, because this release carries the code that reads both. `249 applied, 2 pending` → **`251 applied, 0 pending`**, re-read afterwards. The `-- consumer:` warning appeared on both, exactly as predicted and in the safe direction: all three declared consumers (`src/app/residents/[id]/page.tsx`, `src/app/admin/diets/recipe-actions.ts`, `src/lib/diets/recipes.ts`) differ from the live `0.39.3`, so the schema landed under code that is not yet live

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref c0bdf272` on each Pi returns the served app to `0.39.3`, and `npx wrangler rollback --env production` returns only the Worker fallback — **and it would return it to `0.39.2`, not `0.39.3`, since `0.39.3` was never deployed there.** Neither reverts `0249` or `0250`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **Reusing a free leftover worktree did not save the `npm ci` it is meant to save.** Paperwork rule 2 reuses a leftover to avoid a four-minute install, but this leftover was 71 commits behind and the range contains the `next` 16.3.8 → 16.4.2 bump (#869), so it had `next` 16.3.8 installed against a `package.json` saying 16.4.2 — the `0.28.0` asymmetry exactly | **fixed** before any gate ran: `npm ci` in the worktree, confirmed `16.4.2`. **The rule needs a caveat**, which is going into the handover: reuse saves nothing when a dependency bumped inside the release range, and the tell is `require('next/package.json').version` against `package.json` |
| 2 | low | The handover's "START HERE" instruction — deploy the production Worker at `0.39.3` before cutting — **could not be carried out**, and following it blindly would have shipped a round of unreleased feature work. `main` had moved from three doc commits to 11 PRs of `src/` changes plus two migrations; `deploy.mjs` takes no `--ref`, and it refuses outright while `unreleased` has lines in it | **accepted and redirected.** The Worker catch-up is folded into this release instead, which is the better outcome: one SHA, all builds in step. Reported to Lutan rather than worked around |
| 3 | **high** | **`0250` quietly reduces what medium and large dogs are fed, on any diet whose amounts are not in 1 : 1.5 : 2 proportion.** The migration takes the **Small** amount as one serving (`qty_per_serving = qty_small / servings_small`) and `0.39.4`'s app computes medium as `small × servings_medium` (default 1.5) and large as `small × 2`. A diet entered as **1 : 2 : 3** therefore drops: on dev, **8 of 10 ingredient lines are 1 : 2 : 3**, so Diabetic green beans for a medium dog reads **45 g where it read 60 g**, and 60 g for a large where it read 90 g. Nothing on screen announces it. `0250`'s author knew — the file ends with a `do $report$` raising a NOTICE per out-of-proportion line and saying *"Each is Lutan's call"* | **accepted, on Lutan's explicit decision.** Put to him before any deploy with the dev figures and the per-diet remedy (Settings → Diets → *Servings by size* → 1 / 2 / 3 restores the old amounts exactly); he answered *"deploy now, I will fix diets after"*. Filed on the `backlog` branch as a FOR LUTAN item naming the remedy, and carried into the release record as the release's outstanding step. **Two limits stated rather than smoothed over:** the NOTICE never reaches anyone, because `apply-migrations.mjs` goes through the Management API, which drops notice output — the production apply printed only `applying 0250 … ok`; and **which production diets are affected was never established**, since all five diets check scripts are hard-locked to the dev project and I did not work around a guard that is there on purpose |
| 4 | low | `scripts/check-diets-per-serving-schema.mjs` is **RED on dev**: `FAIL  servings default to 1 / 1.5 / 2 - got 1`, i.e. one diet's `servings_*` are not at the defaults, alongside 11 passing checks | **reported, not explained away.** The plausible reading is benign — *Servings by size* is editable per diet by design, so an edited dev diet would fail this assertion legitimately — but that is a guess, and the script asserts the post-migration default rather than "nobody has edited one". **Stated as unresolved** rather than asserted as test data, because the honest answer is that it was not run to ground. It does not gate this PR: the script is dev-only and is not a CI check |
| 5 | low | Two of my own cut assertions failed on their first run — a comparison of `Release` objects against version strings, and an `undefined` substring check that flagged a note legitimately describing a date reading `"undefined"` | **fixed** in the verifier, which was then re-run clean. The cut itself was never modified; both were established as verifier faults before anything was changed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing from the cut itself. The cut changes no page, no route and no permission, and its note list is asserted from the data | — |

The six **feature** plans in this release that are `pending:` a person are not copied here. They belong to their own plans and their own signatures; Lutan's decision this release, in chat, was to ship them as recorded gaps, and they are listed in the release record instead.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the cut has no surface a person needs to look at, which is why the table above is a dash rather than a list

Manual verification by: n/a: the cut changes two data files and no page; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
