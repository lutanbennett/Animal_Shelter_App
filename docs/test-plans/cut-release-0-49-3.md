# Test plan — cut release 0.49.3

## Header

| | |
| --- | --- |
| Feature | Cut `0.49.3` — a MINOR release, so **no email to admins** |
| Branch | `claude/cut-release-0-49-3` |
| Tested SHA | filled in at deploy time by the release manager |
| Environments | dev (gates only at this stage); test, UAT and production in the deploy sections |
| Author | Claude (release manager) |
| Date | 2026-11-26 |

## 1. Scope and risk

### What this release is: 14 PRs, two notes, two migrations — and no configuration change at all

The range is `5344c037a..HEAD` — PRs **#1891 to #1904**, fourteen of them, enumerated by
`scripts/release-prs.mjs` (exit 0; two resolved from GitHub, twelve from git, 16 added
migration/test-plan files checked against the list). **Every one of the fourteen carries a test plan
and all fifteen plans in the range were read for this cut**, not counted. Two record accepted defects
(`planner-handover-774`, `shelter-membership-console`); neither is a blocker and both are stated in
their own plans.

### THE RISK THIS RELEASE DOES NOT CARRY, AND WHY THAT IS WORTH STATING

`0.49.2`'s risk was one line of configuration, and it bit: `PUBLIC_SITE` went live at the **Pi build**
while the procedure guarded Lutan's Worker deploy, and the real public website was briefly on the
internet (`#flrwh`).

**That check now exists and was run first, before anything else:**

```
node scripts/check-wrangler-var-steps.mjs --base 5344c037a85720b2ffb8ca68a3a5a99eea8b8c51
No wrangler.jsonc var changed since 5344c037a85720b2ffb8ca68a3a5a99eea8b8c51.
```

**So no guard is owed before the first Pi build of this release.** That is a measured answer rather
than an assumption, and the script that gives it was written by `#1897` in direct response to the
`0.49.2` fault.

- [x] Risk assessed — **no `wrangler.jsonc` var changed**, so nothing goes live earlier than the step
  that appears to apply it. The two migrations are additive and neither is read by live code
- [x] Boundary cases checked — `0444` returns a **count** of other shelters and never their names,
  which is Lutan's privacy line and `0443`'s specification; `0445` adds one column nothing under
  `src/` reads

### What a user will notice, which differs from last release

**Two notes, and one is for everybody.** `0.49.2` published six and all six were `admin: true`, so no
shelter user saw anything. This one publishes:

- **A plain string, for everyone** — Thai wording read by a Thai speaker: the shop page in Thai shows
  your own shelter's name instead of Lanna Care, the product pages say สัตวแพทย์ (the vet) where they
  said the doctor, and a space now separates a name from the Thai around it.
- **One `admin: true`** — a person can now work at more than one shelter, added from the console.

## 2. Automated gates

- [x] `node scripts/cut-release.mjs 0.49.3 2026-11-26 minor --verify` — **all 17 assertions passed**,
  including `nothing invented (note count equal) [2 vs 2]` and `every note carried across
  character-identical, with its role tags, same order`
- [x] **The no-mail proof, both halves.** `mail ABSENCE: majorReleasesSince(previous) is empty [[]]`
  **and** `control: from further back, an older major release is still found [0.49.0 in ["0.49.0"]]`.
  Without the control an empty answer and a broken query are indistinguishable
- [x] `node scripts/check-deferred-notes.mjs` — exit 0, **15 plans in the correct range**
  (`3465d61b..HEAD`), 4 to judge, 8 to skim, **and no false positives**. `#dfnwi`, found by the
  `0.49.2` release and fixed by #1892, is confirmed fixed: it now reads the answer rather than the
  template's own prose, and takes its range from the newest release rather than the last cut commit.
  On `0.49.2` the same command reported 35 plans and 15 maybes
