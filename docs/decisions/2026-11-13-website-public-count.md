# 2026-11-13 — Website settings shows animals in care beside animals shown on the website (#tu9v2)

**What:** a card on the Website settings Home tab: *in care*, *shown on the website*, and the difference.
No migration.

- **"In care"** is the four statuses `Resident`, `Unassigned`, `Hospitalised`, `Fostered`, defined in SQL by
  `public_shelter_stats.in_care` (`0073_shelter_today.sql:186`, widened from `0065_unassigned_in_care.sql`) and in code by
  `IN_CARE_STATUSES` (`src/lib/management/report.ts`). The brief called the view `shelter_stats`; it is `public_shelter_stats`.
  I count `resident_current_state` with that same constant rather than reading `liveStats.in_care`, because
  `public_shelter_stats` returns NULL for a count the shelter has switched off on the homepage (0328), and a publisher must see the number
  whether or not the homepage band shows it.
- **"Shown on the website" is `public_resident_profiles`, NOT `public_resident_cards`** (the brief said the latter). 0350 says in
  its header that `public_resident_cards` is unchanged and "the kennel card always answers": it holds every animal, so counting it would
  make the gap read zero. The adoption pages read `public_resident_profiles` (`src/lib/residents/public.ts`, `src/app/adopt/page.tsx`),
  filtered by `private.on_website` = ready for adoption OR a running, text-approved appeal (`0350_public_visible_one_expression.sql`).
- **Gate:** `can(perms, "resident.record", "read")`, the activity the residents table's read policy asks
  (`0249_medical_card_reads_the_record.sql`: `has_permission('resident.record','read') and may_open_resident_record()`). Where false, the
  counts are neither read nor drawn. Admin passes through the `perms.isAdmin` short-circuit. The residents policy also requires
  `may_open_resident_record()`; a login that passes the card check but fails that sees RLS-limited counts. Found, not changed.
- **No card grants both** `website.content` and `resident.record` in its own bundle (checked in `cards.ts`). A login needs `website` (edit) and
  `view_residents` (or any card carrying `resident.record` at read) together; one with only the website card sees no counts. No fallback added.
- Proven in the browser on dev: a login with `website`+`view_residents` sees 13 in care, 2 shown, 11 not shown; a login with `website` alone sees
  the page without the card.
