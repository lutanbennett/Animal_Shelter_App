# Planner handover — edition `751`, 2026-11-15

**This is a DELTA against `750`.** It says what changed, corrects its predecessor, and reports what each of
`750`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** It reports **`750`'s plan's six measured streams**, read in
one slot this morning, and **carries NO figures from its own five** — those are read at the next plan's
first batch and reported by this edition's successor. **That is the delta model working as designed, not a
gap.**

**WHY IT EXISTS.** This is **the second plan of 2026-11-15** — `750` was written and merged earlier the
same day (PR #1601), which reset the counter. The plan ran **five streams across two batches**, three of
them merged inside the chat that planned them, and **one of the five was added by Lutan mid-batch** rather
than coming from the backlog.

---

## THE LEAD: A RECOMMENDATION REACHED HIS HANDS THAT THIS REPOSITORY HAD ALREADY ANSWERED

**He asked *"Haven't we already done this?"*, and he was right.** The planner was walking him through
Cloudflare's dashboard to add a rate-limiting rule for the public report form (`#8t3rk`), on the strength
of a decision file written that morning. **His own screenshot of the screen reads `1/1 rules`.** The free
plan allows exactly one, and it was already spent on `Sign-in attempts` — **the rule he created on
2026-11-09 under Claude's instruction (`#ao0jk`), which locked him out of production on two devices at
5 requests per 10 seconds and had to be raised to 50 on 2026-11-12 (`#fu9z6`).** There was never a second
rule to create.

**THE FAULT IS NOT THAT THE ANSWER WAS UNKNOWN. IT IS THAT IT WAS IN THIS REPOSITORY AND WAS NOT READ.**
The decision file listed *"whether Lutan's zone already uses its single free rate-limiting rule"* under
**Not established** — honestly — and then **treated that as a question for him rather than one more
command for itself.** `grep -n "rate limiting rule" docs/backlog.md` answers it from two ticked items that
name the rule, its expression, its thresholds and the lockout it caused.

**THIS IS `750`'s LEAD IN ITS OTHER FORM.** That edition's lead was a **stale assertion** reaching a brief
for the second day running. This is a **stale omission** reaching his hands, which is worse: a brief is
read by a stream that runs step zero, and **he has no step zero.**

**THE STANDING CHECK IT EARNS — apply it to every item whose answer lives in his accounts rather than in
the code.** Before writing *"waiting on Lutan"*, or any step beginning *"Sign in to…"*:
**grep the backlog for the SUBJECT, not the item's own id** (`rate limiting`, `Cloudflare`, `DNS`,
`Drive`, `Google`). **Ticked items are where his past configuration is recorded, and a ticked item is
invisible to every read that filters to open ones.** All three items involved here were ticked.

**What was done about it, so nobody repeats the walkthrough:** `#8t3rk` was rewritten on `backlog`
(`9cf730007`) — it is **no longer his hands**, the dashboard steps are marked **void as written**, and
widening the sign-in rule is **forbidden with the reason** (one rule carries one threshold, and that
threshold is 50, chosen for the cost of a Google round trip and not for a form). The work that remains is
reading whether the **Workers rate limit binding** is free, and it became this plan's fifth stream.

---

## THE FLOOR IS CONFIRMED AT 86–89k, AND `750`'s INFERENCE FROM IT IS WRONG. BOTH EDITS ARE IN THIS PR.

`750` measured a floor of 86.0–87.0k across three streams and reasoned that because `SKILL.md`'s table was
built on 107–111k, *"every band is carrying about 21k of fat"*. It said the edit should wait for a second
set agreeing. **The second set agrees on the floor and destroys the inference.**

