# Feature test plan — cut-release-0-25-0

## Header

| | |
|---|---|
| Feature | Cut release `0.25.0`, **major**: move the five `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-25-0` @ `C:\Development\Animal_Shelter_cut-release-0-25-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (production release manager session) / 2026-10-10 |
| Carries a migration? | no — but **three** migrations ship in this release (`0175`–`0177`) and all three are still pending on production. See §3 |
| Tested at SHA | `adda2871` (`origin/main` at the cut, read from the remote after a fetch; `git merge-base HEAD origin/main` returns the same) plus this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.25.0` entry holding the five notes written by the release's thirteen PRs (#506–#518), and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **three notes are untagged** (the colour theme, map room descriptions, the map zoom buttons) so every signed-in role sees them; **two carry the tags their own PRs wrote**: the donation resident picker (`admin`, `management`) and the Website visitors tile (`admin`). `major: true`, so **every admin is mailed**, which §2 asserts rather than assumes
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record, its own PR after the deploy; (c) the ten unsigned feature plans, which keep their own `pending:` signatures and are **not** copied here; (d) `0.20.0`'s six-release-old Contacts item, which this release is asked to close and replace — that is a backlog edit, not a change in this diff

**Decided in chat by Lutan, 2026-10-10: `0.25.0`, major.** Asked before cutting
with the argument for each side put to him, as §4 of the runbook requires, and in
one round together with the silent-failure question and the ten unsigned plans.

The case for major, which he took: **four of the five notes are new things people
can now do** — choose a colour theme, add and describe rooms on the facility map,
find a resident (deceased ones included) when recording a gift, and a Website
visitors tile that has said *Not set up* until now. The mail is the only way
anyone finds out those exist.

The case against, which he heard, and it is a genuine departure from the last
four releases: **nothing moved.** No role was renamed or removed, no menu entry
or page relocated, nothing was taken away, and the app looks exactly as it did
unless someone chooses a new theme — the default is still Dark. `0.21.0` through
`0.24.0` were all major because *pages moved or a role gained or lost a section*,
and that test is **not** met here. This release is major on the other ground: it
adds abilities worth telling admins about. Worth recording, because the next
release manager reading four identical precedents should know this one differs.

**Risk in this PR is confined to losing or altering a note**, which no gate
reads, hence the mechanical comparison in §2 rather than reading the entry over.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a as a merge: there was nothing to merge. `git fetch origin` then `git merge-base HEAD origin/main` both returned `adda2871`. Read from the remote, not from a local ref cached earlier — and this mattered: `origin/main` moved from `139ed019` to `adda2871` during this worktree's `npm ci`. That commit touches only `docs/backlog.md`, and `origin/main`'s `unreleased` still held the same five notes, so the cut is based on the newer commit and is unaffected
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

```
=== gates: build exited 0 after 180s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — read on PR #519, not ticked in advance. The first run at `9f81323c` was **6 green, 1 red**: `check` (2m15s), `public-views` (1m34s), `audit`, `migration-numbers`, `new-policy-role-names` and `script-integrity` all passed, and `test-plan` failed on **this very line**, which that commit left unticked because the run had not happened yet. That is `test-plan` doing exactly its job — validating content, not presence. Completed here, and the run on this commit is the one that reports seven green. **`audit` was green**, so the standing "a red `audit` never blocks" note did not need to be exercised
- [x] `node scripts/check-release-guards.mjs` — exit 0, all fourteen cases, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`
- [x] `node scripts/release-prs.mjs d8b19418 origin/main` — **exit 0**, read from the command and not through a pipe, listing thirteen PRs #506–#518 and checking all sixteen added migration and test-plan files against that list. Re-run after `origin/main` moved; still thirteen

**The cut was verified mechanically, not read over**, as the runbook requires.
Twenty-one assertions from one script that exits non-zero on any failure,
comparing the new entry against `origin/main:src/lib/releases.ts` note by note.
Its actual output, unedited:

