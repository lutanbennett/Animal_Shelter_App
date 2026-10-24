# Feature test plan — cut release `0.40.1`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.1` — move the two `unreleased` notes into a new **non-mailing** entry and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-1` @ `C:\Development\Animal_Shelter_cut-release-0-40-1` (a **fresh** worktree; all ten leftovers were `HELD` by live sessions, so none was free to reuse under paperwork rule 2) |
| Dev server | not started; the cut changes two data files and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-24 |
| Carries a migration? | no — `0254`, `0255` and `0256` are already on `main` from #899, #902 and #904, and are applied at step 5 of the release |
| Tested at SHA | `c7bfb7fb` |

**This release mails nobody.** `major: false`, so `worker/release-mail.mjs` sends nothing on the
production deploy. That is Lutan's call and it was **confirmed twice** — see the box in section 1,
which is the one genuine judgement in this cut.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two notes move from `unreleased` into a new `0.40.1` entry dated 2026-10-24, `major: false`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two: `src/lib/releases.ts` and `package.json`. `git diff --stat` against the merge-base reads `package.json | 2 +-` and `src/lib/releases.ts | 28 ++++----`. No route, no Worker, no migration, no shared lib
- [x] Roles affected identified: admin / management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer — **tags carried, not revisited.** Note 1 (Stocktaking switches) is tagged `admin, management`; note 2 (Who does what features) is `admin` only. No untagged note, so no note is visible to every role. Signed-out is unaffected. `staff` is retired (`0173`) and is asserted absent from the carried tags
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cut is data only; the eleven PRs merged in #896–#906 were verified by their own plans and this plan does not re-verify them. **Role tags were deliberately NOT revisited at the cut**: both notes arrived tagged, and re-tagging here would contradict the byte-identical carry-over asserted in section 2. A tag is the feature PR's call, made by whoever knew the audience (the `0.39.4` precedent)

### The one judgement in this cut, and it was Lutan's — asked twice, deliberately

`docs/release-procedure.md` says to ask whether a release is major or minor before cutting,
because it decides whether mail goes out and cannot be undone once the production deploy has run.
He was asked with the fact `release-procedure.md:114` requires stating plainly — **a major release
currently mails ONE person**, since the shelter's own address is not on the production admin list,
so "mails every admin" overstates the lever.

**He was then asked a second time, and the second question is the one that settled it.** The
`0.40.0` cut plan records a terminology trap: *"'Minor' in Lutan's words is the middle-number bump,
and this repo's `major` boolean means 'worth an email', not semver major. So minor → `0.40.0` →
`major: true`."* On that release he said **minor** and it **mailed**. This session's first question
used the two words the other way round — it offered "Minor — 0.40.1" described as emailing nobody —
so his answer of "minor" was consistent with *either* release, and the two readings pointed at
different versions with opposite mail behaviour.

So the second question **dropped the words entirely** and asked only: should this release email you
or not, naming what the email would contain and that it cannot be unsent. He answered **no email**.

- `0.40.1`, `major: false`, mail suppressed — asserted both ways in section 2.
- **The cost of asking was one round trip; the cost of either wrong answer was a mail that cannot be unsent, or a suppressed mail for two real Admin features.** Recorded here because a session reading only this plan would otherwise inherit the same ambiguity, and because the trap the last cut plan named is **still live** — it was named, and it still nearly bit on the very next release.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `e1d9c631` minutes before the cut, so there was nothing to merge in. `git status -sb` showed no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see the block below, unedited, all four numbers read
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

**Step 1's `npm ci` in the main checkout was run.** It is the step whose omission nearly shipped a
mismatched build on `0.28.0`, and the main checkout is where both Worker builds are made. **Exit 0**,
and the `0.28.0` tell was then read directly rather than trusted: `package.json` declares
`next@16.4.2` and the installed tree reads `16.4.2`. Both numbers were compared, not one assumed from
the other.

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 102s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 112s
=== gates: test — npm test
=== gates: test exited 0 after 17s
=== gates: build — npm run build
=== gates: build exited 0 after 144s
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-release-guards.mjs` — **16 of 16 `ok`, exit 0**, read from the command itself
rather than through a pipe.

The assertion run on the cut itself, unedited. It imports both the pre-cut module
(`git show origin/main:src/lib/releases.ts`, written to a temp file and imported as its own module)
and the post-cut one, and compares them:

```
1. unreleased emptied
  ok   unreleased is now [] (was 2)
