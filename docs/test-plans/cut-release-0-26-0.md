# Feature test plan — cut release 0.26.0

## Header

| | |
|---|---|
| Feature | Cut release `0.26.0`: move the nine `unreleased` notes into a new entry, major, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → none. Cutting a release is release process, not a backlog item |
| Branch / worktree | `claude/cut-release-0-26-0` @ `C:\Development\Animal_Shelter_cut-release-0-26-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` — not started; see §4 |
| PR | #534 |
| Tested by / date | Claude (production release manager session) / 2026-10-11 |
| Carries a migration? | **no** — this PR adds no migration. The release it cuts carries four (`0178`–`0181`), which are already on `main` and are handled in §8 |
| Tested at SHA | `f0c61dc9` for the gates; the plan commit follows it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — nine notes move from `unreleased` into a new `0.26.0` entry dated 2026-10-11, `major: true`, and `package.json` goes to `0.26.0`. No backlog item; it matches `docs/release-procedure.md` §4
- [x] Files/areas touched listed — exactly two: `src/lib/releases.ts` and `package.json`. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified — every role reads `/releases`, and the page opens on the reader's own role, so the five role-tagged notes are filtered per role. `major: true` means the **production** deploy mails every admin; test and the Pi do not mail
- [x] Anything explicitly **out of scope** written down — the four migrations are not in this PR and are not applied by it; the release record for `0.26.0` is its own later PR; the fourteen `pending:` test plans in the release are not this plan's to close and are not copied into it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` at `ea3ad5bf` minutes earlier and `git status -sb` reported neither ahead nor behind before the cut, so there was nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines exactly as printed:

