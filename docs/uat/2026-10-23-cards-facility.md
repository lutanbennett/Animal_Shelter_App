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
