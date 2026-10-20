# 2026-10-16 — Scanning a name card to pick the resident

Backlog item "Pick the resident by scanning their name card". Built in three parts; the public card's big sign-in
button is not in this PR.

**A scan only chooses a resident.** It never writes. The form shows name, R-code and photo, to check against the card.

## The picker's search box
`residentCodeFrom` (`src/lib/tags/links.ts`) takes an R-code ("R-0042", "r0042"), a card link (`…/r/R-0042`) or an older
UUID link. A whole code, UUID or link matches exactly one resident and **never a near one**; a half-typed code ("R-00")
stays a plain substring search so the live field does not blank mid-typing. Nothing matching says so
(`noMatchCode`); there is no fallback to a recent or first result.

## Android: Web NFC (`ScanCardButton`)
The code is looked up **in the list the picker already offers this person** (`resident_who_and_where`, not deceased,
not adopted), not by a fresh `loadResidentCard`. Same visibility as the picker by construction, so a resident a
person may not pick, a deceased one and an unknown code are all "not a resident you can pick here", and no extra
server call or permission is added. Unreadable cards are reported separately.

## iPhone: the waiting marker (`card-wait.ts`, `/scan/arrive`)
- Cookie `card_wait` = `<job>.<expiry ms>`, httpOnly, SameSite Lax, five minutes. Jobs are a closed list: photos, weight.
  It holds no secret and grants nothing; it is not signed because forging it only redirects a person who passes the
  permission check below anyway. A marker claiming more than five minutes is refused.
- Left by the `startCardWait` action only if the person may open that job now. Not offered on `/photos/add`, where a
  page load would lose the held photos (that page uses Web NFC only).
- `/r/<code>` redirects to `/scan/arrive` only when signed in and the cookie exists. Signed out, the marker is kept so
  signing in and returning still works; it expires on its own.
- `/scan/arrive` **clears the marker on every outcome**, then goes to `/medical/<job>?resident=<id>` only if: the
  marker is live, the login has app access, `canOpen` the job now, the card names a resident whose status is Resident
  and the job's picker view returns it. Anything else sends the person to the plain `/r/<code>`, which behaves as
  `2026-10-07-name-card-taps.md` says. No loop: the cookie is gone.
- Known limit: a different card tapped on that phone within the five minutes is taken as the scan. That is the same
  person, job and phone, and the marker is then spent.

## Public card sign-in button (2026-10-20)
The public card shows a large *I work here: sign in* button at the top only when nobody is signed in. It links to `/login?next=/r/<code>`, so login returns to the scan; the waiting marker cookie is untouched by it (signed out, `/r/` keeps it), so the iPhone flow resumes. The small staff hint stays below.

## Not done
Scan card on other per-resident forms.
