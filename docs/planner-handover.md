# Planner handover — written 2026-10-16, after NINE workstreams in one chat

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **three batches of three, all planned, built and merged between 09:40 and 12:26 on
2026-10-16** — in one chat, resumed twice — plus this handover. It says where the planning loop
stands, what is blocked and on whom, and what not to re-derive. It is **rewritten every nine
workstreams or so** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the top block, the measurement table, and **the three "measured" sections at the
   bottom. The batch 3 one is the most important thing either file gained this round**
4. this file, for what has changed since
5. **`docs/decisions/2026-10-16-shared-dev-view-collision.md`** — why a new public view turns every
   other stream's CI red, and the two windows that have different answers
6. `docs/decisions/2026-10-16-appeals-schema.md`, `-appeals-public-pages.md`, `-appeals-staff-side.md`
   — the sponsorship feature, start to finish, built in three batches on one day
7. `docs/decisions/2026-10-16-untagged-worker-stays-amber.md` — a worked example of a stream
   correctly concluding it **could not** do what was hoped, and saying so

---

## FIRST, THE TRAP THIS CHAT FELL INTO: THE HANDOVER ON `main` MAY BE TWO EDITIONS STALE

**Before you trust `docs/planner-handover.md`, run `gh pr list --state open` and look for an open
`planner-handover-*` PR.** This chat read the file on `main`, reported its figures to Lutan — 200
migrations applied, next free `0200` — and was wrong by ten migrations. The current edition was
sitting in **unmerged PR #662** the whole time, and it had the right numbers.

Lutan caught it by asking "can you double check the dev database numbers". **He should not have had
to.** Two commands settle it, and this file is the one document whose own staleness is most likely to
be invisible: it is written to be authoritative and it ages in hours.

**So: `gh pr list` first, then read the file, then verify every number in the table below against the
repo anyway.** That instruction was already at the bottom of the last edition and following it would
have caught this.

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

**Do not reintroduce a numeric stop threshold into a brief, ever.** Thirty-six briefs across
2026-10-14 to 2026-10-16 used the reporting form and none of them gated; keep it that way.

**And the sibling rule:** *"PLEASE DON'T MAKE ARBITRARY DECISIONS ABOUT HOW I USE MY CREDITS
WITHOUT ASKING ME FIRST."* **Model, effort, which allowance gets spent, and whether to start at all
are all his.** The planner's job is the trade-off, a recommendation and the consequence in one line
— **then ask.**

