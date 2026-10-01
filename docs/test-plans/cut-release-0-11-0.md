# Feature test plan — cut-release-0-11-0

## Header

| | |
|---|---|
| Feature | Cut release `0.11.0`, **major**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-11-0` @ `C:\Development\Animal_Shelter_cut-release-0-11-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-01 |
| Carries a migration? | no — **and none is pending**: `0118` is already on production, so this is the first release in a week with no apply step. See §3 |
| Tested at SHA | `7651123` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.11.0` entry holding the five notes written by PRs #235–#247, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles, and for once that is literal**: all five notes are untagged, the first release since #195 introduced role tags where none applies. The sign-in fix, units of measure and the Pi move are everyone's. `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go; (b) the release record, written after them; (c) the stale Worker fallback and the Pi's missing release guard, both found while checking drift for this release and discussed below but **not fixed here**; (d) the `0112` expiry date (stock-count provenance shown nowhere), still open and parked

**Decision confirmed in chat by Lutan, 2026-10-01:** `0.11.0` with `major: true`. The deciding note is the first one — **sign-in and every save on `lannacare.org` failed from the evening of 30 September until the morning of 1 October.** Admins fielded that, and the mail is how they learn what it affected and that it is over. Units of measure (note 4) also needs configuring under Management before it does anything, which is the `0.9.0`/`0.10.0` shape; and note 5 explains the Pi move and the `Error 1102` pages it was meant to stop.

**This release is unusual: everything in it is already live.** The Pi has served `7651123` since the merges, so these five notes describe behaviour users already have rather than behaviour this deploy will give them. The counter-argument to `major` was exactly that — the mail announces the past. It was put to Lutan that way and he chose major, on the reasoning that an admin who saw "A server error occurred" all of yesterday evening wants to be told what it was. **Why it is already live is the finding below, and it is the thing to fix next, not in this PR.**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `7651123`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.11.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.10.1")` returns `["0.11.0"]`** — the check that makes the deploy mail admins, verified rather than inferred from `major: true`
- [x] **The date was read from the system clock and compared back to it, on the right clock** — `date +%Y-%m-%d` gives `2026-10-01`, the entry says `2026-10-01`, and UTC agrees today. Checked against the **local** clock deliberately: on `0.10.0` the same assertion against `new Date().toISOString()` returned false because it was `00:10` in Thailand and still the previous day in UTC. Dates here follow Thailand's clock (release `0.1.0`'s first note). Today the two agree, so this is a weaker test than it was — recorded so nobody reads a pass as proof the trap is gone
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.11.0` / `2026-10-01` / `major: true` / 5 notes
- [x] **`compareVersions("0.11.0","0.10.1") === 1`, and the register's file order still matches a re-sort by it** across all seventeen entries — `0.11.0 > 0.10.1 > 0.10.0 > 0.9.1`. Carried over from `0.10.0`'s double-digit check: `0.10.1` → `0.11.0` crosses back from a two-digit minor to a two-digit one, and a lexical compare would call `"0.11.0"` *older* than `"0.10.1"`, which would silently suppress the mail

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] **`--status` / `--drift` reviewed — and this release has nothing to apply.** `--drift production` reads `Against origin/main 7651123: 118 file(s), 118 applied row(s)`, `not applied here: 0`, `applied here, no file: 0`, `No drift`. `0118` (units of measure, #236) was applied before this cut, so the feature in note 4 is already backed by its schema. **First release since `0.8.1` with no apply step**, which removes the hazard that bit `0.10.0` and `0.10.1`
- [ ] `--dry-run` reviewed — n/a: nothing pending to dry-run
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0118`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **there is none, and that is verified rather than assumed.** Nothing to apply before or after. The post-apply `check-public-views.mjs --env production` is therefore not owed either; it last ran clean at **184 ok, 2 skip, 0 fail** after `0117`
- [x] **The drift check for this release turned up no schema problem at all** — asked for specifically by Lutan on 2026-10-01, on the suspicion that an urgent fix for the sign-in outage might have been applied to the database by hand. It was not: both directions of `--drift` are zero, so nothing reached production outside `apply-migrations.mjs`

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.11.0`, `major: true`, `2026-10-01`, 5 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has seventeen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the cut is line-based and carried all five source lines verbatim, each entry occupying exactly one source line, asserted before cutting. The register resolves to **5 strings and 0 objects** — no role tags in this release — and every note returns readable text through `noteText()`. **Note count**: exactly 5, none reworded. **Indentation**: six spaces. **Line endings**: CRLF preserved
- [x] **The release mail was built and read** — subject `Lanna Care release 0.11.0: Sign-in and saving fixed, units of measure, and the website now runs on a Pi at the shelter`; **0** occurrences of `[object Object]`, **5** bullets in the HTML and five in the plain text. All five are plain strings, so this is the simplest mail since `0.8.0` — the object path proved on `0.9.0` and `0.10.0` is not exercised here

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five notes; **is emailed** | mail built and read above; the send is a deploy step, §8 |
| management | `/releases` | sees all five — units of measure is theirs to configure | not verified on a deployed build at PR time |
| staff / volunteer / vet | `/releases` | sees all five; untagged, so nothing is filtered out for anyone | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR — though note 1 is precisely about that page having been broken | unchanged by *this* PR |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. With no tags in this release there is nothing for the filter to do, which is itself worth one line: `/releases` must not show an empty state to anyone here
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access changes are #241 (sign-in open redirect) and #242 (security headers), covered by their own plans

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s consumers (`/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, the role filter) were all exercised in §2 and §4
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `7651123`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All five were written by the PRs that made each change
- [ ] Non-obvious design choices recorded as a new file in `docs/decisions/` — n/a: no design choice in this PR. The two findings in §8 are process observations for the backlog, not design decisions, and recording them as decisions would misfile them
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Two findings that change what a deploy means, neither fixed here