- [x] `node scripts/check-release-order.mjs` — exit 0, both directions, nothing pending to prove
- [x] `node scripts/check-dev-aal2-absent.mjs` on **production** and **uat** — exit 0 each, `the
  dev-only aal2 step-up is absent from every deployed path`
- [x] `node scripts/gates.mjs` — `typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — pending: the PR does not exist at this commit. Read before merging, with
  `headSha` confirmed equal to the pushed head

## 3. Schema and data

Two migrations, `0444` and `0445`. **Both dry-ran clean on both environments** — all `ok`, with no
per-file-transaction caveat of the kind `0442` produced last release.

| File | What | Consumer header |
| --- | --- | --- |
| `0444_product_admin_access_elsewhere.sql` | For every login with a row in a shelter, how many **other** shelters it holds a live main role in. Product administrator and aal2 inside the body, like its `0438` neighbours. Reads `public.user_roles` only | `src/app/platform/access-actions.ts` |
| `0445_shelter_hosts_attach_to_worker.sql` | `shelter_hosts.attach_to_worker` — this host is attached to this environment's Worker and every deploy must re-assert it | `none` |

- [x] Both environments read **444 applied, 2 pending, zero drift** before applying (`Applied here, no
  file on origin/main: 0` on each) — so neither carries an orphan, and `#d422o`'s dev-only orphan was
  closed by #1896
- [x] `--dry-run` against UAT — both files `ok`
- [x] `--dry-run` against production — both files `ok`
- [x] No backfill in either file, so the runbook's before-picture rule does not apply. `0444` creates
  a function and `0445` adds one nullable column
- [ ] Apply plan stated — pending: stated in section 8 at apply time. **UAT first as the rehearsal,
  then production**, and the apply happens **before** any Worker deploy
- [x] **Tenancy catalogue baseline read BEFORE applying**, which is the only time it is available:
  **125 flagged (48 views, 77 functions, 0 tables missing `definer_all`), 16 allowed, 1 stale** —
  **identical on production and UAT**. Re-read after applying and record the delta
- [x] **The one stale entry is expected and is not a fault.**
  `function:public.product_admin_access_elsewhere` is allow-listed by name by #1891, in the same
  release as the `0444` that creates it, so between merge and apply the catalogue correctly reports an
  allow-list entry for an object that does not exist yet. **It should read 0 stale after the apply**;
  if it does not, that is a real finding
- [x] `0 tables missing definer_all`, down from 1 after `0.49.2` — `platform_content` is now allow-listed
  with a reason in checkable terms (16 allowed, up from 13), which is `#tnc41` being worked rather than
  counted

## 4. Functional checks

- [x] Fifteen test plans read. **Thirteen `Result: pass`, two `pass with accepted defects`**, and both
  of those were read rather than taken on the word of the Result line
- [x] `planner-handover-774`'s three defects are process findings about the handover itself — twenty-four
  streams against a rule of nine, a band 105k out, and two over-precise claims corrected before the PR.
  Nothing about shipped behaviour
- [x] `shelter-membership-console`'s one defect is a **missing** capability, not a broken one: a person
  at one shelter cannot ask to join another, deferred to the backlog for the planner
- [x] **The four `n/a` answers the guard flagged were each judged against this release's own diff**, and
  the judgement is written into the cut's `--deferred-reviewed` answer rather than left in a chat.
  `shelter-hosts-attach-flag`'s stated condition — *"until the deploy half ships"* — **was met inside
  this release** by #1904, so it was checked rather than waved through: `attach_to_worker` is read only
  by `scripts/deploy.mjs` and `scripts/lib/attached-hosts.mjs`, and `grep` finds **no reader anywhere
  under `src/`**, so no screen exists on which anyone could set it
- [ ] The two notes read correctly on `/releases` after deploy — pending: nobody has looked at the
  rendered page. They are proved present, in order and character-identical by 17 assertions, which is
  not the same as read. **One is for everybody and one is `admin: true`**, so the page must be read
  both signed in as Admin and as an ordinary login to see the difference
