# my_shelters(): a login's own shelters (0433, #apxld schema half)

**Step zero:** nothing listed a login's shelters; the gap was there. The chooser page is NOT built (next batch). `#apxld` stays open.

## Gate ruling (deliverable 3)
`check-hard-coded-security.mjs` fails a security definer function that calls none of `has_permission()`, `is_admin()`, `role_can()`. Ruled: a **declared record** (`database.declared`, "function public.my_shelters definer"), not a card. There is no card for "which shelters am I at"; a card would grant nothing, and the function exposes nothing the caller does not already hold. No card was needed, so nothing is for Lutan.

## Host rule (deliverable 4)
`shelter_hosts.is_primary` already exists (0428; one per shelter, set on a shelter's first address). The function returns the **primary host**. No column added. A shelter with no primary address, and an archived shelter, are left out (nowhere to send / unreachable).

## Found by the harness
The first version (plain SQL definer) saw only the current shelter: `rls_definer` is a member of `authenticated`, so the 0392 restrictive policies apply inside it. It now loops over shelters, setting the request's shelter for each read and restoring it, the same as `product_admin_shelters()` (0428).

## Specification for the app half
- `public.my_shelters()` , **no arguments**, plpgsql, security definer, executable by `authenticated` only.
- Returns `(shelter_id uuid, name text, host text)`, ordered by shelter creation scan order (sort in the page if order matters).
- No role at any shelter, or no signed-in user: **zero rows**. One shelter: one row.
- Call: `const { data } = await supabase.rpc("my_shelters");` then link to `https://${row.host}/` (sign-in happens again there).
- Does NOT: take a user id, reveal shelters the caller has no role at, return archived shelters, make sign-in seamless, or change any row.
- Roles held at a shelter count, whichever cards they carry; Admin is not special-cased.
