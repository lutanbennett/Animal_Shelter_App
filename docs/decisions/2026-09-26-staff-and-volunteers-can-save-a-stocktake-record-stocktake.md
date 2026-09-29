# 2026-09-26 — Staff and volunteers can save a stocktake; `record_stocktake` is security definer (`0091`)

- **Who counts is wider than who edits.** The backlog item said "same roles
  as today's stock edit" (admin, management), and `0088` built exactly
  that. Lutan, starting the feature half: the stocktake "will be carried out
  by staff so staff and or volunteers will need access". Vets and public
  viewers are not included. The single stock cell on Management →
  Medications / → Diets stays management-only, as do those pages.
- **Definer function, not a wider UPDATE policy.** Staff and volunteers can
  read `medication` and `diet_types` but have no UPDATE policy, and an RLS
  policy cannot be limited to one column. Granting one would let them
  rename, reprice or change daily quantities too. So `record_stocktake`
  became security definer: it writes only `stock_on_hand` on the rows
  listed, and its opening role check (admin, management, staff, volunteer)
  is now the whole access rule, not a better message in front of RLS.
  `set search_path = public` is what keeps a definer function safe. The
  harness checks that staff still update neither table directly.
- **A second schema PR for one feature**, as with the standard diet: the
  feature brief said "add no migration", but the access change can only be
  made in the database, and the schema-first rule puts it in its own PR.
