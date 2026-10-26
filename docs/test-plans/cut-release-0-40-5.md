# Feature test plan — cut release `0.40.5`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.5` — move the eight `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-5` @ `C:\Development\Animal_Shelter_cut-release-0-40-5` (a fresh worktree; `/clean-streams` left no leftovers to reuse, so this cut paid the four-minute `npm ci` that `0.40.4`'s handover said to expect from now on) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #962 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-26 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries one, `0265_card_review_1_reads.sql`, which belongs to #960's plan and is not signed here |
| Tested at SHA | `9db37279`, whose parent is `42c3704c` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — eight `ReleaseNote`s move from `unreleased` into a new `0.40.5` entry dated 2026-10-26 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration
- [x] Roles affected identified — **this is the first cut whose notes are tagged by CARD rather than by role**, which is itself one of the notes (#956). Three notes carry `cards:` tags, one carries the older `roles:` form (#955's, written before that PR merged), and four are plain strings shown to everyone. Admin sees every line regardless, being outside the card system. Nobody's access changes *in this PR*
- [x] Anything explicitly **out of scope** written down — `0265`'s narrowing of what five cards may read is out of scope here: it is the release manager's step and is recorded in `docs/releases/`. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2. The thirteen test plans awaiting a person belong to their own plans and their own signatures and are **not** copied into this plan's own manual table

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `42c3704c` minutes before the cut by `worktree.mjs new`, which branches from `origin/main` directly, so there was nothing to merge in. Confirmed rather than assumed: `git log --oneline 42c3704c..origin/main` is empty
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
=== gates: build exited 0 after 143s

gates: typecheck=0 lint=0 test=0 build=0
```

  Read from the script's own `GATES_EXIT=0`, not from the wrapper that printed it: the
  background command this ran under also reported exit 0, and that status was `tail`'s. The
  same trap cost this release's PR list a false green (defect 1), so it was read twice here.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit 0, all 16 assertions ok, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of `node scripts/cut-release.mjs 0.40.5 2026-10-26 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.5]
