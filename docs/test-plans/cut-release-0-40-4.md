# Feature test plan — cut release `0.40.4`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.4` — move the two `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-4` @ `C:\Development\Animal_Shelter_who-does-what-save-fix` (the one free leftover, reused under paperwork rule 2, so this cut paid no `npm ci`) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | #939 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-25 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries three (`0262`, `0263`, `0264`), which belong to their own PRs' plans and are not signed here |
| Tested at SHA | `14d1a092`, whose parent is `47fec509` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two `ReleaseNote`s move from `unreleased` into a new `0.40.4` entry dated 2026-10-25 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration
- [x] Roles affected identified — both notes are tagged `roles: ["admin", "management"]`, so only those two roles are shown them on the releases page. Nobody's access changes in this PR
- [x] Anything explicitly **out of scope** written down — the three migrations in this release, and `0263`'s narrowing of what a login may read, are out of scope here: they are the release manager's steps and are recorded in `docs/releases/`. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was created in a reused worktree and reset to `origin/main` at `47fec509` moments before the cut, so there was nothing to merge in. The reuse was checked rather than assumed: `git diff 5a7acdee..origin/main -- package.json package-lock.json` shows **only the version line**, so the lockfile is unchanged and that worktree's `node_modules` still describes `package.json`
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit 0, all 16 assertions ok, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output:

```
  ok   new entry: 0.40.4 2026-10-25 major=false notes=2
  ok   all 2 notes carried across byte-identical (text and roles)
  ok   unreleased is []
  ok   all 68 older entries byte-identical
  ok   majorReleasesSince("0.40.3") -> [] (absence: no mail)
  ok   majorReleasesSince("0.39.5") -> ["0.40.0"] (presence: still finds major 0.40.0)
  ok   package.json 0.40.4 == newest entry
  ok   file order is newest-first by version
  ok   new entry renders cleanly (text, roles, title, date)

cut-verify: CLEAN
```

