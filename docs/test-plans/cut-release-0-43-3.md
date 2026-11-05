# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.43.3`: move the two notes in `unreleased` into a new entry, empty `unreleased`, bump `package.json` and the lockfile's stale version field. `minor` — **it does not mail**, on Lutan's instruction (*"quick minor release - noemail"*) |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-43-3` @ `C:\Development\Animal_Shelter_cut-release-0-43-3` |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`/`package-lock.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-06 |
| Carries a migration? | **no, and the release carries none either** — production reads `318 applied, 0 pending` against `origin/main 518290a7`, with no drift in either direction |
| Tested at SHA | `a9b5fe8b` — the cut commit, first and only attempt this time |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — two notes sit in a new `0.43.3` entry dated 2026-11-06, `major: false`, and `package.json` and `package-lock.json` follow
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, `package-lock.json`, this plan. Nothing else
- [x] Cards affected identified — **none, by this PR or by the release.** Both notes are deliberately untagged, which is correct: they describe the **public** website's top bar and its sign-in page, which every signed-in person and every anonymous visitor meets. A card tag would hide them from exactly the people who see the change. No activity, card or cell moves in this release
- [x] Anything explicitly **out of scope** written down — (a) both Worker deploys, both Pi builds, the cache purge and the smoke test, which are the deploy; (b) the release record and handover, written after the deploy; (c) **the two plans in this range signed `pending:`**, which belong to their own plans and are listed under Defects rather than resolved here; (d) making `cut-release.mjs` bump the lockfile (backlog `#jhd8s`) — a release ships what the build gave it and writes no code of its own; (e) the stale "`lannacare.org` runs production" line in `docs/test-plans/lock-page-coming-soon.md`, found while reading sign-offs and recorded under Defects for the planner, not fixed here

### Why this release is an ordinary one, stated because the last was not

`0.43.2` was asked for in the same words and was secretly the **domain cutover**, because `main`
carried #1295. So the first thing done this time was the check that caught it: `git log --oneline -1`
reads `518290a7 Merge pull request #1311 from lutanbennett/claude/public-wordmark-home`, and the
four PRs in the range are a Dependabot Actions bump, a locked landing page, a public wordmark and a
developer-tooling guard. **Nothing in the range changes a host, a domain, a policy or a permission**,
and no migration is pending on either database. This is a plain cut with a plain deploy.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-3` from a freshly fetched `origin/main` (`518290a7`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from this commit and merged on green, on its own head commit read from `gh run view --json headSha`

### Evidence

```
=== gates: typecheck exited 0 after 68s
=== gates: lint exited 0 after 222s
=== gates: test exited 0 after 31s
=== gates: build exited 0 after 183s
gates: typecheck=0 lint=0 test=0 build=0
```

**Read all four numbers, not the runner's exit code.** `0.43.2` had `gates.mjs` exit **0** while
`typecheck` and `build` were both red; only the closing line says what happened. The log was written
to the session scratchpad rather than relied on from the task file, because that file was truncated
to its last 487 bytes last release and lost both error messages.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.43.3 2026-11-06 minor --verify`, counted with `grep -c "^ok"` on the
full output rather than read off a `tail`:

```
ok   new entry is the newest and has the requested version  [0.43.3]
ok   new entry has the requested date  [2026-11-06]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.43.2 -> 0.43.3]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.43.3]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.43.0 in ["0.43.0"]]
all 16 assertions passed
```

`node scripts/check-release-guards.mjs`:

```
check-release-guards: 16 assertions, counted with grep -c on the full log
ok   --drift reads the arrays it prints from driftReport()
```

### Why `0.43.3` rather than `0.44.0`, and why no question was asked

**The email question was answered in the request itself** — *"noemail"* — so it was not put to him
again. The version follows from that answer and not from the word "minor", which means opposite
things on the two sides of the conversation: in his usage *minor* is the middle-number bump, which
in this repo is the shape that **mails**; here the `major` boolean means *worth an email*. He named
the email directly, so this is a last-number bump with `major: false`.

Both halves of the mail pair are asserted, not assumed: `majorReleasesSince("0.43.2")` is `[]`
(absence), and the control from further back still finds `0.43.0` (presence), so an empty answer
cannot be an empty function.

### The deferred-note review

`check-deferred-notes.mjs` listed four plans in `168afb8c..HEAD` that answered their release-notes
line `n/a`, and flagged **two** as possibly owing a note here. **Neither does, and both are the
boilerplate false positive four handover editions have now warned about:**

