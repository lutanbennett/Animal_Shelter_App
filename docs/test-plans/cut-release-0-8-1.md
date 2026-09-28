# Feature test plan — cut-release-0-8-1

## Header

| | |
|---|---|
| Feature | Cut release `0.8.1`: move the nine `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-8-1` @ `C:\Development\Animal_Shelter_cut-release-0-8-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-28 |
| Carries a migration? | no — three sit between `main` and production, all read by this release's code. See §3 |
| Tested at SHA | `4344425` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.8.1` entry holding the nine notes written by PRs #184–#196, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists, though each now sees it filtered to their own role (#195). `major: false`, so **no mail is sent to anyone**
- [x] Anything explicitly **out of scope** written down — (a) the deploy, Lutan's go; (b) the release record, written **after** the deploy; (c) applying `0105`–`0107` (§3); (d) the `0.8.0` title still saying "two new website pages" when one has since been replaced — Lutan ruled on 2026-09-28 that it stays as history

**Decision confirmed in chat by Lutan, 2026-09-28:** `0.8.1` with `major: false`. Nothing here locks anyone out or adds a capability on the scale of 2FA or Stocktake — it is refinements plus swapping the Pet relocation page for International adoption.

**The release grew while it was being prepared, and the guard caught it.** The version question was put to Lutan against **five** notes; by the time the worktree existed `main` had moved to `4344425` and `unreleased` held **nine**. The cut script refuses any count but the one it is told to expect, so it stopped rather than silently cutting a different release. The four extra notes — clinic doctor lists, prescriptions limited to past visits, role-aware release notes, and a UTC visit-date fix — are all refinements, so the `major: false` decision stands unchanged on the larger set. Recorded because a stale count is exactly the thing a release cut should not carry forward quietly.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**, twice: `git rev-list --count HEAD..origin/main` returned **0** at worktree creation and again after `main` moved, at `4344425`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.8.1`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 9 entries and the edit refused any other count
- [x] **`majorReleasesSince("0.8.0")` returns `[]`** — the check that matters for a minor release, and the inverse of the one a major needs. An empty list is what makes the deploy send nothing. Verified rather than inferred from `major: false`
- [x] **The date was read from the system clock and compared back to it** — `date +%Y-%m-%d` gave `2026-09-28`, the entry says `2026-09-28`, and the register was re-loaded and asserted equal to today
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.8.1` / `2026-09-28` / `major: false` / 9 notes

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused (`[Production Reads]`)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0107`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — the usual sequence, and **this time the starting point is known**: `0.8.0`'s deploy log records `104 file(s), 101 applied row(s)` and `0102`–`0104` applying cleanly, so production was at `0104` when that release shipped. `0105`–`0107` are what is new.

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1` (Lutan — reads are refused to this session). Still run it: other work may have applied something since.
  2. `--dry-run`, apply, then `check-public-views.mjs --env production` and `check-app-access-gate.mjs`, **all appended to the same log**. The `0.8.0` record had to say those two checks were never run, in the release that redefined two public views.
  3. **Then** deploy.

  | File | Read by this release's code? |
  |---|---|
  | `0105_vets_readonly_for_vets.sql` | No code dependency — it removes a capability (below) |
  | `0106_weight_one_per_visit_and_day.sql` | **Yes** — #190 filters the visit list on it |
  | `0107_prescriptions_visit_not_in_future.sql` | **Yes** — `prescriptions/actions.ts`, `vet-visits/[id]/edit/actions.ts` |

