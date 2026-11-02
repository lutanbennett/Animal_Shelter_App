# Control listing sweep 3: resident, management and shared-component controls, by activity (2026-11-02)

Stream `control-listing-sweep-3`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that
action". Each activity was read from the action file's own `can(...)` or, where the action is a bare RPC or table
write, from the policy that decides it; then compared with what the page draws. No role is named; Admin is the
documented bypass. **No code changed: every control reached was already drawn on the activity its action asks.**
Server checks untouched. Nothing was driven in a browser (code-read only).

## 1. Website page editor (one line)
Closed by #1182 (`4a1ac02b`), its item ticked. Not re-audited.

## 2. #1197's tag pickers (deliverable 3)
Seventeen pages draw a `#` picker through `canTagNote(perms, [activity])` and a `canTagNotes` prop defaulting to
false in every form (`grep canTag=` finds no caller passing anything but that prop). The link table's own policies
(`0299`, `resident_note_sources.write_activities`) ask the note's save activity at edit plus `resident.record` at
read, which is exactly what `canTagNote` asks.

| Notes | Gate passed | Save asks | Verdict |
|---|---|---|---|
| clinic visit (new, edit) | `medical.visits` | edit: `medical.visits`; new: `visit.book` | correct, see note |
| diet (new, edit) | `medical.diet` | `medical.diet` | correct |
| immunization (new) | `medical.immunizations` | policy: `medical.immunizations` | correct |
| prescription (new, edit) | `medical.prescriptions` | same | correct |
| procedure (new) | `medical.procedures` | same | correct |
| weight (new, edit) | `medical.weight` | same | correct |
| adoption news | `resident.adoption_news` | same | correct |
| placements: move, hospital (+return), rehome (+return), death | `placement.move` / `.hospital` / `.rehome` / `.death` | the placement policy, same keys | correct |
| resident edit (three boxes) | `resident.record` at edit | `resident.record` | correct |

Note: booking a visit (`clinic-visits/new`) is opened and saved on `visit.book`, but the tag row it writes is
governed by `medical.visits`. A login holding only `visit.book` gets no picker, which is right (the link insert
would be refused); it is a courtesy lost, not a leak. Not changed. Intake (`resident.register`) has no picker.

## 3. Per page: controls and the activity their action asks

| Area | Controls | Action asks | How drawn | Verdict |
|---|---|---|---|---|
| Resident hub: record death / retry archive | button | `placement.death` | `canRecordDeath` / `canRetryArchive` = same | correct |
| Hub: undo death, retry restore | button | `placement.death_withdraw` | `canUndoDeath` same | correct |
| Hub: microchip | edit form | RPC `set_resident_microchip` / `resident.microchip` | `canSetMicrochip && !isDeceased` | correct |
| Medical sections: archive/restore record | `ArchiveRecordControl` | `medical.archive` | `canArchive()` = `!isDeceased && can(medical.archive)` | correct |
| Blood tests, procedures: delete attachment | list controls | `medical.blood_tests` / `medical.procedures` | `canManage` same | correct |
| Resident photos: delete, profile, move, mark posted | gallery | policies: `photos.resident_manage`; move to Medical also `photos.medical_add` | `canManage`, `canMarkPosted`, `canFileToMedical` (default false) | correct |
| Adoption updates: edit, delete | `AdoptionUpdateActions` | `resident.adoption_news` | `canWrite` same | correct |
| Management donations, donors | all | `donation.receipt` | page `requirePermission` same | correct (whole page) |
| Desexing drives | all | `website.content` | page same | correct (whole page) |
| Clinics; doctors | all | `clinics.list`; `clinics.doctors` | page same | correct (whole page) |
| Fixed outgoings; cashflow links | edit; "fix" links | `reports.cashflow` | page; link flags each ask their target's activity | correct |
| Appeals; gifts move | all; move gifts | `appeal.run`; also `donation.receipt` | page `appeal.run`; `canSeeGifts` = `donation.receipt`; medical photos `appeal.medical_photo` | correct |
| Contacts; archive control | all | `contacts.directory` | page; `ContactHub` `canManage` | correct |
| Recurring jobs; shelter friends | all | `recurring.manage`; `friends.manage` | page same; `canManageFriends` | correct |
| Translations queue | approve/clear; propose | `translations.manage`; `translations.propose` | `canManage`, `canPropose` | correct |
| Units panel (diets, medications) | price | `stock.diets` / `stock.medications` edit | `canEdit` | correct |
| Projects folders | create, move, upload | `projects.*` incl. `projects.publish` | `canWrite`, `canPublish` props | correct |

## 4. Not reached (no verdict implied)
- Every `src/app/management/**` page not in the table above, including cupboard/stock count, usage, purchasing, delivery and supporters' sub-pages; the `[id]` detail pages of donations, donors, clinics and desexing drives were checked only by their page gate, not button by button.
- `MapEditor.tsx` and `CardBoard.tsx`: not in this scope's pages. The large client components in the tails (`-tail-a`, `-tail-b`) were **not opened**; only the list of components importing an `actions` module was scanned for gate props, and the four with none (`MoveFolderDialog`, `ArchiveContactControl`, `ArchiveRecordControl`, `UnitsPanel`) were traced to their callers.
- Resident `new` (intake), `rehome`, `hospital`, `move` and `edit` forms were checked for the tag picker, not for their other buttons.
- Photos: the uploader and `photoCategoriesFor` were not re-read; the gallery was audited on 2026-10-27.
- Most of the sixteen shared modules in `-list.md` and everything under tail A and B not named above.
- Nothing was driven in a browser.

## 5. The line between a control and a display (deliverable 5)
**The rule applied:** a thing needs a card gate when what the person does with it has a **destination a card
governs**: a button or link that fires an action, an input whose content the page's own Save will write, or a link
to a page that refuses them. A thing that has **no card-governed destination** is a display or a personal setting
and needs none: it either changes only this browser's own presentation, or writes only to the login's own
preference.

- The theme picker and the language switcher end in the login's *own* preference. No card governs it, so no card
  gates it. (Sweep 1.)
- An editable text box with no Save button of its own (#1182) is still the first half of an action: its content
  is committed by a gated action, so showing it editable to a login that cannot save is offering and then refusing.
  Gating it is the same rule applied to its destination, not a different rule.
- So the two are consistent: **ask where the input ends up.** Own preference: no card. A write a card guards: that
  card, read from the action. Sweep 4 should apply that and not decide it again.

## 6. Found, not fixed
None. One courtesy mismatch noted in section 2 (visit booking tags), no change proposed.

## 7. For the planner to file
The backlog item is only partly covered (section 4); do not tick it. Strike section 3's pages in place.
