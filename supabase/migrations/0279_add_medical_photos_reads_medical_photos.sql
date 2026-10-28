-- consumer: none (the app already asks photos.resident_medical: sections/photos.tsx:23 and the PhotoUploader read prop; this row alone changes what it shows)
--
-- ADD MEDICAL PHOTOS MAY NOW VIEW MEDICAL PHOTOS. THIS REVERSES 0276's NOTE 4 ON PURPOSE.
-- 0276 note 4 read: "NOT GRANTED: Add medical photos (add_medical_photos). Lutan's card 3 ruling was 'decrease to just what is
-- required': that card files photos, it does not browse them. Giving it the read later is one more card_grants row, not code."
-- On 2026-10-28 Lutan reversed it: "Yes add medical photos should also be able to view medical photos."
-- The note was right about the mechanism: it is one card_grants row, no code and no policy change. Do not "fix" this back to match 0276.
--
-- Read (level 1) only. The attachments insert/update/delete policies are untouched. Nothing here names a role, and Admin sits outside
-- the card system. Re-runnable.

insert into card_grants (card, activity, level)
values ('add_medical_photos', 'photos.resident_medical', 1)
on conflict (card, activity) do update set level = excluded.level;

notify pgrst, 'reload schema';
