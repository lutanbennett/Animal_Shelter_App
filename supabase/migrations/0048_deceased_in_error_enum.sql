-- Undo a death recorded in error, part 1 of 2: the placement type.
--
-- A death recorded against the wrong resident (or one that simply didn't
-- happen) could until now only be reversed in SQL: the deceased lock
-- (0026) rejects every write, and the cascade it ran — cancelled
-- appointments, ended prescriptions, ready_for_adoption cleared — left no
-- record of which rows it touched. 0049 adds the reversal as a new
-- placement event, 'DeceasedInError', rather than deleting the Deceased
-- row: placement_history is an append-only log (0001, requirements Section
-- 4.1), and the fact that a death was recorded and then withdrawn is part
-- of the resident's history. See docs/decisions.md (2026-09-21).
--
-- Only the enum value lives in this file because Postgres refuses to *use*
-- a new enum value in the transaction that added it ("unsafe use of new
-- value"), and apply-migrations.mjs runs each file as one transaction. The
-- function in 0049 inserts 'DeceasedInError' rows, so it needs this file
-- committed first — `--dry-run` of 0049 fails on its own for that reason
-- (same two-step as 0038 / 0039): apply this one, then dry-run the next.

alter type placement_type add value if not exists 'DeceasedInError';
