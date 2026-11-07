# 2026-11-07 — `Partner` added to `contact_type` (schema half of #xkfsv's Partner piece)

Lutan, 2026-11-05: *"Split Suppliers out of contacts and make it it's own thing, also add Partners as a contact type for the Shelter friends."* This is the schema half of the Partner piece only. The Supplier split, deliveries, bills and purchasing are not touched.

**What shipped:** `0333_contact_type_partner.sql` — `alter type contact_type add value if not exists 'Partner'`, nothing else. Enum is now `Carer, Volunteer, Vendor, Partner` (appended, so `(enum_range(null::contact_type))[1]` is still Carer, which several harnesses rely on).

**Why one file, not two.** The brief reserved `0334` for anything that *uses* the new value. Nothing does, so `0334` was dropped rather than written as an empty no-op. Migration numbers are not required to be gapless-free of a skipped slot; the next stream takes `0334`.

**Per-site finding (pattern: `contact_type|'Vendor'|'Carer'|contacts?\.type|c\.type|type (in|<>|=) '…'|::contact_type|enum_range` over `supabase/migrations/`, `scripts/`, `worker/`).** The pattern cannot see a policy built by dynamic SQL (`execute format(...)`) or a type compared through a variable; none turned up in the files read.
- `0001`, `0126` — `carer_id` must reference `type = 'Carer'`. Tests one value. A Partner is correctly not a carer (harness proves it is refused).
- `0143` `stock_vendors` — `where c.type = 'Vendor'`. Tests one value. A Partner is correctly **not** a supplier, so it correctly stays out of the delivery and purchasing pickers (harness proves it).
- `0170` carer view passes `c.type` through; no filter on the list of types.
- `0076` `shelter_friends.contact_id` is `not null unique references contacts(id)`, keyed on the contact, not its type; `public_shelter_friends` joins on the contact. A Partner can be a Friend with no database change (harness proves it, and that the unique constraint still holds).
- Nothing enumerates the types, so nothing silently drops the new value.

**Dry-run.** `0333` dry-ran `ok`; the cross-file dry-run caveat did not arise because no second file exists.

**Not decided here:** the Supplier half's design question (does a supplier keep a contact row). Not ticked: `#xkfsv` — the Partner app half and the whole Supplier half remain.
