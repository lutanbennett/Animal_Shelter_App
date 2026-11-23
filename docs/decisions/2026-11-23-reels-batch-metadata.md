# Reels batch: describe each clip in a list after the upload (#rlbat, second stream)

**Lutan was asked the same question twice on 2026-11-23 and gave two different answers.** The planner asked with four options and he chose
**"Per clip after upload"**. #1846's own session then asked with three options and he chose **"Blank, edit later"**, which shipped. Shown the
difference afterwards, he said: **"Add the list"**. The settled answer is the per-clip list. That he was asked twice is the part worth keeping.

- After the serial upload, a row appears for each clip that uploaded: a description (`TagNoteField`, `#` tags gated on `canTag`, default closed)
  and a date taken. `ClipItem` now keeps the `reelId` that `uploadReelVideo` returns, which the batch used to throw away.
- **Save reuses `updateReel`** (one call per row, same write-request path as Edit). It already validates and links the tags, so no second save path.
- **An untouched row is skipped**: a reel with today's date and no description is exactly what shipped before, so blank is harmless.
- **A failed clip is not a row.** It stays in the failure list with its reason and retry. Rows exist only for clips that have a reel.
- **Leaving with rows unfilled (deliverable 5): the reels simply stand as they are**, as before. A hint says so. No warning and no draft saving.
- Redirect to /reels now happens after saving the rows, not straight after the last upload.
- The upload half (picker, `clipProblem`, serial loop, retry, "Clip n of N") is untouched. Edit mode and the single-clip form are unchanged.
