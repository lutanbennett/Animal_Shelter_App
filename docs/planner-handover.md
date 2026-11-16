# Planner handover — edition `754`, 2026-11-16

**This is a DELTA against `753`.** It says what changed, corrects its predecessor, and reports what each of
`753`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** The daily measurement read **`753`'s plan's complete set
of nine**, in one slot after batch 1 was set up, exactly as the rule intends. **Two of this plan's own
six were also read**, at batch 3's setup, because the (e) step requires reading every merged PR body for
findings and the usage comments came with them. **Batch 1's three and batch 3's one are not readable in
this edition's slot** and belong to its successor. **The delta model working as intended, not a gap.**

**WHY IT EXISTS.** This is the **second plan of 2026-11-16** — `753`'s plan ran nine streams the same
morning and all nine merged. This one ran **six streams across three batches** (3, 2, 1), and it is
smaller than nine **for one structural reason, not because the backlog is thin**: see below.

---

## THE LEAD: THE PLANNER ASSERTED FOUR THINGS IT HAD NOT MEASURED, AND NOT ONE WAS CAUGHT BY THE PLANNER

Every one of these was written down as fact, in a brief or on a backlog item, and every one was wrong:

1. **A list of 19 tables handed to a stream as the work.** The real number was **46**.
2. **"Any page whose data is fetched client-side would come back empty under Part 5."** There are **no
   browser-side data reads at all**; `client.ts` is imported twice and both are auth calls.
3. **`#vleak` filed as *"Gated on nothing — it can be settled before Part 5 and should be."*** It is
   **hard-gated**: `anon` has no execute grant on `current_shelter_id()`, and `0383` says Part 5 grants
   it in the same file as the policy that needs it.
4. **`#vleak` then deferred on a collision with `public_stat_switches`.** **There is no such
   dependency** — the canary's own `KNOWN_TODAY` says both leaks are about `residents`, which has had
   `shelter_id` since `0383`.

**WHAT CAUGHT THEM — FOUR DIFFERENT INSTRUMENTS, NONE OF THEM THE PLANNER RE-READING ITS OWN WORK:**

- **a brief that made VERIFYING the list deliverable 1** rather than working through it — the only
  reason the missing 27 tables were found;
- **a stream that measured its own brief's premise** instead of obeying it;
- **Lutan, in one line** — *"There is no stream setup for tenancy-anon-view-leaks"* — which forced the
  re-reading that disproved (4) and found (3);
- **a git hook** (the next section).

**THE SHAPE, STATED PLAINLY BECAUSE IT IS THE PLANNER'S COMMONEST FAILURE AND THIS IS THE THIRD EDITION
RUNNING TO REPORT ONE: each wrong claim was built on something TRUE.** PR #1619 really did name 19
tables. PR #1617 really did say the browser client *"needs a decision"*. A view really does select from
`public_stat_switches`. **The planner then widened a true narrow statement into a false general one and
wrote it down as evidence.** `752`'s lead was verifying the mechanism rather than the thing; `753`'s was
a stale document reaching someone who could not test it. **This one is wider than both: a true premise
is not a measured conclusion.**

**THE RULE THAT WOULD HAVE CAUGHT ALL FOUR, AND IT COSTS ONE COMMAND:** before writing a count, a
dependency or a consequence into a brief or an item, **run the thing that knows.** The canary names each
leak in a constant. The schema answers how many tables lack a column. `grep` answers where `client.ts`
is imported. **All four were one command away, and all four were asserted instead.**

---

## THE FIFTH, AND IT IS THE PROCESS LESSON: A CORRECTION WAS WRITTEN INTO THE WRONG ITEM

Correcting `#vleak`, the planner anchored a `split/join` on the phrase *"Gated on nothing — it can be
settled before Part 5 and should be"* — **which appears in `#bcl1t`, not `#vleak`**, because the planner
had written that same phrase into **both** items that morning. **A long correction about one item landed
inside another.**

**The `commit-msg` hook refused the commit**, naming `#bcl1t` as an item the message did not mention. The
edit was reverted (`git reset HEAD` **then** `git checkout --`, because it was already staged) and redone.

**THE GUARD THE PLANNER WROTE DID NOT FIRE, AND THAT IS THE TRANSFERABLE PART.** `SKILL.md` requires *"a
guard that exits non-zero when an anchor is missing"*, and the guard did exactly that — **the anchor was
present, just not where it was meant to be.** **Assert the anchor is UNIQUE, not merely present:**

```js
const n = s.split(from).length - 1;
if (n !== 1) { console.error(`ANCHOR NOT UNIQUE: ${n} hits`); process.exit(1); }
```

