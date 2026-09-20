-- Switch the animal_code prefix from "A-" to "R-" (Resident), so the code
-- reads as what it identifies. Existing codes are rewritten in place — the
-- number part is untouched, so ordering and uniqueness are preserved. Any
-- resident whose Drive folder was already created under the old
-- "<Name> (A-0001)" name keeps that folder: lookups go through the cached
-- residents.drive_folder_id, not the folder name (see ensureResidentFolder
-- in src/lib/google/drive.ts).

alter table residents
  alter column animal_code set default ('R-' || lpad(nextval('residents_animal_number_seq')::text, 4, '0'));

update residents
set animal_code = 'R-' || substr(animal_code, 3)
where animal_code like 'A-%';
