# Planner handover — edition `519`, 2026-10-31

**A delta, thirtieth edition in this shape. Nine streams** — three batches of three, one day.
**Six are measured and all six ran `opus` / `medium`, not the Sonnet/low `510` reported**; batch 3
was set up at the end and its three figures belong to you. `510`'s subject was *a PR body is a claim
about the repo too*. **All six of its warnings fired or held, and none failed.** This round's subject
is narrower and it cost 85%: **before you charge a band for a proof, ask whether the environment
holds what the proof needs.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `510` → this. **The next slug is `528`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: DOES THE ENVIRONMENT HOLD WHAT THE PROOF NEEDS?

**`assistant-v2-tools`: banded 150–190k (188–238k adjusted for `medium`), came in at 440,348 — the
worst miss in four rounds.** The cause is in its own PR body and it is not the code. To draw the
add-a-prescription card it needed a language model; **dev has none**; so it **wrote and ran a
scripted OpenAI-compatible server from its session scratchpad** behind `ASSISTANT_LLM_PROVIDER`, and
restored `.env.local` afterwards. That is the skill's dearest axis — *must it BUILD the instrument?*
— and I priced the stream as *a new integration on existing machinery* plus the standard ~30k for
browser verification.

**I wrote "driven in the browser" into its deliverable 7 without asking what a prescription card
needs in order to draw at all.** The code was an ordinary feature; the apparatus for proving it
existed nowhere.

**Three rules already in the skill point at this and none of them covers it.** *Who can actually run
the proof* is about production. *A brief asking for real browser verification adds ~30k* assumes the
browser can reach the thing. *Must it build the instrument* is written about the deliverable, not
about the verification. **So this is the fourth, and it belongs in `Token estimates`: when the brief
demands a proof, ask whether this environment can run it — and if the stream must stand up the
apparatus first, that is an instrument, at instrument prices.** One reading. Say so when you quote it.

**The counterweight, so it is not read as "widen everything":** the other two streams of that batch
were banded by the same method on the same day and **both landed inside.** The method is fine; I
skipped one question.

## THE FLOOR NO LONGER NEEDS A LIVE PROCESS, AND THAT RETIRES A WHOLE CLASS OF LOST FIGURES

**`tokens − messages` from the `stream-usage:` PR comment gives the floor, and across six streams in
two batches it read within 1.1k:** 102,168 · 102,168 · 103,241 (batch 1) and **103,245 · 103,245 ·
103,245** (batch 2 — identical to the token on all three).

**Why this matters more than the number:** the skill devotes several paragraphs to the race between
reading `get_usage` and a session's process exiting. **The floor was the part of that reading you
could not reconstruct once the process had gone.** You now can, from a comment that is durable and
tied to the PR for ever. **Promote it into step 2:** *the floor is `tokens − messages`; you never
need a live process for it.* `510`'s ~102k is **confirmed, not corrected**. Re-derive it; never
carry the number forward.

## THE SINGLE MOST VALUABLE SENTENCE WRITTEN INTO A BRIEF THIS ROUND

The permission-props item named eight call sites where a JSX shorthand passed an unconditional yes
into a prop meant to be able to say no. **I wrote into the brief: *"some of these eight may be
correct."***

It came back with **nine** — its own tag-aware scan beat my line-anchored grep by a third — and
**verdicted all nine SAFE**, each with the activity its action actually asks, read from the action
body or the RPC rather than from the control's label. **No button changed for any login in either
direction, and nothing went into `docs/card-access-faults.md` because there was no hole.** It still
wrote every prop out explicitly — each was correct only by accident of where its component renders —
and built `scripts/check-permission-props.mjs`, which would have caught the hole that started the
item.

**Had the brief implied all eight were faults, it would have "fixed" nine working things.** The skill
already measured that a third of one stream's rows were correctly left alone (#1103). **This is that
rule in its positive form, and it is cheap: one clause, and the stream is free to report "safe".**

## WHAT `510` ASKED FOR, and what each warning did

- **"Before you write 'done' against a deliverable, open the file and look." HELD, and the evidence
  is weak on purpose.** I spot-checked three "done" claims across the three PRs and all three were
  true. **But the absence of a false claim after one round is not proof the clause caused it** — a
  round with no fault looks identical to a round where the clause did nothing. **Keep it and keep
  checking.** Four rounds of spot-checks have now all come back true.
- **"A stream can REPORT; only the planner can FILE." FIRED, and it produced both of this round's
  filings.** Two findings sat in PR bodies and on no item: that **no card grants `assistant.record`**,
  so no login but Admin can confirm any assistant write — which makes six streams of assistant work
  unusable by anyone else — and that the manual's assistant topic is behind. **The first was recorded
  only inside a TICKED item**, as *"the only open thing is a separate card fault"*. **Nobody re-reads
  a ticked item.** That is `510`'s rule and the skill's invisible-sub-note rule arriving at the same
  place from different directions.
