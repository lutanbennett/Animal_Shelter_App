-- consumer: none
-- Retire the facility.map activity (0132). /enclosures stopped asking it when the map became a view of the
-- enclosures (claude/facility-map-with-enclosures); whoever may read facility.enclosures sees the map.
-- Dev check before writing this: every role holding facility.map also held facility.enclosures at Read.
-- Re-runnable: each statement is a no-op once the rows are gone.
delete from role_extras where activity = 'facility.map';
delete from role_permissions where activity = 'facility.map';
delete from permission_activities where key = 'facility.map';
