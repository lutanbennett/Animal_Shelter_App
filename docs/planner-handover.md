# Planner handover — edition `735`, 2026-11-09

**AMENDED 12:3xZ, after merging at 12:14Z.** The three batch-3 streams this edition described as *"briefed
and handed over with no session opened"* all merged **before** it did, so four of its statements were stale
on arrival. **They are corrected in place below, each marked `AMENDED`, and batch 3's actuals are now in.**
The amendment exists because the lines it corrects would have sent the next chat hunting for finished work
— **which is this edition's own lead fault, committed a second time by the same document.**

**This is a DELTA against `726`.** It says what changed, corrects its predecessor, and reports what each
of `726`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**AMENDED. Written at the SETUP of this plan's last batch, so batch 3's figures were not in it — THEY NOW
ARE.** Batch 3 was `approval-flag-flip`, `maintenance-link-gate` and `devsignin-per-caller`. **All three
merged**: #1429 at 11:14Z, #1430 at 11:32Z, #1435 at 12:07Z. **Four unplanned PRs also landed and are NOT
reported in this edition** — #1432 (restore-risk record), #1433 (`#ia85b`, the manual's `?view=all`), #1434
(the manual's topics follow cards) and #1436 (`#5scf4`, release-notes and change-password tiles). **Read
their PR bodies before planning in those areas; this planner has not.**

---

## THE LEAD: A SNAPSHOT IS NOT ONLY A SNAPSHOT OF STATE — IT IS A SNAPSHOT IN TIME

**This plan's one real fault was the planner's, and it is a new shape.** Twenty minutes after handing
batch 2's three briefs over, the planner read the three branches and told him they *"sat at zero commits
with no PR ever opened — that's 'never started', not 'merged and tidied away'."* He replied **"Batch 2 was
done"**. He was right. The three PRs merged between 08:47 and 09:31Z, minutes after the reading.

**Two things went wrong and only one of them is in the skill.**

1. **The read was taken against a stale `origin/main` with no `git fetch` first.** Nothing in the skill's
   step 3 says to fetch, and `gh pr list` hits the network while `git log origin/main..` does not, so the
   two answers can disagree and the local one loses silently. **Fetch before reading any branch or PR
   state. Add it to your step 1 if it is not there.**
2. **The skill says *"`free` / `0 ahead` / `nothing beyond main` is a SNAPSHOT, not a verdict"* and the
   planner obeyed that — it settled the question with `gh pr list --state all --head claude/<slug>`,
   three ways, and still got it wrong.** Because the missing word is **time**. Three streams briefed in
   the last hour are the single worst moment to take any reading: *nothing pushed yet* and *never started*
   look identical, and only one of them is a statement you can make.

**So: never report a batch as unstarted in the hour its sessions were handed over. Say what you measured
and when, or say nothing.** The cost was one correction from him — and the correction was him telling the
planner a fact about his own work that the planner had just asserted the opposite of, which is the most
expensive kind.

**The neighbouring version of the same fault, also his correction, same day:** the planner read #1419's PR
body — *"Not live until Test is deployed"* — and asked him the Test deploy status. **"Test is already
deployed, why are you asking me this you should know the status as you are supposed to check these against
code before asking me."** `wrangler.jsonc` had the answer the whole time (`PUBLIC_SITE: "off"` on test,
line 62). **A PR BODY'S CAVEAT IS A STATEMENT ABOUT THE DAY IT WAS WRITTEN, NOT THE LIVE STATE.** It is
now in six briefs and in memory as `check-status-before-asking`. **Both faults are the same root: a dated
artifact read as a current fact.**

---

## WHAT `726`'s OWED ITEMS AND WARNINGS DID

**All four of its production reads were closed this plan, from the main checkout with bare commands.**

- **`#h8xqv` is TICKED, and the answer was the good one.** `0342` hid **zero** profile photos on
  production: 300 residents, 35 with a photo, `eligible 33 / no_row 0 / video 0 / held_back 2`. The
  fail-open hole is closed and nothing was taken off the public site to do it.
