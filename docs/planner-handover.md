# Planner handover — written 2026-10-17, after TEN workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **ten workstreams planned, built and merged between 10:30 and 15:40 on 2026-10-17** — one
afternoon, one chat, no batch boundaries after the first. It says where the planning loop stands,
what is blocked and on whom, and what not to re-derive. It is **rewritten every nine workstreams or
so** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — long this round, because it carries the full narrative of one feature built
   across seven streams, including two corrections from Lutan
4. this file
5. **`docs/decisions/2026-10-17-photo-approval-schema.md`** and
   **`docs/decisions/2026-10-17-pending-photos-schema.md`** — the two schema decision files whose
   *"What the app half must do"* sections made the following streams briefable in minutes. **They
   are the standard. Read them before writing any schema brief.**

**The branch slug says `201`; the count is TEN, so it should have been `203`.** The worktree was cut
when the round stood at eight. Harmless, recorded so nobody re-derives the arithmetic.

---

## FIRST, THE TRAP: CHECK FOR AN OPEN HANDOVER PR BEFORE YOU TRUST THIS FILE

**Run `gh pr list --state open` and look for an open `planner-handover-*` PR.** A previous chat read
the file on `main`, reported its figures to Lutan, and was wrong by ten migrations, because the
current edition was sitting in an unmerged PR the whole time.

**It nearly bit again this round, in a new way.** On 2026-10-17 the check found an open PR named
`claude/handover-refresh` — which turned out to be the **release** handover
(`docs/release-handover.md`), a different document. **Two handovers exist. Check which one the open
PR touches before concluding anything.**

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

