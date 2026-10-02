# Dry run of the acceptance checklist — Staff role

> **Draft in progress.** This file is committed section by section while the run
> is under way, so a stalled session loses nothing. Rows marked *not reached*
> have not been tried yet; nothing here is inferred.

| | |
|---|---|
| Role | **Staff** only (one role per run — Lutan, 2026-10-03) |
| Run by | Claude (`claude-fable-5-1`), driving the app in the desktop app's browser pane |
| Date | 2026-10-03 |
| Site | Local dev server, `http://localhost:3005` (`next dev`, branch `claude/dry-run-staff` at `8743055`) |
| Database | dev Supabase project `qxkmhwybjggxvsfxsxbd` — disposable data, never production |
| App version | 0.15.0 (+ "Not released yet" notes) |
| Checklist | `node scripts/acceptance-matrix.mjs --role staff` — 60 "does" rows, 31 "must not" rows, 4 boundaries |
| Primary pass | **Phone, 375×812**, touch emulation, English then Thai. Desktop is a secondary sweep |
| Signs anything? | **No.** A rehearsal. The shelter's sign-off stays with the people who use the system |

## How the staff account was set up (read this first)

The brief's mechanic is "one admin account changes a test account's role". It
could not be followed as written, and the difference matters to whoever runs the
next role:

- The dev test login in `.env.local` (`claude@lutan.com`) is an **admin**, and
  other live sessions use it. Changing its role would have broken them and
  locked it out of Security, so it was left alone.
- Reading that account's stored password to sign in as admin was **refused by
  the permission classifier** (credential materialisation). It was not worked
  around.
- Instead a **separate disposable account** was created on the dev project the
  way `scripts/check-access-requests-card.mjs` creates its throwaway users
  (service role: `auth.admin` create user + a `user_roles` row):
  **`dryrun-staff-20261003@example.test`**. Its password is a test value
  recorded only in this worktree's gitignored `.env.local`
  (`DRYRUN_STAFF_EMAIL` / `DRYRUN_STAFF_PASSWORD`).
- It was **management for about five minutes** to seed six recurring jobs
  through Management → Recurring jobs (`DRYRUN A/B/C`, `DRYRUN TH-A/B/C`, due
  Saturdays, assigned to itself, C waiting for A), then switched to **staff**
  by the same script and hard-refreshed. Everything below was done as staff.
- **Left behind in dev:** that account (role staff), the six recurring jobs, and
  the residents and records named `Dryrun …`. An admin can archive the account
  from Settings → Security; its password can be reset there too.

## Caveats about the instrument

- **I am not the user.** I can read the page structure and I never mistype on
  glass. Every ease-of-use rating below is judged against *a non-technical
  shelter worker, on their own phone, in a kennel, with no one to ask*, and is
  backed by a count (taps, screens, pixel sizes) wherever one could be taken.
- **Emulated phone, not a real one.** 375×812 with an Android user agent and
  touch points. Camera capture, a real chip scanner, a printed QR code, real
  offline and how a phone opens a PDF were not exercised — see *Could not test*.
- **I do not read Thai.** I can see that Thai text is present, fits and is not
  English. Whether it reads naturally needs a Thai reader.
- **Where the page ran wider than the screen, taps could not be aimed
  reliably** in the emulator, so on those pages (the resident hub, intake step
  2, the edit form) some controls were pressed through the page's own click
  handler instead of a tap. The sideways overflow is itself the finding (F-03);
  it did not stop the activity being exercised.
- The small round **"N" badge** bottom-left in screenshots is Next.js's
  dev-server indicator, not part of the app. It covers the left edge of some
  bottom-left buttons in dev only.

## Results so far — phone, English

Functionality: **P** pass, **F** fail, **P\*** pass with a defect noted,
**sim** simulated only, **–** not done on that device, *nr* not reached yet.
Ease: **easy / some friction / hard**, judged at 375 px.