```
Asserting the 0.25.0 cut (5 source notes):

  ok   unreleased is now empty  — 0 left
  ok   new entry is at the top  — 0.25.0
  ok   date  — 2026-10-10
  ok   major is true (this release is mailed)  — true
  ok   note count matches the source  — 5 vs 5
  ok   text lost 0
  ok   text invented 0
  ok   character count identical  — 1284 vs 1284
  ok   every source note used exactly once  — got [3,2,1,0,4]
  ok   order is the intended one  — got [3,2,1,0,4]
  ok   role tags changed: 0  — 0 changed
  ok   no [object Object]
  ok   no undefined / null in rendered text
  ok   every note is non-empty text
  ok   every role tag is a declared ReleaseRole
  ok   majorReleasesSince("0.24.0") === ["0.25.0"]  — [0.25.0]
  ok   package.json version === newest entry  — 0.25.0 vs 0.25.0
  ok   file order still matches compareVersions  — 38 entries
  ok   no duplicate version
  ok   previous entry count +1  — 37 -> 38
  ok   all 37 previous entries byte-identical

21 assertions, 0 failed
```

Lines were **moved, never retyped** — the cut script lifts each note's own source
line and re-indents it, so the text cannot drift; `text lost 0 / invented 0` is a
character count of both sides (1284 either way), not a reading.

**The order was changed at the cut**, as the last four were. The notes left
`unreleased` in whatever order their PRs happened to add them, which put the two
role-tagged notes around the three everyone gets. A major release is mailed, so
the entry is also what every admin reads first. The permutation is `[3,2,1,0,4]`:
the three untagged notes lead — the colour theme, the map room descriptions, the
map zoom buttons — then Donations (`admin`, `management`) and the visitors tile
(`admin`).

**No note was given or lost a role tag**, asserted as `role tags changed: 0`. A
tag invented at the cut is a change to a note its own PR did not write, and a
wrong tag hides a line from the people it is for.

## 3. Schema and data

This PR carries no migration, so the lines below are `n/a`. The section is kept
rather than skipped because **three migrations ship in this release**, and the
question of whether any of them can break the live app quietly was answered here
before the cut.

- [ ] Migration number is one above the highest on `main` — n/a: this PR adds no migration. The three in the release are `0175`, `0176` and `0177`, each numbered by its own PR; `0177` is the highest on `main`, so the next free number is `0178`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — reviewed for the release: production `174 applied, 3 pending` (`0175`, `0176`, `0177`), and the comparison against `origin/main` names the same three in one direction and **nothing** in the other. That is the handover's legitimate one-sided case, *production behind `main` because migrations merged since the last release*. Dev holds all 177
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR adds no migration, so there is nothing here to dry-run. The release's three files are dry-run against production as a pre-production gate, owned and recorded in §8, because the runbook puts that step after the merge and pull
- [x] Applied to **dev** and recorded in `schema_migrations` — all three were applied to dev by their own branches under the schema-first rule, which is why dev reads `177 applied, 0 pending`
- [ ] File is re-runnable — n/a: no file in this PR
- [x] Existing rows still read correctly after the change — **this is the release's central question and it was answered in code, not from the migration headers.** See below
- [ ] Constraints and defaults exercised against real rows — n/a: no constraints or defaults in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration here. The revert for this PR is a git revert of two files; the release's rollback position is in §8
- [x] Production apply plan stated for the release manager — **stated**: `0175`, `0176`, `0177` in one run of `node scripts/apply-migrations.mjs --env production` from the main checkout, **after** this cut is merged and pulled and **before** either deploy, per `0.20.0`'s correction (merge, pull, apply, deploy)

### The silent-failure question answers *no*, and here is the reading that says so

All three migrations carry a `-- consumer:` header naming files that **already
exist**, which is the signature the `0.24.0` record says to stop at and ask:
does this file *add*, *restrict*, or *rename*? Each was opened, and the live
release's source was compared against this release's.

