# Planner handover — written 2026-10-15, after NINE workstreams in a single day

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine workstreams, all planned, built and merged on 2026-10-14** — three batches of three,
plus this handover. It says where the planning loop stands, what is blocked and on whom, and what not
to re-derive. It is **rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top block.** It was rewritten and pruned on 2026-10-14 from 853 lines to
   about 340; the three superseded "state at run N" blocks are gone. **Keep it that way**
4. this file, for what has changed since
5. **`docs/seo-audit-2026-10-14.md`** — new. The Fable SEO audit, its before/after Lighthouse
   figures, and **three steps that are Lutan's or the Director's, not code**
6. **`docs/public-site-review-2026-10-13.md`** — the Fable review of the public site. Of its 25
   filed suggestions, **about ten remain open**; the rest shipped on 13–14 October
7. **`docs/database-review-2026-10-13.md`** — still the best single description of the database.
   **F1, F2, F4 and W1 are now shipped; the other twelve findings are still unfiled, by design**

---

## THE BIGGEST THING ON THIS PAGE: NEVER BLOCK HIS PAID USAGE

**Lutan, 2026-10-14: *"I am happy for you to warn me and advise but not block like this, it's
actually unethical for you to block the usage I paid for."*** Also in memory as
`never-block-paid-usage`. **This is not a preference to weigh. Treat it as a hard rule.**

**The shape every brief must use:**

- **Report the figures in the first message** and forecast in one line what will get done.
- **Then work. Never refuse to start, never ask permission to begin**, however little is left.
- **A forecast is not a refusal.** *"This probably will not cover all four; I would do the metadata
  first"* is right. *"The window is at 97% so I am not starting"* is not.
- **Mid-work exhaustion is different and still correct:** stop with words — what is built, what is
  not, what is next.

**Do not reintroduce a numeric stop threshold into a brief, ever.** All nine of 2026-10-14's briefs
used the reporting form and none of them gated; keep it that way.

**And the sibling rule:** *"PLEASE DON'T MAKE ARBITRARY DECISIONS ABOUT HOW I USE MY CREDITS WITHOUT
ASKING ME FIRST."* **Model, effort, which allowance gets spent, and whether to start at all are all
his.** The planner's job is the trade-off, a recommendation and the consequence in one line — **then
ask.**

---

## READ THE DIALS, NEVER THE RECOMMENDATION — it happened AGAIN on 2026-10-14

**This is now four times in four days, and `get_session` is the only answer.**

**The newest:** `seo-audit-fable` was recommended `claude-fable-5-1` / **`xhigh`** and banded
500–650k on that basis. **Lutan ran it on `claude-fable-5-1` / `high`.** It came in at **414,777**.
**That is NOT "under band"** — the band was written for a different effort, and reporting it as a
32% saving would have corrupted the table and understated every future `xhigh` review.

Earlier instances: `public-site-trust-copy` was briefed as the Sonnet half of a controlled comparison
and run on Fable (so **the Sonnet-versus-Fable comparison still has not happened** — do not report
one); `restore-rehearsal` ran opus/medium against a sonnet band.

**Always call `get_session` and read `model` and `effort` before comparing any figure to a band.**
Write what it ran on into `.plan-day.md`, never what you recommended.

---

## FABLE, as the evidence now stands

**Fable is NOT a separate bucket.** The *Weekly · Fable* line is a **sub-limit inside** the weekly
window. It can cap Fable work early; **it never grants extra capacity.** In memory as
`fable-counts-against-weekly`. **Never offer Fable spend as a way round a spent weekly window.**

**Fable is not inherently expensive — effort is the dial that moves the figure.** Measured:

| shape | model / effort | actual |
|---|---|---|
| Build fold (four S items) | fable-5-1 / **low** | **219,364** · **187,886** — inside a band set from SONNET quick wins |
| Review that reads files | fable-5-1 / xhigh | **332,421** |
| Whole-system read | fable-5-1 / xhigh | **448,294** |
| **Audit that drives a browser AND then fixes what it finds** | fable-5-1 / **high** | **414,777** — new, 2026-10-14 |
| Review that drives a browser | fable-5-1 / xhigh | **545,745** |

