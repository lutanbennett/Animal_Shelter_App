# Release handover — written 2026-10-28 after `0.40.9`

A **delta**. The release's own facts are in `docs/releases/2026-10-28-0-40-9.md` and the durable rules
are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.9` is deployed on production and verified.** Both endpoints agree, **279 of 279** with no
drift, cache purged and proved, 33 cards and every card check clean, and the cron still healthy a day
after it was fixed.

**The one thing worth reading before your next release: do NOT run two builds in the same checkout.**
This release ran the test Worker deploy while Lutan's production deploy was building in the same
folder. Both died — his on `ENOTEMPTY` clearing `.open-next`, mine on a missing file inside it. The
runbook already says *"Two builds in one worktree collide"*; it was read that morning and done anyway.
**Deploy test AFTER production, not in parallel to save ten minutes.** Nothing was damaged (it is
gitignored build output) but it cost a ten-minute deploy and an extra touch of his.

**`doctor-cells` is no longer the red you expect — read it fresh.** Doctor now holds `medical_records`
and reads **15 cells**. Lutan is still using Doctor as his test role
(`docs/decisions/2026-10-25-doctor-is-the-test-role.md`), so **never restore its cards and never edit
the check** — but do not report a specific number from memory either.

**Re-measure before trusting any of this.** `git diff --stat 0911a1e0..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## Corrections and closures to the last edition

- **Send to hospital is HELD AGAIN. Close it.** Row 1 of Lutan's list for two releases running. The
  before-picture showed **Doctor holds `medical_records`** on production — he assigned it between
  releases, exactly the card assignment the last two editions predicted. **Stop carrying it.**
- **Test is no longer behind, and THE CRON ITEM IS NOW FULLY CLOSED — tick it, do not carry it.**
  `0.40.9` brought test up inline, which was Lutan's decision of 2026-10-28, and one quarter-hour
  after the test Worker went out the heartbeat fired `05:30:39Z` with a real run at `05:30:41Z` and
  `verdict: healthy`. Test's cron had been dead **five days**, since `2026-10-23T09:45:42Z`. Both
  environments now run adapter 1.20.13 with firing crons, so **test is a valid pre-production check
  again.**
- **`strip-baked-env` is RESTORED at 14.** `0.40.8` had no reading at all because its deploy ran
  without a `tee`; this release handed the command over with one and read **14** on both environments.
  **The streak is re-established, not continued** — `0.40.8` is a genuine gap in it.
- **The four advisories carried since 2026-10-24 are GONE**, resolved incidentally by the adapter bump
  that fixed the cron. Confirmed **by grepping each ID**. Do not carry them again.
- **One NEW advisory replaces them and must not be "fixed":** `GHSA-5j98-mcp5-4vw2`, `glob` CLI command
  injection. Not reachable (the flaw is in `glob`'s **binary**; nothing here invokes it; absent from
  the built `worker.js`), and **`npm audit fix --force` would install `@opennextjs/cloudflare@1.20.9`
  — older than the 1.20.13 that fixed the four-day cron outage.** Decision file:
  `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. **Read it before touching the audit.**
- **The OpenNext `Failed to copy` item stays CLOSED** (settled two editions ago by listing the built
  output). Do not reopen it.

## Where things stand

| | |
|---|---|
| Live, production | **`0.40.9`** — Worker `89d8e4cf` tagged `v0.40.9`, Pi at `0911a1e0`, both endpoints agree |
| Live, test | **`0.40.9`** — Worker `802ee57c`, Pi at `0911a1e0`, both endpoints agree, **cron healthy** |
| Previous release SHA, for the next range | **`0911a1e0c475208f8857002579c09b10365fd0d8`** |
| Production database | **`279 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`279 applied, 0 pending`** |
| Next free migration number | **`0279`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None**, correctly. Seventh release running |
| Cards | **33**, `cards-union` and `role-cards-coverage` both clean |
| Cron | **Healthy on BOTH** — production `05:15:12Z`, test `05:30:41Z`, both with a Worker heartbeat beside the run |

