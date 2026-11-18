# 2026-11-18 — The PADMIN list, one cross-shelter read, and why it is not scoped by `current_shelter_id()` (`#shmgt`, schema half)

Migrations `0411_product_admins.sql` and `0412_product_admins_owner.sql`. Nothing reads these objects yet; the screen is the app half, next batch.

## What Lutan decided (2026-11-18, two messages; not to be put to him again)

> *"for access control it should just be a list of people with Product Admin (PADMIN)"*
> *"doesnt need roles or cards"*

So PADMIN is a **list of people**: no role, no card, no cell. It is the **third named exception** to the zero-exceptions rule, after Admin (2026-10-25) and the adopter website account (2026-11-13). Like them it is **not a precedent**: one list, one surface (managing shelters). What a PADMIN does *inside* a shelter's own data stays card-governed. The `perms.isAdmin` bypass and `roles.is_admin` are untouched. Recorded in `docs/hard-coded-security-registry.json` under `outsideTheCardSystem.productAdmin`, a named exception and not debt, `counted: false`, plus eight `database.declared` entries (five policies, the `definer_all` policy, two functions) that the check requires for anything not resolving through a card or Admin function.

## Identity: `auth.users.id`

The list stores `user_id uuid references auth.users(id) on delete cascade`. Not an email, not a role key.

- An **id is stable**. `0371`'s `adopter_may_submit` links a login to a contact by verified email, which is right there because the contact is the thing that has an email. Here the thing being identified is a *login*, and the id is the login. If the person's email changes, nothing breaks. A list keyed on email would lose the person, or hand the seat to whoever next held that address.
- The app half shows a person by reading their email from `auth.users` through the service role **after** `is_product_admin()` is true, or by asking for the email when adding. The list holds no role name, so it cannot become the named-role fallback `CLAUDE.md` forbids.
- Deleting the login removes the row (cascade), so a deleted account cannot linger as a PADMIN.

## Reads and writes: the list is out of reach of every shelter Admin

- `anon` holds nothing. `authenticated` holds `select, insert, delete` (no `update`), each only through a policy that answers `is_product_admin()`. A shelter Admin is not on the list, so they read **zero rows** and **cannot insert themselves** (proved below).
- **Writes** also need `aal2`: RESTRICTIVE policies AND-ed on, the `0100` shape, for insert and delete.
- **Reads are gated by membership but not by `aal2`.** `0100` left reads at `aal1` and I followed it: the list is already invisible to non-members, and only writes change who holds the power. A non-member cannot tell the list is empty from the list being hidden, which is the point.
- The **first PADMIN is placed with the service role** (it bypasses RLS). No person is seeded in the migration; the repository is public.
- A `definer_all` policy for `rls_definer` follows the `0375` convention.

## `is_product_admin()` — the one place the question is asked

`security definer`, `stable`, `search_path = ''`, returns `boolean`: is `auth.uid()` on the list. Granted to `authenticated` and `service_role`, revoked from `public` and `anon`. **It answers about the caller only**, so it reveals nothing about anyone else. `0412` re-owns it (and the read function) to `rls_definer` so the tenancy lint passes (rule 2).

## `product_admin_shelters()` — and why it is deliberately NOT scoped by `current_shelter_id()`

`0405`'s `shelter_drive_status()` is scoped to the shelter being served so no shelter sees another's status. **A management surface is the one place that must see every shelter**, so this function does the opposite, and the only gate is `is_product_admin()`. That is stated in the migration header too, so a reader does not think the scoping was forgotten.

Returns `(id uuid, key text, name text, created_at timestamptz, hosts text[])`, ordered by `created_at, key`. Each column is there for a reason: `id` is what a later write names, `key` and `name` are what the list shows, `created_at` is when it was set up, `hosts` is the mapped web addresses. **No client id, secret, token or credential is returned, now or ever**; `0405`'s discipline. A caller who is not a PADMIN gets an empty set, not an error.

## What the app half must call, and must never show

- Call `is_product_admin()` (through the signed-in client) to decide whether the surface exists at all, then `product_admin_shelters()` for the list.
- Login states: **signed out** — no rows, no PADMIN; **any login not on the list** (shelter Admin included) — `is_product_admin()` is false, the function returns no rows, the table reads empty, writes are refused; **PADMIN at aal1** — reads the list and shelters, **writes are refused** (needs the step-up page); **PADMIN at aal2** — also adds and removes PADMINs.
- Never display or log: any credential column of any `shelter_*_credentials` table, an OAuth client id or secret, a token, anything from `0404`/`0409`. This function returns none of them and a screen must not go and fetch them by another route.
- Any write to `shelters` or `shelter_hosts` still has no login grant (`0382`). The app half must decide whether a definer write function is added (PADMIN-gated, aal2) or the surface stays a script. That is its call; this half does not presume it.
- **The open question I am not settling:** whether the operator surface lives **inside the shelter app at all**. `#shmgt`'s candidate list says *"(a) is roughly what he chose"*, which may mean the operator surface stays **outside** the shelter app, while the rest of the item describes a screen. This schema works for either; it is the app half's question, and possibly Lutan's, for the planner to put.

## Proved, and not proved (dev, project `qxkmhwybjggxvsfxsxbd`)

Two disposable password logins created through the Auth admin API holding **no role and no card** (stricter than `dev-signin --cards`), signed in at aal1, deleted afterwards:

- not on the list: `is_product_admin()` false; `product_admin_shelters()` empty; `select shelters` → `permission denied for table shelters`; `select product_admins` → zero rows; inserting themselves → `new row violates row-level security policy`.
- on the list (placed by the service role), at aal1: `is_product_admin()` true; `product_admin_shelters()` returns the two dev shelters with columns `id,key,name,created_at,hosts`; reads the list; **insert refused by `product_admins_insert_requires_aal2`**; delete of self removes nothing and the row remains.
- After `0412` re-owned the functions, the same two answers were re-checked (false/0 rows, then true/2 rows).
- **Not driven:** a PADMIN at **aal2** succeeding at a write. A dev session has no authenticator. `pending: aal2 write not driven`.

## Found, not mine

The strict tenancy lint reports `scheduled_writer_runs` (rule 3, owner postgres, no `definer_all`). It was already flagged before this PR and belongs to whichever migration created that table; it is reported, not fixed here.
