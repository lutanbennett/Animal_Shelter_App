-- consumer: src/app/admin/facility-map/actions.ts, src/lib/facility-map/rooms.ts
--
-- map_rooms writes ask what the caller may do, not who they are. 0157 created management_rw_map_rooms
-- as current_user_role() in ('admin', 'management'), the old enum pattern. Same cell as facility_maps
-- (0150): facility.enclosures Edit, because a room on the plan and the plan itself are edited on the
-- same Settings page, whose server actions already check that cell. Reads stay open (map_rooms_read).
-- Known tightening, as for facility_maps: management holds facility.enclosures Read only, so it loses
-- the write by hand that the page never gave it.
drop policy if exists management_rw_map_rooms on map_rooms;
drop policy if exists map_rooms_insert_perm on map_rooms;
drop policy if exists map_rooms_update_perm on map_rooms;
drop policy if exists map_rooms_delete_perm on map_rooms;
create policy map_rooms_insert_perm on map_rooms for insert to authenticated
  with check ((select has_permission('facility.enclosures')));
create policy map_rooms_update_perm on map_rooms for update to authenticated
  using ((select has_permission('facility.enclosures')))
  with check ((select has_permission('facility.enclosures')));
create policy map_rooms_delete_perm on map_rooms for delete to authenticated
  using ((select has_permission('facility.enclosures')));
