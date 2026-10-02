# Dry run of the acceptance checklist — Staff role

| | |
|---|---|
| Role | **Staff** only — one role per run (Lutan, 2026-10-03). Six roles remain |
| Run by | Claude (`claude-fable-5-1`), driving the app in the desktop app's browser pane |
| When | 2026-10-03, about 00:30 – 03:00 Thai time (so the whole run fell inside the hours when UTC is still "yesterday") |
| Site | Local dev server `http://localhost:3005`, branch `claude/dry-run-staff` cut from `main` at `8743055` |
| Database | dev Supabase project `qxkmhwybjggxvsfxsxbd` — disposable data, never production |
| App version | 0.15.0, plus the "Not released yet" notes |
| Checklist | `node scripts/acceptance-matrix.mjs --role staff`: **60 "does" rows, 31 "must not" rows, 4 boundaries** (the brief says 5; the sheet prints B1–B4) |
| Primary pass | **Phone, 375 × 812**, touch emulation, English then Thai. Desktop (1280 × 800) is a secondary sweep |
| Signs anything? | **No.** A rehearsal. The shelter's sign-off stays with the people who use the system |

## Executive summary

**Staff can do their job on a phone, and nothing they must not reach is
reachable — but two things on their list do not work at all, two more are
refused for the wrong reason, and the phone layout hides controls on the page
they use most.**

What worked: of the 58 activities staff do on a phone, **53 passed in English**
(44 cleanly, 9 with a defect noted), 1 was only simulated (offline) and 1 could
not be finished (password reset needs a real mailbox). All **31 "must not"
rows and all 4 boundaries held**: every Management and Settings address typed
as staff lands on a polite page inside the app — "You don't have access to this
page … ask a manager or an admin." The Thai app is thoroughly translated: 27
activities were repeated in Thai and behaved the same, and the pages of another
26 were checked for leftover English — the only gaps are Release notes and the
manual (English-only), photo folder names, and names typed in by an admin.

What a shelter worker would hit, in the order it matters:

1. **Staff cannot log a blood test** (F-01). The form is there, the manual says
   staff can, and saving answers "You don't have permission to do that." The
   database never gave staff that permission.
2. **Scan a chip never finds anyone** (F-02). A chip recorded a minute earlier
   returns "0 residents". One line of code is testing for the letters *d* and
   *s* instead of digits; it has been that way since 29 September.
3. **Before 07:00 Thai time, today's date is "in the future"** on immunizations
   and blood tests (F-03), and **an animal cannot be moved on the day it
   arrives** (F-04). Both refusals are polite and both are wrong for the person
   holding the animal.
4. **The resident page is wider than a phone** (F-05): the Edit pencil and the
   Record-death heart sit off the right edge for every resident tried. Seven
   other pages run wide too (F-06), and in Thai the header's Sign out is cut on
   every page (F-07).
5. **On a phone, the main actions are pictures with no words** (F-08). "Tap New
   resident (intake)", "tap Move enclosure", "tap Send to hospital" — none of
   those words is on the screen at 375 px. This is the "had to know where to
   look" problem the backlog item names, and it is the commonest reason a row
   below is rated *some friction* rather than *easy*.

The good news is specific too: Stocktake, the enclosure page, the job page
(four big status buttons), the intake wizard and every confirmation question
are properly built for a phone, and the two desktop-only rows deprive a
mobile-only staff member of nothing (see *The two desktop-only rows*).

**Read the caveats before relying on any single cell**: this was an emulated
phone driven by a model that cannot read Thai, at one o'clock in the morning.
The section *Could not test* lists what the shelter's own run must cover.

## How it was run

### The staff account (read this before running the next role)

The brief's mechanic is "one admin account changes a test account's role". It
could not be followed as written:

- The dev test login in `.env.local` (`claude@lutan.com`) is an **admin** that
  other live sessions use, so its role was left alone.
- Reading that account's stored password in order to sign in as admin was
  **refused by the permission classifier** (credential materialisation). It was
  not worked around.
- Instead a **separate disposable account** was created on the dev project the
  way `scripts/check-access-requests-card.mjs` creates its throwaway users
  (service role: create the auth user, insert a `user_roles` row):
  **`dryrun-staff-20261003@example.test`**. Its password is a test value
  recorded only in this worktree's gitignored `.env.local`
  (`DRYRUN_STAFF_EMAIL`, `DRYRUN_STAFF_PASSWORD`) and was changed once through
  the app (row R003).
- It was **management for about five minutes**, to seed six recurring jobs
  through Management → Recurring jobs, and was then switched to **staff** by the
  same script and hard-refreshed. Everything recorded below was done as staff.

### Caveats about the instrument