**The new measurement is the most useful one here:** a stream that drove a browser across every
public page in two languages **and then shipped the code fixes** cost **less** than a review that only
drove the browser — because it ran at `high` rather than `xhigh`. **Effort dominates shape.** Its
messages alone were 331,224, and it moved the Fable sub-limit 0% → 9% and all-models 5% → 10%.

**Still true:** compare like effort with like effort, and band a Fable review by **what it must
drive**, not by the word "review".

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`b2207cea`** (#616, #617, #618, #619, #620, #621, #622, #623, #624 all merged, backlog folded in) |
| Dev database | **198 applied, 0 pending.** Latest `0197_role_row_live_search_path.sql` |
| Production database | **not read from this session.** The backup alarm below is still the live gap |
| Next free migration number | **`0198`, unclaimed** |
| Open backlog items | **106**, `main` and `backlog` in step |
| Open PRs | **none.** All nine of 2026-10-14 merged the same day |
| Last release | **`0.30.0`, cut 2026-10-14** (the cards, the public-site work, bills photos, date order, vet visits) |
| `unreleased` | **FIVE lines. A release is the obvious next step** — major versus minor is his |
| Leftover worktrees | **NINE, every one `HELD` by its own idle session.** See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in the order they were set up.** Batch 1: #617 `security-schema-fold`, #616
`deploy-secrets-guard`, #618 `cards-menu-coverage`. Batch 2: #621 `public-site-visitor-fold`, #619
`cards-page-refinements`, #620 `multi-role-schema`. Batch 3: #623 `multi-role-build`, #624
`seo-audit-fable`, #622 `facility-map-zone-entry`.

### Nine streams in one day was possible because the ALLOWANCE stopped being the constraint

**Three days running, the window had been the binding constraint rather than the backlog.** It reset
overnight on 14 October and the day started at **all-models 3%, Fable 0%**. It ended at **10% and
9%** after nine streams plus a planning chat. **So a full nine-stream day costs roughly 7% of a
weekly window** — worth knowing when he asks what a day costs.

**Do not read that as a licence to plan nine every day.** The cap on live worktrees is still two or
three, and the reason is merging, not tokens.

---

## Token estimates — fifty-seven measured, and NINE of them on one day

### The nine

| slug | model / effort **run** | estimated | actual | |
|---|---|---|---|---|
| `security-schema-fold` | sonnet-5-5 / low | ~230–285k | **136,772** | **41% under** |
| `deploy-secrets-guard` | sonnet-5-5 / low | ~110–170k | **125,531** | inside |
| `cards-menu-coverage` | sonnet-5-5 / low | ~250–350k | **174,777** | **30% under** |
| `public-site-visitor-fold` | sonnet-5-5 / low | ~170–290k | **170,542** | inside, at the floor |
| `cards-page-refinements` | sonnet-5-5 / low | ~230–320k | **143,949** | **37% under** |
| `multi-role-schema` | sonnet-5-5 / low | ~230–285k | **192,568** | **16% under** |
| `multi-role-build` | sonnet-5-5 / low | ~290–420k | **258,699** | **11% under** |
| `facility-map-zone-entry` | sonnet-5-5 / low | ~170–290k | **134,343** | **21% under** |
| `seo-audit-fable` | **fable-5-1 / `high`** *(xhigh recommended)* | ~500–650k | **414,777** | **dials differ — NOT comparable** |

**Eight of the nine ran `claude-sonnet-5-5` / `low` on the recommended dials. All eight came in at or
under band. The streak is 54.**

### THE FINDING OF THE DAY: the bands read high, so QUOTE THE BOTTOM HALF

**Eight measurements, one day, one model, one effort, all at or below the band floor.** The spread
against each band's bottom: −41%, inside, −30%, 0%, −37%, −16%, −11%, −21%.

**The cause is not the model.** It is that every one of those nine items **arrived diagnosed**, and
every brief said what the stream must not do:

- `cards-page-refinements` **built a two-column drag-and-drop board for 143,949** against 230–320k,
  because its item named the file, the line, the cause of the defect and the component to copy.
- `security-schema-fold` carried **three** database findings in one migration for **136,772** —
  inside the *single-file* schema band — because F2, F4 and W1 each named their files, policies and
  proof scripts.
- `cards-menu-coverage` **wrote a new check script** and still came in 30% under, because the route
  registry and the cards already existed for it to read.

**So: quote the bottom half of a band when the item is well specified and the brief is prescriptive.
Quote the middle only when the stream must find something out.** This is the single most useful
correction in the table, and it is backed by eight same-day measurements rather than one.

**The caveat, stated honestly: all eight share one planner and one style of brief.** That is
evidence about *briefs* at least as much as about the model, and it cannot separate the two.

### Three band corrections earned on 2026-10-14

**1. A schema PR carrying SEVERAL precisely-specified small findings behaves like a SINGLE-FILE
schema PR (~140–155k), not the 230–285k "with code" band.** Count the findings, then ask how much of
each is already written down.

**2. Building an instrument is NOT automatically a widened band — the later-stream discount can
outweigh it.** `cards-menu-coverage` wrote the script over a data model that already existed.
`who-does-what-view` (+50%) had to *establish* the model and build the instrument; **that** is the
expensive shape, not the script.

**3. A LATER stream in a sequenced feature is much cheaper than the first**, confirmed twice more.
`multi-role-build` (the app half) came in 11% under a band already lowered for exactly this reason,
and `cards-home-screen` dropped 39% from `cards-who-does-what`. **The first stream pays for the
decisions; the ones after it pay for typing.**

### A SCHEMA ITEM CAN BE TWO FILES, AND THE BAND MUST ALLOW FOR IT

**`multi-role-schema` shipped `0196` and `0197`.** A function change could not share the runner's
per-file transaction with the table change — the same mechanism as the enum caveat. **Do not read
"one migration" in an item as "one file"**, and do not treat a second file as scope creep.

### The floor is about 77k, and it is settled

System tools ~38.8k, MCP ~17.5k, Memory ~11k, Skills 6,383, System prompt ~5k. **Memory is the only
part still growing.** Stop re-deriving it.

### THE CAPTURE RULE HELD ALL DAY — nine for nine

Every one of the nine actuals was read **in the same turn the planner noticed the merge**, while the
chat was awake. Contrast batch 3 of 13 October, whose three figures are `unmeasured` for ever because
the chat had slept through the merge. **Capture in the same turn, and if this chat is about to end
with a batch in flight, say so and say the figures will be lost.**

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What earned its place on 2026-10-14:

- **READ THE BODY OF EVERY ITEM BEFORE GIVING IT A STREAM.** `manual-review-fable` was planned as a
  Fable review and dropped at set-up time: the item asks for **a staff member and a volunteer to
  follow the manual on a phone for a day.** It is people-work. **Its title reads exactly like the
  other review items**, and the planner banded it off the title. **A short item is MORE likely to
  hide "have a person do it" than a long one.**
- **Write the boundary at the TOP, before the task**, whenever an item describes more than this
  stream. The cards item is ~16,000 characters covering four streams, three of them shipped; both
  cards briefs opened with *what you are not building* and neither overran.
- **Name the one thing that can hurt someone.** Worked examples from the day: a policy change that
  could blank the public site or leak `clinic_visit_estimate`; a 404 page that could expose an animal
  somebody deliberately hid; a drag-and-drop that could grant a card by a path with no audit row; a
  union of roles computed twice and disagreeing with the database.
- **Tell a stream which lines in its own item are WRONG.** The SEO item offered "Suphan Buri dog
  rescue" as a search term when the site says **Mae Wang, Chiang Mai**; the brief told the stream to
  take the location from the site's settings, never from the item. **An item is a draft, not
  scripture.**
- **Say what the stream must NOT fix**, by name: the other twelve database findings; the other
  fifteen public-site items; the known dev-only colour pairs; `robots.ts`'s locked branch.
- **Commit the irreplaceable half first.** The SEO brief ordered: audit, **commit and push the
  report**, then fix. The report is what cannot be reconstructed.
- **For a schema-first item split across two batches, say in the brief that the feature is NOT usable
  yet**, that the stream must say so in its last message, and that it must **not tick the item**.
  That closes the 2026-10-13 miss where a schema PR merged and the visible half went unbuilt.

---

## Traps in the tooling

Everything in the last handover's list still holds (`grep -c` exit codes; **no long prose in
`node -e` or heredocs — use the Write tool and splice with `awk`, or `cat` the pieces together**; a
long backlog item is one line, so survey with the `awk` title extractor; `awk -v nf="$WINDOWS_PATH"`
breaks silently on `\U`/`\T` — use the POSIX path; a `Write` to a file that exists in a fresh worktree
is refused until it has been read, so write to the scratchpad and `cp` over; **`git show <rev>:<path>`
LIES SILENTLY ON DOTTED PATHS in this shell — use `git grep`, `git ls-tree`, or prefix
`MSYS_NO_PATHCONV=1`**). Added this round:

