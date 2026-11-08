# Planner handover — edition `708`, 2026-11-08

**This is a DELTA against `699`.** It says what changed, corrects its predecessor, and reports what each
of `699`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so batch 3's figures were not in it — AND THEN THIS
EDITION SAT UNMERGED FOR A DAY, WHICH IS WHY THEY NOW ARE.** Batch 3 — `partner-contact-type-app`,
`events-card-reads`, `audited-tables-drift` — was handed over at about 02:30Z and had not been opened.
It has since merged, and **the postscript at the foot of this document carries its actuals**, which no
edition has ever been able to do for its own last batch. Nobody asked for this edition; the counter did.

---

## THE LEAD: THE NEW STEP ORDER HELD, AND IT IS THE FIRST PLAN IN A WEEK THAT COST HIM NOTHING UNPLANNED

`699`'s whole lead was that `SKILL.md` ran the paperwork before the delivery by construction, and that
Lutan had to diagnose it himself after saying it four times in one day. **It was reordered in that plan
and this is the first edition able to report on it: it works, and there is nothing to correct.**

**Both of this plan's remaining setups ran sync → worktrees → briefs → hand-over list → paperwork.** The
hand-over list went out before a single actual was read, before any PR body, and before
`docs/backlog.md` was touched. **He raised it nought times.** The two interruptions this plan cost him
were both planned questions on his own items, and the one unplanned cost of the previous round — a
`guarded-install.mjs` that refused while his own dev server held the main checkout — **did not recur at
either setup.**

**What the next planner should not conclude from that.** The order is not the only reason. Both of these
were **resumes**, where the skill's own note says nothing in the paperwork feeds the setup. **A plan from
SCRATCH still cannot put the setup second**, because choosing the items is what decides which worktrees
to make, and that case remains untested under the new order. **Say so in one line and get the list out
the moment the folders exist**, exactly as the skill now says.

---

## WHAT `699`'s OWED ITEMS AND WARNINGS DID

- **`check-stale-titles.mjs` — DISCHARGED, and the answer is cheaper than two plans of carrying it.**
  `699` was right to say *"still untriaged after two plans; say so plainly rather than carrying it
  silently a third time"*. Triaged: **all seven candidates are false positives.** The heuristic trips on
  the words *decided*, *question* and *waiting* appearing in titles that are **themselves the answer** —
  which is exactly what this project's own title rule tells a planner to write. **So it will keep
  reporting those items for ever and that is not a defect in the items.** It exits 0 by design and is
  deliberately not in CI. **Do not carry it as owed again; run it, expect false positives, and spend the
  minute on the items whose titles genuinely lie** — which is the next bullet.
- **The stale-title fault fired for a FIFTH and SIXTH time, and this is the one habit that keeps paying.**
  `#40oz4`'s title was rewritten **by its own stream** (#1382), correctly and unprompted — the first time
  a stream has done that rather than the planner. **`#ay3d6`'s was not**, and still read *URGENT … a meme
  or a photo cannot be attached to a resident at all* after **both halves had been settled by
  measurement.** Retitled by the planner (backlog `4c9ba1d3`). **Read the TITLE of every item a stream
  touched, alone, and ask whether it still says what is open.** It is one minute and it has now caught
  six.
- **`stream-usage:` — 5 of 6 across the two batches, and the regression `699` called unexplained now has
  an explanation.** Batch 2 went **two of three**: `partner-contact-type-schema` and
  `photo-save-confirm-app` posted, **`assistant-tag-retry` did not**, and its session is gone, so its
  figure is **`unmeasured`, never guessed**. `699` asked for one line in every brief; **it got one, in the
  finishing paragraph, and the one stream that missed it was the one RESUMING AN EXISTING BRANCH** —
  it reached the merge by a different path from its two siblings and skipped the step that lives in a
  closing paragraph. **So the mitigation is half-right and the fix is positional, not verbal: name the
  comment as a NUMBERED DELIVERABLE.** The skill already knows why — a question in step zero is context,
  and context is not reported on; a chore in a closing paragraph is the same thing. **Batch 3's briefs
  still carry it as prose, deliberately, so batch 3 is the control. If one of its three also posts none,
  the prose version is proven insufficient at two of six.**
- **The `free`/`0 ahead`/`nothing beyond main` snapshot rule fired twice more and held.** Four batch-1 and
  batch-2 folders read that exact signature; `gh pr list --state all --head claude/<slug>` confirmed a
  merged PR for each. **One command, and it is still the rule that saved #1356 from destruction.**