- [x] **`0105` closes a real gap and is worth applying on its own merits.** `vet_rw_vets` (0001) was `for all`, so a vet's own session could insert, rename or delete any clinic through the Data API. #182 refused a vet on `/vets` and `/management`, but a page guard and an RLS policy close different doors — the page guard did nothing about a direct PostgREST call. Same shape as `0081`/`0082`: applying it early is the point, and no code depends on it
- [x] **`0106` can legitimately fail on production, and that is the file working, not breaking.** It adds two unique indexes over existing rows — one weight per vet visit, one per resident per day. If production holds duplicates it **raises a named exception listing them** and refuses, with a hint to resolve them and re-run. The author counted first: none on dev (23 rows) and none in the AppSheet snapshot the production import is built from (18 rows). **So a red apply here means real duplicate data, not a broken migration — and the fix is to resolve the rows, never to force the file.** Recorded because the standing instinct on a red apply is to stop and suspect the migration
- [x] **Both expiry dates recorded in `cut-release-0-8-0` came due in this release, and cost nothing.** `0102` (vet doctors) now has `src/app/management/vets/` reading it via #192, and `0104` (international adoption) has `/adopt/international` via #186. Both were applied during the `0.8.0` deploy rather than deferred, so this release has no dependency on either. That is the third and fourth time the early-apply habit has paid off, after `0095` and `0101`
- [x] **No new schema-ahead-of-code in this release** — all three of `0105`–`0107` either have their consumer here or need none. Nothing new to carry forward

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.8.1`, `major: false`, `2026-09-28`, 9 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has thirteen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — and **this release has a new one**, because the note type changed under the cut:

  **`unreleased` is no longer `string[]`.** #195 widened it to `ReleaseNote = string | { text, roles }` so `/releases` can open on the reader's role. Three of the nine entries are objects. Checked deliberately:
  - The cut is **line-based**, so it carried all nine source lines verbatim regardless of type. Each entry occupies exactly one source line, confirmed before cutting.
  - After the cut the register still resolves: **6 strings, 3 objects**, and every one returns readable text through `noteText()`.
  - **Note count**: exactly 9, none reworded. **Date**: read from the clock. **Indentation**: six spaces. **Line endings**: CRLF preserved.

- [x] **The mailer was proved against the new note type, though this release does not mail.** `major: false` means the mail step never engages — but the next `major: true` release would be the first ever to mail object notes, and a `[object Object]` in an admin's inbox is not something to discover then. `buildReleaseMail` was run against this release's entry with `major` forced true: **0 occurrences of `[object Object]`**, bullets rendering their text, in both the plain-text and HTML paths (`lineOf` at `src/lib/release-mail.ts:22`, used at lines 35 and 49). #195 updated the mailer as well as the page

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.8.1`, filtered to their role; **is not emailed** | no mail is sent by a `major: false` release |
| management / staff / volunteer | `/releases` | sees `0.8.1`, filtered to their role | not verified on a deployed build |
| vet | `/releases` | sees `0.8.1`; **three notes are role-tagged**, so a vet sees a narrower list | the filtering is #195's own plan, not this one |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. **The filtering behaviour is new in this release** and belongs to #195's plan; this cut's job was to carry the tags across intact, which §4 verifies
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access change is `0105`, covered in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; the manual's own role-awareness shipped in #189 with its plan
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` now has four consumers, one more than before: `/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, and the new role filter. All were exercised in §2 and §4 — including the mailer, which had never been run against an object note
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `4344425`, re-checked after `main` moved mid-preparation

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step. (The `0.8.0` missing-record item was ticked separately on the `backlog` branch, `fb053d9`)
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All nine were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The `0106` inverse-advice point is in §3
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `4344425` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **`main` moved once during this preparation alone**; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager. **Directly relevant**: note 9 is a UTC fix for blood tests and procedures logged between midnight and 7am, which is exactly the window that is wrong for part of every day and invisible on `next dev`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. `/relocation` now redirects to `/adopt/international`, so the old URL's cached response is the one to watch
- [ ] **`check-public-views.mjs --env production` and `check-app-access-gate.mjs`, appended to the log** — deferred: production release manager. Named explicitly because the `0.8.0` record had to report them as never run

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. Use `>>`
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [x] Release mail — **nothing to watch.** `major: false` and `majorReleasesSince("0.8.0")` is empty, so the step never engages. The Email Routing question stays open and is simply not exercised; `0.8.0` was its third confirmation

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, `0106` and `0107` are read by their own features, and `0105` needs no code. None is a shared loader, so a wrong order degrades those features rather than taking the site down
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. **Worth checking before this one**: `0106` adds unique indexes over existing rows, the first constraint in this project that can refuse on real data
- [x] Apply plan stated — §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.8.0` build in seconds. **This release is fully reversible**, unlike `0.8.0`: `major: false` means no mail is sent, so there is nothing that cannot be unsent. Rollback does not revert `0105`–`0107`, and here that is benign in an unusually clean way: `0105` only removes a capability nothing legitimate used, and `0106`/`0107` are constraints — `0.8.0`'s code wrote data that already satisfied them, since the constraints were derived from what the app already did

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- All **thirteen** feature branches merged since `0.8.0` have a completed plan under `docs/test-plans/`. None reports `Result: fail`; three report `pass with accepted defects`.
- `unreleased` changed type under the cut and nothing warned about it. The cut's own count guard is what stopped a stale five-note assumption; the type change was found by reading, not by a check. Nothing broke, and the mailer was proved safe for the next major release — but a register whose element type can widen without the cut noticing is worth knowing about.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The nine notes **and the title**, read as a shelter user would. Lower stakes than a major — these are not emailed — but they are what `/releases` shows. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.8.1` entry |
| 2 | **The role tags on the three tagged notes.** A wrong tag hides a line from the people it is for, which is worse than leaving it untagged. They came from their own PRs; nobody has read them as a set | `src/lib/releases.ts`, the `0.8.1` entry |
| 3 | The `0.8.0` title still says "two new website pages" and this release removes one of them. Lutan ruled it stays as history on 2026-09-28; noted so the next reader does not re-open it | `src/lib/releases.ts`, the `0.8.0` entry |

`--drift production` is deliberately **not** a row here: it is a deploy-time check and lives in section 8 as `deferred:`, per the template rule added 2026-09-27.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 3 was ruled on in chat; items 1 and 2 are open and need a person

Manual verification by: pending: Lutan to read the nine notes and the title (item 1) and the role tags as a set (item 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
