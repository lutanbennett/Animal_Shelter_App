# Add group: result under the button, English name only

Lutan, 2026-10-21: "when I click Add group it does nothing." Cause found by reading the code (not reproduced in a browser): `addGroup()` refused a blank Thai name, and the refusal went to the board-wide error drawn above the cards, out of sight from the form at the bottom.

- Thai name optional (0246 made `name_th` nullable). The app stores NULL when blank, never `''` (the check constraint refuses it). Readers already fell back with `||`; `GroupRow.name_th` is now typed `string | null`.
- `AddGroupForm` owns its result: "Added: X" or the refusal sits under the button. The button is off, with a reason line, until an English name is typed.
- Not done (outside the Add group form): the same placement for card add/remove errors and group moves; and there is no Edit on a group yet to add a Thai name later.
