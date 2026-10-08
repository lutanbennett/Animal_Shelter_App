# Feature test plan — cut-release-0-22-0

## Header

| | |
|---|---|
| Feature | Cut release `0.22.0`, **major**: move the eight `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-22-0` @ `C:\Development\Animal_Shelter_cut-release-0-22-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no — `0162`, `0163` and `0164` ship in this release and are **still pending on production**. See §3 |
| Tested at SHA | `dd44aa87` (`main` tip at the cut) + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.22.0` entry holding the eight notes written by the release's PRs, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all eight notes are untagged, so every signed-in role sees every one of them.** `major: true`, so **every admin is mailed**, which §2 asserts rather than assumes
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record, its own PR after the deploy; (c) the nine unsigned feature plans, which keep their own `pending:` signatures and are not copied here

**Decided in chat by Lutan, 2026-10-08: `0.22.0`, major.** Asked before cutting
with the argument for each side put to him, as §4 requires.

The case for major, which he took: **pages move, and a role gains a section it
never had.** Medications and Diets each become two pages — the lists themselves
move to Settings for an admin, the day-to-day stock stays under Management — so
someone who knows where the medication list lives will go looking for it where
it used to be. Management gains a Website section, and Settings gains Facility
map. This is the same shape as the reasoning that made `0.21.0` major: not that
anything is taken away, but that people will look in the old place.

The case against, which he heard: nothing is removed, every page still exists,
and the other six notes are additions people will simply notice — zone colours,
the shelter's own ordering, cupboard order on the stocktake, map links that work.

### Order on `/releases` — and in the admin mail

The eight left `unreleased` in the order their PRs happened to add them, which
put the facility-map upload first and the Medications/Diets split — the reason
this release is major — **last**. A major release is mailed, so the entry is also
the first thing every admin reads. Reordered deliberately:

1. **Medications and Diets are each now two pages** — the move people will ask about, and why this is major
2. **Management can now edit the public website** — a role gains a section it did not have
3. **Zone colours** — visible on nine screens, for everyone
4. **Zones and enclosures in the shelter's own order**, with numbers read as numbers — everyone
5. **The stocktake in cupboard order**, with pack prices — whoever counts the shelves
6. **Facility map plans added and replaced in the app** — an admin job that needed a developer until now
7. **Contact map links** open Google Maps every time — everyone
8. **The account button on a phone** for vets and the head of medical — the smallest, and the last

Permutation `7,2,1,5,3,0,6,4` against file order, **asserted rather than
eyeballed** (§2). Lines were moved, never retyped. The one thing a reorder can
quietly break is a role tag following the wrong note, so tags were re-checked
**by text rather than by position** — and in this release all eight are
untagged, which makes a misplaced tag impossible but the check no less worth
running, since that is a fact about these eight notes and not about the method.

**No note was tagged by role at the cut.** Two were candidates — the stocktake
cupboard order and the facility-map upload are plainly not a vet's or a
volunteer's business — and both were left untagged on purpose: an untagged line
is never filtered out, a wrong tag hides a line from the people it is for, and a
tag invented at the cut is a change to a note that its own PR did not write.

### What is in the release

**#450–#465 — sixteen PRs**, contiguous, no gap to explain.
`node scripts/release-prs.mjs 9e74be1d HEAD` **exited 0** with 17 added
migration/test-plan files all accounted for. `9e74be1d` is `0.21.0`'s deployed
SHA, read from its record's header.

**The exit code was read directly, not through a pipe.** Every script in this
plan was run with its output redirected to a file and `$?` read from the script
itself — `release-prs.mjs`, `gates.mjs`, `check-release-guards.mjs`,
`apply-migrations.mjs` and the cut's own verifier. This is `0.21.0`'s lesson
applied rather than re-learned.

`release-prs.mjs` noted that `git log --first-parent` shows only 15 and that one
more was found off the first-parent line — the same squash-merge shape that cost
`0.21.0` a PR from its count, caught here by the script rather than by a reader.

### Twelve plans, nine of them unsigned

Twelve plans, all read. **Three are `n/a`** with a reason —
`contacts-address-map-schema` and `zone-colour-schema` (no UI surface, no code
reads the columns yet) and `plan-day-token-estimates` (a process document with no
app surface). **Nine say `pending:`**, every one of them waiting on the same
thing: a person looking at a phone.

