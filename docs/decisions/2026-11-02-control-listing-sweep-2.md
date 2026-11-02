# Control listing sweep 2: every control on the named admin addresses, by activity (2026-11-02)

Stream `control-listing-sweep-2`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it
do that action". Each activity below was read from the action file's own `can(…)` / guard, then
compared with what the page draws. No role is named; Admin is the documented bypass. No code changed:
every address listed was already correct. Server checks are untouched.

This redoes, control by control and from the action files, the admin rows #1175 summarised as "every
write control the page draws".

## 1. Per address

| Address | Controls (actions) | Activity the action asks | How the page draws them | Verdict |
|---|---|---|---|---|
| `/admin/units` | create, edit, archive/restore | `reference.types` AND `stock.diets` or `stock.medications` (`canEditItemSettings`, `actions.ts:52`) | page opens only on the same test (`page.tsx:18`) | correct |
| `/admin/zones` | create, update, delete, move up/down, sort by name | `facility.enclosures` (`actions.ts:48,79,100,143,158`) | `requirePermission("facility.enclosures")` (edit level) | correct |
| `/admin/enclosures` | create, update, delete, move, sort by name | `facility.enclosures` (`actions.ts:37,80,104,156,178`) | page same | correct |
| `/admin/facility-map` | shape save, add/save/remove/delete room, upload/replace/undo/remove plan | `facility.enclosures` (`actions.ts:52,108,139,169,190,205,330,406,444`) | page same | correct |
| `/admin/facility-map` translate control | translation editor | `translations.manage` | `canManageTranslations={can(perms,"translations.manage")}`, default off in the component | correct |
| `/admin/blood-test-types` | create, update, delete, merge | `reference.types` | page same | correct |
| `/admin/procedure-types` | create, update, delete, merge | `reference.types` | page same | correct |
| `/admin/immunization-types` | create, update, delete | `reference.types` | page same | correct |
| `/admin/medications` | create, edit, archive | `reference.types` AND `stock.medications` (`canEditItemSettings`) | page same | correct |
| `/admin/diets`, `[id]`, `ingredients`, `ingredients/[id]` | recipe and ingredient writes (`actions.ts:53`, `recipe-actions.ts:44`) | `reference.types` AND `stock.diets` | each page same | correct |
| `/admin/shop` | save, show/hide, move, delete, photo upload/remove | `shop.manage` at edit (`actions.ts:38`) | page opens at read, passes `canEdit` (default false) to `ShopLinksEditor`; every control behind it | correct, the model |
| `/admin/stocktaking` | two switches | Admin and the second step (`actions.ts:37`) | page: `requireAdminUser` + `hasTwoStep` | correct |
| `/admin/recent-changes` | Undo | `audit.undo` (`actions.ts:67`) | `canUndo` prop (fixed by #1175) | correct. **No card carries `audit.view` or `audit.undo`, so only Admin reaches this screen; that is a separate decision Lutan owes and is not touched here.** |
| `/admin/who-does-what`, `/features` | add/remove/move card, groups, show-menu, delete role, features | Admin and the second step (`guard()`, `featureGuard()`) | `canEdit = isAdmin && hasTwoStep()` passed down; same two tests | correct, see section 2 |
| `/admin/who-does-what/details` | none (read view, opened by `opensWhoDoesWhat`) | n/a | no action component imported | no controls |

## 2. Deliverable 3: what counts as an action control on Who does what

**Answer: it is a special case, and not a circular one.** Every control there edits which cards a role
holds. Its actions do not ask a card; they ask Admin plus the authenticator step (`hasAdminRole()` and
`hasTwoStep()`), because Admin sits outside the card system and the screen is how cards are given at
all. Gating on a card would be circular and would let a card-holder reach the screen that grants cards.
The rule still holds in its own terms: the control is drawn on exactly the test its action asks
(`isAdmin && hasTwoStep()`), so none is offered and then refused. A non-Admin who can open the
read view sees none; an Admin without the second step sees them locked with an explanation.

## 3. Not reached

- Resident write paths (`2026-11-01-write-paths-residents.md`), management pages (`-management.md`),
  the sixteen shared modules (`-list.md`) and the two tails (`-tail-a.md`, `-tail-b.md`). **Not one
  control on these was audited here; no verdict is implied.**
- Inside the listed addresses, the per-control draw logic of the large client components
  (`MapEditor.tsx`, `CardBoard.tsx`) was checked by their gate (page-level and the `canEdit` /
  `canManageTranslations` props), not by reading every button. Those pages are gated whole, so a
  control there cannot be reached by a login the page refuses.
- The website page editor, as in the previous decision file.
- Nothing was driven in a browser.
