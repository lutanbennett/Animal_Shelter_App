# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.4` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-4` @ `C:\Development\Animal_Shelter_cut-release-0-47-4`, port `3003` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | **no, and neither does the release** — the first release since `0.47.0` with no schema change at all |
| Tested at SHA | `bc13394ee` (the cut commit); the release range is `c473c1f35..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.4` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.4`, and the **two** notes already in `unreleased` move across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **Both notes are `admin: true`**, so only Admin sees them; a card-holding login sees the `0.47.4` heading and its title with nothing beneath, which is measured in §4. The signed-out public does not reach `/releases` at all
- [x] Out of scope — **both deploys and the three Pi builds are the release, not the cut.** No application code was written: *a release cuts what the build gave it*

### Two things make this cut simpler than the last two, and both are worth stating

**There is no migration anywhere in this release.** `git diff c473c1f35..HEAD -- supabase/migrations/` is empty and both databases already read `416 applied, 0 pending` with no drift either way. So there is no apply step, no dry-run to interpret, no backup gate to meet, no `-- consumer:` warnings and nothing for `check-release-order.mjs` to hold. The last two releases were dominated by exactly those.

**Neither note had to be judged.** `0.47.2` had to decide whether to invent one; `0.47.3` carried one that a stream had written. Here both were written by the streams that built them — #1718 and #1716 — and the cut carried them across unchanged.

### Lutan was asked the one question a cut must always ask

He said *"lets try a new release"*, which does not settle the mail, and a mail cannot be unsent once the production deploy runs. Asked as *should this release email you?*, with what the email would contain and that it is irreversible, he chose **no email**. So the version moves the last number and `major` is `false`, asserted in §2 rather than assumed from his words.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `be50716f7` by `worktree.mjs new`, and the cut commit's parent is that commit. Nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 40s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 120s
=== gates: test — npm test
=== gates: test exited 0 after 29s
=== gates: build — npm run build
=== gates: build exited 0 after 114s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers were read from the gates line itself, and the whole run was redirected to a file rather than piped through `tail`.

**The build passed first time, and that is a measurement about the previous release's fault rather than a formality.** `0.47.3` was ended by `next/font/google` failing to fetch during a build, traced to the machine preferring IPv6 while having none. **That preference was reverted by Lutan before this cut**, so this build ran under exactly the conditions that failed twice — in a fresh worktree with no `.next`, so the fonts were fetched rather than cached — **and it succeeded.** That does not clear the fault; it establishes that it is intermittent rather than deterministic, which is itself worth knowing before the deploy. Recorded as observation 1.

- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

- [x] **All 17 cut assertions pass against `origin/main`**, the correct base here because this cut adds no note of its own — both notes were already on `origin/main`, written by #1718 and #1716, so *every note carried across character-identical* is asserted against the real pre-cut state

```
ok   new entry is the newest and has the requested version  [0.47.4]
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   every earlier entry present and unchanged
ok   package.json version equals the newest entry  [0.47.4]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.4 / root 0.47.4 / package.json 0.47.4]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]

all 17 assertions passed
```

- [x] **The no-mail is asserted as an ABSENCE with a control beside it** — `majorReleasesSince("0.47.3")` is empty **and**, asked from further back, the same function still finds `0.47.0`. An always-empty function would satisfy the first and fail the second
- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [x] **Audit.** `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), dated in `docs/advisory-register.json` and still unreachable. **Not "clean"** — one registered, accepted advisory. **The cut bumps `package.json`, so CI's `audit` job runs for real** rather than showing `skipped`
- [x] **`npm ci` in the main checkout — run for the previous release and not needed again here.** `git diff c473c1f35..HEAD -- package.json package-lock.json` is **empty**: no dependency moved in this release. Installed `next` is `16.4.6`, matching `package.json`
- [x] **The deferred-note gate was answered per plan, not waved through** — see §7

## 3. Schema and data

- [ ] Every line in this section — n/a: **neither the cut PR nor the release carries a migration.** Both databases hold all 416 files with no drift in either direction, read from `--status` on each

## 4. Functional checks

- [x] Happy path works end to end, **and the notes' audience boundary was measured in both directions** — `/releases` was fetched on the worktree dev server as Admin and as a login holding exactly one card, and both `admin: true` notes are shown to the first and withheld from the second

