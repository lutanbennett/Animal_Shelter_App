# The approval queue shows an event's date, and the title was finally seen on screen

**2026-11-08, stream `approval-queue-event-date` (backlog `#n5j3w`, `#v2p7k`, `#p4w9z`).**

## What changed

- **The Event photos tab of Photos to approve shows `Event date: <date>` under the event's title.** The date comes from the
  same `waiting_event_titles()` row (`0334`) that already supplied the title: `loadWaitingEventPhotos`
  (`src/lib/photos/approval.ts`) keeps the whole row in its map instead of only the title, and `WaitingEventPhoto` gained
  `eventDate`. **No second query, no change to `0334`, no card, no policy** — the value was already returned to a caller
  already entitled to it.
- **Date helper:** `formatDate` from `src/lib/format.ts`, the one every other screen uses (and the one this card already
  used for "Added by … on …"). English `14 Dec 2026`, Thai `14 ธ.ค. 2569` (Buddhist-era year). No new helper.
- **Why a separate line rather than `Title · date` on one line:** the title is marked `lang="und"` (an event title may be
  in either language), so the date — which is in the reader's language — sits on its own line with its own label, and
  the label says *which* date it is, so it cannot be mistaken for the upload date on the next line.
- **Two strings (`#p4w9z`), both dictionaries:**
  - The meme pickers' `cannotSeeResidents` no longer says *"Ask an admin to check them"*; it says *"Ask whoever manages
    cards at your shelter to check them."* A shelter names its own roles (`CLAUDE.md`, no fallback to a role by name);
    the person who can fix a card is described by what they do, not by a role.
  - The 30-day alert on the status page (`admin.status.unassignedPhotos.waiting`) no longer calls the photos *"tagged to an
    enclosure"*: since `#40oz4` part A a photo can be saved with no place, so it now says *"waiting to be named"*, the
    wording PR #1392 already used for the queue heading.
  - The code comment above the `pending` block in both dictionaries said the same untrue thing and was corrected too.

## What was seen on screen (`#v2p7k`)

1. A login holding **exactly `run_fundraising_events`** (`dev-signin.mjs --cards run_fundraising_events`) created the event
   *"Approval-queue date check (dev)"* dated 14/12/2026 on `/management/events/new`, reached by clicking Management →
   Fundraising events → Add an event, and attached one generated PNG through the page's own file input. The upload route
   (`src/app/api/events/[id]/photos/route.ts`) asks only `events.run`, so that one card is enough; the photo showed
   *Waiting for approval*.
2. A login holding **exactly `approve_photos`** clicked *Photos to approve* in the sidebar, then the *Event photos* tab.
   **On screen:** *"1 event photo waiting"*, the title *"Approval-queue date check (dev)"*, *"Event date: 14 Dec 2026"*,
   *"Added by dev-signin-…@example.invalid on 8 Nov 2026"*, and Approve / Private only / Remove. Screenshotted. In Thai the
   same card read *"วันที่จัดงาน: 14 ธ.ค. 2569"*.
3. The photo did not draw in the first screenshot. Measured, not assumed: `requestAnimationFrame` never fired in the pane
   (the known pane fault in `CLAUDE.md`), the `<img>` was `loading="lazy"`; forced eager it loaded 400×300 from
   `/api/photos/…` with a 200 `image/png`, and the second screenshot shows it. **Not an app fault.**

The event and its waiting photo are left on dev (dev test data is disposable).

## Deliverable 4: can a `run_fundraising_events`-only login see the approval queue?

**No, and it should not.** `src/app/photos/approve/page.tsx` opens on `requirePermission("photos.approve")`, and
`run_fundraising_events` bundles only `events.run`. The sidebar for that login offered Home, Management, User manual,
Release notes and Change password — no *Photos to approve* entry. So the events card puts a photo *into* the queue and
cannot approve it, which is the separation the card's own comment in `cards.ts` describes. **Nothing for
`docs/card-access-faults.md`.**

## Grep at the end (`#p4w9z`'s own check)

Across `src/lib/i18n/dictionaries/en.ts` and `th.ts`, *"tagged to an enclosure"* and *"Ask an admin"* return **nothing**.
The nearest remaining hit is `en.ts` *"Ask an administrator to assign you a role, then try again."* on the sign-in refusal
for an account with no access — outside the photo path, and arguably still true (an account with no role has nobody else
to ask), but it does name a role-like word. Reported in the PR for the planner to judge; not changed here.
