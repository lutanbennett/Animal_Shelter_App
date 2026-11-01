# Control listing sweep: which controls are drawn, and for which activity (2026-11-01)

Stream `control-listing-sweep`. The rule applied is `CLAUDE.md`'s "a button is shown only if the
login's cards let it do that action". Each control's activity is read from the action's own
`can(perms, …)` / `canEditItemSettings(…)`, never from the control's label. Everything below is
stated by activity; no role is named. Access is unchanged: this stream only decides whether a
control is *drawn*.

## 1. Size, and what was reached

Nobody had counted. The sweep's decision files name the admin settings pages (13 addresses, about
11,000 lines of page, table and action code), the resident write paths, the management pages, the
"list" widgets and two tails, which together are several hundred controls across well over a hundred
addresses. That is more than one session if done properly.

**Reached (own commit order):** (1) the shared header; (2) the admin settings pages the item names:
units, zones, blood-test types, procedure types, immunization types, medications, enclosures,
stocktaking, recent changes, shop, the diets addresses, who-does-what (+ features), facility map.

**NOT reached, and the next stream should start here:** the resident write paths
(`2026-11-01-write-paths-residents.md`), the management pages (`-management.md`), the sixteen shared
modules (`-list.md`), and the two tails (`-tail-a.md`, `-tail-b.md`). Not one control on those has
been audited by this stream; "not listed below" means "unvisited".

## 2. The header: every action control and the activity it asks

| Control (file) | What it does | Activity its action asks | Drawn when | Verdict |
|---|---|---|---|---|
| Assistant button (`AppHeader.tsx`, `AssistantPanel`) | opens the panel; `fetchAssistantContext` | `assistant.ask` (`actions.ts` `fetchAssistantContext`) | `can(perms, "assistant.ask")` in the header | correct |
| Ten confirm cards: move, clinic, hospital, hospital-return, weight, death, rehome, carer-return, immunization, prescription (`AssistantCards.tsx`) | every confirm goes through `runWrite` | `assistant.record` (`actions.ts:122`), plus the underlying write's own RPC | card drawn only when `context.canWrite` (= `can(perms, "assistant.record")`, `data.ts:227`) **and** `mayUseTool()`: a tool that declares an extra activity in its spec (`needs`, `medical.prescriptions` today) is drawn only when `context.toolCards[needs]` is true (`AssistantConversation.tsx:283,411`) | correct |
| Assistant recordTurn / recordRefused | audit rows written by the panel, not user buttons | n/a: not a control | n/a | not a control |
| Theme picker (`ThemePicker.tsx`) | `auth.updateUser` merging one key into the person's own `user_metadata` | none; see section 3 | every signed-in login | correct by rule, section 3 |
| Language switcher (`LanguageSwitcher.tsx`) | writes the `locale` cookie in the browser | none; see section 3 | every visitor, signed in or not | correct by rule, section 3 |
| Sign out (`SignOutButton`, header and menu) | `auth.signOut()` on the person's own session | none (ending your own session) | every signed-in login | correct |
| Account menu links: profile, home-screen icons, manual, release notes (`AccountMenu.tsx`) | navigation, not actions | each page opens to every signed-in login (own account, public manual, release notes) | always | links, not action controls |
| Home / menu toggle, public-site logo | navigation | n/a | n/a | links |

**Result: the header needed no change.** Its one gated control (Assistant) and its ten cards were
already gated on the same activities their actions ask; the three remaining writes are personal
preferences and sign-out.

## 3. THE DECISION: theme and language sit behind no card

**Rule, in the terms asked for: every signed-in login may change their own colour theme and their
own language, and may sign out. None of these is behind a card, and none is to get one.**

Why this is the right answer rather than an assumption:

- **Nothing is granted.** The theme write merges one key into the caller's *own* `user_metadata`
  under their own session; the language write sets a cookie in their own browser. Neither touches
  another person's data, any shared row, or anything the database holds on the shelter's behalf. The
  value is read back through `parseTheme()` / the locale parser, so a tampered value renders as the
  default. There is no ability here for a card to grant or deny.
- **The `CLAUDE.md` test is "does it grant or deny the ability to do something to the shelter's
  data?"** A card exists so an administrator can decide who may do a thing; no administrator would
  ever want to decide who may read the app in Thai. A card for it would be a card that does nothing
  for anyone it is withheld from (the preference would just not persist) and a login with no role
  yet must still be able to use the app in its language, which is the situation the header decision
  already identified.
