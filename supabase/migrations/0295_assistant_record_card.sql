-- consumer: src/lib/permissions/cards.ts
--
-- THE ASSISTANT CARD RECORDS AGAIN: assistant.record goes back on the assistant card.
-- docs/decisions/2026-10-31-assistant-record-card.md is the paper for this file.
--
-- WHY. 0257_card_grants.sql:338-339 gave the assistant card both assistant.ask and assistant.record.
-- 0268_card_review_2_cards.sql:144 deleted the record grant, on the reasoning written at its own line 19:
-- that the activity "can do nothing alone". THAT WAS TRUE WHEN IT WAS WRITTEN -- the assistant answered
-- questions and wrote nothing at all. Six streams of assistant work later it writes ten kinds of thing
-- (move a resident, send to and return from hospital, record a death, a rehoming, a weight, an
-- immunization, a prescription, and the lookups around them), and every one of those writes is checked
-- against assistant.record in src/app/assistant/actions.ts. No card has granted it since, so every
-- assistant write is refused for every login except Admin, who passes by the perms.isAdmin short-circuit
-- that sits outside the card system. That is why #1129's browser drive had to be run as Admin, and why the
-- three tools it shipped are usable by nobody else today.
--
-- WHOSE DECISION. Lutan, asked directly on 2026-10-31: the grant goes back on the assistant card, restoring
-- 0257's pairing. It needs no new card and nothing for him to assign, so whoever can ask the assistant can
-- also let it write. The alternative weighed and NOT built was a second card for acting as against asking,
-- which would let a shelter hand out the question-answering without the writes. A later item may split it.
--
-- WHY IT IS A RULE AND NOT A PREFERENCE. CLAUDE.md: "there must be no state in which a card does nothing."
-- The assistant card as it stands grants the question and withholds the act, so it half-works: the app
-- offers the write, the person presses Confirm, and the database refuses the row. This file closes that.
--
-- WHAT THIS DOES: one row in card_grants. 0257's triggers recompute role_permissions as the union of a
-- role's cards' grants, so the grant reaches every role holding the card the moment this commits, however
-- that card was given. NOTHING ELSE CHANGES, and each of these is deliberate:
--   - no activity is created. src/lib/permissions/catalogue.ts:98 and permission_activities have both
--     declared assistant.record since 0132, which is why this is a grant and not a new activity.
--   - no policy is touched. 0150_perm_convert_settings.sql:83 and :85 (insert and select on
--     assistant_actions) and 0214_public_stories_and_refused_insert.sql:88-96 (which rewrote the insert so
--     an asker may still record a refusal) already read has_permission('assistant.record'), each alongside
--     user_id = auth.uid(). A card grants; the policy keeps a login to its own rows. Both still hold.
--   - no card is created, and no role is handed a card. Who holds the assistant card is Lutan's own step on
--     Settings -> Who does what and is not this file's business.
--   - nothing is granted to Admin, which sits outside the card system by his decision of 2026-10-25 and is
--     never given cards.
-- No role key, no role name and no role column decides anything here.
--
-- Re-runnable: on conflict (card, activity) do update. 0268's delete is a one-time statement in an applied
-- file and is never re-run, so re-running THIS file cannot be undone by it.
--
-- THE STRING LITERALS BELOW CARRY NO SEMICOLON AND NO DOUBLE DASH, on purpose.
-- scripts/check-migration-grants.mjs splits a file on semicolons and strips double-dash comments without
-- tracking string literals, so either one inside a literal silently swallows the next statement and makes
-- its revoke read as missing, which prints as what looks exactly like a real security exposure. 0292, 0293
-- and 0294 all write their literals the same way for the same reason. Fixing the script is a filed backlog
-- item and a later stream, not this file's business.

-- Snapshot for the report below, taken before the grant can change a cell.
create temp table pre_0295 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- The grant
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level)
values ('assistant', 'assistant.record', 2)
on conflict (card, activity) do update set level = excluded.level;

-- ---------------------------------------------------------------------------
-- The record: which roles gained the cell, by the same shape as 0257 and 0268
-- ---------------------------------------------------------------------------
do $report$
declare
  r       record;
  gained  text;
  lost    text;
  v_holders integer;
begin
  select count(*) into v_holders
    from public.role_cards rc join public.roles ro on ro.id = rc.role_id
   where rc.card = 'assistant' and ro.kind <> 'fixed';
  raise notice '0295 the assistant card is held by % role(s) that are not fixed', v_holders;
  if v_holders = 0 then
    raise notice '0295 no role holds the assistant card yet, so no cell moves today and the grant waits on Settings -> Who does what';
  end if;

  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(rp.activity || ':' || rp.level, ', ' order by rp.activity) into gained
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from pre_0295 p
                        where p.role_id = r.id and p.activity = rp.activity and p.level = rp.level);
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0295 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp
                        where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if gained is not null or lost is not null then
      raise notice '0295 % | now: % | no longer: %', r.key, coalesce(gained, '-'), coalesce(lost, '-');
    end if;
  end loop;

  -- The one thing this file must leave true, asserted rather than described.
  if not exists (select 1 from public.card_grants
                  where card = 'assistant' and activity = 'assistant.record' and level = 2) then
    raise exception '0295 the grant is not in card_grants after this file ran';
  end if;
end
$report$;