ok   new entry has the requested date  [2026-10-26]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.4 -> 0.40.5]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [8 vs 8]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.5]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions, not only as an absence.** `majorReleasesSince("0.40.4")` is empty, *and* in the same run an older major release is still found from further back (`0.40.0`). The absence alone would also be produced by a broken comparison — which is the trap that reported a false red on `0.40.2`'s sound cut — so the presence case is what makes the absence mean something
- [x] **The cut used `scripts/cut-release.mjs`, not a script written for this release.** That script is the one-liner `0.40.3`, `0.40.4` and `0.40.5`'s predecessors each filed and nobody had yet built: the CRLF hazard in `releases.ts` was met and worked around three releases running by a throwaway script. It is now handled once — the script reports `cut 0.40.4 -> 0.40.5 (minor, CRLF)`, naming the line ending it detected — and **this release is the first evidence it works**, both for the cut and for the verify

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0265` is already on `main` (#960) and the next free number after this release is `0266`, checked against `origin/main` **and** `gh pr list`, which is empty
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's own `--status` was read and is in section 8: production is `265 applied, 1 pending`, that one being `0265`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration; the release's is section 8's
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration. `0265` was applied to dev by #960 before it merged
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: this PR carries no migration. `0265`'s own header states it is re-runnable and that is #960's plan to sign
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is the comparison in section 2, which reads every note out of `origin/main` as a module rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan, with its ordering measured and its before-picture taken, is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and lists `0.40.5` at the top with all eight notes
- [x] Data persists — reload the page and the change is still there — navigated away to `/api/version` and back; `0.40.5` and its notes render identically. The data is compiled into the build, so there is nothing to persist beyond that. **Read from a screenshot rather than from `document.body.innerText`, which returned 55 characters after the navigation** — a stale JS execution context in the browser pane, not an empty page. The weaker reading was the one that looked like a defect, and it is recorded here rather than quietly retried
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface; it is two edited data files
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is the normal state between releases and is what this cut produces; the page shows no unreleased block and runs from `0.40.5` down with no gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing to deploy while `unreleased` has lines or `package.json` disagrees with the newest entry, and `check-release-guards.mjs` exercises both refusals (section 2)
- [x] Boundary cases checked — the version boundary is the one that matters and both sides were asserted: the file still orders newest-first with `0.40.5` ahead of `0.40.4`, and the mail function answers empty for `0.40.4` while still finding `0.40.0` from further back

### Role access matrix

**This matrix means something different on this cut than on any before it,** because #956 changed how a note finds its audience: a new note is tagged by card, and a card nobody recognises **widens** rather than narrows. So the interesting case is no longer "does this role see the note" but "does an unrecognised tag hide anything", and the answer must be no.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.5` and all eight notes — Admin is outside the card system and sees every line | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.5`; the card-tagged notes only where it holds one of the cards; the `roles`-tagged note (it is tagged `admin`, `management`); all four plain notes | not driven — reason below |
| second_in_command | the releases page | sees `0.40.5`; the plain notes; card-tagged notes per its cards; **not** the `roles`-tagged one | not driven — reason below |
| doctor | the releases page | sees `0.40.5` and the plain notes. It holds one card on production, so almost every tagged note is greyed under Show everything rather than absent | not driven — reason below |
| volunteer | the releases page | sees `0.40.5` and the plain notes | not driven — reason below |
| signed out | the releases page | redirected to `/login`, as this session saw before signing in | **as expected** — observed |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, **not** fewer — the widen-never-narrow rule | **as expected** — asserted by unit test, below |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether a tagged note is shown to it. That tagging is data, asserted character-identical in section 2, and the code that reads it (`src/lib/release-audience.ts`) is untouched by this PR and carries its own unit tests from #956 — `src/lib/release-audience.test.mjs`, which ran green in this cut's `test` gate. **The widen-never-narrow property is covered there rather than by seven sign-ins**, which is the stronger check: a sign-in shows one role's result, the test asserts the rule for an unrecognised tag
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action, so there is nothing new to refuse. The one access check it exercised incidentally is the page's own sign-in gate, which sent an anonymous request to `/login`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR, and the cut adds no page. The existing `Release notes` entry was present in the nav of the running build
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a release cut adds no feature for the manual to describe. **The manual changed substantially in this release** (#950, now by card) and that is #950's plan to sign, not this one's
- [ ] Translatable strings go through the translation path — n/a: the eight notes are English prose authored by their own PRs, not UI strings; release notes are not translated
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured rather than eyeballed: at 375×812 `document.documentElement.scrollWidth` is **375** against a `clientWidth` of **375**, so there is no horizontal overflow, and the first heading is `Release notes` with the `0.40.5` entry below it
- [x] Browser console clean — no errors or React warnings — read on the releases page at both widths: **no console messages at all**, at 800×600 and again at 375×812
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not separately inspected beyond the requests the reader surfaces, which answered 200

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded on this cut rather than reasoned about. `0.40.5` heads the list; `0.40.4`, `0.40.3`, `0.40.2` and `0.40.1` follow in order with their own notes intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` has two readers besides the releases page. `/api/version` was loaded from the running build and answers `{"version":"0.40.5","sha":"9db37279093d4659262af6193174412f705d4443"}`, so the version **and** the commit agree with the cut rather than only the version. **The second reader could not be checked here and is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time instead, which is the runbook's two-endpoint check
- [x] **An independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.5` carries no **Major** badge, while the control two entries below — `0.40.0 · Units you keep yourself, and two pages that were slow | 24 Oct 2026 | Major` — carries one. That is the `major` flag as a user sees it, beside a known-true positive case, so a badge that had simply stopped rendering could not pass as a negative
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (section 2); `main` did not move between the branch point and the gates run, confirmed by `git log --oneline 42c3704c..origin/main` being empty

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item, and follow-ups found during a release go on the `backlog` branch rather than into this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The judgements in this release were recorded in their own PRs, among them `docs/decisions/2026-10-26-card-review-1-schema.md` and `docs/decisions/2026-10-26-release-notes-by-card.md`
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number, so the bump cannot stale it
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; the checker holds this line to the diff and a tick here would be a claim the diff contradicts. **The eight notes' truth was checked rather than assumed**, which on this release is not a formality: five of the eight describe what a card may read, and they become true for a user only when `0265` is applied. That happens **before** either deploy, so no note promises something with a manual step still open (`docs/decisions/2026-10-11-release-note-truth-rule.md`). The ordering is asserted in section 8, not hoped for
- [x] Commit messages say why, not just what — the cut commit records the mail question and the answer, the two other decisions taken in the same round, why `package.json` was bumped, and why the cut used the committed script rather than a throwaway
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Three in this cut that could each have been asserted instead: the PR list's disagreement was resolved by `gh pr view` on both missing numbers rather than by inferring a squash from the gap (defect 1); `0265`'s ordering was established from its declared consumers against this release's diff rather than read off the header; and the `npm ci` tell was read as two numbers — `package.json` declares `next@16.4.2`, the installed tree reads `16.4.2` — rather than trusted because the command exited 0

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at `9db37279`; the deployed SHA will be this PR's merge commit and is recorded in the release record, with a code-identity diff against it
- [ ] Deployed SHA matches the tested SHA — deferred: read from the `deploy.mjs` output at deploy time, and the code-identity diff in the record is what settles it if `main` moves

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-26` written into the entry
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves — where `0.40.5` sorts — is asserted in both directions in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the fenced blocks in section 2 are the unedited stdout of `gates.mjs` and of `cut-release.mjs --verify`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. **It is vacuous while `PUBLIC_SITE` is `locked`** and will be checked the way `0.40.4` proved it rather than recalled it — read the setting from the deploy output and confirm `/adopt` 307s to `/login` on both hosts

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'` because PowerShell's `tee` writes the log as UTF-16
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager. Held at 14 names on both environments for seven releases
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var, and the diff contains no `process.env`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and the ordering was measured rather than taken from the header.** `0265` declares twelve consumers and **this release changes them**: `src/lib/permissions/cards.ts`, `catalogue.ts`, `src/lib/residents/who-and-where.ts`, `src/lib/medical/residents.ts`, four `src/app/residents/` pages, `src/lib/contacts/carers.ts` and both `src/app/deliveries/` files all appear in `git diff --name-only 2374d15d..HEAD`. So applying before the deploy is **mandatory rather than tidy**
- [x] **Both halves of the window were read rather than reasoned about, and the one-way door was found in the file itself.** `0265` adds the new `record_death` card and gives it to every role holding `Residents` **before** `Residents` loses `placement.death`, in the same file — so neither order leaves a role unable to record a death. The direction that *would* open a window is the other one: the app half of card review 1 is a **later stream**, so applying `0265` first narrows what four medical cards may read while the live app still asks for the wider read. That is why the notes say those cards' Residents buttons "will show nothing or refuse" rather than claiming they are gone
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: the production release manager, before the apply. `0265` is the only pending file, so the per-file `begin … rollback` caveat that produced an expected red on `0264` last release cannot arise here — a red would be a real red
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **live rather than skippable: `0265` rewrites `role_permissions` rows, removing grants as well as adding them.** The before-picture was taken of the tables the change writes, from production, before the apply, as `0.40.2`'s lesson requires — `role-cells` and `role-cards`, both quoted in the release record. The README restore recipe has still never been exercised, which is stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0265_card_review_1_reads.sql`, to `dbkodyyxxhtygxcxmfcu` (production), BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply rather than after it

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `2374d15d`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migration, and `0265` is not additive:** it removes `resident.record` at read from five cards and `placement.death` from `Residents`, and repoints the delivery delete policy at `is_admin()`. So "rollback available" is true of the code and **false of the schema**. Rolling the code back alone would leave the old app asking five cards for a read they no longer hold, which is the narrowing, not a crash. The honest position is forward-fix, and **Settings → Who does what is the forward fix** for anything `0265` turns out to have narrowed too far

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`release-prs.mjs` exits 1**: two test plans in the range belong to no PR in its list — `docs/test-plans/release-notes-by-card.md` and `docs/test-plans/planner-handover-366.md` | **resolved, and the list corrected by hand.** Both are squash merges, so no merge commit carries their PR subject: `gh pr view` reports #956 merged at `37ee1c8c` and #953 at `5c03a09e`, each **being** the commit that introduced its file. The release is **21 PRs, #940–#960 inclusive**, with #953 and #956 added by hand as the script's message instructs. **The exit code was read from the command, not through a pipe** — piped it reported 0, which is `tail`'s status and exactly the trap the runbook names |
| 2 | none | `audit:prod` exits 1 with `body-parser` and `undici`, five vulnerabilities, two high | **accepted** — the same two packages and the **same four advisory IDs** as `0.40.2`, `0.40.3` and `0.40.4` (`GHSA-27r3-jxmh-p828`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472`, `GHSA-xjj6-f33q-929c`), each confirmed present in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` **by grepping for the ID** rather than by recognising the package name. Nothing fixed, correctly; `npm audit fix --force` would drag the Cloudflare chain backwards |
| 3 | none | **Thirteen of the release's twenty-one test plans are signed `pending:` a person** | **accepted as a stated gap on Lutan's explicit decision**, asked before the cut with the alternative of holding the release — the same call he made for `0.40.4`, `0.40.3`, `0.40.2`, `0.40.1` and `0.15.0`, and the largest number so far. Nine are him reading the card reports this release produced; the rest are the calendar tile after the cron fix, the Features page edit round, one row on the resident hub, and the Pi tunnel drill. Listed in the release record and **not ticked on anyone's behalf** |
| 4 | none | `check-diets-per-serving-schema.mjs` fails `servings default to 1 / 1.5 / 2 - got 1` on dev | **deferred — not caused by this release and not fixed by it.** Carried from `0.40.1`, `0.40.2`, `0.40.3` and `0.40.4`; **this is the fifth release carrying it**, and `0.40.4`'s handover said plainly that four releases carrying one red script is how a real fault hides. Nothing in this release touched it either way. Raised again in the record as its own item rather than as a line in a list |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Open a resident's card signed in as someone whose only medical card is Administer medication, Record weight, Add medical photos or Feed special diets, after the deploy.** `0265` takes the full resident record away from those four and gives them who-and-where instead; this is the check that would catch a card left short. Measured on dev with no losses, but production's roles hold different card sets | Lutan |
| 2 | **Open `/enclosures` and the Residents list signed in as someone holding only Do maintenance.** That card loses the resident record entirely in this release — the Enclosures page is meant to be what a maintenance job needs. The notes say the Residents buttons may still show and will refuse; worth seeing which it does | Lutan |
| 3 | **Try to delete a delivery as someone who holds Record a delivery but is not an Admin.** It must refuse. The button may still show, which the note says | Lutan |
| 4 | **Upload a photo on the Residents card and confirm it waits for approval** rather than going to the public website | Lutan |
| 5 | The `0.40.5` notes as an admin sees them on the production releases page — and, since this is the first release tagged by card, whether a note you do *not* hold the card for reads sensibly greyed under Show everything | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, and deliberately — the five rows above are for Lutan and only the person who looked may tick this. Four of them can only be done on production after the deploy

Manual verification by: pending: the five rows in Left for manual verification — the four `0265` read-back checks on production and the card-tagged notes as an admin sees them

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (this session is the production release manager)  Date: 2026-10-26
