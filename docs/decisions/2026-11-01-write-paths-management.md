# (D) over `src/app/management/**`: fourteen modules wrapped, nothing listed

Stream `write-paths-management`, 2026-11-01, stream (D) of the PI FAILOVER programme over the fourteen
`actions.ts` modules under `src/app/management/**`. Authority: `2026-10-31-write-request-wrapper.md` (the
mechanism), `2026-11-01-write-paths-admin-sweep.md` (the pattern, and why nothing is listed),
`2026-11-01-write-paths-residents.md` and `2026-11-01-write-paths-tail-a.md` (the worked examples).

**The outcome:** every write in the fourteen modules goes through `runWriteAction()`; two functions that
only read are left on `runAction()` and said so in section 2. **Nothing was added to
`WRAPPED_WRITE_PATHS`**, so this PR changes no runtime behaviour. No migration, no `worker/` change, and
`runWriteAction()`, `claim_write_request()` and `mayReplayWrite()` are untouched.

## 1. Step zero, and what it found

`node scripts/check-wrapped-write-paths.mjs --all` at the start reported all fourteen files `NOT`, so
none had been wrapped since the brief. `ls docs/decisions | grep -i write-path` showed the three papers
above and no earlier `management` one; `git log -S runWriteAction` showed only #1155/#1156 and their parents.
`management/translations/actions.ts` was read before it was touched (section 4).

## 2. What was wrapped (deliverable 1)

**Sixty-nine writes in fourteen modules**, by module:

| module | wrapped | left on `runAction` |
|---|---|---|
| `units` | `saveConversion`, `deleteConversion`, `setPricePerPurchaseUnit` | — |
| `donations` | `recordDonation`, `issueReceipt`, `retryDriveFiling`, `markReceiptSent`, `voidReceipt` | — |
| `donations/donors` | `createSupporter`, `updateSupporter`, `setSupporterArchived` | — |
| `desexing-drives` | `createDrive`, `saveDrive`, `deleteDrive`, `setSignupStatus`, `deleteSignup` | — |
| `clinics` | `createClinic`, `updateClinic`, `deleteClinic` | — |
| `clinics/[id]/doctors` | `addDoctor`, `addExistingDoctor`, `renameDoctor`, `setDoctorActive`, `mergeDoctors`, `deleteDoctor` | — |
| `cashflow/fixed-outgoings` | `createFixedOutgoing`, `updateFixedOutgoing`, `deleteFixedOutgoing` | — |
| `appeals` | `createAppeal`, `saveAppeal`, `saveAppealPhotos`, `moveAppeal`, `closeAppeal`, `deleteDraftAppeal`, `moveGiftsToAppeal`, `moveGiftOutOfAppeal` | — |
| `contacts` | `createContact`, `updateContact`, `archiveContact`, `restoreContact`, `deleteContact` | — |
| `diets` | `updateDietStockSettings`, `updateDietTypeStock`, `moveDietType` | — |
| `medications` | `updateMedicationStockSettings`, `updateMedicationStock`, `uploadMedicationLabel`, `removeMedicationLabel`, `moveMedication` | — |
| `recurring-jobs` | `recordRecurringJob`, `saveRecurringJob`, `setRecurringJobActive`, `deleteRecurringJob`, `handBackRecurringJob`, `handOverRecurringJobs` | `previewRecurrence`, `eligibilityForLink` |
| `shelter-friends` | `createFriend`, `updateFriend`, `addShelterFriend`, `setFriendPublished`, `moveFriend`, `uploadFriendLogo`, `removeFriendLogo`, `deleteFriend` | — |
| `translations` | `approveTranslation`, `clearTranslation`, `saveLabelTranslation`, `proposeLabelTranslation`, `approveLabelTranslation`, `discardLabelDraft` | — |

**The two reads.** `previewRecurrence` calls the `recurrence_dates()` SQL function and returns six dates;
`eligibilityForLink` calls `loadEligibility()` and returns a lookup. Neither inserts, updates or deletes
anything, so there is nothing to claim, and storing their answers would be worse than useless: a replay
would hand back dates computed for an old rule. They stay on `runAction`, in a module that otherwise calls
`runWriteAction`, which the check counts as wrapped. **That is the check's own named limit** (module-level
granularity), so it cannot tell me I skipped a write; the table above was built by reading every exported
function in every file, not from the check.

**No write was left unwrapped for being non-idempotent.** The brief asked for the section-3 treatment where
a write cannot be made safe, and it was looked for in each file. Section 3 below is the evidence for the
three that came closest; none needed it. That is three streams now with the same finding, and it is still
evidence rather than a rule.

