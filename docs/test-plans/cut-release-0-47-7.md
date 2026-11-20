# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.7` — **it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-7` @ `C:\Development\Animal_Shelter_cut-release-0-47-7`, port `3005` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-20 |
| Carries a migration? | **No, and neither does the release** — production and UAT are both at 427 applied, 0 pending |
| Tested at SHA | the cut commit on this branch; the release range is `8b071e47d..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.7` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.7`, and the one note sitting in `unreleased` moves across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note carries no `admin` flag and no role tag**, so it reads as everyone's, which is the safe default this repo uses
- [x] Out of scope — **the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### WHY THIS CUT EXISTS, WHICH IS UNUSUAL AND WORTH STATING

**It was cut to unblock UAT, not because a release was due.** `#uatsb` left UAT refusing every sign-in
because its Worker had no `SUPABASE_URL`; the fix merged yesterday as #1765, and the UAT Worker deploy
that makes it take effect is a Claude session's job (`docs/release-procedure.md` line 64). **That deploy
refused:** `deploy.mjs` ships only a written-down release to UAT and production, and
`src/lib/releases.ts` still had one note in `unreleased` from #1766. **So the cut is the thing standing
between UAT and a working sign-in**, and that is the whole reason for its timing.

**WHAT THIS RELEASE DOES NOT INCLUDE, AND IT MATTERS:** the **production** Worker deploy is Lutan's
command and his alone (his instruction of 2026-10-02). **He has not asked for it and nothing here
schedules it.** `0.47.7` will be live on UAT and not on production until he runs it, which is an ordinary
state, not a gap — and it is recorded here so the release record does not read as half-finished.

### The one note, and who can see it

**"A shelter's adopt page no longer offers another shelter's email address: with no phone or email set,
the Book a visit button is simply not shown. The header shows your own shelter's short name, and the
Security code prompt no longer names a shelter."** (#1766, `#lnlft`.)

**It is untagged, so every role sees it**, which is correct: it is about a shelter's own public page and
its own header, not an admin screen. **A second shelter is who it is for** — Lanna's own pages read the
same before and after, because the leaked address was Lanna's.

### Lutan was asked, and asked about the EMAIL rather than the words

The procedure is explicit that *"major or minor"* means different things on the two sides of the
conversation, so **the question named the consequence instead**: the recommended option said a patch
*"does not mail your admins"* and the alternative said it *"DOES mail every admin and cannot be
undone"*. **He chose the patch.** No mail → `major: false` → the last number moves → `0.47.6` → `0.47.7`.
**Asserted in §2 by the mail-absence pair, not inferred from his words.**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 208s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 396s
=== gates: test — npm test
=== gates: test exited 0 after 42s
=== gates: build — npm run build
=== gates: build exited 0 after 306s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.47.7 2026-11-20 minor --verify` — all 17 assertions pass, against plain `origin/main`**

```
ok   new entry is the newest and has the requested version  [0.47.7]
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   package.json version equals the newest entry  [0.47.7]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.7 / root 0.47.7 / package.json 0.47.7]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

- [x] **The base was plain `origin/main`, and that is correct here** — the procedure's base-building step is needed only when the cut itself publishes a note added in the same PR. **This cut adds no note**, so `origin/main:src/lib/releases.ts` *is* the pre-cut state, which is what *"base unreleased was not empty"* and *"nothing invented (note count equal) [1 vs 1]"* assert
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The deferred-note review, which refused the cut first

**`cut-release.mjs` refused before writing a byte:** 22 PRs had answered the release-notes line `n/a`
with a reason that points at a step still to happen. **All 22 were read.** The full answer is in the
cut's own output and in the commit message; the shape of it:

- **Nine are a parse artefact** — their `n/a` reason quotes the release-note truth rule itself, so the
  scanner sees the rule's own words. Each is a script, a schema half, or the product-admin console,
  which one person reads.
- **Six are release records or handovers**, which are not served, imported or rendered.
- **Two say their note was ticked and shipped in their own PR.**
- **Two had a REAL pending condition and were read rather than waved through.**
  **`public-site-per-shelter`** said *"production still owes migration `0426` before the Worker that
  sends the header is deployed"* — **and `0426` WAS applied to production yesterday**, so that half has
  closed. Its second half has not: nothing in the app sets a shelter's website state yet, and
  `PUBLIC_SITE` is `locked` on production, where the public site is still the under-construction page
  (`#pl7aq`). **So no shelter user can see a difference and no note is owed yet.**
  **`stocktaking-silent-save`**'s new message only appears for a shelter with a missing row, and `0417`
  backfilled every one, so still nobody would see it.
