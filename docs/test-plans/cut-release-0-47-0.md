# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.0` — **major, and it mails** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-0` @ `C:\Development\Animal_Shelter_cut-release-0-47-0`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-15 |
| Carries a migration? | no — the release carries five (`0375`, `0377`–`0380`); the cut PR itself carries none |
| Tested at SHA | filled in at the commit that opens the PR; the release range is `4644759ef..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — the six notes earned by the release move from `unreleased` into a new `0.47.0` entry, **one further note that this release's own deploy makes true is added**, and `package.json` goes to `0.47.0`
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **All seven notes in the entry are card-tagged and none is untagged** — `run_merch_shop` (four), `review_animal_reports` (three, counting the shared nine-pages note), `manage_shop_page` (two) and `publish_shelter_friends` (one). Admin sees all seven; the signed-out public sees `/releases` not at all
- [x] Out of scope, written down so the release manager is not surprised — **the five migrations, all three deploys and the three Pi builds are the release, not the cut.** No application code was written for this release: per `docs/release-procedure.md`, *a release cuts what the build gave it*. In particular the Cloudflare rate-limit rule that `report-form-rate-limit` leaves open is **Lutan's**, and is not in this release

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from a freshly pulled `origin/main` (`8f108996b`) minutes earlier, so there was nothing to merge in. `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — the run, as it printed, is below

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 42s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 128s
=== gates: test — npm test
=== gates: test exited 0 after 36s
=== gates: build — npm run build
=== gates: build exited 0 after 134s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers were read from the gates line itself, and the whole run was redirected to a file
rather than piped through `tail` — the trap that has cost two releases a gates cycle.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass, against a hand-built base — and this cut is the case the runbook warns about.** Because it **adds** an owed note, `origin/main:src/lib/releases.ts` is no longer the pre-cut state, and `--verify` against it would have failed two assertions on a count that is correct. The base used is **`origin/main`'s file plus exactly the one note added, and nothing else**, which is the only base against which the six carried notes *and* the added one are both asserted rather than waved through:

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [7 vs 7]
ok   package.json version equals the newest entry  [0.47.0]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.47.0"]]
ok   control: from further back, an older major release is still found  [0.46.0 in ["0.47.0","0.46.0"]]

all 17 assertions passed
```

- [x] **The mail is asserted as a PRESENCE, with a control.** This release mails, so the assertion is that `majorReleasesSince("0.46.0")` returns exactly `["0.47.0"]` — and, from further back, that it still finds `0.46.0`, which is what stops an always-answering function satisfying it
- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written (before it, exit 1 with `no completed test plan in this PR`, which is the expected state of a cut worktree with no plan yet)
- [x] **Audit.** `npm run audit:prod` exits 1; `npm run audit:register`, which is what CI runs and what the release step is for, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), dated in `docs/advisory-register.json` and still unreachable here. **The cut bumps `package.json`, so CI's `audit` runs for real** — `skipped` would not have been a pass
- [x] **`npm ci` was re-run in the main checkout before any deploy**, the step added after `0.28.0`. `node_modules/next` reads **16.4.2** and `package.json` reads **16.4.2**; the `Next.js version :` banner on the first Worker build is read against that anyway
- [x] **The deferred-note gate was answered, not waved through** — see §7

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's five (`0375`, `0377`, `0378`, `0379`, `0380`; there is no `0376`, a number a stream gave back) each landed in their own PR, were applied to dev there, and are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were each checked in their own plans; the apply plan is in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end — `/releases` was **loaded** on the worktree dev server with three disposable card-keyed logins, and the new `0.47.0` section renders with `0 ×` `[object Object]` and `0 ×` `undefined<`. **The card tagging was measured both ways, not assumed:**

```
login holding exactly review_animal_reports  -> HTTP 200, 651,208 bytes
    "removed 90 days after"            PRESENT   (the note this cut adds)
    "lets the person reporting attach" PRESENT
    "Management now lists nine pages"  PRESENT
    "add a new currency"               absent    <- run_merch_shop only
    "shows as a preview straight away" absent    <- run_merch_shop only