**Imported helpers that write.** The check cannot see these, so they are named: `insertContact`
(`src/lib/contacts/create.ts`, called by `addShelterFriend` and `createContact`), `moveInCupboardOrder`
(`src/lib/management/cupboard-order-server.ts`, called by `moveMedication`/`moveDietType`),
`fileReceiptOnDrive` (`src/lib/donations/receipts-server.ts`) and `uploadImageToFolder`/`trashFile`
(`src/lib/google/drive.ts`). Each is called **inside** the claimed body, so each is covered; a helper that
was called from outside a body would not be.

## 3. The open question: what here writes to something that is not the app database (deliverable 5)

Method copied from `2026-11-01-write-paths-tail-a.md` §3: `claim_write_request()` makes the **claim**
idempotent, not the far end, so each outside service was read for what a second run would do.

**The finding first: only Google Drive.** A search of the fourteen modules and the helpers they import for
`fetch(`, Drive, Calendar, mail and Worker calls found Google Drive in three places and nothing else.
**`recurring-jobs` and `clinics` write nothing outside the database** (the guesses in the brief were
reasonable and wrong): recurring jobs are table rows and the `record_recurring_job` /
`reassign_recurring_job` functions; `clinics` is three plain statements. The Google Calendar sync belongs to
`clinic-visits`, which tail A wrapped. No module here sends an email.

**1. `donations` — receipt PDF on Drive (`fileReceiptOnDrive`). A replay is safe, and the reason is the
code, not the claim.** It finds the year folder with `findOrCreateFolder` (look up by name, create only if
absent) and files with `upsertGeneratedFile`, which updates the receipt's recorded `drive_file_id`, else
finds a file of the **same name** in the folder, and only otherwise creates one. The file name is derived
from the receipt number. So running it twice converges on one file. It also never throws (it catches and
returns `false`), and `issue_donation_receipt()` takes the number in the database with a unique "one live
receipt" index, so a second run could not mint a second number either. `retryDriveFiling` and `voidReceipt`
re-file the same row the same way.

