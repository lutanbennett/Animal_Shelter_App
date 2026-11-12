# Control press, group D: seven table rows pressed, 13 of 25 (`#79sqf`)

**Date:** 2026-11-12. Branch `claude/control-press-group-d`, port 3005, no migration, no code changed.

## Result

**driven: 13 of 25** (the 6 of #1517, plus the 7 table rows below: `AdoptionUpdateForm:236`, `ArchiveRecordControl` :64 and :72, `MicrochipForm:63`, `PhotoGallery:781`, `TranslationPanel:179`, and the `ConfirmDialog` clear-translation press). Every press was a click in the browser pane as a login holding exactly one card (`dev-signin.mjs --cards <key> --port 3005`), reached by clicking through. No fault found, no code changed.

## Per-row table

| # | Control | Card held (press) | Press | Without the card (login) | Absent? |
|---|---|---|---|---|---|
| 2 | `AdoptionUpdateForm` (`resident.adoption_news`) | `residents` | Save update on Fixture l5gxn: "The update is saved." | `medical_records`: form replaced by "You can't add or change adoption updates: it needs the permission News from an adopter" | **yes** (page read from the server) |
| 3a | `ArchiveRecordControl:72` archive (`medical.archive`) | `medical_records` | Remove on Test 1's deworming record, reason box, Remove: record left the list, "1 removed hidden" | `residents`: the whole immunizations page redirects away (NEXT_REDIRECT), no control | **yes** |
| 3b | `ArchiveRecordControl:64` restore | `medical_records` | Show removed, Restore: record back in the list | same | **yes** |
| 5 | `MicrochipForm:63` (`resident.microchip`) | `record_microchip` | Record chip, number + date, Save chip: hub shows the number, "implanted 12 Nov 2026", and a Correct button | `medical_records`: no Record chip, no Correct (chip number still readable) | **yes** |
| 6a | `PhotoGallery:781` Remove photo (`photos.resident_manage`) | `residents` | Remove photo, Confirm remove on Test 2's only photo: "No photos yet" | `view_residents`: server passes `canManage:false` to the gallery (`residents` gets `true`) and the lightbox draws the controls only when it is true | **yes**, read from the page's props and the component, not from opening a lightbox |
| 7a | `TranslationPanel:179` Save & approve (`translations.manage`) | `translations` | On `/management/translations?show=all`: the button disables while the action runs, then the editor closes with no error shown | `propose_translations` and `view_translations`: no Save & approve (0 of 0); `propose_translations` still gets Propose (854), `view_translations` none | **yes** |
| 7b | `ConfirmDialog` clearTranslation | `translations` | Remove translation opens "Remove this translation?", confirm button disables during the action, dialog closes, no error | same two logins: 0 Remove translation controls | **yes** |

## Step zero

- `node scripts/check-control-activity.mjs`: **4 findings, all 4 on the allow-list, 0 new** (49 s).
- No earlier decision file or commit named group D; the gap is still there.

## What was done

- Dev server started on 3005. `dev-signin.mjs --cards recurring_jobs --port 3005` worked and the cookie
  snippet signed the pane in (header shows the disposable login). `/my` loaded by address shows only
  the layout, as `CLAUDE.md` warns, so the page must be reached by clicking through.
- **Row 1 (`MyTaskList`), traced, NOT pressed.** `src/app/my/MyTaskList.tsx:290-300` draws the undo
  (take-back) button for every recurring row unconditionally (`item.kind === "recurring" || canEditMaintenance`);
  only maintenance rows are gated, on `maintenance.progress`. The action asks `recurring.do_any` / `recurring.do_own`.
  This agrees with #1508's allow-list row. Pressing it needs a recurring job done today by the login, a fixture not built.
- **Row 10 (`UndoDeathForm`), read.** The page (`undo/page.tsx:83`), the action (`actions.ts:171`) and the RPC
  (`undo_deceased_placement`, `0359`) all ask `placement.death_withdraw`, and `cards.ts:121` records that no card
  carries it. Admin only by design still holds. No card should be invented for it.

## Left: 12 rows

- **Row 1 `MyTaskList:221`**: needs a recurring job done today by the test login; no fixture built. Still only the trace above.
- **Row 4 `BloodTestList:121`**: the form is for a *closed* (deceased) resident's blood test, so it needs a resident with a blood test who has then had death recorded. Not built.
- **Row 6b `PhotoGallery:812` Set as profile photo**: not pressed. The only photo was already the profile, so the button was disabled ("Current profile photo"); needs a second photo, which means a Drive upload.
- Row 8 (assistant record death): not reached; dev has no language model, so it needs `dev-assistant-model.mjs --dev` first.
- Row 9 (the five `BillsInbox` rows) and row 11 (the three fixture gaps): not reached. Row 10 was read only.

## Notes for the next session

- **A shell check can sign the pane out.** `dev-signin.mjs` for the same card set and port re-keys that login, so running it from the shell (curl checks) invalidated the pane's session mid-press and produced a Next error "An unexpected response was received from the server" on Save & approve. That was my doing, not an app fault: use `--label shell` for shell checks. I restarted the dev server and signed in again before pressing.
- The translations queue shows nothing pressable on its default "Missing" tab; the editors are on "All".

- Pressing costs about 2.5k tokens per login because the sign-in snippet is pasted into the pane; the without-card half is cheap from the shell (curl with the login's cookie, read the page text).
- The pane's `requestAnimationFrame` stalls when hidden; a screenshot wakes it. Pages open after a first compile ("Compiling" bubble), allow ~10 s.
- **Fixtures left on dev:** Test 1 has one immunization (Deworming, 12 Nov 2026; a double press may have made two, one archived then restored); Test 2 lost its only photo and now has a chip 900123456789012; Fixture l5gxn has one adoption update; sign-in logins for `recurring_jobs`, `adoption_news`, `residents`, `medical_records`, `record_microchip`, `view_residents`.
- No refusal was provoked, so no wording was seen.
