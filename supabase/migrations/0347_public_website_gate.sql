-- consumer: src/lib/enclosures/public.ts, src/app/e/[id]/page.tsx, src/lib/appeals/public.ts, src/app/campaigns/page.tsx, src/app/sitemap.ts
-- 0347: the website shows an animal only if it is adoption-ready or has a RUNNING appeal (#7aev4, Lutan 2026-11-09).
--
-- 1. private.appeal_running(published, status): the ONE definition of "running". Published, and status live or funded.
--    draft is unpublished by constraint; closed is over (0343 used status <> 'draft', which let a closed appeal keep the
--    animal public: one on production, "Treatment"). Pure scalar function, no table read, so it needs no definer rights.
-- 2. public_appeals and public_appeal_photos ask it instead of status <> 'draft'. Columns, names and order unchanged.
-- 3. public_enclosures lists only residents who are adoption-ready or under a running (and text-approved) appeal.
--    public_resident_cards is NOT changed: the kennel card must always answer (docs/decisions.md 2026-09-22,
--    check-card-taps.mjs point 1). See docs/decisions/2026-11-09-public-cards-gate.md.
-- Additive and re-runnable. Undo: re-run 0343's definitions of the three views.

create or replace function private.appeal_running(p_published boolean, p_status text)
returns boolean language sql immutable as $$
  select coalesce(p_published, false) and p_status in ('live', 'funded')
$$;
grant execute on function private.appeal_running(boolean, text) to anon, authenticated, service_role;

create or replace view public_appeals as
SELECT a.id,
    a.resident_id,
    r.name AS resident_name,
    r.thai_name AS resident_thai_name,
    r.species,
    a.title,
    a.what_is_wrong,
    a.treatment_needed,
    a.cost_covers,
    a.target_amount,
    (COALESCE(( SELECT sum(l.amount) AS sum
           FROM (donations d
             JOIN donation_lines l ON ((l.donation_id = d.id)))
          WHERE ((d.designation = 'appeal'::text) AND (d.designation_appeal_id = a.id))), (0)::numeric))::numeric(12,2) AS raised_amount,
    ( SELECT max(d.created_at) AS max
           FROM donations d
          WHERE ((d.designation = 'appeal'::text) AND (d.designation_appeal_id = a.id))) AS raised_as_of,
    a.deadline,
    a.status,
    a.outcome_note,
    a.display_style,
    a.social_links,
    ( SELECT att.drive_file_id
           FROM (appeal_photos p
             JOIN attachments att ON ((att.id = p.attachment_id)))
          WHERE ((p.appeal_id = a.id) AND p.is_cover AND (att.owner_type = 'resident'::attachment_owner_type) AND (att.owner_id = a.resident_id) AND (att.approved_at IS NOT NULL) AND ((lower(btrim(COALESCE(att.sub_folder, ''::text))) <> 'medical'::text) OR p.medical_ok) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'::text))) AS cover_drive_file_id,
    COALESCE(( SELECT p.is_graphic
           FROM appeal_photos p
          WHERE ((p.appeal_id = a.id) AND p.is_cover)), false) AS cover_is_graphic,
    a.published_at,
    a.closed_at,
    private.approved_translations('appeals'::text, a.id) AS translations,
    COALESCE(( SELECT p.medical_ok
           FROM (appeal_photos p
             JOIN attachments att ON ((att.id = p.attachment_id)))
          WHERE ((p.appeal_id = a.id) AND p.is_cover AND (lower(btrim(COALESCE(att.sub_folder, ''::text))) = 'medical'::text))), false) AS cover_is_medical
   FROM (appeals a
     JOIN residents r ON ((r.id = a.resident_id)))
  WHERE (private.appeal_running(a.published, a.status) AND (a.text_approval = 'public_ok'::text));

grant select on public_appeals to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeals from anon, authenticated;

create or replace view public_appeal_photos as
SELECT p.id,
    p.appeal_id,
    att.drive_file_id,
    p."position",
    p.is_cover,
    p.is_graphic,
    (lower(btrim(COALESCE(att.sub_folder, ''::text))) = 'medical'::text) AS is_medical
   FROM (((appeal_photos p
     JOIN appeals a ON ((a.id = p.appeal_id)))
     JOIN residents r ON ((r.id = a.resident_id)))
     JOIN attachments att ON ((att.id = p.attachment_id)))
  WHERE (private.appeal_running(a.published, a.status) AND (att.owner_type = 'resident'::attachment_owner_type) AND (att.owner_id = a.resident_id) AND (att.approved_at IS NOT NULL) AND ((lower(btrim(COALESCE(att.sub_folder, ''::text))) <> 'medical'::text) OR p.medical_ok) AND (att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'::text))
  ORDER BY p."position", p.created_at;

grant select on public_appeal_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeal_photos from anon, authenticated;

create or replace view public_enclosures as
select
  e.id,
  e.name,
  e.name_th,
  z.name as zone_name,
  z.name_th as zone_name_th,
  coalesce(
    (select jsonb_agg(to_jsonb(c) order by c.name, c.resident_code)
       from private.resident_current_state s
       join public_resident_cards c on c.id = s.resident_id
       join residents r on r.id = s.resident_id
      where s.current_enclosure_id = e.id
        and (r.ready_for_adoption
             or exists (select 1 from appeals a
                         where a.resident_id = r.id
                           and private.appeal_running(a.published, a.status)
                           and a.text_approval = 'public_ok'))),
    '[]'::jsonb
  ) as residents
from enclosures e
join zones z on z.id = e.zone_id
where z.name <> 'Lifecycle';

grant select on public_enclosures to anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger on public_enclosures from anon, authenticated;

notify pgrst, 'reload schema';
