# The backlog page shows each item's own id

**Found.** Every backlog item has a permanent five-character id in an HTML comment
(`- [ ] <!--#ce6ec--> **TITLE**`, `docs/decisions/2026-11-03-backlog-item-ids.md`), and those ids are how every
session, every commit message and every chat names an item. The generated page carried the id **only as the
anchor on the `<li>** (`id="i-ce6ec"`), which is invisible to a reader. Lutan, 2026-11-08: *"you keep
referencing the ID's but they are not visible to me so I cannot follow the conversation."* He was right, and
it is worse than a nuisance: the page is the one place where a reference to an item could have been resolved,
and it was the one place that did not show them.

**Chose.** Render the id as a small monospace chip in each item's `<summary>`, between the checkbox and the
title, and the same chip on a ranked row in the Customer priorities panel so a picked item can be quoted too.
`user-select:all` makes one click select the whole id ready to copy.

**Why the summary rather than the body.** The point is to follow a reference without opening anything. An id
inside the `<details>` body would need a reader to open every item in turn to find the one being discussed,
which is the problem restated.

**What was deliberately not done.**

- **No new data and no new id.** The chip renders `itemId`, which the existing `ITEM_RE` already captures and
  the anchor already uses. Nothing is generated, stored or derived, so the chip cannot disagree with the
  anchor, the `prio-finished` done-id list, or the `priorities/ranking` document.
- **No placeholder for an item with no id.** `itemId ? … : ""` emits nothing, and the ranked-row chip is
  emitted only for an id matching `^i-[a-z0-9]{5}$`, so a pick made before ids existed shows its title and no
  chip. `noId` already counts id-less items, and inventing something to show would have hidden them.
- **The anchors are untouched**, so existing deep links and every stored pick keep resolving. Verified by
  diffing the generated anchors before and after: identical.

**Measured, 2026-11-08.** Generated against `main` at `3f5e5a28`: `67 open, 951 done, 93% of 1018`, and the
HTML holds 67 `<li class="item">` rows and 67 `class="iid"` chips — one per rendered row, none missing.
`check-backlog-ids.mjs` reports 1018 items with 1018 unique ids, so no row could have been skipped. Published
as artifact version 224.

**Not verified here, and the test plan says so rather than assuming it:** how the chip looks on a phone at
375px, and the browser console. The built-in pane asks for a claude.ai sign-in it does not have, and refuses
to run page tools against a local file, so neither could be driven. Those three rows are in the plan's
**Left for manual verification** table.
