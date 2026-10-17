| `/privacy` | fixed | Contact e-mail link 22 px tall on the public pages check; now min-h-11. Nothing hidden. | this branch || `/outreach/[id]/edit` | fixed | Same cause as /outreach/new (same form). Nothing hidden. | this branch || `/outreach/new` | fixed | Sticky wizard bar assumes 24 px page padding; page had 16 px, so Thai overflowed 8 px. Page now p-6. Nothing hidden. | this branch |# Mobile sweep inventory (375 px, English and Thai)

Branch `claude/mobile-sweep`. **This file is the resume point**: a route with a verdict is done; the first group with blank verdicts is where to continue.

Generated 2026-10-17 from the filesystem: `find src/app -name page.tsx` (121 routes), grouped by path prefix. Regenerate the list, never hand-edit it, so none is missed.

Verdict is one of: `ok`, `fixed`, `not checked: <why>`. Any information moved or hidden on phones is named under "What was wrong".

## Progress so far (2026-10-17)

- `check-phone-width.mjs` now covers about 40 more routes plus 16 public pages. Admin in Thai ran clean except `/outreach/new` (fixed). Admin in English ran clean on the original 57 pages only; the extended set has not been run in English, nor for other roles.
- A clean machine check is NOT yet recorded as a verdict below: no route is marked `ok` until it has also been looked at in the browser pane (the check cannot see cramped or clipped layout). Next: run the check per role and per language, one at a time (the whole set exceeds a 10-minute command), then look at each group, then try the `fieldset { min-width: 0 }` rule.

## Public (16)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/` |  |  |  |
| `/about` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/adopt` |  |  |  |
| `/adopt/[id]` |  |  |  |
| `/adopt/international` |  |  |  |
| `/adopt/stories/[id]` |  |  |  |
| `/donate` |  |  |  |
| `/foster` |  |  |  |
| `/friends` |  |  |  |
| `/friends/join` |  |  |  |
| `/manual` |  |  |  |
| `/our-work` |  |  |  |
| `/our-work/[id]` |  |  |  |
| `/privacy` |  |  |  |
| `/releases` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/volunteer` |  |  |  |

## Account & sign-in (5)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/account/password` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/login` |  |  |  |
| `/login/forgot` |  |  |  |
| `/login/request` |  |  |  |
| `/no-access` |  |  |  |

## Admin (18)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/admin` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/blood-test-types` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/diets` | ok | Shown after Show anyway (desktop-only notice). Tables scroll inside their own box; nothing hidden. |  |
| `/admin/enclosures` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/facility-map` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/frequencies` | ok | As /admin/diets: table scrolls inside its box. |  |
| `/admin/immunization-types` | ok | As /admin/diets: table scrolls inside its box. |  |
| `/admin/medications` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/procedure-types` | ok | Rows stack name above count; nothing hidden. |  |
| `/admin/recent-changes` | ok | Log table scrolls inside its box; cramped but nothing hidden. Possible card layout later; not a defect at 375 px. |  |
| `/admin/role-draft` |  |  |  |
| `/admin/security` |  |  |  |
| `/admin/security/verify` |  |  |  |
| `/admin/status` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/website` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/who-does-what` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/who-does-what/details` |  |  |  |
| `/admin/zones` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

## Resident & day-to-day (30)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/appeals` |  |  |  |
| `/appeals/[id]` |  |  |  |
| `/assistant` |  |  |  |
| `/contacts` |  |  |  |
| `/contacts/[id]` |  |  |  |
| `/e/[id]` |  |  |  |
| `/enclosures` |  |  |  |
| `/enclosures/[id]` |  |  |  |
| `/home` |  |  |  |
| `/home/[role]` |  |  |  |
| `/my` |  |  |  |
| `/outreach` |  |  |  |
| `/outreach/[id]/edit` |  |  |  |
| `/outreach/new` |  |  |  |
| `/photos/add` |  |  |  |
| `/r/[code]` |  |  |  |
| `/residents` | ok | Zone chip strip scrolls sideways inside itself by design; nothing hidden. |  |
| `/residents/[id]` | ok | Long name wraps beside the photo; fits. |  |
| `/residents/[id]/[section]` | ok | Housing, photos and weight sections looked at, Thai, 375 px: fit. |  |
| `/residents/[id]/adoption-updates/[updateId]/edit` |  |  |  |
| `/residents/[id]/adoption-updates/new` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/deceased` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/deceased/undo` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. (Same markup as its sibling; the fix applied, this page itself not separately viewed.) | this branch |
| `/residents/[id]/edit` | ok | Heading already wrapped well (not flex); form fits. Looked at, Thai. |  |
| `/residents/[id]/hospital` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/hospital/return` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/move` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/rehome` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/rehome/return` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. (Same markup as its sibling; the fix applied, this page itself not separately viewed.) | this branch |
| `/residents/new` |  |  |  |

## Medical (18)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/appointments` |  |  |  |
| `/blood-tests/new` |  |  |  |
| `/clinic-visits/[id]/edit` |  |  |  |
| `/clinic-visits/new` |  |  |  |
| `/clinics` |  |  |  |
| `/clinics/[id]` |  |  |  |
| `/diets/[id]/edit` |  |  |  |
| `/diets/new` |  |  |  |
| `/immunizations/new` |  |  |  |
| `/medical/diets` |  |  |  |
| `/medical/photos` |  |  |  |
| `/medical/weight` |  |  |  |
| `/prescriptions/[id]/edit` |  |  |  |
| `/prescriptions/new` |  |  |  |
| `/procedures/new` |  |  |  |
| `/upcoming-visits` |  |  |  |
| `/weight/[id]/edit` |  |  |  |
| `/weight/new` |  |  |  |

## Operations & stock (11)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/bills` |  |  |  |
| `/deliveries` |  |  |  |
| `/maintenance` |  |  |  |
| `/maintenance/[id]` |  |  |  |
| `/maintenance/[id]/edit` |  |  |  |
| `/maintenance/new` |  |  |  |
| `/operations` |  |  |  |
| `/operations/medication-list` |  |  |  |
| `/projects` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/projects/[id]` |  |  |  |
| `/stocktake` |  |  |  |

## Management (23)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/management` |  |  |  |
| `/management/appeals` |  |  |  |
| `/management/appeals/[id]` |  |  |  |
| `/management/appeals/[id]/preview` |  |  |  |
| `/management/appeals/new` |  |  |  |
| `/management/cashflow` |  |  |  |
| `/management/cashflow/fixed-outgoings` |  |  |  |
| `/management/clinics` |  |  |  |
| `/management/clinics/[id]/doctors` |  |  |  |
| `/management/contacts` |  |  |  |
| `/management/dashboard` |  |  |  |
| `/management/diets` |  |  |  |
| `/management/donations` |  |  |  |
| `/management/donations/[id]` |  |  |  |
| `/management/donations/new` |  |  |  |
| `/management/medication-list` |  |  |  |
| `/management/medications` |  |  |  |
| `/management/purchasing` |  |  |  |
| `/management/recurring-jobs` |  |  |  |
| `/management/shelter-friends` |  |  |  |
| `/management/shelter-friends/new` |  |  |  |
| `/management/stock-usage` |  |  |  |
| `/management/translations` |  |  |  |


