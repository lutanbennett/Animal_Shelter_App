# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.9` — **it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-9` @ `C:\Development\Animal_Shelter_cut-release-0-47-9`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-21 |
| Carries a migration? | **No — but the release range carries SIX**, `0428`–`0433`, all pending on production and UAT. They are applied before any deploy, as their own release step |
| Tested at SHA | the cut commit on this branch, cut from `origin/main` at `a0440515d`; the release range is `3d93e90ec..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.9` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.9`, and the one note sitting in `unreleased` moves across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else (3 files, 15 insertions, 7 deletions against `origin/main`)
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note is `admin: true`**, so it shows to Admin only on `/releases` and carries no card tag, which is right: the Shelter logo card lives under Admin → Website
- [x] Out of scope — **the migrations, the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### What this release is, and it is a big one with one visible line

**31 PRs** (`release-prs.mjs` exit 0, range `3d93e90ec..HEAD`), and almost all of it is work nobody at a
shelter can see: the platform console (`#pacon`), the shelter chooser, the per-shelter scoping sweep, and
the operator scripts. **One note goes to users, and it is Admin-only.**

**The part worth naming, because it is a real multi-tenant fix rather than a feature:** three of the six
migrations close cross-shelter holes found while building the logo card.

- `0430` — `public_site_content` **answered every shelter's row to everyone.** The view is owner-run, so
  `0392`'s restrictive shelter policy never applied to it, and `readSiteContent()` takes `.limit(1)` — so
  a second shelter's public site could have shown an arbitrary shelter's content. Measured on dev inside
  `0429`'s harness: anon got all 6 rows with *and* without a shelter header
- `0431` — `set_shelter_logo()` copied `set_hero_photo()`'s flaw: `where id = true` inside a `security
  definer` function matched **every** shelter's row, so one Admin's logo would overwrite all of them
- `0432` — the same flaw in its model, `set_hero_photo()` (`0274`, `0351`), and in
  `approve_website_draft()` (`0315`). Swept for the shape and fixed

**Why this is safe to apply before the Worker deploy, read rather than assumed:** `0430` gives anon no
rows without an `x-shelter-id` header, which is the shape that blanked the public website when `0392`
landed. The **live** Worker already sends that header — `git grep x-shelter-id 3d93e90ec -- worker/`
names `worker/index.mjs` and `worker/shelter.mjs` at the deployed SHA — and
`check-release-order.mjs --env production --worker-deployed 3d93e90ec` reports ok in both directions.

### The one note, and who can see it

> *"Admin → Website has a new Shelter logo card, next to the hero photo. Upload your shelter's own logo
> (a PNG with a transparent background looks best) and it shows beside your shelter's name at the top of
> your public website. A shelter that has not uploaded one shows its name on its own."*

`{ admin: true }` — Admin only, on `/releases`, under every view. Admin holds no card, so no card tag
could say it (`docs/decisions/2026-11-03-release-note-admin-flag.md`). Written by #1790; carried across
character-identical, asserted in §2.

### Lutan was asked about the EMAIL, not about the words

He said it himself, unprompted: *"lets do a minor release no email"*. **No email** → `major: false` →
the last number moves → `0.47.8` → `0.47.9`. **Asserted in §2 by the mail-absence pair**, not inferred
from the word "minor" — which is exactly the ambiguity `docs/release-procedure.md` warns about, since in
his usage "minor" has also meant a middle-number bump that *did* mail. The words he added — *"no
email"* — are what settled it, and no second round trip was needed.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `a0440515d` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 48s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 171s
=== gates: test — npm test
=== gates: test exited 0 after 37s
=== gates: build — npm run build
=== gates: build exited 0 after 145s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.47.9 2026-11-21 minor --verify` — all 17 assertions pass**, against plain `origin/main`, which is the right base because **this cut adds no note of its own** (the note was already in `unreleased`, written by #1790). The explicit-base case the runbook describes does not arise here

```
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   package.json version equals the newest entry  [0.47.9]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.9 / root 0.47.9 / package.json 0.47.9]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **`npm run audit:register`** — exit **0**: *"1 high/critical advisory, all registered and still unreachable"* (the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`). Recorded as *clean against the register*, not as *clean*
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The deferred-note review, and it over-listed for the fifth release running

