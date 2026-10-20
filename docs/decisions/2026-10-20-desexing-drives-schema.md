# 2026-10-20 — Desexing drives: schema half (`0233`)

Schema and the public-view check only. The public page, Services menu entry and management screen are `desexing-drives-page`.

**Decided by Lutan, 2026-10-20: the public signs up on the site.** So there is a real public write path.

- **`desexing_drives`**: title, date, start/end time, venue and address, species taken (dog, cat or both), capacity (null = no limit), sign-up close date, price note, eligibility note, description, `status` (`draft` hidden, `open`, `cancelled` shown as cancelled). Written with `website.content` (Management has it), audited. Starts empty: dates, prices and eligibility are the shelter's to type.
- **`desexing_drive_signups`**: owner name, phone and/or email (at least one), pet name, species, sex, age note, notes, status (`new`, `confirmed`, `cancelled`, `attended`, `no_show`), who handled it. Staff read and edit with `website.content`; audited.
- **`public_desexing_drives`** (anon): open and cancelled drives from today on, with `spots_left` and `accepting_signups` as counts. No sign-up column is selected. Drives do **not** appear on the home page in this schema; the view would serve a home strip if the page half wants one.

## Anon: insert only

`anon` has INSERT on a **named column list** of the sign-ups table and no SELECT, UPDATE or DELETE. `status`, `handled_*` and `created_at` are not in the grant, so a visitor cannot confirm themselves. The page must send `Prefer: return=minimal` (RETURNING needs SELECT). `check-public-views.mjs` proves, against the live database: anon GET (whole row and the person columns), PATCH and DELETE are refused; an insert reaches the database gate and is refused for a drive that is not open (so the path is open and checked, and no row is created); setting `status` is refused; no public view carries a person column. `check-migration-grants.mjs` gained `ANON_INSERT_TABLES`, a one-name allow-list for an INSERT-only grant, since its rule was "anon only gets public_*/site_*".

## Rate limiting, no CAPTCHA: the abuse we accept

The database sees no IP. A `before insert` trigger (security definer, so it needs no read access for the caller) refuses an anon sign-up when: the drive is not open, has passed or has closed sign-ups; the species is not taken; the drive is full (new + confirmed, with the drive row locked so two people cannot take the last place); the same phone or email already has 3 live sign-ups on that drive; or 60 sign-ups were created in the last hour across all drives.

**Accepted:** a patient person using varied details can fill a drive with junk, and a flood of 60 an hour closes sign-ups for the rest of the hour for everyone. Staff cancel or delete junk rows, which frees the places. Judged better than blocking real people or adding a CAPTCHA. The page half should add a per-IP limit at the Worker if it wants one, and a honeypot field.

Staff inserts are exempt from the limits. Refusal reasons are the exception messages (`desexing_drive_full`, `desexing_drive_not_open`, `desexing_drive_species_not_taken`, `desexing_signup_too_many_for_contact`, `desexing_signup_rate_limited`), HTTP 400 / P0001, for the page to turn into words.

Applied to dev; exercised: a capacity-1 drive took one anon sign-up and refused the next with `desexing_drive_full`, and appeared in the public view. Production apply goes with the page half's release, before its deploy.
