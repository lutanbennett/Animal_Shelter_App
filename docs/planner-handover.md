# Planner handover — written 2026-10-18, after TEN workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **ten workstreams planned, built and merged on 2026-10-18** — three batches of three plus
this handover, each batch set up only after the previous one had merged. It says where the planning
loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten every nine or
ten workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run. **It gained two rules this
   round, in the same PR as this file: a third estimating axis, and a stop rule for every brief.
   Read both; they are the whole lesson of 2026-10-18**
3. `.plan-day.md` — the measurement table is the valuable part
4. this file
5. **`docs/decisions/2026-10-18-approve-photos-schema.md`** and
   **`docs/decisions/2026-10-18-social-shares-schema.md`** — the two schema decision files whose
   *"What the app half must do"* sections made their app halves briefable in minutes. **They are the
   standard. Read one before writing any schema brief.**

**The branch slug is `221`, the true cumulative count** (212 + 9 last round's figure carried
forward + this round's). Recorded so nobody redoes the arithmetic.

---

## FIRST, THE TRAP: CHECK FOR AN OPEN HANDOVER PR BEFORE YOU TRUST THIS FILE

**Run `gh pr list --state open` and look for an open `planner-handover-*` PR.** A chat once read the
file on `main`, reported its figures to Lutan, and was wrong by ten migrations, because the current
edition was sitting in an unmerged PR the whole time.

**Two handovers exist.** An open PR named `handover-refresh` is the **release** handover
(`docs/release-handover.md`), a different document. **Check which one the open PR touches before
concluding anything.**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE — AND THIS ROUND TESTED IT

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.**
- **Mid-work exhaustion is different and still correct:** stop with words.

**Do not reintroduce a numeric stop threshold into a brief, ever.** **Model, effort, which allowance
gets spent, and whether to start at all are all his.**

**This round is the first where the allowance WAS a real constraint, and it must not be misread.**
*Weekly · all models* went **42% → 69%** and *Weekly · Fable* **9% → 48%** in one day. **Almost all
of that was one stream** (below). The other nine cost about 5% between them, in line with every
previous round.

**Lutan's words, 2026-10-18, after it: *"This cannot happen again - it has burnt a large portion of
my weekly budget."*** **The answer to that is a smaller BRIEF, never a smaller allowance and never a
token threshold in a brief.** The two `SKILL.md` rules added this round are that answer. **If a
later session reads this as licence to gate his usage, it has misread it.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`6539dcb0`** (#729 merged, then a `backlog` merge) |
| `backlog` branch | **in sync with `main`**, fast-forwarded and pushed |
| Dev database | **224 applied, 224 files, 0 pending, zero drift** |
| Next free migration number | **`0224`** (highest on `main` is `0223_social_shares.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **112** — up from 108, because the dry run's findings were filed as items |
| Open PRs | **none** |
| Release | **`0.36.1` is cut, recorded and deployed.** `unreleased` carries **four** lines from today: the meme library, the posted-on-social badge, the home-screen fix and the Approve photos card. **`0.37.0` is NOT cut** — the release manager's session, and Lutan moved to it straight after this file |
| Leftover worktrees | **eleven**, all at `0` ahead with merged PRs. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The ten, in order.** Batch 1: #721 `approve-photos-schema`, #722 `deploy-pi-self-update`, #723
`mobile-sweep-leftovers`. Batch 2: #724 `approve-photos-app`, #725 `social-shares-schema`, #727
`fable-acceptance-dry-run` (**partial, stopped**). Batch 3: #726 `role-home-is-tiles`, #728
`posted-on-social-app`, #729 `meme-library-app`. Plus this handover.

**All ten merged. None closed unmerged. None ended with a built branch and no PR** — including the
one that was stopped mid-run, which is the strongest evidence yet for the two standing brief blocks.
**Keep both verbatim.**

---

## THE FINDING OF THIS ROUND: A PROGRAMME WAS BRIEFED AS ONE STREAM

`fable-acceptance-dry-run` was banded **300–460k** and reached **819,980 at about 35% done** before
Lutan stopped it. No auto-compact had happened (82% of the window, threshold 97%), so **that figure
is real, not understated.**

**Extrapolated, a full run was ~2.3M tokens — more than two context windows.** It was unfinishable
in one session at any effort, on any model. **The task was not plannable as a workstream and the
planner planned it as one. That is a planning error, not a stream failure.**

### Why the old estimating rule did not catch it

The rule was *"must this stream BUILD something to measure with?"* This stream did not —
`scripts/acceptance-matrix.mjs` already existed — so it scored cheap. **What it actually faced was
132 activities + 42 "must not" lines, × 6 roles × 2 languages × 2 widths, every row driven by real
taps in a browser.**

**`SKILL.md` now asks three questions, in order** (added this round, read it there):

1. **Must it build the instrument?** Dear. Widen.
2. **How many live interactions must it drive?** **Dearest, and it scales with the row count.**
3. **Must it merely read a lot?** Cheap. Do not widen.

**A walk of N items × M roles is a PROGRAMME, NOT A WORKSTREAM.** Do not brief one.

### The sharper half: a turn costs the whole session

**Asked to stop, the stream (a) walked more rows its own report had already listed as not reached,
then (b) did the correct, brief-mandated tidy-up — merge `main`, test plan, open the PR, tick CI
once seen green.**

**(b) was obedience, not error** — and it cost about **6% of the weekly Fable window on its own**,
measured: between two readings the context grew **21,282 tokens** while Fable moved **41% → 47%**.

**Because every turn re-sends the whole context as input, the cost of a turn is the size of the
session, not the size of the work.** At ~800k, writing one short test plan costs as much as an hour
of early work. **The first minute of a session is its cheapest and the last is its dearest.**

Hence the new **stop rule in every brief** (`SKILL.md` step 7): told to stop, commit, say what is
done — and **if the session is already large, do NOT merge, write a test plan or open the PR.** Say
*"the PR is still to open"* and let the planner open it from a fresh session.

**That rule is a deliberately NARROW exception to the finish-line block and sits beside it, not
instead of it.** The finish-line block exists because two streams once ended with finished work and
no PR, and it governs every ordinary-sized session. **Do not let a later round delete either one.**

### It was expensive AND worth it — do not abandon the dry run

**From the Admin pass alone: 15 findings, three of them *wrong result* defects nobody knew about** —
a bill turned into a delivery loses its cost and never attaches; a mistyped diet silently inflates
the food forecast, purchasing and cashflow; a visit left "Scheduled" with a past time saves as
Completed. **Four more are the acceptance checklist ITSELF being wrong**, including a control it
tells testers to use that does not exist. Those four would have wasted the Director's and the
staff's time on the real sign-off run.

**All of them are now filed as backlog items** (that is why the open count rose to 112).

**The item is reshaped on the `backlog` branch into ONE STREAM PER ROLE** — five remain
(Management, Doctor, Volunteer, Public viewer, Signed-out visitor); **the Admin pass is done and must
not be repeated.** The five disposable role logins already exist on dev and are listed in the
report, so each stream can sign in at once. **Do not re-brief it as a single stream.**

---

## THE SECOND FINDING, AND IT INVALIDATES THIS ROUND'S MODEL COLUMN

**Lutan, 2026-10-18: *"They did bounce to fable at some point and I had to move them back"* and
*"I set sonnet but they changed at some point in the build."***

**Sessions changed model mid-run, by themselves, from the Sonnet he had set.** So:

- **`get_session`'s `model` is the setting AT READ TIME, not the model the stream ran on.** One
  reading at the end cannot establish what a stream used.
- **`role-home-is-tiles` reads `claude-fable-5-1`.** It was recommended Sonnet and Lutan says he set
  Sonnet. **Whether that row is a bounce caught at read time or a deliberate choice cannot be told
  from here, and it must not be presented as either.**
- **The Fable window reading cannot be attributed cleanly**, because bounced streams spend Fable
  where Sonnet was set. Some of 9% → 48% is the dry run, which was legitimately Fable; some may not
  be.

**So: draw NO model conclusion from this round's rows.** The **token figures stand** — context size
is measured directly and does not depend on which model produced it. The **model attribution does
not.**

**And treat the older claim with the same caution.** Previous handovers said *"nineteen consecutive
streams on `claude-sonnet-5-5` / `low`"*, built from exactly this single-reading method. **Those
rows cannot be re-verified now.** The rule in `SKILL.md` — *record what it actually ran on, not what
you recommended* — was right to exist and is simply not achievable from one reading.

**What to do next round:** either read `get_session` at the **start as well as the end** of each
stream and say so, or **stop treating the dials as a controlled variable** and present the table as
token figures against task shape only. **Do not publish a model finding you cannot support.** A
false finding about the dials is worse than no finding, because it is the thing Lutan would act on.

**Also tell him when a Fable reading looks higher than planned Fable work** — it may be bounced
streams, not his choices, and he has had to move sessions back by hand.

---

## The bands: the streak broke, honestly

| slug | estimated | actual | |
|---|---|---|---|
| `approve-photos-schema` | 150–230k | **144,261** | **−4% under** |
| `deploy-pi-self-update` | 140–210k | **143,482** | at the floor |
| `mobile-sweep-leftovers` | 150–240k | **160,310** | inside |
| `approve-photos-app` | 170–260k | **190,875** | inside |
| `social-shares-schema` | 140–200k | **173,981** | inside, upper end |
| `fable-acceptance-dry-run` | 300–460k | **819,980 at ~35%** | **unfinishable; see above** |
| `role-home-is-tiles` | 150–240k | **216,696** | inside |
| `posted-on-social-app` | 160–250k | **288,248** | **+15% OVER** |
| `meme-library-app` | 200–300k | **391,548** | **+31% OVER** |

**Seven of nine inside or under; two over; one unfinishable.** The previous handover's narrowed
span — *"a prescriptively-briefed stream is ~135k–240k almost regardless of shape"* — **held for the
first seven and broke for the last two. Do not keep quoting it as a law.**

**Why the two app halves ran over, and it is a planning lesson.** Both were the app halves of the
**folded** schema PR (`social-shares-schema`, two items in one migration). **The fold saved the
schema cost and the planner then under-banded the app halves as if they were also folded. They were
not — they were two full features** (a whole new `/memes` section with upload, Drive folder, filters
and search; a grid, filter, lightbox, multi-select and both dictionaries). **Folding schema does not
fold the app work. Band each app half as the full feature it is.**

**The floor held again at ~87k** (System tools ~39k · MCP ~20k · Memory ~11k · System prompt ~10–12k
· Skills 6,601), identical across every stream. **More than half of a typical stream, so the
dominant lever is still HOW MANY STREAMS YOU CREATE** — the batch 2 fold was right, and Rule 8
remains the one that pays.

---

## The pattern that keeps paying: decision files as the brief

**Two more examples this round, both now standards:**
`docs/decisions/2026-10-18-approve-photos-schema.md` and
`docs/decisions/2026-10-18-social-shares-schema.md`. Their *"What the app half must do"* sections
named the exact function signature and its messages, the write shape field by field, the permission
condition **by named activity**, which check script already covers what, and what they deliberately
did **not** do.

**`social-shares-schema`'s went further and split that section per app half**, because it served
two. Both app halves then shipped the same day.

**So: when briefing a schema half, require that section explicitly, split per consumer if it serves
more than one.** It costs the schema stream almost nothing while it still has the context.

**Both schema streams also reported a finding rather than papering over it** — see *Items whose
remaining condition is a person*. **Keep asking for that; it is where the real defects come from.**

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end — **plus the new stop rule beside the finish-line block.** **Copy all three
verbatim.** No stream this round pushed a broken test plan, and none ended with a built branch and
no PR. What else earned its place, all used this round:

- **POINT AT THE PREDECESSOR'S DECISION FILE AND SAY IT OUTRANKS YOU.** Still the single
  highest-value line. Both app halves had it; both shipped in one go.
- **GIVE EVERY BRIEF A HARD DELIVERABLE BOUNDARY.** **New, and the lesson of the round.** The
  scope-creep escape was given to three streams and **left off the largest** — the one that needed
  it. Name the unit the stream stops at.
- **BRIEF AN OPTION, NOT A MANDATE — AND SAY WHICH IT IS.** `deploy-pi-self-update` was offered
  three options with a lean; it took the lean, added a `bash -n` precondition nobody had asked for
  so a deploy **refuses before anything is swapped**, and came in at the floor. **A stream given a
  real decision is not inherently expensive.**
- **TELL A STREAM WHAT IS *NOT* ITS SCOPE, AND WHO HAS IT.** Used in all nine; nobody crossed. With
  three streams in one batch touching cards, tiles and photos, the per-file ownership lines
  (*"`meme-library-app` owns `cards.ts`; `role-home-is-tiles` must not touch it"*) are what kept
  them apart.
- **SAY WHAT THE USER WILL DO BY HAND, AND FORBID DOING IT FOR THEM.** `social.library` was granted
  to nobody and the Approve photos card ticked onto no role, as instructed.
- **NAME THE ONE THING THAT CAN HURT SOMEONE, AND MAKE IT A RISK THE CHANGE INTRODUCES.** Done nine
  times. The sharpest was the meme library's: a joke made from a dying animal's photograph reaching
  the open internet under the shelter's name. It wrote the refusal test first.
- **TELL A STREAM TO REPORT A DATA PROBLEM RATHER THAN PAPER OVER IT.** Produced two real findings
  this round (below).
- **For a schema half, three sentences**: the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held twice.

---

## RULINGS BY LUTAN THIS ROUND — settled, do not re-litigate

### 1. Retired roles are excluded from the photo-approver guard

> *"exclude retired roles as this will future proof the system going forward."*

Answering #721's finding that the retired `staff` role counted as an approver. Shipped as `0222`,
carried by **`approve-photos-app`** (not the schema stream) because
`docs/decisions/2026-10-18-approve-photos-schema.md` requires the screen and the database to use the
**same "holds the activity" test** — one stream had to change both or they would drift.

**That put two migrations in one batch, which `CLAUDE.md` normally forbids.** It was done with
**both numbers assigned explicitly by the planner** (0222 and 0223), so the rule's purpose — no two
streams claiming a number, no dev schema `main` lacks — still held. **It is a documented one-off,
not a precedent. Do not repeat it without the same explicit assignment.**

The brief also forbade hard-coding `staff` ("future proof" means the next retired role falls out by
itself) and forbade retiring or removing the role. Both held.

### 2. A role's home screen is its who-does-what tiles

> *"the Home Screen should be their tiles as defined by the who does what feature."*

Answering the Doctor defect: sign-in sent the Doctor to `/appointments`, which their own cells
refused, and it had blocked the phone-width harness twice. **Shipped by #726**: nothing redirects
away from `/home` any more and `roles.home_path` is unread
(`docs/decisions/2026-10-18-role-home-is-tiles.md`).

**This item did not exist on the backlog** — the Doctor defect was only a clause inside *Choose each
role's home tiles in Settings*. **The planner filed it from his ruling.** That is the right move:
a ruling with no item has nothing to tick and no record.

**It unblocked more than itself**: the *Mobile sweep leftovers* item is now **ticked** (its
`/appointments` part was the last one open), and `check-menu-coverage.mjs` reports **0 orphans for
the Doctor**, 66 left across the other five roles.

**Consequence for planning:** *Choose each role's home tiles in Settings* **moved to next round on
purpose.** His ruling defines what that panel overrides, so briefing it earlier would have designed
against the old shape. **It is now the natural next step.**

---

## Traps in the tooling

Everything in the last edition's list still holds. **`git show <rev>:<path>` LIES SILENTLY** — never
trust an empty result in this shell, dotted path or not; use
`git grep <pattern> <rev> -- <path>`. **No long prose in `node -e` or heredocs** — use the Write
tool. **`python` is the Store stub.** **`gh` reports `mergeStateStatus: UNKNOWN`** for a merged PR
*and* for an open one GitHub has not finished computing — **green checks plus `UNKNOWN` is not a
conflict; look again before concluding.** **`worktree.mjs new` can exceed the tool timeout on
`npm ci`**, but the folder and `.port` exist well before it finishes. **Split `git add` from
`git commit`.** **The Write tool refuses to overwrite a file this session has not read** — `rm` it
and Write it as new rather than re-reading 460 lines.

### NEW: the backlog moves under you WITHIN a single session

**Not just between batches.** This round Lutan filed an item mid-conversation and **every line
number shifted**. Three items had already been read by line number and came back as three
*different*, already-completed items — which looks exactly like "the work is done, do not plan it".

**Locate items with `grep -n` on their title, every time, even minutes after reading the file.**
Re-run `git merge backlog` before briefing. **A line number is never a durable reference here.**

### NEW: another session may resolve or commit under you

The daily `git merge backlog` conflicted. Mid-resolution the conflict markers vanished from the
working file, and a `git add` succeeded while the following `git commit` reported *nothing to
commit* — **another session had resolved and committed it in between.**

**So: before resolving, check whether it is still yours to resolve; after a surprising "nothing to
commit", read the log rather than assuming your work was lost.** Nothing was.

### `git merge backlog`: the conflict method, which worked again

**Expect one roughly every third merge.** The method: extract both sides with `sed`, normalise the
tick (`sed 's/^- \[.\]/- [X]/'`), `diff`. **If `main`'s line is strictly longer and differs only
where the `backlog` line ends, it is the backlog line plus a tick and a note — take `main`'s side
without further thought.** Both blocks were exactly that this round.

**The wrinkle again: one side held items the other had never seen.** The resolution is a **plain
union with no editorial change** — bring the unseen items across in their filed position, take the
ticked lines from `main`. **Never reword an item during a merge.**

Then **`node scripts/check-backlog-sections.mjs` with the path passed explicitly**:
`node scripts/check-backlog-sections.mjs ../Animal_Shelter_Backlog/docs/backlog.md`. The script
resolves its default **relative to itself**. **A silent pass on the wrong file is worse than no
check.**

---

## Leftovers — eleven worktrees

**All eleven of this round's streams are at `0` ahead with merged PRs**, which makes every one a
leftover: `approve-photos-schema`, `approve-photos-app`, `deploy-pi-self-update`,
`mobile-sweep-leftovers`, `social-shares-schema`, `fable-acceptance-dry-run`, `role-home-is-tiles`,
`posted-on-social-app`, `meme-library-app`, plus `planner-handover-221` once this merges.

**Most will still be `HELD` by their own sessions. Close the sessions first; ask, do not tear one
down.** `/clean-streams` does the round.

**Before clearing `fable-acceptance-dry-run`, read its report.** It left a **standing admin login on
dev** — `dryrun-admin-20261018@example.test`, full admin with an approved authenticator app, TOTP
secret in that worktree's **gitignored `.env.local`**. **Clearing the worktree destroys the secret
but not the account.** Archive it in Settings → Security, and do not lose track of it.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever.

---

## BEFORE THE NEXT PRODUCTION DEPLOY

**These are the release manager's, but they will be missed if this file does not say them.** Lutan
moved straight to a release after this file was written, so **they are live.**

1. **`0222` and `0223` must be applied to production BEFORE this round's app code deploys.** `0222`
   changes `set_role_cards()`; `0223` adds the social-shares and memes tables that the Photos badge
   and `/memes` read. Deploy the code first and both surfaces error. **`0221` too, if `0.36.1` did
   not already carry it** — check, do not assume.
2. **A Cloudflare cache purge is a runbook step after every Pi deploy** (#708, with
   `scripts/pi/check-assets.mjs`). **It now runs from the deploy machine, not the Pi** (#720).
3. **`deploy-pi.sh` no longer runs the old copy of itself** (#722, re-exec with a `bash -n`
   precondition). **But that has never been exercised on a real Pi.** #722 deliberately left #708's
   item and the cache item **open** for exactly that reason. **The next Pi deploy is the proof** —
   watch for the new script's own log line, and report what you see.
4. **Confirm by hand that every PR in the release has a completed test-plan checklist.** `test-plan`
   is not a required check, so a PR can reach `main` unchecked. **#727's plan is honest but
   partial** — read it rather than counting it.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The placement row with a Foster type and an Unassigned enclosure** — only Lutan can say which
  field is wrong. Carried from last round, still open.
- **The Pi peak-memory measurement** (`/usr/bin/time -v npm run build`, *Maximum resident set
  size*) — decides whether dropping the typecheck from the Pi build is necessary or merely tidy, and
  the item is explicit the measurement comes **first**.
- **Whether the Pi gets a Cloudflare API token** — a security trade-off set out in
  `docs/decisions/2026-10-18-pi-deploy-safety.md`. **Partly overtaken by #720**, which purges from
  the deploy machine instead; **re-read the item before planning anything.**
- **Ticking the new cards onto roles** — **Approve photos** (nobody holds it; until someone does,
  Add resident photos cannot be given out at all), **`social.library`** for the meme library, the
  **Run fundraising appeals** card, and **Add Shelter Photos** onto Volunteer, Management and the
  2IC. All claimed by him in writing. **Four release notes shipped describing features nobody can
  reach until he does this** — worth saying to him plainly, once.
- **The retired `staff` role itself.** `0222` now excludes retired roles from the approver guard,
  but the role still exists and still holds cells through Residents. **Whether to retire it properly
  is a separate decision he has not been asked for.**
- **66 unexplained menu orphans** across the other five roles, from
  `check-menu-coverage.mjs`. The Doctor's are now 0. Needs his answer per role.
- **The five remaining acceptance dry-run role passes** — ordinary streams now, but five of them on
  a window that ended the day at 69%. **His call on timing; advise next week's reset, do not gate.**
- **The sponsorship/appeals threads**: the Director's wording for money raised beyond a target, a
  Thai reader's review, the share-preview image's style.
- **The vet calendar's last mile** — set up on **test only**. Mint `GOOGLE_CALENDAR_REFRESH_TOKEN`
  (the **published Desktop client in `lanna-care-dev`**, never a new project), set
  `GOOGLE_CALENDAR_ID`, put both in the **test and production** values files, deploy; then share the
  calendar with the Director.
- **The Pi relay for the alert-mail test**, the **Pi `x-origin-key` activation**, the spare-clone
  timer, running the app on its own Pi user.
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.**
- **`Review the manual against real use`** — a staff member and a volunteer on a phone for a day.
- **The photo lightbox at 375 px**, **the maintenance board on a phone**, **the map on the
  Director's actual phone**.
- **Three SEO items** and **about nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** the Foster/Unassigned row; the Pi peak-memory measurement; the Cloudflare token
  question; ticking four cards onto roles; whether to retire `staff`; the 66 menu orphans; the
  calendar token and deploy; the Pi relay decision; the Pi deploys; the third Supabase project; F3's
  delete rule; the red harnesses; the Pi failover options paper; the second admin account; the
  product `.org` name; promoting `test-plan` to a required check; the Bills tile; the dry-run
  findings he accepts as work.
- **The Director:** the over-raising wording; signing the roles draft; the community-dogs baseline;
  the Thai receipt wording; the online shop; **the domain transfer, which gates the cutover**; the
  Thai public-page wording; a photo per public page; the "since &lt;year&gt;" year.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs. **The answer to an overrun
   is a smaller brief.**
2. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
3. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
4. **Raising model or effort is NOT the answer to a band being wrong**, and **effort could not have
   saved the dry run** — it would have raised the figure while the row count stayed the same.
5. **The quick-win band stays as written.**
6. **"Three or more sub-features is large" is NOT a rule.**
7. **The card is "Add Shelter Photos", plural.** Settled.
8. **Admin does not count as the photo approver** (2026-10-18). Settled.
9. **Retired roles do not count as approvers** (2026-10-18, `0222`). Settled.
10. **A role's home is its who-does-what tiles** (2026-10-18, #726). Settled.
11. **Appeals may show medical photos is DONE** — shipped 2026-10-17. **Do not plan it.**
12. **The 90-day token mystery is SOLVED** — it was a Supabase token, replaced 2026-10-18 with one
    that does not expire. **Nothing is due to break around 2026-12-21.** The memory note is updated.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, often before the planner has read the checks.** Twice this round he
had merged a whole batch before the planner next looked, and once he merged #729 between two of the
planner's own commands.

**He watches the dials and intervenes.** He set Sonnet, saw sessions bounce to Fable mid-build, and
**moved them back by hand.** **So a model reading may be his correction, a bounce, or his choice —
ask him rather than inferring.**

**He stops a stream that is running away, and he is right to.** He stopped the dry run at ~35%.
**Support that: report figures early and in plain numbers, and never make him ask twice.**

**He delegates judgement calls back.** **Decide, give the two reasons, and record that he delegated
it** so a later session does not read the decision as drift.

**He files items mid-session from looking at the live app**, and he answers findings quickly — two
rulings this round came within minutes of being asked. **Re-read an item fresh when writing its
brief.**

**He sets the order of work and means it.** *"Carry on" after a correction means "continue what you
were doing", not "begin the thing you offered."*

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **Cutting `0.37.0`** — four `unreleased` lines, nine streams merged. **The release manager's
   session, not the planner's**, and **read the four deploy warnings above first.** Lutan moved to
   this immediately after this file.
2. **Choose each role's home tiles in Settings** (item under Admin) — **now properly unblocked by
   #726**, which defined what the panel overrides. Schema half (`role_home_tiles`) then app.
   **Its second clause — removing the left-hand menu for non-Admin logins — pairs with the 66 menu
   orphans and needs his answer first.**
3. **The acceptance dry run, five streams, one role each** — Management, Doctor, Volunteer, Public
   viewer, Signed-out visitor. **Do not repeat Admin. Do not brief it as one stream.** Timing is
   his, given the window.
4. **The three *wrong result* defects the dry run found** — the bill-to-delivery cost loss, the
   mistyped diet inflating the forecast, the past-dated "Scheduled" visit saving as Completed. All
   filed. **These are real bugs with a user impact and they are the strongest quick wins on the
   board.**
5. **The four checklist errors** (F-04 to F-07) — cheap to fix and they protect the real sign-off
   run.
6. **Meme maker, stage 2** — now that stage 1 has shipped.
7. **Videos of residents in the Photos section** — **the storage decision is his and comes first**;
   do not brief a build before it.
8. **Mobile sweep: `/admin/security` at 375 px** was done this round; **the other three wide admin
   tables** were deliberately left (`docs/decisions/2026-10-18-admin-tables-cards-log-only.md`).
   **Check that judgement before re-planning them.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Apply the new turn-cost rule to yourself when you do.** Check your own context first: writing a
460-line file from a session already past halfway costs several times what it costs from a fresh one.
This edition was written at 31%, which was cheap. **If you are large, hand it to a fresh session
with this file's structure as the brief.**

**Count the workstreams honestly.** A stream that produced nothing still counts, or the counter will
flatter the round that most needs examining. **A stream that was stopped part-way counts** — #727
is one of this round's ten. **A one-line follow-up PR on an already-merged branch is NOT a
workstream.**

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-221`; the previous were **#717** (`212`), **#704** (`201`,
truly 203), **#690** (`193`), **#676** (`182`), **#662** (`173`), **#638** (`156`), **#625** (`147`),
**#612** (`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`), **#546**
(`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the
PR was really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