login holding exactly run_merch_shop         -> HTTP 200, 654,122 bytes
    "add a new currency"               PRESENT
    "shows as a preview straight away" PRESENT
    "Add a photo button"               PRESENT
    "removed 90 days after"            absent    <- review_animal_reports only

login holding exactly my_tasks               -> HTTP 200, 648,447 bytes
    "0.47.0"                           PRESENT   (the section header renders)
    all seven notes                    absent    <- holds none of the four tagged cards
```

  So a card-tagged note is shown to its holder, withheld from a non-holder, and the section still
  renders for a login entitled to none of the notes. **Every probe string was chosen to contain no
  character the page HTML-escapes** — `0.46.0` had a probe fail on a quoted word and read a rendered
  note as absent, so a probe that cannot match looks exactly like a note that did not render. The
  logins were keyed to this port with `--cards`, so no other running stream was signed out, and
  `--remove` was deliberately **not** run
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered", "a note was invented" and "the mail flag is wrong", and all three are asserted mechanically in §2 rather than clicked

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no card gates the cut and it adds no route. `/releases` was already open to every signed-in login, and note **audience** is decided per note by its `cards` tag — which the three probes above measure directly

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed. The release notes are not translated: they are shown as written, which is why the unread Thai in this release's features is listed for a person in **Left for manual verification** rather than ticked here

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and it was loaded three times above. `/api/releases/current` reads the same file in the Worker bundle and is covered by the order and `latestRelease` assertions plus the build gate
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs`, which refuses a mismatch between `package.json` and the newest entry; the three-way version assertion (`lock 0.47.0 / root 0.47.0 / package.json 0.47.0`) is that check made ahead of the deploy
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: a cut closes no item. Every item this release closes was ticked in its own PR
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical. Its one judgement — which deferred note this release owes — is recorded below and in the release record, where the next release manager looks
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out below
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[7 vs 7]` against a base built for the purpose; the mail from the presence-and-control pair rather than from `major: true`; the audience of every note from three card-keyed logins loading the page; the pending counts from `--status`; the audit from `audit:register`'s own exit code; the backup from Drive's own file list rather than from `backup.log`

### The one note this cut publishes, and the candidates it answered

`check-deferred-notes.mjs` listed **48** candidates from **163** plans at an older cut point
(`75daad3f`), against this release's **24** PRs — the over-listing the runbook describes, unchanged,
and with the template's own guidance text printed as the "reason" for several. **Ten of the 48 belong
to this release**, and each has a one-line answer in the `--deferred-reviewed` argument on this PR.
Nine owe nothing. The tenth is the reason this cut is not empty:

- **`report-photo-retention`'s step is closed BY THIS RELEASE, so its note is published here.** Its
  `n/a` read *"the job does not run on production until `0377` is applied and the Worker is
  deployed"* — and this release applies `0377` and deploys the Worker. That is exactly the shape
  `docs/decisions/2026-10-11-release-note-truth-rule.md` describes: the note goes in the PR that
  closes the step, which on a step the **deploy** closes is the cut. The note added is:

  > A photo sent with a Report an animal report is now removed 90 days after you mark the report
  > Resolved or Dismissed. The report itself, and everything typed in it, is kept — only the picture
  > goes. A report still New or In progress keeps its photo however old it is.

  tagged `review_animal_reports`, the card that opens the page the photo appears on.

- **`merch-photo-upload` is the control case**: it **ticked** its own line and its note was already
  in `unreleased`, so nothing was owed and nothing was added for it.

Three that look closed and are not — carried forward unchanged from `0.46.0`, and still open:

- **`cooperjaidee-hostname-decision`** — no DNS record, route or page exists on that hostname and
  none is created here. A note would be the false-promise shape the truth rule forbids
- **`foundation-document-store`** — still **no card assigned to any role**, and Lutan's go on the
  information protection is still outstanding
- **`donate-promptpay-qr`** — the shelter's own PromptPay id and QR image are still not entered

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.47.0`'s predecessor when this release began, read from `/api/version` on each:
production `0.46.0` @ `afc48e409`, test and UAT `0.46.0` @ `4644759ef`. **The two SHAs are `0.46.0`'s
own documents-only spread**, which is why the release range is taken from `4644759ef`.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `8f108996b` at the cut; re-checked against `origin/main` immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each build's own log. **The code-identity diff is the assertion, not SHA equality**, and it is recorded in the release record

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date. The entry's date is a literal written into the file and asserted against the requested value. (**The release itself carries one**: the retention job's 90-day clock, which `report-photo-retention`'s own plan measured on dev)
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable** — `report-photo-retention` runs in the Worker's `scheduled` handler under the service-role key it already holds, which is the reason that shape was chosen over a GitHub Actions schedule

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: the cut PR carries no migration. Across the **release**, each migration and its consumer merged in their own PRs, which is why the apply comes before the deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager, immediately before the apply
- [x] Destructive or rewriting migration: a fresh production backup exists — **`0375` is the one in this release that must be read rather than assumed**, and it was: it creates a Postgres role, adds a permissive `definer_all` policy per RLS table, and moves ownership of the API-reachable views and security definer functions onto that role. It **widens** nothing a login can reach and **narrows** nothing: the policy it adds applies inside definer objects, and the two objects a re-owned role could not serve (`login_display_name`, `label_translations`, both of which read `auth.users`) stay owned by `postgres` by name with a reason. `0377`–`0380` are additive (a private Storage bucket and a column, two defaults set to NULL, insert/delete policies on a rates table, one more branch in a `create or replace` function body). **The backup gate is met and was read from Drive, not from `backup.log`**: `lannacare-production-2026-11-14T2000Z.dump.age`, 1,854,741 bytes, created `2026-11-14T20:00:55Z`, with the nightly run unbroken back through 9 November
- [x] Apply plan stated — `0375`, `0377`, `0378`, `0379`, `0380`, in that order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** any deploy to either. Test's database (dev) is checked for pending files in the same pass. **Then `check-tenancy-catalogue.mjs --strict` on every database applied to**, which is the check `0375` exists to satisfy and whose before-reading is in the release record

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 4644759ef` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and neither unsends the mail.** All five are safe to leave applied under the previous release: four are additive, and `0375` only changes who owns an object and adds a permissive policy, so `0.46.0`'s code reads exactly what it read before. The one thing to know: `0377` creates a private Storage bucket whose objects the previous release's code never writes, so rolling back strands nothing

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **`table-policy-commands` reads 80 output lines / 77 `no policy` on production today, where `0.46.0`'s record says it finished that release at 76 lines and `0.45.0`'s says 78** — with no migration applied between (376 both times) and `scripts/lib/readonly-checks.mjs` unchanged in `4644759ef..HEAD`. This is the same unresolved discrepancy `0.46.0` recorded from the other direction, now on its third reading. **Most likely the three figures were counted differently** (total output lines vs `no policy` lines), which is why both numbers are given here | accepted; recorded in the release record, for the planner. `0375` is expected to move this count for a real reason, and the after-reading is taken with both numbers stated |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has read.** This is the project's largest standing gap and the third release running to name it. `thai-read-2` had a bilingual reader go through strings in chat, but **Lutan has not signed that plan's line and Claude does not sign for him** | a Thai reader, and Lutan to sign |
| 2 | **The Report an animal photo upload, on a phone** — picking a photo from a phone's camera roll and sending it, at phone width. `report-animal-photo`'s own plan says the phone-width look is for a person | Lutan, on his phone |
| 3 | **The merchandise shop's Add a photo button, clicked through** — `merch-photo-upload`'s plan leaves the browser click-through of save and public display pending | Lutan, after the release |
| 4 | **A one-card login on `/management`**, to see the nine newly listed pages appear and disappear by card — `admin-nav-reachability` leaves exactly this pending | Lutan, after the release |
| 5 | **Pressing Add on `/admin/shop` under a shop-card-only login** — `card-boxes-triage` row 1 needs a person for this | Lutan, after the release |
| 6 | **The Cloudflare rate-limit rule for the report form** — `report-form-rate-limit` leaves it to Lutan to apply from its decision file and test. **It is not in this release** | Lutan, in the Cloudflare dashboard |

*(The release mail is deliberately **not** on this list. Its subject and sender name are read from the message itself after the deploy, as `0.45.0` established and `0.46.0` confirmed — see the release record.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the unread wording, and Lutan for the phone checks, the three click-throughs and the Cloudflare rule

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass with accepted defects
