-- consumer: src/lib/translations/labels.ts
--
-- Fixes one thing in 0293: propose_label_th() accepted a row id that does not exist.
--
-- WHY A SECOND FILE AND NOT AN EDIT. 0293 had already been applied to dev when scripts/prove-label-drafts.mjs
-- found this, and an applied migration is never edited (CLAUDE.md) -- a database that has run the old text would
-- otherwise differ from the file for ever with nothing to say so. Both files are in the same PR and nothing has
-- been merged, so the honest record is this one, which also leaves the fault and its catch visible in git.
--
-- WHAT WAS WRONG. 0293 relied on FOUND after an EXECUTE ... INTO to tell a real row from a missing one. It does
-- not report that reliably, so a proposal against a row that does not exist returned true and wrote a draft. The
-- draft was harmless to readers -- label_translations() walks the real table and would never list it -- but it is
-- dead data, 0293's own comment claims the opposite, and the screen would report a save that referenced nothing.
--
-- THE FIX. Ask how many rows match, in so many words, before writing anything. Two statements instead of one,
-- which is the right trade for a contract the file states out loud. Nothing else about the function changes: it
-- still writes label_drafts and nothing else, and it still asks the same card as 0293.
--
-- Re-runnable (or replace), and nothing else in 0293 is touched.
--
-- The comment string below carries no semicolon and no double dash, for the reason 0293 and 0292 both give.

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
  -- The proposing grant. Today the same card as approving, deliberately and temporarily: see 0293's header.
  if not (select has_permission('translations.manage')) then
    raise exception 'translations.manage is required to propose a Thai label' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'not a translatable label: %.%', p_table, p_column using errcode = '22023';
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
  'Proposes a Thai label and leaves it waiting (0293, row check corrected in 0294). Writes label_drafts only, so the row''s live Thai is untouched and nothing the app shows changes. An empty text discards the draft, and a row id that does not exist returns false without writing. For translations.manage today, which is also the approving grant: splitting them needs an activity that does not exist yet and the decision file names it.';
revoke all on function propose_label_th(text, text, text, text) from public, anon;
grant execute on function propose_label_th(text, text, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