Put to Lutan before the cut together with the major/minor question, in one round.
**What was named separately rather than folded into the count:** the two changes
in this release that could fail *silently*, since that distinction is what
changed `0.21.0`'s shape and is now a standing question in the runbook. Both were
read in code before he was asked, so the question put to him carried an answer
rather than a worry:

- **Contact map links** (#461, #464) now judge whether a saved link still leads
  to a place. It fails **open** by construction: `mapLinkLeadsSomewhere` returns
  `true` when Google cannot be reached, so a slow network never blocks a save,
  and a map is dropped only when Google answers without a redirect. The one
  degradation is transient — a 3-second timeout shows no map for that page view
  and the failed lookup is deliberately **not** cached, so the next view tries
  again.
- **Facility map uploads** (#465) serve plan images through a new route. It is
  behind sign-in *and* `loadPermissions()`, the object name must match
  `plans/<uuid>/<millis>-<random>.<ext>` or it 404s, images are never deleted so
  an Undo always has something to restore, and the image is served same-origin,
  so the CSP enforced in `0.21.0` is satisfied. A failure shows as a missing
  image — visible, not silent.

**He chose: ship and record the gap**, as `0.20.1` did, on the basis that this
release has no `0.21.0`-shaped silent failure in it. The nine `pending:` plans go
into the release record as a stated gap, not as closed items.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` at `dd44aa87` minutes before the cut, so there was nothing to merge in. `0` behind, confirmed by `git status -sb`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```

=== gates: build exited 0 after 181s

gates: typecheck=0 lint=0 build=0
```

- [x] **The build was a real one, not a warm cache** — 181s, in the range the runbook gives for a cold build rather than the ~80s a warm Turbopack cache produces. The exit code was read from `gates.mjs` itself either way, as the runbook says to do rather than inferring from the duration
- [x] **The gates were run on the final tree** — the entry has not been touched since. The procedure says to re-run on any change to the entry *even a role tag*, because the tempting assumption is that a data-only edit cannot break a build; there was no such edit after the run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error` and that a red `audit` has never been the cause of a failed run
- [x] Newest release version matches `package.json` — both `0.22.0`, read back from the parsed register rather than from the diff
- [x] `unreleased` is empty — emptied by this PR; it held exactly 8 entries and the cut script asserted the count, the indentation and that no unexpected line sat inside the block before writing
- [x] **`majorReleasesSince("0.21.0")` returns `["0.22.0"]`** — the call that decides whether admins are mailed, and the one gate here that must not be taken on trust
- [x] **The date was read from the local clock** — `2026-10-08`, the **same day `0.21.0` shipped**, so this release does **not** start its own record file: it appends a `## 0.22.0` section to `docs/releases/2026-10-08.md`, as §8 of the procedure allows and as 2026-10-02's file already does for four releases
- [x] The register parses the way `deploy.mjs` loads it — `0.22.0` / `2026-10-08` / `major: true` / 8 notes, imported under Node's type stripping
- [x] Order intact — `0.22.0 > 0.21.0 > 0.20.1`, every adjacent pair across all **35** entries still strictly descending by `compareVersions`
- [x] **The cut was verified against the pre-cut register through the parsed module** — compared against `origin/main:src/lib/releases.ts` as a **set**, because the order was changed on purpose: `text lost 0`, `invented 0`, `carried across unchanged: 8 of 8`
- [x] **The reorder is exactly the permutation intended** — `got [7,2,1,5,3,0,6,4], intended [7,2,1,5,3,0,6,4]`, with every source note used exactly once and no `-1` (an unmatched note). A set comparison alone would pass on a wrong order; this is the assertion that makes the mailed sequence a checked fact
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0 (before 0, after 0)`
- [x] **Every previously released entry is byte-identical** — all **34**, compared as serialised JSON against `origin/main`'s register
- [x] **The notes render clean** — no `[object Object]`, no `undefined`, no empty title, and every note has real text
- [x] **Lines were moved, never retyped** — spliced as raw source lines with only leading indentation changed
- [x] **CRLF preserved** — `src/lib/releases.ts` has CRLF terminators and the script detected and reused them, so the diff is 8 removed and 17 added lines rather than the whole file (`git diff --numstat`, measured after staging rather than predicted). The first run of the cut script **failed** on this and was fixed before it wrote anything: it split on `\n` and did not find the block terminator
- [x] `node scripts/check-release-guards.mjs` — all 15 ok, exit 0 read directly

Seventeen assertions from one script that exits non-zero if any fails, printed
together rather than reasoned about one at a time.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed before applying — **3 pending: `0162_zone_colour.sql`, `0163_management_website_content.sql`, `0164_contacts_map_url.sql`**; 161 applied, and `0` applied that `origin/main` lacks
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — n/a: no migration in this PR, so there is nothing here to dry-run. The release's three are dry-run immediately before the apply, which is §8's own deferred line. **Expect `0163` or `0164` to come back red there if `0162` is still pending**, per the runner's per-file `begin … rollback`: a red dry-run on something an earlier pending file provides is not a broken file. Read both before concluding
- [x] Applied to **dev** and recorded in `schema_migrations` — by the schema PRs on the day. Dev holds all **164** with `0 pending` and **no drift against `origin/main`**, in both directions
- [x] File is re-runnable — read rather than assumed: `0162` uses `if not exists` / `or replace` throughout, `0163` is an `insert … on conflict do nothing` plus three `alter policy` (its own header states the undo), and `0164` is `add column if not exists`, `drop constraint if exists` then add, and `create or replace view`
- [x] Existing rows still read correctly after the change — checked per file; see the consumer note below
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR. `0164`'s form constraint on `contacts.map_url` is exercised by its own schema PR's plan
- [x] Down-migration written, or the reason one is not needed is stated — not needed; see the rollback note in §8
- [x] Production apply plan stated for the release manager — §8

### The consumer coupling, which is real this time but milder than the headers read

`0.21.0` had none — both its files were `-- consumer: none`. This release has
three files with three different answers, and the difference decides whether the
apply must precede the deploy:

- **`0162_zone_colour`** — `-- consumer: none`. No coupling.
- **`0163_management_website_content`** — `-- consumer: src/app/admin/website/, src/lib/permissions/routes.ts`. **Read by code in this release.** It grants `management` the `website.content` cell at Edit and repoints three write policies from `is_admin()` to that cell. Reversing the order does not break anything: without the migration, Management simply does not get the Website page, which is today's behaviour. The migration is what makes the note true, not what keeps the app standing.
- **`0164_contacts_map_url`** — its consumer list names seven paths, and **none of them reads the new column in this release.** The file says so itself: "the forms, the contact page and the Friend card are the next stream, from the updated main." Confirmed rather than taken on trust — `grep -rn "map_url" src/` returns only `site_content.contact_map_url` (from `0120`, long live), never `contacts.map_url`. Its `create or replace view public_shelter_friends` keeps the same columns in the same order and falls back to `address` while `map_url` is empty, so the public `/friends` map is unchanged either way.

So there is **no window of the kind `0.20.0` had**, where narrowed policies went
live before the code that knew about them and emptied four pages. The ordering
still matters — both deploy paths refuse a commit whose database lacks a
migration that is on `main`, so **merge, pull, apply, deploy** is not optional —
but a slip in that order this release means a feature is absent, not that a page
is broken.

### `0163` widens access on purpose, which is worth stating plainly

It is the one change in this release that gives a role something it did not have:
**anyone holding Management can change the public website.** That is the accepted
consequence, written into the migration's own header and decided by Lutan on
2026-10-08 (`docs/decisions/2026-10-07-management-settings-split.md`) — the
Director is Admin at night on her PC and Management by day on her phone, and the
website is her job. The 2IC is deliberately **not** given the cell. Admin is
unchanged, since `has_permission()` admits Admin first, and `public_viewer` gains
nothing because it holds no rows.

The failure direction is loud, not silent: if the cell were granted and the
policies missed, every save on the Website page would be **refused**, which is
why the migration does both halves in one file and says why.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour; the register is read by `/releases`, `deploy.mjs` and the Worker, all three exercised by §2's parse and by the build
- [ ] Data persists — n/a: no runtime data; the change is source
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no new surface. An empty `unreleased` is the normal post-cut state and is what `check-release-guards.mjs` asserts the deploy requires
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input. The one boundary here is the version comparison, covered in §2 across all 35 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all 8 notes; **also receives the release email** | n/a — not run; see below |
| management | `/releases` | all 8 notes, no email | n/a — not run; see below |
| staff | `/releases` | all 8 notes, no email | n/a — not run; see below |
| vet | `/releases` | all 8 notes, no email | n/a — not run; see below |
| volunteer | `/releases` | all 8 notes, no email | n/a — not run; see below |
| signed out | `/releases` | not reachable, as before this PR | n/a — not run; see below |

- [ ] Every role above tested — n/a: this PR changes no access rule and adds no route. `/releases` and its role filter shipped long ago and are untouched; all eight notes are untagged, so every role sees all eight, which §2 confirmed from the parsed register
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR. The release **contains** one (`0163`), covered in §3 and by `website-content-grant`'s own plan

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR. The release *contains* nav changes (the Medications/Diets split, Management → Website, Settings → Facility map), which are those PRs' own plans and are items in **Left for manual verification**
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut is not a feature and has no manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated; the register is English, as all 34 previous entries are
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no page changed by this PR; the dev server was not started
- [ ] Network clean — n/a: no page changed by this PR

## 6. Regression

- [x] The pages nearest the change still work — the `build` gate renders the register's consumers; `/releases` is in the route list the build printed, and `deploy.mjs` and the Worker parse the same file, which §2 did explicitly under type stripping
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` is the shared file and it was exercised **by loading it**, not by reading it: imported as a module and every entry walked, plus the full `next build`. The weaker check would have been to read the diff and conclude the other 34 entries were fine; instead all 34 were compared as serialised JSON against `origin/main`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `dd44aa87` directly
- [x] **The branch was diffed against its merge-base, not against `origin/main`** — `0.21.0`'s lesson: `main` moves during a release, and comparing a two-file branch against a moved `origin/main` produced a thirty-file diff of someone else's feature

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the three judgements here — major rather than minor, the note order, and leaving two tag-candidates untagged — are recorded in §1 with their reasons, and all three are release decisions rather than design ones
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All eight were written by the PRs that made each change and are carried across unaltered, which §2 asserts as a set and as a permutation
- [x] Commit messages say why, not just what — the cut commit records the major decision, the case taken, the reorder with its reason, and the verification tally
- [x] **Claims were measured, not reasoned** — every number in §1 and §2 comes from a script that exits non-zero on failure. The three prose-shaped claims in §1 and §3 were checked the same way: the two silent-failure candidates by **reading the code that would fail** (the fail-open branch in `mapLinkLeadsSomewhere`, the sign-in and filename gates on the plan-image route), and "nothing in this release reads `contacts.map_url`" by grepping `src/` rather than by trusting the consumer header

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **Both Pi builds will be pinned with `--ref <release sha>`** rather than left to fetch `main`'s tip, which is how `0.19.3` ended with four artifacts on two SHAs

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The entry's `date` is a literal read from the local clock at cut time, asserted in §2
- [ ] **Boundary or banding change** — n/a: no threshold, rounding rule or cutoff in this PR. The release contains one — `0161`'s widened `numeric(12,4)` and the per-gram pricing — which is `place-order-settings`' own plan
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] **The working tree is clean before deploying** — deferred: release manager. `0.19.1`'s deploy was refused for untracked spreadsheets in the repo root
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**; the log is UTF-16, so `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — deferred: release manager; `deploy-pi.sh` checks this itself
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new in this release. The facility-map upload uses the existing service role and **creates its own Supabase Storage bucket on first use**, so production needs no setup step; that first upload is an item in **Left for manual verification**
- [ ] **The deploy prints a release mail, and the mail arrives** — deferred: release manager. It should print `release mail for 0.22.0: sent N, skipped M`, and `sent` is the relay accepting it, not delivery — the inbox is checked for the message from `releases@lannacare.org` with `0.22.0` in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED`, a known open question. Only the **production** deploy mails; test sets `RELEASE_MAIL_ENV` to `""`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no. **For the release the answer is "one of three, and reversing it loses a feature rather than breaking a page"** — `0162` is `consumer: none`, `0164`'s consumers are the next stream and were confirmed by grep not to read the column yet, and `0163` is read by this release's Website page but degrades to today's behaviour without it. §3 has the reasoning
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, immediately before the apply. **A red dry-run on `0163` or `0164` is expected if `0162` is still pending** and is not grounds to stop; read both files before concluding, per the runbook's per-file `begin … rollback` caveat
- [ ] For a **destructive or rewriting** migration only — n/a: none of the three destroys or rewrites data. `0162` adds a nullable colour column, `0163` grants a cell and repoints three policy expressions, `0164` adds a nullable column with a form constraint and replaces one view with the same shape. **No rows are moved by `0164`**, deliberately — its header explains that emptying links out of `address` now would take every map off the screens until the feature ships
- [x] Apply plan stated — **merge, pull, apply, test, production:**
  1. merge this PR;
  2. **pull the main checkout and confirm `git status -sb` says neither ahead nor behind** — `0.20.0` applied five migrations and had its deploy refused because the merges had happened on GitHub while the local `main` sat six commits behind;
  3. `apply-migrations.mjs --env production --dry-run`, reading the per-file caveat above, then apply all three. Re-run `--status` and read `0 pending`;
  4. deploy **test** — Worker, then the Pi test clone pinned with `--ref`;
  5. the production Worker deploy — **Lutan's one job** — with the Pi production build started **in the same breath, not after it**, since the Pi build does not depend on the Worker;
  6. `--drift production` and `--drift dev` afterwards, both quoted in the record.

  No test hold this release: Lutan chose ship-and-record, and §1 says why the two
  silent-failure candidates did not warrant `0.21.0`'s shape.

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 9e74be1d`; `npx wrangler rollback --env production` reverts only the Worker fallback. **None of that reverts `0162`, `0163` or `0164`**, and none of them needs it: all three are additive or policy-only, and `0.21.0` code runs against all three unchanged — it does not read the new columns, and the Website page it shipped is Admin-only, which `has_permission()` still admits first. The one thing `0163` leaves behind after a rollback is Management holding a cell whose page the old code does not open to them. **What cannot be undone is the mail** — this is a major release, so by the time a rollback is considered every admin has already been told what shipped

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Nine of the twelve feature plans in this release are unsigned, all waiting on a person looking at a phone | **accepted and recorded.** Put to Lutan with the major/minor question; he chose ship-and-record, as `0.20.1` did. They go into the release record as a stated gap, and each keeps its own `pending:` signature |
| 2 | low | `0164_contacts_map_url` names seven consumer paths, none of which reads the column in this release | **not a defect** — the header is deliberately forward-looking and the file says so. Worth recording because a consumer list read at face value would have implied an apply-before-deploy window that does not exist. Confirmed by grep, not by reading the header |
| 3 | low | The cut script's first run failed, finding no `unreleased` block, because it split on `\n` against a CRLF file | **fixed before anything was written.** Recorded because the failure mode is silent in the other direction: a script that "succeeds" against CRLF by rewriting every line produces a whole-file diff that hides what actually changed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The `0.22.0` title and the order of the eight notes** — on `/releases` **and in the admin mail**, which cannot be taken back once sent | `src/lib/releases.ts`, the `0.22.0` entry |
| 2 | That the release mail actually arrived, not merely that the deploy said `sent N` | the inbox, for `releases@lannacare.org` with `0.22.0` in the subject |
| 3 | **The first facility-map upload on production**, which is also what creates the Storage bucket — no setup step runs before it | `lannacare.org`, Settings → Facility map, signed in as admin |
| 4 | **That Management can open and save Management → Website on production**, the one access widening in this release | `lannacare.org`, signed in as Management |

Items 3 and 4 are the two production-only checks in this release. The nine
`pending:` feature plans are **not** copied here: they belong to their own plans
and their own signatures, and copying them would give them a second home that
nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items, all Lutan's, and all of them fall after this PR merges

Manual verification by: pending: the `0.22.0` title and note order, the arrival of the admin mail, the first facility-map upload on production, and a Management login saving Management → Website

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1, §3 and §8
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — all twelve plans read; nine are unsigned and Lutan chose ship-and-record, after the two changes that could fail silently were named to him on their own and both were read in code first. The migration coupling is real but mild: of the three files, one is `consumer: none`, one is read only by a later stream, and the third degrades to today's behaviour rather than breaking a page. Merge, pull, apply, deploy still holds
