-- consumer: src/app/management/translations/actions.ts, src/lib/db-refusal.ts
--
-- THE FIRST GROUP OF #3nuwy: database refusals raise a stable KEY, and the app finds the words in Thai or English.
--
-- Shape 1 of docs/decisions/2026-11-03-sql-refusal-english-count.md, built here for the first time. The message of each
-- `raise exception` is now a key (`label.not_translatable`), and anything the sentence used to carry in a `%` travels as a
-- JSON object in DETAIL (`{"table":"diets","column":"name"}`). PostgREST hands both back to supabase-js as error.message and
-- error.details; src/lib/db-refusal.ts looks the key up in the dictionaries' `refusals` block and fills the parameters in.
-- A key the app does not know falls back to "something went wrong + reference", so a missed key is safe.
-- docs/decisions/2026-11-08-db-refusal-keys-mechanism.md says why this shape and what the next groups cost.
--
-- The four functions called from src/app/management/translations/actions.ts. Each is its latest definition exactly
-- (set_label_th 0166, approve_label_th and discard_label_draft 0293, propose_label_th 0296) with ONLY the raise lines
-- changed: same arguments, same grant asked, same SQLSTATE (42501 for a missing grant, 22023 for a bad argument), same
-- return values. So nothing a caller tests on (error.code, a false return) changes.
--
-- propose_label_th also has a Worker caller (worker/translations.mjs). It never reads the message: on any refusal it throws
-- `supabase rpc propose_label_th → <status>` and logs that. So a key cannot reach a person by that road, and it is in this
-- group. Re-runnable: every statement is `create or replace` or a restated grant.

-- ---------------------------------------------------------------------------
-- set_label_th (from 0166)
-- ---------------------------------------------------------------------------
create or replace function set_label_th(p_table text, p_row_id text, p_column text, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'label.translate_not_allowed' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'label.not_translatable' using errcode = '22023',
      detail = json_build_object('table', p_table, 'column', p_column)::text;
  end if;

  execute format('update %I set %I = $1 where id::text = $2', p_table, v_th_column)
    using nullif(btrim(p_text), ''), p_row_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

comment on function set_label_th(text, text, text, text) is
  'Sets one Thai label registered in translatable_labels (0166). For translations.manage; translating a label is not editing its list. Refuses with a key (0339), worded by the app.';
revoke all on function set_label_th(text, text, text, text) from public, anon;
grant execute on function set_label_th(text, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- propose_label_th (from 0296)
-- ---------------------------------------------------------------------------
create or replace function propose_label_th(p_table text, p_row_id text, p_column text, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_text text;
  v_english text;
  v_rows bigint;
begin
  -- The proposing grant, its own since 0296. Approving is translations.manage and stays there.
  if not (select has_permission('translations.propose')) then
    raise exception 'label.propose_not_allowed' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'label.not_translatable' using errcode = '22023',
      detail = json_build_object('table', p_table, 'column', p_column)::text;
  end if;

  v_text := nullif(btrim(p_text), '');
  if v_text is null then
    delete from label_drafts
     where table_name = p_table and row_id = p_row_id and column_name = p_column;
    return true;
  end if;

  execute format('select count(*) from %I x where x.id::text = $1', p_table)
    into v_rows using p_row_id;
  if v_rows = 0 then
    return false;
  end if;

  execute format('select x.%I::text from %I x where x.id::text = $1', p_column, p_table)
    into v_english using p_row_id;

  insert into label_drafts (table_name, row_id, column_name, text_th, source_text, proposed_by, proposed_at)
  values (p_table, p_row_id, p_column, v_text, v_english, (select auth.uid()), now())
  on conflict (table_name, row_id, column_name) do update
    set text_th = excluded.text_th,
        source_text = excluded.source_text,
        proposed_by = excluded.proposed_by,
        proposed_at = excluded.proposed_at;
  return true;
end;
$$;

comment on function propose_label_th(text, text, text, text) is
  'Proposes a Thai label and leaves it waiting (0293, row check corrected in 0294, grant split out in 0296, refusals keyed in 0339). Writes label_drafts only, so the row''s live Thai is untouched and nothing the app shows changes. An empty text discards the draft, and a row id that does not exist returns false without writing. Asks translations.propose, which approve_label_th does NOT, so a proposing caller cannot publish its own draft.';
revoke all on function propose_label_th(text, text, text, text) from public, anon;
grant execute on function propose_label_th(text, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- approve_label_th (from 0293)
-- ---------------------------------------------------------------------------
create or replace function approve_label_th(p_table text, p_row_id text, p_column text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_text text;
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'label.approve_not_allowed' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'label.not_translatable' using errcode = '22023',
      detail = json_build_object('table', p_table, 'column', p_column)::text;
  end if;

  select d.text_th into v_text
    from label_drafts d
   where d.table_name = p_table and d.row_id = p_row_id and d.column_name = p_column;
  if v_text is null then
    raise exception 'label.no_proposal_waiting' using errcode = '22023',
      detail = json_build_object('table', p_table, 'column', p_column, 'row', p_row_id)::text;
  end if;

  execute format('update %I set %I = $1 where id::text = $2', p_table, v_th_column)
    using v_text, p_row_id;
  get diagnostics v_count = row_count;

  delete from label_drafts
   where table_name = p_table and row_id = p_row_id and column_name = p_column;
  return v_count > 0;
end;
$$;

comment on function approve_label_th(text, text, text) is
  'Publishes the proposed Thai onto the row and clears the draft (0293, refusals keyed in 0339). The text comes from label_drafts, never from an argument, so what is published is what was reviewed. For translations.manage, as set_label_th is.';
revoke all on function approve_label_th(text, text, text) from public, anon;
grant execute on function approve_label_th(text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- discard_label_draft (from 0293)
-- ---------------------------------------------------------------------------
create or replace function discard_label_draft(p_table text, p_row_id text, p_column text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'label.discard_not_allowed' using errcode = '42501';
  end if;

  delete from label_drafts
   where table_name = p_table and row_id = p_row_id and column_name = p_column;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

comment on function discard_label_draft(text, text, text) is
  'Throws away a proposed Thai label (0293, refusal keyed in 0339). The row is untouched. False means there was nothing waiting. For translations.manage, the same grant as approving, because rejecting a proposal is the reviewer''s act.';
revoke all on function discard_label_draft(text, text, text) from public, anon;
grant execute on function discard_label_draft(text, text, text) to authenticated, service_role;
