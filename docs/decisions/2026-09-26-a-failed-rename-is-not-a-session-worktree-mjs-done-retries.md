# 2026-09-26 — A failed rename is not a session: `worktree.mjs done` retries the probe and says when nobody holds the folder

- **Diagnosis.** `held()` renames the folder to a sibling and back; Windows
  refuses while anything has it open. On 2026-09-25 it flipped
  false/true/false within one run of `done`, milliseconds apart, with
  nothing in the folder, and `done` refused five merged, clean worktrees
  that `list` had just called `free`. The likeliest holder is git
  validating `.git/worktrees/<name>` from the main checkout, or an
  indexer/antivirus handle. Not reproduced on demand, so it was modelled with
  a holder that takes the folder for 300 ms and drops it for 300 ms.
- **The message was the real defect, not the flakiness.**
  `describeHolders()` fell back to "a process that cannot be identified —
  usually a Claude session or terminal" whenever nothing could be named, so a
  probe with no holder at all read exactly like a live session. The operator
  closes unrelated sessions and then reaches for `--force`. Now the unnamed
  case says what is actually known: *Windows refused to rename or delete the
  folder, but no Claude session or dev server could be found in it; usually
  transient; `list` may show it free; re-run, `--force` is not the fix;* and
  what to look for if it keeps refusing (a plain terminal or editor, or a
  session file this script cannot read). The named case is unchanged and
  still refuses: that is the check working.
- **Retry, then refuse — never downgrade to a warning.** `held()` tries
  four times over ~450 ms; `done` gives an unnamed refusal six more tries
  over ~2 s. A session or terminal holds a folder for minutes, so the delay
  costs nothing when the refusal is real and absorbs a transient handle when
  it is not. `list` uses the same retrying probe, so the two agree more often
  too.
- **`done` does not reuse `list`'s `held` value** (option (d) in the
  backlog item). `list` is a snapshot from another process, possibly minutes
  old, and a session may have attached since; trusting it would reopen the
  race the probe exists to close. The message names the disagreement instead.
- **The rename back is retried** for ~2 s. The same handle that can refuse
  the first rename can refuse the second, and a worktree stranded under
  `<dir>.__worktree-probe` is worse than a slow probe.
- **Measured, not reasoned:** under the flickering holder the old script
  refused 3/3 at the probe with the old message; the new one got past the
  probe 3/3. The deletion then failed, because that holder keeps grabbing the
  folder for a minute (far longer than a real transient handle), and `done`
  said so, left the branch, and a re-run with the holder gone cleared all
  three.
