# New policies that name a role are caught by a static check in CI (2026-10-07)

`0157_map_rooms` (#422) merged with `current_user_role() in ('admin', 'management')`, the
old enum pattern, and nothing ran the check that notices: `check-policy-role-names.mjs`
was red on `main` afterwards, but it is in neither `gates.mjs` nor any workflow.

**Chosen: `scripts/check-new-policy-role-names.mjs`, a CI job (`new-policy-role-names`)
that reads only the migration files the PR adds** (the same diff-against-base shape as
`check-migration-numbers.mjs`). It fails when a new `create policy` / `alter policy`
statement contains `current_user_role()` or any of the five role names cast to `app_role`.
Functions and views that mention a role are not judged.

**Why not the obvious alternatives, established from the source:**

- *`check-policy-role-names.mjs` in CI.* It reads `pg_policies` through the Supabase
  Management API with `SUPABASE_ACCESS_TOKEN`. CI would need an account-wide personal
  access token in GitHub secrets, which is what open Security item CODE-3 says is too
  powerful. Wrong direction.
- *It in `gates.mjs`.* That works (`worktree.mjs new` copies `.env.local`), but `gates.mjs`
  is three offline commands that refuse to start if a binary is missing. Needing the
  network and a token changes every stream, every run. Disproportionate.
- The static check needs no token, network or database, and does not depend on the
  existing policies being green. The two checks are complementary: this one stops new
  ones at the PR; the database one still audits what is live.

**Escape hatch.** The vet's 54 policies are a recorded decision (`perm-convert-vet` parked
7 October), and a later migration may legitimately touch one. A statement carrying
`-- policy-role: deliberate — <why>` (inside it, on the `;` line, or in the comment lines
directly above) passes; the reason is required and is printed, so a reviewer sees it. A
deliberate policy's table still has to be in `OWNERS` and §15, which the database check
enforces. A guard with no way out gets deleted the first time it is right but inconvenient.

**Not covered:** a policy created inside a `do $$ … execute '…' $$` string is found only
if its text reads as a `create policy` statement; policies in files already on `main` are
not judged (that is the database check's job); `--base` needs the base fetched, as in CI.
