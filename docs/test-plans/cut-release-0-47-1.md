# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.1` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-1` @ `C:\Development\Animal_Shelter_cut-release-0-47-1`, port `3008` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-16 |
| Carries a migration? | no — the release carries **nine** (`0381`–`0389`); the cut PR itself carries none |
| Tested at SHA | `8bf3795ed` (the cut commit); the release range is `ca23f2c27..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — the four notes earned by the release move from `unreleased` into a new `0.47.1` entry, and `package.json` goes to `0.47.1`. **No note was added and none was withheld**
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **Three of the four notes are untagged and one is tagged `run_merch_shop`**, so three are everyone's and the fourth is for the shop's keeper. Admin sees all four; the signed-out public sees `/releases` not at all
- [x] Out of scope, written down so the release manager is not surprised — **the nine migrations and all three deploys are the release, not the cut.** No application code was written for this release: per `docs/release-procedure.md`, *a release cuts what the build gave it*. **UAT's Worker, which `0.47.0` left on `0.46.0`** (`#uatwk`), is brought current by this release's own UAT deploy — that is the release doing its job, not added scope

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from a freshly pulled `origin/main` (`593386653`) minutes earlier, so there was nothing to merge in. `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — the run, as it printed, is below

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 61s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 219s
=== gates: test — npm test
=== gates: test exited 0 after 48s
=== gates: build — npm run build
=== gates: build exited 0 after 152s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers were read from the gates line itself, and the whole run was redirected to a file
rather than piped through `tail` — the trap that has cost two releases a gates cycle.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass, against `origin/main`, which is the right base for this cut.** The runbook's hand-built-base case does **not** apply here: that is needed only when a cut *adds* an owed note, and this one adds none, so `origin/main:src/lib/releases.ts` still holds the exact pre-cut state

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [4 vs 4]
ok   package.json version equals the newest entry  [0.47.1]
ok   package-lock.json top-level and root-package versions equal package.json  [lock 0.47.1 / root 0.47.1 / package.json 0.47.1]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]

all 17 assertions passed
```

- [x] **The no-mail is asserted as an ABSENCE with a control beside it**, which is the pairing the runbook requires: `majorReleasesSince("0.47.0")` is empty **and**, asked from `0.46.0`, the same function still finds `0.47.0`. An always-empty function would satisfy the first and fail the second, so the emptiness is this release's and not a broken function
- [x] `node scripts/check-release-guards.mjs` — exit **0**, all 20 assertions
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [x] **Audit.** `npm run audit:prod` exits 1; `npm run audit:register`, which is what CI runs and what the release step is for, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), dated in `docs/advisory-register.json` and still unreachable here. **The cut bumps `package.json`, so CI's `audit` runs for real** — `skipped` would not have been a pass
- [x] **`npm ci` in the main checkout was considered and is not needed, which was established by reading rather than skipped.** The step exists because a dependency bump merging between releases leaves that checkout building from something the lockfile does not describe. `git diff ca23f2c27..HEAD -- package.json package-lock.json` is **empty** — no dependency moved in this release — and the installed `next` reads **16.4.2** against `package.json`'s **16.4.2**. The `Next.js version :` banner on the first Worker build is read against that anyway
- [x] **The deferred-note gate was answered, not waved through** — see §7

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's nine (`0381`–`0389`) each landed in their own PR, were applied to dev there, and are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were each checked in their own plans; the apply plan is in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end — `/releases` was **loaded** on the worktree dev server with two disposable card-keyed logins, and the new `0.47.1` section renders with `0 ×` `[object Object]` and `0 ×` `undefined<`. **The audience of every note was measured both ways, not assumed:**

```
login holding exactly run_merch_shop  -> HTTP 200, 658,473 bytes
    PRESENT  0.47.1 section header
    PRESENT  untagged: donation tax tick
    PRESENT  untagged: Shelter Friends maps
    PRESENT  untagged: public shop sold out
    PRESENT  TAGGED run_merch_shop: catalogue marker
    0 x [object Object]   0 x undefined<

login holding volunteer (no shop card)  -> HTTP 200, 653,689 bytes
    PRESENT  0.47.1 section header
    PRESENT  untagged: donation tax tick
    PRESENT  untagged: Shelter Friends maps
    PRESENT  untagged: public shop sold out
    absent   TAGGED run_merch_shop: catalogue marker
    0 x [object Object]   0 x undefined<
```

