# App header: Open menu, Assistant and Sign out at 44 px

2026-10-07, `claude/header-buttons-44px`. Lutan's decision (director brief part 2,
q11): raise Sign out to 44 x 44, and the rest of the header with it.

| Control | Was | Now |
|---|---|---|
| Sign out | 20 x 20 | 44 x 44 on phones, 36 px tall with a mouse (md up) |
| Open menu | 36 x 36 | 44 x 44 (hidden from md up anyway) |
| Assistant | 34 x 30 | 44 x 44 on phones, 36 px with a mouse |

"Like the rest" is read as the rule the shared components settled: 44 px on
phones, 36 px with a mouse. The three are stamped `data-action="HeaderButton"`, so
`check-phone-width.mjs` measures them and fails if one shrinks. They are not built
on `RowAction`/`ActionButton`: those are icon-only squares or icon + word, and
the header's Sign out and Assistant show an icon below `sm` and the word from `sm`.

## The layout finding: it did not fit

At 375 px the controls at 44 px (plus the name and role from #410) no longer fit
on one row: Sign out dropped onto a row of its own, then the account name onto a
third, so the header was three rows tall on every phone page. Fixed by regrouping,
not shrinking: **row 1** is menu, logo, DEV badge, then Assistant and Sign out at
the right; **row 2** is the EN/ไทย switch and the account name, which now shows in
full in Thai ("Phone width admin · ผู้ดูแลระบบ", previously truncated). At `sm`
and up it is the old single row in the old order (Assistant, language, account,
Sign out); desk width looks the same as before. Done with `display: contents` on
the wrapper plus `order-*`, so no markup moved between the two layouts.

## Not done

The account-menu button itself (the name and role from #410) is a bare button
20 px tall, and the check lists it as a note. It was not one of the three, so it
is a follow-up on the backlog branch.
