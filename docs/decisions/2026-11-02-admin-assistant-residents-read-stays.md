# `residentNames()` on /admin/assistant stays on `residents`

**Question:** should the name lookup in `src/lib/assistant/could-not-help.ts` move to `resident_who_and_where`, as the six reads in #1145 did?

**Which cards reach the screen: none.** `src/app/admin/assistant/page.tsx` calls `requireAdminUser()` (`src/lib/auth/require-admin.ts`), which asks `perms.isAdmin` and nothing else. The dashboard tile in `src/app/admin/page.tsx:136` is gated the same way. The page's own comment says "Admin only, by the Admin rule and no card". (The item said the screen asks `resident.record`; it does not.) No card can open it.

**Why the read stays:** the only caller is Admin, who sits outside the card system and passes every row policy. A swap would add a `where` gate (`works_with_residents()`) that Admin passes anyway, so it narrows nothing for anyone who can reach the screen. Not measured against a live database: no non-Admin login can be driven to this page.

**Other callers:** `residentNames()` has one caller (the page). The export route does not use it and carries ids only. `src/lib/audit/recent-changes.ts:274-280` has its own separate `residents` name read for `/admin/recent-changes`; not touched, for the planner to judge.

No code changed.
