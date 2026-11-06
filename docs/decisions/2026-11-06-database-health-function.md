# 2026-11-06 — `database_health()`: two numbers for the health endpoint

Backlog `#mzu7v`. Home Assistant is to see database size (against the free tier's 500 MB) and open connections
without ever holding a database or service-role key, so the app's read-only `GET /api/status/health` (next PR)
computes them server-side. PostgREST cannot ask for either, so a function is needed.

- **`security invoker`, not `definer`.** It reads `pg_database_size()` and a count of `pg_stat_activity` rows,
  which any role may do, so it needs no elevated rights and grants nobody anything. That also keeps it clear of
  the hard-coded-security check, which wants a definer function to name a card or Admin function.
- **`service_role` only**; revoked from `public`, `anon`, `authenticated`. Measured on dev: service role
  gets `{size_bytes, connections}`, anon gets `42501 permission denied`.
- **Returns no query text, user names or addresses**, just the two numbers.
- Schema first, as its own PR (CLAUDE.md); the endpoint follows in a second PR and treats a missing function as
  "unknown", so order never breaks anything.
