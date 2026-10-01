# Feature test plan — cut-release-0-12-1

## Header

| | |
|---|---|
| Feature | Cut release `0.12.1`, minor: move the four `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-12-1` @ `C:\Development\Animal_Shelter_cut-release-0-12-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-01 |
| Carries a migration? | no — but **three are pending on production** (`0121`–`0123`) and must be applied before the deploy. See §3 |
| Tested at SHA | `2c0036e` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.12.1` entry holding the four notes written by PRs #261–#271, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — three notes are untagged and shown to everyone; one is tagged `admin, management` (the stock correction note). `major: false`, so **nobody is emailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go, **both of them**; (b) applying `0121`–`0123` (§3); (c) the release record, written after the deploy; (d) the still-open Pi release-guard question on the backlog

**Decision confirmed in chat by Lutan, 2026-10-01:** `0.12.1` with `major: false`. Nothing in the four notes asks anyone to act: a restored PDF regression, safer confirmation dialogs, a clearer timeout message, and a note on a management page. No new capability needs configuring.

**The counter-argument was about what is *not* in the notes**, and is worth recording because it is the stronger version of the question. This release carries **#268, the Next 16.3.8 bump that clears a Critical RCE advisory** (GHSA-vcvr-r3jv-pc5j, `next/og` ImageResponse), and **#266's new audit-log table**. Neither has a release note, correctly — a shelter user would notice neither — but release mail is built from the notes, so a `major: true` here would have mailed four lines that say nothing about either. Mailing would not have communicated the security fix; it would only have interrupted people about a PDF. Minor was the right call for that reason as much as the usual one.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `2c0036e`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same checks) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.12.1`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 4 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.12.0")` returns `[]`** — the check that matters for a minor: an empty list is what makes the deploy send nothing, verified rather than inferred from `major: false`
- [x] **The date was read from the local clock, and the clock rolled over before the merge** — the cut was made on `2026-10-01`; by the time CI was green it was `2026-10-02` locally. Per the precedent Lutan set on `0.10.0`, the entry was moved to today: it now reads `2026-10-02`, and `0.12.0`'s `2026-10-01` is untouched. **The local clock deliberately**: at the moment of the change `date +%Y-%m-%d` gave `2026-10-02` while `date -u` still gave `2026-10-01`, so the two disagreed by a day. Dates here follow Thailand’s clock (release `0.1.0`’s first note). That is the **fifth** time the midnight-to-07:00 window has mattered in this project, and the second time it has caught the release tooling rather than a feature
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.12.1` / `2026-10-01` / `major: false` / 4 notes
- [x] **`compareVersions` holds at the patch boundary** — `0.12.1 > 0.12.0` and `0.12.1 > 0.11.0`, and the register's file order still matches a re-sort by it across all twenty entries: `0.12.1 > 0.12.0 > 0.11.0 > 0.10.1`
- [x] **The cut was verified against a pre-cut copy, not eyeballed** — `releases.ts` was copied before cutting, both were imported, and all four notes compared: **text identical, roles identical, total character count identical, `unreleased` empty**. This is the check introduced for `0.12.0`, when the parser replaced the line-based cut; **one of this release's four notes is again the multi-line object form** (`single, single, single, multi`), so it is not ceremonial

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] **`--drift production` reviewed, and this release has three to apply** — `Against origin/main 7bca774: 123 file(s), 120 applied row(s)`, with `0121_audit_log.sql`, `0122_placement_lifecycle_and_site_views.sql` and `0123_is_public_drive_file_views.sql` pending and nothing applied that `main` lacks
- [ ] `--dry-run` reviewed — n/a: owed for the release, on all three. Not run from this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0123`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager:

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1`
  2. `--dry-run`, apply, then `check-public-views.mjs --env production`, **all appended to the same log**
  3. **Then** deploy — both copies

- [x] **`check-public-views.mjs` is genuinely owed this time, not boilerplate** — `0123` is named `is_public_drive_file_views`, so it changes the function that decides what an anonymous visitor may fetch through the photo proxy. That is the same function `0101`, `0103` and `0109` each narrowed, and the one place this project has repeatedly found leaks. `0122` also touches site views
- [x] **`deploy.mjs` now refuses on its own if these are not applied** — #254 built the schema guard from the backlog item filed after `0.10.1`: it compares every migration the deployed commit carries against what the database has applied, warns rather than refuses when it cannot ask, and exits 2 naming the files when it can. So the ordering failure that broke `/adopt/[id]` for an hour on `0.10.1` is now caught on this path. **It is still not caught on the Pi path** (`deploy-pi.sh` has no such guard), which is on the backlog

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.12.1`, `major: false`, `2026-10-01`, 4 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has twenty entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the mixed entry forms are this release's case, covered by the before/after comparison in §2. The register resolves to **3 strings and 1 object**, every note readable through `noteText()`, count exactly 4, none reworded, six-space indentation, CRLF preserved
- [x] **The release mail was built and read even though this release does not send one** — 4 bullets, 0 occurrences of `[object Object]`, 0 of `undefined`. Kept as a check because it costs one command and the object note is the form that would fail

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all four; **not emailed**, `major: false` | no mail — `majorReleasesSince("0.12.0")` is `[]`, verified in §2 |
| management | `/releases` | sees all four — the stock note is tagged for them | not verified on a deployed build at PR time |
| staff / volunteer / vet | `/releases` | sees the three untagged notes | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR — though note 3 is about that page's message | unchanged by *this* PR |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The cut's job was to carry one role tag across intact, which §2's comparison verifies directly
- [x] A role that should not have access is blocked server-side — not re-verified and not claimed: no access rule is touched by this PR. The release's own access changes are #262, #267 and #270, covered by their own plans

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
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `2c0036e`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All four were written by the PRs that made each change
- [ ] Non-obvious design choices recorded as a new file in `docs/decisions/` — n/a: no design choice in this PR. The `major: false` reasoning is in §1 as a release decision
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `2c0036e` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of five of the last six releases; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: this session, after merge. Before the production deploys
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. **Test is Worker-served**, so it does not exercise the Pi path production uses. **Worth most attention**: a destructive confirmation dialog (#263 — it names what will be lost and focuses Cancel), and Manual → Download PDF, which is note 1 and was broken on the Pi specifically
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. Low relevance: no note here is a date fix
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Relevant**: `0123` changes what the photo proxy will serve anonymously
- [ ] **`check-public-views.mjs --env production`, appended to the log** — deferred: release manager. §3 says why it is owed rather than optional this time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. **Expect 10.** A count of 12 is the signature of the `.env.production.local` leak found on 2026-10-01 (`docs/releases/2026-10-01.md`, the `0.12.0` section); #271 has since built a guard, so a leak should now be refused rather than counted
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — nothing to watch.** `major: false` and `majorReleasesSince("0.12.0")` is `[]`, so the step never engages
- [x] **Both copies must be deployed.** Production serves from the Pi; the Worker is the fallback. `node scripts/deploy.mjs --env production >> deploy.log 2>&1` **and** `./scripts/pi/deploy-pi.sh` on the Pi, or `/releases` keeps showing `0.12.0`. Plain `npm` is blocked by PowerShell's execution policy here, and **the terminal will look empty — that is the redirect, not a failure**
- [x] **Rollback is not what the older records say** — `wrangler rollback` reverts the Worker, which is the fallback, not the serving copy; rolling production back means `git reset --hard <sha>` and a rebuild on the Pi. **This release is fully reversible otherwise**: `major: false`, so no mail is sent and there is nothing that cannot be unsent. The three migrations do not revert with it, and that asymmetry is the usual one — safe to have applied early, unsafe to have applied late

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, all three pending files go **before** the deploy, per §3
- [ ] `--env production --dry-run` run and clean — deferred: release manager, on all three
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. `0122` is named `placement_lifecycle_and_site_views`; whether it rewrites rows or only redefines views is for whoever applies it to confirm from the file, and is the one of the three worth reading first
- [x] Apply plan stated — §3

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **Ten PRs** (#261–#263, #265–#271), enumerated with `node scripts/release-prs.mjs c7a76f6`: exit 0, **13 added migration and test-plan files cross-checked, no orphans**. All ten have a completed plan; none reports `Result: fail`; **three report `pass with accepted defects`**
- **The Critical advisory raised on 2026-10-01 is cleared in this release.** #268 bumped Next to `16.3.8`; `npm audit --omit=dev --audit-level=high` now reports **`found 0 vulnerabilities`**, where the same command on `0.12.0` reported one critical RCE in `next/og`. The backlog item that asked for it also asked the bump to re-check `strip-baked-env` and `getSiteOrigin()` on the Pi; #268's own plan is where that was answered, and note 1 of this release — the PDF screenshots coming back — is the visible half of the same area settling down
- **`0.12.0` had no release record** when this cut was prepared, the fifth in seven to lag its deploy. Written in this session as the `0.12.0` section of `docs/releases/2026-10-01.md`, commit `2c0036e`, quoted from `deploy.log`

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The four notes **and the title**, read as a shelter user would. Lower stakes than a major — these are not emailed — but they are what `/releases` shows. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.12.1` entry |
| 2 | **Note 1's claim.** It says the printable manual lost its screenshots "for a short while after the app moved to its new server" and now has them back. That is a regression this release fixes, so the note admits a fault — worth checking it describes what actually happened, and that the PDF really does contain pictures now | `src/lib/releases.ts`; #269, and Manual → Download PDF on test |
| 3 | The single role tag: the stock note is `admin, management`, so staff and volunteers will not see it | `src/lib/releases.ts`, the `0.12.1` entry |
| 4 | After both deploys: `/releases` shows `0.12.1` to a signed-in user — the only external check that the **Pi** took the release, since `/api/releases/current` is answered by the Worker | `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all four items are open and need a person

Manual verification by: pending: Lutan to read the four notes and the title (item 1), check note 1's account of the PDF regression (item 2), confirm the role tag (item 3), and confirm `/releases` after both deploys (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
