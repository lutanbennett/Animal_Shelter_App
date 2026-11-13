# Bills page: chips, drawn from the route registry (2026-11-13)

Lutan asked (2026-11-13, #crth0) for chips, or at least cards, in place of the four stacked links on `/bills`.

- **Chips, not cards.** One small component (`src/components/ActionChips.tsx`); three of the four labels already existed as `t.nav.*`. Cards would have cost four new sentences in two languages.
- **The gate is the route registry, not hand-written.** The page reads `routeFor(path)` then `canOpen(perms, route)`, the way `/management` does, so a chip and its destination read one entry.
- **`/bills/import` is now registered** (`bills.utilities` or `bills.general`, no `section`, `menu: false`). That is the same test as `canImportBills`; with no `section`, `sectionOf()` returns `undefined` so it adds nothing to any menu or count.
- New string pair: `t.nav.billsImport` ("Add from spreadsheet" / "เพิ่มจากสเปรดชีต"; Thai unreviewed).
- **Found, not changed:** a login holding only `bill_sites` cannot open `/bills` at all (`canUseBills` asks the filing activities), so the Bills settings chip is reachable only for someone who can also file. This is how the page already behaved; it is not new.
