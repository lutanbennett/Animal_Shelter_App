# Planner handover — edition `618`, 2026-11-03

**A delta over `609`.** It carries this plan's **batches 1 and 2 in full** and **batch 3's setup**.

> **THE LEAD, AND IT IS LUTAN'S OWN WORDS: *"We don't seem to be picking items from the customer
> priorities, is thee a reason these aren't making it into the pla ?"*** He was right, and **one
> third of it was a real planner error.** Batch 1 was the only batch he had seen run and **one of its
> three streams came from his list.** Of the other two, the `record_attachment` fix was a genuine
> prerequisite under his top picks — but `clinic-detail-read-level` was **not on his list and not a
> prerequisite for anything.** It went in because batch 1 had a third slot, and **the planner never
> tested whether one of HIS picks could have filled it.** `poodle-drawings` could have: public-site
> SVG work, no shared file, no migration. **The planner grouped his ranks 3, 4 and 5 into batch 2
> because it looked tidy, not because a constraint required it.** **THE RULE: step 4 orders candidates
> by his list, and FILLING A LEFTOVER SLOT IS A SECOND, SEPARATE DECISION WHERE HIS LIST APPLIES
> AGAIN. Test each remaining pick against the collision rules before reaching past them.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `627`, due when the
next plan's last batch is set up.** **BATCH 3's FIGURES ARE NOT IN THIS EDITION; `627` carries them.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE PLANNER'S OWN `npm ci` GUTTED `node_modules` DURING A RELEASE, AND IT WILL RECUR ON SCHEDULE

**The daily sync's `npm ci` — `/plan-day` step 1 — is what destroyed the main checkout's
`node_modules` mid-release on 2026-11-03.** The release manager filed it with the cause *"not
established"* and a Windows junction preload as prime suspect. **The npm logs settle it to the
second:** `opennext:build` starts 06:54:03; **`npm ci` starts 06:57:54 in the same checkout and dies
`EPERM … unlink 'node_modules\@ast-grep\…'`**; the build then fails with an ENOENT storm; 07:03:10 a
second `npm ci` restores 484 entries.

**Three things make it a cause rather than a coincidence:** `npm ci` **removes** `node_modules`
before installing and the failing syscall was `unlink` inside it; the damage signature (directories
present but empty, `esbuild` gone, no reparse points) is a half-finished delete, not a copy step; and
06:57–06:58 is exactly the window the item already recorded the mtimes in.

**THE FAULT IS PROCESS, NOT SCRIPT:** `CLAUDE.md` and the skill both run `npm ci` in the checkout a
release is cut and deployed from, unconditionally, with **nothing checking for a live build and the
two jobs run by sessions that cannot see each other.** Filed with a revised `Done when` asking for a
lock. **Until that exists: check for a running build before the sync's install, and say so.**

**And the planner's first reading was backwards** — it told Lutan the install failure was the
release's deploy holding files open and that nothing was broken. **A health check run after somebody
else's repair is not evidence that nothing broke.**

## WHAT `609`'s MECHANISMS DID

- **The gates as a numbered deliverable with its own read step: 6 of 6.** Not one of this plan's
  merged streams ended a turn waiting to be notified. **Three plans running — stop checking.**
- **The usage comment: 6 of 6**, as last plan. **Every figure clean.** Keep the sentence *"once your
  process exits that figure cannot be recovered by anyone"* verbatim.
- **Report-every-deliverable: 6 of 6, so 21 of 21 across three plans.** Mechanism.
- **Filing into the right SECTION: held.** Four items filed, none misfiled.
- **Re-reading the TITLE of every item a stream touched: paid again.** Three of six streams retitled
  rather than ticking whole, unprompted. **The briefs now ask for it explicitly and that is why.**
- **Step zero fired on a NEGATIVE: no stream built something already built.** Three plans running.

## TWO NEW MECHANISMS, BOTH WORTH KEEPING

- **ASK FOR `rescoped=yes` IN ADVANCE WHEN YOU KNOW A STREAM WILL PAUSE.** `poodle-drawings` was told
  to pause for Lutan's pick and to set the flag if it did. It paused, he chose, it set the flag.
  **Its 175,903 is inside band and is still kept out of the bands, without anyone having to notice
  after the fact.** Every earlier rescope was caught by the planner reading its own transcript.
- **A STREAM THAT CANNOT ANSWER ITS OWN QUESTION CAN BUILD THE INSTRUMENT AND LET THE PLANNER RUN
  IT.** `tags-two-faults` could not read production, said so, and **added a named check to
  `scripts/lib/readonly-checks.mjs` as a numbered deliverable.** The planner ran it: **zero**, so the
  fault bites nothing, the item closed as accepted-with-evidence, and the schema follow-up it had
  named was **not needed.** **Cost: one deliverable and one command. Copy this whenever an item says
  "the planner's to run".**

## "NOT ESTABLISHED" IN A BRIEF CAME BACK ANSWERED, TWICE, AND BOTH RAN SLIGHTLY OVER

- **Batch 1:** the planner read `attachments.media_kind` as the discriminator for "is this a picture",
  gave its reason, **and wrote that it was not established and that the stream must confirm every
  insert path sets it.** **It was wrong** — the `finish` route writes `media_kind` in a *later* update,
  so inside the function it is always `photo`. The stream added a `p_media_kind` parameter and a
  filename backstop. **Had the brief asserted it, the guard would have shipped reading a column that
  is always `'photo'` on the one path that matters** — passing its own harness, protecting nothing.
