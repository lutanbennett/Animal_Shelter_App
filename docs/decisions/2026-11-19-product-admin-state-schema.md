# 2026-11-19 — Product-admin setup state, login lookup by email, and the `site_content` seed (`#padui`, schema half)

Migration `0417_product_admin_setup_state.sql`, applied to dev 2026-11-19. Harness: `supabase/harness/product_admin_setup_state.sql` (rolled back; passes with `HARNESS OK padui schema`). **`#padui` is deliberately NOT ticked:** this is its schema half; the screen is batch 3.

**Step zero:** `0411`'s `product_admin_shelters()` returned `(id, key, name, created_at, hosts)` and no setup state; `0416` seeded no `site_content`. The gap was there, so the work went ahead.

## 1. What each setup step means as a predicate

`product_admin_shelters()` keeps its first five columns and adds the eight below, in the order the steps happen. Each is a plain yes/no on rows that exist, computed honestly; nothing is guessed.

| column | TRUE when | why this predicate |
|---|---|---|
| `has_host` | at least one `shelter_hosts` row | a shelter with no web address cannot be reached at all |
| `has_admin_role` | a `roles` row with `is_admin` | the Admin role is the one thing `product_admin_create_shelter_admin_role` (0415) makes |
| `has_admin_login` | some `user_roles` row on that Admin role | `product_admin_link_shelter_admin` (0415) makes exactly that row; any login on it counts, however it got there |
| `has_receipts` | `receipt_series` and `receipt_issuers` set **and** the `receipt_counters` row for that series exists | the three things `product_admin_set_shelter_receipts` (0416) writes; any one missing means receipts cannot be issued |
| `has_defaults` | each of `site_pages`, `public_stat_switches`, `bill_kinds`, `frequency` has at least one row | what `seed_shelter_defaults` makes. "At least one", not "all 36", so a shelter that deleted one frequency is not shown as unseeded |
| `has_site_content` | a `site_content` row exists | see section 4 |
| `drive_status` | `not_started` / `incomplete` / `connected` / `dead` | see below |
| `calendar_status` | same four words | same rule, plus `calendar_id` must be present |

**`drive_status` / `calendar_status`.** `not_started` = no credentials row. `incomplete` = a row without all of client id, client secret and refresh token (and, for the calendar, the calendar id). `dead` = complete but `token_status = 'dead'`. `connected` = complete and not dead (`unchecked` and `ok` both read connected, matching `shelter_calendar_status()`, which reports `connected` from presence of the three secrets). **Only the word is returned. No client id, secret, token, calendar id or account email leaves the database**, ciphertext included (`0405` discipline).

