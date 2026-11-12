# 2026-11-12 — Rule 3 reads the second argument of `driveErrorMessage(…, "…")`

**Stream:** `claude/rule3-second-argument`. **Items:** `#c7zjk` (the position) and `#hzmxi` (the same
job from the other end). **Neither is ticked** — both still wait on the Thai read (`#y1dqu`) and the
flip. **`RULE_3_BLOCKS` is still `false`.**

## The recall caveat this exists to defend

Rule 3 reported **0 `user`-class strings**, and that zero was really **zero of the positions rule 3
looks at**, not zero in the tree. `#c7zjk` says so in terms, and that is why a clean rule-3 run is not
on its own an argument for letting it block. **This change adds one position; it does not complete the
set.** The next reader should take rule 3's count as a count over a named list of positions, and that
list is still shorter than the tree.

## Step zero (2026-11-12, this worktree, branched at `6dd5a075`)

| | |
|---|---|
| `grep -n driveErrorMessage scripts/check-thai-dictionary.mjs` | no match — the position was **not** already taught |
| `RULE_3_BLOCKS` | `false`, at line 438, read at 560 and 580 |
| Rule 3 **baseline** | `8 prose strings in user-facing positions, 0 in the user class — 0 allowed by name, 0 to translate` |
| Rule 3 **after** | `8 … 0 in the user class — 0 … 0 to translate` — **unchanged** |

## The position, and why it is data rather than a shape

Rule 3's other positions are *shapes*: the value of `error:` / `message:` / `notice:` / `detail:`, the
argument of `NextResponse.json`, a `return` in an `actions.ts`, `setCustomValidity(…)`. This one cannot
be a shape — `driveErrorMessage(err, "…")` passes the sentence a worker reads as an **ordinary second
argument**, indistinguishable from every other argument in the tree. "The second argument of any call"
would flood the report, which is the failure this family stayed report-only to avoid, and the
2026-11-02 decision (§4) chose named positions on purpose.

So the position is **data**, in its own module: `scripts/lib/english-in-ts-positions.mjs`, holding
`{ callee, args, why }` with zero-based argument indexes, read by rule 3 through `namedArgPositions()`.
It is the "named function, named argument" list the brief anticipated, and **it deliberately holds one
entry** — the next position is a one-line change there rather than a change to the check. The matcher
resolves a call reached through an object on its last segment (`errors.driveErrorMessage`) and refuses
a callee whose name is not statically known (`a[b](…)`, `f()(…)`).

Rule 2's allow-list-by-name mechanism is reused unchanged: a survivor would be a named record in
`RULE_3_ALLOWED` with its reason, and a stale entry is reported. **`RULE_3_ALLOWED` is still empty**,
because nothing survives.

## The measurement (method and date stated, as a count without them is not a reading)

**Method.** Every `driveErrorMessage` call in `src/` was opened and read, not grepped for a verdict:
`grep -rn "driveErrorMessage(" src/` gives 14 lines, of which **one is the declaration** and **one is
`driveErrorMessage(err)` with no second argument**, leaving **12 calls that pass one**. Each second
argument was read at its call site. Classes come from `scripts/lib/english-in-ts-classes.mjs`'s own
`classify()`, run over each call site's path, **not from this stream's judgement**. Measured
**2026-11-12** on this worktree, machine otherwise idle.

| | Count |
|---|---:|
| `driveErrorMessage` calls passing a second argument | **12** |
| …passing a **string literal** (what the new position catches) | **0** |
| …passing a dictionary lookup (`t.…` / `w.…`) | **12** |
| Literals in the `user` class | **0** |
| Literals that are admin-screen English and therefore correct | **0** |
| **False positives for this position** | **0 of 0** |

The 12, by file, with the class a literal in that position *would* get:

| Calls | Would classify | Class `id` | File |
|---:|---|---|---|
| 4 | `user` | `route-and-action-messages` | `src/app/admin/website/actions.ts` |
| 3 | `user` | `drive-warning-fallback` | `src/lib/projects/drive-sync.ts` |
| 1 | `user` | `route-and-action-messages` | `src/app/admin/shop/actions.ts` |
| 1 | `user` | `route-and-action-messages` | `src/app/management/medications/actions.ts` |
| 1 | `user` | `route-and-action-messages` | `src/app/management/shelter-friends/actions.ts` |
| 1 | `user` | `drive-warning-fallback` | `src/lib/maintenance/drive-sync.ts` |
| 1 | `user` | `route-and-action-messages` | `src/app/residents/[id]/photos/actions.ts` |
| 0 | `nobody` | `developer-diagnostics` | `src/lib/google/drive-errors.ts` (the declaration, and one call with no second argument) |

**0 of 0 is an honest zero, not a measured rate.** The position reports nothing on this tree, so it
cannot yet contribute a false positive either way. It adds a watched position without adding noise;
**it is not the day of PRs that the flip's second condition asks for.**

Why zero: the 2026-11-06 plumbing (`2026-11-06-english-plumbing-archive.md`) had already moved all four
Drive-folder warnings onto `t.common.driveFolder{Move,Rename,Delete}Failed`. That decision recorded the
state exactly — *"Rule 3 still cannot see the `driveErrorMessage(…, "…")` position, but no English
remains there."* **This change closes the blind spot that sentence names.** `#c7zjk`'s precondition 2
("teach rule 3 the position, or leave as English with a recorded reason") is now met by the first limb.

