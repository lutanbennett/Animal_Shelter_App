# padmin-create-login (`#flogn`): a PADMIN can create a new shelter's first Admin login

**Decided 2026-11-20 by Lutan, asked directly: a definer function, not a card.** Gated on `is_product_admin()` and aal2, beside 0414/0415/0422.
Recorded under `outsideTheCardSystem.productAdmin`, not debt, and **not a precedent** for anything else. No role key appears in the gate; Admin is given no cards.

## Shape
- `0425_product_admin_permit_first_login.sql`: `product_admin_permit_first_login(shelter, email)` is the database gate. It raises unless the caller is a product
  administrator at aal2, the shelter exists and has an Admin role **with no login linked yet**, and no login has that address; then it writes one row to the
  append-only `product_admin_login_grants` (who, which shelter, which address). One door, once per shelter. A function cannot create an auth user, so this is
  the gate the action asks first. It is owned by postgres, not `rls_definer`, because it reads `auth.users` (as 0417's functions do). It scopes its own transaction to the shelter (0421's pattern).
- `createShelterAdminLogin` in `src/app/platform/actions.ts`: PADMIN and aal2 checks (courtesy), then the permit call through the signed-in client, then the **service role**
  creates the login (`auth.admin.createUser`, temporary password, must-change-password, setup window as the Security page does), then links it with
  `product_admin_link_shelter_admin_by_email`; if linking fails the new login is deleted. The temporary password is shown once; the stored replay is a refusal (the password is not kept).
- The service-role call lives in `src/lib/platform/create-login.ts` (not a "use server" file, so the existing admin-check rule needs no exemption). It is declared under `serviceRoleSites`; the function and the new table's policy under `database.declared`.
- Console: a "Create a login for this shelter's Admin" button appears beside Link when the lookup says no login has the address.

## Why not a card
A card a shelter's own Admin can grant themselves would let every shelter mint logins (`#omt6u`). Nothing here widens `security.createUser`.

## Proof
- Harness `supabase/harness/product_admin_permit_first_login.sql` runs as `authenticated` with a JWT (not the service role): refused with no Admin role, bad or existing address,
  aal1 and a non-PADMIN; allowed once; recorded; append-only; refused again once a login is linked. Passed.
- Pressed as a real signed-in product administrator at aal2 on dev: the create button made `flogn-first-admin@example.invalid` for `pcf-proof2`; the screen then showed the Admin login step ticked; one grant row;
  `write_requests` held a refusal, not the password. Dev only, `example.invalid` addresses.
- Not pressed: the new login's first sign-in and forced password change (the same path the Security page's created logins take).

## Found, not fixed
- The grant row records that the address was permitted, before the login is created; if creation then fails there is a row with no login. Harmless, and the retry is allowed.
- Console buttons (button rule): every control is drawn under `canWrite` (product administrator at aal2) and every action asks `isProductAdmin()` and `hasTwoStep()`, then the RPC; none asks a card, because a PADMIN holds none.
- Dev slip while proving: an early press went to Lanna on dev by my own selector; I removed the host again (Lanna's three hosts verified).
- The second finding (which step a shelter has had) was already answered by 0417/0420.
