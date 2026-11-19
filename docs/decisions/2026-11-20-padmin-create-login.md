# padmin-create-login (`#flogn`): evidence gathered, build waits on Lutan's gate decision

Status: **stopped at the decision, 2026-11-20.** No create-or-invite path is built. Lutan's answer on the gate shape
had not been recorded in the brief when this was written, and the brief forbids building on a guess.

## Step zero (still open)
- The console is `src/app/platform/` (the backlog item's `src/app/admin/product-admin/actions.ts` does not exist).
- `grep createUser|invite` in `src/app/platform/` and the migrations finds nothing: no PADMIN path to create or
  invite a login exists. Only `src/app/admin/security/actions.ts` creates a user, gated by the card `security.createUser`.

## Where a PADMIN's route stops today (all are `product_admin_*` RPC wrappers, PADMIN plus aal2)
| Step | Action | On screen | Needs |
|---|---|---|---|
| Create shelter | `createShelter` | yes | key, name |
| Admin role | `createShelterAdminRole` | yes | shelter id; gives the role no cards |
| Defaults | `seedShelterDefaults` | yes | shelter id |
| Host | `mapShelterHost` / `unmapShelterHost` | yes | hostname |
| First admin | `linkShelterAdmin` | yes | **an existing login's email** |
| Create or invite that login | none | no | **the missing step** |

## What `auth.admin.createUser` needs (deliverable 4)
The card-gated action calls `createAdminClient().auth.admin.createUser` (service role) with a generated temporary
password, `email_confirm`, the must-change-password flag in `app_metadata`, then inserts `user_roles`, deleting the
login again if that insert fails. Whatever shape is chosen needs that service-role call, so it must sit behind a
server-side PADMIN-plus-aal2 check and be proved as a request, not as the service role.
- **Definer function on `is_product_admin()` plus aal2 (beside 0414/0422):** cheaper. The login is made by the server
  action after a PADMIN check, and one RPC links it to the shelter's Admin role and records it with `record_audit`.
  Adds one registry entry; no card, no change to any card catalogue count. Cost: a second PADMIN-only mechanism to
  keep, recorded as not a precedent.
- **A card the Admin role would hold:** dearer. A card must apply real access wherever held (`card-grants-applied`),
  `check-cards-count` must agree, and a shelter's own Admin could grant it to anyone, so every shelter could mint logins.
This is evidence for the decision, not the decision.

## The second finding (deliverable 11): already answered
`0417` and `0420` return `has_admin_role` and `has_admin_login` from `product_admin_shelters()`, and
`ProductAdminPanel.tsx` shows both steps (`stepAdminRole`, `stepAdminLogin`). Nothing to build; nothing extra to tick.

## Waiting on
Lutan: definer function (recommended by the evidence above) or card. When it is recorded in the brief, build exactly
that one, with a harness plus a real aal2 press on dev (`example.invalid` address only), and tick `#flogn`.
