-- consumer: src/lib/assistant/audit.ts
--
-- ASSISTANT VERSION 2, stream 1 (docs/decisions/2026-10-30-assistant-v2-scoping.md): the audit row learns which model answered and
-- what was said. Both columns are nullable, so every version 1 row (keyword parser, no model) stays valid and unchanged.
--   model    text   the model id that produced the interpretation; null = version 1 keyword parser
--   exchange jsonb  the messages and tool calls of the turn; null until the model call exists (stream 3)
-- No enum change, no policy change (the 0070 policies are row-level and cover new columns). Re-runnable.

alter table assistant_actions add column if not exists model text;
alter table assistant_actions add column if not exists exchange jsonb;

comment on column assistant_actions.model is 'Model id that interpreted the request; null for the version 1 keyword parser.';
comment on column assistant_actions.exchange is 'Messages and tool calls of the turn (version 2); null for version 1 rows.';
