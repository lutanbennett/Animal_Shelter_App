# Feature test plan — cut-release-0-9-1

## Header

| | |
|---|---|
| Feature | Cut release `0.9.1`, minor: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-9-1` @ `C:\Development\Animal_Shelter_cut-release-0-9-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-29 |
| Carries a migration? | no — `0110`, `0111` and `0112` sit between the deployed build and `main`, all three read by code already on `main`. See §3 |
| Tested at SHA | `24be92f` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.9.1` entry holding the five notes written by PRs #207–#215, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles** in what `/releases` lists, each filtered to their own role. One of the five notes is role-tagged (`vet`, on the cross-clinic write rule); the other four are untagged and shown to everyone. `major: false`, so **nobody is emailed**
- [x] Anything explicitly **out of scope** written down — (a) the UAT deploy, Lutan's go; (b) the release record, written after that deploy; (c) applying `0110`–`0112` (§3); (d) the four `Manual verification by: pending:` plans among this release's nine, which are a release-time question and are listed under Defects rather than resolved here

**Decision confirmed in chat by Lutan, 2026-09-29:** `0.9.1` with `major: false`. Nothing in the five notes asks anyone to do anything. The vet cross-clinic write rule narrows what a vet may change, but it follows automatically from the clinic set in `0.9.0` — there is no new setting to fill in — and UAT has no vet accounts at all, checked on 2026-09-29. `0.9.0` was major because an admin had to set each vet's clinic or that vet saw no residents; nothing here has that shape.

**Nine PRs, and one of them nearly went uncounted.** #213 (`claude/stock-edit-history`, which brought `0112`) reached `main` through a plain `Merge remote-tracking branch 'origin/main'` rather than a merge commit naming the PR, so it does **not** appear in `git log --first-parent`, which is how a release's PRs are normally listed. It was found by tracing `0112`'s author commit instead. Recorded because a PR invisible to the usual audit is a PR whose test plan and release note nobody checks — this one turned out to have both in order, but the audit method is what needs the fix, not this PR.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `24be92f`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.9.1`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.9.0")` returns `[]`** — the check that matters for a minor release. An empty list is what makes the deploy send nothing, and it is verified rather than inferred from `major: false`
- [x] **The date was read from the system clock and compared back to it** — `date +%Y-%m-%d` gave `2026-09-29`, the entry says `2026-09-29`, and the register was re-loaded and asserted equal to today
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.9.1` / `2026-09-29` / `major: false` / 5 notes

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Not establishable from this session for the UAT database: `--env production` reads were refused here on 2026-09-29
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release, on all three files
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0112`: `--status` reports `112 applied, 0 pending` and no drift against `origin/main dec9ec6`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **the starting point is known and recorded**, not assumed: `0.9.0`'s record (`docs/releases/2026-09-29.md`) quotes `No drift: production matches origin/main` at 109 files after `0108`/`0109` applied, so UAT is at `0112`'s three predecessors — `0109`. `0110`, `0111` and `0112` are what is new.

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1`.
  2. `--dry-run`, apply, then `check-public-views.mjs --env production`, **all appended to the same log**. `check-app-access-gate.mjs` is **not** part of this pair — it is dev-only and takes no `--env`, ruled 2026-09-29 in `docs/decisions.md` after three records carried the complaint that it had never run against production.
  3. **Then** deploy.

  | File | Read by code already on `main`? |
  |---|---|
  | `0110_vet_own_clinic_writes.sql` | **Yes** — the vet cross-clinic write rule (#208) |
  | `0111_site_content_preferred_channels.sql` | **Yes** — `src/lib/site/channels.ts`, `admin/website/ContactChannelPicker.tsx` and `admin/website/actions.ts` (#215). Written as schema-only, with its own header saying "nothing reads it yet"; #215 is the follow-up that made that untrue |
  | `0112_stock_count_source.sql` | **Yes** — the single-cell stock edit writes the new `source` column (#213). Nothing *displays* it yet |

- [x] **`0111` is the ordering-critical one this time.** It adds `site_content.preferred_channels`, and the contact-channel picker on Settings → Website reads it on load. Deploying before applying would put a page live that queries a column that is not there — a straightforward error on an admin screen, not a degradation. `0110` and `0112` are both safe in either order: `0110` narrows what a vet may write, so applying it early only tightens things a release ahead of the code that expects it, and `0112` is `add column if not exists source text not null default 'count'`, additive with a default, so the pre-`0112` code keeps working against it untouched
- [x] **`0112` records something nothing shows, and that is deliberate.** #213's plan answers the release-notes line `n/a: a shelter user sees no change; the edit behaves the same and the history it now feeds is not shown anywhere` — a sound reason, and the reason there are five notes for nine PRs. **Carry forward as an expiry date:** the first PR to surface stock-count provenance inherits a column that has been collecting real rows since this release, so its first screen will show history that predates it
- [x] **Three migrations landed in one release from three different branches** (#208, #210, #213) where CLAUDE.md asks for one in-flight migration branch at a time. No number collided — `0110`, `0111`, `0112` are distinct and sequential — so the rule's actual purpose held. Recorded rather than raised as a defect: the rule guards against two branches claiming the same number, which did not happen, and all three are merged now

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.9.1`, `major: false`, `2026-09-29`, 5 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has fifteen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the cut is line-based and carried all five source lines verbatim; each entry occupies exactly one source line, asserted before cutting. After the cut the register resolves to **4 strings and 1 object**, and every note returns readable text through `noteText()`. **Note count**: exactly 5, none reworded. **Date**: read from the clock. **Indentation**: six spaces, matched to the existing entries. **Line endings**: CRLF preserved
- [x] **The mailer was re-checked even though this release does not mail** — `buildReleaseMail` run against this entry with `major` forced true: **0** occurrences of `[object Object]`, **5** bullets in the HTML path. `0.9.0` was the first release to actually mail the role-tagged object form and it rendered correctly; this keeps the check in place rather than treating that as settled for good, since it costs one command

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.9.1`; **not emailed**, `major: false` | no mail is sent — `majorReleasesSince("0.9.0")` is `[]`, verified in §2 |
| management / staff / volunteer | `/releases` | sees `0.9.1`; four of five notes are untagged, so they see nearly all of it | not verified on a deployed build at PR time |
| vet | `/releases` | sees `0.9.1`; the cross-clinic write note is tagged `vet` and is the one that changes their job | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR — though the release itself adds a Request access link to that page (#207) | unchanged by *this* PR |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The cut's job was to carry the one role tag across intact, which §4 verifies
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access change is `0110`, covered in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s four consumers (`/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, the role filter) were all exercised in §2 and §4
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `24be92f`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All five were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The `major: false` reasoning is in §1 and is a release decision rather than a design one
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `24be92f` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of each of the last three releases; check `git log` immediately before deploying

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — **done 2026-09-29**, from `main` at `3c7f697`, immediately after the merge and **before** any UAT deploy. `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (3c7f697)`, `Uploaded lanna-animal-care-test (21.18 sec)`, Worker version `01f9d96c-33d3-47e9-914f-af32e3f1873b`, and `deploy: no major release new to test (was 0.9.0), so no email` — the correct outcome for a minor. `test.lannacare.org/api/releases/current` returns `{"version":"0.9.1"}`. **The endpoint lagged the deploy by a few seconds**, which is expected here and not a fault: for a minor release the mail step returns before `deploy.mjs` reaches its wait-for-propagation loop, so the script finishes slightly ahead of the edge
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. What this session could check without signing in was checked on `0.9.1`: the Staff testing site lock page renders, the browser console is clean, and the version endpoint reports `0.9.1`. **The signed-in pass is not something this session should do** — entering credentials is confined to local development hosts, and `test.lannacare.org` is not one. The two screens worth the most attention are Settings → Website (the new contact-channel picker, which is what `0111` feeds) and a resident page (#212's real error messages)
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. Lower relevance than the last two releases — no note here is a date fix — but the midnight-to-7am window is wrong for part of every day and invisible on `next dev`, so it stays on the list
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Directly relevant**: #211 changes the public site's phone menu and footer, and #215 changes which contact channel appears first. Anonymous GETs are edge-cached per data centre
- [ ] **`check-public-views.mjs --env production`, appended to the log** — deferred: release manager. `check-app-access-gate.mjs` is deliberately **not** named alongside it any more; see §3

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. Use `>>`
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — nothing to watch.** `major: false` and `majorReleasesSince("0.9.0")` is `[]`, so the mail step never engages. The path's evidence is `0.9.0` at `[UAT]: sent 1, skipped 1`, and **its `skipped 1` is now the third consecutive major release to skip exactly one admin** — worth finding out once whether that is a login with no email or a real delivery refusal, but not on this release, which sends nothing
- [x] **The deploy may be refused to this session.** `npm run deploy:prod` was denied as `[Production Deploy]` on 2026-09-29 and the release was deployed by Lutan from his own terminal. If that repeats, hand over the command and **ask for the output back**, because that is precisely where `0.9.0`'s record was lost. Note also that plain `npm` is blocked by PowerShell's execution policy on this machine; `node scripts/deploy.mjs --env production >> deploy.log 2>&1` avoids both the npm wrapper and the policy

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, all three of `0110`–`0112` are read by code already on `main`, so all three go **before** the deploy. `0111` is the one where the wrong order is an outright error rather than a degradation — see §3
- [ ] `--env production --dry-run` run and clean — deferred: release manager, on all three files
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. None of the three rewrites data: `0110` replaces policies, `0111` adds a column, `0112` adds a column with a default
- [x] Apply plan stated — §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.9.0` build in seconds. **This release is fully reversible**, unlike `0.9.0`: `major: false` means no mail is sent, so there is nothing that cannot be unsent. Rollback does not revert `0110`–`0112`, and leaving all three applied under the `0.9.0` build is safe: `0110` tightens vet writes a release early, `0111` adds a column nothing on `0.9.0` reads, and `0112`'s column has a default that pre-`0112` code satisfies without knowing about it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **All nine** PRs in this release (#207–#215) have a completed plan under `docs/test-plans/`. None reports `Result: fail`; three report `pass with accepted defects`. **Four of the nine have `Manual verification by: pending:`** — normal at merge, and the release-time by-hand check is where it is meant to be resolved
- **#213 is invisible to `git log --first-parent`**, having reached `main` through a plain `origin/main` merge rather than a PR merge commit. It was found by tracing `0112`'s author commit. The audit method is the weakness, not the PR: a release's PR list built from first-parent merges will silently omit any PR that arrives this way, along with its test plan and its release note. Worth a backlog item
- **`0.9.0`'s release record was missing** when this cut was prepared — the fourth release running. Written in this session as `docs/releases/2026-09-29.md`, commit `24be92f`, from `deploy.log`. The cause is structural and is set out in that record: the record has no trigger of its own, and this time the session that prepared the release had its deploy refused, so the person who deployed and the session that would have written the record were never in the same place

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The five notes **and the title**, read as a shelter user would. Lower stakes than `0.9.0` — these are not emailed — but they are what `/releases` shows. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.9.1` entry |
| 2 | The `vet` tag on the cross-clinic write note. It is the only tag in this release, and a wrong one hides the line from the people whose job it changes | `src/lib/releases.ts`, the `0.9.1` entry |
| 3 | The signed-in smoke test on `test.lannacare.org` after the test deploy, per §8 | `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all three items are open and need a person

Manual verification by: pending: Lutan to read the five notes and the title (item 1), the `vet` tag (item 2), and the signed-in pass on test (item 3)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
