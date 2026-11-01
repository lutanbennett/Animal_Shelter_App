# Planner handover — edition `537`, 2026-11-01

**A delta, thirty-second edition in this shape. Nine streams in one day** — batches 6, 7 and 8, all
built, merged and measured, every PR green on its own head commit. **All nine ran `opus` / `medium`**,
which makes twenty-one running that have ignored a Sonnet/low recommendation: **stop recommending it and
band at `medium`.** `528`'s subject was *you are banding the wrong noun*, and its answer — count the
judgements, add 15–20k each — **was tested and did not hold**, so it has already been superseded in the
skill by the reconciliation rule. This round's subject is where that rule now bites:

> **AN ITEM'S OWN COUNT OF A TEXTUAL FAULT IS A LOWER BOUND, ALWAYS.** Three readings. Whoever wrote the
> item counted the instances they tripped over. **Measure before you band.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `528` → this. **The next slug is `546`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: THE SMALL ITEM IS WHERE THE OVERRUNS LIVE NOW

The reconciliation rule held on the big streams and slipped on every one I called small. Three streams,
three items that each quoted a count of strings or sentences, **and all three counts were wrong in the
same direction:**

| stream | the item said | it actually was | miss |
|---|---|---|---|
| `manual-access-by-cards` | *"about fourteen sentences"* | **57 sentences and 6 `path:` lines** | **+7%** |
| `thai-hardcoded-strings` | *"15 strings in 3 files"* | 15 — but **12 were deliberate**, and ~419 more are invisible to the check | inside |
| `access-wording-fixes` | *"three dictionary strings"* | three, **plus about thirty more, at least three of them false** | **+9%** |

I banded all three on the item's number. **The number is never the work**, for a reason that is
structural rather than careless: a textual fault is filed by whoever **tripped over** an instance of it,
so the count records their path through the file, not the file. **And the item's count is the one thing
you can check in a minute** — `check-thai-dictionary.mjs --list` and a `grep` of the dictionaries each
gave the real figure before any briefing.

**So the habit: for any item that quotes a count of strings, sentences, rows or call sites, run the
measurement yourself first and band on YOUR number.** It is the same rule as *a count quoted without its
database is not a reading*, one step earlier. **And where the measurement is the deliverable, say so** —
I made it deliverable 5 on two of these three and both came back with the real figure, which is where
the thirty and the 419 came from.

## THE FINDING OF THE ROUND: THREE DOCUMENTS IN A ROW SAID A WRITE WAS A READ

`src/app/assistant/lookups.ts` inserts an `assistant_actions` row on every call (line 610). **#1149's PR
body, #1149's decision file and the (C) sweep paper all describe it as a read-only module**, each having
inherited it from the last. #1152 opened the file, found the insert, and wrapped it — *"it is on every
address, it is not idempotent, and anyone working from either document would have left it unwrapped."*

`528` carried *"an instrument that exists is not an instrument that is right"*. **This is the same fault
one level up: a DOCUMENT that describes a module is not the module**, and documents inherit from each
other far more readily than checks do. The question that catches it is the one #1152 was asked —
**"how many of these are writes? count them"** — and the brief got that right only because I had noticed
a smaller discrepancy in the same body (13 exports against 12 writes) and wrote it in as a question.

**The transferable half for you: when a brief quotes another stream's PR body, say that is where it came
from.** All three of this round's corrections — `ThemePicker`'s real home, the write count, the plain-GET
fetch-patch note — came back because the brief said *"#1149's PR body says X"* rather than *"X"*.

## WHAT `528` ASKED FOR, and what each warning did

- **Its own subject — count the judgements, add 15–20k each — FAILED THE SAME DAY IT WAS WRITTEN.** All
  three of batch 5 ran 20–33% over with it applied. **It is now a special case of the reconciliation rule
  in the skill, marked superseded in place rather than deleted.** Do not re-derive it.
- **The reconciliation rule: FIRED, three consecutive rounds, and it is the first band rule here derived
  and confirmed twice.** Batch 6 two inside (the third compacted, excluded); batch 7 one inside, two over
  7–9%; batch 8 two inside, one over 9%. **Every overrun was a job whose shape changed under the stream.**
  It is right about the shape and still a little light on the amount — **do not widen it again on one
  round's evidence.**
- **"Does the environment hold what the proof needs?" FIRED A FIFTH TIME, in a new shape: the WORKTREE
  itself.** Lutan said stream 14 could write production drafts; it could not, because
  `scripts/worktree.mjs` copies `.env.local` and `.dev.vars` into a worktree and **not**
  `.env.deploy.production`. Nothing to do with permissions. **So "the planner runs the production half"
  is not a convention, it is where the credentials live** — and the four other shapes are in the skill.
