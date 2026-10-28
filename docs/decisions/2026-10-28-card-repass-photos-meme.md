# Card re-pass: `add_photos`, `approve_photos`, `meme_library` (2026-10-28)

**Stream:** `claude/card-repass-photos-meme`. **What:** the 15 walkthrough steps of three cards driven again after `0276`, `0277`, `0278` and the #1032 app half (last driven 2026-10-25). Rows are in `docs/card-access-faults.md` under one new heading. Nothing was fixed and no card was proposed. These are the last three of the fourteen re-passes, so the backlog item is ticked.

**Step zero held:** all three were last driven 2026-10-25 by `claude/card-report-photos`, and four changes have landed on the photo cards since, so the pass was owed. Step counts by exact heading: 5 + 5 + 5.

**Result in one line each.**

- `add_photos`: the 2026-10-25 headline fault is **gone**. Tagging a photo to a resident now saves (Shelter folder, waiting for approval; proven by a service-key read). `/residents` is now empty ("0 residents") for this card, silently; cause **read, not proven**.
- `approve_photos`: the 2026-10-25 headline fault is **gone**. The plain Approve works (proven: `approved_by` is the approver), as do Set as profile photo and Remove. The Medical folder is hidden and **Move to folder is not offered**, so the walkthrough's Medical-to-Foster read-back cannot be driven for this card.
- `meme_library`: **unchanged and still not enough.** Add and Record a share work, but a meme still cannot be tagged to a resident ("No residents match."). Cause **read, not proven:** the three meme pages read `resident_list_view`, and 0268 gave the card the narrower `resident_who_and_where`.

**Contradicted earlier rows, both kept:** `add_photos` "does not save" and `approve_photos` "Approve fails" (2026-10-25); also its "controls offered that refuse" and "misleading menu" rows, which no longer describe what the pages offer.

**Medical:** the Medical folder did not appear for these cards on the photo pages, as `0276` and `0278` intend. Not driven: the uploader (it has no folder choice, only Shelter) and the Move control (not shown).

**Not re-driven, so the 2026-10-25 rows stand:** the public-site rows (Assign and approve publishing a profile picture to the public Adopt page; the `residents` Foster-folder bypass, already marked closed on 2026-10-26). They are not walkthrough steps. Assign and approve, Discard and Wrong animal? were not pressed, because they act on other streams' test photos.

**Found, not fixed, outside the walkthrough:** none that need a new item. The silent empty `/residents` for `add_photos` and the empty meme resident picker are the two things a decision-maker should look at; both are in the fault log.

**Environment, not card faults:** pages loaded by address paint only the layout until `requestAnimationFrame` fires (the pane, not the app).