Both came out of the drift check Lutan asked for. They are recorded here because
this plan's deploy steps are wrong without them, and they belong on the backlog
rather than in this PR.

- [x] **Production has two copies of the app, and the release guard only covers the one nobody is served by.** `ORIGIN_HOST` is `pi.lannacare.org` in the production block, and `lannacare.org` answers `x-lanna-served-by: pi`. `scripts/pi/deploy-pi.sh` is 51 lines of `git fetch` → `git reset --hard origin/main` → `npm ci` → `npm run build` → `systemctl restart`, with **no release guard at all**: nothing checks `unreleased`, `latestRelease` or `package.json`, where `deploy.mjs` refuses unless the version is written down. So the Pi serves whatever is on `main`, which is why every note in this release is already live. Consequences worth stating: code reaches users without a cut; the release-time "every PR has a completed test plan" check never runs for it; and `npx wrangler rollback` no longer rolls back production, because it reverts the Worker, which is not serving
- [x] **`/api/releases/current` is answered by the Worker, not the Pi** (`worker/index.mjs:158` handles it locally with `BYPASS` before the origin is consulted). So every "the endpoint reports X" line in this session and in `docs/releases/2026-09-29.md` and `2026-09-30.md` describes the **fallback**, not the app anyone uses. Corrected here rather than quietly: the version endpoint is evidence about the Worker only
- [x] **The Worker fallback currently predates the sign-in fix.** #247's commits are `40559a2` (08:21) and `d063fee` (08:33) on 2026-10-01 and change `next.config.ts`, so they take effect only in a build. The last production Worker deploy in `deploy.log` is `0.10.0` at `d26103b`; `0.10.1`'s was never logged. Either way both are older. **So a Pi timeout today falls through to a Worker that still refuses Server Actions** — the outage would come back for the duration. Fixing that is what makes this deploy worth doing promptly, and it is why `deploy:prod` matters here even though the Pi is already current

### Tested build

