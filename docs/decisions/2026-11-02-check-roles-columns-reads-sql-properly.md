# check-roles-columns reads SQL through sqlCodeOnly, dollar bodies kept

2026-11-02, `claude/roles-columns-sql-blind`. Closes the third check found blind to string literals (after the two fixed in #1144).

- `scripts/check-roles-columns.mjs` stripped comments with `s.replace(/--[^\n]*/g, "")`. A `--` inside a string cut the rest of the line, so a column added after it was never seen. It now uses `sqlCodeOnly(sql, { dollarBodies: "keep" })`.
- **keep vs blank, measured:** for every file in `supabase/migrations/` the number of `create table roles` / `alter table roles …;` statements was counted under both options. Zero files differed, so no migration names a roles column inside a `do $$ … $$` body today. **keep** was chosen anyway: the old reader saw inside bodies, and blank would silently stop seeing any future `alter table roles add column` in a `do` block, which is the same blindness in a new place.
- Proof: `scripts/check-roles-columns.test.mjs` shows the old regex loses `legacy_flag` in `scripts/fixtures/roles-columns-string-dashes.sql` and that the check, run on that fixture, passes a select of it.
- Bare `process.exit()` left alone: the check makes no network call, so the Windows libuv trap `scripts/lib/exit.mjs` guards against cannot occur.
- Other readers still blind (found, not fixed here): `check-new-policy-role-names.mjs:76` (`line.replace(/--[^\r\n]*/, "")`), `check-rpc-inputs.test.mjs:10`, `lib/readonly-checks.mjs:18` (`/--.*$/gm`).
