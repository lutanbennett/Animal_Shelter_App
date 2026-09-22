-- The assistant's audit log (backlog, Assistant: "Assistant v1: grow the
-- keyword assistant into the production tool until an LLM takes over" —
-- its Audit clause, shared with the LLM item below it). Schema only: this
-- is the first half of the workstream, landing on its own so the feature
-- branch is built against a `main` that already has the table, per the
-- "Database migrations" rule in CLAUDE.md. No code reads or writes it yet.
--
-- One row per request typed at the assistant, written once, when the turn
-- settles — the person confirmed the preview card, cancelled it, or the
-- parser matched nothing at all. Two jobs:
--
--   1. Audit. The assistant runs the app's own server actions under the
--      caller's session, so every write it makes is already attributed
--      and already policed by RLS. What the row adds is the sentence that
--      caused it: the notes stamp (`via the assistant — "<request>"`)
--      says a request happened, this says what was asked and what the
--      parser understood by it.
--   2. The eval corpus for version 2. The LLM assistant will be measured
--      against these rows, so the request text is stored exactly as it
--      was typed — not trimmed, cased or otherwise tidied — and the rows
--      that interest us most are the ones with a null intent: the
--      sentences a keyword parser could not place are the test set the
--      model has to beat.
--
-- Deliberately immutable: insert and select only, below admin. An audit
-- row that its own subject can edit is not evidence, and an eval corpus
-- that drifts after the fact is not a measurement. A turn that settles
-- twice (a confirm retried after an error) is two rows, not an update.
--
-- Re-runnable like every file here: `if not exists`, a guarded `create
-- type`, and every policy dropped before it is created.

-- =========================================================================
-- 1. How the turn ended
--
-- An enum, as the other fixed vocabularies are (appointment_status,
-- translation_status). 'unmatched' is the parser miss — a status of its
-- own rather than something inferred from a null intent, because version
-- 2 will produce rows that did match an intent and still went nowhere.
-- =========================================================================

do $$ begin
  create type assistant_action_status as enum ('confirmed', 'cancelled', 'unmatched');
exception when duplicate_object then null; end $$;

-- =========================================================================
-- 2. assistant_actions
-- =========================================================================

create table if not exists assistant_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Who typed it. Defaulted rather than passed by the caller, so a row
  -- cannot be written in someone else's name even before the policies
  -- below refuse it. No cascade: losing an account must not erase what
  -- was asked.
  user_id uuid not null default auth.uid() references auth.users (id),
  -- Exactly as typed, in whichever language. See the corpus note above.
  request_text text not null,
  -- The parser that claimed the text ('move', 'vet', 'hospital',
  -- 'weight', ...) — free text, not an enum, because the set grows with
  -- every batch and a miss is a legitimate outcome. Null when nothing
  -- matched, which is the row worth reading.
  intent text,
  -- The Draft the parser produced, as the preview card received it
  -- (nulls included — what the sentence did not say is half the signal),
  -- and as the person edited it where they did.
  draft jsonb,
  status assistant_action_status not null,
  -- 'ok' when the underlying action succeeded, otherwise the error it
  -- returned, verbatim. Null when nothing ran (cancelled, unmatched).
  result text,
  -- The row the action wrote, where it wrote one: a placement, a weight,
  -- an appointment. `translations` (0056) addresses arbitrary rows the
  -- same way — a table name and an id — since one foreign key cannot
  -- point at six tables. Both null for the read-only lookups and for
  -- anything that did not run.
  result_table text,
  result_row_id uuid
);

comment on table assistant_actions is
  'One row per request typed at the assistant, written when the turn settles. The audit trail of what was asked, and the eval corpus the LLM assistant (v2) is measured against — request_text is stored exactly as typed.';

-- Reading is either "my history" (the panel) or "everything, newest
-- first" (the eval export and whatever review page follows it).
create index if not exists assistant_actions_created_at_idx
  on assistant_actions (created_at desc);
create index if not exists assistant_actions_user_created_idx
  on assistant_actions (user_id, created_at desc);
-- The misses, which is the query the corpus is built from.
create index if not exists assistant_actions_unmatched_idx
  on assistant_actions (created_at desc) where intent is null;

-- =========================================================================
-- 3. Row-level security
--
-- Everyone who can open the assistant writes their own rows and reads
-- them back; nobody below management sees anyone else's, because the
-- sentences people type are not a shared feed. Management reads all of
-- them — reviewing what the assistant is being asked belongs with the
-- rest of the Management section — and admin has the run of the table as
-- it does everywhere else.
--
-- That read-all is the one departure from "management = staff" (0039) on
-- this table, of the kind 0040 made on `vets`: management's twin is not
-- restricted to its own rows. Policy *counts* still match staff's — two
-- each — so 0039's mirror block still asserts true, but re-running that
-- block would overwrite management_read_assistant_actions with an
-- own-rows copy; re-run this file after it.
--
-- No vet policy: the vet role is external and does not get the assistant
-- (admin / management / staff write, volunteers get the read-only
-- lookups). If that changes it is a policy, not a schema change.
-- =========================================================================

alter table assistant_actions enable row level security;

drop policy if exists admin_all_assistant_actions on assistant_actions;
create policy admin_all_assistant_actions on assistant_actions
  for all using (current_user_role() = 'admin');

drop policy if exists staff_insert_assistant_actions on assistant_actions;
create policy staff_insert_assistant_actions on assistant_actions
  for insert with check (current_user_role() = 'staff' and user_id = auth.uid());

drop policy if exists staff_read_assistant_actions on assistant_actions;
create policy staff_read_assistant_actions on assistant_actions
  for select using (current_user_role() = 'staff' and user_id = auth.uid());

drop policy if exists management_insert_assistant_actions on assistant_actions;
create policy management_insert_assistant_actions on assistant_actions
  for insert with check (current_user_role() = 'management' and user_id = auth.uid());

drop policy if exists management_read_assistant_actions on assistant_actions;
create policy management_read_assistant_actions on assistant_actions
  for select using (current_user_role() = 'management');

drop policy if exists volunteer_insert_assistant_actions on assistant_actions;
create policy volunteer_insert_assistant_actions on assistant_actions
  for insert with check (current_user_role() = 'volunteer' and user_id = auth.uid());

drop policy if exists volunteer_read_assistant_actions on assistant_actions;
create policy volunteer_read_assistant_actions on assistant_actions
  for select using (current_user_role() = 'volunteer' and user_id = auth.uid());

notify pgrst, 'reload schema';
