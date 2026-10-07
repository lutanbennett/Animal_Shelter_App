# Feature test plan — cut-release-0-20-1

## Header

| | |
|---|---|
| Feature | Cut release `0.20.1`, **minor**: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-20-1` @ `C:\Development\Animal_Shelter_cut-release-0-20-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-07 |
| Carries a migration? | no — `0156` and `0157` ship in this release and are **still pending on production**. See §3; unlike `0.20.0` the ordering here is routine, and §3 says why |
| Tested at SHA | `4e5ccad3` (`main` tip at the cut) + this branch's commit `01d7aa22` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.20.1` entry holding the seven notes written by the release's PRs, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — five of the seven notes reach every signed-in role; two are tagged `admin`. `major: false`, so **no admin is mailed**, and that is the assertion in §2 that must not be taken on trust
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job by his own instruction of 2026-10-02; (b) the release record, which is its own PR after the deploy; (c) the outstanding manual verification on the twelve feature PRs, which stays on their own plans and their own signatures; (d) `0.20.0`'s unclosed Contacts pass, which belongs to that release's record and is **not** copied into this plan's table

**Decided in chat by Lutan, 2026-10-07: `0.20.1`, minor.** Asked before cutting,
with the argument for each side put to him, as §4 of the procedure requires.

The case for minor, which he took: **nothing is taken away from anyone in this
release.** The one permission change — note 7 — *widens* access: the 2IC, the
Heads of Medical and Maintenance and volunteers now see at least what an
anonymous visitor sees on a resident's name card, and a vet stops getting an
error for a resident their clinic does not treat. `0.20.0` was mailed hours
earlier precisely because something *disappeared* (Contacts, for staff and
volunteers), and a second mail the same day for tap-target fixes would dilute
the one that matters.

The case against, which he heard: note 7 still changes who can see a resident's
card, which was a Director decision; and note 3 hands admins an editor that puts
a lifetime figure on the **public** homepage. Either could be argued as something
admins should be told in writing rather than discover. What tips it is that the
homepage band shows nothing until an admin enters a figure, and none is entered
yet — so there is no public change to announce on the day of the deploy.

### What is in the release

**#416–#427 — twelve PRs**, contiguous, no gap to explain. `d7f5dddc` is
`0.20.0`'s deployed SHA, read from its record's header, and it is #415's own
merge commit, so the boundary is exact rather than inferred.

`node scripts/release-prs.mjs d7f5dddc HEAD` listed eleven and **exited 1**, and
that is a true report rather than a fault — see Defects #1. It named one file
belonging to no PR in its list:

```
DISAGREEMENT — 1 file(s) added in this range belong to no PR above:
  docs/test-plans/recent-changes-overflow.md  (introduced in 584e81b)
```

`584e81b` is **#416**, *Recent changes: filter row fits at 375 px*, which was
**squash-merged** — so there is no merge commit whose subject the script can
read. Added by hand, as the procedure instructs, and confirmed against GitHub:
`gh pr list --state merged` reports #416 merged at `2026-10-07T07:01:58Z` with
merge commit `584e81b2`. Checked rather than assumed with
`git merge-base --is-ancestor 584e81b d7f5dddc`, which said **no** — #416 is new
in this range and not already in `0.20.0`.

Seven of the twelve PRs wrote a release note; the other five are two schema PRs,
the `sharp` advisory override, the `0.20.0` release record and a CI fix to
`check-public-views`, none of which a shelter user would notice.

### Eight of the twelve plans are unsigned, and Lutan chose to ship

Twelve PRs, twelve plans, all read. Four are closed with a reason:
`baseline-impact-schema` and `map-nonresident-rooms` are `n/a` (a table and a
view, asserted in their own §3 harnesses), and `public-views-impact-figures` and
`sharp-override` are `n/a` (no human-visible surface). **Eight say `pending:`.**

Put to him before the cut, as the procedure requires, together with the
major/minor question in one round rather than three. The option he was offered
and declined was to deploy **test only**, hold for his pass, then deploy
production — which would also have closed `0.20.0`'s outstanding Contacts pass.
**He chose to ship and have the eight recorded as a gap**, which is what
`0.19.3` and `0.20.0` also did. The widest unverified item is note 7, the name-card
permission widening, which no one has looked at on a screen.