- **It does not repeat Admin's exception.** Admin sits outside the card system because it is *all*
  access. This is the opposite: it is *no* access to anything shared. Nothing else may cite it as a
  precedent; it covers a control only if what it writes is the caller's own presentation preference
  or their own session.

**What would have to be true for it to need a card:** (a) the write reaches anything other than the
caller's own metadata or browser (for example a shelter-wide default theme, or setting someone
else's language); (b) the shelter wants to *forbid* the preference for some logins (for example a
locked kiosk login that must stay in one language); or (c) the value is stored somewhere other
people read it and could be abused. If any of those becomes true, create a card for that specific
activity then; do not add one now.

## 4. Admin settings pages (see section 5 for the control table)

The pages in this group share one shape: **the page is opened only by a login that holds the same
activity, at the same (edit) level, that every one of its actions asks**, so a control on the page is
never offered to a login whose action would refuse it. `requirePermission(x)` defaults to edit level,
the same as `can(perms, x)` in the actions.

## 5. Controls checked

Legend: **same** = the page is opened only with the activity the action asks, so every control on it
is drawn exactly when its action would run.

| Address / file | Controls | Activity the action asks | Verdict |
|---|---|---|---|
| `/admin/units` (`UnitsTable.tsx`, `CreateUnitForm.tsx`) | create, edit, save, cancel, archive/restore | `reference.types` AND `stock.diets` or `stock.medications` (`canEditItemSettings`, `actions.ts` `refusal()`); the page applies the identical test | **same. Closes item (b) of the two-places item: listed, no gap.** |
| `/admin/zones` | every write control the page draws (the actions in its `actions.ts`) | `facility.enclosures` (`actions.ts`); page `requirePermission("facility.enclosures")` | same |
| `/admin/enclosures` | every write control the page draws (the actions in its `actions.ts`) | `facility.enclosures`; page same | same |
| `/admin/facility-map` | every write control the page draws (the actions in its `actions.ts`) | `facility.enclosures`; page same | same |
| `/admin/blood-test-types` | every write control the page draws (the actions in its `actions.ts`) | `reference.types`; page same | same |
| `/admin/procedure-types` | every write control the page draws (the actions in its `actions.ts`) | `reference.types`; page same | same |
| `/admin/immunization-types` | every write control the page draws (the actions in its `actions.ts`) | `reference.types`; page same | same |
| `/admin/medications` | every write control the page draws (the actions in its `actions.ts`) | `reference.types` AND `stock.medications` (`canEditItemSettings`); page same | same |
| `/admin/diets` (4 addresses: index, `[id]`, `ingredients`, `ingredients/[id]`) | every write control the page draws (the actions in its `actions.ts`) | `reference.types` AND `stock.diets`; each page same | same |
| `/admin/shop` (`ShopLinksEditor.tsx`) | every editing control (add, edit, photo, per-entry buttons) | `shop.manage` at edit; page reads `can(perms, "shop.manage", "edit")` and passes `canEdit`, default false | correct (already the model) |
| `/admin/stocktaking` | two switches | Admin only plus the second step (`requireAdminUser`, `hasTwoStep`); sits outside the card system | correct |
| `/admin/who-does-what` (+ `features`, `details`) | role/card edits | Admin plus second step; `canEdit` computed from both and passed down, buttons drawn on `canEdit` | correct as drawn. The action bodies were not re-read for this pass. |
| `/admin/recent-changes` (Undo) | Undo | **`audit.undo`** (`actions.ts:67`); the page was opened by `audit.view` | **FOUND AND FIXED, section 6** |

## 6. Fixed

- **`/admin/recent-changes` drew Undo to a login holding `audit.view` but not `audit.undo`.** Looking
  at the log and undoing a change are two separate activities in the catalogue. The page now computes
  `canUndo = can(perms, "audit.undo")` and `UndoCell` draws nothing without it (the explanatory
  "newer change exists" notes go with it, since they only explain why a button is missing). The
  server check in `undoChange` is unchanged.

## 7. Found, not fixed / not reached

- **Not reached at all:** resident write paths, management pages, shared modules, the two tails (see
  section 1). No verdict is implied for any control on them.
- **`/admin/who-does-what` action bodies** were not re-read; only the draw side was checked against
  the Admin-plus-second-step condition.
- **The website page editor** (item (a) of the two-places item) is *not* touched: it is outside this
  stream's admin list and remains open.