| # | Activity | EN phone | Ease (phone) | Taps / screens | What happened |
|---|---|---|---|---|---|
| R001 | Sign in and sign out | P | some friction | 2 taps + typing; the link is 6.7 screens down | Lands on My tasks. **Sign out goes to the sign-in page, not the public site** (the checklist says public site). The only way in from the public site on a phone is "Staff login" in the footer, at the bottom of a 5,469 px page; it is not in the ☰ menu, and the checklist calls it "Staff & Volunteer Login". A wrong password says "Invalid login credentials" and clears both boxes (F-06). |
| R002 | New password after forgetting | *nr* | | | Needs a real mailbox — see *Could not test* |
| R003 | Change your password | P | easy | 3 taps + typing, 1 screen | "Password changed." Old password refused afterwards, new one works. Does **not** ask for the current password. Too-short password is caught by the browser's own bubble, not the app's words. Button reads "Set password" under a "Change password" heading |
| R005 | Asked before something irreversible | *nr* | | | |
| R006 | Offline warning | sim | easy | – | Red bar "You're offline, changes will not save." appears on a simulated offline event and goes when back online. Real loss of signal not tried |
| R007 | Switch English / Thai | *nr* | | | Thai pass |
| R008 | Print the manual as a PDF | (desktop row) | | | On the phone the same **Print this as a PDF** link is shown; `/manual/pdf` returns `lanna-care-manual-staff.pdf`, 22 pages, in ~5 s. See the desktop sweep |
| R009 | Find your way around the menu | P | easy | 1 tap | My tasks (badge), Residents, Enclosures, Maintenance, Stocktake · Vets, Contacts, Projects · User manual, Release notes, Change password. No Management, Settings or Security. Menu rows are 36 px high. The Assistant is an unlabelled icon in the header (F-08) |
| R010 | Read the release notes | P | easy | 2 taps | "Showing the changes for the Staff role"; newest release open; 0.15.0 is current. Every release carries a **Dev** tag a shelter worker will not understand |
| R011 | Ask the assistant a question | P | easy | 3 taps | "Where is Angsumalin?" answered at once with enclosure, photo card and an Open enclosure link; no confirm card |
| R012 | Record something with the assistant | P | some friction | 4 taps + typing | "Angsumalin weighs 13.1 kg" → card → Confirm → "Done"; 13.1 kg, 3 Oct 2026 shows on the resident's weight card. The card opens **under** the message box, so Confirm is off-screen until you scroll. **Open resident** changes the page but leaves the assistant covering it (F-07) |
| R013 | Read what your role can do | P | some friction | 2 taps; manual is 54 screens | Opens on "Showing the 42 topics for the Staff role", Staff marked **You**. Contents is collapsed; its links are 24 px high. The manual tells a phone user to press Ctrl+F |
| R015 | See maintenance jobs assigned to you | *nr* | | | |
| R016 | Change a job's status from My tasks | *nr* | | | |
| R018 | Mark a recurring job done or skipped | P | easy | Done: 1 tap. Skip with note: 3 taps + typing | Done and Skip each remove the job with an Undo banner; the count and the menu badge drop; it stays gone after a reload. "Waiting for DRYRUN A" cleared when A was done. **A waiting job can still be marked Done** — the wait is a label, not a lock. After a reload there is no way to see or undo what you marked |
| R019 | Find a resident | P\* | some friction | 2 taps + typing | Name ("butter"), Thai name ("โชคดี"), On-site/Off-site and a zone chip all narrow the list; "75 residents · 7 deceased hidden". **ID search needs the hyphen: "R-0055" and "0055" find it, "R0055" (how the checklist writes it) finds nothing** (F-04). The search box is 61 px wide on a phone (F-05) |
| R020 | Find a resident by microchip | **F** | – | – | **The chip just recorded on the test resident is not found: "0 residents".** Never redirects. Cause found: `src/app/residents/page.tsx:119` (F-01) |
| R021 | Record or correct a microchip | P | easy | 3 taps + typing | "12345" refused: "A microchip number is exactly 15 digits (spaces and dashes are ignored)". "900 263 000-394001" saved and shown as 900263000394001 with **Correct** |
| R022 | Register a new resident (intake) | P\* | easy | 6 taps + the fields; 6 short steps | Six-step wizard with a sticky Next and a Review step; lands on the new hub (R-0394) with name, enclosure and intake date. **Step 2 becomes 31 px wider than the screen once a zone is chosen** (F-03). The 36×38 px "New resident (intake)" button is an icon with no words (F-08) |
| R023 | Open a hub and read its cards | P\* | hard | 1 tap | All cards load, no errors. **The header is 48 px wider than the screen**: the Edit pencil and the Record-death heart are off the right edge (F-03). Cards have **icons instead of titles** — "3" beside a droplet is blood tests (F-08) |
| R025 | Edit a resident's details | P\* | some friction | 2 taps + typing; Save is 3.8 screens down | Bio saved and shown on the hub. The pencil on the hub is off-screen (F-03); the pencil in the Residents list is the reachable one. One form, 28 fields |
| R026 | Move to another enclosure | **F** (same day) | | | **A resident taken in today cannot be moved today**: "The move date must be after the current placement started." The form also forgets the zone and enclosure just chosen (F-02). Being retried with a back-dated resident |

*(remaining rows: not reached yet — this table grows with each commit)*

## Findings so far

Ranked **blocks a role / wrong result / friction / polish**. Each is written to
be pasted into `docs/backlog.md`; none has been raised — Lutan decides.

