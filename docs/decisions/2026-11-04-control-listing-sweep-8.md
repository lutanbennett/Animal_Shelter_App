# Control listing sweep 8: the declared remainder read to the control, two components driven, `#nsd8z` closed (2026-11-04)

Stream `control-listing-sweep-8`, items `#79sqf` and `#nsd8z`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that action".
Stated by card; Admin untouched. **No code changed. No server or database check touched.**

## 1. `#nsd8z`: closed with its answer
Re-run on 2026-11-04: `grep -c 'activity: "photos.resident_publish"' src/lib/permissions/cards.ts` is **0**, and `grep -rn 'activity: "photos.resident_publish"' src`
finds only `src/lib/manual/en.ts:1061`, the manual describing the activity. **No card grants `photos.resident_publish`**, so no login can hold it
without `adoption_news`, and the app's narrowing of adoption-update attachments to `resident.adoption_news` affects nobody but Admin, who is outside the card
system and unaffected either way. Item ticked. (`cards.ts:424`'s sentence that Residents bundles it is a comment, still the subject of `#3cqd9`.)

## 2. The components: activity asked, gate drawn, verdict
"Read" = gate and action compared in code. "Driven" = both halves shown in the browser with one-card logins on port 3008.

| Component | Activity the action asks | Control drawn when | Verdict |
|---|---|---|---|
| `AssistantPanel` | `assistant.ask` (`app/assistant/actions.ts:684`) | `AppHeader.tsx:123` `can(perms,"assistant.ask")` | Correct. **Driven:** `assistant` card, Assistant drawn; `enclosures` card, not drawn |
| `PlanUpload` (`AddPlan`, `ReplacePlan`) | `facility.enclosures` edit (`facility-map/actions.ts`, every action) | page `requirePermission("facility.enclosures")` at edit | Correct. **Driven (half):** `enclosures` card (read only) is sent to `/no-access` |
| `MoveFolderDialog` | RLS on `project_folders` (action has no `can`) | `FolderView` `canWrite` = `projects.folders` (`projects/[id]/page.tsx:58`) | Correct by read; not driven |
| `AdoptionUpdateActions` | `resident.adoption_news` (`adoption-updates/actions.ts:73,145`) | `adoption-updates.tsx:59` `can(perms,"resident.adoption_news")` | Correct by read; not driven |
| `UndoDeathForm` | `placement.death_withdraw` (`lib/placements/deceased.ts:145`) | `undo/page.tsx` `canUndo` = same | Correct by read; not driven |
| `UploadPicker` / `MemeMaker` | page `social.library` (`memes/make/page.tsx:30`) | whole page | Correct by read; not driven |
| `admin/security` four components | Admin (`hasAdminRole`, `security/actions.ts:96`) | page `requireAdminUser` | Correct by read; `n/a` to drive: aal2 required, no authenticator |
| `CardControls` | Admin (`hasAdminRole`, `who-does-what/actions.ts:45,326`) | `canEdit = isAdmin && hasTwoStep` | Correct by read. **Reported, not edited:** `create-role-from-app` owns this screen this batch |

## 3. Sweep-5's remainder
- **`setMaintenanceStatus`: closed.** The action has no `can`; the real checks are the trigger `maintenance_before_write` (`0182_perm_policy_cleanup.sql:77`,
  `maintenance.progress`) and RLS (`0141:71`, `maintenance.jobs`). The board drags and the job page's status buttons are drawn only under `canMove` =
  `maintenance.progress` (`maintenance/page.tsx:80`, `[id]/page.tsx:37`; `MaintenanceBoard.tsx:347`, `MaintenanceJobView.tsx:217`), and My tasks under the same. Matches.
- **`/api` and photo-upload route handlers: NOT DONE.** 28 `route.ts` files; not traced.
- **Render-site trace of the whole-page group: NOT DONE.**

## 4. Found, not fixed
**No card grants the edit level of `facility.enclosures`, `projects.folders` or the yes/no `placement.death_withdraw`** (`cards.ts` carries only `facility.enclosures`
and `projects.folders` at read; `death_withdraw` appears only in a comment at `cards.ts:109`). So the controls above are, correctly, drawn for Admin only. By the
"no card for the activity? create one" rule that is a gap for the planner to file, not a gating fault.

## 5. Not driven, said plainly
`MoveFolderDialog`, `AdoptionUpdateActions`, `UndoDeathForm` and `UploadPicker` were read, not driven: each needs a card holding the write activity, and
none exists for three of them (section 4). Release note: `n/a`, nothing a user would notice.
