-- consumer: src/app/blood-tests/new/actions.ts, src/app/api/blood-tests/[id]/attachments/route.ts
--
-- Staff and management can log a blood test (dry-run finding F-01).
--
-- 0001 gave `blood_tests` a select policy for staff and volunteers and
-- read-write only for vet and admin; 0020 recorded that as "a deliberate read
-- of the Section 6 role table ... flagged as an assumption to confirm". It was
-- never confirmed, and the manual since says staff and management log blood
-- tests (src/lib/manual/en.ts, "Logging a blood test"): the form, the "+" on
-- the Blood Tests tab and the visit's "Log blood test" link are all offered,
-- and the save is then refused by RLS ("You don't have permission to do
-- that"), with or without a file. `procedures` had the same gap and 0031
-- closed it; blood tests never got the same fix.
--
-- This adds exactly 0031's pair, for the two roles the manual names:
--
--   staff       insert and update on blood_tests
--   management  the same, written out as the `management_*` twin 0039 makes of
--               every staff policy — 0039 ran before these existed, so a
--               twin has to be made by hand, as it was for read
--
-- Deliberately not granted, so a later reader does not "complete the set":
--
--   delete      nobody below admin and the vet's own-clinic delete (0110).
--               The app has no way to delete a blood test; 0124's archive
--               columns do not include `blood_tests`, so there is no archive
--               path that would need a policy either.
--   vet         unchanged. 0110 already scopes a vet to their own clinic's
--               visits (vet_insert/update/delete_blood_tests), which is
--               narrower than staff's and must stay so.
--   volunteer   read only, as the manual's Pass 6 says: a volunteer's medical
--               writes are all refused.
--
-- A file on a blood test already worked for staff and management
-- (record_attachment allows both, 0110); only the row was missing.
--
-- Re-runnable: each policy is dropped and re-created.

drop policy if exists staff_insert_blood_tests on blood_tests;
create policy staff_insert_blood_tests on blood_tests
  for insert with check (current_user_role() = 'staff');

drop policy if exists staff_update_blood_tests on blood_tests;
create policy staff_update_blood_tests on blood_tests
  for update using (current_user_role() = 'staff');

drop policy if exists management_insert_blood_tests on blood_tests;
create policy management_insert_blood_tests on blood_tests
  for insert with check (current_user_role() = 'management');

drop policy if exists management_update_blood_tests on blood_tests;
create policy management_update_blood_tests on blood_tests
  for update using (current_user_role() = 'management');
