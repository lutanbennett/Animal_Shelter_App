# A control must ask the activity its own action asks: the second resolver (backlog #79sqf)

Stream `control-activity-check`, 2026-11-11. Nothing here is a decision for Lutan.

## Step zero: not already built
`scripts/check-destination-activity.mjs` answers links only; its decision file says F3/F4 need "a second resolver not built".
No `check-control-*` script existed; no PR on this slug. The gap was there, so this was built.

## What was built
`scripts/check-control-activity.mjs` (static: TypeScript AST + migration files, no server, no database, no roles). About 12-25 s
on this machine (the first resolver is ~9 s; this one also parses the migrations and follows more edges). Blocking CI job `control-activity`.
`docs/control-activity-allowlist.json`: dated, shrink-only, same shape and rules as the destination one.

## (i) Control -> action: what is followed, what is not
Controls are JSX `onClick`, `onSubmit`, `action`, `formAction`. The expression is followed through: a function imported from a
`"use server"` file (type imports are ignored); same-file handlers (depth 3); `const [s, run] = useActionState/useWriteForm/useKeptForm/usePrepared(fn, …)`;
a direct `.rpc("name")`; and a callback prop (`onSubmit`, `onRemove`) by finding every place the parent passes it.
NOT followed: a callback passed through two components, a handler held in state or an array, `router.push`. Those print as
**UNRESOLVED by name**, never pass. A control that reaches no action or rpc (state toggles) is counted, not judged.

## (ii) How far an rpc is followed into SQL
All the way, cheaply: `scripts/lib/sql-refusals.mjs`'s `liveFunctions()` (last definition per name+arg count, minus later drops;
reused, not rewritten) gives the live body; `has_permission('act'[, 'lvl'])` literals are read from it, and calls to other live SQL
functions are followed two levels (a definer helper may hold the check). A live function that asks no card is "no static activity"
(infrastructure such as `claim_write_request`); one that uses a non-literal `has_permission` argument, builds SQL dynamically, or does not exist is UNRESOLVED by function name.

## (iii) Finding versus allow-list row
FINDING: the gate (or, ungated, the host page guard / every render site's gate) satisfies none of the activities the action asks.
Admin is ignored (it sits outside the card system) and an activity no card grants is `#c4vn7`'s ruling (`check-ungranted-activities.mjs`), not a control fault: the check
compares gate with action, so neither can become a finding by itself. An allow-list row is an unfixed fault or a recorded false positive with a dated, checkable reason; the check fails on a new finding and on a row that is no longer a finding.

## What it CANNOT see
Prose notices that promise an ability (**F2 remains a render-time finding**: found by rendering under a one-card login, as `#p3q7m` and `#m4wq2` were; do not re-derive this);
click-only controls whose handler it cannot trace; OR-conditions (one gate activity satisfying one action activity is enough); an action that branches on data
(`MyTaskList`: recurring vs maintenance) is read as the union of its branches; an optional `can()` inside an action body (`projects.publish` for the is_public switch) is read as required;
a callback shared by several callers is read as the union of their actions; helpers more than two calls deep; SQL that asks a card through something other than `has_permission('…')`; the live database.
`check-destination-activity.mjs` was NOT changed and nothing was factored out of it: the condition/page-guard code is copied here, because its measured output must not move.

## First run and precision (2026-11-11)
750 controls read; 405 reach no server action or rpc (not judged); 300 reach an action; 51 of those ask no static activity; 204 resolved OK (48 by their own gate, 156 by the host page's guard or every render site's gate);
71 UNRESOLVED, printed by name; 21 finding lines = 18 distinct controls, all on the allow-list.
**Precision, from a sample of 8 distinct findings read against the source: 3 real, 5 not** (3 real: `DonationChannels`, `ClinicVisitEstimate`, `PublishedProjects` — rendered ungated on
`/admin/website`, guarded only at `website.content` read, no `canEdit` in the files; false positives: `ShopLinksEditor` (fixed in the check: same-file render site is gated), `FolderView` (optional publish `can()`),
shared `ResidentPicker` (callback union), `MyTaskList` (per-kind branch), `ShelterFriendCard` (early return on a prop the check did not trace)). No rate beyond that sample is claimed.

## Not fixed in this PR
The three real faults are on the allow-list with the fix written in the row (pass `canEdit={canContent}` from `src/app/admin/website/page.tsx` and draw the controls only under it). They need
component-by-component edits to three files across a page whose other stream-owners may be editing; left as the next session's first job rather than half-done. No schema is needed for any of them.
