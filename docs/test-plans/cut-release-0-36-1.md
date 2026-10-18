# Feature test plan — cut-release-0-36-1

## Header

| | |
|---|---|
| Feature | Cut release `0.36.1`: move the seven notes in `unreleased` into a new `0.36.1` entry, **`major: false`**, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-36-1` @ `C:\Development\Animal_Shelter_cut-release-0-36-1` |
| Dev server | not driven — `/releases` is behind sign-in; see §5 |
| PR | #717 — a guess; the last cut guessed wrong, so it is re-read before the merge and corrected if taken |
| Tested by / date | Claude (production release manager session) / 2026-10-18 |
| Carries a migration? | no — the release's one (`0220`) merged in its own PR and is applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the seven notes in `unreleased` into a new `0.36.1` entry, **`major: false`** on Lutan's call in chat (2026-10-18), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, filtered by tag. Five notes are untagged; two (the cumulative chart and Recent changes) carry `admin`, `management`, `second_in_command` as their feature PRs wrote them. **No admin receives mail, because `major: false`** — asserted as `majorReleasesSince("0.36.0")` returning exactly `[]`. **This is the inverted form of the usual check** and it is the one that matters on a minor release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — four things. (a) The wording and tagging of the seven notes: written in their own feature PRs, carried across unaltered. (b) The nine `pending:` manual verifications on this release's feature plans — they belong to those plans and their signatures, and Lutan chose to ship with them recorded as stated gaps. (c) **Automating the Cloudflare cache purge**: Lutan ruled for a token on the Pi (2026-10-18), and it is deliberately **its own PR after this release**, not folded in — changing the deploy path inside the release that first exercises the new deploy path is exactly the mistake the `0.36.0` record warns about. (d) **The peak-memory measurement** the runbook now asks for on the next Pi build is a release step, not part of this cut

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically:

```
PASSED:
  - entry is flagged major: false — a minor release
  - all 7 notes identical, in order, byte for byte
  - unreleased is empty
  - history intact: 51 entries unchanged, +1 new
  - package.json 0.36.1 matches the newest entry
  - majorReleasesSince("0.36.0") = [] — MINOR, so no admin mail goes out
  - file order is newest-first by compareVersions
  - every note renders, all role tags live

notes: 7 | major: false | date: 2026-10-18
lengths: 575, 367, 229, 207, 380, 125, 218
tags : 1:everyone  2:admin+management+second_in_command  3:admin+management+second_in_command  4:everyone  5:everyone  6:everyone  7:everyone

