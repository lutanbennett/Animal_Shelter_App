# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.6` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-6` @ `C:\Development\Animal_Shelter_cut-release-0-47-6`, port `3006` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-20 |
| Carries a migration? | **the cut does not; the release carries FIVE** — `0422`–`0426`, pending on production and UAT, already applied on dev |
| Tested at SHA | `8968624b7` (the cut commit); the release range is `a06322eea..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.6` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.6`, and the two notes already sitting in `unreleased` move across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **Both notes are `admin: true`**, so only Admin sees them; a card-holding login sees the `0.47.6` heading and title with nothing beneath, and the signed-out public does not reach `/releases` at all
- [x] Out of scope — **the five migrations, all three Worker deploys and all three Pi builds are the release, not the cut.** No application code was written here

### What is different about this cut, and it is the ORDINARY case for once

**`unreleased` was NOT empty.** Two streams wrote notes in their own PRs, which is the route the procedure
describes and the route that failed completely one release ago. `0.47.5`'s cut had to write its own notes
because eleven streams and 23 PRs had produced none; here two of eleven PRs produced two, both
`admin: true`, and the cut had nothing to invent.

**One consequence worth stating, because two releases running had to work it out from scratch:**
`--verify` was run against **plain `origin/main`** and all 17 assertions passed. The procedure's
base-building step is needed only when the cut itself publishes a note added in the same PR. This cut adds
no note, so `origin/main:src/lib/releases.ts` *is* the pre-cut state, which is what
*"base unreleased was not empty"* and *"nothing invented (note count equal) [2 vs 2]"* are asserting.

### The two notes, and who can act on each

1. **A product administrator can create a shelter's first Admin login** (#1750), with a temporary password
   shown once, instead of needing a developer. This closes `#flogn`, which the `0.47.5` handover named as
   the clearest next job and as needing Lutan's decision first — he gave it, and the stream built it.
