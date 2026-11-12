# Control press, group D: stopped early, 0 presses (`#79sqf`)

**Date:** 2026-11-12. Branch `claude/control-press-group-d`, port 3005, no migration, no code changed.

## Result

**driven: 6 of 25, unchanged.** This stream pressed nothing. It stopped after step zero, one trace
and one read, and says so plainly.

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

## Left (19 rows, all unpressed)

Rows 1-9 and the three fixture gaps of the brief's order, each still to be pressed with a one-card login,
then re-checked with the other card. Row 1 needs a done-today recurring fixture first.
No refusal wording was seen. Fixtures left on dev: none.
