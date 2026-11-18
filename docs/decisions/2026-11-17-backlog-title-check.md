# A backlog title is checked for length and for carrying its own history (`#ttl9h`)

**What:** `scripts/check-backlog-titles.mjs`, run from `.githooks/pre-commit` beside the sections and ids
checks, reading the **staged** file. Fails (exit 3) on an **open** item (`- [ ]`) whose title, the first
`**…**` pair, is over **320 characters** or contains `WAS:` or `SUPERSEDED`. Fails open exactly as the other
two: no node, no script, or a crash (non-3 exit) lets the commit through with a note.

**Open items only, title only.** A ticked item's title legitimately opens `DONE <date>` and carries `WAS:`;
`SUPERSEDED` in a body is required by the answering-a-decision rule. Neither is touched.

**The limit: 320, kept, and the three titles over it were rewritten rather than grandfathered.** Measured
2026-11-17 (35 open, median 176): `#b4cmn` 854, `#egq18` 478, `#3qmzt` 361; next longest 280. A limit above 854
would be a formality and an exemption list by id rots, so the three were shortened on the `backlog` branch
(old title preserved in each body under `SUPERSEDED 2026-11-17`, nothing lost). Nothing is grandfathered.

**What it cannot catch:** it measures length and two words, a proxy. Lutan's complaint was a title he could not
read; a 200-character title can be unreadable and a 100-character one clear. It will not notice a title that is
vague, jargon-heavy or three sentences long in 320 characters.

**Not in CI**, deliberately: the backlog branch never goes through CI, so only the hook sees the commits that matter.

**Found, not fixed:** `check-backlog-sections.mjs` reads `main`'s copy of the file, not the worktree's, which has
confused planners. Also `core.hooksPath` is shared, so a worktree's hook edit does not run until it is on the
checkout the path points to; the hook was proved by running `.githooks/pre-commit` directly.
