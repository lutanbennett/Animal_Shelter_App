# Three more SQL readers read through sqlCodeOnly

2026-11-02, `claude/sql-readers-string-literals`. Closes the Security item "three more SQL readers are blind to string literals" (after #1144 and #1183).

**How (a) was failing: OPEN.** `assertSelectOnly()` (`scripts/lib/readonly-checks.mjs`) stripped `--` comments before accounting for quotes, so `select '--' as a, (delete from t) as b` lost everything after the `--` and the guard passed SQL it exists to reject. It did not merely report wrongly; it let a write keyword through. That is why this is Security. Its docstring said "quoted strings are ignored", which the ordering made untrue. It now reads `sqlCodeOnly(sql)`.

**`dollarBodies` verdict per check** (reasoned from the code, then measured where it can be):
- (a) `assertSelectOnly`: **blank**. It reads arbitrary SQL, not migrations. A `$$ … $$` in a SELECT is a literal, and the only ways to run a body (`do`, `create function`) hit `FORBIDDEN` on the keyword outside any body. Tested: `… and do $$ delete from t $$` still throws on `do`; `select $$ delete; $$` passes as a literal.
- (b) `check-new-policy-role-names.mjs`: **keep**. A `create policy` inside a `do $$` block must not hide. Measured over every file in `supabase/migrations/` as if new: keep and blank give identical output, so nothing hides today; keep is the safe default for the future.
- (c) `check-rpc-inputs.test.mjs`: **keep**. Measured: the test passes under both, nothing differs today; keep matches the old reader, which saw inside bodies.

**One declared change to `sql-code-only.mjs`:** a new option `strings: "keep"` (default `"blank"`, so every existing caller is unchanged). (b) and (c) must read literals like `'admin'::app_role` and `default 'x'`, but must not be fooled by a `--` or `;` inside one. Output is the same length as the default, so (b) uses the default reading to find statement ends and the `keep` reading for the text, offset for offset. The deliberate-marker comment now counts only where the `keep` reading has gone blank (a real comment), so a marker written inside a string no longer excuses a policy.

**Side effect, measured:** (b) previously split statements on every `;`, including one inside a string or inside a marker's reason text. Four marker reasons were truncated at a `;`; they now print in full. The set of findings is otherwise identical over all migrations.

Tests: `scripts/sql-readers-string-literals.test.mjs` (fixture `scripts/test-fixtures/readers-dash-in-string.sql`); all three cases fail against the old readers. Production: NOT ESTABLISHED, not read; `assertSelectOnly` is exercised over every production check by `check-production.test.mjs`, which passes.
