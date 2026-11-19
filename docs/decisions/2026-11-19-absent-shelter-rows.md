# 2026-11-19 — What a new shelter SEES when a row is absent (`#shrow`, the look)

Follows `2026-11-19-what-a-new-shelter-needs.md` (the read) and `2026-11-19-seed-a-new-shelter.md` (`0416`, the seed). **No migration, no app change.**

**Step zero:** `0416` seeds none of `site_content`, `group_origins`, `donation_channels`; the gap was still there, so the work went ahead.

## Method

- Catalogue: `node scripts/run-harness.mjs supabase/harness/new_shelter_rows.sql` (rolls back), dev, after `0416`. Throwaway shelter made through `product_admin_create_shelter`.
- Public pages: this worktree's `.env.local` `DEV_SHELTER_ID` pointed at `test-shelter-2` (pre-dates `0416`, holds no rows), `next dev` on :3001, every public route fetched and its server-rendered text read. Server-rendered HTML was used instead of the browser pane because the pane does not hydrate directly loaded pages (`CLAUDE.md`); these pages are server-rendered, so nothing is lost. The line `DEV_SHELTER_ID` was restored afterwards.
- Not run: `seed_shelter_defaults` on any existing shelter.

## 1. The table list, as a brand-new shelter has it after `0416`

115 tables carry `shelter_id`. Right after creation, the harness counts rows for the new shelter:

| table | rows | how created |
|---|---|---|
| `bill_kinds` | 14 | `seed_shelter_defaults` |
| `frequency` | 10 | `seed_shelter_defaults` |
| `site_pages` | 8 (empty bodies) | `seed_shelter_defaults` |
| `public_stat_switches` | 4 | `seed_shelter_defaults` |
| `translations` | 8 | side effect of the `site_pages` inserts (titles) |
| `audit_log` | 4 | side effect of the seeding writes |
| `receipt_counters` | 0 | `product_admin_set_shelter_receipts` (no screen calls it yet) |
| `shelters.receipt_series/_issuers` | unset | same function |
| `roles` + `user_roles` | by the onboarding steps | `0415` functions, not at creation |
| `shelter_hosts` | by the onboarding step | `product_admin_map_host` |
| `site_content`, `group_origins`, `donation_channels` | **0** | **nothing** (this note's subject) |
| `role_groups`, `merch_exchange_rates`, `blood_test_types`, `immunization_types`, `procedure_types`, `diet_types`, `diets` | 0 | admin screens, one per list |
| `translations`, `item_unit_conversions`, `label_sources`, `units`, `enclosures`, `zones`, `clinics`, `doctors` and other premises or transactional tables | 0 | screens, or rightly empty |
| `role_cards` | 0 | Settings → Who does what, by design: **cards are never seeded** |

No trigger on `shelters`. `0397` made `shelter_id` NOT NULL, so an absence is a missing row, never a hidden one. `check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer`: 0 flagged, 0 stale (it exits 1 under `--strict` only because of the 2 allowed-by-name lines it prints).

## 2. What is SEEN when each unseeded thing is absent (`test-shelter-2`, every public page)

All public pages returned 200 with no error text. Per page:

| page | result |
|---|---|
| `/`, `/about`, `/adopt`, `/friends`, `/friends/join`, `/our-work`, `/privacy`, `/shop`, `/campaigns`, `/events` | **render**, with a plain empty-state sentence where there is no data ("No residents are listed publicly right now", "No stories have been published yet", "There is nothing here yet", "No campaign is open right now", "There is no event planned right now") |
| `/foster`, `/volunteer`, `/donate` | **render a placeholder**: the heading falls back to the app name, body reads "This page is being written — check back soon." (no `site_pages` row for the slug) |
| `/donate` | also "Online giving is being set up. To donate in the meantime, please get in touch below…" (`donation_channels` absent) |
| `/services` | 404 (not a route; not a finding) |
| `/reels`, `/memes`, `/outreach` | 307 (signed-in routes) |

`site_pages` seeded-empty and absent look the same publicly: `SitePageArticle` takes the same `body ? … : comingSoon` branch. Only the heading differs (seeded: "Foster with us"; absent: app name).

**Seen in passing, not this stream's:** the pages still say "Lanna Care for Animals" on a second shelter's host (header, footer, `/about`, `/privacy`). That is the per-shelter naming gap, not an absent row.

## 3. The four absences: verdict

| absent | what is seen | verdict |
|---|---|---|
| `donation_channels` | `/donate` shows the "being set up, get in touch" sentence | **Deliberate omission.** Its only Lanna row is Lanna's own DonorBox link. The empty case has its own designed copy. |
| `group_origins` | `residents/new` is **not** empty or hidden: the origin `<select>` always offers "No origin selected" and "Add new origin", and the create path takes a free-text name (`record_intake`'s `p_new_origin_name`). **Inferred from `IntakeForm.tsx` and `page.tsx`, not driven**: `dev-signin`'s Admin has no role on `test-shelter-2`, so `/residents/new` redirects to `/login?error=no_role` (itself a correct refusal). | **Deliberate omission.** The two Lanna rows are Lanna's history. |
| cards | A role holds no cards until Settings → Who does what assigns them; Admin is outside the card system. | **Deliberate omission, never seeded** (`CLAUDE.md`, hard-coded security). |
| `site_content` | Public pages render fine without it (nullable on `/` and the footer). **But `setStocktakingSwitch` (`src/app/admin/stocktaking/actions.ts`) does `update site_content … where id = true` and returns `ok: true` when it matched 0 rows**, so on a shelter with no row the Stocktaking switches "save" and change nothing. Reads fall back to ON (`stocktaking-switches.ts`). Read from the code, not driven (no login on the second shelter). | **MISSING SEED — finding for the planner to file, not written here.** |

**The owed seed, for the planner to file as its own PR (needs a migration, number `0417` free):** one `site_content` row per shelter with every column at its default, inserted by `seed_shelter_defaults` (`on conflict do nothing`). Check the table's key first: the update filters on `id = true`, so confirm whether `shelter_id` is part of the key. This also makes Admin → Website show an editor instead of the create button. Alternative: make the action upsert. Either is the planner's call.

## 4. Is it safe to run `seed_shelter_defaults` on a shelter already in use?

Answered from the function text in `0416`, **not run**, and not to be run on `test-shelter-2` (second Google account's real credentials).

- Every insert is `on conflict (…) do nothing`, so **no existing row is changed or overwritten**, including any edited title, body, switch value or label.
- It would **add what is missing**: any of the 8 page slugs without a row (empty body; publicly identical to absent, but the admin editor gains a row), any missing `public_stat_switches` key (default on), any missing `bill_kinds` key (14) and any `frequency` label not present.
- Two things it could surprise with: a `frequency` row is keyed by **label**, so a shelter that renamed "Once daily" would gain a second "Once daily" beside its renamed one; and a shelter that **deleted** a seeded bill kind or frequency would have it come back. `public_stat_switches` are updated, never deleted, so a switch turned off is kept.
- It writes `translations` and `audit_log` rows as side effects, and needs a product-administrator session at `aal2`.
- **Conclusion:** low risk and additive, but not "nothing happens". Before running it on an in-use shelter, compare that shelter's `frequency` and `bill_kinds` with the seed list.

## 5. Not closed

The `site_content` seed is owed (section 3) and is a separate PR. `#shrow` is ticked because its list and every absence are now recorded with what is seen; the owed seed is a new item for the planner.
