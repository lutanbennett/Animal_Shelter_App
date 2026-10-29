# Feature test plan — cut release `0.40.11`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.11` — move the five `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-11` @ `C:\Development\Animal_Shelter_cut-release-0-40-11` — a fresh worktree |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | #1085 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-29 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries **two**, `0280` and `0281`, which belong to #1059 and #1068's plans and are not signed here |
| Tested at SHA | the cut commit `6c4a0cc8` on this branch, whose parent is `0c16262d` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — five `ReleaseNote`s move from `unreleased` into a new `0.40.11` entry dated 2026-10-29 with `major: false`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration
- [x] Roles affected identified — four of the five notes are tagged by **card**; the fifth (the public Adopt page's Happy endings journeys) is a plain string, correctly, because it is a public page everyone can see. None uses the older `roles:` form, which matters because a role read **by name** is the fault `CLAUDE.md`'s widen-never-narrow rule forbids. Admin sees every line regardless. **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down — `0280`, `0281` and the card definitions they carry are the release manager's apply step. **`major: false` is the whole of the mail decision**, asserted in both directions in section 2

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `0c16262d` minutes before the cut; `git status -sb` read no ahead/behind
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: typecheck exited 0 after 40s
=== gates: lint exited 0 after 99s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 124s
gates: typecheck=0 lint=0 test=0 build=0
```

  Status read from the command itself (`gates exit: 0`), not through a pipe.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **15** `ok` lines, exit code read from the command
- [x] **The cut was verified mechanically rather than read over.** Unedited output of `node scripts/cut-release.mjs 0.40.11 2026-10-29 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.11]
ok   new entry has the requested date  [2026-10-29]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.10 -> 0.40.11]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [5 vs 5]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.11]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions** — `majorReleasesSince("0.40.10")` is empty **and** `0.40.0` is still found from further back. The absence alone would also be satisfied by a function that had stopped working
- [x] **`npm ci` was not re-run, and the reason was measured rather than assumed** — `git diff --name-only 5ebb4a98..HEAD -- package.json package-lock.json` names **`package.json` only**, and that diff is a **single added `scripts` line** (`audit:register`). **`package-lock.json` is untouched**, so the installed tree still matches the lockfile. The build banner confirmed it: `▲ Next.js 16.4.2 (Turbopack)` against `"next": "16.4.2"` in `package.json`
- [x] **`npm run audit:prod` exits 1 with the SAME single advisory as the last two releases** — `GHSA-5j98-mcp5-4vw2`, `glob` CLI, 4 high — already covered by `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. **Nothing new appeared.** Its offered fix is `--force` to `@opennextjs/cloudflare@1.20.9`, a breaking downgrade of the adapter that caused the four-day cron outage, so it is refused again
- [x] **All 11 deferred-note candidates were reviewed and the judgement recorded with the cut** — `check-deferred-notes.mjs` listed 11 plans whose `n/a` reason points at a step still to happen. **None is owed a note in this release**, and the reasoning was passed to `cut-release.mjs --deferred-reviewed` so it is in the commit rather than only in a chat. The two that most needed deciding: the vet-card and forecast-card notes wait on **a role being given those cards**, which is an assignment in Settings → Who does what and is not done by applying `0280`/`0281`; `happy-endings-journey-page` was a false positive (its line is ticked and its note is in `unreleased`)

### The ordering boundary, which is the same one as last release

- [x] **`0.40.11` sits above `0.40.9` only under a version comparison, not a string one.** A naive string sort puts `"0.40.11"` below `"0.40.9"`, exactly as `"0.40.10"` did. It was checked **twice, in two ways**, because they prove different things: `cut-release.mjs --verify` asserts `version is newer than the previous release [0.40.10 -> 0.40.11]` and `releases are in compareVersions order` — **that proves the data**; and the **rendered page** was read on this cut build, where the first six version strings in document order are `0.40.11, 0.40.10, 0.40.9, 0.40.8, 0.40.7, 0.40.6` — **that proves the page**. Expect this again at every further double-digit patch

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0280` and `0281` are already on `main`, the next free number is `0282`, and the one open PR (#1082) is process documents only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own was read: production is `280 applied, 2 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's came back `0280 … ok`, `0281 … ok`, exit 0
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: this PR carries no migration. Both were applied to dev by their own PRs before merging; dev reads `280 applied` with the same two pending, applied at the same point
- [ ] File is re-runnable — n/a: this PR carries no migration. Both release migrations state re-runnability in their own headers
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, **reached by clicking the sidebar link rather than by typing its address** (a direct load in the browser pane leaves the page un-hydrated). It shows `0.40.11 · Buttons match your cards, medical photos appear, and Happy endings journeys — 29 Oct 2026` at the top with all five notes rendered as prose
- [x] Data persists — reload the page and the change is still there — re-read after a viewport change; the entry renders identically
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`; the page shows no unreleased block and runs from `0.40.11` down with no gap
- [ ] Invalid input is rejected with a readable message — n/a: no input surface. `check-release-guards.mjs` exercises the analogous refusals
- [x] Boundary cases checked — see the ordering boundary in section 2, checked in the data **and** on the page

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.11` and all five notes — Admin is outside the card system | **as expected** — driven signed in as Admin; all five notes present in the `0.40.11` block |
| a login holding `record_vet_care` | the releases page | sees the Book vet visit note | not driven — reason below |
| a login holding `food_forecast` / `medicine_forecast` | the releases page | sees the stock-pages note | not driven — reason below |
| a login holding `view_medical` | the releases page | sees the clinic-visits and medical-photos notes | not driven — reason below |
| a login holding none of those tags | the releases page | sees `0.40.11`, the public Happy endings note (untagged, so everyone's), and the four tagged notes greyed under Show everything | not driven — reason below |
| signed out | the releases page | redirected to `/login` | **as expected** — the first request to `/login` answered 200 as the sign-in page before any session cookie was set |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — widen-never-narrow | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code. The tagging is data, asserted character-identical in section 2, and `src/lib/release-audience.ts` is untouched and carries unit tests which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by five sign-ins.** The rows are written by **card**, not by role, because a role is a transient grouping of cards

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, and the cut adds no page. The `Release notes` entry was present in the running build's sidebar and is what was clicked to reach the page
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the five notes are English prose authored by their own PRs, not UI strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured: at 375×812 `scrollWidth` is **375** against a `clientWidth` of **375**, and `requestAnimationFrame` **fires**, so the page was genuinely hydrated when read
- [x] Browser console clean — `read_console_messages` with `onlyErrors` returned **No console logs**
- [ ] Network clean — n/a: not separately inspected beyond the requests the reader surfaced, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded rather than reasoned about. `0.40.11` heads the list; `0.40.10` down to `0.40.6` follow in order with their own notes and dates intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page** — the sidebar and `/my` rendered normally on the same build before the click through to `/releases`. **The third reader is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time
- [x] **An independent confirmation that this release mails nobody** — on the rendered page the `0.40.11` block carries **no Major badge**, while **40** render elsewhere on the same screen. A badge that had simply stopped rendering could not pass as a negative here
- [x] No `[object Object]` or `undefined` anywhere in the rendered page — checked across the whole body text, not only the new entry
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The advisory decision and the deferred-note guard both already exist and applied unchanged
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version number
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line. **The five notes' truth was checked rather than assumed**: none of them depends on a manual step still open. The four card-tagged ones describe button and page behaviour already in the code being deployed, and the Happy endings note describes a public page that ships in the same build. The notes that *would* have been false — the vet cards and the forecast cards — were deliberately **not** written, because no login holds those cards yet
- [x] Commit messages say why, not just what — the cut commit records the email answer, how the question was put, and the deferred-note review
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the skipped `npm ci` was justified by reading the actual `package.json` diff (one `scripts` line) and an untouched lockfile, rather than by "nothing much changed"; the ordering boundary was read off the rendered page as well as asserted; the advisory was confirmed to be the **same single** one rather than assumed unchanged; and the claim that `0280`'s narrowing costs nobody a cell was settled by reading production's `role-cards` — **no role holds the `dashboard` card** — rather than by trusting the migration's own header

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at `6c4a0cc8`, parent `0c16262d`; the deployed SHA will be this PR's merge commit, recorded in the release record with a code-identity diff
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff (`git diff --name-only <tested>..<deployed>` excluding `docs/` and `.claude/`), read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session. **Test is level with production as of `0.40.10`**, so it is a valid pre-production check
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-29`
- [x] **For a boundary or banding change, the assertions cover both edges** — the ordering boundary was covered on both edges: the data assertion (`0.40.10 -> 0.40.11`, `compareVersions` order) and the rendered page's own ordering
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks are the unedited stdout of `gates.mjs` and `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. **This release changes a public page** (the Adopt page's Happy endings journeys), so this is **not** vacuous for the cache purge — but the page itself cannot be opened signed-out while `PUBLIC_SITE` is `locked`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'`. **Hand the command over WITH a `tee`**
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. **14 on both environments for the last two releases**
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. The release's `0280` and `0281` each came in the same PR as their `cards.ts` definitions, so the per-PR gate fired on both
- [x] **`0281` only widens; `0280` widens and contains ONE narrowing, which was measured against production and costs nobody a cell.** `0281` adds four vet cards that no login holds. `0280` adds three view-only cards that no login holds, **and takes `reports.cashflow` off the `dashboard` card**. The `0257` triggers recompute every role's `role_permissions` when `card_grants` changes, so that narrowing could in principle remove a cell — **except that no role on production holds the `dashboard` card**, read from `check-production.mjs role-cards` before the apply. So the expected after-picture is all six roles unchanged at 15 / 8 / 10 / 41 / 25 / 4 cells
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **done, not deferred**: `0280 … ok`, `0281 … ok`, exit **0**. Its eight `-- consumer:` warnings are expected and are the safe direction: every named consumer file changes in **this** release, so the schema lands before its reader goes live
- [x] For a **destructive or rewriting** migration only: the before-picture was taken of the tables the migration writes — **`role-cells` and `role-cards` from production, before the apply**, because `0280` rewrites `role_permissions` through the `0257` triggers rather than only adding columns. Both are kept and will be re-run and diffed in the release record
- [x] Apply plan stated — **`0280` then `0281`, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind immediately before the apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `5ebb4a98`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts `0280` or `0281`.** A code-only rollback is **safe this release**: the seven new cards are held by nobody, and the one narrowing is of a card nobody holds, so `0.40.10`'s code would see a card table it does not read and no cell would have moved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with `GHSA-5j98-mcp5-4vw2` (`glob` CLI), 4 high | **Accepted, unchanged for a third release** and already covered by `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. Not reachable — nothing here runs the `glob` CLI — and its offered fix would downgrade `@opennextjs/cloudflare` to `1.20.9`, reinstalling the adapter that caused the four-day cron outage. **Expect the `audit` check RED on this cut**: that is now normal and cannot block a merge (`continue-on-error: true`) |
| 2 | none | **The one open PR, #1082, was left out of the release** | **Deliberate, and it costs nothing.** It is `.claude/skills/`, `CLAUDE.md`, a decision file and a test plan — process documents only, no app code, no migration, nothing a shelter user could see. It merges on its own schedule and the next release carries it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **On a resident's page, as a login that cannot book a vet visit** — Book vet visit must be absent, not present-and-refusing; then as one holding Record vet care, and confirm booking works | Lutan |
| 2 | **On Diet stock and Medication stock, as a login that can only look at the forecast** — Stocktake, Stock between counts, Purchasing and Record a delivery must all be absent, and the page description must not promise counting and pricing | Lutan |
| 3 | **On a resident's Clinic Visits tab, as a login that can only read medical records** — Log blood test, Add prescription, Log weight and Log procedure must be absent | Lutan |
| 4 | **As a login that can see Medical photos**, open the resident's Photos tab and confirm the medical photos now appear there rather than the tab claiming none were uploaded | Lutan |
| 5 | **On the public Adopt page, press a Happy endings picture** and confirm it opens that animal's journey — arrival, story, family news, and the day they went home. **Needs an account while `PUBLIC_SITE` is `locked`** | Lutan |
| 6 | **Assign the seven new cards, or decide not to.** `0280` and `0281` create three view-only cards (Food forecast, Medicine forecast, View cashflow) and four vet cards (Record vet care, Record microchip, Adoption news, Add while recording). **No login holds any of them**, so they do nothing until given out in Settings → Who does what — and their release notes are deliberately withheld until then | Lutan |
| 7 | **Carried from `0.40.7`: give the Translations card to Management.** `0271` deliberately gave it to no role, and it is the one carried item left | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked — the seven rows above are for Lutan and only the person who looked may tick this. Five of them can only be done on production after the deploy

Manual verification by: pending: the seven rows in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
