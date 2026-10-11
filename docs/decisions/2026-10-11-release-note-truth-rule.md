# A release note may not run ahead of a manual step

2026-10-11. Process rule; no code, no migration. Answers the backlog item found 2026-10-10.

## What happened

#518 fixed a real drift bug (two hand-kept optional-secret lists, so two Cloudflare values reached
the Worker but not the Pi, which serves the pages) and added an admin release note: the Website
visitors tile "now shows how many people visited the website". It did not. The same PR's decision
file (`2026-10-10-one-optional-secrets-list.md`, "Not changed") says the Pi still needed two lines
by hand. `0.25.0` was cut that day, so every admin got release mail for a feature that did not
work. It was fixed as configuration only on 2026-10-10 and confirmed live.

The information was not missing. Nobody ticking §7 consulted it.

## Decided

**§7's Release notes line may not be ticked while the same PR's decision file, README or backlog
note records a step still outstanding between the merge and the user seeing the change.** Write
`n/a: <the outstanding step>` instead, and put the note in the PR that closes that step.

Why: a note is a promise to a shelter user that something now works. A tick means "the code is
in"; the note says "you can now see it". Release mail carries the second claim.

Where it lives: `docs/test-plan-template.md` §7 (asked as the box is filled in), and one sentence
in `CLAUDE.md`'s Testing section.

## Not done, on purpose

- `check-test-plan.mjs` is unchanged. It checks that a line exists, and no checker can tell
  whether a sentence is true. Grepping decision files for "outstanding" phrases was considered and
  rejected: it would catch wording, not the fact, and would look like a fix.
- `continue-on-error` is not back and unsigned plans still exit 0 (see CLAUDE.md).

## The tension, named

§7 exists because an empty `unreleased` looks exactly like "nothing visible shipped". Under this
rule a release where every PR was one step short would have an empty `unreleased` again.

It is resolved by where the `n/a` goes, not by ticking: the `n/a` reason now names the outstanding
step, so the gap is written down instead of silent. And the closing PR (the one that does the
manual step) must carry the note, so the step is itself a task that ends in a note. Rule of thumb
for the next PR that is one step short: do not ship the note; list the step in the `n/a`, and add
the step to the backlog if nothing else owns it.

Related: the "Promote `test-plan` to a required check" item is Lutan's call and is untouched.
This rule does not part-close it.
