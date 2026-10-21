-- consumer: src/lib/clinics/calendar-sync.ts, src/app/clinic-visits/, src/app/admin/status/, worker/
--
-- Follow-up to 0232 (two-way calendar schema). Nothing reads these yet. Additive and re-runnable.
--
-- 1. clinic_visits.cancel_reason: no cancel reason existed (status is the enum 'cancelled'; archive_reason
--    belongs to archiving, 0124). A visit cancelled from Google Calendar gets 'Cancelled from Google Calendar'.
-- 2. clinic_visits.calendar_changed_at / calendar_change_kind: when, and how ('moved' | 'cancelled'), the
--    calendar last changed this visit. Answers "changed from the calendar in the last week" with one filter.
--    Neither is in the dirty trigger's list (0207), so writing them does not re-mark the visit.
-- 3. The audit label "via Google Calendar" needs no change to audit_log or record_audit(): every audit row
--    carries the full before/after image, so a row whose new_row.calendar_changed_at differs from
--    old_row.calendar_changed_at was made via Google Calendar (actor is null: the Worker is the service role).
--    No enum value is added, so one file is enough.

alter table clinic_visits add column if not exists cancel_reason text;
alter table clinic_visits add column if not exists calendar_changed_at timestamptz;
alter table clinic_visits add column if not exists calendar_change_kind text;

alter table clinic_visits drop constraint if exists clinic_visits_calendar_change_kind_known;
alter table clinic_visits add constraint clinic_visits_calendar_change_kind_known
  check (calendar_change_kind is null or calendar_change_kind in ('moved', 'cancelled'));

create index if not exists clinic_visits_calendar_changed_idx
  on clinic_visits (calendar_changed_at desc) where calendar_changed_at is not null;

comment on column public.clinic_visits.cancel_reason is
  'Why the visit was cancelled; ''Cancelled from Google Calendar'' when the poll cancelled it. Null otherwise (0236).';
comment on column public.clinic_visits.calendar_changed_at is
  'When the calendar poll last moved or cancelled this visit; null if never. Drives the changed-from-calendar list (0236).';
comment on column public.clinic_visits.calendar_change_kind is
  '''moved'' or ''cancelled'': what the calendar poll did at calendar_changed_at (0236).';
