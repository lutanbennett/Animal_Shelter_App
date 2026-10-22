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

## add_medical_photos: PASS (1 TODO answered from the app, not exercised)

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Signed in and landed on `/medical/photos` directly; tile not separately re-checked. |
| 1 Open `/medical/photos` | pass | Picker loads (Scan card, name search, residents by enclosure). |
| 2 TODO: Add a photo | **answered, NOT performed** | The browser pane cannot attach a file, and an upload writes to the real Drive folder. Answer read from the page and `src/app/api/medical/residents/[id]/photos/route.ts`: see below. Page reached for `Capwarn Test 0924` shows "Take a photo" and "Choose from phone". |
| 3 Resident details read only | pass | `/r/<id>` shows photo, code, size, housing and an "Add Medical Photos" button; no edit controls. |
| 4 Refused: `/operations/medication-list` | pass | `/no-access`. |

**TODO answer.** The photo is filed in the resident's Drive **Medical** folder and recorded as an attachment (`record_attachment()`, 0140). It never reaches the website. On the card itself the only read-back is a count ("N added") on the same page. The page says outright: "You can add photos here but not look at them again. Management can see them on the resident's record." So the read-back belongs on the resident's record, seen with a different login. Still untried: an actual upload and the record-side check.

## feed_special_diets: PASS

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | not separately checked | Signed in and went straight to `/medical/diets`; `/home` tile checked on card 1 only. |
| 1 Open `/medical/diets` | pass | Loads: today's date, Morning / Evening, residents by enclosure with diet, amount and meal times. |
| 2 Diet visible, read only | pass | Page says nothing is ticked off or recorded; the only controls are the two meal links. |
| 3 Resident details/housing visible, read only | pass | Name, Thai name and enclosure shown on each diet; no edit controls. |
| 4 Refused: `/operations/medication-list` | pass | `/no-access`. |

## Findings

1. **Shared sign-in (the planner's open question).** Three streams can share one machine, but not cleanly. `dev-signin.mjs --remove` deletes **every** `dev-signin-` login on dev, not just the caller's, and each run recreates the login with a new user id, so the older cookie stops working. I was signed out twice mid-walk. **I did not run `--remove`** at the end, because it would delete the other streams' live logins; my four logins (`dev-signin-cards-9b1db576`, `8e866d7e`, `818748c6`, `f9763f07`) are left for whoever finishes last to remove. Suggest `--remove` take a `--cards` filter or only remove its own.
2. **Step 0 says "home screen", the app lands on `/home`.** `/my` is empty for a one-card login. Nothing wrong with the app; worth saying in the step.
3. **First page hit is slow on dev** (10 to 15 s), and a page that shows only the header is still loading. Cost me several waits.
4. **Two TODOs answered in the generator** (`medical.weight`, `photos.resident_add` in `scripts/gen-card-walkthrough.mjs`). The photo one is from the page and the route, not from an upload (the pane cannot attach a file).
5. **No card failed.** Nothing filed on the backlog branch.