- [x] Role access matrix — n/a for the cut itself: it changes a version number and a note array. `0444`'s
  gate is `is_product_admin()` plus aal2 inside the function body, unchanged in kind from `0438`

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a by nature for a cut; the entry's date is `2026-11-26` and
  reads back from `/api/releases/current` after deploy
- [x] **Thai strings — this is the one release where that line is not a formality.** #1900 is a Thai
  read by a Thai speaker across 229 strings in 18 batches, and the plain-string note describes its
  outcome. The changes were made on the reader's word, not inferred
- [x] The Thai note carries สัตวแพทย์ in the note text itself, and `--verify` proved every note carried
  **character-identical**, which is the check that matters for a non-Latin string

## 6. Regression

- [x] `every earlier entry present and unchanged` and `releases are in compareVersions order, newest
  first` — both asserted by `--verify`
- [x] `package.json`, and `package-lock.json`'s top-level and root-package versions, **all three agree**
  at `0.49.3`
- [x] `unreleased` is empty after the cut, and `base unreleased was not empty` — so the cut moved
  something rather than publishing nothing
- [x] The previous release's record and the handover are untouched by this PR

## 7. Documentation

- [ ] **Release notes.** n/a: a cut PR publishes the notes other PRs wrote and adds none of its own —
  `unreleased` does not gain a line here, it is **emptied** by construction. The two it publishes were
  each written and checked in their own PR (#1900 and #1893)
- [x] `docs/release-procedure.md` was **changed since `0.49.1`**, by #1897, and the change is the one
  this release follows: the website-lock read-back moved in front of the Pi build, and
  `check-wrangler-var-steps.mjs` was added. **Read before being followed**, because a runbook that
  changed since the last release is exactly the one not to work from memory
- [x] `docs/test-plan-template.md` and `docs/release-smoke-test.md` confirmed unchanged
- [ ] Release record `docs/releases/2026-11-26-0-49-3.md` — pending: written after the deploy, as its
  own PR
- [ ] `docs/release-handover.md` rewritten — pending: rewritten with the record, in the same PR

## 8. Pre-production gate

- [x] **No `wrangler.jsonc` var changed**, so no guard is owed before the first Pi build. `0.49.2`'s
  fault cannot recur in this release, and that is measured rather than assumed
- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA, read from `deploy.mjs`'s own line — deferred: release manager
- [ ] Deployed to test, smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Three Pi builds run **serial** (4 GiB Pi, `next build` peaks above 6 GB), box pre-flighted first — deferred: release manager
- [ ] Worker deploys strictly test -> UAT -> production, production last — deferred: release manager
- [ ] UAT deployed with `--no-mail` — deferred: release manager. **UAT can mail**: `RELEASE_MAIL_ENV="UAT"` with a live `RELEASE_MAIL` binding, and its database holds production's real people, so its silence is the strongest of the three mail proofs
- [ ] `strip-baked-env: removed N env var(s)` seen in each deploy output — deferred: release manager (23 on `0.49.1` and `0.49.2`)
- [ ] Any new secret or env var exists in production — deferred: release manager. **Neither migration needs one**, and no `wrangler.jsonc` var changed, so there is nothing new to push. Confirm nothing was lost rather than that something was added
- [ ] Public pages re-checked after a cache purge — deferred: release manager. Purge **both** zones regardless; `cooperjaidee.org` is a third zone `purge-cache.mjs` does not cover
- [ ] **A signed-out visitor still gets the construction page, and `robots.txt` still refuses crawlers** — deferred: release manager. **Lanna's own `public_site` is `locked` and the floor is already `open`**, so the site is held shut by the shelter's setting alone. Before-picture: `/` 200 at 24,468 bytes with construction wording, `/adopt`, `/our-work`, `/donate` 307 to `/login`, `robots.txt` `Disallow: /`
- [ ] Timezone-sensitive behaviour on the deployed build — deferred: release manager. n/a by nature, re-confirmed by reading the entry's date back from `/api/releases/current`
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager, for the deploy sections still to come. **Read from a file, never through `| tail`** — that fault has now cost `0.49.1` and `0.49.2` one each
- [ ] Migration ordering: the apply happens **before** the deploy — deferred: release manager. `0444`'s consumer `src/app/platform/access-actions.ts` is already on `main`, so this is not optional
- [ ] Tenancy catalogue re-read after applying, and the delta recorded — deferred: release manager. Baseline **125 / 16 / 1 stale**; the stale entry should clear

### Rollback

Revert the cut commit and redeploy the previous build. `0444` is drop-the-function; `0445` is one
nullable column with no reader under `src/`, so leaving it in place is harmless. Neither migration
rewrites a row, so there is nothing to restore.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
| --- | --- | --- | --- |
| 1 | low | **`0445`'s consumer header reads `none`, and says "nothing reads this column until the #hstau app half ships" — but that half shipped in the SAME release**, in #1904, which has `scripts/deploy.mjs` read it through `scripts/lib/attached-hosts.mjs`. The header is out of date the moment the release lands | **Accepted, not corrected here.** An applied migration is never edited, and the header's check only fires for app code under `src/`, which still has no reader — so nothing is mis-gated and no warning is wrong. **For the planner to file**: whether the header should name a script consumer at all, since "none" now reads as false to a person even though it is true to the checker |
| 2 | low | **`release-prs.mjs` requires a `<since-sha>` argument and the runbook's own wording reads as though it defaults** | **Accepted, worked around** by passing `5344c037a`. Costs one failed invocation per release and prints its usage, so it is self-correcting. **For the planner to file** if it recurs |

## Left for manual verification

**This is the "note of missing test" half of the standing instruction.** Three of the fifteen plans end
with a `pending:` line, and the eight rows `0.49.2` carried are reduced to the five still open. They
are listed here so the release record carries them rather than losing them.

| # | What to check | Where |
| --- | --- | --- |
| 1 | **The two notes on a rendered `/releases`** — one is for everybody and one is `admin: true`, so the page needs reading both as Admin and as an ordinary login to prove the tag works | `/releases` |
| 2 | Lutan types the `cooper` lines and says the content is right — carried from `0.49.2`; the page appears once its heading is typed | `/platform/content` |
| 3 | Cooper's page and a feature page with a real photo, at phone width — carried; waits on row 2 | `/platform/cooper`, `/platform/features/*` |
| 4 | `/platform/shelters` at 375px, and the Access tab's new "also works at N other shelters" line | `/platform/shelters` |
| 5 | A real authenticator code on both step-up journeys — Lutan's, and outstanding for several releases. No stream has an authenticator, and `--aal2` on dev does not prove the real journey | production or test |
| 6 | Archive then restore a login holding a role at **two** shelters — `0443` and `0444` together; now reachable from the console that #1893 shipped | Settings → Security |
| 7 | The Thai wording as a Thai reader sees it **on the deployed site**, not in the dictionary file | `/shop`, the product pages |

**Rows 3 and 4 are phone-width looks that can be DRIVEN** rather than handed over — headless Chrome
with a mobile user agent through `scripts/lib/driven-session.mjs` (`#bprf7`). **Offered after the
deploy, not assumed:** Lutan declined the same offer on `0.49.1` and again on `0.49.2`, so it is
asked once and not pressed.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Every exit code and every figure read from the command itself or from a file, **never through a
  pipe** — the rule two releases have now broken

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

Manual verification by: pending: the seven rows above. Nothing in this cut PR itself needs a person's eyes — the version bump and the note array are proved by 17 assertions  Date: 2026-11-26

### Result

Result: pass
