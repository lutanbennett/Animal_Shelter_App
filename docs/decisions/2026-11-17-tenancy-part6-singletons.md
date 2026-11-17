# Part 6 of the tenancy programme (#bncd0): singletons, the receipt series, and app_users

**Status: built and applied to dev 2026-11-17 (`0395`). In no release yet.**

## Step zero: what the live database said (the brief's table was inference from one document)

| Constraint | Brief said | Database said |
|---|---|---|
| `site_content` primary key `id boolean` | real | **real. Done.** |
| `facility_maps_one_overview` | re-scope | already `(shelter_id) nulls not distinct where kind='overview'` since `0389` |
| `map_rooms_one_per_kind` | re-scope | **does not exist**: `0184` dropped it |
| `diet_types_one_standard` | column first | **does not exist**: `0243` dropped `diet_types.is_standard` and `set_standard_diet()`; the standard diet is `diets.is_standard`, whose `diets_one_standard` `0389` already scoped. `diet_types` needs no column for this part. |
| `p_issuer` trusted from the caller ("live today") | live fault | **already closed by `0176`** (accepted and ignored). What was still Lanna's: the series `'LCA'` and the issuer text. |
Catalogue lint before: `0 flagged, 2 allowed, 0 stale`. After: the same.

## What `0395` does

- **`site_content`**: primary key dropped; `site_content_one_per_shelter` is `unique (shelter_id) nulls not distinct`. `id` stays a boolean that is always true, so every `.eq("id", true)` and the insert policy are untouched and **no `src/` file changed**. Nothing referenced the key; the table is in no publication.
- **Receipts, two separate things.** (1) *Tenancy preparation:* `shelters.receipt_series` (unique, `^[A-Z]+$`) and `shelters.receipt_issuers` (jsonb by country) hold the series and issuer; `receipt_issuer()` reads the current shelter's, and `issue_donation_receipt()` numbers from that shelter's series and counter. Lanna's values equal what the code returned before, so nothing printed changes. (2) *The `p_issuer` fault:* still ignored (0176); the RPC never reads an issuer from outside. The new source is `shelters`, which no login can write, so the 0176 principle (a receipt must not read a field anyone can edit) holds. A new shelter needs its counter row created when it is provisioned (the proof does it by hand); that is provisioning work.
- **`private.app_users`**: stays owned by `postgres` and still allow-listed by name (its reason, "takes the tenant filter by hand", is now true). The filter is `is_trusted_caller() or user_roles.shelter_id = current_shelter_id()`, on the listed users and on the caller's own row.
- No `shelter_id` column added anywhere, so `0392`'s loop did not need re-running.
- To undo: see the file's header.

## Proof

`scripts/prove-tenancy-part6-singletons.mjs` (rolled back): a second shelter gets its own website row (a second is refused), facility overview and standard diet; the first shelter keeps one; receipt `ZZA0000001` issued by "Proof Shelter Org" with Lanna's counter untouched; another shelter's header sees 0 of its logins through `app_users`. The existing `check-donation-receipts-schema.mjs` needed the shelter header added (it predated Part 5 and failed 53 checks before any receipt code ran); it passes with 0 failures.
The admin login still holds its cards: with its claims and the shelter header, `website.content` and `donation.receipt` are true, its `user_roles` row is visible (and hidden without the header, as designed). **The browser click-through was not done**: serving the session cookie from a local server to avoid hand-pasting it was refused by the permission classifier, and I did not work around it.

## Not done, and whose

- The ~10 other column-less tenant tables (including `diet_types`, `diet_ingredients`, lookups): planner files them.
- `login_display_name` still takes no tenant filter (its allow-list reason says it must): not named in this brief; for the planner.
- `translations`/`label_sources` key site_content by `row_id` `'true'`, which two shelters would share: for the planner.
- `check-null-shelter-id.mjs` reports 1 `retention_runs` row with a null shelter, a headerless writer, not this part.
- `NOT NULL`, INSERT policies, Part 7's filters.