```
=== gates: build exited 0 after 347s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — **7 passing, 0 failing** on #534, run `38120280355`. Ticked in this follow-up commit once the run was actually green, as the template requires; it was `n/a: not yet` on the commit that opened the PR. `check` 1m57s, `public-views` 1m24s, `test-plan` 14s (green on the first push, because the CI line was not pre-ticked), the rest under 12s

**Also run, beyond the three gates:**

- [x] `node scripts/check-release-guards.mjs` — exit 0, fifteen cases green, including `--force goes ahead and keeps every problem for the record` and `--force without a reason is refused`. Those two matter to this release specifically: §8's apply plan uses the override
- [x] The cut verified **mechanically, not read over** — 24 assertions, `24/24 assertions passed`, exit 0. Output in the PR body. It asserts: every source note used exactly once; nothing lost, nothing invented (3216 characters on both sides); `role tags changed: 0`; `got [2,1,5,3,7,0,6,4,8]` equals intended; `unreleased` empty; `package.json` equal to the newest entry; file order still matches `compareVersions`; `majorReleasesSince("0.25.0")` exactly `["0.26.0"]`; all 38 previous entries byte-identical and exactly one entry added; no `[object Object]`, no `undefined`, no empty note; every role tag a known `ReleaseRole`
- [x] `node scripts/release-prs.mjs 590a9d35 HEAD` — exit **1**, read from the command itself and not through a pipe. The disagreement is explained in **Defects** #1 and is not a missing PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR adds no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. The release's four are reviewed in §8
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR. The release's four are in §8, where the red dry-run is explained
- [ ] Applied to **dev** — n/a: no migration in this PR. Dev already holds all four at `181 applied`, `No drift`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; this change touches no table
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. The apply plan for the release's four is in §8, "Migration ordering"

## 4. Functional checks

This change is data read by one page. The build type-checks and renders it, and
the 24 assertions above exercise every accessor (`noteText`, `noteRoles`,
`latestRelease`, `compareVersions`, `majorReleasesSince`) against the real
module rather than a copy.

- [x] Happy path works end to end — `latestRelease` is `0.26.0`, nine notes, and the deploy guard's own release check passes (`check-release-guards.mjs`, `a cut release with nothing unreleased passes`)
- [ ] Data persists — reload the page and the change is still there — n/a: the notes are source code compiled into the build, not stored data; there is nothing to persist
- [ ] Create / edit / delete all exercised — n/a: the release register has no create, edit or delete surface; it is a constant in the source
- [x] Empty state renders sensibly (no rows yet) — `unreleased` is now empty, which is the state the guard requires before a deploy; asserted, and `check-release-guards.mjs` confirms `unreleased notes are a problem` fires only when it is not empty
- [x] Invalid input is rejected with a readable message, not a crash — the cut script refuses rather than writing a half-cut file: it throws on a missing array, an unterminated array, an unexpected indent, and an `ORDER` that is not a permutation. The last was exercised for real — the first run died on CRLF line endings and wrote nothing
- [x] Boundary cases checked — the longest note is 668 characters and carries `→`, escaped quotes and a bracketed aside; all survived the move with the character count equal on both sides. The version boundary is covered by `compareVersions` ordering and by `majorReleasesSince("0.25.0")` returning exactly one entry

### Role access matrix

`/releases` is reachable by any signed-in login and opens on the reader's own
role. No role gains or loses access here, and the only per-role difference is
which of the five tagged notes are shown. Not driven in a browser — see
**Left for manual verification** — so the rows record what the data says, which
is what was actually checked.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all nine notes — four untagged plus all five tagged | as expected, read from the entry |
| management | `/releases` | seven — four untagged, plus the two `["admin","management"]` notes | as expected, read from the entry |
| staff | n/a | n/a — retired by `0173`; no login holds it | n/a. `ReleaseRole` still lists `"staff"`, already on the backlog as stale |
| doctor | `/releases` | four — the untagged notes only | as expected, read from the entry |
| volunteer | `/releases` | four — the untagged notes only | as expected, read from the entry |
| signed out | `/releases` | the locked-site gate, not the page — `PUBLIC_SITE` is `locked` | not driven; unchanged by this PR |

- [ ] Every role above tested — n/a: not driven in a browser. No role's access changes in this PR, and which notes each role sees is read from the entry's tags, asserted as unchanged (`role tags changed: 0`). The wording a role actually sees is in **Left for manual verification**
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — unchanged by this PR; `/releases` has the same gate it had at `0.25.0`, and neither file this PR touches is part of it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, and no nav entry is added or removed by a release cut
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched. The release register is not a manual topic, and the nine notes' own PRs owned their manual lines
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately English-only and are not in the translation path. The Thai wording inside the features themselves belongs to the nine PRs, not to the cut
- [ ] Mobile viewport (375px) — n/a: no layout change; this PR adds data to an existing list, and the phone-width sweep is no longer a release step (`docs/decisions/2026-10-10-phone-width-is-not-a-release-step.md`)
- [ ] Browser console clean — n/a: no browser session was driven; no client-side code changed
- [ ] Network clean — n/a: no browser session was driven; no request path changed

## 6. Regression

- [x] The pages nearest the change still work — the full build compiled every route including `/releases` and `/api/releases/current`, both of which read this file, with `typecheck=0 lint=0 build=0`
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, by `worker/` for `/api/releases/current`, and by `scripts/deploy.mjs` and `scripts/pi/guard-release.mjs` under Node's type stripping. The last two were **loaded, not read**: `check-release-guards.mjs` imports the real module and exercised all fifteen guard cases against it, exit 0
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was already at `origin/main`'s tip

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. Nothing in `docs/backlog.md` describes an outcome this PR closes; the nine notes' own PRs ticked their items
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice here. The two calls that were made — major, and the note order — are recorded in the commit message and in the release record PR that follows, which is where previous cuts put them
- [x] `README.md` still accurate — checked; it describes the release process by reference to `docs/release-procedure.md` and names no version number
- [ ] **Release notes.** — n/a: this PR is the release-notes change itself — it moves nine existing notes rather than adding a tenth, and `unreleased` is deliberately left empty. A tick would be false: `unreleased` gained no line
- [x] Commit messages say why, not just what — the cut commit gives the grounds for `major` (a new page, three roles given out, a button removed — and that this is *different* grounds from `0.25.0`'s), the reason the order changed, and the 24 assertions as evidence
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every number in the cut commit is from the verify script's output: `3216` characters, `role tags changed: 0`, `[2,1,5,3,7,0,6,4,8]`, `38` previous entries, `["0.26.0"]`. The gates line is quoted as printed. The one judgement — the grounds for major — is labelled as Lutan's call in chat, not presented as a measurement

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager (this session). Recorded for the gates; it becomes the tip of `main` only when #534 merges
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. `deploy.mjs` has no `--ref`, so this is read off the `deploy: production → Supabase project …` line and diffed against the release SHA, as `0.24.0` and `0.25.0` both required

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. Test gets the same commit as production, after production
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager, per `docs/release-smoke-test.md`
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this PR derives a date. `date: "2026-10-11"` is a literal string, never compared to a clock; `compareVersions` reads version numbers only
- [ ] For a boundary or banding change, the assertions cover both edges of the band — n/a: no boundary, band, threshold or cutoff in this PR. The nearest thing, `majorReleasesSince`, is asserted to return exactly `["0.26.0"]` for the live version
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2 and the verify script's `24/24` are as printed. The red dry-run below is quoted verbatim, including its `HINT`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. The edge-cache check is in `docs/release-smoke-test.md` and must be done in a real browser on the same URL

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager, from Lutan's `| tee` log
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager, from the same log
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a as a new-secret check, and checked: this PR adds no env var. The one env-var question open in the project, `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` on **test**, is on the backlog and is not touched here

### Migration ordering — *skip if no migration*

**This release's migrations are the substance of the release, and the ordering is
not the usual one.** Stated in full because the next reader of this file may not
have been in the conversation.

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. But the **release** contains four migrations (`0178`–`0181`) and the code that reads them, and `0181` is the first migration in this project whose own header forbids the standard order: *"Apply only once the new app is live: the previous release still selects `app_users.role`, calls `current_user_role()` and writes `user_roles.role`, and fails the moment this lands."* Verified against the live build rather than taken on trust — `0.25.0` @ `590a9d35` calls `current_user_role()` from `loadCurrentRole`, reached by `src/lib/supabase/proxy.ts` on **every non-public app request** ("One role lookup per app request"), and the rpc's error is discarded, so a dropped function reads as *no role* and the request is bounced. It fails **closed and silently**: every signed-in person locked out of the whole app, with no error shown. Also `src/lib/status/alerts.ts` (`.eq("role", "admin")`, release mail) and `/admin/security` (`select("user_id, role, archived_at")`)
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — run, and **not clean**: exit 1. See **Defects** #2. It stopped on `0180` for a dependency `0179` removes, which is the per-file `begin … rollback` trap `CLAUDE.md` describes; both files were read before concluding anything and the correct action is to apply. `0178` and `0179` came back `ok`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **not satisfied, and accepted knowingly.** `0181` drops two columns, a view column, four functions, a trigger, two constraints, an index and a type; it is the most destructive migration the project has applied, and a dropped column cannot be put back by redeploying. There is no fresh production backup and the README restore recipe has never been exercised. What stands in its place: the four files are applied and proven on dev (`181 applied`, `No drift`), `0180`/`0181` were deliberately split so that anything found between them needs no column put back, `0181` is re-runnable, and its header names the mapping for a re-add migration (`0132`'s key list). Recorded as Defect #4 rather than ticked
- [x] **Apply plan stated: which file, which project, and whether it runs before or after the deploy.** Lutan's decision in chat, 2026-10-11, chosen from three options with the cost of each put to him:
  1. `0178`, `0179`, `0180` → production (`dbkodyyxxhtygxcxmfcu`), **before** any deploy. All three are backward-compatible with the live `0.25.0` app; `0180`'s header says so explicitly ("it can be applied and the app left running on the old code") and it was read to confirm it
  2. **Pi production build, pinned `--ref <release sha>`, with `--force` and a reason** — because the release guard will refuse it while `0181` is unapplied, and that refusal is correct in general and wrong here. This is what puts the new app in front of users
  3. `0181` → production, **after** the new app is live. At that point nothing reads what it drops
  4. Worker production deploy — **Lutan's one job** — last. Its guard is satisfied by then, so it needs no override
  - **Why, in one line:** the standard order would lock every signed-in person out of the whole app for about two minutes on a Sunday afternoon in Thailand, failing silently; this order has no user-facing window at all. The cost it accepts is that the Worker fallback is a release behind for the ~13 minutes of step 4, so a Pi failure inside that window would surface errors. Rejected alternatives: the standard order now, and waiting until ~06:00 Thai to run the standard order
  - **The override is on the record**: `guard-release.mjs` prints every overridden problem in capitals and appends a line to `~/lanna-deploy-overrides.log` outside the checkout, and the release record must name it. Confirmed by `check-release-guards.mjs`: `--force goes ahead and keeps every problem for the record`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the rollback is a Pi rebuild at the previous release SHA, `./scripts/pi/deploy-pi.sh --ref 590a9d35`, and `npx wrangler rollback --env production` for the Worker fallback. **Neither reverts a migration, and this release is the case where that matters most.** Once `0181` has been applied, rolling the app back to `0.25.0` puts back code that calls a function production no longer has — so the rollback is only clean *before* step 3 of the apply plan. After step 3, a rollback needs a new migration that re-adds `user_roles.role`, `roles.legacy_role`, `current_user_role()`, `user_roles_sync_role_id()` and `app_users.role`, back-filled from `roles` using `0132`'s key list, as `0181`'s own header instructs. That is the practical point of no return in this release and it is named here deliberately

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `release-prs.mjs 590a9d35 HEAD` exits 1: `docs/test-plans/planner-handover-90.md` belongs to no PR in its list. The PR is **#530**, squash-merged, so it has no merge commit carrying its number — the same cause as `0.21.0`'s missing twelfth PR. Confirmed with `gh pr list --search 5886016`. The release is **14 PRs, #520–#533**, not the 13 the script lists | accepted — the script is right to complain and the list is right once #530 is added by hand. Named in the release record |
| 2 | medium | `apply-migrations.mjs --env production --dry-run` exits 1: `0180` cannot drop `has_shelter_floor()` because `policy maintenance_delete_perm on table maintenance depends on` it. The per-file `begin … rollback` trap — `0179` line 99 recreates that policy without the function, and the dry-run throws `0179` away before `0180` runs. Third recorded instance | accepted, and **the correct action is to apply**. Both files read before concluding; dev holds all four applied in order with `No drift`. Reported as "the dry-run failed", not "the file is wrong" |
| 3 | high | `0181` breaks the live `0.25.0` app the moment it lands, silently and on every app request. Not a defect in the file — it says so in its own header and was written to be applied after the new app is live — but it is a defect in the *standard release order*, which has no way to express "this one goes last" | accepted, mitigated by the apply plan in §8. Lutan chose the Pi-first order in chat, 2026-10-11, with the cost of each option put to him |
| 4 | medium | No fresh production backup before the most destructive migration the project has applied, and the README restore recipe has never been exercised | accepted knowingly — see §8, "destructive or rewriting". Worth a backlog item on its own; the restore recipe being unexercised is a standing gap, not this release's to close |
| 5 | low | The first run of the cut script died on CRLF line endings, having written nothing | fixed — the script reads the file's own line ending and writes it back. It failing safe is the behaviour wanted, and it is ticked as evidence in §4 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The release mail, as it reads to an admin.** Nine notes, major, so every admin gets it. Does the title say the right thing, and is the first note the one an admin should read first? This is the one thing in the cut that cannot be un-sent | the mail from `releases@lannacare.org`, and `/releases` signed in as Admin |
| 2 | **The five role-tagged notes read correctly to the role they are tagged for** — particularly the two tagged `["admin","management"]`, where a Management login should see them and a Doctor or Volunteer should not | `/releases` signed in as Management, then as Doctor or Volunteer |
| 3 | **Whether note 4 reads as bad news handled well.** The Head of Maintenance loses a Delete button they could see. The note explains the button never worked, but a Head of Maintenance reading it may still read it as something taken away | `/releases`, and the Thai wording with it |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the three items above are Lutan's and are not ticked here

Manual verification by: pending: the three rows above — the mail as an admin reads it, the role-tagged notes seen as each role, and the Thai wording of the note that removes a button

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-11
