# Planner handover — edition `765`, 2026-11-19

**This is a DELTA against `764`.** It says what changed, corrects its predecessor, and reports what `764`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE ELEVEN STREAMS MERGED SINCE `764`:** #1731, #1733, #1734, #1735, #1736, #1737, #1738,
#1739, #1740, #1741, #1742. **ALL ELEVEN HAVE FIGURES, and one of them is deliberately NOT a band
reading** — see the figures table. `764` itself (#1732) is a handover PR and does not count.
**Written at eleven rather than nine** because three merged while it was being written; #1742
`platform-console-finish`, the most consequential PR of the day, merged at 16:01Z with this document
already drafted, and **this paragraph and the figures below were corrected rather than left stale.**

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored. There were **eight** `/plan-day` runs on 2026-11-19.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **`worktree.mjs list` will show `onboarding-runbook-steps` as `UNMERGED WORK`.** It is not.
   `git diff --stat origin/main...` is **EMPTY** — PR #1705 squash-merged. **`done` refuses it and
   `--force` does not override. LUTAN SAID *"Leave it"*. Do not raise it again.**
4. **Read the repository AFTER the pull, not before.**
5. **PRODUCTION NEEDS FOUR MIGRATIONS BEFORE ITS NEXT DEPLOY — SEE THE NEXT SECTION. Do not let a
   release go out without them.**

## THE THING THAT MUST NOT BE MISSED: PRODUCTION OWES `0418` TO `0421`, IN ORDER

**The operator console already ships live, and its writes FAIL without them.** #1742's own words:
*"Apply 0418 to 0421 in order before the deploy."* Dev has all four. **This is the first item on the
next release's list**, ahead of anything else, and it is the planner's to put in front of whoever cuts
it.

**Production is on `0.47.4` and `main` is now ELEVEN streams past it.** `unreleased` is empty and
`package.json` says `0.47.4`, so **`deploy.mjs` would NOT refuse** — it would put live code under a
version label whose record does not describe it. **A release must be cut first.**

## THE aal2 WALL CAME DOWN, AND DRIVING THE SCREEN IMMEDIATELY FOUND SIX BROKEN WRITES

**`764` left the aal2 wall as the planner's question to Lutan. He was asked with three honest options
and chose a dev-only step-up path.** #1736 built it: `node scripts/dev-signin.mjs <role> --aal2` enrols
and computes its own TOTP factor. **Measured:** `aal2` in the token, `amr totp+password`.
**Nothing is enrolled on production, and `scripts/check-dev-aal2-absent.mjs` was run by the planner
against production AND UAT — both pass**, with six static proofs including *no migration after `0411`
alters either aal2 policy across 418 files read*.

**THEN #1742 DROVE THE PRESSES AND THAT IS WHERE THE VALUE WAS.** Seven of eight driven at `aal2`
(the step-up return needs a human to type a code). **Driving found SIX console writes broken for a
product administrator, which no SQL proof had caught:**

- **The mechanism:** the `0392` restrictive `shelter_scope_*` policies read the `x-shelter-id` REQUEST
  HEADER **and apply to `security definer` owners too**. A product administrator's request names no
  shelter on the platform host, or a different one on dev. **So Create shelter, Add starting content,
  Set receipts, Remove address, Give Admin role and Link login were all refused** — and the checklist
  **read every other shelter as empty**, showing Drive *"not connected"* for a shelter whose sign-in had
  merely stopped.
- **Why nothing caught it:** `0416`'s harness ran as the **service role**, which the policies do not
  bind. **A harness that passes as the service role proves nothing about a request.**
- **The fix (`0419`-`0421`):** each function scopes its own transaction to the shelter it works on,
  **after** the existing `is_product_admin()` check, then restores the header. Nobody is granted
  anything and a product administrator does not become a trusted caller. **Read by the planner before
  merging, at the stream's own request.**

**THE LESSON TO CARRY: a proof run as the service role is not a proof of a request.** It is the same
shape as the Drive hinge — the thing nobody had pressed was the thing that was broken.

## A CI TRAP THAT WILL BITE AGAIN: DECLARATIONS ARE PER MIGRATION FILE

**#1742 went red on `hard-coded-security` while changing no permission at all.** Eight
`security definer` product-admin functions were re-created by `0418`-`0421`, and
`docs/hard-coded-security-registry.json` declares a definer **per migration file**, not per function.
**Re-creating a declared function in a new migration re-declares it, and the check fails until the new
file has its own entry.**

- **It is NOT a sign anything was weakened.** Every one of the eight checks `is_product_admin()` first
  and raises `42501` otherwise; PADMIN sits outside the card system by Lutan's decision of 2026-11-18.
- **The remedy is in the check's own message:** declare it under `database.declared` with a reason.
  `0416` and `0417` set the precedent; #1737 added six the same way.
- **The stream fixed its own red** (commit *"Declare 0418-0421's product-admin functions…"*). The
  planner had read the SQL and was about to add the same eight when its guard refused to touch a file
  that had moved. **Re-read a PR's head before acting on a reading taken minutes earlier.**

## FIGURES — ELEVEN STREAMS, TEN BAND READINGS, AND ONE THAT IS NOT ONE

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `onboarding-script-faults` | #1731 | 145-175k | **146,724** | inside |
| `release-handover-check` | #1733 | 143-170k | **142,284** | under by 716 |
| `new-shelter-absent-rows` | #1734 | 150-185k | **185,010** | **over by 10 — at the top** |
| `exit-code-faults` | #1735 | 150-185k | **160,329** | inside |
| `dev-aal2-path` | #1736 | 175-210k | **172,705** | under by 2,295 |
| `product-admin-state-schema` | #1737 | 165-195k | **194,376** | **inside** |
| `script-fault-sweep` | #1738 | 150-185k | **204,421** | **OVER by 19,421** |
| `product-admin-console-app` | #1739 | 200-250k | **230,744** | inside |
| `stocktaking-silent-save` | #1740 | 146-175k | **146,071** | inside, 71 above its floor |
| `script-exit-debt` | #1741 | 155-190k | **182,558** | **inside** |
| `platform-console-finish` | #1742 | 180-215k | **278,160** | **NOT A BAND READING — `rescoped=yes`** |

**Ten of the eleven matched their band's `@dials` and were `compacted=no rescoped=no finished=yes`.**

**#1742 IS RECORDED, MARKED, AND KEPT OUT OF EVERY REVISION, AND THE REASON IS NOT A TECHNICALITY.**
Its own comment says `rescoped=yes`, and the job really did change size under it: briefed as
`migration=none, may need one`, it **wrote four** and, in its own words, *"the eight presses did turn
into an investigation (three defects)"*. **A figure from a job that grew is evidence about the brief,
not about the band** — counted in, it would read a screen-finishing stream as under-priced by 63k and
inflate every later band for work that never needed it. **The planner did not correct this brief
mid-flight; the stream judged its own rescope and said so, which is the mechanism working.**
**Its floor (87,854) is still comparable and is counted below.**

**THE FLOOR, ELEVEN READINGS: 86,761 · 86,822 · 87,046 · 87,164 · 87,630 · 87,769 · 87,769 · 87,834 ·
87,846 · 87,854 · 91,147.** **TEN inside 1,093 tokens; the eleventh is 91,147.** `764` recorded seven
with one at 90,094; `763` nine
with one at 90,375. **Three complete days now agree on the SHAPE: a tight band at ~86.8-87.9k with a
rare excursion near 90-91k, not a uniform `~86-90k`.** **Narrow the floor row and record the excursions
as rare. DO NOT shift the scale rows with it.** **The excursion is NOT "long session":** #1739 had the
most messages of the day (143,580) and an ordinary floor, while #1738's 113,274 gave 91,147.
**Unexplained; recorded rather than theorised.**

### `764`'S CORRECTION HELD, DECISIVELY

`764` recorded a **failed** revision: a schema half priced below its row on a specification discount came
in 3.8k over, and the correction drawn was **a specification discounts the DISCOVERY, not the DESIGN.**
`product-admin-state-schema` was banded **165-195k on that correction, deliberately above** the
"nothing left to discover" row, and its brief said either result would count. **It came in 194,376 —
inside, 624 under the top. On the discounted row it would have overrun by ~29k, and it did MORE than its
brief asked and still landed inside.** **Confirmed on its first test.**

### AND A BAND OF MINE MISSED BY 19.4k, THEN THE CORRECTION FIRED THE SAME DAY

**`script-fault-sweep` was banded 150-185k off the AUDIT row** — *"the length of the list does not move
this"* — **and came in 204,421.** **That line is true of an audit and FALSE of a sweep that CONVERTS
each item:** 33 exit sites read one at a time, 15 edited, two checks built and fixtured, is *reads very
widely and edits many call sites* (185-250k). **The revision was written into the next stream's brief
before its reading existed, and `script-exit-debt` came in 182,558 — inside 155-190k.** **Fired.**
**Revision: a sweep that EDITS is not an audit. Only an untouched read stays on the audit row.**

### THE `+10k` FOR LOOKING STILL HAS NO VERDICT

#1734 came in **ten tokens over the top** — neither hit nor miss — **and never drove the one
interaction its band allowed for.** **Not a confirmation. Still waiting on another looking-not-driving
stream.**

## WHAT `764` LEFT OWED, AND WHAT IS OWED NOW

- **`brief-blocks.md`'s build-halt block: REWRITTEN, and the hypothesis came back NEGATIVE.** #1735 ran
  the gates **four times: every one `build=0`, `SecurityFatalError` never appeared.** #1671's measured
  *halt, pass, halt* did not recur, and **the retry has still never been SEEN converting a halt into a
  pass**, so the block now says exactly that instead of implying a fix. **Four days owed, now closed.**
- **`764`'s two filename corrections: DONE** (`0392_per_shelter_restrictive_policies.sql` in four items,
  and `check-tenancy-catalogue.mjs`). **`764` also said `0395` and `0415` were wrong; they are CORRECT,
  and that is this edition correcting its predecessor.**
