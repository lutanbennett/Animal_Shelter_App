# Planner handover — edition `737`, 2026-11-10

**This is a DELTA against `736` (and its amendment).** It says what changed, corrects its predecessor,
and reports what each of `736`'s warnings and owed items actually did. Per-stream figures, batch
composition, ports and the dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so BATCH 3's FIGURES ARE NOT IN IT.** Batch 3 is
`refusal-keys-group-3` (3002, `0351`), `thai-added-since` (3003) and `control-drive-24-pages` (3008),
briefed and handed over with no session opened. **Checked before writing this, which is the rule `736`
was amended to learn:** `gh pr list --state all --head claude/<slug>` for all three — **no PR on any of
them.** Batches 1 and 2 are complete: **six streams, six merged PRs, five valid readings and one that is
not.**

---

## THE LEAD: THE STRUCTURAL FIX LANDED, AND HE STILL HAD TO ASK TWICE MORE

**Sixth instance, mid-planning:** *"Is the plan ready yet ?"* **Seventh, after the worktrees existed:**
*"Do I get the streams soon ? Or have you moved onto paperwork before giving me the streams for the 7th
time"*.

**`736`'s fix worked and did not help.** `node scripts/worktree.mjs streams` exists (#1447), was used,
and the list came from it rather than from memory. **So the "handing over is the only step with no
artifact" theory is dead** — the artifact was there and the fault happened anyway.

**THE REAL CAUSE, AND IT IS STRUCTURAL IN A DIFFERENT PLACE: THE LIST CANNOT BE PRINTED UNTIL THE LAST
BRIEF IS WRITTEN, AND THE BRIEFS ARE THE LONG PART.** `SKILL.md` says *"the moment the last `.brief.md`
is written, run `streams` and paste"*. Three briefs at ~360 lines each is most of the planning turn, and
**for all of that time he sees nothing at all.** He asked at the two moments any reasonable person would.

**SO THE FIX IS TO PRINT THE LIST BEFORE THE BRIEFS, NOT AFTER.** Folder, port, model and effort are all
decided the moment `worktree.mjs new` has run; **the brief is not needed for him to open a session**,
only for the session's first move. **Next planner: after the last `worktree.mjs new`, print `streams`
immediately**, say in one line *"briefs are being written now — give me a few minutes before you open
them"*, write the briefs, then print it again. `streams` already reports `brief` as `no`, so the first
print is honest about its own state. **That turns a twenty-minute silence into seconds. Check next
edition whether an eighth instance happened; that is the only test of it.**

**AND THE PRINTER STILL HAS TO BE RETYPED BY HAND, WHICH IS HALF THE PROBLEM.** It prints a **table**,
and he is on Remote Control where a markdown table may not render; and it **still has no `batch`
column**, although every brief carries `batch=`. **Two columns of work, and whoever does it removes the
last manual step from the hand-over.**

---

## WHAT `736`'s OWED ITEMS AND WARNINGS DID

