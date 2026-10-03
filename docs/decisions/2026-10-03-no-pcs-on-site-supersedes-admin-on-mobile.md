# 2026-10-03 — No PCs on site: the phone is everyone's tool but Admin's, which supersedes part of "Admin on mobile"

**This records a fact and what it overturns. It does not record the roles
design.** The roles and permissions paper (`docs/roles-and-permissions.md`) is
proposed and not agreed, and nothing here should be read as agreeing it.

**The fact.** Lutan, 2026-10-03, after talking to the Director: there are no PCs
on site. The only computer is the Director's, at home. And, the same day, on how
the Director herself works: *"the director will do management on her mobile
during the day, the 2ic will do her duties on the mobile during the day and admin
is done at night."*

So every role works on a phone and only on a phone, with one exception: Admin
work, done by the Director at night at her desk. The Director's own Management
work is phone work.

**What this supersedes.** `2026-09-24-admin-on-mobile-which-settings-and-management-pages-belong.md`
rested on two statements that are no longer true:

- *"The phone stays a field tool."* It is now the only tool five kinds of people
  have, and the Director's by day.
- *"Role angle: only admin reaches `/admin`, admin and management reach
  `/management` … The phone question is an admin's and a manager's."* It read
  the Management pages as desk work with the phone as a convenience. The
  Management pages are now phone work.

Its **measurements stand**: the widths recorded for each table on 2026-09-24 are
still the widths. Its **`LargerScreenNotice` stands as a mechanism**: layout, not
access control, with the page's own server-side guard as the only boundary. What
changes is which pages may wear it.

**The rule that replaces the list of verdicts.**

> A page may be desktop-only only if Admin is the only role that can open it.
> A page any other role can open is built for a phone first, and no "Best on a
> larger screen" notice stands in front of it.

It is about the role, not the person: the Director has a desk, and Management's
pages are still phone pages, because she opens them on a phone.

**What follows now, from the fact alone.**

| 2026-09-24 row | Then | Now |
|---|---|---|
| `/admin/zones`, `/admin/enclosures`, `/admin/immunization-types` | desktop only | **stands**: Admin's, at night |
| Residents bulk selection | desktop only | stands: Admin's |
| `/admin`, `/admin/security`, `/admin/website`, procedure and blood-test types | nice-to-have | unchanged |
| `/management/medications`, `/management/diets` | desktop only | **stands for prices and setup**, which is Admin work. The stock figure and its count are not: they belong on the phone stocktake |
| `/enclosures`, resident edit, intake | field-needed | field-needed, with more depending on it: `/enclosures` still scrolls sideways at 375 px |

**What cannot be settled until the Director answers**, because it turns on who
holds which page (the paper's §13 and its questions D1 and D2):
`/management/contacts` and `/management/vets` (desktop only on 2026-09-24), and
the pages built since then that the acceptance matrix marks desktop: Purchasing,
Stock between counts, Recurring jobs, Shelter Friends. The paper proposes a
verdict for each. Those are proposals.

**What this does not do.** No page was changed. The notice is still on every
page the 2026-09-24 decision put it on. The acceptance matrix's `device` column
still follows the old decision. The **Mobile responsiveness sweep** is now on
the critical path for every role but Admin; it stays parked, and scheduling it
stays Lutan's (ruled 2026-10-02). This file reports that to him and reopens
nothing.
