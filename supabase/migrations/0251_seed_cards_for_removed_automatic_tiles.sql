-- consumer: src/lib/home/tiles.ts
--
-- The tiles the code used to add to a role's home by itself (landingTiles() and RULED_CARDS, removed in the same release) become
-- ordinary role_cards rows, so Who does what shows them and can take them away. Lutan ticked this list on 2026-10-23, read from dev:
--   Operations and Management: NOT carried over for any role (Lutan: "drop operations from every role... same with Management").
--   My tasks:  volunteer, head_of_maintenance, head_of_medical, management, second_in_command
--   View residents: head_of_maintenance, head_of_medical
--   Bills, Feed special diets, Add medical photos, Record weight: management; the last three also second_in_command
-- Cards are appended after the role's existing cards. A row is added only if the role exists, is not fixed, and does not hold the card.
-- It grants nothing new: each tile was drawn only when the role's cells already covered the card, and role_permissions is not touched.
--
-- To revert: delete from role_cards where card/role pairs above were added by this file. Re-runnable: on conflict do nothing.

insert into role_cards (role_id, card, position)
select r.id, w.card, coalesce((select max(position) from role_cards x where x.role_id = r.id), -1) + w.ord
from (values
  ('volunteer',           'my_tasks',           1),
  ('head_of_maintenance', 'view_residents',     1),
  ('head_of_maintenance', 'my_tasks',           2),
  ('head_of_medical',     'view_residents',     1),
  ('head_of_medical',     'my_tasks',           2),
  ('management',          'feed_special_diets', 1),
  ('management',          'add_medical_photos', 2),
  ('management',          'record_weight',      3),
  ('management',          'bills',              4),
  ('management',          'my_tasks',           5),
  ('second_in_command',   'feed_special_diets', 1),
  ('second_in_command',   'add_medical_photos', 2),
  ('second_in_command',   'record_weight',      3),
  ('second_in_command',   'my_tasks',           4)
) as w(role_key, card, ord)
join roles r on r.key = w.role_key and r.kind <> 'fixed' and r.archived_at is null
on conflict (role_id, card) do nothing;

notify pgrst, 'reload schema';
