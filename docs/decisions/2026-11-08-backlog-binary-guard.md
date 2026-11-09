# The backlog guard refuses control bytes, and the file is pinned to text

Backlog item `#ayl1h`. Branch `claude/backlog-binary-guard`.

## What happened

On 2026-11-07 a grooming commit stored `docs/backlog.md` as CRLF and its diff
rewrote all 1,517 lines for a 24-line change. The cause was one `0x08` byte —
a JavaScript `"\b"` where the two characters `\b` of a Windows path were meant.
Git saw a control byte, classified the whole file as binary
(`git ls-files --eol` answered `i/-text w/-text`), and `core.autocrlf` does not
convert a binary file. It sat there for weeks. Throughout,
`scripts/check-backlog-ids.mjs` answered `ok`, and the 2026-11-03 decision file
said both backlog scripts reported any control character. They reported a
trailing CR and nothing else.

## What changed

1. **`check-backlog-ids.mjs` reports every C0 control character except TAB and
   LF, on every line** (item lines or not), naming line, column, byte in hex
   and the 30 characters before it. **CR is allowed only as the last byte of a
   line**: the existing trailing-`\r` strip stays, so a Windows working tree is
   not a finding, and any CR still present after it is a lone one — the
   2026-11-03 fault, now caught rather than found by luck.
2. **`.gitattributes` pins `docs/backlog.md` to `text eol=lf`.** An explicit
   `text` attribute overrides git's binary guess, so even a byte the check
   does not know to look for cannot switch the normalisation off again.
   Measured: with a `0x08` planted and staged, `git ls-files --eol` still read
   `i/lf … attr/text eol=lf` and the staged diff was 1 line. The two guards are
   independent; either alone would have prevented the 1,517-line commit.
3. The over-claiming sentence in `2026-11-03-backlog-item-ids.md` is struck
   through and corrected in place, dated.

## Refuse, not warn — and why

The item left this open. **It refuses (exit 3).**

- **A control byte in Markdown is always damage.** There is no legitimate
  reason for one in this file, so a refusal has no false positives to tire
  people out, and the fix is deleting one byte, which the message names to the
  column.
- **A warning is the fault this item is about.** The check said `ok` for weeks
  and nobody read past it; a warning in a pre-commit hook that lets the commit
  through scrolls past in the same way, and in CI a passing job with a warning
  in its log is read by nobody.
- **The fail-open shape is unchanged and still right.** The hook lets a commit
  through only when the script *crashes* (any exit other than 0 or 3) — that
  protects every stream from a broken guard. A finding is not a crash. This is
  the same contract `check-backlog-sections.mjs` and the migration-number check
  already use.
- **In CI (`script-integrity`) it goes red**, which is what should happen: a
  byte that reached `main` would otherwise sit there silently again. The cost is
  that a byte reaching `main` (via the `backlog` branch, which has no CI) would
  redden every open PR's `script-integrity` until removed — but the pre-commit
  hook runs on the `backlog` branch too, so it is refused before it gets there.

## The hook was proven, not only the script

`core.hooksPath` is `C:\Development\Animal_Shelter_App\.githooks` — the main
checkout's hook, not this branch's. **The hook file itself is unchanged**, and
it calls `scripts/check-backlog-ids.mjs` by a path relative to the worktree,
so the live hook runs whichever checkout's script is committing. Both
`sh .githooks/pre-commit` and the live hook were run here against a staged
`docs/backlog.md` carrying a planted `0x08`; both printed the line, column and
byte and exited 1. On `main` and on the `backlog` branch the new script takes
effect when this merges and they pick it up — the backlog worktree at its next
fast-forward to `main`.

## No new line in `CLAUDE.md`

The item mentioned one. Not added: the rule ("check `git ls-files --eol` says
`i/lf`") was a manual check that stood in for a missing guard, and the guard now
exists twice over — the script refuses the byte, and the attribute keeps the
file text regardless. A prose line telling sessions to check what a hook and an
attribute now enforce would be one more paragraph in a file that is already too
long to be read reliably. The script-editing advice (normalise `\r\n` first) is
carried by the backlog manager's own notes and is unchanged.
