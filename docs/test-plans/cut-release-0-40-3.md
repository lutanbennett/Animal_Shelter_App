# Feature test plan — cut release `0.40.3`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.3` — move the one `unreleased` note into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-3` @ `C:\Development\Animal_Shelter_cut-release-0-40-2` (a free leftover reused under paperwork rule 2, so this cut did not pay a fourth consecutive four-minute `npm ci`) |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #932 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-25 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries three (`0259`, `0260`, `0261`), which belong to their own PRs' plans and are not signed here |
| Tested at SHA | `b35dfc9d`, whose parent is `8e9466b3` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `ReleaseNote` moves from `unreleased` into a new `0.40.3` entry dated 2026-10-25 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` (+13 / -6) and `package.json` (one line). No route, no component, no `worker/`, no migration
- [x] Roles affected identified — the note is tagged `roles: ["admin"]`, so only Admin is shown it on the releases page. Nobody's access changes in this PR
- [x] Anything explicitly **out of scope** written down — the three migrations in this release and `0259`'s widening are out of scope here and are the release manager's steps, recorded in `docs/releases/`. **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the branch was created directly from `origin/main` at `8e9466b3` moments before the cut, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read**:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of the assertion script:

```
PASS  newest entry is 0.40.3 (got 0.40.3)
PASS  date 2026-10-25 (got 2026-10-25)
PASS  major is false (got false)
PASS  one note carried (got 1)
PASS  note count matches old unreleased (1 -> 1)
PASS  every note identical to origin/main's unreleased, none lost, none invented
PASS  unreleased is empty (got 0)
PASS  one entry added (67 -> 68)
PASS  all previously-released entries byte-identical
PASS  package.json 0.40.3 equals newest entry 0.40.3
PASS  file order matches compareVersions (newest first)
PASS  majorReleasesSince("0.40.2") is empty -> no mail (got [])
PASS  presence control: majorReleasesSince("0.39.5") still finds "0.40.0" -> ["0.40.0"]
PASS  the new entry renders clean: no [object Object], undefined or empty text (older entries are covered by the byte-identical assertion above; 0.33.0 legitimately quotes "NaN undefined NaN")
CUT VERIFIED - all assertions pass
```

- [x] **The mail decision is asserted in both directions, not only as an absence.** `majorReleasesSince("0.40.2")` is empty, *and* in the same run `majorReleasesSince("0.39.5")` still returns `0.40.0`, so the emptiness is a fact about this release rather than about a function that always answers nothing. Note for the next release manager: `majorReleasesSince()` returns `Release` **objects**, not version strings — comparing against `["0.40.0"]` silently never matches, which reported a false red on `0.40.2`'s sound cut
- [x] **The assertion script's own first run was wrong and was fixed rather than shrugged off.** It read `n.text` on every historical note; `ReleaseNote` is `string | { text, roles }`, so 227 string notes were flagged. Re-run through the file's own `noteText()` helper, one hit remained — `0.33.0` legitimately quotes the old bug text `"NaN undefined NaN"` — so the render check is now scoped to the new entry, which is the only entry a cut can break; the other 67 are covered by the byte-identical assertion above. Recorded because a red that is explained away without being read is how a real one gets past

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration; the release's own `--status` is section 8's
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: this PR carries no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration and writes no row; `releases.ts` is plain data compiled into the build
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration. The equivalent check for a data-only cut is the assertion script in section 2, which compares every note against `origin/main` rather than reading the diff over
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration; the release's apply plan, with its ordering measured, is in section 8's Migration ordering

## 4. Functional checks

- [x] Happy path works end to end — the releases page was driven in a browser on the built cut and lists `0.40.3` at the top with its note; evidence in section 6
- [x] Data persists — reload the page and the change is still there — reloaded; `0.40.3` and its note render identically. The data is compiled into the build, so there is nothing to persist beyond that
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface; it is two edited data files
- [x] Empty state renders sensibly — the relevant empty state is `unreleased` being `[]`, which is the normal state between releases and is what this cut produces; the releases page shows no unreleased block and renders the list from `0.40.3` down without a gap
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface. The analogous guard is `deploy.mjs` refusing to deploy while `unreleased` has lines or `package.json` disagrees with the newest entry, which the assertions in section 2 confirm cannot fire
- [x] Boundary cases checked — the version boundary is the one that matters here and both sides were asserted: `compareVersions` still orders the file newest-first with `0.40.3` ahead of `0.40.2`, and the mail function answers empty for `0.40.2` while still finding `0.40.0` from `0.39.5`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.3` and its note (the note is tagged `admin`) | **as expected** — driven, section 6 |
| management | the releases page | sees `0.40.3`; not the note, which is tagged `admin` only | not driven — reason below |
| staff | — | retired role (`0173`), not live | n/a |
| doctor | the releases page | sees `0.40.3`; not the note | not driven — reason below |
| volunteer | the releases page | sees `0.40.3`; not the note | not driven — reason below |
| signed out | the releases page | `PUBLIC_SITE=locked` on production, so the staff-testing gate answers | n/a |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code, so a role can differ only in whether the `admin`-tagged note is shown to it; that tagging is data asserted in section 2 and the rendering code is untouched here
- [ ] A role that should not have access is blocked server-side — n/a: the cut adds no route and no server action, so there is nothing new to refuse

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR, and the cut adds no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a release cut adds no feature for the manual to describe
- [ ] Translatable strings go through the translation path — n/a: the one note is English prose authored by #927, not a UI string; release notes are not translated
- [x] Mobile viewport (375px) — no overflow, controls reachable — the releases page checked at 375px on the built cut; the new entry wraps and does not overflow
- [x] Browser console clean — no errors or React warnings — read on the releases page, clean
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — read on the releases page, clean

