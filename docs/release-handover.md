# Release handover — written 2026-11-09 after `0.44.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-09-0-44-0.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.44.0`**. `test.lannacare.org` is test on the dev
project and `uat.lannacare.org` is UAT on its own project (`fsjagxmxjosauwmxwype`), both also
`0.44.0`. All three databases hold **348** migrations, 0 pending, no drift.

**`0.44.0` MAILED**, on Lutan's instruction given in words. It is the first release to mail since
`RELEASE_MAIL_ENV: "Production"` was corrected on 2026-11-06, so it is the proof run for `#w4k9n` (e).
What the message actually said is in the record; **read that rather than assuming the fix held.**

The public site is **still locked** (`PUBLIC_SITE: "locked"`).

**Nobody holds the two new cards.** `approve_text` (Approve public text) and `diet_settings` are given
to no role by design, and `0346` now defaults new public text to *not reviewed*. So **public text saved
from now on waits, with no holder to approve it**, until Lutan assigns the card under Settings → Who
does what. Intended, and the first thing to raise with him.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat <deployed>..origin/main`,
`gh pr list`, `--status --env production`, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**Same line as the last five editions, and it has now paid six times.** `git log --oneline -1` before
cutting, then **`--status --env production`**. On `0.43.2` it caught an unannounced domain cutover;
`0.43.3` clean; `0.43.4` eight pending; `0.43.5` five; `0.43.6` eight; `0.44.0` **four — and five
more (`0338`–`0342`) already applied that no handover had mentioned.** The pending list is not the
release's migration list. And **`--status --env uat` is a separate question**: UAT was nine behind.
Two commands, three environments. Every time.

**Ask about the EMAIL, never "major or minor".** He answered it himself this time — *"a major release
with email sent out"* — and that one sentence also pre-answered the `pending:` test-plan decision
(*"Record gaps and proceed"*), which saved the touch `0.43.6` spent on it. `major` means *worth an
email*, not semver major; the **middle** number is what a mailing release bumps until go-live.

## WHAT `0.44.0` CHANGES FOR YOU

**1. `tee` IS NOT THE LESSON. READ THE DEPLOY'S OWN EXIT CODE.** The first test Worker deploy was run
as `node scripts/deploy.mjs --env test 2>&1 | tee <log> | tail -0`. It **failed**, exit 1, and left a
**0-byte log** — and the pipeline's own status was **0**, so anything checking only the outer command
would have called it a success. The runbook already forbids `| tail`; this is the sharper form:

```bash
# wrong, twice over: tail eats the head of the log, and the pipeline hides the failure
node scripts/deploy.mjs --env test | tail -40
# right: plain redirect, then read the file and the deploy's own status
node scripts/deploy.mjs --env test > .local/deploy-test-<version>.log 2>&1; echo "EXIT=$?"
```

**2. DRIVE EVERY LONG COMMAND; DO NOT WAIT TO BE TOLD IT FINISHED.** The session started
`node scripts/gates.mjs` as a background command and then waited for a notification while **the log it
had itself written** sat on disk showing three gates green. Lutan asked twice whether anything was
holding the release up — two touches on a release whose target is two. **"Do not idle" is written
about deploys; read it as covering gates, CI and anything else that takes minutes.** For Lutan's own
production deploy, `mcp__terminal__read_terminal` with a generous `wait_for_output_ms` is the way to
follow it live.

**3. `--base` IS THE DEFAULT, NOT THE EXCEPTION.** This cut added an owed note, so plain `--verify`
would have failed *every note carried across character-identical* and *nothing invented* on
`[14 vs 13]`, with fifteen of seventeen green. Build the intended base and verify against it:

```bash
MSYS_NO_PATHCONV=1 git show origin/main:src/lib/releases.ts > <scratchpad>/base.ts
# insert the note(s) you added into that file's unreleased[], then:
node scripts/cut-release.mjs <version> <date> <major|minor> --verify --base <scratchpad>/base.ts
```

**Expect to add a note on most cuts**: three of the last four releases owed one.

**4. ANSWER A DEFERRED NOTE BY MEASURING, NOT BY READING ITS REASON.**
`profile-photo-fails-open` made its note conditional on a production orphan count.
`node scripts/check-profile-photo-orphans.mjs --env production` answered it in seconds — **0
hidden** — which closed the question instead of carrying it. Several of those reasons are written as
*conditions* a read-only script can settle. Look for that before writing "still open".

**5. THE BEFORE-PICTURE MUST BE OF WHAT THE MIGRATION WRITES, AND IT SHOULD CHANGE BY THE EXPECTED
AMOUNT.** `role-cards` would have measured nothing here — none of the four touches a role's cells. The
two that earned their place both moved by exactly the migration's claim, which is what makes them
evidence rather than decoration:

- `check-production.mjs table-policy-commands`: **72 pairs before, 71 after**, and the one line that
  vanished is `site_content: nobody can insert` — that is `0344`, and nothing else moved.
- `check-public-views.mjs --env production`: **475 `ok` before, 477 after**, zero failures either side,
  and the line-by-line diff is **only** `0345`'s two new functions, both *anon EXECUTE is refused*.
  So the nine views `0343` re-created present exactly the access they did before.

**6. `--plan` LIES ABOUT MAIL ON TEST.** `deploy.mjs --plan --env test` says *"a major release new to
this environment would be mailed to the admins"*, in an environment with no `RELEASE_MAIL` binding and
`RELEASE_MAIL_ENV: ""`. The real deploy printed `sent 0, skipped 3` with the reason. Alarming on a
mailing release and worth a backlog item; **do not act on it, and check `wrangler.jsonc` instead.**

**7. `appeal-override` NAMES A ROW YOU MUST TELL HIM ABOUT, and its exit 1 is not a stop.** One
published non-draft appeal — `"Treatment"` (closed) — for an animal not visible on the website becomes
public on its own under `0343`. That is the deliberate behaviour one of this release's notes announces.
Name it, record it, carry on.

## WHAT STAYS HIS, AND WHAT THIS RELEASE COST HIM

**His, non-negotiable:** whether it mails, and the **production Worker deploy**. Everything else is
yours, the merge included — **every PR merges on green, feature PRs included** (2026-11-01). Do not
wait for a go, and do not offer Auto-fix.

**`0.44.0` cost four touches against a target of two, and two were avoidable — both the session's:**

1. *"Let's do a major release with email sent out. Record gaps and proceed"* — the target answer,
   covering both decisions at once.
2. The production Worker deploy — his command.
3. **AVOIDABLE: "Is something holding you up".** The gates had finished three of four and the session
   was waiting on a notification rather than reading the log. See item 2 above.
4. **AVOIDABLE: "15 minutes and you haven't moved".** The same fault, still not corrected, one message
   later.

## CARRIED, UNCHANGED, RE-CONFIRMED RATHER THAN COPIED

- **`main` moved three times during this release** (#1438 and three backlog merges), so the four builds
  came from three commits. **That is expected on a release that runs long and is not a fault** — but it
  means "all four from the release SHA" would have been a false claim. The honest check is
  `git diff --name-only <cut>..<deployed>` and reading what it names; here, three markdown files.
- **The first UAT apply by a Claude session worked**, and the runbook's open question is answered: no
  permission prompt, and the env file's token won without clearing the shell's. Nine files, `0338`–`0346`.
- **The Pi's passwordless sudo genuinely covers all three services** — re-read today, all six entries.
- `STATUS_READ_TOKEN` unset **on purpose** (`#mzu7v`) — `/api/status/health` answers 401 to everyone.
- **THE PI'S `guard-release` STILL CANNOT GUARD.** It wants `SUPABASE_ACCESS_TOKEN`, which the Pi must
  not have, so it warns and carries on. **Do not read its silence as a pass.** The invariant was held
  the same way as the last four times: migrations applied from this machine and read back `0 pending`
  with clean drift on **all three** databases **before** any Pi build started. Keep that order.
- **`deploy-pi.sh` changed in this release**, so the one-deploy-late caveat applied — and
  `deploy-pi: restarting under the script from f7618c2f` **was present on every clone**, so the
  release's own guards ran on this very deploy. Read that line; do not assume it.
- `audit:prod` exits 1 with five vulnerabilities and `audit:register` exits 0 — one registered,
  unreachable high advisory (`GHSA-5j98-mcp5-4vw2`). **A cut always runs the CI job for real**, because
  it bumps `package.json`; it did, and it passed.
- **The restore drill is exercised and the risk is settled** (`#rg7pv`, 2026-11-09). Do not re-raise it.

**Read the live state; never accept "it's done."** This edition's example is the migration number: the
last handover said the next free one was `0343`, and it was `0347` within a day of being written.
**Next free migration number: `0347`** — read `git ls-tree`, never this line.
