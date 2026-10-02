# 2026-10-02: Adding `refused` to the assistant status enum is one migration file, not two

Backlog item "A volunteer turned away from an assistant write leaves no audit row", brief for `claude/schema-assistant-refused`.

## The question

The item said two files, citing PR #50 ("An enum value and the code that uses it need two migration files"). That rule exists because `alter type … add value` cannot share a transaction with anything that *uses* the value, and `apply-migrations.mjs` wraps each file in `begin … commit`.

## What was checked

`assistant_action_status` is used by one column, `assistant_actions.status` (`0070`). No check constraint, view, function, trigger or partial index mentions its values, and the RLS policies never read `status`. A grep of `supabase/migrations/` for the table finds only `0070` and the grants in `0077`. So there is no SQL *use* of `refused` to put in a second file.

## Decision

`0130_assistant_action_refused.sql` is the only file: `alter type … add value if not exists 'refused'`. The second half of the work is client code that sends the value, which is a feature branch, not a migration. If a later change adds SQL that references `refused` (a view counting refusals, say), that is the second file, in its own PR after 0130 is applied.

## Consequence for the dry-run

Because there is no dependent file, `--dry-run` of 0130 passes on its own. The "dry-run fails until the first file is committed" trap in the item does not arise here.
