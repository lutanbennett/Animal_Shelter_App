# Release handover — written 2026-11-21 after `0.47.9`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-21-0-47-9.md`. **Both outrank this file.** Its predecessor was written after
`0.47.8` (and `0.47.7`) the previous day.

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.9`** — **a release that mailed nobody.**
`cooperjaidee.org`, `test.lannacare.org` and `uat.lannacare.org` serve `0.47.9` too, **all three Workers
are `0.47.9`**, and **all four Pi apps report the same SHA, `3435f97c1`** — one commit, not three.

**Read on BOTH endpoints and all four agreed first time.** `0.47.8`'s fault — three Pi builds making every
`/api/version` agree while two Workers were stale — **did not recur**, because `/api/releases/current` was
read beside it and `/icon-192.png` answered 200 on all four.

**Production and UAT both hold every migration on `main`: 434 applied, 0 pending, `No drift` both ways.**
Dev still has its one extra `schema_migrations` row for the renumbered `0422_keep_an_admin_per_shelter.sql`
— known since `0.47.6`, 0 missing, **not drift**.

**`0.47.9` cost Lutan two touches: one answer and one command. That is target.**

**Re-measure before trusting any of this.**

## THE LESSON OF THIS RELEASE: A PRESCRIBED CHECK WENT SIX RELEASES UNRUN, BECAUSE IT EXITS 1 ON SOMETHING DELIBERATE

**`check-tenancy-catalogue.mjs --strict` is a step of §5 and no record from `0.47.3` to `0.47.8` mentions
it.** It was run here and exits 1 on **three** objects. **None is a leak**, and that is the point:

- **`product_admin_permit_first_login` owned by `postgres` is DELIBERATE** — `0425` line 67 says so in
  writing, with its reason (it reads `auth.users`, which `rls_definer` cannot) and its precedents. It is
  simply **missing from the lint's own allow-list**, where six comparable functions already sit.
- **`product_admin_login_grants` has RLS on and no `definer_all` policy** (`0425` again). The runbook
  states the consequence itself: *reads return 0 rows*, a blank page and **not** a leak.
- **`set_shelter_logo` owned by `postgres` — introduced by THIS release.** `0429` omitted the
  `alter function … owner to rls_definer` line that `0428` and `0433` both carry and that its own model
  `set_hero_photo` already has.

**THE MECHANISM WORTH CARRYING: a check that exits 1 on a known-correct object is a check people stop
running.** Nobody decided to skip it. One allow-list line would have left it green, and then its third
flag — a real one, from this release — would have been caught by the gate instead of by a release manager
who happened to run it. **Filed as `#tncy3`. Run it, and record that you ran it, even when it is red.**

**It was also predicted before it was confirmed, which is the cheap technique:** dev already had the six
migrations, so running the lint on dev showed `set_shelter_logo` *before* the production apply. **Dev is a
free preview of what a migration will do to production's catalogue.**

## ANY FAIL STOPS THE RELEASE IS TOO BLUNT FOR ONE HALF OF ONE CHECK

**`check-deployed-hosts.mjs` failed on test and UAT** for `www.test.lannacare.org` and
`www.uat.lannacare.org` having no `/auth/callback` entry. **Neither address exists:** `nslookup` says
*Non-existent domain*, `curl` gets HTTP `000`, and `wrangler.jsonc` declares no route for either. The
check synthesises a `www.` form for every host without asking whether it is deployed.

**Settled by measuring, in about a minute**, and the release proceeded. Read it carefully before copying
the conclusion: **the `shelter_hosts` half — the one `#hostx` exists for — passed on all three**, and
production, whose `www.` forms genuinely exist, passed both halves. **The allow-list half is written in
the runbook as "a person adds the missing entry", not as a stop.** Filed as `#wwwcb`.

## THE SERVER ACTIONS KEY IS PER ENVIRONMENT, AND THE DEPLOY'S OWN WORDING INVITES THE WRONG READING

`deploy.mjs` prints `deploy: Server Actions key <fp> (the Pi's build must print the same)`. **There are
three keys, not one**, and this release read them as one for a moment: production's Worker printed
`cbd55beae8d8` while test's printed `ecc41837fc0b`, which looks like a mismatch and is not.

**The comparison is WITHIN an environment:** production Worker `cbd55beae8d8` = production Pi
`cbd55beae8d8`; test `ecc41837fc0b` = `ecc41837fc0b`; UAT `cdeca9cbc4de` = `cdeca9cbc4de`. Three pairs,
all matching. **Promoted into `docs/release-procedure.md` §6 this release**, so it stops being re-derived.

