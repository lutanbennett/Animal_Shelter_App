# Feature test plan — cut-release-0-17-0

## Header

| | |
|---|---|
| Feature | Cut release `0.17.0`, **major**: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-17-0` @ `C:\Development\Animal_Shelter_cut-release-0-17-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-04 |
| Carries a migration? | no — `0133_role_can.sql` ships in this release and was **already applied to production**, and this time the ordering was load-bearing. See §3 |
| Tested at SHA | `4115af42` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.17.0` entry holding the seven notes written by #330–#342, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — two notes are role-tagged (`admin, management, staff, volunteer` on stocktake; `admin, management` on ordering) and five are untagged. **`major: true`, so every admin with an email is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record; (c) the outstanding manual verification on eleven of the fifteen PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-04: `0.17.0`, major.** Asked before cutting.
No security fix this time: two new phone-first screens, Thai where the app still
spoke English, and wording fixes — plus the whole permissions build underneath
with no user-facing note of its own.

### The note order was chosen

New capability first, then the Thai work, then wording, then the tooling:

1. Counting medicines on a phone, one card at a time (`admin, management, staff, volunteer`)
2. Ordering medicine and food on a phone (`admin, management`)
3. Release notes and the Manual in Thai
4. Validation messages follow the app's language
5. The sign-in error, in English or Thai, keeping the email typed
6. Wording fixes on staff screens
7. Machine-written translation drafts

### What is in the release

`node scripts/release-prs.mjs 4a626930 4115af42` — fifteen PRs, exit 0, sixteen
added migration/test-plan files all accounted for. Worth noting what the script
said about its own method:

```
(git log --first-parent shows only 13; 2 more found off the first-parent line.)
```

That is the failure mode the script exists for — #213 in `0.9.1` — catching two
PRs a first-parent walk would have missed, in this release, today.

### Eleven of the fifteen PRs carry an unsigned manual-verification line

Put to Lutan before the cut; he chose to ship and record the gap. The shape of
it is different from previous releases and worth stating:

- **Four are the permission sweeps** (#330, #336, #340, #342), each asking for
  "the role pass in the table above, by a person", against the build that just
  changed who can do what across residents, medical and the rest. That is the
  largest single block of unverified behaviour this release carries.
- `translations-worker` wants the Cloudflare console steps and a first look at real drafts.
- `role-can-app`, `stocktake-cards-phone`, `permissions-catalogue` want role or phone passes.
- Two are mine from yesterday (`release-record-0-16-0`, `verification-queue`) and are documents for Lutan to read.

**Two are signed, which is new.** `2ic-purchasing-phone` carries
`Manual verification by: Lutan Bennett  Date: 2026-10-04`, and
`staff-wording-and-thai` uses the legitimate "confirmed in chat; line written by
Claude at their request" form. Four more are honest `n/a:`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `4115af42` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 164s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.17.0`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.16.0")` returns `["0.17.0"]`** — the call that makes the deploy mail admins
- [x] **The date was read from the local clock** — `2026-10-04`, matching the entry, and a day later than `0.16.0`
- [x] The register parses the way `deploy.mjs` loads it — `0.17.0` / `2026-10-04` / `major: true` / 7 notes, under Node's type stripping
- [x] Order intact — `0.17.0 > 0.16.0 > 0.15.1`, the file order still matching a re-sort by `compareVersions` across all 26 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — five notes are bare strings and two the object form, so a `text:`-keyed comparison would check two of seven. Both registers imported and compared by `noteText`: `carried across unchanged: 7 of 7`, `text lost: 0`, `text invented: 0`, forms `string,string,string,string,string,object,object` before and `object,object,string,string,string,string,string` after — the reorder and nothing else
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed — `0133_role_can.sql` was pending and has since been applied
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — `… ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — by #333 before this release
- [x] File is re-runnable — read rather than assumed
- [x] Existing rows still read correctly after the change — `0133` adds a function, not rows
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in #333
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR. An unused function is harmless to leave
- [x] Production apply plan stated — **already executed, and the ordering was load-bearing this time.**

### `0133`'s own note was stale, and the consumer header is what caught it

The migration's header says **"ADDITIVE AND READ BY NOTHING YET"**, and
`apply-migrations.mjs` repeated it: *"These tables/columns land before the code
that reads them is live."* That was true when #333 wrote it as a schema-first PR.
It is **not** true of this release: #335 and #342 landed the reader in the same
batch, and `src/lib/recurring-jobs/eligibility-load.ts:28` calls
`supabase.rpc("role_can", …)` at runtime.

So `0133` had to be applied **before** the deploy, not merely before the next
one. It was. What caught it was the `-- consumer:` header naming a file, which
made the claim checkable: grep the named area, find a real `rpc(` call rather
than a comment, conclude the note is stale. Checked by distinguishing calls from
mentions — three of the four `role_can` references in `src/` are comments.

Two things worth fixing elsewhere, neither in this PR: the note in `0133` is now
misleading to anyone reading it cold, and its header names
`src/lib/recurring-jobs/eligibility.ts` while the actual caller is
`eligibility-load.ts` in the same directory.

`--drift` after applying, both databases: `No drift: production matches origin/main`
(`133 file(s), 133 applied row(s)`, zero each way) and `No drift: test matches origin/main`.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface; an empty `unreleased` is the normal post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. Version ordering across 26 entries is the nearest thing and is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all seven, **and the email** | not driven — register parse checked instead |
| management | `/releases` | all seven — named in both tagged notes | not driven |
| staff | `/releases` | six — the five untagged plus stocktake | not driven |
| vet | `/releases` | the five untagged only | not driven |
| volunteer | `/releases` | six — the five untagged plus stocktake | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, which §2 asserts by text match
- [ ] A role that should not have access is blocked server-side — n/a: no new access path. **Note for the release manager:** this release changes a great deal about role access elsewhere, and that is #330/#336/#340/#342's unsigned role pass, not this PR's

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62). **Noted with some irony:** note 3 in this very release is about the release-notes page's *headings* now being Thai, which is the surrounding furniture, not the notes
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register; both are in the build output
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; all three go through the exports checked in §2, and the third was exercised directly by loading the register under type stripping
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice made here, the note order, is recorded in §1
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All seven were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the four that could have been guessed were each run: the seven-note comparison through the parsed module, the role-tag check by text match, `majorReleasesSince("0.16.0")`, and `0133`'s consumer being a real `rpc()` call rather than a comment

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime; the entry's `date` is a literal read from the local clock and checked in §2
- [ ] **Boundary or banding change** — n/a: no boundary in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager. Missed on `0.15.0`, `0.15.1` and `0.16.0` because it scrolls past; `docs/release-procedure.md` now hands the command over with `| tee` for exactly this
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new in this release

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form: no migration in this PR. **For the release it is yes**, and §3 is the whole of that answer: `0133`'s reader ships here and the migration was applied first
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean
- [ ] For a **destructive or rewriting** migration only — n/a: `0133` adds a function
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 4a626930`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0133`**, and leaving it is safe: a function nothing calls once the code is rolled back. The asymmetry runs the other way this time — rolling back the *code* while `0133` stays is fine, but deploying the code without `0133` would break the recurring-jobs eligibility path, which is why the apply came first. **The mail cannot be un-sent**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `0133`'s header says "ADDITIVE AND READ BY NOTHING YET", which stopped being true when #335 and #342 landed its reader in the same release | accepted here, flagged in §3: applied files are never edited, so this wants a note in the release record rather than a change to the migration |
| 2 | low | `0133`'s `-- consumer:` header names `src/lib/recurring-jobs/eligibility.ts`; the actual `rpc("role_can")` call is in `eligibility-load.ts` beside it | accepted: near enough to find the right area, which is what the header is for, but worth correcting next time that file is touched |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.17.0` title, and the order the seven notes will be mailed in — both are mine, and the order puts the two phone screens ahead of the Thai work, which is a judgement about what admins most want to read first | `src/lib/releases.ts`, the `0.17.0` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it is a judgement about text about to be mailed

Manual verification by: pending: the `0.17.0` title and the mailed order of the seven notes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-04 — all fifteen plans read; the eleven unsigned lines were put to Lutan before the cut, with the four permission sweeps named as the block that matters, and he chose to ship and record the gap
