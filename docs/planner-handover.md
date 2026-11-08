# Planner handover — edition `717`, 2026-11-08

**This is a DELTA against `708`.** It says what changed, corrects its predecessor, and reports what each
of `708`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so batch 3's figures are not in it.** Batch 3 —
`manual-home-tile`, `approval-queue-event-date`, `db-refusal-keys-mechanism` — was handed over at
about 10:00Z and had not been opened. `708` carried its own last batch's actuals in a postscript only
because it sat unmerged for a day; **do not plan on that happening again.** This edition merges on green.

---

## THE LEAD: THE SKILL WAS CUT BY 85% ON HIS INSTRUCTION, AFTER HE ASKED THREE TIMES IN ONE DAY WHERE HIS PLAN WAS

**`.claude/skills/plan-day/SKILL.md` went from 2,176 lines to 331** (PR #1396, merged `e9536dd7`), with
the evidence and incident history moved to `reference.md` (421 lines) and the verbatim brief blocks to
`brief-blocks.md` (290). **His words: *"Yes cut down the skill and then we can build back in if needed
later"*.** Nothing was deleted — every decision is in one of the three files, and `git log` has the
2,176-line edition if a rule now reads as too thin.

**Read the cause, not just the size, because the obvious diagnosis was wrong.** On 2026-11-08 the
planner set up two batches in a row that he had never been shown, told him he had "missed" a batch he had
not, and then pointed him at a list in an earlier message instead of giving it again. **It was not a
step-order problem** — `708`'s lead reported that the new step order had held — **it was that the
document had grown past the point where a session could satisfy it and deliver to him in the same turn.**
The planner was satisfying the file. **Three rules came out of it and they are now the first things in
the skill:**

1. **THE ONE RULE: the list comes first.** Before actuals, findings, bands or prose — folder, port, model
   and effort per stream, **verified from the `.port` files and the `.brief.md` on disk**, never quoted
   from memory, and **never "the list is above".**
2. **A saved plan is not an agreed plan.** `.plan-day.md` is invisible to him, so a batch written by a
   *different* conversation is presented before it is set up. A resume by the conversation that planned
   it may go straight to setup.
3. **If you add to the skill, something else comes out.** Written into the file itself.

**The risk this took, stated so the next planner can report on it either way:** a rule that moved to
`reference.md` may be followed less often than one that stayed. It is named in
`docs/decisions/2026-11-08-plan-day-skill-cut.md` and it is the one item left for manual verification.
**You are the first edition after the cut. Say whether it held.**

---

## WHAT `708`'s OWED ITEMS AND WARNINGS DID

- **The `stream-usage:` line as a NUMBERED deliverable fired 3 of 3 again.** That is **6 of 6 across two
  batches** since it stopped being a closing paragraph, against 2 of 4 before. **It is settled; stop
  re-testing it and keep it numbered.**
- **The six leftover worktrees: DONE.** `/clean-streams` ran at about 06:1xZ and removed all six, each
  verified as an ancestor of `main` with a merged PR. `drive-buckets` was `HELD` and was asked about
  rather than torn down, which is the rule working.
- **`#d3cw7`'s unestablished half is STILL the planner's and was not done this plan** — whether any live
  role holds exactly one of the pair of cards `/admin/diets` needs. No existing check can answer it.
  **It is now a question about roles, which is the one shape the card rule allows** (who is affected
  today, clearly labelled transient) — so if you carry it, carry it that way or restate it per card.
- **`#uat7p`, `#40oz4` part B, `#oeglm`'s third reading and the 54 Drive files: all still his**,
  all unchanged, all restated in the OWED section below rather than re-argued here.
- **`708` itself was the sixth instance of the finish-line fault** — written, pushed, never PR'd. The
  lesson is in the skill's step 8 and **did not recur**: this edition's PR is opened in the same turn as
  its text.

---

## THE BANDS

**Seven valid readings in this plan, five inside, one under, one over.** All of batch 2 was
`finished=yes`, `compacted=no`, `rescoped=no`, so all three count. All three ran on **`medium`**, which
is his choice and not a deviation; the **+25% adjustment held on both of the two that landed inside.**

**The one miss is worth more than the six hits, because the number was not the problem — the ROW was.**
`suppliers-app` came in at **440,815** against 200–260k at `low` (250–325k adjusted). The planner priced
it from *"creates one new surface people submit data through"* (200–270k) and **missed that it also
DELETED what it replaced** — suppliers leaving Contacts — which is the *"new surface that also DELETES
what it replaces"* row at 260–330k (325–412k adjusted). **Even that row under-prices it by 7%, so revise
it upward from this reading.** The lesson for banding: **read your own one-line scale description back
and check it names everything the stream must do.** "New surface + its card + 7 readers" named the
building and not the demolition.

**THE FLOOR: 107,662 · 111,142 · 111,478** from `tokens − messages`, so **≈108–111k on 2026-11-08**,
which agrees with batch 1's 107–111k and with `708`'s 107,579–110,816. **111,478 is the highest yet. The
drift is slow and upward. Never carry it forward; re-derive it each batch.**

---

## ONE DURABLE FACT PROMOTED INTO THE SKILL RATHER THAN CARRIED HERE

**The daily `git merge backlog` resolution rule was WRONG as written, and it is fixed in step 1.** It
said to resolve item-by-item taking each from `main`. On 2026-11-08 **two items were newer on `main` and
one was newer on `backlog`**, because he had filed an answer there that morning. The rule now says
**take each from its NEWER side, compare the two texts, and have your script exit non-zero if an anchor
is missing.** A planner following the old wording would have silently discarded his own answer.

---

## WHAT THE PR BODIES HANDED BACK

**Still the best yield per turn spent, and batch 2 handed back one genuine production risk.**

1. **`0338`'s catch-up back-fill has NEVER RUN AGAINST REAL ROWS.** #1399's own deliverable 10:
   *"Dev has no Vendor contacts, so on dev it moves nothing; the harness proves it on a row it makes
   (1 row, then 0). Not exercised on production."* So the migration that re-points Vendor contacts and
   Shelter Friends onto suppliers is **unexercised on the only database where it has work to do.** Filed
   as its own backlog item by this edition. **Whoever applies `0338` to production checks the back-fill
   moved what it should, and the count comes before the apply, not after.**
2. **`#xkfsv` is deliberately LEFT OPEN and retitled.** `supplier_contact_id` is not dropped and the
   Vendor contact rows are not retired; the brief forbade it there. **Read the retitled item, not the
   old title.**
3. **A seen-on-screen proof was recorded again with no screenshot.** #1398 read the resident name off the
   rendered page in both logins — a correct, careful pass — and said plainly *"no screenshots"*. That is
   exactly the shape `#v2p7k` was filed about, one screen over. **Batch 3's stream 10 is briefed to
   screenshot**, so this is a mitigation to check next round rather than a fault to report.
4. **A known limit recorded rather than hidden:** #1397's new schema assertion is a **named procedure
   step**, and nothing forces it to run before the `ssh`. An attestation flag was considered and rejected
   as decoration, with the reasoning in the decision file. **Do not re-propose the flag; if the step is
   skipped in a real release, that is the evidence that changes the answer.**
5. **`FRIEND_CONTACT_TYPES` is now `["Partner"]`** and the supplier path needs no replacement, because
   every live supplier is eligible. Worth knowing before briefing anything near Shelter Friends.

---

## OWED, AND WHO OWES IT

1. **`#uat7p` — his**, fully specified since `699` and unchanged. **`#uq4vz` rides with it.** Nothing is
   live until he deploys UAT.
2. **`#40oz4`'s part B — his, and it is the only thing left on that item.** Cause unproven; #1382 could
   not reproduce the blank Folder dropdown on Admin in either language and hardened the control instead.
   **It needs his own eyes on his own phone. No stream can close it.** Still his **#1**.
3. **`#oeglm`'s third reading — his, and it is one command.** `sudo sshd -T` on the Pi. Password
   authentication, root login and the listen address are **unknown, not assumed safe**; passwordless sudo
   there covers only the four service commands. TightVNC on the PC still has no IP restriction, and the
   PC holds production secrets.
4. **`#mx3rt` — his.** One sentence typed into Settings → Website. No code.
5. **The 54 unreferenced Drive files — his**, on his Desktop since 2026-11-07.
6. **`#d3cw7`'s unestablished half — the planner's**, carried from `708` and not done. See above for the
   shape it must take.
7. **`0338`'s production back-fill — the planner's or the release manager's**, item 1 of the section
   above. **This is the one new owed item in this edition and it is the only one with a live database
   behind it.**
8. **`#etr20` came due 2026-11-08** — one line, `max-age=31536000` in `worker/security-headers.mjs`.
   **It ships with a release cut, not as a stream.** Flag it to the release manager.
9. **DEFERRED OUT OF THIS PLAN, not forgotten, and the next plan's natural first batch:** **`#79sqf`**
   (`action-controls-sweep-8`), **`#ayl1h`** (`backlog-binary-guard`), and **`#q8m4t`** (the
   `card_includes` audit trigger) if batch 3's migration slot kept it out. **`#q8m4t` is the strongest
   security finding on the list** — a change to what a card *applies* leaves no trail while the same
   change to `card_grants` is recorded, in a repository whose first rule is that a card is the only thing
   that may grant access.

---

## THREE THINGS NOT TO RE-DERIVE, ALL MEASURED THIS PLAN

- **`#3nuwy`'s count is DONE and has drifted.** `node scripts/measure-sql-refusals.mjs` on `8c9722aa`:
  **209 live refusal messages in 86 functions; class `user` = 21 functions / 61 messages**, against
  20 / 57 on 2026-11-03. **+1 function and +4 messages in five days** — the rate the problem grows at
  while the programme runs. The first group is named in batch 3's brief.
- **`/manual` is not in the route registry**, so a manual tile cannot be route-derived, and
  **`homeTilesBase()` returns early on the card path** — a tile appended after that line is never drawn
  for the tiles-only login the item is about. `withApprovalTile()` is the shape.
- **`approve_photos` is the card for the approval queue**, and **`run_fundraising_events` is what creates
  a waiting event photo** — so proving `#v2p7k` is **two logins**, not one.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. The counter is reset by this edition's merge, so **you are planning
from scratch, not resuming.** Batch 3's three streams were handed over unopened at about 10:00Z —
**check whether they ran before you plan over them**, with
`gh pr list --state all --head claude/<slug>`, because `free` and `0 ahead` is a snapshot and not a
verdict. **And give him the list first.**
