# Clearing the control-activity allow-list (backlog #79sqf)

Stream `control-activity-allowlist`, 2026-11-11. Nothing here is a decision for Lutan.

## Step zero
The gap was still there (check showed 19 finding lines, not the 21 the brief quoted; #1480's own run had moved). No decision file or commit
had done this work. `DonationChannels.tsx` had no `canEdit` prop.

## Fixed (9 real findings, 9 rows deleted)
Every action in `src/app/admin/website/actions.ts` was read: all nine ask `website.content` at edit, so the pattern held and nothing
"followed the action instead". Each component takes a `canEdit` prop that **defaults to false**; the page passes `canContent`.
- `DonationChannels.tsx` (5 rows: move, show/hide, delete, save, remove QR) - controls and the add and edit forms are drawn only under `canEdit`.
- `ClinicVisitEstimate.tsx`, `PublishedProjects.tsx` (unpublish) - same.
- `CreateSiteContentRow.tsx`: the page already drew it only for `website.content`; the component now also refuses to draw without `canEdit`.
- `ImpactBaselines.tsx` (`BaselineForm`): had a `canEdit` prop for the switches but its own form was ungated; now returns null without it.
No server or database check was touched. Note that `/admin/website` already limits a read-level login to the Gallery tab, so these controls were
reached only by a render path, not by a person; the gates are the explicit form of what the tab list already did.

## Settled, not fixed (rows kept, reason rewritten from "NOT READ" to a verified cause)
- `SitePageForm`, `SiteSettingsForm`: the action is picked by the same prop that gates it (`canEdit ? update : propose`), the submit is drawn
  only under `canEdit || canPropose`. The check unions both actions. False positive.
- `medical/ResidentPicker.tsx` (`reassignWaitingPhoto`): the picker only calls `onPick`; `reassignWaitingPhoto` is called from
  `photos/approve/ApproveQueue.tsx`. Cause (c), shared-component callback.
- `UnitsPanel.tsx` (`deleteConversion`): drawn only when `mode === "conversions"`, passed only by `/admin/medications`, whose page refuses
  unless `canEditItemSettings(perms, "medication")` - exactly what the action asks for a medicine. False positive (prop-conditional).

## Deliverable 4: not done (deliverable 3's permission, used on purpose)
The check was not taught the four false-positive causes. The 9 remaining rows are all verified false positives, each with its cause above or in
its row. That is the part to do next; it needs the check's handler resolution, which I did not read. `check-destination-activity.mjs` was not touched
and still reports 0 findings.

## Counts (`node scripts/check-control-activity.mjs`)
| | before | after |
|---|---|---|
| controls read | 750 | 750 |
| reach an action | 300 | 300 |
| resolved OK | 212 | 213 |
| UNRESOLVED | 71 | 72 |
| finding lines | 19 | 9 |
| allow-list rows | 18 | 9 |
Explained: OK +1 and UNRESOLVED +1 are controls whose gate the check could now or could no longer see after the components were gated
(the form inside a component that returns null is one such); finding lines fell by 10 because 9 rows' controls were gated and one row's control
(`ImpactBaselines`) merged in with them. The 71 UNRESOLVED were not worked.

## What the check still cannot see
Prose notices (F2), click-only controls, optional `can()` in an action body, per-branch actions, shared-component callbacks, gates reached through
an expression it does not trace, and anything under the 72 UNRESOLVED.

## Driven proof
One-card logins on dev, reached by clicking through: the `website` card (edit) shows Move up/down, Hide, Save, Delete, Add on the Donate tab;
the `website_photos` card (read) is offered only the Gallery tab and no donation control. Absence by the tab list plus the gate, presence under edit.
