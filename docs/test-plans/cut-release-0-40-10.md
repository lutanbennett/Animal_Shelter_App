# Feature test plan — cut release `0.40.10`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.10` — move the two `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-10` @ `C:\Development\Animal_Shelter_cut-release-0-40-10` — a fresh worktree |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | #1045 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries **one**, `0279`, which belongs to #1042's plan and is not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `7a7b2ce3` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two `ReleaseNote`s move from `unreleased` into a new `0.40.10` entry dated 2026-10-28 with `major: false`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration
- [x] Roles affected identified — both notes are tagged by **card**; neither uses the older `roles:` form, which matters because a role read **by name** is the fault `CLAUDE.md`'s widen-never-narrow rule forbids. Admin sees every line regardless. **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down — `0279` and the access it changes are the release manager's apply step. **`major: false` is the whole of the mail decision**, asserted in both directions in section 2

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `7a7b2ce3` minutes before the cut; `git status -sb` read no ahead/behind
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: typecheck exited 0 after 35s
=== gates: lint exited 0 after 77s
=== gates: test exited 0 after 14s
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
```

  Status read from the command itself (`GATES_EXIT: 0`), not through a pipe.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **16** `ok` lines, exit code read from the command
- [x] **The cut was verified mechanically rather than read over.** Unedited output of `node scripts/cut-release.mjs 0.40.10 2026-10-28 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.10]
ok   new entry has the requested date  [2026-10-28]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.9 -> 0.40.10]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.10]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions** — `majorReleasesSince("0.40.9")` is empty **and** `0.40.0` is still found from further back
- [x] **`npm ci` was not re-run, and the reason was measured rather than assumed** — `git diff --name-only 0911a1e0..HEAD -- package.json package-lock.json` is **empty**, so the tree installed for `0.40.9` still matches the lockfile. The build banner confirmed it: `▲ Next.js 16.4.2`
- [x] **`npm run audit:prod` exits 1 with the SAME single advisory as `0.40.9`** — `GHSA-5j98-mcp5-4vw2`, `glob` CLI — already covered by `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. **Nothing new**, and the four advisories retired last release have not returned

### The boundary this cut actually has, and it is a first

- [x] **`0.40.10` is the first double-digit patch number, which is a real ordering boundary.** A naive string comparison sorts `"0.40.10"` **before** `"0.40.9"`, so a release-notes page that sorted as text would silently bury this release below the previous one. It was checked **twice, in two ways**: `cut-release.mjs --verify` asserts `version is newer than the previous release [0.40.9 -> 0.40.10]` and `releases are in compareVersions order`; and the **rendered page** was read, where the first five version strings in document order are `0.40.10, 0.40.9, 0.40.8, 0.40.7, 0.40.6`. **The assertion alone would not have been enough** — it proves the data, not the page

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0279` is already on `main`, the next free number is `0280`, and `gh pr list` was **empty** at the cut
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own was read: production is `279 applied, 1 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's came back `ok`, exit 0
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: this PR carries no migration. `0279` was applied to dev by #1042 before merging
- [ ] File is re-runnable — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and shows `0.40.10 · Edit appears only if you can edit, and Medical folder photos need permission — 28 Oct 2026` at the top with both notes rendered as prose
- [x] Data persists — reload the page and the change is still there — re-read after navigation and after a viewport change; the entry renders identically
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`; the page shows no unreleased block and runs from `0.40.10` down with no gap
- [ ] Invalid input is rejected with a readable message — n/a: no input surface. `check-release-guards.mjs` exercises the analogous refusals
- [x] Boundary cases checked — see the double-digit ordering boundary in section 2, checked in the data **and** on the page

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.10` and both notes — Admin is outside the card system | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.10`; both notes are card-tagged, so it sees those it holds cards for | not driven — reason below |
| second_in_command | the releases page | sees `0.40.10`; tagged notes per its cards, others greyed under Show everything | not driven — reason below |
| head_of_medical | the releases page | sees `0.40.10`; the medical-photos note is tagged with cards it holds | not driven — reason below |
| volunteer | the releases page | sees `0.40.10`; both notes greyed under Show everything, as it holds neither tag | not driven — reason below |
| signed out | the releases page | redirected to `/login` | **as expected** — the first request to `/login` answered 200 as the sign-in page before any session cookie was set |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — widen-never-narrow | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code. The tagging is data, asserted character-identical in section 2, and `src/lib/release-audience.ts` is untouched and carries unit tests which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by five sign-ins**
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, and the cut adds no page. The `Release notes` entry was present and highlighted in the running build's sidebar
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the two notes are English prose authored by their own PRs, not UI strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured: at 375×812 `scrollWidth` is **375** against a `clientWidth` of **375**
- [x] Browser console clean — `read_console_messages` with `onlyErrors` returned **No console logs**
- [ ] Network clean — n/a: not separately inspected beyond the requests the reader surfaced, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded rather than reasoned about. `0.40.10` heads the list; `0.40.9` down to `0.40.6` follow in order with their own notes and dates intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page** — `/api/version` on the running build answers `0.40.10`. **The third reader is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time
- [x] **An independent confirmation that this release mails nobody** — on the rendered page `0.40.10` carries no **Major** badge while **forty** render elsewhere on the same screen. A badge that had stopped rendering could not pass as a negative here
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. This release's advisory decision was written in `0.40.9`'s cut and still applies unchanged
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version number
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line. **Both notes' truth was checked rather than assumed**: the medical-photos note becomes true for a user only when `0279` is applied, which happens **before** either deploy (section 8), so neither note promises something with a manual step still open
- [x] Commit messages say why, not just what — the cut commit records the email answer, Lutan's two in-chat sign-offs, and the double-digit ordering boundary
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the skipped `npm ci` was justified by an empty lockfile diff rather than by "nothing much changed"; the ordering boundary was read off the rendered page as well as asserted; and the advisory was confirmed to be the **same single** one as last release rather than assumed unchanged

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at the cut commit, parent `7a7b2ce3`; the deployed SHA will be this PR's merge commit, recorded in the release record with a code-identity diff
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff, read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session. **Test is level with production as of `0.40.9`**, so it is a valid pre-production check again
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-28`
- [x] **For a boundary or banding change, the assertions cover both edges** — **this cut has a real one**: `0.40.10` is the first double-digit patch, and both edges were covered — the data assertion (`0.40.9 -> 0.40.10`, `compareVersions` order) and the rendered page's own ordering
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks are the unedited stdout of `gates.mjs` and `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. Vacuous while the public site has not moved hosts

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'`. **Hand the command over WITH a `tee`** — `0.40.8` lost this line by not doing so
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. **14 on both environments last release**
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. The release's `0279` and its readers came in the **same** PR (#1042), so unlike last release the per-PR gate did fire on it
- [x] **`0279` widens rather than narrows, which is the safe direction in the deploy window.** It grants the Add medical photos card a **read** of medical photos, reversing part of `0276` on Lutan's word. So between the apply and the deploy, the live `0.40.9` code sees a grant it does not yet use — nothing is taken away mid-window. The narrowing half of this release's story shipped in `0.40.9`
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **done, not deferred**: `0279 … ok`, exit **0**
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `0279` is additive (one grant), so this is not the destructive case. The before-picture of `role-cells` and `role-cards` will still be taken, because it costs ninety seconds and has closed a carried item in each of the last two releases
- [x] Apply plan stated — **`0279` alone, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `0911a1e0`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts `0279`**, but `0279` is additive and the previous release's code ignores the extra grant, so a code-only rollback is **safe this release** — which is unusual and is stated because it was false for the last two

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with `GHSA-5j98-mcp5-4vw2` (`glob` CLI) | **Accepted, unchanged from `0.40.9`** and already covered by `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. Not reachable, and its offered fix would reinstall the adapter that caused the cron outage. **Nothing new appeared, and the four retired advisories have not returned** |
| 2 | none | **Both of this release's `pending:` plans were closed by Lutan in chat before the cut** | **Closed, not carried** — a first. He read and approved the medical-photos note's wording, and confirmed the "transient context" carve-out in `#1044`'s new `CLAUDE.md` rule, which its author had flagged as their inference rather than his words. **Recorded in the release record rather than by editing the two merged plans**, since the record is where the runbook says a `pending:` decision is written down. **This release has zero items awaiting a person** — the trend was 5, 5, 13, 7, 13, 15 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **After the deploy, open Upcoming visits as a login that cannot edit a visit** and confirm Edit is absent rather than present-and-refusing; then as one that can, and confirm it works | Lutan |
| 2 | **Open a resident's Medical folder as a login holding View residents but none of View medical / Manage medical / Book clinic visits / Run fundraising appeals** — the Medical folder's photos must not be shown, while the other folders still are. **Then try a medical photo's direct web address**, which must also refuse, since the check is in the database | Lutan |
| 3 | **As a login holding Add medical photos**, confirm you can still file a photo into the Medical folder **and now also view it** — `0279` restores that read | Lutan |
| 4 | **Carried from `0.40.7`: give the Translations card to Management.** `0271` deliberately gave it to no role, and it is the one carried item left | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked — the four rows above are for Lutan and only the person who looked may tick this. Three of them can only be done on production after the deploy

Manual verification by: pending: the four rows in Left for manual verification. **Note that this release's own two outstanding items were closed by Lutan in chat before the cut** and are recorded in the release record; these four are the post-deploy checks, not those

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
