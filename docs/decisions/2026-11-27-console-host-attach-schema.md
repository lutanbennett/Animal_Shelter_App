# Console host attach: the schema half (#hstau step 3)

`0445` added `shelter_hosts.attach_to_worker` and #1904 made every deploy re-assert flagged hosts, but nothing could set the
flag: `shelter_hosts` is revoked from `authenticated` (`0382`). This PR adds the one write.

## What the next stream calls

`public.product_admin_set_host_attach(p_shelter uuid, p_host text, p_attach boolean) returns void`, product admin + aal2,
`security definer`, owned by `rls_definer`, declared in `docs/hard-coded-security-registry.json` under the PADMIN list as
`0436` is. From the app: `supabase.rpc("product_admin_set_host_attach", { p_shelter, p_host, p_attach })`, the same shape as
`mapShelterHost`. Errors: `42501` not a product admin or no aal2; `22023` no such shelter, attach null, or no host of that
shelter by that name.

## Why it takes the shelter (the brief said `(p_host, p_attach)`)

**Measured, not reasoned.** `0446` shipped the brief's shape and, called on dev as a product admin with aal2, matched no row
for `cooperjaidee.org`, which exists. `shelter_hosts` carries **restrictive** policies `shelter_scope_select/update/delete`
(`is_trusted_caller() OR shelter_id = current_shelter_id()`) for `anon, authenticated`, and `rls_definer` **is a member of
`authenticated`**, so they bind a definer function too. With no `x-shelter-id` header no row is visible. So the shelter-header
step (deliverable 5) **is needed**, for the same reason `0436`/`0428` have it, and the function needs a shelter to set it to.
Looking the shelter up from the host is impossible for the same reason (the select is restricted too). The console already
lists hosts per shelter, so passing it costs the caller nothing. `0446` was already applied to dev, so it is not edited:
`0447` drops the two-argument function and creates this one.

## Normalising vs raising (deliverable 4): both

The host goes through `normalise_request_host()` (as `map_host`/`unmap_host` do in `0414`), and the function **raises
`22023` when no row matched**, so a mistyped host, or a host belonging to another shelter, can never report success having
changed nothing.

## Consequences worth knowing

- **Front-door rows (`shelter_id` null) cannot be flagged from here**, exactly as `unmap_host` cannot remove them: the
  restrictive policy never matches a null shelter. `0445` says such rows are attached to the Worker too, so if the product's
  own domain must be flagged, that is a separate decision. Not testable on dev today: dev has no null rows (`#shnul`).
- **Found, not fixed:** `product_admin_unmap_host` (`0414`) sets no header, so by the same mechanism it can likely only remove
  a host of the shelter the request's own `x-shelter-id` names. Reasoned from the policy, not measured; for the planner to file.

## Proof (dev, `begin … rollback`, claims `role=authenticated`, `is_trusted_caller()` asserted false)

```
flipped cooperjaidee.org false->true (UPPER + trailing dot); header after call=empty; aal1: second step (aal2) required;
unknown host: no shelter host by that name; other shelter: no shelter host by that name; non-admin: product admin only ;
overloads=1
```
