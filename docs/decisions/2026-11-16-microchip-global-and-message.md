# Microchip number stays unique across all shelters; the duplicate message names nothing (#s50n8)

Lutan, 2026-11-15, asked which key governs a chip: **"Across all shelters"**. `residents_microchip_number_key` (0113) is already global and is the named exception to the 19 per-shelter unique keys.

Because the match can now be in another shelter, the refusal must not name a shelter or an animal and no longer says "another resident": en and th `microchipDuplicate`, the vet form's `duplicate`, and the manual note now read "That microchip number is already recorded. Check the number."

Clause verdicts and the trigger reconciliation are in the PR body.
