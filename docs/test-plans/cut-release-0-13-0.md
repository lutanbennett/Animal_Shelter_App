# Feature test plan — cut-release-0-13-0

## Header

| | |
|---|---|
| Feature | Cut release `0.13.0`, **major**: move the four `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-13-0` @ `C:\Development\Animal_Shelter_cut-release-0-13-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-02 |
| Carries a migration? | no — but **`0125_doctor_multi_clinic.sql` is pending on production** and must be applied before the deploy. See §3 |
| Tested at SHA | `c2ab49b` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.13.0` entry holding the four notes written by PRs #274–#284, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — one note untagged (the logo), two tagged `admin, management, staff` (soft delete, the assistant's doctor field), one tagged `admin` alone (Recent changes). `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go, **both copies**; (b) applying `0125` (§3); (c) the release record, written after the deploy; (d) the four items left for a person on #272's plan, still unanswered and carried forward in `docs/releases/2026-10-02.md`

**Decision confirmed in chat by Lutan, 2026-10-02:** `0.13.0` with `major: true`. Two of the four notes earn it, and they are the two that change what the system remembers:

- **Clinical records can now be removed and put back.** Weights, prescriptions, vet visits and immunizations leave the lists, charts, forecasts and counts, but are **kept, not deleted**, with Show removed and Restore. That is a change to what "delete" means in this app, and it is admin, management and staff who will use it.
- **Settings gains a Recent changes page** showing who added, edited, archived or deleted a record, with before-and-after values. **A page that records what people did is itself worth announcing** — telling admins it exists is the honest thing, not an optional nicety.

