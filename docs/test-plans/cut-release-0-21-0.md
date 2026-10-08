# Feature test plan — cut-release-0-21-0

## Header

| | |
|---|---|
| Feature | Cut release `0.21.0`, **major**: move the six `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-21-0` @ `C:\Development\Animal_Shelter_cut-release-0-21-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no — `0160` and `0161` ship in this release and are **still pending on production**. See §3 |
| Tested at SHA | `dd682a12` (`main` tip at the cut) + this branch's commit `8f1d98c1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.21.0` entry holding the six notes written by the release's PRs, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all six notes are untagged, so every signed-in role sees every one of them.** `major: true`, so **every admin is mailed**, which §2 asserts rather than assumes
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record, its own PR after the deploy; (c) the ten unsigned feature plans, which keep their own `pending:` signatures and are not copied here

**Decided in chat by Lutan, 2026-10-08: `0.21.0`, major.** Asked before cutting
with the argument for each side put to him, as §4 requires.

The case for major, which he took: **the menu changes for everyone.** Eight pages
— Enclosures, the Medication list, Maintenance, Stocktake, Deliveries, Projects,
Vets and Contacts — stop being their own menu entries and become tiles inside a
new **Shelter Operations** entry, and the Website page moves from Settings to
Management. Staff and volunteers get Shelter Operations in their menu for the
first time. This is the same shape as the change that made `0.20.0` major —
someone looking for a page where it used to be — except it reaches everyone and
eight pages rather than one group and one page.

The case against, which he heard: nothing is actually *removed*. Every page still
exists, every link still works, and a tile is one tap away. The other five notes
are tap-target fixes and small wording changes.

### Order on `/releases` — and in the admin mail

The six left `unreleased` in the order their PRs happened to add them, which put
tappable links first and the menu reorganisation **last**. A major release is
mailed, so the entry is also the first thing every admin reads. Reordered
deliberately:

1. **Shelter Operations** — the menu change, which is what people will ask about
2. The **home page** impact figures lose "About" and the estimate note — the public website changes
3. **Enclosures** shows residents and spaces free per zone — new information on a daily page
4. **Links on public pages** are tappable — a new ability for whoever writes the content
5. **More buttons** big enough to tap: My tasks, the photo viewer, Units, the account menu
6. **The remaining small buttons** big enough to tap

Permutation `5,4,1,0,2,3` against file order, **asserted rather than eyeballed**
(§2). Lines were moved, never retyped. The one thing a reorder can quietly break
is a role tag following the wrong note, so tags were re-checked **by text rather
than by position** — and in this release all six are untagged, which makes a
misplaced tag impossible but the check no less worth running, since that is a
fact about these six notes and not about the method.

### What is in the release

**#429–#448 — twenty PRs**, contiguous, no gap to explain.
`node scripts/release-prs.mjs 50631c85 HEAD` **exited 0** with 23 added
migration/test-plan files all accounted for. `50631c85` is `0.20.1`'s deployed
SHA, read from its record's header.

**The exit code was read directly, not through a pipe.** `0.20.1` recorded that
trap twice in one afternoon — a piped `release-prs.mjs` reported `tail`'s 0 and
hid a squash-merged PR, and a piped `gates.mjs` did the same. Every script in
this plan was run with its output redirected to a file and `$?` read from the
script itself.

#439 and #441 share a branch (`claude/place-capacity-thai-names`): #441 is the
sign-off-only PR carrying that feature's manual signature, which is why nineteen
plans cover twenty PRs.

### Ten of the nineteen plans are unsigned, and one of them is not like the others

Nineteen plans, all read. **Eight are `n/a`** with a reason — `community-dogs-design`
(a document), `deceased-heic-profile`, `dependabot-264`, `next-og-warning-durable`,
`order-and-units-schema`, `policy-cells-0158`, `public-views-overnight` and
`resident-view-grants-0160` (no UI surface, scripts, grants or policy only).
**One is signed:** `place-capacity-thai-names`, by Lutan on 2026-10-07.
**Ten say `pending:`.**

Put to him before the cut together with the major/minor question, in one round.
What was named explicitly rather than folded into the count: **`csp-enforce`
(#431) switches the browser content security policy from report-only to
enforcing.** That is the one change in this release that can break things
*silently* — a blocked resource shows up as a missing photo, a dead map embed, a
camera that will not open or a visitor counter that stays grey, with no error
anyone sees. Its own plan leaves five items for a person, four of which need a
signed-in account.

**He chose: deploy to test first, Claude verifies what it can there without an
account, Lutan does the signed-in pass, then production.** That is a change from
`0.20.1`, where he chose to ship and record the gap, and it is specifically
because of the CSP change. The apply plan in §8 is written around it.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` at `dd682a12` minutes before the cut, so there was nothing to merge in. `0` behind, confirmed by `git status -sb`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```

=== gates: build exited 0 after 255s

gates: typecheck=0 lint=0 build=0
```

