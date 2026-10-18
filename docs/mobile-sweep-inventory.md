| `/medical/weight` | ok | Checked 2026-10-18 after the crash fix, admin, English and Thai, 375 px: no sideways scroll, no action under 44 px. |  |
| `/medical/photos` | ok | Checked 2026-10-18 after the crash fix, admin, English and Thai, 375 px: no sideways scroll, no action under 44 px. |  |
| `/appointments` | ok | Checked 2026-10-18 (`role-home-is-tiles`) as the throwaway doctor the script makes, now that the Doctor role on dev holds the Book clinic visits card and the home no longer redirects: English and Thai, 375 px, no sideways scroll, no action under 44 px. | `claude/role-home-is-tiles` |
| `/admin/security` | ok | Checked 2026-10-18 as a 2-step-verified admin the script now makes, English and Thai, 375 px: no sideways scroll, no action under 44 px, looked at. The access-request card and the add-login form fit. The users table scrolls inside its own box (as the other settings tables, `2026-10-18-admin-tables-cards-log-only.md`): the Email column fills the screen, so the role and other columns are off to the right until swiped. Nothing hidden or clipped; left as #713 judged. |  |
# Mobile sweep inventory (375 px, English and Thai)

Branch `claude/mobile-sweep`. **This file is the resume point**: a route with a verdict is done; the first group with blank verdicts is where to continue.

Generated 2026-10-17 from the filesystem: `find src/app -name page.tsx` (121 routes), grouped by path prefix. Regenerate the list, never hand-edit it, so none is missed.

Verdict is one of: `ok`, `fixed`, `not checked: <why>`. Any information moved or hidden on phones is named under "What was wrong".

## Progress so far (2026-10-17)

- `check-phone-width.mjs` now covers about 40 more routes plus 16 public pages. Admin in Thai ran clean except `/outreach/new` (fixed). Admin in English ran clean on the original 57 pages only; the extended set has not been run in English, nor for other roles.
- A clean machine check is NOT yet recorded as a verdict below: no route is marked `ok` until it has also been looked at in the browser pane (the check cannot see cramped or clipped layout). Next: run the check per role and per language, one at a time (the whole set exceeds a 10-minute command), then look at each group, then try the `fieldset { min-width: 0 }` rule.

## Public (16)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/about` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/adopt` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/adopt/[id]` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/adopt/international` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/adopt/stories/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/donate` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/foster` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/friends` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/friends/join` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/manual` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/our-work` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/our-work/[id]` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/privacy` | fixed | Contact e-mail link was 22 px tall; now min-h-11. Nothing hidden. | this branch |
| `/releases` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/volunteer` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |

## Account & sign-in (5)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/account/password` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/login` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/login/forgot` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/login/request` | ok | Public, Thai (English also measured), 375 px: no sideways scroll, looked at. |  |
| `/no-access` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

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
| `/admin/role-draft` | ok | Redirect only (to the enclosure, the resident, /operations/medication-list, /admin/who-does-what); no layout of its own. The target pages are in this inventory. |  |
| `/admin/security` | not checked: needs a 2-step-verified admin | Redirects to /admin/security/verify (looked at, ok) for the throwaway admin, so the users table, its role column and the access-request list were never seen on a phone. The brief names this users table as a starting point: do it with a verified login. |  |
| `/admin/security/verify` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/status` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/website` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/who-does-what` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/who-does-what/details` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/admin/zones` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

