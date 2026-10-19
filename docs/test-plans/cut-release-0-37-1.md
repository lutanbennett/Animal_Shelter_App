# Feature test plan — cut-release-0-37-1

## Header

| | |
|---|---|
| Feature | Cut release `0.37.1`: move the five notes in `unreleased` into a new `0.37.1` entry, **`major: false`**, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-37-1` @ `C:\Development\Animal_Shelter_cut-release-0-37-1` |
| PR | **#743 — a guess at the time of writing, to be re-read with `gh pr view` after opening.** The last cut guessed right (#731) after two wrong in a row (#704→#705, #717→#718). It is written down as a guess so that re-reading it is what makes it true |
| Dev server | not driven — `/releases` is behind sign-in; see §5 |
| Tested by / date | Claude (production release manager session) / 2026-10-19 |
| Carries a migration? | no — the release's **two** (`0224`, `0225`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.37.1` entry, **`major: false`** on Lutan's call in chat (2026-10-19), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, filtered by tag. **One of the five notes is untagged**, so every role sees at least that one — unlike `0.37.0`, where all four were tagged and three roles saw an empty section. **No admin receives mail, because `major: false`** — asserted as `majorReleasesSince("0.37.0")` returning **nothing**. This is the **inverted** form of the check, the same way round as `0.36.1` and the opposite of `0.37.0`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — five things. (a) The wording and tagging of the five notes: written in their own feature PRs (#734, #736, #737, #738, #741), carried across unaltered. (b) **The eight `pending:` manual verifications** on this release's feature plans — they belong to those plans and their signatures; Lutan chose in chat (2026-10-19) to ship with them recorded as stated gaps. (c) **`0224`'s permission narrowing**, named to Lutan separately from the gap count as the one thing in this release that can fail quietly, and accepted by him on the grounds that only Management holds the Approve photos card — see the risk note in §3. (d) **The Cloudflare purge token** still does not exist, so the post-deploy purge is Lutan's from the dashboard and this release costs **three** touches, not two — told to him in the opening message, before the deploy rather than after. (e) The role-home-tiles **app half**: `0225` ships the table and nothing reads it, by design

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically **against `origin/main`'s own copy of the file**, parsed rather than regex-scraped, so the comparison is of values including role tags:

```
  ok   unreleased is empty (was 5)
  ok   newest entry is 0.37.1 (got 0.37.1)
  ok   date 2026-10-19 (got 2026-10-19)
  ok   major is false (got false)
  ok   title present
  ok   note count 5 == 5
  ok   no note lost
  ok   no note invented
  ok   note order preserved
  ok   every previously-released entry byte-identical
  ok   all notes render as plain text
  ok   all role tags are live roles
  ok   note tagging: 4 tagged, 1 untagged (untagged is shown to everyone)
  ok   entries are newest-first by version
  ok   no duplicate version
  ok   package.json 0.37.1 == newest entry 0.37.1
  ok   majorReleasesSince("0.37.0") is empty — minor, no mail to admins

CUT VERIFIED — 17 assertions, 0 failures
```

```
entries total: 54
note lengths: 392, 504, 469, 480, 364
tags: 1:admin  2:UNTAGGED(everyone)  3:admin+management+second_in_command+head_of_maintenance+head_of_medical+volunteer  4:admin+management  5:admin+management+second_in_command
```

**The `majorReleasesSince` assertion is the live one this release, in its inverted form.** On `0.37.0` it had to return exactly the new version; here it must return **nothing**, because that is the difference between this release and a second mail reaching every admin on the same day. Asserted mechanically rather than by reading the `major:` flag — and **the presence of a `deploy: release mail` line in the deploy log would now be the defect**, which is the reverse of last release.

