# Release handover — written 2026-11-07 after `0.43.5`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-07-0-43-5.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.43.5` @ `9fd7ee3e`**. `test.lannacare.org` is test on
the dev project, also `0.43.5`. **`lannacare.org` (UAT) is still mid-move to its OWN Supabase project**
(`fsjagxmxjosauwmxwype`, in a second Supabase account) and still **refuses a deploy** until Lutan fills
`.env.deploy.uat`. It runs `0.43.3` against dev. That is documented, not broken.

**`0.43.5` did NOT mail** — asserted at the cut with a control, and stated by the deploy itself
(`no major release new to production (was 0.43.4), so no email`). The public site is **still locked**
(`PUBLIC_SITE: "locked"`).

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 9fd7ee3e..origin/main`,
`gh pr list`, `--status --env production`, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**Same line as the last three editions, and it has now paid four times.** `git log --oneline -1` before
cutting, then **`--status --env production`**. On `0.43.2` it caught an unannounced domain cutover; on
`0.43.3` it came back clean; on `0.43.4` it came back with **eight** pending migrations; on `0.43.5` with
**five**, three of which rewrote card grants on production. Two commands. Run them every time.

**He asks for releases in words that decide neither the version nor the size.** *"Let's do a minor
release"* described eight notes and five migrations. **"Minor" means the MIDDLE number in his usage, which
in this repo is the shape that MAILS.** On `0.43.5` he answered *"No email"* unprompted, which settles it:
`major: false`, last number. **Never offer "major or minor" as the question — ask about the email.**

## WHAT `0.43.5` CHANGES FOR YOU

**1. Take the before-picture of the table the migration WRITES, not a table nearby.** Three of the five
migrations rewrote card grants, so `role-cards` **and** `role-cells` were both read on production first.
It paid twice, turning two things that would have been inferred from migration headers into measurements:
the reels migration really did give every meme-card holder the matching reel card, and the bills merge
really did cost nobody a permission (**no role held either retired card** — established before, not
guessed after). **Do this whenever a migration rewrites rather than adds.**

**2. `deploy-pi.sh` changed in this release and the re-exec held.** The log read
`deploy-pi: restarting under the script from 9fd7ee3e` on **both** clones, so the new guards ran on the
very deploy that shipped them and nothing needed doing by hand. **Still read that line** — when it is
absent the guards did not run.

**3. THE PI'S `guard-release` CANNOT GUARD. Do not read its silence as a pass.** It wants
`SUPABASE_ACCESS_TOKEN`, which the Pi does not have, so it prints
`WARNING: could not ask production which migrations it has applied` and carries on. The schema-before-code
guard is therefore **decorative on the Pi**. On `0.43.5` the fact it guards was established another way —
the migrations were applied from the dev machine and read back `331 applied, 0 pending` with clean drift
**before** either Pi build started. Keep doing it in that order. Backlog item: give the Pi a read-only
token or stop printing a guard line that cannot guard.

**4. OpenNext's `Building server function: default…` prints NOTHING for about six minutes.** During the
production Worker deploy the terminal sat on that one line through two long reads with no output, which
looks exactly like a stall. **It is not one.** Measure it instead of killing it:
`find .open-next -type f -newermt '-20 seconds' | wc -l` returned 63. Do that before you worry.

**4b. DO NOT PIPE A DEPLOY THROUGH `tail`.** `0.43.5` ran the test Worker deploy as
`node scripts/deploy.mjs --env test | tail -40`, which buffers everything until the process exits: ten
minutes with no visible progress, and the `strip-baked-env` line scrolled out of what was kept, so that
record cannot quote it for test. Let a deploy print in full, or send it to a file you can read as it grows.

**5. A line in `CLAUDE.md` is now stale in our favour.** It says the `role-cards-coverage` property
*"does not pass yet"*, dated 2026-10-24. On production after this release both it and the card-shaped
check that supersedes it pass. **Card-shaped:** no card in the catalogue grants nothing wherever it is
held. Someone should correct that paragraph.

**6. Two tools disagree about how many cards there are, by two.** `sync-home-icons.mjs` says **55 cards**;
`check-cards-count.mjs` passes on **fifty-three agreed cards**. Both exit 0 and nothing depends on it, but
do not quote either as "the number of cards" until someone establishes which registry each reads.

## WHAT STAYS HIS, AND WHAT THIS RELEASE COST HIM

**His, non-negotiable:** major versus minor (it mails every admin), and the **production Worker deploy**.
Everything else is yours, including the merge — **every PR merges on green, feature PRs included**
(2026-11-01). Do not wait for a go, and do not offer Auto-fix.

**`0.43.5` cost four touches against a target of two**, and only one was avoidable:

1. *"No email"* — the target answer, given unprompted.
2. The production Worker deploy — his command.
3. **The decision on twelve `pending:` test plans.** Step 3 requires it be put to him. He chose *ship and
   record the gap*. **While twelve of 22 plans wait on a person, the two-touch target cannot be met** —
   treat this as a third structural touch, not a slip.
4. **"Where is the release up to" — THE AVOIDABLE ONE.** The session ended a turn waiting on CI and
   invited him to prod it. He did. **Do not hand the CI wait back to him as a question.**

## CARRIED, UNCHANGED, RE-CONFIRMED RATHER THAN COPIED

- `STATUS_READ_TOKEN` unset **on purpose** (`#mzu7v`).
- The **UAT zone cache has still never been purged**.
- `scripts/pi/setup.sh` and `docs/pi-hosting.md` **still call `lannacare.org` production**, wrong since the
  2026-11-05 cutover.
- The **restore drill has still never been exercised**.
- **The Thai wording backlog grew by six.** Four of the eight release notes say so in their own text to the
  people who will read them — honest, not fixed. One person-hour, not a stream.
- `check-deferred-notes.mjs` still prints the template's guidance as the "reason" and still lists ticked
  lines. It **over**-lists, and under-listing is the fault it exists to prevent. One lookup per candidate.
- A red `audit` on a PR that ran it is a real finding; `skipped` is not a pass. `audit:prod` exits 1 with
  five vulnerabilities and `audit:register` exits 0 — one registered, unreachable high advisory.

**Read the live state; never accept "it's done."** It earned its place again: #1356 merged *underneath this
session* between its first PR survey and the cut, and `guard-release` reported a warning a faster read
would have scrolled straight past.

**Next free migration number: `0330`.**