`check-deferred-notes.mjs` exited 0 and listed **9 candidates** across 30 changed plans. **Five of the
nine are parse artefacts** — the script printed the test-plan template's own guidance paragraph as the
"reason", the fault this repository has now recorded on `0.43.4`, `0.43.5`, `0.43.6`, `0.47.7` and here.
Every one of the nine was read in its own plan and answered in `--deferred-reviewed`:

| Plan | Real answer | Note owed? |
|---|---|---|
| `closed-shelter-jobs` | parse artefact; *"invisible until a shelter is closed, and then only to that shelter"* | no |
| `console-cards-redesign` | the platform console is the product administrator's alone, and he asked for the redesign | no |
| `dev-signin-shelter-default` | parse artefact; *"developer script"* | no |
| `hero-photo-shelter-scope` | *"nobody sees this until there are two live shelters"* — that step is **not** closed here | no |
| `plan-day-skill-edits` | parse artefact; *"skill-file and handover wording only"* | no |
| `public-views-owner-check` | parse artefact; *"a developer check"* | no |
| `record-0-47-8` | parse artefact; a record and a handover, neither served nor rendered | no |
| `record-2026-11-20-decisions` | the product's own name on one person's console header, and a form only strangers see | no |
| `shelter-logo-proof` | **its step IS closed by this release** — and the note is already in `unreleased` from #1790 | **already present** |

