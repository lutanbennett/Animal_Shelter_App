-- consumer: none (src/app/prescriptions/actions.ts stopped writing frequency_id in #1098; /admin/frequencies is deleted in the same PR)
--
-- PRESCRIPTIONS BECOME A RECURRING SCHEDULE, stream 4 of 4: the removal. The schedule columns (0283) are the truth and 0284 moved the forecast
-- functions onto them, so nothing reads prescriptions.frequency_id any more. This drops it, and everything that only existed to serve it.
--
-- RELEASE ORDER: apply this with the app code that stops reading these columns, migrations first. Old app code against this schema breaks the
-- medication list. Production is six migrations behind (0282-0288).
--
-- Dependencies were read from the live database, not from the migration files (a function body is invisible to a src/ search). Drop order:
--   1. triggers on prescriptions and frequency that call the default-rounds functions
--   2. functions: prescription_rounds_default_trigger, reset_prescription_rounds, frequency_rounds_default_trigger, reset_frequency_rounds,
--      merge_frequency (rewrites prescriptions.frequency_id), default_frequency_round_keys
--   3. views prescription_round_status and frequency_round_status
--   4. table frequency_rounds
--   5. column prescriptions.frequency_id (and its foreign key)
-- The frequency table itself STAYS: it is the history of the older schedules, and its label-source trigger is untouched.
-- Re-runnable.

drop trigger if exists prescriptions_default_rounds on prescriptions;
drop trigger if exists prescriptions_default_rounds_on_change on prescriptions;
drop trigger if exists frequency_default_rounds on frequency;
drop trigger if exists frequency_default_rounds_on_change on frequency;

drop function if exists prescription_rounds_default_trigger();
drop function if exists reset_prescription_rounds(uuid);
drop function if exists frequency_rounds_default_trigger();
drop function if exists reset_frequency_rounds(uuid);
drop function if exists merge_frequency(uuid, uuid);

drop view if exists prescription_round_status;
drop view if exists frequency_round_status;

drop table if exists frequency_rounds;
drop function if exists default_frequency_round_keys(integer, integer);

alter table prescriptions drop column if exists frequency_id;
