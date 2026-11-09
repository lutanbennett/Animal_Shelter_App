# 2026-11-09 — A change to which cards include which is now recorded

Backlog `#q8m4t`. Stream `claude/card-includes-audit`. Migration `0341_card_includes_audit.sql`.

## Step zero

The gap was real on `main` at `38df6562`. `card_includes` had one trigger, `card_includes_recompute` (`0257`), and no audit
trigger; `src/lib/audit/recent-changes.ts` said so in a comment inside `AUDITED_TABLES`. No decision file covered it.

## The migration is not the three lines of `0257`, and why

The brief said to copy `0257_card_grants.sql:92-95` exactly. That would have broken the table. `record_audit()` (last
defined in `0195`) takes `audit_log.row_id` from the row's `id`, else its `user_id`, and `audit_log.row_id` is
`uuid not null` (`0121`). `card_includes` has neither column: its key is `(card, included_card)`. With the trigger alone,
every insert, update and delete on `card_includes` would have failed on that not-null and rolled back, so no card's
includes could change at all, migrations included. (Read from the two function and table definitions; not run, because
running it would have meant breaking the shared dev table.)

So `0341` first adds `id uuid not null default gen_random_uuid()` with a unique index, then the trigger. This was chosen
over teaching `record_audit()` to derive an id from a composite key because that function is shared by all 49 audited
tables, and over a separate trigger function because `card_grants`, the table's sibling, already has an `id` and logs
through the same function. The primary key stays `(card, included_card)`, so everything that reads the table
(`card-grants.ts`, `check-card-grants.mjs`, the recompute) is unchanged; they all name their columns.

`card_includes_recompute` is untouched and stays a trigger of its own, so a recompute failure cannot eat an audit row or
the reverse. RLS is unchanged (`0257`'s Admin-only and aal2 policies). No policy or function was added.

## What a row says to a person

A `card_includes` row is one card bringing another with it. The two columns are card keys (`adoption_news`,
`view_residents`). Two keys is what `card_grants` shows today (`card: activity`), and it does not meet the item's "done
when … with a readable label". So the page names both cards by their **titles, in the reader's language**:
**"Adoption news includes View residents"** / **"ข่าวจากผู้รับเลี้ยง รวม ดูสัตว์ในความดูแล ไว้ด้วย"**, with the table
shown as **"Cards a card brings with it"** / **"การ์ดที่การ์ดหนึ่งพ่วงมาด้วย"**.

- `toEntry()` puts the pair on the entry (`AuditEntry.includes`); `page.tsx` turns each key into `CARDS[key].label(t)`.
- A key `cards.ts` no longer knows (a card retired after the row was logged) falls through to **the key itself**, never
  to another card, so an old row still reads.
- `NAME_FROM_IMAGE` carries `["card", "included_card"]` joined with ` → `, so the row also has a plain name wherever the
  title is not built.

## Undo: `card_includes` joins the `permissions` group

`src/lib/audit/undo.ts`'s `undoKind()` now returns `permissions` for `card_includes`, as for `card_grants`. **This changes
what is offered by nothing:** before, a `card_includes` row would have fallen to `elsewhere` ("can't be undone here"),
since it is in neither `UNDOABLE_EDIT_TABLES` nor `UNDOABLE_DELETE_TABLES`. Either way no Undo button is drawn. What
changes is the reason shown, which is now the true one: card contents change only with an app update
(`check-card-grants.mjs` asserts `card_includes` equals `cards.ts`), and putting one back by hand could let someone in or
lock them out. Because neither `card_includes` nor `card_grants` offers an Undo, **a card can never be left half put back
from Recent changes.** Seen on screen: the Delete row shows the permissions reason.

## Proved on screen, and the row restored

On dev, one transaction deleted the edge `adoption_news` → `view_residents` (id `085c513f-…`) and put it back with the same
id. Both changes were logged under that id (`audit_log` 275851 DELETE, 275852 INSERT). Because it was one transaction,
no other stream ever saw the card changed: `card_includes` held 13 rows before and after, and a hash of
`role_permissions` was identical before and after. The two rows were then seen on Settings → Recent changes, reached by
clicking Settings → Recent changes from the home screen (`requestAnimationFrame` fires), in English and in Thai:
`docs/test-plans/shots/card-includes-audit-en.jpg`, `…-th.jpg`.

A separate `begin … rollback` harness on dev asserted: an insert naming no id gets one and is logged under it; an update
is logged under the same id with both images; a delete is logged under it; a duplicate id and a duplicate
`(card, included_card)` are both refused; both triggers exist; no row lacks an id. It reached its final line, and left
`card_includes` at 13 rows with no harness rows.

## What `check-audited-tables.mjs` asserted, before and after

- **Before** (2026-11-09, at `38df6562`): `ok: 48 audited tables … 48 tables carry an audit trigger and every one is listed.`
- **After** (2026-11-09, this branch): `ok: 49 audited tables … 49 tables carry an audit trigger and every one is listed.`

It was green both times. The check asks two things (`missing`: a triggered table not listed; `stale`: a listed table not
triggered). A table with **neither** a trigger nor a listing satisfies both, so the check could never have named
`card_includes`; the item's "goes from naming it to green" did not happen. What changed is that it now **guards** the
table: with the listing removed and the trigger in place it goes red (`Audited but not listed … card_includes
(0341_card_includes_audit.sql)`), tried and reverted on this branch. A check that cannot see an unaudited table is the
same shape as the fault this item fixed; it is reported for the planner, not rebuilt here.

## Found, not fixed

- `role_cards` (`cols: ["card"]`) and `card_grants` (`["card", "activity"]`) still show card **keys** on Recent changes,
  not titles. The same `CARDS[key].label(t)` lookup would serve them; not in this item's scope.