**The allowance was nowhere near the constraint.** Nine workstreams, a release in flight and this
handover moved *Weekly · all models* from **24% to 27%** — about **3% for nine streams**. Fable sat
at 9% all day and had nothing suited to it (see *Answered and closed*).

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`9e79652a`**, `backlog` in step |
| Dev database | **213 applied, 213 files, 0 pending, zero drift** — re-verified with `--status` after batch 3 |
| Next free migration number | **`0213`** (highest on `main` is `0212_retire_facility_map_activity.sql`) |
| Production database | **the planner cannot read it** — refused as [Production Reads]. Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **95**, down from 101: the nine streams ticked six between them |
| Open PRs | **#670 only** — this chat's decision record on the CI collision, waiting on Lutan's merge |
| Release | **`0.33.0` cut, recorded (#668) and deployed through `deploy.mjs` on 2026-10-16.** A release for these nine — `0.34.0` — **was in flight in the release manager's session when this was written**, with `releases.ts` still reading `0.33.0` and notes waiting in `unreleased`. **Do not touch it; it is that session's work** |
| Leftover worktrees | **TEN** `Animal_Shelter_*` folders plus **five** stale app worktrees under `.claude/worktrees/` — see *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in the order they were set up.** Batch 1: #667 `appeals-schema`, #666
`book-clinic-card-tile-fix`, #665 `script-fixes-fold`. Batch 2: #672 `appeals-public-pages`, #669
`pack-sizes-forecast-schema`, #671 `release-check-distinguish`. Batch 3: #675 `appeals-staff-side`,
#674 `pack-sizes-app`, #673 `facility-map-retire`.

**Batch 1 was planned, built and merged in about 45 minutes**, and all three batches fitted inside
three hours. Lutan merges from the PR bar as soon as the checks are green, so the merge train never
queues. **On a resume, read `gh pr list` rather than assuming a batch is still in flight.**

**The sponsorship feature went from nothing to finished in one day, in three batches** — schema,
public pages, staff side — which is what the batch structure is for. It is the clearest demonstration
so far that a three-part feature should be three streams in three batches rather than one large one.

---

## Token estimates — THE NEW FINDING IS ABOUT SUB-FEATURE COUNT, NOT THE DIALS

### The nine

| slug | model / effort **run** | recommended | estimated | actual | |
|---|---|---|---|---|---|
| `appeals-schema` | sonnet-5-5 / medium | low | 230–285k | **215,082** | 7% under |
| `book-clinic-card-tile-fix` | sonnet-5-5 / medium | low | 170–280k | **169,299** | just under |
| `script-fixes-fold` | sonnet-5-5 / medium | low | 120–180k | **148,861** | inside |
| `appeals-public-pages` | sonnet-5-5 / medium | low | 200–290k | **260,519** | inside |
| `pack-sizes-forecast-schema` | sonnet-5-5 / medium | low | 100–150k | **145,566** | inside, near the top |
| `release-check-distinguish` | sonnet-5-5 / medium | low | 110–170k | **139,445** | inside |
| `appeals-staff-side` | sonnet-5-5 / medium | low | 220–310k | **371,743** | **20% OVER** |
| `pack-sizes-app` | sonnet-5-5 / **low** | low | 230–320k | **327,995** | **2.5% over** |
| `facility-map-retire` | sonnet-5-5 / **low** | low | 140–200k | **163,629** | inside |

All nine read from `get_session`, not assumed. **Seven of nine inside band.**

### COUNT THE SUB-FEATURES. This is the finding and it is more useful than anything about effort

**`pack-sizes-app` ran on exactly the recommended dials — sonnet-5-5 at `low` — and still went
over.** That is the **first over-band stream at the recommended dials** since the measurements began,
so unlike `weigh-first-app` (both dials raised, 2026-10-15) it cannot be explained away. **The band
was wrong.**

Both overruns carried **several distinct sub-features in one stream**, and that is the only thing
they share:

- **`pack-sizes-app` was three**: multi-line delivery entry, a per-size stocktake with open-bag
  handling, a purchasing suggestion — each with its own phone layout in two languages.
- **`appeals-staff-side` was closer to six**: create, edit, live style preview, preview before
  publishing, record a gift and move resident-designated gifts across, close with an outcome, plus a
  manual topic.

**Folding is still the planner's cheapest lever — but folding *quick wins* is what is cheap.** Three
small fixes share one ~77k floor and stay inside a quick-win band (`small-ui-fixes-fold` 134,259;
`script-fixes-fold` 148,861). **Three or more substantial sub-features do not behave that way**,
because each carries its own design, its own screens and its own verification.

**So: a stream with three or more distinct sub-features is banded `large` (340–460k), or at the very
least quoted at the TOP of medium with the straddle said out loud.** And the planner error worth
naming: `.plan-day.md` said `pack-sizes-app` "straddles the medium/large boundary" **and then quoted
the lower band anyway**. Writing "it straddles" and quoting the bottom is getting an estimate wrong
on purpose. **Quote the band you actually believe.**

`appeals-staff-side` had a second cost the brief named without banding for it: proving a gift moved
onto an appeal is not counted twice meant establishing totals before and after on real rows. **That
is nearer to building the instrument than to writing a screen** — and the brief asked for it
explicitly, so the planner knew.

**Neither overrun is an argument for raising effort.** `pack-sizes-app` went over at `low`; more
thinking per turn makes the figure larger. The cure is the band, or splitting the stream — this one
was two clean streams, (a)+(b) and (c), in different batches.

### The effort finding, unchanged and still narrow

**Eight streams at sonnet-5-5 / `medium` are now measured against bands set at `low`, and six landed
inside.** Raising effort one step on a well-briefed stream has not by itself pushed one out of band.
**Carry that and nothing more.** It says nothing about either band's width, and **model and effort
are Lutan's** — record what ran, never ask why, never raise effort to fix an overrun.

### The bands as they now stand

| scale | band |
|---|---|
| Floor | **~77k** (System tools ~39k · MCP ~20k · Memory 11,120 · Skills 6,546 · System prompt ~10k). **Memory read 11,120 in every one of the nine** — it has stopped growing. Stop re-deriving this |
| Quick win | **110–170k** — Lutan's ruling, 2026-10-11, asked four times. **Do not reopen it** |
| Schema PR | **100–150k single-file (quote the bottom) · 140–200k folded · 215–285k with code** (`appeals-schema` 215,082 for a table, two views, an activity and a check script) |
| Medium | **170–290k** — one or two sub-features |
| Large | **340–460k** — **and this is where three-or-more sub-features belong**, as well as a stream that must build the instrument |

**The two questions that decide a band:** *must this stream build the instrument?* and — new —
*how many distinct sub-features is it carrying?* Deciding is cheap; reading a long list of files is
cheap; applying an existing design to N pages is cheap (`appeals-public-pages` 260,519 for two new
routes, three display styles, a blur and two languages, **inside** band). Building the measuring
thing is not, and **neither is building three features in one stream.**

### The capture rule held nine for nine

Every actual was read in the same turn the planner noticed the merge, including two batches where the
sessions had already gone idle. **A fresh chat planning the next round is too late** — that is how
two figures were lost on 2026-10-15. If a chat is about to end with a batch in flight, **say so and
say the figures will be lost.** `unmeasured` is the honest value; a guess is not.

---

## What briefs should do

Both standing blocks are in `SKILL.md` — the finish-line block at the top, the pre-push test-plan
block at the end. **Copy both verbatim.** What earned its place this round:

- **TELL A STREAM IT MAY HONESTLY FAIL TO DO THE JOB, and what to do then.** This is the most
  valuable line added this round. `release-check-distinguish` was asked to downgrade one amber to a
  quiet note, **and told that if no trustworthy signal existed it should keep the amber with better
  wording and say so.** That is exactly what it found and did
  (`docs/decisions/2026-10-16-untagged-worker-stays-amber.md`: everything the Worker can read about
  itself was stamped by the build that produced it). **A brief that only describes success invites a
  stream to manufacture it** — and here success would have been a green tile that could not be
  trusted.
- **Name the one thing that can hurt someone, in the stream's own terms**, preferring the quiet
  failure. The four that worked: a public view leaking a donor's name or a Medical-folder wound
  photo; a tile fix that "works" by widening access to the vets' page; a gift counted twice so a
  public total overstates what strangers gave for a named animal; a stocktake that counts a half-used
  20 kg bag as a whole one and tells the shelter it has longer than it has.
- **Point a stream at the PR that just changed its files, by name.** `appeals-public-pages` was told
  to read #667 and its decision file first; `appeals-staff-side` to read both #667 and #672. Both
  did, and neither re-decided a settled question. **Three streams on one feature across three
  batches only works if each is told what the last one decided.**
- **For a schema half, three sentences**: the feature is not usable when this merges; say so in the
  last message; do not tick the item. Held for both schema halves again.
- **Tell a stream what to do if it needs a migration it was not given** — file it on the `backlog`
  branch, do not write it. **Filing must be the easier path or the stream will build it.**
- **Tell a stream which red is NOT its job.** `facility-map-retire` was told the recorded 21-line
  doctor disagreement in `check-permission-parity` is Lutan's separate decision and must not be
  "fixed" green.
- **Say what stays open when the item is ticked.** `appeals-staff-side` closed the feature and was
  told to tick it *with* a note naming the three things that remain (below). A tick that silently
  swallows outstanding work is how the backlog fills with phantoms.
- **Where a production read is needed, say it cannot be done here** and tell the stream to hand over
  a one-line command instead. `facility-map-retire` did exactly that for its "any role holding
  `facility.map` but not `facility.enclosures`" check.

---

## Traps in the tooling

Everything in the last handover's list still holds. **`git show <rev>:<path>` LIES SILENTLY ON DOTTED
PATHS in this shell** — use `git grep`, `git ls-tree`, or prefix `MSYS_NO_PATHCONV=1`. **No long
prose in `node -e` or heredocs** — use the Write tool and splice with `cat`. **A `grep -c` for a
phrase that wraps across two lines reads 0** — verify with one distinctive word. **`python` is the
Store stub.** **`worktree.mjs new` exceeds the 7-minute tool timeout on `npm ci` and gets
backgrounded** — the folder, branch and `.port` exist well before it finishes, **so write the brief
immediately**. New this round:

### `gh` reports `mergeStateStatus: UNKNOWN` for a MERGED PR, and it reads exactly like lag

**This chat told Lutan a merged PR was "green and waiting for you to merge". It had merged fifteen
minutes earlier and he had to correct it.** The sequence: `gh pr checks 665` listed eight passing
checks, and `gh pr view 665 --json mergeStateStatus,mergeable` returned `UNKNOWN`/`UNKNOWN` — which
is what GitHub also returns while it is still computing mergeability after a push. The planner read
it as lag.

**`UNKNOWN` on both fields means "ask a different question".** Read `state` and `mergedAt`:

```
gh pr view <n> --json state,mergedAt,mergeCommit
```

and confirm against `git log --oneline origin/main`. **`gh pr list --state open` goes stale the
moment something merges**, so never report a PR's status from a listing fetched earlier in the turn.

### `check-public-views.mjs` has one more state than it looks like it has

See the collision section below. In short: a FAIL that names a view **your branch never touched** is
not your bug.

### `git merge backlog` did not conflict once this round

Four conflicts in three days before this; three clean merges today, because the `backlog` branch had
already been folded in earlier in the day each time. **Keep expecting one** — the union method is in
the previous handover and `check-backlog-sections.mjs` must be run **from the App checkout** (run
from the Backlog worktree it reads the App's file and tells you nothing).

---

## The shared-dev public view collision — read the decision file, but know this much

**Three PRs went red on `public-views` on one morning and none of them had done anything wrong**:
#666, #665 and the release's own #668. `scripts/check-public-views.mjs` asks the **shared dev
database** what anonymous visitors can read and compares it against a `PUBLIC_VIEWS` list that lives
**in the branch under test**. `appeals-schema` created two public views and applied them to dev —
which the schema-first rule requires — so every other live branch failed with *"a new public view?
add it to PUBLIC_VIEWS"*.

**Two windows, different answers, and conflating them sends people to a remedy that cannot work:**

- **Schema PR merged** → `node scripts/worktree.mjs sync` brings the declarations and it goes green.
- **Schema PR not merged yet** → **there is no fix on your branch at all.** Wait for the merge.

**In neither window do you soften the check**, and the structural fix is already filed on the backlog
from the release (`ed394e48`). **#666 was merged with that check red**, which the rules forbid; it
turned out harmless, but that was established four commands later, by the planner, after the merge.

**The planner's own error here, worth keeping:** the first draft of
`docs/decisions/2026-10-16-shared-dev-view-collision.md` gave "sync" as the general remedy, because
the case in front of it was the merged one. The release session's independent account of #668 is what
produced the second window. **Two accounts of the same fault were better than one**, and the correction
is logged as a defect in that PR's test plan rather than quietly fixed.

---

## Leftovers — TEN folders and FIVE stale app worktrees. This needs a round

`git worktree list` holds the main checkout, `Animal_Shelter_Backlog`, **ten** `Animal_Shelter_*`
leftovers and **five** app worktrees under `.claude/worktrees/`.

- The ten: the nine streams of this round plus `shared-dev-view-collision` (which is **not** a
  leftover while #670 is open — it is `ahead 2` with a live PR).
- **All of the nine were `HELD` by their own sessions.** `done` refuses a folder a process has open,
  so **those sessions must be closed first. Ask; do not tear one down.** `/clean-streams` does the
  round.
- **`worktree.mjs done` does not know about `.claude/worktrees/` at all** — those five need
  `git worktree remove`. Count them with `git worktree list`, not `worktree.mjs list`.
- They hold ports 3001–3013, which is why batch 3 started at 3012.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and `done`ing
it destroys a day's build; ahead with a **merged** PR is a leftover, because a squash-merged branch
stays ahead for ever. **Nothing was ever in the first category this round.**

### The app-cut worktree mechanism is INTERMITTENT — note it, do not act on it

Batch 1's `appeals-schema` and `book-clinic-card-tile-fix` ran in
`.claude/worktrees/<other-slug>-<hash>` (reusing *older streams'* folder names) with `originCwd` the
planner's folder; **everything else this round ran in the planner's folders as intended.** So the
behaviour Lutan reverted on 2026-10-16 still appears for some sessions.

**`SKILL.md` step 7 stays as written.** The previous handover's lesson applies directly: *a mechanism
you have observed three times is still a mechanism, not a policy* — the last time a planner rewrote
the process on one day's evidence, Lutan reverted the setting the same day. **Say what the tool is
doing and ask what he wants it to be; change nothing in the repo.**

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The sponsorship feature's last three threads** — the feature shipped complete on 2026-10-16, and
  these stayed open on purpose: **the Director's wording for what happens to money raised beyond an
  appeal's target** (`appeals.extraGoes`), **a Thai reader's review of the appeal wording**, and the
  display style in the generated **share-preview image**.
- **The vet calendar's last mile.** #656 built it all. Outstanding, all Lutan: mint
  `GOOGLE_CALENDAR_REFRESH_TOKEN` (`calendar.events`, the **published Desktop client in
  `lanna-care-dev`**, never a new project), set `GOOGLE_CALENDAR_ID`, put both in the **test and
  production** values files explicitly, deploy; then see an event in a real calendar and on the
  Director's phone, **then share the calendar with her and tell her to delete her hand-typed copies**.
- **Confirming the production Release tile is green** after `0.33.0`'s deploy, and the
  `facility.map` production query `facility-map-retire` handed over. Both are one-line reads the
  planner cannot run.
- **The two cards questions and the Doctor's broken `home_path`** — sign-in sends the Doctor to
  `/appointments`, which its cells do not open. **A live defect on dev, not bookkeeping.**
- **The production cutover** — blocked on the Director transferring `lannacareforanimals.org` to
  Cloudflare from sav.com. **Not plannable until the zone reads Active.** The **Thai site's own
  addresses** sits behind it and also needs Lutan's decision on the shape.
- **`from-zero-rebuild`** — needs a third free Supabase project (the free tier allows two). **Not a
  paid plan.** About two thirds needs nothing from anyone, so brief that half first.
- **`Review the manual against real use`** — a staff member and a volunteer following it on a phone
  for a day. **It reads like a Fable review item and is not one.** The Thai manual sits behind it.
- **The acceptance checklist's pre-run agreements** — who tests which role, an account per role, what
  counts as a blocker. **The printable PDF half is BUILT** (see below).
- **The remaining red check harnesses** — each needs a per-role ruling.
- **F3** (one delete rule for 54 `auth.users` links) — a decision before a stream.
- **The photo lightbox at 375 px**; **the maintenance board on a phone**; **the map on the Director's
  actual phone**; **somebody actually covering a role** — all need a person at a device.
- **The Bills tile on the Director's phone home**; **promoting `test-plan` to a required check** —
  both his.
- **Three SEO items** (a Google Business Profile, Search Console verification, Thai wording for four
  public page titles) and **about nine public-site review items** need the Director.

---

## Blocked, and on whom

- **Lutan:** merging **#670**; **closing the nine leftover sessions**; the calendar's token and
  deploy; the two cards questions and the Doctor's home; the two auth decisions; the third Supabase
  project; the twelve unfiled database review findings; F3's delete rule; the red harnesses; the Pi
  failover options paper; the second admin account; the mobile sweep (**declined five times — offer
  only as a swap**); the product `.org` name; the Thai-site address shape.
- **The Director:** the over-raising wording; signing the roles draft and applying it to production;
  the community-dogs baseline; the Thai receipt wording; the online shop; **the domain transfer, which
  gates the cutover**; the Thai public-page wording; a photo per public page; the "since &lt;year&gt;"
  year itself.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare` ship
  a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **Fable had NO work on this board.** The drop-shipment options paper — called the one unblocked
   Fable item by the last edition — is **blocked** on seven prerequisite answers from the Director.
   The bucket sat at 9% all day. **An unused bucket is not a reason to invent work for it.**
3. **The acceptance checklist's PDF is BUILT** — `scripts/acceptance-matrix.mjs --pdf`, commit
   `cde576b8`, with `scripts/check-acceptance-pdf.mjs` guarding it. The item's "Still to build" was
   stale and is now annotated. **Only the pre-run agreements remain. Not a workstream.**
4. **Thai for a resident's breed and colour is DONE and ticked** (columns `0205`, registration `0209`,
   fields and screens #657). It read open for a day after finishing.
5. **The card set is TWENTY-ONE**, and the count now runs in CI without a database (#665), so this is
   checked on every PR rather than only where a dev token exists.
6. **The menu removal goes LAST**, gated on the orphan list.
7. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
8. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
9. **Raising model or effort is NOT the answer to a band being wrong.** Proved again: the one stream
   that went over at the recommended dials needed a wider band, not more thinking.
10. **The quick-win band stays as written.** Asked four times.
11. **`/plan-day` creates worktrees, as it always did** — tried the other way on 2026-10-16 and
    reverted the same day.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast, from the PR bar, often before the planner has read the checks.** All
nine of this round went that way.

**He takes the planner's recommendation when it is explicit and first** — he confirmed all three of
batch 1 with no swaps, and answered the one genuine either/or (the Release tile) in the same breath.
**Ask a real decision as a question with a recommendation; do not ask for permission to begin.**

**He corrects the planner's facts, and he is usually right.** Twice this round: the stale handover
figures, and a PR the planner said was unmerged. **Both were cases of the planner trusting a reading
instead of the source.** When he says "it says it's merged, can you check" — check the source, not the
tool you already ran.

**He files items himself, mid-day, from looking at the live app, and items grow while a stream is
working on them.** `appeals-public-pages` gained a three-display-styles requirement with its own test
matrix after it was banded, built it, and still came in inside band. **Re-read an item fresh when
writing its brief — and again when reading its actual**, because a figure inside band against a
bigger task than the one that was banded is a better result than it looks.

**He reads the briefs' consequences carefully and will catch a planner error in them.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat that
still has the context, then start the fresh chat.** Offer it; do not just do it. **This one was asked
for directly**, in the chat that had planned all three batches — the rule working, for the third
handover running.

**Count the workstreams honestly.** This round's nine are three batches of three; the handover stream
itself is counted in the next round, as its predecessors were. **Counting PRs instead of streams is
how the counter once read 13 and then 16** — and note this round produced *eleven* PRs for nine
streams (#670, the decision record, and #668, the release record, belong to neither batch). **And do
not double-count a batch**: streams are added when the batch is *set up*.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-182`; the previous were **#662** (`173`), **#638** (`156`),
**#625** (`147`), **#612** (`138`), **#597** (`127`), **#588** (`116`), **#575** (`105`), **#562**
(`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on
2026-10-09 whether the PR was really needed; **it is.** It is a `docs/` file in the repo, so the only
alternatives are committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure `CLAUDE.md` documents by name.

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an open
`planner-handover-*` PR before you trust the file on `main` at all.** Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
