# Phantom `0201` ledger row cleared for good; breed and colour registered as labels

One schema PR, two unrelated jobs, because only one migration may be in flight per batch. Separate commits.

## 0208: the ledger row

`0208_clear_phantom_ledger_row_0201_again.sql` deletes the `0201_map_rooms_drop_map_id_shape.sql` row from dev's
`schema_migrations`. `0203` did this once and was undone by an unguarded `--env test` run from an old worktree.
Both causes are now gone: the three old worktrees were cleared (no copy of the file exists anywhere), and #658's
guard makes `--env test` refuse a file absent from `origin/main` but present in the merge-base. A single deleting
migration therefore closes it. An applied file is never edited, so this is a new file, not a change to `0203`.

Proof, on dev: `--drift test` before listed the `0201` row; after applying, and again after a second apply, the
`0201` row is absent both times. The only "applied here, no file on origin/main" entries are `0208` and `0209`
themselves, which is the normal state of a schema PR before it merges and clears when it does. Production never had
the row and was not read or written.

## 0209: `residents.breed` / `colour` as labels

Widens `translatable_labels_label_group_check` to allow `residents`, inserts `breed`/`breed_th` and
`colour`/`colour_th` (group `residents`, `optional = true`: most breeds and colours need no Thai to be understood),
and adds the `residents_label_sources` trigger (the 0166 trigger loop only covers tables registered at the time it
ran, as `0175` also found for `map_rooms`). Existing Thai is snapshotted as written against today's English.

**No view change.** `breed_th` and `colour_th` are already in `public_resident_cards` and
`public_resident_profiles` from `0205`, and #657 already renders them; `translatable_labels` and `label_sources`
are staff-only tables read through `label_translations()` (translations.view / manage). `check-public-views.mjs`
stays green.