- **`ArtifactData` and the priorities panel: reachable, and `699`'s "unreachable" was an unloaded tool,
  not a broken panel.** Read again this plan. Do not inherit a conclusion that a tool is down.

---

## THE BANDS

**Five clean readings this plan (`compacted=no rescoped=no finished=yes`), and the method held on all
five.** Nothing here moves a row in the skill's table.

**BATCH 1 IS THE CLEANEST TEST THE `medium` ADJUSTMENT HAS HAD.** He set `medium` on all three against
bands written at `low`, and **all three land inside or just under the +25%-adjusted band** — read against
the `low` bands, two of them look like overruns and are not. **Always state the effort beside the figure
and the adjusted band beside the raw one**; a `low` band quoted at a `medium` stream manufactures a false
overrun, which is how a good band gets "corrected" into a bad one.

**AND THE DIAL RECOMMENDATION IS NOW SETTLED, BY HIM, 2026-11-08: *"Keep recommending low"*.** Asked
directly after that batch. So the band table stays written at `low` and every hand-over list keeps naming
`sonnet` / `low`. **Two things it does not mean.** It is **not a ceiling on him** — the dials are his, and
never blocking his paid usage is a hard rule; a `medium` he sets is a choice, not a deviation to flag.
And it does **not** license recommending `low` harder to make an overrun go away. **Asked and answered;
do not put it to him again.**

**The one reading worth banking as a confirmation:** `partner-contact-type-schema` came in **28% under its
adjusted band** because its brief forbade all `src/` work, handed it the enum value, and told it `0334`
might turn out to be empty. **It proved the second migration UNNECESSARY**, which is the cheapest
deliverable there is. **A brief finding, not a model finding.**

**FLOOR RE-DERIVED from `tokens − messages` on this plan's five comments: 106,077 · 106,413 · 107,389
(batch 1), 106,492 · 107,243 (batch 2)** — flat against `699`'s 106.8k–107.5k. **Never carry it forward.**

---

## ONE DURABLE FACT PROMOTED INTO THE SKILL RATHER THAN CARRIED HERE

**A decision of his can create a migration slot out of nothing**, which no rule anticipated: batch 3 was
composed as carrying no migration and his answer to `#yacd2` turned it into schema work. **The rule is now
in `SKILL.md` beside step 5's rule 3**, with the mechanism, so this edition does not have to carry it and
the next one does not have to re-derive it. **Promotion is the lever on this document's length; wordsmithing
is not.**

---

## WHAT THE PR BODIES HANDED BACK

**Three batches, three for three on the report-and-let-the-planner-file mechanism.** Every stream wrote
its findings into its PR body and said *for the planner to file* rather than editing `docs/backlog.md`.
**Treat that as mechanism now, not hypothesis.**

- **`#nssnt` FILED** (`## Resident operations`, backlog `4c9ba1d3`), from #1382's *Found, not fixed* list,
  both halves in one item because both are on `/photos/add`: an empty `photoCategoriesFor` leaves the
  Drive `folder` **undefined** — filed as **NOT ESTABLISHED**, because nobody has shown the empty case is
  reachable, and establishing it is the item's first job — and the approval queue heading tells an
  approver a no-place photo is *"tagged to an enclosure"*, which `#40oz4`'s part A made untrue.
