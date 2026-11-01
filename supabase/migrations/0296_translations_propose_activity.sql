-- consumer: src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/i18n/dictionaries/en.ts
--
-- PROPOSING A THAI LABEL IS NOT APPROVING ONE: translations.propose becomes its own activity, carried by its own
-- card, and propose_label_th() asks it. approve_label_th() and discard_label_draft() are NOT touched and keep
-- asking translations.manage, on purpose.
-- docs/decisions/2026-11-01-translations-propose-schema.md is the paper for this file, and it also answers the
-- open design question this item was scheduled to answer: how a caller with no signed-in session reaches a
-- card-derived grant.
--
-- WHY. 0293 built propose_label_th / approve_label_th / discard_label_draft and gated all three on
-- translations.manage, saying in its own header that proposing deserves a grant of its own and naming it. It did
-- not create it because an activity must exist in BOTH src/lib/permissions/catalogue.ts and permission_activities
-- or lint fails, and that stream was forbidden all of src/. Both halves land here, in one change.
--
-- WHAT THE SPLIT IS WORTH, in one sentence: the proposing path is for a session or the machine-translation
-- caller, the approving path is for a person who reads Thai, and until now one card gave both, so any caller
-- taught to draft Thai could also publish it unreviewed. After this file a holder of the new card can draft and
-- cannot publish, its own draft included.
--
-- THE GRANT SIDE, which is the part that needed thinking about rather than typing. has_permission() answers from
-- auth.uid(), so a caller holding only the service key has no uid and passes nothing. Measured on 2026-11-01
-- (docs/decisions/2026-11-01-label-thai-drafts-by-script.md): the service key gets 42501 from the function and
-- 42501 from a direct insert into label_drafts. NOTHING IN THIS FILE CHANGES THAT, and that is the answer, not
-- an omission: anything that let the service key through would grant an ability from something other than a
-- card, which CLAUDE.md forbids outright, and it would grant it blanket rather than per card. The shape that
-- works instead is a login: give the machine caller an ordinary auth user whose role holds the new card and let
-- it sign in, exactly as scripts/dev-signin.mjs and the --dev-login path of scripts/draft-label-thai.mjs
-- already do. The access then comes from the card and from nothing else, and taking the card away stops the
-- caller. The decision file sets out the reasoning and what is left for the app half.
--
-- WHAT THIS FILE DOES, and each omission is deliberate:
--   1  one row in permission_activities: translations.propose, yesno, management, sort 74. Sort 74 rather than a
--      number beside translations.manage at 47 and translations.view at 56, because
--      scripts/check-permission-catalogue.mjs compares each key's sort with the migration that seeded it, so
--      renumbering would put every later activity out of step with its own file.
--   2  the existing translations card gains the new activity. WITHOUT THIS the split would be a regression: every
--      holder of that card would press Save as a proposal and have the database refuse it, which is exactly the
--      half-working card 0295 was written to close.
--   3  a new card, propose_translations, holding translations.propose and translations.view and nothing else. It
--      is what makes the split real: a login can now hold proposing without holding approving. translations.view
--      comes with it because label_translations() is what lists the labels to propose against, and a card that
--      can propose blind is not a usable card.
--   4  one card_features row for the new card, copied from whatever feature the translations card is filed under,
--      so the new card is not left Not yet sorted on the features screen.
--   5  propose_label_th() recreated to ask translations.propose. Nothing else about it changes: it still writes
--      label_drafts and nothing else, it still returns false for a row id that does not exist (0294), and the
--      row's live Thai is still untouched.
--
-- WHAT THIS FILE DOES NOT DO:
--   - no role is given the new card. Who holds it is Lutan's answer on Settings then Who does what, and the card
--     question the backlog item carries is his. 0257's triggers recompute role_permissions as the union of a
--     role's cards, so the grant in step 2 reaches every holder of the translations card the moment this commits.
--   - nothing is granted to Admin, which sits outside the card system by his decision of 2026-10-25 and is never
--     given cards. Admin passes by is_admin() inside has_permission() exactly as before.
--   - approve_label_th() and discard_label_draft() are untouched. Rejecting a proposal is the reviewer's act.
--   - no policy changes. label_drafts is still select for translations.view or translations.manage at read, and
--     every write still goes through the three functions.
--   - no role key, no role name and no role column decides anything in this file.
--
-- Additive and re-runnable: on conflict do update throughout, and or replace for the function.
--
-- THE STRING LITERALS BELOW CARRY NO SEMICOLON AND NO DOUBLE DASH, on purpose.
-- scripts/check-migration-grants.mjs splits a file on semicolons and strips double-dash comments without
-- tracking string literals, so either one inside a literal silently swallows the next statement and makes its
-- revoke read as missing, which prints as what looks exactly like a real security exposure. 0292 to 0295 all
-- write their literals the same way for the same reason.

