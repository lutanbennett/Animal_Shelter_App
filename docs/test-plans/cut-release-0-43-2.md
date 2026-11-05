# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.43.2`: move three notes into a new entry, empty `unreleased`, bump `package.json` and the lockfile's stale version field. `minor` — **it does not mail**, on Lutan's instruction. **This release is also the DOMAIN CUTOVER**: `main` already carries #1295, so deploying it moves production to `lannacareforanimals.org` and makes `lannacare.org` a UAT site on the dev database |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item. The cutover itself is `#ki6cx`, closed by the deploy rather than by this PR |
| Branch / worktree | `claude/cut-release-0-43-2` @ `C:\Development\Animal_Shelter_cut-release-0-43-2` |
| Dev server | not started — n/a: the cut changes three data files, `src/lib/releases.ts`, `package.json` and `package-lock.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — `0317_expense_report_card.sql` came in with #1303 and is applied from the main checkout at step 5, after this PR merges and before either deploy |
| Tested at SHA | `2bce6ec2` — the second cut commit. The first (`ef2fe53f`) failed the gates and was reverted; see Defects 2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — three notes sit in a new `0.43.2` entry dated 2026-11-05, `major: false`, and `package.json` and `package-lock.json` follow
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, `package-lock.json`, this plan. Nothing else
- [x] Cards affected identified — **none changed by this PR.** Two of the three notes carry tags (`view_expenses`, and one `admin: true`), which decide only who is *shown* a line; the third is deliberately untagged. The `view_expenses` card itself is created by `0317`, not here. Admin sits outside the card system and sees every line
- [x] Anything explicitly **out of scope** written down — (a) migration `0317`; (b) every step of `docs/domain-checklist.md` section E, which is the deploy and is where the real risk of this release lives; (c) both Worker deploys, both Pi builds, the tunnel header change, the two cache purges and the smoke test; (d) the release record, written after the deploy; (e) **the four plans in this range signed `pending:`**, which belong to their own plans and are listed under Defects rather than resolved here, on Lutan's instruction that they be recorded as open

### The risk that dominates this release, and it is not the cut

**The cut is routine. The deploy is not.** `main` is at `8820abf8`, which is #1295, the cutover commit — merged this afternoon despite its own title saying `DO NOT MERGE YET`. Merging it deployed nothing, by design, and the live site is still serving `0.43.1`. But **every deploy from this `main` performs the domain cutover**, so this release cannot be shipped as a routine release:

- `scripts/check-site-hosts.mjs` prints `all right` and its own self-proof confirms the file is in the complete cutover state: production's routes and `APP_HOST`/`PUBLIC_HOST` are `lannacareforanimals.org`, the `uat` block holds `lannacare.org` and `www`, and the tunnel presents the new host.
- Deploying the Worker before the Pi, or before the Supabase Site URL moves, breaks sign-in and Server Actions on the live site. The runbook's order exists for that reason and **each step's proof must pass before the next starts**.
- This was raised with Lutan before anything was cut, with the alternative of cutting today and deploying tomorrow in the runbook's order. **He reaffirmed: cut now, deploy straight after.** That is recorded here because it is the decision the release turns on.
- A peer session (`Migration to Lannacareforanimals`) reached the same conclusion independently, has deployed nothing and is standing down. Its first-hand readings of the Thursday steps are in the record.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-2` from a freshly fetched `origin/main` (`8820abf8`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from this commit and merged on green, on its own head commit read from `gh run view --json headSha`

### Evidence

```
=== gates: typecheck exited 0 after 8s
=== gates: lint exited 0 after 118s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 61s
gates: typecheck=0 lint=0 test=0 build=0
```

`lint` reported **79 problems, 0 errors, 79 warnings** — pre-existing unused-variable and unused-`eslint-disable` warnings across `scripts/` and `src/`, none introduced by this PR, which touches no code. Warnings do not fail the gate and its exit code was 0. The same count as the previous release.

**The first run of these gates was red**, and the four-number line is the only place that said so: `gates: typecheck=2 lint=0 test=0 build=1`, while the runner's own exit code was **0**. See Defects 2.

**All four numbers read from the script's own output, from a full log in the scratchpad rather than a `tail`** — the trap the runbook names, and it bit this release once already (below).

`node scripts/check-release-guards.mjs` **exit 0** — **16** assertions `ok`, ending `--drift reads the arrays it prints from driftReport()`. The count is `grep -c "^ok"` on the full log, and it matters: a `tail -12` of the same run showed twelve and **was** written into the first draft of this plan as twelve. The previous release's plan warned about exactly this with a `tail -15`. Four releases of warning and it still had to be caught by counting.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.43.2 2026-11-05 minor --verify --base 4af447f9` — **all 16 assertions passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.43.2]
ok   new entry has the requested date  [2026-11-05]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.43.1 -> 0.43.2]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [3 vs 3]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.43.2]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.43.0 in ["0.43.0"]]

