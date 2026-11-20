# The platform console is one card per shelter (#pacon, app half; #msgtp)

2026-11-20, `claude/console-cards-redesign`. Built from `2026-11-20-product-admin-console-requirements.md` (his words) and
`2026-11-20-shelter-state-schema.md` (the specification). Nothing was re-derived.

## What was built

- **Landing = a card per shelter**: name, *the* website (primary address, else the first with "make this the website"), account
  holder name and phone, a state badge, and a Settings button. A set-up shelter leads with "→ Next step: …". Front-door
  addresses never appear (the function only returns a shelter's own).
- **Four states, in the specified order** (`cardState()` in `ProductAdminPanel.tsx`): closed, broken (Drive or Calendar `dead`),
  still being set up (any of the five steps false), ready. No new column.
- **Behind the card**: health, Google Drive/Calendar, the five setup steps and their forms, web addresses, account holder, names,
  and Close. Create shelter is a button on the landing; product administrators sit in a collapsed section.
- **Close / Reopen** calls `product_admin_set_shelter_archived`. The confirm says what closing does and does not do. A closed card
  shows only "Closed" and Reopen. The answer says it can take up to a minute (the Worker remembers a lookup that long).
- **#msgtp is gone**: there is no shared message slot. Every control writes its own key (`holder:<id>`, `archive:<id>`,
  `host-add:<id>`, `create`, `admin-add`, …) and the answer is drawn directly under the control. Measured on dev: the answer
  appeared 44px under the button that caused it, not two screens above.
- **`42501` no longer says "your second step has expired".** It now says what was refused (`errors.refused(what)`), because a
  policy refusal is not necessarily an expired step-up. `stepUpExpired` was deleted from both dictionaries.
- **Closed notice.** `worker/shelter.mjs` now forwards an archived shelter as `x-public-site: off` plus `x-shelter-archived: 1`
  (removed from inbound requests first, so a visitor cannot claim it). `LockedLanding` and `/login` read the header
  (`isShelterClosed()`) and say "This shelter is closed" instead of "under construction" or "not set up". No second mechanism:
  it reads the resolver's `archived` key.
- **Health**: per shelter, Drive, Calendar, the website's open/locked/off state and setup progress; **the database dot is shown
  under its own heading "The whole system, the same for every shelter"**, so it cannot read as one shelter's fault.

## What was not built, and why

- **No Drive button.** Nothing exists that can send a shelter's Admin a connect link or start the flow while Lutan is present, and
  inventing a button would promise what the console cannot do. The screen says plainly that only the shelter's own Admin can
  connect Drive. `#pacon` stays open for this and for the enquiry queue.
- **The enquiry queue and `product_admin_carry_enquiry`** are `console-enquiry-queue`'s, as briefed.
- **No "being set up" vs "broken" split beyond the card state.** The card state is the split Lutan asked for; the settings page also
  shows the Drive/Calendar lines unchanged.

## Gating

Every control that acts is drawn only when `canWrite` (aal2) is true, as before. These writes are product administrator plus
aal2, enforced by the functions themselves, not a card; no role check was added or read.

## Scheduled jobs that loop over shelters (deliverable 9: the list)

Trusted callers are unfiltered by design, so each loop was read:

- `pollCalendarChanges` (`src/lib/clinics/calendar-poll.ts`): lists every shelter. **Plainly should skip a closed one, one
  condition: fixed** (`.is("archived_at", null)`).
- `label-drafts` (`worker/translations.mjs`): serves the shelters its login holds a role in, from `user_roles`, never reading
  `shelters`. **For the planner to file**: it would still draft for a closed shelter; probably wants a skip, but the fix is a
  second read, not one condition.
- `calendar-sweep`, `merch-supplier-emails`, `report-photo-retention`: driven by rows carrying `shelter_id`, not by a list of
  shelters. **Not measured**; for the planner to file as "decide per job whether a closed shelter's pending rows should keep being
  processed".
- Database cron jobs (`purge-assistant-actions`, `purge-write-requests`, `purge-donation-tax-ids`): retention purges. A closed
  shelter's expired rows should still be purged, so **no skip is wanted**.
