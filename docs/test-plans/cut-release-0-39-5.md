# Feature test plan — cut release `0.39.5`

## Header

| | |
|---|---|
| Feature | Cut release `0.39.5` — publish the withheld release note for #882 as a new patch entry, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none; cutting a release is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-39-5` @ `C:\Development\Animal_Shelter_cut-release-0-39-5` (a **fresh** worktree, not a reused leftover — see section 2) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not started; the cut changes no page) |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no — `0251` is already on `main` from PR #881 and is applied at step 5 of the release |
| Tested at SHA | `07f4e03d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one note is published as a new `0.39.5` entry dated 2026-10-23, `major: false`, and `package.json` follows; no backlog item, this is the release procedure's own step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two: `src/lib/releases.ts` and `package.json`. `git diff --numstat` reads `1 1 package.json` and `9 0 src/lib/releases.ts`. No route, no Worker, no migration, no shared lib
- [x] Roles affected identified: admin / management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer — the one note is an **untagged plain string**, so every signed-in role sees it. Signed-out is unaffected. `staff` is retired (`0173`) and is deliberately not listed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the cut is data only. The feature itself merged as #881 (schema) and #882 (app) and was verified by their own plans; this plan does not re-verify them. What this plan *does* carry that a normal cut does not is the **note's own truthfulness**, because the note was deliberately withheld by #882 and is published here — section 7

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `3b402218` minutes before the cut, so there was nothing to merge in. `git status -sb` showed no divergence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — see the block below, unedited
- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

**A fresh worktree was created rather than reusing a free leftover**, against paperwork rule 2's default, and deliberately: the last release recorded that reusing a leftover saved nothing because it was 71 commits behind a `next` bump and carried `next` 16.3.8 against a `package.json` saying 16.4.2. The fresh `npm ci` cost about three minutes and the asymmetry check was run anyway rather than trusted — `require('next/package.json').version` reads **16.4.2** against `package.json`'s **16.4.2**.

Unedited, as printed. Note there are **four** gates, not three — a `test` gate runs between lint and build:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 125s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 138s
gates: typecheck=0 lint=0 test=0 build=0
```

`node scripts/check-release-guards.mjs` — **16 of 16 `ok`, exit 0**, read via `PIPESTATUS[0]` rather than the pipe's status, because the handover records `| tail` reporting `tail`'s exit code and hiding a real one. The guard that matters most to this cut is the first line, `ok   a cut release with nothing unreleased passes`.

The assertion run on the cut itself, also unedited. It imports both the pre-cut module (`git show origin/main:src/lib/releases.ts`, written to a temp file and imported as its own module) and the post-cut one and compares them, rather than reading the diff over:

```
1. unreleased is empty
  ok   0 notes
2. the new entry is at the top, once
  ok   releases[0] is 0.39.5
  ok   appears once
3. every previously released note carried across unchanged
  ok   all 63 prior entries byte-identical
4. nothing invented: the new entry's notes equal origin/main's unreleased, plus any deliberate additions
     origin/main unreleased: 0 note(s); new entry: 1 note(s)
5. majorReleasesSince(PREV) returns exactly the new version set
     -> []
  ok   minor release, mails nobody
6. package.json equals the newest entry
  ok   package.json 0.39.5
7. file order still matches compareVersions (newest first)
  ok   all 64 entries descending
8. every note renders as text, no [object Object]/undefined
  ok   343 notes render as non-empty strings
9. the new note's roles (if any) are live roles
  ok   plain note: everyone sees it

CUT VERIFY PASSED

The mail boundary, run separately as a control so the empty result is not vacuous:
  majorReleasesSince("0.39.4") -> []
  control majorReleasesSince("0.38.2") -> ["0.39.0"]
```

**One assertion failed on its first run and it was the verifier's fault, not the cut's** — written down because a release manager who sees a red run needs to know which way it was resolved. A scan for the literal words `undefined` / `null` anywhere in a note's text flagged `0.33.0`, whose note legitimately *quotes* a date that used to read `"NaN undefined NaN"`. The scan was narrowed to the **new** entry only; prior entries are already proven byte-identical by assertion 3, so scanning their prose added nothing but a false positive. The cut was never touched. **A failing assertion is a claim about the verifier or the thing verified, and establishing which comes before changing either.**

