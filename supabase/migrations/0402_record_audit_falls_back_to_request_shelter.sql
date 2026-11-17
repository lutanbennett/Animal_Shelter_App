-- consumer: scripts/check-card-grants.mjs
--
-- Part 10 (#omt6u). record_audit() stamped audit_log.shelter_id only from the audited row. card_grants and card_includes are the
-- shared card catalogue and carry no shelter_id (decision 2026-11-17-per-shelter-roles), so an audited edit to either took a null
-- shelter and, since 0397, failed NOT NULL. It now falls back to the request's shelter header (current_shelter_id()). A row that
-- names its own shelter still wins; a header-less writer on a shelterless table still fails honestly. Otherwise as live.
-- Re-runnable (create or replace).
create or replace function public.record_audit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
  v_actor uuid;
  v_named text;
  v_skip text[] := coalesce(tg_argv, array[]::text[]);
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - v_skip;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new) - v_skip;
  end if;

  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  v_id := coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid,
                   (v_new ->> 'user_id')::uuid, (v_old ->> 'user_id')::uuid);

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row, shelter_id)
  values (tg_table_name, v_id, tg_op, v_actor, v_old, v_new,
          coalesce(nullif(coalesce(v_new ->> 'shelter_id', v_old ->> 'shelter_id'), '')::uuid, public.current_shelter_id()));

  return null;
end;
$function$;