2. every note carried across unchanged, nothing lost, nothing invented
  ok   note count 2 -> 2
  ok   note 1 byte-identical (Settings → Stocktaking now has two switches, ...)
  ok   note 2 byte-identical (Settings → Who does what: the Add a card list...)
  ok   nothing invented (0 unaccounted)
3. the new entry
  ok   version 0.40.1
  ok   date 2026-10-24
  ok   major false (minor release, mails nobody)
  ok   title "Two Stocktaking switches, and cards grouped by feature"
4. package.json agrees with the newest entry
  ok   package.json 0.40.1 === newest entry 0.40.1
5. earlier releases untouched
  ok   65 -> 66 entries
  ok   every previously released entry byte-identical
6. file order still matches compareVersions (newest first)
  ok   order 0.40.1 > 0.40.0 > 0.39.5 > 0.39.4 ...
7. the mail: absence AND presence (an always-empty function would pass absence alone)
  ok   majorReleasesSince("0.40.0") -> [] (nobody mailed)
  ok   majorReleasesSince("0.39.5") -> ["0.40.0"] (still finds 0.40.0, so not always-empty)
8. notes render with no [object Object] / undefined
  ok   no [object Object]
  ok   no undefined
  ok   no null
  ok   no retired "staff" role tag (tags: admin, management)

