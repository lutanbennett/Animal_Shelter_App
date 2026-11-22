# Planner handover — edition `771`, 2026-11-22

**This is a DELTA against `770`.** It says what changed, corrects its predecessor, and reports what `770`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS NINE STREAMS AND EIGHT HAVE A USABLE FIGURE:** #1809, #1811, #1812, #1813, #1814 (fifteenth
plan, batch 1); #1815, #1816 (fifteenth, batch 2); #1818, #1823 (sixteenth plan). **The ninth, #1823, is
`rescoped=yes` because the planner changed its brief twice mid-flight, so it is recorded and kept out of
the band evidence.** Dials matched the brief on all nine. The counter resets to 0 when this PR merges.

**`#1817` IS NOT ONE OF THE NINE.** Lutan created that worktree and ran that stream himself. Only a stream
a plan created counts (his ruling, 2026-11-20).

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, ~900 lines, and the only record of the sixteenth plan's
   reasoning, the day's production work and the measurements taken during it.
2. **Check what is in flight before you believe anything here.** At writing: no open PRs, and the two
   sixteenth-plan sessions are idle and done.
3. **TWO MERGED WORKTREES NEED CLEARING** once he closes their sessions: `shelter-drive-connect` (3001)
   and `backlog-proof-state` (3002). All PRs merged, all figures read. **`done` them; do not force.**
4. **`0.47.10` SHIPPED TODAY** (the 1 MB logo cap, and `0434`). The release manager cut it; you did not.
5. **THE SIXTEENTH PLAN WAS TWO STREAMS, NOT NINE, AND THAT WAS CORRECT.** Of 37 open items only two were
   work a stream could do. **Do not pad a plan to reach nine** — the skill says so and this day proves it.

## THE LESSON OF THE DAY, AND IT FIRED THREE TIMES BEFORE LUNCH: THE BACKLOG'S OWN PROSE IS NOT EVIDENCE

**Three items said work was outstanding when it was not, and each one cost something different:**

- **`#stpbk`** — offered to Lutan as a buildable stream, **agreed by him**, and found already fixed while
  its brief was being written. Every step-up link already passes `stepUpHref(from)` and both redirect
  points honour it through `stepUpDestination()`. **The batch had to be corrected in front of him.**
- **`#tstsh`** — the planner put its "two things to decide" to him. **He had decided it two days earlier
  and it was already built**: `0428` added `shelters.archived_at`, live on production since `0.47.9`, and
  the console draws **Close** and **Reopen**. His answer was short: *"We agreed this yesterday."*
- **`#nxtqs`** — the item claimed its release note was *"deliberately left n/a under the truth rule"* and
  still owed. **It had shipped in `0.47.8` on 2026-11-20.** The planner briefed a stream to write it; the
  stream read `releases.ts`, **refused, and was right**.

**THE ANSWER IS FILED AND HALF BUILT. `#tg5vh`** (filed this morning from the first instance) says the
backlog has two states on the page — `- [ ]` and `- [x]` — while the work has **three**: not built; built
with a proof or a press owed by a person; done. **The middle state is the common one here**, because no
session can reach production, the Pi or the Google console. `claude/backlog-proof-state` built the
**PROOF OWED** marker in #1819. **Read what it chose before your first plan.**

**AND THE CHEAP INSTRUMENT IS STILL THE SAME ONE: `grep` the code before you believe a title.** All three
were settled in under a minute each by reading the file the item named.

## THE PLANNER'S OWN DEFECTS, BOTH WORTH NOT REPEATING

**(1) A SESSION WAS OPENED ON WORK THAT HAD ALREADY MERGED.** The planner started a session on
`shelter-drive-connect` without first running `gh pr list --state all --head claude/<slug>`. PR #1818 had
merged an hour earlier, from a session Lutan opened himself. **Step zero caught it and the session built
nothing**, which is the guard working — but it cost a session start. **Check for an existing PR before
starting a session on a folder you did not just create.**