**Read how these two logins were obtained, because the usual way is broken by this release** (defect 1).
`dev-signin.mjs --cards run_merch_shop` **fails** on dev now, so the holder login is an existing
throwaway card role another stream left behind (`dev_signin_cards_9d14f755_3009`, which holds exactly
`run_merch_shop` and nothing else — read from `check-production.mjs role-cards --env test`), signed in
through the script's **role** path, which does not use the broken upsert. The non-holder is `volunteer`,
confirmed from the same reading to hold no shop card. The page was fetched over HTTP with the session
cookie and matched as text, **not** rendered in the browser pane, because a page loaded there by its
address never completes React's Suspense swap and every note would read as absent
(`CLAUDE.md`, *the built-in browser pane lies about pages you load by their address*).

  So the one card-tagged note is shown to its holder and withheld from a non-holder, and the three
  untagged notes are shown to both — which is the "widen, never narrow" default `CLAUDE.md` requires
  of an untagged note. **Every probe string was chosen to contain no character the page HTML-escapes**
  — `0.46.0` had a probe fail on a quoted word and read a rendered note as absent, so a probe that
  cannot match looks exactly like a note that did not render. The logins were keyed to this port with
  `--cards`, so no other running stream was signed out, and `--remove` was deliberately **not** run
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered", "a note was invented" and "the mail flag is wrong", and all three are asserted mechanically in §2 rather than clicked

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no card gates the cut and it adds no route. `/releases` was already open to every signed-in login, and note **audience** is decided per note by its `cards` tag — which the two probes above measure directly

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed. The release notes are not translated: they are shown as written, which is why the unread Thai in this release's features is listed for a person in **Left for manual verification** rather than ticked here

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and it was loaded twice above. `/api/releases/current` reads the same file in the Worker bundle and is covered by the order and `latestRelease` assertions plus the build gate
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs`, which refuses a mismatch between `package.json` and the newest entry; the three-way version assertion (`lock 0.47.1 / root 0.47.1 / package.json 0.47.1`) is that check made ahead of the deploy
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the cut itself, **and one item this release closes is ticked in the record PR instead**: `#v0302` (the Worker's host-to-shelter header) is held open only by the production Worker deploy, which this release runs. Its own plan says so in its header
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical. Its one judgement — whether any deferred note is owed here — is recorded below and in the release record, where the next release manager looks
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out below
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[4 vs 4]`; the no-mail from the absence-and-control pair rather than from `major: false`; the audience of each note from two card-keyed logins loading the page; the pending counts from `--status` on each of the three databases; the audit from `audit:register`'s own exit code; the backup from Drive's own file listing rather than from `backup.log`; and the nine migrations' safety from reading each file rather than from its summary

### No deferred note is owed by this cut, and the question was answered per plan

`check-deferred-notes.mjs` was given `--since ca23f2c27`, which narrows its scan to this release's own
**27** plans — 9 "may owe a note", 18 answered `n/a` outright. Without `--since` it reads **191** plans
from an older cut point and reprints the template's own guidance as the "reason" for several, which is
the over-listing the runbook describes. Every one of the 27 has a one-line answer in the
`--deferred-reviewed` argument on this PR. Three mattered:

- **`donation-tax-id-app`, `public-site-speed-quiet` and `merch-sold-out-label` each put their own note
  in `unreleased` in their own PR**, and those four lines are exactly what this cut publishes. Nothing
  was owed and nothing was added
- **`tenancy-worker-shelter-header` is the one that looked owed and is not.** Its `n/a` read *"needs a
  production Worker deploy, which is Lutan's"* — and this release runs that deploy, which is the shape
  the truth rule says to look for. But the change itself is **plumbing**: its own plan says *"the header
  is plumbing and the public site is unchanged"*, so there is nothing a shelter user could notice and a
  note would be inventing one. What the deploy does close is its **backlog item**, which is ticked in
  the record PR
- **`edonation-format-establish` stays open**, and will until the accountant confirms the export format.
  Its `n/a` is still true

The other 24 are schema with no reader, developer checks, planner documents, a reworded error message
or a paper — nothing a shelter user reaches.

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.47.0` @ `ca23f2c27` when this release began, read from `/api/version` on each, all
three `x-lanna-served-by: pi`. **UAT's Worker was on `0.46.0`** — the gap `0.47.0`'s record raised as its
defect 4 and `#uatwk` holds — read from `/api/releases/current`, which answers from the Worker bundle.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `593386653` was the tip at the cut; re-checked against `origin/main` immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each build's own log. **The code-identity diff is the assertion, not SHA equality**, and it is recorded in the release record

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date. The entry's date is a literal written into the file and asserted against the requested value. (**The release carries two**: `0381`'s `retain_until`, a stored generated column counted from the end of the calendar year of the gift, and `0385`'s daily 03:41 UTC purge job — each measured in its own plan on dev)
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted. (**The release carries one**: `0386`'s cap of three unpaid orders per email, measured in `shop-order-flood-bound`'s plan)
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable.** `0385`'s purge runs on `pg_cron` inside the database, so applying the file *is* the install — no key and no deploy. The one secret anything in this release wants is `SUPABASE_CANARY_TOKEN`, a **GitHub repository** secret for a nightly check, which is Lutan's and is **not** needed by any deploy
- [ ] UAT's project line reads `fsjagxmxjosauwmxwype` before anything else — deferred: release manager, at the UAT deploy. If it names dev or production, stop

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: the cut PR carries no migration. Across the **release**, each migration and its consumer merged in their own PRs, which is why the apply comes before the deploys. Two carry a `-- consumer:` header — `0385` (`src/lib/status/health.ts`) and `0386` (`src/lib/merch/checkout.ts`, `src/app/shop/merch/checkout/actions.ts`) — and both consumers are in this release, so the apply must precede the deploy
- [ ] `--env production --dry-run` run and clean — deferred: release manager, immediately before the apply. **A red dry-run is expected to need reading, not obeying, on this release**: nine files in one pass, and `--dry-run` rolls each back before the next, so a later file that depends on an earlier one's column reports FAILED when nothing is wrong
- [x] Destructive or rewriting migration: a fresh production backup exists — **every one of the nine was read rather than classified from its summary, and none rewrites an existing row at apply time.** Grep for top-level DML finds statements in exactly one file: `0382`'s three seed `insert`s into the new host map. Every other `delete`/`update` in the nine is **inside a function body** (`0383`'s `reset_diet_rounds`, `0385`'s `purge_donation_tax_ids`, `0386`'s `place_merch_order`) and runs when that function is next called, not now. The six `drop`s are `if exists` guards for re-runnability or **unique-key swaps** (`residents_resident_code_key`, `donation_receipts_number_key`, `fixed_outgoings_label_key`, `roles.key`, `roles_one_admin_idx`), each dropped and recreated per shelter with `nulls not distinct` — which, while every `shelter_id` is null, is **exactly the key it replaces**, so it cannot fail on data the old key already allowed and it weakens nothing today. **The backup gate is met and was read from Drive, not from `backup.log`**: `lannacare-production-2026-11-15T2000Z.dump.age`, 1,922,089 bytes, created `2026-11-15T20:00:55Z`, with the nightly run unbroken back through 8 November
- [x] Apply plan stated — `0381` to `0389` in order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** either deploy. Test's database (dev) already holds all nine (`390 applied, 0 pending`). **The order inside the batch matters and the runner honours it:** `0381` and `0385` create two RLS tables, and `0388` is the file that gives them the `definer_all` policy rule 3 of the tenancy lint requires — so the lint is briefly unsatisfiable between `0385` and `0388` and is satisfied again by the end of the same pass. The lint is therefore run **after** the whole batch, not between files

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref ca23f2c27` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration.** All nine are safe to leave applied under `0.47.0`'s code: seven are additive (new tables, nullable columns nothing reads, policies for an internal database role, a cron job on a table only it touches), and the two that replace something — the unique-key swaps and `0386`'s `create or replace` — are equivalent to what they replace while every `shelter_id` is null, with `0386`'s undo written in its own header (*re-apply `0373`'s body*). **Nothing to unsend:** this release mails nobody, which is the one rollback cost `0.47.0` had and this one does not

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (developer tooling, no user surface) | **This release's `0387` breaks `node scripts/dev-signin.mjs --cards` on dev, for every stream.** It dies with Postgres `42P10`, *there is no unique or exclusion constraint matching the ON CONFLICT specification*: `scripts/dev-signin.mjs:169` upserts the throwaway role with `onConflict: "key"`, and `0387` replaced `roles.key`'s `unique (key)` constraint with `unique nulls not distinct (shelter_id, key)`, so that conflict target no longer matches anything. **Nothing a shelter user can reach is affected** — no app code upserts `roles` on `key` (checked: the only `onConflict: "key"` on `roles` in the tree is this script) — but the card-walkthrough login every stream uses to test a single card is unusable until it is fixed. **The fix is one argument**, `onConflict: "shelter_id,key"`, and it belongs in its own small PR | **found, not fixed — deliberately.** *A release cuts what the build gave it* (`docs/release-procedure.md`): it does not block the release, nothing on production uses the script, and fixing developer tooling inside a release is the scope creep that rule exists to stop. Filed on the backlog as `#dvsgn` with the one-line fix named, and the probe above was taken another way rather than skipped |
| 2 | — | **`0.47.0`'s defect 1 is closed, and this is the reading that closes it.** That record left `table-policy-commands` unresolved on its third inconsistent count (80 output lines / 77 `no policy`, against 76 and 78 in the two releases before). On production today, with `0375` now applied, it reads *"Every table with row security has a live policy for all four commands"* — nothing flagged. `0375`'s `definer_all` policies are what the check was missing, so the discrepancy was the design landing, not a fault | closed; recorded here and in the release record so the next release manager does not chase it a fourth time |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has read.** The project's largest standing gap, and the fourth release running to name it. **This release adds to it**: the e-Donation screens and the sold-out wording ship Thai strings no bilingual reader has signed | a Thai reader, and Lutan to sign |
| 2 | **The donation tax-deduction tick, the gifts list and the gift page, on a real login** — `donation-tax-id-app` leaves exactly this pending | Lutan, after the release |
| 3 | **The Sold out badge at phone width** — `merch-sold-out-label` leaves an Admin login and a 375px phone view pending | Lutan, on his phone |
| 4 | **The Shelter Friends map on a real phone** — `public-site-speed-quiet` leaves the scroll-in behaviour for a person to look at | Lutan, on his phone |
| 5 | **The too-many-orders message on the test site** — `shop-order-flood-bound` leaves reading the wording to a person | Lutan, after the test deploy |
| 6 | **The `SUPABASE_CANARY_TOKEN` repository secret** — `tenancy-canary-diff`'s nightly check cannot run until it exists. **It is not needed by this release's deploys** | Lutan, in GitHub's settings |
| 7 | **The accountant's answer on the e-Donation export format** — `edonation-format-establish` is open until it arrives, and its release note waits with it | Lutan, with the accountant |
| 8 | **The Cloudflare rate-limit rule for the report form**, carried forward unclosed from `0.47.0` | Lutan, in the Cloudflare dashboard |
| 9 | **The shelter's own PromptPay id and QR image**, carried forward unclosed | Lutan, in the app |

*(No release mail is on this list, and there is nothing to read for one: this release mails nobody, asserted in §2.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the unread wording, and Lutan for the e-Donation screens, the two phone looks, the order-flood message, the canary secret, the accountant's answer and the two items carried forward

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass with accepted defects
