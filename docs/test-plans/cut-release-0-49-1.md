# Test plan — cut release 0.49.1

## Header

| | |
| --- | --- |
| Feature | Cut `0.49.1` — a MINOR release, so **no email to admins** |
| Branch | `claude/release-0-49-1` |
| Tested SHA | filled in at deploy time by the release manager |
| Environments | dev (gates only at this stage); test, UAT and production in the deploy sections |
| Author | Claude (release manager) |
| Date | 2026-11-25 |

## 1. Scope and risk

### What this release is: 22 PRs, four visible notes, and three migrations

The range is `9fc01bdc6..HEAD` — PRs #1855 to #1876, 22 of them, enumerated by
`scripts/release-prs.mjs` (exit 0; 3 resolved from GitHub, 21 checked for added migration and
test-plan files). Every one of the 22 carries a test plan, and all 22 plans were read for this
cut rather than counted.

**The risk in this release is not the notes, it is the three migrations**, and two of them are
new access surface for the product console. They are covered in section 3.

### The four notes, and who sees them

```
1. Recent changes marks a change made by someone outside your shelter          admin: true
2. The CooperJaidee product site now has a page for each of its subjects       admin: true
3. When you add several video clips to a reel at once, the page warns you      (everyone)
4. Pressing Home as Admin on a phone now opens Settings                        admin: true
```

Three of the four are `admin: true`, so they show only on `/releases` and only to Admin. Note 3
is the one note every shelter user sees, and it is the picker warning that came out of the fault
Lutan reported on 2026-11-23 (`#rlprg`).

### Minor means NO MAIL, and that is what was asked for

Lutan's instruction, verbatim: *"lets do a minor release no email, take not of gaps in test"*. So
`major: false`, the last number bumps, and the proof that no mail will go is an assertion in the
verify, not an inspection — see section 2.

**The gap-noting half of that instruction is section "Left for manual verification"**, which is
the deliverable he asked for, not an afterthought.

## 2. Automated gates

- [x] `node scripts/cut-release.mjs 0.49.1 2026-11-25 minor --verify` — **all 17 assertions passed**
- [x] **mail ABSENCE proved, both directions.** `mail ABSENCE: majorReleasesSince(previous) is empty [[]]` and its control `from further back, an older major release is still found [0.49.0 in ["0.49.0"]]`. The control is what stops the absence being a broken query
- [x] Four notes carried across character-identical, with role tags and order — `nothing invented (note count equal) [4 vs 4]`
- [x] `unreleased` empty after the cut; `package.json`, lock top level and lock root package all read `0.49.1`
- [x] `npm run audit:register` — exit 0, 1 high advisory (`GHSA-5j98-mcp5-4vw2`, glob CLI command injection), registered and still unreachable
- [x] `check-deployed-hosts.mjs` — test, UAT and production all ok; every deployed address has an `/auth/callback` entry. (`--env dev` is not a thing: the script takes test, uat or production, and said so)
- [x] `check-dev-aal2-absent.mjs` — production and UAT both: the dev-only aal2 step-up is absent from every deployed path
- [x] `check-release-order.mjs --worker-deployed 9fc01bdc6f2f1e7c9bb556ba4117ba39aa20dda9` — production and UAT, both directions, nothing pending
- [x] `check-deferred-notes.mjs` — exit 0, reviewed in full below
- [ ] `node scripts/gates.mjs` — pending: run on the cut branch before the PR
- [ ] CI green on the PR — pending: the PR does not exist at this commit

### The deferred-note review, and a correction worth recording

**The guard lists 12 plans that MAY owe a note and 8 others for a skim — not six.** The first
pass at this answer read the list through `tail -6`, wrote "all six", and was wrong about both the
count and which set it described. Nothing wrong reached disk, because `--deferred-reviewed` is a
gate and is not persisted; the corrected reading is here, which is where it belongs.

Of the 12 that may owe a note, **three are paid by this release's own notes**:

| Plan | Owed? |
| --- | --- |
| `admin-home-role-chips` | **Paid** — note 4 is exactly that change, `admin: true` |
| `product-site-pages` | **Paid** — note 2 |
| `product-pages-five` | **Paid** — note 2 covers the five further pages and the menu |

The other nine owe nothing, and each for a reason that holds: `backlog-waiting-state`,
`proof-line-who` and `proof-line-run` are internal pages and planner scripts nobody using the app
reaches; `onboarding-runbook` is documentation; `record-0-49-0` is a release record and is not
served; `console-host-live` and `shelter-name-columns` are product-console-only and the production
site floor is still locked, so nothing visible changes; `platform-own-signin` waits on a
production `site_url` step that this release does not close.

**The reels pair is the only interesting one.** `reels-batch-upload` and `reels-batch-metadata`
both answered *"the real three-clip upload is still pending, so no note promises it works yet"* —
and that step **closed during this cycle**: Lutan uploaded three clips from his phone and reported
back. But the code they describe shipped in an earlier release, so a note here would announce
something already live. What this release carries instead is note 3, the picker warning, which is
this cycle's new code.