Every later edit this plan made used that form, and one refused on a count other than one. **The hook
saved the file; the uniqueness check is what stops it happening again.**

---

## WHY THIS PLAN WAS SIX STREAMS AND NOT NINE, AND IT IS A BLOCKER OF HIS

**The multi-tenancy programme is blocked on Lutan, structurally.** `#ujqr5` (Part 5) is gated on **Part
4's Worker header being DEPLOYED**, not merely merged, and the item requires the two to ship in
**different releases** — policies and header between the same two release cuts means the release manager
follows `docs/release-procedure.md` §5 then §6 and **the public website serves blank pages for the
length of a Worker deploy.** That deploy is his by standing instruction of 2026-10-02. **The thirteen
parts run in a fixed order, so Parts 5 to 13 all sit behind it.**

**HE WAS ASKED AND HE DECLINED A RELEASE: *"Not yet"* (2026-11-16).** The block stands **by his choice**.
**Do not re-ask it; raise it only if he asks what is blocking the programme.**

**AND THE BEST NEWS IN THIS EDITION: PART 5 IS LESS DANGEROUS THAN BOTH PREVIOUS EDITIONS BELIEVED.**
PR #1628 established that **no browser-side data read exists**, so Part 5 has nothing to blank on that
path — and **guarded it rather than promising it**: `src/lib/supabase/browser-client-no-data.test.mjs`
is a planted-violation test, so a future client-side table read **fails the build**. **The public-site
blanking hazard is still real; the signed-in-browser one is now closed by construction.**

**`#egq18` (Part 12) is still the one part the fixed order does not bind** (*"worth taking on its own"*),
**but it needs a Worker deploy to render inside**, so it waits on the same thing.

---

## WHAT `753`'s EIGHT OWED ITEMS DID

1. **Measure batch 3's three — DONE, and only two were usable readings.** `tenancy-canary-diff`
   **188,921** (230-280k, **41k UNDER**); `edonation-format-establish` **146,943** (120-160k, inside);
   **`tenancy-unique-keys` reported `tokens=unmeasured messages=unmeasured`** — the comment is otherwise
   complete, so **a tool reading failed, not a stream forgetting.** Recorded as `unmeasured`, never a
   guess. **Its band (170-210k) is therefore untested, which matters because `753` deliberately did not
   cut it.** **If a second stream reports `unmeasured`, file it as a harness finding.**
