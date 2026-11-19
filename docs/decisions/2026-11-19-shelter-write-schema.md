# 2026-11-19 — The product-admin screen's write half, schema side (`#shmgt`, migration `0414`)

`supabase/migrations/0414_product_admin_shelter_writes.sql`. Schema only: no screen reads it yet, and `#shmgt` stays open until the app half lands. This **extends** the recorded PADMIN exception (`outsideTheCardSystem.productAdmin`, Lutan 2026-11-18); it adds no new exception and reads no role. Three `database.declared` entries for the new functions were added to `docs/hard-coded-security-registry.json`, as `0411` did for its two.

## Where the `aal2` check lives: inside each function body (deliverable 6)

`0411` guards its table writes with RESTRICTIVE policies `to authenticated`. These functions are `security definer`, owned by `rls_definer` (the 0375 convention), which holds `definer_all` on `shelters` and `shelter_hosts`. A definer body runs as its owner, so a policy written for `authenticated` is never evaluated against it: copying the policy shape would have produced a gate that never fires and a screen that only looks protected. So each function asks `is_product_admin()` first, then raises 42501 unless `auth.jwt() ->> 'aal' = 'aal2'`.

**Measured, not just read:** `supabase/harness/0414_shelter_writes.sql` (begin…rollback, run on dev) as `authenticated`: a login not on the list is refused; a PADMIN at `aal1` is refused; a PADMIN at `aal2` creates a shelter, maps a host and unmaps it; a duplicate host is refused.

## Does a shelter need more than one row to be usable? (deliverable 7)

Yes, and it is bigger than this PR. `product_admin_create_shelter` creates the `shelters` row only. A new shelter then has **no Admin role** (`roles` is per shelter, with the `roles_one_admin_idx` Admin flag), no login linked to it, and no `site_content`/settings rows. Without an Admin nobody can sign in and run Settings → Who does what. **Finding for the planner to file:** a PADMIN-gated, aal2 function that makes the shelter's Admin role and connects a first login (by `auth.users.id`) is needed before the screen can onboard a shelter end to end. Not added here.

## Specification for the app half

All three are callable only by `authenticated` (and `service_role`); each raises, never returns silently, when the caller is not a PADMIN at aal2.

| Function | Returns | Raises |
|---|---|---|
| `product_admin_create_shelter(p_key text, p_name text)` | the new `shelters.id` (uuid) | `42501` not PADMIN or not aal2; `22023` bad key (lower-case letters/digits with single hyphens, trimmed and lower-cased first) or empty name; `23505` key already exists |
| `product_admin_map_host(p_shelter uuid, p_host text)` | nothing | `42501` as above; `22023` unknown shelter or invalid host; `23505` host already mapped (to any shelter, never reassigned: unmap first) |
| `product_admin_unmap_host(p_host text)` | nothing | `42501` as above; `22023` no such mapped host |

Hosts go through `normalise_request_host()` (lower-case, one `:port` and one trailing dot dropped), so the screen may pass what the user typed. The screen should already know the shelter `id` (from `product_admin_shelters()`) and should show the vocabulary that function reports (`id`, `key`, `name`, `created_at`, `hosts`). Call through the signed-in user's own client, **not** the service role (`auth.uid()` and the JWT must be the PADMIN's). It must NOT: try to delete or rename a shelter (no function does), reassign a host in one step, or assume a PADMIN at `aal1` can do anything: it needs the second step first (PR #1709 found a PADMIN cannot set up an authenticator themselves, which the screen must handle).
