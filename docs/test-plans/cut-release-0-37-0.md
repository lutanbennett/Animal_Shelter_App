# Feature test plan — cut-release-0-37-0

## Header

| | |
|---|---|
| Feature | Cut release `0.37.0`: move the four notes in `unreleased` into a new `0.37.0` entry, **`major: true`**, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/release-0-37-0` @ `C:\Development\Animal_Shelter_release-0-37-0` |
| Dev server | not driven — `/releases` is behind sign-in; see §5 |
| PR | **#731** — guessed at the time of writing and then **re-read from `gh pr view` after opening: the guess was correct.** The last two cuts guessed wrong (#704→#705, #717→#718), so it was written down as a guess and verified rather than trusted. Three wrong in a row did not happen, but the re-read is what established that |
| Tested by / date | Claude (production release manager session) / 2026-10-19 |
| Carries a migration? | no — the release's **three** (`0221`, `0222`, `0223`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the four notes in `unreleased` into a new `0.37.0` entry, **`major: true`** on Lutan's call in chat (2026-10-19), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, filtered by tag. **All four notes are tagged**: three `admin`+`management`, one `admin`+`management`+`doctor`. **Every admin receives mail, because `major: true`** — asserted as `majorReleasesSince("0.36.1")` returning exactly `["0.37.0"]`. This is the **non-inverted** form of the check, the opposite of `0.36.1`'s, and it is the one that matters on a major release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — five things. (a) The wording and tagging of the four notes: written in their own feature PRs (#724, #726, #728, #729), carried across unaltered. (b) **The nine `pending:` manual verifications** on this release's feature plans — they belong to those plans and their signatures; Lutan chose in chat (2026-10-19) to ship with them recorded as stated gaps. (c) **The Cloudflare purge token** still does not exist, so the post-deploy purge is Lutan's from the dashboard and this release costs **three** touches, not two — told to him before the deploy, not after. (d) **Ticking the Doctor role's Book clinic visits card on production** is a click on Who does what, named in #726's own plan, not a release step. (e) **The `.claude/worktrees/` lint collision** found while running the gates (see Defects) is a repo-hygiene item raised on the backlog, deliberately not fixed inside the release

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically — **against `origin/main`'s own copy of the file, imported rather than regex-scraped**, so the comparison is of parsed values including role tags:

```
PASSED:
  - newest entry is 0.37.0 (got 0.37.0)
  - entry is flagged major: true — a MAJOR release (got true)
  - date is 2026-10-19 (got 2026-10-19)
  - unreleased is empty (got 0)
  - note count matches origin/main's unreleased: 4 of 4
  - all 4 notes identical, in order, text and role tags
  - history intact: 52 entries unchanged, +1 new (now 53)
  - every prior entry unchanged and in place
  - every prior entry byte-identical, not merely same version
  - package.json 0.37.0 matches the newest entry
  - majorReleasesSince("0.36.1") = [0.37.0] — MAJOR, so admin mail DOES go out
  - file order is newest-first by compareVersions
  - every note renders, no [object Object] or undefined
  - every role tag is a live role (no retired 'staff' tag slipped through)

notes: 4 | major: true | date: 2026-10-19
lengths: 559, 703, 420, 476
tags : 1:admin+management  2:admin+management  3:admin+management+doctor  4:admin+management

