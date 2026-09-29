# 2026-09-25 — Anon loses the functions (0082)

`0082_anon_function_execute.sql` is the function half of `0081` ("Anon loses
the internal views"), and it closes more than the backlog item described.

- **What was reachable.** Every function in `public` was executable by anon
  through `/rest/v1/rpc/`, from two defaults at once: Postgres grants EXECUTE
  to PUBLIC on every new function, and Supabase's default privileges grant it
  to anon explicitly as well (the pair `0072` spells out for
  `cashflow_forecast`). With only the anon key on dev:
  `approved_translations` returned the approved Thai bio of four residents,
  three of which are not on the public site. It would equally have returned
  internal notes, maintenance text, captions or unpublished Shelter Friends
  text for any row id. `resident_is_deceased` and `attachment_resident_id`
  answered for any id.
- **The worse half: guards that let NULL through.** `record_attachment`,
  `set_resident_profile_photo`, `delete_resident_photo` and
  `record_deceased_archive` are `security definer` and open with
  `if current_user_role() not in (...) then raise`. For anon,
  `current_user_role()` is NULL, `NULL not in (...)` is NULL, and `if NULL`
  does not raise. As anon, in a rolled-back transaction on dev,
  `delete_resident_photo` deleted a public resident photo, whose attachment id
  anon can read from `public_resident_photos`. `record_attachment` added an
  attachment with a made-up Drive file id to a hidden resident and made it
  their profile photo, which `is_known_drive_file` then vouched for. The same
  hole was open to any **signed-in user without a role**, including an
  archived one, because `current_user_role()` filters out archived users.
  Revoking anon alone would have left that open, so the guards are now
  `current_user_role() is null or current_user_role() not in (...)`.
  `undo_deceased_placement` already used `is distinct from` and was safe.
  **Write any future role guard in a `security definer` function null-safe**
  (`is distinct from`, or `is null or … not in`). The trap is that the
  natural phrasing reads correctly and fails open.
- **Allow-list, as in 0081.** EXECUTE is revoked from PUBLIC and anon on every
  function in `public`, then anon gets back only what the public side calls.
  EXECUTE is checked as the caller even inside an owner-rights view, so
  "what the views call" counts. That leaves `shelter_date`, `shelter_today`
  and `shelter_time_zone` (date arithmetic for `public_recent_adoptions` and
  `public_shelter_stats`), `current_user_role` (the `to public` policies on
  the three `site_*` tables are evaluated for anon's SELECT, and it returns
  NULL for anon) and `is_known_drive_file` (the photo proxy). authenticated
  and service_role already held explicit grants on every function, checked
  in `pg_proc.proacl`, so removing PUBLIC took nothing from them.
- **`approved_translations` moved to a `private` schema rather than being
  restricted.** The Data API exposes only `public` and `graphql_public`, so
  the function can no longer be named through `/rpc/` (`PGRST202`, and
  `Content-Profile: private` gives `PGRST106`). The public views reference it
  by oid, so they followed it without being re-created, and anon keeps
  EXECUTE so they still work signed out. The alternative, "only public rows
  when the caller is anon", would restate each view's idea of "public"
  inside the function. For residents that would recurse, since the view
  calls the function. **A migration that re-creates a public view must now
  write `private.approved_translations(...)`.** An unqualified call fails
  with "function does not exist", which is at least loud.
- **`is_known_drive_file` stays anon-callable, unchanged.** It answers yes or
  no for a Drive file id, and the photo proxy's own 200/404 already tells
  anyone the same. Restricting the RPC without the route would hide nothing.
  The route itself serves *any* known file to a signed-out visitor who has
  its id, internal attachments included, and the edge cache is keyed by URL
  alone. That is a question about the proxy and went to the backlog.
- **The unused five-argument `record_attachment` overload is dropped.** `0020`
  added the six-argument version beside it instead of replacing it, and every
  caller passes `p_date_taken`.
- **New functions start closed.** `postgres`'s default privileges no longer
  give EXECUTE to PUBLIC (a global entry, since Postgres's built-in default
  can't be revoked per schema) or to anon in `public`. A new helper that a
  public view calls must grant anon itself. If it doesn't, the public view
  fails for anon and `check-public-views.mjs` goes red.
- **The check.** `scripts/check-public-views.mjs` now calls every function the
  schema root lists, as anon, with null arguments. The five allow-listed ones
  must answer. Every other one must be refused *as a function*, with 42501
  `permission denied for function <name>`. Before, most write RPCs "refused"
  anon only because a table inside them did, and the `security definer` ones
  did not refuse at all. On dev: 23 FAIL before `0082`, 0 after.
- **Enclosures On-site / Off-site filter, multi-zone chips, and where Lifecycle sits (2026-09-25):**
  `/enclosures` gains `?place=internal|external` (absent = Everywhere),
  read from `zones.internal` (0004), and `?zone=` becomes a comma list
  (`?place=internal&zone=<id>,<id>`). The zone chips stay links, now
  toggles: tapping one adds or removes it, and All zones empties the list,
  so every state is still a plain GET URL and back/bookmarks keep working.
  No zones picked means the place alone applies.
  **Lifecycle is neither place.** Its chip is offered only under
  Everywhere, and the Hospital / Unassigned / Fostered cards hide under
  On-site or Off-site, following the `?maint=open` precedent (2026-09-24).
  The alternative was to follow `zones.internal` for Lifecycle too, but
  that value was set by hand (0004's comment) and a hospital stay is not
  "on site" in the sense a keeper filtering by place means. Picking
  zones under Everywhere keeps today's behaviour: the cards show only if
  the Lifecycle chip is among them.
  **Stale zones are dropped silently, in two places.** Switching place
  keeps only the picked zones that belong to the new one — between
  On-site and Off-site that is none, so the result is the whole of the
  new place rather than an empty grid. The page also drops any `?zone=`
  id that is not on offer under the URL's place (a hand-edited or old
  link), for the same reason. Silent rather than a notice, because the
  dropped zones are not on screen under the new place to be confused
  about, and the chips show exactly what is applied. Vets see the control
  unchanged: zones are readable to every role, unlike `maintenance`.
  `/residents`' zone filter does not get the cascade in this PR; it is a
  backlog item.
