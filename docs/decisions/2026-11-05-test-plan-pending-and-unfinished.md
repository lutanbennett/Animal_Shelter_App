# 2026-11-05 — `test-plan` stops going red for an honest `pending:` and for a plan still being written

Lutan: *"Every stream is failing test plan, how can we improve this"*.

## What was measured first

Of the **last nine red pull-request CI runs**, `test-plan` was the failing job in **four** — the
single most common red. The other causes were `card-walkthrough` (2), `hard-coded-security` (2),
`script-integrity` (1) and `public-views` (1).

Reading those four runs' logs gave **two causes, and neither was ever a defect**:

1. **`pending:` on a checklist line.** Two of the four. A stream that could not tick a check because it
   genuinely waited on somebody wrote, for example,
   `pending: Lutan's own upload after the Worker deploy`. The checker accepted only a tick or
   `n/a: <reason>` on a checklist line, so that went red.
2. **A plan still being written.** The other two, overlapping. Unfilled `<feature>`, `<name>` and
   `<yyyy-mm-dd>` placeholders and a missing `Result:` line, on a plan committed with the first commit
   and filled in as the work proceeded. CI runs on every push, so it was red in between.

## The asymmetry that made (1) worse than noise

The checker **already accepted `pending: <what is outstanding>` on the two signature lines**, printed
it under *"Awaiting a person (not a defect — nobody has looked yet)"*, and exited 0 — the comment at
`check-test-plan.mjs:466-479` set out why. The same words on a checklist line twelve lines earlier
failed.

So a stream had two choices: **go red for telling the truth, or write `n/a:` for something that was
not n/a.** That is the exact habit the `deferred:` state was invented to prevent — *"a lie in a box
labelled 'did not apply', and once that habit forms people write `n/a` for things they simply did not
do"* — and the checker was rewarding it.

## What changed

`scripts/check-test-plan.mjs` gained one collector, `unfinished`, beside `problems`, `awaiting` and
`deferred`, and four behaviours moved:

| shape | before | after |
|---|---|---|
| `- [ ] … — pending: <detail>` on a checklist line | **problem** | *awaiting a person*, exit 0 |
| `- [ ] … — pending:` with no detail | problem | **problem** (unchanged) |
| unfilled `<placeholder>` in a field | **problem** | *still being written*, exit 0 |
| no `Result:` line, or `Result:` still a placeholder | **problem** | *still being written*, exit 0 |
| signature still holding `<name>` / `<yyyy-mm-dd>` | **problem** | *still being written*, exit 0 |

The exit-0 headline now distinguishes the two: *"the plan is complete and correct, and N item(s) await
a person"* as before, or *"nothing is wrong — the plan is still being written (N line(s))"*.

`pending` is matched **on the word**, as `deferred` already was, so a bare `pending:` reports its
missing detail rather than falling through to the catch-all. `isPlaceholder()` judges by **shape**
(`<…>`), not by the known placeholder names, so a plan copied from a newer template with a placeholder
this script has never heard of still reads as unwritten rather than wrong.

## What did NOT change, and it was proven rather than asserted

Five genuinely-wrong shapes were each built as a fixture from a real plan and run through the new
checker. **All five still exit 1:**

- a checklist line unticked with no marker at all — *"unticked and not marked `n/a: <reason>`"*
- `n/a:` with no reason
- `pending:` with no detail — *"say what is outstanding and who it waits on"*
- `deferred:` outside section 8 — *"everywhere else a check is run, `n/a: <reason>`, or not done"*
- `Result: fail` — *"a failing test plan does not merge"*

A missing plan still fails, `continue-on-error` is still absent, and `test-plan` remains **advisory**
(Lutan, 2026-10-20) — none of that is touched.

**The first attempt at those fixtures was wrong and is recorded because it nearly became a false
proof.** The `sed` anchors did not match the real plan's wording, so all five fixtures were byte-identical
to the base and all five "passed" — which looked exactly like the intended result. The rebuilt
fixtures each assert `diff` against the base before being run.

All eight shapes — the two that now pass, the five that still fail, and a baseline that proves the
failures mean something — are pinned as a test, `scripts/check-test-plan-states.test.mjs`, so a later
widening cannot quietly undo this. Its minimal plan is written in the test rather than copied from the
template, so a template edit cannot change what the test asserts.

**One message wording is deliberately unchanged, and the first gates run is why.** `test` exited 1 on
`scripts/test-plan-template.test.mjs`, which matches the placeholder message text to prove placeholders
are reported on fields and never on the template's guidance prose (`#0f0ey`; #1285 hit it three pushes
running). Rewording the message to read "not filled in yet" broke that match. **The wording was put
back rather than the test rewritten** — the test is a real guard and only the message's *severity*
needed to move — and a comment at the call site now says so.

## The three real plans

Each was taken from the commit whose CI run went red and fed to both the old and the new checker:

| plan | old | new | why |
|---|---|---|---|
| `control-listing-sweep-9` | exit 1 | **exit 0** | one `pending:` line, no `Result:` line yet |
| `video-upload-csp` | exit 1 | **exit 0** | `pending: Lutan's own upload after the Worker deploy` |
| `fundraising-events-website` | exit 1 | **exit 1** | four placeholders now read as unwritten, **but it ticks the release-notes line with no release note** — a real defect, and the one red that should stay |

That third row is the point of the change: the noise is gone and the one genuine fault is now the only
thing printed. (Its release-notes judgement is made against this branch's diff rather than its own
PR's, because it was run as a fixture — the placeholder behaviour is what that row demonstrates.)

## Why this is the same decision as 2026-09-24, not a new one

That day an unsigned-but-correct plan stopped failing, for a reason written into `CLAUDE.md`: *"a red
people are emailed about hourly is one they filter"*, and suppressing the job with
`continue-on-error` lost the real signal along with the noise — so the distinction belongs **in the
script**. An unfinished plan and an honest `pending:` are the same category as an unsigned plan:
**not yet**, not **wrong**. Red now means a plan that is missing, incomplete in the sense of being
self-contradictory, or untruthful.