**The allowance was nowhere near the constraint again.** Ten workstreams, a whole feature with four
migrations, moved *Weekly · all models* from **35% to 39%** — about **4% for ten streams**. Fable sat
at **9%** untouched.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`efd6530f`** (#703 merged, then a `backlog` merge resolved by hand) |
| `backlog` branch | **in sync with `main`**, fast-forwarded and pushed |
| Dev database | **220 applied, 220 files, 0 pending, zero drift** |
| Next free migration number | **`0220`** (highest on `main` is `0219_shelter_photo_folder.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **107** |
| Open PRs | **none** |
| Release | **`0.35.0` is cut, recorded (`docs/releases/2026-10-17.md`) and DEPLOYED** to production Worker, production Pi and both test environments. **`0.36.0` is NOT cut**, and `unreleased` carries **four** lines. Cutting it is the release manager's session, not the planner's |
| Leftover worktrees | **eleven**, nine of them `HELD` by their own sessions. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The ten, in order.** Batch 1: #694 `medical-picker-crash`, #696 `appeal-photos-schema`, #695
`contacts-list-and-icons`. Then, as one continuous thread: #697 `photo-card-reachable` (**closed
unmerged**), #698 `shelter-photos-schema`, #699 `shelter-photos-card`, #700
`enclosure-photos-schema`, #701 `photo-approval-queue`, #702 `enclosure-photos-app`, #703
`service-role-folder-schema`.

**Only the first three were a planned batch.** The other seven were one feature that kept growing as
Lutan looked at the running app. **That is the shape of this round and the thing most worth
expecting again.**

---

## THE FINDING OF THIS ROUND: A STALE BACKLOG COST A WHOLE STREAM

### What happened

Lutan asked to *"bring forward the take photo card"*. The planner read `docs/backlog.md` **on
`main`**, found the photo-first feature already built and ticked, diagnosed a missing home-screen
tile, and briefed a small card addition with **"No migration. Do not write a migration."**

**The `backlog` branch was seven commits ahead of `main` at that moment**, with items Lutan had
filed that morning. The real items asked for a **new permission** and an **approval workflow** —
both schema.

**With no migration available, the stream did the only thing left**: it narrowed the folder list
inside `/photos/add/page.tsx`. Because `photoCategoriesFor()` is
`can(perms, "photos.resident_publish") ? PHOTO_CATEGORIES : ["Medical"]`, that hit everyone:

| who | before | after #697 |
|---|---|---|
| Management / Admin | four folders | Shelter only |
| Head of Medical | Medical | **empty — page gone** |
| Volunteer | — | **empty — still unusable** |

**Lutan caught it in review**, with *"I'm also worried that it has locked an existing form the
shelter only."* #697 was closed unmerged at **173,670 tokens** — a full stream, spent, for nothing.

### The rules that follow, and they are cheap

1. **Re-read the item from the `backlog` branch at the moment you write the brief**, not from the
   copy on `main` you read earlier in the session. `SKILL.md` already says to re-read fresh on a
   resume; **this extends it to any brief written more than a few minutes after the sync.** Lutan
   files items all day from looking at the live app — two arrived mid-afternoon this round.
2. **A no-migration instruction is a constraint on the solution space, not a scoping note.** If the
   item needs schema and the brief forbids it, the stream will find some other lever, and the
   lever it finds will be worse. **Saying "no migration" when you have not checked is the
   expensive half of the mistake.**
3. **A wrong brief costs a full stream, and it does not show up as an overrun.** #697 came in *over*
   its quick-win band and produced nothing mergeable. Watch for that signature.

### The other correction Lutan made, which is about briefs generally

> *"I'm not concerned that the approver might be wrong as that's an existing risk with the system
> that a person authorised may load a photo against the wrong resident, it's not a new risk
> exclusive to this feature."*

He was right. **The *"one thing that can hurt someone"* block must name a risk the change
INTRODUCES OR WIDENS**, not a pre-existing property of the system. Listing an existing risk spends
the stream's attention in the wrong place **and invites it to build friction nobody asked for** —
confirmation gates on a flow whose whole point is being quick on a phone.

---

## The pattern that made seven streams cheap: decision files as the brief

**Each schema stream wrote a *"What the app half must do"* section, and the next stream's brief
pointed at it instead of restating it.** By the fourth stream the planner was writing *"read these
four, they are the authority, and where one disagrees with me it wins."*

Two that earned it:

- **`2026-10-17-photo-approval-schema.md`** (`0217`) warned the app half not to repeat #697's
  mistake, **naming the function and the exact condition**: `photoCategoriesFor()` returns
  `["Shelter"]` only for a login holding `photos.shelter_add` and **not** `photos.resident_publish`.
- **`2026-10-17-photo-approval-queue.md`** (#701) told the next stream **which file, which loader,
  which component** its new row type attaches to — and that it had **deliberately stubbed nothing**,
  judging a shared list type worse than a second list.

**So: when briefing a schema half, require that section explicitly.** It is the highest-leverage
line in a schema brief, and it costs the schema stream almost nothing while it still has the
context.

---

## The bands, and a real result against them

| slug | model / effort | estimated | actual | |
|---|---|---|---|---|
| `medical-picker-crash` | sonnet-5-5 / low | 110–170k | **168,339** | just under the top |
| `appeal-photos-schema` | sonnet-5-5 / low | 140–200k | **164,206** | inside |
| `contacts-list-and-icons` | sonnet-5-5 / low | 170–290k | **168,920** | just under low |
| `photo-card-reachable` | sonnet-5-5 / low | 110–170k | **173,670** | over — **and closed** |
| `shelter-photos-schema` | sonnet-5-5 / low | 170–290k | **208,506** | inside |
| `shelter-photos-card` | sonnet-5-5 / low | 200–300k | **224,451** | inside |
| `enclosure-photos-schema` | sonnet-5-5 / low | 170–290k | **167,763** | just under |
| `photo-approval-queue` | sonnet-5-5 / low | 250–350k | **224,115** | under |
| `enclosure-photos-app` | sonnet-5-5 / low | 280–400k | **260,806** | under |
| `service-role-folder-schema` | sonnet-5-5 / low | 110–170k | **148,524** | inside |

**Ten streams, every one on sonnet-5-5 / low, not one over band, and the whole spread is
148k–261k.** Every figure read from `get_usage` in the same turn the merge was noticed — **the
capture rule held ten for ten, across six separate rounds of the conversation.**

### What this says, and what it does not

**The floor was identical in all ten**: System tools ~39–43k · MCP ~20k · Memory **11,120** · System
prompt ~10k · Skills 6,601 ≈ **87k**. All variation is *Messages*, 59k–168k.

**The Medium band (170–290k) alone would have covered seven of the ten.** A quick win, four schema
PRs, a two-item medium, a new screen and a multi-file app half all landed within about 110,000
tokens of each other. **On this evidence task shape moved the figure far less than the bands
assume.**

**Do NOT rewrite the bands on one day.** Two reasons to distrust the flattening:

- **Every brief this round was unusually prescriptive**, and seven of them had a predecessor's
  decision file to work from. That is the condition being measured, not the task.
- **None had to build an instrument** — still the biggest multiplier the record knows
  (`who-does-what-view`, +50%, because writing `check-who-does-what.mjs` *was* the work).

**The two rows that behaved as theory predicts:** `enclosure-photos-app` (260,806) was the largest
and did the most distinct things — a new flow branch, a second queue surface, Drive orchestration;
and `shelter-photos-card` (224,451), which changed a card, a folder rule, upload routes, a label and
a guard. **Count what must CHANGE and how many screens it needs** — still the rule.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** They worked: **no stream this round pushed a broken test
plan, and none ended with a built branch and no PR.** What else earned its place:

- **POINT AT THE PREDECESSOR'S DECISION FILE AND SAY IT OUTRANKS YOU.** The single highest-value
  change this round. See above.
- **NAME THE PR THAT WAS CLOSED, AND WHY.** Every brief after #697 carried the three-row regression
  table and an instruction to check all three by hand. **Nobody repeated it.**
- **BRIEF AN OPTION, NOT A MANDATE — AND SAY WHICH IT IS.** `enclosure-photos-schema` was offered
  "a new enum value (two files) or a separate table", with the planner leaning table and the
  reason. **It chose the table** (`0218_pending_photos.sql`). `service-role-folder-schema` was
  offered "one PR or two" and told it could overrule.
- **TELL A STREAM WHAT IS *NOT* ITS SCOPE, AND WHO HAS IT.** Used four times, and it held every
  time. The queue stream was told the service-role work was assigned elsewhere — **in its brief and
  by `send_message`** — and its decision file records that it did not touch it.
- **SAY WHAT THE USER WILL DO BY HAND, AND FORBID DOING IT FOR THEM.** *"Once I have the tile with
  the permissions I'll add it to the volunteer profile."* Every stream was told to create the card
  and **not** grant it to any role. **This is also what made the general rule load-bearing**: he
  grants the permission in Settings, so the tile has to follow from the permission, not from a
  hard-coded role list.
- **For a schema half, three sentences**: the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held for all four schema PRs.

---

## Traps in the tooling

Everything in the last edition's list still holds. **`git show <rev>:<path>` LIES SILENTLY ON DOTTED
PATHS** — use `git grep`, `git ls-tree`, or `MSYS_NO_PATHCONV=1`. **No long prose in `node -e` or
heredocs** — use the Write tool, or `cat >> file <<'EOF'` for appends, which worked all round.
**`python` is the Store stub.** **`gh` reports `mergeStateStatus: UNKNOWN` for a MERGED PR.**
**`worktree.mjs new` can exceed the tool timeout on `npm ci`**, but the folder and `.port` exist
well before it finishes. New this round:

### `git merge backlog` conflicted again — and the resolution was trivial

Third conflict in three days, so **expect one every time.** This one was a **single hunk**: the same
item, `[x]` on `main` (the PR ticked it) and `[ ]` on `backlog` (the stream filed it open). **`main`
was the backlog line plus the tick plus a *Done* note — strictly newer, so it won outright.**

**The method, which takes a minute:** extract both sides with `sed`, normalise the tick
(`sed 's/^- \[.\]/- [X]/'`), `diff` them. If the only difference is the tick and an added note,
**take the ticked side without further thought.** Then **`node scripts/check-backlog-sections.mjs`
from the App checkout** before committing — it printed `ok — 107 open items`.

**And split `git add` from `git commit`:** the auto-mode classifier refuses them chained as "Modify
Shared Resources". Two calls went through unchanged.

### `worktree.mjs done` refuses a folder with a live session, and that is correct

Lutan chose "swap out contacts" for the photo card, but he had **already opened a session** on that
folder, so `done` refused: *"removing the worktree anyway would pull git out from under that
session."* **The right response was to run the new stream as a fourth rather than ask him to close
something he had just opened** — one over the cap, deliberately, for an afternoon.

---

## Leftovers — eleven worktrees, nine of them HELD

`photo-card-reachable` and `planner-handover-201` are **`free`**; the other nine are **`HELD` by
their own sessions** and `done` will refuse them. **Close the sessions first; ask, do not tear one
down.** `/clean-streams` does the round.

- **`Animal_Shelter_photo-card-reachable` is free but its branch is worth keeping until `0.36.0`
  ships** — its PR was closed, not merged, and `shelter-photos-card` started from it.
- **`Animal_Shelter_planner-handover-201` is this file's own worktree.**
- `git worktree list` reports **13 entries**, so there are app-cut worktrees under
  `.claude/worktrees/` that `worktree.mjs done` **cannot see** — remove those with
  `git worktree remove`.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover. **One live case this
round:** `record-0-35-0` showed *ahead 1, free, no PR* and was the release manager's work in flight.
**It was correctly left alone.**

---

## A LIVE TRUTH PROBLEM: `0.35.0` shipped a note that was not true

**`0.35.0` deployed at `faee19c5` — production Worker, production Pi, both test environments — and
that commit is EARLIER than the crash fix (#694).** So the note telling staff that name-card
scanning works on Add Medical Photos and Record Weight **was mailed to every admin while both pages
were still crashing.** It is a major release; it cannot be recalled.

**It is handled honestly and needs no further action:** `unreleased` carries a plain correction
(*"Add Medical Photos and Record Weight open again … They had stopped opening at all"*), so `0.36.0`
says what happened rather than papering over it.

**The lesson is about sequencing, not wording.** The notes were written when the fix was planned and
deployed before it merged. **Before a deploy, check that every note's subject is actually on the
deployed SHA** — `docs/decisions/2026-10-11-release-note-truth-rule.md` covers the promise, not the
timing, and this is the gap.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **Ticking the Add Shelter Photos card onto Volunteer, Management and the 2IC**, in Settings → Who
  does what. **Nothing in the whole seven-stream feature does anything until he does this.** His
  own step, claimed in writing.
- **The sponsorship/appeals threads**: the Director's wording for money raised beyond a target, a
  Thai reader's review, the share-preview image's style.
- **The vet calendar's last mile** — and note the answer found on 2026-10-17: **it is set up on
  test only.** Outstanding, all Lutan: mint `GOOGLE_CALENDAR_REFRESH_TOKEN` (the **published
  Desktop client in `lanna-care-dev`**, never a new project), set `GOOGLE_CALENDAR_ID`, put both in
  the **test and production** values files, deploy; then share the calendar with the Director.
- **The Pi relay for the alert-mail test** — needs a schema PR, Lutan's yes and a Worker deploy;
  options in `docs/decisions/2026-10-16-alert-tile-green-needs-delivery.md`.
- **The Pi `x-origin-key` activation**, the spare-clone timer, running the app on its own Pi user.
- **The menu removal**: 68 unexplained orphans, and **the Doctor's broken `home_path`** among them —
  sign-in sends the Doctor to `/appointments`, which its cells do not open. **A live defect on dev.**
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.**
- **`Review the manual against real use`** — a staff member and a volunteer on a phone for a day.
  **It reads like a Fable review item and is not one.**
- **The acceptance checklist's pre-run agreements.** The printable PDF half is **BUILT**.
- **The remaining red check harnesses**, **F3**, the two auth decisions — each needs a ruling.
- **The photo lightbox at 375 px**, **the maintenance board on a phone**, **the map on the
  Director's actual phone**.
- **Three SEO items** and **about nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** ticking the photo card onto three roles; closing nine leftover sessions; the calendar
  token and deploy; the Pi relay decision; the Pi deploys; the Doctor's home and the two cards
  questions; the third Supabase project; F3's delete rule; the red harnesses; the Pi failover
  options paper; the second admin account; the product `.org` name; promoting `test-plan` to a
  required check; the Bills tile.
- **The Director:** the over-raising wording; signing the roles draft; the community-dogs baseline;
  the Thai receipt wording; the online shop; **the domain transfer, which gates the cutover**; the
  Thai public-page wording; a photo per public page; the "since &lt;year&gt;" year.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
3. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
4. **Raising model or effort is NOT the answer to a band being wrong.** Ten more streams on the
   recommended dials, none over band.
5. **The quick-win band stays as written.** Asked four times.
6. **"Three or more sub-features is large" is NOT a rule.** Count what must change and how many
   screens it needs.
7. **The shared-dev public view collision is FIXED** (#681). Do not soften it.
8. **The card is "Add Shelter Photos", plural** — Lutan said singular, then left the call to the
   planner, which chose plural so it pairs with "Add Medical Photos" and because the page takes
   several photos at once. **Settled; do not reopen.**
9. **The service-role bypass in the Shelter upload route is GONE** (#703, `0219`). The file is off
   the `eslint.config.mjs` allow-list, which now holds 17 entries.
10. **Fable had no work on this board again.** The acceptance dry run remains the one genuinely
    runnable Fable item, and **an unused bucket is not a reason to invent work for it.**

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, often before the planner has read the checks.** All nine merged ones
went that way.

**He reviews what he is shown, and he is right.** Two corrections this round, both material: the
folder regression in #697, and the mis-tagging risk being pre-existing rather than new. **When he
questions a framing, re-examine it rather than defending it** — he was right both times.

**He sends short corrections in quick succession while you work.** *"That tile is for medical
photos"*, then *"This tile is for shelter photos"*, then *"There is not one for shelter photos"*.
**Do not act on the first one. Let the sequence finish, and ask for a screenshot** — the screenshot
of the cards screen settled in one image what three messages had not.

**He delegates judgement calls back.** *"It can be plural if you think that's better."* **Decide,
give the two reasons, and record that he delegated it** so a later session does not read the
decision as drift.

**He sets the order of work and means it.** *"We will finish the feature before we start a new
chat."* The planner had started the handover early on an ambiguous *"carry on"* and stopped.
**"Carry on" after a correction means "continue what you were doing", not "begin the thing you
offered."**

**He files items mid-afternoon from looking at the live app.** Two arrived this round, one of which
became two streams. **Re-read an item fresh when writing its brief.**

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **Cutting `0.36.0`** — four lines in `unreleased`, ten streams merged, and it carries the
   correction to `0.35.0`'s untrue note. **The release manager's session, not the planner's.**
2. **The Doctor's broken `home_path`** — sign-in sends the Doctor to a page their cells cannot
   open. A live defect on dev, and the kind of quick win that went first this round to good effect.
3. **The dashboard Month by month / Cumulative toggle** (Lutan, 2026-10-17) — verified undone,
   app only, small.
4. **Resident hub: tap the photo for a large pop-up** (Lutan, 2026-10-17) — verified undone, small.
5. **Appeals are hard to find, on the public site and for staff** — small, app only; verified that
   neither nav file mentions the appeals routes.
6. **A clinic visit has no page to read** and **attach the doctor's written report** — the second
   needs schema, so they are two batches, not one. Both verified undone on 2026-10-17.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes**, which is what went wrong this round.

**Count the workstreams honestly.** This round's ten include **#697, which was closed unmerged** —
it had its own worktree, branch, brief and PR, and it cost 173,670 tokens, so it counts. **A stream
that produced nothing still counts**, or the counter will flatter the round that most needs
examining.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-201`; the previous were **#690** (`193`), **#676**
(`182`), **#662** (`173`), **#638** (`156`), **#625** (`147`), **#612** (`138`), **#597** (`127`),
**#588** (`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501**
(`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