**Six streams, read this morning** (#1595–#1600): floors **86,037 to 88,646**, spanning 2,609 tokens. With
`750`'s three, that is **nine streams across two complete sets at 86–89k.**

**But the bands themselves were fine: four inside, one under, one over.** **Had the whole table been
shifted down by ~21k, five of the six would have overrun.**

**The reason, and it is the part worth keeping:** the scale rows were **never derived from the floor by
arithmetic — they were measured from actuals**, stream by stream, and each actual already contains
whatever the floor was on its day. **The floor row and the scale rows are two independent measurements,
and correcting one does not imply correcting the other.**

**Both edits are in this PR:** `SKILL.md`'s floor row now reads *"~86–89k, measured 2026-11-15 across two
complete sets (nine streams)"*, and **a paragraph above the band questions says in terms that the scale
rows were deliberately NOT shifted and must not be "finished off" by a later editor.**

---

## WHAT IN `750` IS SUPERSEDED, AND WHAT ITS OWED ITEMS DID

- **SUPERSEDED: the 21k-of-fat inference** (above). The floor figure it rests on is confirmed; the
  conclusion drawn from it is not.
- **SUPERSEDED: *"production is four migrations behind"*, which was `750`'s most consequential owed line.**
  `#w2knt` is **ticked** — *"DONE 2026-11-15 by release `0.47.0`, all five applied and the strict tenancy
  lint clean"*. **It was still being repeated to Lutan this afternoon, hours after it stopped being true.**
  A count with a clock on it, exactly as that item kept warning.
- **The three findings `750` left for decision were all settled, and two were settled by deciding NOT to
  file anything.** (1) The two non-clean permission-probe boxes: nothing to establish, `FAULT 0`, no item.
  (2) The `handled_at` trigger: **a caveat line in `docs/decisions/2026-11-14-report-photo-retention.md`,
  in this PR**, not a backlog item — the behaviour is arguably correct, and a phantom item would imply work
  that does not exist. (3) #1598's release-procedure overlap: **both stay** — the nightly proves dev on a
  schedule, a release proves the commit it deploys.
- **A mitigation `750` asked for FIRED and was right.** Both of this plan's first briefs re-read their
  evidence in the same turn they were written (line numbers re-grepped at 03:40Z; a dependency verified
  closed at 03:45Z). **No stream reported a stale fact in a brief.** But note what it did **not** cover:
  it guards what a brief **asserts**, and says nothing about what a brief, or a chat, **fails to look up.**
  That is the lead above.

---

## WHAT THIS PLAN SHIPPED, IN ONE LINE EACH

- **#1605 `merch-sold-out-label`** — the sold-out label on the public shop, both dictionaries; found and
  fixed a mismatch for a product with no shown variants.
- **#1603 `microchip-register-paper`** — `docs/microchip-register-scope.md`. **It recommends NOT building
  the public register**, and five answers are owed by Lutan before anyone revisits it.
- **#1604 `owner-jobs-worklist`** — rewrote `docs/waiting-on-lutan.md` as a scannable table of every job on
  his own hands. **Added by him mid-batch, not from the backlog.**
- **`worker-rate-limit-binding` (open, port 3001)** — the fifth stream, from the lead above. **It may
  legitimately finish with no code**: if the Workers binding is not free, the correct outcome is to close
  `#8t3rk` as *answered, not built*, under the zero-ongoing-cost rule. **Its brief says so in terms,
  because a stream with nothing to show tends to invent something.**
- **`public-site-speed-quiet` (open, port 3002)** — batch 2, and **it needs the machine to itself.**

---

## FINDINGS FROM THE PR BODIES THAT NO ITEM OWNS — read these before you plan

**Three were filed to `backlog` as `4ab881679`. The fourth was REFUSED, and that is the useful one.**

- **`#dqgy8` retitled** — the scoping paper is written and recommends not building. **Its own limits are
  now in the item** so nobody reads it as a proven negative: *not established* for the DLD, Bangkok's
  scheme date uncertain (January 2026 or postponed), **primary Thai sources never opened.**
- **`#99zuk` retitled** — **answered on 2026-11-13 and nobody noticed for two days.**
  `docs/decisions/2026-11-13-answers-receipts-shop-payments.md` records all three answers from the
  Director while the item's title still said the question was with her in Chiang Mai. **Buildable now,
  schema first.** Two caveats, neither a blocker: the answers are his account of hers rather than hers in
  writing, and **what the accountant needs from shop income was never captured.** This is precisely the
  fault `CLAUDE.md`'s *"Answering a decision on a backlog item"* section exists for.
- **`#gvnrr`** — which battery unit was chosen is **nowhere recorded** on the item, so anyone acting on it
  at sale time has to ask him again.
- **`#w2knt` was NOT edited, because it was already ticked.** The stream's finding (*"title says four,
  probably five"*) was true when written and stale by the time it was filed. **The amend script's anchor
  guard caught it and exited non-zero rather than writing a stale note onto a finished item. That guard
  has now earned its place twice.**

**And one thing to WATCH rather than file:** the tenancy-catalogue nightly's first genuinely scheduled run
is **05:43 UTC on 2026-11-16** and has not happened yet. Check it ran.

---

## HIS DECISIONS TODAY, AND WHAT THEY ARE NOT

- **He added a stream mid-batch by asking for one** (*"Please create a stream for those items"*), which
  made three live at once — the top of `CLAUDE.md`'s two-or-three. **That was his call, not a drift.**
- **He asked for the Worker-limit work to go ahead** (*"Yes, add it"*) after being told it might come back
  "not free" and close the item with nothing built.
- **Nothing here reopens anything settled.** Admin outside the card system, `test-plan` advisory,
  merge-on-green, the adopter-portal exception — all untouched, and none of them is a decision he owes.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 5 of 5 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** Two plans ran on
2026-11-15; a third on the same date is a normal thing to be. **Never derive today's date from a
document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Nine editions have now recorded that as the fix for an interruption.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S FIVE AT YOUR FIRST BATCH, and they are not in this edition on purpose.** Read
   `stream-usage:` from **#1603, #1604, #1605** and the two open streams' PRs. **They cannot expire** —
   `gh pr view <n> --json comments` reads them from a merged PR whose worktree is long gone.
   **`worker-rate-limit-binding` may have a small figure for an honest reason:** if its deliverable 2 came
   back "not free", it landed well under its band by design. **That is not an over-banding signal, and it
   must not be fed into a revision as one.**
2. **CHECK WHETHER THE SPEED STREAM'S MITIGATION FIRED.** `public-site-speed-quiet` was set up **while
   another stream was still live**, which its own batch rule forbids, because holding it would have made
   him wait on a stream he had not opened. **Both briefs name the other and say which must not run while
   the other builds**, and the speed brief's **deliverable 1** is to establish the machine is quiet before
   taking any figure. **If it measured anyway and caveated, the mitigation failed and the right answer
   next time is to hold the batch.**
3. **RE-DERIVE THE FLOOR FROM YOUR OWN COMPLETE SET.** If it lands at 86–89k a third time, **leave
   `SKILL.md` alone** — it is already correct as of this PR. **And do not shift the scale rows**; the
   section above says why, and so does `SKILL.md` now.
4. **THE BACKLOG IS THIN FOR CLAUDE-BUILDABLE WORK.** Of 25 open items, most are his hands, blocked, or
   held on their own conditions. **Plan fewer and say why rather than padding** — `SKILL.md` step 7 allows
   it explicitly, and this plan used it.
5. **`#pl7aq` IS THE SINGLE ITEM THAT UNBLOCKS THE MOST OTHERS — the public launch has no date and no
   owner.** `#z7d6h` and `#uao7r` are both "at go-live" and sit behind it, and **`#ykefa`, the ≈50-hour
   tenancy programme, is deferred until Lanna is live.** It is a decision of his, not a stream. **Put it
   to him when there is a natural moment.**
6. **`#ykefa` IS HELD ON ITS OWN CONDITION.** The item defers the tenancy programme *"until Lanna is
   live"*, and `#pl7aq` records that `lannacareforanimals.org` still shows "under construction" to the
   public. **The condition is unmet.** **Do not slice another piece off it without putting it to him:**
   ≈50 hours, with object counts **40% larger** than the spike priced.
7. **`#00e3u` IS HELD FOR THE ITEM'S OWN REASON, not the planner's** — what the accountant needs for Thai
   tax is **not established**, and the item says to ask rather than infer it from the screens we happen to
   have. **`#99zuk` is now ANSWERED and buildable (above), so re-read whether `#00e3u`'s hold still
   stands** rather than carrying it forward unexamined. It was 4th on his priorities list.
8. **CLEAR THE LEFTOVERS, AFTER YOUR LIST.** `handover-751` once this merges, plus the two open streams'
   folders once they do. **Read the `state` column before believing `ahead`** — a squash-merged branch
   stays ahead for ever. **And read the folders on disk before offering to clear anything:** on 2026-11-15
   the planner offered to clear four leftovers that had already been removed, from a `list` reading a few
   minutes stale. `ls -d /c/Development/Animal_Shelter_*` settled it in one command.
9. **`#7bd5u` STILL CANNOT BE MEASURED WHILE STREAMS BUILD** — unless `public-site-speed-quiet` closed it.
   Lighthouse moves 12–17 points with machine load on this machine, so it is never a parallel stream.

**Do NOT re-ask him about:** `#j4m8w`'s hostname meaning; `#k2vrj`'s fostered updates (*"Yes, show
them"*); the `SUPABASE_ACCESS_TOKEN` scope (set deliberately narrow, and proved sufficient); `#x5tbv`
(shipped); the product name or which TLD; the anonymous photo upload (*"Yes, build it properly"*); whether
staff may add a currency; `donation.receipt`'s shape (yes/no, #1585); the adopter-portal exception;
`test-plan` being advisory; merging a green PR; the Thai read's cadence; **the 90-day retention figure**
(it is the decision file's own starting point, and a stream may change it with a reason); **`#rqv5c`, the
production Drive move** (answered 2026-11-09 and in hand — do not raise it before the end of November);
**`#8t3rk`'s Cloudflare setting** (see the lead: it is impossible, not pending); or anything on `750`'s,
`749`'s, `748`'s and `747`'s do-not-re-ask lists.