**2. `medications` label and `shelter-friends` logo — Drive upload. NOT convergent, and wrapped anyway,
for a reason worth stating.** `uploadImageToFolder` creates a **new** Drive file on every run, so the body
must never run twice, and the claim is exactly what guarantees that: a repeat of the same id returns the
stored answer without re-uploading, and an in-flight claim answers "cannot tell" without re-uploading.
What the claim cannot do is undo a Drive file when the process dies between the upload and the row update;
that leaves an orphaned file and a claim with no result, so the retry says it cannot tell. The files'
own comments already name this ("an orphaned Drive file is a cleanup chore, not a reason to fail the
user's action") and both bodies already trash the new file when the row update does not land. **So the
cost is the one the wrapper paper names — availability, never a double write — and it is accepted.** The
upload action takes the request id as a separate argument, after the `FormData`, rather than inside it.

**3. `handOverRecurringJobs` — not an outside service, but the nearest thing to a non-atomic write.** It is
a loop of `reassign_recurring_job()` calls with no transaction around them, so a process that dies halfway
leaves some dates covered and some not, and the claim then says "cannot tell". Re-running it converges: the
permanent mode swaps a person out of each team (a team already without them is skipped) and the dates mode
skips any date whose team no longer includes them. So the recovery is the same act again by hand, which is
what the message tells the person to do.

## 4. `translations` and #1154 (the thing the brief had not established)

#1154 made `approveTranslation` refuse a translation whose links differ from the source and name the
addresses that differ. **It does not interact with the wrapper**, and the reason is worth keeping: the
link check sits **before** any write, inside the claimed body, and returns a refusal. The wrapper stores
refusals (the "Deterministic" comment in `runWriteAction`), so a replay of that request id answers with the
same refusal, and the next press, which is a new attempt, gets a new id. The refusal text carries the added
and removed addresses in it, which is fine to store: it describes that attempt's input.

**A parameter order that was not mechanical.** `approveTranslation`, `clearTranslation` and
`saveLabelTranslation` end in optional or defaulted parameters (`recordPathHint?`, `reconfirm = false`),
and TypeScript refuses a required parameter after one. So `requestId` goes **before** them in those three,
and their two callers (`TranslationQueue.tsx`, `src/components/TranslationPanel.tsx`) were changed to match.
Every other action takes it last.

`translations.propose` (stream 21) is not used and nothing is gated on it.

## 5. Client side (deliverable 2)

Forms (`createClinic`, `addDoctor`, `addExistingDoctor`, `createContact`) moved from `useKeptForm` to
`useWriteForm`; **forgetting that would have shown a "reload to save" refusal and typecheck would not have
said so**, so all four were found by `grep` for `useKeptForm` and the callers of each form action.
Everything else calls the action directly through `useWriteCall`, **one hook per action** per component,
including `ConversionFields`-style panels with two call sites for the same action (they share one, on
the tail-A rule). `WRITE_WAIT_MS` was not touched.

**Crossings, declared.** Each is a client file outside `src/app/management/**` that calls one of these
actions, so it had to change to pass the request id; nothing in any of them changed behaviour:

| file | why |
|---|---|
| `src/components/UnitsPanel.tsx` | calls `saveConversion`, `deleteConversion`, `setPricePerPurchaseUnit` |
| `src/components/CupboardOrder.tsx` | its `move` prop is `moveDietType` / `moveMedication`; the prop type gained `requestId` |
| `src/components/ArchiveContactControl.tsx` | calls `archiveContact`, `restoreContact` |
| `src/components/TranslationPanel.tsx` | calls `approveTranslation`, `clearTranslation` (shared by several record pages) |
| `src/app/my/MyTaskList.tsx` | calls `recordRecurringJob` (tail A had noted it as unwrapped) |
| `src/app/contacts/[id]/ShelterFriendCard.tsx` | the Shelter Friend card calls six `shelter-friends` actions |

None is under stream 20's folders.

## 6. Nothing added to `WRAPPED_WRITE_PATHS` (deliverable 3)

Per the brief. **Which addresses this work completes, as a fact for stream 22 and measured on this branch,
not on merged `main`:** every `/management/**` address the check prints is `(complete)` —
`/management`, `/appeals`, `/appeals/[id]`, `/appeals/[id]/preview`, `/appeals/new`, `/cashflow`,
`/cashflow/fixed-outgoings`, `/clinics`, `/clinics/[id]/doctors`, `/contacts`, `/contacts/new`,
`/dashboard`, `/desexing-drives`, `/desexing-drives/[id]`, `/desexing-drives/new`, `/diets`, `/donations`,
`/donations/[id]`, `/donations/donors`, `/donations/donors/[id]`, `/donations/donors/new`,
`/donations/new`, `/medication-list`, `/medications`, `/purchasing`, `/recurring-jobs`,
`/shelter-friends`, `/shelter-friends/new`, `/stock-usage`, `/translations` — plus `/contacts`,
`/contacts/[id]` and `/my`, which my crossings completed. Stream 22 should re-run the check on merged
`main` before listing anything, because stream 20's modules land alongside this one.

## 7. The check, before and after (deliverable 4)

`node scripts/check-wrapped-write-paths.mjs --all`. **Measured on this branch only, after merging
`origin/main` (documents only), not on merged `main`** — #1155 and #1156 each made the same mistake of
quoting their own branch's figure, and this one is no different:

| | before (the brief, merged `main`) | after (this branch) |
|---|---|---|
| modules unwrapped | 30 | **16** |
| addresses blocked | 47 | **21** |
| addresses complete | 102 | **127** |

Fourteen modules out, sixteen left, and the sixteen are exactly stream 20's (`account/password`,
`admin/{security,security/verify,status,website}`, `login`, `login/forgot`, `photos/approve` ×2,
`prescriptions`, `procedures/new`, `projects`, `services/desexing`, `stocktake`, `upcoming-visits/confirm`,
`weight`). The script printed 148 address rows here (127 + 21) against the brief's 149; I did not establish
where the one-row difference is, and it does not change any of the three figures' direction.

## 8. Driven, and not driven

Driven in the browser as Admin on dev, reached by clicking through (`/my` → `/management` →
`/management/clinics`, `requestAnimationFrame` confirmed firing): **`createClinic`** through
`useWriteForm` (saved, row appeared, no "reload to save") and **`deleteClinic`** through `useWriteCall`
(row removed, no refusal); no console or dev-server error. **The other sixty-seven writes were not
pressed**; they are covered by typecheck, lint, the test suite, the shared mechanism and the admin sweep's
`prove-write-requests.mjs`, a weaker thing, said here rather than implied.

## 9. Found, not fixed

- **Buttons follow cards.** This stream changed how controls *call*, not whether they are *drawn*; no
  control's gate was re-listed per page. A page-by-page list of each button's activity is still owed.
- **A replayed refusal is a stored refusal.** Correct for these actions, but note that
  `saveRecurringJob`'s partial result (`{ ok: false, error, id }` — job saved, team not) is stored whole,
  `id` included, because the wrapper stores the object it was given; its form reads `id` from the
  refusal as before.