2. **`#w4t9k` before the next release — DONE** (PR #1626, `0388`). **And it was TWO tables, not one:**
   PR #1622 had found `retention_runs` flagged beside `donation_tax_ids` and said so *"for the
   planner"*; `753` did not know. **Both took the policy.**
3. **Check the nightly, and what it says — DONE, AND IT HAD NOT RUN AGAIN.** `gh run list --workflow
   tenancy-catalogue.yml` shows exactly **two runs ever**: a `push` success 2026-11-15T01:44Z and the
   `schedule` **failure** at 12:57Z. **Nothing on 2026-11-16.** **AND THE CRON SAYS `43 5 * * *`
   (05:43 UTC), which does not match the only scheduled run there has been.** Briefed to the `#w4t9k`
   stream as an open question; **read PR #1626 for the answer.**
4. **Part 5 only after Part 4 is deployed — HELD, and it is why this plan is six streams.** Nothing from
   Part 5 on was briefed.
5. **Part 2's tick — CHECKED TWICE AND CLOSED HONESTLY ON THE SECOND PASS.** PR #1625 returned *"cannot
   verify here"* on clauses 1, 3 and 6 and **left `#s50n8` open**, which was right. PR #1629 then
   measured them and ticked it. **Clause 6 is met at schema level only, with no browser pass — that is
   on the item, not glossed.**
6. **Stream 4's two filings — DONE, and the second was far bigger than reported.** The ambiguous tables
   and the tenant-tables-in-no-group list are on `#s50n8`; **the latter turned out to be 46, not 19**
   (the lead). `medication` was indeed one of them.
7. **`#7bd5u` is his #4 and was not in the nine — IT IS THIS PLAN'S BATCH 3**, alone, which is the only
   shape that fits it. **Only (a) remains**: PR #1609 did (c) and measured (d) and (e) as not wanted.
8. **The husk — STILL THERE, and now diagnosed.** Below.

---

## A SMALL TOOL DEFECT, FOUND BY USING IT, AND IT WILL OUTLIVE EVERY PLAN THAT MEETS IT

`worktree.mjs list` prints `planner-handover-753 … squash-merged (PR #1624) - 'done' clears it`, and
`worktree.mjs done planner-handover-753` **refuses**: *"Push first … --force does not override this."*
The branch reads as 4-unpushed **because origin's branch was deleted at the squash-merge**, so the
unpushed guard fires on work that is demonstrably on `main`. **`list` and `done` disagree.**

**It was NOT forced and NOT pushed:** a refused step is to be reported, and pushing a merged branch back
to `origin` would recreate it for nothing. **It costs nothing by existing. File it if it recurs on the
next squash-merged handover branch** — which is **this edition's own branch**.

**A transient worth knowing because it looks exactly like a bug:** a clearing pass refused five folders
with *"could not fetch origin — cannot tell what is merged or pushed; try again when online"*. A plain
`git fetch origin` then succeeded and all five cleared. **The script was refusing correctly. Do not
reach for `--force` on that message.**

---

## THE FLOOR, AND THE ONE BAND FINDING WORTH ACTING ON

**The floor is confirmed a fifth time.** Eight readings from `753`'s nine:
**86,261 / 86,261 / 86,261 / 86,326 / 86,744 / 86,761 / 87,274 / 90,374**, and this plan's two agree to
the token at **87,113**. Seven of eight sit inside **86-89k**; the 90,374 is the highest ever and remains
an outlier. **`SKILL.md`'s floor row still describes the data, so NO EDIT IS OWED.**

**AND THE SCALE ROWS WERE NOT SHIFTED.** `751`, `752` and `753` each record why, and the reason has not
weakened: the scale rows were **measured from actuals**, never derived from the floor by arithmetic.
**Two independent measurements; correcting one does not imply correcting the other.**

**THE BAND FINDING: `tenancy-canary-diff` came in 41k UNDER a band already discounted for it.** Banded
230-280k, **below** the 250-320k *builds an instrument* row, because `check-public-views.mjs` enumerated
the anon surface and `tenancy-catalogue.yml` was a working nightly template. It landed **188,921**.

**The reading is a correction to the DISCOUNT, not to the row: when both the enumerator and the
transport already exist, what is left is not an instrument — it is an ordinary stream plus
integration.** The discount was in the right direction and far too small. **Do not shift the instrument
row.** When Part 7 (`#ps6ms`) ships its own check, **ask what it must BUILD rather than what it must
assemble**, and band the assembly case near the ordinary stream.

**One honest non-finding:** stream 4's band was raised at setup 175-220k → 185-230k and landed
**203,797**, which is **inside both**. The raise was defensible; it is **not** evidence it was needed.

---

## HIS DECISIONS THIS PLAN, AND WHAT THEY ARE NOT

- **He declined a release: *"Not yet"*.** That is what keeps Parts 5-13 parked. **His call, and not an
  oversight.**
- **He agreed batch 1 and asked, in the same answer, *"what else can go into batch 2"*.** The honest
  answer needed nine PR bodies read, which is paperwork; **he was told in one line that the answer was
  coming after the list, and it came.** **Tell him it is coming, or it reads as dropped.**
- **He agreed batch 2 — *"Yes, as proposed"* — then accepted it being cut to two: *"ok no problems, we
  will stay at 2 streams for batch 2"***, after being told the reason he had first been given was wrong.
- **He closed batch 1's three sessions**, which is what let their folders be cleared.
- **Nothing here reopens anything settled.** Admin outside the card system, the adopter-portal
  exception, `test-plan` advisory, merge-on-green — all untouched, and none is a decision he owes.

---

## ONE THING TO WATCH, NOT YET A FINDING

**PR #1625's own body says *"Gates (typecheck/lint/test/build), test plan and merge-on-green are NOT
done yet"* — and the PR is merged.** Either the body went stale before the merge or a PR merged with its
gates unrun. **One occurrence is not a pattern.** **Read that PR's checks before trusting its test plan,
and if a second stream does the same, it is a finding about the finishing sequence rather than about one
stream.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at `6 of 6` — COMPLETE — with batch 3 `set up 2026-11-16` and NOT
merged at the time of writing.**

**SO DO NOT RE-PLAN ON SIGHT, AND DO NOT ASSUME IT IS FINISHED EITHER.** Check whether batch 3's one
stream merged (`gh pr list --state all --head claude/public-site-unused-js`). **Merged → every saved item
is closed → plan from scratch. Still open → say so and ask.**

**Read the system date and compare it with the date at the top of this file.** **Two** plans ran on
2026-11-16; a third on the same date is a normal thing to be. **Never derive today's date from a
document.**

**AND READ THE REPOSITORY AFTER THE PULL, NOT BEFORE IT.** This plan's own first act was to read
`docs/planner-handover.md` with `main` **eleven commits behind** and report that edition `753` had never
been written. **It had** (PR #1624). **A stale working copy produces a confident wrong finding exactly
the way a stale document does.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour** — **twelve editions.** **Say it on EVERY batch, not just the first.** This plan said it on all
three and cost **no** interruptions.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S FOUR UNREAD STREAMS AT YOUR FIRST BATCH.** Batch 1's three —
   `tenancy-definer-all-policies` (band 145-185k), `tenancy-part2-done-when` (150-190k),
   `claude-md-admin-sql-stale` (110-145k) — and batch 3's `public-site-unused-js` (190-240k).
   **Batch 2's two are already in `.plan-day.md`** (`tenancy-tables-no-group` 203,797;
   `supabase-client-shelter` 146,242) — **do not re-read them and do not count them twice.**
2. **`#7bd5u` CLOSES WITH BATCH 3, WHICHEVER WAY IT GOES.** (a) is the last of the five and the item says
   ticking it never required doing any of them. **A measured *not wanted* closes it as honestly as a
   change does** — but **read whether it measured before it judged**, because *"lowest priority"* is the
   item's view of its worth, not permission to skip the reading.
3. **CHECK THE NIGHTLY AGAIN, AND CHECK WHAT IT SAYS.** `0388` should have made it clean. **`0 flagged
   0 stale` is now the expected state; ANY flagged table is new and is a finding.** The cron /
   observed-run discrepancy from owed item 3 above may still be open — **read PR #1626 before
   re-deriving it.**
4. **BRIEF PART 5 (`#ujqr5`) ONLY AFTER PART 4 IS DEPLOYED, NOT MERELY MERGED** — and he declined a
   release. **`#vleak` is behind the same gate** (`anon` has no grant on `current_shelter_id()`), so it
   is in no batch; its item carries the full reasoning and the deleted *"gated on nothing"* line.
5. **THE PROGRAMME'S CUT IS NOW MEASURED RATHER THAN ESTIMATED, WHICH IS NEW GROUND TO BUILD ON.** After
   `0389`: **95 tables carry `shelter_id`, 29 do not (21 ambiguous + 8 not tenant)**, and the trigger
   count is **five**, not six. **The 21 ambiguous are still decisions nobody has taken** — wrongly
   tenant hides data a shelter needs, wrongly shared leaks data between shelters. **One unreconciled
   difference is on the item rather than smoothed: the triage said 9 not-tenant, this reading says 8.**
   Re-measure rather than trusting either if a later part needs it exactly.
6. **`#k2vd9`'s QUESTION IS WITH HIM AND NOTHING IS TO BE BUILT OR RESEARCHED BEFORE HER ANSWER.** One
   question to the accountant, drafted on the item verbatim. The public sources were searched and do not
   carry the column layout; the Excel template is only downloadable from inside the Revenue Department's
   logged-in system, and the manual is Thai.
7. **WHEN YOU FILE AN ITEM FOR WORK ALREADY IN FLIGHT, NOTE WHO WILL TICK IT.** `#admsq` was filed on
   `backlog` **after** its stream had branched, so the item was not on that branch and its brief forbade
   adding it — **a merged PR with its item still open.** It was ticked afterwards. **Verify that rather
   than assuming it**; the shape recurs whenever the planner files and briefs in the same batch.
8. **THE HUSK AND THE HELD FOLDERS.** `planner-handover-753` cannot be cleared (above), and **this
   edition's own branch will become the second one**. `tenancy-worker-shelter-header` is held by a stray
   dev server on 3002; `done --stop-servers` clears it. **Offer once per batch; never carry it as an
   owed planner item.**

**Do NOT re-ask him about:** **a release (asked and declined 2026-11-16 — *"Not yet"*)**; the
cross-shelter operator (*"Yes, me"*); the microchip key (*"Across all shelters"*); `#pl7aq`'s launch
date; `#dqgy8`'s five answers; `#uatwk`'s release-merge decision; `#7bd5u`'s quiet run (**offered twice
and now briefed**); `#rqv5c`, `#aaqtl`, `#kxksr`, `#mzu7v`, `#z04wr`, `#civwx`, `#8dfud`, `#j4m8w`,
`#8t3rk`, `#00e3u`, `#k2vrj`, `#x5tbv`; the product name or which TLD; the adopter-portal exception;
`test-plan` being advisory; merging a green PR; **or anything on `753`'s, `752`'s, `751`'s, `750`'s,
`749`'s and `748`'s do-not-re-ask lists.**