- **`#av8rq` is TICKED.** `check-production.mjs activities-grantable` passed — *83 catalogue activities;
  3 Admin-only on purpose, 16 UNRULED*. `security-instruments` (#1426) then ruled two of the sixteen,
  leaving fourteen.
- **`#k3mqp` is TICKED** — 13 Vendor contacts, 13 supplier rows, 13 twinned, zero leftovers. **So
  `#xkfsv` IS UNBLOCKED**, which is the one item this plan freed without touching.
- **`0340`–`0342` applied; production was fully current at 06:29Z (344 applied, 0 pending).** It is no
  longer current: see the sequencing warning below.
- **`#rg7pv` is TICKED** — `restore-grants` landed after `726` worried it was live with no PR.
- **`#etr20` is STILL open and still due.** One line, ships with a release cut. Third edition running.

### CORRECTION TO `726`: the `#j8vt4` + `#q7dn3` FOLD IS VOID

`726` said they *"must be ONE stream"* because *"fixing `#j8vt4` alone uncovers `#q7dn3`"*. **That was
right about the mechanism and wrong about what would happen.** #1426 closed `#j8vt4` by **ruling
`reference.types` Admin-only** — not by giving Settings → Units a card. So the only login that can reach
that screen is still Admin, **`#q7dn3` stays masked exactly as before, and nothing was uncovered.**

**`#q7dn3` is now a standalone item carrying its own migration**, and its fault surfaces only when
somebody gives Settings → Units a card. **Do not re-plan the fold. Do not plan `#q7dn3` as urgent** — it
is correct and masked, which is a different thing from fixed.

### THE MITIGATION THAT FIRED, AND IT IS THE ONE WORTH KEEPING

`website-settings-row`'s brief said: *"if you conclude it genuinely needs a migration, stop and say so in
your PR body rather than taking a number."* **It did exactly that** — `site_content` had RLS with no
insert policy — stopped at part (b), and the schema landed as its own PR (#1424) the same morning, with
the button in #1425. **`finished=blocked` was the CORRECT outcome and must not be read as a failure or
counted as a band reading.** That sentence is now in every brief. **This is the first mitigation written
into a brief that has been observed firing; keep checking the rest rather than assuming they work.**

---

## THE BANDS: THE FIRST CLEAN BATCH, AND `726`'s NEW ROW IS STILL UNTESTED

**Batch 2: three of three INSIDE the band.** `text-approval-app` 268,235 against 230–290k;
`security-instruments` 154,398 against 135–175k; `backlog-commit-guard` 150,401 against 120–160k.
**That is the first clean batch after five plans running in which the ROW was wrong rather than the
number.**

**Batch 1 gave one over and one under, and both corrected a row rather than a figure:**

- **`bills-match-walkthrough` 167,412 against 110–140k, over by ~20%.** *"A walkthrough"* is not cheap
  when the stream must **build the scenario it walks through** — it created a dead resident with a clinic
  visit and an unmatched bill before it could drive one press. **The band paragraph asks "does the
  environment hold what the proof needs?" and the planner asked it and still answered wrong.**
- **`approval-flag-schema` 226,543 against 250–310k, under by ~9%.** **The hand-over discount is BIGGER
  than it is priced.** That band named three discounts and still sat mid-row. **A brief handing over the
  cause, the decision AND the shape belongs at the BOTTOM of its row.**
- **`website-settings-row` 175,263 is NOT a reading** — `finished=blocked`.

**AMENDED — BATCH 3'S THREE READINGS, ALL VALID, AND ONE OF THEM IS THE WORST MISS OF THE PLAN:**

- **`maintenance-link-gate` 183,289 against 120–145k, OVER BY 26%.** **And its brief carried a written
  warning about exactly this**, added because of `bills-match-walkthrough`: *"if this page has no
  maintenance job on dev with an enclosure attached, you will have to make one, and that is the same
  trap."* **The warning fired, the stream was not surprised, and the band was still wrong** — because the
  planner wrote the warning into the brief and did not then move the band. **A warning is not a price.**
  **This is the SIXTH plan running in which the ROW was wrong rather than the number**, and the second in
  this plan alone, both the same shape: a small-looking fix that must stand up its own dev scenario.
  **Next edition: a one-file UI fix that needs a driven login on data that may not exist is NOT the
  ordinary 120–145k row. Price it at 170–200k until something disproves that.**
- **`approval-flag-flip` 223,642 against 230–285k, under by ~3%.** A permissions migration handed the
  cause, the spec and the three things left by #1428's own PR body. **The hand-over discount held again**,
  consistent with `approval-flag-schema`'s −9%.
- **`devsignin-per-caller` 153,070 against 145–180k, INSIDE.** Its deliverable 2 was a genuine unknown
  (whether two sessions' panes share a cookie jar) and the band contained it, which is the one pricing
  judgement this plan got right first time.

**`726`'s new row — *an AUDIT that computes a property per row*, 230–290k — remains UNTESTED.** No stream
in this plan was one. **Carry it forward unvalidated and say so again.**

**THE FLOOR, AMENDED with batch 3: ≈106.7–112.0k at Sonnet `low`** (batch 1: 111,289 · 107,711 · 112,035;
batch 2: 107,795 · 106,722 · 107,711; **batch 3: 107,711 · 107,132 · 107,375**). **Nine samples in one day
and the middle seven sit inside 106.7–107.8k**, so the two figures over 111k are the outliers rather than
the trend. This morning's Opus streams gave ≈106.1–106.5k. **So the floor LOOKS
model-dependent by roughly 1–6k — two same-day samples is an observation, not a finding.** Re-derive it;
never carry it forward.

**All six streams ran Sonnet 5.5 at `low` where the plan recommended Opus on three.** His dials, his
choice, **not a deviation to flag** — but it means these figures are Sonnet figures and the bands they
validate are Sonnet bands.

---

## WHAT THE PR BODIES HANDED BACK

**Two items filed, both from `approval-flag-schema`'s and `text-approval-app`'s own *for the planner to
file* lists. Still the best yield per turn spent, though a thinner plan than `726`'s nine.**

1. **`#k7waq` — the appeal override is live and nobody has counted what it newly exposes on production.**
   `0343` removed `r.is_public_visible = true` from `public_appeals` and `public_appeal_photos`, so a
   published appeal now keeps its animal on the public site whatever the ready-for-adoption flag says —
   **which is exactly what he asked for.** **On dev it exposed 0, because dev has no appeals. Production
   has them.** #1428 built the instrument (`check-production.mjs appeal-override`, read-only); **the run
   is the planner's or the release manager's.**
2. **`#m2vxe` — block G's 60-second check timeout is wrong for `check-migration-grants.mjs`, which takes
   about three minutes** because it replays migrations. `approval-flag-schema` tripped it **twice**. The
   block already carves out `gates.mjs`; this needs the same treatment. **Why it is worth a line: the
   block says a check that trips the timeout is "a finding, never a reason to raise the timeout", so a
   stream following the brief correctly files a TRUE STATEMENT as a defect.** A rule that manufactures
   false findings teaches streams to ignore it. **The fix belongs in `brief-blocks.md`, not in a brief**;
   it is written by hand into six briefs as a stopgap.

**`#7aev4` IS BUILT, ITS LAST CLAUSE IS RULED, AND IT IS A BUILD — AMENDED TWICE IN ONE HOUR, THE SECOND
TIME BECAUSE THE PLANNER ASKED HIM A QUESTION HE HAD ALREADY ANSWERED THREE TIMES.** #1430 landed `0346` (default NULL, INSERT
guarded, `0217`'s approve-on-save removed), so text and photos now start blank and wait for approval.
**The stream did NOT tick the item, correctly**, and rewrote its title to say what is open: `public_resident_cards`
still lists **every** resident, so a *Public ok* profile photo of a resident **not** flagged for the website
is still on the public card. That conflicts with the second gate he confirmed on 2026-11-05, and
`docs/decisions/2026-11-09-text-approval-schema.md` names it *"Not reopened"* rather than deciding it.
**Every other DONE WHEN clause holds.** **RULED BY HIM 2026-11-09, IN HIS OWN WORDS:** *"a resident not marked for adoption ready or without an
appeal running will not appear on the website even if images for that resident have been ticked as suitable
for the website."* **So a *Public ok* photo is an ADDITIONAL gate, never a substitute, and the fix is a view
rewrite: filter `public_resident_cards` on adoption-ready OR a published non-draft appeal, through the same
path `0343` uses. It carries a migration and it REMOVES residents from the public site, so the production
count of what leaves is part of the job.** The item now holds all of that; **do not re-ask him.**

**AND THE REASON THIS PARAGRAPH WAS WRONG TWICE IS THE MOST USEFUL THING IN THIS EDITION.** The answer was
in `CLAUDE.md` the whole time — `(A3)` *"Ready for adoption = Show on website"* plus the appeal override,
which `0343` had already built. **The batch-3 stream wrote *"it needs Lutan's ruling, not a build"* into the
item's title without checking whether the ruling existed, and the planner trusted the title over the
record.** His reply: *"I've explained this three times in the last 2 hours."* **A STREAM SAYING A DECISION IS
OWED IS NOT EVIDENCE THAT IT IS OWED. Before you write "waiting on Lutan" about anything, grep `CLAUDE.md`
and the item's own tail for the answer.** It is the same root as this edition's lead — a dated artifact read
as a current fact — and it is now the third instance in one day.

The deliverable-8 condition that produced the correct half of this outcome — tick only if every clause
holds, otherwise rewrite the title — **is still the second mitigation observed firing this plan.** It worked;
what failed was the sentence the stream put in the rewritten title. #1423 (`0343`, the state on eight tables), #1428
(`0345`, the card `approve_text`, the Data API guard, reset-on-edit, the controls and the queue), and
batch 3's `approval-flag-flip` (`0346`: flip the default to NULL, guard INSERT, remove `0217`'s
approve-on-save). **His answers of 2026-11-09 settled all four numbers `726` said he owed** — photo volume
20–30 a week (*"So `0217`'s approve-on-save CAN be removed"*), text volume once a fortnight, `Ready for
adoption = Show on website` **STAYS and must not be "fixed"**, and the shop-link photo takes the QR code's
shape. **Do not re-ask any of them.**

---

## A SEQUENCING WARNING, AND IT IS THE ONE THING IN THIS EDITION THAT COULD BITE A VISITOR

**Production has `0343` and `0344` pending, and `0345`/`0346` are coming.** `0343` carries the appeal
override, **the one part of this work that deliberately changes what a visitor sees**, and its production
effect is the uncounted number `#k7waq` names.

**So: run `check-production.mjs appeal-override` BEFORE `0343` reaches production**, not after. Dev's
answer of 0 proves nothing, because dev has no appeals.

---

## OWED, AND WHO OWES IT

1. **AMENDED AGAIN — NO LONGER HIS. `#7aev4`'s last clause is RULED and is a BUILD**, carrying a view
   rewrite and a migration: filter `public_resident_cards` on adoption-ready OR a published non-draft
   appeal. **It takes residents OFF the public site, so it needs the production count of what leaves,
   before and after.** See the `#7aev4` paragraph above. **Nothing here is waiting on him.**
2. **`#k7waq` — the production appeal-override count, before `0343` deploys.** Instrument exists.
   **Planner's or release manager's.** **AMENDED: `0346` is now pending on production too**, so the
   production queue is `0343`, `0344`, `0345`, `0346` — and `0346` is the one that changes what new
   content does. **Read all four in order before deploying any of them.**
3. **`select id from public_site_content` on production and UAT.** No read-only instrument exists for it;
   the `#ipf1z` work built the create path on dev only.
4. **Six worktrees and a husk to clear.** Batch 1's three read `free`; **batch 2's three read HELD, which
   means his sessions are still in them — ask, do not `done` them.** Plus the husk
   `Animal_Shelter_App-worktrees [site-content-create-8699e9]` (clear by **branch** name) and the merged
   branch `claude/site-content-create-8699e9`. **`/clean-streams` does the round.**
5. **`#etr20`, `#314hq`'s remainder, `#40oz4` part B, `#oeglm`'s third reading, `#mx3rt`, `#ao0jk`,
   `#rqv5c`'s remainder — all his**, all unchanged, all in `.plan-day.md` rather than re-argued here.
6. **One ask, not six:** `#ifxk8`, `#y1dqu`, `#hzmxi`, `#c7zjk`, `#41yhe` and `text-approval-app`'s
   drafted Thai all end at **a Thai speaker reading what is already drafted.**

---

## TWO STANDING CHECKS THIS PLAN ADDED

- **Check every slug with `gh pr list --state all --head claude/<slug>` BEFORE `worktree.mjs new`.**
  `approval-flag-schema` was reused and now returns **two** PRs (#1423 and #1317 from 2026-11-05), so that
  query is permanently ambiguous for it; `approval-flag-app` was taken by #1319, which is why batch 2's
  stream is `text-approval-app`. All three batch-3 slugs were checked clean.
- **`git fetch` before any branch or PR reading.** See the lead.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. **It closed at 9 of 9 and this edition resets the counter, so you are
planning FROM SCRATCH, not resuming.**

**AMENDED: batch 3 is DONE — all three merged, `#m4wq2` and `#w2hs8` ticked, `#7aev4` built and awaiting
his ruling. Do not go looking for it.** The original line sent you after finished work, which is the lead
fault of this very edition committed a second time. **The standing instruction survives it: fetch before
you read any branch state, and never call a stream unstarted on a snapshot.**

**The natural first batch, in order:** **`#xkfsv`** (newly unblocked by `#k3mqp`, and read its TAIL — its
title still oversells it, and the clean-up itself says *"once the app half has been in production"*);
**`#m2vxe`** (`brief-blocks.md`, its own PR per the process-docs rule, and it stops a rule manufacturing
false findings on every migration stream); and **`#3nuwy`**, deferred from this plan's batch 1 — **re-measure
its count** with `scripts/measure-sql-refusals.mjs` rather than quoting 209/86, because it grows while the
programme runs.

**`#79sqf` is still counted and still not a programme:** 44 pages worth driving at ≈20k each, so three
streams by area or the 18 cross-activity pages first. **And the pattern is still worth more than the next
walk: every finding since sweep-6 — `#m4wq2` included, found by PR #1407 — has been a link or notice that
does not ask its DESTINATION's activity.** A code check for that one shape may beat more browser walking,
and this plan added a second instance to the pile rather than a counter-example.

**And give him the list first.** It did real work three times this plan: every batch led with the folder,
port and dials, and he started sessions while reading the rest.
