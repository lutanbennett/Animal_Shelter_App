# Planner handover — written 2026-10-15, after NINE workstreams in one morning

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine workstreams, all planned, built and merged between 02:00 and 04:30 on 2026-10-15** —
three batches of three — plus this handover. It says where the planning loop stands, what is
blocked and on whom, and what not to re-derive. It is **rewritten every nine workstreams** and is
deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the top block, and the measurement table at the bottom
4. this file, for what has changed since
5. **`docs/decisions/2026-10-15-menu-orphans-worked-down.md`** — new, and the most actionable
   document on this list. It is the orphan list that gates the menu removal, sorted into three
   kinds, with **two questions in it that are Lutan's**
6. `docs/seo-audit-2026-10-14.md` and `docs/public-site-review-2026-10-13.md` — about **nine** of
   the review's 25 suggestions remain open, several needing the Director
7. `docs/database-review-2026-10-13.md` — **F1, F2, F4 and W1 shipped; the other twelve findings
   are still unfiled, by design**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

**The shape every brief and every planning message must use:**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.** *"This probably will not cover all four; I would do the metadata
  first"* is right. *"The window is at 97% so I am not starting"* is not.
- **Mid-work exhaustion is different and still correct:** stop with words — what is built, what is
  not, what is next.

**Do not reintroduce a numeric stop threshold into a brief, ever.** Eighteen briefs across
2026-10-14 and 2026-10-15 used the reporting form and none of them gated; keep it that way.