The counter-argument, recorded: both are additive and discoverable in the UI, nothing needs configuring, and nothing breaks if the mail goes unread.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `c2ab49b`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.13.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 4 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.12.1")` returns `["0.13.0"]`** — the check that makes the deploy mail admins, verified rather than inferred from `major: true`
- [x] **The date was read from the local clock** — `date +%Y-%m-%d` gives `2026-10-02` and the entry says `2026-10-02`. UTC agrees today, which it did not on `0.10.0` or `0.12.1`; checked on the local clock regardless, because Thailand's is the one this project follows (release `0.1.0`'s first note)
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.13.0` / `2026-10-02` / `major: true` / 4 notes
- [x] **`compareVersions("0.13.0","0.12.1") === 1`, and the register's file order still matches a re-sort by it** across all twenty-one entries: `0.13.0 > 0.12.1 > 0.12.0 > 0.11.0`
- [x] **The cut was verified against a pre-cut copy, not eyeballed.** `releases.ts` was copied before cutting, both imported, and all four notes compared: **text identical, roles identical, total character count identical**, `unreleased` empty. **Three of this release's four notes are the multi-line object form** (`single, multi, multi, multi`) — the highest proportion yet, and the form that would have been silently truncated by the line-based cut this check replaced after `0.12.0`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] **`--drift production` reviewed — one file pending.** `Against origin/main 3798f84: 125 file(s), 124 applied row(s)`, with `0125_doctor_multi_clinic.sql` not applied and nothing applied that `main` lacks. `0124` (soft delete) is **already on production**, applied with the `0121`–`0123` batch's successor run
- [ ] `--dry-run` reviewed — n/a: owed for the release, on `0125`. Not run from this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0125`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager:

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1`
  2. `--dry-run`, apply `0125`, then `check-public-views.mjs --env production`, **all appended to the same log**
  3. **Then** deploy — both copies

- [x] **`0125` is the one the second note depends on**, so the ordering matters in the usual direction: the assistant's doctor field (#280) reads the multi-clinic doctor model this file adds. Deploying first would put that feature live against schema that is not there
- [x] **`deploy.mjs` refuses on its own if it is not applied** — #254's schema guard compares every migration the deployed commit carries against what the database has. **And since #279, `deploy-pi.sh` has guards too**, which is the gap the last three records named: until yesterday the Pi — the copy that actually serves users — ran `git reset --hard origin/main` and rebuilt with no checks at all. What those guards now cover should be read from that PR rather than assumed here
- [x] **`0124` is already applied, which is why soft delete is safe to announce.** The first note describes records being kept rather than deleted; that behaviour rests on `0124`, and it is on production already

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.13.0`, `major: true`, `2026-10-02`, 4 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has twenty-one entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the three multi-line notes are this release's case, covered by the before/after comparison in §2. The register resolves to **1 string and 3 objects**, every note readable through `noteText()`, count exactly 4, none reworded, six-space indentation, CRLF preserved
- [x] **The release mail was built and read** — subject `Lanna Care release 0.13.0: Records can be removed and put back, a Recent changes page, and the assistant keeps the doctor you name`; **0** occurrences of `[object Object]`, **0** of `undefined`, **4** bullets in the HTML and four in the plain text. Three of four notes are the object form, the highest proportion of any release, so this is the most the mailer's `noteText` path has been leaned on

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all four; **is emailed**; Recent changes is theirs alone | mail built and read above; the send is a deploy step, §8 |
| management / staff | `/releases` | sees three — soft delete and the assistant note are tagged for them; **not** Recent changes | not verified on a deployed build at PR time |
| volunteer / vet | `/releases` | sees the logo note only | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The cut's job was to carry three role tags across intact, which §2's comparison verifies directly
- [x] A role that should not have access is blocked server-side — not re-verified and not claimed: no access rule is touched by this PR. The release's own access changes are #275/#278 (soft delete is admin, management and staff; vets and volunteers do not see Remove) and #277, covered by their own plans

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release adds Settings → Recent changes, covered by #277's plan
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s consumers (`/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, the role filter) were all exercised in §2 and §4
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `c2ab49b`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All four were written by the PRs that made each change
- [ ] Non-obvious design choices recorded as a new file in `docs/decisions/` — n/a: no design choice in this PR. The `major: true` reasoning is in §1 as a release decision
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `c2ab49b` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of six of the last seven releases; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: this session, after merge. Before the production deploys
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. **Test is Worker-served**, so it does not exercise the Pi path production uses. **Worth most attention**: Remove and then Restore on a weight (the note claims a removed weight stops blocking a correct one for the same day — that is the subtle half), and Settings → Recent changes showing before-and-after values
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. **Relevant**: Recent changes filters by date, and the removed-weight rule is "for that day", which is a shelter-day question
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. The logo change (#282) is the only public-facing item, and a replaced asset is exactly the kind of thing an edge cache holds
- [ ] **`check-public-views.mjs --env production`, appended to the log** — deferred: release manager, after applying `0125`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. **Expect 10**; 12 was the signature of the `.env.production.local` leak, and 10 has held for two releases since
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — this release sends.** `major: true` and `majorReleasesSince("0.12.1")` is `["0.13.0"]`. Expect `deploy: release mail for 0.13.0 [UAT]: sent N, skipped M`; `sent 1, skipped 1` is the established shape and not a fault
- [x] **Both copies must be deployed** — `node scripts/deploy.mjs --env production >> deploy.log 2>&1` **and** `./scripts/pi/deploy-pi.sh` on the Pi, or `/releases` keeps showing `0.12.1`. Plain `npm` is blocked by PowerShell's execution policy here, and **the terminal will look empty — that is the redirect, not a failure**
- [x] **Rollback** — `wrangler rollback` reverts the Worker, which is the fallback, not the serving copy; rolling production back means `git reset --hard <sha>` and a rebuild on the Pi. **This release is not fully reversible**: `major: true` means the mail is sent and cannot be unsent. `0125` does not revert with the code, which is the usual safe asymmetry

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, `0125` goes **before** the deploy because #280's assistant doctor field reads it — §3
- [ ] `--env production --dry-run` run and clean — deferred: release manager, on `0125`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. `0125_doctor_multi_clinic` changes how a doctor relates to clinics, so whether it rewrites existing doctor rows or only adds structure is worth reading from the file before applying
- [x] Apply plan stated — §3

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **Eleven PRs** (#274–#284), enumerated with `node scripts/release-prs.mjs b9e18ac`: exit 0, **13 added migration and test-plan files cross-checked, no orphans**. All eleven have a completed plan; none reports `Result: fail`; **three report `pass with accepted defects`**
- **The tool reported "git log --first-parent shows only 10; 1 more found off the first-parent line"** — the **third consecutive release** where it found a PR the old method would have missed. That is no longer a curiosity: on current evidence roughly one PR per release arrives in a shape `--first-parent` cannot see, so the pre-deploy by-hand check would be running against a short list every single time
- **`0.12.1` had no release record** when this cut was prepared — sixth in eight. Written in this session as `docs/releases/2026-10-02.md`, commit `c2ab49b`, quoted from `deploy.log`
- **Two backlog items from this session shipped in this release**: #279 added guards to `deploy-pi.sh` (the Pi being the unguarded serving copy), and #274 put the `audit` job on a schedule (it was `pull_request`-only, so a new advisory was invisible between PRs). Both were filed on 2026-10-01

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The four notes **and the title**, read as a shelter user would. `major: true`, so these exact words are emailed to every admin and the title becomes the subject. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.13.0` entry |
| 2 | **The soft-delete note's claims, which are the most specific in the release.** It says removed records leave the lists, charts, forecasts *and counts*; that Show removed reveals them greyed with the reason; that Restore puts one back; and that a removed weight or vaccination stops blocking the correct one for that day. Each is checkable, and the last is the one most likely to be subtly wrong | `src/lib/releases.ts`; #275, #278, and a resident page on test |
| 3 | **The Recent changes note.** It is `admin`-only and describes a page that records what colleagues did — worth reading once for tone as well as accuracy, since it is the first note of its kind | `src/lib/releases.ts`; Settings → Recent changes |
| 4 | The three role tags as a set. Management and staff get soft delete and the assistant note but **not** Recent changes; volunteers and vets see only the logo note | `src/lib/releases.ts`, the `0.13.0` entry |
| 5 | After both deploys: `/releases` shows `0.13.0` to a signed-in user — the only external check that the **Pi** took the release, since `/api/releases/current` is answered by the Worker | `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all five items are open and need a person. Items 1 and 2 matter most: this release mails, and the soft-delete note makes four separate checkable claims

Manual verification by: pending: Lutan to read the four notes and the title (item 1), check the soft-delete note's claims (item 2), read the Recent changes note (item 3), confirm the role tags (item 4) and confirm `/releases` after both deploys (item 5)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
