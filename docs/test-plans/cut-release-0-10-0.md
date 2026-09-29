# Feature test plan — cut-release-0-10-0

## Header

| | |
|---|---|
| Feature | Cut release `0.10.0`, **major**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-10-0` @ `C:\Development\Animal_Shelter_cut-release-0-10-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-29 |
| Carries a migration? | no — `0113`–`0116` sit between the deployed build and `main`, all four read by code already on `main`. See §3 |
| Tested at SHA | `2c331de` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.10.0` entry holding the five notes written by PRs #217–#228, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles** in what `/releases` lists, each filtered to their own role. Four of the five notes are role-tagged: two `admin, management`, one `vet`, one `admin, management, staff`; only the printable manual is untagged. `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the UAT deploy, Lutan's go; (b) the release record, written after that deploy; (c) applying `0113`–`0116` (§3); (d) the third release of the day — `0.9.0` and `0.9.1` both shipped on 2026-09-29, so `docs/releases/2026-09-29.md` will gain a third section rather than a new file

**Decision confirmed in chat by Lutan, 2026-09-29:** `0.10.0` with `major: true`. The version question was put with the argument on both sides, because this release is less clear-cut than `0.9.0`'s was. Two of the five notes ask someone to act:

- **Fixed monthly outgoings** — rent, electricity, internet and salaries have to be entered under Management → Cashflow before the forecast includes them. Same shape as `0.9.0`'s "an admin sets each vet's clinic": the feature does nothing until somebody fills it in, and the mail goes to exactly the people who would.
- **Vets no longer have a My tasks page** — they land on the new Appointments page instead. A removal, not an addition, and the kind of change that produces a confused question rather than a discovered feature.

The counter-argument, recorded because it is reasonable: nothing *breaks* if nobody acts — the forecast stays as incomplete as it already was, and vets get a better landing page rather than a worse one. Lutan's call was major.