- [x] **The gates were run on the final tree** — the entry has not been touched since. The procedure says to re-run on any change to the entry *even a role tag*, because the tempting assumption is that a data-only edit cannot break a build; there was no such edit after the run
- [x] **Every exit code in this plan was read from the script, not from a pipe** — `gates.mjs`, `release-prs.mjs`, `check-release-guards.mjs` and `check-test-plan.mjs` were each redirected to a file with `$?` read directly. This is `0.20.1`'s lesson applied rather than re-learned
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error` and that a red `audit` has never been the cause of a failed run
- [x] Newest release version matches `package.json` — both `0.21.0`, read back from the parsed register rather than from the diff
- [x] `unreleased` is empty — emptied by this PR; it held exactly 6 entries and the cut script asserted the count, the indentation and that no blank line sat inside the block before writing
- [x] **`majorReleasesSince("0.20.1")` returns `["0.21.0"]`** — the call that decides whether admins are mailed, and the one gate here that must not be taken on trust. It is **not** empty, which is the opposite of `0.20.1` and is what the major decision means in practice
- [x] **The date was read from the local clock** — `2026-10-08`, a new day, so this release starts its own record file rather than appending to 2026-10-07's
- [x] The register parses the way `deploy.mjs` loads it — `0.21.0` / `2026-10-08` / `major: true` / 6 notes, imported under Node's type stripping
- [x] Order intact — `0.21.0 > 0.20.1 > 0.20.0`, every adjacent pair across all **34** entries still strictly descending by `compareVersions`
- [x] **The cut was verified against the pre-cut register through the parsed module** — compared as a **set**, because the order was changed on purpose: `text lost 0`, `invented 0`, `carried across unchanged: 6 of 6`
- [x] **The reorder is exactly the permutation intended** — `got [5,4,1,0,2,3], intended [5,4,1,0,2,3]`, with every source note used exactly once and no `-1` (an unmatched note). A set comparison alone would pass on a wrong order; this is the assertion that makes the mailed sequence a checked fact
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **Every previously released entry is byte-identical** — all **33**, compared as serialised JSON against `origin/main`'s register
- [x] **The notes render clean** — `0 problem(s)` across every entry in the file, not just the new one: no `[object Object]`, no `undefined`, no empty title, every role array a non-empty list of strings
- [x] **Lines were moved, never retyped** — spliced as raw strings with only leading indentation changed, asserted by comparing `trimStart()` on each line before and after the re-indent
- [x] **CRLF preserved** — `src/lib/releases.ts` has CRLF terminators and the script detected and reused them, so the diff is 8 removed and 16 added lines rather than the whole file
- [x] `node scripts/check-release-guards.mjs` — all 15 ok, exit 0 read directly

Sixteen assertions from one script that exits non-zero if any fails, printed
together rather than reasoned about one at a time. It also prints the mailed
order as an admin will read it, which is the artifact this cut is really
producing.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed before applying — **2 pending: `0160_view_write_grants.sql`, `0161_place_and_stock_order_and_unit_prices.sql`**; 159 applied, and `0` applied that `origin/main` lacks
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — §8
- [x] Applied to **dev** and recorded in `schema_migrations` — by the schema PRs on the day. Dev holds all 161
- [x] File is re-runnable — read rather than assumed: `0160` is a bare `revoke`, which its own header notes is idempotent; `0161` uses `create or replace` throughout and `if not exists` on its added columns
- [x] Existing rows still read correctly after the change — **checked, because one of these two does narrow.** See below
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; both schema PRs carry their own §3 harnesses, and `0161`'s is `scripts/check-order-and-units.mjs`
- [x] Down-migration written, or the reason one is not needed is stated — not needed; see the rollback note in §8
- [x] Production apply plan stated for the release manager — §8

### Why `0160`'s revoke is safe, which is not obvious from its name

`0160_view_write_grants` **revokes** `insert, update, delete, truncate,
references, trigger` on six internal views, so on its face it narrows. It does
not narrow anything reachable:

- **`select` is untouched** — the header says so and the file does only the one `revoke`, which does not name `select`
- the views were **already inert**: five of the six are joins or aggregates with no `INSTEAD OF` trigger, so a write against them already failed with `55000` (or `42809` for truncate) for every role. The grants existed because the project's default privileges handed `authenticated` everything on every view, not because anything used them
- `anon` already held nothing (0081); the revoke names it anyway so a rebuild cannot differ
- no policy is created or changed

So it removes a privilege that could not be exercised. Both migrations are
`-- consumer: none`, so **no app code in this release reads either of them** —
which means, unlike `0.20.0`, there is no apply-before-deploy coupling at all and
no window of any kind. `0161` is new nullable columns, a widened `numeric(12,4)`,
and two stocktake views that gain a trailing column; its `revoke all` on those
two views is immediately followed by `grant select … to authenticated,
service_role`, read rather than assumed.

### `0158` and `0159` are already on production, and that was deliberate

Production reads `159 applied` rather than the 157 `0.20.1` left behind.
`0159_place_capacity_and_names_th` was a **production data update Lutan asked for
directly in chat** ("Data updates to Production", items 1 and 2) — occupied
enclosures' capacity set to their current resident count, and Thai names for
every zone and enclosure — exercised against real production rows in a
`begin … rollback` harness and **signed by him on 2026-10-07**. `0158` is the
policy fix for the enum-pattern policy `0157` introduced, which `0.20.1` shipped.
Both are on `main` and in this release's range; they simply reached production
early. Checked rather than assumed, because a production row count that does not
match the last release's record is exactly the sort of thing that should be
explained before a deploy rather than after.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour; the register is read by `/releases`, `deploy.mjs` and the Worker, all three exercised by §2's parse and by the build
- [ ] Data persists — n/a: no runtime data; the change is source
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no new surface. An empty `unreleased` is the normal post-cut state and is what `check-release-guards.mjs` asserts the deploy requires
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input. The one boundary here is the version comparison, covered in §2 across all 34 entries

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all 6 notes; **also receives the release email** | n/a — not run; see below |
| management | `/releases` | all 6 notes, no email | n/a — not run; see below |
| staff | `/releases` | all 6 notes, no email | n/a — not run; see below |
| vet | `/releases` | all 6 notes, no email | n/a — not run; see below |
| volunteer | `/releases` | all 6 notes, no email | n/a — not run; see below |
| signed out | `/releases` | not reachable, as before this PR | n/a — not run; see below |

- [ ] Every role above tested — n/a: this PR changes no access rule and adds no route. `/releases` and its role filter shipped long ago and are untouched; all six notes are untagged, so every role sees all six, which §2 confirmed from the parsed register
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR. The release *contains* a large nav change (#448), which is that PR's own plan and is item 1 in **Left for manual verification**
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut is not a feature and has no manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated; the register is English, as all 33 previous entries are
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no page changed by this PR; the dev server was not started
- [ ] Network clean — n/a: no page changed by this PR

## 6. Regression

- [x] The pages nearest the change still work — the `build` gate renders the register's consumers; `/releases` is in the route list the build printed, and `deploy.mjs` and the Worker parse the same file, which §2 did explicitly under type stripping
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` is the shared file and it was exercised **by loading it**, not by reading it: imported as a module and every entry walked, plus the full `next build`. The weaker check would have been to read the diff and conclude the other 33 entries were fine; instead all 33 were compared as serialised JSON against `origin/main`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `dd682a12` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the two judgements here, major rather than minor and the note order, are recorded in §1 with their reasons, and both are release decisions rather than design ones
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All six were written by the PRs that made each change and are carried across unaltered, which §2 asserts as a set and as a permutation
- [x] Commit messages say why, not just what — the cut commit records the major decision, the case taken, the reorder with its reason, and the verification tally
- [x] **Claims were measured, not reasoned** — every number in §1 and §2 comes from a script that exits non-zero on failure. The two claims in §3 that are prose-shaped were checked the same way: "`0160` does not narrow anything reachable" by reading the file for what the revoke names and does not name, and "`0158`/`0159` were deliberate" by finding the signed plan that requested them, rather than by assuming a production count that disagreed with the last record was benign

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **Both Pi builds will be pinned with `--ref <release sha>`** rather than left to fetch `main`'s tip, which is how `0.19.3` ended with four artifacts on two SHAs

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager. **Test goes first and is held**, which is this release's whole shape; see the apply plan
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, **and this is where the CSP check happens**. Without an account Claude can still confirm the header is enforcing and read the browser console on the public pages; the four signed-in items are Lutan's and are listed below
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The entry's `date` is a literal read from the local clock at cut time, asserted in §2
- [ ] **Boundary or banding change** — n/a: no threshold, rounding rule or cutoff in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Worth more than usual this release:** an enforced CSP that blocks something on a public page would be cached, and `curl` cannot see it

