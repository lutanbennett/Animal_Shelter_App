# Planner handover — edition `744`, 2026-11-13

**This is a DELTA against `743`.** It says what changed, corrects its predecessor, and reports what each
of `743`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE THIRD 2026-11-12 PLAN'S** — eight of its nine, read on the
morning of 2026-11-13 from merged PRs. **This edition's own plan is the 2026-11-13 one, which ran to
TWELVE streams, and it carries NO figures here. They belong to `745`.** A missing set is not a lost one.

---

## THE LEAD: `743` GOT A FACT WRONG AND A STREAM OBEYED IT TO A DEAD END. CHECK THE HANDOVER, NOT JUST THE ITEM.

**`743` lines 32–33 say `0188_bills_owner_types.sql` adds four values to `attachment_owner_type` *"and no
`general_bill`"*, and concluded the `general-bill-photos` stream needed two migration files. THAT IS
WRONG.** `supabase/migrations/0304_bills_owner_types_sites.sql` adds **both** `general_bill` and
`utility_bill`; `src/lib/bills/upload.ts:18,39` carries the type and asks `bills.general` for it; and
`src/app/bills/general/page.tsx:95` renders the gallery. **It shipped in PR #1368 on 2026-11-07, five
days before the brief was written.**

**What saved it was step zero.** The stream read the enum, found the value, stopped with **no commits and
no PR**, and said so. **That is the guard working, and its figure is correctly `unmeasured`.** What it
cost was a worktree, a brief and a session.

**THE LESSON IS NARROWER AND MORE USEFUL THAN "CHECK YOUR FACTS": `743`'s own text contains the check
that would have caught it** — *"a grep that finds nothing is not a finding"*, written about a different
stream on the same page. **The planner grepped `0188`, found four values, and concluded the fifth did not
exist anywhere.** The enum had been extended by a later file. **So: a `grep` of ONE migration never
establishes what an enum holds. Grep the whole directory, or read the live type.**

**AND THE SECOND-ORDER LESSON, WHICH IS WHY THIS IS THE LEAD: a handover is believed more readily than an
item, because it was written by a planner for a planner.** An item's prose gets tested by step zero; a
handover's assertion gets copied into a brief. **Treat a factual claim in this document as an item's
prose: dated, and to be re-measured before it is briefed.**

## WHAT ELSE IN `743` IS SUPERSEDED

1. **`743`'s owed item 6 — *"`#d6wxo` STILL CANNOT BE BRIEFED"* — is answered.** See the owed-items
   section below. **It is briefable now.**
2. **`743`'s owed item 2 said #1531's next group was owed. The previous `.plan-day.md` claimed it had
   been filed. It had not** — `grep -c "group 10" docs/backlog.md` was **0** on the morning of
   2026-11-13. **Filed then.** **The lesson: a plan file saying a thing was filed is not the thing being
   filed. Grep the backlog.**
3. **`743`'s owed item 4 — `#79sqf` at 21 of 25 — is 24 of 25 and the pressing half is CLOSED** (#1542).
   Row 10's `UndoDeathForm` was correctly never pressed and given no card. **What is left is the check
   half only**, which is in flight as of this edition.
4. **`743`'s operational note about `drive-sharing.mjs` held and is worth keeping:** `--env production`
   is an **exact-match** allow rule — **in the foreground it runs; with the background flag it is refused
   as `[Production Reads]`.**

---

## THE FIGURES — the third 2026-11-12 plan's nine, eight measured

| slug | PR | band | actual | model / effort | floor | reading? |
|---|---|---|---|---|---|---|
| `refusal-keys-group-9` | #1531 | 160–195k | 286,557 | **opus-5 / medium** | 86,015 | **NOT a reading** |
| `control-press-fixtures` | #1532 | 180–230k | 310,209 | **opus-5 / medium** | 86,015 | **NOT a reading** |
| `close-two-recorded-items` | #1530 | 110–150k | 267,500 | **opus-5 / medium** | 89,066 | **NOT a reading** |
| `worker-cpu-fallback-paper` | #1535 | 170–215k | 195,816 | **started opus-5, switched mid-flight** | 88,351 | **NOT clean** |
| `thai-strings-queue` | #1533 | 150–195k | 141,341 | sonnet-5-5 / low | 84,776 | valid — 5.8% under |
| `env-readers-and-decision` | #1534 | 145–190k | 163,564 | sonnet-5-5 / low | 85,435 | valid, in band |
| `donate-promptpay-qr` | #1538 | 110–170k | 248,815 | **opus-5 / medium** | 85,518 | **NOT a reading** |
| `rule3-second-argument` | #1537 | 120–165k | 242,406 | **opus-5 / medium** | 86,755 | **NOT a reading** |
| `general-bill-photos` | none | 190–250k | **unmeasured** | — | — | no PR: already shipped |

