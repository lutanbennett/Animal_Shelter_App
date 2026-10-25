# Feature test plan — cut release `0.40.2`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.2` — move the three `unreleased` notes into a new **non-mailing** entry and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-2` @ `C:\Development\Animal_Shelter_cut-release-0-40-2` (a **fresh** worktree; all ten leftovers were `HELD` by live sessions, so none was free to reuse under paperwork rule 2 — the same state as `0.40.1`) |
| Dev server | not started; the cut changes two data files and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-25 |
| Carries a migration? | no — `0257` and `0258` are already on `main` from #912 and #914, and are applied at step 5 of the release |
| Tested at SHA | `ac9f8ee6` |

**This release mails nobody.** `major: false`, so `worker/release-mail.mjs` sends nothing on the
production deploy. That was Lutan's call, asserted both ways in section 2.

**The release's one genuinely risky change is not in this PR.** `0257_card_grants.sql` rebuilds
every production role's `role_permissions` from its cards alone and **takes away anything that came
from no card**. It was put to Lutan separately from the mail question, in the same round, because it
is a change that breaks quietly — nobody gets an error, a button is simply no longer there. See
section 3.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three notes move from `unreleased` into a new `0.40.2` entry dated 2026-10-25, `major: false`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two. `git diff --stat` against the **merge-base** (not against a moved `origin/main`) reads `package.json | 2 +-` and `src/lib/releases.ts | 23 +++++++------`. No route, no Worker, no migration, no shared lib
- [x] Roles affected identified: admin / management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer — **tags carried, not revisited.** Notes 1 and 3 are tagged `admin, management`; note 2 is `admin` only. No untagged note, so no note is visible to every role. Signed-out is unaffected. `staff` is retired (`0173`) and is absent from all three carried tags
- [x] Anything explicitly **out of scope** written down — the cut is data only; the thirteen PRs in the range were verified by their own plans and this plan does not re-verify them. **Role tags were deliberately NOT revisited at the cut**: all three notes arrived tagged, and re-tagging here would contradict the character-identical carry-over asserted in section 2. A tag is the feature PR's call, made by whoever knew the audience (the `0.39.4` precedent)

### The three judgements, all Lutan's, all asked in one round

`docs/release-procedure.md` step 4 says to ask what the cut needs from him **in one round rather
than three**. Three things qualified on this release and all three went in a single question set.

**1. The mail — asked with the two words removed, as the runbook now requires.** Step 4's promoted
rule is *"Ask about the EMAIL, never about 'major or minor'"*, because on `0.40.1` the words fitted
two releases with opposite mail behaviour and a second question was needed to settle it. This cut
therefore never used them: he was asked only whether the release should email him, what the email
would contain (the three notes below), and that it cannot be unsent once the production deploy runs.
He was also told the fact `release-procedure.md:114` requires stating plainly — **a major release
currently mails ONE person**, because the shelter's own address is not on the production admin list.
He answered **no email**. `0.40.2`, `major: false`. **One round trip, and the trap did not bite.**

**2. The six `pending:` plans — ship as a stated gap, or hold.** `docs/test-plan-template.md`'s rule
is that nothing ships on a `pending:` unless the release manager puts it to him. He chose **ship,
with the gap recorded**, as he did on `0.40.1` and `0.15.0`. Listed in *Left for manual verification*.