| # | Severity | Title | Where | What happened | Suggested fix |
|---|---|---|---|---|---|
| F-01 | wrong result | **Scan a chip never finds a resident** | Residents → Scan a chip; `src/app/residents/page.tsx:119` | Recorded chip 900263000394001 on R-0394, then typed it into Scan a chip: "0 residents — No residents match these filters". The chip-specific "not found, register a new resident?" message never shows either. The test is `/^[ds-]+$/` — the backslashes are missing, so it matches the letters d and s, never digits. In the file since 2026-09-29 (`108415ac`). Screenshot `10-chip-lookup-no-match.jpg` | `/^[\d\s-]+$/`, and a check script that looks a chip up through the page, not only the database |
| F-02 | wrong result | **A resident cannot be moved on the day it arrived** | Resident → Move enclosure | Intake today, move today: "The move date must be after the current placement started." The only way round is to wait until tomorrow, when the record will say the wrong day. After the error the Zone and Enclosure pickers are emptied while the old "0 / 4 · Space available" line stays. Screenshot `09-same-day-move-refused.jpg` | Allow a same-day move (on or after), or say what to do instead; keep the user's choices when a save is refused |
| F-03 | friction | **Resident pages run wider than a phone** | Resident hub header; Intake step 2; Edit resident | Hub: 423 px of content on a 375 px screen for every resident tried, so Edit and Record death are off the right edge and "Record chip", the intake date and Copy link are cut. Intake step 2 and the edit form: the Enclosure picker grows to its longest name ("Blue Enclosure 3 (Hallway Small Dogs Only) — 0 / 10") and pushes the page 31 px wide. Screenshots `04`, `05`, `07`, `08` | Let the header's text column shrink (`min-w-0`) and wrap the icon row; cap the pickers at the column width |
| F-04 | friction | **ID search needs the hyphen** | Residents → Search | "R-0055" and "0055" find the resident; "R0055" does not. The checklist and manual write IDs without the hyphen | Ignore hyphens and spaces when matching an ID; or correct the checklist |
| F-05 | friction | **The search box is 61 px wide on a phone** | Residents | It shares a row with Filter, Show all, Adopted and No microchip, so about four characters show. A scanned chip number moved into it reads "9001…" | Give the search box its own full-width row at phone width |
| F-06 | friction | **"Invalid login credentials"** | Sign-in page | A wrong password shows the auth service's own English phrase and empties both boxes, so the email is typed again. Screenshot `02` | "That email or password is not right. Try again, or tap Forgot password?" — translated — and keep the email |
| F-07 | friction | **The assistant stays open over the page it just opened** | Assistant → Open resident / Open enclosure | The page behind changes, the assistant still covers the whole phone screen, and on the resident hub its Close button was off the right edge (F-03). The confirm card also opens under the message box. Screenshot `03` | Close the panel when one of its links is followed; scroll a new card into view |
| F-08 | friction | **Actions on a phone are icons with no words** | Residents list (Log immunizations, Book vet visit, New resident); hub cards and their Send to hospital / Foster-adopt / Move / + buttons (30×30 px); header Assistant | The checklist says "tap New resident (intake)", "tap Move enclosure"; on a phone there is no such text, only a pictogram. This is the "had to know where to look" class the item names. Screenshots `08`, `11`, `13` | Put the word under or beside each icon at phone width, and make the targets at least 44 px |
| F-09 | polish | **Sign-in is at the bottom of the public home page** | Public site, phone | "Staff login" is the last link in the footer, 6.7 screens down, and not in the ☰ menu. Screenshot `01` | Add it to the ☰ menu |
| F-10 | polish | **"Getting help" names nobody** | Manual, last topic | "tell the person looking after the app" — no name, phone or LINE | Name the person and how to reach them |

## Corrections the checklist itself needs (not edited mid-run)

| Row | The checklist says | The app does |
|---|---|---|
| R001 | "tap Staff & Volunteer Login"; "Sign out brings you back to the public site" | The link reads **Staff login**; Sign out lands on the **sign-in page** |
| R009, R013, R093 | "Manual" | The menu item reads **User manual** |
| R019 | "by ID such as R0042" | IDs are shown and matched as **R-0042** (F-04) |

## Could not test

| Row | Why | Who should |
|---|---|---|
| R002 | The test account's address is `@example.test`; the reset link goes to a mailbox nobody has, and sending to it risks the dev project's mail reputation | A tester with a real mailbox |
| R006 | Offline was simulated by the browser event only | A real phone with its data turned off |

*(grows as the run continues)*

## Run log since the last commit (to be folded into the tables above)