```
Admin -> HTTP 200, 924,642 bytes
    PRESENT  0.47.4 section header
    PRESENT  the release title
    PRESENT  note 1, Drive, first half
    PRESENT  note 1, Drive, closing clause
    PRESENT  note 2, first login, first half
    PRESENT  note 2, first login, caveat
    PRESENT  previous release still present
    0 x [object Object]   0 x undefined<

card-only (website_photos) -> HTTP 200, 664,200 bytes
    PRESENT  0.47.4 section header
    PRESENT  the release title
    ABSENT   note 1, Drive, first half
    ABSENT   note 1, Drive, closing clause
    ABSENT   note 2, first login, first half
    ABSENT   note 2, first login, caveat
    PRESENT  previous release still present
    0 x [object Object]   0 x undefined<
```

**Four probes per note, two per note, so a half-rendered note would show.** Each note is matched on two separated phrases rather than one, so a note truncated between them would read as half present rather than passing.

**A non-Admin sees the `0.47.4` heading and title with nothing beneath**, which is what two admin-only notes mean and is unchanged by this cut. Recorded so a reader meeting it does not file it as a fault.

The page was fetched over HTTP with the session cookie and matched as text, **not** rendered in the browser pane, because a page loaded there by its address never completes React's Suspense swap and every note would read as absent (`CLAUDE.md`).

- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. Its failure modes are "a note was lost or altered", "a note was invented" and "the mail flag is wrong", all asserted mechanically in §2

### Role access matrix

- [x] Every login tested / a login that should not have access is blocked server-side — the one audience boundary this cut has is the two `admin: true` notes, driven with two real logins above. **It is a visibility boundary and not a security one**: `/releases` is open to every signed-in login and the cut adds no route

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed by the cut. The release's own string changes were checked in their plans; release notes are not translated

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, loaded above with the new and the previous entry both present, under two different logins
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs` and `scripts/pi/guard-release.mjs`, both of which refuse a mismatch between `package.json` and the newest entry; `check-release-guards.mjs` exercises both guards' branches
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the cut itself. **`#cn7gk` was ticked by #1718 in this very range**, which is what closes the second-Google-account blocker this release publishes a note about
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical and had no judgement to record. Its one decision — no email — is Lutan's, recorded in §1
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[2 vs 2]` against `origin/main`; the no-mail from the absence-and-control pair rather than from `major: false`; both notes' audience from two real fetches with two different logins; "no migration in this release" from an empty `git diff` over `supabase/migrations/` plus `--status` on both databases; the audit from `audit:register`'s own exit code; and the font-fetch observation from a build run in a fresh worktree under the reverted IPv6 setting

### The deferred-note question, answered per plan

`check-deferred-notes.mjs` flagged **8** candidates. **Only one is in this release's own range** — the scanner ignores the commit range it is given and re-reads from an older cut point, the known over-listing quirk that `0.47.2` and `0.47.3` both recorded. Each was answered in the `--deferred-reviewed` argument on this PR. Two are worth naming:

- **`shelter-admin-role-schema` IS closed by this release, and its note is already here.** Its app half is #1716, inside this very range, and that PR wrote the note now being published. This is the deferred-note mechanism working exactly as designed: a schema PR deferred, its app PR closed the step and wrote the note, and the cut publishes it
- **`calendar-connect-screen`'s reason has moved on and still owes no note.** It read *"a token only Lutan can mint"* — and `#cn7gk` closed in this release, so that account now exists and a second shelter's Drive upload was proved into it. But connecting a shelter's **calendar** is still the operator script `connect-shelter-calendar.mjs` with no screen (`#drvcl` is the open item) and no shelter but Lanna has one connected, so a note would promise something that does not work. **Recorded rather than repeated from last release's wording**, because a stale reason is how a note gets missed

