# Each clip row shows its own state during a batch upload (#rlprg)

Second half of a two-part problem. The first half, "the upload looks frozen", was the phone's own photo picker and was answered by the warning before the picker. This half is ours: during a batch, a clip row was silent and the only feedback was one banner below the description and date fields, off screen on a phone.

- **Rows now show state.** While a batch runs, each unsent clip shows `Waiting` (`f.clipWaiting`, new, English and Thai) or, for the one in flight, `Sending the video… N%` / the retry text (existing keys). Done rows still show `Done`; failures still show their reason.
- **Index mapping.** `sending.n` counts within `toSend` (clips not already done), so it is not a row index. `sending` now also carries `index`, the real position in `items`, and a row compares against that. On a retry `toSend` is shorter, and this keeps the right row lit.
- **Retry reset.** At the start of a run the unsent clips are reset to queued in state, so an earlier failure's error does not sit on a row that is now waiting.
- **Banner.** Removed for batches (the per-row state replaces it and is visible without scrolling). It stays for the single-clip path, which is unchanged; Edit is untouched. The "Clip n of N" wording is no longer shown; its key is left in the dictionaries.
- **Not proven:** no driven phone-viewport run and no real Drive upload were done in this change. The final clause of the item (Lutan saying it did not feel frozen) is his, on a phone, so #rlprg stays open.