- **`#ay3d6` RETITLED, not ticked.** Both halves answered **by measurement, and the two agree**: #1380
  shipped the meme half with an empty-state message; #1382 drove `/photos/add` and found **2 residents on
  a card-only login AND on Admin**, the two the dev database held. **His confirmation that he was on
  Admin is what made it conclusive** — Admin sits outside the card system, so no card could have emptied
  his picker, and the item's four card-shaped candidate causes are all dead. **What he saw was the
  cleared test data (#1377).** One empty-state message on `/photos/add` is all that is left.
- **`#xkfsv`'s app-half SPECIFICATION was quoted into the brief rather than re-derived.** #1381 wrote the
  files, the lines, the Thai word it suggests and *"nothing contradicts the item"* under its own heading
  *for the planner to quote*. **That is the schema-half-hands-the-app-half-a-specification discount the
  skill records, and stream 7 is banded at the bottom of its row because of it.** Its own last line said
  the line numbers came from the planner's brief and were not re-read — **and two of the four had moved**,
  so the new brief carries today's and tells the stream to re-read either way. **A specification is a
  discount; its line numbers are not evidence.**
- **Nothing to file from #1383.** It closed `#a7r3k` and `#bqs1w`, cited `#y1dqu` for the unreviewed Thai,
  and **fixed** `scripts/dev-assistant-model.mjs` rather than building its own — which is the outcome
  naming the apparatus in the brief was meant to buy, against `assistant-v2-tools`' 440,348 tokens spent
  standing up a model server.

---

## OWED, AND WHO OWES IT

1. **`#uat7p` — his**, fully specified in `699` and unchanged. **`#uq4vz` rides with it.**
2. **`#d3cw7` — ANSWERED 2026-11-08, asked directly: ONE CARD opens diet settings.** Retitled on the
   `backlog` branch so the title alone says nothing is left to decide. **Still do not widen either card**;
   that was the wrong shape while the question was open and it is the wrong shape now. One half stays
   **not established** and is the planner's: whether any live role holds exactly one of the pair, which no
   existing check can answer.
3. **`#40oz4`'s part B — his, and it is the only thing on that item.** #1382 could not reproduce the blank
   Folder dropdown on Admin in English or Thai — four readable options — so it hardened the control and
   kept it. **Cause unproven, and it needs his own eyes on his own phone.** No stream can close it.
4. **`#oeglm`'s third reading — his, and it is one command.** The Pi's `sshd` config could not be read
   unprivileged, so password authentication, root login and the listen address are **unknown, not assumed
   safe**. Passwordless sudo on the Pi covers only the four service commands. **One `sudo sshd -T`.**
   TightVNC on the PC still has no IP restriction, and the PC holds production secrets.
5. **The 54 unreferenced Drive files — his**, on his Desktop since 2026-11-07.
6. **Six leftover worktrees — the planner's.** All six of batch 1's and batch 2's folders read `free` with
   a merged PR; `drive-buckets` is `HELD` by its own session and must be asked about, not torn down.
   `/clean-streams` does the round. **Nothing is lost by leaving them a day, and `done` refuses a held
   folder anyway.**
7. **CHECKED 2026-11-08, AND IT FIRED: 3 of 3**, against 2 of 4 the plan before. All three of batch 3's
   briefs carried the line and all three PRs posted a comment. **One reported `tokens=unmeasured
   messages=unmeasured` rather than guessing**, which is the rule working and not a miss. The next plan's
   briefs carry it as a numbered deliverable rather than as prose.

---

## POSTSCRIPT, 2026-11-08: THIS EDITION SAT UNMERGED, AND THE LESSON IS NOW IN THE SKILL

**It was written, committed and pushed on 2026-11-08 and no PR was ever opened**, so `main` still read
edition `699` for a day and its own test plan was left untracked. **Sixth instance of the finish-line
fault and the first in the planner's own paperwork** — promoted into `.claude/skills/plan-day/SKILL.md`
under step 8 rather than carried here, because it will still be true in three rounds. **It was caught by
`ahead 1` with `free`, which the skill calls unsubmitted work rather than a leftover, and by
`gh pr list --state all --head` returning nothing at all.**

## BATCH 3'S ACTUALS, WHICH THIS EDITION CAN NOW CARRY

Read from the PRs' own `stream-usage:` comments on 2026-11-08; the table is in `.plan-day.md`.

- **Both measured figures landed inside their bands**, one at `medium` and one at `low`, and the +25%
  adjustment held again: `partner-contact-type-app` **219,022** at `medium` against 150–190k at `low`
  (188–238k adjusted), and `audited-tables-drift` **231,270** at `low` against 185–235k.
- **`events-card-reads` reported `unmeasured` and that is a correct reading**, not a gap. It is kept out
  of the bands.
- **THE FLOOR HAS MOVED UP AGAIN: 110,816 and 107,579** from `tokens − messages`, against `699`'s
  106,847 and 107,500. The drift is slow and upward and **110,816 is the highest yet. Never carry it
  forward; re-derive it each batch.**
- **The best yield was again the PR bodies, and two streams handed work over explicitly.** Three items were
  filed from them (`#q8m4t`, `#v2p7k`, `#n5j3w`); the strongest is that **`card_includes` has no audit
  trigger**, so a change to what a card applies leaves no trail while the same change to `card_grants` is
  recorded — in a repository whose first rule is that a card is the only thing that may grant access.
- **And one claimed deliverable had not landed.** `card-count-truth`'s decision file states that a
  `CLAUDE.md` sentence "now reads that it passes"; `CLAUDE.md:49` still says it does not. The same
  stream's script half landed correctly. **CI, the test plan, the backlog tick and the usage comment were
  all green**, and one grep found it. It is now a stream of its own.
