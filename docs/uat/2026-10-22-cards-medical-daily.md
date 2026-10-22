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

## record_weight: PASS (1 TODO answered)

Used the existing dev test resident `Capwarn Test 0924` (R-0079): this card cannot create a resident, so a
`walk-record_weight` named record was not possible. Weight written: 4.2 kg.

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Reached `/medical/weight` directly after sign-in; tile not separately re-checked (see card 1 for the home screen). |
| 1 Open `/medical/weight` | pass | Picker loads: Scan card, name search, "Weigh these first", residents by enclosure. |
| 2 TODO: Weight | **answered** | See below. |
| 3 Resident details read only | pass | `/residents/<id>` redirects to `/r/<id>`: photo, code, size, with-us-since, housing, and a "Record Weight" job button. No edit controls. Weight history is NOT shown there. |
| 4 Refused: `/operations/medication-list` | pass | `/no-access`. |

**TODO answer.** The weight goes to the `weight` table, one row per resident per day (a second save the same day replaces it). It shows:
1. straight after saving, on `/medical/weight` as a green line "Saved: <name>, <kg>";
2. on `/medical/weight?resident=<id>` as "Last time: <kg>, <date>" and "Today already has <kg>. Saving will replace it." (button turns to "Replace today's weight"), plus a "Recent" list once there are two or more readings.
The full Weight section `/residents/<id>/weight` is **refused** to this card (`/no-access`): that is by design, it belongs to the record cards.

**Cookie jar finding (for the planner).** Signed out twice during this card, about 5 minutes apart ("you were signed out because you haven't used the app for a while"). The login's user id changed each time I re-ran the script, so the script recreates the login. I did not run `--remove`, so either another stream did, or an idle timeout fired. Not proven which.
