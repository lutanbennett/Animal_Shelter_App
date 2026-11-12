# The fixtures the control presses needed, and the eight rows they unlocked (`#79sqf`)

**Date:** 2026-11-12. Branch `claude/control-press-fixtures`, port 3002, no migration.
One new file, `scripts/dev-fixtures.mjs`. No application code changed.

## Result

**driven: 21 of 25.** The 13 of #1523 plus the eight below, every one of them a click in the browser
pane as a login holding exactly one card. **Four are left**, and all four are named at the bottom with
what each needs.

The deliverable was the fixtures, not the presses. There is now a script that makes the dev rows these
controls are drawn for, so the next stream presses instead of hand-making a row.

## Step zero, and the measurement that justifies the whole stream

- `ls scripts/fixtures/ scripts/test-fixtures/`, `ls scripts/ | grep -iE 'fixture|dev-'`: no script
  that makes dev rows. `scripts/fixtures/` holds five static files for check-script tests;
  `scripts/dev-*` is sign-in and the assistant stand-in. The gap was still there.
- `node scripts/check-control-activity.mjs` (22.3 s, run while the gates build held the machine):
  **4 findings, all 4 on the allow-list, 0 new** — the same reading #1523 and #1517 took, so nothing
  regressed and no new no-gate control appeared. `PhotoGallery:812` and `TranslationPanel:179` are
  still printed as unresolved, which is the check being honest about what a static pass cannot decide;
  pressing them is what this stream and the last one did instead.
- The four preconditions were then asked of **the whole of dev**, not just of this script's own rows
  (`node scripts/dev-fixtures.mjs --status`, 2026-11-12):

  | Asked of all of dev | Answer |
  |---|---|
  | residents who are deceased **and** have a blood test | **0** |
  | residents with two or more approved photos | **0** |
  | bills waiting in the inbox | **0** |
  | a recurring job assigned to a test login | none |

  **None of the four existed anywhere.** The wall five streams hit in a row was real, dev-wide, and
  not something a stream could have walked around by finding somebody else's record. That is the
  finding that makes this an instrument rather than a convenience.

## The instrument: `scripts/dev-fixtures.mjs`

```
node scripts/dev-fixtures.mjs --status            say what exists, change nothing
node scripts/dev-fixtures.mjs                     make (or repair) every fixture, then report
node scripts/dev-fixtures.mjs --login <email>     also a recurring job assigned to that login
node scripts/dev-fixtures.mjs --remove            delete only the rows named `ZZ fixture …`
```

What it makes, and which control each row exists for:

| Fixture | Draws |
|---|---|
| `ZZ fixture deceased` — a resident with a blood test that has results, then a Deceased placement | row 4, `BloodTestList:121` Correct result (`readOnly && canManage`) |
| `ZZ fixture two photos` — a living resident, two approved Shelter photos, the first the profile | row 6b, `PhotoGallery:812` Set as profile photo |
| five `ZZ fixture bill N` inbox cards, each with its own attachment | row 9's five controls, one each — every press consumes its card |
| `ZZ fixture bill job` — a maintenance job, Not Started, in a real zone | the job suggestion row 9's match control needs |
| `ZZ fixture daily job` — a recurring job due every day, assigned to one login | row 1, the `/my` take-back, which only exists after the login's own press |

Three design points worth not re-deriving:

- **It goes through the Management API's SQL endpoint, not the Data API.** `bills_inbox` revokes
  everything from `service_role` (0189), and the blood test has to be inserted inside the same
  transaction as 0026's `app.deceased_lock_bypass` — a dead resident's record is read-only, and a dead
  resident is the state the fixture must end in. One `do` block keeps the bypass and the insert
  together.
- **Idempotent, and that includes putting the pressable state BACK.** Every row is found by its own
  `ZZ fixture …` name before it is made. Re-running after a press restores the profile photo to photo
  1, re-makes the consumed bill cards and clears today's recurring occurrence. Proved in passing: the
  run that added the recurring job reported `profile=zz-fixture-photo-1` and `5 card(s)` again,
  minutes after the presses had moved the profile to photo 2 and taken the inbox down to one card.
  **Press, re-run, press again.**
- **It deletes nothing it did not create.** Dev is shared with two other live streams, so `--remove`
  matches `ZZ fixture …` only, and the one delete inside the make path is its own recurring job's own
  occurrence for today.

Four facts the migrations held that the first draft did not, each of which failed loudly and is now in
the file as a comment: `maintenance_status` has no `'To Do'` (0033 renamed it `'Not Started'`);
`maintenance_before_write()` refuses a job with neither zone nor enclosure; 0346 clears `approved_at`
on INSERT for any resident photo, whoever inserts it, so approving is a second statement; and without
that second statement the photo reads as *waiting* and `PhotoGallery` draws a sentence exactly where
Set as profile photo would be.

## Per-row table: the twelve

Each press is by **card**, with the activity read from the action or the RPC, never from the label.