**And the sibling rule:** *"PLEASE DON'T MAKE ARBITRARY DECISIONS ABOUT HOW I USE MY CREDITS
WITHOUT ASKING ME FIRST."* **Model, effort, which allowance gets spent, and whether to start at all
are all his.** The planner's job is the trade-off, a recommendation and the consequence in one line
— **then ask.**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`0d66ecc0`** (#629–#637 all merged, backlog folded in) |
| Dev database | **200 applied, 0 pending.** Latest `0199_pack_sizes.sql` |
| Production database | **not read from this session.** The backup alarm below is still the live gap |
| Next free migration number | **`0200`, unclaimed** |
| Open backlog items | **102**, `main` and `backlog` in step |
| Open PRs | **none** at the time of writing. All nine merged within the morning |
| Last release | **`0.31.0`, cut and recorded 2026-10-15**, before these nine |
| `unreleased` | **SIX lines, and a release was underway as this was written** (the release manager session is live). **Major versus minor is his** |
| Leftover worktrees | **THIRTEEN.** See *Leftovers* — this is the largest backlog of folders the project has carried |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in the order they were set up.** Batch 1: #629 `menu-coverage-orphans`, #630
`public-site-speed-follow-ups`, #631 `small-ui-fixes-fold`. Batch 2: #632 `map-rooms-schema`, #633
`vet-visit-calendar-link`, #634 `donate-page-order`. Batch 3: #635 `pack-sizes-schema`, #636
`map-rooms-build`, #637 `public-site-inner-pages`.

### Nine streams in about two and a half hours

**2026-10-14 was nine streams in a day; this was nine in a morning**, and the difference was not
the model or the briefs — it was that **Lutan merged each PR himself from the PR bar as soon as CI
went green**, so the merge train never queued. The planner's three `/plan-day` runs were a resume
each time and took minutes.

**The allowance was never the constraint.** The day started at all-models 11% and ended at 13%:
**nine streams cost about 2% of a weekly window.** That is a materially lower figure than
2026-10-14's ~7%, and the reason is in the measurements below — every one of these nine was a
small or medium stream that arrived diagnosed.

---

## Token estimates — sixty-six measured, and NINE of them in one morning

### The nine

| slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|
| `menu-coverage-orphans` | sonnet-5-5 / low | 170–260k | **150,482** | 12% under |
| `public-site-speed-follow-ups` | sonnet-5-5 / low | 170–250k | **125,497** | 26% under |
| `small-ui-fixes-fold` | sonnet-5-5 / low | 120–180k | **134,259** | inside |
| `map-rooms-schema` | sonnet-5-5 / low | 140–165k | **122,472** | 13% under |
| `vet-visit-calendar-link` | sonnet-5-5 / low | 130–190k | **137,963** | inside |
| `donate-page-order` | sonnet-5-5 / low | 110–170k | **132,904** | inside |
| `pack-sizes-schema` | sonnet-5-5 / low | 200–280k | **133,323** | **33% under** |
| `map-rooms-build` | sonnet-5-5 / low | 170–250k | **203,502** | inside |
| `public-site-inner-pages` | sonnet-5-5 / low | 230–320k | **128,959** | **44% under** |

**All nine ran `claude-sonnet-5-5` / `low`, the recommended dials, confirmed by `get_session`
rather than assumed. All nine came in at or under band. The streak is 63.**

### Three band corrections earned on 2026-10-15

**1. The single-file schema floor is too high. `map-rooms-schema` came in at 122,472** — below the
~140k floor, and the cheapest schema PR measured. Its item named the table, every column, the
unique pair, the policies and the back-fill. **One more measurement agreeing and the floor should
move to ~120k.**

**2. A SCHEMA PR WITH DECISIONS IN IT IS STILL A SCHEMA PR.** `pack-sizes-schema` was banded
200–280k because the brief asked it to *settle* whether a typed price or the delivery's actual cost
wins — a genuine design question — and it came in at **133,323, a third under**. **Deciding
something is cheap; building the instrument to measure something is not.** This is the same
correction `silent-empty-reads` earned on 2026-10-11 from the other direction, and the axis holds:
**"must it build the instrument?"** is the only question that widens a band.

**3. APPLYING AN EXISTING DESIGN ACROSS MANY PAGES IS NOT A LARGE STREAM.**
`public-site-inner-pages` touched ten-plus routes in two languages at two widths for **128,959**
against 230–320k — **44% under, the largest miss of the day.** The home page already defined the
type scale, so there was nothing to decide. **Band "apply X to N pages" as a medium at most, and
quote its bottom**; reserve the large band for pages that need a design that does not exist yet.

### The floor is about 77k and is unchanged

System tools ~38.8–42.6k, MCP ~17k, Memory 11,120, Skills 6,546, System prompt 4,973. **Memory has
stopped growing** — it read 11,120 in every one of the nine. Stop re-deriving this.

### THE CAPTURE RULE HELD AGAIN — nine for nine

Every actual was read in the same turn the planner noticed the merge. **Capture in the same turn,
and if the chat is about to end with a batch in flight, say so and say the figures will be lost.**

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What earned its place on 2026-10-15:

- **Name the one thing that can hurt someone, in the stream's own terms.** The four that worked:
  a `Delete room` that now wipes a room off every plan it sits on and must name each plan in the
  confirmation; a Google Calendar link that puts the Director at the vet on the wrong day if the
  time zone slips (**"test a visit at 03:00 Bangkok"** — that is where a UTC slip shows); a dropped
  unique index that lets a per-kilo cost be computed from the wrong bag size and feed a forecast
  she trusts; a reordered Donate page that silently loses a bank card.
- **For a schema half, say three things explicitly**: the feature is **not usable** when this
  merges, the stream must **say so in its last message**, and it must **not tick the item**. All
  three schema streams did exactly that, and the app halves then ticked. **This closes the
  2026-10-13 miss for good — do not drop the three sentences.**
- **Point a stream at the PR that just changed its files.** `public-site-inner-pages` was told to
  read #634 before touching `SitePageView` and to keep the Donate reorder working. It did. Two
  streams in adjacent batches on the same component is the plan working, **but only if the second
  one is told.**
- **Tell a stream what NOT to drop.** `map-rooms-build` was told not to drop the superseded
  `map_rooms.map_id`/`.shape` columns, because the batch's migration slot was taken — and to file
  the drop instead. It filed it.
- **A folded stream is one quick win, not three.** `small-ui-fixes-fold` carried a Tailwind class
  fix, a colour retune with a check script and two form faults for **134,259**, inside the single
  quick-win band. **Keep folding small items; it is the cheapest thing the planner does.**

---

## Traps in the tooling

Everything in the last handover's list still holds (`grep -c` exit codes; **no long prose in
`node -e` or heredocs — use the Write tool and splice with `cat`**; survey long backlog items with
the `awk` title extractor; a `Write` to a file that exists in a fresh worktree is refused until it
has been read, so write to the scratchpad and `cp` over; **`git show <rev>:<path>` LIES SILENTLY ON
DOTTED PATHS in this shell — use `git grep`, `git ls-tree`, or prefix `MSYS_NO_PATHCONV=1`**).

