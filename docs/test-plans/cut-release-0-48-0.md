# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.48.0` — **it MAILS**, on Lutan's own instruction |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-48-0` @ `C:\Development\Animal_Shelter_cut-release-0-48-0`, port `3009` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | **No — the release range carries one**, `0435_shelter_drive_staged.sql`, pending on production and UAT. It is applied before any deploy, as its own release step |
| Tested at SHA | the cut commit on this branch, cut from `origin/main` at `24c226dbd`; the release range is `7a1aae4ea..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.48.0` entry is created with `major: true`, `package.json` and both `package-lock.json` version fields go to `0.48.0`, and the **two** notes sitting in `unreleased` move across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else (3 files, 13 insertions, 5 deletions against the branch point)
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **One note is untagged** (everyone) and **one carries `cards: ["view_translations", "translations"]`**, which is right: Management → Translations is where the drafter is pressed. See *The second note's audience* below for the one observation worth recording
- [x] Out of scope — **the migration, the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### What this release is: twelve PRs, two visible lines, and the second mailing release since the sender was fixed

**12 PRs** (`release-prs.mjs` exit 0, range `7a1aae4ea..HEAD`; 5 resolved from GitHub because they were
squash-merged, 1 found off the first-parent line). Six of the twelve are records, handovers and
corrections written by this session and the planner earlier today — `0.47.10`'s own paperwork. The
substantive four are **#1829** (the CooperJaidee product page), **#1830** (the Drive alert's wording and
its false-alarm fix), **#1831** (`#cnypd`, the tenancy canary's production flag) and **#1832** plus
**#1833** (the staged Drive-credentials flag and the `PLATFORM_SEARCH` registration).

**Two notes go to users, and because this release mails, both reach the inbox as well as `/releases`.**

### The two notes, and who can see them

> *"The CooperJaidee product page now reads as a proper introduction to the software: a headline, a call
> to action, and each main feature described and pictured, in English and Thai."*

Untagged, so everyone on `/releases` sees it. Written by #1829, carried across character-identical.

> *"Thai label proposals now work in the live app. Management → Translations can draft a Thai label for
> you to read and approve, instead of leaving the English showing."*

`cards: ["view_translations", "translations"]` — shown to a login holding either card, and to Admin, who
sees everything through the `perms.isAdmin` short-circuit. Written by **#1823**, and that provenance
matters: #1823 is a records PR, and it added this note because it had just **proved the drafter running
on production** (`label-drafts: ok, fail_runs=0`). That is the release-note truth rule working as
designed — the note goes in the PR that closes the step, not in the PR that writes the code.

### The second note's audience — an observation, not a change

The product-page note is **untagged**, so a volunteer reading `/releases` is told that the product's own
marketing site has been rewritten, which is not a thing they use. The safe default in this repository is
to widen rather than narrow, and `check-test-plan.mjs`'s warning for an untagged note naming an
admin-only place did **not** fire, so nothing is wrong. **It is recorded and deliberately not altered:**
a cut's one real failure mode is a changed note, `--verify` asserts every note carried across
character-identical, and editing a note during the cut is precisely what that assertion exists to catch.
If the audience is worth narrowing it is #1829's author's call in a later PR, not the cut's.

### Lutan was asked about the EMAIL, not about "major or minor"

He said it himself, unprompted: *"lets do a major release, email to be sent and note any gaps in test"*.
**Email to be sent** → `major: true` → the middle number moves → `0.47.10` → `0.48.0`. **Asserted in §2
by the mail-presence pair**, not inferred from the word "major" — the ambiguity
`docs/release-procedure.md` warns about, since in his usage the words have meant different things to the
two sides of the conversation. The words *"email to be sent"* settled it and no round trip was needed.

**One standing fact goes with it, stated rather than re-asked:** a major release currently mails **one
person — Lutan**. The shelter's own address is not on the production admin list and
`lannacareforanimals@gmail.com` is expected to be skipped by the relay with `E_RECIPIENT_NOT_ALLOWED`.
So "mails every admin" overstates the lever. He already knows this; it is written here so the record does
not imply a wider audience than the mail has.

**The second half of his instruction — *note any gaps in test* — is answered in Defects and in *Left for
manual verification* below**, and is carried into the release record.

### This release is the proof `#w4k9n` (e) has been waiting for