-- Snapshot for the report below, taken before anything can change a cell.
create temp table pre_0296 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1. The activity
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('translations.propose', 'yesno', 'management', 74)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

-- ---------------------------------------------------------------------------
-- 2 and 3. The cards. These rows must equal src/lib/permissions/cards.ts cell for cell:
-- scripts/check-card-grants.mjs fails when they differ.
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values ('translations', 'translations.propose', 2),
       ('propose_translations', 'translations.propose', 2),
       ('propose_translations', 'translations.view', 2)
on conflict (card, activity) do update set level = excluded.level;

-- ---------------------------------------------------------------------------
-- 4. The feature the new card is filed under: the translations card's, whatever it is.
-- ---------------------------------------------------------------------------
insert into card_features (card, feature_id)
select 'propose_translations', cf.feature_id from card_features cf where cf.card = 'translations'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- 5. The function, asking the new activity
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
    raise exception 'translations.propose is required to propose a Thai label' using errcode = '42501';
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
  'Proposes a Thai label and leaves it waiting (0293, row check corrected in 0294, grant split out in 0296). Writes label_drafts only, so the row''s live Thai is untouched and nothing the app shows changes. An empty text discards the draft, and a row id that does not exist returns false without writing. Asks translations.propose, which approve_label_th does NOT, so a proposing caller cannot publish its own draft.';
revoke all on function propose_label_th(text, text, text, text) from public, anon;
grant execute on function propose_label_th(text, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The record, and what this file must leave true, asserted rather than described
-- ---------------------------------------------------------------------------
do $report$
declare
  r         record;
  gained    text;
  lost      text;
  v_holders integer;
begin
  select count(*) into v_holders
    from public.role_cards rc join public.roles ro on ro.id = rc.role_id
   where rc.card = 'translations' and ro.kind <> 'fixed';
  raise notice '0296 the translations card is held by % role(s) that are not fixed', v_holders;
  raise notice '0296 no role is given the new propose_translations card here, which waits on Settings then Who does what';

  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(rp.activity || ':' || rp.level, ', ' order by rp.activity) into gained
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from pre_0296 p
                        where p.role_id = r.id and p.activity = rp.activity and p.level = rp.level);
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0296 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp
                        where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if gained is not null or lost is not null then
      raise notice '0296 % | now: % | no longer: %', r.key, coalesce(gained, '-'), coalesce(lost, '-');
    end if;
  end loop;

  if not exists (select 1 from public.permission_activities where key = 'translations.propose') then
    raise exception '0296 the activity is not in permission_activities after this file ran';
  end if;
  if not exists (select 1 from public.card_grants
                  where card = 'propose_translations' and activity = 'translations.propose' and level = 2) then
    raise exception '0296 the new card does not grant translations.propose after this file ran';
  end if;
  if exists (select 1 from public.card_grants
              where card = 'propose_translations' and activity = 'translations.manage') then
    raise exception '0296 the new card grants translations.manage, which is the one thing it must never grant';
  end if;
  if not exists (select 1 from public.card_grants
                  where card = 'translations' and activity = 'translations.propose' and level = 2) then
    raise exception '0296 the translations card did not gain translations.propose, so its holders cannot propose';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'propose_label_th'
                    and pg_get_functiondef(p.oid) like '%has_permission(''translations.propose'')%') then
    raise exception '0296 propose_label_th does not ask translations.propose after this file ran';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'approve_label_th'
                    and pg_get_functiondef(p.oid) like '%has_permission(''translations.manage'')%') then
    raise exception '0296 approve_label_th no longer asks translations.manage, which this file must not change';
  end if;
end
$report$;

notify pgrst, 'reload schema';
