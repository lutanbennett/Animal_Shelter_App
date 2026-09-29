# 2026-09-26 — Moving the standard diet is an RPC; `record_intake` refuses a missing diet (`0090`)

- **A second schema PR for one feature.** The feature brief said "add no
  migration", but two parts of the item can only be done in the database:
  moving the standard as clear-then-set in one transaction (supabase-js has
  no transactions), and refusing a null diet in `record_intake`, which
  `0087` deliberately left for later. Lutan chose a small schema PR first
  over dropping either part or breaking the schema-first rule.
- **`set_standard_diet(id)` clears the old row, then sets the new one**, as
  two statements inside the function, because the partial unique index is
  checked row by row. The second update's row count is checked, so an
  unknown id rolls the clear back too and the old standard stays. Re-setting
  the current standard succeeds as a no-op. There is deliberately no "clear
  the standard" call: zero is tolerated (`0087`) but nothing aims for it.
- **The role check is inside the function**, null-safe, as in `0088`: RLS
  alone would filter a staff caller's updates to nothing and answer "not
  found" instead of "not authorized".
- **`record_intake` keeps its signature**, `p_diet_type_id … default null`
  included: it sits among defaulted parameters, so removing the default
  would mean reordering them, and `create or replace` on the same signature
  keeps `0082`'s grants (the harness compares them before and after). The
  null check is the body's first statement, before anything is written.
