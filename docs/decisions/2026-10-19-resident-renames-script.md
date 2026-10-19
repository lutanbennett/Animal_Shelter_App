# 2026-10-19 — Name, Thai name and enclosure corrections go through `scripts/fix-residents.mjs`

**Context.** A duplicate sweep flagged 40 resident pairs. The shelter's answers
produced two deletes (done with `correct-resident.mjs`) and 18 corrections that
are not deletes: 15 names or Thai names and 3 enclosures. Lutan wants a chat to
run them, with no manual step, and every chat to give the same answer.

**Decisions.**

1. **One script, not two.** A rename and a move are different underneath, but a
   correction round is one list the shelter answered. One file, one receipt and
   one all-or-nothing `begin…commit` is easier to review than two scripts that
   must agree. A row may carry `name`, `thai_name`, `enclosure`, or any mix.
2. **A move is the app's move.** `src/lib/placements/move.ts` is a single insert
   of a `ChangeEnclosure` row; the `placement_history_close_prior` trigger ends
   the old placement. The script does exactly that insert and never edits
   `placement_history`. It also keeps the app's refusals: not into the Lifecycle
   zone, not a deceased, hospitalised, fostered or adopted resident, nothing if
   it is already there. `record_intake` (the loader's path) is for new
   residents and does not apply to an existing one. One difference: the row has
   no `created_by`, as with the loader, because a script has no signed-in user;
   its note says "Corrected by scripts/fix-residents.mjs".
3. **Renames need no translation work.** `translatable_fields` lists only `bio`,
   `temperament_notes` and `past_story_notes` for residents (plus breed and
   colour labels, which are their own columns). `name` and `thai_name` are not
   translated text, so nothing in `translations` goes stale and
   `residents_drop_translations` (the delete case) is not involved.
4. **A name another resident has is refused**, judged on the final state of the
   file (so a swap in one file is fine, a clash with anyone else is not). Same
   reason as the loader's `existingNames`: two dogs with one name get mixed up
   on every list. If they are the same dog it is a duplicate to remove instead.
5. **Each row says what it expects to find (`was`).** The brief warned Lutan may
   have fixed some by hand. A row already at its target is skipped and said so;
   a row at neither value is refused with the actual value, so the file is
   corrected, not guessed past. A move to the wrong "was" place is the same.
6. **Production** needs `--env production`, `--apply` and `--confirm <number of
   residents in the file>`, on top of the `LIVE_REF` and `app-env.ts` check. The
   receipt (every row as it was, and the placement the move ended) is written to
   the Desktop before anything changes.

The 18 corrections are in `docs/corrections/2026-10-19-resident-renames.json`
(17 entries, since R-0006 is both renamed and placed).

**Not done here.** Not run on production: Lutan decides that after the merge.
Three of the shelter's answers are open questions in the PR (R-0439's Thai name,
R-0427's zone, and R-0388 not existing).
