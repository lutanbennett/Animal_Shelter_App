# Every stream brief carries a pre-push test-plan block

2026-10-12.

## What changed

`.claude/skills/plan-day/SKILL.md` step 7 now requires every `.brief.md` to end
with a fixed block: fill the test plan in completely, run
`node scripts/check-test-plan.mjs` and `node scripts/gates.mjs`, fix what they
print, and *only then* push and open the PR. The block names the four format
traps verbatim.

## Why

Lutan, 2026-10-12, in the `/plan-day` chat: *"the streams seem to be making
errors in the test plan when they submit the CI. Can we add something into the
brief that gets them to make sure it's right before they submit the CI rather
than us reworking all the time."*

**Six commits across batches 94 and 95 were spent fixing a test plan after CI had
already gone red, and every one was about format rather than content:**

| commit | subject |
|---|---|
| `15b5ef9f` | Test plan: fix the CI line so the checker accepts it |
| `d98c3317` | Test plan: sign-off line in the format the checker reads |
| `d1175619` | Test plan: gates and SHA |
| `be8948e4` | Fix proxy.ts type error; record gates in the test plan |
| `36dce481` | Test plan: gates result |
| `7c613d74` | Test plan: the manual-verification tick gets a reason while it is pending |

All six were catchable locally with one command before pushing.

## Why the brief and not somewhere else

`CLAUDE.md` already says *"`node scripts/check-test-plan.mjs` is what CI runs —
run it locally before pushing."* That line has been there throughout, and the
rework still happened six times. **The brief is what a fresh session reads
first**, and the briefs said nothing about it, so this is the planner's gap
rather than the streams'.

Three places were considered and rejected:

- **Loosening `scripts/check-test-plan.mjs`.** Forbidden by `CLAUDE.md` at
  length, and rightly: its strictness is what makes a red check meaningful, and
  `continue-on-error` must not come back.
- **Changing `docs/test-plan-template.md`.** The template is copied into every
  plan; adding process instructions to it would put them in the committed
  artifact of every PR for good, where they are noise.
- **Relying on `CLAUDE.md` harder.** Already tried, by being there. Repetition in
  the place the session actually starts is what was missing.

## The trap that justifies naming the traps individually

**Three of the six commits were the same invisible one.** The sign-off line's
regex is `^<label>:[ \t]*(.*?)[ \t]{2,}Date:[ \t]*(.*)$`
(`scripts/check-test-plan.mjs:361`) — it needs **two or more spaces** before
`Date:`. One space fails, and one space is indistinguishable from two on screen.
No amount of care catches that by eye, which is why the block names it in capitals
rather than saying "check the format".

## One legitimate follow-up commit remains, by design

The template's own CI line says a green CI tick **cannot** be true in the commit
that creates the PR, and must be left `n/a: not yet — the PR does not exist at
this commit` and ticked afterwards. **That follow-up is correct and is not what
this decision is about.** The block says so explicitly, so a stream does not
read "do not push between steps" as licence to pre-tick a green it has not seen.

## How we will know it worked

The next batch's PRs should each have **one** test-plan commit, not three. If
rework commits keep appearing, the block is being written but not read, and the
answer is a gate rather than a paragraph.