### Deploy safety

- [ ] **The working tree is clean before deploying** — deferred: release manager. `0.19.1`'s deploy was refused for untracked spreadsheets in the repo root
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**; the log is UTF-16, so `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — deferred: release manager; `deploy-pi.sh` checks this itself
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new in this release
- [ ] **The deploy prints a release mail, and the mail arrives** — deferred: release manager. **This flips back on after `0.20.1` sent none.** It should print `release mail for 0.21.0: sent N, skipped M`, and `sent` is the relay accepting it, not delivery — the inbox is checked for the message from `releases@lannacare.org` with `0.21.0` in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED`, a known open question. Only the **production** deploy mails; test sets `RELEASE_MAIL_ENV` to `""`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, and **for the release the answer is also no**, which is unusual and worth stating: `0160` and `0161` are both `-- consumer: none`, so no code in this release reads either. There is no apply-before-deploy coupling and no window of the kind `0.20.0` had
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, immediately before the apply. The `--status` was read at cut time (§3)
- [ ] For a **destructive or rewriting** migration only — n/a: `0160` revokes privileges that could not be exercised and `0161` adds nullable columns and widens a numeric; no data is destroyed or rewritten. `0161`'s `update` statements backfill the new `sort_order` columns only
- [x] Apply plan stated — **merge, pull, apply, test, hold, production:**
  1. merge this PR;
  2. **pull the main checkout and confirm `git status -sb` says neither ahead nor behind** — `0.20.0` applied five migrations and had its deploy refused because the merges had happened on GitHub while the local `main` sat six commits behind;
  3. `apply-migrations.mjs --env production --dry-run`, then apply `0160` and `0161`. Safe at any point, since nothing reads them;
  4. deploy **test** — Worker, then the Pi test clone pinned with `--ref`;
  5. **hold.** Claude checks the CSP header is enforcing and reads the browser console on the public pages; Lutan does the four signed-in checks;
  6. only then the production Worker deploy — **Lutan's one job** — with the Pi production build started in the same breath, not after it;
  7. `--drift production` and `--drift dev` afterwards, both quoted in the record.

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 50631c85`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0160` or `0161`**, and neither needs to: `0161` is additive, and `0160` removed a privilege nothing could use, so `0.20.1` code runs against both exactly as it does today. **What cannot be undone is the mail** — this is a major release, so by the time a rollback is considered every admin has already been told what shipped. That is an argument for the test hold in step 5, not against the release

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `csp-enforce` (#431) moves the content security policy from report-only to enforcing, and a wrongly blocked resource fails **silently** — a missing photo, a dead map embed, a camera that will not open, a grey visitor counter. Nobody has checked it on a deployed build | **accepted with a gate, not absorbed.** Named to Lutan separately from the other nine unsigned plans, and it is the reason he chose the test-first shape in §8 rather than `0.20.1`'s ship-and-record. Four of its five items need an account and are Lutan's; the fifth is Claude's and happens on test |
| 2 | low | Production held `159` applied migrations where `0.20.1`'s record ended at `157`, which reads as drift | **not a defect** — `0158` and `0159` were applied to production deliberately on 2026-10-07, `0159` at Lutan's direct request as a production data update with a signed plan. Established before cutting rather than after deploying, and recorded in §3 so the release record does not have to rediscover it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The Shelter Operations menu**, which is the reason this release is mailed: that the eight pages are reachable as tiles, that staff and volunteers see the new entry, and that Website has moved to Management | `test.lannacare.org` after step 4 of §8's apply plan |
| 2 | **The four signed-in CSP checks**: a resident page with photos, the Google map embed on a contact page, the camera for resident photos and QR/microchip scan on a phone, and the Management dashboard visitor count | `test.lannacare.org`, signed in, console open |
| 3 | The `0.21.0` title and the order of the six notes — on `/releases` **and in the admin mail**, which cannot be taken back once sent | `src/lib/releases.ts`, the `0.21.0` entry |
| 4 | That the release mail actually arrived, not merely that the deploy said `sent N` | the inbox, for `releases@lannacare.org` with `0.21.0` in the subject |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items, all Lutan's, and all of them fall after this PR merges

Manual verification by: pending: the Shelter Operations menu and the four signed-in CSP checks on test, the `0.21.0` title and note order, and the arrival of the admin mail

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1, §3 and §8
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — all nineteen plans read; ten are unsigned, and the CSP change among them was put to Lutan on its own rather than inside the count, because it is the one that fails silently. He chose a test hold before production in place of `0.20.1`'s ship-and-record. The migrations are the mildest of the last four releases: both `-- consumer: none`, so there is no ordering window to manage at all