**(2) THE PLANNER TOLD A STREAM TO WRITE A RELEASE NOTE THAT ALREADY EXISTED**, from `#nxtqs`'s stale
prose. Had the stream obeyed, users would have been told twice about one change. **It refused and said so
plainly. That is the brief working as intended** — *"if a numbered deliverable genuinely needs X, do it
and say so in your PR"* has a mirror image, and this was it.

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **A shelter is only ever CLOSED (archived) and reopenable, NEVER deleted.** His words: *"Only ever
  archive - switch off access - and ability to unarchive later."* Already built (`0428`, Close/Reopen in
  the console). **`scripts/remove-shelter.mjs` is not the path, and its declined allow rules are not
  needed.**
- **The hosts check runs on all three environments at his go.** Done 2026-11-22, all three clean, which
  closed `#aucbk` and `#wwwcb`.

### ONE THING HE SAID THAT IS **NOT** SETTLED — ASK HIM BEFORE YOU ACT ON IT

**He answered "Open them" when offered the day's two streams, and the planner started both sessions** —
reversing his decision of 2026-11-03 that the planner hands back folder, port and dials and **does not
start sessions**, because his plan bills by turns. **He was told plainly that this reversed it and asked
whether he meant it. He had not answered when this was written.**

**So: default to the 2026-11-03 rule — hand back the list and stop — unless he says otherwise in words.**
The button he pressed said "Open them", which was the planner's own wording, so it is weak evidence of a
change of mind. **Do not treat this paragraph as permission.**

## WHAT WAS DONE *TO PRODUCTION* TODAY, AND THE ONE THING THAT NEARLY WENT WRONG

**Seven blockers closed, most of them by one press of his.** Signing in with Google from the bare
`cooperjaidee.org` landed him on `/platform`, and because that button is a form submission to a Server
Action — the exact thing that used to be refused — **one press settled `#plhbd`, `#nxtqs` and two of
`#cjred`'s four clauses.** Both fixes were verified as ancestors of the deployed SHA **before** he pressed.

**THE LABEL DRAFTER RUNS (`#aaqtl`).** `scheduled_writer_runs` reports `label-drafts: ok, fail_runs=0`.

**AND THE NEAR MISS, WHICH IS NOW `#83137`: `node scripts/deploy.mjs --env production --secrets` WOULD
HAVE PUSHED SEVEN DEV VALUES OVER PRODUCTION'S LIVE SECRETS**, one of them `DRIVE_CREDENTIALS_KEY`, which
decrypts every shelter's stored Drive credentials. **A `--plan` run first is the only reason this was
seen.** The script refused and offered `--allow-dev-fallthrough`; **the flag was not taken**, and the three
new secrets went up through `wrangler secret bulk`, which touches only the keys it is given.

**THE RULE THIS PROVES, FROM HIS OWN `CLAUDE.md`: a tool's suggested remedy is not advice.** Read what the
override would do before taking it. **Dry-run anything that writes to production.**

## A SECOND INSTRUMENT GAP, FOUND THE HARD WAY

**Why a scheduled writer skipped or failed is recorded on production and NOTHING CAN READ IT.** The System
status page shows only *when* a job last ran; no check script reads `scheduled_writer_runs.last_outcome`
or `last_detail`. **Twenty minutes went on inferring the answer from the colour of a green dot**, and it
was finally settled with a hand-written Management API read. **It is a small addition to
`check-production.mjs` and it would have answered the question in one command.** Not yet filed as its own
item; `#tg5vh`'s stream was told about it.

## FIGURES — NINE STREAMS, EIGHT USABLE READINGS, NONE OVER

