# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.49.0` — **it MAILS**, on Lutan's own instruction |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-49-0` @ `C:\Development\Animal_Shelter_cut-release-0-49-0`, port `3002` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-23 |
| Carries a migration? | **No — and neither does the release.** Production and UAT both read `436 applied, 0 pending` before the cut, so there is no schema step at all this time |
| Tested at SHA | the cut commit on this branch, cut from `origin/main` at `b0af4b3d8`; the release range is `050b44b0f..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.49.0` entry is created with `major: true`, `package.json` and both `package-lock.json` version fields go to `0.49.0`, and the one note sitting in `unreleased` moves across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else (3 files, 12 insertions, 4 deletions against the branch point)
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note is untagged**, so every reader of `/releases` sees it; see *The note's audience* below, which is now a filed item rather than a repeated observation
- [x] Out of scope — **the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### What this release is: eighteen PRs, one visible line, and a day's worth of its own paperwork

**18 PRs** (`release-prs.mjs` exit 0, range `050b44b0f..HEAD`; 4 resolved from GitHub because they were
squash-merged). **Five of the eighteen are `0.48.0`'s own paperwork** — the record, its same-day
correction, the canary write-up, the planner handover and the drive-move PR that overtook the record
within the hour (#1835, #1836, #1837, #1838, #1848).

**The rest is a full day of streams**, and almost none of it is visible to a shelter user: a backlog
waiting-state signal and a names file (#1839, #1843), the `reserved` worktree signal (#1840), the deploy
secrets registry (#1841), the narrowed Calendar scope (#1845), reels batch upload and its metadata step
(#1846, #1849), the `/th` 500 fix (#1847), and four repository checks (#1850, #1851, #1852, #1853).

**One note goes to users, and because this release mails, it reaches the inbox as well as `/releases`.**

### The one note

> *"The CooperJaidee product page now has a page about the money side of a shelter (numbered receipts,
> expenses your accountant can read, and a cashflow forecast), in English and Thai."*

Untagged, so everyone on `/releases` sees it. Written by #1842 (commit `a18762af8`), which **ticked** its
release-notes line rather than writing `n/a` — which is why the deferred-note sweep lists that plan and
the answer is "already present".

### The note's audience — recorded yesterday, FILED today, because it is now a pattern

`0.48.0`'s note was *"the CooperJaidee product page now reads as a proper introduction to the
software"*; this one is *"the product page now has a page about the money side"*. **Both are untagged, so
both go to every shelter user on `/releases` and both go in the mail — and the product site is the
thing we sell the software with, not a thing a volunteer uses.** Two in two days is a pattern, so it is
**filed on the backlog** rather than observed again in a third record.

**It is still not altered here, and the reason is unchanged:** a cut's one real failure mode is a changed
note, `--verify` asserts every note carried across character-identical, and editing one during the cut is
exactly what that assertion exists to catch. Whether product-site notes want a tag, or want to be left
untagged because widening is the safe default, is a decision for the item — not for a release manager
mid-cut.

### Lutan was asked about the EMAIL, not about "major or minor"

He said it himself, unprompted, for the second day running: *"lets do a major release, email to be sent,
take note of gaps in test"*. **Email to be sent** → `major: true` → the middle number moves → `0.48.0` →
`0.49.0`. **Asserted in §2 by the mail-presence pair**, not inferred from the word "major", which in his
usage has meant both things.

**The standing fact goes with it: a major release currently mails one person — Lutan.** The shelter's own
address is not on the production admin list and `lannacareforanimals@gmail.com` is skipped by the relay
with `E_RECIPIENT_NOT_ALLOWED`. He knows; it is written here so the record does not imply a wider
audience than the mail has.

**And this release is NOT the `#w4k9n` (e) proof — `0.48.0` was.** Yesterday's mail arrived with subject
`[Production] …` from *Lanna Care Production*, which closed that question after sixteen days. Today's
mail is a **re-confirmation on a second consecutive mailing release**, which is worth reading but is not
news. Say so in the record rather than claiming the proof twice.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `b0af4b3d8` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 44s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 151s
=== gates: test — npm test
=== gates: test exited 0 after 38s
=== gates: build — npm run build
=== gates: build exited 0 after 262s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.49.0 2026-11-23 major --verify` — all 17 assertions pass**, against plain `origin/main`, which is the right base because **this cut adds no note of its own** (the note was already in `unreleased`, from #1842)

```
ok   new entry's major flag matches  [true]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   package.json version equals the newest entry  [0.49.0]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.49.0 / root 0.49.0 / package.json 0.49.0]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.49.0"]]
ok   control: from further back, an older major release is still found  [0.48.0 in ["0.49.0","0.48.0"]]
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **`npm run audit:register` — exit 0**: *"1 high/critical advisory, all registered and still unreachable"* (`GHSA-5j98-mcp5-4vw2`, `glob`, seventh release running). Recorded as *clean against the register*, not as *clean*. **`npm run audit:prod` also read — exit 1, 5 findings, identical to yesterday's reading**: the same 4 high in the `glob` chain, and the same one **moderate on no list**, `GHSA-g3hv-75wg-m249` (`minimatch`), which reaches us only through `@node-minify/core` → `@opennextjs/aws` → `@opennextjs/cloudflare` and is build-time tooling in nothing the Worker or the Pi serves. The register admits high and critical only, so its absence is correct. **Cited from `0.48.0`'s record rather than re-derived**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will RUN on this PR rather than show `skipped`**, because a cut changes `package.json` — the one PR per release where that job is a real check
- [x] **Every exit code here was read from the command, never through a pipe.** Said because it bit this session an hour earlier: a `… | tail` during `/clean-streams` printed `EXIT: 0` for a script that had crashed, which is the trap `docs/release-procedure.md` names under *Read an exit code from the script, never through a pipe*

### The deferred-note review — and it over-listed far less than yesterday

`check-deferred-notes.mjs` exited 0 and listed **9 candidates across the 18 plans of this release's own
range**. **That is a marked improvement on `0.48.0`, where it read 56 plans from an older cut point and
produced 17 candidates** — so the known range quirk either did not bite here or has been narrowed. Worth
recording as a measurement either way, not as a fix anyone has claimed.

| Plan | Real answer | Note owed? |
|---|---|---|
| `backlog-waiting-state` | parse artefact; the real reason is at the end of the line — *"the backlog is an internal document; no shelter user sees it"* | no |
| `calendar-narrow-scope` (#1845) | **step NOT closed** — its own manual line reads `pending: Lutan's console look and a real connect` | no |
| `deploy-secrets-registry` (#1841) | mis-sorted: its reason points at no pending step, it is a plain *"nobody at a shelter sees a deploy script"* | no |
| `product-site-pages` (#1842) | **its note IS this cut's note.** That plan ticked the line rather than writing `n/a` | **already present** |
| `record-0-48-0` | a release record; its own notes shipped in #1829 and #1823 | no |
| `reels-batch-metadata` (#1849) | **step NOT closed** — the real three-clip upload is still pending | no |
| `reels-batch-upload` (#1846) | **step NOT closed** — the same pending upload | no |
| `shelter-drive-move` (#1835) | **step NOT closed** — the production Drive move is later and is not offered to the Director yet | no |
| `thai-prefix-500` (#1847) | **THE CLOSEST CALL.** See below | no, and verified instead |

**Why `thai-prefix-500` is the closest call and still owes nothing.** It fixes the `/th` 500 I filed
yesterday as `#thpfx`. Its plan reasons that nobody can reach a Thai public page while `PUBLIC_SITE` is
`locked` — **true of the shelter site, and the product host is NOT locked**, so
`cooperjaidee.org/th/platform/about` really does go from 500 to working for a passer-by. But `/releases`
is read by shelter users and Admin, and **neither of them reaches a Thai search-engine address on the
product site**; the people who do are strangers and crawlers, and `PLATFORM_SEARCH` is still `closed`.
**So no note — and instead the fix is verified on production in this release**, which is what closes that
plan's own `pending: proof on production` line. That verification is this session's, not his.

## 3. Schema and data

- [x] Migration number / re-runnable / down-migration / dry-run — n/a: **no migration in this PR, and none in the release.** Production and UAT both read `436 applied, 0 pending` with `0` in each direction before the cut, so there is nothing to apply, dry-run or order
- [x] **The release-order guard was still run, on both databases** — `check-release-order.mjs --worker-deployed 050b44b0f…` reports *"must-follow-Worker: none pending"* and *"must-precede-Worker: none pending"* on production and on UAT. Run even with nothing pending, because the guard also reads the live Worker's release and refuses if it cannot
- [x] **So this is the first release in several with no database step at all.** Worth stating plainly rather than leaving a reader to infer it from a missing section

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail WILL be sent, proved as a presence AND a control.** `majorReleasesSince("0.48.0")` is `["0.49.0"]`, with the control showing the same function still finding `0.48.0` from further back — so the answer is the flag being `true`, not the function returning everything asked of it
- [x] **The note carried across character-identical** — and with one untagged note the *order* clause is vacuous, which is worth saying rather than claiming it proved something
- [ ] **A signed-in browser read of `/releases`, and the mail in the inbox** — pending: after the deploy. The mail is read in the inbox rather than trusted from `sent 1`
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged, and this release's note is untagged so no filtering applies to it

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and one note. No nav entry and no manual topic. The note is English, as every release note is; the **page** it describes is bilingual, which #1842 built and which is one of this release's test gaps

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current`, by `deploy.mjs` under Node's type stripping **and, on a major release, by `worker/release-mail.mjs`**. The last two bite, and `check-release-guards.mjs` at exit 0 plus the mail-presence assertion cover them
- [x] Nothing merged from `main` was broken by this branch — nothing was merged. **`main` was pulled, the backlog folded in and pushed before the cut**, so the branch point is current rather than behind

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. #1842's own items were ticked by #1842
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The judgements worth keeping are the deferred-note table and the `thai-prefix-500` reasoning (§2), the untagged-note pattern now filed on the backlog (§1), and the test-gap list below
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The note was gained in #1842 and is quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note from the file itself; both database figures from `--status` on each; the live versions from **both** endpoints on all four hosts; the note's provenance from `git log -S`; the deferred answers from each plan's own line read to its end; the 17 assertions, the four gate numbers and both audit exit codes from the runs pasted above, each read from the command rather than through a pipe

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` **and** `/api/releases/current` on all four hosts
- [x] **The baseline was read on all four hosts, on BOTH endpoints, before anything was deployed** — `lannacareforanimals.org`, `cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` all answered `0.48.0` on `/api/version` **and** `/api/releases/current`, **all four reporting the same SHA `050b44b0f`**, every one with `x-lanna-served-by: pi`. **This is the check `0.47.8` failed**; clean here, as at the end of `0.48.0`
- [x] **Pre-deploy proofs, all green before the cut was written:** `check-deployed-hosts.mjs` on production (4 addresses and all four `/auth/callback` entries), UAT and dev; `check-dev-aal2-absent.mjs` on production and UAT, static proofs plus a live read of each project; `check-release-order.mjs` both directions on both
- [x] **`npm ci` in the main checkout: not re-run, and the reason is a reading rather than a shortcut.** `git diff --stat 050b44b0f..HEAD -- package.json package-lock.json` prints **nothing at all** — no dependency has moved since the last release shipped — and `next` reads **16.4.6** in `package.json`, in `package-lock.json`, in the installed tree and in the gates' own build banner (`▲ Next.js 16.4.6 (Turbopack)`). That is the `0.28.0` trap closed by reading the four against each other rather than by a four-minute reinstall that could not have changed anything. **Read, not assumed:** this line was drafted from yesterday's reading and then actually re-run before it shipped
- [ ] Smoke test / the mail itself — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the deploys and is copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.48.0` and the note back into `unreleased`; nothing is deployed by the cut. **The mail cannot be unsent once the production deploy has run**, which is why the flag was taken from his words and asserted rather than inferred. **No migration to consider**, for the first time in several releases

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (observation, now filed) | **Two consecutive release notes describe the CooperJaidee product site, both untagged**, so both reach every shelter user on `/releases` and both go in the mail, though the product site is what the software is sold with rather than something a volunteer uses | **filed on the backlog rather than observed a third time.** Not altered in the cut: a changed note is the one failure the 17 assertions exist to catch |
| 2 | low (measurement) | **`check-deferred-notes.mjs` still prints the test-plan template's guidance as the "reason"** for 2 of its 9 candidates, and still mis-sorts a plain `n/a` into the may-owe list | **recorded, reviewed by hand** — the table in §2 is the review. **But it read 18 plans for an 18-PR release this time, against 56 for 12 yesterday**, so the long-standing range quirk did not bite. Recorded as a measurement, not as a fix |
| 3 | medium (test coverage) | **Seven of the eighteen plans carry a `pending:` manual line** — the largest test gap of any release this week, and it includes the page this release's only note describes | **recorded as stated gaps, on his own instruction** (*"take note of gaps in test"*). Itemised in *Left for manual verification*, with the one I can close myself marked as mine |

## Left for manual verification

**This is the release's test gap, listed because Lutan asked for it.** Each item belongs to its own plan
and its own signature — **they are listed here as the release manager's pre-deploy pass, not adopted into
this plan's own sign-off**, which the runbook forbids.

| # | Plan / item | What is waiting | Whose |
|---|---|---|---|
| 1 | `product-site-pages` (#1842) | the 375px view, and **a Thai reader on the money page** — the page this release's only note describes, so the gap and the headline are the same thing | **Lutan's**, and the one that matters most |
| 2 | `reels-batch-upload` (#1846) | upload three clips from his phone | **Lutan's** |
| 3 | `reels-batch-metadata` (#1849) | upload three clips and describe them | **Lutan's**, and it needs #2 first |
| 4 | `calendar-narrow-scope` (#1845) | the Google Cloud console look and a real connect | **Lutan's** |
| 5 | `planner-handover-772` | **not a test at all — a decision**: his choice on `#rlbat`'s metadata behaviour. Named here so it is not mistaken for an unchecked box | **Lutan's**, a decision |
| 6 | `backlog-waiting-state` (#1839) | the pinned backlog page after a republish | **Lutan's**, cosmetic |
| 7 | `thai-prefix-500` (#1847) | `pending: proof on production` — **THIS SESSION'S, and closed inside this release.** The `/th` addresses are read on production after the deploy, which is the proof that plan is waiting for | **this session's** |

**All eighteen plans read `Result: pass` or `pass with accepted defects`** — four of the latter, none a
`Result: fail`. **Seven pending manual lines is the headline number**, and six of the seven are his.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, `audit:register` and `audit:prod`, `check-release-order` on production and UAT, `check-dev-aal2-absent` on production and UAT, `check-deployed-hosts` on all three, both database `--status` reads, and **both** version endpoints on all four hosts
- [x] Nothing is ticked that was not actually executed, and no exit code here came through a pipe

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan — items 1 to 6 above, the money page's Thai wording first. Item 7 is this session's and is done inside this release

Manual verification by: pending: Lutan — the money page's 375px view and its Thai wording (#1842), this release's headline test gap

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session deploys test and UAT, builds all three Pi clones, purges both zones, hands Lutan the one production command, reads the mail, and verifies the `/th` fix on production

Result: pass with accepted defects