all 16 assertions passed
```

**`--base` was needed again, for the third release running**, because one of the three notes was written on this branch — first in `0c8969cb`, then corrected in `4af447f9`, which is the base used. Against `origin/main` the *character-identical* assertion would have failed by construction and said nothing about the two notes that did come from their streams. The handover predicted this; it is now three for three.

**The mail check is the absence-plus-presence pair**, because an always-empty `majorReleasesSince()` would satisfy either half alone. This release does **not** mail, so the absence assertion is load-bearing — `majorReleasesSince("0.43.1")` is `[]` — and the control proves the function still finds a major release when there is one.

### Why `0.43.2` rather than `0.44.0`, and why no question was asked this time

His instruction was *"Lets do a minor release no email to be sent"*. **The runbook's trap is in those words, and this time he removed it himself**: he said *no email* in the same breath as *minor*, so the question the runbook prescribes — *should this release email you?* — was already answered, and asking it again would have cost him a touch for nothing.

That leaves only the derivation, which is the runbook's to make and not his: `releases.ts`'s own numbering comment and step 4 both say a mailing release bumps the middle number and anything else the last. No email therefore means **`0.43.2` with `major: false`**, not `0.44.0`. Read at face value, *"minor"* alone would have produced a middle-number bump, which in this repo is the shape that mails — the exact failure `0.43.1`'s record describes. **Stated here in one line because the number differs from the word he used, and he should not have to discover that from a tag.**

### The deferred-note review, and the one note written here

`node scripts/check-deferred-notes.mjs` listed **25** candidates over `45c6513c..HEAD`, a base that predates `0.43.1`; `cut-release.mjs` refused to write until a review was supplied. The full text went to `--deferred-reviewed` and is in the commit message and the PR body.

**Exactly one names a step this release closes, and it is the cutover itself.** `docs/test-plans/cutover-2026-11-06.md` answered its release-notes line `n/a: merging deploys nothing; the cutover release's notes are written in its cut`. **This release is that cut**, so under `docs/decisions/2026-10-11-release-note-truth-rule.md` the note belongs here. It was committed **before** the cut, as `0c8969cb` and then `4af447f9`.

It is deliberately **untagged**. Every signed-in person needs the new address, so widening is this repo's safe default and a card tag would hide it from exactly the people who must read it. **Untagged means a plain string**, not `{ text }` — `ReleaseNote` is `string | {text, cards} | {text, admin: true}` and the file's own comment says *"Untagged reads as everyone"*. The first attempt got the intent right and the form wrong, and typecheck caught it (Defects 2).