| # | Control (file:line) | Activity the action asks | Card held | Outcome |
|---|---|---|---|---|
| 1 | `MyTaskList.tsx:221` take back | `recurring.do_any` / `recurring.do_own` | `recurring_jobs` | **pressed.** Marked `ZZ fixture daily job` done; the banner *"ZZ fixture daily job" marked done.* appeared with **Undo**; pressing it cleared the banner and the row returned to *Due today (1)*. The occurrence row for today is gone from the database afterwards. |
| 4 | `BloodTestList.tsx:121` Correct result | `medical.blood_tests` (`editClosedBloodTestResult`) | `medical_records` | **pressed.** On the closed record the pencil is drawn and the attach / remove controls are not, which is `readOnly && canManage` behaving. Saved a rewritten result; the page came back from the server with the new text. |
| 6b | `PhotoGallery.tsx:812` Set as profile photo | `photos.resident_manage` | `residents` | **pressed.** Drawn and enabled on photo 2, the lightbox closed, and the database now reads `profile=zz-fixture-photo-2`. |
| 8 | `ConfirmDialog` assistant record death | `assistant.record`, `placement.death` | `assistant`; `medical_records` | **not reached** (see below). |
| 9a | `BillsInbox.tsx:447` record general bill | `bills.general` | `bills` | **pressed.** Kind *Materials and equipment* (general route) ⇒ *Record this bill* appeared; after it, 5 → 4 waiting. |
| 9b | `BillsInbox.tsx:459` file as utility bill | `bills.utilities` | `bills` | **pressed.** Kind *Electricity* ⇒ the covers-month field and *File as a utility bill* appeared; 4 → 3 waiting. |
| 9c | `BillsInbox.tsx:476` match bill to job | `maintenance.bills` | `bills` | **pressed.** Kind *Maintenance* ⇒ *Maintenance job: ZZ fixture bill job* offered; pressing it took 3 → 2 waiting. |
| 9d | `BillsInbox.tsx:506` save | the five bill activities | `bills` | **pressed.** Edited the note, *Save details*, status *Saved.*; the card stayed, which is right — saving does not file. |
| 9e | `BillsInbox.tsx:513` delete | the five bill activities | `bills` | **pressed.** `window.confirm` stubbed in the page (the pane blocks dialogs); 2 → 1 waiting. |
| 10 | `UndoDeathForm.tsx:52` | `placement.death_withdraw` | **no card; Admin only by design** | **not pressed, on purpose, and no card invented.** #1523 read it; the item says in terms it must not be given one. |
| 11 | three fixture gaps | — | — | **not reached**; each one's gap is now named below. |

The four bill presses that file a card each took the inbox down by one, and the save press did not —
five cards in, one left. That arithmetic is the evidence the five controls are five distinct actions
and not one action pressed five ways.

**No fault found, and nothing ungated.** Every control above appeared only once its own card was held
and its own data existed, and no control was offered that the server then refused.

## The four that are left — the next stream's worklist

- **Row 8, the assistant's record-death confirm.** Not reached. It needs
  `node scripts/dev-assistant-model.mjs --dev` and `next dev` pointed at the stand-in, which is a
  second dev server on a second port and was not started here. What can be proved with the stand-in is
  that the confirm fires and saves — **not** that the assistant understood the sentence
  (`docs/dev-assistant-model.md`).
- **Row 11a, the Shelter Friend card.** **It is not a missing card.** `publish_shelter_friends` is in
  the catalogue (`src/lib/permissions/cards.ts:191`), bundle `friends.manage`, opening
  `/management/shelter-friends`. So nothing here needs creating and nothing is a card-rule finding.
  What is missing is a **row**: a supplier marked as a Shelter Friend for the page to draw controls
  against. That belongs in `dev-fixtures.mjs` as a sixth fixture.
- **Row 11b, the per-row diet controls.** A resident with a diet. `dev-fixtures.mjs` makes residents
  already, so this is one more block in the same `do` block.
- **Row 11c, the `/operations/*` rows.** `src/app/operations/` is `feeding-list` and `medication-list`.
  Both need residents carrying the thing being listed — a diet for the feeding list, a live
  prescription for the medication list — which is the same fixture as 11b plus a prescription.

All three of row 11 are **one more pass over `dev-fixtures.mjs`**, not new research. That is the
cheapest shape the next stream could be handed, and it is why the fixtures were the deliverable.

## Notes for the next session

- **Reaching a page by its address does not work in the pane**, exactly as `CLAUDE.md` says. Every page
  here was reached by clicking an `<a>`, and where a pixel click missed (the frame is 800x600 while the
  page is 1024x768) `element.click()` through `javascript_tool` was used instead. Once, `read_page`
  reported the previous page while the URL had already moved — the URL in the tab context is the
  reliable reading, not the tree.
- **A sign-in snippet costs about 2.5k tokens to paste**, so four logins is most of a press budget.
  Writing the snippet to a scratchpad file and `cat`-ing only the last line avoids paying for the
  script's banner twice.
- **Running `dev-signin.mjs` twice for the same card set and port re-keys the login**, so only the
  **last** snippet is live. Taking the email from run 1 and the snippet from run 2 signs you out of
  run 1.
- **The fixture photos do not render, and that is expected.** Their `drive_file_id`s are placeholders
  (`zz-fixture-photo-1`, `zz-fixture-bill-3`, …) that no Drive file answers, so `/api/photos/<id>`
  returns **502** and the gallery and bill cards show the broken-image box. Thirteen such 502s were
  read back one by one and every one was a fixture photo. **It does not block a press** — none of the
  eight controls needs the bytes — so giving the fixtures real Drive uploads would cost a Drive round
  trip to remove console noise and nothing else. Do not file them as an app fault.
- **Fixtures left on dev** (all named `ZZ fixture …`, all re-makeable, none to be tidied):
  `ZZ fixture deceased`, `ZZ fixture two photos`, five `ZZ fixture bill N` cards,
  `ZZ fixture bill job`, `ZZ fixture daily job`, plus the general and utility bills and the
  job-matched bill the presses filed. Sign-in logins for `bills`, `medical_records`, `residents`,
  `recurring_jobs`.
- **No refusal was provoked**, so no refusal wording was read — which is as it should be while
  `refusal-keys-group-9` is rewording them.

## `#79sqf`

**Not ticked.** 21 of 25. What is left is row 8, row 11's three, and row 10 which is deliberately never
to be pressed — so the honest remainder is **four rows, three of which are one more pass over
`dev-fixtures.mjs`**. For the planner to file.