- **`calendar-connect-screen` remains open** on `#drvcl`, which needs Lutan to create a new Web OAuth
  client — he chose the narrow-scope shape this morning, and that is recorded on the item.

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration, and neither does the release**
- [x] **Both deploy databases read before the cut**, and these figures are the measurement the record will carry

```
production (dbkodyyxxhtygxcxmfcu)  427 applied, 0 pending, 0 drift either way
uat        (fsjagxmxjosauwmxwype)  427 applied, 0 pending, 0 drift either way
```

- [x] **So the migration-ordering trap that dominated `0.47.6` cannot arise here.** `0426` — the one whose absence blanks the public website, because `worker/shelter.mjs` calls `resolve_shelter_site()` — **is already applied on both.** There is no pending file in either direction, so `check-release-order.mjs` has nothing to model and its silence means what it says this time

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.6")` is `[]`, and the control assertion shows the same function still finding `0.47.0` from further back, so the empty answer is the flag being `false` rather than the function being broken
- [ ] **A signed-in browser read of `/releases`** — pending: Lutan, after a deploy. The shape is unchanged from the last three cuts, which measured it, and `dev-signin.mjs admin` is still broken on dev with `PGRST116` now two shelters each hold a role keyed `admin` — a known gap carried since the `0.47.5` handover
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged, and the one note being untagged is asserted by the character-identical carry

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and one note. No nav entry, no manual topic, and the note is English, as every release note is

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites**, and it was exercised for real: `deploy.mjs --env uat --plan` loaded this file and reported the unreleased note before the cut, and `check-release-guards.mjs` at exit 0 after it
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. The item its one note closes (`#lnlft`) was ticked by #1766
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The one judgement worth keeping is the deferred-note review in §2, and it is recorded here and in the commit
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The note was gained in #1766 and is quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note from the file itself; the two database figures from `--status` on each; the four live versions from `/api/version` on all four hosts; the 17 assertions and the four gate numbers from the runs pasted above; the UAT refusal from `deploy.mjs --env uat --plan`, which is what started this

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version`
- [x] **The baseline before this release was read on all four hosts, and all four agreed:** `0.47.6` at `8b071e47dc9a8a56d42978ad2f584099dbd5fbe2`, on `lannacareforanimals.org`, `test.lannacare.org`, `uat.lannacare.org` and `cooperjaidee.org`
- [x] **What this release is for:** letting the UAT Worker deploy run at all, so `#uatsb`'s fix takes effect and UAT sign-in works. **The only honest proof of that is a pressed sign-in on UAT**, which needs a person with an account there
- [ ] Smoke test / UAT project line — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the UAT deploy and is copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.6` and the note back into `unreleased`; **nothing is deployed by the cut, so there is nothing live to undo.** After the UAT deploy the position is still mild: no migration is involved, so `0.47.6`'s Worker and `0.47.7`'s run against an identical schema, and a Worker rolled back to `0.47.6` on UAT simply loses the `SUPABASE_URL` fix and refuses sign-in again — the state UAT is in today

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (measurement) | **`check-deferred-notes.mjs` still prints the test-plan template's own guidance as several plans' "reason"** — nine of this cut's 22 candidates are that parse artefact, and it is now the fourth release running | **recorded, not fixed.** The gate is right to refuse until a person has reviewed; the noise is in what the plans quoted. A backlog item exists for the scanner |
| 2 | low (release safety, noted not met) | **`deploy.mjs`'s "written-down release" guard is the only thing that stops a Worker deploy of unreleased code, and it is what made a one-command UAT fix into a release cut** | **working as designed, recorded because it surprised the planner.** It is the guard behaving correctly: UAT is *"part of the release"*, so it ships releases |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **A pressed sign-in on UAT** — the only proof that `#uatsb` is actually fixed. A database read and `check-deployed-hosts.mjs` both passed while every sign-in was refused, which is exactly why this has to be a press | `uat.lannacare.org` after the UAT Worker deploy | **Lutan's.** Claude has no account on UAT |
| 2 | **`/releases` read signed in as Admin**, to see the `0.47.7` note as a person sees it | a deployed host | **Lutan's.** Carried on every release |
| 3 | **The adopt-page fix itself on a second shelter** — the note's own claim | a second shelter's adopt page, once one is published | **open.** No second shelter has a published public site (`#pl7aq`), so there is nowhere to look yet. Carried from `lanna-leftovers.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, both database `--status` reads, and the four `/api/version` reads
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan, after the UAT deploy. The sign-in press above all, which is the one check that proves what this release is for; only the person who looks may tick this

Manual verification by: pending: Lutan — a pressed sign-in on `uat.lannacare.org` after the Worker deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session deploys UAT after the merge; **the production deploy is Lutan's command and is not part of this release's plan**

Result: pass with accepted defects