### `git merge backlog` CONFLICTS EVERY TIME NOW — assume it, do not be surprised by it

**Three conflicts in two days, all in `docs/backlog.md`, all resolved as a UNION.** A
backlog-manager session rewords items while streams tick the same items from their PRs.

2026-10-15's was the clearest example yet: **`main` had the vet-calendar item ticked by #633, while
`backlog` still held the open copy *and* a new follow-up item for the `.ics` feed (way b).** The
resolution kept **main's tick** and **backlog's new item** and dropped the stale open copy. One
conflict, four lines, about two minutes.

**The method, which beats eyeballing an 8,000-character line:**

1. `grep -n '^<<<<<<<' docs/backlog.md` for the count and the line numbers.
2. Print each side with `sed -n '<n>p' | cut -c1-400` — the first 400 characters are nearly always
   enough to see which side is the tick and which is the reword.
3. Rebuild by concatenation: `sed -n '1,Np'`, the lines you are keeping, then `sed -n 'M,$p'`.
4. Check `grep -c '^<<<<<<<'` is 0 and the open-item count is sane before committing.

**Read both sides for what they ASSERT before choosing. Neither side is usually wrong.**

### Other mechanics

- **`worktree.mjs new` exceeds the 7-minute tool timeout** on `npm ci` and gets backgrounded. The
  branch, folder, `.port` and `.env.local` exist well before `npm ci` finishes, **so write the
  brief immediately** and check `node_modules/next` later.
- **Three worktrees in one backgrounded loop works**, and took about ten minutes for three. Ports
  came out 3002/3003/3005, then 3006/3007/3008, then 3009/3012/3013 — the script skips ports held
  by leftovers, so **do not assume they are contiguous.**
- **Verify every brief after splicing**: `grep -c` the finish-line block, the two-space trap, and
  one distinctive phrase from the task. A phrase that wraps across two lines reads as 0 from a
  single-line `grep` — check with `grep -n <one word>` before concluding the splice failed.

---

## Leftovers — THIRTEEN, and `/clean-streams` is overdue

**Every build worktree from 2026-10-14's nine was already outstanding when this day began, and this
day added more.** At the time of writing:

`cut-release-0-31-0` · `record-0-31-0` · `upload-blood-work` · `public-site-visitor-fold` ·
`menu-coverage-orphans` · `public-site-speed-follow-ups` · `small-ui-fixes-fold` ·
`map-rooms-schema` · `vet-visit-calendar-link` · `donate-page-order` · `pack-sizes-schema` ·
`map-rooms-build` · `public-site-inner-pages`

**Every one is merged and `ahead 0`, so none of it is unsubmitted work.** Several read `HELD` by
their own idle sessions, and `done` refuses a folder a process has open — **so the sessions must be
closed first. Ask; do not tear down a `HELD` worktree.** `/clean-streams` does the round.

**Plus `planner-handover-156`**, this file's own stream, clearable once its PR merges.

**Re-read the `ahead` column against the open PRs rather than trusting this paragraph:** ahead with
no PR is unsubmitted work and `done`ing it destroys a day's build; ahead with a merged PR is a
leftover, because a squash-merged branch stays ahead for ever.

---