| PR | slug | tokens | band | verdict |
|---|---|---|---|---|
| #1809 | `shelter-primary-host` | 156.9k | 145-180k | in band |
| #1811 | `label-draft-runtime-config` | 152.5k | 143-170k | in band |
| #1812 | `tenancy-catalogue-flags` | 143.9k | 150-180k | **6.1k UNDER** |
| #1813 | `deployed-hosts-www-check` | 147.1k | 145-175k | in band |
| #1814 | `google-identity-check` | 169.3k | 145-180k | in band |
| #1815 | `scoping-harness-rule` | 143.5k | 148-180k | **4.5k UNDER** |
| #1816 | `logo-upload-cap` | 158.5k | 150-185k | in band |
| #1818 | `shelter-drive-connect` | 227.9k | 200-260k | in band |
| #1823 | `backlog-proof-state` | 159.2k | 170-210k | **rescoped — not a reading** |

**Six in band, two under, none over, one excluded.** Dials matched the brief on all nine.

**THE TWO UNDERSHOOTS SUPPORT THE STANDING HYPOTHESIS AND DO NOT PROVE IT.** Both briefs handed over the
cause, the decision and the shape of the fix; both came in under. **The hypothesis remains: a trace
discounts, an unmade decision does not.** `#1818` is the counterweight — its brief deliberately left three
questions open **and the card question unanswered**, and it landed mid-band at the top of the day's range.
**No band row was changed on this evidence.**

**#1823 IS THE PLANNER'S FAULT, NOT THE STREAM'S.** Its brief gained four deliverables after it was
written and was then corrected again mid-flight. **It is marked `rescoped=yes` honestly and must stay out
of any band revision.**

### THE FLOOR — NINE READINGS, 88.3k TO 91.4k

`88,337 · 88,836 · 88,982 · 89,125 · 89,494 · 90,053 · 90,869 · 91,294 · 91,368`

**Tighter than `770`'s and slightly higher at the bottom. Record the range, offer no cause, re-measure.**

## FILED, TICKED AND CORRECTED

**Filed:** `#tg5vh` (the backlog cannot say *built, proof owed*); `#83137` (the `--secrets` deploy would
push seven dev values to production).

**Ticked:** `#aucbk`, `#wwwcb` (hosts check clean on all three); `#plhbd` (his press); `#aaqtl` (the
drafter runs); `#nxtqs` (the press, and the note had already shipped); `#tncy3` (by #1812).

**Corrected without ticking:** `#tstsh` (retitled — decided and built, he presses Close); `#cjred`
(retitled — two clauses met, the suspected setting was innocent, two small clauses left); `#gidty` (the
`hinge probe` client deleted by him; the four older registrations remain).

**An SEO item for `cooperjaidee.org` was drafted and NOT filed** — he said *"please disregard"* and gave it
to the backlog manager. **Do not file it.** One real finding from that reading, if it comes back: the
platform host has **one** indexable page and **no `robots.txt` or sitemap of its own**, and the shelter
site's would misfire there.

## STILL OWED

1. **`#9l7xf`'s production read** — `770` listed it; it was answered on 2026-11-21 and the fix shipped in
   #1809. **Closed. `770` is superseded on this point.**
2. **`#drvcl`'s first Google consent is HIS**, with the connect client's secret. The screen, both OAuth
   routes and the env names shipped in #1818; **the release note was correctly left `n/a` naming exactly
   that step.** It ships in the PR that closes it.
3. **`#cjred`'s last clause** needs a signed-in login that is **not** a product administrator. He is one,
   so his press could not exercise it.
4. **The `scheduled_writer_runs` read** (above), unfiled.

## PROCESS NOTES

- **The nine were not one plan.** Seven came from the fifteenth plan, two from the sixteenth. **The
  counter is nine merged PLANNED streams since the last edition, across plans and chats.**
- **`worktree.mjs streams` reports a hand-made worktree as `no metadata line`.** That is not a fault and
  not a leftover: check `gh pr list --state all --head`, then **ask**. Lutan makes his own worktrees.
- **A stream that refuses an instruction may be right.** Check before you insist.

## INTERRUPTIONS

**One, and it was a briefing defect:** `#stpbk` was offered, agreed and withdrawn within the hour. **Cost:
one worktree created and removed, and his confidence in the day's plan.** The brief was never written, so
the step-zero guard never got the chance — **the planner's own reading was the thing that failed.**