- **"The floor is `tokens − messages`." Nine readings became fifteen**, and the drift is visible: batch 6
  read 104.0–105.1k, batches 7 and 8 **104.6–106.1k**. It is in the skill. **Re-derive, never carry.**
- **"A stream can REPORT; only the planner can FILE." FIRED, and this was its best round.** Four findings
  were in PR bodies and on no item: the assistant's seventh resident read, the raw database message a
  policy refusal shows a person, the skill's own 65-line growth, and — mine, from #1149 — that applying
  `0292` is what makes the header breach live. **Keep the pass. It produced batch 8's first stream.**
- **An open question in the NUMBERED DELIVERABLES: FIRED, five rounds, no miss.** Three this round, and
  **all three came back answered against me**: the cron cannot draft labels at all (measured, two `42501`s),
  `/admin/units` can honestly stay listed, and `ThemePicker` lives one component deeper than stated.
- **"Ban the file, not the folder." HELD, six rounds.** **"Count interruptions as a cost of the brief":
  one, and it was mine** — see below.
- **The declared-crossing clause: FIRED THREE TIMES IN ONE PR**, none silently, including two writes moved
  **off** the Server Action path rather than half-wrapped, with the reason each served.
- **The release-note truth rule: HELD on all nine.** Every one answered §7 `n/a` with the outstanding step
  named. Nothing promised a shelter user anything that had not shipped.

## HIS DECISION THAT CHANGES HOW YOU WORK: EVERY PR MERGES ON GREEN

**Decided 2026-11-01, asked directly, and it is in `CLAUDE.md` as "Every PR merges on green"** (#1146).
Feature PRs included. **Do not ask for a merge again.**

It was put to him because batch 6's three streams **merged themselves** on full green while the merge
train still said a feature PR waits for his go — so either the rule or the behaviour was wrong, and only
he could say which. The conditions are written beside it: green on the PR's **own head commit**, read
rather than assumed; `skipped` is not a pass; never past a red; a refused `gh pr merge` is reported, not
worked around. **Major versus minor and the production Worker deploy stay his.**

**The interruption this cost, and it is the lesson:** batch 7's three briefs were written before he
answered and all three said *"wait for Lutan's go"*. I corrected them on disk **before their sessions
opened**, so no stream read the superseded instruction — and by the skill's own rule that is not a
rescope. **But a brief is a copy of the rules, and a copy goes stale the moment the rules move.** When
you change a rule mid-round, the briefs already on disk are the first thing to fix.

## THE PROGRAMME THIS ROUND UNBLOCKED, AND WHAT IS LEFT OF IT

The Pi-failover (D) sweep was blocked by something nobody had seen: **a Server Action POSTs to the
address of the page the person is ON**, and the shared header is on every signed-in page, so every
address in the app had unwrapped writes reachable at it and `/admin/units` sat on `WRAPPED_WRITE_PATHS`
in breach. **#1149 found it and added nothing to the list; #1152 closed it**, and
`scripts/check-wrapped-write-paths.mjs` now **blocks in CI**.

**So (D) is measured rather than guessed, and the measurement is not what the previous plan assumed:**
`node scripts/check-wrapped-write-paths.mjs --all` reports **60 action modules still unwrapped, blocking
80 of the app's 149 page addresses**, with 18 of the 26 admin addresses complete. **And the split by area
does not match the whole-page rule** — three admin addresses reach writes under `src/app/management/**`
through shared components, so the areas are not independently finishable. **Re-sequence before briefing
it**, and brief from the decision files rather than the item. The check's own named limit: it cannot see
a write inside an imported helper, which is exactly how `assistantLookup` hid.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration and how far production is behind: `.plan-day.md`'s
  own state block. **No batch this round carried a migration at all**, which is unusual and will not hold.
- **A release is the natural next step and it is open again**, asked once batch 8 is in. **Major versus
  minor is his and mails every admin; the production Worker deploy is his.**
- **ONE THING IS OWED TO HIM AND IS NOT A BRIEFABLE STREAM:** production has 91 labels with no Thai, and
  `scripts/draft-label-thai.mjs` (new, #1150) is the tool. The survey runs from the main checkout; the Thai
  itself comes from whoever has the list, since **no engine is reachable from a checkout**; and landing the
  drafts needs an `--access-token` for a production login holding `translations.manage`. **That token is
  his, and it is the only manual step.** Nothing is published — `propose_label_th()` never touches the live
  row.
- **Two worktrees are HELD** by sessions whose PRs merged (`assistant-record-card`, `write-paths-admin`),
  and `header-writes-wrapped` will join them. **Both are leftovers, not unsubmitted work** — a squash merge
  leaves a branch ahead for ever, so `ahead` is not the test; the PR is. **Ask before tearing one down.**
- **The backlog merge conflicted on both syncs today**, the same shape both times, resolved as the skill
  now prescribes. It is routine; do not treat it as a signal.
