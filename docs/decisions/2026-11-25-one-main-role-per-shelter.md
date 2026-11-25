# One main role per shelter (#acwho, schema half) — 0443

**Decided by Lutan, 2026-11-25**, having hit the refusal on the production console: *"we still want to restrict logins to one per
shelter as multiple roles can be given to a single login."* One login per person **per shelter**, carrying as many roles as that
shelter needs, and the same person holding one in each of several shelters. **Rejected by him, not to be revived:** carrying the
second shelter as an *additional* role, because the additional-role guard forbids Admin, so nobody could be Admin at two shelters.

**Step zero (planner's check, repeated):** `user_roles_one_main` was `(user_id) where is_main` since `0196` and nothing later changed it;
no decision file covered it. The gap was there. Built.

## What changed

- **`0443`**: `user_roles_one_main` is now `(user_id, shelter_id) where is_main`. Every existing row is accepted (the old index was stricter);
  the harness asserts no login holds two main rows today and that `user_roles.shelter_id` is not null, so the index binds every row.
- **`user_roles_extra_role_rules`** (found while searching, not in the planner's list): "needs a live main role" looked at *any* shelter's main
  role, so an additional role at B would have been accepted for a login with a main role only at A. It now asks the row's own shelter. And it
  refused Admin as an additional role by role **key** `'admin'`; since `0277` Admin is `roles.is_admin`. It now asks the flag, so a shelter's
  Admin role cannot be given as an additional role whatever it is called. `public_viewer` stays by key as before (it has no flag). Note:
  `roles_fixed_iff_reserved` means a custom role cannot be keyed `admin`, so the CLAUDE.md remark that a shelter may name a role `admin` is
  true only of a fixed one; the flag test is right either way.
- **`product_admin_access_add`**: the `23505` "login belongs to another shelter" refusal is removed. Product administrator, aal2, lock-out
  guard and the re-role branch are as `0438`.
- **`product_admin_link_shelter_admin`** (`0421`): "login already has a main role" asked about any shelter; it now asks this shelter.
- **Refusal wording** (English and Thai): both messages that said "another shelter" are now false and say what is true. `access.otherShelter`
  became `access.alreadyHere`; `loginUnavailable` no longer says the login works for another shelter. No remaining refusal names a shelter
  because none is left that concerns a second shelter.
- **App callers**: `setMainRole` and `addExtraRole` (`src/app/admin/security/actions.ts`), and — the most dangerous find — `archiveUser` and
  `restoreUser`, which archived/restored by `user_id` alone and would have archived the same person at **every** shelter. All now name the acting
  shelter. `scripts/check-user-roles-aal2.mjs` had `on conflict (user_id) where is_main` which no longer matches the index; now
  `(user_id, shelter_id)`.

## Every caller that assumed one main role

| Where | Assumed | Done |
|---|---|---|
| `0196` index | one main per login | per shelter (0443) |
| `user_roles_extra_role_rules` | main role anywhere; Admin by key | own shelter; Admin by flag (0443) |
| `product_admin_access_add` (0438) | main role elsewhere is refused | refusal removed (0443) |
| `product_admin_link_shelter_admin` (0415/0421) | main role anywhere is refused | this shelter only (0443) |
| `private.app_users` (0395) | one main row per login | **left alone**: joins `is_main` and filters `r.shelter_id = current_shelter_id()`; the harness shows the right role for each shelter in turn |
| `my_permissions()` (0277) and `has_permission()`/`is_admin()` | `main` = first row by `is_main desc` | **left alone**: owned by `rls_definer`, so the restrictive shelter policy applies inside them; harness: Admin at A does not leak to B, and an Admin at both sees each shelter's own role |
| `0259`, `0264`, `0272` | superseded versions of the above | nothing to do (replaced by 0277 / 0395) |
| `src/app/admin/security/page.tsx:35,62,69` | main vs additional | **left alone**: reads `.eq("shelter_id", shelterId)` first |
| `src/lib/auth/held-roles.ts` | main first, then covers | **left alone**: both reads filter `shelter_id` |
| `src/app/platform/access-actions.ts` `shelterAccessList` | filters `l.is_main` (planner feared a second shelter's row would be hidden) | **left alone**: `product_admin_shelter_access(p_shelter)` already returns only that shelter's rows, so a person's main row at *this* shelter is listed. The filter does hide their additional roles, which is the console stream's call (below) |
| `actions.ts` `setMainRole` (:177), `addExtraRole` (:364) | one main per login | shelter condition added |
| `actions.ts` `archiveUser`, `restoreUser` | the login has one shelter | shelter condition added |
| `actions.ts` `dismissAccessRequest` (`user_id` only) | no role anywhere | **left alone**: `userInActingShelter` has already refused any login with roles only elsewhere, and a login with a role here is "already has access" |
| `listUsersOfShelter`, `countWaitingAccessRequests` (`access-requests.ts`) | a login with a role anywhere is not waiting | **left alone, and it is a limit**: a person with a role at A who asks to join B is invisible to B's request queue. Specified for the console stream below |
| `removeExtraRole` role lookup (`roles` by `key` with `maybeSingle`, unscoped) | role keys unique | **left alone**, found: keys are unique per shelter (`0387`), so with two shelters sharing a key the lookup errors and falls back; the main lookup `givableRole` already carries the shelter. Not reachable from this change |
| `adminEmails()` in `src/lib/status/alerts.ts` | `roles.key = 'admin'` | **left alone, unrelated**: release mail, key-matched; not about main roles |

## Specification for the console stream

- **The login list per shelter** is correct as is (`shelterAccessList`). Show a note on a login that also works at other shelters
  (a count, never names: the product administrator already sees every shelter, but another shelter's staff must not learn who else
  belongs to the person). That needs a new product-admin function; none exists.
- **Adding a person who already has a login elsewhere** now works through `product_admin_access_add`; the Add form needs no change, but
  the result text should say whether the login was new to this shelter or re-roled here.
- **Show additional roles** (`is_main = false`) in the Access list if it should; the RPC returns them, the action drops them.
- **Access requests**: a person with a role at A asking to join B is not visible to B's queue (see table). Decide how a signed-in person
  at A asks B; then change `listUsersOfShelter` and `countWaitingAccessRequests`.
- **Unchanged and still correct**: the shelter's own Security page only ever shows and edits its own shelter's rows.
- Remaining refusal codes: `23505` on the link means *already linked, or already has a main role in this shelter*; on add it can no longer
  be raised. Left for the console stream: copy for a re-role vs a new add.
