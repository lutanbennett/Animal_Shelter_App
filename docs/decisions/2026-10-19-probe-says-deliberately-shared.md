# The who-does-what probe says "deliberately shared"; acceptance rows corrected

2026-10-19, `claude/scripts-truth-fixes`. No migration. Lutan, same day: keep `stock_receipts_select_perm` asking
`stock.delivery` OR `stock.purchasing` ("yes fine to keep").

**One way to say "shared", used twice.** A probe in `scripts/lib/permission-probes.mjs` may carry
`sharedWith: [activity, ...]`. `check-who-does-what.mjs` gives such a probe a third run, with the box and every
sharer taken away. A box that is still allowed when only it is flipped, and refused once the sharers go too, is
**SHARED**: proved, not assumed. Used by `stock.delivery` read (shared with `stock.purchasing`) and the medication
insert under `reference.add_while_recording` (shared with `stock.medications` Edit).

**A standing entry was still the honest answer for the grid.** SHARED boxes must be listed in `FIXED_FOR_NOW`, so
`databaseWider` stays (now `stays: true`, `shown: false`) and its wording says "shared on purpose" instead of "looser
than on screen". It is in the grid's record section, not marked on boxes: nobody using the app can tell.
Measured on dev: STICKY 6 -> 3, SHARED 3 (management and 2IC `stock.delivery`, management
`reference.add_while_recording`); the other 3 sticky boxes are not this item's.

**Acceptance rows.** Checked against the code of main after #733-#738, not the 2026-10-18 list; the R numbers had
moved, so rows were matched by wording. Unpublish was left alone: #734 put the word on Management -> Shelter Friends.
Not click-tested in a browser (no role login this session): Manual verification is `pending`.
Seen and not touched (reported): row "Hand a date over", "Weigh the animals" for Management have no tile; the Home
tile set is `role-home-tiles-schema`'s.
