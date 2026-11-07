# Page level required for level activities (2026-11-07)

Backlog item `#q0wc0`, remainder of `2026-11-06-page-level-classification.md`.

## What changed
`requirePermission(activity: LevelKey, level: Level)` — the level is now required. Omitting it for a level
activity is a compile error. A yes/no activity still takes none. Runtime behaviour is unchanged (the 37 pages
already pass `edit`). Typecheck was clean apart from the generated `PageProps` global noise present on `main`;
no call site broke, including `src/app/bills/settings` and `src/app/bills/utilities`, so the declared crossing
into that stream's area was not needed.

## Re-count
Command: `grep -rEl "requirePermission\(\s*[\"'][a-z_.]+[\"']\s*\)" src --include=*.ts --include=*.tsx`
→ **34 files**: 33 pages plus the doc comment in `require.ts` itself. Every page match is a yes/no activity, so 33 pages today with a one-argument call, none of them a level activity.
The item's 64, the planner's
70 and today's 34 differ because #1351 passed `edit` explicitly on 37. No level activity takes the default now.

## The disagreement, settled
#1351 was right; #1352 was wrong as stated. `events.run` and `photos.approve` are `kind: "yesno"` in
`src/lib/permissions/catalogue.ts` (lines 114 and 134), so `requirePermission("events.run")` and
`requirePermission("photos.approve")` take no level and cannot "default to edit". What #1352 was probably seeing
is the one-argument call shape, which is the same shape the level-defaulting pages used; the activity kind, not
the call, tells them apart.

## Default flip: deliberately not taken
A `"read"` default would make a page that forgets its level too open instead of too closed, the worse
direction. Required-with-no-default is the answer.

## Not done (stopped at a clean unit)
Gating add/archive controls so list pages could open at `read`: admin/diets lists, sterilisation-drives list,
management/contacts, management/clinics. Each needs a control gate plus a guard change and a driven one-card
login. Left open on `#q0wc0`.
