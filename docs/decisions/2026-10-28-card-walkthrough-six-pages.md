# 2026-10-28 — Six pages get a walkthrough step; Appointments gets its record links gated

Backlog item: non-admin pages no walkthrough step opens. Lutan chose "add walkthrough steps" (2026-10-28). Six of the ten
are done here; four are deferred (below). The walkthrough is generated, so the steps live in `PAGE_STEPS` in
`scripts/gen-card-walkthrough.mjs`, one owner card per page, and `docs/card-walkthrough.md` is regenerated.

## Steps added (owner card → page)
`view_medical` → `/appointments` (read only), `/operations/feeding-list`; `medical_records` → `/appointments` (write links);
`view_contacts` → `/clinics`; `contacts` → `/clinics` (Manage link), `/management/clinics`; `website` →
`/management/desexing-drives`; `donations_receipts` → `/projects` (read only).

## Audit by control, activity read from the action itself
- `/appointments`: **fixed.** Log procedure, Log blood test, Add prescription, Log weight and Edit were drawn for any login
  that could read visits; their targets ask `medical.procedures`, `medical.blood_tests`, `medical.prescriptions`,
  `medical.weight` and `medical.visits` (edit level). Each is now behind `can(perms, <that activity>)`. Book appointment was
  already behind `visit.book`. Server checks untouched.
- `/projects`: already correct. `canWrite` is `projects.folders` at edit; the website switch is `projects.publish`.
- `/clinics`: already correct (Manage link behind `clinics.list` at edit).
- `/operations/feeding-list`: navigation only, no action controls.
- `/management/desexing-drives`: page, new, and every action ask `website.content` at edit, so a login that sees the page
  holds the level every control needs.
- `/management/clinics`: page and all three actions ask `clinics.list` at edit; doctors ask `clinics.doctors` in its own actions.

## Found, not fixed
- No card gives `projects.folders` at edit (only `donations_receipts` holds it, at read), so the write side of `/projects`
  cannot be walked per card. Not established whether that is intended.
- Not driven in a browser this pass: the checks above are from reading the code. A grep for `can(` could not catch a control
  drawn by a shared component that gates internally.

## Deferred: `/management/medications`, `/diets`, `/stock-usage`, `/cashflow`
No card opens any of them today (card-review-2 report §1); four new cards (`medicine_stock_list`, `diet_stock_list`,
`stock_usage_report`, `cashflow`) await Lutan's yes/no. Without a card to hold, a step could never be driven. They need a
schema PR first.
