-- consumer: src/app/admin/shop/actions.ts, src/app/management/shelter-friends/actions.ts
--
-- WHY: text_approval_stamp() (0346) refuses an INSERT that names an approval state unless the login holds text.approve. shop_links and
-- shelter_friends still defaulted that column to 'public_ok' (0343, kept by 0346 because nothing reads it), so a plain insert that does
-- not mention the column was read by the guard as "naming a state". A login holding shop.manage or friends.manage WITHOUT text.approve
-- could therefore not add a shop link or a Shelter Friend: P0001 "You do not have permission to approve public text". Found by
-- check-who-does-what.mjs's shop.manage edit probe (2026-11-14, #t4wqp): six non-Admin logins refused as they stood.
-- THE FIX: default NULL on both tables, as 0346 did for the six that carry public text. Nothing reads the column on these two
-- (public_shop_links and public_shelter_friends do not select it), so no row changes visibility; existing rows keep their value.
-- Additive and re-runnable. To undo: set both defaults back to 'public_ok'.
alter table shop_links alter column text_approval set default null;
alter table shelter_friends alter column text_approval set default null;
