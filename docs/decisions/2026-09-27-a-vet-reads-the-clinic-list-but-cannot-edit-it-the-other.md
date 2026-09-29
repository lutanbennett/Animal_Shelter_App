# 2026-09-27 — A vet reads the clinic list but cannot edit it; the other vet reads stay (`0105`)

- **Write closed, read kept.** `vet_rw_vets` (`0001`, `for all`) became
  `vet_read_vets` (`for select`). #182 had refused a vet on `/vets` and
  `/management`, but a vet's own access token against the Data API could
  still insert, rename or delete any clinic — the page guard and the RLS
  policy close different paths, as `0100` found for `user_roles`. Read stays
  because `/vet-visits/new` and `/vet-visits/[id]/edit` list clinics with
  the vet's session. Nothing in the app writes `vets` as a vet; every write
  is `src/app/management/vets/actions.ts`, behind `assertManagementRole()`.
- **Measured with a vet's JWT, not the service role** (which bypasses RLS
  and would pass either way). `scripts/check-vets-readonly.mjs`, in one
  rolled-back transaction on dev: before the file, the vet renamed another
  clinic (1 row) — so the refusals after it are the file's doing, not the
  harness missing RLS; after it, insert is refused and update/delete touch 0
  rows, the vet's own clinic (`user_roles.vet_id`) included; the vet still
  reads 7/7 clinics; management and admin still write; staff and volunteer
  still only read.
- **`vet_read_contacts`, `vet_read_enclosures`, `vet_read_zones` left open,
  deliberately.** Checked, not assumed: dropping any of them errors nowhere
  (RLS returns no rows rather than failing) but silently blanks data on
  pages a vet uses after #182. `resident_list_view` is `security_invoker`
  and left-joins `enclosures` and `zones` directly, so `/residents` would
  lose each resident's enclosure and zone column and its filters, the
  resident hub its housing card, and `/immunizations/new` its filters. The
  housing section embeds `enclosures` and `contacts` (carer), and the hub
  and adoption-updates section read carer and sender names from
  `contacts`. `resident_current_state` / `current_placement` run as their
  owner and are unaffected. So narrowing these reads — the resident-level
  scope item's call — first needs those names to reach a vet some other
  way: an owner-run source for `resident_list_view`'s place names, and the
  housing / adoption-update embeds reworked, or a policy that limits a vet
  to the contacts and enclosures of residents they may see.