This plan does not tick anything on their behalf and does not copy their rows
here: the procedure forbids it, because a copied row gets a second home that
nothing ever closes.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before the cut, at `4e5ccad3`, so there was nothing to merge in. `0` behind at the cut, confirmed by `git status -sb`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 154s

gates: typecheck=0 lint=0 build=0
```

- [x] **The gates were run on the final tree** — the entry has not been touched since. The procedure says to re-run on any change to the entry *even a role tag*, because the tempting assumption is that a data-only edit cannot break a build; there was no such edit after the run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything, so the status read is the script's and not `tail`'s
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — neither signal alone distinguishes a healthy run from an unexamined one: `0.19.2`'s cut PR reported `MERGEABLE` / `CLEAN` with no workflow run at all, and `0.19.3`'s had a `success` run containing a failed `audit` job. Both are read, knowing `audit` and `test-plan` are `continue-on-error` and that a red `audit` has never once been the cause of a failed run
- [x] Newest release version matches `package.json` — both `0.20.1`, read back from the parsed register rather than from the diff
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 entries and the cut script asserted the count, the indentation and that no blank line sat inside the block before writing
- [x] **`majorReleasesSince("0.20.0")` returns `[]`** — the call that decides whether admins are mailed. This is the gate that proves the minor decision was actually enacted: an empty list means the production deploy sends no mail
- [x] **The date was read from the local clock** — `2026-10-07`, the same day as `0.20.0`, so this release adds a `## 0.20.1` section to the existing record file rather than starting a new one
- [x] The register parses the way `deploy.mjs` loads it — `0.20.1` / `2026-10-07` / `major: false` / 7 notes, imported under Node's type stripping
- [x] Order intact — `0.20.1 > 0.20.0 > 0.19.3`, and every adjacent pair across all **33** entries still strictly descending by `compareVersions`
- [x] **The cut was verified against the pre-cut register through the parsed module**, not read over — `carried across unchanged: 7 of 7`, `text lost 0`, `invented 0`. Compared both in order *and* as a set, because order was **not** changed this time, so both had to agree
- [x] **Role tags survived** — matched by text rather than by position: `role tags changed: 0`
- [x] **Every previously released entry is byte-identical** — all **32** of them, compared as serialised JSON against `origin/main`'s register
- [x] **The notes render clean** — `0 problem(s)`; no `[object Object]`, no `undefined`, no empty title, every role array a non-empty list of strings, across every entry in the file and not just the new one
- [x] **Lines were moved, never retyped** — the notes were spliced as raw strings between the two arrays and only their leading indentation changed, asserted by comparing `trimStart()` on each line before and after
- [x] **CRLF preserved** — `src/lib/releases.ts` has CRLF terminators and the script detected and reused them, so the diff is 8 removed and 18 added lines rather than the whole file. `0.20.1`'s own `inputs-16px` note needed a second commit for exactly this reason, so it was checked here with `file` before and after
- [x] `node scripts/check-release-guards.mjs` — all 15 ok, exit 0

Fifteen assertions, printed together by one script rather than reasoned about one
at a time, and the script exits non-zero if any fails.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed before applying — **2 pending: `0156_impact_baselines.sql`, `0157_map_rooms.sql`**; 155 applied, and `0` applied here that `origin/main` lacks
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — **both `… ok`**, read individually. No chained-dependency failure of the kind `0.18.0`'s `0136` and `0.16.0`'s `0076` hit; `0157` does not build on `0156`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — by the two schema PRs, on the day. Dev reads `157 applied, 0 pending` and `0` in each direction against `origin/main`
- [x] File is re-runnable — read rather than assumed: both open `create table if not exists`, and every policy is `drop policy if exists` then `create policy`; `0156`'s view is `create or replace view`. Eight idempotent guards in `0156`, four in `0157`
- [x] Existing rows still read correctly after the change — **both migrations are purely additive.** Grepped for `drop table`, `drop column`, `delete from`, `truncate` and `update`: none in either file. Every policy either file creates is on a table that file creates, so no existing read path is narrowed
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the two schema PRs' own §3 harnesses
- [x] Down-migration written, or the reason one is not needed is stated — not needed: purely additive schema is safe to leave in place if the code is rolled back, since nothing existing reads it. Stated again in §8's Rollback
- [x] Production apply plan stated for the release manager — §8's ordering section

