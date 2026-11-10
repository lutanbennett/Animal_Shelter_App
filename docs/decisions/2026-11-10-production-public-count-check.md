# 2026-11-10 — `appeal-override` asks the live rule; `not-listed-publicly` counts what 0347 took off the site (#v6r4m)

- `appeal-override` asked 0343's rule (`status <> 'draft'`), which 0347 retired. It now resolves running through
  `private.appeal_running()` AND `text_approval = 'public_ok'`, exactly as `public_appeals` does. With 0347 live it guards no
  decision any more, so it is a **reading and never fails** (`failed` is false). Nothing replaces the pre-release warning: the release it warned about has shipped.
- New check `not-listed-publicly` lists residents in an enclosure who are neither adoption-ready nor under a running,
  text-approved appeal. **Denominator:** an enclosure outside the Lifecycle zone, mirroring `public_enclosures`, the surface 0347 gated
  (`public_resident_cards` is unchanged by design). A resident with no enclosure never appeared there, so is not "taken off".
  It is a reading: `failed` is always false, because a count above zero is the intended design. Names print up to 40, then "...and N more".
- No view, function or migration touched. The production reading is the planner's.
