# Planner handover — written 2026-10-20, after a SECOND nine workstreams the same day

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine planned workstreams on 2026-10-20**, in three batches of three — the second full round
of nine that day, following the round this file's previous edition described. It says where the
planning loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten
every nine or ten workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the measurement table, which this round added **nine more readings**
4. this file

**The branch slug is `258`** (249 + this round's nine). Recorded so nobody redoes the arithmetic.

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

**This round the allowance was never close to the constraint.** *Weekly · all models* moved
**87% → 90%** across nine streams — **3% for the whole round**, the same as the two rounds before
the last one, and it reset at 07:00Z the following morning regardless. *Weekly · Fable* did not move
at all (**48%**), because nothing this round was a Fable item. **And Fable is not spare headroom**:
it draws on the same weekly allowance (memory: `fable-counts-against-weekly`), so "the Fable window
is only half used" is never a reason to schedule Fable work.

---

## THE FINDING OF THIS ROUND: A WELL-BRIEFED ORDINARY STREAM COSTS ABOUT 128k, WHATEVER IT IS

**This is the most useful number on the page, and it came out of nine readings taken properly.**

Four of this round's nine streams landed within **4,000 tokens of each other**:

| slug | actual | what it actually did |
|---|---|---|
| `stock-receipts-immutable` | **126,512** | a migration, a trigger, and rulings on four permission findings |
| `nfc-medical-jobs` | **127,979** | routed an existing NFC link into an existing picker |
| `prescription-dose-schema` | **128,114** | a column, a back-fill, and a proof harness |
| `release-tooling-fixes` | **129,848** | four unrelated small script and docs items folded into one stream |

**Those are four completely different jobs.** A permissions ruling, a UI wiring job, a schema
migration and a four-item tooling fold have nothing in common except that **each had a brief that
named its files, its decision, its boundary and what it must not touch.** They cost the same thing:
the ~85k floor plus about **43k of messages**.

> **So the planning number to start from is: floor (~85k) + ~43k = ~128k for an ordinary
> well-briefed stream.** Then add only for the specific things below. **Do not add for "it touches a
> lot of files" or "it has several parts" — those four prove it does not matter.**

**What the other five spent, and why — this is the whole list of things that actually cost extra:**

| slug | actual | the extra, and what bought it |
|---|---|---|
| `two-way-calendar-app` | 153,821 | +26k · a new integration **on existing machinery** |
| `prescription-frequency-screen` | 169,220 | +41k · three pattern kinds to design, and existing readers to keep working |
| `desexing-drives-schema` | 159,976 | +32k · a public write path's RLS, which must be got right first time |
| `domain-split-build` | 200,612 | +73k · **read very widely** and changed every link-building site in `src/` and `worker/` |
| `desexing-drives-page` | 235,561 | +108k · **created a new surface the public submits data through** |

**Nine of nine measured. Three inside their bands, five under, one over.** The one over is the one
I would choose if I had to pick one: the privacy-sensitive public form.

### The two band mistakes I made, both classification errors, in opposite directions

**1. `two-way-calendar-app` banded 250–320k, came in at 153,821 — 38% below the floor.** I put it in
the handover's newest row, *"a feature that builds a new upload / transport path"*. **The row is
sound and `videos-app` really did cost 286,350 that way. What I got wrong was deciding this stream
belonged in it.** `videos-app` had to build a transport mechanism from nothing — a Drive resumable
upload session, chunked browser upload, thumbnails, playback. `two-way-calendar-app` **extended
machinery that already existed**: the Worker's 15-minute cron was already running,
`src/lib/clinics/calendar-sync.ts` already talked to Google and already held the credential path, and
`0232` had already defined `calendar_sync_state` for it to write to.

> **The question is not "is this a new integration?" but "is there an existing caller, credential
> path and schema to hang it on?"** All three exist → an ordinary feature, however new the behaviour
> sounds. **Reserve 250–320k for a stream with no existing piece to extend.**

**2. `nfc-medical-jobs` and `desexing-drives-page` were given the SAME band and landed 108k apart**
(127,979 and 235,561). A band containing both is not a band. The NFC stream **routed into surfaces
that already worked**; the desexing page **created a new one that people submit data through** — a
route, a public form, rate limiting, a staff screen, a menu group never shown before, and the manual.
Its messages were 150,935, three and a half times either of the ~128k streams.

> **Band on whether the stream CREATES a surface or ROUTES INTO ONE THAT EXISTS.** Creating a page
> people submit data through — especially a public one, where a mistake is a privacy finding — is a
> different job from adding an entry point to a page that already works.

### Revised bands, from these nine

| shape | band | evidence |
|---|---|---|
| **Ordinary well-briefed stream — the default** | **120–145k** | 126,512 · 127,979 · 128,114 · 129,848 |
| Routing into surfaces that already exist | **120–165k** | 127,979 · 119,265 (previous round) |
| Single-file schema PR | **120–150k** | 128,114 |
| Schema with a public write path / RLS to get right | **145–185k** | 159,976 |
| A new integration on existing machinery | **145–180k** | 153,821 |
| Replacing an existing screen | **155–200k** | 169,220 |
| Reads very widely and edits many call sites | **185–250k** | 200,612 |
| **Creates a new surface people submit data through** | **200–270k** | 235,561 |
| Builds an instrument / transport path from nothing | **250–320k** | 286,350 (`videos-app`, previous round) — **one reading, and nothing this round belonged in it** |

**Do not reduce the 250–320k row on this round's evidence.** Nothing this round was in it. The
correction was to my classification, not to that band.

**The floor is ~84–85k and still drifting down slowly** (System tools 38.7k · MCP 16.3–16.7k ·
Memory 11.9–12.0k · System prompt 8.6k · Skills 6.6k). The system prompt has settled at the low end.
**Re-measure it; do not carry a number forward.**

### CAPTURE THE ACTUALS THE MOMENT A BATCH MERGES — it worked this time

**Nine of nine, against last round's eight of nine.** What changed is that each batch's figures were
read **in the same turn the merge was confirmed**, before anything else, including before the daily
sync. Every one came back `ok`; none had gone `unavailable`. **Do it in that order and the data is
free.** Write `unmeasured` only when a call actually fails, never a guess.

---

## THE SECOND FINDING: READINESS IS NOT SEQUENCING

**I put the printable acceptance sign-off (A4 PDF) into batch 3 and Lutan pulled it out:**

> ***"I'm not sure I want to update the sign off yet as we haven't finished the build, can we swap
> that for something else"***

**Note what kind of mistake that was, because the obvious lesson is the wrong one.** The item is
**fully specified and buildable** — the generator exists, the PDF pattern exists in
`src/lib/manual/manual-pdf.tsx`, the Thai fonts exist. It passed every readiness test I applied, and
it would have passed them again. **What it failed was sequencing**: a printable sign-off certifies a
finished build, and certifying an unfinished one produces a document that has to be redone.

> **Ask both questions, not one. (1) Is it ready to build? (2) Does this deliverable only make sense
> once something else is finished?** Acceptance, certification, sign-off sheets, printed artefacts,
> anything a person puts their name to, and anything handed to an outside party all fail (2) while
> the thing they describe is still moving.

**Recorded on the item's own title** on the `backlog` branch (`f3ea959c`), per the standing rule that
an answer goes into the document that was generating the question. **It is not blocked, it is not a
gap, and no decision is owed on it. Do not plan it, and do not list it as waiting on him, until he
says the build is finished.**

---

## THE THIRD FINDING: A FOLLOW-UP RECORDED INSIDE A COMPLETED ITEM IS INVISIBLE

**A new shape of the stale-record fault, and the backlog's existing rules did not cover it.**

`prescription-frequency-screen` (#785) finished the prescription schedule and ticked its item. Its
`DONE` note ended *"dropping `frequency_id` is still a schema stream of its own"* — a real, named,
necessary follow-up, **recorded only inside a line that is now `- [x]`**. Nothing lists it, nothing
re-reads it, and the next planner sees a closed item. It would have been lost.

> **When you tick an item whose note names remaining work, file that remainder as its own item in
> the same pass.** A completed item is a record, not a queue.

Filed as its own line in **Medical records** with the `doses_per_day` trap on its face, because the
drop is exactly where that mistake could be reintroduced.

**Two neighbouring stale-record faults were also fixed this round, both the ordinary kind:**

- **The prescription item's title overstated what was left.** After #770 and #781 it still read
  *"what remains is build: move `dose_quantity` onto the round, the back-fill, and a replacement for
  the frequency screen"* — two of the three already shipped. Anything skimming the backlog reads the
  title.
- **The two-way calendar item said "PR pending"** for a PR that had merged.

**And one checker blind spot worth knowing:** `node scripts/check-backlog-sections.mjs` printed
`ok — 87 open items` while `docs/backlog.md` was **mid-merge with conflict markers in it**. It counts
lines and does not notice `<<<<<<<`. Filed as a backlog item. **Do not read a green from it as "the
file is sound" during a conflict.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`70a2388b`** (#786 merged, then a `backlog` merge that needed resolving) |
| `backlog` branch | **in sync with `main`** |
| Dev database | **236 applied, 236 files, 0 pending, zero drift both ways** |
| Next free migration number | **`0236`** (highest on `main` is `0235_stock_receipts_cost_only_update.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal — **this worked twice this round, see below** |
| Open backlog items | **87** |
| Open PRs | **none** |
| Release | **`0.38.0` is cut, recorded and deployed** (#775, #776). **`unreleased` carries FOUR lines** from this round. **`0.39.0` is NOT cut** — the release manager's session |
| Leftover worktrees | **ten**, all `0` ahead with merged PRs. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in order.** Batch 1: #777 `release-tooling-fixes`, #778 `desexing-drives-schema`, #779
`two-way-calendar-app`. Batch 2: #781 `prescription-dose-schema`, #782 `nfc-medical-jobs`, #783
`desexing-drives-page`. Batch 3: #784 `stock-receipts-immutable`, #785
`prescription-frequency-screen`, #786 `domain-split-build`.

**All nine merged. None ended with a built branch and no PR.** The standing brief blocks are doing
their job and should be copied verbatim, unchanged.

---

## TWO BRIEF BLOCKS EARNED THEIR PLACE THIS ROUND — KEEP THEM WORD FOR WORD

**1. "YOU ADD NO MIGRATION" works, and it was proved within hours of being added.**

The previous edition added it after `videos-app` wrote an unbriefed `0230` and collided. This round
**`two-way-calendar-app` concluded a migration genuinely WAS needed** — a cancel-reason column, the
audit label *via Google Calendar*, and a *changed from the calendar this week* list on System
status — **and it stopped and said so instead of writing one.** It then rewrote its own backlog
item's title to name exactly what was left (`d7883f87`). That is the designed behaviour, first time
it was tested.

**The line, for every non-migration brief:**

> **You add NO migration.** Only one in-flight branch may carry one at a time, and in this batch
> that slot belongs to `<the other stream>`. **If you conclude a migration is genuinely needed, stop
> and say so rather than writing one.**

**2. The read-only-script-plus-command pattern is how a production read gets done.**

`release-tooling-fixes` was asked to confirm `0227`'s nightly pg_cron retention job on production —
which no session can read. Its brief told it to **write a read-only script, leave the one-line
command for Lutan, and not claim the job was confirmed.** It did; he ran it; he committed the result
himself (`e1017785`, then #780 `cron-job-confirmed`). **The job is active on production and that is
now on the record.** Use this shape for anything needing production.

---

## A RULING WORTH NOT RE-DERIVING: THE DELIVERY-EDIT CONFLICT

`stock-receipts-immutable` (#784) faced two correct-sounding things in conflict and resolved it well.
**Do not undo this.**

- **The design** (`0145` C8, encoded in `check-2ic-role`): a delivery is an immutable record of what
  arrived; a wrong one is deleted and recorded again, so the audit trail shows the correction.
- **`0191`**, which added a whole-row update policy **on purpose**, because the bills inbox needs to
  write a matched bill's cost onto a delivery.

**The ruling (`0235_stock_receipts_cost_only_update.sql`): `0191`'s policy STAYS — the bills inbox
still needs an update to pass RLS — and a trigger narrows what an update may change to the cost
column alone.** Anything else is refused, with the instruction to delete and re-record. Cost edits
are still recorded by `audit_stock_receipts` (`0195`).

**What that fixed:** `note`, `quantity`, `item`, `supplier` and `date` had been editable in place by
every `stock.delivery` holder — admin, management, the 2IC and the delivery lead — leaving no trace
that the figures changed. The silent-wrong-history class.

**The rule the stream was given and followed, which is the transferable part:** *do not make the
harness green by changing what the harness expects, unless you have established the expectation is
wrong and written down why.* A harness edited to agree with the code proves nothing and removes the
only thing that noticed.

---

## THE DIAL HAS STILL NEVER BEEN VARIED — AND THE PLANNER CANNOT VARY IT

**All nine of this round ran `claude-sonnet-5-5` / `low`, every one read directly via
`get_session`. That makes TWENTY-SEVEN consecutive measured streams on the same two settings.**

**This round the plan deliberately did NOT recommend varying one**, and said so in the plan: the
weekly window was at 87–90% and raising effort raises the figure. The previous round's attempt — a
`medium` recommendation in a table — changed nothing, because **Lutan sets model and effort himself
in the session menu.**

**So: if a future round wants evidence on the dials, it has to ask him to set one, in words, as part
of the plan.** Writing it in the table is not asking. And do not raise effort to fix an overrun —
that remains settled (`docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`).

**One observation that matters more than the dials:** this round's four-stream cluster at ~128k
suggests **brief quality, not model or effort, is what moves the figure.** Four unlike jobs cost the
same because each had a named boundary. That is where to spend planning effort.

---

## WHAT LUTAN ANSWERED OR DID THIS ROUND — settled, do not re-litigate

- **The printable acceptance sign-off waits until the build is finished.** See the second finding.
  Not blocked, no decision owed, do not re-propose it.
- **`domain-split-build` replaced it**, his choice from three offered. The other two were the
  calendar schema follow-up (rejected: it carries a migration and would have displaced
  `stock-receipts-immutable`) and the Thai manual (rejected: it would park waiting for a Thai
  reader).
- **He ran the production cron check himself** and committed the result (#780). `0227`'s nightly
  retention job is **active on production**. Nothing is waiting on him there.
- **He merged all nine PRs within minutes of each opening**, twice making a `worktree.mjs list`
  stale before it was read.

---

## Leftovers — ten worktrees

All `0` ahead with merged PRs: `desexing-drives-page`, `desexing-drives-schema`,
`domain-split-build`, `nfc-medical-jobs`, `prescription-dose-schema`,
`prescription-frequency-screen`, `release-tooling-fixes`, `stock-receipts-immutable`,
`two-way-calendar-app`, plus `planner-handover-258` once this merges.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever. `/clean-streams` does the round.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The two switches on the security checklist** — leaked-password protection and the session
  inactivity timeout, both projects. Two clicks each; the current values are recorded as evidence.
- **Cloudflare WAF and bot rules**, and **laptop disk encryption** — unreadable from here. Do not
  keep trying, and do not read `Get-BitLockerVolume`'s fallback line as "not encrypted".
- **Secrets off the laptop (CODE-3)** — he said on 2026-10-10 he was doing it himself that day. The
  item still says *tick when he confirms*. **Asked again on 2026-10-20 and still not answered; it
  has now been ten days. Ask once more, in one line.**
- **The second admin account**, which gates shipping the 2-step refusal.
- **The two dry-run reports** — the staff run of 2026-10-03 and the Admin run of 2026-10-18, both
  waiting for him to accept or reject each finding. The Admin run already produced three
  *wrong result* defects worth acting on before any sign-off run.
- **The acceptance sign-off ground rules** — who tests which role, what accounts, what counts as a
  blocker versus an accepted issue. With him and the Director. **This is what the five role passes
  wait on.**
- **The five remaining acceptance dry-run role passes** — ordinary streams, one role each. **Do not
  brief them as one**, and remember the live-interactions axis: a full walk is ~2.3M tokens.
- **Who can read what of a contact, on production** — a person must do it on real rows.
- **Watching the Head of Medical, the Head of Maintenance, the 2IC and the Director work** — nobody
  has.
- **The spare SSD** — a 1 TB drive has been found; the probe, clone and boot test remain.
- **The 66 menu orphans' rulings**, once the six reports come back. **They are CHATS, not
  workstreams** (his words) and they have not been run yet.
- **The Director:** the domain transfer, **which gates the whole cutover**; the community-dogs
  number; the donation figures; phone and LINE; four pages of Thai wording; the tagline; the trust
  block; adoption cost; success stories; the shop sheet; the drop-ship prerequisites; and whether
  the foundation is registered as a public charitable organisation (for Thai tax-deductible
  receipts — needs her and the accountant).

---

## Blocked, and on whom

- **Lutan:** the two security switches; WAF and bot rules; BitLocker; the second admin; the
  CODE-3 confirmation; the contact read on production; the dry-run reviews; the sign-off ground
  rules; the spare-drive steps; the Home Assistant walkthrough; the home-network session.
- **The Director:** the domain transfer; the wording and data items; the shop; the sign-off ground
  rules; the charitable-registration question.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
3. **`test-plan` is advisory, permanently.** Not a trial, not pending.
4. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
5. **Raising model or effort is NOT the answer to a band being wrong.**
6. **The production calendar token** — test is connected and tested; the production token comes
   after two-way is built and tested, and two-way now IS built (#779). **It is his, it is TBA, and
   it is not blocked on anything the planner does.**
7. **Removing the left-hand menu** — not until coverage is demonstrated, and it goes last.
8. **Only Admin manages tiles** — the Admin role, not one person (2026-10-19).
9. **The throwaway Supabase project** — created, used, destroyed on purpose. Never ask for its ref.
10. **Drive folder sharing** — deferred by him until production moves to the shelter's Google
    account. Do not raise it under the security checklist.
11. **The Drive move** — TBA, his to schedule. **Do not chase it and do not list it as blocked.**
12. **Videos storage** — Drive, 1 TB, option (a). He has answered this three times.
13. **The printable acceptance sign-off** — sequencing, not readiness. Waits for the build.
14. **`0227`'s retention job on production** — confirmed active by him, #780. Closed.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast.** All nine of this round merged within minutes of opening.
**Re-read `gh pr list` before asserting anything about state; a worktree listing taken a minute ago
is not evidence.**

**He corrects the plan, not just the facts, and he is right to.** This round's correction was about
**sequencing** — a thing that was ready and still wrong to schedule. That is a better class of
feedback than a factual fix and it generalises further. **Take it, write it at its source, say the
error was yours, and do not spend his time on an apology.**

**When he says something has merged, it has.** Check once, quietly, then accept.

**He turns Auto-fix on himself** when he wants it. **Do not offer it** (`CLAUDE.md`), and do not
narrate it when he enables it.

---

## A ROUTINE THING THAT WILL HAPPEN TO YOU: the `backlog` merge conflicts

**It happened this round and it has a correct resolution shape.** `git merge backlog` in the main
checkout conflicted on `docs/backlog.md`: **#785 had ticked the prescription item on `main` (`- [x]`)
while the `backlog` branch had reworded its title to say only the frequency screen was left
(`- [ ]`).** Both sides were right when they were written.

**Resolve it in the main checkout, commit, carry on** (CLAUDE.md says so). The shape:

- **Take the tick** if the work has in fact landed.
- **But do not take the ticked side's wording uncritically** — `main`'s side still carried the stale
  *"what remains is build"* title. Write a title that says what actually shipped.
- **Then check the note for buried follow-ups** and file them as their own items (the third finding).

**`git -C ../Animal_Shelter_Backlog merge --ff-only main` will abort** until the main-checkout merge
is committed. That is expected, not a second fault.

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **Cutting `0.39.0`** — `unreleased` carries four lines. **The release manager's session, not the
   planner's.**
2. **The two-way calendar schema follow-up** — the cancel-reason column, the *via Google Calendar*
   audit label, and the *changed from the calendar this week* list on System status. `#779` stopped
   short of it on purpose and its item's title names exactly what is left. **Carries a migration.**
3. **Make the assistant-retention job report on itself** — the only pg_cron job in the schema, so
   this establishes the pattern as much as it fixes the job. **Carries a little schema**, so it and
   (2) go in different batches.
4. **Drop `frequency_id`** — newly filed this round, the last step of the prescription schedule.
   **Carries a migration.** Read the `doses_per_day` trap on its face before planning it.
5. **The six menu-orphan reports** — **chats, not workstreams**, two or three per chat. Still not
   run, and the tile-groups and role-home-tiles items wait on their rulings.
6. **The five acceptance dry-run role passes**, one stream each — but they wait on his ground rules.
7. **The Director-blocked public-site items** — one sheet, not thirteen asks.

**Note three of the top four carry migrations**, and only one in-flight branch may carry one at a
time. **That is the constraint that will shape the next plan**, exactly as it shaped this one, where
four migration candidates had to fit three batches.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Apply the turn-cost rule to yourself.** This edition was written at about **23%** of a 1M window,
against the previous edition's 20% and the one before's 44%. **Past roughly halfway, hand it to a
fresh session with this file's structure as the brief.**

**Count the workstreams honestly.** A stream that produced nothing still counts. A stream the user
ran himself counts. **A second PR from the same stream does NOT.** The menu-orphan chats are **not**
workstreams and must not be counted as such.

**A trap worth knowing before you start: the Write tool refuses to overwrite a file this session has
not read.** Read it, or `rm` it and write it as new. **This edition hit it again** — the third
edition in a row to do so, and `rm` then write is the quicker answer.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-258`; the previous were **#774** (`249`), **#758**
(`240`), **#742** (`231`), **#730** (`221`), **#717** (`212`), **#704** (`201`), **#690** (`193`),
**#676** (`182`), **#662** (`173`), **#638** (`156`), **#625** (`147`), **#612** (`138`), **#597**
(`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`),
**#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was really needed;
**it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