**`accountant-card-expenses` (#1303) is the second real one and needed nothing**: its note was already in `unreleased`, withheld until `0317` reached production. This release applies `0317`, so the note becomes true at the moment it becomes visible — which is the rule working as written, not a coincidence.

**`manual-pdf-prebuilt` (#1306)** likewise already had its note in `unreleased`.

**`deceased-visit-app-half` (#1302) owes nothing**, and its reason is stale rather than open: the PR touches `docs/backlog.md`, a decision file and its own test plan and **no `src/` at all**, so there is nothing a user could notice; `0310` reached production in `0.43.0` in any case. Read in the plan rather than in the script's excerpt, which is what the handover asks for.

**The rest are the boilerplate case four handovers have now warned about** — the excerpt prints the plan template's own guidance instead of a reason — or fall outside this release's range and were answered by earlier cuts. `cutover-rehearsal` stays correctly open: the Drive cutover has not happened.

**The three notes were read as a set, not one at a time.** None contradicts another: the Expenses note names the card that opens the page, the manual-PDF note is `admin: true` and describes a server-side change, and the address note touches neither. Worth stating because **no check looks for a contradiction between notes.**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. For the record: `0317` is the highest on `main` and the next free number is `0318`. Nothing is applied that has no file (`applied here, no file on origin/main: 0`)
- [x] `--status` reviewed before applying — production reads **317 applied, 1 pending** (`0317_expense_report_card.sql`) against `origin/main 8820abf8`
- [x] `--dry-run` reviewed — run early, from the main checkout, rather than left to the apply step: **`dry-run 0317_expense_report_card.sql … ok`**. Four `-- consumer:` warnings, all the safe direction (the schema lands before the code that reads it). One of them is itself a cutover artefact worth recording: the script could not ask the live release which commit it is on, because it now asks `https://lannacareforanimals.org`, which nothing serves yet — so it assumed the cut commit is live. Harmless here, and the first visible sign that the tooling has already moved to the new host
- [ ] Applied to **dev** — n/a as this PR's step: `0317` was applied to dev by its own stream (#1303)
- [x] File is re-runnable — read rather than assumed: `0317` is additive (one activity, the `view_expenses` card, two `security definer` functions, and `bill_owner_can()` rebuilt from `0308` with one read-only widening), with no `drop`, `delete`, `truncate` or column alter, and four `if not exists` / `or replace` guards
- [x] Existing rows still read correctly — nothing is rewritten. The one behaviour change to an existing function is a **read** permitted to a new card holder; every write path is unchanged
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR; #1303's plan records its own harness
- [x] Production apply plan stated — `0317` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **after this PR merges and the checkout is pulled, and before any deploy**, because this release carries the page that reads it. `check-production.mjs role-cells` and `role-cards` taken before and re-run after, since `0317` **does** add a card and an activity and the pair should therefore change by exactly that much
- [x] Card compliance read, not assumed — `0317` grants through a card (`view_expenses` holding `reports.expenses` at `read`) and both new functions ask `has_permission('reports.expenses','read')` before touching a bill table. No role key appears in it

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `build` compiled `/releases` with the new entry in place
- [x] Data persists — the entry is in the committed file and `latestRelease` resolves to it, both asserted
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real: `cut-release.mjs` **refused to write** at the deferred-notes guard until all 25 candidates were answered
- [x] Boundary cases checked — the version boundary both ways (`0.43.1 -> 0.43.2` is newer, file order still matches `compareVersions`) and the mail window from both ends
- [ ] `/releases` driven in a real browser — n/a: not driven. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed in this PR. Reported by card rather than by role, as `CLAUDE.md` requires.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | `/releases` | all 3 notes — Admin sits outside the card system and sees every card-tagged line, and the `admin: true` line too | n/a: no gate changed |
| holds `view_expenses` (after `0317`) | `/releases` | the Expenses note, plus the untagged address note | n/a: no gate changed |
| holds none of the tagged cards | `/releases` | the address note only — and **not** the `admin: true` manual-PDF line | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed by this PR
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change: release notes are English prose in `src/lib/releases.ts`, not translatable labels. One of the three says in its own wording that its Thai has not been read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `build` compiled `/releases` and `/api/releases/current`, the two readers of this file. A malformed entry fails `typecheck`
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. **The third is the one that matters, because this release must NOT mail**, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls. `package-lock.json`'s other reader is `npm ci`, which now sees it agree with `package.json` where before it did not
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` at `8820abf8`
- [x] `npm ci` in the main checkout — **deliberately not re-run, with a reason.** `git diff beabcf7f..HEAD -- package.json package-lock.json` is **empty**, so no dependency moved in this release; the installed tree there is the 484-package, `next@16.4.2` tree that `0.43.1` repaired with `npm install` and then proved with a successful `npm run build`. Re-running `npm ci` would have re-courted the `EPERM` that bit that release for nothing. The `Next.js version :` line on the first Worker build is still read against `package.json`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item. `#ki6cx`, the cutover, is closed by the deploy and is ticked in the record PR
- [x] Non-obvious design choices recorded — why the version is `0.43.2` and not `0.44.0`, why `--base` was needed, why the new note is untagged, why `npm ci` was skipped, and why the lockfile's version field moved by hand, are all in this plan and the commit messages
- [x] `README.md` still accurate — it names no version, and #1295 already updated its environments table
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The one note written on this branch is a deferred note whose step this release closes, which is the one case the runbook puts in the cut
- [x] Commit messages say why, not just what — one explains the deferred cutover note and why it is untagged, the other the cut, the version derivation, `--base`, the mail pair and the lockfile field
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes, the 16 cut assertions, the 16 guard assertions counted with `grep -c` after a `tail` got it wrong, production's `--status` and `--dry-run`, `audit:register`'s one registered advisory, the 8 PRs from `release-prs.mjs`, `check-site-hosts.mjs`'s `all right`, the two stale lockfile strings counted before they were replaced, and the empty dependency diff that justified skipping `npm ci`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch at the time the gates ran — `ef2fe53f`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's merge commit, not `ef2fe53f`, and the record states both with the allow-list code-identity diff between them

### On the deployed build

- [ ] Deployed to test — deferred. **Note for this release: `test` is not in the cutover's path.** Section E deploys production and then **UAT**, which is the new name for `lannacare.org`. `test.lannacare.org` is untouched by the cutover and is deployed after, never beside, a production build: both run `next build` in the main checkout
- [ ] Smoke-tested — deferred: this session and Lutan, on `lannacareforanimals.org`, following section E step 9 rather than the usual test-site pass
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the entry's own `2026-11-05`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — deferred. `PUBLIC_SITE` stays `locked` on production by Lutan's decision of 2026-11-05, so an anonymous visitor reaches only the sign-in gate on the new host. Both zones are purged at section E step 8

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: read live from Lutan's terminal rather than from the log file, because `tee` under PowerShell writes UTF-16 and the log is absent from disk for the whole build
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — **this is the one to watch, and it is recorded rather than ticked blind.** #1295 makes `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` **required** for a production purge. The peer session reports it was added to `.env.deploy.production` (gitignored) on 2026-11-05 as `323637bc…`, and that the purge token already covers both zones but has never been exercised against the new one — so **section E step 8 is its first real use**, with a manual dashboard purge as the stated fallback. `.env.deploy.uat` was created holding only the `lannacare.org` zone id, which is why UAT needs `--allow-dev-fallthrough`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a as this PR's own step. **The release carries both**, and the ordering is stated: `0317` applied before any deploy, after the merge and the pull
- [x] `--env production --dry-run` clean — **done early: `ok`**, with the four safe-direction consumer warnings described in §3
- [x] Backup fresh for a destructive migration — n/a for `0317`, which deletes nothing. **But this release has a destructive-equivalent step in the cutover**, and the backup for that is real: the peer session reports `lannacare-production-2026-11-05T1343Z.dump.age` (1.58 MB) taken on the Pi **after** Lutan said the freeze was in place, uploaded to Drive and kept in `~/backups/lannacare`. Section E step 1 asks for a repeat after the freeze, which that run already is
- [x] Apply plan stated — `0317` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** any deploy, with `role-cells` and `role-cards` taken before and re-run after

### Rollback

- [x] Rollback position stated, including what it does not cover — **and for this release the honest answer is that the cutover's rollback is NOT rehearsed**, which `docs/domain-checklist.md` says in those words. For the release itself: `0317` needs no reversal (additive, and the `0.43.1` build simply never calls the new functions). For the cutover: production's database is the same project throughout, so **no data is lost at any point** and the backup above is the net. Going back means (1) rebuilding the Pi at the previous release's SHA, because `deploy-pi.sh` **deletes `.next.prev` once the new build is healthy**, so there is no instant Pi rollback after step 4, and putting the tunnel header back to `lannacare.org`; (2) rolling the Worker back in the Cloudflare dashboard or reverting #1295 and redeploying; (3) after steps 6 and 7, moving `lannacare.org` back by hand, since production will have released it and UAT will hold it; (4) putting the Supabase Site URL back. **Nothing here needs an email undone**, because this release does not mail

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | **`main` carries #1295, the cutover commit, whose own title says `DO NOT MERGE YET`** — merged 2026-11-05 13:47Z. Merging deployed nothing, as its decision file promises, but it means **any** deploy from `main` performs the domain cutover, so this release could not be shipped as a routine one | **Raised with Lutan before anything was cut**, with the alternative of deploying tomorrow in the runbook's order. He reaffirmed *cut now, deploy straight after*. Not a code defect; recorded because the release turns on it and because a session reading only "a minor release" would have deployed step 5 alone and broken sign-in |
| 2 | **medium** | **The first cut failed the gates: `typecheck=2 lint=0 test=0 build=1`.** The new untagged note was written as `{ text: "…" }`, which is not a member of `ReleaseNote` (`string \| {text, cards} \| {text, admin: true}`) — `error TS2322 … Property 'admin' is missing`. The build failed on the same error | **Fixed, and the method is the finding.** The cut was reverted (`61579a9b`), the note made a plain string (`4af447f9`), typecheck re-run clean on its own, then re-cut (`2bce6ec2`) and the full gates re-run. Reverting rather than force-pushing keeps every commit forward. **Two things nearly hid this:** the runner's own exit code was **0** while two gates were red — only the four-number line says so — and the background task's log file was truncated to its last 487 bytes, losing both errors, so the re-run was logged to the scratchpad instead |
| 3 | none | `cut-release.mjs` refused to write until all 25 deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and the PR body |
| 4 | low | `package-lock.json`'s own `version` field read `0.43.1` while `package.json` read `0.43.2`. `cut-release.mjs` still does not touch the lockfile, so **backlog `#jhd8s` has not landed** and the last release's hand fix did not stick | **Fixed in this cut again** (both strings, no dependency moved). The handover said to check whether the script change had landed before fixing it by hand; it has not |
| 5 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | **Not a stop.** `npm run audit:register`, which is what CI runs and what the runbook asks for, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered and still unreachable in this app |
| 6 | none | `release-prs.mjs` exits 0 with **8** PRs (#1295, #1301–#1307) and is not short one | Noted because it was short a PR on five releases before last. Nine added migration/test-plan files all checked against the list |
| 7 | low | **Four plans in this range are signed `Manual verification by: pending:`** — `accountant-card-expenses` (Thai wording and the page as the accountant card), `control-listing-sweep-9` (`/maintenance/new`), `deceased-visit-app-half` (Thai wording and the bill-match press) and `test-plan-pending` (the next streams' CI runs) | **Recorded as open, on Lutan's explicit instruction in the same message that asked for the release.** The eighth release running with that answer. They are **not** copied into this plan's own manual list, which would give them a second home that nothing closes |
| 8 | low | **The release-guard assertion count was written down from a `tail` and was wrong** — `tail -12` showed twelve `ok` lines and twelve went into the first draft of this plan; `grep -c "^ok"` on the full log says **16** | **Corrected before the PR.** Recorded because the previous release's plan warned about this exact mistake with a `tail -15`, and the warning still did not prevent it. The fix is mechanical: count the full log, never read a count off a `tail` |
| 9 | none | The stray `next start -p 3100` in the main checkout, which `0.43.1` left on Lutan's list, is **gone** — nothing listening on 3100 and no such process | **Closed.** `npm ci` in the main checkout is no longer blocked by it. Verified before any install decision was made |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Confirm the staff freeze is actually in place**, in your own words to this session. A peer session reports you told it so, and that is not a thing to take second-hand before a step that assumes nobody is saving | chat, before section E step 4 |
| 2 | The **Google sign-in screen says "Lanna Care for Animals"**, not a Supabase address. If it shows the address, brand verification did not carry over and the cutover stops there | `lannacareforanimals.org`, section E step 9 |
| 3 | **Save a setting** and **upload a photo** on the new host — the two halves that failed on 2026-10-01 and the reason the smoke test exists | `lannacareforanimals.org`, step 9 |
| 4 | The **Supabase Site URL** change on the production project, which is yours and sits between steps 5 and 6 | Supabase dashboard, step 5a |
| 5 | The three notes read well to you. **No email this release**, so `/releases` is the only place they appear | `/releases`, signed in, after the deploy |

The four `pending:` plans above are deliberately not repeated here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: every item is for Lutan or for the smoke test, listed above and carried on the signature below

Manual verification by: pending: Lutan to confirm the freeze, read the Google sign-in screen, save a setting and upload a photo on `lannacareforanimals.org`, make the Supabase Site URL change, and read the three notes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