**Counters:** `npm ci` as step 1 **32**; no production-only guard **34**; **`strip-baked-env` back at
14**, with `0.40.8` a gap in the run; **Server Actions keys**: production `cbd55beae8d8`, test
`ecc41837fc0b`, unchanged.
**Releases that mailed: 1 in the last thirteen.**

## The method that keeps paying

**Read an exit code from the thing you are measuring, and this release is the sharpest case yet.**
`check-admin-by-flag.mjs --env production` prints `status 400` and `Failed to run sql query` **on
success**, because the harness rolls itself back with a `raise exception`. Its real exit is **0** and
its message begins `HARNESS-OK`. **Reading the surface would have called a pass a failure and very
likely stopped the release.** Also: the background wrapper reported the first test deploy as exit 0
when the deploy had exited **1**.

**Ask the one-way-door question before the cut, not after.** `0277` changed how Admin is recognised,
and Admin holds no cards on production, so a wrong answer locks the only administrator out of the
screen needed to fix it. Lutan was asked and chose to have Admin verified **between the apply and the
deploy**. It passed, including **with the Admin role renamed**. That is a two-minute check against a
one-way door — always worth it.

**Use the window between the apply and the deploy as a free live test.** Production spends those
minutes running the PREVIOUS release's code against the NEW functions. If a migration has broken a
permission function, it shows **then**, before anything is deployed. Here the site answered 200 and
both card checks were clean in that window.

**Keep the cut-to-deploy window empty.** The planner was asked to hold its one docs-only PR until the
cut merged. `main` did not move, the code-identity diff was empty, and no time went on working out
what the Worker had actually built from — which is what `0.40.8` paid for.

**Take the before-picture of the tables the migration writes.** Fourth release running. This time it
did more than prove nothing was lost: it is **how Send to hospital was found to be closed**.

## Two things a future release manager will meet

- **The auto-mode classifier blocks `[Production Deploy]` intermittently.** It blocked the Pi deploy
  on `0.40.8` and allowed the same command on `0.40.9`. **Try once, do not work around it, hand it to
  Lutan.**
- **Cloudflare's API can time out from this machine for minutes** (`fetch failed`,
  `ConnectTimeoutError`). Not bandwidth, not IPv6 — both measured and ruled out. **Retry; it clears.**
- **`git reset --hard` is refused by the classifier and the runbook's worktree-reuse recipe names it.**
  `git checkout -b <branch> origin/main` in a clean worktree does the same job. **Named by four
  editions now and still not corrected in `docs/release-procedure.md`** — it is one line, and it would
  take less time to fix than it has taken to keep writing down.

## In flight and open

**`release-prs.mjs` has exited 1 on three consecutive releases**, each time because a PR was
**squash-merged** and left no `Merge pull request #N` commit to match. `0.40.8` reported 7 of 9;
`0.40.9` reported 27 of 29. Each release has patched it by hand. **Three in a row is the point at
which the script should learn about squash merges** — raised with the planner for a backlog item. Until
then: **read its exit code, and when it is 1, find the missing PRs with `gh pr view` before writing a
count into a record.**

**Fifteen `pending:` plans shipped as a stated gap** on Lutan's explicit decision — the highest yet.
The trend is **5, 5, 13, 7, 13, 15**, and it is now rising rather than oscillating. Worth putting to
him as a trend question at some point, **but not as a per-release footnote and not as a decision he
owes** — he has answered it the same way seven times.

**The Translations card is still held by nobody** (`0271`, deliberately). It is the one carried item
left from the `0.40.7` list now that Send to hospital is closed.

**Carried unchanged, and RE-MEASURE EACH before repeating it:** `0257`'s stale `-- consumer:` header;
`who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the Units screen, the Pages
preview and this release's new notes; the restore drill, still never exercised and now with three more
rewritten security-definer functions behind it; and the two unlooked-at items, the prescription form
reading 4 and video playback on a real handset. **`tee` under PowerShell still writes the deploy log as
UTF-16** — `tr -d '\000'` before grepping.
