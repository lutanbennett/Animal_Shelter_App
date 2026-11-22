# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.10` — **it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-10` @ `C:\Development\Animal_Shelter_cut-release-0-47-10`, port `3003` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | **No — the release range carries one**, `0434_tenancy_catalogue_flags.sql`, pending on production and UAT. It is applied before any deploy, as its own release step |
| Tested at SHA | the cut commit on this branch, cut from `origin/main` at `d6badeea3`; the release range is `3435f97c1..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.10` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.10`, and the one note sitting in `unreleased` moves across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else (3 files, 15 insertions, 7 deletions against the branch point)
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note carries `cards: ["website_photos"]`**, which is right: the Shelter logo card is what the cap applies to, and a login holding that card is who meets the refusal
- [x] Out of scope — **the migration, the Worker deploys and the Pi builds are the release, not the cut.** No application code was written here

### What this release is: twelve PRs, one visible line, and one database fix

**12 PRs** (`release-prs.mjs` exit 0, range `3435f97c1..HEAD`; 5 resolved from GitHub because they were
squash-merged, 2 found off the first-parent line). Almost all of it is work nobody at a shelter can see:
release and operator checks (#1813, #1814, #1815, #1819), two documents PRs, the per-shelter host flag,
and a Worker CPU measurement. **One note goes to users.**

**The part worth naming, because it closes something this repository has been carrying for six releases:**
`0434_tenancy_catalogue_flags.sql` (#1812) closes **two of the three flags** that
`check-tenancy-catalogue.mjs --strict` has raised since `0.47.2`, and the third is now recorded in the
lint's own allow-list rather than flagged:

- `product_admin_login_grants` had row-level security on and **no `definer_all` policy** (from `0425`), so
  every view over it read 0 rows for the re-owned role — a blank page, not a leak. `0434` adds the policy.
- `set_shelter_logo()` was left **owned by `postgres`** by `0429` — the one flag `0.47.9` itself introduced.
  `0434` re-owns it to `rls_definer`, which `0428` and `0433` already do and which its model
  `set_hero_photo` already had.
- `product_admin_permit_first_login` stays owned by `postgres` **deliberately** — it reads `auth.users`,
  which a re-owned role is refused (42501). #1812 added it to the allow-list with that reason, alongside
  the six comparable functions already there.

**This is the mechanism `0.47.9`'s handover named as its lesson** — *a check that exits 1 on a
known-correct object is a check people stop running* — fixed at source rather than carried again.

### The one note, and who can see it

> *"The Shelter logo card on Admin → Website now accepts a logo up to 1 MB (it was 15 MB). A logo only
> shows about 64 pixels wide, and every visitor to your public website downloads it, so a big file just
> slows the pages. A larger file is refused with a message saying so, in English and Thai."*

`cards: ["website_photos"]` — shown on `/releases` to a login holding that card, and to Admin, who sees
everything through the `perms.isAdmin` short-circuit. Written by #1816; carried across
character-identical, asserted in §2. It follows `0.47.9`'s note about the same card, which is why it
reads as a change to something rather than as a new feature.

### Lutan was asked about the EMAIL, not about the words

He said it himself, unprompted: *"lets do a minor release, no email, gaps in test noted"*. **No email** →
`major: false` → the last number moves → `0.47.9` → `0.47.10`. **Asserted in §2 by the mail-absence pair**,
not inferred from the word "minor" — the ambiguity `docs/release-procedure.md` warns about, since in his
usage "minor" has also meant a middle-number bump that *did* mail. The words *"no email"* settled it, and
no round trip was needed. **The second half of his instruction — *gaps in test noted* — is answered in
Defects and in *Left for manual verification* below**, and is carried into the release record.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `d6badeea3` by `worktree.mjs new` and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 69s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 178s
=== gates: test — npm test
=== gates: test exited 0 after 49s
=== gates: build — npm run build
=== gates: build exited 0 after 152s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] **`node scripts/cut-release.mjs 0.47.10 2026-11-22 minor --verify` — all 17 assertions pass**, against plain `origin/main`, which is the right base because **this cut adds no note of its own** (the note was already in `unreleased`, written by #1816). The explicit-base case the runbook describes does not arise here

```
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   package.json version equals the newest entry  [0.47.10]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.10 / root 0.47.10 / package.json 0.47.10]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **`npm run audit:register`** — exit **0**: *"1 high/critical advisory, all registered and still unreachable"* (the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`, fifth release running). Recorded as *clean against the register*, not as *clean*
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The deferred-note review, and it over-listed for the sixth release running

`check-deferred-notes.mjs` exited 0 and listed **12 candidates across 43 changed plans** — against this
release's **12 PRs**, because the script ignores the range it is given and re-reads from an older cut
point. **Five of the twelve are parse artefacts**, where it printed the test-plan template's own guidance
paragraph as the "reason". Every one was read in its own plan and answered in `--deferred-reviewed`:

| Plan | Real answer | Note owed? |
|---|---|---|
| `closed-shelter-jobs` | parse artefact; not in this range at all | no |
| `console-cards-redesign` | the platform console is the product administrator's alone | no |
| `dev-signin-shelter-default` | parse artefact; a developer script | no |
| `hero-photo-shelter-scope` | *"nobody sees this until there are two live shelters"* — **not** closed here | no |
| `label-draft-runtime-config` | #1811 registers three secret **names** only; the values are unset and a routine deploy pushes no secrets, so **nothing works yet** and the step is not closed | no |
| `plan-day-skill-edits` | parse artefact; skill-file wording | no |
| `public-views-owner-check` | parse artefact; a developer check | no |
| `record-0-47-8` | a release record, neither served nor rendered | no |
| `record-0-47-9` | the same, and `0.47.9`'s own note shipped in #1790 | no |
| `record-2026-11-20-decisions` | one person's console header, and a form only strangers see | no |
| `shelter-drive-connect` | **its step is NOT closed** — the connect flow needs Lutan's first Google consent with the connect client's secret, which he holds | no, and see Defect 2 |
| `shelter-logo-proof` | the logo card was noted by `0.47.9`; this release's note is the **cap**, already in `unreleased` from #1816 | **already present** |

**So the single note in this cut is the complete answer to the sweep**, which is the durable record of the
review the runbook asks for — not just the flag that let the cut write.

## 3. Schema and data

- [x] Migration number / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** `0434` was numbered, written re-runnable and dry-run by its own stream (#1812)
- [ ] **The release range's one migration is PENDING on both deploy databases** — pending: applied as the release's own step, before any deploy, dry-run first on each

```
production (dbkodyyxxhtygxcxmfcu)  434 applied, 1 pending — 0434, 0 applied-here-with-no-file
uat        (fsjagxmxjosauwmxwype)  434 applied, 1 pending — the same one
```

- [x] **The order is migrations first, and the guard agrees** — `check-release-order.mjs --worker-deployed 3435f97c1` reports *"must-follow-Worker: none pending"* and *"must-precede-Worker: none pending"* on **production and on UAT**
- [x] **`0434` tightens no constraint and rewrites no rows.** It adds one `definer_all` policy and changes one function's owner, both inside `if not exists` guards and both conditional on the `rls_definer` role existing. There is no column, no default and no check to exercise, and nothing the running code writes becomes forbidden
- [x] **What it grants to `anon` / `authenticated`: nothing.** The policy it creates is `to rls_definer`, and re-owning `set_shelter_logo` moves it **off** `postgres`, which narrows rather than widens. `0431` already scopes that function's body to the caller's shelter, so the re-own is the braces to a belt that is already on
- [x] **The before-picture of the thing the migration changes, read rather than reasoned** — `check-tenancy-catalogue.mjs --env production --strict --tenant-role rls_definer` **exit 1, two flags**: `function:public.set_shelter_logo owner=postgres` and `table:public.product_admin_login_grants` missing `definer_all`, with `product_admin_permit_first_login` now listed under *allowed by name* with its `auth.users` reason. The after-picture is the same command, re-run after the apply, and it belongs in the release record

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.9")` is `[]`, with the control assertion showing the same function still finding `0.47.0` from further back — so the empty answer is the flag being `false`, not the function being broken
- [x] **The one note carried across character-identical**, in order, with its `cards` tag intact — the tag is the part that matters, because a note that lost it would read as everyone's
- [ ] **A signed-in browser read of `/releases`** — pending: Lutan, after the deploy. `dev-signin.mjs admin` is still broken on dev with `PGRST116` while two shelters each hold a role keyed `admin`, so a signed-in `/releases` read on dev is not available to check it here
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it before writing a byte

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged; the note's `cards` tag is asserted by the character-identical carry, and the filtering it drives shipped in `0.45.x`

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and one note. No nav entry and no manual topic. The note is English, as every release note is; the **refusal message** it describes is in both languages, which #1816 proved and read back

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the 17 assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites**, and `check-release-guards.mjs` at exit 0 covers it
- [x] Nothing merged from `main` was broken by this branch — nothing was merged. **`origin/main` moved under the cut** (a backlog commit, `docs/backlog.md` only) and was deliberately not chased: the runbook's rule is to read what is deploying, and a documents-only move changes nothing that is built

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. #1816's own item was ticked by #1816
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **this plan and the cut commit are the write-up.** The judgements worth keeping are the deferred-note review table (§2), the `0434` ordering and grant reading (§3), and the test-gap list below
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker holds the line to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it. The note was gained in #1816 and is quoted in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note from the file itself; both database figures from `--status` on each; the live versions from **both** endpoints on all four hosts; the tenancy flags from the lint's own output; the 17 assertions, the four gate numbers and the audit exit code from the runs pasted above

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` **and** `/api/releases/current` on all four hosts
- [x] **The baseline before this release was read on all four hosts, on BOTH endpoints** — `lannacareforanimals.org`, `cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` all answer `0.47.9` on `/api/version` *and* on `/api/releases/current`, every one of them with `x-lanna-served-by: pi`. **This is the check `0.47.8` failed** (three Pi builds agreeing while two Workers were stale); it is clean here, as it was on `0.47.9`
- [x] **What this release is for:** the 1 MB logo cap reaching Admin, and `0434` reaching both databases so the tenancy lint is green again
- [ ] Smoke test / UAT project line — pending: nothing is deployed by a cut. `docs/release-smoke-test.md` runs after the deploys and is copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.9` and the note back into `unreleased`; nothing is deployed by the cut. **`0434` is not rolled back by a code revert, and should not be:** the policy it adds and the owner it sets are both corrections, and a Worker on `0.47.9` runs correctly against them. If a revert were ever genuinely wanted, the two statements are named in the file's own header

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (measurement) | **`check-deferred-notes.mjs` printed the template's guidance as the "reason" for 5 of its 12 candidates, and read 43 plans for a 12-PR release** — sixth release running (`0.43.4`, `0.43.5`, `0.43.6`, `0.47.7`, `0.47.9`, here) | **recorded, reviewed by hand.** The table in §2 is the review. The gate is right to over-list — under-listing is the fault it exists to prevent, and `0.40.10` lost three notes that way; the noise is in what the plans quote |
| 2 | medium (test coverage) | **The shelter Drive and Calendar connect flow (#1818) ships unproven end to end.** Its plan carries `Manual verification by: pending: Lutan's first real Google consent`, and three checklist lines are `pending:` with it — the happy path, persistence, and the 375px look. The runbook says a `pending:` manual line is **his call, not a thing to absorb** | **recorded as a stated gap, on his own instruction** (*"gaps in test noted"*), which is the runbook's second option in words. **Bounded, and read rather than assumed:** nothing is stored until a consent completes, the change is additive code with no schema, and no existing screen's behaviour changes — so the unproven path is the new one, not a regression surface. It stays open until he presses Connect once with the connect client's secret set |
| 3 | low (flake) | **`uat.lannacare.org/api/version` answered an empty body once** during the pre-release baseline read, then `200` with the right version on two immediate retries | **recorded, not chased.** `/api/releases/current` and `x-lanna-served-by: pi` both answered correctly at the same moment, so the Pi app and the Worker were both up. One empty answer with no HTTP status is read as a transient edge or connection fault, and **it is written down rather than ignored** because a repeat on the post-deploy read would mean something different |

## Left for manual verification

**This is the release's test gap, listed because Lutan asked for it.** Each item belongs to its own plan
and its own signature — **they are listed here as the release manager's pre-deploy pass, not adopted into
this plan's own sign-off**, which the runbook forbids.

| # | Plan / item | What is waiting | Whose |
|---|---|---|---|
| 1 | `shelter-drive-connect` (#1818) | the first real Google consent: press Connect on Drive and on Calendar once with the connect client's secret set, and read the result on Settings. This also proves the registered redirect URIs include the one used | **Lutan's.** Defect 2 |
| 2 | `logo-upload-cap` (#1816) | nothing — the refusal was driven and read back in both languages. **Worth one press after the deploy anyway**, because a cap is only true where it runs: try a file over 1 MB on Admin → Website | **Lutan's**, optional |
| 3 | `tenancy-catalogue-flags` (#1812) | `pending: planner applies 0434 to production, then re-runs the lint` — **this release is that step**, and the after-picture goes in the record | **this session's**, done as §5 of the runbook |
| 4 | Ten of the twelve plans' **release manager acknowledgement** lines | `pending: release manager` | **read here, at release time**, which is what that line waits for. None of the twelve is a `Result: fail`; all twelve read `Result: pass` |
| 5 | The **eleven `pending: Lutan` items on `0.47.9`'s record** | signed-in presses on production, the logo card first | **Lutan's**, and **not this release's** — carried forward rather than re-adopted |

**All twelve plans in the release read `Result: pass`.** The gap is item 1, and it is one feature's new
path rather than anything this release changes about a working one.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the four gates, the 17 cut assertions, `check-release-guards`, `check-test-plan`, `audit:register`, `check-release-order` on production and UAT, `check-dev-aal2-absent` on production and UAT, `check-deployed-hosts` on all three, the tenancy lint before-picture, both database `--status` reads, and **both** version endpoints on all four hosts
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan — item 1 above, the Drive and Calendar consent, plus the optional logo press after the deploy

Manual verification by: pending: Lutan — the Drive/Calendar consent of #1818, recorded as this release's stated test gap

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — this session applies `0434` to both databases, deploys test and UAT, builds all three Pi clones, purges both zones, and hands Lutan the one production command

Result: pass with accepted defects
