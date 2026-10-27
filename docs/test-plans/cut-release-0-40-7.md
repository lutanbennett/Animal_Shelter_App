# Feature test plan — cut release `0.40.7`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.7` — move the six `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-7` @ `C:\Development\Animal_Shelter_cut-release-0-40-7` — **a fresh worktree, and the reason is recorded rather than assumed.** Paperwork rule 2 says to reuse a free leftover first; `node scripts/worktree.mjs list` showed six leftovers and **every one of them reads `HELD`** by a named Claude session, so there was none free to reuse |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #997 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-27 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries **four**, `0270`–`0273`, which belong to #978, #984, #988/#991 and #994's plans and are not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `f50e02ae` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — six `ReleaseNote`s move from `unreleased` into a new `0.40.7` entry dated 2026-10-27 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration. `git diff --stat` reads exactly two files, 15 insertions and 7 deletions
- [x] Roles affected identified — one of the six notes is tagged by **card** (`who_does_what`); the other five are plain strings shown to everyone. No note uses the older `roles:` form, which matters because a role tag read by name is the fault `CLAUDE.md`'s widen-never-narrow rule forbids. Admin sees every line regardless, being outside the card system. **Nobody's access changes in this PR** — the access changes this release describes are made by `0270`–`0273` and by the app code already on `main`
- [x] Anything explicitly **out of scope** written down — the four migrations are out of scope here and are the release manager's apply step. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2. The thirteen test plans awaiting a person belong to their own plans and their own signatures and are **not** copied into this plan's manual table

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `f50e02ae` minutes before the cut, so there was nothing to merge in. Confirmed rather than assumed: `git log --oneline -1 origin/main` reads `f50e02ae`, which is this branch's parent
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: typecheck exited 0 after 47s
=== gates: lint exited 0 after 101s
=== gates: test exited 0 after 17s
=== gates: build exited 0 after 146s
gates: typecheck=0 lint=0 test=0 build=0
```

  The exit status was read from the command itself (`GATES_EXIT: 0`), not through a pipe —
  the trap this runbook names three times.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit **0**, all 16 assertions ok, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`. **The exit code was read from the command, not through the `tail` it was piped to**
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of `node scripts/cut-release.mjs 0.40.7 2026-10-27 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.7]
ok   new entry has the requested date  [2026-10-27]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.6 -> 0.40.7]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [6 vs 6]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.7]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions, not only as an absence.** `majorReleasesSince("0.40.6")` is empty, *and* in the same run an older major release is still found from further back (`0.40.0`). An always-empty function would satisfy the absence alone, which is why the presence case is what makes it mean something
- [x] **The cut used `scripts/cut-release.mjs`, not a script written for this release** — third release on the committed script, and it again reported the line ending it detected (`cut 0.40.6 -> 0.40.7 (minor, CRLF)`)
- [x] **`npm ci` was run in the main checkout before the cut, and the `0.28.0` tell was read as two numbers** rather than trusted because the command exited 0: `package.json` declares `next@16.4.2`, the installed tree reads `16.4.2`, and this cut's own build banner printed `▲ Next.js 16.4.2 (Turbopack)`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0270`–`0273` are already on `main`, and the next free number after this release is `0274`, checked against `origin/main` **and** `gh pr list`, which is **empty** — no open PR at all, so no in-flight branch can be holding a number
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own `--status` was read and is in section 8: production is `270 applied, 4 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's is section 8's, and all four files came back `ok`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration. All four were applied to dev by their own PRs before merging
- [ ] File is re-runnable — n/a: this PR carries no migration. Each of the four states re-runnability in its own header and that is its own plan's to sign
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is the comparison in section 2, which reads every note out of `origin/main` as a module rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and shows `0.40.7 · Buttons follow your cards, website previews and a tidier Security page — 27 Oct 2026` at the top with all six notes rendered as prose
- [x] Data persists — reload the page and the change is still there — the page was re-read after navigation and after a viewport change; the entry renders identically. The data is compiled into the build, so there is nothing to persist beyond that
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface; it is two edited data files
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is what this cut produces; the page shows no unreleased block and runs from `0.40.7` down with no gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing to deploy while `unreleased` has lines or `package.json` disagrees with the newest entry, and `check-release-guards.mjs` exercises both refusals (section 2)
- [x] Boundary cases checked — the version boundary is the one that matters and both sides were asserted. Read off the rendered page rather than the source: the first six version strings in document order are `0.40.7, 0.40.6, 0.40.5, 0.40.4, 0.40.3, 0.40.2`, and the mail function answers empty for `0.40.6` while still finding `0.40.0` from further back

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.7` and all six notes — Admin is outside the card system and sees every line | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.7`, the five plain notes, and the Delete-role note if it holds `who_does_what` (it does, on production) | not driven — reason below |
| second_in_command | the releases page | sees `0.40.7` and the five plain notes; the Delete-role note is greyed under Show everything, as it does not hold `who_does_what` | not driven — reason below |
| doctor | the releases page | sees `0.40.7` and the five plain notes | not driven — reason below |
| volunteer | the releases page | sees `0.40.7` and the five plain notes | not driven — reason below |
| signed out | the releases page | redirected to `/login` | **as expected** — observed: the first request to `/login` answered 200 as the sign-in page before any session cookie was set |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — the widen-never-narrow rule | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether the one card-tagged note is shown to it. That tagging is data, asserted character-identical in section 2, and the code that reads it (`src/lib/release-audience.ts`) is untouched by this PR and carries its own unit tests — which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by five sign-ins**, which is the stronger check: a sign-in shows one role's result, the test asserts the rule for an unrecognised tag
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action, so there is nothing new to refuse

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR, and the cut adds no page. The existing `Release notes` entry was present and highlighted in the running build's sidebar
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the six notes are English prose authored by their own PRs, not UI strings; release notes are not translated
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured rather than eyeballed: at 375×812 `document.documentElement.scrollWidth` is **375** against a `clientWidth` of **375**, and the top entry still reads `0.40.7 · Buttons follow your cards, website previews and a tidier Secu…`
- [x] Browser console clean — no errors or React warnings — read on the releases page: only `[HMR] connected`, `[Fast Refresh]` and the React DevTools notice, all of which are `next dev` noise. **No warnings and no errors**
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not separately inspected beyond the requests the reader surfaced, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded on this cut rather than reasoned about. `0.40.7` heads the list; `0.40.6` down to `0.40.2` follow in order with their own notes and dates intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `/api/version` was fetched from the running build and answers `{"version":"0.40.7","sha":"f50e02ae…"}`, so the second reader agrees with the cut. **The third reader could not be checked here and is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time instead, which is the runbook's two-endpoint check
- [x] **An independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.7` carries no **Major** badge, while **forty** Major badges render elsewhere on the same screen. A badge that had simply stopped rendering could not pass as a negative here, because forty of them rendered beside it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (section 2)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item, and follow-ups found during a release go on the `backlog` branch rather than into this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The judgements in this release were recorded in their own PRs, among them `docs/decisions/2026-10-27-staff-role-deleted.md` and `docs/decisions/2026-10-27-role-archiving-removed.md`
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number, so the bump cannot stale it
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; the checker holds this line to the diff and a tick here would be a claim the diff contradicts. **The six notes' truth was checked rather than assumed.** None of them promises something with a manual step still open (`docs/decisions/2026-10-11-release-note-truth-rule.md`): five describe app behaviour already merged, and the sixth, the Delete-role button, needs `0272` — which is applied **before** either deploy, as asserted in section 8. **The translations card is deliberately absent from the notes**, because `0271` gives it to no role and a note would promise a screen nobody can yet reach
- [x] Commit messages say why, not just what — the cut commit records the email question and Lutan's answer, the two other decisions taken in the same round, why `package.json` was bumped, and why a fresh worktree was made rather than a leftover reused
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Three in this cut that could each have been asserted instead: the six `HELD` leftovers were read from `worktree.mjs list` before concluding no worktree could be reused; the four advisory IDs were matched **by ID** against the decision file rather than by recognising the package names; and `staff`'s archived state was read out of `0270`'s own production reading rather than inferred from the check output, which still lists it as though it were live

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at the cut commit, parent `f50e02ae`; the deployed SHA will be this PR's merge commit and is recorded in the release record, with a code-identity diff against it
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff (`docs/release-procedure.md`, "Check the code is identical, not that the SHAs match"), read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-27` written into the entry
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves — where `0.40.7` sorts — is asserted in both directions in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks in section 2 are the unedited stdout of `gates.mjs` and of `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. **It is vacuous while `PUBLIC_SITE` is `locked`** and will be proved from the deploy output rather than recalled

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'` because PowerShell's `tee` writes the log as UTF-16
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. Held at 14 names on both environments for nine releases
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var, and the diff contains no `process.env`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and the ordering was measured rather than taken from the headers.** The dry-run printed consumer warnings for `0271`, `0272` and `0273` naming nine files — among them `src/lib/permissions/cards.ts`, `src/lib/permissions/approvers.ts`, `src/lib/auth/held-roles.ts`, three `admin/security` files, `admin/who-does-what/page.tsx` and two scripts — and **every one of them is changed in this release's range**. So applying before the deploy is **mandatory rather than tidy**, and the warnings are the expected shape rather than a surprise
- [x] **Both halves of the window were read rather than reasoned about.** `0272` rewrites `has_permission`, `is_admin`, `holds_app_role`, `my_permissions`, `reassign_recurring_job`, `role_can`, `roles_guard_fixed` and `set_role_cards` to drop a `r.archived_at is null` filter, and drops the `user_roles_take_live_role` trigger. Its own header states why the window is safe in both directions: after `0270` no role is archived, so each dropped filter was already true for every row and the old code asks the new functions the same question it asked the old ones. **The one-way door is `0270`**, which deletes the archived `staff` row outright — read from production before the apply rather than inferred: `role-cards` shows `staff` holding 13 cards, of which **`medical_records` and `assistant` are held by no other role**. Neither is a live loss, because `staff` is archived and no live login can hold it, but it means **Manage medical and Assistant will be held by no role at all** once `0270` runs. Send to hospital was already in that state after `0269` and remains item 1 of what is left for Lutan
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **done, not deferred, and it is in section 8 rather than section 3 because it is the release's rather than this PR's:** all four files `ok`, exit **0**. The interdependent-pending-files caveat (a file needing an earlier pending file reports a false `FAILED`) **did not arise**, although `0272` genuinely depends on `0270` — worth recording, because a red there would have needed reading rather than obeying
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **live rather than skippable: `0270` deletes rows from `roles`, `user_roles` and four cascading tables, and `0272` replaces eight security-definer functions.** The before-picture was taken of the tables the change writes, from production, before the apply, as `0.40.2`'s lesson requires — `role-cells` **and** `role-cards`, both exit 0 and both kept for the record. The README restore recipe has still never been exercised, which is stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0270`, `0271`, `0272` and `0273`, in order, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply rather than after it

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `641f340c`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migrations, and three of the four are not additive:** `0270` deletes a role and its rows, `0272` drops a column and a trigger, and `0273` drops two policies and a function. So "rollback available" is true of the code and **false of the schema**. Rolling the code back alone would leave the old app reading `roles.archived_at`, which `0272` has removed — so a code-only rollback of this release is **not safe** and the honest position is forward-fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with `body-parser` and `undici`, four vulnerabilities, two high | **accepted** — the same two packages and the **same four advisory IDs** as `0.40.2` through `0.40.6` (`GHSA-27r3-jxmh-p828`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472`, `GHSA-xjj6-f33q-929c`), each confirmed present in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` **by grepping for the ID** rather than by recognising the package name. Nothing new since `0.40.2`. Nothing fixed, correctly |
| 2 | none | **Thirteen of the release's twenty test plans are signed `pending:` a person** — the highest of any release so far (trend 5, 5, 5, 13, 7, **13**) | **accepted as a stated gap on Lutan's explicit decision**, asked before the cut with the alternative of holding the release. Listed in the release record and **not ticked on anyone's behalf** |
| 3 | low | **Two of the six notes describe changes that HIDE buttons unless the login's cards allow them**, and a wrong card mapping would show as a button simply not appearing — no message, no error, and no automated check in this release would catch it | **accepted, and raised with Lutan separately from the count above rather than folded into it.** Offered the choice of deploying test first and looking before production; he chose to deploy both and look afterwards. The screens to open are rows 2 and 3 of the manual list |
| 4 | low | **`check-production.mjs role-cells` and `role-cards` still list the archived `staff` role as though it were live** | **deferred — already on the backlog.** #978 added a skip for archived roles, but these two checks still print it. It is the same reporting fault that led `0269` to reason about a role nobody can hold. It did not mislead this cut, because `0270`'s own header records the production reading that establishes `staff` is archived with 0 live logins |
| 5 | none | **No free worktree existed to reuse for the cut**, so paperwork rule 2's saving could not be taken | **accepted.** All six leftovers read `HELD` by a named session. Not a fault of this release; it is the `/clean-streams` round the last handover already says is owed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Give someone Manage medical in Settings → Who does what, then confirm Send to hospital appears for them.** Until this is done nobody can send a resident to hospital. Carried from `0.40.6` and still the one item with a live consequence | Lutan |
| 2 | **Open a resident's photos as a login that should NOT be able to change them** — Remove, Set as profile photo and Move to folder should be absent, not refusing. Then as one that should, and confirm they are present and work | Lutan |
| 3 | **Open a blood test and a procedure on a resident** as a login whose cards only let it read medical history — Attach files and Remove file should be absent. Then check Book a vet visit appears only for a login that can book one | Lutan |
| 4 | **Settings → Website → Pages → Preview**: type into a page without saving and confirm the preview shows the unsaved text, in English and in Thai, and that nothing is published until Save changes | Lutan |
| 5 | **Settings → Who does what → Delete this role** on a throwaway role, including the refusal when a login still holds it | Lutan |
| 6 | **Settings → Security**: one row per person, role chips, the ✕, Add role and Add person pop-ups, the search box, the … menu and the folded-away list of people who have left | Lutan |
| 7 | **The user manual** as a login that is not Admin — confirm the fourteen newly linked topics appear for the logins whose cards cover them, and that Security and 2-step verification show only to Admin | Lutan |
| 8 | **Give the new Translations card to Management** in Settings → Who does what, then look at the translations screen. `0271` deliberately gives it to no role | Lutan |
| 9 | The `0.40.7` notes as an admin sees them on the production releases page | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, and deliberately — the nine rows above are for Lutan and only the person who looked may tick this. Most of them can only be done on production after the deploy

Manual verification by: pending: the nine rows in Left for manual verification — above all row 1, giving Manage medical to someone so Send to hospital is held again

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