- **I am not the user.** I can read the page's structure and I never mistype on
  glass. Every ease-of-use rating is judged against *a non-technical shelter
  worker, on their own phone, in a kennel, with no one to ask*, and is backed by
  a count — taps, screens, pixel sizes — wherever one could be taken.
- **Emulated phone, not a real one.** 375 × 812 with an Android user agent and
  touch points. Photos were supplied as generated files through the page's file
  picker; the camera was never opened.
- **Where a page ran wider than the screen, taps could not be aimed** in the
  emulator. That is every resident hub, intake step 2, the edit form, the
  deliveries page, and **every page in Thai** (the header runs 10 px wide). On
  those, controls were pressed through the page's own click handler and text
  was typed into the focused box. The overflow is itself the finding; it did
  not stop the activity being exercised, but it means *"easy to tap"* was
  measured in pixels rather than felt.
- **I do not read Thai.** I can see that Thai text is present, fits and is not
  English. Whether it reads naturally needs a Thai reader — for every Thai cell.
- The small round **"N" badge** bottom-left in screenshots is Next.js's
  dev-server indicator, not part of the app.
- Nothing in the app changed during the run: `main` did not move under
  `src/app`, `src/components` or the manual.

## Findings

Ranked **blocks a role / wrong result / friction / polish**. Each row is
written to be pasted into `docs/backlog.md` under its heading. **None has been
raised** — Lutan reviews, and the ones he accepts go onto the `backlog` branch.
Screenshots are in [`dry-run-2026-10-03-staff/`](dry-run-2026-10-03-staff/).