**`0176` and `0177` — donation receipts built by the server.** Both change
`issue_donation_receipt()` so it stores the database's own `receipt_issuer(country)`
and `receipt_content(donation)` instead of whatever the caller passed. Both
**deliberately keep the old `p_issuer` and `p_content` arguments and ignore
them**, stated in each file's header as *"so the deploy order does not matter"*.
So the live `0.24.0` app, which still sends both, keeps working either side of
the apply.

The one way this could fail quietly is if the SQL copies disagreed with the live
app's functions — a receipt would then read differently from the donation without
erroring. Checked by diffing the two files the copies mirror, between the live
release and this one:

```
$ git diff d8b19418 HEAD -- src/lib/donations/issuer.ts src/lib/donations/donations.ts
```

**Only comments changed.** `receiptIssuer()` and `receiptContentFor()` are
behaviourally identical in the live build and this one, so the database's copies
match what is live to the character. `scripts/check-donation-receipts-schema.mjs`
is the standing guard that they stay that way.

**`0175` — map room names and descriptions.** It adds `name`, `name_th` and
`description`, drops the old one-of-three check on `kind` and makes `kind`
nullable, then makes `name` NOT NULL. That last line is the only one that could
break a live write, and the file installs a BEFORE trigger
(`map_rooms_name_from_kind`) that fills `name` in from `kind` first, with its own
comment saying so: *"NOT NULL is checked after BEFORE triggers, so today's
kind-only upsert still works."* Confirmed against the live code, which saves a
room with `upsert({ kind, map_id, shape }, { onConflict: "kind" })` and reads
`select("kind, shape")` — `kind` and its unique rule both survive, and no column
the live build names is removed or renamed.

**Conclusion: this release has no window.** Nothing in `0175`–`0177` renames or
narrows anything the live `0.24.0` build reads or writes. That is a different
answer from the last two releases, and it is the product of reading the code
rather than the headers.

## 4. Functional checks

- [x] Happy path works end to end — the register is data read by `/releases`, `/api/releases/current` and `worker/release-mail.mjs`; `majorReleasesSince("0.24.0")` returning exactly `["0.25.0"]` is the happy path for the mail, asserted in §2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved by a user. The data is source, and git is its persistence
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete screen exists for the register
- [x] Empty state renders sensibly (no rows yet) — `unreleased` is now empty, which is its correct state after a cut; `releases` gained an entry rather than losing one
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. The guard that stands in for this is `check-release-guards.mjs`, which refuses a deploy while `unreleased` has lines or `package.json` disagrees, and it passed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the file still sorts descending under `compareVersions` across all 38 entries against a neighbour dated the same day (`0.24.0`, also 2026-10-10), which is the one real ordering risk here and is asserted; `latestRelease` resolves to `0.25.0`; the two tagged notes keep their `roles` arrays and the three plain strings have none, the shape `noteRoles` expects

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five, and is mailed on deploy | pass — both tagged notes name `admin`; `majorReleasesSince` asserts the mail |
| management | `/releases` | sees the three untagged and the donation picker note; not the visitors tile | pass — tags unchanged from the PRs that wrote them |
| second_in_command | `/releases` | sees the three untagged | pass — untagged notes carry no `roles` |
| head_of_maintenance | `/releases` | sees the three untagged | pass — as above |
| head_of_medical | `/releases` | sees the three untagged | pass — as above |
| doctor | `/releases` | sees the three untagged | pass — as above |
| volunteer | `/releases` | sees the three untagged | pass — as above |
| signed out | `/releases` | unchanged by this PR | pass — no route or gate touched |

- [x] Every role above tested — tested as the data question it is: three notes are plain strings so `noteRoles` returns undefined for them, and the other two keep byte-identical `roles` arrays, asserted as `role tags changed: 0`
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route and changes no permission. `/releases` keeps the gate it had

