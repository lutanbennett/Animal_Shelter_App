-- consumer: none
--
-- PI FAILOVER (B): write_requests, the record that makes a retried write safe.
-- docs/decisions/2026-10-31-write-requests-schema.md is the paper for this file; read it before (C).
--
-- WHY. The app runs on a Raspberry Pi behind a Cloudflare tunnel with a Worker in front. The 2026-10-28 drills
-- (docs/decisions/2026-10-02-pi-failover.md) measured the case this exists for: with the app wedged, 4 of 85 writes
-- hit the client's 30 s limit, were seen as failures, and LANDED ANYWAY once the app resumed. A thrown fetch cannot
-- tell "never arrived" from "arrived, then the answer was dropped", so replaying it on the Worker would record the
-- write twice (#250 did exactly that). Both the Pi and the Worker write to this same database, so the duplicate is
-- closed here rather than guessed at the edge -- after which retrying on the Worker is always safe.
--
-- THE INVARIANT, and nothing in this file may weaken it: every write carries a client-generated request id; the id is
-- recorded under a unique key IN THE SAME TRANSACTION as the write; a replay returns the first result instead of
-- writing again. The single transaction is what makes the record trustworthy -- a claim exists only if the write it
-- belongs to committed, and an aborted write leaves no claim to block the retry. THAT PART IS (C)'s DUTY: each write
-- must reach the database as ONE statement or RPC that calls claim_write_request() first, the write, then
-- finish_write_request(). Spread over two round trips the record degrades to best-effort and the invariant is lost.
--
--   claim_write_request(request_id, action) -> jsonb   {"status":"claimed"}   first time: do the write
--                                                      {"status":"replay", "result":…, "action":…}  return result
--                                                      {"status":"in_flight", "action":…}  claimed, never finished
--   finish_write_request(request_id, result)           records the first result; raises if there is no open claim
--
-- (a) THE UNIQUE KEY is the request id SCOPED TO THE LOGIN -- primary key (user_id, request_id) -- and user_id comes
--     from auth.uid() inside the functions, never from the caller. Two different logins that ever generate the same
--     uuid get two different rows, so a collision across logins can neither lose a legitimate write nor be used to
--     read back another login's result. A login colliding with ITSELF (two devices, same person) would dedupe a
--     second genuine write; with a v4 uuid that is negligible and generating one properly is (C)'s duty.
-- (b) IT STORES THE RESULT, not a row reference: result jsonb is the action's own serialised answer, so a replay can
--     return the first result verbatim without any per-table knowledge. completed_at tells a finished claim from an
--     open one, so "it happened" and "here is what it answered" are never confused.
-- (c) ROWS EXPIRE after 7 days, deleted daily by pg_cron inside the database -- the shape 0227_assistant_retention.sql
--     set for this question, so it needs no key, no deploy and nobody to remember it. A retry happens within seconds;
--     7 days is for reading back a failover incident afterwards, and it bounds the table at about a week of writes.
-- (d) NO CARD, DELIBERATELY. The table grants nothing: claiming an id does not let a login do anything it could not
--     already do, and the write itself is still gated by its own card. A card must apply the access that lets its
--     activity be performed, and there is no activity a person does here -- this is plumbing the app writes on every
--     save. Inventing a card for it would be the fault, not the fix. So: RLS on with NO policies, no table rights for
--     anon or authenticated at all, and the only door is the two functions below, each scoped to the caller and each
--     gated on holds_app_role() -- "is this login in the app", which since 0259 is itself card-derived (Admin, or a
--     role holding at least one cell). No role key, no role name, no column decides anything in this file.
--
-- Additive and re-runnable (create table if not exists / create or replace / cron.schedule replaces by name), and
-- harmless to code that does not know about it: nothing reads any of this on the day it lands. (C) will.

create table if not exists write_requests (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  request_id   uuid        not null,
  action       text        not null,
  result       jsonb,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, request_id)
);

-- The comment strings below carry no semicolon and no double dash. scripts/check-migration-grants.mjs splits a file on
-- semicolons and strips double-dash comments without tracking string literals, so either one inside a literal silently
-- swallows the next statement and its revoke is read as missing.
comment on table write_requests is
  'Pi failover (B). One row per write attempt, keyed (user_id, request_id), so a write retried on the Worker after a dropped answer returns the first result instead of writing again. Written only through claim_write_request and finish_write_request, in the same transaction as the write. Rows older than 7 days are purged daily.';
comment on column write_requests.request_id is 'Client-generated id for this write attempt. A retry of the same attempt carries the same id. Unique per login, never across logins.';
comment on column write_requests.action is 'Which write path claimed the id, for example residents.intake. Recorded for diagnosis and to catch a replay of the same id against a different action.';
comment on column write_requests.result is 'The action''s own serialised answer, returned verbatim to a replay. Null until the claim is finished.';
comment on column write_requests.completed_at is 'When the result was recorded. Null means the claim committed without a result, which must never be replayed as a success.';

