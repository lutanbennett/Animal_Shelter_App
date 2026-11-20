# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.8` — **it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-8` @ `C:\Development\Animal_Shelter_cut-release-0-47-8`, port `3006` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-20 |
| Carries a migration? | **No.** `0427` is the release range's only migration and it is **already applied to production and UAT** |
| Tested at SHA | the cut commit on this branch; the release range is `8b071e47d..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.8` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.8`, and the two notes sitting in `unreleased` move across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **Neither note is tagged**, so both read as everyone's, which is right: one is about signing in and one about the icon in a browser tab
- [x] Out of scope — **the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### WHY THIS CUT EXISTS, AND IT IS THE SECOND ONE IN AN HOUR

**Lutan asked for `0.47.7` on production and the deploy refused** — correctly. Minutes before, #1774 had
merged *and had written its own release note*, so `unreleased` was no longer empty, and `deploy.mjs`
ships only a written-down release. **That is the guard doing exactly its job:** the alternative is
shipping a user-visible change to production with nothing written down for the people who meet it.

**He was offered three ways out and chose to cut again with no email.** So `0.47.8` is the vehicle, and
**production will go `0.47.6` → `0.47.8`, skipping `0.47.7` entirely.** `0.47.7` is not lost: its entry
stays in the file and its adopt-page note will be visible on `/releases` once this ships. **Only UAT's
Worker ever ran `0.47.7`.** Recorded so the version history does not read as a gap.

**Two more streams merged while the first cut was going through** (#1770 the enquiries schema, #1773 the
sign-in fix), which is why this release has more in it than the last one and why its range is
`8b071e47d..HEAD` rather than starting at `0.47.7`.

### The two notes, and who can see each

1. **"Signing in with Google now takes you back to the page you were trying to open…"** (#1773,
   `#nxtqs`). **Everyone who signs in with Google**, and it was a real fault: arriving at the app through
   a link that carried a destination silently threw you onto the main shelter's site instead. The
   forgotten-password link is covered by the same fix.
2. **"The app has its own picture now…"** (#1774). **Everyone**, in a browser tab, a bookmark or a phone
   home screen.

**Both untagged, so no role filtering applies.** Asserted by the character-identical carry below.

### Lutan was asked about the EMAIL, not about the words

Put to him as *"Cut 0.47.8, no email"* against *"Cut 0.47.8 and email the admins"*, with the warning
that an email cannot be unsent once the production deploy runs. **He chose no email** → `major: false` →
the last number moves → `0.47.7` → `0.47.8`. **Asserted in §2 by the mail-absence pair**, not inferred
from a word.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `f9d3ac0b0` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 149s
=== gates: test — npm test
=== gates: test exited 0 after 41s
=== gates: build — npm run build
=== gates: build exited 0 after 159s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.47.8 2026-11-20 minor --verify` — all 17 assertions pass**, against plain `origin/main`, which is the right base because this cut adds no note of its own

```
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   package.json version equals the newest entry  [0.47.8]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.8 / root 0.47.8 / package.json 0.47.8]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