- [x] **The mail decision is asserted in both directions, not only as an absence.** `majorReleasesSince("0.40.3")` is empty, *and* in the same run `majorReleasesSince("0.39.5")` still returns `0.40.0`. The script compares `Release` **objects** by their `version`, which is the trap that reported a false red on `0.40.2`'s sound cut
- [x] **The older entries are covered by a byte-identical comparison, not by a render scan.** All 68 previous entries are compared as JSON against `origin/main`'s copy, loaded as a module rather than parsed out of the file, so the `0.33.0` note that legitimately quotes `"NaN undefined NaN"` cannot produce a false red and an altered older note cannot hide
- [x] **The cut script's first run failed and was fixed rather than worked around.** `src/lib/releases.ts` is CRLF, so LF markers did not match; the script is now end-of-line aware and writes the file in its own ending. It failed loudly before writing anything, which is the safe direction — a silent LF rewrite of a CRLF file would have produced a whole-file diff

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. The next free number after this release is `0265`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration; the release's own `--status` is section 8's
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration. Dev already holds all three of the release's, at 265 of 265 with no drift
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is the comparison in section 2, which reads every note out of `origin/main` as a module rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's own apply plan, with its ordering measured, is in section 8

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on this cut, signed in as Admin through `scripts/dev-signin.mjs`, and lists `0.40.4` at the top with both notes
- [x] Data persists — reload the page and the change is still there — navigated away to `/api/version` and back; `0.40.4` and its two notes render identically. The data is compiled into the build, so there is nothing to persist beyond that
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface; it is two edited data files
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is the normal state between releases and is what this cut produces; the page shows no unreleased block and runs from `0.40.4` down with no gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing to deploy while `unreleased` has lines or `package.json` disagrees with the newest entry, and `check-release-guards.mjs` exercises both refusals
- [x] Boundary cases checked — the version boundary is the one that matters and both sides were asserted: the file still orders newest-first with `0.40.4` ahead of `0.40.3`, and the mail function answers empty for `0.40.3` while still finding `0.40.0` from `0.39.5`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.4` and both notes (tagged `admin`, `management`) | **as expected** — driven signed in as Admin, section 6 |
| management | the releases page | sees `0.40.4` and both notes | not driven — reason below |
| second_in_command | the releases page | sees `0.40.4`; not the notes, which are tagged `admin` and `management` | not driven — reason below |
| doctor | the releases page | sees `0.40.4`; not the notes | not driven — reason below |
| volunteer | the releases page | sees `0.40.4`; not the notes | not driven — reason below |
| signed out | the releases page | redirected to `/login`, as this session saw before signing in | **as expected** — observed |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether the tagged notes are shown to it. That tagging is data, asserted byte-identical in section 2, and the rendering code is untouched here
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action, so there is nothing new to refuse. The one access check it did exercise incidentally is the page's own sign-in gate, which sent an anonymous request to `/login?next=%2Freleases`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR, and the cut adds no page. The existing `Release notes` entry was present in the nav tree read from the running build
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the two notes are English prose authored by #935 and #936, not UI strings; release notes are not translated
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured rather than eyeballed: at 375×812 `document.documentElement.scrollWidth` is **375** against a `clientWidth` of **375**, so there is no horizontal overflow, and the first heading is the `0.40.4` entry
- [x] Browser console clean — no errors or React warnings — read on the releases page at both widths: no console messages at all
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not separately inspected. The two requests this cut's reader surfaces were made and both answered 200 (`/releases`, `/api/version`)

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only screen `releases.ts` feeds, and it was loaded on this cut rather than reasoned about. `0.40.4` heads the list; `0.40.3`, `0.40.2`, `0.40.1` and `0.40.0` follow in order with their own notes intact
- [x] Any shared file touched checked from a second, unrelated page — **by loading it, not by reading the file** — `src/lib/releases.ts` has two readers besides the releases page. `/api/version` was requested from the running build and answers `{"version":"0.40.4","sha":"47fec509…"}`. **The second reader could not be checked here and is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev`, so it is read at deploy time instead, which is the runbook's two-endpoint check
- [x] **An independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.0` carries a **Major** badge and `0.40.4` carries none. That is the `major` flag as a user sees it, beside a known-true positive case
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (section 2); `main` did not move between the reset and the gates run, confirmed by `git log --oneline 47fec509..origin/main` being empty

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item, and follow-ups found during a release go on the `backlog` branch rather than into this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The judgements in this release were recorded in their own PRs (`docs/decisions/2026-10-25-who-does-what-by-card.md`, `2026-10-25-doors-need-a-card.md`, `2026-10-25-no-coded-security-inventory.md`)
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number, so the bump cannot stale it
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; the checker holds this line to the diff and a tick here would be a claim the diff contradicts. The two notes this cut publishes were written by #935 and #936. **Their truth was checked rather than assumed:** both describe work that becomes true for a user when `0262` is applied, which happens **before** either deploy in this release, so neither note promises something with a manual step still open (`docs/decisions/2026-10-11-release-note-truth-rule.md`)
- [x] Commit messages say why, not just what — the cut commit records the mail question and its answer, why `package.json` was bumped with a one-line replacement, and why the script is end-of-line aware
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The ordering claim in section 8 was established by diffing each migration's declared consumers across the release range, not read off the headers; the no-overflow claim is a measured pair of numbers rather than a look at a screenshot; and the worktree reuse was justified by a lockfile diff rather than by "it is probably fine"

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at `14d1a092`; the deployed SHA will be this PR's merge commit and is recorded in the release record
- [ ] Deployed SHA matches the tested SHA — deferred: read from the `deploy.mjs` output at deploy time, and the code-identity diff in the record is what settles it if `main` moves

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-25` written into the entry, and the page renders it as `25 Oct 2026`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves — where `0.40.4` sorts — is asserted in both directions in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the two fenced blocks in section 2 are the unedited stdout of `gates.mjs` and of the cut verification script
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. It is vacuous while `PUBLIC_SITE` is `locked`, as it was on `0.40.2` and `0.40.3`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, after `tr -d '\000'` because PowerShell's `tee` writes UTF-16
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var, and the diff contains no `process.env`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and the ordering was measured rather than taken from the headers.** All three migrations declare consumers that **change in this release**: `0262` → `src/lib/permissions/cards.ts`, `catalogue.ts`, `who-does-what.ts`, `src/app/management/page.tsx`, `src/app/admin/who-does-what/page.tsx`; `0263` → `src/lib/auth/app-users.ts`, `src/lib/residents/who-and-where.ts`, the facility-plan image route; `0264` → `who-and-where.ts`, `scripts/dev-signin.mjs`. So applying all three **before** the deploy is mandatory rather than tidy
- [x] **Both halves of `0262`'s window were read rather than reasoned about.** Its header states the hazard in both directions: the app alone drops Management from Settings → Who does what, and the migration alone adds a card nothing asks for. Applying it before the deploy puts the card and Management's hold on it in place while the live app still opens the page by role name, so **neither order opens a window in which Management loses the page**
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: the production release manager, before the apply. **A red on `0263` or `0264` is expected and is not a reason to stop**: each file is dry-run in its own `begin … rollback`, so a later file cannot see an earlier pending one — the documented caveat, where the correct action is to apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **live rather than skippable: `0264` drops 60 policies, 7 functions and 5 columns, and `0263` rewrites 10 views and their gates.** The before-picture was taken of the tables the change writes, from production, before the apply: `role-cells`, `role-cards`, `doctor-cells`, `cards-union` and `role-cards-coverage`, all quoted in the release record. The README restore recipe has still never been exercised, which is stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0262`, `0263` and `0264`, in that order, to `dbkodyyxxhtygxcxmfcu` (production), all three BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply rather than after it

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `b02864e7`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migrations, and this release's are emphatically not additive:** `0264` drops policies, functions and columns, and `0263` replaces the gates on ten views. So "rollback available" is true of the code and **false of the schema**, and rolling the code back alone would leave the old app reading views whose gate functions no longer exist in the shape it expects. The honest position is forward-fix, and Settings → Who does what is the forward fix for anything `0263` turns out to have narrowed too far

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script's first run threw `markers not found`: `src/lib/releases.ts` is CRLF and the markers were written with LF | **fixed** — the script reads the file's own ending and writes it back. It failed before writing anything, which is the safe direction; the same CRLF hazard was met and worked around on `0.40.3` and is still filed as a one-liner for `scripts/cut-release.mjs` |
| 2 | **medium** | **The Doctor role on production has lost four of its five cards since `0.40.3`.** `role-cards` now reports `doctor: view_residents` alone, and `doctor-cells` reports **MISSING 12 of 13** where `0.40.3`'s record measured 9 of 13 with five cards | **deferred — not caused by this release and not fixed by it.** It happened on production between the two releases, which this release's own cards work would not do. Reported to Lutan at the time it was found, and recorded in the release record beside the before/after pair. The remedy is unchanged: his new doctor cards, filed under *Security* |
| 3 | none | `audit:prod` exits 1 with `body-parser` and `undici`, five vulnerabilities, two high | **accepted** — the same two packages and the **same four advisory IDs** as `0.40.2` and `0.40.3`, each confirmed present in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` by grepping for the ID rather than by recognising the package name. Nothing fixed, correctly; `npm audit fix --force` would drag the Cloudflare chain back to `wrangler@4.35.0` |

## Left for manual verification

| What | Why it needs a person | Who |
|---|---|---|
| **Open `/residents`, `/enclosures` and a resident card signed in as a volunteer, and as management, after the deploy** | `0263` narrows what every login may read, and this is the check that would catch a role left short of a card. It was measured on dev one login per role with no losses, but production's roles hold different card sets. **The release's most valuable single check** | Lutan |
| The Who does what card on a card-only login — give the card to a role, then open the page as that role | `0262` makes the page a card. It needs the authenticator step on production, which no session can pass | Lutan |
| The `0.40.4` notes as an admin sees them on the production releases page | A signed-in surface; `PUBLIC_SITE` is `locked`, so there is no anonymous route to it | Lutan |

## Sign-off

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-25

Manual verification by: pending: the three rows in Left for manual verification — the volunteer and management read-back after `0263`, the Who does what card on a card-only login, and the notes as an admin sees them

Result: pass with accepted defects