CUT VERIFIED - all assertions passed
```

**The mail check is the one that needed a control, and this is a non-mailing release, which is
exactly when the absence check is weakest.** `majorReleasesSince("0.40.0") → []` would also be
satisfied by a function that always returns nothing. So the same run asserts a **presence** from
further back: `majorReleasesSince("0.39.5") → ["0.40.0"]`. A broken or always-empty function cannot
pass both, which is what makes the emptiness a real answer rather than a vacuous one
(`release-procedure.md`, *"An absence-check needs a presence-check beside it"*).

**The cut was written by a script and verified against `origin/main`, not read over.** A lost or
altered note is the cut's one real failure mode and no gate in CI can see it. One fault was found and
fixed during the cut itself: the first script matched `\n` and the file is **CRLF**, so it refused
with `could not find unreleased array` rather than writing a corrupted file. It was made
line-ending-aware and the output re-verified; `package.json` was then bumped with a targeted
one-line edit rather than a full JSON rewrite, so its CRLF endings and key order are untouched —
confirmed by a diff showing a single changed line.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. `0254`, `0255` and `0256` are on `main`; next free is `0257`, and `gh pr list` shows no open `*-schema` PR to contend with
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — reviewed for the release: production reads **`254 applied, 3 pending`** (`0254`, `0255`, `0256`), and the drift comparison names exactly those three as on `origin/main` but not applied, with **0** applied rows having no file
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — **run against production, all three `ok`, exit 0 read from the command itself**: `dry-run 0254_… ok`, `dry-run 0255_features.sql … ok`, `dry-run 0256_hidden_public_pages.sql … ok`. **The per-file-transaction caveat was live and did not bite**: with three pending files, a red on `0255` or `0256` for something `0254` provides would have meant "apply anyway", not "the file is wrong" (`0075`/`0076`, 2026-09-24). None of the three depends on another. `0254`'s three `-- consumer:` warnings appeared and are **in the safe direction** — the runner's own note reads *"These tables/columns land before the code that reads them is live. That is the safe direction"*
- [x] Applied to **dev** and recorded in `schema_migrations` — yes, with #899, #902 and #904. Dev reads **257 of 257** and `No drift: test matches origin/main`, 0 in each direction
- [x] File is re-runnable — all three declare it and are `if not exists` / `or replace` style, as the existing ones are
- [x] Existing rows still read correctly after the change — asserted by their own plans (#899, #902, #904 all `pass`), not re-derived here
- [x] **Constraints and defaults exercised against real rows** — their own plans' work; `0254`'s guard and audit trigger were proved by the schema PR's `check-diets-forecast-functions.mjs`. **What this plan adds is the ordering read below, which no single feature plan states in release terms**
- [x] Down-migration written, or the reason one is not needed is stated — all three are additive (a column set plus switches, a features table, a hidden-pages table); none drops or rewrites data
- [x] Production apply plan stated for the release manager — **`0254`, `0255`, `0256` in number order, to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `254 applied, 3 pending` → expect `257 applied, 0 pending`, re-read afterwards with a clean drift check

### Ordering, measured rather than assumed

Two of the three migrations have a reader **shipping in this same release**, which is what makes
"before the deploy" mandatory rather than tidy. This was checked by diffing each declared consumer
across the release range, not inferred from the headers:

| Migration | Declared consumer | Ships in this release? |
|---|---|---|
| `0254` | `src/app/management/diets/page.tsx` | **yes, changed in range** |
| `0254` | `src/app/management/purchasing/page.tsx` | **yes, changed in range** |
| `0254` | `src/lib/management/stock-usage.ts` | unchanged |
| `0255` | `src/app/admin/who-does-what/CardBoard.tsx` (header says *"the next stream reads these rows"*) | **yes — #906 IS that next stream, and it is in this release** |
| `0256` | `consumer: none` | nothing reads it yet |

So: **apply all three before either deploy.** `0255`'s header was written expecting its reader in a
later release; the reader arrived in this one, so the header's `consumer: none` is now understated
and the ordering constraint is real. `0256` is genuinely inert — the website page-visibility rows have
no reader yet.

**One mercy worth knowing if the apply is ever late:** #903's own plan records that a missing
`0254` column *"reads as both ON"*, i.e. today's behaviour, so a late apply costs the switch rather
than correctness. That is not a licence to deploy first — `0255`'s reader has no such fallback stated.

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince`, `compareVersions` and the note shape were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries both notes with their roles intact, and renders with no `[object Object]`
- [x] Data persists — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry, which is what `deploy.mjs` refuses to ship without. Asserted, and `check-release-guards.mjs` exercises that refusal in both directions
- [ ] Create / edit / delete all exercised — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty, and the one emptiness that matters, `unreleased`, is asserted empty in section 2
- [x] Invalid input is rejected with a readable message, not a crash — the cut script throws `could not find unreleased array` and `unreleased is empty - nothing to cut` **before writing a byte**, so a second run against an already-cut file stops rather than producing a second empty entry. The first of those two refusals fired for real (the CRLF fault in section 2), which is how it is known to work rather than merely written
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **the mail boundary is the one that matters, and on a non-mailing release it was checked in both directions** (absence plus a presence control, section 2). The version boundary was asserted too: `0.40.0 → 0.40.1` is a clean last-number bump with the middle number held, and the file is still descending by `compareVersions` across all 66 entries. Both notes carry a `roles` key, so the missing-optional-field path is not exercised by this cut and is not claimed to be

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`) and is asserted absent from the carried tags.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | both notes | asserted from the data: note 1 tags `admin, management`, note 2 tags `admin` |
| management | `/releases` | note 1 only | asserted: note 1 tags `management`; note 2 is `admin` only |
| second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer | `/releases` | neither note | asserted: no note is untagged, and none of these roles is tagged. **This is a real consequence worth stating: `0.40.1` is invisible on `/releases` to five of the seven roles**, correctly, because both changes are Admin settings screens |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |
| every admin on the production list | **email** | nothing | **asserted, not deferred**: `major: false` and `majorReleasesSince("0.40.0")` is empty, with a presence control proving the function still works |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself, which changes no page, route or permission. The note visibility is asserted from the data via the carried `roles` tags. **The roles whose pages this release changes are verified by their own PRs' plans**, and the two items those plans leave open are listed in *Left for manual verification* below
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission in this PR. The two new Admin pages this release ships were each checked server-side by their own plans (#903 drove Management to `/no-access` on `/admin/stocktaking`)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by the cut
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched by the cut; #903 and #906 carried their own manual changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is. **Both #903 and #906 leave their Thai wording `pending:` a person**, which is listed in *Left for manual verification* below and in the release record, not fixed here
- [ ] Mobile viewport (375px) — n/a: no UI changed; `/releases` renders the same component
- [ ] Browser console clean — n/a: no page was driven for the cut itself
- [ ] Network clean — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only consumer, and the risk is data rather than rendering: **all 65 prior entries** were asserted byte-identical to `origin/main`'s copy, and the file is still newest-first by `compareVersions` across all 66. The `build` gate compiles the file
- [ ] Any shared file touched checked from a second, unrelated page — n/a: none touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions exercise. `worker/release-mail.mjs` is a fourth reader, and on this release its correct behaviour is to send nothing — asserted directly via `majorReleasesSince`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item. **Nothing needed folding in either**: `git log --oneline main..origin/backlog` was empty at step 1
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious was decided *by the cut*. The mail call was Lutan's and is recorded in the cut commit, in section 1 above, and in the release record
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot tick this line, because the checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The notes users will read are in this PR, in `releases` rather than `unreleased`
- [x] Commit messages say why, not just what — the cut commit records whose call the mail decision was, that both notes were verified byte-identical rather than read over, and the absence-plus-presence mail assertion
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run. **And one claim this release manager could have reasoned was measured instead**: #900's plan is signed `pending:` on whether migration `0230`'s doctor cells are live on production, and the obvious inference — `0230` is applied there, so they must be — is exactly the inference the planner recorded getting wrong yesterday. #901's new read-only production check was run instead, and it reports all 13 cells present. See *Defects found*

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `c7bfb7fb`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **Note the standing rule that replaced SHA-equality** (`release-procedure.md`, *"Check the code is identical, not that the SHAs match"*, Lutan 2026-10-24): what is asserted is `git diff --name-only <a>..<b> | grep -vE '^(docs/|\.claude/)'` empty for each pair of SHAs the release builds from, however many there are
- [x] **Every PR in this release has a completed test plan** — the release-time confirmation `CLAUDE.md` requires, because `test-plan` is advisory and a PR can reach `main` unchecked. The list is **`node scripts/release-prs.mjs 9cdb4af2 HEAD`** — **11 PRs**: #896, #897, #898, #899, #900, #901, #902, #903, #904, #905, #906. All eleven carry a plan and **none is red**: #896, #897, #899, #901, #902, #903, #904, #906 `pass`; #898, #900, #905 `pass with accepted defects`. **Two are `pending:` a person** and are listed in *Left for manual verification*, not copied from their plans as closed

**`release-prs.mjs` exited 1, and the reason is benign and was chased to the bottom rather than
waved through.** It named `docs/test-plans/planner-handover-339.md` as belonging to no PR in its
list of 10. That file came in with `f565aed`, and `gh pr view 905` reports **#905 MERGED with
`mergeCommit` `f565aed` itself** — i.e. it was **squash-merged**, so there is no merge commit
carrying its number for `--first-parent` to find. This is precisely the case the runbook names
(`0.21.0`, eleven PRs recorded instead of twelve). **The release is 11 PRs, not 10**, and #905 is
added by hand here as the runbook instructs.

**And the exit code itself was nearly misread.** The first run was `… | tail -40`, which reported
`EXIT=0` — `tail`'s status, not the script's. Re-run with a redirect it reports **1**. That is the
runbook's *"Read an exit code from the script, never through a pipe"* trap, caught on the first
command of this release.

### On the deployed build

- [ ] Deployed to test: `node scripts/deploy.mjs --env test` — deferred: release manager. **Checked what is on test first, as the runbook requires**: test reads `0.40.0` @ `f2a691e3`, the same version production serves, so it is not a deliberate integration build that exists nowhere else
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in **this PR** derives "today"; the entry's date is the literal string `2026-10-24` and `compareVersions` reads no clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band, threshold or rounding rule in this PR. The two boundaries that do exist — the mail decision and the version bump — were each checked both ways anyway (sections 2 and 4). **The release does contain a banding-shaped change** — #903's purchasing arithmetic with a switch off — and #903's own plan drove both sides of it with real numbers (counted 50, safety 10, use 14: ON needs 24 buys 0; OFF needs 14 buys 14; pack of 5 buys 3 packs), which is why it is not raised as a release gate here
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block, the guard count, the assertion block, the dry-run lines and the production check output are verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. `PUBLIC_SITE` was `locked` as of `0.40.0`, which makes that check vacuous; **re-read it rather than assuming it still is**

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager (`dbkodyyxxhtygxcxmfcu`; grep the project ref, not the arrow, and read the production log with `Get-Content … | Select-String`, since PowerShell's `tee` writes UTF-16)
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager (expected **14**, the baseline confirmed on both environments for three consecutive releases; a different number means the deploy's env changed, and the log's own list is what to read)
- [x] **The release mail must NOT go out** — and this is asserted rather than deferred, which is the one inversion this plan makes to the template. On a mailing release this line is the release manager's to confirm in an inbox; on a non-mailing one the whole claim is in the data, and it is proved in section 2 both ways. **The production deploy is expected to print `sent 0`**, and anything else is a defect to stop on, not a surprise to absorb
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none. **`CLOUDFLARE_PURGE_TOKEN` is not new** but is needed by the post-Pi purge step; it expires 2027-12-31 and the purge script refuses by name if it is missing
- [x] `.local/` exists in the main checkout and is gitignored, so the deploy log handed over can be written and cannot dirty the tree — **confirmed rather than assumed**: `ls -d .local` succeeds and `git check-ignore -v` names `.gitignore:59`. `git status --porcelain` in the main checkout is empty, so the untracked-file state that refused his deploy on `0.38.2` is not present

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, this PR contains neither. But the **release** does, and for two of three migrations: `0254`'s and `0255`'s readers both ship in this release, measured file by file in section 3. So **all three migrations first, then both deploys**
- [x] `--env production --dry-run` run and clean — **run, all three `ok`, exit 0 read from the command itself.** Three pending files, so the per-file-transaction caveat was live and is recorded in section 3 as having not bitten
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **n/a, and read rather than assumed.** All three are additive: `0254` adds per-serving forecast columns and the two stocktaking switches, `0255` a features table, `0256` a hidden-public-pages table. None rewrites or deletes a row, so the gate does not engage. Said explicitly because `0.39.4`'s lesson was that *additive in the database is not the same as harmless* — here the harm channel would be a changed **computation** (`0254` feeds purchasing arithmetic), not data loss, and a backup would not be its remedy. That channel is #903's plan's, and it drove both sides of the switch with real numbers
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0254` then `0255` then `0256`, to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `254 applied, 3 pending` → expect `257 applied, 0 pending`, re-read afterwards with a named drift check on **both** databases

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref 9cdb4af2` on each Pi returns the served app to `0.40.0`, and `npx wrangler rollback --env production` returns only the Worker fallback, also to `0.40.0`. **None of that reverts `0254`, `0255` or `0256`** — and all three are inert under `0.40.0`'s code, which does not read the new columns or tables, so leaving them is harmless in the rollback direction. **The asymmetry to know: `0254`'s switches default to the behaviour `0.40.0` already has** (a missing or unread switch reads as ON), so a rollback does not strand purchasing in a switched-off state. **There is no mail to roll back on this release**, which is the one rollback worry `0.40.0` had and this one does not

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The cut script's first version matched `\n` against a CRLF file** and refused with `could not find unreleased array` | **fixed before anything was written.** It refused rather than corrupting the file, which is the designed behaviour, and the fix made it line-ending-aware. `package.json` was then bumped with a one-line edit instead of a JSON rewrite, so its CRLF endings and key order survive — confirmed by a single-line diff |
| 2 | low | **`release-prs.mjs` exits 1 on this range**, naming `docs/test-plans/planner-handover-339.md` as orphaned | **explained, not worked around.** #905 was squash-merged, so its number is on no merge commit. The release is **11 PRs**; #905 added by hand per the runbook. Also caught here: the first run was piped through `tail` and reported exit 0, which is `tail`'s status — the runbook's own trap, hit on this release's first command |
| 3 | medium | **#900's plan is signed `pending:` on a production fact the handover listed as unreadable by any session** — whether migration `0230`'s 13 doctor cells are live on production | **closed by measurement, and it is the cheapest finding of this release.** #901, merged in *this* release, shipped `scripts/check-production.mjs`, the read-only check Lutan approved on 2026-10-24. Run: **all 13 doctor cells present**, `doctor: 13 cells, 5 cards, 9 extras`. The tempting inference (`0230` is applied, so they must be there) is the exact shape of the error the planner recorded making yesterday, so it was read rather than reasoned |
| 4 | low | **Two more facts the `0.40.0` handover listed as "no session can read" are now answerable**, and were answered in passing | **closed.** `role-cards` reports **no production role holds the Operations or Management card** — the `0.39.5` toggle question, previously *"recorded as not established"*. `diets-proportion` reports **every production diet ingredient line in proportion**, which bears on `0250`'s per-serving back-fill, previously *"still not established"*. Both belong in the handover's standing list, which should now shrink from three items to none |
| 5 | low | **Ten worktrees are `HELD` by live sessions and all read `nothing beyond main`** — every one is a merged stream whose session is still open | **not acted on, correctly.** `HELD` means ask, do not tear down (`CLAUDE.md`), and a release is the wrong moment. It is why this cut needed a fresh worktree instead of reusing a free leftover under paperwork rule 2. Worth a `/clean-streams` round after the release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Press the two Stocktaking switches** in Settings → Stocktaking and read the Thai lines. #903 drove the switch through the database column four ways and both sides of the purchasing arithmetic, but **not the button itself**: the page needs 2-step verification and a dev sign-in is password-only (aal1) | `/admin/stocktaking` on production, signed in as Admin with the authenticator app |
| 2 | **Press the Features panel** in Settings → Who does what — rename, reorder, add, delete, move a card — and read the Thai lines. Same aal2 limit | `/admin/who-does-what` on production, signed in as Admin with the authenticator app |

**Both items are Lutan's and both are shipping as a stated gap, on his explicit decision this
release** (asked before the cut, with the alternative of holding the release until he had looked).
`docs/test-plan-template.md`'s rule is that nothing ships on a `pending:` unless the release manager
puts it to him — which is what happened, and his answer was to ship and look afterwards. The
precedent is `0.15.0`, which shipped with three unsigned plans and eleven outstanding items on the
same kind of explicit call.

**They are listed here rather than left only in their own plans because they are the release's
pre-deploy gate**, and section 8 requires the release manager to name what is open before the deploy.
They remain #903's and #906's to close in their own signatures; nothing is ticked in those plans by
this one.

**The third `pending:` in this release is NOT listed here, because it is closed** — #900's doctor-cell
question, answered by measurement (*Defects found* 3). An item that has been answered does not belong
on a manual list; leaving it there is how a closed question goes on being re-asked
(`CLAUDE.md`, the `assistant-retention` fault).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is **not** empty, and that is deliberate: its two items are the release's open `pending:` items, named here as section 8's pre-deploy gate requires. Neither is a check of **the cut**, which changes two data files, no page, no route and no permission. **Nothing is signed on anyone's behalf**: both items are Lutan's, both are shipping as a gap on his explicit decision, and this line does not claim either was looked at

Manual verification by: n/a: the cut itself changes two data files and no page, so there is nothing for a person to look at. The two items listed above belong to #903 and #906 and are shipping as a stated gap on Lutan's explicit decision; they are not signed here

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-24
