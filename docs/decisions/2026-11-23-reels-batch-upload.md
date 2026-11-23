# Upload several reels in one go (#rlbat)

**Asked by Lutan, 2026-11-22:** "can we upload multiple reels at the same time". **Metadata answer, 2026-11-23:** asked which of three
options he wanted for a batch's date, tags and description, he chose **"Blank, edit later"**.

- Picking two or more clips makes a batch. Each clip becomes its own reel with **today's date, no description and no tags**; the person edits
  each reel afterwards. One clip is the unchanged single form.
- **Serial, not parallel:** clips are up to 500 MB each, straight to Drive; several at once on a phone connection would stall each other. The
  screen says "Clip n of N".
- A failed clip is marked with its reason and the rest carry on; Save again retries only the clips not done.
- `/api/reels/start` and `/finish`, the size and type limits, the `social.reels` Edit gate and `canTag` are unchanged. No new card. Edit mode
  never sees the batch (the picker and list exist only when `mode === "new"`).