## Resident & day-to-day (30)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/appeals` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/appeals/[id]` | ok | Public appeal page; shares the progress component fixed under /management/appeals/[id], measured clean after the fix. | this branch |
| `/assistant` | ok | Fits. Example-question buttons are 20 px tall bare buttons, already ruled in 2026-10-07-bare-buttons-lightbox. |  |
| `/contacts` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/contacts/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/e/[id]` | ok | Redirect only (to the enclosure, the resident, /operations/medication-list, /admin/who-does-what); no layout of its own. The target pages are in this inventory. |  |
| `/enclosures` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/enclosures/[id]` | ok | Fits. The small "inside the shelter" badge beside the zone name wraps to two short lines; cramped, nothing lost. |  |
| `/home` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/home/[role]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/my` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/outreach` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/outreach/[id]/edit` | fixed | Same cause and fix as /outreach/new (same form). Nothing hidden. | this branch |
| `/outreach/new` | fixed | Sticky wizard bar assumes 24 px page padding; the page had 16 px, so Thai overflowed 8 px. Page now p-6. Nothing hidden. | this branch |
| `/photos/add` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/r/[code]` | ok | Redirect only (to the enclosure, the resident, /operations/medication-list, /admin/who-does-what); no layout of its own. The target pages are in this inventory. |  |
| `/residents` | ok | Zone chip strip scrolls sideways inside itself by design; nothing hidden. |  |
| `/residents/[id]` | ok | Long name wraps beside the photo; fits. |  |
| `/residents/[id]/[section]` | ok | Housing, photos and weight sections looked at, Thai, 375 px: fit. |  |
| `/residents/[id]/adoption-updates/[updateId]/edit` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/residents/[id]/adoption-updates/new` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/deceased` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/deceased/undo` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. (Same markup as its sibling; the fix applied, this page itself not separately viewed.) | this branch |
| `/residents/[id]/edit` | ok | Heading already wrapped well (not flex); form fits. Looked at, Thai. |  |
| `/residents/[id]/hospital` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/hospital/return` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/move` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/rehome` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. | this branch |
| `/residents/[id]/rehome/return` | fixed | Long resident name squeezed beside the icon and code, so the heading wrapped one word per line. Heading now flows as text on phones; desktop layout unchanged. Nothing hidden. (Same markup as its sibling; the fix applied, this page itself not separately viewed.) | this branch |
| `/residents/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

## Medical (18)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/appointments` | ok | Checked 2026-10-18 (`role-home-is-tiles`): doctor with a clinic and the Book clinic visits card, English and Thai, 375 px, no overflow. | `claude/role-home-is-tiles` |
| `/blood-tests/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/clinic-visits/[id]/edit` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/clinic-visits/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/clinics` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/clinics/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/diets/[id]/edit` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/diets/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/immunizations/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/medical/diets` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/medical/photos` | not checked: page crashes | the page crashes (server error) when opened with no resident, so there is no layout to judge. Real bug, filed on the backlog branch (ResidentPicker is passed the whole dictionary). Layout of the picker itself unseen. |  |
| `/medical/weight` | not checked: page crashes | the page crashes (server error) when opened with no resident, so there is no layout to judge. Real bug, filed on the backlog branch (ResidentPicker is passed the whole dictionary). Layout of the picker itself unseen. |  |
| `/prescriptions/[id]/edit` | ok | Checked 2026-10-18 on a living resident's prescription the script now seeds, admin, English and Thai, 375 px: the edit form fits, no action under 44 px. The date pickers' "Open calendar" buttons are 36 px bare buttons (a note, not a failure; the existing bare-button ruling). |  |
| `/prescriptions/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/procedures/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/upcoming-visits` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/weight/[id]/edit` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/weight/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

## Operations & stock (11)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/bills` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/deliveries` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/maintenance` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/maintenance/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/maintenance/[id]/edit` | fixed | Date field plus its Clear button overflowed 31 px in Thai (the date box could not shrink). DateInput now has min-w-0; fixes every date field beside a button. Nothing hidden. | this branch |
| `/maintenance/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/operations` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/operations/medication-list` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/projects` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/projects/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/stocktake` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |

## Management (23)

| Route | Verdict | What was wrong | Fixed in |
|---|---|---|---|
| `/management` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/appeals` | ok | Fits. The "no donations recorded" line under each progress bar is very faint; contrast, not layout, so left and noted. |  |
| `/management/appeals/[id]` | fixed | Raised / goal / funded numbers were squeezed to 14 px beside the thermometer and pushed the page 31 px wide. The row now wraps. Nothing hidden. | this branch |
| `/management/appeals/[id]/preview` | ok | Shares the progress component fixed under /management/appeals/[id]; clean after the fix. | this branch |
| `/management/appeals/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/cashflow` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/cashflow/fixed-outgoings` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/clinics` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/clinics/[id]/doctors` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/contacts` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/dashboard` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/diets` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/donations` | ok | Fits. In the list, a donor name wrapping beside the payment method makes two lines sit close together; cramped, nothing lost. |  |
| `/management/donations/[id]` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/donations/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/medication-list` | ok | Redirect only (to the enclosure, the resident, /operations/medication-list, /admin/who-does-what); no layout of its own. The target pages are in this inventory. |  |
| `/management/medications` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/purchasing` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/recurring-jobs` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/shelter-friends` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/shelter-friends/new` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/stock-usage` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |
| `/management/translations` | ok | Admin, Thai, 375 px: no overflow, looked at. |  |


