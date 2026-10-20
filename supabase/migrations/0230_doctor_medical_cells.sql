-- consumer: none
--
-- The doctor role gets the cells the paper (docs/roles-and-permissions.md §4, the Doctor column) always gave it. LUTAN RULED
-- 2026-10-19: the visiting vet MAY change diets and prescriptions, so the expectation was right and the database was missing cells
-- (docs/decisions/2026-10-20-doctor-medical-cells.md). This is NOT today's behaviour copied into an expectation.
--
-- Cells (level 2 = edit / yes, 1 = read; every one still limited to the doctor's own clinic by roles.scope_clinical = own_clinic):
--   resident.record 1, resident.adoption_news 1, resident.microchip 2, visit.book 2,
--   medical.visits / procedures / blood_tests / prescriptions / immunizations / weight / diet 2,
--   photos.resident_add 2, reference.add_while_recording 2.
-- That is what lets a vet write resident_diet_rounds and prescription_rounds, and read frequency_rounds (medical.prescriptions read).
-- A cell the doctor already holds is raised, never lowered (the 0225-era grant of medical.visits read becomes edit).
--
-- To revert: delete from role_permissions where role_id = (select id from roles where key = 'doctor') and activity like 'medical.%'
-- (and the four others above). Re-runnable: on conflict keeps the higher level.

insert into role_permissions (role_id, activity, level)
select r.id, c.activity, c.level
  from roles r
 cross join (values
   ('resident.record', 1), ('resident.adoption_news', 1), ('resident.microchip', 2), ('visit.book', 2),
   ('medical.visits', 2), ('medical.procedures', 2), ('medical.blood_tests', 2), ('medical.prescriptions', 2),
   ('medical.immunizations', 2), ('medical.weight', 2), ('medical.diet', 2),
   ('photos.resident_add', 2), ('reference.add_while_recording', 2)
 ) as c(activity, level)
 where r.key = 'doctor'
on conflict (role_id, activity) do update set level = greatest(role_permissions.level, excluded.level);
