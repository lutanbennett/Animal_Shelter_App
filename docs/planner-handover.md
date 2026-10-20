# Planner handover — written 2026-10-19 (evening), after NINE workstreams in ONE conversation

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of **nine planned workstreams on 2026-10-19**, in three batches of three, each set up only after
the previous had merged. It says where the planning loop stands, what is blocked and on whom, and
what not to re-derive. It is **rewritten every nine or ten workstreams** and is deliberately
short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — the measurement table, which this round added **nine more readings**
4. this file

**The branch slug is `240`** (231 + this round's nine). Recorded so nobody redoes the arithmetic.

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

**This round the allowance was never the constraint.** *Weekly · all models* moved **77% → 80%**
across nine streams — **3% for the whole round**, the same as the previous round. *Weekly · Fable*
did not move at all (**48%**), because nothing this round was a Fable item.

---

## THE FINDING OF THIS ROUND, AND IT IS ABOUT THE PLANNER, NOT THE BACKLOG

**Lutan, 2026-10-19, after correcting six separate things in under an hour:**

> ***"what's wrong with you we have had many discussions and handovers that outline that you MUST
> read the backlog fully"***

and then, which is the sentence to keep:

> ***"I shouldn't have to be doing all this correction"***

**He was right every time.** The last handover's finding was *the backlog lies in its titles, so read
to the end of the item*. **This round the planner did exactly what that finding warned about, six
times, and the mechanism was worse than laziness — it was a heuristic that looked like diligence.**

What actually happened, because the next planner will be tempted by all three:

1. **It rebuilt the previous document instead of rebuilding the list.** Asked to update the
   *Waiting on you* sheet, it took the morning's 43 items as the base and looked for reasons to
   remove them. **Anything it had no specific reason to doubt was carried over verbatim, framing and
   all.** Every wrong entry therefore survived by default. That is trusting a summary over the
   source — the exact fault, committed against the one document whose purpose is to avoid it.
2. **It read each item's last 330 characters and called that "read to the end".** Answers that
   happened to be last were caught; answers in the middle were not. **Home Assistant's answer was
   mid-item. The left-menu decision was mid-item.** It then wrote *"each read to the end of the
   item"* in the document's footer, which turned an unverified list into a false assurance.
3. **It treated the backlog as the truth when, for those items, the backlog was the lagging
   record.** The Pi origin key had been confirmed *that same day* while diagnosing the deploy
   banner. Management holding the Approve photos card was knowable. The throwaway Supabase project
   had been deliberately destroyed. None had reached the backlog because **a stream ticks its own
   item and nothing else** — `CLAUDE.md` has a rule for that and #750 did not follow it.

**The rule that follows, and it is three lines:**

- **Build the list from the backlog every time. Never diff against the previous edition.**
- **For anything claiming to need a person, check the thing, not the item's description of it** —
  the code, the release record, the test plan, the live config.
- **Never state a verification standard you did not apply.**

**A fourth thing belongs with these: date-stamp the claim.** The rebuilt sheet now carries, on every
entry, *the date its blocked-ness was last confirmed*. Several read 21–22 September. **A stale date
is visible; a stale claim is not.**

### The same lesson, in its most expensive form: the harness labels

**The planner reported two of five harness results to Lutan exactly backwards.** These scripts build
their label from the *expectation*:

```js
const label = `${name} as ${p}: ${want ? "allowed" : "refused"}`;
…
else fail(`${label} — got ${n}`);
```

So **`change a delivery as admin: refused — got 1` means *expected refused, actually ALLOWED***.
Read as a result, it says the opposite of what it says.

**What that cost:** he was told the vet could already change diets and prescriptions and asked
whether that was right — when the truth is the vet **cannot**, and the checks expect they should. He
was told a delivery could not be edited by anyone including Admin and that he needn't care — when in
fact **four roles can edit a delivery in place**, which the design forbids precisely because it
leaves no trace. **And the backlog's own description ("the doctor holds no `medical.*` cell on dev")
had been right all along and was contradicted on the misreading.**

**Read `const label =` before interpreting any `check-*.mjs` output.** It is written on the item now.

### And a mechanical one that bit three times in one session

**Matching a backlog item by `line.includes(needle)` matches the BODY, not the title.** Items are
single lines of 5,000–11,000 characters, so a phrase from one item routinely appears inside another.
This put an answer on a *completed* item about the Doctor's `home_path`, and a Drive note on the
wrong Drive item. **Match the leading bold run only:**

```js
const titleOf = (l) => { const m = l.match(/^- \[([ x])\] \*\*(.*?)\*\*/); return m ? m[2] : ''; };
```

**Also: apostrophes.** `Director's` in the file is `\u2019`, not `'`. A needle with the wrong one
silently matches nothing. **Always print what you matched before writing**, and verify the count
afterwards.

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`663ae69e`** (#757 merged, then a `backlog` merge) |
| `backlog` branch | **in sync with `main`** |
| Dev database | **230 applied, 230 files, 0 pending, zero drift** |
| Next free migration number | **`0230`** (highest on `main` is `0229_video_media.sql`) |
| Production database | **the planner cannot read it.** Write the read-only script, hand Lutan the one-line command, read the result from his terminal |
| Open backlog items | **88** — down from 97 this morning and 119 yesterday |
| Open PRs | **none** |
| Release | **`0.37.1` is cut, recorded and deployed.** `unreleased` carries this round's lines. **`0.38.0` is NOT cut** — the release manager's session |
| Leftover worktrees | **eleven**, all `0` ahead with merged PRs. See *Leftovers* |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**The nine, in order.** Batch 1: #749 `assistant-retention` (+#751, its app half — **one stream, two
PRs**), #750 `pi-deploy-truth`, #748 `backlog-title-rule`. Batch 2: #754 `role-home-tiles-app`, #752
`meme-sources-schema`, #753 `who-does-what-fixes`. Batch 3: #757 `meme-sources-app`, #756
`mobile-icon-labels`, #755 `videos-schema`.

**All nine merged. None ended with a built branch and no PR.** The three standing brief blocks are
doing their job and should be copied verbatim, unchanged.

---

## THE MEASUREMENTS: THE BANDS ARE STILL TOO HIGH, FOR THE SECOND ROUND RUNNING

**Nine streams, every one `claude-sonnet-5-5` / `low`.**

| slug | estimated | actual | |
|---|---|---|---|
| `backlog-title-rule` | 130–180k | **120,798** | 7% under |
| `meme-sources-schema` | 140–160k | **120,379** | 14% under |
| `videos-schema` | 150–200k | **132,927** | 11% under |
| `who-does-what-fixes` | 150–210k | **140,039** | 7% under |
| `assistant-retention` | 170–240k | **150,248** | 12% under |
| `pi-deploy-truth` | 140–190k | **167,819** | inside |
| `mobile-icon-labels` | 200–290k | **174,956** | 13% under |
| `meme-sources-app` | 250–340k | **191,888** | 23% under |
| `role-home-tiles-app` | 230–320k | **201,544** | 12% under |

**Eight of nine came in UNDER the band. One landed inside. None went over.** The previous round
reduced the bands and landed seven of nine inside; **this round they were reduced again and still
over-predicted every time.** The bands are not yet right. **Reduce them again** — and note the
pattern is not noise, it is two consecutive rounds in the same direction.

**The floor measured ~86.6k on seven of nine**, identically (System tools 38,771 · MCP 20,061 ·
Memory 11,636 · System prompt 10,109 · Skills 6,601). Two streams showed a larger tool block
(42,570 and 43,643), so **the floor is now 86.6k–90k, not a single number.** Messages — the actual
work — ranged **30,840 to 107,133**.

**Revised bands, from these nine plus the previous nine:**

| shape | band | evidence |
|---|---|---|
| Single-file schema PR | **115–140k** | 120,379 · 132,927 (messages only 31k and 43k) |
| Docs / rules / small script fold | **115–145k** | 120,798 |
| Defect or small-UI fold | **130–170k** | 140,039, and last round's 145–148k |
| Schema + its app half, one stream | **145–185k** | 150,248 |
| Scripts + runbook, careful verification | **150–190k** | 167,819 |
| A feature across several surfaces | **170–215k** | 174,956 · 191,888 |
| A new Settings screen with real interaction | **190–230k** | 201,544 |

**The third axis needs correcting downward too.** `mobile-icon-labels` was banded 200–290k *on the
number of screens*, and came in at 174,956. **Six surfaces at one width is not 132 activities × 6
roles × 2 languages.** The screens axis is real but its slope was far too steep for small N: **below
about ten screens, band it as ordinary work.** Reserve the steep slope for walks measured in
hundreds of interactions, which is where it came from.

**Capture the actuals even when every session is idle.** The skill warns that an idle session
reports `unavailable`. **It did not** — all nine were readable after their sessions had finished and
their PRs merged. Try first; only write `unmeasured` when a call actually fails.

---

## WHAT LUTAN ANSWERED THIS ROUND — settled, do not re-litigate

He answered **seventeen** things in one afternoon, most of them by annotating a PDF by hand. **Every
one is recorded on its own backlog item with his words quoted and the title rewritten.** Listed here
so a planner can see them at a glance, not so they can be re-derived.

**Closed outright:** the dashboard **year view is NOT REQUIRED**; **Stocktake is superseded by
cards**; the **Chiang Mai five get separate sites for now**, *"until they are all using it"*; the
**Director's who-does-what draft is not required** — *"THE CARDS MANAGE THIS IN THE APP"*.

**Answered, now builds rather than decisions:** the spare drive **stays unencrypted** and **a 1 TB
SSD has been found**; **desexing drives go under Services**; **only Admin manages home tiles** —
*"whoever is in the admin group"*, i.e. the **role**, so the second admin account holds it too.

**Answered with sequencing that changes the plan:** the **vet calendar stays on TEST** until the
**two-way calendar** is built and tested, the token is **TBA** after that, and **sharing with the
Director comes last**. **This makes the two-way calendar item the gate on that entire area**, which
it was not before.

**Answered in a way that cuts against the item's own reasoning — record both halves or it gets
re-argued:** **Facebook stays on hold**, and *"THERE ARE 10 POSTS P/week Avg."* The item said to
build the full flow *if* staff post several times a week. **Ten passes that bar, and the answer is
still no, on priority.** Do not re-argue it from the posting volume.

**Answered as unscheduled rather than blocked:** the **production Drive move is TBA**. *Not*
refused, *not* waiting on anyone. **Do not chase it and do not list it as waiting on him.**

**The three red-harness rulings, all "Yes" (2026-10-19):** the **vet MAY change diets and
prescriptions** — so the doctor's missing `medical.*` cells are the fault and the expectation was
right; the **Head of Maintenance keeps `assistant.ask` and `maintenance.photos`**; the **Head of
Medical keeps `facility.enclosures`, `recurring.do_own` and `stock.count`**. In the last two **the
database is right and the code is wrong.**

**That last point has a trap.** The item's standing rule is *"none was made green by copying today's
behaviour into the expectation"*. **He has now ruled that today's behaviour is correct, which is a
different thing from a stream assuming it.** The commit that fixes those two **must cite the
ruling**, or the next reviewer cannot tell the difference.

---

## A METHOD CHANGE WORTH KEEPING: CHECK IT YOURSELF FIRST

**Lutan, 2026-10-19, on being handed a blank security checklist: *"it may need your input first and
then I validate it."*** That instinct was right and the result was striking.

Of the original checklist, **four rows were already correct** and nobody knew: open sign-up is off on
both projects, authenticator apps are enabled including on production, the redirect allow-list is
clean, HSTS is at the planned 180 days. **Two were genuinely unset** — leaked-password protection
(`password_hibp_enabled = false`) and the session inactivity timeout (`sessions_inactivity_timeout =
0`, where the plan said 60 days). **Two cannot be read from here at all** and that is now recorded so
nobody burns a session trying: Cloudflare WAF and bot rules (our only tokens are cache-purge and
analytics) and laptop BitLocker (needs administrator rights).

**How it was read, because the next planner will want this:** `SUPABASE_ACCESS_TOKEN` in `.env.local`
reads `GET https://api.supabase.com/v1/projects/{ref}/config/auth` for **both** projects. HSTS and
the other headers come from `curl -sI` against the live site. Neither is an ad-hoc production data
read and neither was refused.

**The general rule: a checklist handed to him blank wastes his time on rows that were already done.**
Read what can be read, state plainly which rows are facts and which are his console, and hand him
the remainder.

**One caution from the same exercise.** `Get-BitLockerVolume` fails with *Access denied* and then
prints *"C: does not have an associated BitLocker volume"*. **That second line is not evidence of
anything** — the command failed before it could tell. Do not report it as "not encrypted".

---

## TWO FINDINGS THIS ROUND PRODUCED, BOTH FILED

- **A delivery record can be edited by four roles.** `update stock_receipts` succeeds as admin,
  management, the 2IC and the delivery lead. The design (`0145`, C8) is that **nobody** may edit a
  delivery — a wrong one is deleted and recorded again so the correction is visible. **An in-place
  edit leaves no trace the figures changed**, which is the same shape as the bill-cost and diet-typo
  defects he held a release for. Its own item.
- **Every Drive folder is "anyone with the link".** Root plus all eight sub-folders, including
  `Residents` and `Medications`. This defeats the photo proxy, which is the thing that decides who
  may see a medical attachment. **It is DEFERRED ON PURPOSE** — Lutan: *"I have been delaying this
  on purpose until we move to the production google account."* **Recorded in the item's title so the
  next audit reads deferred-by-decision and moves on.** The real work for that day, and the reason
  it is its own item: **the deceased-resident archive writes literal `drive.google.com` links**,
  which stop working the moment sharing is removed. Design that before the switch.

---

## A MERGE CONFLICT SHAPE THE DOCUMENTED RULE STILL DOES NOT COVER

`CLAUDE.md` says: if `main`'s line is strictly longer and differs only where the `backlog` line
ends, take `main`'s side. **This round produced the case it does not describe, for the second round
running:** the home-tiles item conflicted with **`main` SHORTER and BOTH sides open**.

`main` carried #754's status (the Home screen panel is built); the `backlog` branch carried Lutan's
"only Admin manages tiles" answer, appended an hour earlier. **Taking either side alone would have
silently dropped the other.** The resolution is the **union**.

**So the test is not the tick and not the length. It is: what does each side know that the other
does not?** Diff the two, find the added passage on each side, and concatenate. Say so in the commit.

---

## Leftovers — eleven worktrees

All `0` ahead with merged PRs: `approve-photos-card-bug`, `assistant-retention`,
`backlog-title-rule`, `meme-sources-app`, `meme-sources-schema`, `mobile-icon-labels`,
`pi-deploy-truth`, `role-home-tiles-app`, `videos-schema`, `who-does-what-fixes`, plus
`planner-handover-240` once this merges. Three app-cut husks remain under
`Animal_Shelter_App-worktrees` (`alert-test-relay-*`, `restore-drill-docs-*`), now detached.

**The rule that matters more than the count:** ahead with **no** PR is unsubmitted work, and
`done`ing it destroys a day's build; ahead with a **merged** PR is a leftover, because a
squash-merged branch stays ahead for ever. `/clean-streams` does the round.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**

- **The two switches on the security checklist** — leaked-password protection and the session
  timeout, both projects. Two clicks each, and the current values are recorded as the evidence.
- **Cloudflare WAF and bot rules**, and **laptop disk encryption** — unreadable from here.
- **The second admin account**, which gates shipping the 2-step refusal.
- **The vet calendar token** — but see the sequencing above; it is behind the two-way build.
- **The Drive move** — TBA, his to schedule. Do not chase.
- **Who can read what of a contact, on production** — a person must do it on real rows.
- **Watching the Head of Medical, the Head of Maintenance, the 2IC and the Director work** — nobody
  has.
- **The spare SSD** — a 1 TB drive has been found; the probe, clone and boot test remain.
- **Reviewing the two dry-run reports**, and **archiving the standing dev admin login** the
  18 October run left behind.
- **The five remaining acceptance dry-run role passes** — ordinary streams, one role each. **Do not
  brief them as one.**
- **The Director:** the domain transfer, **which gates the whole cutover**; the community-dogs
  number; the donation figures; phone and LINE; four pages of Thai wording; the tagline; the trust
  block; adoption cost; success stories; the shop sheet; the drop-ship prerequisites.

---

## Blocked, and on whom

- **Lutan:** the two security switches; WAF and bot rules; BitLocker; the second admin; the contact
  read on production; the dry-run reviews; the spare-drive steps; the Home Assistant walkthrough;
  the home-network session.
  **Two came off this list on 2026-10-20, both because they had already been decided and this sheet
  still listed them:** *prescriptions with more than three doses a day* (three rounds stay, a
  free-text note carries any extra dose) and *`test-plan` as a required check* — **it stays
  ADVISORY, permanently, and `CLAUDE.md` now says so.** His words: *"Was already decided, another
  one that I need to reprosecute."* **That is the second time in two rounds that this sheet has
  cost him a decision he had already made.** An entry here is a claim that someone owes something;
  before writing one, check the thing rather than the previous edition, and date-stamp it.
- **The Director:** the domain transfer; the wording and data items; the shop; the sign-off ground
  rules.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **Never block his paid usage.** No numeric stop thresholds in briefs.
2. **A red `audit` check is not a blocker and never has been.** It is `continue-on-error`.
3. **A release's own two PRs are merged by Claude the moment CI is green, without asking.** Major
   versus minor and the production Worker deploy stay his. **The record PR is never a gate.**
4. **Raising model or effort is NOT the answer to a band being wrong.**
5. **Removing the left-hand menu** — decided 2026-10-13: not until coverage is demonstrated, and it
   goes last. A build task, not a question.
6. **How the monitoring dashboard reaches Home Assistant** — answered 2026-10-02. Nothing is exposed
   to the internet, alerts already reach him free, remote access is out of scope for v1. **It is a
   session to do together, not a decision.**
7. **The throwaway Supabase project** — created, used for the restore drill, and **destroyed on
   purpose**. Nobody should ask him for its reference. A fresh one is made inside the rehearsal.
8. **The Pi origin key** — confirmed refusing keyless requests on production, 2026-10-19.
9. **Pi failover, Senior Staff, videos storage, assistant retention and who reads assistant rows** —
   all settled in previous rounds and shipped or recorded.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — **except a release's own two PRs.** Not technical
in these areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or
attach a file naming real people. **Never give him a command before the moment he should run it.**

**He merges PRs himself, fast.** All nine of this round were merged within minutes of opening, and
twice the planner was still describing a brief as editable when its stream had already merged.
**Re-read `gh pr list` before asserting anything about state; a stale checkout is not evidence.**

**He answers in bursts, often by annotating a PDF by hand, and expects the answer to stick.**
Seventeen answers in one afternoon. **Record each immediately, in the item's title as well as its
body.**

**He corrects facts, including the planner's, and he is right to.** This round he corrected six
entries on one sheet. **Take the correction, fix the record, say the error was yours, and do not
spend his time on an apology** — he wants the fix, not the contrition.

**He pushes back when asked something already settled.** *"Not required, this is clear in the
backlog."* **Read the item to the end before asking.**

**And when he says a thing has merged, it has.** Twice this round the planner kept verifying instead
of accepting, and was wrong both times. **Check once, quietly, then accept.**

---

## Next round's strongest candidates

Not a plan — the next chat plans. But this is what the board is pointing at:

1. **The red harnesses, all five.** Ruled this afternoon after waiting since 13 October. The doctor's
   missing `medical.*` cells are a permissions change and may carry schema — **its own stream**; the
   maintenance and medical bundles are a smaller correction and could fold together.
2. **The `stock_receipts` over-permission** — a silent-wrong-history defect, which is the class he
   holds releases for.
3. **Cutting `0.38.0`** — nine streams merged and `unreleased` is full. **The release manager's
   session, not the planner's.**
4. **The two-way calendar**, which his sequencing just promoted into the gate on the whole calendar
   area.
5. **The videos APP half** — `0229` is on `main` and applied.
6. **Desexing drives under Services** — now a build, needing shelter content.
7. **The five acceptance dry-run role passes**, one stream each.
8. **The Director-blocked public-site items** — one sheet, not thirteen asks.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file in the chat
that still has the context, then start the fresh chat.** Offer it; do not just do it — and **do not
start it on an ambiguous yes.**

**Apply the turn-cost rule to yourself.** This edition was written at about **44%** of a 1M window,
against the previous edition's 29%. That is affordable and it was the right call, because this
session held the whole round including six corrections that would not survive a summary. **Past
roughly halfway, hand it to a fresh session with this file's structure as the brief.**

**Count the workstreams honestly.** A stream that produced nothing still counts. A stream the user
ran himself counts. **A second PR from the same stream does NOT** — `assistant-retention` shipped
#749 and #751 and is one workstream, not two.

**A trap worth knowing before you start: the Write tool refuses to overwrite a file this session has
not read.** Read it, or `rm` it and write it as new. **This edition hit it again** — reading the
copy in the main checkout does not count as reading the copy in the new worktree.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-240`; the previous were **#742** (`231`), **#730**
(`221`), **#717** (`212`), **#704** (`201`), **#690** (`193`), **#676** (`182`), **#662** (`173`),
**#638** (`156`), **#625** (`147`), **#612** (`138`), **#597** (`127`), **#588** (`116`), **#575**
(`105`), **#562** (`96`), **#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`).
Lutan asked on 2026-10-09 whether the PR was really needed; **it is.**

**Re-verify every number in the table above against the repo** — and **check `gh pr list` for an
open `planner-handover-*` PR before you trust the file on `main` at all**, remembering that an open
`handover-refresh` PR is the *release* handover, not this one. Carry forward only what is still
true; reset the counter in `.plan-day.md` with today's date.
