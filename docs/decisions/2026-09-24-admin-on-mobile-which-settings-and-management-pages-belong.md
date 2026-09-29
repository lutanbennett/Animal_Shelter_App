# 2026-09-24 — Admin on mobile: which Settings and Management pages belong on a phone

The phone stays a field tool. Every `/admin` and `/management` route was
opened at 375px as admin (dev, 2026-09-24) and measured: `scrollWidth` of each
table box against the 325px it has. No page breaks the layout — every table
already scrolls inside its own box — so the question was which pages are
worth using there, not which ones are broken.

| Route | Verdict | Why |
|---|---|---|
| `/admin` (Settings tiles) | nice-to-have | Fits; the way in to Security on a phone |
| `/admin/security` | nice-to-have | Access requests and Create user sit on top and fit — approving someone at the gate is real. Users table is 749/325, so changing a role means a sideways scroll |
| `/admin/website` | nice-to-have | Fits (nothing overflows); uploading a gallery photo straight from the phone is a real use |
| `/admin/procedure-types`, `/admin/blood-test-types` | nice-to-have | Fit exactly (325/325), buttons stack; adding a missing type mid-visit is plausible |
| `/admin/zones`, `/admin/enclosures`, `/admin/immunization-types` | desktop only | Rare setup; inline-edit tables 434–624/325 put Edit off-screen |
| `/admin/contacts`, `/admin/vets` | n/a | Redirects to `/management/*` |
| `/management` (tiles), `/management/dashboard`, `/management/translations` | nice-to-have | Fit; dashboard was built mobile-first |
| `/management/cashflow` | nice-to-have | Already adapted: chart hidden on phones, compact table scrolls on purpose |
| `/management/contacts`, `/management/vets` | desktop only | 1151 and 773/325; the field lookups are `/contacts` and `/vets`, which the subtitles link to |
| `/management/medications`, `/management/diets` | desktop only | Stock and cost setup; 681 and 636/325 |
| Residents bulk selection | desktop only | Already `hidden md:table-cell` by design; nothing to change |
| `/enclosures` filters and cards | field-needed | Chips scroll in their strip, but the page itself scrolls sideways (492px): the per-zone card grids have no column template below `sm` — sweep item |
| Resident edit, intake | field-needed | Fit at 375 (measured); long but single-column, intake is a step wizard |

**Desktop-only pages show a notice, not nothing.** Below `md` they render
`LargerScreenNotice` — "Best on a larger screen" with a **Show anyway** button
that reveals the page — and their Settings/Management tiles carry a
phone-only "Larger screen" pill. A hidden page is indistinguishable from a
broken one to someone following a link, and an admin fixing a typo in the
field can still do it. The switch is CSS until the button is pressed, so the
server render is right at both widths. It is **layout, not access control**:
each page keeps its own server-side role guard, which is the only boundary.

**The nav is unchanged.** Settings and Management each still hold pages that
work on a phone, so neither entry is desktop-only; the pills on their tiles
do the warning. Measured as fitting was reason enough to leave procedure and
blood-test types without the notice even though they are setup pages — a
notice in front of a page that works is friction for nothing.

**Role angle:** only admin reaches `/admin`, admin and management reach
`/management`; staff, vets and volunteers see neither, so nothing changes for
them. The phone question is an admin's and a manager's.

**For the Mobile responsiveness sweep** (backlog), which inherits this list:
the field-needed rows above — `/enclosures` first, the one page found
scrolling sideways as a whole, recorded with its cause on the sweep item —
plus Security's users table role column (the one nice-to-have page that
scrolls sideways to reach a control).
