# Release handover — written 2026-11-14 after `0.46.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-14-0-46-0.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.46.0`** — a **major release, and it mailed**.
`test.lannacare.org` and `uat.lannacare.org` are both on `0.46.0` too. All three databases hold
**376** migrations, 0 pending, **no drift either direction**. All three are served by the Pi.

**Two of the six builds came from the cut (`afc48e409`) and FOUR came from `4644759ef`** — including
Lutan's production Worker. `main` moved early (PR #1577, a planner handover). The code-identity diff
between the two commits is exactly `docs/planner-handover.md` and its test plan, and **empty outside
`docs/`**, so every build carries identical code.

**MEASURE THE SHA PER BUILD. DO NOT INFER IT FROM WHEN THE RELEASE STARTED.** A draft of this
release's record said *"five of six came from the cut"* — copied in shape from `0.45.0`, where that
was true — and it was wrong. What caught it was reading `/api/version` on all three hosts, seeing two
different SHAs, and then going back to each build log's own `built from` line.

**The public site is still `locked` on production and UAT** — read it from a deploy's binding list
(`env.PUBLIC_SITE ("locked")`), not from here.

**Re-measure before trusting any of this.** `git fetch`, `gh pr list`, `--status` on all three,
`/api/version` **and** `/api/releases/current` on all three hosts.

## TWO LOGS LIE BY BEING EMPTY, AND IT COST ME A WRONG CONCLUSION

This is the one thing in this edition most likely to bite you.

- **Lutan's own deploy log is UTF-16**, because PowerShell's `tee` writes it that way. `grep` matches
  **nothing** on a 26 KB file and prints no error. `tr -d '\000' < .local/deploy-<version>.log` reads
  it. Without that, his deploy's `built from` line and its mail line are invisible.
- **The UAT Pi's log needs `grep -a`** for the same class of reason.

**And the general rule, which I broke:** an empty result from a git or grep read is **not** a zero.
`git rev-list --count origin/main..HEAD` printed nothing in a fresh worktree; I read it as "no
commits" and removed a worktree on that basis. Nothing was lost — GitHub returns 404 for the branch,
so it was never pushed, and `worktree.mjs done` refuses a branch holding commits `origin` lacks — but
the proof came *after* the deletion. `CLAUDE.md` names this trap for `git show`; it applies to every
git read.

## THE DEFERRED-NOTE STEP WAS FREE THIS TIME, AND YOU SHOULD TRY FOR THAT AGAIN

Two releases running had to hand-build a base for `--verify`, because a cut that **adds** an owed note
makes `origin/main:src/lib/releases.ts` stop being the pre-cut state. **`0.46.0` added none.** All
thirteen notes were already in `unreleased`, each put there by the PR that closed its own step — the
release-note truth rule working as designed.

So `--verify` ran against plain `origin/main` and all 17 assertions passed first time, with
`nothing invented (note count equal) [13 vs 13]`. **Try plain `origin/main` first**; build a base only
if the count assertion fails by exactly the notes your cut added.

`check-deferred-notes.mjs` still over-lists, unchanged: **38 candidates from 137 plans** at an older
cut point against this release's **36** PRs. Seven belonged to this release and every one had already
published. Budget one lookup per candidate and put the durable answers in the cut's plan and the
record.

## WHAT COST TIME, AND ALL OF IT WAS MINE

- **A `/releases` render probe reported a note as absent for both logins.** The note contains
  `"foster"` in quotes, which the page HTML-escapes, so the literal probe could never match. **A probe
  that cannot match looks exactly like a note that did not render.** Probe on a substring with no
  quotes, apostrophes or `&`.
- **I nearly applied the migrations before the merge** to save two minutes, since all nine were
  already on `main` and did not depend on the cut. A grep for anything that *removes* access returned
  **forty hits across six files** — the shape of the `0.20.0` incident. Read in place, every one is a
  widening or the re-runnable drop-then-create idiom; but `0366` does briefly drop a function the live
  code calls, so the runbook's order (merge, pull, apply, deploy) stayed. **Keep the apply-to-deploy
  gap short rather than opening it early.**

## THINGS THAT ARE NOW ROUTINE — STOP TREATING THEM AS OPEN

- **The release mail is read from the message, not left for a person.** Second release running. One
  Gmail query gives the subject (`[Production] …`) and the sender name (`Lanna Care Production`), and
  Lutan's deploy log says `sent 1, skipped 1` independently. **Never put it on a manual list.**
- **A Claude session runs the UAT apply and nothing prompts**, and `assert-schema --env uat` answers
  from the Management API.
- **The Pi's six sudo rules are all present**; the UAT clone restarts itself, no password.
- **The three Pi builds, one at a time, all succeeded first try** with 3.4 GiB free before each.

## THE PI: THE POWER ALARM HAS GONE QUIET, SO RE-READ IT RATHER THAN CARRYING IT

`0.45.0` recorded three reboots since 11 November, one ending with no shutdown sequence and the boot
before it logging two under-voltage entries. **Since then: no further reboot.** The current boot
started 2026-11-12 14:57, has been up about two days, and logs **zero** under-voltage or throttling
entries. 873 GB free on the NVMe, 3.2 GiB RAM available.

**Still NOT ESTABLISHED** what caused the three, and still hardware and Lutan's. It is no longer an
active fault. **Re-read it next release instead of repeating the alarm.**

## A COUNT I COULD NOT RECONCILE — FOR THE PLANNER, NOT FOR A RELEASE

`0.45.0`'s record says `table-policy-commands` ended that release at **78 lines / 75 `no policy`**.
Measured before this release's applies: **74 lines, all 74 `no policy`**, reproduced twice. Between
the two readings production had **no migration applied** and the check's own code **did not change**,
and it reads only `pg_class` and `pg_policies`. One of the two figures is wrong and it is probably the
older one. **Recorded, not chased** — it gates nothing, and chasing it inside a release is the scope
creep the runbook forbids. **Say which run a figure came from, so the next one can be compared.**

## WHAT IS NOT DONE, AND IS NOT YOURS TO DO

- **The Thai reading.** Nine of the thirteen notes say in their own wording that their Thai is unread:
  the merchandise shop (three), the Cashflow income side, the website animal count, the
  report-an-animal form, the adopter/foster wording, the Bills buttons and the foundation-papers card.
  **This is the largest standing gap in the project**, and `#y1dqu` is the weekly routine for it.
- **A signed-in look at `/shop/merch` and `/services/report-animal` on production.** While the site is
  `locked` a signed-out check only ever sees the redirect, and Claude has no production account, so
  nobody has seen either page working there.
- **The phone checks** on the merchandise screens and the report form — three plans say so themselves.
- The two open steps on the **foundation document store**: no card is assigned to any role, and
  Lutan's go on the information protection. `0368` adds a third, read-only card that nobody holds
  either. `check-deferred-notes.mjs` will raise it again next release.
- The shelter's own **PromptPay id and QR image** (the donate QR, not the merchandise checkout).
- Where the **nightly backup** runs from. The gate is met from Drive —
  `lannacare-production-2026-11-13T2000Z.dump.age`, unbroken back through 8 November. **Check Drive,
  never `backup.log`**, which is 0 bytes and dated 4 October.
- ~~The DNS resolver fault~~ — **measured gone again**: a cold lookup of `api.cloudflare.com` took
  **1.06 s**, and only the router answers DNS. The warm-up prefix was not handed over, and should not
  be by default.
