# Release handover — written 2026-11-08 after `0.43.6`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-08-0-43-6.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.43.6` @ `9b07b038`**. `test.lannacare.org` is
test on the dev project, also `0.43.6`. Both databases hold **339** migrations and neither drifts.

**UAT IS LIVE AT `uat.lannacare.org` ON `0.43.6` (2026-11-08, after this edition was first written),
served by the Pi (`x-lanna-served-by: pi`) on its own project `fsjagxmxjosauwmxwype`, 339 migrations,
0 pending. `lannacare.org` and `www` now 301 to production.** The rest of `docs/uat-finalisation.md` was
done with Lutan the same day. **SUPERSEDED 2026-11-08, corrected in place:** this file said UAT's token
"lacks `database_read`". It does not: in a window without the OTHER account's shell
`SUPABASE_ACCESS_TOKEN` (`Remove-Item Env:SUPABASE_ACCESS_TOKEN`, or `env -u`), `--status`/`--drift` and
the deploy's schema check all read UAT fine. That shell token beats `.env.deploy.uat` and is the trap.
**For the next release:** UAT deploys only a released `main` (`--secrets --no-mail`, after
`apply-migrations --env uat`), and `docs/uat-finalisation.md` Part 6 is the procedure.

**ALL THREE OF UAT'S ONE-TIME JOBS ARE DONE (2026-11-09), AND THE RUNBOOK HAS BEEN CORRECTED BECAUSE OF
IT.** `#t0k9r` needed nothing — see the correction above. `#sud8p`: the Pi's sudoers now names
`lanna-care-uat`, so a UAT Pi deploy reaches its own restart instead of stopping at a password prompt
with the new version already on disk. `#prg4z`: UAT has a zone-scoped purge token. `#uq8wk`, the item
that carried all three, is closed. **`docs/release-procedure.md` was telling you to record failures that
can no longer happen** and is fixed (`#r9k2m`, PR #1409): its section is now *"What UAT needed once"*,
with the two superseded items struck through and their original text kept after *"The problem as it
was:"*. **Read the runbook, not this paragraph, at your next cut.**

**`0.43.6` did NOT mail** — asserted at the cut with its control, and stated by the deploy itself. The
public site is **still locked** (`PUBLIC_SITE: "locked"`).

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 9b07b038..origin/main`,
`gh pr list`, `--status --env production`, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**Same line as the last four editions, and it has now paid five times.** `git log --oneline -1` before
cutting, then **`--status --env production`**. On `0.43.2` it caught an unannounced domain cutover; on
`0.43.3` it came back clean; on `0.43.4` with **eight** pending migrations; on `0.43.5` with **five**,
three of which rewrote card grants; on `0.43.6` with **eight** again. Two commands. Every time.

**He asks for releases in words that decide neither the version nor the size.** *"Let's do a minor
release"* described eleven notes and eight migrations. **"Minor" means the MIDDLE number in his usage,
which in this repo is the shape that MAILS.** On the last two releases he answered *"No email"*
unprompted, which settles it: `major: false`, last number. **Never offer "major or minor" as the
question — ask about the email.**

## WHAT `0.43.6` CHANGES FOR YOU

**1. A CUT THAT ADDS A NOTE MUST BE VERIFIED WITH `--base`, AND THIS IS HOW.** The most likely thing
to go wrong next time. `--verify` compares against `origin/main:src/lib/releases.ts`, so if your cut
**added** a deferred note that is no longer the pre-cut state: the two assertions that matter most —
*every note carried across character-identical* and *nothing invented* — fail with `[11 vs 10]`, and
15 of 17 pass. **Do not wave them past;** they are the only check that catches a lost or altered note,
a cut's one real failure mode. Build the intended base explicitly and verify against it:

```bash
MSYS_NO_PATHCONV=1 git show origin/main:src/lib/releases.ts > /tmp/base.ts
# insert the note(s) you added into that file's unreleased[], then:
node scripts/cut-release.mjs <version> <date> minor --verify --base /tmp/base.ts
```

All 17 then pass with `[11 vs 11]`, and the property asserted is the real one. **`0.43.5`'s handover
said `--base` "was not needed"; that was true of a cut that wrote nothing, and it is the wrong default
to inherit.**

**2. The dry-run now explains its own non-fault, so do not investigate it.** `0336` and `0337` came
back `FAILED: relation "suppliers" does not exist`, because `0335` creates that table in the same
pending run and the dry-run rolls each file back. The script said so itself and named the files each
one runs cleanly after: **the right action on that red was to apply**, and it did.

**2b. SUPERSEDED 2026-11-09 — TEST'S EDGE CACHE IS PURGEABLE NOW, so do not carry this forward as a
gap.** `node scripts/purge-cache.mjs --env test` purges the zone serving `test.lannacare.org` and proves
it; `#pz3tk` is ticked (`claude/test-purge`). It reads the `lannacare.org` zone's credentials from
`.env.deploy.uat` rather than `.env.local`, which is why it used to refuse — a Cloudflare token does not
belong in the file every worktree and `next dev` read. **What was true and still is:** the 2026-11-06
cutover gave production its own zone, so `--env production` does **not** reach `test.lannacare.org`;
purging test is now its own command rather than a side effect of purging production. **The real exposure,
unchanged:** stale HTML pointing at an old asset name, not a stale asset — asset names are
content-hashed, which is why this has never yet shown. **So always re-run the test asset check and
believe a red one.**

**3. THE BEFORE-PICTURE IS NOT ALWAYS `role-cards`. Read the migrations and snapshot what they
write.** `0.43.5`'s handover said to take `role-cards` and `role-cells` — right for a release whose
migrations rewrote card grants, and **none of `0.43.6`'s eight did**, so copying that snapshot would
have measured nothing. The one that earned its place was **policies and the activity catalogue**,
because `0335` and `0336` create tables with their own policies and `0335` claims in its header to add
no new activity and no new card. It paid three times: that claim is true, the new tables have live
policies on all four commands (`table-policy-commands` returns the **same 72** pairs and names
neither), and no Thai column was left unreachable.

**4. `activities-grantable` exits 1 on production and it is NOT a fault list.** Ten activities answer
*"no card grants it, so only Admin can ever do it"*, and at least one — `maintenance.delete` — is there
**on purpose** (Lutan, 2026-10-28: only Admin deletes; `fault-maintenance-delete` exists to assert that
no card grants it). **Two checks therefore disagree about the same row by design.** The list was
identical before and after this release's apply, so nothing here caused it. Backlog item: make
`activities-grantable` exclude the activities ruled Admin-only, or it will keep reading as ten faults.

**5. `check-deferred-notes.mjs`'s over-listing is now described in `docs/release-procedure.md`**, where
it belongs after `0.43.4`, `0.43.5` and `0.43.6` each recorded it and carried it here instead: it
ignores the commit range you pass it, and it prints the template's guidance as the "reason". Budget one
lookup per candidate — thirteen this time.

## WHAT STAYS HIS, AND WHAT THIS RELEASE COST HIM

**His, non-negotiable:** major versus minor (it mails every admin), and the **production Worker
deploy**. Everything else is yours, including the merge — **every PR merges on green, feature PRs
included** (2026-11-01). Do not wait for a go, and do not offer Auto-fix.

**`0.43.6` cost three touches against a target of two, and none was avoidable:**

1. *"No email"* — the target answer, given unprompted for the second release running.
2. The production Worker deploy — his command.
3. **The decision on thirteen `pending:` test plans.** Step 3 requires it be put to him; he chose *ship
   and record the gap*. **While a third of the plans wait on a person the two-touch target cannot be
   met** — a fact about the test plans, not about the release.

**`0.43.5`'s fourth touch did not recur.** That one was the session ending a turn on a CI wait and
inviting him to prod it. The cure is the one in the runbook: keep working through the wait, and never
hand it back as a question.

## CARRIED, UNCHANGED, RE-CONFIRMED RATHER THAN COPIED

- **FIXED 2026-11-09, do not carry it: the Pi setup and `docs/pi-hosting.md` name production
  correctly.** `scripts/pi/setup.sh` hands the production service `lannacareforanimals.org`, and every
  `lannacare.org` left in `docs/pi-hosting.md` is a `pi.`, `test-pi.` or `uat.` hostname, which are
  different things and are correct. Done by `claude/cutover-tidy` (`f3724a2d`), read in the files rather
  than taken from the commit message. **The last edition said `lannacare.org` "is UAT"; it is not** — UAT
  is `uat.lannacare.org` and `lannacare.org` 301s to production, as this file's own opening says.
- `STATUS_READ_TOKEN` unset **on purpose** (`#mzu7v`) — `/api/status/health` answers **401** to
  everyone, re-checked today.
- **THE PI'S `guard-release` STILL CANNOT GUARD.** It wants `SUPABASE_ACCESS_TOKEN`, which the Pi does
  not have, so it warns and carries on. **Do not read its silence as a pass.** The invariant was held
  the same way as last time: the migrations were applied from this machine and read back `339 applied,
  0 pending` with clean drift on **both** databases **before** either Pi build started. Keep that order.
- **Two items this file carried have been PROMOTED into `docs/release-procedure.md` by this release's
  record PR rather than recopied again** (paperwork rule 4): OpenNext's six-minute silence on
  `Building server function: default…`, and the reason not to pipe a deploy through `tail`. Read them
  there.
- **The UAT zone cache HAS now been purged (2026-11-09, `#prg4z`)** — a zone-scoped token that cannot
  reach production's zone, and the purge proven by a re-fetch rather than by Cloudflare's own success
  flag. `node scripts/purge-cache.mjs --env uat` works; it is no longer a gap.
- **CORRECTED 2026-11-09: THE DRILL HAS BEEN EXERCISED THREE TIMES** — `#q2vp7` (local, 2026-10-13),
  `#xa1jk` (a production backup into a real Supabase project, **signed in**, 2026-10-19) and `#rg7pv`
  (into UAT's own project, 923 of 923 privileges, 2026-11-09). Lutan ruled the production risk
  **negligible**; left are 24h of data loss and the facility plan images. `2026-11-09-restore-risk-settled.md`.
- `audit:prod` exits 1 with five vulnerabilities and `audit:register` exits 0 — one registered,
  unreachable high advisory (`GHSA-5j98-mcp5-4vw2`). A red `audit` on a PR that ran it is a real
  finding; `skipped` is not a pass. **A cut always runs it for real**, because it bumps `package.json`.
**TWO THINGS THE LAST EDITION CARRIED ARE NOW FIXED, and were checked rather than taken from a commit
message.** The card-count disagreement is closed — `sync-home-icons.mjs` now prints *"N pages drawn …
This is a page count, not a card count"* and cites `cards.ts`, so there is one answer to "how many
cards" again. And `CLAUDE.md`'s *"does not pass yet"* paragraph is corrected: `grep` finds the phrase
nowhere in it. **Do not carry either forward.**

**Read the live state; never accept "it's done."** `uat.lannacare.org` is this edition's example: the
code and the runbook for the move are merged, the handover could easily have said UAT had moved, and
one `nslookup` says it has not.

**Next free migration number: `0343`** (corrected 2026-11-09: `0342` is the highest on `main`; the
number in this file was `0338`, five behind within a day of being written — read `git ls-tree`, never
this line).