VERDICT: all checks passed
```

**The `majorReleasesSince` assertion is the live one this release.** On `0.36.1` it had to return nothing; here it must return exactly `0.37.0`, because that is the difference between this release and no mail reaching any admin. Asserted mechanically rather than by reading the `major:` flag — and the absence of a mail line in the deploy log would now be the **defect**, which is the reverse of last release.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly; `Already up to date` at `b5032709`, which is the tip this branch was cut from
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 108s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR (runs the same three) — **all 8 checks passing, 0 failing, `mergeStateStatus: CLEAN`** on PR #731. The run's `headSha` was read from `gh run list` and matched against this branch's HEAD rather than taken from the PR bar's cached reading: `success 0dfd2ac9 CI` against `HEAD=0dfd2ac93ecc895c8d764f5d4180abd1d8757da9`. **The first run was green by construction for the fifth release running**, because the plan was written and committed before the PR was opened. This tick is itself a commit, so a second run follows and is expected
- [x] `node scripts/check-release-guards.mjs` — all guards `ok`, exit 0

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's **three** (`0221_photo_approver_guard.sql`, `0222_photo_approver_excludes_retired.sql`, `0223_social_shares.sql`) merged in #721, #724 and #725, are applied to dev, and are applied to production as a release step **before any deploy**.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the release: `origin/main` tops out at `0223`, so the next free number is **`0224`**
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`. Read for the release: production **`221 applied, 3 pending`**; dev `No drift`, 224 of 224. **Note this is three, not one** — the handover's warning that "one migration" can be several, met for real
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. Run for the release against production: **all three `ok`, nothing FAILED.** So of the three possible dry-run outcomes this is the **clean** one — the per-file rollback trap did **not** fire, unlike `0.36.0` and `0.32.1`. The only output beyond that is thirteen expected `-- consumer:` warnings, which are the safe direction (schema landing ahead of code) and which the runner explains itself
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`. Dev holds all 224 with no drift either way (`--drift test`: `No drift: test matches origin/main`)
- [ ] File is re-runnable — `n/a: no migration`. All three state that they are: `0221`/`0222` are `create or replace function` with the same signature and grants as `0194`; `0223` is additive with its undo steps written in its header
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR.` For the release: **no row is written by any of the three.** `0221` and `0222` only add refusal conditions to `set_role_cards()` — read in full, neither writes a cell — and `0223` creates three empty tables plus one activity. There is nothing to back-fill and nothing to mis-read
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`. Exercised on their own branches: `0222`'s refusal was proved on dev in a rolled-back harness (`docs/decisions/2026-10-18-retired-roles-do-not-approve.md`)
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. `0223`'s header names its undo (drop the three tables, two guard functions and their triggers); `0221`/`0222` are undone by re-applying `0194`'s definition
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`, but stated for the release: **`0221`, then `0222`, then `0223`, in that order**, project `dbkodyyxxhtygxcxmfcu`, one run of `node scripts/apply-migrations.mjs --env production`, **after this cut merges and before every deploy**

### The two migrations that recreate the same function — checked deliberately

The handover's item 11b asks, when two migrations in one release touch the same object, whether the later one silently reverted the earlier. **This release has exactly that shape**: `0221` and `0222` both `create or replace function set_role_cards(...)`.

