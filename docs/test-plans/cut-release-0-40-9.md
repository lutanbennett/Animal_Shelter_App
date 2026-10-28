# Feature test plan — cut release `0.40.9`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.9` — move the seven `unreleased` notes into a new entry, empty `unreleased`, bump `package.json`; plus a decision file for a new advisory |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-9` @ `C:\Development\Animal_Shelter_cut-release-0-40-9` — **a fresh worktree.** Paperwork rule 2 prefers a free leftover, but `#1005` changed `package-lock.json` since every leftover was made, so each would have needed the same `npm ci` anyway and a stale `node_modules` would have built the **old adapter** |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | #1036 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts`, `package.json` and one decision file. The release it cuts carries **three**, `0276`–`0278`, which belong to #1018, #1025 and #1029's plans and are not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `9de0748d` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — seven `ReleaseNote`s move from `unreleased` into a new `0.40.9` entry dated 2026-10-28 with `major: false`, `package.json` follows, and `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md` records why a new high-severity advisory ships unfixed
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json` (one line), and one new file under `docs/decisions/`. No route, no component, no `worker/`, no migration
- [x] Roles affected identified — six of the seven notes are tagged by **card**; one is a plain string for everyone. No note uses the older `roles:` form, which matters because a role read **by name** is the fault `CLAUDE.md`'s widen-never-narrow rule forbids. Admin sees every line regardless, being outside the card system. **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down — the three migrations and the access they change are out of scope here and are the release manager's apply step. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2. The fifteen plans awaiting a person belong to their own plans and their own signatures and are **not** copied into this plan's manual table

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `9de0748d` minutes before the cut, so there was nothing to merge in, and `git status -sb` read no ahead/behind
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: typecheck exited 0 after 40s
=== gates: lint exited 0 after 183s
=== gates: test exited 0 after 18s
=== gates: build exited 0 after 159s
gates: typecheck=0 lint=0 test=0 build=0
```

  The status was read from the command itself (`GATES_EXIT: 0`), not through a pipe.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **16** `ok` lines, exit code read from the command rather than through a pipe
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of `node scripts/cut-release.mjs 0.40.9 2026-10-28 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.9]
ok   new entry has the requested date  [2026-10-28]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.8 -> 0.40.9]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [7 vs 7]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.9]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions, not only as an absence** — `majorReleasesSince("0.40.8")` is empty **and**, in the same run, `0.40.0` is still found from further back
- [x] **The cut used `scripts/cut-release.mjs`**, which again reported the line ending it detected (`cut 0.40.8 -> 0.40.9 (minor, CRLF)`)
- [x] **`npm ci` in the main checkout before anything else, and the installed tree read as numbers** rather than trusted: `package.json` declares `next@16.4.2`, the installed tree reads `16.4.2`, this cut's build banner printed `▲ Next.js 16.4.2 (Turbopack)`, and — the one that matters this cycle — `@opennextjs/cloudflare` reads **1.20.13**, the version that fixed the cron. A stale tree here would have rebuilt the broken adapter

### The advisory, which is a real finding this release and not a formality

- [x] **`npm run audit:prod` exits 1 with ONE new high-severity advisory**, `GHSA-5j98-mcp5-4vw2` — `glob` CLI command injection via `-c/--cmd`. **It ships unfixed, with a decision file** (`docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`), because:
  - **It is not reachable.** The flaw is in `glob`'s **binary** (`"bin": "./dist/cjs/src/bin.js"`), not its library API. `grep -rn 'glob -c\|glob --cmd\|node-minify' package.json scripts/ worker/` returns **nothing**, and `grep -c 'node-minify' .open-next/worker.js` returns **0**. It arrives four levels down a build-time chain: `@opennextjs/cloudflare` → `@opennextjs/aws` → `@node-minify/core` → `glob@10.3.3`
  - **The offered fix is worse than the finding.** `npm audit fix --force` says `Will install @opennextjs/cloudflare@1.20.9` — **below the 1.20.13 that fixed the four-day cron outage hours earlier** (`244a1731`, #1005). It would trade an unreachable CLI flaw for a repeat of a real outage. This is the second time that command has offered to drag the Cloudflare chain backwards
- [x] **The four advisories carried since 2026-10-24 are GONE**, resolved by the same adapter bump. Confirmed **by grepping for each ID** (`GHSA-27r3-jxmh-p828`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472`, `GHSA-xjj6-f33q-929c`) against this release's audit output rather than by noticing the package names had changed

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0276`–`0278` are already on `main`, the next free number after this release is `0279`, and `gh pr list` was **empty** at the cut, so no in-flight branch holds one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own `--status` was read and is in section 8: production is `276 applied, 3 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's is section 8's, and all three files came back `ok`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration. All three were applied to dev by their own PRs before merging
- [ ] File is re-runnable — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is section 2's comparison, which reads every note out of `origin/main` as a module rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and shows `0.40.9 · Buttons match your cards, roles can be given again, and filters stick — 28 Oct 2026` at the top with all seven notes rendered as prose
- [x] Data persists — reload the page and the change is still there — re-read after navigation and after a viewport change; the entry renders identically. **Read from a screenshot after `innerText` came back empty**, which is the stale-execution-context trap earlier plans recorded: the first read returned `clientWidth: 0`. Met again, handled the same way, and re-read successfully afterwards rather than quietly retried
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is what this cut produces; the page shows no unreleased block and runs from `0.40.9` down with no gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing while `unreleased` has lines or `package.json` disagrees, and `check-release-guards.mjs` exercises both refusals
- [x] Boundary cases checked — read off the rendered page rather than the source: the first five version strings in document order are `0.40.9, 0.40.8, 0.40.7, 0.40.6, 0.40.5`, and the mail function answers empty for `0.40.8` while still finding `0.40.0` from further back

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.9` and all seven notes — Admin is outside the card system | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.9`, the plain note, and the card-tagged notes it holds cards for | not driven — reason below |
| second_in_command | the releases page | sees `0.40.9` and the plain note; others greyed under Show everything | not driven — reason below |
| head_of_medical | the releases page | sees `0.40.9`, the plain note, and the medical-photo note it holds a card for | not driven — reason below |
| volunteer | the releases page | sees `0.40.9` and the plain note | not driven — reason below |
| signed out | the releases page | redirected to `/login` | **as expected** — the first request to `/login` answered 200 as the sign-in page before any session cookie was set |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — widen-never-narrow | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether a tagged note is shown. That tagging is data, asserted character-identical in section 2, and `src/lib/release-audience.ts` is untouched and carries unit tests which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by five sign-ins**, which is the stronger check
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, and the cut adds no page. The existing `Release notes` entry was present and highlighted in the running build's sidebar
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the seven notes are English prose authored by their own PRs, not UI strings
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured rather than eyeballed: at 375×812 `scrollWidth` is **375** against a `clientWidth` of **375**
- [x] Browser console clean — no errors or React warnings — `read_console_messages` with `onlyErrors` returned **No console logs**
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not separately inspected beyond the requests the reader surfaced, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded on this cut rather than reasoned about. `0.40.9` heads the list; `0.40.8` down to `0.40.5` follow in order with their own notes and dates intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `/api/version` on the running build answers `0.40.9`, so the second reader agrees with the cut. **The third reader is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time
- [x] **An independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.9` carries no **Major** badge while **forty** render elsewhere on the same screen. A badge that had simply stopped rendering could not pass as a negative here
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item, and follow-ups go on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **yes, and it is the substantive part of this PR**: `2026-10-28-glob-cli-advisory-not-reachable.md` records why a new high-severity advisory ships unfixed and, more importantly, **why its offered fix must not be taken**, since `audit fix --force` would reinstall an adapter older than the one that fixed the cron
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; a tick here would be a claim the diff contradicts. **The seven notes' truth was checked rather than assumed**, which matters this release: six describe what a card may do and become true for a user only when `0276`–`0278` are applied, which happens **before** either deploy (asserted in section 8), so no note promises something with a manual step still open
- [x] Commit messages say why, not just what — the cut commit records the email question and the answer, the other two decisions taken in the same round, and why the advisory ships unfixed
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Three that could each have been asserted: the advisory's unreachability was established by grepping the repo **and** the built `worker.js` rather than from "it is a build dependency"; the four retired advisories were confirmed gone **by ID**; and the adapter version was read out of `node_modules` rather than inferred from the lockfile

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at the cut commit, parent `9de0748d`; the deployed SHA will be this PR's merge commit, recorded in the release record with a code-identity diff against it
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff (`docs/release-procedure.md`, "Check the code is identical, not that the SHAs match"), read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session. **Test is a release behind on the old adapter and this release brings it up**, which is Lutan's decision of 2026-10-28 (`docs/release-handover.md`)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-28` written into the entry
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves is asserted in both directions in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks in section 2 are the unedited stdout of `gates.mjs` and `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. It is vacuous while the public site has not moved hosts, and will be proved from the deploy output rather than recalled

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'` because PowerShell's `tee` writes the log as UTF-16. **`0.40.8` lost this line entirely** by deploying without a `tee`; this release hands the command over **with** one
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. **It has no reading for `0.40.8`**, breaking a ten-release run at 14, so this release re-establishes the number rather than continuing a streak
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and this release is the case where the per-PR gate CANNOT catch it**, which is worth stating precisely rather than as a generic "apply first". `0278` came in #1029 (schema half) and the code reading it in #1032 (app half), so **neither PR's own gate fires**, and `main` currently carries code that depends on a migration production does not have. The protection is the release step — `docs/release-procedure.md` §5 puts migrations before **any** deploy unconditionally — not the per-PR gate
- [x] **The failure that would follow a slipped order was read in the files, not imagined.** `supabase/migrations/0278_medical_folder_filing_activity.sql` is the only file creating `photos.medical_add`; `src/app/medical/photos/page.tsx:25` calls `requirePermission("photos.medical_add")`; `src/lib/permissions/can.ts:69` short-circuits on `perms.isAdmin` and otherwise returns false for an absent cell. **So deploying before `0278` would refuse `/medical/photos` to every non-Admin login** — including the Head of Medical who holds `add_medical_photos` — and hide the Medical folder in the uploader and in Move for everyone but Admin. Same shape as the 2026-10-27 outage where code selected a column no migration had created
- [x] **`0277` is the one-way door, and it is being treated as one.** It rewrites `has_permission()`, `is_admin()` and `my_permissions()` to read `roles.is_admin` instead of matching the key string `'admin'`. It was proven on dev including with the Admin role **renamed**, and the app reads `isAdmin` out of `my_permissions()` rather than the column, so the old SQL keeps working until the apply. **But Admin holds no cards on production**, so if it resolved wrongly the only administrator would lose Settings → Who does what — the screen needed to undo it. **Lutan was asked directly and chose to have Admin verified on production AFTER the apply and BEFORE the deploy**
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **done, not deferred:** all three files `ok`, exit **0**. The interdependent-pending-files caveat did not arise
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **live rather than skippable: `0277` replaces three security-definer functions** that decide every permission answer. The before-picture of the tables the change writes will be taken from production before the apply, as `0.40.2`'s lesson requires. The README restore recipe has still never been exercised, stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0276`, `0277` and `0278`, in order, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first, `git status -sb` confirmed neither ahead nor behind **before** the apply, and **an Admin check on production between the apply and the deploy**

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `429229cd`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migrations, and `0277` is not additive** — it replaces three functions. So "rollback available" is true of the code and **false of the schema**, and a code-only rollback would leave the old app asking questions of rewritten functions. The honest position is forward-fix, and **Settings → Who does what is the forward fix** for anything these three narrow too far

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **A NEW high-severity advisory**, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), four reports down one build-time path | **Accepted, with a decision file**, as `docs/release-procedure.md` requires for a high. **Not reachable**: the flaw is in `glob`'s binary, nothing in this repo invokes it, and it is absent from the built `worker.js`. **The offered fix is refused**: `audit fix --force` would install `@opennextjs/cloudflare@1.20.9`, older than the 1.20.13 that fixed the cron outage hours earlier |
| 2 | none | **The four advisories carried since 2026-10-24 are gone** | **Closed, not carried.** Resolved incidentally by the adapter bump; confirmed by grepping each ID. `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` now describes a state that no longer exists and is kept as history |
| 3 | none | **Fifteen of the release's twenty-nine test plans are signed `pending:` a person** — the highest of any release (trend 5, 5, 13, 7, 13, **15**) | **Accepted as a stated gap on Lutan's explicit decision**, asked before the cut with the alternative of holding the release. Listed in the release record and **not ticked on anyone's behalf** |
| 4 | low | **`release-prs.mjs` exited 1 again**, reporting 27 PRs where there are 29 | **Resolved by hand, third release running.** #1008 and #1009 were **squash-merged**, so neither left a `Merge pull request #N` commit to match; both confirmed MERGED via `gh pr view`. **Three consecutive releases is the signal that the script should handle squash merges rather than each release patching it by hand** — raised with the planner for a backlog item |
| 5 | none | **No free worktree could be reused**, against paperwork rule 2 | **Accepted, and for a better reason than last time:** `#1005` changed `package-lock.json`, so every leftover's `node_modules` predates the adapter fix. Reusing one without `npm ci` would have built the **old, broken adapter**; with `npm ci` it costs the same as a fresh worktree |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **After the deploy, open `/medical/photos` as a login holding Add medical photos** (not Admin) and confirm it loads — this is the page that would be refused if `0278` had not been applied first | Lutan |
| 2 | **Settings → Security: give someone a role, and Settings → Who does what: delete a throwaway role.** Both were broken before this release — the role list was empty, so there was nothing to give and Delete refused everything | Lutan |
| 3 | **Filter the Residents list, open a resident, press Back to residents** and confirm you return to the filtered list | Lutan |
| 4 | **Upload a resident photo as a login holding only the Residents card** and confirm **Medical is not offered** in the uploader or in Move; then as one holding Add medical photos and confirm it is | Lutan |
| 5 | **A maintenance job page and a clinic visit page** — confirm each only offers the buttons that login's cards allow | Lutan |
| 6 | **Upcoming visits: Show cancelled and Show completed**, and the Residents **Deceased** button | Lutan |
| 7 | **Carried from `0.40.7`: give someone Manage medical** so Send to hospital is held, and **give the Translations card** to Management | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, deliberately — the seven rows above are for Lutan and only the person who looked may tick this. Most can only be done on production after the deploy

Manual verification by: pending: the seven rows in Left for manual verification — above all row 1, which is the page that proves the migration ordering held

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
