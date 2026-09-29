# 2026-09-26 — Stock deliveries and adoption updates: the schema (`0096`, `0097`)

Schema halves of "Record stock deliveries, so Stock between counts can
state usage" and "Record updates from adopters on an adopted resident".
Both feature halves build on these shapes; `scripts/check-stock-receipts.mjs`
and `scripts/check-adoption-updates.mjs` are the rollback harnesses behind
every claim below.

**`stock_receipts` (0096)**

- **Sibling of `stock_counts`, same item shape.** `item_kind` plus exactly
  one of `medication_id` / `diet_type_id`, checked, cascade on delete — so
  the two tables join on the same three columns.
- **`unit` is the unit at receipt, stamped by a trigger from the item,
  never from the form.** The item's unit is editable; a delivery of 20
  "tablet" must not become 20 "ml" when the unit is corrected later. An
  edit keeps the unit it was received in; moving a receipt to another
  item re-stamps it. The quantity is in the item's unit — the form
  converts "2 boxes of 50" before saving — and a receipt whose unit
  differs from the counts around it blocks the sum rather than being
  converted (there is no conversion table to trust).
- **`received_at` is a timestamp, not the backlog's `received_on` date.**
  The sum has to put each delivery on one side of each stocktake, and
  stocktakes are stamped to the instant. With a date, a delivery on a count
  day is ambiguous, and any date rule overstates one interval and
  understates the next by exactly that delivery. Rule:
  `previous.counted_at < received_at <= next.counted_at` — a delivery at
  the same instant as a count was on the shelf. Recording "now" as it is
  unpacked needs no question; the feature asks "before or after the
  stocktake?" only for a back-dated delivery on a count day.
- **`stock_count_intervals` does the sum,** one row per consecutive pair
  of counts of an item: `used = from + received − to`, null with
  `unit_changed` when counts and receipts don't share a unit. Intervals
  telescope, so usage over any span of stocktakes is the sum of its rows
  (asserted). A negative `used` is left visible: it means an unlogged
  delivery. `security_invoker`, so it shows nobody more than the tables.
- **Receipts do not touch `stock_on_hand`.** A delivery is not a count;
  adding it to the counted figure would make the next "previous count"
  something nobody counted. If the page offers "and set the count", that
  goes through `record_stocktake`.
- **Written directly by admin, management and staff; read also by
  volunteers.** Unlike `stock_counts` (function-only, uneditable), a
  mistyped delivery is corrected, not re-counted. `recorded_by` and
  `created_at` are forced by the trigger. `cost` is total baht, optional,
  0 = donated.

**`adoption_updates` (0097)**

- **The photo→update link is a column on the photo:
  `attachments.adoption_update_id`.** Lutan's point was that a photo
  carries its provenance wherever it appears — the update, the Photos tab,
  a future public "Happy endings" card — so any query holding an
  attachment reaches sender, date and channel in one join, and shelter
  photos are simply `adoption_update_id is null`. A composite foreign key
  `(adoption_update_id, owner_id) → adoption_updates (id, resident_id)`
  makes a photo unable to point at another animal's update; untagged rows
  are not checked, so existing attachments are untouched.
- **Deleting an update with photos is refused (no action), not set null.**
  Set null would quietly relabel the adopter's photos as shelter photos —
  the exact confusion the tag exists to prevent. The feature untags or
  deletes the photos first.
- **`record_attachment()` gains `p_adoption_update_id`,** so a photo is
  tagged in the same insert that records it. The six-argument version is
  dropped, not kept as an overload: PostgREST cannot choose between two
  functions accepting the same named arguments. The live route's call
  still resolves unchanged (asserted).
- **Channel is text with a CHECK, not an enum.** `line`, `facebook`,
  `email`, `visit` — lower-case codes the dictionaries label. The list will
  grow (phone, WhatsApp), and growing an enum takes two migration files
  (PR #50) where growing a CHECK is one drop-and-add.
- **The sender is stored on the update, preselected from the placement.**
  `sender_contact_id` is filled by the form from the Adopt placement's
  `carer_id`, but not read through it: a partner or grown child often
  sends the photos, and a placement's carer can be corrected without
  rewriting who sent last year's news. Optional, since an Adopt placement
  may have no carer.
- **Not tied to "currently adopted".** A resident returned and re-adopted
  keeps every update; the hub decides where the section shows.
- **Written by admin, management and staff; read by every signed-in
  role.** An update is a record entry about an adopter, which volunteers
  do not write (as with placements); a volunteer may still add a photo to
  an existing update through `record_attachment`. Nothing for anon — a
  public "Happy endings" card needs the adopter's permission recorded
  first, and is a follow-on to ask about.
