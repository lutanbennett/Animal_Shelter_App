# The one write that sets a shelter's website state (0436)

`#wbopn`'s brief planned no migration, but nothing could write `shelters.public_site`: the console's writes are all `security definer`
functions (0428) and none set it, and the browser has no direct write to `shelters`. So the control needs one function, and per CLAUDE.md
schema lands as its own small PR first.

- `product_admin_set_shelter_site(p_shelter, p_site)`: product administrator + aal2, `p_site` one of open/locked/off, same shape as
  `product_admin_set_shelter_archived`. Granted to authenticated and service_role.
- A shelter is already born locked: 0426's column default is `'locked'`. Not changed.
- The deployment floor (`PUBLIC_SITE`) still wins when more closed (`2026-11-20-public-site-per-shelter.md`). Not touched.
- Proof: `supabase/harness/product_admin_set_shelter_site.sql` (born locked, refused with no claims and at aal1, bad value rejected, round trip).
- The console control, runbook edit and end-to-end proof stay in the follow-up on `claude/shelter-website-unlock`; `#wbopn` and `#shrun` stay open.
