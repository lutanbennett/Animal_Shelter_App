# Planner handover — edition `663`, 2026-11-06

**A delta over `654`.** It covers one plan of **nine streams in three batches** — batch 1 (#1315,
#1316, #1317), batch 2 (#1318, #1319, #1320), batch 3 set up — **plus three streams Lutan asked for
by name mid-plan and which re-cut batch 1 around them** (#1310, #1311, #1312: the locked landing
page, the public wordmark, and the install guard).

> **Written at the last batch's SETUP, as the rule requires, so ITS figures are NOT in it.** They
> land in `672`.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `672`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## `654`'s WARNINGS: what each one did

- **`#m8x2r`, the main checkout that could not build — CLOSED, and by a stream rather than by Lutan.**
  `654` recorded it as his alone, because the classifier had refused to stop the two defunct
  `npx next start -p 3100` processes holding the SWC binary. **The right fix did not need them stopped
  at all:** #1312 made `guarded-install.mjs` detect a live `next` pointing at the checkout and
  **refuse before deleting anything** — exactly what `654` proposed. It ran clean this round.
  **The lesson `654` half-reached: when something is blocked on a person, ask whether the blocker is
  the TASK or only the route you tried.** A refused `taskkill` made it look like his; a guard made it
  nobody's.
- **`654`'s lead — deliverable first, paperwork after — FIRED, and only PARTLY held.** Batch 3's
  worktrees were again created *after* the actuals capture and five backlog edits. **This time most of
  that was a prerequisite rather than paperwork:** reading the PR bodies is what produced `#h3w7c`,
  which **became stream 9**, so the batch could not have been composed without it. **That distinction
  is worth keeping — "does the plan depend on this?" is the test, not "is it on my checklist?" — but
  do not let it become the excuse that swallows the rule.** `.plan-day.md` and this file were written
  after the hand-over, which is the part that matters.
- **`#dklvq` to the front of the next plan — HELD, and this is the second plan it has missed.** It was
  displaced again, legitimately: his priorities panel plus two web-page items he asked for by name
  filled batch 1. **Unstarted, and now owed twice.** Say so in the next plan rather than listing it a
  third time as though it were new.
- **Read the priorities panel on a RESUME — FIRED and worked.** Read 2026-11-06, six items, and it
  decided the order of the last batch. **His number 3 is not buildable and is said so explicitly
  rather than quietly skipped** (see *Owed*, item 5).
- **Role-shaped instruments — HELD, fourth edition running.** `check-menu-coverage.mjs` still loops
  over roles and says so in its own first line. Nothing was done, nothing pretended otherwise.
- **Thai unreviewed — FIRED every time, and the briefs held.** Every stream touching a dictionary said
  in the PR, the decision file and the test plan that Thai went in unreviewed. **None ticked it as
  reviewed.** The brief block works; leave it alone.
- **Prose composition by heredoc or template literal — FIRED ONCE MORE, differently.** This time a
  `node -e` double-quoted string whose **backticks were executed as command substitution**: the output
  read `import: command not found` and nothing was written. **Same family, new member.** The shape
  that works is unchanged: **write each block with the Write tool, run scripts by path, never inline.**

---

## THE LEAD: A STREAM RE-ASKED HIM SETTLED QUESTIONS, AND THE BRIEF DID IT

**His words: *"WHY IS PUBLIC WORDMARK ASKING ME ALL THE QUESTIONS AGAIN THAT WE ALREADY DECIDED"*,
then *"itis so confusing"*.** It was asking about capital versus lowercase *for*, and whether a place
name should stay — both answered minutes earlier, in that chat.

**The cause was one line in the brief: *"READ `#kygb3` IN FULL".*** That item is a ~6,000-word single
line carrying four superseded passages and several *"put it to him in one line"* instructions, written
when they were genuinely open. **The stream obeyed the brief exactly**: it read the item, found
questions marked as his, and asked them.

**This is a new failure mode and it is the MIRROR of the one the skill already warns about at length.**
That warning is against a brief **more certain than its item** — three paragraphs of worked examples.
**This is a brief LESS certain than the conversation**, because it delegated the reading of a long item
instead of extracting the answers. **An item's superseded passages are history to a planner who
watched them being superseded, and live instructions to a session meeting them cold.**

**The fix, applied the same hour and worth copying:** the brief's header became a **seven-row decision
table** — question, answer, whose it was, when — and the read instruction was **withdrawn in those
words**: *"following it is now a fault."* The live session was sent the correction directly.

**So: never tell a stream to read a long item in full. Extract the decisions into a table in the
brief.** If you cannot, you have not finished reading the item yourself.

---

## THE ACTUALS, AND THE TWO BAND CORRECTIONS THEY BOUGHT

Figures, floors and full reasoning are in `.plan-day.md`. **Eight of nine are clean readings**
(`compacted=no rescoped=no finished=yes`); one reported `unmeasured` and is recorded as that, **never
as a guess from a neighbour**. One reported `effort=unmeasured`, so **the dials it ran on are
unrecorded** — do not infer them from its batch. **Floors re-derived at 96,246 / 100,160 / 100,258** —
a ~4k spread where the last three batches agreed to the token, so **it is drifting again and must be
re-derived, never carried forward.**

**Both band lessons are PROMOTED INTO THE SKILL's band table rather than left here**, because a band
lesson in a handover is lost within nine streams:

- **A dangerous back-fill is a property of the SHAPE, and a good stream can remove it**
  (`approval-flag-schema`, 22% under). New row beside the public-write-path schema row.
- **"One surface across N forms" is the wrong row when the N forms read ONE column**
  (`approval-flag-app`, 24% under). Added to that row as its counter-case.

**The habit both share: read what the surfaces READ, and what the stream must find OUT — not how many
things it touches.**

---

## WHAT THE PR BODIES GAVE US, AND IT IS AGAIN THE BEST VALUE IN THE ROUND

**Three findings, none on any item, all filed before anything was briefed. A stream reports; only the
planner files.**

- **`#f214a` turned out to be LIVE on production rather than hypothetical.** The item said a medical
  file *"can"* become a resident's public profile picture; #1315 read `0314:81` and `0313:58` and
  established that it does. **Its fix SQL was written and unapplied only because the migration slot
  was taken** — so it moved a batch earlier and shipped as `0319`.
- **A second, different fault came out of the same read (`#k2p8w`): neither path checked whether a
  photo was ever approved at all.** Since `0318` that includes a photo somebody looked at and
  **refused**. **Closed by `0319`, and the planner ticked it** — the stream could not, because the
  item existed only on the `backlog` branch while the fix landed on `main`, and it said so in its PR.
  **That asymmetry will recur: a stream cannot tick what its checkout cannot see. Watch for it.**
- **Two public surfaces have no approval stage at all** (`#h3w7c`): a donation channel's QR code and a
  shelter friend's logo, both plain columns public through their own views, let through by
  `is_public_drive_file()` on view membership alone. **The planner opened all five migration files
  before filing it** rather than taking the enumeration on trust. It is a stream in the batch just
  handed over.

**The habit that produced all three: read the whole PR body, not just the `stream-usage:` line.**

---

## THE PLANNER'S OWN MISS, AND THE CLAUSE THAT CAUGHT IT

**A brief forbade a migration and was wrong to.** `expense-visit-costs` **added `0321` anyway and said
so in its first paragraph**, because `/management/expenses` is a security-definer function whose card
cannot read `clinic_visits`. **That is the declared-crossing clause firing exactly as designed** — and
its only safety net: two migration-carrying streams landed in one batch, and did not collide by luck.
**Promoted into the skill** (step 7) so it outlives this edition: read how a surface reads its data
before pricing it as schema-free.

---

## A NEW RULE FOR FOLDING, PROMOTED INTO THE SKILL

Two of the saved batch 3's items were **folded into their neighbours**: `#f6p2d` (a sentence `0320`
made wrong in a second way) and `#r6v8k` (a caption in a file its neighbour owns). **The rule —
fold an item whose correctness depends on what another stream in the batch changes — is now in the
skill beside the existing fold rule**, so it is not re-derived. **The slot it freed was filled by a
PR-body finding**, which is the round's neatest argument for reading the bodies.