**TWO VALID READINGS OUT OF NINE, AND THAT IS A STATEMENT ABOUT THE INSTRUMENT, NOT THE STREAMS.** Five
ran on `opus-5` at `medium` against a `sonnet-5-5`/`low` recommendation. **The dials are his and a dial he
sets is a choice, never a deviation to flag** — what is wrong is reading a figure from one pair against a
band measured on another, and **three of the five said so themselves in their own PR bodies before anyone
asked.**

**THE SIZE OF THE DIFFERENCE, MEASURED FOR THE FIRST TIME — AND `+25%` IS NOWHERE NEAR IT.** Against band
midpoints: **2.06×, 1.78×, 1.70×, 1.61×, 1.51× — mean 1.73×, about +73%.** The `medium` adjustment is
**+25%** and is explicitly *for effort on the same model*. **Above the floor the spread is wider and the
SMALL rows are hit hardest:** `close-two-recorded-items` spent **178,434 above its floor** where its band
allowed about **43,000** — **4.1×**. **A quick win has almost no above-floor allowance to absorb a dial
change, so the cheapest row produces the most alarming number.**

**THE FLOOR: 84,776 to 89,066, mean 86,491, from eight figures.** The previous day's nine, all on
Sonnet 5.5 at `low`, gave **84,458 to 88,730, mean 86,526** — **35 tokens apart on the mean, across a
model change.** **That is the floor's one great virtue: it is comparable across dials**, because it
measures the brief and the harness rather than the thinking. **Re-derive it tomorrow; never carry it
forward.**

---

## WHAT `743`'s OWED ITEMS DID — all seven answered

1. **MEASURE THE NINE** — done, above. The `#md4rq` warning fired exactly as written: five of the nine
   had to be excluded on their dials.