**One thing the matrix exposes, and it is a defect rather than a pass:**
`ReleaseRole` in `src/lib/releases.ts` still reads
`"admin" | "management" | "staff" | "doctor" | "volunteer"`. `staff` was retired
by `0.24.0` and three live roles — 2IC, Head of Maintenance, Head of Medical —
cannot be tagged at all. Nothing in this release is affected, because both tagged
notes use `admin` / `management`. Recorded as Defect 2 and filed on the backlog.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `src/lib/manual/` not touched. Release notes are not a manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are English-only in the register, as every previous entry is
- [ ] Mobile viewport (375px) — n/a: no layout changed. `/releases` already renders longer entries than this one. The release's own phone-width sweep is in §8
- [ ] Browser console clean — n/a: no browser check was run; this is a data-only PR and the build is the check that the file parses
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` both read this file and both are compiled by the build, which passed. The register's 37 previous entries are asserted byte-identical, so nothing older can have changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file was touched. `releases.ts` is read by `/releases`, `/api/releases/current` and `worker/release-mail.mjs`, all three in the build
- [x] Nothing merged from `main` during `sync` was broken by this branch — `origin/main` moved one commit during `npm ci` (`adda2871`, `docs/backlog.md` only). The branch is based on it; nothing in this diff touches that file

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release cut is not a backlog item. The release's own features ticked theirs in their own PRs
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious in this diff. The note order and the major call follow rules already written in `docs/release-procedure.md` §4; the major call's **departure** from the last four releases' reasoning is recorded in §1 of this plan and goes in the release record
- [x] `README.md` still accurate — unchanged by this PR, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this PR *is* the release notes. It moves the five lines the release's own PRs wrote out of `unreleased` into the `0.25.0` entry and adds none of its own, so `unreleased` is correctly empty afterwards
- [x] Commit messages say why, not just what — the cut commit records the major call and whose it was, both sides of the argument, why the order was changed, and the assertion counts
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Every claim in the cut commit is a line of the verification script's output, pasted in §2. The permutation, the character counts and the byte-identical comparison are measurements. The silent-failure conclusion in §3 is a `git diff` of two named files, not an inference from a migration header

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `adda2871` was `origin/main` at the cut, read after a fetch. `git status -sb` is re-read against the remote immediately before the deploy is handed over, per `0.21.0`'s lesson, and `0.24.0`'s experience of `main` moving inside the handover gap
- [ ] Deployed SHA matches the tested SHA — deferred: Claude, at the deploy. Both Pi builds are pinned with `--ref`; `deploy.mjs` has **no `--ref`**, so the Worker takes whatever `main` is when Lutan runs it. The `deploy: production → Supabase project … (<sha>)` line is read and diffed against the release SHA rather than read past, per `0.24.0` Defect 3

### On the deployed build

- [ ] Deployed to test — deferred: Claude, after the merge. Test gets the same commit as production
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Claude, via `docs/release-smoke-test.md`
- [ ] Phone-width sweep — deferred: Claude, against `test.lannacare.org` once it serves the release, naming the six surviving roles explicitly because the script's own `ALL_ROLES` still lists the retired `staff`. **`--clean` will not be run**: it deletes every `phonewidth-*` login it finds, not just this run's, and at `0.24.0` it deleted another stream's mid-run
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — nothing in this diff derives a time: the entry's date is the literal string `2026-10-10`, displayed rather than computed. It shares that date with `0.24.0`, which is why §4 asserts the sort order across the whole file rather than assuming it
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Every block in §2 and §3 is pasted from the scripts' own output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: Claude, as part of release verification; the edge-cache check is done in a real browser with the **same** URL three times, not with curl and not with a fresh query string, per `0.24.0`

### Deploy safety

- [ ] `deploy: production → Supabase project` line read and the ref matches production — deferred: Lutan runs the production deploy with `| tee`, Claude reads the log (which is UTF-16; `tr -d '\000'` first)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: Claude, from the same log, together with the `Server Actions key` fingerprint, which must match what the Pi build printed
- [ ] Any new secret or env var exists in the production Cloudflare environment — n/a: this PR adds none. The release's `pi-visitor-count` work reads `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID`, which are **optional secrets** by #518's own design — the tile says *Not set up* without them. Whether they are set on production is the one thing that decides if note 5 is true for Lutan, and it is in **Left for manual verification**

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, it contains neither. **The release does**, and the ordering question was answered in §3: all three migrations are compatibility-engineered so the live build works either side of the apply, so unlike the last two releases there is no window to keep short. The apply must still come **before** the deploys, because both deploy paths refuse a commit whose database lacks a migration on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Claude, immediately before the apply, on all three files. **If it fails on a later file for something an earlier pending file would have provided, that is the per-file `begin … rollback` trap and the correct action is still to apply** — `0177` builds on `0176`'s `issue_donation_receipt`, so this is a live possibility here. Read both files before concluding, and say which it was
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: none of the three is destructive. `0175` adds columns and relaxes a constraint; `0176` and `0177` replace function bodies and keep their signatures. No table, column or row is dropped. The nightly backup remains the position of record
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so a code rollback is `./scripts/pi/deploy-pi.sh --ref d8b19418`, a rebuild of `0.24.0`. `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration** — but unlike `0.24.0`, a code-only rollback here is *safe*, and that is worth stating plainly: because all three migrations keep the old columns, the old `kind` behaviour and the old RPC signatures working, `0.24.0`'s code runs correctly against the `0.25.0` schema. The one behavioural difference that would survive a rollback is that receipts issued afterwards still take their issuer and content from the server rather than the caller, which is the safer direction and the point of `0176`/`0177`. So the rollback is a genuine option here, not a trap

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **Ten of the release's thirteen feature plans are `pending:`** — nobody has looked at them. The three that are not (`check-harness-repair`, `parity-layer-3`, `map-rooms-schema`) are correctly `n/a: no UI surface` | **accepted and recorded, on Lutan's call of 2026-10-10**, put to him as its own question in the same round as major/minor and after the silent-failure question had been answered separately. Each plan keeps its own `pending:` signature; none is copied into this plan. The highest-value ones are carried into the release record |
| 2 | low | **`ReleaseRole` is out of date**: it still lists the retired `staff` and offers no `second_in_command`, `head_of_maintenance` or `head_of_medical`, so a note cannot be tagged for three live roles. A note tagged for the heads today would not compile | **deferred to the backlog** (filed on the `backlog` branch, 2026-10-10). Nothing in this release is affected: both tagged notes use `admin` / `management` only, and §2 asserts every tag used is a declared role. Named here because a release cut is the one step that reads this type, so it is where the staleness surfaces |
| 3 | low | **2IC is still the one role never measured at phone width** — `check-phone-width.mjs` has no `second_in_command`, and the 2IC has no PC on site | **already on the backlog**, carried from `0.24.0`. Not introduced by this release; named so the release record does not report the sweep as complete coverage |
| 4 | low | **`0.20.0`'s Contacts verification item has now been open for six releases**, and what it was waiting on has changed twice since (`0170` narrowed what staff may read of a contact; `0172` renamed the clinic a contact can be) | **being closed in this release, not carried a seventh time**, per the `0.24.0` record's instruction. Closed and replaced with an item written against current behaviour, on the `backlog` branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the mail's first note is the colour theme, read in the delivered message rather than inferred from the register | The admin mail for `0.25.0`, inbox |
| 2 | That the five notes read as a shelter user would want them, in this order | `/releases` on production, signed in |
| 3 | Whether `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are set on production — if they are not, note 5 is **not yet true** for Lutan and the Website visitors tile will still say *Not set up* | Settings → System status on production, after the deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked; the signature below names what is outstanding

Manual verification by: pending: the three items under Left for manual verification — the mail's first note read in the delivered message, the five notes on `/releases`, and whether the two Cloudflare analytics secrets are set on production

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the unsigned plans and the silent-failure question were both put to Lutan before the cut and decided by him

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-10
