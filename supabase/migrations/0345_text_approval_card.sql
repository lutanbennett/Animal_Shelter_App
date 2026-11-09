-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/text/approve/page.tsx, src/app/text/approve/actions.ts
--
-- Backlog #7aev4, APP HALF. docs/decisions/2026-11-09-text-approval-app.md is the paper; 2026-11-09-text-approval-schema.md is the specification.
--
-- 1. THE ACTIVITY AND THE CARD. text.approve (yes/no) is the ability to say that the words the public website will show have been read.
--    One card holds it and nothing else: approve_text ("Approve public text"). It is about APPROVING, not editing: the point of the review is a
--    second person reading what visitors will read, so the card grants no right to change any of the records. Nobody is given the card;
--    Lutan assigns it in Settings > Who does what. Admin sits outside the card system and is untouched.
--
-- 2. WHAT THE CARD APPLIES. The card has to read the waiting text and record the answer without being handed whole tables (a resident's row
--    holds medical and personal columns that a text reviewer has no business reading). So it applies two functions, not table policies:
--      text_review_queue()                  returns ONLY the public prose columns of the rows still waiting (text_approval is null)
--      set_text_approval(kind, id, state)   sets public_ok or private_only on one row
--    Both are security definer and refuse at the top unless the caller holds text.approve (Admin passes inside has_permission()).
--
-- 3. THE DATA API GUARD (specification point 4). text_approval_stamp() now refuses a change of text_approval to public_ok or private_only
--    unless the caller holds text.approve, so a plain row update through the Data API cannot approve anything. Setting it to NULL is always
--    allowed (that only hides). A caller with no auth.uid() (a migration, a script on the service role) is not refused, as in 0224.
--    NOT GUARDED: an INSERT. The column default is still public_ok (the flip to NULL is the next stream's), and an insert that takes the default
--    cannot be told from one that names it; the flip closes that.
--
-- 4. RESET ON EDIT (specification point 5). When a public prose column of a row changes and the same statement does not set text_approval,
--    text_approval goes back to NULL and its stamp is cleared. A save that touches only an internal column leaves it alone. The columns per
--    table are the specification's list, completed from the views: residents also carries the descriptors the profile view shows.
--    NOTE: from this migration, editing the public words of a row hides it from the website until someone approves it again, because the views
--    already ask for public_ok. That is the design, and the queue exists to answer it.
--
-- Additive and re-runnable. To undo: restore 0343's text_approval_stamp(), drop the two functions, delete the card_grants/card_features rows
-- and the activity row.

insert into permission_activities (key, kind, area, sort)
values ('text.approve', 'yesno', 'settings', 88)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('approve_text', 'text.approve', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'approve_text', cf.feature_id from card_features cf where cf.card = 'approve_photos'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- The stamp, now with the guard and the reset
-- ---------------------------------------------------------------------------
create or replace function text_approval_stamp()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_cols text[];
  v_col text;
  v_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
    return new;
  end if;

  if new.text_approval is distinct from old.text_approval then
    -- the guard: only a holder of text.approve may say public_ok or private_only
    if new.text_approval is not null and auth.uid() is not null
       and not coalesce((select has_permission('text.approve')), false) then
      raise exception 'You do not have permission to approve public text';
    end if;
    new.text_approval_by := case when new.text_approval is null then null else auth.uid() end;
    new.text_approval_at := case when new.text_approval is null then null else now() end;
    return new;
  end if;

  v_cols := case tg_table_name
    when 'residents' then array['bio','temperament_notes','past_story_notes','hook_line','ideal_home','good_with_dogs','good_with_cats','good_with_children','energy_level','breed_th','colour_th']
    when 'adoption_updates' then array['public_story','public_first_name']
    when 'appeals' then array['title','what_is_wrong','treatment_needed','cost_covers','outcome_note','social_links']
    when 'fundraising_events' then array['title','summary','description','location','social_links']
    when 'project_folders' then array['name','name_th','summary','location']
    when 'desexing_drives' then array['title','venue','venue_address','description','price_note','eligibility_note']
    else array[]::text[]
  end;
  foreach v_col in array v_cols loop
    if to_jsonb(new) -> v_col is distinct from to_jsonb(old) -> v_col then v_changed := true; exit; end if;
  end loop;

  if v_changed and old.text_approval is not null then
    new.text_approval := null;
    new.text_approval_by := null;
    new.text_approval_at := null;
  else
    new.text_approval_by := old.text_approval_by;
    new.text_approval_at := old.text_approval_at;
  end if;
  return new;
end $$;
revoke execute on function text_approval_stamp() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- What the card applies: the queue, and the answer
-- ---------------------------------------------------------------------------
create or replace function text_review_queue()
returns table (kind text, id uuid, label text, fields jsonb, changed_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce((select has_permission('text.approve')), false) then
    raise exception 'You do not have permission to approve public text';
  end if;
  return query
  select * from (
    select 'resident'::text, r.id, r.name::text,
           jsonb_strip_nulls(jsonb_build_object('bio', r.bio, 'temperament_notes', r.temperament_notes, 'past_story_notes', r.past_story_notes,
             'hook_line', r.hook_line, 'ideal_home', r.ideal_home, 'good_with_dogs', r.good_with_dogs, 'good_with_cats', r.good_with_cats,
             'good_with_children', r.good_with_children, 'energy_level', r.energy_level, 'breed_th', r.breed_th, 'colour_th', r.colour_th)),
           r.created_at
      from residents r where r.text_approval is null and r.is_public_visible
    union all
    select 'adoption_update', u.id, coalesce(nullif(u.public_first_name, ''), r.name)::text,
           jsonb_strip_nulls(jsonb_build_object('public_story', u.public_story, 'public_first_name', u.public_first_name)), u.created_at
      from adoption_updates u join residents r on r.id = u.resident_id where u.text_approval is null and u.share_publicly
    union all
    select 'appeal', a.id, a.title::text,
           jsonb_strip_nulls(jsonb_build_object('title', a.title, 'what_is_wrong', a.what_is_wrong, 'treatment_needed', a.treatment_needed,
             'cost_covers', a.cost_covers, 'outcome_note', a.outcome_note, 'social_links', a.social_links)), coalesce(a.updated_at, a.created_at)
      from appeals a where a.text_approval is null and a.published and a.status <> 'draft'
    union all
    select 'event', e.id, e.title::text,
           jsonb_strip_nulls(jsonb_build_object('title', e.title, 'summary', e.summary, 'description', e.description, 'location', e.location,
             'social_links', e.social_links)), coalesce(e.updated_at, e.created_at)
      from fundraising_events e where e.text_approval is null and e.published
    union all
    select 'project', f.id, f.name::text,
           jsonb_strip_nulls(jsonb_build_object('name', f.name, 'name_th', f.name_th, 'summary', f.summary, 'location', f.location)),
           coalesce(f.updated_at, f.created_at)
      from project_folders f where f.text_approval is null and f.is_public
    union all
    select 'drive', d.id, d.title::text,
           jsonb_strip_nulls(jsonb_build_object('title', d.title, 'venue', d.venue, 'venue_address', d.venue_address, 'description', d.description,
             'price_note', d.price_note, 'eligibility_note', d.eligibility_note)), coalesce(d.updated_at, d.created_at)
      from desexing_drives d where d.text_approval is null and d.status in ('open', 'cancelled')
  ) q(kind, id, label, fields, changed_at)
  order by 5 desc nulls last;
end $$;
revoke all on function text_review_queue() from public, anon;
grant execute on function text_review_queue() to authenticated, service_role;
comment on function text_review_queue() is
  'The public text waiting to be read (text_approval is null), prose columns only, for a holder of text.approve (0345).';

create or replace function set_text_approval(p_kind text, p_id uuid, p_state text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n int;
begin
  if not coalesce((select has_permission('text.approve')), false) then
    raise exception 'You do not have permission to approve public text';
  end if;
  if p_state is null or p_state not in ('public_ok', 'private_only') then
    raise exception 'The answer must be public_ok or private_only';
  end if;
  if p_kind = 'resident' then update residents set text_approval = p_state where id = p_id;
  elsif p_kind = 'adoption_update' then update adoption_updates set text_approval = p_state where id = p_id;
  elsif p_kind = 'appeal' then update appeals set text_approval = p_state where id = p_id;
  elsif p_kind = 'event' then update fundraising_events set text_approval = p_state where id = p_id;
  elsif p_kind = 'project' then update project_folders set text_approval = p_state where id = p_id;
  elsif p_kind = 'drive' then update desexing_drives set text_approval = p_state where id = p_id;
  else raise exception 'Unknown kind of text: %', p_kind;
  end if;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'That text no longer exists'; end if;
end $$;
revoke all on function set_text_approval(text, uuid, text) from public, anon;
grant execute on function set_text_approval(text, uuid, text) to authenticated, service_role;
comment on function set_text_approval(text, uuid, text) is
  'Say that one piece of public text may be shown (public_ok) or never shown (private_only). For a holder of text.approve (0345).';
