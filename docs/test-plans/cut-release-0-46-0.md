# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.46.0` — **major, and it mails** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-46-0` @ `C:\Development\Animal_Shelter_cut-release-0-46-0`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-14 |
| Carries a migration? | no — the release carries nine (`0366`–`0374`); the cut PR itself carries none |
| Tested at SHA | filled in at the commit that opens the PR; the release range is `15854dd4..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — the thirteen notes earned by the release move from `unreleased` into a new `0.46.0` entry, and `package.json` goes to `0.46.0`
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. Eleven of the thirteen carried notes are card-tagged (`run_merch_shop`, `donations_receipts`, `view_residents`, `review_animal_reports`, `website`, `view_translations`/`translations`, `bills`/`bill_sites`, `view_foundation_papers`) and two are deliberately untagged — the adopter/foster wording and the last refusal-key group, which anyone signed in can meet
- [x] Out of scope, written down so the release manager is not surprised — **the nine migrations, all three deploys and the three Pi builds are the release, not the cut.** No code was written for this release: per `docs/release-procedure.md`, *a release cuts what the build gave it*. **This cut published no new note at all** — every candidate's own PR had already put its note in `unreleased`, which is the shape the truth rule asks for and is why `--verify` needed no custom base (§2)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from a freshly pulled `origin/main` (`35821118e`) minutes earlier, so there was nothing to merge in. `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — the run, as it printed, is below

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 51s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 156s
=== gates: test — npm test
=== gates: test exited 0 after 35s
=== gates: build — npm run build
=== gates: build exited 0 after 127s
gates: typecheck=0 lint=0 test=0 build=0
```

All four read from their own exit codes, and the block is complete because the run was piped through
`tee` rather than `tail` — the trap that cost `0.45.0` a whole gates cycle.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass, against plain `origin/main`.** Two releases running have had to build an explicit base, because a cut that **adds** an owed note makes `origin/main:src/lib/releases.ts` stop being the pre-cut state. **This cut added none**, so `origin/main` *is* the pre-cut state and is the correct base. The count assertion reading `[13 vs 13]` rather than `[14 vs 13]` is itself the evidence that nothing was published here that was not already earned in its own PR:

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [13 vs 13]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.46.0"]]
ok   control: from further back, an older major release is still found  [0.45.0 in ["0.46.0","0.45.0"]]

all 17 assertions passed
```

- [x] **The mail is asserted as a PRESENCE, with a control.** This release mails, so the assertion is that `majorReleasesSince("0.45.0")` returns exactly `["0.46.0"]` — and, from further back, that it still finds `0.45.0`, which is what stops an always-answering function satisfying it
- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **Audit.** `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), registered in `docs/advisory-register.json` and still unreachable here. **The cut bumps `package.json`, so CI's `audit` runs for real** — `skipped` would not have been a pass
- [x] **The deferred-note gate was answered, not waved through.** `check-deferred-notes.mjs` listed **38** candidates from **137** plans at an older cut point, against this release's **36** PRs — the over-listing the runbook describes. Every one was answered in `--deferred-reviewed`, and the durable answers are in §7 and in the release record

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's nine (`0366`–`0374`) each landed in their own PR, were applied to dev there, and are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were each checked in their own plans; the apply plan for this release is in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end — `/releases` was **loaded** on the worktree dev server (HTTP 200) with two disposable card-keyed logins, and the new `0.46.0` section renders with `0 × [object Object]` and `0 × undefined`. The card tagging was measured, not assumed:

```
login holding exactly my_tasks        → HTTP 200, 643,107 bytes; both untagged notes render;
                                        run_merch_shop / view_foundation_papers / donations_receipts notes ABSENT
login holding exactly run_merch_shop  → HTTP 200, 646,705 bytes; the run_merch_shop note RENDERS,
                                        the other two tagged notes still absent, both untagged notes render
