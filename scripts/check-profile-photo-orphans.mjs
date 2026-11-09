// Read-only: which residents' PROFILE PHOTOS would 0342 hide from the website, and which are on it today without being an
// approved picture of their own? Backlog #h8xqv; docs/decisions/2026-11-09-profile-photo-fails-open.md.
//
//   node scripts/check-profile-photo-orphans.mjs                      (dev)
//   node scripts/check-profile-photo-orphans.mjs --env production     (production: the planner or release manager runs this)
//
// One SELECT, nothing written. Prints resident codes and the first 8 characters of each Drive id, never a name or a file.
//
// Every resident with a profile photo falls in exactly one bucket:
//   eligible     an attachment of THIS resident with THIS id, not Medical, a picture, approval = 'public_ok', and no copy of
//                it filed under Medical. 0342 shows it, exactly as before.
//   no_row       NO attachment of this resident has this id. BEFORE 0342 the website showed it (public_resident_cards has no
//                visibility gate) and is_public_drive_file() let the photo proxy serve the file to anyone: this is the
//                fail-open. AFTER 0342 it reads as no photo.
//   video        an approved, non-Medical attachment that is a video by kind or by file name. Also shown before 0342 (the
//                old views only tested Medical and approval); hidden after.
//   held_back    Medical or not approved. The old views already hid these; 0342 changes nothing for them.
//
// So `no_row + video` is how many profile photos leave the website when 0342 is applied, and, while 0342 is NOT yet applied,
// how many are being published today without being an approved picture of their own. Exit 0 always: this reports.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(name);
const ref = projectRef(env);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is required.");
  process.exit(2);
}

// The same tests as 0342's views, which are 0319's (set_resident_profile_photo and delete_resident_photo's fallback).
const SQL = `
with p as (
  select r.resident_code, r.id, left(r.profile_photo_drive_file_id, 8) as fid,
    exists (select 1 from attachments a where a.owner_type = 'resident' and a.owner_id = r.id
            and a.drive_file_id = r.profile_photo_drive_file_id) as has_row,
    exists (select 1 from attachments a where a.owner_type = 'resident' and a.owner_id = r.id
            and a.drive_file_id = r.profile_photo_drive_file_id
            and lower(btrim(coalesce(a.sub_folder, ''), E' \\t\\r\\n\\f\\v')) = 'medical') as any_medical,
    exists (select 1 from attachments a where a.owner_type = 'resident' and a.owner_id = r.id
            and a.drive_file_id = r.profile_photo_drive_file_id
            and lower(btrim(coalesce(a.sub_folder, ''), E' \\t\\r\\n\\f\\v')) <> 'medical'
            and a.approval = 'public_ok') as approved_not_medical,
    exists (select 1 from attachments a where a.owner_type = 'resident' and a.owner_id = r.id
            and a.drive_file_id = r.profile_photo_drive_file_id
            and lower(btrim(coalesce(a.sub_folder, ''), E' \\t\\r\\n\\f\\v')) <> 'medical'
            and coalesce(a.media_kind, 'photo') = 'photo'
            and coalesce(a.file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
            and a.approval = 'public_ok') as eligible_row
  from residents r
  where r.profile_photo_drive_file_id is not null
), b as (
  select resident_code, fid,
    case when not has_row then 'no_row'
         when eligible_row and not any_medical then 'eligible'
         when approved_not_medical and not any_medical then 'video'
         else 'held_back' end as bucket
  from p
)
select
  (select count(*) from residents) as residents,
  (select count(*) from b) as with_profile_photo,
  (select count(*) from b where bucket = 'eligible') as eligible,
  (select count(*) from b where bucket = 'no_row') as no_row,
  (select count(*) from b where bucket = 'video') as video,
  (select count(*) from b where bucket = 'held_back') as held_back,
  exists (select 1 from schema_migrations where filename like '0342\\_%') as applied_0342,
  coalesce((select json_agg(json_build_object('code', resident_code, 'fid', fid, 'bucket', bucket) order by resident_code)
            from b where bucket in ('no_row', 'video')), '[]'::json) as leaving
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: SQL }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`query failed (${res.status}): ${text}`);
  process.exitCode = 2;
} else {
  const [row] = JSON.parse(text);
  const leaving = Number(row.no_row) + Number(row.video);
  console.log(`Project: ${ref} (${name}), ${new Date().toISOString()}`);
  console.log(`residents ${row.residents}; with a profile photo ${row.with_profile_photo}`);
  console.log(`  eligible ${row.eligible} | no_row ${row.no_row} | video ${row.video} | held_back ${row.held_back}`);
  console.log(`0342 applied: ${row.applied_0342 ? "yes" : "no"}`);
  for (const r of row.leaving) console.log(`  ${r.bucket.padEnd(7)} ${r.code}  ${r.fid}…`);
  if (row.applied_0342) {
    console.log(`${leaving} profile photo(s) are now hidden from the website by 0342 (no approved picture of their own).`);
  } else {
    console.log(
      `${leaving} profile photo(s) are on the public website TODAY without being an approved picture of their own, ` +
        `and will leave it when 0342 is applied.`,
    );
  }
}