## The red backup alarm — STILL OUTSTANDING, and still one secret

**Production's backup alarm is still blind**, and nothing on 2026-10-15 touched it.

**The fix is one secret and it is Lutan's**, being a production Worker change (his instruction,
2026-10-02): set **`BACKUP_DRIVE_FOLDER_ID`** alone on the production Worker from the id in
`.env.deploy.production`, then confirm `fail_runs` is 0. **Give him that command at the moment he
runs it, never earlier.**

**Three things not to re-derive:**

1. **The live error is a missing secret on the Worker**, which runs the 15-minute alert cron — not
   the "no backup found" the original item recorded. The Pi has had the value since 2026-10-12.
2. **The green System status tile is NOT proof the alarm works.** The tile is drawn by the Pi,
   which has the secret; the alarm is the Worker, which does not. **Two readers, two answers.**
3. **DO NOT fix it with `deploy.mjs --env production --secrets`.** #616 guards that path but does
   **not** set the secret.

---

## The menu removal: the gate is now a LIST, and two of its questions are Lutan's

**#629 took the orphan count from 80 to 68** and wrote
`docs/decisions/2026-10-15-menu-orphans-worked-down.md`, which sorts every remaining orphan into
three kinds. **Read it before planning any more of this feature.** In short:

- **Twelve were fixed**: Manual and Release notes now sit in the account menu, declared with the
  file and string that prove it. No permission changed, no card added.
- **Most of the remaining 68 are a DATA change, not code** — roles that hold the cells but have not
  been given the matching card. **Production's cards are set by the Director in the app**, so the
  stream deliberately did not write a migration to seed them. **That is a decision to confirm, not
  a gap to fill on a stream's initiative.**
- **Two questions are his, and nothing moves until he answers:** (1) `/management` and
  `/operations` are landings that nothing links to, and a tile needs a card — **a twenty-second
  card, a link from somewhere, or accept them**; (2) **My tasks (`/my`)** has no tile on a card
  home, same shape of answer.
- **One real permissions finding, unchanged by the stream:** **the Doctor's home is broken** —
  sign-in sends it to `/appointments`, which the Doctor's cells do not open. Needs a cell or a
  different `home_path`. **This is a live defect on dev, not bookkeeping.**

**The card set is still TWENTY-ONE** (`src/lib/permissions/cards.ts`). **Never add one on a
stream's initiative.** And **every login keeps `NavPane`** until the list is clean — Lutan's gate,
in his words: *"we won't remove the navigation until we are satisfied that everything is
covered."*

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The production cutover** — **no firm date.** Blocked on the Director transferring
  `lannacareforanimals.org` to Cloudflare from sav.com. **Not plannable until the zone reads
  Active.**
- **`from-zero-rebuild`** — **displaced four times**, on his decision each time. Needs a third free
  Supabase project (the free tier allows two). **Not a paid plan.** **About two thirds needs
  nothing from anyone** — the drift script and the migration restating dev's two hand-edited
  columns — so brief that half first when it runs.
- **`Review the manual against real use`** — **a staff member and a volunteer following it on a
  phone for a day.** It reads exactly like a Fable review item and is not one; the planner made
  that mistake on 2026-10-14. The *Thai edition of the manual* sits behind it.
- **The two cards questions and the Doctor's `home_path`** — see the section above.
- **Three items from the SEO audit:** a **Google Business Profile**, **Search Console verification**
  for `lannacareforanimals.org`, and **Thai wording for four public page titles**.
- **About nine of the public-site review's items need the Director or Lutan** — her phone number
  and LINE id, the Thai tagline and visiting hours, what adoption costs, publishing adoptable
  residents a few a week, the trust-block facts, the "since &lt;year&gt;" year.
- **Five red check harnesses** — all five need a per-role ruling from Lutan.
- **F3** (one delete rule for 54 `auth.users` links) — a decision before a stream.
- **The photo lightbox at 375 px**; **the maintenance board on a phone**; **the map on the
  Director's actual phone**; **drag and drop on a real trackpad**; **somebody actually covering a
  role** — all need a person at a device.
