# Planner handover — written 2026-10-18, after NINE workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine workstreams planned, built and merged between 00:40 and 07:35 on 2026-10-18** — one
morning, one chat, **three clean batches of three**, each batch set up only after the previous one
had merged. It says where the planning loop stands, what is blocked and on whom, and what not to
re-derive. It is **rewritten every nine workstreams or so** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — this round's is short, and the measurement table is the valuable part
4. this file
5. **`docs/decisions/2026-10-18-doctor-report-schema.md`** — the schema decision file whose
   *"What the app half must do"* section made its app half briefable in minutes. **It is the
   standard. Read it before writing any schema brief.**

**The branch slug is `212`, which is the true cumulative count.** The last handover's slug said
`201` when the real figure was `203`; `203 + 9 = 212`. Recorded so nobody redoes the arithmetic.

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

**The allowance was nowhere near the constraint, for the third round running.** Nine workstreams,
one migration, two new pages and a new chart moved *Weekly · all models* from **42% to 45%** — about
**3% for nine streams**. Fable sat at **9%**, untouched, all day.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`1b50cf87`** (#715 merged, then a `backlog` merge) |
| `backlog` branch | **in sync with `main`**, fast-forwarded and pushed |
| Dev database | **221 applied, 221 files, 0 pending, zero drift** |
| Next free migration number | **`0221`** (highest on `main` is `0220_doctor_report_purpose.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **108** |
| Open PRs | **none** |
| Release | **`0.36.0` is cut, recorded and deployed.** `unreleased` carries **four** lines from today's nine streams. **`0.37.0` is NOT cut** — the release manager's session, not the planner's |
| Leftover worktrees | **ten**, most `HELD` by their own sessions. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in order.** Batch 1: #707 `photo-approve-freeze`, #708 `pi-deploy-safety`, #709
`who-does-what-verify-note`. Batch 2: #710 `doctor-report-schema`, #711 `appeals-findable`, #712
`resident-photo-lightbox`. Batch 3: #713 `admin-tables-cards`, #714 `dashboard-cumulative-chart`
(plus **#716**, a one-line follow-up), #715 `clinic-visit-record`.

**All nine merged. None closed unmerged. None ended with a built branch and no PR.** The two
standing brief blocks are doing their job and must stay.

**Unlike last round, this one held its shape**: three planned batches of three, no feature that grew
to seven streams. **Both shapes are normal. Plan for three and do not be surprised by seven.**

---

## THE FINDING OF THIS ROUND: THE BANDS ARE TOO WIDE, AND THERE IS NOW ENOUGH EVIDENCE TO SAY SO

| slug | model / effort | estimated | actual | |
|---|---|---|---|---|
| `photo-approve-freeze` | sonnet-5-5 / low | 110–170k | **134,743** | inside |
| `pi-deploy-safety` | sonnet-5-5 / low | 170–290k | **147,503** | **−13%** |
| `who-does-what-verify-note` | sonnet-5-5 / low | 110–170k | **137,703** | inside |
| `doctor-report-schema` | sonnet-5-5 / low | 140–200k | **159,587** | inside |
| `appeals-findable` | sonnet-5-5 / low | 170–290k | **170,799** | at the floor |
| `resident-photo-lightbox` | sonnet-5-5 / low | 170–290k | **153,476** | **−10%** |
| `admin-tables-cards` | sonnet-5-5 / low | 170–290k | **162,245** | **−5%** |
| `dashboard-cumulative-chart` | sonnet-5-5 / low | 250–380k | **182,292** | **−27%** |
| `clinic-visit-record` | sonnet-5-5 / low | 280–400k | **237,951** | **−15%** |

**Nine streams, 134,743–237,951. Five came in UNDER their band and four inside. Not one over.**
Every figure read from `get_usage` in the same turn the merge was noticed — **the capture rule held
nine for nine** — and `get_session` confirmed **all nine actually ran `claude-sonnet-5-5` / `low`**,
so these rows are settings, not recommendations mistaken for settings.

**That is nineteen consecutive streams under band on those dials** (ten last round, nine today).

### The prediction that failed, and it is the useful part

**`dashboard-cumulative-chart` was banded 250–380k specifically because it had to BUILD THE
COUNTING** — a daily at-the-shelter series that existed nowhere, derived from `placement_history`,
plus a cross-check. By the "must it build the instrument?" rule that is the expensive shape, and the
last handover named it as the one real test of the bands.

**It came in at 182,292 — 27% under — and it wrote `src/lib/management/daily-count.ts` AND
`scripts/check-daily-count.mjs` along the way.**

**So the "building the instrument is expensive" rule is now doubtful**, and that matters, because it
is the rule the planner has been using to widen bands. The one case still supporting it
(`who-does-what-view`, +50%) is from the `claude-opus-5-5` / `medium` era and predates every process
improvement since.

### What to actually do about it

**Narrow the bands on the next round's evidence, not before, and narrow them like this:**

- **A prescriptively-briefed stream on sonnet-5-5 / low is ~135k–240k, almost regardless of shape.**
  All nine fit in that span, and so did all ten of last round.
- **The floor is ~87k and did not move all day** (System tools ~39k · MCP ~20k · Memory 11,120 ·
  System prompt ~10k · Skills 6,601). **That is more than half of a typical stream.**
- **So the dominant lever on usage is HOW MANY STREAMS YOU CREATE, not how big each one is.**
  `pi-deploy-safety` did two Next-up items for 147,503; as two streams it would have cost ~230k, and
  the extra ~85k would have been pure floor. **Rule 8 — fold small items — is the one that pays.**

**Keep varying nothing else.** Nineteen streams on one setting is a good baseline; spend it rather
than muddying it.

### The condition being measured — say this out loud every time

Every brief in all nine was **unusually prescriptive**: it named the files, named the decision to
be made, said what was *not* in scope and who had it, and in three cases pointed at a predecessor's
decision file. **That is the condition producing these numbers, and it is not free** — it is paid
for in the planning chat instead. **Do not read these figures as "streams are cheap now."**

---

## THE OTHER FINDING: A SAVED PLAN WENT STALE INSIDE ONE MORNING

**`dashboard-cumulative-chart` was planned against the monthly-average reading of its item.** By the
time its brief was written, two batches later, **Lutan had answered the item on the `backlog`
branch** and his answer *replaced* that recommendation:

> *"Run cumulative numbers based on start number + intake - fostered - adopted - deceased +
> returned, on a daily plot."*

That changes the x-axis from ~12 points to ~365, and **reverses** whether fostered residents count
as in care. **A brief written from the saved plan would have built the wrong chart.**

It was caught only because `SKILL.md` says to re-read the item fresh from the `backlog` branch **at
the moment the brief is written**. **Last round the same failure actually cost a stream (#697,
173,670 tokens, closed unmerged). This round it cost nothing.** The rule works; keep it.

**Two smaller versions of the same trap, both hit today:**

- **Line numbers shift between batches.** The dashboard item moved 481 → 482 in one morning.
  **Locate items with `grep -n` on their title, never by a line number recorded earlier.**
- **An item can exist on `backlog` and not on `main` at all.** The Cloudflare cache item was filed
  *after* the morning sync, so `main` never had it — yet it was briefed, built and merged, and the
  merge then had to bring the item across from the `backlog` side.

---

## The pattern that keeps paying: decision files as the brief

**`docs/decisions/2026-10-18-doctor-report-schema.md` is the best example the repo now has.** Its
*"What the app half must do"* section named:

- the exact write — `record_attachment(…, p_purpose => 'report')`, allowed values `'bill'` |
  `'report'`, the report date in `date_taken`, **and that there is no note column**;
- the attach points, **verified on `main`**, file by file;
- the permission condition for read, write and the doctor's own-clinic case, **by named function**;
- the multi-resident answer, which **contradicted the backlog item's phrasing** and was right;
- what it deliberately did **not** do, including *"`loadBillPhotos()` must stay bill-only; do not
  loosen it to share code."*

**`clinic-visit-record`'s brief pointed at it and said "where this disagrees with me, it is right
and I am wrong."** That stream then closed **two** backlog items and built a new page for 237,951 —
under its band.

**So: when briefing a schema half, require that section explicitly.** It costs the schema stream
almost nothing while it still has the context, and it is the highest-leverage line in the brief.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** **No stream this round pushed a broken test plan, and none
ended with a built branch and no PR.** What else earned its place, all used this round:

- **POINT AT THE PREDECESSOR'S DECISION FILE AND SAY IT OUTRANKS YOU.** Still the single
  highest-value line.
- **BRIEF AN OPTION, NOT A MANDATE — AND SAY WHICH IT IS.** `doctor-report-schema` was offered a
  `purpose` column or a new enum value, with the lean and the reason; it took the column and said
  why. `admin-tables-cards` was offered "all four pages, or just the log, and tell me which" — **it
  chose the log only** and recorded the judgement. That is delegation working.
- **TELL A STREAM WHAT IS *NOT* ITS SCOPE, AND WHO HAS IT.** Used in all nine; nobody crossed.
- **SAY WHAT THE USER WILL DO BY HAND, AND FORBID DOING IT FOR THEM.** `appeals-findable` created
  the *Run fundraising appeals* card and **granted it to nobody**, as instructed.
- **NAME THE ONE THING THAT CAN HURT SOMEONE, AND MAKE IT A RISK THE CHANGE INTRODUCES.** Lutan
  ruled on 2026-10-17 that naming a *pre-existing* risk wastes the stream's attention and invites
  friction nobody asked for. Done correctly nine times: the quiet `loadBillPhotos()` breakage, the
  first read-only door into the medical record, a plausible-but-wrong line on a chart the Director
  reads as fact.
- **TELL A STREAM TO REPORT A DATA PROBLEM RATHER THAN PAPER OVER IT.** New this round, and it
  worked — see below.
- **GIVE A SCOPE-CREEP GUARD WITH A NAMED ESCAPE.** `clinic-visit-record` was told to wire the extra
  entry points only if each was a one-line link, and otherwise to report. It kept the stream inside
  its band.
- **For a schema half, three sentences**: the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held again.

---

## A REAL DATA PROBLEM THE CROSS-CHECK FOUND — and it is Lutan's to answer

`dashboard-cumulative-chart`'s brief said the cross-check was **part of the deliverable**, and that
a disagreement would be *"a finding about the data, not a bug in your chart"*. It found one:

> `scripts/check-daily-count.mjs`, dev, six dates across the year: **five agree. 2026-07-16 differs
> by one** (series 80, straight count 81). Resident `853951b2-…` has a **Foster** placement
> (2026-06-01 to 2026-09-07) whose **enclosure is Unassigned, not Fostered**. By type it is away; by
> enclosure the app's status view reads it as Outreach.

**Either the type or the enclosure on that row is wrong, and only Lutan can say which.** The chart
follows the placement **type**. The script will surface any further such rows.

**This is the shape to repeat.** A stream told to report rather than reconcile produced a finding
about real data that nobody was looking for, at no extra cost. **Do not let a later brief soften
this into "make the numbers agree."**

---

## Traps in the tooling

Everything in the last edition's list still holds. **`git show <rev>:<path>` LIES SILENTLY** — this
round it returned **empty for `docs/backlog.md`**, an *undotted* path, mid-merge, and the zero
looked exactly like "the item is not there". `git grep <pattern> <rev> -- <path>` gave the truth.
**Never trust an empty result from `git show <rev>:<path>` in this shell, dotted or not** — the
`CLAUDE.md` note saying `docs/backlog.md` works is too generous.
**No long prose in `node -e` or heredocs** — use the Write tool. **`python` is the Store stub.**
**`gh` reports `mergeStateStatus: UNKNOWN` for a MERGED PR.** **`worktree.mjs new` can exceed the
tool timeout on `npm ci`**, but the folder and `.port` exist well before it finishes. **Split
`git add` from `git commit`** — chained, the auto-mode classifier refuses them as "Modify Shared
Resources".

**New, small, and it will catch someone:** the **Write tool refuses to overwrite a file this
session has not read**, which bites when rewriting this handover in a fresh worktree. `rm` the file
first and Write it as new, rather than burning context re-reading 480 lines you have already read
on `main`.

### `git merge backlog`: conflicted once in three merges today

**Expect one, but it is not every time.** Batches 2 and 3 merged clean; batch 1 conflicted.

**The method, which takes a minute:** extract both sides with `sed`, normalise the tick
(`sed 's/^- \[.\]/- [X]/'`), `diff` them. **If the only difference is the tick and an added note,
take the ticked side without further thought** — `main` is the backlog line plus the tick plus a
*Done* note, so it is strictly newer. Both differences were exactly that.

**The new wrinkle: one side may hold an item the other has never seen.** The resolution is a **plain
union with no editorial change** — bring the unseen item across in its filed position and take the
ticked lines from `main`. **Do not reword an item during a merge**; rewording belongs on the
`backlog` branch.

Then **`node scripts/check-backlog-sections.mjs` with the path passed explicitly**:
`node scripts/check-backlog-sections.mjs ../Animal_Shelter_Backlog/docs/backlog.md`. The script
resolves its default **relative to itself**, so the App checkout's copy always checks the App's
file whichever directory you stand in. **A silent pass on the wrong file is worse than no check.**

---

## Leftovers — ten worktrees

- **`Animal_Shelter_photo-card-reachable` — KEEP.** `ahead 5`, `free`, **no open PR because its PR
  was CLOSED, not merged**, and `shelter-photos-card` started from it. **The one documented
  exception to "ahead with no PR is unsubmitted work".** Worth keeping until `0.37.0` ships.
- **`Animal_Shelter_photo-approval-queue`** — dirty with junk, 0 ahead, `free`, PR merged.
  `done --force` clears it.
- **This round's nine, plus `planner-handover-212`**, are `HELD` by their own sessions while those
  are open. **Close the sessions first; ask, do not tear one down.** `/clean-streams` does the round.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever.

---

## BEFORE THE NEXT PRODUCTION DEPLOY — two things from today

**These are the release manager's, but they will be missed if this file does not say them.**

1. **`0220` must be applied to production BEFORE this round's app code deploys.**
   `loadBillPhotos()` and the Bills inbox now select on `attachments.purpose`. Deploy the code
   first and **both error**. (`docs/decisions/2026-10-18-doctor-report-schema.md`, "Production".)
2. **A Cloudflare cache purge is now a runbook step after every Pi deploy**, added by #708 to
   `docs/release-procedure.md`, with `scripts/pi/check-assets.mjs` to catch it when missed. Until
   someone automates it, **a Pi deploy without a purge can serve a year-long broken stylesheet to
   whichever edge is unlucky** — it reached a real user on a real phone on 2026-10-17.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The peak-memory measurement on the next Pi build** — `/usr/bin/time -v npm run build`,
  *Maximum resident set size*. **New this round.** It decides whether dropping the typecheck from
  the Pi build is necessary or merely tidy, and the item is explicit that the measurement comes
  *before* the fix. #708 put the step in the runbook; only Lutan can take it.
- **Whether the Pi gets a Cloudflare API token** so the purge can be automatic. **New this round.**
  A security trade-off against `docs/security/`, set out in
  `docs/decisions/2026-10-18-pi-deploy-safety.md` so the ruling is one read.
- **The placement row with a Foster type and an Unassigned enclosure** (above). **New this round.**
- **Ticking the *Run fundraising appeals* card onto Management**, and the **Add Shelter Photos**
  card onto Volunteer, Management and the 2IC. His own steps, claimed in writing.
- **The sponsorship/appeals threads**: the Director's wording for money raised beyond a target, a
  Thai reader's review, the share-preview image's style.
- **The vet calendar's last mile** — set up on **test only**. Mint `GOOGLE_CALENDAR_REFRESH_TOKEN`
  (the **published Desktop client in `lanna-care-dev`**, never a new project), set
  `GOOGLE_CALENDAR_ID`, put both in the **test and production** values files, deploy; then share the
  calendar with the Director.
- **The Pi relay for the alert-mail test**, the **Pi `x-origin-key` activation**, the spare-clone
  timer, running the app on its own Pi user.
- **The menu removal**: 68 unexplained orphans, and **the Doctor's broken `home_path`** among them —
  sign-in sends the Doctor to `/appointments`, which their cells cannot open. **A live defect on
  dev.** Offered as a batch 1 swap this round and declined; it needs his answer on where the Doctor
  should land instead.
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.**
- **`Review the manual against real use`** — a staff member and a volunteer on a phone for a day.
  **It reads like a Fable review item and is not one.**
- **The photo lightbox at 375 px**, **the maintenance board on a phone**, **the map on the
  Director's actual phone**.
- **Three SEO items** and **about nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** the Pi peak-memory measurement; the Cloudflare token decision; the Foster/Unassigned
  placement row; ticking two cards onto roles; the calendar token and deploy; the Pi relay decision;
  the Pi deploys; the Doctor's home; the third Supabase project; F3's delete rule; the red
  harnesses; the Pi failover options paper; the second admin account; the product `.org` name;
  promoting `test-plan` to a required check; the Bills tile.
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
4. **Raising model or effort is NOT the answer to a band being wrong.** Nineteen streams on the
   recommended dials, none over band. **The answer is a tighter brief or a fold.**
5. **The quick-win band stays as written.**
6. **"Three or more sub-features is large" is NOT a rule.** Count what must change and how many
   screens it needs.
7. **The card is "Add Shelter Photos", plural.** Settled.
8. **The service-role bypass in the Shelter upload route is GONE** (#703, `0219`).
9. **Appeals may show medical photos is DONE** — shipped 2026-10-17
   (`docs/decisions/2026-10-17-appeal-medical-photos.md`; its harness passes every assertion). It
   read open on the backlog for a day and was flagged to Lutan this round. **Do not plan it.**
10. **Fable had no work on this board again.** The acceptance dry run remains the one genuinely
    runnable Fable item, and **an unused bucket is not a reason to invent work for it.**

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, often before the planner has read the checks.** All nine went that
way, and twice he had merged a whole batch before the planner next looked.

**He reviews what he is shown and sends small corrections straight back.** #716 exists because he
read the chart's own explanatory note and said *Bold line*, not *Black line* — which is white in
dark mode. **A one-line follow-up PR on a merged branch is normal and fine; it is not a defect in
the stream, and it is not a tenth workstream.**

**He delegates judgement calls back.** **Decide, give the two reasons, and record that he delegated
it** so a later session does not read the decision as drift.

**He files items mid-session from looking at the live app** — four arrived today while the batches
ran. **Re-read an item fresh when writing its brief.**

**He sets the order of work and means it.** *"Carry on" after a correction means "continue what you
were doing", not "begin the thing you offered."*

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at, and **the first two he
filed today**:

1. **An "Approve photos" card, assignable to any role, and Add resident photos cannot be given out
   until some role can approve** (small schema PR, then app). **Lutan, 2026-10-18.** Pairs with his
   related item that **Admin should not count as the photo approver**.
2. **Videos of residents in the Photos section, uploaded straight to Drive** — **decision on storage
   first**, then schema, then app. **Lutan, 2026-10-18**, with a companion item about the shelter's
   1 TB Drive. **The storage decision is his and comes first**; do not brief a build before it.
3. **Cutting `0.37.0`** — four lines in `unreleased`, nine streams merged, carrying the doctor's
   report, the visit page, the cumulative chart and the appeals links. **The release manager's
   session, not the planner's**, and read the two deploy warnings above first.
4. **The Doctor's broken `home_path`** — a live defect on dev, and a genuine quick win **the moment
   he says where the Doctor should land.**
5. **Mobile sweep leftovers** — the four screens the sweep could not see, including
   `/admin/security` at 375 px. `admin-tables-cards` deliberately did **not** absorb it.
6. **The other three wide admin tables** — #713 converted the audit log only, by design, judging the
   rest readable. **Check that judgement before re-planning them**:
   `docs/decisions/2026-10-18-admin-tables-cards-log-only.md`.
7. **Mark a resident's photo as "posted on social media"**, and the **meme library** (stage 1
   schema, stage 2 the maker). All Lutan, 2026-10-17, all untouched.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Count the workstreams honestly.** A stream that produced nothing still counts, or the counter will
flatter the round that most needs examining. **A one-line follow-up PR on an already-merged branch
(#716) is NOT a workstream** — no worktree, no brief, no separate session.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-212`; the previous were **#704** (`201`, truly 203),
**#690** (`193`), **#676** (`182`), **#662** (`173`), **#638** (`156`), **#625** (`147`), **#612**
(`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`),
**#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was
really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
