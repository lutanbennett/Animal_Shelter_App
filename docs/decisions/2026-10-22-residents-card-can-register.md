# The residents card can register a resident (2026-10-22, migration 0248)

Found by the `cards-run-residents` walk (finding B): a login holding only the `residents` card filled in all
six intake steps and got "Something went wrong" (`P0001 Unassigned pseudo-enclosure not found`). The
seed data was fine; row-level security hid it.

## The cause was wider than the brief said

The brief named one gap (`zones`/`enclosures` need `facility.enclosures:read`, 0145). Probing `record_intake`
as the card-only login showed the same shape four more times: it is `security invoker`, so each insert runs
under the caller's own policies, and `resident_diets` needs `medical.diet`, `weight` needs `medical.weight`,
and `group_origins` needs admin. Fixing only the enclosure read would have moved the failure to the diet
insert (it did, in the probe). Adding all of those to the card's bundle would hand every card holder diet
editing, weight editing and the Enclosures browser, to fix one button.

## Choice: `record_intake` becomes `security definer`; the card's bundle does not change

- `record_intake` is `security definer`, `set search_path = public` (as `diet_types_mirror_recipe`, 0239), and its
  first statement refuses unless `has_permission('resident.register')`. Without that line a definer function would
  be callable by anyone signed in.
- **What a `resident.register` holder can now do that they could not before:** through this one function only,
  write the first diet row, first weight and optional new origin *for the resident they are registering in that
  call*. They cannot edit or read any other diet, weight or origin, and they gain no screen. They already could
  create the resident and its Intake placement (the RLS policies for those check `resident.register`).
- Anything granted `resident.register` (today: the `residents` card, Admin, Management, 2IC by way of it)
  gets exactly this. Nothing else widens.

## The Arrival step's zone list (and Move, edit, hospital return)

`loadEnclosureOptions` read `zones`/`enclosures` directly, so the same logins saw empty pickers. It now reads
two views, `picker_zones` and `picker_enclosures` (the `picker_diets` pattern, 0242): id, names, colour, order,
capacity; **no notes, no map shape**. Visible to anyone with `facility.enclosures:read`, `resident.register` or
`placement.move`. **What this widens:** a holder of the residents card can now read zone and enclosure names,
colours and capacities (not the Enclosures page, not notes). Callers who already read the tables see the same
rows as before. The Lifecycle pseudo-zone is excluded in the view, as the loader did.

## Other cards with the same shape

Not checked here by design (brief: file and stop). The pattern to look for: a card whose RPC is `security invoker`
and inserts into tables guarded by an activity the card lacks.

## Verified

Dev, as a `--cards residents` login (no `facility.enclosures`): `enclosures` direct count 0, `picker_zones` 17,
`picker_enclosures` 67, `record_intake` succeeds with an Intake placement written (rolled back); a login
without `resident.register` is refused with 42501. The browser walk with that login is deferred: it cannot
open a full resident page until `card-login-fix` merges.
