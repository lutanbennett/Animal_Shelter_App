# Card walkthrough: facility cards, 2026-10-23

Stream `cards-run-facility`. Dev only, port 3005, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`). Cards: `enclosures`, `do_maintenance`, `recurring_jobs`.
Pages stream slowly on first hit (10 to 25 s); a header-only page is still loading.

## enclosures: PASS (1 finding)

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | `/home` shows **Enclosures** and an **Operations** tile (same extra Operations tile seen on the medical cards). |
| 1 Open `/enclosures` | pass | List and Map views, zone chips, search, sort, filter; 67 enclosures. |
| 2 Enclosures read only | pass | No add, edit or save control; only "Copy link" per enclosure. Every enclosure reads "0 residents" because a card login has no resident scope (known, `medical-diets-schema`). |
| 3 Refused: `/operations/medication-list` | pass | Redirects to `/no-access`. |

**Finding.** This login can open `/residents` (list shows "0 residents") and the page offers
**New resident (intake)**, **Book clinic visit**, **Log immunizations** and **Download spreadsheet**
buttons that the card does not grant. `/residents/new` itself is refused (`/no-access`), so nothing
is writable, but the buttons are offered. The top menu also shows Residents and Operations.

## do_maintenance: PASS (2 TODOs answered, 2 not drivable, 2 findings)

Job logged as `walk-do_maintenance` (M-5535, Cat Zone / Cat Enclosure, assigned to the card login).

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Opened `/maintenance` directly after sign-in; tile not separately re-checked (same `/home` tile grid seen on `enclosures`). |
| 1 Open `/maintenance` | pass | Filter by zone/enclosure/assignee, "Log maintenance", status chips. Defaults to "Me" (empty until assigned). |
| 2 TODO: log, change, assign, cost, delete | **answered** | See below. |
| 3 Move a job on | pass | Job page status buttons: In progress, Blocked, Completed each saved at once (server log shows `setMaintenanceStatus`). Blocked read-back on `/maintenance?assignee=me`: the job shows with the Blocked tag after reload. Completed read-back on the job page: "Completed 23 Oct 2026". |
| 4 Mark own recurring jobs done | pass (job side) | The completed job shows under "Done today (1)" with Undo on `/my`. This login has no recurring jobs, so the recurring side is covered by the `recurring_jobs` card below. |
| 5 Resident details read only | not testable | `/residents` opens with 0 residents (no resident scope on a card login, the known fault `medical-diets-schema` is fixing). Same as `enclosures`. |
| 6 Enclosures read only | pass | `/enclosures` loads, 67 enclosures, only "Copy link" controls, no add/edit/save. |
| 7 TODO: job photos | **answered, not driven** | Job page has "Add before photos" (the problem as found) and "Add after photos" (the finished work), each a section with a count. Uploads not driven: a file picker cannot be driven here. |
| 8 TODO: assistant | **answered, not driven** | An "Assistant" button sits in the header on every maintenance page. Its answer is shown in the assistant panel only; no row is written to a page. Not asked: it would spend assistant quota for no read-back. |
| 9 Refused: `/operations/medication-list` | pass | `/no-access`. |

**TODO 2 answer.** A job is logged on `/maintenance/new` in four steps (what is wrong, where, who and when, review) and appears on `/maintenance` (and under Assigned on `/my` once assigned). Status changes on the job page `/maintenance/<id>`. Assignee, zone, enclosure, due date and both costs change on `/maintenance/<id>/edit`; the cost shows as Estimated / Actual on the job page (Actual saved as ฿450, read back). **There is no delete control** on the board, the job page or the edit form for this card, so "delete" in the card's description is not offered here.

**Finding (not a fault in the card):** the first two cost saves came from setting field values by script and clicking Save; the form posted as a plain GET with every field in the URL (`...edit?jobId=...&actualCost=450`) and saved nothing. A real click and typed value saved fine. Recorded because a form submitted before the page's script is ready sends its fields (a title, a description) into the address bar and history; nothing was lost here, but nothing says "not ready yet" either.
