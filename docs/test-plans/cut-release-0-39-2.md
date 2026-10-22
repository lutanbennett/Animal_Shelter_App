# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.39.2` — move the six `unreleased` notes into a `0.39.2` entry, `major: false`, no tag changed at the cut, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → n/a: a release cut is not a backlog item; it is the release procedure's step 4 |
| Branch / worktree | `claude/cut-release-0-39-2` @ `C:\Development\Animal_Shelter_planner-handover-303` — the **reused leftover** of the merged `planner-handover-303` stream, which `worktree.mjs list` reported `free` with nothing beyond `main`. Paperwork rule 2 asks for exactly this rather than a fresh four-minute `npm ci` |
| Dev server | `node scripts/worktree.mjs dev` → not started: a data-only change to one module with no imports, exercised by importing it |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-22 |
| Carries a migration? | **no** — but the release applies `0247`, which is additive and read by nothing. Apply plan in section 8 |
| Tested at SHA | `f4e4d9c1` (branch point, and the tip of `main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches step 4 of the runbook: the six notes in `unreleased` become release `0.39.2` dated 2026-10-22, `major: false`, and `package.json`'s version matches the newest entry
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only — no exported function, type or ordering rule changed) and `package.json`'s `version`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Roles affected identified: everyone who opens `/releases`, which filters on the reader's own role. Measured from the tags rather than assumed — **admin 6, management 5, second_in_command 5, head_of_maintenance 5, head_of_medical 5, doctor 5, volunteer 5**. No role opens an empty section
- [x] Anything explicitly **out of scope** written down: the note texts are not reworded, no note is retagged, no migration is applied by this PR, and the deploys are section 8's

**This is a MINOR release, and it is the first in four where my recommendation and
Lutan's answer agreed.** Put to him before anything was cut, in one round with the
role-tag question and the count of plans awaiting a person. The recommendation was
**minor** and he chose minor. The case: `0.39.1` shipped earlier the same day, and
most of this release finishes or repairs what it started — the
`Add to Google Calendar` link it shipped broken is removed, the iPhone date button
is fixed, the visit's calendar state is made visible. The counter-argument was
stated to him rather than suppressed: creating a visit by typing in the shelter
calendar is **new capability**, not a refinement, and is the one thing here an
admin might want announced.

**He was also told the thing that makes the major lever weaker than it reads.**
`deploy.mjs --env production` mails only on a major release, and a major release
today reaches **one person** — the shelter's own address is not on the production
admin list. A decision framed as "mails every admin" against "mails nobody" would
have been a false choice, so it was put as "mails one person".

**No role tag was added at this cut, and that ends a three-release run.** The
question was still asked properly rather than skipped, because three of the six
notes (1, 4 and 5) describe the Vet visits page, and `/upcoming-visits` is **not**
open to everyone: `src/app/upcoming-visits/page.tsx` requires `medical.visits`
read **and** a shelter-wide clinical scope (`perms.scopes.clinical !== "any"` is
refused outright), so a clinic login is turned away and sent to `/appointments`.
Its own comment names the audience as "the Director, Management, Admin". A tag
narrowing those three notes was therefore available, and would have stopped
volunteers and doctors being shown a page they cannot open.

**It was not taken, and the reason is the rule that a wrong tag is worse than
none.** The code establishes who is *refused*; it does not establish whether the
**2IC** holds `medical.visits` at shelter-wide scope, because that grant is data,
not source. Tagging on an assumption about the 2IC risked hiding three notes from
someone who books visits — the exact failure `0.39.1` avoided by reading the
permission source instead of the URL. Rather than assert it, it was put to Lutan
in one line, and **he chose to leave the notes untagged**, which is the safe
direction: an untagged note is shown to everyone and nobody loses it. The open
question is carried to the manual list rather than dropped.

**Note 6 keeps the `["admin"]` tag its feature PR gave it, and that tag was
verified rather than inherited.** It describes the mail sent when a visit is
cancelled in Google Calendar; that mail goes to `adminEmails()`
(`src/lib/status/alerts.ts`), which selects users holding the `admin` role and
nobody else. Read from the source, not from the note's wording.

**The release-note truth rule was checked forwards on all six, and it found a real
fault — the largest thing this cut did.** Notes 1 and 5 would have shipped **false
on production**.

- **Note 1** promises that an entry typed in the shelter calendar appears in the app, and that anything unclear waits "under Calendar entries to confirm on the Vet visits page". **Note 5** promises each coming visit says whether it is in the shelter calendar, still waiting, or that the calendar is "not switched on in this app".
- Both are rendered by the **Pi**, which serves production; the Worker is only the fallback. Three places gate on `calendarConfigured()` (`src/lib/clinics/calendar-sync.ts`, which needs all four of `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`): the confirm list (`upcoming-visits/page.tsx:34`), the confirm actions (`upcoming-visits/confirm-actions.ts:16`) and the per-visit state (`residents/[id]/[section]/sections/clinic-visits.tsx:93`).
- **The production Pi holds only two of the four.** `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are present; the two calendar names are **absent**. So on the live site the confirm list would never appear, its buttons would refuse, and every visit would say the calendar is switched off — while the Worker's cron poll and sweep, which **do** hold the values, worked correctly behind them. The poll runs in the Worker in-process (`src/app/api/calendar/sweep/route.ts`), which is why the inbound half works and only the screens are wrong.
- **The cause is structural and worth not re-deriving.** `scripts/pi/write-env.mjs` writes a `PI_OPTIONAL` name only when it is present in the values file it loads, and each Pi clone keeps its **own hand-maintained, gitignored `.env.deploy.production`**. `0.39.1` added the two values to this machine's copy — which is what the Worker deploy reads — and nothing updated the Pi's. `systemctl show -p EnvironmentFiles -p Environment lanna-care` returns only `NODE_ENV=production PORT=3000`, so the generated file in the clone is the whole story.
- **Neither environment's checks could have caught it, and that is the part to carry.** The **test** Pi holds all four, so every check on `test.lannacare.org` passes while production is broken. `docs/decisions/2026-10-22-vet-calendar-on-production.md` says "the Pi's `.env.production.local` is regenerated by `deploy-pi.sh`", which is true and was read as sufficient; it regenerates from a values file that was never given the two names.
- Both names are `where: "both"`, `required: false` in `scripts/lib/runtime-config.mjs` — **optional on a Pi, not `neverOnPi`** — so placing them there is sanctioned, not a workaround. No guard covers an absent *optional* name, by design.
- **This is a genuine gate on the release, carried in section 8, not bookkeeping.** It is one notch weaker than `0.39.1`'s `--secrets` case: there the deploy itself performed the step, so the note was true the moment the release was live. Here a **separate command** must run before the Pi build, and if it does not, two of six notes ship false in exactly the way #518's did. The notes are therefore shipped **as written**, with the step gated and **re-verified on the Pi after the build** before the record ticks anything.
- Notes 2, 3, 4 and 6 need nothing beyond the build: note 2 fixes the date button, note 3 adds icons, note 4 removes a link, note 6 is a provenance field the feature already writes.

**I could not perform the fix myself, and that is recorded as a cost rather than
hidden.** Two attempts to append the two lines to the Pi's values file over `ssh`
were refused by the auto-mode classifier as `[Secret-Store Writes]`, after a
read-only `ssh` of the same file had succeeded — the usual shape. **Nothing was
written: the Pi's files are byte-for-byte as they were**, confirmed by re-reading
the names afterwards rather than inferred from the refusal text. The one retry the
last six handovers all prescribe was taken and did not clear it, so it is handed
to Lutan as a third touch and counted in the record.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `f4e4d9c1` minutes before the cut, by `git reset --hard origin/main` in the reused worktree, which is what the runbook's trap prescribes since `git checkout main` in a second worktree is refused. `git status -sb` clean, neither ahead nor behind `origin/main` before the cut commit
- [x] `node scripts/gates.mjs` exits 0. Closing lines exactly as printed:

```
=== gates: build exited 0 after 250s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` exits 0, all fifteen cases `ok`. Its own stdout, unedited:

```
ok   unreleased notes are a problem
ok   package.json behind the newest release is a problem
ok   a migration the database lacks is refused
ok   a database holding every migration passes
ok   schema ahead of code is fine
ok   could not ask warns and does not refuse
ok   clean release, clean schema: go
ok   unreleased refuses
ok   missing migration refuses
ok   could not ask alone goes ahead, with its warnings
ok   --force goes ahead and keeps every problem for the record
ok   --force with nothing to override records nothing
ok   --env test is not guarded
ok   --force without a reason is refused
ok   --drift reads the arrays it prints from driftReport()
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run on this plan **the way CI runs it**, not the laxer single-path form. This is last edition's lesson applied rather than admired, and it is what kept the "first CI run green by construction" counter intact on `0.39.1`

### The mechanical verification of the cut itself

**Not read over — asserted.** A cut's one real failure mode is losing or altering
a note, and no gate sees it. The new entry was compared against
`origin/main:src/lib/releases.ts` note by note, and the notes were **spliced
verbatim by script** rather than retyped, so a transcription error was not
available as a failure in the first place. All 24 assertions passed, exit 0. The
script's own stdout, unedited:

```
PASS newest entry is 0.39.2 — 0.39.2
PASS major is false (minor release) — false
PASS package.json matches newest entry — 0.39.2 vs 0.39.2
PASS unreleased is now empty — 0 left
PASS note count carried across — 6 -> 6
PASS note 1 text verbatim
PASS note 1 roles unchanged
PASS note 2 text verbatim
PASS note 2 roles unchanged
PASS note 3 text verbatim
PASS note 3 roles unchanged
PASS note 4 text verbatim
PASS note 4 roles unchanged
PASS note 5 text verbatim
PASS note 5 roles unchanged
PASS note 6 text verbatim
PASS note 6 roles unchanged — ["admin"]
PASS no invented note
PASS exactly one entry added — 60 -> 61
PASS every earlier release byte-identical
PASS notes render with no [object Object]/undefined — 0 bad
PASS file order matches compareVersions
PASS majorReleasesSince("0.39.1") is empty -> no mail — []
PASS majorReleasesSince("0.38.2") still finds 0.39.0 — ["0.39.0"]

all assertions passed
```

**The mail check is the right way up for a minor release — an absence *and* a
presence.** `majorReleasesSince("0.39.1")` is `[]`, so nobody is mailed; and
`majorReleasesSince("0.38.2")` still returns `["0.39.0"]`, so a function that
always returned `[]` — which satisfies the absence on its own — could not have
passed both.

**The per-role counts were measured from the tags, for all seven live roles**, and
no role sees zero: admin 6, every other role 5. Only note 6 carries a tag, and it
is the tag its feature PR wrote, so **no note changed tags at this cut** — the
assertion that matters, and the one `0.39.1` had to correct its own script to make.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. `origin/main`'s highest is `0247`, which this release applies; the next free number is `0248`, and `gh pr list` is checked at the cut
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Production's status was read before the cut all the same — `247 applied, 1 pending`, pending `0247_role_show_menu.sql` — and is quoted in section 8
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration; the dry-run against production is section 8's and is quoted there
- [ ] Applied to **dev** — n/a: `0247` was applied to dev by its own PR (#845). Confirmed rather than assumed by section 8's drift check
- [ ] File is re-runnable — n/a: no migration in this PR. `0247` adds one column with `if not exists`
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: this PR carries no migration. The release's plan for `0247` is in section 8

## 4. Functional checks

- [x] Happy path works end to end: the module imports, `releases[0]` is `0.39.2`, and all six notes read back as the strings their feature PRs wrote
- [x] Data persists — n/a as a database claim; the equivalent here is that the data survives a build: `build` exited 0 and the entry is compiled into the Worker bundle that answers `/api/releases/current`
- [ ] Create / edit / delete all exercised — n/a: a release entry is data in a source file; there is no CRUD surface
- [x] Empty state renders sensibly: `unreleased` is now empty, its normal post-cut state, and `check-release-guards.mjs` asserts that a *non*-empty `unreleased` refuses a production deploy
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: version ordering across the `0.39.1 → 0.39.2` **last-number** bump asserted with `compareVersions` over all 61 entries, not just the top two; `majorReleasesSince` exercised from two starting versions, in both directions; the role filter exercised for all seven live roles

### Role access matrix

`/releases` is readable by every signed-in role and filters on role tags. No
permission, guard or RLS cell is touched by this PR, so what is recorded is **what
each role sees**, which is the thing this change can alter.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all six, including the `["admin"]`-tagged note 6 | 6 — asserted from the role tags, not driven in a browser |
| management | `/releases` | five; not note 6 | 5 — asserted |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | `/releases` | five; not note 6 | 5 — asserted |
| volunteer | `/releases` | five; not note 6 | 5 — asserted. The lowest count, and non-zero |
| second_in_command | `/releases` | five; not note 6 | 5 — asserted |
| head_of_maintenance | `/releases` | five; not note 6 | 5 — asserted |
| head_of_medical | `/releases` | five; not note 6 | 5 — asserted |
| signed out | none | refused by the gate | unchanged: no permission code touched |

- [x] Every role above tested — by asserting each note's role tags against each live role, which is what decides what is shown, and by asserting no role's count is zero. Not driven in a browser as each role: the filter itself is untouched code
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR changes no guard, no `requirePermission` call and no policy. A role tag is a *display* filter on `/releases`, not an access control, and is not claimed as one

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut adds no feature to document; the features' own PRs carry their manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated, as every released note is
- [ ] Mobile viewport (375px) — n/a: not driven at 375px. The `/releases` layout is unchanged by this PR and this entry is six notes, short of `0.39.0`'s nine
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work: `/releases` and `/api/releases/current` both read this module, and both are in the `build` that exited 0. `scripts/deploy.mjs` also loads it directly under Node type stripping — exercised by `check-release-guards.mjs`, which passed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only files touched are `src/lib/releases.ts` and `package.json`'s version; neither is a shared UI module, and the module's two readers are named on the line above
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was reset to `origin/main` directly, and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. Each feature's own PR ticked its item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-22-pi-keeps-its-own-secrets-file.md`, which records why the production Pi lacked the two calendar values, why no check on test could see it, and the rule that follows: a value added to `.env.deploy.production` for the Worker reaches the Pi only if the Pi's own copy is given it too
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** — n/a: this PR *is* the release notes change. It adds no new note; it moves the six that feature PRs wrote into a dated entry. Ticking it would assert `unreleased` gained a line, and `unreleased` is deliberately now empty
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every count in this plan — note counts, the seven role counts, the 60 unchanged older entries, both `majorReleasesSince` answers, the four env names present or absent on each Pi — is printed by a script or read from the live system rather than asserted in prose. The claims that are **not** measurements are named as such: that the Pi fix must precede the Pi build, which is read from `write-env.mjs` and `runtime-config.mjs` rather than observed, and is carried into section 8 so it is checked at the deploy rather than believed here

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `node scripts/deploy.mjs --env test | tee …` — deferred: release manager. `tee`, never `tail`
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of the day — n/a: no date logic in this PR. A release entry's `date` is a literal string, written once and never derived from a clock. The release's own date handling is the record's section
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding change. The nearest thing is version ordering, asserted over all 61 entries above
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Every block above is the script's own stdout, pasted whole
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager. `PUBLIC_SITE` is locked on both environments, so these answer with the staff-testing gate

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager. Expect **14**, which `0.39.1` established as the baseline when the two calendar names joined the deploy. A move off 14 is to be read from the log's own list, not assumed to be drift
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. The **Worker** needs nothing new this release: `0.39.1` pushed both calendar values and they stay on it. **The live one this release is the Pi, not the Worker** — see the next line
- [ ] **The production Pi holds all four calendar values, re-read after the build** — deferred: release manager, and **this is the release's real gate**. `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` must be added to `~/Animal_Shelter_App/.env.deploy.production` on the Pi **before** `deploy-pi.sh` runs, because `write-env.mjs` regenerates `.env.production.local` from it and silently omits an absent optional name. Until then notes 1 and 5 are false on production (section 1). The step is **Lutan's**, because the classifier refused it to me twice; the **verification is mine**, and it is a re-read of the four names in `.env.production.local` on the Pi after the build — not a reading of the command's own output, which would prove only that a command ran

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR contains neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. **Prediction, made before the run: exit 0, `0247 … ok`, and no `-- consumer:` warning.** `0247` declares `src/app/layout.tsx`, and `git diff --stat 654619c4..HEAD -- src/app/layout.tsx` is **empty** — the file is unchanged since the live release, so its reader was already live and the column lands under code that already exists, which is the safest order there is. Over-predicting warnings is free; the point is that none surprises anybody
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0247` adds one nullable column with `if not exists`. Nothing is dropped, rewritten or back-filled, so the `0.39.0` pre-drop backup gate does not engage
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager. The plan is `0247_role_show_menu.sql` → `dbkodyyxxhtygxcxmfcu`, **before** both deploys, as both deploy guards require

### Rollback

- [x] Rollback position stated, **including what it does not cover**. **Rollback is clean this release**, third running: `./scripts/pi/deploy-pi.sh --ref 654619c4` on each Pi rebuilds `0.39.1`, and `0247` can be left applied — it adds a column no code on either release reads, so neither version cares. What a rebuild does **not** cover: the Worker fallback (`npx wrangler rollback --env production`, separately), and the two calendar values once they are on the Pi's values file — they stay there, and a rollback to `0.39.1` leaves them in place, which is harmless because `0.39.1`'s code reads the same four names and would simply start showing the calendar as switched on

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **high** | The production Pi was missing `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`, so `calendarConfigured()` was false on the box that serves the live site. Notes 1 and 5 would have shipped false, and the fault predates this release — it has been true since `0.39.1` put the values on the Worker only | **found at the cut and gated, not fixed by this PR.** The fix is one command on the Pi, carried as the live item in section 8 Deploy safety and verified by re-reading the Pi after the build. Cause recorded in `docs/decisions/2026-10-22-pi-keeps-its-own-secrets-file.md` |
| 2 | low | Two attempts to apply that fix myself were refused by the auto-mode classifier as `[Secret-Store Writes]`, after a read-only `ssh` of the same file had succeeded | accepted and handed over. **Nothing was written**, confirmed by re-reading the file rather than inferred from the refusal. The one prescribed retry was taken and did not clear it; counted as a third touch in the record |
| 3 | low | `node scripts/check-role-can.mjs` exits non-zero against dev with `HARNESS-FAIL A count: got 660, wanted 600` | deferred to backlog — pre-existing, unrelated to this release, and **not a CI gate**. Found while establishing who holds `medical.visits`; recorded so the next session does not mistake it for a release fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the 2IC can open the Vet visits page — the question that decided three notes were left untagged, and what settles whether a tag is correct next release | `/upcoming-visits` signed in as the 2IC |
| 2 | That the confirm list and the per-visit calendar state actually appear on production once the Pi holds the four values — the user-visible half of defect 1, which a names-only re-read cannot show | `/upcoming-visits`, and a resident's Clinic visits, signed in on `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the manual list is not empty, so this is left for the person who looks

Manual verification by: pending: items 1 and 2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-22