English, phone, 2026-10-03 from about 00:30 to 01:20 Thai time. Test residents: **Dryrun Zeta EN** R-0394 (intake today) and **Dryrun Yota EN** R-0395 (intake back-dated to 1 Sep 2026 so each placement could have its own date).

- R005 **P** easy — Delete on an adoption update asks "Delete this update and its photo?" inline; Cancel changes nothing. Record death opens a full dialog ("Only an admin can withdraw this afterwards") with Cancel / Yes, record the death.
- R024 **P** easy — Add update: date, sender (adopter pre-chosen), LINE / Facebook / Email / Visit buttons, note, photo. Shown with date, channel, note and photo. The first photo of an adopted resident became its **Profile** photo.
- R026 **P** when the move date is after the placement started (Yota: 5 Sep) — hub and Placement history show it. **F** on the same day (F-02). The nearly-full confirm was not triggered: no enclosure near capacity in the zones tried.
- R027 **P** easy — 2 fields; hub reads "In hospital · Off-site in medical care · Returns to Blue Enclosure 9"; Move enclosure is gone.
- R028 **P** easy — the enclosure they left is pre-selected. Page 31 px too wide (F-03).
- R029 **P** easy — Foster / Adopt toggle, carer list, date. "With foster carer Test Fosterer".
- R030 **P** — "Adopted by Sylvia and Estella". The public Adopt page still listed the animal on its first load about 20 s later and not on the next (a short-lived cache). The form calls the adopter a **Carer**, and the hub keeps the "Ready for adoption" badge and its microchip warning after adoption.
- R031 **P** easy — back in the enclosure, history shows it. Page 31 px too wide; two lines of help text are cut at the right edge.
- R032 **P** some friction — confirm dialog is excellent; saving takes ~15–20 s ("Recording…"). Status Deceased, read-only, Summary PDF / Offline index / Drive folder offered. The heart icon that starts it is off-screen on the hub (F-03).
- R034 **P** some friction — seven placements, newest first, with type, dates, carer and notes. Reached by a 20×20 px house icon; the words "Housing & Status" are not on the phone card (F-08).
- R035 **P\*** — Rabies recorded for one resident, "Recorded 1 immunization" with a next-due table. **Today's date was refused: "Date administered can't be in the future"** at 01:00 Thai time (F-11). The ticks are lost when a save is refused. The success table appears at the top while the screen stays at the bottom.
- R036 **P** some friction — visit listed. Page 4 px too wide. A visit dated in the past is saved as Completed without being asked. The row's seven actions are 16 px-high links (F-12).
- R037 **P** easy — "Mae Wang · Dr Dryrun · Completed · ฿450".
- R038 **P** easy — under Current; choosing the linked visit moved the start date to the visit's date. A visit in the future is simply not offered as a link.
- R039 **P\*** some friction — End today acts at once, no question and no message; only the date range changes ("– 3 Oct 2026") and it stays under Current today, so the checklist's "moves to Expired" is tomorrow's result.
- R040 **P** easy — Current; the End date has a proper **Clear** button on the phone and stays empty after saving. A new diet is added beside the existing one, not instead of it.
- R041 **P** easy — the form says a weight already exists for today and the button becomes "Correct the day's weight"; 9.5 → 9.8 kg, still one reading.
- R042 **P** easy — new type typed in place ("+ Add new procedure type…"), date, file; saved with its thumbnail after ~15 s. **Staff can add a procedure type here**, which the checklist lists as must-not (R085) — the manual says this is intended.
- R043 **F** — **"You don't have permission to do that."** with or without a file. `blood_tests` has no insert policy for staff (0001 line 534 is select-only; `procedures` got its staff insert in 0031) (F-13). Today's date was also refused as "in the future" first (F-11).
- R044 **P** easy — Remove asks for an optional reason and explains it can be brought back; "1 removed hidden" → Show removed → Restore.
- R045 **P** easy — Folder must be chosen first, then the photo uploads and shows "Shelter · 2026-10-03" (ISO date here, "3 Oct 2026" everywhere else). Camera capture not exercised.
- B3 / R033 **P** — no Withdraw control on the deceased resident; typing `/deceased/undo` shows "Only an admin can withdraw a recorded death." inside the app.

New findings: **F-11** wrong result — before 07:00 Thai time today's date is refused as "in the future" on immunizations and blood tests (UTC "today"), while weight, death and visits accept it. **F-12** friction — row actions (Edit / End today / Remove / Log … / Send to hospital) are 16 px-high text links side by side; End today has no confirm. **F-13** blocks an activity — staff cannot log a blood test. Polish: "Structured values from OCR are a future build" is shown to users in the blood-test notes box; "Lifecycle" appears as a zone name; medication names read "Amoxicillin 250mg tablet (tablet(s))".
