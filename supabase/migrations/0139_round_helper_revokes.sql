-- consumer: none
--
-- The two pure helpers 0137 created (default_frequency_round_keys, default_diet_round_keys) were
-- executable by PUBLIC, so anon could call them through /rest/v1/rpc/. Harmless (they map a number
-- to a list of round names) but the lint rule is right. 0137 now carries these two statements too,
-- for a from-scratch build; dev had applied 0137 before they were written, so this is the file that
-- reaches it. Re-runnable: revoke and grant are idempotent.

revoke all on function default_frequency_round_keys(integer, integer), default_diet_round_keys(integer) from public, anon;
grant execute on function default_frequency_round_keys(integer, integer), default_diet_round_keys(integer) to authenticated, service_role;
