# 2026-11-13 — The last four allow-list rows of `check-control-activity.mjs` (`#79sqf`)

Stream `claude/control-activity-false-positives`. `docs/control-activity-allowlist.json` is now `entries: []`;
the check reports `FINDINGS: 0`. The four rows were three causes, and not all three were the check's fault.

| Row | Cause | Resolution |
|---|---|---|
| `MyTaskList` Undo → `recordRecurringJob` | **A real fault, not a false positive.** The Undo button was drawn under `item.kind === "recurring" \|\| canEditMaintenance`, so a login with no recurring-job card was offered an Undo its action (`recurring.do_any` / `recurring.do_own`) refuses. | Fixed in code: `/my` passes `canRecordRecurring` (`can(perms, "recurring.do_any") \|\| can(perms, "recurring.do_own")`) and the button is drawn under `item.kind === "recurring" ? canRecordRecurring : canEditMaintenance`. The check was **not** taught that an item predicate implies a card: it does not, and teaching it would have hidden this. |
| `ResidentPicker` ×2 → `setFeaturedResident` | Gate not traced: `/admin/website` draws the Home panel only when `tabs={canContent ? WEBSITE_TABS : ["gallery"]}`. | Check taught **pattern (iv)**, the tab-array gate: a `panels={{ key: … }}` entry whose key the `tabs` ternary's literal-array arm does not list is gated on the ternary's condition. |
| `UnitsPanel` Delete → `deleteConversion` | Gate not traced: drawn only under `mode === "conversions"`; two hosts pass `mode="price"`. | Check taught **pattern (v)**, prop-literal narrowing: a host page that renders the component with a different string literal for that prop, and never the matching one, is not a host of the control. |

**Limits, stated so nobody over-trusts them.** (iv) only reads a ternary whose false arm is a literal array of strings;
anything else is still untraced. (v) matches only `ident === "literal"` conditions and only a direct render of the
component's own file from the host page; a literal passed through an intermediate component is not followed, and a
non-literal value counts as a match (widen, never narrow). Measured on the live tree: both rows closed with no new
finding (`FINDINGS: 0`, no stale entry).
