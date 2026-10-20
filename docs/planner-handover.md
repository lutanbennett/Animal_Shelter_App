# Planner handover — written 2026-10-20, after NINE workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine planned workstreams on 2026-10-20**, in three batches of three, each set up only
after the previous had merged. It says where the planning loop stands, what is blocked and on whom,
and what not to re-derive. It is **rewritten every nine or ten workstreams** and is deliberately
short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the measurement table, which this round added **eight more readings**
4. this file

**The branch slug is `249`** (240 + this round's nine). Recorded so nobody redoes the arithmetic.

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

**This round the allowance was never the constraint.** *Weekly · all models* moved **82% → 86%**
across nine streams — **4% for the whole round**, against 3% in each of the previous two. *Weekly ·
Fable* did not move at all (**48%**), because nothing this round was a Fable item. **And Fable is
not spare headroom**: it draws on the same weekly allowance (memory: `fable-counts-against-weekly`),
so "the Fable window is only half used" is never a reason to schedule Fable work.

---

## THE FINDING OF THIS ROUND: THE PLANNER'S OWN SHEET IS THE MOST DANGEROUS DOCUMENT IT WRITES

Last round's finding was *build the list from the backlog every time; never diff against the
previous edition.* **This round the planner did build from the backlog — and still handed Lutan a
list of six "outstanding decisions" of which two were already answered.** He said:

> ***"Was already decided, another one that I need to reprosecute"***

**The mechanism was different from last round's and is worth understanding, because the obvious fix
does not catch it.** The two wrong entries did not come from a stale sheet. They came from
**documents that describe a decision as forthcoming**:

- `CLAUDE.md` called the `test-plan` soft gate *"the user's staged rollout — see how we go, and if
  it is working smoothly then we can change to a hard block"*. That is the language of a trial with
  a decision pending at the end of it. **Everything built from `CLAUDE.md` inherited the question**:
  the previous handover listed it under *Blocked, on Lutan*, the test-plan template told every
  stream it *"becomes a required check once we know the checklist is working"*, and the planner put
  it to him as something he owed.
- The prescription-schedule item listed an unanswered edge case in its body under a title that said
  *"design to settle first"*.

**So the rule that follows is not about sheets, it is about source documents:**

- **When a decision is made, write it into the document that was generating the question** — not
  only into a decision file beside it. A rule that says "this will be decided later" keeps
  manufacturing the question no matter how many times it is answered.
- **This applies to `CLAUDE.md`, not only to backlog items.** The backlog already has a
  rewrite-the-title rule for exactly this; `CLAUDE.md` did not, and that is where the cost landed.
- Both were fixed the same day: `test-plan` is now recorded as **permanently advisory** in
  `CLAUDE.md`, the template and this file (#765,
  `docs/decisions/2026-10-20-test-plan-stays-advisory.md`).

### The same shape, in the other direction: a record that says work is NOT done when it is

Twice this round the planner found a document claiming work was unstarted when it had shipped.

- **The vet calendar.** Its item's own last note read *"Not started"*, and an earlier passage said
  *"NOT YET SWITCHED ON"*. The planner checked the code, found phase 1 **was** on `main` (`0207`,
  `src/lib/clinics/calendar-sync.ts`, `syncVisitToCalendar` wired into three call sites), correctly
  concluded the record was lagging — **and then trusted the rest of the same record anyway**,
  telling Lutan the test calendar token was still unminted. He corrected it: *"the google calendar
  on test is connected and I tested it."*
- **`check-backlog-sections.mjs` read the wrong file.** Run from the main checkout it checks
  `main`'s copy of `docs/backlog.md`, not the backlog worktree's, and reported "90 open items" after
  six had just been added in the other folder. **Run it from `C:\Development\Animal_Shelter_Backlog`
  when that is the copy you edited.**

**The rule: checking one claim on a document does not license the others.** Having caught a stale
line is evidence the document is unreliable, not evidence you have finished checking it.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`4b244fea`** (#765 merged, after a `backlog` merge) |
| `backlog` branch | **in sync with `main`** |
| Dev database | **233 applied, 233 files, 0 pending, zero drift both ways** |
| Next free migration number | **`0233`** (highest on `main` is `0232_calendar_two_way_schema.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **96** |
| Open PRs | **none** |
| Release | **`0.37.2` is cut, recorded and deployed.** `unreleased` carries this round's lines. **`0.38.0` is NOT cut** — the release manager's session |
| Leftover worktrees | **ten**, all `0` ahead with merged PRs. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in order.** Batch 1: #763 `doctor-medical-cells`, #764 `videos-app`, #762
`tooling-small-fixes`. Batch 2: #766 `role-bundle-fixes`, #768 `meme-resident-search`, #767
`appeals-medical-photos-app`. Batch 3: #769 `two-way-calendar-schema`, #770
`prescription-round-ticks`, #772 `multi-role-home-groups`.

**All nine merged. None ended with a built branch and no PR.** The three standing brief blocks are
doing their job and should be copied verbatim, unchanged.

---

## A STREAM WROTE A MIGRATION ITS BRIEF SAID IT WOULD NOT, AND COLLIDED

**The one real incident of the round, and the fix is one line in every brief.**

`videos-app` was briefed *"no migration (`0229` applied)"*. It wrote
`0230_public_photos_exclude_videos.sql`, committed it and **applied it to dev** — but `0230` had
already been taken by `doctor-medical-cells`, which merged first. Dev then carried an applied row
for a file `main` did not have.

**It resolved cleanly** once the stream was told: renumbered to `0231`, stale `schema_migrations`
row cleared, merged as #764, zero drift verified afterwards. **No harm reached production.**

**Why it happened, and this is the planner's fault not the stream's:** briefs name the files a
stream **owns**. They never said *"and you add no migration"*. The one-in-flight-migration rule
only works if a stream knows the rule applies to it.

**So every brief for a non-migration stream now carries this, and batch 3's two did:**

> **You add NO migration.** Only one in-flight branch may carry one at a time, and in this batch
> that slot belongs to `<the other stream>`. **If you conclude a migration is genuinely needed, stop
> and say so rather than writing one.**

**The knock-on cost was a batch composition change**, which is worth knowing because it will recur:
with one unexpected migration in flight, the planned `two-way-calendar-schema` had to be held out of
batch 2 and `appeals-medical-photos-app` swapped in. **Keep a no-migration item in reserve** so a
collision costs a swap rather than a stalled batch.

---

## THE MEASUREMENTS: THE BANDS ARE NOW ROUGHLY RIGHT — STOP REDUCING THEM

**Nine streams, every one `claude-sonnet-5-5` / `low`.**

| slug | estimated | actual | |
|---|---|---|---|
| `role-bundle-fixes` | 130–170k | **118,879** | 9% under |
| `meme-resident-search` | 115–145k | **119,265** | inside |
| `tooling-small-fixes` | 115–145k | **136,150** | inside |
| `doctor-medical-cells` | 150–190k | **147,724** | just under |
| `multi-role-home-groups` | 170–215k | **148,348** | 13% under |
| `appeals-medical-photos-app` | 170–215k | **170,717** | inside, at the floor |
| `prescription-round-ticks` | 130–170k | **172,984** | 2% over |
| `videos-app` | 200–250k | **286,350** | **15% OVER** |
| `two-way-calendar-schema` | 115–140k | **unmeasured** | — |

**Five inside, two under, one over, one lost.** The previous two rounds were *eight of nine under*
and *seven of nine inside*; the bands were reduced after each. **They are now about right. Do not
reduce them a third time** — this round finally produced an overrun in both directions, which is
what a correctly-centred band looks like.

**The overrun is the one to learn from.** `videos-app` spent **192,533 on messages alone**, more
than twice any other stream, because it was the only one that had to **build a mechanism it could
not read off an existing page**: a Drive resumable upload session, chunked browser upload,
thumbnails, inline playback. `appeals-medical-photos-app` is the control — same "feature across
several surfaces" shape on paper, every piece already existing, landed exactly at its band's floor.

> **A stream that invents a new upload, transport or integration path is not an ordinary feature.
> Band it at 250–320k, not 170–215k.** This is the *"must it build the instrument?"* axis, and it
> applies to plumbing as well as to measuring scripts.

**The floor is 85–87k and drifting slightly downward** (System tools 38.7–39.8k · MCP 16.3–20.1k ·
Memory 11.6–11.7k · System prompt 8.6–10.1k · Skills 6.6k). MCP and the system prompt both shrank
mid-round. **Re-measure it rather than carrying 80k forward.**

**Revised bands, from these nine plus the previous nine:**

| shape | band | evidence |
|---|---|---|
| Single-file schema PR | **115–140k** | unchanged; this round's one reading was lost |
| Docs / rules / small script fold | **115–145k** | 136,150 |
| Quick win, one page plus a component | **115–145k** | 119,265 |
| Defect or small-UI fold | **130–175k** | 118,879 · 172,984 (the upper one gained a field mid-stream) |
| A feature across several surfaces | **150–215k** | 148,348 · 170,717 |
| Schema + careful permissions verification | **140–190k** | 147,724 |
| **A feature that builds a new upload / transport path** | **250–320k** | 286,350 |

### CAPTURE THE ACTUALS THE MOMENT A BATCH MERGES

**One reading was lost this round and it was avoidable.** `two-way-calendar-schema` reported
`status: "unavailable"` — its session had let its process go. Batch 3's three merged within forty
minutes of each other and one was unreadable inside the hour, while **batch 1's were still readable
six hours later**. So the window is not predictable, and *"they were readable last time"* is not a
reason to wait. **Read them in the same turn you confirm the merge.** Write `unmeasured` when a call
actually fails — never a guess.

---

## THE DIAL HAS STILL NEVER BEEN VARIED — AND THE PLANNER CANNOT VARY IT

**Every one of the last eighteen measured streams ran `claude-sonnet-5-5` / `low`.**

This round the plan recommended `doctor-medical-cells` at **`medium`**, to get one comparison.
`get_session` says it ran at **`low`**. **Lutan sets model and effort himself in the session menu;
a recommendation in a table changes nothing.**

Three of this round's streams were read directly and three were recorded as *not read* rather than
assumed, because **reading a recommendation as the setting produces a false finding** — which is
precisely what would have happened here.

**So: if a future round wants evidence on the dials, it has to ask him to set one, in words, as part
of the plan.** Writing it in the table is not asking. And do not raise effort to fix an overrun —
that remains settled (`docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md`).

---

## WHAT LUTAN ANSWERED THIS ROUND — settled, do not re-litigate

**Six answers, each recorded on its item's title as well as its body.**

- **Desexing drives: the public SIGNS UP ON THE SITE.** A real write path, so the sign-ups table
  holds the public's own details. Consequences written onto the item: `anon` gets **insert only,
  never select**; the public view exposes **drives, not the people who signed up**;
  `check-public-views.mjs` must prove a signed-out visitor cannot read a sign-up; it needs **rate
  limiting** and **there is no CAPTCHA option here**. Nothing left to decide — it is two streams
  (schema, then page) and a strong candidate for next round.
- **Prescriptions more than three times a day: THREE ROUNDS STAY, no fourth round.** The
  **frequency** says how many times a day, the **ticks** say which of the three, and a **free-text
  note** carries the rest — *"give final tablet at midnight"*. **The consequence is written on both
  items and matters: the tick count must NOT become `doses_per_day`**, or a four-times-daily
  prescription silently reads as three in the stock forecast, the medication list and
  usage-versus-plan. Same shape as the bill-cost and diet-typo defects he held a release for.
- **`/r/` and `/e/` are served from the PUBLIC address.** Resident name cards and kennel QR signs
  carry `lannacareforanimals.org`; the staff address forwards. **Reason recorded so it is not
  re-argued:** `lannacare.org` is explicitly temporary for the staff app and moves again to a Cooper
  `.org`, so printing it onto physical cards is how they get re-done.
- **`test-plan` stays ADVISORY, permanently** — see the finding above.
- **The 66 menu orphans are split into six grouped backlog items**, each briefed to return (a) which
  card could widen and *what else that hands every current holder*, (b) which cards should narrow,
  (c) what the page gives a user and who should have it.
- **Those six run as CHATS, not workstreams.** His words: *"we shouldn't need workstreams for
  that."* Read-only against the main checkout, commit nothing, report to his Desktop, short version
  in chat. **If a report is worth keeping in the repo, that is a small PR after he has ruled.**

---

## A PROCESS CORRECTION HE MADE, AND IT GENERALISES

**The planner built worktrees for the menu-orphan reports and he stopped it:** *"we shouldn't need
workstreams for that."* He was right — the deliverable was a recommendation, not a code change, so
a branch, a worktree, an `npm ci` and a PR bought nothing.

**The test is not "is this work?" but "does this end in a diff?"** Analysis, audits, reports,
options papers and anything whose output is a decision for him belong in a chat against the main
checkout, read-only. **Reserve worktrees for work that ends in a merge.**

**Two practical notes from doing it that way:**

- `start_session` was **refused twice** with *"this turn runs an automated event"*, even though
  Lutan had asked in his own words in the immediately preceding message. The fallback that worked:
  write the brief to a file on his Desktop for him to paste into a chat he opens himself. **If a
  proposal card does not appear for him either, that file is the route.**
- `worktree.mjs new` for three streams **exceeds the 600s foreground limit**. Run it in the
  background and write the briefs when it reports done.

---

## Leftovers — ten worktrees

All `0` ahead with merged PRs: `appeals-medical-photos-app`, `doctor-medical-cells`,
`meme-resident-search`, `multi-role-home-groups`, `prescription-round-ticks`, `role-bundle-fixes`,
`tooling-small-fixes`, `two-way-calendar-schema`, `videos-app`, plus `planner-handover-249` once
this merges. Two are still **HELD** by their sessions (`multi-role-home-groups`,
`prescription-round-ticks`) — ask, do not tear those down.

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
  item still says *tick when he confirms*. **Ask him once; it has been ten days.**
- **The second admin account**, which gates shipping the 2-step refusal.
- **The two dry-run reports** — the staff run of 2026-10-03 and the Admin run of 2026-10-18, both
  waiting for him to accept or reject each finding. The Admin run already produced three
  *wrong result* defects worth acting on before any sign-off run.
- **The acceptance sign-off ground rules** — who tests which role, what accounts, what counts as a
  blocker versus an accepted issue. With him and the Director.
- **The five remaining acceptance dry-run role passes** — ordinary streams, one role each. **Do not
  brief them as one.**
- **Who can read what of a contact, on production** — a person must do it on real rows.
- **Watching the Head of Medical, the Head of Maintenance, the 2IC and the Director work** — nobody
  has.
- **The spare SSD** — a 1 TB drive has been found; the probe, clone and boot test remain.
- **The 66 menu orphans' rulings**, once the six reports come back.
- **The Director:** the domain transfer, **which gates the whole cutover**; the community-dogs
  number; the donation figures; phone and LINE; four pages of Thai wording; the tagline; the trust
  block; adoption cost; success stories; the shop sheet; the drop-ship prerequisites; and whether
  the foundation is registered as a public charitable organisation (for Thai tax-deductible
  receipts — needs her and the accountant).

---

## Blocked, and on whom

- **Lutan:** the two security switches; WAF and bot rules; BitLocker; the second admin; the
  CODE-3 confirmation; the contact read on production; the dry-run reviews; the spare-drive steps;
  the Home Assistant walkthrough; the home-network session.
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
6. **The production calendar token** — *"LEAVE ON TEST UNTIL WE DEPLOY 2 WAY & TEST IT"*
   (2026-10-19). Test is connected and tested (2026-10-20). Nothing is waiting on him.
7. **Removing the left-hand menu** — not until coverage is demonstrated, and it goes last.
8. **Only Admin manages tiles** — the Admin role, not one person (2026-10-19).
9. **The throwaway Supabase project** — created, used, destroyed on purpose. Never ask for its ref.
10. **Drive folder sharing** — deferred by him until production moves to the shelter's Google
    account. Do not raise it under the security checklist.
11. **The Drive move** — TBA, his to schedule. **Do not chase it and do not list it as blocked.**
12. **Videos storage** — Drive, 1 TB, option (a). He has answered this three times.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast.** All nine of this round merged within minutes of opening, and twice
the planner's `worktree.mjs list` was already stale when it read it. **Re-read `gh pr list` before
asserting anything about state; a worktree listing taken a minute ago is not evidence.**

**He corrects facts, including the planner's, and he is right to.** This round: the calendar token,
and two decisions re-surfaced as open. **Take the correction, fix the record at its source, say the
error was yours, and do not spend his time on an apology.**

**When he says something has merged, it has.** Check once, quietly, then accept.

**He turns Auto-fix on himself** when he wants it. **Do not offer it** (`CLAUDE.md`), and do not
narrate it when he enables it.

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **The two-way calendar APP half.** `0232` is on `main` and applied; this is the gate on the whole
   calendar area, and test is connected so it can be verified end to end for real.
2. **The `stock_receipts` over-permission** — a silent-wrong-history defect, the class he holds
   releases for. **Not a one-liner:** `0191` added that update policy **on purpose** so the bills
   inbox can write a matched bill's cost onto a delivery. Read `0191`'s header before planning it.
3. **Cutting `0.38.0`** — nine streams merged and `unreleased` is full. **The release manager's
   session, not the planner's.**
4. **Desexing drives**, now fully answered: schema then page, two streams.
5. **The six menu-orphan reports** — chats, not workstreams, two or three per chat.
6. **The five acceptance dry-run role passes**, one stream each.
7. **The Director-blocked public-site items** — one sheet, not thirteen asks.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Apply the turn-cost rule to yourself.** This edition was written at about **20%** of a 1M window,
against the previous edition's 44%. **Past roughly halfway, hand it to a fresh session with this
file's structure as the brief.**

**Count the workstreams honestly.** A stream that produced nothing still counts. A stream the user
ran himself counts. **A second PR from the same stream does NOT.** The menu-orphan chats are **not**
workstreams and must not be counted as such.

**A trap worth knowing before you start: the Write tool refuses to overwrite a file this session has
not read.** Read it, or `rm` it and write it as new. **This edition hit it again**, and so did a
test plan copied from the template in the same session.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-249`; the previous were **#758** (`240`), **#742**
(`231`), **#730** (`221`), **#717** (`212`), **#704** (`201`), **#690** (`193`), **#676** (`182`),
**#662** (`173`), **#638** (`156`), **#625** (`147`), **#612** (`138`), **#597** (`127`), **#588**
(`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and
**#490** (`81`). Lutan asked on 2026-10-09 whether the PR was really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