| # | Severity | Title | Where | What happened | Suggested fix |
|---|---|---|---|---|---|
| F-01 | **blocks a role** | **Staff cannot log a blood test** | Resident → Blood Tests → Log blood test (R043) | As staff, with or without a file: "You don't have permission to do that." (Thai: "คุณไม่มีสิทธิ์ทำสิ่งนี้"). The manual and the checklist say staff do this. `blood_tests` has only a *select* policy for staff (`0001_initial_schema.sql:534`); `procedures` was given its staff insert and update in `0031`, blood tests never were. The form, the "+" and the "Log blood test" link on a visit are all offered. Shot `16` | A schema PR adding staff (and, if missing, management) insert/update policies on `blood_tests` like `0031` did for `procedures`; add blood tests to a role check script |
| F-02 | **wrong result** | **Scan a chip never finds a resident** | Residents → Scan a chip (R020); `src/app/residents/page.tsx:119` | Recorded chip 900263000394001 on R-0394, typed it into Scan a chip: "0 residents — No residents match these filters". Same in Thai with a second chip. The chip-specific "not found — register a new resident?" message never shows either. The test reads `/^[ds-]+$/` — the backslashes are missing, so it matches the letters d and s, never digits. In the file since 2026-09-29 (`108415ac`). Shot `10` | `/^[\d\s-]+$/`, plus a check that looks a chip up **through the page**, not only in the database |
| F-03 | **wrong result** | **Before 07:00 Thai time, today's date is refused as "in the future"** | Log immunization (R035), Log blood test (R043) | At 01:00 on 3 Oct, the forms' own default date (3 Oct) was refused: "Date administered can't be in the future" / "Test date can't be in the future" (Thai: "วันที่ฉีดต้องไม่เป็นวันในอนาคต"). UTC was still 2 Oct. Weight, vet visit, death, stocktake and delivery accepted 3 Oct in the same hour, so only some forms use the UTC date. Early-shift staff meet this every morning until 07:00. Shots `14`, `15` | Use the shelter's "today" (the helper `check-shelter-today.mjs` guards) in these two validations; grep for other "can't be in the future" checks |
| F-04 | **wrong result** | **A resident cannot be moved on the day it arrived** | Resident → Move enclosure (R026) | Intake today, move today: "The move date must be after the current placement started." The only way round is to wait a day, when the record will carry the wrong date. The same rule would refuse a hospital admission and return on one day. Shot `09` | Allow a change on the same day (on or after), or tell the user what to do instead |
| F-05 | **friction** | **The resident page is wider than a phone; Edit and Record death are off-screen** | Resident hub header (R023, R025, R032) | 423 px of content on a 375 px screen for every resident tried, long name or short. The pencil is 8 px visible, the heart not at all; "Record chip", the intake date and "Copy link" are cut. The assistant's Close button goes off-screen with it. Shots `04`, `05`, `08` | Let the header's text column shrink (`min-w-0`), wrap the icon row under the name at phone width |
| F-06 | **friction** | **Seven more pages scroll sideways on a phone** | Enclosures list (+117 px), Vets list (+172), Deliveries (+76, +114 in Thai), Intake step 2 / Edit resident / Return from hospital / Return to shelter (+31), a vet's page (+31), Contacts (+29), Book vet visit (+4) | Card titles and pickers do not wrap or shrink: "Blue Enclosure 3 (Hallway Small Dogs Only)" stretches every enclosure card to 468 px, so the "Space available" pill and the open-jobs count fall off the edge; the Enclosure picker grows to its longest name; Deliveries cuts its Note box; Contacts cuts the fourth button. The checklist's own R046 says "The page does not scroll sideways" — it does. Shots `07`, `19`, `22`, `23`, `28`, `30` | Truncate or wrap titles, cap pickers at the column width, stack Cost and Note on a phone; add a 375 px overflow check to the gates |
| F-07 | **friction** | **In Thai the header's Sign out is cut off on every page** | Header, Thai, phone | "ออกจากระบบ" ends 10 px past the edge, so every Thai page is 10 px too wide and scrolls sideways a little. Shot `29` | Drop the email-less header to an icon for Sign out at phone width, or move it into the ☰ menu |
| F-08 | **friction** | **On a phone the main actions are icons with no words** | Residents list (Log immunizations, Book vet visit, New resident — 38 px); hub cards (titles are icons; Send to hospital / Foster-adopt / Move / "+" are 30 px); Edit and Record death (24 px); header Assistant; a vet's page (three cards differ only by icon) | The checklist says "tap New resident (intake)", "tap Move enclosure", "tap the Housing & Status title"; at 375 px none of those words is shown. A card reading "3" beside a droplet is blood tests. At 1280 px the same controls carry their words — this is phone-only. Shots `08`, `11`, `13` | Show the label under or beside each icon at phone width and make the targets at least 44 px |
| F-09 | **friction** | **Row actions are 16 px-high text links, and End today asks nothing** | Vet Appointments, Prescriptions, Diet, Weight, Procedures rows; job page "Edit details" | Edit (22 × 16 px), End today, Remove, Log blood test, Add prescription, Log weight, Log procedure, Send to hospital sit side by side, a few pixels apart. **End today** acts at once with no question and no message — only the date range changes. Shot `17` | Make them buttons of at least 36–44 px; confirm End today or offer Undo |
| F-10 | **friction** | **A refused save throws away what was chosen** | Move enclosure, Log immunizations | After "must be after the current placement started" the Zone and Enclosure pickers are empty again (and a stale "0 / 4 · Space available" stays). After "can't be in the future" every vaccine tick is cleared. Shot `09` | Keep the form's values when the server refuses |
| F-11 | **friction** | **Release notes and the manual are English in Thai mode** | Release notes (R010), User manual (R013, R093) | With the app in Thai, Release notes — heading, intro, "Show everything", every note — is English; the manual says "English only for now". A Thai-reading staff member cannot read what changed or where to get help. Also English in Thai mode: photo folder names (Shelter / Medical / Foster / Adoption), the public Foster, Volunteer and Donate pages and parts of Home and Adopt, and every immunization, procedure and blood-test type name | Translate the Release notes page chrome now; plan the Thai manual; fill the public texts at Management → Translations; give reference lists a Thai name |
| F-12 | **friction** | **"Invalid login credentials"** | Sign-in page (R001) | A wrong password shows the auth service's own English phrase — in Thai mode too — and empties both boxes, so the email is typed again. Shot `02` | "That email or password isn't right. Try again, or tap Forgot password?", translated, and keep the email |
| F-13 | **friction** | **ID search needs the hyphen; the search box is 61 px wide** | Residents → Search (R019) | "R-0055" and "0055" find the resident, "R0055" (how the checklist and manual write an ID) finds nothing. On a phone the box shares a row with four buttons and shows about four characters. Shot `11` | Ignore hyphens and spaces when matching an ID; give the box its own full-width row |
| F-14 | **friction** | **The assistant stays open over the page it just opened** | Assistant → Open resident / Open enclosure (R012) | The page behind changes; the assistant still covers the whole phone. A new confirm card opens *under* the message box, so Confirm is off-screen until you scroll. For a fostered animal it answers "is at Fostered (status)" with an "Open enclosure" link. Shots `03`, `06` | Close the panel when one of its links is followed; scroll a new card into view |
| F-15 | **friction** | **Record a delivery is only reachable from Stocktake** | Deliveries (R070) | Not in the menu; the only way in is a 20 px-high link at the top of Stocktake. Its help text sends staff to "Stock between counts", and Foster or adopt to "Management → Contacts" — pages staff cannot open | A menu entry (or a clear button on Stocktake); do not name pages the reader cannot reach |
| F-16 | polish | **Sign-in is at the bottom of the public home page** | Public site, phone (R001) | "Staff login" is the last link in the footer, 6.7 screens down, and not in the ☰ menu. Shot `01` | Add it to the ☰ menu |
| F-17 | polish | **"Getting help" names nobody** | Manual, last topic (R093) | "tell the person looking after the app" — no name, phone or LINE | Name the person and how to reach them |
| F-18 | polish | **Developer's words on staff screens** | Several | "Structured values from OCR are a future build" in the blood-test notes box (translated into Thai too); a **Dev** tag on every release; "Lifecycle" as a zone; "Amoxicillin 250mg tablet (tablet(s))"; "via the assistant" left English inside a Thai sentence; the adopter is called **Carer**; "You're browsing as a guest" on Adopt while signed in; photo dates as 2026-10-03 where everything else says 3 Oct 2026; the manual tells a phone user to press Ctrl+F | Reword; hide the Dev tag from non-admins |
| F-19 | polish | **Validation speaks the phone's language, not the app's** | Intake, Change password, Deliveries | Empty or out-of-range fields get the browser's own bubble ("Please fill in this field", "Value must be 03/10/2026 or earlier"), which follows the phone's language setting rather than EN / ไทย | App-worded messages for the fields staff meet most |
| F-20 | polish | **After adoption the "Ready for adoption" badge and its warning stay** | Resident hub (R030) | An adopted resident still shows "Ready for adoption" and "Ready for adoption but no microchip number recorded". The public Adopt page listed the animal on its first load about 20 s after the adoption, and not on the next | Clear the flag on adoption (and on death); shorten or bust that cache on a lifecycle change |
| F-21 | polish | **My tasks: no trace after a reload; a "waiting" job can still be done** | My tasks (R018) | Once the page reloads there is nothing to show what you marked done or skipped today, and no way back. "Waiting for …" is a label only — Done works on a waiting job without a question. The menu badge did not drop while a maintenance job sat at Completed | A "Done today" strip with Undo; ask before finishing a waiting job |
| F-22 | polish | **Change password does not ask for the current one** | Change password (R003) | Two boxes, new and confirm. Anyone holding an unlocked, signed-in phone can set a new password. The button reads "Set password" under a "Change password" heading | Ask for the current password; align the button label |