---

## WHAT IS SET UP AND WHAT IS OWED

**The plan's last batch, set up and handed over 2026-11-06.** Composition, the collision check and the
reasoning are in `.plan-day.md`.

| slug | items | port | migration | estimated |
|---|---|---|---|---|
| `deceased-record-widen-app` | `#314hq` (D) app half + `#f6p2d` | 3010 | no | 200–260k |
| `resident-photos-uploader-gate` | `#q8h4v` + `#r6v8k` | 3011 | no | 170–215k |
| `approval-flag-public-surfaces` | `#h3w7c` | 3012 | **`0322`+** | 150–195k |

All three recommended sonnet-5-5 / low. **He sets the dials himself** (decided 2026-11-03), so the
finishing message gives them as a list to copy from.

**Owed to the next planner:**

1. **PRODUCTION IS FOUR MIGRATIONS BEHIND, AND IT REACHES THE RELEASE NOTES.** `0318`–`0321` are all
   pending (read 2026-11-06), so the approval flag, both photo guards, the deceased widen and the
   expense-report join are live on dev and **live for nobody**. Three of this batch's briefs therefore
   say `n/a` on the release-note line and draft the wording in their decision file instead. **The
   deploy is his. Do not let a stream tick a note that depends on an unapplied migration.**
2. **`#8bz78` (reels) is first in the next plan.** Buildable, nothing left to decide, displaced for
   the second plan running — the same shape as `#dklvq`, so do not let it become a third.
3. **`#dklvq` is owed TWICE now.** Say that, rather than re-listing it as new.
4. **`#79sqf` was deliberately kept out of the last batch**, because two of its streams change exactly
   what the sweep measures. It is a census beside the thing it counts; it goes in the next plan.
5. **`#prr9h` is his number 3 and is NOT buildable** — the documents half was superseded and filed
   elsewhere, and the remaining timing half is `pending` on the Pi mirror being installed and run,
   which is his. **Say so when his order is reported, rather than skipping it silently.**
6. **`#7aev4`'s three remaining things each need a NUMBER FROM HIM FIRST** — the weekly photo volume,
   production counts of animals that would become public, and the second gate. **None may be built
   speculatively, and none is a decision he owes until somebody has the number to put beside it.**
7. **The role-shaped instruments are still role-shaped**, fourth edition. Unchanged, unpretended.
8. **Leftovers for `/clean-streams`:** a folder whose name does not match its branch
   (`Animal_Shelter_cut-release-0-43-3` holds `claude/record-0-43-3` — `done` it **by branch name**),
   and `claude/cut-release-0-43-3`, merged with no worktree. **PR #1314 is the release manager's and
   is not ours to merge.**
