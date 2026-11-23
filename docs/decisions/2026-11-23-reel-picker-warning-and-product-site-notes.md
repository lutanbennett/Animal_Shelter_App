# Warn before the phone's picker; tag product-site release notes `admin: true` (2026-11-23)

## #rlprg: the delay is the phone's
Lutan, during the three-clip upload that proved `#rlbat`: *"it worked however it stayed on the photo library and looked like it was locked up until it finished all uploads"*; then *"the cameraroll doesnt close after i click add until they are uploaded so a status on the page wont help with that"*; and the clips were already finished when the sheet closed.
The picker's `onChange` (`ReelForm.tsx`) runs only after the OS sheet closes, and `clipProblem` reads `file.type`/`file.size` only. A web page cannot draw under an OS modal, so **no on-page spinner or status can help**; none was built. The fix is one hint line before the button (`pickerHint`, English and Thai), suggesting a few clips at a time (about five). Basis: only the 500 MB per-clip cap is a hard number; "about five" is a judgement, not a measurement, and should be revisited after Lutan tries it on his phone.
Not done: the per-clip row / banner position during upload (separate, lesser thing).

## #pnote: how a product-site note is tagged
No card governs the CooperJaidee product site (product administrators are not a shelter role), so none exists to name, and none was invented. Going forward a note about the product site is tagged `admin: true`: the nearest honest tag, and the mail to admins is unchanged (it is unfiltered by design). Untagged remains the default for everything shelter users use. `0.48.0`/`0.49.0` notes are shipped and left alone; `0.48.0`'s would have been better tagged.