- **The Bills tile on the Director's phone home**; **whether purchasing keeps reading stock
  receipts through `stock.delivery`**; **promoting `test-plan` to a required check** — all his.
- **The acceptance checklist's pre-run agreements**, which also block the one remaining Fable item.

---

## Blocked, and on whom

- **Lutan:** **the one-secret backup alarm fix**; **the release now underway — major versus minor**;
  **the two cards questions and the Doctor's broken home**; the two auth decisions; the third
  Supabase project; **the twelve unfiled database review findings**; F3's delete rule; the five red
  harnesses; the Pi failover options paper; the second admin account (Anchalee); the mobile sweep
  (**declined five times — offer only as a swap**); the product `.org` name; **the thirteen
  leftover worktrees, which need their sessions closed**.
- **The Director:** signing the roles draft and applying it to production; the community-dogs
  baseline number; the Thai receipt wording; the online merchandise shop; **the domain transfer,
  which gates the cutover**; the Thai public-page wording; a photo per public page.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **Fable is not a separate bucket**, and Fable's cost tracks **effort**, not the model family.
   **Nothing unblocked suited Fable on 2026-10-15** and the bucket sat at 9% all day — that is not
   a reason to invent Fable work.
3. **The card set is TWENTY-ONE.** Never add one on a stream's initiative.
4. **The menu removal goes LAST**, gated on the orphan list.
5. **All 25 public-site review suggestions were filed**, on his instruction; about nine remain.
6. **F1, F2, F4 and W1 are SHIPPED.** The other twelve are still unfiled, by design.
7. **The backup's own Drive identity (S4) shipped and was REVERTED** (#604). Do not re-attempt it.
8. **Backups prune by AGE, not count. Backup key custody is DONE** (encrypted USB and Keychain).
9. **The test-site visitor tile is NOT wanted** — grey *Not set up* is the intended permanent state.
10. **Raising model or effort is NOT the answer to a handoff miss.** The fix is the brief, and three
    schema halves on 2026-10-15 proved it again.
11. **The quick-win band stays as written.** Asked four times.
12. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`. If it is
    the only red on your PR, there is nothing to wait for.
13. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
    versus minor and the production Worker deploy stay his.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs, which Claude
merges itself the moment CI is green.** Not technical in these areas: **plain English, no jargon,
options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. **Never give him a command before the moment he should run it** (he ran a production
deploy three steps early on 2026-10-10).

**He merges PRs himself, fast, from the PR bar, often before the planner has read the checks.** On
2026-10-15 all nine were merged that way, which is why nine streams fitted in a morning. **So on a
resume, read `gh pr list` rather than assuming a batch is still in flight.**

**He takes the planner's recommendation when it is explicit and first.** On 2026-10-15 he confirmed
all three of batch 1 as recommended with no swaps, and never touched a dial — the first day on
which every stream ran exactly what was recommended.

**He files items himself, mid-day, from looking at the live app.** Re-read an item fresh when
writing its brief: it may have grown since it was planned.

**He reads the briefs' consequences carefully and will catch a planner error in them.** A brief is
a thing he audits, not just something the streams read.

**He holds a release for a change that breaks quietly**, and names it separately from the count.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it. **This
one was asked for directly**, in the chat that had planned all three batches — the rule working, for
the second handover running.

**Count the workstreams honestly, and count other sessions' too.** This round's nine are three
batches of three; the handover stream itself makes ten but is counted in the next round, as its
predecessors were. **Counting PRs instead of streams is how the counter once read 13 and then 16.**
**And do not double-count a batch**: streams are added when the batch is *set up*, so a postponed
stream is already on the board.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-156`; the previous were **#625** (`147`), **#612**
(`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`),
**#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was
really needed; **it is.** It is a `docs/` file in the repo, so the only alternatives are committing
to `main` directly or routing it through the `backlog` branch, and the second is the 2026-10-07
failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