**Not findings, but worth knowing:** a new diet is added *beside* the current
one rather than replacing it; a procedure has no Remove for staff (weights,
prescriptions, visits and immunizations do); saving a death takes 15–20 s
("Recording…"); a visit dated in the past is saved as Completed without being
asked; people with no name on their account are listed by email address in
assignee pickers.

## The matrix

**Functionality** — **P** pass · **P\*** pass with a defect (see the note) ·
**F** fail · **sim** simulated only · **insp** the page was loaded in that
language and checked for leftover English, cut-off text and overflow, but the
activity was not repeated · **EN** the screen is English-only · **lay** layout
checked at 1280 px in Thai, activity not repeated · **nr** not run · **–** not
done on that device.

**Ease** is for a phone at 375 px: **easy / some friction / hard**.

| # | Activity | EN phone | ไทย phone | Desktop EN · ไทย | Ease on a phone | Taps · screens | What happened |
|---|---|---|---|---|---|---|---|
| R001 | Sign in and sign out | P | P\* | nr · P | some friction | 2 taps + typing; link is 6.7 screens down | Lands on My tasks. Sign out goes to the **sign-in page**, not the public site. Wrong password: F-12 (English in Thai mode). F-16 |
| R002 | New password after forgetting | nr | insp | – | – | – | Page is one box and one button, translated. Not submitted: the test address has no mailbox |
| R003 | Change your password | P | insp | nr · lay | easy | 3 taps + typing, 1 screen | "Password changed." Old one refused afterwards, new one works. F-22 |
| R005 | Asked before something irreversible | P | nr | nr · nr | easy | – | Delete an adoption update: "Delete this update and its photo?" — Cancel changes nothing. Record death: full dialog, "Only an admin can withdraw this afterwards". Delete job warns "This can't be undone". Shots `18`, `21` |
| R006 | Offline warning | sim | nr | – | easy | – | Red bar "You're offline, changes will not save." on a simulated offline event; gone when back online. Shot `12` |
| R007 | Switch English / Thai | P | P\* | P · P | easy | 1 tap | Everything in the app's own screens switches and stays switched after signing out. Thai cuts the header (F-07); Release notes and the manual stay English (F-11) |
| R008 | Print the manual as a PDF | – | – | P · P | – | 1 tap | `lanna-care-manual-staff.pdf`, 22 pages, about 5 s, the same (English) file in both languages. See *The two desktop-only rows* |
| R009 | Find your way around the menu | P | P | P · P | easy | 1 tap | My tasks (badge), Residents, Enclosures, Maintenance, Stocktake · Vets, Contacts, Projects · User manual, Release notes, Change password. No Management, Settings or Security. Rows 36 px high. Fully Thai |
| R010 | Read the release notes | P | **EN** | nr · lay | easy | 2 taps | "Showing the changes for the Staff role"; 0.15.0 current. English-only (F-11) |
| R011 | Ask the assistant a question | P | P | nr · nr | easy | 3 taps | "Where is Angsumalin?" answered at once with a card; Thai question answered in Thai. No confirm card |
| R012 | Record something with the assistant | P | P | nr · nr | some friction | 4 taps + typing | 13.1 kg confirmed and found on the resident's weight card. Thai: card shown, **Cancel** → "ยกเลิกแล้ว ไม่มีการเปลี่ยนแปลงใด ๆ" (Thai Confirm not repeated). F-14 |
| R013 | Read what your role can do | P | **EN** | nr · lay | some friction | 2 taps; 54 screens long | Opens on "the 42 topics for the Staff role", Staff marked **You**. Contents links 24 px high |
| R015 | See maintenance jobs assigned to you | P | P | – | easy | 0 taps (home page) | Maintenance section under the recurring jobs, with place and due date; the badge counts it |
| R016 | Change a job's status from My tasks | P | P | – | easy | 1 tap each | Four chips (26 px): Not started, In progress, Blocked, Completed. Completed removes the job and shows Undo; Undo restores the previous status |
| R018 | Mark a recurring job done or skipped | P | P | – | easy | Done 1 tap; Skip with note 3 taps + typing | Job leaves the list with an Undo banner; "Waiting for …" cleared when the first was done; survives a reload. F-21 |
| R019 | Find a resident | P\* | insp | nr · lay | some friction | 2 taps + typing | Name, Thai name, On-site / Off-site and a zone chip narrow the list; "75 residents · 7 deceased hidden". F-13 |
| R020 | Find a resident by microchip | **F** | **F** | nr · nr | **hard** | – | 0 residents for a chip just recorded. F-02. Shot `10` |
| R021 | Record or correct a microchip | P | P | nr · nr | easy | 3 taps + typing | "12345" refused with a plain message; spaces and dashes accepted; a number another resident has is refused (Thai message checked) |
| R022 | Register a new resident (intake) | P\* | P | – | easy | 6 taps + fields; 6 short steps | Wizard with a sticky Next and a Review step; lands on the new hub. Step 2 runs 31 px wide once a zone is chosen (F-06). Entry button is an icon (F-08). Shot `07` |
| R023 | Open a hub and read its cards | P\* | insp | nr · lay | **hard** | 1 tap | Everything loads, no errors. F-05 and F-08. Shots `04`, `08`, `13` |
| R024 | Record news from an adopter, with a photo | P | P | nr · nr | easy | 4 taps + typing | Date, sender pre-chosen, LINE / Facebook / Email / Visit, note, photo. (Thai run without a photo) |
| R025 | Edit a resident's details | P\* | insp | – | some friction | 2 taps + typing; Save is 3.8 screens down | Bio saved and shown on the hub. The hub's pencil is off-screen (F-05); the one in the Residents list is reachable. 28 fields on one form; 31 px wide |
| R026 | Move to another enclosure | P\* | P | – | some friction | 4 taps | Works when the date is after the placement started; history records it. **Refused the same day** (F-04, F-10). The "nearly full" confirm was not triggered — no enclosure was near capacity |
| R027 | Send to hospital | P | P | – | some friction | 3 taps | "In hospital · Returns to Blue Enclosure 9"; Move enclosure is gone. Entry is a 30 px icon (F-08) |
| R028 | Bring back from hospital | P | P | – | easy | 2 taps | The enclosure they left is already chosen. Page 31 px wide |
| R029 | Record a foster placement | P | P | – | some friction | 4 taps | "With foster carer Test Fosterer". Entry is a 30 px icon |
| R030 | Record an adoption | P | P | – | some friction | 4 taps | "Adopted by …"; gone from the public Adopt page after one stale view. F-20 |
| R031 | Bring a fostered or adopted resident back | P | P | – | easy | 2 taps | Previous enclosure pre-chosen; history shows it. Two help lines are cut at the right edge. Shot `19` |
| R032 | Record a death | P | insp | – | **hard** | 4 taps; 15–20 s to save | Excellent confirm; Deceased, read-only, archive links. **The heart that starts it is off-screen and has no label** (F-05, F-08). Shots `08`, `18` |
| R034 | Read placement history | P | P | nr · lay | some friction | 1 tap | Seven placements newest first with type, dates, carer, notes. Reached by a 20 px house icon |
| R035 | Log immunizations | P\* | P\* | nr · lay | some friction | 4 taps | "Recorded 1 immunization" with a next-due table (shown at the top while the screen stays at the bottom). **Today refused** (F-03); ticks lost (F-10). Thai: refusal seen, save not repeated. Shot `14` |
| R036 | Book a vet visit | P | insp | nr · lay | some friction | 4 taps + typing | Listed on Vet Appointments. Seven 16 px links on the row (F-09). Shot `17` |
| R037 | Record how a visit went | P | insp | nr · nr | easy | 3 taps + typing | "Mae Wang · Dr Dryrun · Completed · ฿450" |
| R038 | Add a prescription | P | insp | – | easy | 5 taps + typing | Under Current. Choosing the linked visit set the start date to it. A future visit is simply not offered |
| R039 | Stop a prescription early | P\* | insp | – | some friction | 1 tap | Dates become "– 3 Oct 2026"; it stays under Current **today** (Expired is tomorrow's state). No question, no message (F-09) |
| R040 | Record a diet | P | insp | nr · lay | easy | 4 taps | Current; the End date has a proper **Clear** button and stays empty after saving |
| R041 | Log a weight | P | P | – | easy | 3 taps + typing | The form says a weight exists for today and the button becomes "Correct the day's weight": 9.5 → 9.8 kg, still one reading |
| R042 | Log a procedure | P | insp | nr · lay | easy | 5 taps + typing | New type typed in place, file attached; thumbnail after ~15 s |
| R043 | Log a blood test with its report | **F** | **F** | nr · nr | **hard** | – | "You don't have permission to do that." F-01 (and F-03 first). The attached PDF showed a file icon, not a broken picture. Shot `16` |
| R044 | Remove a medical record, then bring it back | P | insp | nr · nr | some friction | 5 taps | Remove asks an optional reason and explains it is kept; "1 removed hidden" → Show removed → Restore. Remove is a 45 × 16 px link |
| R045 | Add photos to a resident | P | insp | – | easy | 3 taps | Folder first, then the photo appears under it. Folder names stay English in Thai |
| R046 | Browse enclosures | **F** | insp | – | some friction | 2 taps | Filters work (67 → 2 with open maintenance) and cards show residents against capacity, **but the page scrolls sideways** (F-06). Shot `22` |
| R047 | Open an enclosure | P | insp | – | easy | 1 tap | Notes, residents as photo cards, open jobs as 52 px rows. The best phone page in the app |
| R048 | Log a maintenance job with photos | P | insp | – | easy | 5 taps + typing; 1.9 screens | Zone and enclosure pre-filled; on the board and on My tasks |
| R049 | See the maintenance board | P | insp | nr · lay | easy | 1 tap | On a phone it is a **list with status tabs**, not columns; Me / Everyone switches 1 ↔ 17 jobs. Shot `27` |
| R050 | Change a job's status on the board | – | – | P · P | – | 1 drag | Card dragged to another column; the status stayed after a reload. Driven with synthesized drag events — see below |
| R051 | Edit a job, cost, after photo | P | insp | nr · lay | easy | 4 taps + typing | After (1); Actual ฿320. "Edit details" is 81 × 16 px. Shot `26` |
| R052 | Add photos to a project folder | P | insp | – | easy | 3 taps | Photo appears with a caption box and Use as cover |
| R053 | Create a project folder, write its story | P | insp | nr · lay | some friction | 5 taps + typing | The new-folder form opens inside a 158 px tile |
| R054 | Put a project on the public website | P | insp | nr · lay | easy | 1 tap | Appears on Our work at once; gone on the next load when turned off |
| R055 | Look up a vet or clinic | P\* | insp | nr · lay | some friction | 2 taps | Visit counts, cost, Doctors (3), residents seen. The list is 172 px wide. Shot `23` |
| R056 | Look up a contact and reach them | P | insp | – | some friction | 2 taps + typing | `tel:` and `line.me` links with the right number and ID, 44 px buttons. The fourth button is cut. Shot `30` |
| R066 | Count the stock and save | P | P | – | easy | 4 taps + typing | "5 → 50 — Big change — check it" listed first; "Saved 3 counts"; persisted. Shot `25` |
| R067 | Skip an item, or "Same as last time" | P | insp | – | easy | 1 tap | Blank stayed "Never counted"; the ticked one reads "counted today" |
| R070 | Record a delivery | P\* | insp | – | some friction | 5 taps + typing | Recorded with my name and "After that day's stocktake". A future date is blocked by the date box. F-06, F-15. Shot `28` |
| R089 | Read the public home page and menu | P | P\* | nr · nr | easy | – | All ten public pages open, none wider than the phone, no staff-only data. In Thai, Foster, Volunteer and Donate are English (F-11) |
| R090 | Browse the animals for adoption | P | P | nr · nr | easy | 2 taps | Profile shows "Microchipped", no number; the adopted and deceased test animals are not listed |
| R091 | Read the Shelter Friends pages | P | P | nr · nr | easy | 2 taps | A published friend shows only its offer and contact links. A staff-only note mentions a draft |
| R092 | Open a tag or enclosure QR address | P | P | – | easy | – | Signed out: the public card, no menu, no chip number. Signed in: the staff hub and the enclosure page. No real tag or QR code scanned |
| R093 | Find out who to tell | P | **EN** | nr · lay | some friction | 2 taps; last of 54 screens | F-17 |

**Counts.** English phone, 58 rows: 44 P, 9 P\*, 3 F, 1 simulated, 1 not run.
Thai phone, 58 rows: 27 repeated (21 P, 4 P\*, 2 F), 26 inspected, 3
English-only, 2 not run. Desktop, 33 rows: 4 performed in English, 5 in Thai;
16 more rows had their pages checked for layout at 1280 px in Thai (19 pages,
none overflows); the rest not run.

## What staff must NOT be able to do

All **31 rows P**, on both halves ("not offered" and "refused if reached").

- **Not offered.** The menu has no Management, Settings or Security in either
  language, on phone or desktop. My tasks offers a recurring job only Add a
  note, Skip and Done. A deceased resident has no Withdraw control.
- **Refused if reached.** Typed as staff, each of these lands on `/no-access`
  **inside the app**, with the header and menu around it — "You don't have
  access to this page. Your role doesn't include it. If you need it for your
  work, ask a manager or an admin." and a **Go to My tasks** button (shot `24`):
  `/appointments` (R014) · `/management` and its `dashboard` (R057), `contacts`
  (R058), `shelter-friends`, `shelter-friends/new` (R059, R060), `vets` (R061),
  `vets/<id>/doctors` (R062), `medications` (R063, R064), `diets` (R065),
  `stock-usage` (R068), `purchasing` (R069), `recurring-jobs` (R071, R072),
  `cashflow`, `cashflow/fixed-outgoings` (R073), `translations` (R074) ·
  `/admin` and its `security` (R075–R078), `security/verify` (R080),
  `recent-changes` (R079), `website` (R081, R082), `zones`, `enclosures`
  (R083), `immunization-types` (R084), `procedure-types` (R085),
  `blood-test-types` (R086), `frequencies` (R087), `status` (R088), `contacts`,
  `vets`.
- **R033.** `/residents/<id>/deceased/undo` shows "Only an admin can withdraw a
  recorded death." with no form (shot `20`).

| # | Boundary | Result |
|---|---|---|
| B1 | Every Management address is refused | **P** — 16 addresses, all `/no-access` |
| B2 | Settings and everything under it is refused | **P** — 14 addresses, all `/no-access` |
| B3 | No Withdraw this death; its address is refused | **P** |
| B4 | Staff cannot create, edit or delete a recurring job | **P** — page refused; My tasks offers only Done, Skip and a note |

**Two "must not" rows are broader than the app, apparently by design.** Staff
*are* offered **"+ Add new procedure type…"** on Log procedure (used in R042;
the manual says "or add a new type") and **"Add a new carer"** on Foster or
adopt ("Saved to contacts as a carer"; seen, not submitted). The Settings and
Management *pages* for both are refused. Either R085 and R058 need narrowing to
"manage / merge / archive", or the app needs tightening — Lutan's call.

## The two desktop-only rows

**R050 — Change a job's status on the board (drag).** Dragging is desktop-only
and correctly so: on a phone the board is a list with status tabs and nothing
drags. **A mobile-only staff member loses nothing.** There are two phone paths
to every status, both confirmed at 375 px: the four chips on **My tasks** for
your own jobs (R016, with Undo), and the four 160 × 46 px status buttons on
**any job's page**, reached by tapping its card on the board (shot `26`). The
board is not the only way to reach any status. On the desktop the drag itself
works and persists in both languages; it was driven with synthesized browser
drag events because the browser pane's pointer cannot perform a real drag, so
**a real mouse drag was not exercised**. Suggestion for the checklist: add a
phone row "Change any job's status from its page" so the phone path is tested
on purpose rather than by luck.

**R008 — Print the manual as a PDF.** The same **Print this as a PDF** link is
shown at phone width and the address returns the staff manual (22 pages) from
there too, so a mobile-only staff member is not deprived of the file. What
could not be checked is what a phone *does* with it (open, save, print) — that
needs a real phone. The device assignment could reasonably become "phone and
desktop".

## Corrections the checklist itself needs

Not edited mid-run — the fix belongs in
`scripts/lib/acceptance-matrix-entries.mjs` after Lutan's review.

| Row | The checklist says | The app does |
|---|---|---|
| R001 | "tap Staff & Volunteer Login"; "Sign out brings you back to the public site" | The link reads **Staff login**; Sign out lands on the **sign-in page** |
| R009, R013, R093 | "Manual" | The menu item reads **User manual** |
| R019 | "by ID such as R0042" | IDs are shown and matched as **R-0042** (or fix F-13) |
| R026, R027, R029, R032, R034 | "Tap Move enclosure", "Tap Send to hospital", "Tap Foster / adopt", "Tap the broken-heart icon", "Tap the Housing & Status title" | On a phone these are unlabelled icons; the steps should say which icon until F-08 is fixed |
| R036 | "choose the clinic, date and reason, and save" | A visit dated in the past is saved as **Completed** without being asked — the row could say so |
| R039 | "It moves to Expired" | It stays under Current **today** and expires tomorrow |
| R041 | "The weight chart updates" | With one reading there is no chart, only "Latest" |
| R046 | "The page does not scroll sideways" | It does (F-06) — keep the line, it caught a real defect |
| R049 | "The jobs show in columns by status" | Columns on a desktop; **tabs** on a phone |
| R050 | Desktop only | Right for the drag; add a phone row for the job page's status buttons |
| R008 | Desktop only | The link is offered on the phone too |
| R058, R085 (and probably R086) | Staff must not add a contact / a procedure type | Staff can add a carer and a procedure type in place, by design |
| Header | "5 boundaries" in the brief | The staff sheet prints 4 |

## Could not test — for the shelter's own run

| What | Rows | Why | Who should |
|---|---|---|---|
| Whether the Thai reads naturally | every ไทย cell | I do not read Thai | A Thai-reading member of staff |
| A real phone: taps, thumb reach, sunlight, the keyboard covering a field | every phone cell | Emulated at 375 px; on over-wide pages taps were not physically aimed | Staff, on their own phones |
| The camera | R024, R042, R043, R045, R048, R051, R052 | Photos were generated files handed to the file picker | A real phone |
| A real chip scanner | R020 | No scanner; and it cannot work until F-02 is fixed | After the fix |
| A printed tag and a kennel QR code | R092 | Addresses were typed | A real phone and a real tag |
| Call and LINE actually opening | R056 | Links were read, not followed | A real phone |
| Real loss of signal | R006 | Simulated by the browser event | A phone with its data off |
| The password-reset email and link | R002 | The test address has no mailbox | A tester with a real mailbox |
| What a phone does with the PDF | R008 | The file was fetched, not opened | A real phone |
| A real mouse drag | R050 | The pane's pointer cannot drag | A desktop |
| The "nearly full" confirm on a move | R026 | No enclosure was near capacity | Pick one that is |
| Dropping out of the medication forecast | R039 | The forecast is a management page | The management run |
| The same forms after 07:00 | R035, R043 | The whole run was before 07:00 Thai time; F-03's cause is inferred from the clock, not proved at two times of day | Anyone, mid-morning |
| Most desktop cells | 28 of 33 rows had no activity performed on a desktop | Budget went on the phone, as instructed; 16 of them were checked for layout only at 1280 px | The shelter's desktop pass |
| The Thai pass's 26 "inspected" rows as real activities | see the matrix | Checked for language and layout, not repeated | The Thai tester |

## Noticed in passing about other roles (not tested)

- **Management:** on a phone, Medications opens on "Best on a larger screen …
  Show anyway". Recurring jobs warns that two existing jobs sit with someone
  whose role cannot be given them. Whether **management** can save a blood test
  was not checked — F-01's search found no management policy on `blood_tests`
  either, which is worth a look in that role's run.
- **Vet:** `blood_tests` and `procedures` are read-write for vets by policy, so
  F-01 should not affect them.
- **Volunteer / public viewer / visitor:** nothing observed beyond the public
  pages in R089–R092.

## Left behind in the dev database

Named so it can be found and cleared, or reused by the next role's run:

- Account **`dryrun-staff-20261003@example.test`** (role staff). An admin can
  archive it at Settings → Security.
- Six **recurring jobs** `DRYRUN A/B/C` and `DRYRUN TH-A/B/C`, every Saturday,
  assigned to that account — **pause or delete them** at Management → Recurring
  jobs or they will come round weekly.
- Residents **R-0394 Dryrun Zeta EN** (resident; chip 900263000394001; a visit,
  prescription, diets, immunization, procedure, photo), **R-0395 Dryrun Yota
  EN** (deceased, archived to Drive), **R-0396 Dryrun Zeta TH** (fostered with
  Test Fosterer; chip 900263000396002).
- Maintenance job **M-0040** "DRYRUN EN leaking tap"; project folder **Dryrun
  project EN** under Puppies (not on the website); procedure type **Dryrun
  procedure type EN**; a delivery of 20 AMC 500.
- **Stock counts changed:** AMC 500 now 50 (was 5), FBC 21 (was 20), Bravecto
  re-confirmed at 10, Renal diet 12 cans (first count).
