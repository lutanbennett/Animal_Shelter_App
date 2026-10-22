# Card walkthrough: daily medical cards, 2026-10-22

Stream `cards-run-medical-daily`. Dev only, port 3007, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`). Cards: `administer_medication`, `record_weight`,
`add_medical_photos`, `feed_special_diets`.

**Note for the planner (shared cookie jar):** nothing observed yet.
**Note on speed:** the dev server streams pages slowly (10 to 15 s on first hit of a route). A page
that shows only the header is still loading; wait before calling it blank.

## administer_medication: PASS

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | `/home` shows **Administer Medication** and an **Operations** tile. The doc says `/my`; `/my` is empty for this login, `/home` is the landing page. |
| 1 Open `/operations/medication-list` | pass | Loads, with Morning / Lunch / Evening, pick list, by resident. |
| 2 Prescriptions visible, read only | pass | Medicine, dose, frequency listed; page says nothing is ticked off. Only links, no save controls. |
| 3 Resident details/housing visible, read only | pass | Names, enclosure, "not in an enclosure today" shown; no edit controls. |
| 4 Refused: `/medical/weight` | pass | Redirected to `/no-access` ("You don't have access to this page"). |