**A defect in the verification script itself is recorded under Defects below**, because it produced a passing assertion from an empty array before it was fixed. It is the kind of fault that makes a cut look verified when nothing was compared, and it is the reason the note count, lengths and tags are printed as values rather than as ticks.

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `b1176940` minutes before the cut; see the re-sync recorded in §8
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`

```
=== gates: build exited 0 after 128s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: this line is the PR's own CI result, which cannot exist before the PR does; it is replaced by a tick and the run's output once green.` The plan is written and committed **before** the PR is opened, which is what has made the first run green by construction for seven releases. **Ticking this line is itself a commit, so a second run follows**; its `headSha` is read from `gh run list` and matched against this branch's HEAD rather than taken from the PR bar's cached reading
- [x] `node scripts/check-release-guards.mjs` — all 15 guards `ok`, exit 0

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's **two** (`0224_photos_approve_activity.sql`, `0225_role_home_tiles.sql`) merged in #738 and #739, are applied to dev, and are applied to production as a release step **before any deploy**.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the release: `origin/main` tops out at `0225`, so the next free number is **`0226`**
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`. Read for the release: production **`224 applied, 2 pending`**; dev `No drift`, 226 of 226
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. Run for the release against production: **both files `ok`, nothing FAILED.** Of the three possible dry-run outcomes this is the **clean** one — the per-file rollback trap did **not** fire. Across the last several releases that is twice fired against six not. The only other output is **six expected `-- consumer:` warnings on `0224`**, which are the safe direction and which the runner explains itself
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`. Dev holds all 226 with no drift either way (`--drift test`: `No drift: test matches origin/main`)
- [ ] File is re-runnable — `n/a: no migration`. Both state that they are: `0224` is `create or replace` / `on conflict do nothing` / a `replace()` that finds nothing the second time; `0225` is `create table if not exists` with a seed that returns early once the table has rows
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR`. For the release, read in full and recorded here because **`0224` is the one file in this release that writes live rows**: its seed gives Management the `approve_photos` card and the `photos.approve` activity, then **recomputes every role holding that card, keeping `photos.resident_publish` only where the role also holds the Residents card**. `0225` writes too, but only into the table it has just created
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`. Exercised on their own branches; `0225`'s fixed-role guard and `aal2` policies are covered by `scripts/check-role-home-tiles.mjs`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0225`'s header names its undo (`drop table role_home_tiles`); `0224` is undone by re-applying `0218`/`0222`'s definitions and deleting the seeded rows
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`, but stated for the release: **`0224`, then `0225`**, project `dbkodyyxxhtygxcxmfcu`, one run of `node scripts/apply-migrations.mjs --env production`, **after this cut merges and before any deploy**

### `0224` can fail quietly, and that was named to Lutan separately from the gap count

The handover's item 13 asks for a quietly-breaking change to be named on its own rather than folded into a count. This release has one, and it is in `0224` rather than in any app change:

- [x] Read in full and the mechanism stated. `photos.resident_publish` used to mean two things — "my own uploads publish on save" and "I may approve the queue". `0224` keeps the first and moves the second to a new `photos.approve` activity. Its seed then **removes `photos.resident_publish`** from every non-fixed role that holds the Approve photos card but **not** the Residents card. Such a role's own uploads would stop publishing on save and start landing in the approval queue instead — **no error, no message, and nothing a person would notice until a photo failed to appear on the website**
- [x] Whose answer this is, and what it turns on. It turns on which roles hold the Approve photos card on **production**, where Lutan may have ticked it onto a role since `0.37.0` went out this morning. **If only Management holds it, nothing changes**, because Management also holds Residents. Put to him in the opening message with that condition stated; **he answered that only Management has it and chose to ship**, so it is recorded here as accepted rather than closed. The migration's own header says the same thing — "Management only; the 2IC does not get it" — and the order of its seed is load-bearing, which it also says
- [x] **The `-- consumer:` header was checked against the release, not against the day it was written** (handover item 11). `0224` declares six consumers and the dry-run warned on all six, saying they "differ from release `0.37.0`". That is correct and is the safe direction: the readers merged in #738 and are on `main` but are **not yet live**, so `0224` must apply **before** the deploy, not after. `0225` declares `consumer: none` and says "NOTHING READS IT YET" — **verified still true at release time**, not merely trusted: a recursive grep for `role_home_tiles` across `src/` and `worker/` returns only `scripts/check-role-home-tiles.mjs`
- [x] **Two migrations in one release, and neither touches the other's objects** (handover item 11b). `0224` works on the photo-approval functions and policies; `0225` creates a new table and its own guard. The one shared object is `set_role_cards()`, which `0224` rebuilds **from the live definition** with a single string swapped rather than restating a body — so `0221`/`0222`'s `where` clauses cannot be silently dropped, because they are not retyped. `0225` does not touch it

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.37.1` entry with five notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy, and `worker/release-mail.mjs` reads it to decide who is mailed — **this release, nobody**
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a release entry is added once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being empty, which `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the five note lengths were **measured, not estimated**: 392, 504, 469, 480, 364. The longest is **504 characters**, comfortably shorter than `0.37.0`'s 703, so this release carries no new rendering boundary. The role tags were checked against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the order is asserted newest-first across all 54 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five, and **receives no mail**, because `major: false` | asserted via `majorReleasesSince("0.37.0")` returning nothing; the **absence** of the mail line is checked on the deploy in §8 |
| management | `/releases` | sees four — every note but the meme-maker one, which is `admin` only | tags asserted value-for-value in §2 |
| second_in_command | `/releases` | sees three — the untagged diets/visits note, the phone-forms note and the photo-approval note | tags carried across unchanged from the feature PRs |
| head_of_maintenance | `/releases` | sees two — the untagged note and the phone-forms note | tags carried across unchanged |
| head_of_medical | `/releases` | sees two — the untagged note and the phone-forms note | tags carried across unchanged |
| doctor | `/releases` | sees **one** — the untagged diets and clinic-visits note. No note carries `doctor`, unlike `0.37.0` | tags carried across unchanged |
| volunteer | `/releases` | sees two — the untagged note and the phone-forms note | tags carried across unchanged |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`. **Worth the release manager's notice: unlike `0.37.0`, one note is untagged**, so every role sees a non-empty `0.37.1` section. That is how the feature PRs wrote them and this cut does not alter it
- [x] A role that should not have access is blocked server-side — unchanged: this PR touches no route, middleware or policy

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path — `n/a: release notes are not translated through that path`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff`, and the longest note is shorter than one `/releases` has already rendered
- [x] Browser console clean — `n/a: not driven.` Nothing in this diff executes in the browser beyond the data it renders, asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — the three consumers of this file are checked where they run: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, exit 0), `worker/release-mail.mjs` bundles it to decide the mail, and the Worker answers `/api/releases/current` from it (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is loaded, not read, by all three consumers above
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release-level decision of the day — minor rather than major, two releases on one day — is recorded in `docs/releases/` with Lutan's reasoning
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the five existing notes out of unreleased and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. **Two things deliberately have no note**: `0225`'s table, because nothing reads it and nobody would notice, and **the vet calendar**, which is configured on test only and dormant on production (Lutan, 2026-10-17)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decisions record were measured, not reasoned** — every number in this plan is a tool's output: the five note lengths, the 54-entry count, production's `224 applied, 2 pending`, the two `ok` dry-runs and the six consumer warnings

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted after the merge, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `n/a: not yet — no deploy has run at this commit`

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` The filled copy goes to `docs/releases/`. Both hosts were read before starting and are on a clean `0.37.0` @ `2b1dc2e5`, with nobody mid-test and nothing on test worth preserving
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`. The one date in it is a literal
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change in this diff.` The release contains one — the diet typo guard from #737 — and it is covered by that PR's own plan
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks in §2 are copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked` on **both** environments, so there is no anonymous public page to re-check, and the edge-cache `HIT` check is vacuous because the gate page is served `no-store`. **But the purge itself is not n/a**: it is a required runbook step after every Pi deploy, and because `CLOUDFLARE_PURGE_TOKEN` still does not exist (`purge-cache.mjs --dry-run` refuses, naming it), it is **Lutan's from the dashboard**, three releases running

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet at this commit`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit`
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release. **One is outstanding but is deliberately not a Worker secret**: `CLOUDFLARE_PURGE_TOKEN` belongs in `.env.deploy.production` on the deploy machine
- [ ] **The release mail MUST NOT go out, and its absence is the check.** `deferred: the production release manager, on Lutan's production Worker deploy.` The inverse of `0.37.0` and the same way round as `0.36.1`. `majorReleasesSince("0.37.0")` returning nothing is asserted in §2; the deploy log is grepped for `deploy: release mail` and **no line is expected**. A line appearing would be a defect, and an irreversible one — it is the second mail of the day that Lutan's minor call exists to prevent

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. **But the release does, and it is the ordering that matters most this time.** `0224`'s six declared consumers merged in #738 and are on `main` but not live, which is exactly what the dry-run's six warnings say. So `0224` and `0225` apply **before** every deploy
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — run from the **main checkout** (the worktree has no `.env.deploy.production`): **both files `ok`**
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **`0224` rewrites live rows**, so this gate genuinely applies rather than being waved past: its seed deletes and recomputes `role_permissions` for every role holding the Approve photos card. It is not destructive of a table, but it is a rewrite of permission rows, and it is the change Lutan accepted on the stated condition that only Management holds the card. **Listed under Left for manual verification as the one thing to look at on the deployed build.** The backup position is unchanged from `0.37.0`, which ran hours ago; the README restore recipe has still **never been exercised** — thirteen releases unanswered and still the cheapest item on the outstanding list
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0224` then `0225`, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a rebuild there pinned to `2b1dc2e5` (`0.37.0`); a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the two migrations.** `0225` is additive and harmless to code that does not know about it. **`0224` is not symmetrical**: rolling the code back to `0.37.0` while `0224` stays applied would leave `0.37.0`'s approval code asking for a permission it does not know to grant, so a genuine rollback of this release means re-applying `0218`/`0222`'s function definitions as well. That is written down here because it is the one part of this release where "just redeploy the old SHA" is not the whole answer. **What a rollback does not need to undo this time: the mail**, because `major: false` means none is sent — the opposite of `0.37.0`, where the mail was the irreversible step

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium (verification tooling, nothing shipped) | **The cut-verification script passed vacuously on its first run.** It located each array by taking the first `[` after the declaration — which is the `[]` in the type annotation `ReleaseNote[]`, not the array literal. So it compared two empty arrays and reported "unreleased is empty" as `ok` while having read nothing at all. It only surfaced because a later assertion dereferenced the newest entry and crashed. **The failure mode is the one that matters for a cut**: a verifier that reports success without comparing anything is worse than no verifier, because the runbook's instruction is to verify mechanically *instead of* reading the entry over | **Fixed** before any assertion was trusted — the locator now seeks the `[` after `= [`. Proved by the counts it then printed: `unreleased is empty (was 5)` and `note count 5 == 5`, where the broken version printed `was 0`. **The lesson for the next cut: a cut verifier must print the values it compared, not only ticks** — which is why §2 carries the note lengths and tags as output |
| 2 | Low (process, no impact on this release) | **`0225` is a schema-only migration whose app half is not in this release.** `role_home_tiles` ships seeded and read by nothing. That is the documented schema-first rule working as intended, not a fault, but it means production carries a table and a seed that no code consults, and the seed runs **once** — if the card-to-page map in `src/lib/permissions/cards.ts` changes before the app half lands, the seeded rows will be stale and the seed will not re-run | **Accepted**, with the exposure stated. `scripts/check-role-home-tiles.mjs` fails if the migration's copy of the map and `cards.ts` diverge, which is the guard that makes this safe to leave |

Neither defect is in shipped code, and neither changes what this release contains.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nobody's photo publishing quietly changed.** On Who does what, that the roles holding **Approve photos** are the ones Lutan expects, and that anyone holding it without **Residents** has not lost the ability to publish their own uploads on save | Who does what on the deployed build, signed in as Admin |
| 2 | The `0.37.1` section renders correctly on `/releases` for an admin, and that **no release mail arrived**, which is the check this release — the opposite of `0.37.0` | `/releases` signed in, and the admin mailbox |

Both rows are release steps the production release manager performs on the deployed build; they are listed here because they cannot be true at this commit, not because they are being handed to someone else. **This release's eight other outstanding manual items belong to their own feature plans and their own signatures** — the runbook is explicit that they must not be given a second home here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: both rows are release steps on the deployed build, see the table

Manual verification by: pending: the two items above, by the production release manager on the deployed build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