- **THE PRODUCTION READING THAT WAS LOST TWICE NOW EXISTS, AND THE ANSWER IS THAT NOTHING HAPPENED.**
  `#v6r4m` built it (#1453) and the planner ran it: **`not-listed-publicly` = 281 residents in an
  enclosure are not listed publicly; `appeal-override` = 0 running, text-approved appeals.** **So `0347`
  changed nothing a visitor sees on production** — the only behaviour it could alter is the appeal path
  and there is nothing in it. **The lost before-figure turns out not to have mattered, and there is now
  an instrument so the next one is not lost.** **One caveat, stated rather than buried:** that rests on
  `ready_for_adoption` ≡ `is_public_visible`, held equal at both write paths
  (`residents/new/actions.ts:123`, `residents/[id]/edit/actions.ts:200`).
- **`#d9k2w` IS TICKED AND THE ALLOW-LIST IS EMPTY** (#1455). All 24 offered-then-refused links gated on
  the activity their destination asks. **The item's "three streams by area" was wrong and the brief said
  so**: all 24 rows share one file, so three parallel streams would collide on every commit. **One
  stream, 231,745, inside its band, and the hard area boundary never had to fire.**
- **`#79sqf` IS NOT TICKED and 24 pages remain.** See the bands section — this is the edition's most
  useful negative result.
- **`#t3n9r` IS NOT TICKED and is down to ONE PAGE**, `/memes/make`. The fix covers all three routes
  through one shared `attach()`; `/memes/new` and the read-back are proved.
- **`#w8k4p` AND `#r9wtk` ARE BOTH TICKED** (#1459, `0350`), and `#566lo` + `#qtgb4` with them (#1460).
- **`#etr20` is STILL open and still due.** One line, ships with a release cut. **Fifth edition running.**
- **`npm ci` in the main checkout: DONE**, twice, after being owed since 2026-11-09.
- **`736`'s untested row — an AUDIT that computes a property per row, 230–290k — IS STILL UNTESTED.**
  No stream in four plans has been one. **Carry it forward unvalidated. Sixth edition.**

### THE CORRECTION TO `736`: ITS AMENDMENT WAS STRANDED, AND THAT IS THE `708` FAULT AGAIN

`736`'s amendment was written, committed, pushed and **never PR'd**, by a session that then went
offline — **the exact failure `736` itself warns about**, inside the document that warns about it. The
next planner found it by reading `worktree.mjs list` for `ahead` and `held` **before** creating
worktrees, verified every figure, and merged it as **#1452**. **Reading the `ahead` column at step 2 is
what catches this. Do it.**

---

## THE BANDS: FIVE READINGS, ONE NON-READING, AND THE NON-READING IS THE MOST USEFUL

| stream | actual | band | verdict |
|---|---|---|---|
| `production-public-count-check` | 151,371 | 160–190k | **under 5%** |
| `meme-tag-reads-who-and-where` | 177,792 | 170–200k | **inside** |
| `destination-links-gated` | 231,745 | 200–240k | **inside, near the top** |
| `public-visible-one-expression` | 162,097 | 190–230k | **under 15%** |
| `manual-menu-and-examples` | 183,651 | 180–215k | **inside** |
| `read-opened-pages-drive` | 171,388 | 260–320k | **NOT A READING — `finished=blocked`** |

All `sonnet-5-5` / `low`, `compacted=no`, `rescoped=no`.

**1. A DRIVE STREAM SPENT A FLOOR AND DROVE TWO PAGES OF TWENTY-SIX. THIS IS THE FINDING OF THE PLAN.**
`read-opened-pages-drive` was banded at floor + ~6.3k × 26. It drove `/memes` and `/memes/[id]`, **read
the other 24 statically, found nothing, and reported `finished=blocked` rather than claiming a drive it
had not done** — which is exactly right and is why we know this. **So the per-step figure for a driven
walkthrough is wrong, or the pane makes driving far slower than the figure assumes.** **Do not price a
24-page drive from that row again until someone measures it properly.** The replacement stream
(`control-drive-24-pages`) is banded **220–270k, deliberately below**, because the static read is now
done and it is confirming rather than discovering — **that is a hypothesis and next edition must check
it.**

**2. AN "INSIDE" READING CAN HIDE UNFINISHED SCOPE.** `meme-tag-reads-who-and-where` landed inside its
band **and did not prove two of its five driven cases.** **A band reading is a cost figure, never a
completeness figure. Read the PR body, not the number.**

**3. A CHECK WHOSE QUERY IS HANDED OVER VERBATIM INTO A FILE FULL OF EXAMPLES IS CHEAPER AGAIN: PRICE IT
145–175k.** `production-public-count-check` came in at 151,371 against 160–190k, which was itself `736`'s
corrected cheaper band. **Second consecutive reading in the same direction.** The distinguishing feature
is not "a check" but **"nothing left to discover"**.

**4. THE SCHEMA-PLUS-CODE ROW IS OVERPRICED WHEN THE RULE ALREADY EXISTS IN SQL.**
`public-visible-one-expression` rewrote two public views and came in **15% under** 190–230k, because
`private.appeal_running()` already existed and the brief quoted it. **A view rewrite that REUSES an
existing expression is 155–185k, not the full schema-with-code row.**

**5. TWENTY-FOUR MECHANICAL, SELF-PROVING FIXES IN ONE STREAM IS 200–240k AND THE BAND HELD.** First
validation of "reads widely and edits many call sites" at that volume.

**THE FLOOR, re-derived (`tokens − messages`): batch 1 — 107,936 · 110,666 · 111,752; batch 2 —
84,412 · 85,425 · 85,425.** **BATCH 2's FLOORS ARE ~25k LOWER AND NOBODY KNOWS WHY.** Three streams,
same model and effort, same day. **Do not average the two batches. Re-derive it next batch and say
whether the low figures repeat** — if they do, every band built on a ~108k floor is ~25k too high.

---

## WHAT THE STREAMS AND THE BACKLOG HANDED BACK

1. **AN ITEM DESCRIBED WORK THAT HAD ALREADY SHIPPED, AND STEP ZERO CAUGHT IT — IN THE PLANNER, NOT IN
   THE STREAM.** `#00e3u`'s *"`general_bill` photos being fileable"* was planned as batch 3's third
   stream. **`src/app/bills/general/page.tsx:95` already renders the photo section and `0306` has
   accepted that owner type since it merged** (`c0109335`). **Third stale item this week.** **Check an
   item's code before briefing it, not only its prose** — the five-items-already-shipped rule applies to
   the planner first.
2. **A FILED ITEM NAMED THE WRONG DATABASE VIEW, AND ACTING ON IT WOULD HAVE BROKEN A FEATURE.**
   `#w8k4p` said `0347` gated `public_resident_cards`. **It did not** — `0347:9` says in terms *"public_resident_cards
   is NOT changed: the kennel card must always answer"*. **The views that disagreed were `public_enclosures`
   and `public_resident_profiles`.** Corrected on the `backlog` branch before briefing. **Second time in two
   plans a filed item pointed a stream at that view.**
3. **A GREP OVER APP CODE IS NOT A READER CENSUS — and the same shape bit again.** `736` recorded it for
   database functions; this plan recorded it for **items**: an item's prose is not evidence about the
   repository.
4. **`#t48xh` COST HIM A THIRD REPETITION OF A DECISION HE HAD ALREADY GIVEN, AND THE CAUSE WAS A TITLE.**
   His ruling *"use the standard /th/."* has been in the item's **body** since 2026-10-19, and the body
   says in terms *"Nobody needs to ask Lutan anything further about it"*. **The title went on saying a
   decision was his for three weeks, and the planner — and his own priorities artifact's `titles` map —
   believed the title.** His words: *"I have made this decision numerous times, I won't say it again
   t48xh should be /th"*. **Third rewrite of that title for the same fault.**
   `node scripts/check-stale-titles.mjs` exists for exactly this and **was run late rather than at step 4.**
   It now lists 7 candidates and no longer lists `#t48xh`. **Run it BEFORE presenting, not after.**

---

## OWED, AND WHO OWES IT

1. **`0348` TO PRODUCTION — HIS, AND DESTRUCTIVE.** Drops columns and a view; #1444 says take a fresh
   backup first. **The bare runner applies every pending file, so pin it with `--upto`.** `0350` and
   `0351` will be pending behind it.
2. **`#t48xh` IS UNBLOCKED AND SLICED, AND IT IS HIS CALL WHETHER TO SPEND THE WEEK.** The domain cutover
   landed **2026-11-06** (read in `wrangler.jsonc`, not asked). **Sliced on his instruction into four
   sequential streams** — mechanism, links-and-toggle, alternates, proof pass — **none carrying a
   migration**, written onto the item. **Two things found by reading the code that the item did not
   know:** there is **no `?lang=th` and never was** (locale is a cookie set from the phone's
   `Accept-Language`), and **the Worker's edge cache key is keyed on that cookie**, so a careless
   implementation costs the Thai site its caching.
   **AND HIS REQUIREMENT, GIVEN 2026-11-10, OUTRANKS THE SLICING:** *"the language should set based on
   the phones language setting… Default to that with option to change"*, then *"Is this change going to
   impact that functionality"*. **It must not.** Written in as a hard constraint with a named proof,
   because **the regression is silent** — a bare address resolving to English would never be reported.
3. **The Thai ask, and it is ONE ask, not seven:** `#ifxk8`, `#y1dqu`, `#hzmxi`, `#c7zjk`, `#41yhe`, the
   Thai from `#pvpxz`, #1451's seven new refusal sentences, and whatever batch 3 adds. **`thai-added-since`
   (batch 3) is building the worklist that makes this one hand-over instead of a hunt.**
4. **One press on the Director's phone, 30 seconds:** on a receipt, press **Share** and choose Gmail.
5. **`#etr20`**, and the `worktree.mjs streams` two columns (lead section).
6. **`#ogvcr` — the Meshnet and Remote Control test off the home network.** A joint session, it was due
   **today**, and **he travels to Chiang Mai for two weeks.** Nothing else on this list has a deadline.

---

## STANDING CHECKS — all run this plan, and one of them earned its place

- **`gh pr list --state all --head claude/<slug>` BEFORE `worktree.mjs new`: run for all nine slugs,
  all empty.** **And the near-miss search earned its keep:** `#t3n9r`'s brief named **PR #1380**
  (*"Meme resident picker reads who-and-where"*) with its file list, because it reads exactly like that
  work and is not it. **The stream's step zero reported back that #1380 had not touched `queries.ts`.
  The 2026-11-09 failure did not repeat.**
- **`worktree.mjs list` read for `held` and `ahead` BEFORE creating anything** — that is what found the
  stranded handover amendment.
- **Six finished worktrees cleared with `/clean-streams`**, each confirming folder, local branch and
  origin branch. **One needed `--force`: its uncommitted files were a corrupted double-write whose good
  version was already on `main`. Look before forcing — the diff is the evidence, not the file count.**
- **DO NOT READ DIALS OFF THE PROCESS TABLE.** The stream's own `stream-usage:` comment is the only
  source.
- **A release cut ran alongside batch 2** (`0.44.1`, #1456) **and collided with nothing.**

---

## INTERRUPTIONS — a cost of the BRIEF, not the stream

**THREE, all the planner's.** Two were him asking for his list (sixth and seventh instances; lead
section). One was him repeating a decision he had already given three times, caused by a stale title.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. **It stands at 9 of 9 and this edition resets the counter, so you
are planning FROM SCRATCH, not resuming.**

**Batch 3 is briefed and handed over — `refusal-keys-group-3` (3002), `thai-added-since` (3003),
`control-drive-24-pages` (3008). Read their PR bodies when they land; this planner has not.**

**Three things to do before you present anything:** run `node scripts/check-stale-titles.mjs` **at step
4, not after**; **read the code behind any item whose prose claims a gap**, because three items this week
described work that had shipped; and **print the hand-over list straight after the last
`worktree.mjs new`**, before the briefs.

**The natural first batch:** **`#q7dn3`** (the unit-conversion policies asking the wrong activity for
medicine rows — small, carries a migration, and it has waited two plans for a free slot); **the first
slice of `#t48xh`** if he wants the week spent; and **whatever batch 3's three PR bodies hand back** —
on this plan's evidence that is where the best stream comes from.
