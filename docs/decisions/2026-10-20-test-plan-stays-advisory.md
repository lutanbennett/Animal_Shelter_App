# `test-plan` stays advisory, permanently

**Date:** 2026-10-20
**Decided by:** Lutan

## The decision

**The `test-plan` CI check will NOT be promoted to a required check in branch protection. It stays
advisory.** His words, in chat:

> *"Was already decided, another one that I need to reprosecute - we will NOT make this mandatory
> it stays as advisory"*

## What does not change

Nothing about how the check behaves. It is worth being explicit, because "advisory" could be
misread as "it does not matter":

- `scripts/check-test-plan.mjs` keeps its strictness. It goes red **only** when a plan is genuinely
  wrong — a box neither ticked nor reasoned, a placeholder, a missing signature line, a `Result:`
  that is not one of the three accepted values.
- A plan that is **complete and correct but unsigned exits 0**, as it has since 2026-09-24. That is
  the normal state for most of a PR's life.
- `continue-on-error: true` must **not** come back. The distinction lives in the script, which is
  what gets both the signal and the quiet.
- Every PR still carries a test plan. There are no exemptions, including schema-only PRs.

So a red `test-plan` is still always someone's mistake to fix. What is settled is only that it will
never be the thing that mechanically blocks a merge.

## Why this is written down at all

**Because it had already been decided and was asked again anyway.**

`CLAUDE.md` described this as a staged rollout, quoting *"see how we go, and if it is working
smoothly then we can change to a hard block"*. That is the language of a trial with a decision
pending at the end of it. Every document built from `CLAUDE.md` inherited it: the planner handover
listed "`test-plan` as a required check" under *Blocked, on Lutan*, and on 2026-10-20 a planner
asked him for an answer he had already given.

The trial ran and the answer was no. The wording that made it look open has been replaced in
`CLAUDE.md` with the decision, in the same place, so nothing downstream can regenerate the
question.

This is the same failure shape as `assistant-retention`, which sat parked for nine days because its
title still said a decision was pending, and it is why the backlog has a rule about rewriting the
title when an answer arrives. **The rule applies to `CLAUDE.md` too, not only to backlog items:** a
document that describes a decision as forthcoming keeps producing the question until the decision
is written into it.

## What a future session should do

- Do not raise this again, and do not list it as a decision he owes.
- If branch protection is ever found to require `test-plan`, **say so rather than assuming it was
  intended** — against this decision it is a change nobody asked for.
- Promoting it would now need him to reverse this explicitly.