VERDICT: all checks passed
```

**The `majorReleasesSince` assertion is inverted for this release and that is the point.** On a major release it must return exactly the new version; here it must return **nothing**, because `major: false` is the whole difference between this release and an email to every admin. Asserting it mechanically is cheaper than reading the flag and hoping.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `1b50cf87`. Re-run before the plan was signed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 103s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Written and committed before the PR is opened so the first run is green by construction. Ticked in a follow-up commit once a run is seen green, with its `headSha` read from `gh run list` and matched against this branch's HEAD
- [x] `node scripts/check-release-guards.mjs` — all 16 guards `ok`

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's one migration (`0220_doctor_report_purpose.sql`) merged in #710, is applied to dev, and is applied to production as a release step before any deploy.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the release: `origin/main` tops out at `0220`, so the next free number is `0221`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production `220 applied, 1 pending`; dev `No drift`, 221 of 221)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`; run as a release step and the outcome stated in the record
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev holds all 221 with no drift either way)
- [ ] File is re-runnable — `n/a: no migration`. `0220` states that it is, and its own plan carries the check
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR.` For the release this is the question `0220`'s default answers: `add column … not null default 'bill'` fills **every** existing row in the same statement, so no back-fill can miss one and every pre-existing clinic-visit attachment stays a bill
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0220`'s header states its own undo steps
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`, but stated for the release: `0220`, project `dbkodyyxxhtygxcxmfcu`, one run, **after this cut merges and before any deploy**

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.36.1` entry with seven notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a release entry is added once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being empty, which `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the seven note lengths were **measured, not estimated**: 575, 367, 229, 207, 380, 125, 218, the longest being the clinic-visit note. The two tagged notes kept all three roles each, checked against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the order is asserted newest-first across all 52 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all seven, and **receives no mail**, because `major: false` | asserted via `majorReleasesSince("0.36.0") === []`; the absence of a mail line is checked on the deploy in §8 |
| management | `/releases` | sees all seven | tags asserted byte-for-byte in §2 |
| second_in_command | `/releases` | sees all seven | tags carried across unchanged |
| head_of_medical | `/releases` | sees the five untagged notes, not the chart or Recent changes ones | tags carried across unchanged |
| doctor | `/releases` | sees the five untagged notes | tags carried across unchanged |
| volunteer | `/releases` | sees the five untagged notes | tags carried across unchanged |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`
- [x] A role that should not have access is blocked server-side — unchanged: this PR touches no route, middleware or policy

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path — `n/a: release notes are not translated through that path`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff.` The longest note at 575 characters is within the range `/releases` already renders
- [x] Browser console clean — `n/a: not driven.` Nothing in this diff executes in the browser beyond the data it renders, asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — the two consumers of this file are checked where they run: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, 16/16 `ok`), and the Worker bundles it to answer `/api/releases/current` (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is loaded, not read, by both consumers above
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The two release-level decisions of the day — shipping minor rather than major, and automating the cache purge — are recorded in `docs/releases/` and in the purge PR respectively
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the seven existing notes out of `unreleased` and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. **`0220`'s doctor-report columns deliberately have no note of their own** — nothing in the app can add a report yet beyond what note 1 describes, and the note that does describe it was written by the feature PR. The vet calendar still has none: configured on test only, dormant on production

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted after the merge, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `n/a: not yet — no deploy has run at this commit`

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` The filled copy goes to `docs/releases/`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks in §2 are copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked`, on **both** environments, so there is no anonymous public page to re-check. **But the cache purge itself is not n/a this release**: it is now a required runbook step after every Pi deploy, and this release is the first to carry it

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet at this commit`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit`
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release. **A new one is coming but deliberately not here**: the Cloudflare cache-purge token Lutan ruled for today lands in its own PR
- [x] **The release mail must NOT go out, and that is checked by its absence.** On a major release the check is that the mail arrived; inverted here. `majorReleasesSince("0.36.0") === []` is asserted above, and the deploy log is grepped for `deploy: release mail` with **no line expected**. Recorded in `docs/releases/` either way

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. For the release: `0220` applies **before** any deploy, because `main` already carries its readers (`src/lib/bills/photos.ts`, the clinic-visit pages) and both deploy paths refuse a database missing a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR`; run as a release step and which dry-run case occurred is stated in the record
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **`0220` is additive**: one `add column … not null default 'bill'`, four new policies and a function signature change. Nothing is dropped and no live row is rewritten in place, so the destructive gate does not strictly apply. A fresh backup exists regardless: `lannacare-production-2026-10-17T2000Z.dump.age` (1,279,505 bytes), 20:00Z on 2026-10-17 — the **eighth consecutive unprompted cron night**, and unlike yesterday's releases it is **newer than** `0213`–`0219`, so a restore would not unwind them. The README restore recipe has still never been exercised
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0220`, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 1f7eacb5` there (a rebuild to `0.36.0`); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts the migration.** `0220` is additive and its header states its own undo steps, and `0.36.0` code neither writes nor reads `purpose`, so leaving it in place is harmless on a rollback — every existing row is `'bill'`, which is what `0.36.0` assumes. **And this release is materially easier to roll back than the last two: `major: false` means no mail goes out, so the one genuinely irreversible step of a release is absent.** The backup is also newer than every applied migration for the first time in three releases. **What a rollback does NOT undo:** the Photos to approve freeze fix — rolling back restores the frozen buttons

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | No defect was found in this cut. The seven notes carried across byte-identical, all 51 prior entries are unchanged, `major: false` is asserted both directly and through `majorReleasesSince` returning empty, and gates and all 16 release guards are green | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in this PR. It moves seven notes between two arrays in one source file and bumps a version string. The carry-across is asserted byte-for-byte against `origin/main`, the live rendering is verified on the deployed build as a release step, and this release's nine outstanding manual items belong to their own feature plans and their own signatures — the runbook is explicit that they must not be given a second home here | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty, so this is ticked by whoever filled the plan and the signature below says `n/a` with the reason

Manual verification by: n/a: the manual list is empty — a data-only cut with no surface a person can look at before deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass
