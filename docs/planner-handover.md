# Planner handover — edition `736`, 2026-11-10

**This is a DELTA against `735`.** It says what changed, corrects its predecessor, and reports what each
of `735`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so BATCH 3's FIGURES ARE NOT IN IT.** Batch 3 is
`refusal-keys-photos`, `unruled-activities-sheets` and `brief-block-timeout` (ports 3009–3011), briefed
and handed over with no session opened. **Batches 1 and 2 are complete: six streams, six merged PRs,
six valid readings.**

---

## THE LEAD: THE LIST IS THE DELIVERABLE, AND THE SKILL IS NO LONGER THE REASON IT GOES OUT LATE

**He had to ask for his hand-over list TWICE in this plan, and then said so plainly:** *"Where are the
batch 2 streams"*, then **"It's a bit annoying having to keep asking for this."** Later the same round,
given the list as *"Stream 1, 2, 3"*: **"is this batch 2 or 3? it's not labelled"**.

**That is the fifth instance, and the first one the instructions cannot be blamed for.** `SKILL.md`'s
first section is THE ONE RULE, its step 2 says *"Send the list and stop… **Then** do steps 3 and 4"*, and
the memory `deliverable-first-paperwork-after` says the same. **All three were already right.** Batch 2's
three worktrees and briefs were created **and verified**, and then **ten tool calls** went on actuals, PR
bodies and a backlog commit before he asked.

**THE CAUSE, and it is the only new thing here: handing over is the only step with no artifact.**
Creating a worktree leaves a folder, writing a brief leaves a file, filing leaves a commit — each one
feels finished. The list is a sentence someone must choose to compose, so it loses to work that produces
output. **A sixth restatement of the rule will not fix that.**

**So the fix is structural and is in batch 3:** `brief-block-timeout` builds a `worktree.mjs` mode that
prints folder, port, branch, brief-present, **batch**, model, effort and band for every `claude/*`
worktree, reading a metadata comment the planner now writes as line 1 of each `.brief.md`
(`<!-- stream: slug=… batch=3 port=3011 model=… effort=… band=… migration=… -->`; all three batch-3
briefs carry one). **Then handing over is *run it, paste it*, with an artifact like every other step.**
**Check next edition whether a sixth instance happened. That is the only test of this.**

**Two smaller things learned the same way, both cheap to keep:** he is on Remote Control and **a markdown
table may not render for him — give the list as plain lines**; and **a list must name its batch**, because
a plan is three batches of three and the folders alone do not say which you are looking at.

---

## WHAT `735`'s OWED ITEMS AND WARNINGS DID

- **`#k7waq` IS TICKED, and the answer was a fault rather than a count.** `check-production.mjs
  appeal-override`: **1 published non-draft appeal, 1 of them for an animal not visible on the website —
  "Treatment", status `closed`.** **`735` asked for this reading BEFORE `0343` deployed; production was
  already fully current when it was read, so the before figure is gone** — the instrument was built for a
  before and arrived after. **And the row was wrong, not just small:** `public_appeals` filtered
  `published AND status <> 'draft'`, which admits `closed`, while his rule is *"visible for the
  **duration** of the appeal"*. Handed to `public-cards-gate`, which fixed it; its dev harness now proves
  a closed appeal lists 0.
- **`#7aev4` IS BUILT AND NOT TICKED, CORRECTLY.** `0347` (PR #1442) gated `public_resident_cards` on
  adoption-ready OR a running appeal. **`735`'s instruction to "filter `public_resident_cards`" would have
  broken a printed-card feature** — the view's missing `where` is a **deliberate decision of 2026-09-22**
  (`src/lib/residents/card.ts`: *"the card is on the door, so the page behind it must always answer"*,
  asserted by `check-card-taps.mjs`). The planner found that before briefing and handed the stream the
  design judgement instead of the instruction. **What is left is his production apply and one before/after
  count that NEEDS A READ-ONLY INSTRUMENT**, because an ad-hoc production query is refused from a
  worktree; the query is in #1442's deliverable 6 and wants adding to `check-production.mjs` as a named
  check, exactly as `appeal-override` was.
- **`#xkfsv` IS TICKED AND CLOSED** (PR #1444, `0348`). **`735` was right that only the clean-up was
  left.**
- **`#79sqf` IS NOT TICKED and the title now says what is left** (PR #1445). See the next section.
- **`#pvpxz`'s phone half is done and its Google question is answered** (PR #1446). See below.
- **`#m2vxe` IS IN BATCH 3** and **grew twice**: `check-public-views.mjs` became a second 60-second case
  (#1442), so the brief asks for the **rule** — *re-run a timed-out check without the limit before filing
  anything* — rather than a third named exception. The new `check-destination-activity.mjs` is **not** a
  case: timed at 3 s.
- **`#etr20` is STILL open and still due.** One line, ships with a release cut. **Fourth edition running.**
- **`735`'s untested row — an AUDIT that computes a property per row, 230–290k — IS STILL UNTESTED.** No
  stream in either plan was one. **Carry it forward unvalidated and say so again.**

### THE CORRECTION TO `735`: ITS OWN AMENDMENT WAS RIGHT, AND THE `#q7dn3` NOTE STILL HOLDS

Nothing in `735` needs overturning. Its void of the `#j8vt4`+`#q7dn3` fold stands, and `#q7dn3` remains
correct-and-masked rather than fixed. **Do not re-plan the fold.**

---

## THE BANDS: SIX READINGS, AND ONE ROW WAS WRONG BY 19% IN THE CHEAP DIRECTION

All six: Sonnet 5.5 at `low`, `compacted=no`, `rescoped=no`, `finished=yes`.

| stream | actual | band | verdict |
|---|---|---|---|
| `public-cards-gate` | 183,413 | 200–240k | **under 8%** |
| `card-names-on-screen` | 171,864 | 130–160k | **over 7%** |
| `meme-maker-tag-residents` | 201,349 | 150–180k | **over 12%** |
| `suppliers-cleanup` | 173,545 | 170–200k | **inside** |
| `destination-activity-check` | 178,533 | 220–270k | **UNDER 19%** |
| `receipt-attach-phone` | 151,088 | 170–210k | **under 11%** |

**1. A CHECK SCRIPT IS NOT AN INSTRUMENT AT INSTRUMENT PRICES — THIS IS THE MOST USEFUL FIGURE IN THE
PLAN.** `destination-activity-check` was priced from *"builds an instrument or transport path from
nothing"* (250–320k), discounted to 220–270k, and came in at **178,533 — barely above an ordinary
stream.** **Price a static check whose SHAPE is named and whose FIXTURES are listed at 170–200k.** The
consequence is strategic, not clerical: **checks are cheap, so buy more of them.** That stream's own
measurement — *"one stream, versus about 880k of context for the three walks"* — is the whole argument.
**What it does NOT license:** a check that must first discover its own shape is still an instrument.

**2. THE HAND-OVER DISCOUNT IS SETTLED. STOP TESTING IT AND PRICE IT IN.** Five of the last six streams
came in under or at the bottom of their row (−8%, −19%, −11%, inside, after `735`'s −9% and −3%). **A
brief handing over the cause, the decision AND the shape belongs one row down, not at the bottom of its
own.**

**3. A ONE-FILE UI FIX NEEDING A DRIVEN LOGIN IS ≈180–210k. MEASURED THREE TIMES.**
`maintenance-link-gate` 183,289 (banded 120–145k), `meme-maker-tag-residents` 201,349 (banded 150–180k).
`735` said price it 170–200k; **still slightly low.** **And the dev-data trap was NOT the cause** — that
stream reported *"non-resident photo needed no setup… about 10 minutes"*. **The cost is in the driving,
not in standing up the data**, so the warning `735` added was right about the band and wrong about why.

**4. FOLDING TWO SMALL ITEMS COSTS CLOSER TO TWO SETS OF OVERHEAD THAN ONE.**
`card-names-on-screen` carried two items, was banded 130–160k deliberately **below** the ordinary row to
test the discount, and came in at **171,864** — above the ordinary row's own top. Each part needs its own
step zero, proof and tick. **Band a two-item fold at the ordinary row PLUS half a floor.**

**5. Scoping an external vendor's route is CHEAP, measured once.** `receipt-attach-phone` carried a
research deliverable against Google's licensing and still came in under at 151,088.

**THE FLOOR, re-derived (`tokens − messages`): 106.8–108.6k across batch 2, 106.8–111.1k across batch 1.
Six samples sit inside ≈106.8–111.1k at Sonnet `low`.** **Re-derive it; never carry it forward.**

---

## WHAT THE PR BODIES HANDED BACK — AND ONE OF THEM IS 24 REAL FAULTS

1. **`#79sqf`'s CHECK FOUND 24 LINKS THAT ARE OFFERED AND THEN REFUSED, AND THEY ARE PARKED IN AN
   ALLOW-LIST, NOT FIXED.** `scripts/check-destination-activity.mjs` (static, TypeScript AST, cards only,
   ~9 s, **blocking** in CI) read 341 links: 160 OK, 141 whose destination has no static activity, 16
   unresolved and named, **24 findings**. **8 of the 24 were read against source and all 8 were real.**
   They sit in `docs/destination-activity-allowlist.json`, which **can only shrink** — so CI is green and
   **nothing is chasing them.** Named examples: `clinics/[id]/ClinicHub.tsx:476` (an edit link under a
   read gate), `memes/page.tsx:30` (ungated `/reels`), `management/stock-usage/page.tsx:495`,
   `enclosures/EnclosureGrid.tsx:250`, `EnclosureHub.tsx:219,256`, `admin/status/page.tsx:197,384,445`,
   `MakeMemeLink.tsx:16`. **FILED BY THE PLANNER as its own item — this is the largest single pile of
   card-access faults anyone has produced, and it is the first time the shape was found by machine.**
2. **`#79sqf` IS NOT CLOSED and its title says so.** The check covers **links only**. **A notice cannot be
   caught statically** (F2's shape), and *control gated on a different activity than its action* (F3/F4)
   is not covered — that is **the 26 read-opened pages, one drive stream**, and it is the honest remainder.
3. **A GREP OVER `src/` AND `worker/` IS NOT A READER CENSUS.** The planner verified *"nothing reads the
   old supplier columns"* from app code and briefed the drop on it. **`suppliers-cleanup` found two stamp
   functions from `0337` still naming the dropped columns** — *"plpgsql would have failed on the first
   delivery saved"*. **A dropped column's readers can be DATABASE FUNCTIONS, and `grep src/ worker/` cannot
   see them.** Grep `supabase/migrations/` too, and say so in the brief. **It caught this itself and added
   a guard to `0348`; the planner did not hand it that.**
4. **The Google answer, so nobody re-opens it:** the PC half needs the **restricted `gmail.compose`
   scope** — either a **paid annual assessment** (reported \$500–\$75,000, secondary and conflicting
   sources) or a free separate **Testing** project with **weekly re-consent** — and **it must not touch the
   `lanna-care-dev` project that serves Drive.** **Not recommended.** **Zero ongoing cost is a standing
   rule, so this is his to spend or drop, and nothing is owed unless he wants to spend money.** The stream
   says plainly that **Google's own pages were not read directly** — treat the figures as secondary.

---

## OWED, AND WHO OWES IT

1. **TWO PRODUCTION APPLIES, BOTH HIS, AND ONE IS DESTRUCTIVE.** `0347` (takes residents OFF the public
   site) and **`0348` (drops columns and a view — #1444 says take a fresh backup first)**. **Read both in
   order before deploying either.**
2. **`#7aev4`'s production before/after count — needs a read-only check added to `check-production.mjs`
   first.** Planner's or release manager's. **It is a list of animals leaving the public site, not a
   statistic.**
3. **One press on the Director's phone, and it is 30 seconds:** on a receipt, press **Share** and choose
   Gmail; the PDF should be attached with the subject and message filled in. That is the only thing
   `#pvpxz`'s phone half could not prove from a worktree.
4. **The 24 destination-activity faults** (filed). **And the drive stream for notices and
   control-vs-action on the 26 read-opened pages** — the honest remainder of `#79sqf`.
5. **`#c4vn7`'s walkthrough is a session with him**, once batch 3's sheets land. **Re-measured 2026-11-10:
   84 catalogue activities, 5 Admin-only on purpose, 14 UNRULED, 56 cards.** **`735` said `stock.correct`,
   `system.status` and `photos.resident_publish` were settled on 2026-11-09; all three still print as
   UNRULED.** The planner did **not** establish why — the ruling may be unrecorded in
   `docs/ungranted-activities-allowlist.json`, "settled" may have meant something narrower, or `735` may
   be wrong. **It is in batch 3's brief as a question. Do not put those three to him until it is answered.**
6. **`#etr20`, `#314hq`'s remainder, `#40oz4` part B, `#oeglm`'s third reading, `#mx3rt`, `#ao0jk`,
   `#rqv5c`'s remainder — all his**, all unchanged, all in `.plan-day.md` rather than re-argued here.
7. **One ask, not six:** `#ifxk8`, `#y1dqu`, `#hzmxi`, `#c7zjk`, `#41yhe` and the new Thai from
   `#pvpxz` and batch 3 all end at **a Thai speaker reading what is already drafted.**
8. **`npm ci` in the main checkout.** Deferred on 2026-11-09 while a live `sync-home-icons --env
   production` held the folder during the `0.44.0` deploy, and `package-lock.json` changed in that cut.
   **New worktrees run their own, so no stream is affected.** Re-run `guarded-install.mjs` when quiet.

---

## STANDING CHECKS — one was skipped, and it cost a stream

- **`gh pr list --state all --head claude/<slug>` BEFORE `worktree.mjs new`. SKIPPED for batch 1, then
  asserted as done in `.plan-day.md`.** `claude/meme-resident-picker` already carried merged **PR #1380**
  of nearly the same name. Its worktree was then **destroyed mid-session by something nobody has
  identified** — the session's own words: *"held the project files when I first listed it. When I went to
  edit, it was an empty folder"* — and with the brief gone it had only the slug, found #1380, concluded
  the work was done, and stopped. **Nothing was lost (no commits).** Re-created as
  `meme-maker-tag-residents`, which merged. **All six later slugs were checked before creation.**
- **PICK SLUGS THAT NAME THE CHANGE, NOT THE FEATURE AREA.** `meme-resident-picker` could not be told
  apart from a picker PR; `meme-maker-tag-residents` could. **And name the near-miss PRs, with their file
  lists, in the brief** — batch 2's three briefs did, and none of them met the trap.
- **A snapshot is a snapshot in TIME — and the OPPOSITE failure is not looking at all.** He had to ask how
  the meme stream was getting on. **An idle stream with no commits and no PR looks exactly like one that
  never started; only its own transcript tells them apart** (`list_events`).
- **DO NOT READ DIALS OFF THE PROCESS TABLE.** `claude.exe` command lines said `--effort=medium`; all six
  streams' own `stream-usage:` comments said `effort=low`. **The stream's comment is the only source.**
- **A PR body's *"flag for <other stream>"* is addressed to NOBODY if that stream has merged.** #1436
  flagged the manual's wording for a stream that had merged twelve minutes earlier; filed as `#j4m8t` and
  built. **Treat every such flag in a merged body as unowned.**
- **`--force` is not the fix for a held worktree.** `done` refused twice while the dead session's process
  still existed, then worked once it exited. The script says so in its own code.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. **It stands at 9 of 9 and this edition resets the counter, so you are
planning FROM SCRATCH, not resuming.**

**Batch 3 is briefed and handed over — `refusal-keys-photos` (3009), `unruled-activities-sheets` (3010),
`brief-block-timeout` (3011). Read their PR bodies when they land; this planner has not.**

**The natural first batch, in order:** **the 24 destination-activity faults** (filed as one item; they are
real, user-facing, machine-found and parked in a shrink-only allow-list, so they are the cheapest real
value on the board — and the check will prove each fix); **`#t3n9r`** (a meme tag saves and reads back as
*"No resident is tagged"* on all three routes, seen in a browser, one query to fix); and **the read-only
production instrument for `#7aev4`'s count**, which unblocks his apply.

**And give him the list first — as PLAIN LINES, naming the batch.** Then everything else.