- `lock-page-coming-soon` (#1310) — the excerpt the guard printed is the **checklist template's own
  guidance text**, not that plan's answer. That plan **ticked** its release-notes line, and its note
  is one of the two shipping here.
- `record-0-43-2` (#1309) — the last release's docs-only record and handover. Correctly `n/a`:
  nothing a shelter user sees.
- `guarded-install-refuses` (#1312) — developer tooling, nothing a user can reach.
- `public-wordmark-home` (#1311) — its note is in `unreleased` and ships here.

The review was passed to `--deferred-reviewed` and is in the cut's commit message. **No note is owed
and none was invented.** `--base` was **not** needed this time, which breaks a three-release run; the
reason is that this cut wrote no note of its own, so `origin/main` still holds both of them.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration, **and neither does the release**. For the record: `0317` is the highest on `main` and the next free number is `0318`
- [x] `--status` reviewed before applying — production reads **318 applied, 0 pending** against `origin/main 518290a7`, with `on origin/main, not applied here: 0` and `applied here, no file on origin/main: 0`. **There is nothing to apply, so the apply step is skipped rather than run empty**
- [ ] `--dry-run` reviewed — n/a: nothing pending to dry-run
- [ ] Applied to **dev** — n/a: no migration in this PR or this release
- [ ] File is re-runnable — n/a: no migration file
- [x] Existing rows still read correctly — nothing in this release writes or reshapes a row. The only data that changes is the contents of two arrays in a TypeScript file
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [x] Production apply plan stated — **there is none, and that is the plan.** Both deploy paths refuse a commit whose database lacks a migration on `main`; `--status` was read directly rather than left to the deploy to ask, because *could not ask* is a warning there and not a refusal
- [ ] Card compliance read, not assumed — n/a: no migration, no policy, no `security definer` function, and no activity or card moves in this release

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 cut checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `build` compiled `/releases` with the new entry in place
- [x] Data persists — the entry is in the committed file and `latestRelease` resolves to it, both asserted
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real: `cut-release.mjs` **refused outright** when called with no arguments (`REFUSED — version "undefined" is not a.b.c`), and the deferred-notes guard refuses to write while a candidate is unanswered
- [x] Boundary cases checked — the version boundary both ways (`0.43.2 -> 0.43.3` is newer, file order still matches `compareVersions`) and the mail window from both ends
- [ ] `/releases` driven in a real browser — n/a: not driven. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

Not applicable to this PR, and the reason is the point rather than a formality: **a release cut
changes no activity, no card and no cell.** The two notes are untagged, so `/releases` shows them to
every signed-in login and to Admin, which sits outside the card system and sees every line anyway.
`check-production.mjs role-cells` and `role-cards` were **not** taken, because nothing in this
release writes either table — unlike `0.43.2`, where `0317` created a card and the snapshots were
the record of what moved.

- [ ] Every login above tested — n/a: no activity, card or control changed by this PR or this release
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change: release notes are English prose in `src/lib/releases.ts`, not translatable labels. The Thai wording of the two features themselves is a `pending:` on their own plans, recorded under Defects
- [ ] Mobile viewport (375px) — n/a: no layout or component changed by this PR. **Both notes describe phone-sized behaviour** on the public site, which is one of the items left for a person
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `build` compiled `/releases` and `/api/releases/current`, the two readers of this file. A malformed entry fails `typecheck`, which is how `0.43.2`'s bad note shape was caught
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. **The third is the one that matters, because this release must NOT mail**, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls. `package-lock.json`'s other reader is `npm ci`, which now sees it agree with `package.json` where before it did not
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` at `518290a7`
- [x] `npm ci` in the main checkout — **deliberately not re-run, with the diff that justifies it.** `git diff --stat 8315f3dc..HEAD -- package.json package-lock.json` is **empty**, so no dependency moved in this release and the installed tree already matches the lockfile. Running it could only re-court the `EPERM` that cost `0.43.1` real time. The `Next.js version :` line on the first Worker build is still read against `package.json`. **The release's one dependency-adjacent PR, #1161, is a Dependabot bump of a GitHub Actions action**, which lives in `.github/workflows` and is not in the npm tree at all

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item, and nothing in this range leaves one closable by the cut
- [x] Non-obvious design choices recorded — why the version is `0.43.3` and not `0.44.0`, why no email question was asked, why `--base` was **not** needed this time, why both notes are untagged, why `npm ci` was skipped, why no migration step runs, and why the lockfile's version field moved by hand, are all in this plan and the commit message
- [x] `README.md` still accurate — it names no version, and its environments table was corrected to the new hosts in the `0.43.2` record PR
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. No note was written on this branch, because none was owed
- [x] Commit messages say why, not just what — the cut's message gives the version derivation, the mail decision, the stale lockfield field and the whole deferred-note review
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes, the 16 cut assertions, the release-guard assertions counted with `grep -c`, production's `318 applied, 0 pending`, the empty dependency diff, `audit:register`'s one registered advisory, the 4 PRs from `release-prs.mjs`, the four deferred-note answers, and the two stale lockfile strings counted before and after they were replaced

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch at the time the gates ran — `a9b5fe8b`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's merge commit, not `a9b5fe8b`, and the record states both with the allow-list code-identity diff between them

### On the deployed build

- [ ] Deployed to test — deferred: this session, after the production Worker deploy reports. **Never beside it**: both run `next build` in the main checkout and the second dies in seconds
- [ ] Smoke-tested — deferred: this session, `docs/release-smoke-test.md` on `lannacareforanimals.org`
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the entry's own `2026-11-06`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — deferred: this session. **This one matters more than usual on this release**, because both notes describe the **public** site's top bar and sign-in page, and `/_next/static/**` is cached `immutable` for a year. `PUBLIC_SITE` stays `locked` by Lutan's decision of 2026-11-05, so an anonymous visitor reaches the locked landing page, which is itself one of the two things shipping

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: read live from Lutan's terminal rather than from the log file, because `tee` under PowerShell writes UTF-16 and the log is absent from disk for the whole build
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session. 14 as of 2026-11-05, on every Worker build
- [x] Any new secret/env var exists in the production Cloudflare environment — **none is needed.** No PR in this range adds a secret or an environment variable; the cutover's `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` was added and exercised last release, and the purge now runs against the new zone as a matter of course

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: neither this PR nor this release carries a migration
- [ ] `--env production --dry-run` clean — n/a: nothing pending to dry-run. `--status` was read instead and is in §3
- [ ] Backup fresh for a destructive migration — n/a: no migration, nothing destructive. The last full production dump is the one taken for the cutover on 2026-11-05 and kept on the Pi and on Drive
- [ ] Apply plan stated — n/a: there is nothing to apply, which is stated in §3 rather than left blank

### Rollback

- [x] Rollback position stated, including what it does not cover — **this release is unusually easy to go back from, and the reason is worth naming: no schema, no permission, no host and no mail.** Nothing in the range is irreversible. Going back means redeploying the previous release's SHA to the Worker and rebuilding the Pi at it. **What it does not cover:** `deploy-pi.sh` deletes `.next.prev` once the new build is healthy, so there is no instant Pi rollback — a revert is a fresh build at the old SHA, about five minutes. **Nothing needs an email undone**, because this release does not mail, and `majorReleasesSince("0.43.2")` is asserted empty

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `package-lock.json`'s own `version` field read `0.43.2` while `package.json` read `0.43.3`. `cut-release.mjs` still does not touch the lockfile, so **backlog `#jhd8s` has not landed** — for the **third** release running, and two hand fixes have now failed to make the script do it | **Fixed in this cut by hand again** (root and `packages[""]`, two strings, no dependency moved; `0` occurrences of the old value left). **Not fixed in the script**, deliberately: a release ships what the build gave it and does not write code. It is already a backlog item, and this is the third consecutive record saying so — which is the case for the planner to schedule it rather than for another release to absorb it |
| 2 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | **Not a stop, and not the check the runbook asks for.** `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered and still unreachable in this app |
| 3 | none | `release-prs.mjs` exits 0 with **4** PRs (#1161, #1310, #1311, #1312) and is not short one | Noted because it was short a PR on five releases before last; this is the third release running that it has not been. One PR (#1312) was resolved from GitHub rather than from git, because it was squash-merged and left no merge commit. Three added test-plan files were all checked against the list |
| 4 | low | **Two plans in this range are signed `Manual verification by: pending:`** — `lock-page-coming-soon` (Thai wording review and a look on a real phone) and `public-wordmark-home` (Lutan to look at the home page pictures) | **Recorded as open.** Both are *"has somebody looked at it"* on a visual change to the public site, neither blocks anything, and this is the standing answer he has given on every release since 2026-10-15. They are **not** copied into this plan's own manual list, which would give them a second home that nothing closes. They are, however, the two items most worth a glance after the deploy, because this release is exactly those two changes |
| 5 | low | **`docs/test-plans/lock-page-coming-soon.md` §8 still says `test.lannacare.org` runs the dev database and `lannacare.org` runs production** — written 2026-11-06, a day **after** the cutover moved production to `lannacareforanimals.org` and made `lannacare.org` a UAT site on the dev database | **Found reading the sign-offs, recorded, not fixed here** — out of scope for a cut, and a merged plan is a historical record of what that stream checked. **The real finding is upstream of the file:** the sentence is copied from `docs/test-plan-template.md`, so every plan written from it will carry the wrong hosts until the template is corrected. For the planner |
| 6 | none | `git log --oneline -1` and the full PR range were read before cutting, and nothing in them changes a host, a domain, a policy or a permission | **Not a defect — the check that the last release proved necessary, run and passed.** Recorded because its absence is what nearly shipped `0.43.2` as a routine release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The bigger crest and the LCA short name on a phone**, and the home page's new wording over Chiang Mai. This is one of the two things this release exists to ship, and nobody has looked at it on a real phone | the public site, on a phone, after the deploy |
| 2 | **The locked sign-in page** — the under-construction wording, the site colours and the poodle. Same reason | the public site, after the deploy |
| 3 | The two notes read well to you. **No email this release**, so `/releases` is the only place they appear | `/releases`, signed in, after the deploy |

The two `pending:` plans at Defect 4 are deliberately not repeated here; items 1 and 2 are this
plan's own request to look, which is a different thing from signing their plans off.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: every item is for Lutan after the deploy, listed above and carried on the signature below

Manual verification by: pending: Lutan to look at the public site's top bar and home page on a phone, the locked sign-in page, and the two notes on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-06
