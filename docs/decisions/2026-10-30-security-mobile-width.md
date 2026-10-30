# Settings -> Security at 375 px (2026-10-30)

**Measured** (`check-security-role-picker`, 375x812): scrollWidth 631. The element sticking out was the role `select` and its wrapper `div.flex.flex-wrap.items-center.gap-2` in `AccessRequests.tsx` (the access-request rows), not the chips in `UsersTable.tsx`. A select is as wide as its longest option and a flex item will not shrink below that.

**Fix:** `min-w-0 max-w-full` on that wrapper and on the select, so the row wraps and the select narrows. No access, gate or action changed.

**Interception verdict:** the stall WAS caused by the overflow. Before: the submit click timed out ("fixed inset-0 z-40 ... intercepts pointer events"). After the width fix, with no change to `Modal.tsx` or the harness's clicks, every check passes ("All checks passed."). It was not a stray overlay.

**Harness:** gained a check that the page has no sideways scroll, printing the first offending elements, so a regression names itself.

**Rest of the page:** `check-phone-width` narrowed to this page (admin, en): no sideways scroll, no text control under 16 px, every component action at least 44 px as reported. Not settled: the report also lists many 26 px / 32 px chip and menu buttons in the people table under tap-size; I did not touch them.
