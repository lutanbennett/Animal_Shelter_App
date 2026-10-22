# Card walkthrough, run: `medical_records` and `book_clinic_visits` — 2026-10-22

Dev, port 3006, 375 px. Login made with `node scripts/dev-signin.mjs --cards medical_records --port 3006`.

## `medical_records` — BLOCKED at step 2 (harness fault, not yet a verdict on the card)

| step | result | note |
|---|---|---|
| 0 sign in | pass | header shows `Dev sign-in: medical_records` |
| 1 open `/residents` | pass | 90 residents, list loads |
| 2–9 (all eight TODOs) | not run | `/residents/<id>` redirects to `/r/<id>`, the name-card page (jobs: Record Weight, Feed, Special Diets). No vet visit, procedure, blood test, prescription, immunization or archive control is reachable. |
| 10 refused page | not run | |

**Cause (read from the code, not guessed):** `src/app/residents/[id]/page.tsx:39` redirects any login for which
`on_volunteer_floor()` is true, i.e. whose role has `scope_residents = 'who_and_where'`. `scripts/dev-signin.mjs:97`
creates every card role with `scope_residents: "who_and_where"`. So **no card login made by the script can ever open a
full resident record**, whatever the card grants. The card's bundle has no way to set scope.

**Open question for Lutan:** is the fix in the script (make the role scope follow the card, e.g. full when the card
includes `view_residents` for record work), or in the card model (a card that grants medical edit should imply full
residents scope)? Left undecided; nothing was changed.

## `book_clinic_visits` — not run

Stopped before starting: it also needs a resident page, so it would hit the same redirect. The PR #856 return-to-list
behaviour is therefore still unchecked.

## TODOs answered / not answered

None answered: none reachable until the scope fault is resolved. The generator is unchanged.

## Cookie-jar sharing

Not tested (only this stream's login was used before blocking).

## Also seen

Dev compile of `/residents/[id]` took 24 s cold; the browser pane showed an empty body on `/r/<id>` although the
server returned a full 200 page (fetch confirmed the content). Pane rendering, not the app.

## Filed on backlog

See the "Backlog: dev-signin card roles are who_and_where" commit on the `backlog` branch.

Release-notes line: n/a: a walkthrough record changes nothing a shelter user can see.