### Why the ordering is routine this time, unlike `0.20.0`

`0.20.0` had a genuine window: `0151` and `0155` **narrowed read policies**, so
production ran `0.19.3` code against `0.20.0` policies and would have shown empty
medication, diet, vaccine and Contacts lists. That is the whole reason its record
carries a section about it.

**Nothing in `0156` or `0157` narrows anything.** The dry-run's consumer warnings
are the *safe* direction and say so themselves:

```
WARNING 0156_impact_baselines.sql: declared consumer src/app/admin/website/ differs from release 0.20.0, so it may or may not already read this.
WARNING 0156_impact_baselines.sql: declared consumer src/app/page.tsx differs from release 0.20.0, so it may or may not already read this.
  note: These tables/columns land before the code that reads them is live. That is the safe direction - nothing is blocked - but do not deploy the reader before this is applied, and expect nothing to use it yet.
  note: "Live" here is what https://lannacare.org reports it runs: 0.20.0 @ d7f5ddd.
```

`0157` is `-- consumer: none`. `0156` declares `src/app/admin/website/` and
`src/app/page.tsx`, which arrive **in this release** — so the apply must still
precede the deploy, but the cost of the gap between them is that the Impact
figures editor is briefly absent, not that anything existing breaks. There is no
user-visible defect in the window, which is why the apply does not have to be
choreographed against the deploy the way `0.20.0`'s did.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour; the register is read by `/releases`, `deploy.mjs` and the Worker, and all three are exercised by §2's parse and by the build
- [ ] Data persists — n/a: no runtime data; the change is source
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no new surface. `unreleased` being empty is the normal post-cut state and is what `check-release-guards.mjs` asserts the deploy requires
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input. The one boundary that exists here is the version comparison, covered in §2 by the order assertion across all 33 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all 7 notes, including the 2 tagged `admin` | n/a — not run; see below |
| management | `/releases` | sees the 5 untagged notes | n/a — not run; see below |
| staff | `/releases` | sees the 5 untagged notes | n/a — not run; see below |
| vet | `/releases` | sees the 5 untagged notes | n/a — not run; see below |
| volunteer | `/releases` | sees the 5 untagged notes | n/a — not run; see below |
| signed out | `/releases` | not reachable, as before this PR | n/a — not run; see below |

