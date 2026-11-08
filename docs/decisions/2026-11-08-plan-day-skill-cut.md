# The plan-day skill is cut from 2,176 lines to 331, and the rest moves beside it

**2026-11-08. Lutan's instruction, after the third time in one day he had to ask where his plan was:**
*"Yes cut down the skill and then we can build back in if needed later"*.

## Why

He asked, in order: *"I'm getting annoyed, we never agreed on the 3 batched today and you told me that I
missed doing teh last batch from yesterday but now you are moving to batch 2"*; then *"Where is my plan
for today"*; then, after being handed a long report with the list inside it, *"You haven't given me the
batch 2 list yet - why are we having so many issues with the process"*.

**The honest answer, which he accepted, is that the planner had been working to satisfy
`.claude/skills/plan-day/SKILL.md` rather than to deliver to him.** Three concrete failures that day, all
the same shape:

1. Two `/plan-day` runs **resumed a plan he had never been shown.** The resume path says *"report what
   changed, then go straight to step 2 and set that batch up"* and has **no step that shows him
   anything**, so §6's mandated `AskUserQuestion` never fired. `.plan-day.md` is a file he cannot see
   from the chat.
2. The planner told him he had **missed** a batch. It had been written at 02:30 that same morning and
   nobody had told him three folders were waiting.
3. The batch-2 list was written, then **referred to as "above"** in a later message instead of being
   given again.

**The size is the cause, not a side effect.** `SKILL.md` was **2,176 lines** against **178** for
`upload-blood-work` and **228** for `clean-streams` — ten times its siblings. Every line had been added
after a single real incident, and each was individually defensible. Collectively they crowded out the
delivery the skill exists to produce: three folder names, three ports and three dial settings.

**This had been diagnosed before and the fix did not work.** On 2026-11-07, after the same fault four
times in one day (*"Background work is to be done after - I don't know how many times I need to repeat
myself"*, then *"So this is the 4th time today, There is something wrong with your instructions"*), the
file was **reordered** so that setting the batch up became step 2, ahead of the paperwork. **Reordering
did not fix it.** That is the finding worth keeping: the problem was never the order of the steps but how
many of them competed for attention.

## What was done

**`SKILL.md` keeps only what changes what a planner DOES**, and opens with the rule it kept breaking:
**the list comes first**, before actuals, findings, bands or prose, verified from the `.port` files rather
than quoted from memory, and never replaced by a pointer at an earlier message.

Two sibling files hold the rest. **Neither is loaded with the skill**, so they cost nothing at load time
and can be read when needed:

- **`brief-blocks.md`** — the nine verbatim blocks every `.brief.md` carries, in the order they go in,
  each with one line on where it goes and why. **Extracted from the old `SKILL.md` by script rather than
  retyped**, with guards asserting that the test-plan and finish-line blocks survived, so the text a
  stream reads cannot drift from the text that earned its place.
- **`reference.md`** — the incident behind each surviving rule, the measured band readings, the two
  superseded trials (the planner starting sessions; one-go-for-all-nine), the production-handling rules,
  the `.plan-day.md` editing traps, and the fallback usage reading.

**A "HIS DECISIONS — SETTLED" section is new**, and is the one structural addition. Eight of his rulings
were previously scattered across hundreds of lines, which is how one of them came to be put to him again
as an open question on 2026-10-20. They are now in one short list at the top.

## What is deliberately NOT lost

- **Every decision of his was checked across the three files after the cut**, by grepping for his own
  quoted words — the turns-not-tokens ruling, *"Keep recommending low"*, *"unethical for you to block the
  usage I paid for"*, the card-not-role rule, `test-plan` staying advisory, the handover delta.
- **The full 2,176-line edition is in git history**, which `reference.md` points at by command. "Build
  back in if needed later" is a copy-paste, and `SKILL.md` says that adding to it means taking something
  else out.
- **The YAML frontmatter was restored byte-for-byte from git** after the first write dropped it. The
  harness strips frontmatter when it injects a skill, so it was never visible in the working copy — a
  skill without it is not discoverable, and this was caught by checking rather than by it failing.

## One rule is new, from the same day

**A saved plan is not an agreed plan.** A resume must present the batch before setting it up **when a
different conversation wrote `.plan-day.md`**, because to him nothing was ever proposed. A resume by the
conversation that planned it may still go straight to setup.

**And one rule is corrected.** The daily `git merge backlog` conflict resolution said *"keep `main`'s
ticked line, drop the backlog branch's stale copy"*. On 2026-11-08 that was wrong for one of three
conflicting items: two were newer on `main` and `#xkfsv` was newer on `backlog`, because his answer had
been filed there that morning. It now says to take each item from its **newer** side and guard that
nothing is lost.

## The risk, stated plainly

**A rule that was in the file and is now only in `reference.md` will be followed less often**, because
`reference.md` is read on purpose and `SKILL.md` is read always. That is the trade he asked for. The
mitigation is that `SKILL.md` states each such rule in one line and names the file that explains it, and
that anything with teeth — the four ways a figure is not a band reading, the snapshot rule, the brief
rules, the counter, the bands — stayed in `SKILL.md` rather than moving.

**What to watch, and it is the next planner's job to report either way:** does a round go by in which a
rule that moved to `reference.md` gets broken? If so, move it back and take something else out.
