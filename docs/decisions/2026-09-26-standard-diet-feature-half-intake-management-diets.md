# 2026-09-26 — Standard diet, feature half: intake, Management → Diets, enclosure markers

- **Moving the standard goes through `set_standard_diet` (`0090`)**, not two
  updates from the server action: clear-then-set has to be one transaction
  or a failure between the two leaves no standard, and supabase-js has none.
- **Zero standards is tolerated everywhere, and means "nobody is special".**
  Intake then shows a disabled "Choose a diet" placeholder and `required`
  forces a pick; Management → Diets shows a note above the table; the
  enclosure cards show no markers. Marking every resident with a diet as
  "special" when there is no standard would fill the cards with markers
  that say nothing.
- **"Special" is any current diet that is not the standard**, per resident,
  so a resident on the standard *and* a supplement counts as special and
  the marker names the supplement. Current is the hub's rule, dated by the
  shelter's today (`todayIso()`), so it flips at midnight in Thailand, not UTC.
- **The card marker is a `<details>` with an icon and a count**, raised
  above the card's stretched link: a tap opens the names instead of
  following the card, a hover shows them in the title, and nothing uses
  colour, which belongs to capacity. The Lifecycle cards (Hospital,
  Fostered…) get it too — a hospitalised resident on a renal diet is exactly
  who staff should see.
- **One loader, `loadSpecialDiets()`**, serves the grid (whole shelter, one
  query) and the enclosure page (its residents only). A role RLS keeps out
  of `resident_diets` gets no markers rather than an error.