### The position was proved to fire, because a blind position and a clean one look identical

A position that catches nothing is unfalsifiable from its output. Three proofs, all run 2026-11-12:

1. **Planted positive.** A literal substituted for the dictionary lookup at
   `src/lib/projects/drive-sync.ts:138` and at `src/app/admin/website/actions.ts:579`: rule 3 went from
   `8 … 0 in the user class` to **`10 … 2 in the user class — 2 to translate`**, reporting both by
   file and line. Reverted with `git checkout -- src/`; the tree is clean and the final run is `8 … 0`.
2. **Negative control.** A literal as the **first** argument of `driveErrorMessage`, and a literal as
   the **second** argument of `console.error`: rule 3 stayed at **`8 … 0`**. The position is as narrow
   as intended — it is not "the second argument of any call", and it is not any argument of this one.
3. **Unit tests**, `scripts/english-in-ts-positions.test.mjs` (9 tests): the table's shape and reason,
   what `namedArgPositions` matches, and what it must **not** match. Two guard tests: that the check is
   still wired to the table (a table nothing reads reports nothing and looks exactly like a clean
   tree), and that **`RULE_3_BLOCKS` is still `false`**.

## What was plumbed: nothing, and that is the expected outcome

**No `user`-class string was found, so no dictionary key was added and no Thai was written.** Both
`src/lib/i18n/dictionaries/en.ts` and `th.ts` are untouched. The position was blind, it is now watched,
and it is clean.

`src/lib/google/drive-errors.ts` was **read, not changed**: its signature is the same, so none of the
12 call sites moved. Two other streams in this batch (ports 3008 and 3009) call into Drive code and are
unaffected.

## Found, not fixed

- **A latent disagreement between the classifier and the 2026-11-06 admin decision.** With a literal
  planted at `src/app/admin/website/actions.ts:579`, `classify()` returns **`user`**, via
  `route-and-action-messages` (`/\/(route|actions)\.ts$/`). But
  `2026-11-06-english-strings-classification.md` §4 settled that **admin screens stay English and are
  not reported by rule 3**. Of the 12 positions, **5 sit on admin screens**
  (`src/app/admin/website/actions.ts` ×4, `src/app/admin/shop/actions.ts` ×1) and all 5 would classify
  `user`. **It is latent, not live:** all 12 pass dictionary lookups today, so rule 3 reports nothing
  and no fault exists on this tree. It would surface the day someone writes an English literal at an
  admin-screen call site, and rule 3 would then report a string the 2026-11-06 decision says is
  correct. **Not fixed here:** narrowing `route-and-action-messages` changes the classification of
  every `actions.ts`/`route.ts` in the tree, far outside this stream, and the classifier is named in
  the brief as the instrument to use rather than to rebuild. **For the planner to file.**
- **Rule 3's walker is not directly testable.** `check-thai-dictionary.mjs` runs its three rules at
  module top level, so a test cannot import `userFacingLiterals`. The repo already has the pattern that
  would fix it — `check-sql-refusal-keys.mjs` ends with
  `if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();` and exports its
  internals for `check-sql-refusal-keys.test.mjs`. Applying it here would let the position walker be
  tested against a fixture source file instead of a planted literal in the real tree. **Not done
  here:** it restructures the check's execution for all three rules, wider than this brief. The
  planted-literal runs above stand in for it. **For the planner to file.**
- **The classifier's reason for `drive-warning-fallback` said rule 3 "does not reach it".** True when
  written, false as of this change. Corrected in place in `scripts/lib/english-in-ts-classes.mjs` — a
  `why` string, not matching logic; `reads: "user"` and the `match` are untouched, and rule 3's output
  is unchanged (`8 … 0` before and after).

## `RULE_3_BLOCKS` is still `false`, and I left it

Not flipped, no flag added to flip it, and **nothing here should be read by a later session as
permission to flip it.** The conditions, from `2026-11-06-english-strings-classification.md` §5:

1. The five archive-helper strings translated — **met** (2026-11-06).
2. The four Drive-warning fallbacks decided — **met** (2026-11-06, translated), and **the position they
   sit in is now watched** (this change).
3. **A day of PRs with rule 3 reporting no false positive — NOT met.** This stream adds a watched
   position with 0 of 0 false positives; that is one run on one tree, not a day.
4. **A Thai speaker reads the 34 route strings — NOT met.** That is `#y1dqu`, a different item, worked
   on earlier today by a different stream. Nobody was asked to read Thai here.

Conditions 3 and 4 are both outstanding, so the flip waits.

## Analysis by card, not by role

Required by `CLAUDE.md`. **No card's behaviour changes**: a build-time check grants and denies nothing,
is reachable over no URL, and no code added here reads a role key or name. The word *admin* above
refers throughout to **the screens under `src/app/admin/`**, not to a role —
`2026-11-06-english-strings-classification.md` §4 is the authority, and it is about a screen.
`node scripts/check-hard-coded-security.mjs` was run and prints
`no coded security outside the Admin bypass`.

## Not touched

Rule 1, rule 2 and the `.tsx` matcher; the ~258 other `.ts` prose strings; `src/lib/manual/en.ts`
(English-only — **there is no `src/lib/manual/th.ts`**); `src/lib/releases.ts` (owned by
`general-bill-photos` this batch); both dictionaries; `docs/backlog.md` beyond the two items' retitles.