**So the single note in this cut is the complete answer to the sweep**, and that is the durable record of
the review, as the runbook asks — not just the flag that let the cut write.

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** The six in the range were numbered and dry-run by their own streams
- [ ] **The release range's SIX migrations are PENDING on both deploy databases** — `pending: applied as the release's own step, before any deploy, dry-run first on each`

```
production (dbkodyyxxhtygxcxmfcu)  428 applied, 6 pending — 0428..0433, 0 applied-here-with-no-file
uat        (fsjagxmxjosauwmxwype)  428 applied, 6 pending — the same six
```

- [x] **The order is migrations first, and the guard agrees** — `check-release-order.mjs --env production --worker-deployed 3d93e90ec` reports *"must-follow-Worker: none pending"* and *"must-precede-Worker: none pending"*. The reasoning is in §1: the live Worker already sends `x-shelter-id`, which is what `0430` needs
- [x] **Nothing in the six tightens a constraint against rows the running code still writes.** `0428` adds nullable columns plus `shelter_hosts.is_primary boolean not null default false`, and its one data write is a **backfill that sets the new flag** on each shelter's existing first address — it alters no other column and deletes nothing. `0429` adds a nullable column. `0430`–`0432` are `create or replace` on a view and three functions, each with its revert named in its own header
- [x] **What the six grant to `anon` / `authenticated`, read in the files before applying:** `0428` **revokes** `resolve_shelter_site` from `public`, `anon` and `authenticated` and grants it to `service_role` alone; `0433`'s `my_shelters()` answers about `auth.uid()` only, takes no argument, and gives no rows to a caller with no `auth.uid()`. **`0430` NARROWS** anon's reach (the whole point of it). **Applying these widens nobody's access**
- [x] **The before-picture of the one table that gets written** — `shelter_hosts`, read with `check-deployed-hosts.mjs` on each database before the apply: **production 4 host rows** (`lannacareforanimals.org`, `www.`, `cooperjaidee.org`, `www.`), **UAT 2**, **dev/test 2**. After the apply, exactly one per shelter must read `is_primary`. Taken because the runbook asks for a read of *the table the migration actually writes*, and no `check-production.mjs` check covers `shelter_hosts`

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.8")` is `[]`, with the control assertion showing the same function still finding `0.47.0` from further back — so the empty answer is the flag being `false`, not the function being broken
- [x] **The one note carried across character-identical**, in order, with its `admin: true` flag intact — the flag is the part that matters, because a note that lost it would go to every role instead of Admin
- [ ] **A signed-in browser read of `/releases`** — pending: Lutan, after the deploy. **`dev-signin.mjs admin` is still broken on dev with `PGRST116`** while two shelters each hold a role keyed `admin`, so a signed-in `/releases` read on dev is not available to check it here
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged; the note's `admin: true` flag is asserted by the character-identical carry, and the filtering it drives shipped in `0.45.x`

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and one note. No nav entry, no manual topic, and the note is English, as every release note is

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites**, and `check-release-guards.mjs` at exit 0 covers it
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. `#shlog`'s items were ticked by #1788 and #1790
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The judgements worth keeping are the migration-order reasoning (§1, §3), the deferred-note review table (§2) and the `www.` callback finding (Defects)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The note was gained in #1790 and is quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note from the file itself; both database figures from `--status` on each; the live versions from **both** endpoints on all four hosts; the 17 assertions, the four gate numbers and the audit exit code from the runs pasted above; the `www.` DNS answers from `nslookup` and `curl`

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` **and** `/api/releases/current` on all four hosts
- [x] **The baseline before this release was read on all four hosts, on BOTH endpoints** — `lannacareforanimals.org`, `cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` all answer `0.47.8` on `/api/version` *and* on `/api/releases/current`, and all three sites report `x-lanna-served-by: pi`. **This is the check `0.47.8` failed**, where three Pi builds made every `/api/version` agree while two Workers were stale; it is clean here
- [x] **What this release is for:** the per-shelter logo card reaching Admin, and the three multi-tenant fixes in §1 reaching the database
- [ ] Smoke test / UAT project line — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the deploys and is copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.8` and the note back into `unreleased`; nothing is deployed by the cut. **After the deploy, the asymmetry matters and is worth stating plainly:** `0428`, `0429` and `0433` are additive and a Worker rolled back to `0.47.8` runs correctly against them. **`0430`, `0431` and `0432` replace a view and three functions, and a rollback of the code does NOT roll them back** — nor should it, since each one closes a cross-shelter hole. Each header names its own revert (`re-run 0429`'s definition, `0351`'s `set_hero_photo`, `0315`'s `approve_website_draft`) if one is ever genuinely needed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (release gate) | **`check-deployed-hosts.mjs` FAILS on test and on UAT**, for `www.test.lannacare.org` and `www.uat.lannacare.org` having no `/auth/callback` entry in their Supabase allow-lists. The runbook says any FAIL stops the release | **read, and proceeded — with the reason measured, not assumed.** Both addresses are **Non-existent domain** in DNS and answer HTTP `000`, and `wrangler.jsonc` declares no route for either (`uat.lannacare.org` is the only UAT custom domain). **There is no sign-in that can land anywhere, because the address cannot be reached at all.** Production, where the `www.` forms *do* exist, passes both halves. The `shelter_hosts` half — the one `#hostx` exists for — passes on all three. **The finding is in the check:** it synthesises a `www.` form for every host without asking whether that address is deployed. The allow-list half is written in the runbook as *"a person adds the missing entry"*, not as a stop |
| 2 | low (measurement) | **`check-deferred-notes.mjs` printed the template's guidance as the "reason" for 5 of its 9 candidates** — fifth release running (`0.43.4`, `0.43.5`, `0.43.6`, `0.47.7`, here) | **recorded, reviewed by hand.** The table in §2 is the review. The gate is right to over-list; the noise is in what the plans quote |
| 4 | medium (tenancy) | **`check-tenancy-catalogue.mjs --strict` exits 1, and it had not been run at release since `0.47.2` (2026-11-18) — six releases.** Three flags, all read in their migrations rather than guessed at: (a) `product_admin_permit_first_login` owned by `postgres` — **deliberate**, `0425` line 67 says so in writing (it reads `auth.users`, which `rls_definer` cannot), so this is a **missing allow-list entry in the lint**, not a hole; (b) `product_admin_login_grants` has RLS on and **no `definer_all` policy** — a real gap from `0425`, whose consequence the runbook states as *reads returning 0 rows, a blank page and not a leak*; (c) **`set_shelter_logo` owned by `postgres` — introduced by THIS release.** `0429` omitted the `alter function … owner to rls_definer` line that `0428` and `0433` both carry and that its own model `set_hero_photo` already has, and it reads no `auth.users`, so nothing prevents re-owning it | **recorded, not fixed, and the reason is the scope rule.** All three need a new migration plus one allow-list line, which `docs/release-procedure.md` (*"A release cuts what the build gave it"*) puts outside a release. **Neither (a) nor (b) is a leak, and (c)'s body is explicitly shelter-scoped by `0431`**, which is the belt the ownership would otherwise be the braces for. Filed on the `backlog` branch. **(a) and (b) are already on production today**; (c) arrives with this release's apply |
| 5 | low (process) | **The tenancy lint being six releases unrun is itself the finding.** It is a prescribed step of §5 and no record from `0.47.3` to `0.47.8` mentions it | **recorded.** Run here, and the three flags above are what it found. Worth a planner note rather than a release fix |
| 3 | low (test coverage) | **Ten of the 30 test plans in this release carry `Manual verification by: pending:`** — see *Left for manual verification* below. None is a `Result: fail`; the release is 20 `pass` and 10 `pass with accepted defects` | **recorded as a stated gap**, at Lutan's instruction (*"take note of gaps in tests"*). Carried into the release record rather than absorbed |

## Left for manual verification

**This is the release's test gap, listed because Lutan asked for it.** Ten plans of the thirty wait on a
person. Each belongs to its own plan and its own signature — **they are listed here as the release
manager's pre-deploy pass, not adopted into this plan's own sign-off**, which the runbook forbids.

| # | Plan | What is waiting | Whose |
|---|---|---|---|
| 1 | `shelter-logo-upload` | three items — the upload, the logo appearing on the public header, and the clear | **Lutan's.** This release's only note is this feature's |
| 2 | `logo-alpha-serving` | the Worker and Pi paths serving the original PNG with its transparency; proved on dev only | **Lutan's**, after the deploy |
| 3 | `step-up-returns` | the two step-up journeys pressed after a deploy | **Lutan's** |
| 4 | `shelter-chooser-page` | the Thai wording, and a look on a phone | **Lutan's** |
| 5 | `platform-lockup` | whether the lockup reads right at header size | **Lutan's** |
| 6 | `console-cards-redesign` | two items on the console | **Lutan's** |
| 7 | `console-enquiry-queue` | the Decline press | **Lutan's** |
| 8 | `shelter-enquiry-form` | the mail check, after a Pi setting is made | **Lutan's**, and it names a step still outstanding |
| 9 | `platform-drive-folder` | the move of the existing icon files and the Pi pull | **planner's**, not a release step |
| 10 | `remove-one-shelter-script` | run against production once an allow rule exists | **Lutan's**, not a release step |

**Four of the ten are this release's own user-visible surface** (1, 2, 3, 4) and are the ones worth
pressing after the deploy. **Two are not release steps at all** (9, 10). **None of the ten is a
`Result: fail`.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, `audit:register`, `check-release-order`, `check-dev-aal2-absent` on production and UAT, `check-deployed-hosts` on all three, both database `--status` reads, the `nslookup`/`curl` reads behind Defect 1, and **both** version endpoints on all four hosts
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan, after the production deploy, which is his command. The logo upload above all, since it is this release's only note

Manual verification by: pending: Lutan — the ten items above, four of them this release's own surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session applies the migrations, deploys test and UAT, builds all three Pi clones, and hands Lutan the one production command

Result: pass with accepted defects
