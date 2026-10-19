# Planner handover — written 2026-10-19, after TEN workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine planned workstreams on 2026-10-19** — three batches of three, each set up only after
the previous had merged — plus one Lutan ran himself. It says where the planning loop stands, what
is blocked and on whom, and what not to re-derive. It is **rewritten every nine or ten workstreams**
and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the measurement table is the valuable part, and this round it finally has
   **nine readings on one setting**
4. this file

**The branch slug is `231`** (221 + this round's ten). Recorded so nobody redoes the arithmetic.

---

## FIRST, THE TRAP: CHECK FOR AN OPEN HANDOVER PR BEFORE YOU TRUST THIS FILE

**Run `gh pr list --state open` and look for an open `planner-handover-*` PR.** A chat once read the
file on `main`, reported its figures to Lutan, and was wrong by ten migrations, because the current
edition was sitting in an unmerged PR the whole time.

**Two handovers exist.** An open PR named `handover-refresh` is the **release** handover
(`docs/release-handover.md`), a different document. **Check which one the open PR touches before
concluding anything.**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.**
- **Mid-work exhaustion is different and still correct:** stop with words.

**Do not reintroduce a numeric stop threshold into a brief, ever.** **Model, effort, which allowance
gets spent, and whether to start at all are all his.**

**This round the allowance was never the constraint.** *Weekly · all models* moved **72% → 75%**
across nine streams — about **3% for the whole round**, in line with every round except
2026-10-18's. *Weekly · Fable* did not move at all (**48%**), because nothing this round was a Fable
item. **The 2026-10-18 blow-out was one unfinishable brief, not a trend.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`f0c3ecf6`** (#741 merged, then a `backlog` merge that needed resolving) |
| `backlog` branch | **in sync with `main`**, fast-forwarded and pushed |
| Dev database | **226 applied, 226 files, 0 pending, zero drift** |
| Next free migration number | **`0226`** (highest on `main` is `0225_role_home_tiles.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **103** — down from 112, the first fall in several rounds |
| Open PRs | **none** |
| Release | **`0.37.0` is cut, recorded and deployed.** `unreleased` carries today's lines: the meme maker, the diet-typo guard, clinic visits, the medication list, the mobile form fixes, the photo-approval change. **`0.38.0` is NOT cut** — the release manager's session |
| Leftover worktrees | **ten**, all merged or nothing-beyond-main. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The ten, in order.** Batch 1: #733 `pi-build-cache`, #734 `bills-dry-run-fixes`,
`approve-photos-card-bug` (**no PR, correctly — see below**). Batch 2: #736 `mobile-form-silent-save`,
#737 `medical-dry-run-fixes`, #738 `photo-approval-off-residents`. Batch 3: #739
`role-home-tiles-schema`, #740 `scripts-truth-fixes`, #741 `meme-maker`. Plus **#735
`resident-renames`, which Lutan ran himself and the planner did not brief.**

**Nine of ten merged. One closed with no PR and that was the right outcome.** None ended with a
built branch and no PR.

---

## THE FINDING OF THIS ROUND: THE BACKLOG WAS LYING ABOUT WHAT WAS BLOCKED

**This is the most useful thing on the page and it changes how `/plan-day` should start.**

Lutan, 2026-10-19, after being asked a third time for a decision he had already given twice:
***"already given twice, why are we losing these decisions"*** — and then the sharper version:
***"this is probably also affecting our build sequencing as things will keep getting pushed back
where you believe they are blocked but they aren't."***

**He was right, and the decisions were never missing.** Each was recorded accurately at the **end**
of a very long item, while the **title** still said "decision first" and the superseded reasoning
still sat in the middle reading as live. **Anything that skims the backlog reads the title** — a
planner, a checklist, a `/plan-day` run, a person.

**A sweep of all 118 open items found 7 whose titles claimed a block the body had already
answered.** Six were real:

| item | title said | body said |
|---|---|---|
| Videos of residents | "decision on storage first", "15 GB free" | **Decided 2026-10-18**: Drive, the shelter's **1 TB** account |
| Vet calendar | "settle whether it is configured" | **Answered 2026-10-17**: test only |
| **Assistant retention (DB-11)** | "decision first" | **Decided 2026-10-10** |
| Two auth decisions | "nobody has made" | **Both made 2026-10-07** |
| Director's who-does-what draft | invited re-asking five marks | **Answered 2026-10-06** |
| Online shop | waiting on the Director | **genuinely blocked** — correct as written |

**The cost is not the repeated question; it is the work never planned.** `assistant-retention`
(DB-11) is the proof: **decided 2026-10-10, carries a migration, buildable the whole time, and
parked as blocked by every `/plan-day` since.** Nine days. Nobody re-asks a question they believe is
already pending with the user, so a false block is **silent**.

**ACTION FOR THE NEXT RUN, and it is three lines of regex:** before choosing items, flag every open
item whose body contains `ANSWERED`/`DECIDED`/`CONFIRMED` **and** whose title contains "decide",
"decision first", "settle" or "waiting". **That scan found all six.** A backlog item filed under
Documentation asks for a `CLAUDE.md` rule making this permanent — **it is the highest-value small
item on the board.**

### The same fault, committed by the planner, within the hour

**Do not read the above as something other sessions do.** On the same day this planner:

- asserted a Home Assistant Green ships with **128 GB** from the model name, inferred ~108 GB was
  being consumed, and **wrote a paragraph into the backlog telling a future session to go hunting
  through Lutan's backups, recorder retention and camera footage.** His box has **28 GB**. The
  entire concern was manufactured by an unchecked assumption, and he corrected it.
- appended **six separate dated notes** to the Home Assistant item in one day — the exact burying
  pattern above. They were consolidated into one block before this file was written.

**So the rule is not only "rewrite stale titles". It is also: do not assert a fact you could have
asked for in one line, and do not let one item accumulate six appends.** Both belong in the
`CLAUDE.md` item.

---

## THE SECOND FINDING: THE FLOOR IS NOW MOST OF A STREAM

**Nine streams measured, every one `claude-sonnet-5-5` / `low`, no bounce observed.** This is the
first round with a clean, consistent set of readings.

| slug | estimated | actual | |
|---|---|---|---|
| `pi-build-cache` | 160–240k | **129,663** | 19% under |
| `approve-photos-card-bug` | 140–220k | **130,569** | 7% under |
| `bills-dry-run-fixes` | 200–300k | **148,402** | 26% under |
| `mobile-form-silent-save` | 140–200k | **145,534** | inside |
| `medical-dry-run-fixes` | 130–190k | **145,026** | inside |
| `photo-approval-off-residents` | 170–240k | **193,219** | inside |
| `role-home-tiles-schema` | 130–175k | **146,301** | inside |
| `meme-maker` | 250–380k | **203,258** | **19% under** |
| `scripts-truth-fixes` | 140–200k | **203,316** | **2% over** |

**Batch 1 came in 7–26% under the old bands. The bands were reduced, and batches 2 and 3 then landed
inside seven of nine.** The reduction was right. **Keep it.**

**The floor measured ~86.6k on all nine, identically** (System tools 38,771 · MCP ~20,000 · Memory
11,054 · System prompt 10,109 · Skills 6,601). **Messages — the actual work — ranged 40,608 to
114,356.**

So **the fixed overhead is 43–67% of a well-briefed stream.** Three rules follow:

1. **Rule 8 (fold small items) is the dominant lever, by a wider margin than previously recorded.**
   All three defect folds — four Management defects, three medical, four mobile — came in at
   **145–148k, barely over the floor.** Those eleven defects as eleven separate streams would have
   cost **~950k of floor** before any work. **The number of streams created, not the model and not
   the effort, is what moves the weekly window.**
2. **A defect fold is a QUICK WIN, not a medium.** Three or four precisely-described defects with
   named files is ~145k. **Band them 130–190k.**
3. **Schema + code in one stream is the dearest ordinary shape** — 193,219, with 104,259 of
   messages. The extra was the migration ordering, the recompute proof, the manual, the decision
   file and a real release note. **Band it 170–240k and expect the upper half.**

### The one overrun, and it is the third axis again

**`scripts-truth-fixes` was banded 140–200k as "two script files" and came in at 203,316.** The band
was wrong for a reason already written in `SKILL.md`: **its real work was verifying twelve
acceptance-matrix rows against the running app**, which is **live interactions**, not editing a
script. **Reading a file is cheap; opening a screen to check what it says is not.**

**So the third axis applies to verification work, not only to walkthroughs.** When a brief says
"check each of N rows against the app", band it by **N screens**, not by the number of files
changed.

### A stream that finds no defect is cheap, and is not a failure

**`approve-photos-card-bug` cost 130,569, produced no commits and no PR, and was correct.** It
established the card is in the build production runs, could not reproduce the fault on dev or on a
production build, and found the likely answer: **the card is 23rd of 25 in the Available list,
below the fold, and Lutan's screenshots were cut off after the first six.**

**Its brief said in advance that "the cause, named with evidence" was a complete deliverable and
that a runbook fix was an acceptable result.** That is why it stopped cleanly instead of inventing a
change to justify the branch. **Keep writing investigation briefs that way** — and note the brief
also told it to say loudly if production turned out to be serving a stale build, which is the
finding that would have mattered most.

---

## A MERGE CONFLICT THAT THE DOCUMENTED METHOD WOULD HAVE RESOLVED WRONGLY

**`CLAUDE.md` says: "If `main`'s line is strictly longer and differs only where the `backlog` line
ends, it is the backlog line plus a tick and a note — take `main`'s side without further thought."**

**On 2026-10-19 the opposite happened and that rule would have destroyed scope.** The meme-maker
item conflicted. `main` had it **ticked and SHORTER** (1,983 chars), because #741 shipped stage 2 as
scoped. The `backlog` branch had it **open and LONGER** (4,055 chars), because **Lutan widened it
three minutes before #741 merged** — memes from outreach, maintenance, project and uploaded photos,
not only residents'.

**Taking `main`'s tick would have marked unbuilt scope as done.** The resolution was the union, left
**open**, with a note recording what shipped (#741, resident photos) against what remains (the
widening, which now carries schema).

**So: check the LENGTHS and the TICK together, not the tick alone.** `main` shorter and ticked means
the item grew on `backlog` after the feature branch forked — **take the backlog text and decide the
tick on the evidence**, not on which side has it.

---

## RULINGS BY LUTAN THIS ROUND — settled, do not re-litigate

1. **Only Management holds the Approve photos card.** The 2IC does not get it now; he will add it
   himself later, on Who does what, as the test that the card works. Shipped in #738 with `0224`.
   **He was asked this three times and answered twice. Do not ask again.**
2. **Senior Staff is not a thing.** *"we now have a different structure with us assigning cards to
   roles so any question about what a role should be able to do is not applicable as it's
   configurable in the system."* **The roles paper recommended this closure on 2026-10-03 and it sat
   open sixteen days.** Closed and moved to Completed.
3. **Pi failover: option 1** — make saving safe to repeat, the proper fix, zero refused window — and
   **the drills first.** This supersedes the paper's own recommendation of doing the cheap options
   2 and 3 first. **Then deferred on priority:** *"We will push this down the priority list for now
   so we can finish all the build work first."* **Both items moved to the end of Architecture.
   Nothing about it is blocked or undecided.**
4. **Purchasing keeps the shared read** on stock receipts. That removed the schema half entirely;
   the scripts-only remainder shipped in #740.
5. **The Thai site uses the standard `/th/` prefix.** Sequenced after the domain cutover, which is a
   dependency, not a decision.
6. **Only Admin may read other people's assistant rows.** Closes the Management-review question.
   Note `0150` may already express this, so it may close by confirmation rather than new SQL.
7. **The shelter's Drive account holds 1 TB, not 15 GB.** Corrected in two places; a decision file
   on `main` still has the wrong figure and has its own item.
8. **He will create a throwaway Supabase project** under `lutan.bennett1@gmail.com`, which unblocks
   both go-live rehearsals. **Ask him for the project ref, never the password.**

---

## Home Assistant: the assessment is DONE, do not redo it

Lutan asked to be stepped through the monitoring setup and said plainly he is **not across Home
Assistant**. The assessment was done by asking for **one screen at a time and waiting**, and that is
the method for the build too — **a session cannot see his Home Assistant and must not be given a
way in.**

**His setup:** Home Assistant **Green**, HA OS, **Core and Supervisor 2026.10.2**, OS 18.3, **28 GB
disk with 19.4 GB free** (healthy), **29 integrations**, **HACS installed — he installed it himself
from a guide**, apps are **Get HACS, Matter Server, Studio Code Server, Terminal & SSH**, Companion
app **installed**, **no Home Assistant Cloud subscription**.

**Five things that changed the plan, all recorded on the item:**

1. **"Add-ons" is now called "Apps"** in Core 2026.10.2, same menu position. He could not find
   Settings → Add-ons for this reason. **Write "Apps" everywhere and say web guides mean the same
   thing.**
2. **Nothing needs installing on the HA side.** Studio Code Server is the one to write instructions
   against. **The only install left in the whole plan is Glances on the Pi**, and Terminal & SSH
   runs on the Green, not the Pi.
3. **The phone step is done.** Drop the Telegram fallback.
4. **Remote access is out of scope for v1 and no subscription is to be proposed.** Alerts already
   reach him away from home free.
5. **Write exact steps and do not thin out the work.** "Not technical" here means "name the
   buttons" — he installed HACS himself from a guide, so he can execute precise instructions.

**The integration list is deliberately NOT in the repo and must not be.** This repository is public
and that list is his home's security and occupancy surface. **The whole-of-house dashboard he also
wants is a Desktop deliverable and a conversation, not a workstream** — and two design notes are
carried on the item: he runs **five switch-and-plug ecosystems plus Matter and Thread**, so naming
and grouping is where that work is, and **nothing measures electricity**, though his smart plugs may
already report it.

---

## What briefs should do

All three standing blocks are in `SKILL.md` — the finish-line block and the stop rule at the top,
the pre-push test-plan block at the end. **Copy all three verbatim.** No stream this round pushed a
broken test plan, and none ended with a built branch and no PR. What else earned its place:

- **PUT HIS ANSWER IN THE BRIEF VERBATIM, WITH "DO NOT ASK AGAIN" ABOVE IT.** New this round and it
  worked. `photo-approval-off-residents` carried his Management-only ruling word for word and did
  not re-ask.
- **SAY WHAT A NO-DEFECT RESULT LOOKS LIKE**, for any investigation. The one stream that found
  nothing stopped cleanly because its brief said that was a complete outcome.
- **TELL A STREAM WHICH FILES THE OTHER STREAMS OWN, BY NAME.** Used in all nine; nobody crossed.
  With two batches touching scripts and cards, the per-file lines are what kept them apart.
- **NAME WHAT RECENTLY MERGED THAT CHANGES THE TASK.** `scripts-truth-fixes` was told that #734,
  #737 and #738 had changed behaviour its rows described, and that #738 had already edited its file.
  **Without that it would have "fixed" rows to yesterday's behaviour** — worse than the wrong rows,
  because they would read as freshly verified.
- **NAME THE ONE THING THAT CAN HURT SOMEONE.** The sharpest was the meme maker's: a joke made from
  a dying animal's photograph reaching the open internet under the shelter's name. It wrote the
  refusal test first.
- **For a schema half, three sentences:** the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held again.

---

## Leftovers — ten worktrees

All at `0` ahead or squash-merged: `approve-photos-card-bug`, `bills-dry-run-fixes`,
`medical-dry-run-fixes`, `meme-maker`, `mobile-form-silent-save`, `photo-approval-off-residents`,
`pi-build-cache`, `resident-renames`, `role-home-tiles-schema`, `scripts-truth-fixes`, plus
`planner-handover-231` once this merges.

**Most will still be `HELD` by their own sessions. Close the sessions first; ask, do not tear one
down.** `/clean-streams` does the round.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The placement row with a Foster type and an Unassigned enclosure** — only Lutan can say which
  field is wrong. Carried from last round, still open.
- **The Cloudflare purge token** — #720 is built and merged and waits on one value from him.
- **The second admin account**, which gates shipping the 2-step refusal.
- **Confirming the Pi refuses a request without the origin key** — the code is deployed; the
  confirmation is not done.
- **The vet calendar on production** — he answered that it is test-only; what is open is whether to
  set the token now or record it as dormant on purpose, plus the missing Worker binding.
- **The Drive move** — he signs in to the shelter's account himself.
- **The photo lightbox at 375 px**, explicitly his to look at and tick.
- **The Supabase/Cloudflare/Google checklist** — he said he was doing it himself; it cannot be
  ticked until he confirms.
- **Who can read what of a contact, on production** — a person must do it on real rows.
- **Watching the Head of Medical and the Head of Maintenance work** — nobody has.
- **The spare SSD** — the first was a counterfeit; buy, probe, clone, boot test.
- **The five remaining acceptance dry-run role passes** — ordinary streams, one role each. **Do not
  brief them as one.** Admin is done.
- **The Director:** the domain transfer, **which gates the whole cutover**; the community-dogs
  number; the donation figures; phone and LINE; four pages of Thai wording; the tagline; the trust
  block; adoption cost; the shop questions sheet; the drop-ship prerequisites.
- **`from-zero-rebuild` and the restore rehearsal** — unblocked the moment his throwaway Supabase
  project exists.

---

## Blocked, and on whom

- **Lutan:** the Foster/Unassigned row; the purge token; the second admin; the origin-key
  confirmation; the vet calendar token; the Drive move; the five red harnesses; the Bills tile; the
  dashboard year view; prescriptions with more than three doses; the spare-drive encryption
  proposal; `test-plan` as a required check; the Home Assistant walkthrough; Facebook publishing;
  desexing drives; whether to retire the `staff` role; the 66 menu orphans; the Chiang Mai five.
- **The Director:** the domain transfer; the wording and data items above; the shop; signing the
  roles draft.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
3. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
4. **Raising model or effort is NOT the answer to a band being wrong.**
5. **Senior Staff is closed.** Settled 2026-10-19.
6. **Pi failover is decided and deferred.** Settled 2026-10-19.
7. **Videos are stored in Drive on the 1 TB account.** Settled 2026-10-18, reconfirmed 2026-10-19.
8. **Appeals may show medical photos is DONE** — shipped 2026-10-17.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people, and that now explicitly includes **his home's device list**.
**Never give him a command before the moment he should run it.**

**He merges PRs himself, fast.** All nine of this round were merged before the planner next looked.

**He answers in short bursts and expects the answer to stick.** This round he answered eight
decisions in about an hour, several while a tool call was still running. **Record each one
immediately, in the item's title as well as its body** — the whole finding above is what happens
when that is not done.

**He corrects facts, including the planner's.** He corrected the Drive quota, the HA Green's disk
size and the premise of the videos item. **Take the correction, fix the record, and say the error
was yours.**

**He pushes back when asked something already settled, and he is right to.** *"Not required, this is
clear in the backlog."* **Read the item to the end before asking.**

**He stops a stream that is running away, and he is right to.**

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **`assistant-retention` (DB-11)** — decided 2026-10-10, carries a migration, **parked as blocked
   for nine days by a title that lied.** One small question remains (how long the could-not-help
   log is kept; recommend 90 days) and the Admin-only read answer builds with it. **First in line.**
2. **Cutting `0.38.0`** — nine streams merged and `unreleased` is full. **The release manager's
   session, not the planner's.**
3. **The role home tiles APP half** — `0225` is on `main` and applied. Its part (3), removing the
   left menu for non-Admin logins, **needs Lutan's answer on the 66 menu orphans first.**
4. **The meme-maker widening** — outreach, maintenance, project and uploaded photos. **Now a schema
   PR then an app PR**, per the merge note on the item.
5. **The `CLAUDE.md` title rule** — the highest-value small item on the board, for the reasons in
   *The finding*.
6. **The five acceptance dry-run role passes**, one stream each.
7. **The Director-blocked public-site items** — one sheet, not thirteen asks.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Apply the turn-cost rule to yourself.** Check your own context first: writing this file from a
session already past halfway costs several times what it costs from a fresh one. **This edition was
written at about 29%, which was cheap.** If you are large, hand it to a fresh session with this
file's structure as the brief.

**Count the workstreams honestly.** A stream that produced nothing still counts — `approve-photos-card-bug`
is one of this round's ten. **A stream the user ran himself counts too** — `resident-renames` is
another. **A one-line follow-up PR on an already-merged branch is NOT a workstream.**

**A trap worth knowing before you start: the Write tool refuses to overwrite a file this session has
not read.** `rm` it and write it as new rather than reading 460 lines back into context. This
edition lost a full rewrite to that.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-231`; the previous were **#730** (`221`), **#717**
(`212`), **#704** (`201`, truly 203), **#690** (`193`), **#676** (`182`), **#662** (`173`), **#638**
(`156`), **#625** (`147`), **#612** (`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`),
**#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked
on 2026-10-09 whether the PR was really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