**Deliberately not computed:** whether a connected token still works right now (that is `token_status`'s job and `dead` already carries it), and whether a shelter's settings beyond receipts are "complete" (there is no honest definition; `shelters.drive_root_folder_id` is not a step on its own and is set when Drive is connected).

**A finding for the planner, not a fix:** a shelter with **no** credentials row reads `not_started`, but Lanna has no row on purpose and runs on the shared environment-variable setup (`0404`, `0409` headers). The database cannot tell those apart honestly without naming a shelter, so the screen must not call Lanna's `not_started` "broken". Whether the screen special-cases it (for instance by showing the two connect rows only for shelters that have a host other than the legacy ones) is batch 3's decision.

## 2. The login lookup, and why it cannot be used to probe

- `product_admin_login_exists(p_email text) returns boolean`: `security definer`, **owned by postgres** (see section 5), `is_product_admin()` and `aal2` checked inside the body.
- **It answers one question about one exact address.** `lower(u.email) = lower(btrim(p_email))`. No `like`, no `%`/`_`/`*` (the address is refused, as `not an email address`, if it contains any), no near match, no ordering, no limit to widen. It returns a bare boolean: **never an id, never a row, never a count, never a list.** The harness proves a wildcard and an underscore are refused, and that the check is case-insensitive.
- **Who can ask:** only a product administrator at `aal2`. Anyone else, including a shelter Admin and a PADMIN at `aal1`, gets an exception whose text is `product admin only` (or the `aal2` message for a PADMIN), **identical whatever address they asked about**, so a refused caller learns nothing about any address. The harness asserts both messages are the same for a real and an unreal address.
- **What a PADMIN can still learn, stated plainly:** whether a particular address they type has a login. That is the job the screen has to do (it must say "no login with that address" before linking). It is one yes/no per attempt, only for someone already trusted to place logins, and only at `aal2`. It cannot enumerate: there is no way to ask for more than one address per call or to get anything but yes/no. **Not built:** per-caller rate limiting and an audit row per lookup. Neither exists elsewhere for PADMIN reads; for the planner to file if wanted.
- **Why the by-email wrappers exist.** A boolean alone is useless to a screen that must then call functions taking `auth.users.id`. Rather than return the id (which would turn the lookup into an id oracle), `product_admin_link_shelter_admin_by_email(p_shelter, p_email)` and `product_admin_add_by_email(p_email)` resolve the address inside the database and call the existing `product_admin_link_shelter_admin` / insert into `product_admin_list`. An unknown address raises `no login with that address`. **These two are an addition beyond deliverable 4**, made because the lookup is otherwise unusable; the existing uuid functions are unchanged.
- **`product_admin_people()`** returns `(kind, shelter_id, user_id, email)` for the people already placed (product administrators, and each shelter's Admin-role logins). It takes no argument, so it cannot search; it returns only rows that are already on a list the caller can read. This is what lets the list show emails instead of uuids.

## 3. Batch 3's specification (quote this)

**`product_admin_shelters()`** — one row per shelter, oldest first, empty for a non-PADMIN. Readable at `aal1`; **everything below is a read and must be shown while the page is read-only**.

1. `id` — uuid, what every write names. Never display.
2. `key` — the shelter's short name, e.g. `lanna`. Show as secondary text.
3. `name` — display name. The row heading.
4. `created_at` — when created. Show as a date.
5. `hosts` — web addresses, possibly empty. Shown in the **Web addresses** column only; the add and remove address controls live there and nothing else does.
6. `has_host` — true: tick "Has a web address". False: this is the next step; offer **Add a web address**.
7. `has_admin_role` — true: tick. False (and `has_host` true): next step **Give it an Admin role** (`product_admin_create_shelter_admin_role`).
8. `has_admin_login` — true: tick, and show the linked email from `product_admin_people()` (`kind = 'shelter_admin'`, matching `shelter_id`). False (and `has_admin_role` true): next step **Link its Admin login**, asking for an **email address** (call `product_admin_login_exists` as the person types or on blur, show "no login with that address" when false, then `product_admin_link_shelter_admin_by_email`).
9. `has_receipts` — true: tick "Receipt numbers set up". False: next step **Set receipt series** (`product_admin_set_shelter_receipts`).
10. `has_defaults` — true: tick "Starting content added". False: only possible for a shelter made before `0416` or whose rows were deleted; offer **Add starting content** (`seed_shelter_defaults`).
11. `has_site_content` — **show only when false** (a warning line, "Website settings row is missing", with the same **Add starting content** button, which now creates it). It is true for every shelter after `0417`, so as a permanent checklist row it would teach people to skip the list.
12. `drive_status` — `not_started`: grey "Google Drive not connected"; `incomplete`: amber "Drive connection unfinished"; `connected`: tick; `dead`: red "Drive sign-in has stopped working". The connect action belongs to the shelter's own Admin (its own Settings), not to this screen; say that rather than offering a button. Lanna's `not_started` is expected (section 1).
13. `calendar_status` — same four words and same rule, for the calendar.

**The next step** is the first false among `has_host` → `has_admin_role` → `has_admin_login` → `has_receipts` → `has_defaults`; show that one prominently and the rest as ticks or dimmed. Drive and calendar are never "next" on this screen.

**`product_admin_people()`** — `(kind, shelter_id, user_id, email)`. `kind = 'product_admin'` rows (`shelter_id` null) are the people list, shown **by email** with a Remove control (the existing uuid remove function takes `user_id`; never display it). `kind = 'shelter_admin'` rows give the email per shelter for step 8. An email can in principle be empty for a login without one; show `(no email)`.

**Add by email:** `product_admin_add_by_email(p_email)`. A second add of someone already listed is a quiet no-op. **Errors to show in words:** `no login with that address`, `shelter already has an Admin role`, `login already has a main role` (a login can hold only one main role, anywhere), `login already linked to this Admin role`, `second step (aal2) required`.

## 4. `site_content`: the key, what breaks, and existing shelters

- **Is `shelter_id` part of the key?** Yes. `0395` dropped `site_content_pkey` and added unique index `site_content_one_per_shelter` on `(shelter_id) nulls not distinct`. `id` stays a boolean always true (`check (id)`, default true) and **is not the key**; every other column is nullable or defaulted, so `insert into site_content (shelter_id) values (…) on conflict (shelter_id) do nothing` is a valid, idempotent row of defaults. Read from the table on dev (`information_schema.columns`), not assumed.
- **What breaks without the row (from `#1734`, read from `src/app/admin/stocktaking/actions.ts`, still NOT driven here):** `setStocktakingSwitch` runs `update site_content … where id = true`; on a shelter with no row that matches 0 rows and returns ok, so the Stocktaking switches save as nothing. Reads fall back to ON. The Admin → Website editor also shows its create button instead of the editor.
- **Does the seed close it for existing shelters?** `seed_shelter_defaults` only runs when a product administrator calls it, so on its own it fixes new shelters only. **`0417` therefore also backfills: it inserts a row for every shelter that has none.** On dev that was `test-shelter-2` and `proof-b` (`lanna` already had one); the harness asserts no shelter lacks a row afterwards. So no existing shelter stays broken **in the database**. What I did not check: that the stocktaking switches actually save on a second shelter, which needs a login on that shelter and was not driven. **For the planner:** if you want that proven, it is a short browser check on `test-shelter-2` after a shelter Admin exists there (`src/` and a login are outside this stream).
- **Answer to the planner's open question** — *is "has its website content" still a meaningful row?* No, not as a permanent checklist row: after `0417` it is true for every shelter. I kept the **column** (it goes false again if a row is deleted, which is the silent failure `#1734` found) but spec'd it **as a warning shown only when false**, not a step.

## 5. Ownership and the lints

- The four functions that read `auth.users` stay **owned by postgres**, not `rls_definer`: `rls_definer` holds no grant on `auth.users`, and granting one would widen the role the tenancy lint relies on. `login_display_name` (0370) is the precedent. They are recorded "allowed by name" in `scripts/lib/tenancy-catalogue.mjs`; `check-tenancy-catalogue.mjs --strict --tenant-role rls_definer` is `0 flagged, 6 allowed, 0 stale`.
- `check-hard-coded-security.mjs` requires every redefined definer function to be declared again under its newest migration. Six entries added to `docs/hard-coded-security-registry.json` under `outsideTheCardSystem.productAdmin`'s existing reasoning (`product_admin_shelters`, the four new functions, `seed_shelter_defaults`). That file and the tenancy list are `dev-aal2-path`'s and the planner's by the brief, **touched here because CI fails without the entries**; the diff is additions only. Result: `no coded security outside the Admin bypass`.
- Dropping and recreating `product_admin_shelters()` (the return type changed) is safe: `src/app/admin/product-admin/` calls it by name and reads named columns, so the new columns do not disturb it. Not confirmed by running the screen.

## 6. Consumer

`none`. The screen reads none of this yet (batch 3).