**The cheapest independent proof that no note was lost is the diff itself: `9 0` on `releases.ts` — nine insertions, zero deletions.** A cut that altered or dropped an existing note could not have a zero in that column.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. `0251` is on `main` from #881; next free number is `0252`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — **reviewed for the release, not for this PR**: production read `251 applied, 1 pending` (`0251`), dev read `252 applied, 0 pending`, `No drift` both ways
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0251_seed_cards_for_removed_automatic_tiles.sql … ok` against production. The `-- consumer:` warning appeared exactly as predicted and **in the safe direction**: the declared consumer `src/lib/home/tiles.ts` differs from live `0.39.4`, so the rows land under code that is not yet live
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — yes, with #881; dev reads 252 of 252 with no drift
- [x] File is re-runnable — `on conflict (role_id, card) do nothing`
- [x] Existing rows still read correctly after the change — #881's plan ran `check-home-cards.mjs` before and after on dev: every role's `role_permissions` hash identical, 0 `FAIL` lines. `0251` touches `role_cards` only and does not write `role_permissions`, so it **grants nothing new**
- [x] **Constraints and defaults exercised against real rows** — and this is where this plan does work #881's did not. #881 stated the production apply plan as *"roles are matched by key so a missing role is skipped"*, which covers a role that is **absent** but not a role that **exists and is skipped**. `0251` joins `roles r on r.key = … and r.kind <> 'fixed' and r.archived_at is null`, so a role that existed on production as `kind = 'fixed'` would be silently skipped and would **lose its tiles** once #882's code went live. Established rather than assumed, by reading the schema: `0132_permission_tables.sql:91` carries the CHECK constraint `roles_fixed_iff_reserved`, `(kind = 'fixed') = (key in ('admin', 'public_viewer'))`. `fixed` is therefore **impossible** for any other key, enforced by the database on production as much as on dev, and none of `0251`'s five keys is `admin` or `public_viewer`. All five exist on production by applied migration rather than by hand — `management` and `volunteer` seeded by `0132`, `head_of_medical` by `0136`, `head_of_maintenance` by `0141`, `second_in_command` by `0143`, all long applied. The one remaining skip condition is `archived_at is null`, and a role that has been archived is one nobody is signing in as, so its missing tile harms nobody
- [x] Down-migration written, or the reason one is not needed is stated — the file header states how to revert (delete the listed card/role pairs). Not needed for this release
- [x] Production apply plan stated for the release manager (which file, which project, when) — **`0251` to `dbkodyyxxhtygxcxmfcu`, before any deploy**, because #882's code reads the rows it seeds and the decision file says so explicitly: *"that migration must be on production before this code is deployed, or the roles lose those tiles until it is"*. `251 applied, 1 pending` → expect `252 applied, 0 pending`, re-read afterwards

## 4. Functional checks

- [x] Happy path works end to end — `majorReleasesSince`, `noteText`, `noteRoles` and `compareVersions` were exercised against the edited file by importing the **real exported** module, not a copy: the new entry parses, carries its note, and renders with no `[object Object]`
- [x] Data persists — reload the page and the change is still there — the standing-in assertion for a source file is that `package.json`'s version equals the newest entry's version, which is what `deploy.mjs` refuses to ship without. Asserted and passing, and `check-release-guards.mjs` exercises that refusal in both directions
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a release entry is only ever created; the register has no edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `releases` is never empty. The one emptiness that matters — `unreleased` — is asserted empty above, **and was already empty before the cut**, which is this cut's unusual shape and is explained in section 7
- [x] Invalid input is rejected with a readable message, not a crash — the cut script refuses rather than half-writing. It was proved by *being refused*: the first run died with `anchor not found` because the script assumed LF and `releases.ts` is CRLF, so **nothing was written** and `grep -c 0.39.5` still read `0`. The script was made line-ending aware and re-run. Its `unreleased` guard throws before writing a byte if `unreleased` is not empty, so a second run against an already-cut file cannot produce a duplicate empty entry
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the version boundary is the one that matters, and it was checked **both ways**: `majorReleasesSince("0.39.4")` returns `[]`, so no mail; the control `majorReleasesSince("0.38.2")` still returns `0.39.0`, so a function that always returned `[]` could not have passed both. An absence-check alone would have been vacuous. Missing optional fields are covered too: the new note has no `roles` key, so `noteRoles` returns `undefined` for it, which is exactly what makes it visible to every role

### Role access matrix

Roles read from the live list rather than re-derived: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer. `staff` is retired (`0173`), and the template's row for it is left out deliberately.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every signed-in role | `/releases` | the `0.39.5` note | asserted from the data: the note is an untagged plain string, so `noteRoles` is `undefined` and it is never filtered out |
| signed out | `/releases` | unchanged by this PR | unchanged — the cut adds no page and no permission |

- [ ] Every role above tested — n/a: no role was signed in for the cut itself. The cut changes no page, no route and no permission, so there is nothing a role could see differently beyond the note list, which is asserted from the data instead via `noteRoles`. **The roles whose homes #882 changes are verified on test at the release's own verification step**, not here
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new page or permission; `/releases` is unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; the cut adds no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched by the cut. #882 carried its own manual and i18n changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are English prose in the register by design, as every previous entry is. **The Thai wording of #882's two new cards is a separate open item**, belonging to #882 and carried in the release record
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI changed; `/releases` renders the same component it did before
- [ ] Browser console clean — no errors or React warnings — n/a: no page was driven for the cut itself, which changes no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page was driven for the cut itself

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/releases` is the only consumer, and the risk is data rather than rendering: all **63** prior entries were asserted **byte-identical** to `origin/main`'s copy, and the file is still newest-first by `compareVersions` across all 64. The `build` gate compiles the file
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: none of those files is touched. `src/lib/releases.ts` is read by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`; all three read the same exported arrays, which the build compiles and the assertions above exercise
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (see section 2), and the branch is two files beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: cutting a release closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one non-obvious choice this cut makes — publishing a note from an **empty** `unreleased` — is not a new decision but the application of an existing one, `docs/decisions/2026-10-11-release-note-truth-rule.md`, which already says the note goes in the PR that closes the outstanding step. It is recorded in the cut commit message and in the PR body
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR** — n/a: a cut PR is the one PR that cannot tick this line, because the checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's purpose is to leave it empty. The note a user will read **is** in this PR, in `releases` rather than `unreleased`
- [x] Commit messages say why, not just what — the cut commit says why the note is published from an empty `unreleased`, names the truth rule that withheld it, states the ordering requirement for `0251`, and lists what was asserted mechanically
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every claim in the cut commit is output from the assertion run above. The claim easiest to tell as a story rather than measure — "no admin mail goes out" — was asserted as an absence **and** a presence. The claim this plan adds, that `0251` cannot silently skip a production role, is read from a CHECK constraint in `0132` and from the five migrations that create the roles, not inferred from dev behaving well

### Why this cut publishes a note although `unreleased` was empty

Stated plainly, because it is the one thing about this release a later reader will not expect and the checker cannot explain.

`unreleased` was `[]` at the cut. A cut from an empty `unreleased` would normally mean *nothing a user would notice shipped* — and here that would have been false. #882 removed the Operations, Management and My tasks tiles that the app had been adding to a role's home by itself, which is a change every signed-in person sees on the first screen they land on. #882 wrote its release-notes line as `n/a` **correctly**, naming the release-note truth rule: a note must not promise users a change works while a manual step is still open, and `0251` — which seeds the replacement cards — was not yet on production. The rule says the note goes in the PR that closes the step. **This is that PR**: `0251` is applied to production at step 5, before the deploy that makes #882's code live, so the note is true at the moment it first becomes visible. Had the note been left out, `0.39.5` would have published an empty note list and looked exactly like a release in which nothing visible changed — the failure mode `docs/decisions.md` records on 2026-09-24.

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `07f4e03d`, the cut commit. The merge commit becomes the release SHA and is read from the deploy's own output rather than assumed
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (read from `deploy.mjs`'s own line on each build)
- [x] **Every PR in this release has a completed test plan** — the release-time confirmation `CLAUDE.md` requires, because `test-plan` is advisory and a PR can reach `main` unchecked. The list is **`node scripts/release-prs.mjs e077f45b 3b402218`**, not a `git log` read: **5 PRs, exit 0**, and it also checked the 6 added migration/test-plan files against the list and found no orphan — the squash-merge failure the `0.39.4` handover flagged on #865 did not recur. All five carry a plan: #878 `feature-review` (`pass`), #879 `record-0-39-4` (`pass with accepted defects`), #880 `handover-0-39-4-update` (`pass with accepted defects`), #881 `auto-tiles-out-schema` (`pass`), #882 `auto-tiles-out` (`pass with accepted defects`). **None slipped through.** #882's three open items are carried into the **release record** rather than lost, and deliberately not into this plan's own manual table — see that section for why

  **Corrected after a first draft said "four PRs".** That draft was built from `git log --merges` read by eye, which missed #879, and `CLAUDE.md` says in terms never to build this list that way — a PR that reached `main` through an `origin/main` merge, a squash or a rebase has no merge commit to find. The script is the authoritative list and it says five. The miss was harmless here (#879 is the `0.39.4` record and carries its own plan) but the method was the one the runbook names, which is worth more than the outcome

### On the deployed build

- [ ] Deployed to test: `node scripts/deploy.mjs --env test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today". The entry's date is a literal string, `2026-10-23`, and `compareVersions` does not read a clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: there is no band, threshold or rounding rule in this PR. The one boundary present was checked both ways anyway (section 4)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block, the guard count and the assertion block are verbatim, including the first-run failure and how it was resolved
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager (`dbkodyyxxhtygxcxmfcu`; grep the project ref, not the arrow, and on the production log use `Get-Content … | Select-String` because PowerShell's `tee` writes UTF-16)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager (expected to read **14**, the baseline now confirmed on **both** test and production; a different number means the deploy's env changed, and the log's own list is what to read)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, this PR contains neither. But the **release** does, and the ordering is the one thing in `0.39.5` that can go wrong: `0251` (#881) seeds the `role_cards` rows and #882's `src/lib/home/tiles.ts` reads them, having deleted the code that used to add those tiles itself. **Migration first, then deploy.** Deployed in the other order, every affected role loses My tasks, View residents, Bills, Feed special diets, Add medical photos and Record weight from its home until the migration lands
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `dry-run 0251 … ok`. The per-file-transaction caveat could not bite: `0251` is the only pending file, so there is no earlier pending file it could depend on
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **n/a, and read rather than assumed.** `0251` is a single `insert … on conflict do nothing` into `role_cards`. It drops nothing, rewrites nothing and updates no existing row, and it does not touch `role_permissions`, so **no access changes**. The gate genuinely does not engage. Said plainly because last release recorded the lesson that *additive in the database is not the same as harmless*: the harm channel here would be a role **losing** a tile, which is the ordering requirement above rather than a data-loss risk, and a backup would not be the remedy for it
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0251_seed_cards_for_removed_automatic_tiles.sql` to `dbkodyyxxhtygxcxmfcu`, before both deploys.** `251 applied, 1 pending` → `252 applied, 0 pending`, re-read afterwards with a clean drift check

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. The position: `./scripts/pi/deploy-pi.sh --ref e077f45b` on each Pi returns the served app to `0.39.4`, and `npx wrangler rollback --env production` returns only the Worker fallback, to `0.39.4`. **Neither reverts `0251`** — and it does not need reverting: the rows it adds are inert under `0.39.4`'s code, which adds those tiles itself regardless. That asymmetry is the safe direction and is why the migration goes first

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script assumed LF line endings; `src/lib/releases.ts` is CRLF, so its anchor never matched and the first run **wrote nothing** | **fixed** before anything was committed, and it failed in the safe direction: the script's `anchor not found` guard threw before writing a byte, and `grep -c "0.39.5"` read `0`, so the failure was visible rather than silent. Made line-ending aware (`src.includes("\r\n") ? "\r\n" : "\n"`) and re-run. **Worth knowing for the next cut**: a cut script that edits this file by string anchor must match CRLF |
| 2 | low | One cut assertion failed on its first run: a scan for the literal words `undefined` / `null` flagged `0.33.0`, whose note legitimately quotes a date that read `"NaN undefined NaN"` | **fixed in the verifier**, not in the cut, after establishing which was at fault. The scan now covers only the new entry; prior entries are already proven byte-identical. **This is the second release running in which this same assertion produced this same false positive** — the previous record names it too. It is a verifier written fresh each release rather than a script in the repo, which is why the fault recurs |
| 3 | low | #881's stated production apply plan — *"roles are matched by key so a missing role is skipped"* — did not cover the case that actually mattered: a role that **exists** on production but is skipped by `kind <> 'fixed'` or `archived_at is null`, which would lose its tiles once #882's code went live | **closed as not-a-risk, by measurement rather than reassurance** (section 3). `0132:91`'s CHECK constraint makes `kind = 'fixed'` impossible for any key but `admin` and `public_viewer`, and all five of `0251`'s roles are created by applied migrations. Nothing was changed; the gap was in the *plan's reasoning*, not in the migration |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — the cut changes two data files and no page, route or permission | — |

**#882's three open manual items are deliberately NOT copied into this table**, and this is a correction to a first draft of this plan that did copy them. `CLAUDE.md` and the `0.39.4` handover both say why: a feature's `pending:` items belong to that feature's own plan and its own signature, and listing them here *"gives them a second home nothing closes"*. They are #882's — already signed open in #882's plan — and they go into the **release record**, which is the one place that tracks what this release shipped unverified.

What the release manager does about them, recorded here because it is a commitment and not a check of the cut: **#882's items 1 and 2 are driven on test at the verification step** using `scripts/dev-signin.mjs`, the route that exists precisely so `pending: no signed-in session` is a fault rather than a state; their outcome goes in the record. **Item 3, the Thai wording of the two new cards, is left for a Thai reader** and is this release's one genuine `pending: a person`. It cannot fail quietly — the English wording is unaffected and no behaviour depends on it.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **the cut**, which changes two data files and adds no page, route or permission. It is not a claim about #882's open items, which are not this plan's to close

Manual verification by: n/a: the cut changes two data files and no page; there is nothing for a person to look at. #882's three open items are carried in the release record, not signed off here

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