2. **A Website save on a shelter with no website-settings row now says so** (#1747), and says to ask the
   product administrator, instead of reporting a save that kept nothing.

Both are tagged `admin: true` rather than carrying a card tag, matching the two notes `0.47.5` shipped
about the same console.

### The note that was considered and NOT written

**`#plhbd` — the `cooperjaidee.org` fault Lutan found minutes after the `0.47.5` deploy**, where every
button on the new platform address was refused while every page rendered. Its fix is in this release
(#1749). Its own plan answers the release-notes line `n/a` on the grounds that **nobody at the shelter can
reach `cooperjaidee.org`**, which is true: it is the platform front door and has one user. `0.47.5`'s
published note already told Admin the new address needs its own set-up before it will open, and that
remains true rather than becoming false. A third platform-console note would reach every shelter Admin
about an address none of them can open.

**Recorded because the judgement could go the other way** and the next release manager should not have to
re-derive it: the fault was real and user-visible *to the one person who reads it*, and he already knows,
having found it himself.

### Lutan was asked nothing, because he had already answered

He said *"lets do a minor release no email, gaps in tests noted"*. **The procedure is explicit that the
version is derived from the mail answer and never from the word "minor"**, which means different things on
the two sides of the conversation. No mail → `major: false` → the last number moves → `0.47.5` → `0.47.6`.
Asserted in §2 by the mail-absence assertion rather than inferred from his sentence.

**"Gaps in tests noted" is also an answer**, and §3 of the procedure would otherwise stop the release on
it: **seven of the eleven PRs' plans carry a `pending:` manual verification line.** They are listed under
*Left for manual verification* below and carried into the release record as stated gaps, which is what his
sentence authorises.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `125fce60f` by `worktree.mjs new`, and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 71s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 371s
=== gates: test — npm test
=== gates: test exited 0 after 59s
=== gates: build — npm run build
=== gates: build exited 0 after 170s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] `node scripts/check-release-order.mjs --env production --worker-deployed a06322eea` — `no guarded migration is pending here, nothing to prove`. **See §3 for what that does and does not cover: `0426` has the opposite ordering requirement and the guard does not model it**
- [x] **`node scripts/cut-release.mjs 0.47.6 2026-11-20 minor --verify` — all 17 assertions pass, against plain `origin/main`**

```
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   releases are in compareVersions order, newest first
ok   package.json version equals the newest entry  [0.47.6]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.6 / root 0.47.6 / package.json 0.47.6]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### Before the deploy (the two checks the procedure puts here)

- [x] **`npm run audit:prod` / `npm run audit:register`** — `audit:register` exits **0**: *"1 high/critical advisory, all registered and still unreachable"*, the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`. **Recorded as "clean against the register", not as "clean"**: raw `audit:prod` exits 1 and prints 5 vulnerabilities (1 moderate, 4 high), all the same registered `glob`/`minimatch` chain through `@opennextjs/cloudflare`. **Both glob ids are on the register** — `GHSA-5j98-mcp5-4vw2` and `GHSA-3g3m-2fjr-6pw4`; the script reports one because npm's JSON collapses them onto one `via` entry, so nothing is unregistered either way
- [x] **`node scripts/check-dev-aal2-absent.mjs --env production`** — exit 0. Six static proofs plus a live read: production holds no `dev-signin-*` login, and no migration after `0411` alters either aal2 policy (427 files read)
- [x] **`node scripts/check-dev-aal2-absent.mjs --env uat`** — exit 0, the same eight lines against `fsjagxmxjosauwmxwype`

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** The five the release ships were written and applied to dev by their own PRs
- [x] **All five pending files were read for a consumer header, and all five have one** — `0422` says `consumer: none`; `0423` names `scripts/dev-signin.mjs`; `0424` and `0425` name `src/app/platform/`; **`0426` names `worker/shelter.mjs`**, which is the one that matters below
- [x] **Both deploy databases read before the cut, and these figures are the measurement the record will carry**

```
production (dbkodyyxxhtygxcxmfcu)  422 applied, 5 pending, 0 drift either way
uat        (fsjagxmxjosauwmxwype)  422 applied, 5 pending, 0 drift either way
test/dev   (qxkmhwybjggxvsfxsxbd)  428 applied, 0 pending, ONE stale row — see below
```

- [x] **Dev carries one stale `schema_migrations` row and production does not.** Dev shows `0422_keep_an_admin_per_shelter.sql` applied with no such file on `main`: a stream applied that migration to dev as `0422`, then renumbered it to `0423` when it collided, and `0423` is applied too. **The SQL ran twice under two names, which is harmless because every file here is written to be re-runnable** — and it is the mechanism `CLAUDE.md` describes for a renumbered file. **Nothing to do on production**, which never saw the old number. Recorded so the next `--status` read of dev is not mistaken for drift in the release

### `0426` MUST BE APPLIED BEFORE THE WORKER, AND NO GUARD ENFORCES THAT DIRECTION

- [x] **Read in the Worker source, not assumed.** `worker/shelter.mjs` calls `resolve_shelter_site(p_host)` (new in `0426`) over REST. If that function does not exist the RPC answers 404, `!res.ok` is taken, and the lookup returns `{ id: null, site: null }` — so **the request goes to the app with no `x-shelter-id` header at all**. Since `0392`'s per-shelter policies, no shelter header means no rows: the public website blanks and a signed-in page reads empty
- [x] **The ordinary release order already prevents this** — section 5 (migrations) runs before section 6 (deploys), and that is the order this release follows: `0422`–`0426` onto production and UAT first, then the three Worker deploys
- [x] **But `check-release-order.mjs` does not model this direction.** It guards only `MUST_FOLLOW_WORKER` (`scripts/lib/release-order.mjs`), for migrations like `0392` that must come *after*; it answered *"no guarded migration is pending here"* for a release in which one migration must come *before*. **The guard is not wrong, it is silent**, and its silence reads as "order does not matter here". Filed as a defect below with a backlog item
- [x] **Applying `0422`–`0426` before the deploy is safe for the code that is live now.** All five add tables, columns or functions, or widen a refusal; `0.47.5`'s running code calls none of the new functions, and `0426`'s own column defaults Lanna's existing row to `'open'`, so the one live shelter's website behaves exactly as it does today

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.5")` is `[]`, and the control assertion shows the same function still finding `0.47.0` from further back, so the empty answer is the flag being `false` rather than the function being broken
- [ ] **A signed-in browser read of `/releases`** — pending: the shape is identical to the last two cuts, which measured it, and `dev-signin.mjs admin` now breaks with `PGRST116` once two shelters each hold a role keyed `admin` — the state dev is in, and a known gap carried in the `0.47.5` handover. Lutan is Admin on production, where it is checked after the deploy
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged, and both notes being `admin: true` is asserted by the character-identical carry

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and two notes. No nav entry, no manual topic, and the notes are English, as every release note is

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites**, and `check-release-guards.mjs` exercising it at exit 0 is the check that it still loads
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. The items its contents close were ticked by their own PRs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up**, and the one judgement worth keeping (the `#plhbd` note declined, §1) is recorded here and carried into the release record
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker requires `unreleased` to have *gained* a line, and a cut's whole purpose is to empty it. The two notes were gained in #1747 and #1750, and are listed in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the two notes from the file itself; the 11 PRs from `release-prs.mjs` at exit 0; the three databases from `--status` on each; the consumer headers from `head -3` on all five files; the Worker's 404 path read in `worker/shelter.mjs`; the advisory from `audit:register`'s exit code; the 17 assertions and the four gate numbers from the runs pasted above

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` on all four hosts
- [x] **The baseline before this release was read on all four**, and all four agreed: `0.47.5` at `a06322eea59913ca96cdd36a91d8911abd38eddf`, on `lannacareforanimals.org`, `test.lannacare.org`, `uat.lannacare.org` and `cooperjaidee.org`
- [x] **What this release is actually for, besides the two notes:** the `#plhbd` fix. `cooperjaidee.org`'s allowed origins are baked at **build** time, so the fix cannot take effect from a dashboard or a restart — it needs this cut merged, three Pi rebuilds and the production Worker deploy. **The only honest verification is the saving proof** `docs/domain-checklist.md` section F asks for, done afterwards, and it needs Lutan
- [ ] Smoke test / UAT project line — n/a: nothing is deployed by a cut, so there is nothing to smoke-test at this commit. `docs/release-smoke-test.md` is run after the three deploys and copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.5` and the two notes back into `unreleased`; nothing is deployed by the cut, so there is nothing live to undo. **After the deploy the position is different and worth knowing now:** the five migrations are additive or widen a refusal, so `0.47.5`'s code runs against the `0.47.6` schema — **but a Worker rolled back to `0.47.5` while `0426` is applied is still fine, because `resolve_shelter_host` is kept alongside the new function.** The direction that breaks is the other one, and §3 covers it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (release safety) | **`check-release-order.mjs` models only migrations that must FOLLOW the Worker.** `0426` must *precede* it — the Worker's lookup of a missing `resolve_shelter_site` returns no shelter id, and since `0392` no shelter id means no rows — and the guard answered *"no guarded migration is pending here"*, which reads as "order does not matter" | **recorded, not fixed here.** The ordinary order satisfies it and this release follows that order; the risk is a Worker deploy made without the migration, such as a hotfix between releases. Backlog item filed |
| 2 | low (measurement) | **`check-deferred-notes.mjs` still ignores the commit range and prints the test-plan template's own guidance as several plans' "reason"** — 75 plans read for a range of 11 PRs, and 7 of the 20 candidates are that parse artefact | **recorded, not fixed**, third release running. The gate is right to refuse until reviewed; the noise is in what the plans quoted |
| 3 | low (bookkeeping) | **Dev's `schema_migrations` holds a row for a file that no longer exists** (`0422_keep_an_admin_per_shelter.sql`, renumbered to `0423`), so a dev `--status` read shows a drift line for a release that has none | **recorded in §3.** Harmless: the SQL is re-runnable and ran twice under two names. Nothing on production or UAT |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The saving proof on `cooperjaidee.org`** — sign in, do the authenticator step, save a web address on a test shelter. This is the only check that proves the `#plhbd` fix, because the page renders either way | `cooperjaidee.org`, after the Pi rebuild and his Worker deploy | **Lutan's.** Carried from `platform-host-build.md`, where it is the plan's own `pending:` line |
| 2 | **The new Admin login's first sign-in**, and a phone-width look at the platform console | `cooperjaidee.org` | **Lutan's.** `padmin-create-login.md`'s `pending:` line |
| 3 | **A person pressing the console as a signed-in product administrator** (the lookup audit row) | `cooperjaidee.org` | **Lutan's.** `lookup-audit-row.md`'s `pending:` line |
| 4 | **Save on a shelter's Names form** | `cooperjaidee.org` → a shelter → Names | **Lutan's.** `shelter-own-name.md`'s `pending:` line |
| 5 | **A website save in the browser** on a shelter with no settings row — the message the second release note promises | the app → Settings → Website | **Lutan's.** `website-silent-writes.md`'s `pending:` line |
| 6 | **The two-shelter public-site check on the test Worker** | `test.lannacare.org` | **open.** `public-site-per-shelter.md`'s `pending:` line. Not attempted here: the second shelter's website state is set by nothing in the app yet |
| 7 | **Reading the onboarding runbook once and taking its Steps 2, 3 and 8**, which only he can | the runbook | **Lutan's.** `onboarding-rehearsal.md`'s `pending:` line |
| 8 | **`/releases` read signed in as Admin**, to see the two `0.47.6` notes as a person sees them | `lannacareforanimals.org/releases` | **Lutan's.** Claude has no account on production; carried on every release |

**All eight are shipped as stated gaps on Lutan's instruction tonight — *"gaps in tests noted"*.** None is
a defect in the code; each is a press only a signed-in person on a deployed host can make.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — gates, the 17 cut assertions, `check-release-guards`, `check-release-order`, `check-test-plan`, `audit:register`, both `check-dev-aal2-absent` runs, and the three database reads
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: all eight items need a deployed host, and seven of the eight only Lutan can press; only the person who looks may tick this

Manual verification by: pending: Lutan, after the deploy — the saving proof on `cooperjaidee.org` above all, which is the only check that proves this release's `#plhbd` fix, plus `/releases` as Admin, which Claude has no account on production to do

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the deploy steps follow this PR's merge

Result: pass with accepted defects