- **Batch 2:** the brief said which function raises the closed-record refusal was not quoted anywhere
  and asked for it by `file:line`. **It came back: `enforce_deceased_lock()`, `0026:162`.**

**THE BAND CONSEQUENCE, the mirror of `609`'s "when a brief hands over the answers, lower the band":
BAND AN ACKNOWLEDGED UNKNOWN ABOVE THE SAME WORK WITH THE ANSWER HANDED OVER.** Both streams came in
over, by 8.1% and 4.7%, and in each case the overrun **is** the answering.

## BANDS: SIX READINGS, TWO INSIDE, THREE OVER BY 4–9%, ONE EXCLUDED

Figures and full reasoning: **`.plan-day.md`.** Two method notes:

- **I CALLED THE FLOOR NEAR-CONSTANT ON THREE READINGS AND THE NEXT BATCH DISPROVED IT.** Batch 1's
  three sat within **121 tokens**; batch 2's within **4,665**, same model, same day. **The claim is
  withdrawn. What survives: the floor is a ~104–110k band over fourteen readings, re-derived every
  batch, never carried forward.** Second edition running in which a planner over-read a tight cluster.
- **An item's file:line references rot faster than its prose, and the planner is the only reader who
  checks.** **Three stale references in one plan**: `PagePhotos.tsx` (the file is `PagePhotoCard.tsx`),
  `stock_receipts_one_item` at `:97` (it is `:110`), and a `utility_types` proposal `0305` superseded
  that still read as live in the item's middle while its tail said otherwise. **Two were caught by
  listing the directory rather than trusting the path.**

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, every batch's figures and the full band
  reasoning: **`.plan-day.md`'s own blocks.**
- **BATCH 3 IS SET UP BUT ITS SESSIONS ARE NOT STARTED, and its results are in no edition.** Three
  streams, ports 3002/3003/3005, branched from `6eb58477`. **Read their `stream-usage:` comments and
  PR bodies at the next `/plan-day` before anything else.**
- **THE CUSTOMER PRIORITIES LIST IS LIVE AND IT WORKS** — the panel shipped 2026-11-03 (#1238) and
  this is the first plan to read a non-empty one. `ArtifactData get priorities/ranking` on the pinned
  page. **Read it first, every run. It outranks file position.** **And see the lead: honouring it is
  not only about the ORDER, it is about which items fill every slot.** **Never write to it.** It now
  holds one completed entry (his rank 7, shipped) — **mention that to him; do not tidy it.**
- **PRODUCTION IS ONE MIGRATION BEHIND AND IT IS A QUIET BREAKAGE IF MISSED.** `0306` is applied to
  dev and pending on production, and **the `finish` route now passes `p_media_kind`, so deploying the
  app without it breaks video uploads silently.** `0306` carries a `-- consumer:` header so
  `apply-migrations.mjs` warns. **THE APPLY IS LUTAN'S COMMAND — he was told the fact, not shown the
  command.**
- **ANSWERED THIS PLAN, one of his:** a typed-in bill item description **is to be promotable to a
  real stock item** — so a described line needs a nullable link to the item it was promoted to, which
  widens the batch 3 schema stream. Recorded with the question marked superseded in place.
- **NOTHING IS WAITING ON A DECISION OF HIS** at the time of writing, beyond the one typed word that
  starts batch 3.
- **`591`'s one-go question stays CLOSED: one typed word per batch.** It held again — **no refusal on
  any of six session starts**, because every `worktree.mjs new` and `done` ran in the FOREGROUND so no
  background completion could resume the turn. **That sequencing is the method.** **And the carve-out
  was exercised for the first time:** batch 2's sessions started inside a turn a
  `<side-sessions-event>` opened, because Lutan typed into it. **It works.**
- **TWO PRODUCTION QUESTIONS WERE OWED TO THE PLANNER WITH NO INSTRUMENT TO RUN.** One is now a named
  check and answered (above); **the other — R-0323's current status — still has no check, no stream
  and no owner, and it gates a scheduled item.** Filed in `## Architecture`. **`check-production.mjs`
  runs a fixed list and takes no SQL, which is the point of its design and must not be loosened.**
- **A release is the release manager's.** Lutan, 2026-11-01. **Do not cut one, prepare one, or put it
  to him as a decision he owes.** One shipped mid-plan (`0.41.3`) and its worktree looked exactly like
  a leftover — `free`, `0` ahead, *nothing beyond main* — **while holding an uncommitted release
  record and handover.** **`ahead` and `held` are not the only tests: look at the dirty files.**
- **The Pi-failover drill, the `cloudflared` boot race and the Worker fallback that stops covering
  after ~11 seconds all need Lutan at the Pi** with `wrangler tail`. Not streams.
- **A SECOND SESSION FILED AN ITEM ON `backlog` MINUTES AFTER THE SYNC**, and the only reason it was
  seen is that two copies of `docs/backlog.md` printed different open-item counts. **A count that
  moves by one is a fact about the repository, not noise** — one `git log` settles it. **Merging
  `backlog` into `main` at every batch setup is what keeps it cheap.**
- **Interruptions: THREE.** The lead was one and was partly a planning defect; one was his go-ahead,
  which the one-word rule requires; one was the poodle pick, which the item designs in. **The planner
  rendered the four sketches to a file on his Desktop and checked the render itself rather than
  forwarding code.**