- [x] Tested SHA recorded in the header — `7651123` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of three of the last four releases; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: this session, after merge. Before the UAT deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. **Note that test is Worker-served** (`ORIGIN_HOST` is `""` there, and it answers `x-lanna-served-by: worker`), so a pass on test exercises the Worker build and **not** the Pi path that production actually uses. That asymmetry is new since 2026-09-30 and is worth knowing before treating a test pass as representative
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. Low relevance: no note here is a date fix
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Relevant**: note 5 changes who serves public pages, and `x-lanna-cache` is keyed by URL at the edge
- [ ] **`check-public-views.mjs --env production`** — deferred: release manager, **and owed only if something changes**. No migration ships here; it last ran clean after `0117`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. Use `>>`
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — this release sends.** `major: true` and `majorReleasesSince("0.10.1")` is `["0.11.0"]`. Expect `deploy: release mail for 0.11.0 [UAT]: sent N, skipped M`; `sent 1, skipped 1` is the established shape and not a fault (Lutan confirmed on 2026-09-29 that he receives these)
- [x] **Both copies must be deployed, and the order matters less than the fact.** The Pi is already on `7651123` but will need `./scripts/pi/deploy-pi.sh` once this cut merges, or it will serve a build whose register still says `0.10.1`. The Worker needs `deploy:prod` to stop carrying the pre-#247 config. **Use `node scripts/deploy.mjs --env production >> deploy.log 2>&1`** — plain `npm` is blocked by PowerShell's execution policy on this machine, and `0.10.1`'s deploy was run without the redirect, which is why its record is the only one since `0.6.0` that cannot quote itself. **The terminal will look empty; that is the redirect, not a failure**

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no, and **nothing is pending either**, so the ordering hazard that bit `0.10.0` and `0.10.1` does not apply to this release at all. §3
- [ ] `--env production --dry-run` run and clean — n/a: nothing pending to dry-run
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this release. Note #243 moved backup encryption, so the next release that *does* need this line should check the new path
- [x] Apply plan stated — §3: there is none

### Rollback

- [x] Rollback position stated, **including what it does not cover** — and it has changed since the Pi arrived, so the old answer is now wrong. `npx wrangler rollback --env production` reverts the **Worker**, which is the fallback, not the live origin; rolling production back means `git reset --hard <sha>` and a rebuild on the Pi, which is not written down as a rollback path anywhere. **This release is also not fully reversible**: `major: true` means the mail is sent and cannot be unsent. No migration ships, so there is no schema half to consider — the first release in a week where that sentence is short

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **Eleven PRs** (#235, #236, #239–#247), enumerated with `scripts/release-prs.mjs 9612119`: exit 0, **12 added migration and test-plan files cross-checked with no orphans**. All eleven have a completed plan; none reports `Result: fail`; **five report `pass with accepted defects`**, the most in any release so far, which fits a batch that is mostly security work and an emergency fix
- **The `since` argument was the `0.10.1` cut merge, not its deployed SHA**, because `0.10.1`'s deployed SHA is not recorded — its deploy ran without `>> deploy.log`. Noted so the figure can be reproduced
- **The `0112` expiry date is still open** — stock-count provenance recorded since `0.9.1` and shown nowhere. Parked mid-investigation when the drift question came in; the backlog item settled the schema half but never said where the source should appear

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The five notes **and the title**, read as a shelter user would. `major: true`, so these exact words are emailed to every admin and the title becomes the subject. **The title is mine and nobody has reviewed it.** Note 1 is the one to read hardest: it tells people an outage happened, how long it lasted and what it did not affect, and that claim should be right | `src/lib/releases.ts`, the `0.11.0` entry |
| 2 | **Note 1's dates and scope.** It says saving failed "since the evening of 30 September" and that read-only pages were unaffected. That came from #247's description, not from an independent measurement — nobody has established when it started | `src/lib/releases.ts`; #247 and its decision file |
| 3 | The signed-in pass on `test.lannacare.org` after the test deploy — **remembering it exercises the Worker, not the Pi**, per §8 | `test.lannacare.org` |
| 4 | After both deploys: that `lannacare.org` still answers `x-lanna-served-by: pi` and that sign-in works through the Pi **and** with the Pi stopped, so the refreshed fallback is proved | `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all four items are open and need a person. Items 1 and 2 matter more than usual: this release mails, and note 1 makes a factual claim about an outage's duration that nobody has verified

Manual verification by: pending: Lutan to read the five notes and the title (item 1), check note 1's dates and scope (item 2), run the signed-in pass on test (item 3), and confirm both copies after deploying (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