**3. `0257`'s access rebuild — raised separately on purpose.** It is the one change in this release
that can fail silently, and it would not be visible to him in the release notes. His ruling of
2026-10-24 already authorises the loss (*"just apply what is required to each card, if someone loses
some access I will fix that later"*), so this was not re-litigating a settled decision — it was
telling him it happens on **this** release, and that he would get the per-role list of what was
gained and lost. He answered **go ahead**.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `e2578e65` minutes before the cut, so there was nothing to merge in. `git status -sb` showed no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — the block below is unedited, and **all four numbers were read**, not three
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

**Step 1's `npm ci` in the main checkout was run, exit 0.** It is the step whose omission nearly
shipped a mismatched build on `0.28.0`, and the main checkout is where both Worker builds are made.
The `0.28.0` tell was then read directly rather than trusted: `package.json` declares `next@16.4.2`
and the installed tree reads `16.4.2`. Both numbers compared, neither assumed from the other.

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 38s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 84s
=== gates: test — npm test
=== gates: test exited 0 after 16s
=== gates: build — npm run build
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-release-guards.mjs` — **16 of 16 `ok`, exit 0**, read from the command itself
rather than through a pipe.

**The cut was verified against `origin/main` note by note, not read over.** A lost or altered note is
the cut's one real failure mode and no gate in CI can see it. The assertion run imports both the
pre-cut module (`git show origin/main:src/lib/releases.ts`, written out and imported as its own
module) and the post-cut one, and compares them. Unedited output:

```
  ok   unreleased is now empty (was 3)
  ok   newest entry is 0.40.2 (got 0.40.2)
  ok   major is false (got false) - no mail
  ok   date is 2026-10-25 (got 2026-10-25)
  ok   package.json 0.40.2 === newest entry 0.40.2
  ok   note count carried: 3 of 3
  ok   note 1 text identical, character for character
  ok   note 1 roles identical ["admin","management"]
  ok   note 2 text identical, character for character
  ok   note 2 roles identical ["admin"]
  ok   note 3 text identical, character for character
  ok   note 3 roles identical ["admin","management"]
  ok   nothing invented: every note came from unreleased
  ok   all 66 previous entries still present, unchanged and in order
  ok   file order matches compareVersions (newest first)
  ok   notes render with no [object Object] and no undefined
  ok   majorReleasesSince("0.40.1") -> []  = no mail
  ok   control: majorReleasesSince("0.39.5") -> ["0.40.0"]  = the emptiness is a real answer

CUT VERIFICATION CLEAN
```

**The notes were lifted by script, not retyped.** The cut script slices the three note literals out
of the existing array and re-indents them, so there is no transcription path for a note to change on.
That is why "character for character" is a meaningful claim rather than a restatement of care.

**The mail check needed a control, and this is exactly the release where the absence check is
weakest.** `majorReleasesSince("0.40.1") → []` would also be satisfied by a function that always
returns nothing. So the same run asserts a **presence** from further back:
`majorReleasesSince("0.39.5") → ["0.40.0"]`. A broken or always-empty function cannot pass both
(`release-procedure.md`, *"An absence-check needs a presence-check beside it"*).

**One fault was found in the verification itself and it was the assertion that was wrong, not the
cut.** The first run reported `FAIL` on the presence control. `majorReleasesSince` returns `Release`
**objects**, not version strings, so the comparison against `["0.40.0"]` could never match. The
assertion was corrected to compare `.version` and the run went clean. Recorded because a release
manager who had trusted the first red would have gone looking for a fault in a correct cut — and one
who had shrugged it off would have shipped with the mail unasserted.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in **this PR**. `0257` and `0258` are on `main`; next free is `0259`, and `gh pr list` shows no open PR at all, let alone a `*-schema` one to contend with
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — reviewed for the release: production reads **`257 applied, 2 pending`** (`0257`, `0258`), and the drift comparison names exactly those two as on `origin/main` but not applied, with **0** applied rows having no file. Dev reads **`259 applied, 0 pending`**
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — **run against production, both `ok`, exit 0 read from the command itself**: `dry-run 0257_card_grants.sql … ok`, `dry-run 0258_diets_readers_per_serving.sql … ok`. **The per-file-transaction caveat was live and did not bite**: with two pending files, a red on `0258` for something `0257` provides would have meant "apply anyway", not "the file is wrong" (`0075`/`0076`, 2026-09-24). Neither depends on the other
- [x] Applied to **dev** and recorded in `schema_migrations` — yes, with #912 and #914. Dev reads **259 of 259**
- [x] File is re-runnable — both declare it. `0257` says so explicitly (*"create if not exists / or replace / on conflict do nothing. Applied once, the seed does not overwrite later edits"*) and `0258` is `or replace` view plus `drop not null`
- [x] Existing rows still read correctly after the change — asserted by their own plans (#912, #914), not re-derived here. **With one exception that is this plan's own work**: `0257` deliberately *changes* which rows exist in `role_permissions`, which is the subject of the box below
- [x] **Constraints and defaults exercised against real rows** — their own plans' work. **What this plan adds is the ordering read below and the production before-picture**, neither of which any single feature plan states in release terms
- [x] Down-migration written, or the reason one is not needed is stated — `0258` is additive-and-loosening (`drop not null`, an `or replace` view with *"same columns, same order, same grants"*), so nothing to revert. **`0257` needs this stating carefully: it adds two tables and triggers, all additive, but its recompute rewrites `role_permissions` rows.** It is not reversible by deleting the new tables, because the old cells came from no card and so cannot be recomputed. **The recovery path is not a down-migration, it is the loss list** — see below
- [x] Production apply plan stated for the release manager — **`0257` then `0258`, in number order, to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `257 applied, 2 pending` → expect `259 applied, 0 pending`, re-read afterwards with a named drift check on both databases

### `0257` takes access away on production, and that is the intent

`0257`'s own header states the fault it fixes and the cost it accepts. Quoting it rather than
paraphrasing, because the cost is the part a release manager must not soften:

> Every role is recomputed in this file, and a NOTICE per role lists what was added and what was
> removed (activity names only). Access that came from no card goes away. That is the ruling, and
> the list is the record of what to give back.

**The fault being fixed is live on production today.** A card's bundle lived only in `cards.ts`, and
`role_permissions` was recomputed only when someone saved a role on Who does what. Any other route
to granting a card — `0251` inserted straight into `role_cards` — granted no access at all. The
header names the production symptom: *"the Volunteer holds 3 cards and 3 of the 4 cells they need,
so My tasks does not work."* Dev covered every role, so it never reproduced there.

**The production before-picture was read, not assumed** — `node scripts/check-production.mjs
role-cards`, the read-only check #911 shipped and Lutan approved on 2026-10-24:

```
   doctor: administer_medication, record_weight, add_medical_photos, feed_special_diets, book_clinic_visits
   head_of_maintenance: do_maintenance, enclosures, view_residents, my_tasks
   head_of_medical: view_residents, enclosures, administer_medication, record_weight, add_medical_photos, feed_special_diets, my_tasks
   management: book_clinic_visits, record_weight, recurring_jobs, residents, do_purchasing, enclosures, contacts, donations_receipts, bills, approve_photos, run_appeals, meme_library, feed_special_diets, add_medical_photos, my_tasks
   second_in_command: residents, enclosures, do_stocktaking, do_purchasing, record_delivery, do_maintenance, record_weight, feed_special_diets, add_medical_photos, my_tasks
   staff: administer_medication, record_weight, add_medical_photos, feed_special_diets, do_maintenance, do_stocktaking, record_delivery, residents, medical_records, book_clinic_visits, assistant, enclosures
   volunteer: add_photos, enclosures, my_tasks
```

**Admin is not in that list and will not be touched.** `0257` skips the fixed roles, which is
correct and is the behaviour `CLAUDE.md` requires: Admin sits outside the card system, its access is
derived from nothing, and it holds no cards. A recompute that included Admin would lock the only
administrator out of the screen needed to put cards back.

**What the release manager owes him afterwards:** the apply prints a `NOTICE` per role naming what
was added and what was removed. That output is the record of what to give back, and it goes in the
release record verbatim. `docs/test-plans/cards-grants-schema.md` leaves exactly this as its one
outstanding item (*"After production apply: read the removed/added list from `audit_log`"*), and it
stays that plan's to close — this plan does not tick it.

### Ordering, measured rather than assumed

Both migrations have readers **shipping in this same release**, which is what makes "before the
deploy" mandatory rather than tidy. Checked by diffing each declared consumer across the release
range, file by file, not inferred from the headers:

| Migration | Declared consumer | Changed in `254cd948..HEAD`? |
|---|---|---|
| `0257` | `src/lib/permissions/cards.ts` | **yes** |
| `0257` | `src/app/admin/who-does-what/page.tsx` | **yes** |
| `0257` | `src/app/admin/who-does-what/actions.ts` | **yes** |
| `0257` | `scripts/check-card-grants.mjs` | **yes** |
| `0257` | `scripts/check-cards-schema.mjs` | **changed, then deleted — see below** |
| `0258` | `src/app/medical/diets/page.tsx` | **yes** |
| `0258` | `src/lib/diets/special-list.ts` | no — unchanged since `0.40.1` |

So: **apply both before either deploy.**

Two readings of that table worth writing down rather than leaving to be re-derived:

- **`scripts/check-cards-schema.mjs` no longer exists**, which is why the dry-run warned *"declared consumer scripts/check-cards-schema.mjs is not on origin/main at all"*. It was renamed to `check-card-grants.mjs` within the release. **A stale consumer header, not a missing reader** — confirmed by `git ls-tree -r HEAD` showing the old path gone and the new one present. Cosmetic; worth a one-line fix in a later PR, and **not** worth touching a migration file that is about to be applied.
- **`src/lib/diets/special-list.ts` is the runbook's *"predicted warning that does not appear"* case**, and it is the safe one: the file is unchanged since the live release, so its reader was already live when `0258` lands, and `0258`'s header states the view keeps *"same columns, same order, same grants"*. One `git diff` settled it. Over-predicting warnings is free; the point is that none surprised us.

All consumer warnings on this dry-run are in the **safe direction**, and the runner said so itself:
*"These tables/columns land before the code that reads them is live. That is the safe direction."*

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince`, `compareVersions`, `noteText` and `noteRoles` were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries all three notes with their role tags intact, and renders with no `[object Object]`
- [x] Data persists — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry, which is what `deploy.mjs` refuses to ship without. Asserted, and `check-release-guards.mjs` exercises that refusal in both directions
- [ ] Create / edit / delete all exercised — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty, and the one emptiness that matters, `unreleased`, is asserted empty in section 2
- [x] Invalid input is rejected with a readable message, not a crash — the cut script throws `no unreleased` and `no releases opener` **before writing a byte**. The second of those fired for real: the first version's anchor assumed `\n` and the file is CRLF, so it refused rather than writing a corrupted file. Same fault as `0.40.1`'s, same designed refusal, and it is how the guard is known to work rather than merely written
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **the mail boundary is the one that matters, and on a non-mailing release it was checked in both directions** (absence plus a presence control, section 2). The version boundary too: `0.40.1 → 0.40.2` is a clean last-number bump with the middle number held, and the file is still descending by `compareVersions` across all 67 entries. All three notes carry a `roles` key, so the missing-optional-field path is not exercised by this cut and is not claimed to be

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`)
and is asserted absent from all three carried tags.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all three notes | asserted from the data: notes 1 and 3 tag `admin, management`, note 2 tags `admin` |
| management | `/releases` | notes 1 and 3 | asserted: both tag `management`; note 2 is `admin` only |
| second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer | `/releases` | no notes | asserted: no note is untagged, and none of these roles is tagged. **A real consequence worth stating: `0.40.2` is invisible on `/releases` to five of the seven roles** — correctly, because all three changes are Admin settings screens and an audit log |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |
| every admin on the production list | **email** | nothing | **asserted, not deferred**: `major: false` and `majorReleasesSince("0.40.1")` empty, with a presence control proving the function still works |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself, which changes no page, route or permission. Note visibility is asserted from the data via the carried `roles` tags. **The roles whose access this release actually changes are changed by `0257`, not by this PR**, and that is covered in section 3 and in *Left for manual verification*
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission in this PR. **And a caution against reading this line too comfortably on this release**: `0257` changes server-side access for five roles. It does so by narrowing to what the cards grant, which is the direction that cannot over-grant, and its own plan (#912) carries that check

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by the cut
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched by the cut; the feature PRs carried their own manual changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is. **Two PRs in this release leave their Thai wording `pending:` a person**, listed in *Left for manual verification* and in the release record, not fixed here
- [ ] Mobile viewport (375px) — n/a: no UI changed; `/releases` renders the same component
- [ ] Browser console clean — n/a: no page was driven for the cut itself
- [ ] Network clean — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only consumer, and the risk is data rather than rendering: **all 66 prior entries** were asserted present, unchanged and in `compareVersions` order against `origin/main`'s copy. The `build` gate compiles the file
- [ ] Any shared file touched checked from a second, unrelated page — n/a: none touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions exercise. `worker/release-mail.mjs` is a fourth reader, and on this release its correct behaviour is to send nothing — asserted directly via `majorReleasesSince`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item. **The backlog was folded in at step 1**, not skipped: `main..origin/backlog` held two commits (both about retiring the 2-step refusal for admins), they were merged into `main`, `check-backlog-sections.mjs` passed with `77 open items, all above ## Completed`, and `backlog` was fast-forwarded back to `main`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious was decided *by the cut*. The three calls were Lutan's and are recorded in section 1, in the cut commit and in the release record
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot tick this line, because the checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The notes users will read are in this PR, in `releases` rather than `unreleased`
- [x] Commit messages say why, not just what — the cut commit records whose call the mail decision was, that the words "major" and "minor" were deliberately kept out of the question, that the notes were lifted by script rather than retyped, and the absence-plus-presence mail assertion
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run. **And three things this release manager could have reasoned were measured instead**: the production role-cards picture was read with `check-production.mjs` rather than inferred from `0257` being about to apply; every declared consumer was diffed across the range rather than taken from the migration headers (which found one stale path); and `no-hard-coded-security`'s `pending:` item was closed by reading #913's actual check run rather than assuming a merged PR's CI was green

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `ac9f8ee6`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **The standing rule that replaced SHA-equality applies** (`release-procedure.md`, *"Check the code is identical, not that the SHAs match"*, Lutan 2026-10-24): what is asserted is `git diff --name-only <a>..<b> | grep -vE '^(docs/|\.claude/)'` empty for each pair of SHAs the release builds from, however many there are. **Expect more than one pair** — `0.40.1` saw only one because other sessions happened to be quiet, and ten sessions are live in their worktrees right now
- [x] **Every PR in this release has a completed test plan** — the release-time confirmation `CLAUDE.md` requires, because `test-plan` is advisory and a PR can reach `main` unchecked. The list is **`node scripts/release-prs.mjs 254cd948 HEAD`** — **13 PRs**: #908, #909, #910, #911, #912, #913, #914, #915, #916, #917, #918, **#919**, #920. All thirteen carry a plan and **none is red**: #910, #913, #916, #917, #918, #920 and the three paperwork PRs `pass`; #909, #911, #912, #915, #919 `pass with accepted defects`. **Six are `pending:` a person**; a seventh was `pending:` and is **closed by measurement** (below). The six are listed in *Left for manual verification*, not copied from their plans as closed

**`release-prs.mjs` exited 1, and the reason is the same benign one as last release.** It listed 12
PRs and named `docs/test-plans/planner-handover-348.md` as belonging to none of them. That file came
in with `8c4e39eb`, and `gh pr view 919` reports **#919 MERGED with `mergeCommit` `8c4e39eb` itself**
— i.e. **squash-merged**, so no merge commit carries its number for `--first-parent` to find. This is
the case the runbook names (`0.21.0`), and it is now the second consecutive release to hit it.
**The release is 13 PRs, not 12**, and #919 is added by hand as the runbook instructs.

**The exit code was read from the command, not through a pipe** — `… > <file> 2>&1; echo "exit: $?"`
— which is the trap that cost `0.40.1` a near-miss on this very command.

### On the deployed build

- [ ] Deployed to test: `node scripts/deploy.mjs --env test` — deferred: release manager. **Checked what is on test first, as the runbook requires**: test reads `0.40.1` @ `254cd948`, the same version and SHA production serves, so it is not a deliberate integration build that exists nowhere else
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in **this PR** derives "today"; the entry's date is the literal string `2026-10-25` and `compareVersions` reads no clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band, threshold or rounding rule in this PR. The two boundaries that do exist — the mail decision and the version bump — were each checked both ways anyway (sections 2 and 4)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block, the guard count, the assertion block, the dry-run lines, the `role-cards` output and the consumer measurement are verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **This release is the one where that check stops being vacuous, and it needs reading carefully.** `PUBLIC_SITE` was `locked` as of `0.40.1`, which made it so; **re-read it rather than assuming it still is**, because note 1 ships a switch that hides public pages and note 1 itself warns changes *"can take up to ten minutes to show for visitors"*. If the site is unlocked, the purge step and this check both matter more than they did last release

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager (`dbkodyyxxhtygxcxmfcu`; grep the project ref, not the arrow, and read the production log after `tr -d '\000'`, since PowerShell's `tee` writes UTF-16)
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager (expected **14**, the baseline confirmed on both environments for four consecutive releases; a different number means the deploy's env changed, and the log's own list is what to read)
- [x] **The release mail must NOT go out** — asserted rather than deferred, which is the one inversion this plan makes to the template. On a mailing release this line is the release manager's to confirm in an inbox; on a non-mailing one the whole claim is in the data, and it is proved in section 2 both ways. **Both deploys are expected to print `no major release new to <env> (was 0.40.1), so no email.`**, and anything else is a defect to stop on, not a surprise to absorb
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none, and neither does the release. **`CLOUDFLARE_PURGE_TOKEN` is not new** but is needed by the post-Pi purge step; it expires 2027-12-31 and the purge script refuses by name if it is missing
- [x] `.local/` exists in the main checkout and is gitignored, so the deploy log handed over can be written and cannot dirty the tree — **confirmed rather than assumed**: `ls -d .local` succeeds and `git check-ignore -v .local/deploy-0.40.2.log` names `.gitignore:59`. `git status --porcelain` in the main checkout is empty, so the untracked-file state that refused his deploy on `0.38.2` is not present

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, this PR contains neither. But the **release** does, and for **both** migrations: every declared consumer except one ships in this release, measured file by file in section 3. So **both migrations first, then both deploys**
- [x] `--env production --dry-run` run and clean — **run, both `ok`, exit 0 read from the command itself.** Two pending files, so the per-file-transaction caveat was live and is recorded in section 3 as having not bitten
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **and this is the one release where that gate must not be waved through.** `0258` is additive-and-loosening and does not engage it. **`0257` does**: it is additive in *schema* but it **rewrites `role_permissions`**, deleting cells that came from no card. Said plainly because `0.39.4`'s lesson was that additive in the database is not the same as harmless. Three things make it acceptable rather than reckless, and all three were established rather than assumed: the deletion is **what Lutan ruled should happen** and he confirmed it again for this release; the migration **prints the full add/remove list per role**, which is a better recovery record than a backup restore would be, since the cells are re-grantable from Settings → Who does what in minutes; and **Admin is skipped**, so the screen needed to put anything back cannot be lost. **The README restore recipe has still never been exercised** — that remains true and is not claimed otherwise
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0257` then `0258`, to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `257 applied, 2 pending` → expect `259 applied, 0 pending`, re-read afterwards with a named drift check on **both** databases. **Capture the per-role `NOTICE` output from the `0257` apply** — it is the record of what to give back and it goes in the release record verbatim

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref 254cd948` on each Pi returns the served app to `0.40.1`, and `npx wrangler rollback --env production` returns only the Worker fallback, also to `0.40.1`. **Neither reverts `0257` or `0258`.** `0258` is inert under `0.40.1`'s code and safe to leave. **`0257` is the asymmetry that matters on this release and it is not a comfortable one**: its triggers keep `role_permissions` as the union of the role's cards whatever code is deployed, so a code rollback does **not** restore the cells it removed. Putting one back is a Settings → Who does what action, from the printed list — which is the recovery path Lutan accepted when he ruled *"if someone loses some access I will fix that later"*. **There is no mail to roll back on this release**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The cut script's first version assumed `\n` against a CRLF file** and refused with `no releases opener` | **fixed before anything was written.** It refused rather than corrupting the file, which is the designed behaviour, and the fix made it line-ending-aware. `package.json` was then bumped with a targeted one-line replacement rather than a JSON rewrite, so its endings and key order survive — confirmed by a single-line diff. **This is the second consecutive release to hit this**, which suggests the cut script belongs in `scripts/` rather than being rewritten from scratch each release; filed as a follow-up on the backlog branch, not fixed mid-release |
| 2 | low | **The cut verification's own presence control was wrong and reported a red on a correct cut** — it compared `majorReleasesSince(...)` against `["0.40.0"]` when the function returns `Release` objects | **fixed, and worth recording rather than quietly corrected.** A release manager who trusted the red would have hunted a fault in a sound cut; one who shrugged it off would have shipped with the mail unasserted. The assertion now compares `.version` and both directions pass |
| 3 | low | **`release-prs.mjs` exits 1 on this range**, naming `docs/test-plans/planner-handover-348.md` as orphaned | **explained, not worked around.** #919 was squash-merged, so its number is on no merge commit. The release is **13 PRs**; #919 added by hand per the runbook. **Second consecutive release with this exact shape** (`0.40.1` had #905), which is now a pattern rather than a one-off: the planner handover PR is the one that keeps getting squash-merged |
| 4 | low | **`0257`'s `-- consumer:` header names `scripts/check-cards-schema.mjs`, which no longer exists** — the dry-run warned *"not on origin/main at all"* | **explained and left alone, deliberately.** The script was renamed to `check-card-grants.mjs` inside this release; `git ls-tree -r HEAD` confirms the old path gone and the new one present. So it is a stale header, not a missing reader. **Not fixed here**: editing a migration file in the hour before applying it to production, to correct a comment, is the wrong trade. A one-line follow-up on the backlog branch |
| 5 | low | **`no-hard-coded-security`'s plan was signed `pending:`** on whether the new `hard-coded-security` CI job — a check nobody had seen green — passed on its own PR | **closed by measurement.** `gh pr checks 913` reports `hard-coded-security  pass  9s`. The obvious inference, that a merged PR's checks must have been green, is not sound here: `audit` is red on that same run and the job is new, so it was read rather than assumed. **This is why the release ships with six `pending:` items and not seven** |
| 6 | low | **Ten worktrees are `HELD` by live sessions and all read `nothing beyond main`** — every one a merged stream whose session is still open | **not acted on, correctly.** `HELD` means ask, do not tear down (`CLAUDE.md`), and a release is the wrong moment. It is why this cut needed a fresh worktree instead of reusing a free leftover under paperwork rule 2 — **the second consecutive release to pay a four-minute `npm ci` for this**. Worth a `/clean-streams` round after the release |

## Left for manual verification

| # | What to check | Where | Whose plan |
|---|---|---|---|
| 1 | Give and take one card on a spare role as Admin with the authenticator app; confirm the role's access changes and Recent changes shows the cell changes | `/admin/who-does-what` | #915 `cards-grants-app` |
| 2 | Open a held card whose page the role cannot open, and read the warning: it names the page and the fixed rule | `/admin/who-does-what?card=<card>` | #915 `cards-grants-app` |
| 3 | **After the production apply**: read the removed/added list and decide which cards to give back | the `0257` apply output, in the release record | #912 `cards-grants-schema` |
| 4 | In Admin → Diets, change a recipe line's amount, add a line, remove a line, change a diet's servings; confirm the feeding sheet and forecast show the right figures | `/admin/diets` | #918 `diets-stop-writing-old-columns` |
| 5 | Hide then show a public page in Settings → Website, then see both on Recent changes | `/admin/recent-changes` | #918 `diets-stop-writing-old-columns` |
| 6 | The Pages on the website panel at phone width, and its Thai wording | Settings → Website → Pages, on the Director's phone, in Thai | #916 `website-page-visibility-app` |
| 7 | The header menu, phone menu, footer and home page look as they did | the public site, desktop and phone width | #910 `website-page-list` |
| 8 | Whether each fault-log row is live on production | `node scripts/check-production.mjs role-cards` — **answerable once `0257` is applied**, and the before-picture is already in section 3 | #920 `remove-hidden-security-invisible-failures` |
| 9 | A signed-out visitor still lands on `/login` and the public site | a private window on the test site | #920 `remove-hidden-security-invisible-failures` |

**All nine rows belong to six PRs' plans and are shipping as a stated gap on Lutan's explicit
decision this release** — asked before the cut, with the alternative of holding the release until he
had looked. `docs/test-plan-template.md`'s rule is that nothing ships on a `pending:` unless the
release manager puts it to him; that is what happened, and his answer was to ship and look
afterwards. The precedents are `0.40.1` and `0.15.0`.

**They are listed here rather than left only in their own plans because they are the release's
pre-deploy gate**, and section 8 requires the release manager to name what is open before the
deploy. They remain their own plans' to close; **nothing is ticked in those plans by this one**, and
no row here is copied back into them.

**Rows 3 and 8 become answerable during this release** rather than needing a person at a screen —
row 3 from the `0257` apply output, row 8 from a read-only check that only needed `0257` applied.
Both are the release manager's to produce and both go in the record.

**The seventh `pending:` in this release is NOT listed here, because it is closed** — `no-hard-coded-security`'s
question about its own new CI job, answered by reading #913's checks (*Defects found* 5). An item
that has been answered does not belong on a manual list; leaving it there is how a closed question
goes on being re-asked (`CLAUDE.md`, the `assistant-retention` fault).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is **not** empty, and that is deliberate: its nine rows are the release's open `pending:` items, named here as section 8's pre-deploy gate requires. None is a check of **the cut**, which changes two data files, no page, no route and no permission. **Nothing is signed on anyone's behalf**: all nine belong to their own PRs' plans, they are shipping as a gap on Lutan's explicit decision, and this line does not claim any was looked at

Manual verification by: n/a: the cut itself changes two data files and no page, so there is nothing for a person to look at. The nine rows listed above belong to #910, #912, #915, #916, #918 and #920 and are shipping as a stated gap on Lutan's explicit decision; they are not signed here

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-25