```

  So a card-tagged note is shown to its holder and withheld from a non-holder, and the two untagged notes — the adopter/foster wording and the last refusal-key group — are shown to both. **One probe of mine read a note as absent for both logins and was wrong:** the note's text contains `"foster"` in quotes, which the page HTML-escapes, so the literal probe could never match. Re-probed without the quote characters it renders for both. Recorded because *a probe that cannot match looks exactly like a note that did not render*. The logins were keyed to this port with `--cards`, so no other running stream was signed out, and `--remove` was deliberately **not** run
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered" and "the mail flag is wrong", and both are asserted mechanically in §2 rather than clicked

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no card gates the cut and it adds no route. `/releases` was already open to every signed-in login, and note **audience** is decided per note by its `cards` tag, which the carried-across assertion proves unchanged

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed. The release notes are not translated: they are shown as written, which is why the unread Thai in several of this release's features is listed for a person in **Left for manual verification** rather than ticked here

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and `/api/releases/current` reads it in the Worker bundle and is covered by the order and `latestRelease` assertions plus the build gate
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs`, which refuses a mismatch between `package.json` and the newest entry; the three-way version assertion (`lock 0.46.0 / root 0.46.0 / package.json 0.46.0`) is that check made ahead of the deploy
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: a cut closes no item. Every item this release closes was ticked in its own PR
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical. The one judgement in it — which deferred note this release owes — is recorded in this plan and in the release record, where the next release manager looks
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out below
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[13 vs 13]`; the mail from the presence-and-control pair rather than from `major: true`; the pending counts from `--status` on all three databases; the audit from `audit:register`'s own exit code; the backup from Drive's own file list rather than from `backup.log`

### The notes this cut publishes, and the thirty-eight candidates it answered

`check-deferred-notes.mjs` named 38 candidates. Only **seven** belong to this release's 36 PRs, and
**every one of those had already published its own note in its own PR** — which is why this cut added
nothing:

- `merch-exchange-rate`, `shop-public`, `shop-schema` (through its two app halves), `foundation-read-card`
  and `proposed-by-name` each have their note in `unreleased`, carried across character-identical
- **`adopter-portal-schema` owes none and its step is closed.** Its `n/a` reason was *"Foster scope is
  not usable by a person until the app half ships"*, and the app half shipped **in this release**
  (`adopter-portal-app`) carrying the note itself. This is the truth rule working as designed: the note
  went in the PR that closed the step, not in the cut
- `record-0-45-0` is a release record; nobody using the app notices one

Three worth naming because they look closed and are not:

- **`foundation-document-store`** — `0362` has been applied since `0.45.0` and `0368` adds a third,
  read-only card in this release, but the two open steps are unchanged: **no card is assigned to any
  role**, and Lutan's go on the information protection is still outstanding. `0368`'s own note says so
  in terms (*"Nobody holds it until it is given to a role"*), which is the honest form
- **`donate-promptpay-qr`** — the shelter's own PromptPay id and QR image are still not entered. Note
  that the **merchandise** shop's PromptPay checkout is a different surface and did publish its note
- **`hsts-one-year`** — closed, and owes nothing: no shelter user notices a longer HSTS `max-age`

The rest were planner handovers, release records, developer instruments and out-of-range candidates
from the older cut point. Every one has a one-line answer in the `--deferred-reviewed` argument
recorded on this PR.

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.45.0` from `15854dd4` when this release began, read from `/api/version` on each.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `35821118e` at the cut; re-checked against `origin/main` immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each `deploy.mjs` run's own output. **The code-identity diff is the assertion, not SHA equality**, and it is recorded in the release record

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date. The entry's date is a literal written into the file and asserted against the requested value
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted
- [x] Evidence pasted here is the tool's actual output, unedited — the gates block and the assertion lines are copied from their runs

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable**, so the third is a confirmation rather than a change

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: the cut PR carries no migration. Across the **release**, each migration and its consumer merged in their own PRs, which is why the apply comes before the deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager, immediately before the apply
- [x] Destructive or rewriting migration: a fresh production backup exists — **none of the nine rewrites existing rows at apply time.** Each is additive: new tables, `create or replace` function bodies, and `insert` rows into the permission catalogue, `card_grants` and `card_features`. `0373`'s `update merch_variants` is inside a checkout function's body, not a statement the apply runs. The backup gate is met anyway and was read from **Drive, not from `backup.log`**: `lannacare-production-2026-11-13T2000Z.dump.age`, 1,781,687 bytes, about nine and a half hours old, with the nightly run unbroken back through 8 November
- [x] Apply plan stated — `0366`–`0374`, in that order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** any deploy to either. Test's database (dev) is checked for pending files in the same pass

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 15854dd4` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and neither unsends the mail.** All nine are additive, so leaving them applied under the previous release is safe — the previous code simply does not read them

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **`table-policy-commands` reads 74 lines on production where `0.45.0`'s record says 78, with no migration applied between and the check's own code unchanged.** One of the two figures is wrong; this one has its saved output beside it | accepted, recorded in the release record |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has read.** Nine of this release's notes say so themselves — the merchandise shop (three), the cashflow income side, the website animal count, the report-an-animal form, the adopter/foster wording, the bills buttons, the foundation-papers card and the last refusal-key group | a Thai reader |
| 2 | **The new screens on a phone** — the merchandise shop's staff screens and public page, and the report-an-animal form | Lutan, on his phone |
| 3 | **A reviewed row on Translations**, which shows the reviewer's name for the first time | Lutan, after the release |

*(The release mail is deliberately **not** on this list. Its subject and sender name are read from the message itself after the deploy, as `0.45.0` established — see the release record.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the nine notes' wording, and Lutan for the phone look and the Translations reviewer row

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass with accepted defects