**`reel-clip-progress` ships with no note on purpose**, and this is the release-note truth rule
working rather than a slip: the per-clip progress fix was never shown working in a browser, so no
note may promise it. It is recorded under "Left for manual verification" instead.

## 3. Schema and data

Three migrations are pending on **both** production and UAT. All three were read in full for this
cut, not skimmed from their names.

| File | What it does | Risk |
| --- | --- | --- |
| `0436_product_admin_set_shelter_site.sql` | one definer function to set a shelter's `public_site` to open/locked/off | low — the deployment floor `PUBLIC_SITE` still wins where it is more closed |
| `0437_shelter_one_name_typed_once.sql` | keeps `name`/`display_name`/`short_name` in step, plus a **backfill** | **rewrites rows** — see the before-picture |
| `0438_product_admin_shelter_access.sql` | list/add/change/archive a shelter's logins from the product console | **new access surface** — see the two checks below |

### The before-picture for 0437, taken because it rewrites rather than adds

The runbook requires a read-only before-picture of the table a rewriting migration writes, kept.
The backfill is two statements, lines 60-61, and both are **NULL-or-blank only** — neither can
overwrite a value somebody typed:

```sql
update public.shelters set display_name = name            where display_name is null or btrim(display_name) = '';
update public.shelters set short_name   = left(name, 60)  where short_name   is null or btrim(short_name)   = '';
```

Read with `scripts/check-shelter-settings.mjs --env production` and `--env uat` before applying:

- **Production**: one shelter, `lanna`. `display_name` already `"Lanna Care for Animals"` (the check flagged only `short_name`, so `display_name` matched what it expects). `short_name` is a typed `"LCA"`.
- **UAT**: one shelter, `lanna`, and the check flagged **neither** name column, so both are populated.

**So both backfill statements match zero rows on both environments: a row-rewriting migration that
rewrites nothing.** That is the best available answer and it is why no backup step is claimed below.

- [x] Before-picture taken and recorded above, on both environments, before applying
- [ ] `--dry-run` against production — pending: run in the deploy section, before the apply
- [ ] `--dry-run` against UAT — pending: run in the deploy section, before the apply
- [ ] Apply plan stated — pending: stated in section 8 at apply time
- [x] Production backup for a destructive migration — n/a: additive functions, and the one backfill writes zero rows on both environments as measured above

### 0438 does not breach the card rule, and this was checked rather than assumed

The hard-coded-security rule says only a card may grant the ability to do something. 0438 lets a
product administrator change **which existing role** a login holds, so it was read against that
rule specifically:

- [x] **It never writes `roles`, `role_cards` or `card_grants`.** Grepped for insert/update/delete against all three: no hits. The only table any of the six functions writes is `user_roles` (lines 88, 91, 113, 128)
- [x] **No function creates a role, edits a role, or touches a card** — so a role is still exactly the set of cards it holds, and this adds no way to change that
- [x] **Every function is gated**: 6 `is_product_admin()` calls across the 6 functions, plus aal2 inside each definer body
- [x] **No lock-out**: a change that would leave the shelter with no live login holding its Admin role is refused with 23514. Admin holds no cards, so losing the last Admin login is the one-way door this guards
- [x] Remove is an **archive** (`user_roles.archived_at`), not a delete; audit comes from the existing `record_audit()` trigger on `user_roles` (0195)

### The tenancy catalogue, baselined before applying

`check-tenancy-catalogue.mjs --env production` is **report-only and always exits 0** — it cannot
fail a build. Baseline taken before applying anything: **123 flagged (47 views, 76 functions, 0
tables missing `definer_all`), 7 allowed by name, 0 stale.**

- [x] Baseline recorded above
- [ ] **Seven new definer functions are NOT on the allow-list** and neither 0436 nor 0438 carries an `alter function … owner to` line, so they keep the connecting role: `product_admin_set_shelter_site`, `product_admin_shelter_roles`, `product_admin_shelter_access`, `product_admin_access_would_lock_out`, `product_admin_access_add`, `product_admin_access_set_role`, `product_admin_access_remove` — pending: re-read the count after applying and record the delta. **Not a blocker**: the lint is report-only, 123 are already flagged, and each new function is gated inside its own body. **Filed as a backlog item**, because an entry with a reason in checkable terms is the thing that catalogue exists to hold

## 4. Functional checks

- [x] `/releases` renders the new entry — verified by the cut's own assertions (newest entry, `latestRelease`, compareVersions order)
- [ ] The four notes read correctly on `/releases` after deploy — pending: read on production after the deploy
- [x] Boundary cases checked — n/a: a cut moves an array and bumps three version fields; no date, length or banding logic

### Role access matrix

