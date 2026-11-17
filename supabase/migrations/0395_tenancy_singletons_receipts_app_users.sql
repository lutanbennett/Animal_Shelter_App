-- consumer: src/app/admin/website/actions.ts, src/app/admin/website/CreateSiteContentRow.tsx
--
-- Tenancy Part 6 (backlog #bncd0): the singletons that were singletons for the whole DATABASE, the receipt series,
-- and the one hand-written view. docs/decisions/2026-11-17-tenancy-part6-singletons.md has the reasoning.
--
-- WHAT STEP ZERO FOUND AGAINST THE LIVE DATABASE (not the file tree):
--   facility_maps_one_overview  already per-shelter since 0389 (unique (shelter_id) nulls not distinct where kind = 'overview').
--   map_rooms_one_per_kind      does not exist: 0184 dropped it. Nothing to do.
--   diet_types_one_standard     does not exist: 0243 dropped diet_types.is_standard and set_standard_diet(); the standard diet
--                               is diets.is_standard, whose diets_one_standard 0389 already scoped. So diet_types needs NO column
--                               for this part (it is still one of Part 5's column-less tenant tables, for the planner).
--   site_content                the one that was real: primary key is a boolean. Done below.
--   p_issuer                    already ignored since 0176; the fault the brief called live is closed. Only the series and the
--                               issuer's source were still Lanna's, done below.
--
-- THIS FILE ADDS NO shelter_id TO ANY TABLE, so 0392's three shelter_scope_* policy loop does not need re-running for it
-- (site_content and receipt_counters already carry the column and the policies; shelters is the tenant table, exempt there).
--
-- TO UNDO: drop site_content_one_per_shelter and re-add `primary key (id)` (only valid while there is one row); restore
-- receipt_issuer() and issue_donation_receipt() from 0176/0186; drop shelters.receipt_series and shelters.receipt_issuers;
-- restore private.app_users from 0264. Re-runnable: every step is a no-op the second time.

-- ---------------------------------------------------------------------------
-- 1. site_content: one row per shelter, not one per database
-- ---------------------------------------------------------------------------
-- id stays as a boolean column that is always true (check (id) and its default are kept, so every `.eq("id", true)` and the
-- insert policy admin_insert_site_content keep working untouched). It is no longer the key: shelter_id is. NULLS NOT DISTINCT
-- keeps today's one-row guarantee for a write that carries no shelter header, exactly as facility_maps_one_overview does.
-- Nothing references site_content(id) (no foreign key) and the table is in no publication, so dropping the key loses nothing.
alter table site_content drop constraint if exists site_content_pkey;
create unique index if not exists site_content_one_per_shelter on site_content (shelter_id) nulls not distinct;

-- ---------------------------------------------------------------------------
-- 2. The receipt series and issuer become per-shelter data
-- ---------------------------------------------------------------------------
-- They live on shelters, which no login can write (no grant to authenticated or anon, no policy but definer_all): the point
-- of 0176 was that a receipt must not read a field anyone can edit, and a column on shelters changes only by a migration
-- or the service role, exactly as the old hard-coded function did.
alter table shelters add column if not exists receipt_series text;
alter table shelters add column if not exists receipt_issuers jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shelters_receipt_series_check') then
    alter table shelters add constraint shelters_receipt_series_check check (receipt_series is null or receipt_series ~ '^[A-Z]+$');
  end if;
end $$;
create unique index if not exists shelters_receipt_series_key on shelters (receipt_series) where receipt_series is not null;

-- Lanna's values are exactly what receipt_issuer() returned for both countries until now (0176): nothing printed changes.
update shelters
   set receipt_series = coalesce(receipt_series, 'LCA'),
       receipt_issuers = coalesce(receipt_issuers, jsonb_build_object(
         'TH', jsonb_build_object(
           'name', 'Lanna Care for Animals Foundation',
           'addressLines', jsonb_build_array(
             '291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,',
             'Mae Wang District, Chiang Mai 50360, Thailand'),
           'registrationLines', '[]'::jsonb,
           'statementLines', '[]'::jsonb),
         'US', jsonb_build_object(
           'name', 'Lanna Care for Animals Foundation',
           'addressLines', jsonb_build_array(
             '291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,',
             'Mae Wang District, Chiang Mai 50360, Thailand'),
           'registrationLines', '[]'::jsonb,
           'statementLines', '[]'::jsonb)))
 where key = 'lanna';

-- The issuer of the CURRENT shelter, by country. Still never taken from a caller: current_shelter_id() is the request header,
-- and the value is read from shelters, which nobody but a migration or the service role can write.
create or replace function receipt_issuer(p_country text)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_issuer jsonb;
begin
  select receipt_issuers -> p_country into v_issuer from shelters where id = current_shelter_id();
  if v_issuer is null then
    raise exception 'No receipt issuer for country %', p_country using errcode = '22023';
  end if;
  return v_issuer;
end;
$$;

comment on function receipt_issuer(text) is
  'The issuer block printed on a donation receipt, per country, for the current shelter (0395; 0176 had it as code). Read from shelters.receipt_issuers, which no login can write. Lanna''s row mirrors receiptIssuer() in src/lib/donations/issuer.ts; check-donation-receipts-schema.mjs fails if they differ.';

revoke execute on function receipt_issuer(text) from public, anon;
grant execute on function receipt_issuer(text) to authenticated, service_role;

-- The RPC: same checks as 0186, series and counter now the current shelter's. p_issuer and p_content stay accepted and ignored.
create or replace function issue_donation_receipt(
  p_donation_id uuid,
  p_country text,
  p_issued_on date,
  -- ACCEPTED AND DISCARDED (0176), only so callers that still pass it keep working.
  p_issuer jsonb,
  -- ACCEPTED AND DISCARDED (0177), for the same reason.
  p_content jsonb
)
returns donation_receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_row donation_receipts;
  v_issuer jsonb;
  v_content jsonb;
  v_received date;
  v_shelter uuid := current_shelter_id();
  v_series text;
begin
  if not (select has_permission('donation.receipt')) then
    raise exception 'Not allowed to issue a donation receipt' using errcode = '42501';
  end if;
  select received_on into v_received from donations where id = p_donation_id;
  if not found then
    raise exception 'No such donation';
  end if;
  if p_country not in ('TH', 'US') then
    raise exception 'Receipt country must be TH or US' using errcode = '23514';
  end if;
  if p_issued_on is null then
    raise exception 'A receipt needs a date' using errcode = '22023';
  end if;
  if p_issued_on < v_received then
    raise exception 'A receipt cannot be dated before the donation it is for' using errcode = '22023';
  end if;
  if p_issued_on > shelter_today() then
    raise exception 'A receipt cannot be dated in the future' using errcode = '22023';
  end if;
  v_issuer := receipt_issuer(p_country);
  v_content := receipt_content(p_donation_id);

  select receipt_series into v_series from shelters where id = v_shelter;
  if v_series is null then
    raise exception 'This shelter has no receipt series' using errcode = '22023';
  end if;

  update receipt_counters
     set next_value = next_value + 1
   where series = v_series and shelter_id = v_shelter
  returning next_value - 1 into v_value;
  if v_value is null then
    raise exception 'Receipt counter % is missing', v_series;
  end if;

  insert into donation_receipts (number, donation_id, country, issued_on, issued_by, content, issuer)
  values (v_series || lpad(v_value::text, 7, '0'), p_donation_id, p_country, p_issued_on, auth.uid(), v_content, v_issuer)
  returning * into v_row;

  return v_row;
end;
$$;

comment on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) is
  'The only way a receipt row is made (0168). Issuer from receipt_issuer() (0176), content from receipt_content() (0177); p_issuer and p_content are ignored. Series and counter are the current shelter''s (0395). p_issued_on is validated (0186).';

revoke execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) from public, anon;
grant execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. private.app_users takes the tenant filter by hand
-- ---------------------------------------------------------------------------
-- STAYS OWNED BY postgres (auth.users has RLS on with no policy and postgres cannot add one; a re-owned role read 0 rows,
-- 0375). Being postgres-owned it bypasses the per-shelter policies on user_roles, so the filter is written here: a trusted caller
-- (service role, cron, no claims) sees everyone as before; a login sees only logins of its own shelter, and its own row
-- is looked for in its own shelter too. Same columns, so grants and public.app_users (0263) carry over.
create or replace view private.app_users as
SELECT u.id,
    (u.email)::character varying(255) AS email,
    COALESCE(NULLIF((u.raw_user_meta_data ->> 'full_name'::text), ''::text), NULLIF((u.raw_user_meta_data ->> 'name'::text), ''::text)) AS display_name,
    r.archived_at,
    rl.key AS role_key
   FROM ((auth.users u
     JOIN user_roles r ON (((r.user_id = u.id) AND r.is_main)))
     JOIN roles rl ON ((rl.id = r.role_id)))
  WHERE (public.is_trusted_caller() OR r.shelter_id = public.current_shelter_id())
    AND (EXISTS ( SELECT 1
           FROM user_roles me
          WHERE ((me.user_id = ( SELECT auth.uid() AS uid)) AND (me.archived_at IS NULL)
                 AND (public.is_trusted_caller() OR me.shelter_id = public.current_shelter_id()))));
