# Planner handover — edition `636`, 2026-11-04

**A delta over `627`.** It covers the plan that ran **batches 1 (#1264–#1267) and 2 (#1268–#1270)**,
every one merged, and the **setup** of batch 3 (`appeals-campaigns-rename`,
`profile-photo-video-guards`, `build-install-collision-guard`).

> **Written at batch 3's SETUP, as the rule requires, so batch 3's own figures are NOT in it.** They
> land in `645`. **Lutan asked for this one** — `627`'s complaint that nobody ever does is answered.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `645`, due when
the next plan's last batch is set up.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## `627`'s LEAD ITEM WAS ALREADY CLOSED WHEN `627` MERGED, BY THIRTY-SIX MINUTES

`627` opened on *"THE SKILL NOW CONTRADICTS A DECISION OF HIS, AND THE STREAM THAT WOULD FIX IT HAS
NEVER BEEN STARTED"*, and said `planner-turns-not-tokens` was *"STILL UNSTARTED, `free`, 0 ahead,
three days on"*, waiting on Lutan to open it.

**It had shipped. PR #1264 merged at 07:50:55Z; #1263, the handover saying it had not, merged at
08:26:15Z.** The skill's *"START THE SESSIONS YOURSELF"* section was marked superseded in place in
that same PR, so **both halves of the lead were wrong at the moment of writing.** Nobody was waiting
on him for anything, and a planner reading `627` told him otherwise before checking — this one did.

**The cause is not carelessness, it is the one thing the delta rule forbids.** `627` carried a
worktree reading (`free`, 0 ahead) forward as evidence of *unstarted*. **A `free` worktree with 0
commits is exactly as much the signature of a stream that merged and was tidied up as of one never
opened** — `627` itself says so two sections later, about that same folder, and still led on the other
reading. **One command settles it** (`gh pr list --state merged`), and the block at the top of this
file already says to run it rather than diff it.

**So: the lead of a handover is the paragraph most likely to be stale, because it is written first
and from memory. Write the lead LAST, from a fresh read.**

## WHAT `627`'s MECHANISMS DID

- **Report-every-deliverable: 6 of 6, so 36 of 36 across five plans. Mechanism, and now the single
  most productive thing in the loop.** All three of batch 2 reported findings outside their
  deliverable lists; **two became backlog items and one became a command the planner ran** (below).
- **The usage comment: 6 of 6 this plan, 10 of 11 across two.** The sentence naming #1258's
  unrecoverable loss has fired three times. **Treat as mechanism.**
- **The finishing sequence with its own read step: 6 of 6.** No stream ended a turn waiting to be
  notified. **Five plans running — stop checking.**
- **The advance-rescope flag: third and fourth firings.** `release-notes-by-card` (#1265) set it
  itself on finding 24 distinct role combinations where the band assumed a mechanical re-tag;
  `intake-date-same-day-check` (#1268) set it too. **Both kept out of the bands, which is the point.**
- **Re-reading the TITLE of every item a stream touched: paid again.** #1261 retitled `#314hq` and
  left one clause of the old title standing.
- **Step zero and "a prior pass has an expiry date": fired at setup, third batch running.** #1261's
  note that `bills/page.tsx:64-66` offers a dead resident's visit was **already stale** — #1266 had
  rewritten `/bills` hours later — and batch 2's brief said to re-establish rather than inherit it.

## THE UNDER-RUN SHAPE THAT IS HARDEST TO SPOT: A STREAM THAT FINISHED AND STILL DID NOT DO THE WORK

`deceased-visit-notes-app` came in at **175,972 against 210–270k, 16% under.** The band was not wrong.
**The job was smaller than the brief asked for, and its own PR body says so:** deliverable **7 NOT
DONE** (no dev server, no one-card logins), **5 partly** (`src/app/bills/**` not driven end to end),
**6 partly** (not re-audited page-wide).

**The band carried the ~30k that real browser verification always costs, because the brief's own
deliverable 7 asked for it. That allowance was never spent.**

**This is the exact inverse of the rule the skill already has.** The skill warns that a stream which
**stopped early** is cheap because it could not proceed. **This one finished, merged, reported
`finished=yes` honestly, and was cheap for the same underlying reason.** So:

- **The test is not "did it finish?" but "did it do the expensive deliverable the band was built
  on?"** Read the deliverable list against the band paragraph before banking any under-run.
- **It is only interpretable because the stream declared what it had not driven.**
  Report-every-deliverable is what turns a misleading number into a readable one.
- **The skipped verification is a pending manual row, not a saving.**

## BANDS: SIX READINGS, THREE USABLE, AND THE FLOOR SPREAD COLLAPSED

Figures and full reasoning: **`.plan-day.md`.**

- **Three of six were not band readings** — two `rescoped=yes`, one (above) a different job. **Fifth
  consecutive plan losing at least a third of its figures. Plan the sample accordingly: this is the
  normal yield, not a bad run.**
- **The usable three all held:** `bills-inbox-one-question` 204,375 (185–235k),
  `adoption-illustrate-card` 200,204 (195–250k), `fundraising-events-schema` 207,497 (185–235k).
  **Three inside out of three is the best run since 2026-10-21.**
- **THE FLOOR SPREAD COLLAPSED TO 424** — 105,435 · 105,095 · 105,011 — against **5,435** for batch 1
  and **5,001** for the previous plan's batch 3. **This does NOT reinstate the near-constant claim
  `618` withdrew.** Three consecutive batches read 5,001 / 5,435 / 424, so **the spread is itself what
  varies.** A ~104–110k band over thirty readings, re-derived every batch, never carried forward.

## THE RESUME RE-CHECK EARNED ITS KEEP TWICE IN ONE SETUP, AND IT IS USUALLY A FORMALITY

The skill's *re-check the next batch against the backlog as it is now* changed two of batch 3's three.

- **Stream 9 was re-slugged AND re-banded.** Planned as `junction-preload-gutted-modules` and banded
  **145–190k as an AUDIT** on *"nobody has read `win-junction-symlinks.cjs` against the failure"*.
  **The item was rewritten after the plan was saved** and now evidences the cause from four npm logs:
  the daily sync's own `npm ci` began **deleting** `node_modules` at 06:57:54 while a release build
  started at 06:54:03 still held it, dying on `EPERM: unlink` on the one file that build had open.
  **So the preload is ruled out, reading it is not a deliverable, and the job is to BUILD A GUARD** —
  re-slugged `build-install-collision-guard`, re-banded **140–185k**. **An audit band on a job whose
  cause is known is wrong in both directions.**
- **A premise of stream 7's item was DISPROVED at setup.** The item said *"the Worker keeps its own
  copy of the public path list, so change both or the new address is served by one and refused by the
  other"* — a two-sources-must-agree reconciliation, the band row that has over-run three times.
  **It is wrong:** `worker/index.mjs:72` **imports** `isEdgeCachedPage` from
  `../src/lib/public-paths.ts`, and its own comment at `:80` calls that file *"the one list"*. The
  item is corrected with the clause struck in place.

**And a collision that did not exist when the plan was written:** `0312` merged hours before setup and
`cards.ts:368` reads `opens: "/management/appeals"` — **an address stream 7 is about to move.** It is
stream 7's deliverable 5 **and** written onto `#2zi2j`, so the events app half meets it either way.
*A handoff written in one stream's PR is invisible to another stream*, applied before the fact rather
than after.

## AUTO-ARCHIVE IS OFF NOW, AND IT COSTS A FOLDER PER MERGED STREAM

Lutan turned **auto-archive on PR close OFF** on 2026-11-04, after a session archived itself. **It is
account-wide — there is no per-folder setting — so it could not be scoped to the Backlog and Planner
sessions he asked about**, and he chose the global change knowing that.

**The consequence the planner now meets every batch: a merged stream's session stays open and keeps
holding its folder**, where it used to archive itself and release it. At batch 3's setup two of batch
2's three read `HELD — <session name>`; they released minutes later and all three `done`d cleanly, but
**the new worktrees had already taken 3002 / 3005 / 3006 rather than 3001–3003.**

- **Read the ports from each `.port`, never from the previous batch's table.**
- **A finished stream's session is now HIS to close.** Say so in the hand-back rather than letting the
  folders look stale.
- **`HELD — <name>` still means ask, never `--force`.**

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, every batch's figures and the full band
  reasoning: **`.plan-day.md`'s own blocks.**
- **HIS PRIORITIES LIST REMAINS THE PLANNER'S FIRST READ.** Fourth plan running with no orphans and no
  renames to chase. **All three of batch 2 were his own picks.** **Never write to it.**
- **THE PLANNER RAN THE COMMAND A STREAM NAMED, AND IT CLOSED AN ITEM.** #1268 built
  `intake-date-extra-same-day-rows` and could not read production from a worktree, so it named the
  command. The planner ran it: over **300 residents**, **weight 0 and diet 0**, zero rows created more
  than a day later. **`#pdg6b` is ticked.** Dev had read 1 (`R-0394`) — dev test data, never the
  answer. *A count without its database is not a reading*, fifth firing. **This is a standing planner
  job: scan every newly filed item for a named-but-unrun production check, and run it.**
- **FILED THIS PLAN: `#k7v2p` (*Security*) — a photo saved to a public project folder is on the public
  website immediately, with no approval step.** Reported by #1270 as *found, not fixed*; the planner
  then **read `public_project_photos` in full** (`0109:43`) and the report is right — it filters
  `owner_type`, `is_public`, `parent_folder_id` and an image extension **and nothing else**, with
  `select` granted to `anon`. **`0309` removed the last straight-to-website exemption, and `#2zi2j`
  argues an event photo must use `/photos/approve` because no precedent is left to copy — project
  photos ARE that precedent, still standing.** Filed with the card question as NOT ESTABLISHED, **by
  card, never by role.** Also filed: `#q4m8t` (below), plus notes onto `#2zi2j` and `#314hq`.
- **THE PI'S DRIVE MIRROR RUNS, AND REPORTS `FAILED` EVERY NIGHT (`#q4m8t`).** Its first real run
  copied **1,104 of 1,107 files**; any non-zero `counts.failed` exits 1, so systemd reds the unit. Two
  of the three failures are Google-native files that `/export?mimeType=application/pdf` returns `400`
  for, **so they will fail every night for ever.** The fault is **a red light that is always red**, not
  the copy — state is written before the exit, so nothing is re-fetched. **Not a stream yet: no slot.**
- **STILL WITH LUTAN, and none of it is a stream:** retry the **video upload** and read the new message
  (his rank 1 — dev does not reproduce it, and every remaining suspect is something dev does not have);
  press **Retry archive** on R-0323, which **nothing can confirm afterwards**; **`#3nuwy` waits for his
  go** (English-only database refusals, ~34 functions — **not raised for two plans now for want of a
  slot; raise it next**); and the **Pi-failover drill, the `cloudflared` boot race and the Worker's
  eleven-second fallback**, all needing him at the Pi with `wrangler tail`.
- **PENDING MANUAL ROWS, declared by their own streams rather than left silent:** one-card logins on
  the deceased visit screens and `/bills` not driven end to end (#1269), plus the carry-overs from last
  plan (#1253 phone and Thai, #1259, #1258, #1260).
- **PRODUCTION MIGRATIONS ARE THE RELEASE MANAGER'S, NOT HIS** (Lutan, 2026-11-04). Read, not assumed,
  at this setup: dev `313 applied, 0 pending`. **`scripts/deploy.mjs` refuses a production deploy until
  every migration on `main` is applied**, so a release meets them as an ordinary step. **The planner
  reads the status and says it, nothing more.**
- **A release is the release manager's.** Do not cut one, prepare one, or put it to him as a decision.
- **Interruptions: ZERO on the work across the whole plan.** Batch 1's single `AskUserQuestion` carried
  its confirmation **and** both decisions that were genuinely his; batches 2 and 3 needed none. **He
  raised two things himself** — the auto-archive setting and the Pi mirror — **neither a question about
  the work**, both acted on in the same turn.