- **The band-table recommendation about two bottoms nearer 135k is STILL UNACTED and is now clearly
  wrong**: nothing landed below 142,284 in eleven readings. **Recommend dropping it rather than carrying
  it a fourth day.**
- **NEWLY OWED: 46 scripts.** #1741 converted all nine exit-debt scripts, found **`restore-grants`'s
  `finally` had been skipped on a failing exit**, and tabulated the three dangerous scripts' codes
  before and after **without running them**. Its widened check **lists 46 unreviewed scripts and does
  not block** (`--strict-widened` does, deliberately unwired, because turning it on reddens every CI at
  once). **`#scimp` carries it.**

## FILED, TICKED AND CORRECTED

**Ticked by streams:** `#hndvr` (#1733), `#shrow` (#1734), `#uvcls` (#1735), `#dvaal` (#1736),
`#padui` (#1739), and `#rcpfm`/`#adrus`/`#padpr` (#1742).
**Not ticked, correctly, each naming what was left:** `#scimp` (twice — #1738 and #1741),
`#stcnt` (#1740, second clause blocked), `#pltfd` (#1739 and #1742 — its done-when needs the host to
answer), and `#padui`'s schema half (#1737 deliberately did not tick).

**Filed by the planner from streams' own reports, eleven items:** `#dvaal`, `#scimp`, `#stcnt`,
`#shnam`, `#lkaud`, `#shnms`, `#rcpfm`, `#adrus`, `#padpr`, `#wbsrw`, `#dvshl`.

**THREE WORTH READING BEFORE PLANNING ANYTHING:**

- **`#wbsrw`** — **twelve more writes in `src/app/admin/website/actions.ts`, named line by line**, have
  the silent zero-row shape #1740 just fixed in stocktaking. **Not urgent (`0417` backfilled every
  shelter) and the fix is proven one folder away.**
- **`#dvshl`** — **no scripted dev login can hold a role on a SECOND shelter**, so nothing multi-tenant
  can be *driven* on dev. **It blocked three streams in one day** (#1734, #1737, #1740). It is a new
  instrument, not a flag.
- **`#rcpfm`** was filed only after the work that should have closed it did not. **The planner
  deliberately did not file it while the console stream was in flight, and left a note to check that
  PR.** It did not land; the note caught it. **Keep doing that rather than filing phantoms.**

## WHAT IS LEFT FOR CLAUDE AT ALL

**His priorities list changed twice today** and now ranks `#gcnst` and `#padui` at 8 and 9. **`#padui`
was ticked twenty minutes after he ranked it**; what remained on that screen became #1742.
**`#gcnst` is LUTAN'S HANDS ONLY** — the item says in terms that *"a Claude session cannot close this
item"*. **The planner's half, offered and not yet taken up:** establish from Google's documentation
whether renaming a published, brand-verified app triggers a fresh review and how long the old name keeps
showing — **recorded as not established** — then walk him through it.

**Buildable now:** `#scimp`'s 46, `#wbsrw`'s twelve, `#dvshl`, `#lkaud`, `#shnms`, `#shnam`,
`#stcnt`'s remaining clause (blocked on `#dvshl`), `#flogn`.

## PROCESS NOTES

- **TWO NEW CHECKS BLOCK IN CI AS OF TODAY.** #1738 added `check-script-ts-imports.mjs` and
  `check-script-exits.mjs` to **`npm run lint`**. Every stream must pass them.
- **`#hndvr`'s check exists and is wired into `/plan-day` step 1** — the release handover is now checked
  by a script instead of by Lutan asking. It passed every run today.
- **`worktree.mjs done` DIED PARTWAY ONCE**, printing `Node.js v24.19.0` as its last line: folder and
  local branch gone, **`origin` branch left behind**, its own verification never run. **Found only by
  reading the output rather than the exit code.** #1741 converted it but **could not reproduce the
  crash, so it is NOT proven fixed.** **Verify `done`'s success line; do not assume.**
- **FILE BACKLOG ITEMS, FOLD THEM INTO `main`, THEN CREATE THE WORKTREES.** Done in the wrong order
  once today: three worktrees branched from a `main` without their own items and could not have ticked
  them. Caught before the briefs went out and fixed by merging `origin/main` into each.
- **`worktree.mjs sync` takes no slug** — it must be run from inside the worktree.
- **`cooperjaidee.org`: HIS TWO BY-HAND STEPS ARE DONE**, guided in chat. Cloudflare needed nothing (the
  zone holds **0 of 200 records**, which is the correct state) and the Supabase redirect URL is on the
  production project. **Only the deploy is left.** **Cloudflare's own Recommendations panel urges adding
  A/AAAA/CNAME records for the apex and `www` — following it would BREAK the deploy**, which creates
  both addresses itself and refuses to overwrite an existing record.
- **An allow rule was added for `check-dev-aal2-absent.mjs --env production` and `--env uat`**, in USER
  settings, bare and exact-match — the convention every production-touching script follows.

## INTERRUPTIONS

**NONE THAT COST A STREAM.** No stream was corrected, rescoped or stopped, and all ten ran on the dials
they were briefed at. **Lutan was asked exactly two questions all day** — the aal2 decision bundled with
a batch confirmation, and the handover's timing — plus one guided walkthrough he asked for himself.