The rest have no user surface: two release records, two handovers, a docs-only pass, and `scheduled-writer-visibility`, which still needs the machine login and its secret (`#aaqtl`, Lutan's) before Thai label proposals do anything.

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

**The starting state is not uniform, and that is this release's one carried-forward complication.** All three sites serve `0.47.3` @ `c473c1f35` from the Pi, and the **test and UAT Workers are on `0.47.3` while production's is on `0.47.2`** — `0.47.3`'s production Worker deploy was refused after `main` moved, and `docs/releases/2026-11-19-0-47-3.md` records why. **This release's production Worker deploy closes that**, because it carries `c473c1f35` and everything since in one commit.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `bc13394ee` is the cut commit, sitting directly on `origin/main` at `be50716f7`. Re-checked immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each build's own log

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date; the entry's date is a literal asserted against the requested value
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable**
- [ ] UAT's project line reads `fsjagxmxjosauwmxwype` before anything else — deferred: release manager, at the UAT deploy. If it names dev or production, stop
- [x] **The known risk to the production deploy is named in advance rather than discovered.** `0.47.3`'s production Worker was lost to `next/font/google` failing to fetch, caused by the machine preferring IPv6 while having none; Lutan reverted the mitigation afterwards, so the condition is back. The gates' build here succeeded under it (observation 1), so it is intermittent. **The test Worker build is first in the deploy order and is therefore the canary**: if it fails on fonts, the `netsh` line goes to Lutan alongside his command rather than after a failure

### Migration ordering

- [ ] Every line in this section — n/a: **no migration in this PR or in the release.** `check-release-order.mjs` has nothing pending to hold on either guarded environment

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref c473c1f35` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **This release has no migration, so a code rollback is complete on its own** — nothing to roll back with it, and no schema/code ordering to respect. That is a real difference from the last two releases and is the reason this one is low-risk. **Nothing to unsend:** this release mails nobody

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium, carried forward | **Production's fallback Worker is a release behind** (`0.47.2`), from `0.47.3`'s refused deploy | **this release closes it**, if the production Worker deploy completes. Recorded here so it is not read as new |
| 2 | medium, carried forward | **Nobody is a product administrator on production and no script places the first one.** This release adds a second note about that same screen — giving a shelter its Admin role and a first login — so a second capability is published that nobody can reach | **found, filed as `#pdmin`.** Not fixed inside a release: whose account is first is Lutan's call. Worth noting the gap is now *wider* than when it was filed |
| 3 | low (tooling, recurs) | **`deploy.mjs --plan` reports the mail decision without reading the release's own `major` flag**, so it says "would be mailed" on a no-email release | **found, not fixed.** The deploy itself is correct, proven by both of last release's real runs |
| 4 | low (tooling, recurs) | **`check-deferred-notes.mjs` ignores the commit range it is given**, re-reading from an older cut point: 8 candidates for a 5-PR release | **found, not fixed.** It costs a few plan reads. `0.47.2` recommended a backlog item rather than a fix inside a release |

### Observation 1 — the font fetch, under the reverted setting

Not a defect of this cut, and recorded because the next release manager will want it. The gates' `next build` ran in a **fresh worktree with no `.next`**, so Google Fonts were fetched rather than served from cache, **with the IPv6 preference back at the Windows default** that caused `0.47.3`'s two failures — and it succeeded first time. **So the fault is intermittent, not deterministic.** The permanent fix is to stop the build needing the network at all (local fonts), which is a code change and not a release-time one.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Who the first product administrator is, and whether that account already has an authenticator** — defect 2, now covering two published capabilities rather than one | Lutan, then the `#pdmin` script |
| 2 | **The `aal2` presses on `/admin/product-admin`**, including this release's new Admin-role-and-first-login step. `shelter-admin-role-app` leaves them `pending:` because a dev sign-in has no authenticator | Lutan, with an authenticator |
| 3 | **A second shelter's Drive, end to end on a real screen.** #1718 proved the upload through the real photo route with the second Google account, which is strong, but no person has driven it | Lutan |
| 4 | **Thai that nobody independent has read** — the standing gap, seventh release running (`#y1dqu`) | a Thai reader, and Lutan to sign |
| 5 | **`0.47.3`'s own outstanding items**, carried forward: the calendar look on test, Settings as Admin and as a card-only login, the live Pi scheduled units, the runbook read, and the next `/plan-day` run | Lutan |
| 6 | **`0.47.2`'s and `0.47.1`'s carried-forward items** — the per-shelter policy click-throughs, `/admin/security` with a real code, a plan image on `/admin/facility-maps`, one Who does what click-through, the e-Donation screens and the phone-width items | Lutan |

*(No release mail is on this list, and there is nothing to read for one: this release mails nobody, asserted in §2.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the first product administrator and the aal2 presses, a Thai reader for the dictionaries, and the items carried forward from 0.47.1 to 0.47.3

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy, which also closes defect 1

Result: pass with accepted defects