`0.42.0` and `0.43.0` both mailed titled *"[UAT] Lanna Care release …"* from *"Lanna Care UAT"*.
`RELEASE_MAIL_ENV: "Production"` was set and read in the production deploy on 2026-11-06 (`0.43.3`), and
**no release has mailed since**. So the production mail this release sends is the first test of that fix:
the subject must start `[Production]` and the sender's name must not say *UAT*. Reading it is a named step
in §8 and in the release record, and a wrong one is a fault to record, not a thing to shrug at.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `24c226dbd` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 87s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 253s
=== gates: test — npm test
=== gates: test exited 0 after 43s
=== gates: build — npm run build
=== gates: build exited 0 after 247s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] **The build banner read against the lockfile, which is the only place the `0.28.0` trap is visible** — `▲ Next.js 16.4.6 (Turbopack)`, matching `package.json`, `package-lock.json` and the installed tree

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.48.0 2026-11-22 major --verify` — all 17 assertions pass**, against plain `origin/main`, which is the right base because **this cut adds no note of its own** (both notes were already in `unreleased`, from #1829 and #1823). The explicit-base case the runbook describes does not arise here

```
ok   new entry's major flag matches  [true]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   package.json version equals the newest entry  [0.48.0]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.48.0 / root 0.48.0 / package.json 0.48.0]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.48.0"]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.48.0","0.47.0"]]
all 17 assertions passed
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **`npm run audit:register`** — exit **0**: *"1 high/critical advisory, all registered and still unreachable"* (the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`, sixth release running). Recorded as *clean against the register*, not as *clean*. **And read the raw audit too, because the register is scoped to high and critical:** `npm run audit:prod` exits 1 with **5 findings — 4 high (all the registered `glob` chain) and 1 moderate that is on no list**, `GHSA-g3hv-75wg-m249`, `minimatch` denial of service via globparts amplification. It reaches us only through `@node-minify/core` → `@opennextjs/aws` → `@opennextjs/cloudflare`, which is **build-time tooling**: it runs in `opennext:build` on this machine and is not in any bundle the Worker or the Pi serves. The register's own rule admits only high and critical, so this is not a missed entry — it is a moderate in a build dependency, written down here rather than passed over
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will RUN on this PR rather than show `skipped`**, because a cut changes `package.json` — the one PR per release where that job is a real check

### The deferred-note review, and it over-listed for the seventh release running

`check-deferred-notes.mjs` exited 0 and listed **17 candidates across 56 changed plans** — against this
release's **12 PRs**, because the script ignores the range it is given and re-reads from an older cut
point (`3d93e90e`). **Four of the seventeen are parse artefacts**, where it printed the test-plan
template's own guidance paragraph as the "reason"; each was read in its own plan and its real `n/a`
recovered from the end of the line. Every one of the seventeen was answered in `--deferred-reviewed`:

| Plan | Real answer | Note owed? |
|---|---|---|
| `closed-shelter-jobs` | parse artefact; real reason is *"invisible until a shelter is closed"* | no |
| `console-cards-redesign` | the operator console is one product administrator's alone | no |
| `dev-signin-shelter-default` | parse artefact; a developer script, proved absent from production and UAT again this release | no |
| `drive-alert-honesty` (#1830, **in this release**) | the Drive alert's one recipient is the product administrator, not a shelter user. The clause *"reaches users only when the Worker is deployed"* is about **when it takes effect**, not a step outstanding | no |
| `hero-photo-shelter-scope` | *"nobody sees this until there are two live shelters"* — still one | no |
| `label-draft-runtime-config` | **ITS STEP IS CLOSED, AND ITS NOTE IS IN THIS CUT.** The drafter's values are deployed and it was proved running on production (`label-drafts: ok, fail_runs=0`); #1823 added the note | **already present** |
| `plan-day-skill-edits` | parse artefact; real reason is *"skill-file and handover wording only"* | no |
| `platform-search-register` (#1833, **in this release**) | the product site stays closed to search engines; opening it is Lutan's later decision and is not done here | no |
| `public-views-owner-check` | parse artefact; a developer check | no |
| `record-0-47-10` (**in this release**) | a release record; its own release's note shipped in #1816 | no |
| `record-0-47-8` | prior release record; its notes shipped in #1773 and #1774 | no |
| `record-0-47-9` | prior release record; its note shipped in #1790 | no |
| `record-2026-11-20-decisions` | one person's console header, and a form only strangers see | no |
| `record-test-worker` (**in this release**) | a release record and a test deploy; neither is served | no |
| `shelter-drive-connect` | **THE CLOSEST CALL, AND THE ANSWER IS STILL NO.** See the paragraph below | no, and see Defect 2 |
| `shelter-logo-proof` | the logo card was noted by `0.47.9`; the cap was noted by `0.47.10` | no |
| `test-deploy-token-file` (#1827, **in this release**) | nobody at a shelter sees a test deploy (the token itself now exists; see Defect 3) | no |

**Why `shelter-drive-connect` is the closest call and still owes nothing, read rather than assumed.**
Its plan says the note ships in the PR that closes Lutan's first real Google consent — and a consent
**did** happen on 2026-11-22. But it happened **on dev**, and the shelter's own Drive has not moved. Three
readings settle it:

- `git grep "staged" origin/main -- src/lib/google/` returns **nothing**: no code on `main` reads the
  column `0435` adds.
- The two commits that do read it — `shelter-drive-credentials.ts`, `shelter-drive-decide.ts`,
  `GoogleConnect.tsx`, the callback route and `drive-move-to-shelter-account.mjs` — are **still unmerged**
  on `claude/shelter-drive-move`, whose session is live.
- So `0435`'s own `-- consumer:` header names three files, none of which is in this release.

A note promising the connect flow works would therefore be false on production, which is exactly what
`docs/decisions/2026-10-11-release-note-truth-rule.md` forbids. **It is owed, and it is not in this
release — that is for the planner**, per the runbook's rule that a release ships what the build gave it.

## 3. Schema and data

- [x] Migration number / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** `0435` was numbered, written re-runnable (`add column if not exists`) and given its own down line by its stream (#1832)
- [x] **The release range's one migration was PENDING on both deploy databases and is now APPLIED to both, dry-run first on each, before any deploy** — this was done while the gates ran, since `0435` has no reader on `main` and `check-release-order` had already cleared both directions

```
before:  production (dbkodyyxxhtygxcxmfcu)  435 applied, 1 pending — 0435, 0 applied-here-with-no-file
         uat        (fsjagxmxjosauwmxwype)  435 applied, 1 pending — the same one
dry-run: 0435_shelter_drive_staged.sql … ok   (each, in its own begin/rollback)
after:   production  436 applied, 0 pending — on origin/main not applied here: 0, applied here no file: 0
         uat         436 applied, 0 pending — the same, both directions clean
```

- [x] **The tenancy catalogue lint, strict, right after the apply — exit 0 on ALL THREE databases:** `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 7 allowed by name, 0 stale` on production, on dev and on UAT. Green on every database for the second release running, after `0434` closed the flags `0.47.2` opened
- [x] **`translations-unlisted`, the live half, after the apply** — production and dev both: *"Every Thai column on a base table is registered on Translations or named as deliberate"*, with `label_drafts.text_th` and `rounds.name_th` named as deliberate. **`label_drafts.text_th` is this release's own note's table**, so it is worth having read rather than assumed
- [x] **`assert-schema.mjs` on production and UAT** — each *"holds every migration this commit carries (asked the Management API)"*, which is the guard that must be green before any Pi build starts

- [x] **The order is migrations first, and the guard agrees** — `check-release-order.mjs --worker-deployed 7a1aae4ea…` reports *"must-follow-Worker: none pending"* and *"must-precede-Worker: none pending"* on **production and on UAT**
- [x] **`0435` tightens no constraint and rewrites no rows.** It is one statement: `alter table public.shelter_drive_credentials add column if not exists staged boolean not null default false`. Every existing row and every row the connect flow writes is `false`, which is the behaviour as it is today, so there is no before-picture to take of moved rows — the migration moves none
- [x] **What it grants to `anon` / `authenticated`: nothing.** A boolean column on an existing table; no policy, no function, no grant. Read in the file before applying it
- [x] **It is applied AHEAD of its consumer, deliberately and safely** — the three files its header names are unmerged (above), so nothing reads the column on the release commit. `apply-migrations.mjs` is expected to warn that the consumer is not yet in the release assumed live; **that warning is correct and is the safe direction** (schema first, reader later), and the runbook's own note says an unsurprising warning is the point

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are, and with **two** notes this time the *same order* clause earns its keep
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail WILL be sent, proved as a presence AND a control.** `majorReleasesSince("0.47.10")` is `["0.48.0"]`, with the control assertion showing the same function still finding `0.47.0` from further back — so the answer is the flag being `true`, not the function returning everything it is asked for
- [x] **Both notes carried across character-identical**, in order, with the second one's `cards` tag intact — the tag is the part that matters, because a note that lost it would read as everyone's
- [ ] **A signed-in browser read of `/releases`, and the mail in the inbox** — pending: after the deploy. The mail check is §8 and is the first test of the `[Production]` subject fix
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged; the notes' tags are asserted by the character-identical carry, and the filtering they drive shipped in `0.45.x`

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and two notes. No nav entry and no manual topic. The notes are English, as every release note is; the **pages** they describe are bilingual, which #1829 and the label drafter each proved in their own PRs

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current`, by `deploy.mjs` under Node's type stripping **and, on a major release, by `worker/release-mail.mjs`**. The last two are the ones that bite, and `check-release-guards.mjs` at exit 0 plus the mail-presence assertion cover them
- [x] Nothing merged from `main` was broken by this branch — nothing was merged. **`origin/main` moved under the cut** (a backlog commit, `docs/backlog.md` only) and was deliberately not chased: the runbook's rule is to read what is deploying, and a documents-only move changes nothing that is built

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. #1829's and #1823's own items were ticked by those PRs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The judgements worth keeping are the deferred-note review table and the `shelter-drive-connect` reasoning (§2), the `0435`-ahead-of-its-consumer reading (§3), the untagged-note observation (§1), and the test-gap list below
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The two notes were gained in #1829 and #1823 and are quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the notes from the file itself; both database figures from `--status` on each; the live versions from **both** endpoints on all four hosts; the unmerged consumer from `git grep` on `origin/main` and `git log origin/main..origin/claude/shelter-drive-move`; the moderate advisory from `audit:prod`'s own output; the 17 assertions, the four gate numbers and both audit exit codes from the runs pasted above

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` **and** `/api/releases/current` on all four hosts
- [x] **The baseline before this release was read on all four hosts, on BOTH endpoints** — `lannacareforanimals.org`, `cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` all answer `0.47.10` on `/api/version` *and* on `/api/releases/current`, all four reporting the same SHA `7a1aae4ea`, every one of them with `x-lanna-served-by: pi`. **This is the check `0.47.8` failed**; it is clean here, as it was on `0.47.9` and `0.47.10`
- [x] **WHO CAN MAIL, READ FROM `wrangler.jsonc` BEFORE ANY DEPLOY — the one check a mailing release owes that a quiet one does not.** `--plan` prints a generic *"a major release new to this environment would be mailed to the admins"* for every environment, so the configuration itself was read rather than that line believed:

```
test         RELEASE_MAIL_ENV=""            send_email: ["STATUS_ALERT_MAIL"]                     -> cannot mail, by construction
uat          RELEASE_MAIL_ENV="UAT"         send_email: ["RELEASE_MAIL"]                          -> CAN mail; --no-mail is mandatory
production   RELEASE_MAIL_ENV="Production"  send_email: ["RELEASE_MAIL","STATUS_ALERT_MAIL"]      -> the one that mails, and the "Production" is the fix under test
```

**UAT is the dangerous one and this is why:** its database holds production's real people, so a major release deployed there with the flag forgotten would mail every real admin from a test site. `deploy.mjs` has refused to mail from UAT without `--mail` in words since 2026-11-08, and `--no-mail` is written anyway — belt and braces is the right shape when the failure is *real people were emailed*.

- [x] **The test deploy's credential was read before a ten-minute build was started**, which is the whole lesson of `0.47.10`: `deploy.mjs --env test --plan` prints `wrangler auth: API token from .env.deploy.test`. So the token file #1827 made optional is in use, and `wrangler whoami` separately shows the OAuth login is also valid with `workers_scripts (write)` — two working paths, where this morning there were none
- [x] **Pre-deploy proofs, all green before the cut was written:** `check-deployed-hosts.mjs` on production (4 addresses, plus all four `/auth/callback` entries), UAT and dev; `check-dev-aal2-absent.mjs` on production and UAT (static proofs plus a live read of each project); `check-release-order.mjs` both directions on production and UAT
- [x] **What this release is for:** the product page reaching `cooperjaidee.org`, the Thai label drafter's note reaching the people who hold the Translations cards, `0435` reaching both databases ahead of its reader, and — the part only this release can test — **the production mail going out with the right title and sender**
- [ ] Smoke test / UAT project line / the mail itself — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the deploys and is copied into the release record, and the mail is read in the inbox rather than trusted from `sent 1`

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.10` and both notes back into `unreleased`; nothing is deployed by the cut. **The mail cannot be unsent once the production deploy has run**, which is why the flag was taken from his words and asserted rather than inferred. **`0435` is not rolled back by a code revert, and should not be:** it is an additive column defaulting to the behaviour as it is today, and a Worker on `0.47.10` runs correctly against it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (measurement) | **`check-deferred-notes.mjs` printed the template's guidance as the "reason" for 4 of its 17 candidates, and read 56 plans for a 12-PR release** — seventh release running (`0.43.4`, `0.43.5`, `0.43.6`, `0.47.7`, `0.47.9`, `0.47.10`, here) | **recorded, reviewed by hand.** The table in §2 is the review. The gate is right to over-list — under-listing is the fault it exists to prevent, and `0.40.10` lost three notes that way; the noise is in what the plans quote |
| 2 | medium (test coverage) | **The release's own headline note ships unproven by a person.** #1829's plan carries `Manual verification by: pending: Lutan to look at the page and read the Thai wording`, and the page it describes is the untagged note that every reader of `/releases` gets and that the mail carries | **recorded as a stated gap, on his own instruction** (*"note any gaps in test"*). **Bounded, and read rather than assumed:** it is a new public page on the product's own host, it replaces a placeholder rather than a working screen, and `public-views` and the gates passed on it. What is unproven is whether the Thai reads well and whether the page looks right — a judgement only he can make. It is the first thing to look at after the deploy |
| 3 | low (gap, already filed — and half of it closes here) | **Two further plans in the release carry `pending: Lutan` manual lines** — #1831 (run the production canary with a write-capable token, after reading what a planted row sets off) and #1827 (create the test deploy token and run one test deploy) | **recorded; both are already backlog items with his name on them** (`#cnypd`, `#tstok`). **`#tstok`'s first half is DONE and was read rather than assumed:** `.env.deploy.test` exists on this machine (76 bytes, written 13:35 today, gitignored by `.gitignore:13`) and holds a `CLOUDFLARE_API_TOKEN` — so **this release's `--env test` deploy is the proof `#tstok` is waiting for**, and `deploy.mjs`'s own `wrangler auth:` line is what says which credential it used. Ticked in the record PR if it reports the file's token, not before |
| 4 | low (observation) | **A moderate advisory reaches us through build tooling and is on no list** — `GHSA-g3hv-75wg-m249`, `minimatch`, via `@node-minify/core` → `@opennextjs/aws` → `@opennextjs/cloudflare` | **recorded, not registered.** `docs/advisory-register.json`'s rule admits high and critical only, so its absence is correct rather than an omission. It is build-time only: nothing the Worker or the Pi serves bundles it. Written down so a later release does not discover it as news |

## Left for manual verification

**This is the release's test gap, listed because Lutan asked for it.** Each item belongs to its own plan
and its own signature — **they are listed here as the release manager's pre-deploy pass, not adopted into
this plan's own sign-off**, which the runbook forbids.

| # | Plan / item | What is waiting | Whose |
|---|---|---|---|
| 1 | `cooperjaidee-product-page` (#1829) | look at `cooperjaidee.org` and read the Thai wording. **This is the release's headline note and the biggest of the three gaps** | **Lutan's.** Defect 2 |
| 2 | `tenancy-canary-production-flag` (#1831) | run the production canary with a write-capable token, after the production read of `canary-planted-triggers` — the expensive half of `#cnypd`, by design | **Lutan's**, filed |
| 3 | `test-deploy-token-file` (#1827) | **his half is done — the token exists in `.env.deploy.test`.** What is left is one `--env test` deploy that reports it, and **this release runs that deploy**, so the proof is this session's, not his | **this session's**, `#tstok` |
| 4 | **The production release mail** | read the inbox: the subject must start `[Production]` and the sender must not say *UAT*. First mailing release since the 2026-11-06 fix, so this is `#w4k9n` (e)'s proof | **this session's**, after his deploy |
| 5 | Four plans' **release manager acknowledgement** lines | `pending: release manager` / `pending: at release time` / `pending: planner runs the production read` | **read here, at release time**, which is what that line waits for |
| 6 | The **`pending: Lutan` items on `0.47.9`'s and `0.47.10`'s records** | signed-in presses on production | **Lutan's**, and **not this release's** — carried forward rather than re-adopted |

**All twelve plans in the release read `Result: pass` or `pass with accepted defects`** — two of the
latter, both documents PRs of this session's and the planner's, neither carrying an unfixed code defect.
None is a `Result: fail`.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, `audit:register` and `audit:prod`, `check-release-order` on production and UAT, `check-dev-aal2-absent` on production and UAT, `check-deployed-hosts` on all three, both database `--status` reads, the `git grep`/`git log` readings behind the `shelter-drive-connect` answer, and **both** version endpoints on all four hosts
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan — item 1 above, the product page and its Thai wording. Item 2 is his filed backlog item `#cnypd`; items 3 and 4 are this session's and are done inside this release

Manual verification by: pending: Lutan — the CooperJaidee product page and its Thai wording (#1829), recorded as this release's headline test gap

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session applies `0435` to both databases, runs the tenancy lint, deploys test and UAT, builds all three Pi clones, purges both zones, hands Lutan the one production command, and then reads the mail

Result: pass with accepted defects
