# The backlog branch may change `docs/backlog-names.json` too

**2026-11-23.** `#bkwai` gave every open backlog item a locked short name in a new file,
`docs/backlog-names.json`, and a check that fails when an open item has no name
(`scripts/check-backlog-waiting.mjs`, run by the `script-integrity` CI job and by
`.githooks/pre-commit`). It did not change the pre-commit rule that **the backlog branch may
only change `docs/backlog.md`**.

Those two rules cannot both be satisfied by anyone filing a backlog item.

## What it looked like

`CLAUDE.md` describes filing as a thing any session does at any point: edit
`C:\Development\Animal_Shelter_Backlog\docs\backlog.md`, commit there, no branch and no PR.
After `#bkwai`, that commit is refused — not for the item, but because the new item needs a
name, and the name lives in a file the branch is forbidden to touch:

```
pre-commit: refused. The backlog branch may only change docs/backlog.md, because it reaches
main with no PR, no CI and no review. Staged:
  docs/backlog-names.json
```

Removing the names file from the commit does not help: the waiting check reads the **staged**
index, finds an open item with no name, and exits 3. So the branch is wedged for new items in
both directions, and the only ways out are a PR (this one) or `--no-verify`, which is
forbidden.

It also left `main` red. Three items (`#rlbat`, `#fnbnd`, `#psubp`) were filed on
2026-11-22 **before** `#bkwai` merged at 01:42, so they carry no name, and the daily
`git merge backlog` carried them to `main`: run `45056634438` on `af4fba245` failed
`script-integrity` with six problems, and every PR cut from that `main` inherits the red.
Nobody did anything wrong — the items were filed correctly under the rules that existed when
they were filed — which is exactly why the gap had to be closed in code rather than by
remembering.

## The decision

`.githooks/pre-commit` now allows the backlog branch to stage `docs/backlog-names.json` as
well as `docs/backlog.md`.

**Why that is the right line rather than a loosening.** The restriction exists because the
backlog branch reaches `main` through a plain `git merge` with no PR, no CI and no review, so
only *data about the backlog* may travel that way — never code. `backlog-names.json` is
backlog data: a flat map of item id to a three-to-six word name, read by the checks, the
reader and the page generator, and executed by nothing. It is the same risk class as
`backlog.md`, and it is useless on any other branch. **No code path, workflow or permission
changes with it**, which is the test this file exists to record.

What is **not** widened: everything else is still refused on that branch, and the message
still names what it refused and why.

## And the check now refuses a corrupt names file instead of waving the commit past

This half was found while reading the hook, and it is the more important one.

`.githooks/pre-commit` **refuses on exit 3 and allows every other non-zero exit**, printing
"commit allowed; CI checks the PR". That is deliberate: a checker that cannot run must not stop
work. But `check-backlog-waiting.mjs` read and parsed the names file in one `try`, and
**exited 1 on a parse failure** — so a `docs/backlog-names.json` that was present but corrupt
produced a commit that passed without a single item having been verified. The guard failed in
the wrong direction, and only on the file this change now lets onto the branch.

So the two reads are now separate:

- **A file it cannot READ stays a crash (exit 1), and the commit is still allowed.** A branch cut
  before `#bkwai` has no names file at all; refusing there would block a stream from ticking its
  own item over a file it never had. A git that will not answer lands here too.
- **A file that is present but unusable is a finding (exit 3), and the commit is refused** —
  invalid JSON, a top level that is not a flat object, or a name that is not text. The message
  says the file is unusable and that *nothing at all was verified*, so nobody reads it as the
  item's fault.

`scripts/check-backlog-waiting.test.mjs` pins both halves, including the absent-file case, so a
later tidy-up cannot quietly collapse them back into one `try`.

## What was deliberately left alone

- **The names themselves stay locked.** `BACKLOG_RENAME_ALLOW=1` remains the only way to move
  a name, so a rename is still a decision rather than drift.
- **One real rough edge is left as it is, and named here so the next person does not take it
  for a bug:** the check compares `since:` against **today in UTC**, so a tag dated by the
  Thailand clock (UTC+7) reads as being in the future until 07:00 local. Anything filed in the
  local morning has to date its tag the UTC day. It is recorded rather than fixed because the
  fix is a judgement about which clock the backlog runs on, and that is worth asking rather
  than assuming.

## Why there is no backlog item for this

Filing one would have required the very commit this change unblocks.