2. **FILE #1531's NEXT GROUP** — was **not** filed despite the plan file saying so; filed 2026-11-13 on
   `#3nuwy`, with group 9's two reported-not-acted-on findings (`merge_doctors`' unreachable second
   raise; the `doctors` SELECT policy asking `clinics.list`). **The group then SHIPPED the same day**
   (#1547): the meter reads **0 person-read English messages** and `#3nuwy` is ticked.
3. **BATCH 3's THREE HYPOTHESES** — all three resolved. `general-bill-photos`: the enum **did** hold
   `general_bill` and it stopped (the lead, above). `donate-promptpay-qr`: **both halves had shipped**,
   and it found and fixed the one real gap — working down a bank statement safely.
   `rule3-second-argument`: **0 `user`-class strings** in `driveErrorMessage`'s second argument,
   `RULE_3_BLOCKS` left `false`, and it proved the position fires with a planted positive and a negative
   control.
4. **`#79sqf`** — superseded item 3, above.
5. **HELD WORKTREES** — all cleared on 2026-11-13 except `waiting-on-lutan`, still held.
6. **`#d6wxo`'s GATE — ANSWERED, and the answer needs handling carefully.** Asked in chat on 2026-11-13,
   he said a foster carer or adopter **authenticates on the website page, adds updates from the website,
   and is limited to just the residents they have adopted**
   (`docs/decisions/2026-11-13-answers-receipts-shop-payments.md`, recorded *for the planner to file*;
   filed the same day). **The decision file records the limit as *"a database rule, not a card"* — which
   is RIGHT about the data scope and would be catastrophic read as "no card needed".** The two halves are
   different questions: **WHAT a carer may do is an ABILITY and must come from a card, with no
   exceptions**; **WHICH ROWS they may do it to is a DATA SCOPE**, which is exactly what
   `on_volunteer_floor()` and `current_doctor_resident_ids()` already do. **A stream reading "not a card"
   as "no card needed" would build the one forbidden thing.** Still not established: whether an adopter's
   login is an app login at all, and how it is linked to the contact row. **The writer also flagged that
   the mapping is their reading of his words — he did not pick an option by name.**
7. **`#yy9fz`** — **CLOSED 2026-11-13** (#1543). Production re-measured clean and the UAT rehearsal
   recorded. The script refuses `--remove`/`--restore` on production outright with no override, so it was
   a confirmation by construction.

---

## THE TWO INCIDENTS OF 2026-11-13 WORTH CARRYING

**(1) TWO MIGRATION-CARRYING STREAMS IN ONE BATCH DEADLOCKED BOTH PRs, AND IT WAS THE PLANNER'S FAULT.**
The skill prefers one per batch; this planner breached it deliberately, reasoning that the alternative
left an item half-built. **Both streams numbered their file `0366`.** It cost **two interruptions** —
*"The streams have a migration number conflict, can you sort it out"*, then *"Are you fixing this? they
are both just sitting there."*

**AND THE MITIGATION THE PLANNER WROTE INTO BOTH BRIEFS FIRED AND WAS USELESS, WHICH IS THE PART TO
LEARN.** Both briefs said: do not assume a number, the other stream is in this batch, run
`check-migration-numbers.mjs` first. **Both streams ran it. Both were told ok. Both got `0366`** — the
checker settles the number from **open PRs**, and neither PR existed when either file was committed. **No
wording can fix that.** So the conclusion is **one migration-carrying stream per batch**, not a better
sentence.

**WHY IT DEADLOCKED RATHER THAN BEING A RENAME, and this is filed as `#w8kq3`:** CI tells whichever
merges second to *"take the next free number — which this check now works out for you, counting the
numbers open PRs hold"*, i.e. `0367`, **and CI would accept it.** But the **pre-commit hook** runs the
same script with `--staged`, which deliberately does not read open PRs, so it knew only that `main`'s
highest was `0365`, called `0367` a gap, and **exited 3.** Meanwhile the other PR was red because this
one held `0366`. **`migration-numbers` blocks, so neither could move.** **`KNOWN_DUPLICATES` does not
rescue it — checked:** it is consulted only for duplicates within one tree, while
`collisionsWithOpenPrs()` raises unconditionally, so an entry leaves **both** PRs red.

**THE UNLOCK, AND IT NEEDED HIM:** the planner's `gh pr close` was **denied as `[External System
Writes]`**, chained and bare, and **asking a stream to run it instead was refused on purpose** — that is
cross-session permission laundering. With his go: close one PR → the number frees → the other goes green
and merges → `main`'s highest becomes `0366` → **the `0367` commit satisfies the hook honestly.** Nothing
bypassed. **Afterwards `--status` showed 369 files and 369 applied rows, zero drift both ways**, because
the stream had cleared its stale dev row with `apply-migrations.mjs --forget` (dev only; it refuses
production and uat). **It had also declined the hook's own suggested remedy of renaming back to `0366`,
which was right.**

**(2) A BAND RAISED AT BRIEFING WAS VINDICATED, AND IT POINTS THE OPPOSITE WAY FROM `#md4rq`.**
`proposed-by-name` was planned at 120–165k on the plan line *"one join"*. Reading the files showed the
join **does not open for the login that needs it**: `public.app_users` is gated by
`private.works_with_logins()` (`0263:72–82`), which asks `maintenance.jobs`, `maintenance.bills`,
`stock.delivery` or `recurring.manage` — **not any translations card** — so a translations-only login
reads zero rows and `appUserLabel(undefined)` returns **`"—"`**, a dash with no error and nothing in a
log. Band raised to **160–185k**; it came in at **179,467, in band**. **Against the original guess it
would have read as a 9% overrun while nothing overran.** **So a figure is only evidence against the band
it was actually priced at — dials AND band.**

---

## STANDING CHECKS — four new

- **`#md4rq` SHIPPED** (#1545). **The `band=` field in a brief header and in the `stream-usage:` comment
  now carries its dials**: `band=160-195k@sonnet-5-5/low`. `worktree.mjs streams` passes the suffix
  through unchanged, so no script needed changing. **A comment without a band is the OLD form and is not
  a fault** — tomorrow's set will hold both.
- **`SKILL.md` step 8 no longer reads as a gate.** It used to end *"Then stop"*, and a planner read that
  as needing his permission before batch 2 — on a day he had agreed all the streams in one go. He asked
  *"Why did you have to wait for me to setup the next batch when I already gave the plan day order?"*
  **Once a batch has MERGED, set up the next one without asking.** *Never nine worktrees* is a reason to
  wait for the merge, never a reason to ask. **The one case that still presents first: a FRESH
  conversation resuming a plan it did not write.**
- **A folder can hold a branch other than the one its name suggests.** `worktree.mjs done <folder>`
  refuses, names the right command, and says **`--force` does not override this**. Read it; do not reach
  for the flag.
- **`src/lib/releases.ts` and `docs/backlog.md` are CRLF in a worktree.** A line-index edit script that
  assumes `\n` silently finds no anchor. **Detect the line ending.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 12 of 12 and this edition resets the counter, so you are
planning FROM SCRATCH.**

**Tell him at the start that the sync plus three `worktree.mjs new` runs plus three briefs is about half
an hour.** `743` recorded that as the fix for an interruption and it still holds.

**WHAT IS OWED:**

1. **MEASURE THE 2026-11-13 PLAN'S TWELVE.** Batch 1: `drive-lockdown-confirmation` (#1543, 177,233),
   `asbuilt-hardware-stack` (#1541, 226,555), `control-press-last-four` (#1542, 208,089) — **already read
   and recorded in `.plan-day.md`, all three on the recommended pair.** Batch 2: #1545 (146,906), #1546
   (179,467), #1547 (218,435 — **and a corrected comment was asked for, because the first was posted
   before the renumber, so the deadlock work is unmeasured**). Plus `waiting-on-lutan` (#1548, 202,671,
   `rescoped=yes`), the two unplanned streams **`director-questions` (#1549) and `record-answers` (#1550),
   which posted NO usage comment and are `unmeasured`**, and **batch 3's three**, which were in flight
   when this was written.
2. **CHECK BATCH 3's THREE HYPOTHESES.** Did `foundation-read-card` need no new activity (both foundation
   activities are `kind: "level"`, so a `read` already exists), and did it keep the card to
   `foundation.papers` and away from the board members' ID copies? Did
   `control-activity-false-positives` close three of the four allow-list rows with prop-value tracing, and
   did it leave row 1 (*"needs predicate implication"*) with a rewritten reason rather than forcing it?
   Did `two-conditions-now-met` confirm `miniflare` now asks for `sharp` 0.35.5 itself, and what did
   `audit` say when it **ran for real** on that PR?
3. **ONE OBSERVATION TO RE-TEST, NOT TO BELIEVE: brief length may move the floor.** `waiting-on-lutan`'s
   floor was **90,793**, above the whole eight-figure range and above every other figure in its plan, and
   its brief was the longest written that day. **But `refusal-keys-group-10`'s brief was nearly as long
   and its floor was 85,250, the second lowest.** **NOT ESTABLISHED.** Re-derive the floor from the
   complete set and see whether the longest brief's floor is high again. **If it is, a shorter brief is a
   real saving rather than a style preference.**
4. **`#cjxq0` IS THE BEST STREAM AVAILABLE AND IT IS BUILDABLE NOW.** His shop answers came in on
   2026-11-13 and **nothing answered is a blocker**: a first stream can build the catalogue, the cart, the
   orders list, the daily supplier email and the manual payment steps **with no products loaded**.
   **Payments are decided — manual for both, no card processor**, so do not brief an integration. Two
   points are undecided and are **not** blockers: who owns an order enquiry, and the logo files (his).
   **Caveat with a clock on it: these answers were given in chat, not read from the Director in writing.**
5. **`#d6wxo` IS BRIEFABLE** — with the card-versus-scope distinction in owed item 6 above written into
   the brief, and with the two unestablished points named as the first thing to settle.
6. **`#z1qn7` HAS BEEN OFFERED TWICE AND DECLINED TWICE** (2026-11-13, against two small closers). It is
   the one real feature left that nobody is blocking — a new surface people submit data through, 200–270k.
   **Offer it first, and do not re-offer it inside a plan he has already set.**
7. **`waiting-on-lutan`'s WORKTREE IS STILL HELD.** Merged (#1548), nothing beyond main. **Clear it when
   that session closes; do not tear a held folder down.**
8. **`docs/waiting-on-lutan.md` EXISTS NOW** (#1548) — a dated list of what the backlog needs from him,
   grouped by what kind of act each one is, with a **Desktop copy sent to him**. **It is a dated snapshot,
   not a tracker.** Read it before compiling any such list again, and **re-date it rather than trusting
   it**: `#t1zyc`(A), `#dxjz2` and `#eh2dt` have already moved since it was written.

**Do NOT re-ask him about:** the Thai read cadence (**weekly, settled 2026-11-13** — `#y1dqu`); drop-ship
or B2B (**neither; `#hj1c5` is closed**); the donation provider (option 3, no integration); the Worker fix
(keep the website up, app says offline); whether admin screens need Thai (they stay English); `#aaqtl`,
which is three deploy steps of his; the production Drive **write** guard, which stays; or `#52y56`'s move
and rotation — **the item is TICKED: *Done when* asked for the move OR a decision file, and the file was
written. If the move is ever wanted it is a NEW item.**