## 6. Regression

- [x] The pages nearest the change still work — the releases page is the only surface `releases.ts` feeds, and it was loaded on the built cut rather than reasoned about
- [x] Any shared file touched checked from a second, unrelated page — **by loading it, not by reading the file** — `src/lib/releases.ts` has two readers besides the releases page. `/api/version` was requested from the running build and answers `{"version":"0.40.3","sha":"b35dfc9d…"}`, which is the runtime value that reader supplies. **The second reader could not be checked here and is not claimed:** `/api/releases/current` is bundled into the Worker and is not served by `next dev` — it answers the app's 404 — so it is read at deploy time instead, which is section 8's and the runbook's two-endpoint check. Saying "both answer `0.40.3`" would have been false
- [x] **A fourth independent confirmation that this release mails nobody, from a direction the data assertions cannot reach:** on the rendered page `0.40.0` carries a **Major** badge and `0.40.3` carries none. That is the `major` flag as a user sees it, beside a known-true positive case
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (section 2); `main` did not move between branch creation and the gates run, confirmed by `git log --oneline 8e9466b3..origin/main` being empty

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. One item was *found* during this release — the last role-based grant, `opensWhoDoesWhat()` — and it was filed on the `backlog` branch, where follow-ups belong, not in this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the cut makes no design choice. The two judgements in this release that needed recording were made in their own PRs (`docs/decisions/2026-10-25-security-database-half.md`, `docs/decisions/2026-10-25-drop-role-extras-and-p-bundle.md`)
- [x] `README.md` still accurate — unchanged by this PR and re-read for the version: it quotes no version number, so the bump cannot stale it
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so it cannot have gained a line; the checker holds this line to the diff and a tick here would be a claim the diff contradicts. The note this cut publishes was written by #927, in the PR that fixed the bug. **Its truth was checked rather than assumed:** it says the card save works again, and that becomes true for a user the moment `0261` is applied — which happens before the deploy, in this release. That is the 2026-10-11 release-note truth rule satisfied in the same shape as `0.39.5`
- [x] Commit messages say why, not just what — the cut commit records why `major` is false (the question asked and the answer), what was asserted mechanically, and why `package.json` was bumped with a one-line replacement rather than a JSON rewrite
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Two in this release were measured rather than told as a plausible story: the ordering claim in section 8 was established by diffing `0261`'s declared consumers across the release range rather than read off its header, and the no-bad-window claim by reading the live `0.40.2` call shape out of git and comparing it with HEAD's, not by reasoning about what the fix ought to do

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — tested at `b35dfc9d`; the deployed SHA will be this PR's merge commit and is recorded in the release record
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager reads the `deploy.mjs` line at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The one date is the literal `2026-10-25` written into the entry, and the page renders it as given
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the cut changes no threshold, band, rounding rule or cutoff. The one ordering boundary it moves — where `0.40.3` sorts — is asserted in section 2 in both directions
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the two fenced blocks in section 2 are the unedited stdout of `gates.mjs` and of the assertion script
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. It is vacuous while `PUBLIC_SITE` is `locked`, as it was on `0.40.2`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: the production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: the production release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: this PR adds no secret and no env var, and the diff contains no `process.env`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR carries neither. **But the release does, and the ordering was measured rather than taken from the headers:** `0261`'s `-- consumer:` names `src/app/admin/who-does-what/actions.ts` and `scripts/dev-signin.mjs`, and `git diff --stat 221c041b..HEAD` shows **both change in this release**. So the apply must run **before** the deploy, and that is mandatory rather than tidy. `0259` and `0260` declare `consumer: none`
- [x] **And the window was read rather than reasoned about, which turned out to matter.** `0261` makes `set_role_cards` two-input, and its header warns that the app and the migration must ship together or the save fails as `0.40.2` did. Reading the live call shape out of git settles it: `221c041b`'s app and HEAD's app both send `{ p_role, p_cards }` — identical — because #927 added `p_bundle: null` and #930 removed it inside the same release. **So applying `0261` repairs the live production save before any code ships, and the deploy keeps it repaired. There is no bad window in either direction**
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: the production release manager, before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **`0261` drops a table (`role_extras`) and a function, so this gate is live rather than skippable.** `0257` already made `role_extras` count for nothing, and `role-cells` and `role-cards` were captured from production before the apply — the snapshot `0.40.2` took of the wrong table — so what the drop removes is recorded. The README restore recipe has still never been exercised, which is stated here rather than ticked
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — **`0259`, `0260` and `0261`, in that order, to `dbkodyyxxhtygxcxmfcu` (production), all three BEFORE either deploy**, with `--status` and `--dry-run` read first and `git status -sb` confirmed neither ahead nor behind before the apply rather than after it

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a Pi rebuild at `221c041b`; a `wrangler rollback` reverts only the Worker fallback. **Neither reverts the migrations, and this release's are not purely additive:** `0261` drops `role_extras` and the three-input `set_role_cards`, and `0259` redefines eleven functions as constants. So "rollback available" is true of the code and **false of the schema** — rolling the code back without a down-migration would return the app to sending a shape the function no longer has. The honest position is forward-fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut assertion script read `n.text` on every note, but `ReleaseNote` is `string \| { text, roles }`, so 227 historical string notes were reported as bad text on its first run | **fixed** before anything was concluded from it — re-run through the file's own `noteText()` helper, and the render check scoped to the new entry. Recorded because a red explained away unread is how a real one gets past |
| 2 | none | `0.33.0`'s note legitimately quotes the old bug text `"NaN undefined NaN"`, which a naive substring check flags | **accepted** — not a fault. That entry is covered by the byte-identical assertion, so the cut cannot have altered it |
| 3 | medium | **The last role-based grant in the app:** `opensWhoDoesWhat()` (`src/lib/permissions/who-does-what.ts:13`) grants Settings → Who does what from the role key `management`, and it is in none of the five registry mechanisms, so `check-hard-coded-security.mjs` passes without seeing it | **deferred to backlog** — filed under *Security* on the `backlog` branch with the fix (create the activity and card, give it to Management in the same change, so the count goes down). Found while Lutan asked during this release whether all role-based access is gone; deliberately not patched mid-release, per `CLAUDE.md` |

## Left for manual verification

| What | Why it needs a person | Who |
|---|---|---|
| The card save click-through on Who does what — add a card, remove one, move one — once `0261` is on production | It needs the authenticator step, which this session cannot pass, and it is the thing this release's one note promises a user. **The release's most valuable single check**, because it closes a bug that is live now | Lutan |
| That the `0.40.3` note reads correctly to an admin on the production releases page | A signed-in surface; `PUBLIC_SITE` is `locked`, so there is no anonymous route to it | Lutan |

## Sign-off

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-25

Manual verification by: pending: the two rows in Left for manual verification — the card save click-through, which needs the authenticator step, and the note as an admin sees it

Result: pass with accepted defects
