# Card review 1, the last two items (migration 0267)

**Lutan, 2026-10-26:** *"Yes fix the my job link."* These are the two items the app half
(`2026-10-26-card-review-1-app-half.md`, "NOT built") left because they need a migration. Cards only; Admin is given nothing.

1. **My tasks for Record weight and Feed special diets.** `recurring.do_own` at level 2 in `card_grants` for both cards, mirrored in the
   `JOBS` bundles in `src/lib/permissions/jobs.ts` (`check-card-grants.mjs` compares the two). The `card_grants_recompute` trigger
   (0257) hands the cell to every role holding either card in the same transaction, so no role needs a separate insert.
2. **A Medical-folder upload is never the profile picture.** `record_attachment()` (latest definition 0259) set the profile photo to the
   first approved upload when none existed, whatever its folder. It now skips that branch when `sub_folder` is `medical`. The profile
   picture is public-facing and a Medical photo is clinical. Admin changes the profile picture through its own action, which does not go
   through this function, so Admin is unaffected and the function gained no role test.

Not changed: the `photos.shelter_add` Medical-folder rule, approval, or who may upload. A Medical photo is still recorded; it just never
fills the empty profile slot.
