# Booking returns to the list it started from (2026-10-22)

Lutan, 2026-10-22: after booking from the Book appointment card the form returned to the resident, which
is friction when booking several in a row.

- The Book appointment buttons on `/upcoming-visits` and `/appointments`, and the clinic page's button, add
  `from=<their own path>`. The form carries it as a hidden field and `bookClinicVisit` redirects there.
- **The allow-list is the security boundary** (`src/lib/clinics/booking-return.ts`): the value must equal
  `/upcoming-visits`, `/appointments` or `/clinics/<uuid>` exactly. Not a prefix test: `//evil.example`
  starts with a slash and is another site to a browser. Anything else is ignored, not an error, and the
  old destination applies. It is checked on the page (so a bad value is never written into the form) and
  again in the action (a posted form can say anything).
- No `from`: unchanged. A resident's hub or clinic-visits section returns to that resident; the residents
  list bulk booking returns to `/residents`.
- Not built: the optional "Visit booked" confirmation. The new visit is listed on the page you land on.
- `src/app/vet-visits/new/` was already gone from the tree (git does not track an empty folder).