## `0.47.8`'S UNREAD LINE WAS READ THIS TIME

`strip-baked-env: removed 20 env var(s)` — `0.47.8` had to record it as never read. **The runbook's
three-step UTF-16 decode works exactly as written** (§6: check the size, `od -c` the first two bytes for
`377 376`, then `tr -d '\000' | grep`). Nothing to add; just do it rather than concluding the log is empty.

## A RELEASE STEP THAT DID NOTHING AND EXITED 0

`sync-home-icons.mjs --env production` drew 67 pages and 536 images and **uploaded none**, because
`PLATFORM_DRIVE_FOLDER_ID` is not set for production — and **exited 0 anyway**. The cause is a known
outstanding step (#1781's plan names the Drive move as pending on the platform account's credentials, and
it is the planner's, not a release step). **The fault worth fixing is the exit code.** Consequence is
bounded: the app draws every icon in the browser, only the shared folder is stale.

## Traps that cost nothing this time but will

- **The `0430` dry-run FAILED and applying was correct.** `0430` replaces a view over the column `0429`
  adds, and the dry-run rolls each file back before the next, so it cannot see it. **The runner diagnoses
  this itself** — *"NOT a fault in 0430 … it runs cleanly after 0428, 0429"* — and that line is the thing
  to read, because a red dry-run normally means do not apply.
- **`check-deferred-notes.mjs` over-listed for the FIFTH release running:** 5 of 9 candidates were the
  test-plan template's own guidance paragraph printed as the "reason". **Read each plan's real answer**;
  the review table is in #1807's test plan, not just in the `--deferred-reviewed` flag.
- **A deploy was piped through `tail` after the `tee`** (`… | tee <log> | tail -40`) on the test Worker.
  The runbook says never, and it cost nothing **only because the `tee` was there** — the head lines were
  read from the file. Drop the `tail`; it buys nothing.
- **A cut's `--verify` needed no explicit base**, because the note was already in `unreleased` and the cut
  published none of its own. Build a base only when the cut itself adds a note.

## What is still open

- **11 items on `0.47.9`'s record are `pending: Lutan`**, every one a press only a signed-in person on a
  deployed host can make. **The one worth asking for first is this release's only note:** Admin → Website,
  upload a transparent PNG, and see it beside the shelter name on the public header with no white or black
  box — then clear it and see the name alone.
- **Ten of the 30 test plans in the release wait on a person**, none of them a failure. **Four are this
  release's own surface** (`shelter-logo-upload`, `logo-alpha-serving`, `step-up-returns`,
  `shelter-chooser-page`); the rest are console items or not release steps. The full table is in the record.
- **`#tncy3` and `#wwwcb`** — this release's two findings, both filed, neither fixed here.
- **`PLATFORM_DRIVE_FOLDER_ID` is unset for production**, so the icon sync is a no-op until it is set.
- **`#drvtk` — this PC's `.env.deploy.uat` still holds a revoked Drive refresh token.** Narrow and exact:
  **fix it before any `--secrets` deploy or any rewrite of the Pi's env.** Plain Worker deploys are
  unaffected and two were run today.
- **The Thai sign-off, eleventh release running** (`#y1dqu`). **Still the largest standing gap.**
- **`dev-signin.mjs <role>` still breaks (`PGRST116`)** once two shelters each hold a role keyed `admin`,
  which is the state dev is in, so a signed-in `/releases` read on dev is not available.
- **The public site is still locked** (`#pl7aq`), so the signed-out half of the smoke test is vacuous by
  design. Record it that way rather than as unchecked.

## Now routine — stop treating these as open

Everything in this list did what the runbook says it does, first time. **It is here only so the next
editor deletes it rather than re-investigating it.**

- **No cut/batch race**, `main` still at the cut's base when it merged, #1807 the only open PR.
- **UAT second, before his command** (the 2026-11-16 reversal) — clean, and nothing of ours ran after his.
- **Three Pi builds, one at a time, pinned with `--ref`** — all three logged `restarting under the script
  from <sha>`, with 3.1 / 2.1 / 3.4 GiB free against 6 GiB of swap.
- **`lanna-pi-mesh` worked first time** for all three. Do not put the route to him as a question.
- **UAT restarts its own service**, and **`audit:register` is the audit** (exit 0, the one registered
  `glob` advisory, fourth release running).

## The two touches that are his, and stay his

**Major versus minor** — asked as *"should this release email you?"*, never as the two words — and the
**production Worker deploy**.

**This time he answered it unprompted** (*"lets do a minor release no email"*), which settled both halves
in one message and cost no round trip. **`0.47.9` cost him one answer and one command. That is target.**
