-- consumer: none
--
-- Audit trigger on facility_maps, so adding, replacing or undoing a plan reaches audit_log like every other audited
-- table (backlog, "Audit trigger on facility_maps"; from facility-map-upload, #465, 2026-10-08). That stream kept
-- who-and-when in each plan's own history file in storage only because this table had no trigger
-- (docs/decisions/2026-10-08-facility-map-plans-uploaded.md, "Who replaced it"). The history file stays: it is what
-- the page's Undo reads. Nothing in the app reads audit_log by table name for this table, hence `consumer: none`.
--
-- record_audit() (0121) is unchanged and fits as is: it needs a uuid `id` column (facility_maps.id, 0142), and the
-- app writes plans with the signed-in admin's own client (src/app/admin/facility-map/actions.ts), so auth.uid() is
-- the actor. No column is left out: a plan row is kind, zone, picture path and size, nothing sensitive.
--
-- After, not before: the existing BEFORE trigger facility_maps_refuse_lifecycle_map (0142, body 0164) can still
-- refuse the write, and a refused write must leave no audit row.

drop trigger if exists audit_facility_maps on facility_maps;
create trigger audit_facility_maps
  after insert or update or delete on facility_maps
  for each row execute function record_audit();
