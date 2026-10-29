-- consumer: src/lib/permissions/cards.ts, src/lib/i18n/dictionaries/en.ts, src/lib/i18n/dictionaries/th.ts
--
-- FOUR CARDS SIZED TO WHAT A VET DOES (docs/decisions/2026-10-29-vet-cards.md). 0257 made every role's access the union of its cards, and
-- nine activities a vet performs were carried by no card sized for them; reference.add_while_recording by no card at all. CLAUDE.md: "No
-- card for the activity? Create one." The existing medical_records and residents cards were rejected as the answer because between them
-- they also hand over archiving, send to hospital, booking, moving, rehoming and registering a resident.
--
--   record_vet_care       medical.visits, procedures, blood_tests, prescriptions, immunizations, diet  at edit (2)   includes view_medical
--   record_microchip      resident.microchip                                                           yes (2)       includes view_residents
--   adoption_news         resident.adoption_news                                                       at edit (2)   includes view_residents
--   add_while_recording   reference.add_while_recording                                                yes (2)       includes view_medical
--
-- Nothing here is given to any role: who holds each card is an assignment in Settings -> Who does what. Nothing is given to Admin, which
-- sits outside the card system. The triggers of 0257 recompute role_permissions when card_grants / card_includes change; no role holds a
-- new card, so no role's cells move. Re-runnable.

insert into card_grants (card, activity, level)
values
  ('record_vet_care', 'medical.visits', 2),
  ('record_vet_care', 'medical.procedures', 2),
  ('record_vet_care', 'medical.blood_tests', 2),
  ('record_vet_care', 'medical.prescriptions', 2),
  ('record_vet_care', 'medical.immunizations', 2),
  ('record_vet_care', 'medical.diet', 2),
  ('record_microchip', 'resident.microchip', 2),
  ('adoption_news', 'resident.adoption_news', 2),
  ('add_while_recording', 'reference.add_while_recording', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_includes (card, included_card)
values
  ('record_vet_care', 'view_medical'),
  ('record_microchip', 'view_residents'),
  ('adoption_news', 'view_residents'),
  ('add_while_recording', 'view_medical')
on conflict do nothing;

insert into card_features (card, feature_id)
select m.card, f.id
  from (values
    ('record_vet_care', 'medical_information'),
    ('record_microchip', 'medical_information'),
    ('adoption_news', 'resident_information'),
    ('add_while_recording', 'medical_information')
  ) as m(card, feature)
  join features f on f.key = m.feature
on conflict (card) do nothing;

notify pgrst, 'reload schema';
