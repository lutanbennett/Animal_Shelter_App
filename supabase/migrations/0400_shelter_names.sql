-- consumer: src/lib/shelter-settings.ts, src/app/layout.tsx, src/lib/status/alerts.ts, src/lib/merch/supplier-email.ts, src/lib/archive/archive-deceased-resident.ts, src/app/manual/pdf/route.ts
--
-- Tenancy Part 8, slice 2 (backlog #b4cmn): the name a shelter goes by on its pages, PDFs and mail lives on `shelters`.
-- display_name is the full name ("Lanna Care for Animals"); short_name is what mail senders and subjects use ("Lanna Care").
-- Lanna's two values are filled here because they are the same in every environment, so its output cannot change; a
-- second shelter has them set when it is created. The reader falls back to the same literals when a value is empty.
--
-- THIS FILE ADDS NO shelter_id TO ANY TABLE and creates no table. TO UNDO: alter table shelters drop column display_name, drop column short_name. Re-runnable.
alter table shelters add column if not exists display_name text;
alter table shelters add column if not exists short_name text;
update shelters set display_name = 'Lanna Care for Animals' where key = 'lanna' and display_name is null;
update shelters set short_name = 'Lanna Care' where key = 'lanna' and short_name is null;
