# 2026-10-07 — Name card taps: never less than the public card; medical follows the matrix

Backlog item "Name card taps under the new permissions". Lutan's rule: signed in sees more, anonymous sees the
general card, and a signed-in person never sees less than a visitor.

## What was wrong

`/r/<code>` sent everyone with app access to `/residents/<id>`. There, a login on the volunteer floor (the 2IC,
both Heads, volunteers: `legacy_role = 'volunteer'`) got `ResidentWhoAndWhere`, **less** than the public card, and
a vet outside the resident's clinics (0108) got a 404 where a visitor sees the card.

## What it does now

`src/lib/residents/card-landing.ts` is the one answer, used by the page and by `scripts/check-card-taps.mjs`:

- signed out, or no app access (`public_viewer`): **public** card, unchanged
- app access, may read `resident.record`, is not on the who-and-where floor, and the `residents` row is visible
  to them: **full**, the hub as before (Admin, Management, Staff, a vet inside their clinic)
- everyone else with app access: **public-plus**, the same public card plus where the resident lives (the
  `resident_who_and_where` view) and a button for each job they may open for that resident (Add Medical Photos,
  Record Weight, Feed Special Diets, from `ROUTES`/`canOpen`, no role name)

`/residents/<id>` sends a who-and-where login, or a vet whose clinics do not treat that resident, on to
`/r/<id>` instead of rendering its own page or a 404. The two pages cannot loop: `/r` only redirects to the hub
when every condition the hub needs holds. `ResidentWhoAndWhere.tsx` is deleted, nothing used it any more.

No schema: the card view was already readable by everyone, and no policy changed.

## Open: do the Heads and volunteers read medical from a card?

**Not decided here.** The Director's draft gives the 2IC, both Heads and volunteers no "view residents and their
records" tick, so a card shows them no medical. That is the smaller grant, and it is what ships. If Lutan and the
Director want everyone signed in to read medical from a card, that is a tick for those roles in her matrix
(`resident.record`, read), not a special case in code: the `public-plus` branch then becomes `full` by itself,
except for volunteers, whose `readsWhoAndWhereOnly()` floor would also need to move to the scope (its own note in
`who-and-where.ts`). Answer to be recorded here when given.

## Not covered by the check

`scripts/check-card-taps.mjs` asserts the landing per principal from live database answers. It does not render the
page, the job buttons, or the `/residents/<id>` redirect; those are browser checks in the test plan.