- [x] Both files read in full and compared. **`0222` is `0221` plus one change**, as its own header claims: the two `role_permissions` lookups that ask "does another role approve?" gain a join to `roles` requiring `archived_at is null`. Both refusal messages, the duplicate-card check, the permissiveness rule, the `delete`/`insert`/`recompute` body and the grants are `0221` exactly, and the second lookup is deliberately left unfiltered because it asks about the role being edited. **Nothing from `0221` is lost.** This is the half that `create or replace` would *not* have failed loudly on — a dropped `where` clause goes quiet — which is why it was read rather than assumed

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.37.0` entry with four notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy, and `worker/release-mail.mjs` reads it to decide who is mailed
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a release entry is added once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being empty, which `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the four note lengths were **measured, not estimated**: 559, 703, 420, 476, the longest being the Posted-labels note at **703 characters, the longest note this release and longer than any in `0.36.1`** (whose longest was 575). The role tags were checked against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the order is asserted newest-first across all 53 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all four, and **receives mail**, because `major: true` | asserted via `majorReleasesSince("0.36.1") === ["0.37.0"]`; the presence of the mail line is checked on the deploy in §8 |
| management | `/releases` | sees all four — every note carries `management` | tags asserted value-for-value in §2 |
| second_in_command | `/releases` | sees **none of the four** — no note carries this tag | tags carried across unchanged from the feature PRs |
| head_of_medical | `/releases` | sees none of the four | tags carried across unchanged |
| doctor | `/releases` | sees **one** — the sign-in/home note, which carries `doctor` | tags carried across unchanged |
| volunteer | `/releases` | sees none of the four | tags carried across unchanged |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`. **Worth the release manager's notice: unlike `0.36.1`, no note is untagged**, so 2IC, head_of_medical and volunteer see an empty `0.37.0` section. That is how the feature PRs wrote them and this cut does not alter it
- [x] A role that should not have access is blocked server-side — unchanged: this PR touches no route, middleware or policy

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path — `n/a: release notes are not translated through that path`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff.` The longest note at 703 characters is longer than anything `/releases` has rendered before, which is noted under Left for manual verification rather than claimed as checked
- [x] Browser console clean — `n/a: not driven.` Nothing in this diff executes in the browser beyond the data it renders, asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — the three consumers of this file are checked where they run: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, exit 0), `worker/release-mail.mjs` bundles it to decide the mail, and the Worker answers `/api/releases/current` from it (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is loaded, not read, by all three consumers above
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release-level decision of the day — major rather than minor, against the precedent `0.36.1` set — is recorded in `docs/releases/` with Lutan's reasoning
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the four existing notes out of `unreleased` and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. **Two things deliberately have no note**: the `0223` tables carry no note of their own because the notes describing what they enable were written by the app PRs that read them, and **the vet calendar still has none** — configured on test only, dormant on production (Lutan, 2026-10-17)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every number in this plan is a tool's output: the four note lengths, the 52→53 entry count, production's `221 applied, 3 pending`, the three `ok` dry-runs, and the backup's size and timestamp read from Drive rather than recalled from the previous plan

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted after the merge, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `n/a: not yet — no deploy has run at this commit`

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` The filled copy goes to `docs/releases/`. Both hosts were read before starting and are on a clean `0.36.1` @ `e581c631`, with nobody mid-test
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"`. The one date in it is a literal
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks in §2 are copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked`, on **both** environments, so there is no anonymous public page to re-check. **But the purge itself is not n/a this release**: it is a required runbook step after every Pi deploy, and because `CLOUDFLARE_PURGE_TOKEN` still does not exist (`purge-cache.mjs --dry-run` refuses, naming it), it is **Lutan's from the dashboard**

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet at this commit`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit`
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release. **One is outstanding but is deliberately not a Worker secret**: `CLOUDFLARE_PURGE_TOKEN` belongs in `.env.deploy.production` on the deploy machine, never pushed as a Worker secret (`docs/decisions/2026-10-18-purge-from-the-deploy-machine.md`)
- [x] **The release mail MUST go out, and its presence is the check.** The inverse of `0.36.1`. `majorReleasesSince("0.36.1") === ["0.37.0"]` is asserted above; the deploy log is grepped for `deploy: release mail`, a line **is** expected, and the message is then **found in the inbox rather than inferred from `sent N`**. `skipped 1` for `lannacareforanimals@gmail.com` with `E_RECIPIENT_NOT_ALLOWED` is expected and known

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. **But the release does, and this is the ordering that matters most this time.** `0223`'s own header says "NOTHING IN src/ READS THESE TABLES YET" — that was true when it merged in #725 and is **no longer true**: #728 and #729 have since merged the Posted labels and the meme library, which read all three tables. So `0221`–`0223` apply **before** every deploy, and the dry-run's thirteen consumer warnings are the runner saying exactly that
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — run from the **main checkout** (the worktree has no `.env.deploy.production`, which is itself worth knowing): **all three `ok`**
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **none of the three is destructive or rewriting**: two are `create or replace function` and one creates empty tables. Nothing is dropped and no live row is rewritten, so this gate does not strictly apply. A backup exists regardless: **`lannacare-production-2026-10-17T2000Z.dump.age`, 1,279,505 bytes**, read from Drive rather than recalled. It is the most recent **expected** one — the cron runs 03:00 Thai, so the next is still hours away and nothing has been missed. **It predates all three of this release's migrations**, so a restore would unwind them; they are additive and re-runnable, so re-applying is the remedy. The README restore recipe has still never been exercised — **twelve releases unanswered and still the cheapest item on the outstanding list**
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0221`, `0222`, `0223` in order, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref e581c631` there (a rebuild to `0.36.1`); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts the three migrations**, and all three are additive, so leaving them is harmless: `0.36.1` code neither reads the `social_shares`/`memes`/`meme_residents` tables nor depends on the two new refusal conditions, and no cell is written by either function. **What a rollback does NOT undo: the mail.** `major: true` means every admin is mailed at Lutan's Worker deploy, and that is the one genuinely irreversible step of this release — materially harder to walk back than `0.36.1`, which sent nothing. **And note the ordering risk:** the mail goes out at step 4 of the build order while the Pi builds are step 5, so a failed Pi build leaves the announcement live and the feature not. That is an argument for reading `/api/version` on both hosts promptly, not for changing the order

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low (tooling, not shipped code) | **`node scripts/gates.mjs` fails `lint` in the main checkout, for a reason that has nothing to do with the code.** Two leftover app-cut worktrees under `.claude/worktrees/` — folders git does not track and `worktree.mjs list` cannot see — contained `.next` and `.open-next` build output, and `eslint` walks into them: **2,948 errors and 36,883 warnings, every one of them inside those folders**, and on the first run it exhausted the V8 heap and aborted with exit 134 rather than reporting anything. CI is unaffected because it checks out clean. Removing the build output cleared it (`0 errors`), but `.next` **regenerated**: a three-day-old orphaned `next dev` is still running inside one of them, squatting on port 3000 — its owning session no longer exists. **The misleading part is the shape of the failure**: a release manager meets a red `lint` on `main` with a five-figure error count and an OOM abort, which looks like a catastrophe in the code and is entirely a stale folder | **Deferred to backlog** — `eslint` should ignore `.claude/worktrees/`, and the orphaned dev server needs stopping. Deliberately **not** fixed in this release: an eslint-config change is its own PR with its own plan, not a release step. **Verified not to affect the release**: gates in this cut worktree (outside the main checkout) are fully green, `typecheck=0 lint=0 test=0 build=0`, and CI is green on `main` at `b5032709` |
| 2 | Low (process, no impact) | **A `git merge backlog` was left mid-conflict in the main checkout**, blocking every git command there with `you need to resolve your current index first`. Both conflicts were the known shape — PRs #723 and #726 ticked items while the backlog branch added six new dry-run findings above them | **Fixed** in `6539dcb0`. Resolved by keeping the new backlog items and `main`'s ticked versions of the two shared items; verified as a clean union — **14 insertions and 0 deletions against `main`** (nothing lost) and only the 6 tick lines differing from `backlog` |

Neither defect is in shipped code, and neither changes what this release contains.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.37.0` section renders correctly for an admin, and the **703-character Posted-labels note** — the longest this file has carried — does not overflow at 375 px | `/releases` on the deployed build, signed in |
| 2 | The release mail **arrived** in the inbox, not merely that the log said `sent 1` | `lutan.bennett2@gmail.com` |

Items 1 and 2 are release steps the production release manager performs on the deployed build; they are listed here because they cannot be true at this commit, not because they are being handed to someone else. **This release's nine other outstanding manual items belong to their own feature plans and their own signatures** — the runbook is explicit that they must not be given a second home here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: two rows are release steps on the deployed build, see the table

Manual verification by: pending: the two items above, by the production release manager on the deployed build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