n/a: a release cut changes no card, no role and no policy. The three migrations' own access is
covered in section 3, against cards rather than roles.

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour proved — n/a: the release date is a string the cut is given, not computed
- [x] Thai strings unaffected by the cut — n/a: no copy changed in this PR. (The Thai in note 2's pages is a gap below, on its own plan)

## 6. Regression

- [x] Every earlier release entry present and unchanged — asserted by the verify
- [x] Release order and `latestRelease` correct — asserted by the verify
- [x] No `[object Object]` or `undefined` in the new entry — asserted by the verify

## 7. Documentation

- [ ] **Release notes.** n/a: a cut PR publishes the notes other PRs wrote and adds none of its own — `unreleased` does not gain a line here, it is **emptied** by construction. The four notes it publishes were each written and checked in their own PR
- [x] `docs/release-procedure.md`, `CLAUDE.md` and `docs/release-smoke-test.md` confirmed unchanged since `0.49.0`, so the runbook this release follows is the one that was followed last time
- [ ] Release record `docs/releases/2026-11-25-0-49-1.md` — pending: written after the deploy, as its own PR
- [ ] `docs/release-handover.md` rewritten — pending: rewritten with the record, in the same PR

## 8. Pre-production gate

- [x] Baseline read before touching anything: all four hosts answered `0.49.0 @ 9fc01bdc6` on **both** `/api/version` and `/api/releases/current`, all `x-lanna-served-by: pi`
- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test, smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Three Pi builds run **serial** (4 GiB Pi, `next build` peaks above 6 GB) — deferred: release manager
- [ ] Worker deploys strictly test -> UAT -> production, production last — deferred: release manager
- [ ] UAT deployed with `--no-mail` — deferred: release manager. **UAT can mail**: `RELEASE_MAIL_ENV="UAT"` with a `RELEASE_MAIL` binding, and its database holds production's real people
- [ ] `strip-baked-env` seen in each deploy output — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager. **Production's zone alone went stale on `0.49.0`** and needed a purge; test's and UAT's passed first time, and why production differed is still not established
- [x] Any new secret or env var exists in production — n/a: none added by this release
- [x] Every PR in the release has a test plan — all 22 read for this cut, not counted

### Rollback

Revert the cut commit and redeploy: `releases.ts` returns to `0.49.0` and the four notes go back to
`unreleased`. For the migrations, 0436 and 0438 are drop-the-functions (take-out only archives, so
nothing is lost); 0437 is re-apply 0414's and 0424's function bodies, and its backfill wrote zero
rows, so there is nothing to undo.

## Defects found

| # | What | Where | Status |
| --- | --- | --- | --- |
| 1 | Seven new security-definer functions carry no tenancy-catalogue entry, and neither migration re-owns them | `0436`, `0438` | **Filed on the backlog.** Not a blocker: the lint is report-only and exits 0, 123 objects are already flagged, and every new function is gated by `is_product_admin()` and aal2 inside its own body |
| 2 | `console-shelter-access.md` reached `main` with no `Result:` line and 23 unticked boxes | that plan | **Not a defect after reading it.** Every unticked line carries a reason and most are `deferred: release manager` — this release's own work. Its `Result:` is written when those lines are ticked |

## Left for manual verification

**This is the "gaps in test" half of the instruction.** Nine of the 22 plans end with a `pending:`
line, and they are listed here so the release record can carry them rather than losing them.

| # | What is outstanding | Whose | Why it could not be closed here |
| --- | --- | --- | --- |
| 1 | **Several clips uploaded from a phone, watching the clip rows** | Lutan | `reel-clip-progress` and `reel-picker-warning`. **This is the fix for the fault he reported**, and the progress half ships with no release note because of it |
| 2 | Thai copy on the five new product pages read by a Thai speaker; pages seen on a phone | a Thai reader | `product-pages-five`. He read and approved the Thai on `product-site-pages` ("Yes, it reads well"); these five are different pages |
| 3 | The console Website tab at phone width, and its wording | a person | `console-host-live` |
| 4 | The "Outside the shelter" badge at phone width | a person | `audit-outsider-change` |
| 5 | The product console tab bar in a real browser | a person | `product-console-build` |
| 6 | Create a shelter in the console and read its names back | a person | `shelter-name-columns` — the one that exercises 0437's function path |
| 7 | The UAT rehearsal | Lutan | `platform-own-signin` |
| 8 | A second Google account on dev | environment | `drive-reconnect-guard` — not anybody's eyes, a missing test account |
| 9 | The signed-out row, and 375px, on the shelter-access tab | a person | `console-shelter-access` |

**Rows 3, 4, 5 and 9 are phone-width and browser looks that can be driven rather than handed over** —
`admin-home-role-chips` in this same release closed its phone landing that way, in headless Chrome
with a mobile user agent (`#bprf7`). Driving them after the deploy is the right next step, and it is
offered rather than assumed.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Exit codes read from the command itself, never through a pipe
- [ ] Gates and CI — pending: run on the cut branch

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

Manual verification by: pending: the nine rows above, and the post-deploy read of `/releases`. Nothing in this cut PR itself needs a person's eyes — the version bump and the note array are proved by 17 assertions

### Result

Result: pass