create index if not exists write_requests_created_at_idx on write_requests (created_at);

-- The table is closed to logins: service_role for support reads, nothing for anon or authenticated. RLS is on with no
-- policies, so a direct read or write is refused however the grants later change. Not FORCEd: the two functions below
-- run as the owner and must be able to reach the rows.
alter table write_requests enable row level security;
revoke all on table write_requests from anon, authenticated;
grant select, insert, update, delete on table write_requests to service_role;

-- claim_write_request: the first attempt gets the slot, every later one is told what the first answered.
-- A duplicate arriving while the first attempt is still open blocks on the primary key and is released when that
-- transaction ends: if it committed we see its row and replay, if it aborted the row is gone and the insert succeeds.
-- That is the behaviour the invariant needs and it is why the key does the work rather than a read-then-write.
create or replace function claim_write_request(p_request_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user   uuid := (select auth.uid());
  v_action text;
  v_result jsonb;
  v_done   timestamptz;
begin
  if v_user is null then
    raise exception 'claim_write_request: no signed-in login' using errcode = '42501';
  end if;
  if not public.holds_app_role() then
    raise exception 'claim_write_request: this login is not in the app' using errcode = '42501';
  end if;
  if p_request_id is null or p_action is null or btrim(p_action) = '' then
    raise exception 'claim_write_request: a request id and an action are both required' using errcode = '22023';
  end if;

  insert into public.write_requests (user_id, request_id, action)
  values (v_user, p_request_id, p_action)
  on conflict (user_id, request_id) do nothing;

  if found then
    return jsonb_build_object('status', 'claimed');
  end if;

  select w.action, w.result, w.completed_at
    into v_action, v_result, v_done
    from public.write_requests w
   where w.user_id = v_user
     and w.request_id = p_request_id;

  -- The same id against a different write path is a caller fault, not a replay. Refusing it is the fail-closed answer:
  -- returning the other action's result would be worse than any duplicate.
  if v_action is distinct from p_action then
    raise exception 'claim_write_request: request id already used by action %, not %', v_action, p_action
      using errcode = '22023';
  end if;

  if v_done is null then
    return jsonb_build_object('status', 'in_flight', 'action', v_action);
  end if;

  return jsonb_build_object('status', 'replay', 'action', v_action, 'result', v_result);
end;
$$;

comment on function claim_write_request(uuid, text) is
  'Pi failover (B). Claims a client-generated request id for the signed-in login. Returns claimed (do the write), replay (return the stored first result) or in_flight (a claim that committed without a result, which must never be replayed as a success). Scoped to auth.uid(), so no login can reach another''s row.';
revoke all on function claim_write_request(uuid, text) from public, anon;
grant execute on function claim_write_request(uuid, text) to authenticated, service_role;

-- finish_write_request: records the first result. It raises when there is no OPEN claim for this login, because that
-- means the claim is not in this transaction and the invariant is already broken; aborting the write is the fail-closed
-- answer. A second finish of the same claim is a caller fault and is refused for the same reason.
create or replace function finish_write_request(p_request_id uuid, p_result jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'finish_write_request: no signed-in login' using errcode = '42501';
  end if;

  update public.write_requests
     set result = p_result,
         completed_at = now()
   where user_id = v_user
     and request_id = p_request_id
     and completed_at is null;

  if not found then
    raise exception 'finish_write_request: no open claim for this request id' using errcode = '42501';
  end if;
end;
$$;

comment on function finish_write_request(uuid, jsonb) is
  'Pi failover (B). Records the first result against an open claim for the signed-in login. Raises if there is no open claim, so a write whose claim is not in the same transaction fails closed rather than committing unrecorded.';
revoke all on function finish_write_request(uuid, jsonb) from public, anon;
grant execute on function finish_write_request(uuid, jsonb) to authenticated, service_role;

-- (c) Retention. The shape is 0227_assistant_retention.sql's: the delete runs inside the database, so it needs no key
-- and no deploy. It differs from 0227 in one way on purpose -- this function is SECURITY INVOKER. pg_cron runs it as
-- the role that scheduled it, which already owns the table, so definer rights buy nothing; and a definer function that
-- calls no card function would need a named exception in docs/hard-coded-security-registry.json that it does not need.
-- Less privilege and one fewer declared exception. No login can call it either way: execute is revoked from them all.
create extension if not exists pg_cron;

create or replace function purge_write_requests()
returns integer
language plpgsql
set search_path to ''
as $$
declare
  n integer;
begin
  delete from public.write_requests where created_at < now() - interval '7 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function purge_write_requests() is
  'Retention for write_requests. Rows older than 7 days go. A retry happens within seconds, so the week is for reading back a failover incident afterwards. Run daily by pg_cron, so it needs no key and no deploy.';
revoke all on function purge_write_requests() from public, anon, authenticated;

select cron.schedule('purge-write-requests', '29 3 * * *', 'select public.purge_write_requests()');
