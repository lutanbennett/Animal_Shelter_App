# The release-notes line now asks the Admin reader too (#nalvl), and the deploy log's encoding is written down (#utf16)

2026-11-20, stream `release-process-notes`. Step zero found both gaps still open on `main`.

## #nalvl: what changed

- `docs/test-plan-template.md`, the **Release notes.** line (label untouched, the checker finds the line by it): the opening question is
  now "a shelter user, **or an Admin or product administrator** noticing something appear, move or disappear", and it points at
  `{ text, admin: true }` and `2026-11-03-release-note-admin-flag.md`. Card tagging, `roles` closed to new notes and the
  do-not-tick-while-a-step-is-outstanding rule are unchanged: a reader was added, not the policy.
- `scripts/check-test-plan.mjs`: the existing "No release note, on the plan's word" message, printed when a user-visible PR answers `n/a`,
  now asks the same question. **A message, not a failure.** `test-plan` is advisory permanently (2026-10-20) and an `n/a` with a sound
  reason is not a wrong plan: 0.47.5's sixty-four `n/a`s were each right about shelter users. Same shape as the two existing warnings.

## Could anything have CAUGHT it rather than reminded someone? (deliverable 4; nothing built)

Concluded: **a partial, cheap check exists; not built here.** From `git diff --name-status -M origin/main`, a deleted or renamed-away
`src/app/**/page.tsx` (or a removed tile entry in `src/lib/home/tiles.ts` / the Settings tile list) is a real, mechanical signal that a
reader lost a page. A warning on "page removed, no new `unreleased` note" would have fired on 0.47.5 (the Product admin page was
deleted). Limits: it sees deletions only, not a page that merely changed what it shows; a tile removed by editing a list needs a
parse, not a path match; a deleted page that was never reachable is a false alarm (so advisory only); and it would have to read
the diff against the *release*, not the PR, to stay quiet when an earlier PR already noted it. So: worthwhile as a warning, an
S-sized item of its own, **for the planner to file**. The wording fix stands alone until then.

## #utf16 (deliverables 5 and 6)

- `docs/release-procedure.md` now says, right after the buffering paragraph, that this is a **different mechanism that bites after the
  deploy finishes**, with the size check, `tr -d '\000'` decode and the `377 376` byte-order mark as the tell.
- The `--env test` and `--env uat` `tee`s need no decode: Claude runs them from Git Bash, whose `tee` writes plain bytes. Only the
  production line Lutan runs in PowerShell 5.1 is UTF-16.
- **`deploy.mjs` writing its own log: not done, judged bigger than this stream.** It runs the build and wrangler with `spawnSync` and
  `stdio: "inherit"` (`scripts/deploy.mjs:122`, `:222`). Writing a log means piping their output, which loses the live terminal
  behaviour and the colour/TTY of the build and needs the spawn model reworked. It is the better fix (the shell's encoding
  can no longer defeat it), but it is a code change with its own risk, **for the planner to file**.