- **The declared-crossing clause. FIRED, first time of asking.** One stream crossed into another's
  file for two lines and gave its PR a *Declared crossings* heading naming three paths and why.
  **This is the mitigation that closed 2026-10-30's unchecked-prohibition interruption. It is now
  mechanism; put it in every brief.**
- **An open question belongs in the NUMBERED DELIVERABLES. FIRED, three for three, twice.** `510`
  asked you to confirm its second test; it held, and batch 1's three each answered a real question in
  deliverable 2. **Three rounds, no miss. Treat it as settled and stop re-testing it.**
- **Count interruptions as a cost of the brief. HELD AT ZERO FOR TWO CONSECUTIVE BATCHES** — six
  streams, nothing a brief should have settled reached Lutan. **That is `CLAUDE.md`'s "two touches"
  arithmetic applied to a batch, and it is the first time it has held twice.**
- **Ban the file, not the folder. HELD.** Named `scripts/lib/exit.mjs` by path in every brief; nobody
  re-diagnosed the libuv exit trap, and one stream wrote *"it makes no `fetch` of its own, so
  `exit.mjs` does not arise"* — which is the rule working at the level of reasoning, not obedience.
- **"Pin the scope when you record his words." FIRED.** His label answer is recorded as *short
  labels*, not as *translations*, so nobody reads it as a ruling about the whole queue.

**The `+25%` adjustment for a `medium` stream now has six readings across two batches: five inside
and one 0.6% over.** `510` introduced it as an adjustment rather than a measurement. **It has earned
promotion into the skill's `Model and effort`** — band at Sonnet/low, state the adjusted figure
beside it, and never quote a low band at a medium stream without saying so. **Do not "fix" an
overrun by recommending `low` harder: the dials are Lutan's and `never-block-paid-usage` is a hard
rule.**

## AN ITEM'S TITLE CAN BE MADE STALE BY YOUR OWN MORNING'S WORK

`check-stale-titles.mjs` flagged nine titles. **I read all nine and exactly one was genuinely
lying** — the rest already say "ANSWERED" or name whose job they wait on, which is the heuristic
behaving as documented.

The one that lied was the Pi failover item, and the reason is the lesson: its head said the work was
blocked on a CPU measurement *"(needs `wrangler tail`, Lutan's login)"* — **a measurement I had taken
myself four hours earlier, at his instruction, with no login of his.** Anyone skimming would have
read a whole programme as still blocked.

**So the habit is not only "re-read the titles of items a STREAM touched".** It is: **re-read the
title of any item YOU changed the facts of.** The planner is the role most likely to settle something
and least likely to re-read the sentence that announces it. **Two minutes, nine titles, one real fix.**

*(Also corrected while I was in there: `#1120` reported the Cloudflare login as `user (read)` /
`account (read)`. **It is not read-only** — it carries `workers (write)`, `workers_scripts (write)`
and `workers_tail (read)`, which is exactly why the measurement needed nobody. Do not carry that
claim forward.)*

## HIS DECISIONS THIS ROUND — all recorded on the backlog; never re-ask

- **Short labels get the draft-then-approve step. YES.** Asked plainly whether a proposed Thai label
  should be able to sit on the screen marked as waiting, the way longer text already does. **What it
  unlocks is the point:** 72 proposed labels can then be entered by a session and read by his wife
  **on the screen**, with approval a press from his login, instead of being read in a document on his
  Desktop and typed in by hand. Needs a migration, so it cannot share a batch with another schema
  stream.
- **Option 5 of the Pi failover — writes always on the Worker — is OUT.** He asked for the
  measurement and it is dead: a ten-row stocktake save returned `exceededCpu` and the user was shown
  *"Couldn't reach the server — no signal?"*. **The programme stands as he decided on 2026-10-19:
  option 1, idempotent saves, drills first.** Nothing is owed and nobody re-runs it.
- **Batch 3's third stream = Pi failover (B).** He chose it over two candidates that arrived the same
  day, both of which also needed the one migration slot.
- **Still his, still small, do not re-ask inside a week:** whether a release note should be able to
  say "admins only" (raised 2026-10-30). **And one new, to put ONLY when that item is next briefed:**
  which card should hold `assistant.record` — the `assistant` card, restoring the pairing a card
  review deleted, or a separate card for *acting* as against *asking*?

## ONE SMALL THING FOR THE SKILL'S TRAP LIST

**A quoted bash heredoc collapses double backslashes.** `[^"\\]` written inside `<<'EOF'` reached
node as `[^"\]` and died on an invalid regular expression. **It fails loudly only because it is a
regex; in prose it would have silently changed the text.** **Write any script containing escapes with
the Write tool and run it by path** — the same conclusion the skill already reaches for `node -e` and
Windows paths, by a different route.

## STATE, RE-READ EVERY TIME

Everything factual is in `.plan-day.md` and the repo. **Do not quote any of it from here.** Batch 3
is live and its three figures are yours. **Two things that will look like faults and are not:** the
Thai dictionary PR is designed to sit open waiting on a bilingual read, and one merged folder is a
leftover only Lutan can release, because a session is still open in it.
