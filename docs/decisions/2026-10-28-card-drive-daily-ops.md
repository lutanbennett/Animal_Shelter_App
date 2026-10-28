# Card drive: `recurring_jobs`, `my_tasks`, `enclosures`, `dashboard`, driven again (2026-10-28)

All four were last driven on 2026-10-25 or 2026-10-26 and not since, so all four were re-passes after `0268`/`0269` changed cards 11 to 29
and after the #965 app half moved the menus. Step zero checked each separately rather than the group: `0276` (merged the batch before) touches none
of them (it adds `photos.resident_medical`), but `0268` names `recurring_jobs`, `my_tasks`, `enclosures` and `dashboard`.
Nothing was fixed and no card proposed (Lutan: the log is reviewed as a set).

**How:** `node scripts/dev-signin.mjs --cards <card> --port 3005`, one card-only login per card, aal1, no page asked for a second step. Every page was reached by clicking
through from Home or the menu, never by typing its address, because the built-in pane cannot hydrate a direct load (the 2026-10-28 brief). Only the
refusal checks typed an address, since a refusal is decided on the server. All **23 numbered steps** were walked (6, 4, 5, 8). Rows are in
`docs/card-access-faults.md` under "Added 2026-10-28 by `claude/card-drive-daily-ops`".

## Result per card

| card | steps | pass | fail / not met | what changed since the earlier walk |
|---|---|---|---|---|
| `recurring_jobs` | 6 | 6 | 0 | the menu lost its Residents entry; the save path (create, assign, appears on /my, Done) is unchanged and works |
| `my_tasks` | 4 | 4 | 0 | the menu lost its Residents entry; the note typed with Done is still not shown back |
| `enclosures` | 5 | 5 | 0 | **the 2026-10-25 "wrong, not just empty" row is closed**: Cat Enclosure now reads 5 / 5 Full and an enclosure's page names its residents |
| `dashboard` | 8 | 6 | step 3 (Cashflow refused), step 4 (resident figures still read 0, visit rows read "Unknown resident") | clinic visits (5) and open jobs (11) now read; the resident figures do not |

## The three findings worth Lutan's attention

1. **`dashboard`: the Appointments page offers Edit to a read-only login.** Pressed, it goes to `/no-access`. That is the "a button is shown only if the login's cards
   let it do that action" rule (2026-10-27), and it is a control the walkthrough would not have found, because it sits on a page the menu adds and no step opens.
   Where it lives: `/upcoming-visits`; the activity to ask is whatever `/clinic-visits/<id>/edit` asks. Found, not fixed.
2. **`dashboard`: the resident figures are still wrong and say nothing.** In care, In the shelter, Fostered and every intake line read 0 on a database that holds 55 residents in
   enclosures. Clinic visits and maintenance are fixed since 2026-10-25. A figure that reads 0 for a reason the page does not give is the fault the first row named.
3. **`dashboard`: `reports.cashflow` read still opens nothing.** Both Cashflow pages refuse the login, and nothing on the dashboard links to them, so step 3 cannot be done and the card's own read cell is a promise it does not keep.

## What the pane did and did not do

`requestAnimationFrame` fired on every page driven, and each page hydrated after a click-through, so none of the rows above is the pane. The first screen after a sign-in (a direct load of `/my`)
showed only the layout, exactly as the brief said, and was never recorded as anything.

## Not driven, said plainly

Skip and Undo on My tasks; Resume, Edit, Delete, Give back and "from now on" Hand over on Recurring jobs; the Map view, Search and Sort on Enclosures; Copy as text and Print on the dashboard; a
resident page. The 2026-10-26 `recurring_jobs`/`my_tasks` row "a job that links to no page asks for no card" was not re-tested and stands.

## Evidence left on dev

Two recurring jobs, "walk-recurring_jobs 1028" and "walk-my_tasks 1028", each with today's date marked done, and four disposable logins (`dev-signin-a3ea274c`, `dev-signin-381b9992`,
`dev-signin-95b59328`, `dev-signin-f90453ec`). Nothing was removed (a broad `--remove` would sign the other streams out). `enclosures` and `dashboard` wrote nothing.