- [x] **The cut was taken twice on purpose, and the second one is what shipped.** The first used the title *"The app has its own picture"*, which named only one of the two notes; the sign-in fix is the one more people will notice. The file was reverted with `git checkout --` and re-cut with a title naming both. **Nothing else differs**, and the 17 assertions above are from the second cut
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **`npm run audit:register`** — exit **0**: *"1 high/critical advisory, all registered and still unreachable"* (the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`). Recorded as *clean against the register*, not as *clean*
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The deferred-note review

**The cut did not refuse this time, and the reason is worth stating rather than taken as luck:** the
scanner reads the range since the **last cut**, which is now `0.47.7..HEAD` — three PRs, not the 22-PR
sweep the `0.47.7` cut had to review an hour ago. **That review is in #1772 and still stands**; nothing
in these three PRs owes a withheld note. `callback-allowlist-check`'s plan answers the line *"a release
script, nobody at a shelter or an Admin would notice"*, which is correct and permanent.

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration**
- [x] **The release range's one migration, `0427_shelter_enquiries.sql`, is ALREADY APPLIED to both deploy databases**, dry-run first on each, as part of getting `0.47.7` out

```
production (dbkodyyxxhtygxcxmfcu)  428 applied, 0 pending, 0 drift either way
uat        (fsjagxmxjosauwmxwype)  428 applied, 0 pending, 0 drift either way
```

- [x] **So the migration-before-Worker order is already satisfied for this release**, which is the direction that matters: `0427` adds a table nothing reads yet (`-- consumer: none yet`), so `0.47.6`'s running code is unaffected by its presence and `0.47.8`'s code does not need it either. **The app half that will read it is not built**
- [x] **`0427` grants nothing to `anon` or `authenticated`** — read in the file. The only writer is the service role from one named call site; reads are `is_product_admin()` (`0411`). So applying it to production widened nobody's access

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.7")` is `[]`, with the control assertion showing the same function still finding `0.47.0` from further back
- [x] **Both notes carried across character-identical**, in the same order, with their tags — which is the assertion that matters most here, because two notes written by two different streams is exactly the case where one gets quietly reworded
- [ ] **A signed-in browser read of `/releases`** — pending: Lutan, after the deploy. **This release is the first with two entries a person will see at once** (`0.47.8`'s two notes above `0.47.7`'s one), and `dev-signin.mjs admin` is still broken on dev with `PGRST116` while two shelters each hold a role keyed `admin`
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged, and both notes being untagged is asserted by the character-identical carry

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and two notes. No nav entry, no manual topic, and the notes are English, as every release note is. **The Thai word in the icon note is #1774's own text, carried unchanged**

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites, and it was exercised for real twice today**: it is what refused the `0.47.7` production deploy on the icon note, and `check-release-guards.mjs` at exit 0 covers it again here
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. `#nxtqs` was ticked by #1773 and the icon item by #1774
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The judgements worth keeping are why a second cut was needed (§1) and the re-cut for the title (§2)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The two notes were gained in #1773 and #1774 and are quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the two notes from the file itself; both database figures from `--status` on each; the live versions from `/api/version` on all four hosts; the 17 assertions, the four gate numbers and the audit exit code from the runs pasted above; the `0.47.7` refusal from `deploy.mjs` itself

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` on all four hosts
- [x] **The baseline before this release was read on all four hosts.** Three agree at `0.47.6` / `8b071e47dc9a8a56d42978ad2f584099dbd5fbe2`: `lannacareforanimals.org`, `test.lannacare.org`, `cooperjaidee.org`. **UAT is the exception and deliberately so: a `0.47.7` Worker in front of a `0.47.6` app**, because `/api/version` is answered by the Pi's own clone and the Pi UAT build could not be run — see the defect below
- [x] **What this release is for:** the sign-in fix and the icon reaching shelter users, and `0.47.7`'s adopt-page note becoming visible on `/releases`
- [ ] Smoke test / UAT project line — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the deploys and is copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.7` and both notes back into `unreleased`; nothing is deployed by the cut. **After the deploy:** no migration is involved in this release, and `0427` is additive with nothing reading it, so a Worker rolled back to `0.47.6` runs correctly against the `0.47.8` schema. **The sign-in fix is the only behaviour a rollback would undo**, returning to the state where a `?next=` throws a Google sign-in onto the main shelter's address

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (release completeness) | **UAT's app is still `0.47.6` behind a `0.47.7` Worker, and now a `0.47.8` one.** The Pi UAT build is its own release step and **could not be run: two SSH attempts over Meshnet timed out from this PC while the Pi itself was serving**, so the route is down rather than the machine | **recorded, not fixed.** It does not affect sign-in, which is entirely the Worker's. The three Pi builds remain outstanding for this release and are named in the record |
| 2 | low (process) | **Two cuts in one hour, because a stream merged a release note between the first cut and its deploy.** No rule was broken by either side — the stream was right to write a note, the guard was right to refuse | **recorded.** Worth a planner note: a release cut and a merging batch race, and the cut loses. Cutting after a batch has drained, not during, avoids it |
| 3 | low (measurement) | **`check-deferred-notes.mjs`'s 22-PR sweep an hour ago included nine parse artefacts**, where a plan's `n/a` reason quotes the release-note truth rule itself | **recorded in #1772**, fourth release running. A backlog item exists |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **A Google sign-in started from a link that carries a destination** — the first note's own claim. Go to a page signed out, be sent to the sign-in page, sign in, and land on the page you asked for rather than the main shelter site | a deployed host, after the deploy | **Lutan's.** Carried from `login-next-callback.md`; a real Google sign-in cannot be driven from a worktree |
| 2 | **The new icon in a browser tab and on a phone home screen** | a deployed host | **Lutan's.** Carried from `product-icon.md` |
| 3 | **`/releases` read signed in as Admin**, to see `0.47.8`'s two notes and `0.47.7`'s one as a person sees them | a deployed host | **Lutan's.** Claude has no account on production |
| 4 | **The three Pi builds**, including UAT's | the Pi | **open, and blocked on the route.** Defect 1 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, `audit:register`, both database `--status` reads, and the `/api/version` reads on all four hosts
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan, after the production deploy, which is his command. The sign-in journey above all, since it is this release's headline note

Manual verification by: pending: Lutan — the Google sign-in journey and the icon, after he runs the production deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session merges the cut on green and hands Lutan the one production command; the Pi builds stay open on defect 1

Result: pass with accepted defects