**Note which of those two the mail actually reaches.** Release mail goes to admins only, so the fixed-outgoings note lands with the people who can act on it (`admin, management`), while the vet note does not reach any vet. It is still worth mailing: an admin is who a confused vet asks.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `2c331de`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.10.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.9.1")` returns `["0.10.0"]`** — the check that makes the deploy mail admins, verified rather than inferred from `major: true`. **This is the check the version boundary below could have broken silently**
- [x] **The date was read from the system clock and compared back to it** — `date +%Y-%m-%d` gave `2026-09-29`, the entry says `2026-09-29`, and the register was re-loaded and asserted equal to today
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.10.0` / `2026-09-29` / `major: true` / 5 notes

### The first double-digit version component, checked deliberately

`0.10.0` is the first release whose minor number reaches two digits, and that is a
real trap rather than a formality: **a naive string comparison puts `"0.10.0"`
*before* `"0.9.1"`**, which would make `majorReleasesSince("0.9.1")` return `[]`
and the deploy send no mail at all — a major release going out silently, with
nothing failing and no error to notice.

- [x] `compareVersions` is numeric, not lexical — it splits on `.` and maps `Number`. Asserted at the boundary: `compareVersions("0.10.0","0.9.1") === 1`, `compareVersions("0.9.1","0.10.0") === -1`, `compareVersions("0.10.0","0.10.0") === 0`
- [x] `majorReleasesSince("0.9.1")` returns `["0.10.0"]` — the mail will be sent
- [x] The register's file order still matches a re-sort by `compareVersions` — `0.10.0 > 0.9.1 > 0.9.0 > 0.8.1`, identical both ways across all fifteen entries, so `releases[0]` is genuinely the newest and not merely the topmost
- [x] **Every other version comparison in the codebase was audited, not assumed.** `compareVersions` has exactly one caller: `majorReleasesSince`, in `releases.ts` itself. Everywhere else compares versions by **equality**, never ordering — `deploy.mjs:169` (package.json against `latestRelease`), `deploy.mjs:264` (the wait-for-propagation loop), `worker/release-mail.mjs:106` (the `/api/releases/current` answer). No lexical `<`/`>` on a version anywhere, so the trap has no second place to fire

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Not establishable from this session for the UAT database; the release manager runs `--drift production`
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release, on all four files
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0116`: `--status` reports `116 applied, 0 pending` and no drift against `origin/main 2c331de`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — the starting point is recorded, not assumed: `0.9.1`'s record quotes `No drift: production matches origin/main` at 112 files, so UAT is at `0112`. `0113`–`0116` are what is new.

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1`.
  2. `--dry-run`, apply, then `check-public-views.mjs --env production`, **all appended to the same log**. `check-app-access-gate.mjs` is **not** part of this pair — dev-only, takes no `--env`, ruled 2026-09-29.
  3. **Then** deploy.

  | File | Read by code already on `main`? |
  |---|---|
  | `0113_resident_microchip_number.sql` | **Yes** — the microchip field and the chip-scanner search (#221) |
  | `0114_fixed_outgoings.sql` | **Yes** — Edit fixed outgoings and the forecast's new column (#226) |
  | `0115_fixed_outgoings_grants.sql` | **Yes, and inseparable from `0114`** — see below |
  | `0116_set_resident_microchip.sql` | **Yes** — the vet-facing chip write (#223's feature half) |

- [x] **`0114` and `0115` must be treated as one file, and the reason is worth reading.** Supabase no longer grants new tables to the Data API automatically, so `fixed_outgoings` was created by `0114` with no grants. `0114` had already been applied to dev before `check-migration-grants.mjs` caught it, and an applied file is never edited — hence `0115` as a separate grants file. **On production the two apply in the same run, so the ungranted window never exists there**, which is the one place this is simpler than dev. But if an apply ever stops between them, the table is present and unreachable through PostgREST, and the page reading it fails with a permission error rather than a missing-column error. Worth knowing, because those two failures look nothing alike while having the same cause
- [x] **`0116` is a security-definer function, and that is a deliberate choice rather than a shortcut** — recorded in `docs/decisions/2026-09-29-vet-microchip-write-via-definer-function.md`. Vets read residents in their clinic scope (`0108`) and hold no update on `residents`; widening the RLS policy would have let them write *every* column of a resident row, and a column-level grant would have applied to every other role too, since the app uses one database role for all users. `set_resident_microchip` names two columns in its `UPDATE`, with no dynamic SQL and no argument that selects a column, so the write surface is two columns of one row **by construction rather than by policy**. Nothing in this cut changes that; it is stated because a definer function is the thing a reviewer should look at hardest in this release
- [x] **Ordering: all four before the deploy, and none of them is safe the other way round** — unlike `0.9.1`, where two of three were additive with defaults. `0113` adds a column the resident screens now read, `0114`+`0115` create a table the cashflow page queries, and `0116` creates a function the vet interface calls. Deploying first means four features erroring rather than degrading
- [x] **No new schema-ahead-of-code** — all four have their consumer on `main`. The `0112` expiry date carried forward from `0.9.1` (stock-count provenance recorded but not shown) is **still open** and is not addressed by this release

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.10.0`, `major: true`, `2026-09-29`, 5 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has fifteen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the version boundary has its own section in §2, which is the substantive one this time. Also: the cut is line-based and carried all five source lines verbatim, each entry occupying exactly one source line, asserted before cutting. After the cut the register resolves to **1 string and 4 objects** — the highest proportion of role-tagged notes in any release so far — and every note returns readable text through `noteText()`. **Note count**: exactly 5, none reworded. **Indentation**: six spaces. **Line endings**: CRLF preserved
- [x] **The release mail was built and read** — subject `Lanna Care release 0.10.0: Microchip numbers, an Appointments page for vets, fixed monthly costs in the forecast, and a printable manual`; **0** occurrences of `[object Object]`, **0** of `undefined`, **5** bullets in the HTML and five in the plain text. Four of the five are the object form, so this release leans on the `noteText` path more heavily than `0.9.0` did — which is the release that first proved it in a real send

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.10.0`; **is emailed** | mail built and read above; the send is a deploy step, §8 |
| management | `/releases` | sees `0.10.0`; three of five notes are tagged for them | not verified on a deployed build at PR time |
| staff | `/releases` | sees the microchip note and the manual note | not verified on a deployed build at PR time |
| vet | `/releases` | sees the Appointments note and the manual note; **the note that changes their job is not mailed to them** | §1 |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The cut's job was to carry four role tags across intact, which §4 verifies
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access changes are `0116` and `0110`'s scope, covered in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release itself changes the vet's nav (#224/#227), covered by their own plan
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s consumers (`/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, the role filter) were all exercised in §2 and §4, and the version-comparison audit in §2 covers every one of them
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `2c331de`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All five were written by the PRs that made each change
- [ ] Non-obvious design choices recorded as a new file in `docs/decisions/` — n/a: no design choice in this PR. The `major: true` reasoning is in §1 as a release decision, and the version-boundary finding is in §2 because it confirmed existing code rather than changing it
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `2c331de` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of the last three releases; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: this session, after merge. **Before the UAT deploy, not after**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. This session can check the lock page, the console and the version endpoint; entering credentials is confined to local development hosts. **The screens worth most attention**: Management → Cashflow with Edit fixed outgoings (`0114`+`0115`), a vet's new Appointments landing page, and the chip-scanner box on Residents
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. Relevant here: the Appointments page buckets visits by "still to write up / upcoming / finished in the last 30 days", which are all date comparisons, and the fixed-outgoings first/last month bounds are month arithmetic
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. Lower relevance than `0.9.1` — no note here changes a public page — but the microchip note ends "never shown on the public website", which is worth one look at a resident's public card
- [ ] **`check-public-views.mjs --env production`, appended to the log** — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. Use `>>`
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — this release sends, and §2's boundary check is what guarantees it.** `major: true` and `majorReleasesSince("0.9.1")` is `["0.10.0"]`, so the deploy will look up every unarchived admin and POST the built mail to the relay. The expected line is `deploy: release mail for 0.10.0 [UAT]: sent N, skipped M`. **`sent 1, skipped 1` is the expected shape** and is not a fault: Lutan confirmed on 2026-09-29 that he receives these, and the skip is accepted
- [x] **The deploy may be refused to this session** — `npm run deploy:prod` was denied as `[Production Deploy]` on 2026-09-29 and both of that day's releases were deployed by Lutan. If it repeats, hand over the command and **ask for the output back**: that is where `0.9.0`'s record was lost. Plain `npm` is also blocked by PowerShell's execution policy on this machine, so the form to hand over is `node scripts/deploy.mjs --env production >> deploy.log 2>&1`. **And warn that the terminal will look empty** — the `>>` redirect sends every line to the file, which Lutan reasonably read as a failed deploy on `0.9.1`

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, all four of `0113`–`0116` are read by code already on `main`, so all four go **before** the deploy, and **none is safe in the other order** — see §3
- [ ] `--env production --dry-run` run and clean — deferred: release manager, on all four files
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. None of the four rewrites data: two add a column or a table, one adds grants, one adds a function
- [x] Apply plan stated — §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.9.1` build in seconds. **This release is not fully reversible**: `major: true` means the mail is sent, and a mail cannot be unsent. Everything else reverses. Rollback does not revert `0113`–`0116`, and leaving all four applied under the `0.9.1` build is safe: an unread column, an unread table with grants, and an uncalled function. The asymmetry is worth stating plainly — the schema is safe to have applied early and unsafe to have applied late, which is why the order in §3 is not a formality

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **`scripts/release-prs.mjs` was used for the first time, and it is what enumerated this release.** #220 built it from the backlog item filed after `0.9.1`, where #213 was invisible to `git log --first-parent` and the release was nearly recorded as eight PRs instead of nine. Run against `ee035a6..HEAD`: **12 PRs (#217–#228), exit 0**, with **15 added migration and test-plan files cross-checked against the list and no orphans**. So the PR list in this plan is not a `--first-parent` listing, and the pre-deploy by-hand check finally has a list it can trust
- **All twelve** PRs have a completed plan under `docs/test-plans/` — eleven plans for twelve PRs, because **#224 and #227 are both `claude/vet-appointments-tasks`**, two PRs from one branch sharing `vet-appointments-tasks.md`. **Every one reports `Result: pass`** — the first release in this sequence with no `pass with accepted defects` at all
- **The `0112` expiry date from `0.9.1` is still open**: stock-count provenance is recorded but shown nowhere. Not a defect in this release, but the first PR to surface it inherits a column that has been collecting rows since `0.9.1`

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The five notes **and the title**, read as a shelter user would. `major: true`, so these exact words are emailed to every admin and the title becomes the subject line. **The title is mine and nobody has reviewed it** — it is also the longest of any release so far, at four clauses, which is worth a look on a phone mail client | `src/lib/releases.ts`, the `0.10.0` entry |
| 2 | **The `major: true` call, read against the set.** §1 records the argument both ways; the decision was made on the fixed-outgoings note asking management to enter data | `src/lib/releases.ts`, the `0.10.0` entry |
| 3 | **The four role tags, read as a set** — the highest proportion of tagged notes in any release. A wrong tag hides a line from the people whose job it changes, and the vet note is the one that matters most since no vet is mailed | `src/lib/releases.ts`, the `0.10.0` entry |
| 4 | The signed-in pass on `test.lannacare.org` after the test deploy, per §8 | `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all four items are open and need a person. Items 1 and 3 matter more than usual because this release mails and is the most heavily role-tagged so far

Manual verification by: pending: Lutan to read the five notes and the title (item 1), confirm `major: true` against the set (item 2), check the four role tags (item 3), and run the signed-in pass on test (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
