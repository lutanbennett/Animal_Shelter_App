# 2026-11-11 — Teaching `check-control-activity` its false-positive patterns (`#79sqf`)

Stream `claude/control-check-false-positives`. Owns `scripts/check-control-activity.mjs`, its allow-list and its tests. No page or
component code changed. **This closes no exposure.** `#1484` already recorded that `/admin/website` hid those tabs from a read-only
login, so none of the nine controls was reachable by a person; the work makes a blocking CI job tell the truth.

**Step zero:** the gap was still there on `main` at `55c43ee6` (nine allow-list rows, 71 UNRESOLVED, no test file for the script, no earlier
decision file doing this). Carried on, as the brief says.

## How the check resolves a control to an activity (the model nobody had written down)

1. **Control → action.** `reach()` follows the expression on `onClick`/`onSubmit`/`action`/`formAction` through identifiers: an import from a
   `"use server"` file is an action; a same-file function or `const` is followed to depth 3; `useActionState/useWriteForm/…(fn)` bound names
   are followed to `fn`; `.rpc("name")` is an rpc. A callback prop (`onPick`) is followed to what each caller passes (`cbSources`).
2. **Action → activity.** `actionActs()` collects `can(perms,"x",lvl)`, `requirePermission("x")` and `.rpc()` (the rpc's live SQL body read for
   `has_permission('x')`) from the action body and its helpers, depth 2.
3. **Control → gate.** `gatesFor()` collects the conditions the JSX sits under (`&&`, `?:`, `if`, early return) and resolves identifiers through
   same-file consts and through props that callers pass `can(...)`. With no satisfying gate it falls back to the page(s) that render the file.
4. **Verdict** is *any* gate activity satisfying *any* action activity (deliberately lenient). The model is **union-and-lenient**: every action a
   control can reach is merged into one set, and one satisfied member passes the lot. All three false-positive patterns come from the union
   (it merges things that are alternatives or optional). Teaching them took three small cases, **not a different resolution model.**

## The three patterns, each its own commit and tests

| Pattern | What was taught | Row(s) it resolved |
|---|---|---|
| **(i) optional `can()`** (`8f8d1c81`) | `const x = can(p,"a")` whose name is only ever the condition of a ternary or the left of `&&` (and not in a refusing arm) shapes what the action writes; it is not a requirement. Any use in an `if`, `\|\|`, a call argument or a refusing arm keeps it a requirement. The report prints each one skipped. | `FolderView.tsx` (`projects.publish`) |
| **(iii) callback per caller** (`8d66604e`) | A callback prop is judged **per caller**: the caller's own gate and the pages that render *that caller* guard it, instead of every caller's actions unioned and every host of the shared file held to the union. Findings name the caller (`passed by …`). | `medical/ResidentPicker.tsx` |
| **(ii) per-branch actions** | `cond ? A : B` with an action in each arm gives two units judged separately; the true arm may lean on `cond`; a `<form onSubmit>` whose submit buttons are *all* drawn under a gate borrows those gates. | `SitePageForm`, `SiteSettingsForm`; `ShelterFriendCard` (with the `\|\|` fix below) |

Two causes the patterns exposed and I fixed, each with a test, because the rows could not be honestly resolved without them:

- **`if (!a || !b || c) return` was read only at its top two operands.** `gatesFor` now flattens the whole `||` chain. This is what hid the
  gate on `ShelterFriendCard` (`!canManage || !(…) || isArchived`).
- **Two components in one file both naming their handler `onSubmit`** resolved to the *first* `useWriteForm` destructure in the file, so the
  second form was judged on the first form's action. `reach()` now picks the destructure in the innermost enclosing function. This was a
  real blind spot, not noise: the test `…the second form is judged on ITS OWN action` **passes a genuinely ungated form on the old script**.

## Allow-list: 9 rows → 4

Removed because the taught check resolves them: `FolderView` (i), `medical/ResidentPicker` (iii), `SitePageForm` and `SiteSettingsForm` (ii),
`ShelterFriendCard` (ii + `||` chain). Not removed to shorten the list.

**Four stay, with their reasons rewritten to what is actually left:**

- `components/ResidentPicker.tsx` ×2: pattern (iii) narrowed it to its one caller with an action, `FeaturedResident.tsx`. What guards that is
  `/admin/website` drawing the Home tab only when `tabs={canContent ? WEBSITE_TABS : ["gallery"]}` (`page.tsx:240`), a **prop array**, not a JSX
  condition. Teaching that is a fourth pattern (a tab/section list as a gate).
- `MyTaskList.tsx` `recordRecurringJob`: the maintenance arm now passes on its own; the recurring arm's guard is the **predicate**
  `item.kind === "recurring"`, not a card. Needs predicate implication, not another case. **This is the one place the per-arm view says the
  union was hiding something**: the arm is reachable only for a row this login recorded, so it is a self-service guard, but that is a ruling
  to make, not something the check should assume.
- `UnitsPanel.tsx` `deleteConversion`: drawn under `mode === "conversions"`, a prop-conditional, unchanged.

## UNRESOLVED 71 → 69, and the 71 → 72 nobody could place

- **Could not reproduce 72.** The check at the pre-`#1484` parent (`62edcaed^1`), at the merge (`62edcaed`) and at `55c43ee6` all print **71**,
  and the two unresolved lists are **line-for-line identical** (`diff` empty). Whatever moved was on that stream's own branch, not on `main`,
  and no control moved across the merge.
- **My own change to the count:** 71 → 69 = −4, +2. **−4:** `RetryCalendarForm.tsx` and three `DeceasedBanner.tsx` forms were UNRESOLVED
  only because of the `onSubmit` scoping bug above (judged on the wrong action); they now resolve. **+2:** pattern (iii) splits the single
  `ConfirmDialog.tsx` line, which unioned six actions from six callers, into three lines that each name their caller
  (`assistantRecordDeath`, `clearTranslation`, `recordRecurringJob`); the other three callers now resolve. No control was found ungated.

## Proof the check still catches an ungated control (deliverable 6)

`scripts/check-control-activity.test.mjs` builds tiny `src/` trees in a temp folder and runs the script on them. Every pattern has a positive
case and a **negative case that must still fail**: an optional-looking `can()` that refuses in an `if`; a direct `can()` in an `if`; a caller
whose page guards the wrong activity (named in the output); an arm nothing covers; a form with an ungated submit; the second `onSubmit` form.
`CCA_SCRIPT=<old copy>` points the same tests at an earlier script: the pattern tests **fail on the version before each pattern** (5/10 pass
before (ii) and the two fixes; the (iii) tests fail before (iii)), so they test the teaching and not the fixture.

## What a static check still cannot see (F2, for the planner to file)

A **prose notice that promises an ability** (`F2`): text carries no activity. To see one a check would have to render each page under a login
holding exactly one card and compare the visible sentences with what that card can do; that is the driving half of `#79sqf`
(`control-drive-pane`), not a static check. Nothing here changes that.

## Limits of what was taught

- The submit-button rule assumes a form with a gated submit button is submitted only through it. A single-field form can still submit on Enter
  with no button drawn; the server action still refuses (hiding is the courtesy, not the security).
- Arm-splitting is only for a **conditional expression with an action on both sides**; an `if/else` in a handler body is still a union.