- [ ] Every role above tested — n/a: this PR changes no access rule and adds no route. `/releases` and its role filter shipped long ago and are untouched; what each role sees follows from the role tags, which §2 asserted survived unchanged by text rather than by position
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut is not a feature and has no manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated; the register is English, as all 32 previous entries are
- [ ] Mobile viewport (375px) — n/a: no layout change. Several of the notes *describe* phone fixes, but their own plans checked those
- [ ] Browser console clean — n/a: no page changed; the dev server was not started for this PR
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work — the `build` gate renders the register's consumers: `/releases` is in the route list the build printed, and `deploy.mjs` and the Worker both parse the same file, which §2 did explicitly under type stripping
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` is the shared file, and it was exercised **by loading it**, not by reading it: imported as a module and every entry walked, plus the full `next build`. The weaker check would have been to read the diff and conclude the other 32 entries were fine; instead all 32 were compared as serialised JSON against `origin/main`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `4e5ccad3` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the only judgement here, minor rather than major, is recorded in §1 with the case put to Lutan on each side, and it is a release decision rather than a design one
- [x] `README.md` still accurate — it describes the register and the cut process, neither of which changed; it does not name a version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All seven were written by the PRs that made each change and are carried across unaltered, which §2 asserts note by note
- [x] Commit messages say why, not just what — the cut commit records the minor decision, the case taken, and the verification tally
- [x] **Claims in commit messages were measured, not reasoned** — every number in the commit message and in §2 comes from a script that exits non-zero on failure: the 7-of-7 comparison through the parsed module, role tags matched by text, `majorReleasesSince("0.20.0")` returning `[]`, the 32 byte-identical entries, both dry-runs read one at a time, and the "purely additive" claim in §3 checked by grepping each file for destructive statements rather than by reading its header prose

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **Both Pi builds will be pinned with `--ref <release sha>`** rather than left to fetch `main`'s tip: `backlog` landed on `main` three times during `0.20.0`'s preparation and that is how `0.19.3` ended with four artifacts on two SHAs

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Test runs against the **dev** database, which already holds `0156` and `0157`, so test has no window at all
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The entry's `date` is a literal string read from the local clock at cut time, asserted in §2
- [ ] **Boundary or banding change** — n/a: no threshold, rounding rule or cutoff in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] **The working tree is clean before deploying** — deferred: release manager. `0.19.1`'s deploy was refused for untracked spreadsheets in the repo root
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**; the log is UTF-16, so `tr -d '\000'` before grepping. Missed on `0.15.0`, `0.15.1` and `0.16.0`, captured on `0.19.3` and `0.20.0`
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — deferred: release manager; `deploy-pi.sh` checks this itself
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new in this release
- [ ] **The release mail** — n/a: `major: false`, so no mail is sent at all. §2 proves it rather than assuming it: `majorReleasesSince("0.20.0")` returns `[]`. A `sent N` line appearing in the production deploy output would mean the minor decision had not been enacted, and is worth a glance for that reason

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, and for the release the answer is the mild one. `0156`'s declared consumers ship in this release, so the apply still goes **before** the deploy; but both files are purely additive (§3), so the gap costs an absent Impact figures editor rather than a broken page. Not the `0.20.0` situation
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — both `… ok`, read one at a time, against production's real schema
- [ ] For a **destructive or rewriting** migration only — n/a: both additive, nothing rewritten, no backup gate triggered
- [x] Apply plan stated — **merge, pull, apply, deploy, in that order**, which is the one correction `0.20.0` earned:
  1. merge this PR;
  2. **pull the main checkout and confirm `git status -sb` says neither ahead nor behind** — `0.20.0` applied five migrations and had its deploy refused because the merges had happened on GitHub and the local `main` was six commits behind. The generic *"Apply them first"* the guard prints one step earlier is, in that state, exactly what opens the window;
  3. `apply-migrations.mjs --env production` — `0156` then `0157`;
  4. deploy **test** (Worker, then the Pi test clone pinned with `--ref`);
  5. the production Worker deploy — **Lutan's one job** — and the Pi production build started in the same breath, not after it, since the Pi does not depend on the Worker;
  6. `--drift production` and `--drift dev` afterwards, both quoted in the record.

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref d7f5dddc`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0156` or `0157`** — but unlike `0.20.0`, that is harmless here: both are purely additive, so rolled-back `0.20.0` code runs against them exactly as it does today, reading nothing that is not there. There is no down-migration to write and nothing to accept. **And no mail has to be un-sent**, because this release does not send one

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `release-prs.mjs` exited **1** on this range: #416 was **squash-merged**, so it has no merge commit for the script to read a PR number from, and its test plan looked like a file belonging to no PR | accepted, and the procedure's own instruction followed — #416 found on GitHub, added by hand, confirmed merged with merge commit `584e81b2`, and `git merge-base --is-ancestor` used to prove it is new in this range rather than already in `0.20.0`. Recorded in §1 and it goes in the release record. Not a script bug: the procedure anticipates squash merges in so many words. Worth noting that the exit code is the whole value here — piping it through `tail` would have shown exit 0 and lost a PR from the release |
| 2 | low | The eight `pending:` plans ship unverified, note 7's name-card permission widening among them | **accepted on Lutan's explicit decision**, taken with the alternative (deploy test, hold for his pass, then production) put to him and declined. Recorded as a gap in the release record, where `0.19.3` and `0.20.0` recorded thirteen and twelve. Not ticked or absorbed anywhere in this plan |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.20.1` title and the seven notes as a shelter user reads them — spelling, and whether the title describes the release. Lower stakes than `0.20.0`, whose order was read by every admin in a mail; this one is only on the page | `/releases` on `test.lannacare.org`, after step 4 of §8's apply plan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it falls after this PR merges

Manual verification by: pending: the `0.20.1` title and the seven notes read on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1, §3 and §8
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-07 — all twelve plans read; eight are unsigned and Lutan chose to ship them as a recorded gap rather than hold for a pass on test. The release-prs disagreement was a squash-merged PR, resolved by hand and not by assumption. Unlike `0.20.0`, the migration ordering is routine: both files are purely additive, so the apply-before-deploy rule costs an absent editor rather than a broken page
