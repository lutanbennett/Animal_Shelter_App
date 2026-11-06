# Who owns a Dependabot PR

2026-11-06, `claude/dependabot-pr-ownership`, backlog `#d3v8b`.

## Step zero
Not already built. `2026-10-07-dependabot-prs-carried-on-a-branch.md` covers *how* to carry one once someone
has it, and proposed the `test-plan` exemption; nothing said *who looks* or *when to merge*.

## Taken
- **(a)** `/plan-day` step 2 now runs `gh pr list` and names every open PR the session did not open.
- **(b)** `CLAUDE.md`, "A bot pull request (Dependabot) is owned by whoever meets it": merge when `MERGEABLE`,
  only `test-plan` red, and every pinned hash resolved to its real tag; read first anything touching
  `package.json` / `package-lock.json`.

## Rejected: (c) exempting bot PRs in `check-test-plan.mjs`
CLAUDE.md says "no exemptions" and not to reopen without asking Lutan; the 2026-10-07 decision left it
proposed for that reason. Visibility is solved by (a) and the meaning of the red by (b), which says plainly
that `test-plan` is the expected red on a bot PR. An author-keyed skip is a new exemption for little gain and
would need fixtures proving nothing else loosened. Not done, on purpose.