### `git merge backlog` NOW CONFLICTS ROUTINELY — twice in one day

**A backlog-manager session is editing `docs/backlog.md` while streams tick the same items from
their PRs.** Both conflicts on 2026-10-14 were in that one file, and `CLAUDE.md` anticipates exactly
this ("a PR ticked an item while `backlog` reworded it"). **Expect one at every sync, and budget a
few minutes for it.**

**The method, which is worth reusing rather than eyeballing an 8,000- or 17,000-character line:**

1. `MSYS_NO_PATHCONV=1 git show :1:docs/backlog.md > base.md` — stage 1 is the merge base.
2. Extract each side's version of the conflicted item into its own file.
3. `git diff --no-index --word-diff=plain base.txt side.txt` and grep for `{+…+}` / `[-…-]` to see
   **what each side actually added.**
4. Rebuild the file by concatenation (`sed -n '1,Np'`, then the resolved lines, then the rest) and
   check `grep -c '^<<<<<<<'` is 0 and the open-item count is sane.

**Both resolutions were the UNION, not a side.** First conflict: the sweep note and a stream's gate
note had been appended to the same item from opposite ends — both were true. Second: `main` had the
SEO item **ticked** while `backlog` still had it open and had filed three follow-ups from the same
audit; the resolution kept `main`'s tick and `backlog`'s three new items and dropped the stale open
copy. **Read both sides for what they assert before choosing.**

