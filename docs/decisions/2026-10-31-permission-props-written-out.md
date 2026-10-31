# A permission prop is written out, never as JSX shorthand

**2026-10-31** · branch `claude/permission-prop-shorthand`

## What was asked

#1126, building the Thai rich-text toolbar, found in passing that Settings → Website passed
`canManageTranslations` as a bare JSX attribute — which in JSX means `true` — so a login holding the
Website card but **not** Translations was drawn Edit and Remove translation buttons that the server
then refused. It fixed its own line. The planner then grepped the shape and found eight more lines
across five files, and asked for **a verdict per call site**, not eight edits.

## What was found

**Every one of them is safe.** No button changes for any login, in either direction.

Two of the eight grep hits were not JSX at all — `canSeeGifts` on its own line in
`src/app/management/appeals/[id]/page.tsx:58` and `:67` is the first line of a ternary inside an
argument list (`canSeeGifts ? loadRaised(...) : Promise.resolve(null)`), which the line-anchored
pattern cannot tell from an attribute. Six were real shorthand props, and each sat behind a route
guard or an enclosing condition asking **exactly** the activity its action asks:

| Call site | Activity the action asks | Read from | What gated it |
| --- | --- | --- | --- |
| `maintenance/[id]/MaintenanceJobView.tsx:164`, `:308` | `translations.manage` | `approveTranslation` / `clearTranslation` | enclosing `canManageTranslations &&`, from `can(perms, "translations.manage")` |
| `management/appeals/[id]/page.tsx:152` (`canMove`) | `appeal.run` **and** `donation.receipt` | `moveGiftsToAppeal` / `moveGiftOutOfAppeal` | `requirePermission("appeal.run")` + enclosing `canSeeGifts ?` |
| `management/translations/TranslationQueue.tsx:178` | `translations.manage` | as above | `requirePermission("translations.manage")` on the page |
| `projects/[id]/FolderView.tsx:321`, `PhotoSection.tsx:202` | `translations.manage` | as above | enclosing `canManageTranslations &&` |

So the smell was real and the finding was not. Worth saying plainly, because the brief's premise was
that some of these might be holes: **none was**, and nothing goes in `docs/card-access-faults.md`.

## Why they were still changed

The props were correct **by accident of where the component is rendered**. Delete the enclosing
`canManageTranslations &&` — a plausible refactor, since the panel decides for itself whether to
draw anything — and the shorthand silently becomes the #1126 hole, with no diff anywhere near the
prop to review. That is precisely how #1126's was written: a bare attribute under the comment
*"Admin is a superset of management, so always"*, which was wrong.

Each one now names its dependency beside the prop (`canManage={canManageTranslations}`), so the
control and the action can be read against each other at the call site. Behaviour is identical: the
values passed are the same values the enclosing conditions already tested.

Two of them had no expression to name, so one was threaded in: `TranslationQueue` and
`MaintenanceBills` now take the boolean their page already computes.

## Three more the brief's grep had missed

`^\s+can[A-Z]\w*\s*$` only finds shorthand that Prettier happened to put on its own line. A
tag-aware scan found three written inline, all equally safe:

| Call site | Activity | Read from | What gated it |
| --- | --- | --- | --- |
| `clinic-visits/[id]/edit/page.tsx:149` (`canAdd`) | `medical.visits` at `edit` | `mayFileBill("clinic_visit")`, `src/lib/bills/upload.ts` | enclosing `showBills`, the same activity **and level** |
| `deliveries/page.tsx:255` (`canAdd`) | `stock.delivery` | `mayFileBill("stock_receipt")` | `requirePermission("stock.delivery")` |
| `maintenance/[id]/MaintenanceBills.tsx:166` (`canAdd`) | `maintenance.bills` | `mayFileBill("maintenance_bill")` | enclosing `canBills &&` |

Nine call sites, nine safe. The point of recording the miss is that **the grep under-counted its own
class by a third**, which is why the answer is a parser and not a pattern.

## The check, and why it asks about shape rather than judgement

`scripts/check-permission-props.mjs` fails any JSX attribute named `can` + a capital that is written
without a value, anywhere in `src/**/*.tsx`. It runs in CI's `script-integrity` job.

It was worth building because the rule is a **shape**, so there is nothing to baseline and no list
to keep in step: a passing tree has none, the fix is always to write down what the prop depends on,
and it would have caught the one genuine hole this class has produced. A check that asked the harder
question — *is this the right activity?* — would need to resolve every component's actions through
its callers, and would be the kind of check nobody can keep green.

What it therefore does **not** do, and this matters when reading a green run: it does not know
whether `canManage={canWrite}` passes the right activity. That is still a person's judgement at
review. The check only guarantees there is an expression there to judge.

It is tag-aware rather than line-anchored, for the reason above: it skips `{…}` expressions and
strings, so a ternary's first line or a `className` containing the word is not a prop. Proved both
ways — green on the tree, red on a deliberately reintroduced shorthand.

## Declared crossings

`src/app/management/translations/page.tsx` belonged to `thai-sweep-typed` this batch (two lines: the
`can` import and `canManage={can(perms, "translations.manage")}`), and
`src/app/clinic-visits/`, `src/app/deliveries/` were in nobody's list. `src/lib/permissions/can.ts`
and `catalogue.ts` were not touched; neither was any server or database check.
