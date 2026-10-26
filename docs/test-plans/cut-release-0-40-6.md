# Feature test plan — cut release `0.40.6`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.6` — move the seven `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-6` @ `C:\Development\Animal_Shelter_harness-sweep-batch-4` — **a reused free leftover, not a fresh worktree.** Paperwork rule 2 says to reuse one before making a new one, and the saving was confirmed rather than assumed: `git diff --name-only HEAD..origin/main -- package.json package-lock.json` was **empty**, so its `node_modules` still matches the lockfile and the four-minute `npm ci` was genuinely unnecessary |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | #974 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-26 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries **four**, `0266`–`0269`, which belong to #966, #967, #970 and #972's plans and are not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `cbc3377f` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — seven `ReleaseNote`s move from `unreleased` into a new `0.40.6` entry dated 2026-10-26 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration. `git diff --stat` reads exactly two files
- [x] Roles affected identified — six of the seven notes are tagged by **card**, the shape #956 introduced last release; one is a plain string for everyone. No note uses the older `roles:` form. Admin sees every line regardless, being outside the card system. **Nobody's access changes in this PR** — the access changes this release describes are made by `0266`–`0269`, which are already on `main` and are the release manager's apply step
- [x] Anything explicitly **out of scope** written down — the four migrations' narrowing of what cards may read is out of scope here and is recorded in `docs/releases/`. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2. The seven test plans awaiting a person belong to their own plans and their own signatures and are **not** copied into this plan's manual table

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was created directly from `origin/main` at `cbc3377f` minutes before the cut, so there was nothing to merge in. Confirmed rather than assumed: `git status -sb` read `claude/cut-release-0-40-6...origin/main` with no ahead/behind
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: typecheck exited 0 after 94s
=== gates: lint exited 0 after 126s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
GATES_EXIT=0
```

  Read from the script's own `GATES_EXIT=0`, not from the background wrapper that printed it —
  the trap this runbook names three times and which `0.40.5` met three times in one afternoon.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit 0, all 16 assertions ok, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`. **The exit code was read from the command, not through the `tail` it was piped to** (`${PIPESTATUS[0]}`)
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of `node scripts/cut-release.mjs 0.40.6 2026-10-26 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.6]
ok   new entry has the requested date  [2026-10-26]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.5 -> 0.40.6]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [7 vs 7]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.6]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions, not only as an absence.** `majorReleasesSince("0.40.5")` is empty, *and* in the same run an older major release is still found from further back (`0.40.0`). An always-empty function would satisfy the absence alone, which is why the presence case is what makes it mean something
- [x] **The cut used `scripts/cut-release.mjs`, not a script written for this release** — second release on the committed script, and it again reported the line ending it detected (`cut 0.40.5 -> 0.40.6 (minor, CRLF)`)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0266`–`0269` are already on `main`, and the next free number after this release is `0270`, checked against `origin/main` **and** `gh pr list`, which is empty
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own `--status` was read and is in section 8: production is `266 applied, 4 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's is section 8's, and all four files came back `ok`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration. All four were applied to dev by their own PRs before merging
- [ ] File is re-runnable — n/a: this PR carries no migration. Each of the four states re-runnability in its own header and that is its own plan's to sign
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is the comparison in section 2, which reads every note out of `origin/main` as a module rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and shows `0.40.6 · Photos save and approve, and a card shows only what it can do — 26 Oct 2026` at the top with all seven notes rendered as prose
- [x] Data persists — reload the page and the change is still there — the page was re-read after navigation and after a viewport change; the entry renders identically. The data is compiled into the build, so there is nothing to persist beyond that. **Read from a screenshot rather than from `innerText`**, which returned only the header — the stale-execution-context trap `0.40.5`'s plan recorded, met again here and handled the same way rather than quietly retried
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface; it is two edited data files
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is what this cut produces; the page shows no unreleased block and runs from `0.40.6` down with no gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing to deploy while `unreleased` has lines or `package.json` disagrees with the newest entry, and `check-release-guards.mjs` exercises both refusals (section 2)
- [x] Boundary cases checked — the version boundary is the one that matters and both sides were asserted: the rendered page lists `0.40.6` above `0.40.5`, `0.40.3`, `0.40.2`, `0.40.1`, `0.40.0` in `compareVersions` order, and the mail function answers empty for `0.40.5` while still finding `0.40.0` from further back

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.6` and all seven notes — Admin is outside the card system and sees every line | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.6`; the card-tagged notes where it holds one of the cards; the one plain note | not driven — reason below |
| second_in_command | the releases page | sees `0.40.6`; the plain note; card-tagged notes per its cards | not driven — reason below |
| doctor | the releases page | sees `0.40.6` and the plain note; it holds one card on production, so most tagged notes are greyed under Show everything rather than absent | not driven — reason below |
| volunteer | the releases page | sees `0.40.6` and the plain note | not driven — reason below |
| signed out | the releases page | redirected to `/login` | **as expected** — observed: the first request answered `/login?next=%2Freleases` before the session cookie was set |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — the widen-never-narrow rule | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether a tagged note is shown to it. That tagging is data, asserted character-identical in section 2, and the code that reads it (`src/lib/release-audience.ts`) is untouched by this PR and carries its own unit tests — which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by six sign-ins**, which is the stronger check: a sign-in shows one role's result, the test asserts the rule for an unrecognised tag
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action, so there is nothing new to refuse. The one access check it exercised incidentally is the page's own sign-in gate, which sent an anonymous request to `/login`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR, and the cut adds no page. The existing `Release notes` entry was present and highlighted in the running build's sidebar
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the seven notes are English prose authored by their own PRs, not UI strings; release notes are not translated. **One note's Thai wording is a real open item**, but it belongs to #972's plan and its signature, not to this one
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured rather than eyeballed: at 375×812 `document.documentElement.scrollWidth` is **375** against a `clientWidth` of **375**, and the top entry still reads `0.40.6 · Photos save and approve, and a card shows only what it can do`
- [x] Browser console clean — no errors or React warnings — read on the releases page: only `[HMR] connected`, `[Fast Refresh]` and the React DevTools notice, all of which are `next dev` noise. **No warnings and no errors**
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not separately inspected beyond the requests the reader surfaced, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded on this cut rather than reasoned about. `0.40.6` heads the list; `0.40.5` down to `0.39.3` follow in order with their own notes and dates intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `/api/version` was fetched from the running build and answers `{"version":"0.40.6","sha":"cbc3377f…"}`, so the second reader agrees with the cut. **The third reader could not be checked here and is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time instead, which is the runbook's two-endpoint check
- [x] **An independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.6` carries no **Major** badge, while **nineteen** older entries do — among them the control two rows down, `0.40.0 · Units you keep yourself, and two pages that were slow · 24 Oct 2026 · Major`. A badge that had simply stopped rendering could not pass as a negative here, because nineteen of them rendered on the same screen
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (section 2)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item, and follow-ups found during a release go on the `backlog` branch rather than into this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The judgements in this release were recorded in their own PRs, among them `docs/decisions/2026-10-26-card-review-2-schema.md` and `docs/decisions/2026-10-26-card-review-2-app-half-22-29.md`
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number, so the bump cannot stale it
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; the checker holds this line to the diff and a tick here would be a claim the diff contradicts. **The seven notes' truth was checked rather than assumed**, which on this release is not a formality: six of the seven describe what a card may do, and they become true for a user only when `0266`–`0269` are applied. That happens **before** either deploy, so no note promises something with a manual step still open (`docs/decisions/2026-10-11-release-note-truth-rule.md`). The ordering is asserted in section 8, not hoped for
- [x] Commit messages say why, not just what — the cut commit records the mail question and the answer, the second decision taken in the same round, why `package.json` was bumped, and why a leftover worktree was reused
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Three in this cut that could each have been asserted instead: the reused worktree's `node_modules` was proved current by diffing the lockfile rather than assumed from a recent date; the four advisory IDs were matched **by ID** against the decision file rather than by recognising the package names; and the `npm ci` tell was read as two numbers — `package.json` declares `next@16.4.2`, the installed tree reads `16.4.2` — rather than trusted because the command exited 0

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at the cut commit, parent `cbc3377f`; the deployed SHA will be this PR's merge commit and is recorded in the release record, with a code-identity diff against it
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff (`docs/release-procedure.md`, "Check the code is identical, not that the SHAs match"), read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-26` written into the entry
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves — where `0.40.6` sorts — is asserted in both directions in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks in section 2 are the unedited stdout of `gates.mjs` and of `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. **It is vacuous while `PUBLIC_SITE` is `locked`** and will be proved from the deploy output rather than recalled

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'` because PowerShell's `tee` writes the log as UTF-16
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. Held at 14 names on both environments for eight releases
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var, and the diff contains no `process.env`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and the ordering was measured rather than taken from the headers.** The dry-run printed consumer warnings for `0267`, `0268` and `0269` naming ten files — among them `src/lib/permissions/cards.ts`, `catalogue.ts`, `routes.ts`, `who-does-what.ts`, `jobs.ts`, `src/lib/placements/available.ts` and three pages — and **every one of them is changed in this release's range**. So applying before the deploy is **mandatory rather than tidy**, and the warnings are the expected shape rather than a surprise
- [x] **Both halves of the window were read rather than reasoned about, and the one-way door was found in the file itself.** `0268` splits two cards in two and states that each holder's cell union is unchanged or larger, so no role loses by the split. `0269`'s door is the real one: `placement.hospital` leaves Residents and joins Manage medical, **which no live role holds** — read from production with `check-production.mjs role-cards` before anything was applied, not inferred from the migration header, which names `staff` (an archived role, so nobody). **Send to hospital will be held by no one** until Manage medical is given to someone in Settings → Who does what. Lutan decided to let them lose it; the note says so in the words a user reads, and this was put to him again before the cut rather than carried silently
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **done, not deferred, and it is in section 8 rather than section 3 because it is the release's rather than this PR's:** all four files `ok`, exit **0**. The interdependent-pending-files caveat (a file needing an earlier pending file reports a false `FAILED`) **did not arise** — worth recording, because a red there would have needed reading rather than obeying
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **live rather than skippable: `0268` and `0269` rewrite `role_permissions` rows.** The before-picture was taken of the tables the change writes, from production, before the apply, as `0.40.2`'s lesson requires — `role-cells` **and** `role-cards`, both exit 0 and both kept for the record. The README restore recipe has still never been exercised, which is stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0266`, `0267`, `0268` and `0269`, in order, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply rather than after it

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `aa984fa1`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migrations, and two of the four are not additive:** `0268` and `0269` move grants between cards and `0266` drops two functions. So "rollback available" is true of the code and **false of the schema**. Rolling the code back alone would leave the old app asking for grants that have moved. The honest position is forward-fix, and **Settings → Who does what is the forward fix** for anything these four turn out to have narrowed too far — including Send to hospital, which is a card assignment rather than a code change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with `body-parser` and `undici`, four vulnerabilities, two high | **accepted** — the same two packages and the **same four advisory IDs** as `0.40.2` through `0.40.5` (`GHSA-27r3-jxmh-p828`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472`, `GHSA-xjj6-f33q-929c`), each confirmed present in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` **by grepping for the ID** rather than by recognising the package name. Nothing fixed, correctly |
| 2 | none | **Seven of the release's eleven test plans are signed `pending:` a person** | **accepted as a stated gap on Lutan's explicit decision**, asked before the cut with the alternative of holding the release — the same call he made for `0.40.5` (thirteen), `0.40.4`, `0.40.3`, `0.40.2` and `0.40.1`. Listed in the release record and **not ticked on anyone's behalf** |
| 3 | low | **`Send to hospital` will be held by no live role once `0269` is applied** | **accepted, and it is his decision rather than a defect of this release** — `0269`'s header reasoned from `staff`, an archived role that nobody can hold, so "Manage medical by staff only" means nobody. Read from production rather than from the header. The outcome is what he asked for, the release note states it in a user's words, and the fix is a card assignment in Settings → Who does what. The underlying reporting fault — archived roles listed as live by `readonly-checks.mjs` — is already a backlog item filed tonight |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Give someone Manage medical in Settings → Who does what, then confirm Send to hospital appears for them.** Until this is done nobody can send a resident to hospital. This is the one item with a live consequence | Lutan |
| 2 | **Upload a photo through Add Shelter Photos after the deploy.** It used to answer "Not authorized"; `0269` fixes it. Then Approve and Wrong animal on a photo waiting under an animal, which also used to refuse | Lutan |
| 3 | **Read the new warning wording on Photos to approve, in English and Thai** — approving a photo of an animal already shown on the website now asks you to check first | Lutan |
| 4 | **Open a one-card login in a browser** — hidden buttons and menu entries, Enclosures without the resident figures, and the Add medical photos wording | Lutan |
| 5 | **Confirm a login holding only Record weight or Feed special diets now sees its jobs in My tasks**, and that a Medical-folder photo does not become the resident's profile picture | Lutan |
| 6 | The `0.40.6` notes as an admin sees them on the production releases page | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, and deliberately — the six rows above are for Lutan and only the person who looked may tick this. Five of them can only be done on production after the deploy

Manual verification by: pending: the six rows in Left for manual verification — above all row 1, giving Manage medical to someone so Send to hospital is held again

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
