# The SQL-reading checks know what a string is, and `translations-open` tests its code, not its data

2026-10-31, `claude/check-scripts-not-blind`. Two backlog items under Security, one class of fault: a trusted check printing
something untrue.

## The answer to the question that mattered: YES, the blocking check could report a false GREEN

`check-hard-coded-security.mjs` is the check that fails the build. Before this change it read each migration line by line with
`replace(/--[^\r\n]*/, "")`, which knows nothing about quotes, and it never handled `/* */` at all. **Demonstrated, not argued**: a
migration file was dropped into a scratch copy of the repo (`supabase/migrations/9999_x.sql` plus the registry and `can.ts`) and the
real script was run against it. Each of these printed nothing about the file and the run stayed green:

| # | Migration text | What the old check did |
|---|---|---|
| A | `comment on table t is 'a -- b'; create policy p on t for select using (true);` | the `--` in the string stripped the rest of the line, so **the open policy was never seen** |
| B | `create policy p … /* has_permission('x') */ using (true);` | the gate test found `has_permission(` inside a block comment and passed it |
| C | `create policy p … using (note = 'has_permission(' or true);` | the same, from inside a string |
| D | `create function f() … security definer as $$ select 1 /* has_permission() */ $$;` | a commented-out gate satisfied the definer test |
| E | `select '--'; grant select on public.t to anon;` | **the grant to `anon` was never seen** |

Controls: a plain open policy and a plain `grant … to anon` were both flagged by the same harness, so the harness itself works.

**Nothing real was hiding.** On the 36 migrations from `0262` the output is byte-for-byte identical before and after the fix, so the
blindness had not let a live finding through. That is the whole good news: it was a hole, not a leak. It would have stayed invisible,
because a green is not investigated.

## What was built

- `scripts/lib/sql-code-only.mjs` (`sqlCodeOnly`), one reader for both scripts. It blanks `--` comments, nested `/* */` comments,
  the contents of `'…'` strings (`''` doubling and `E'…'` escapes handled) and, by default, `$tag$ … $tag$` bodies. Newlines are kept,
  so line numbers stay honest. `dollarBodies: "keep"` scans a function body as code (still blanking comments and strings in it); the
  blocking check needs that, because it reads a `security definer` body for its gate. Double-quoted identifiers are left alone.
- `check-migration-grants.mjs` uses it for `stripSql`, so `sql.split(";")` can no longer split inside a string. It lost nothing it
  used to see: still `ok (219 file(s) checked)`.
- `check-hard-coded-security.mjs` uses it in place of the per-line strip. Its startup guard now also proves a string `--` and a block
  comment are handled, and that the statement after a literal `--` survives.
- `scripts/sql-code-only.test.mjs` runs the real blocking check against A–E and against two compliant forms (a policy and a definer
  function that call `has_permission`), so the hole cannot reopen unseen.
- `translations-open` (`scripts/lib/readonly-checks.mjs`): the arms and a new `taught(table_name, column_name)` list are both
  **generated from one JS array**, `TRANSLATION_ARMS`. `uncovered` reads `taught`. The item suggested a `values` list that the arms and
  the `not exists` both read; that still leaves the arms and the list as two hand-typed things that can disagree. Generating both
  from one row each means a pair cannot be in one and not the other. `scripts/translations-open-arms.test.mjs` pins that.

## Measured (database: DEV, `qxkmhwybjggxvsfxsxbd`, `--env test`; production is the planner's to re-run)

- With the `memes` arm emptied (`from memes where false`) the **old** check reported `uncovered: ["memes.caption_en"]`; the **new**
  one reported `[]`. That confirms the mechanism the item deduced from the SQL: an empty table made its taught pair read as untaught.
- With `('memes', 'caption_en')` removed from the taught list only, the new check reported `["memes.caption_en"]`. A genuinely untaught
  pair is still named.
- Headline on dev, unchanged by the change: 520 missing, 2 out of date; `Every registered label pair is counted.`
- While doing it I dropped the `zones` arm by mistake (its line ends `),` and my extraction pattern missed it); dev reported
  `zones.name` as untaught, which is the check doing its job, and it is restored. The test above would also catch it now.

## Not done, on purpose

- **`label_drafts` is not taught.** Its trigger has now fired (production is at 296 of 296, so `0293` and `0294` are applied), but it
  is its own backlog item with its own recorded edit. Left alone; the planner can schedule it.
- `0292`'s header still carries the "no `;` or `--` in comment strings" convention note. An applied migration is never edited. The
  note is now unnecessary and harmless.

## Found, not fixed

`scripts/check-roles-columns.mjs:31` has its own `stripSqlComments = s.replace(/--[^\n]*/g, "")`, the same blindness. Out of scope for
this stream and not a blocking check; filed as a backlog item.
