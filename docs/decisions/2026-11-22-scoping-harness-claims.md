# A harness that claims shelter scoping must say which caller it tested (#701vn)

**Measured on dev in a rolled-back transaction (#1805):** an untrusted anon read of an
`rls_definer`-owned view gave 0 rows with no shelter header and 1 with one; a trusted read (no jwt
claims at all, which is what harnesses and the Management API send) saw all 7 whatever the owner.
`is_trusted_caller()` was true, so the policies stood aside. Ownership scopes these views; the leak
`0430` fixed was an artefact of the instrument. `0430` stays (explicit scoping is harmless).

**Rule (CLAUDE.md, migrations):** a harness claiming to prove shelter scoping sets
`request.jwt.claims` with `role=anon`, or says in its comment that it proves nothing about anon.

**Count (27 files in `supabase/harness/`):** 21 set claims, all as signed-in actors (aal1/aal2 or
authenticated) except `shelter_logo.sql`, the only one that sets `role=anon`. Three use
`set local role anon` with no claims (0328, 0330, 0335): they test grants/refusals, not scoping, and
now carry a disclaiming comment. None other claims anon scoping. Claiming-anon-scoping: 1, honest.

**Checker (Q2):** not built. One qualifying file and three disclaimed; a lint would guard four files.
**Other `is_trusted_caller()` callers (Q3):** `check-tenancy-canary.mjs` (already runs a plain and an
`--untrusted` pass, `2026-11-19-canary-plain-run-trust.md`), `check-public-views.mjs`,
`check-migration-grants.mjs`, `prove-dev-shelter-header.mjs`, `acting-shelter.ts`. Not audited further.