### Other mechanics

- **`worktree.mjs new` routinely exceeds the 7-minute tool timeout** on `npm ci` and gets moved to
  the background. **The branch, folder, `.port` and `.env.local` all exist well before `npm ci`
  finishes**, so write the brief immediately and check `node_modules/next` later. Do not assume
  failure, and do not chain the brief assembly into the same backgrounded command — you lose the
  verification output.
- **Verify every splice.** `grep -c` a distinctive phrase from the spliced item, not just the
  surrounding prose.
- **A `post-commit` push can fail transiently** and says so plainly. It is not a rejected history:
  just `git push` again.

---

## Leftovers — NINE, and `/clean-streams` is the next thing to run

**Every build worktree from 2026-10-14 is merged and clearable**, and **every one reads `HELD` by its
own session**, which `list_sessions` shows as **not running** — open but idle:

`security-schema-fold` (#617) · `deploy-secrets-guard` (#616) · `cards-menu-coverage` (#618) ·
`public-site-visitor-fold` (#621) · `cards-page-refinements` (#619) · `multi-role-schema` (#620) ·
`multi-role-build` (#623) · `seo-audit-fable` (#624) · `facility-map-zone-entry` (#622)

**`done` refuses a folder a process has open, so the sessions must be closed first.** Ask; do not
tear down a `HELD` worktree. `/clean-streams` does the whole round — checks each PR is merged, asks,
then `done`s the confirmed ones.

**Plus `planner-handover-147`**, this file's own stream, clearable once its PR is merged and this
session closes.

**Nothing is ahead-with-no-PR**, so nothing here is unsubmitted work. **Re-read the `ahead` column
against the open PRs rather than trusting this paragraph:** ahead with no PR is unsubmitted work and
`done`ing it destroys a day's build; ahead with a merged PR is a leftover, because a squash-merged
branch stays ahead for ever.

---

## The red backup alarm — STILL OUTSTANDING, and still one secret

**Production's backup alarm is still blind.** `#610` shipped the legibility half on 2026-10-14 — a
missing folder id no longer reads as "no backup found" — but **the production fix has not been
done.**

**The fix is one secret and it is Lutan's**, being a production Worker change (his instruction,
2026-10-02): set **`BACKUP_DRIVE_FOLDER_ID`** alone on the production Worker from the id in
`.env.deploy.production`, then confirm `fail_runs` is 0. **Give him that command at the moment he
runs it, never earlier.**

**Three things not to re-derive:**

1. **The live error is a missing secret on the Worker**, which runs the 15-minute alert cron — not
   the "no backup found" the original item recorded. The Pi has had the value since 2026-10-12.
2. **The green System status tile is NOT proof the alarm works.** The tile is drawn by the Pi, which
   has the secret; the alarm is the Worker, which does not. **Two readers, two answers** — that
   confusion let the fault run for eleven days.
3. **DO NOT fix it with `deploy.mjs --env production --secrets`.** That hazard is now **guarded**:
   #616 makes `deploy.mjs` refuse a production `--secrets` push when a required secret resolves only
   from `.env.local`, and prints the resolved source of everything it pushes. **The guard does not
   set the secret** — it only stops the dangerous shortcut.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The production cutover** — **no firm date.** Blocked on the Director transferring
  `lannacareforanimals.org` to Cloudflare from sav.com. **Not plannable until the zone reads Active.**
- **`from-zero-rebuild`** — **displaced four times now**, on his decision each time. Needs a third
  free Supabase project (the free tier allows two). **Not a paid plan.** **About two thirds needs
  nothing from anyone** — the drift script and the migration restating dev's two hand-edited columns
  — so brief that half first when it runs.
- **`Review the manual against real use`** — **a staff member and a volunteer following it on a phone
  for a day.** NEW to this list, because the planner mistook it for a Fable review on 2026-10-14. The
  *Thai edition of the manual* sits behind it.
- **Three new items from the SEO audit:** **claim a Google Business Profile** (the Director's or
  Lutan's), **Search Console verification for `lannacareforanimals.org`**, and **Thai wording for
  four public page titles and bodies** plus a "where we are" sentence. All three are named in
  `docs/seo-audit-2026-10-14.md`.
- **Roughly ten of the public-site review's items need the Director or Lutan, not code** — her phone
  number and LINE id, the Thai tagline and visiting hours, what adoption costs, publishing adoptable
  residents a few a week.
- **Five red check harnesses** — all five need a per-role ruling from Lutan.
- **F3** (one delete rule for 54 `auth.users` links) — a decision before a stream.
- **The photo lightbox at 375 px**; **the maintenance board on a phone** (the Director left it blank
  on the 2026-10-08 sheet); **the map on the Director's actual phone**; **drag and drop on a real
  trackpad**; **somebody actually covering a role** — all need a person at a device.
- **The Bills tile on the Director's phone home**; **whether purchasing keeps reading stock receipts
  through `stock.delivery`**; **promoting `test-plan` to a required check** — all his.
- **The acceptance checklist's pre-run agreements**, which also block the one remaining Fable item.

---

## Blocked, and on whom

- **Lutan:** **the one-secret backup alarm fix**; **whether to cut a release now `unreleased` has
  five lines, and whether it is major or minor**; the two auth decisions; the third Supabase project;
  **the twelve unfiled database review findings**; F3's delete rule; the five red harnesses; the Pi
  failover options paper; the second admin account (Anchalee); the mobile sweep (**declined five
  times — offer only as a swap**); the product `.org` name; **whether to re-cut the cards/tiles
  boundary**; **the nine leftover worktrees, which need their sessions closed**.
- **The Director:** signing the roles draft; the community-dogs baseline number; the Thai receipt
  wording; the online merchandise shop; **the domain transfer, which gates the cutover**; the Thai
  public-page wording the SEO audit asked for.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### The menu removal is GATED, and the gate is now measurable

**#618 built the instrument** (`scripts/check-menu-coverage.mjs`, reachability declared in
`scripts/lib/menu-coverage-declared.mjs`,
`docs/decisions/2026-10-14-menu-coverage-is-declared.md`). **Its first dev run found 82 unexplained
orphans across six roles** — My tasks, Manual, Release notes and the operations landing for most,
**Management alone 38** — and the dev doctor login lands on `/appointments`, which its own cells do
not open.

**So part (3) of the home-tiles item is NOT briefable yet**, and that is the gate working as Lutan
specified it: *"we won't remove the navigation until we are satisfied that everything is covered."*
**Working the orphan list down is the next piece of that feature**, and it is re-runnable, so it can
be done in pieces. **Until it is clean, every login keeps `NavPane`.**

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **Fable is not a separate bucket**, and Fable's cost tracks **effort**, not the model family.
3. **The card set is TWENTY-ONE**, in `src/lib/permissions/cards.ts`. **Never add one on a stream's
   initiative.**
4. **Tap a card for its access; the 56-row grid does NOT sit under the cards.** Its own read-only
   Details view since #609.
5. **The menu removal goes LAST**, gated on the orphan list above.
6. **All 25 public-site review suggestions were filed**, on his instruction; about ten remain.
7. **F1, F2, F4 and W1 are SHIPPED** (#617 carried F2, F4 and W1 in `0195`). **The other twelve are
   still unfiled, by design.**
8. **The backup's own Drive identity (S4) shipped and was REVERTED** (#604). **Do not re-attempt
   it**; it needs him at a Google console.
9. **Backups prune by AGE, not count. Backup key custody is DONE** (encrypted USB and Keychain).
10. **The test-site visitor tile is NOT wanted** — grey *Not set up* is the intended permanent state.
11. **Raising model or effort is NOT the answer to a handoff miss.** The fix is the brief.
12. **The quick-win band stays as written.** Asked four times.
13. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`. If it is
    the only red on your PR, there is nothing to wait for.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs, which Claude
merges itself the moment CI is green.** Not technical in these areas: **plain English, no jargon,
options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. **Never give him a command before the moment he should run it** (he ran a production
deploy three steps early on 2026-10-10).

**He answers questions put as options with a recommendation, and he answers them fast.** On
2026-10-14 he took the planner's recommendation three times out of three, including a swap that
displaced a planned item — so **make the recommendation explicit and put it first.**

**He overrides freely and expects that accepted without re-argument.** That day he ran the SEO stream
at `high` rather than the recommended `xhigh`, and he merged every PR himself from the PR bar before
the planner had read the checks. **Ask what he has actually started rather than assuming the plan
describes reality**, and **read `get_session` rather than the recommendation.**

**He files items himself, mid-day, from looking at the live app** — the cards-page refinements item
came from a screenshot of a page that had shipped that morning, and he then added drag-and-drop to it
after filing. **So re-read an item fresh when writing its brief: it may have grown since it was
planned**, and a "small, app only" item can become a medium one.

**He reads the briefs' consequences carefully and will catch a planner error in them.** Take that
seriously: a brief is a thing he audits, not just something the streams read.

**He holds a release for a change that breaks quietly**, and names it separately from the count.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it. **This one
was asked for directly**, in the chat that had planned all three batches — which is the rule working.

**Count the workstreams honestly, and count other sessions' too.** This round's nine are three
batches of three; the handover stream itself makes ten but is counted in the next round, as its
predecessors were. **Counting PRs instead of streams is how the counter once read 13 and then 16.**
**And do not double-count a batch**: streams are added when the batch is *set up*, so a postponed
stream is already on the board.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-147`; the previous were **#612** (`138`), **#597**
(`127`), **#588** (`116`), **#575** (`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`),
**#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09 whether the PR was really needed;
**it is.** It is a `docs/` file in the repo, so the only alternatives are committing to `main`
directly or routing it through the `backlog` branch, and the second is the 2026-10-07 failure
`CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
