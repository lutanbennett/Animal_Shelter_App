# 2026-10-01 — Confirm dialogs, and how the offline banner decides (WEB-10)

**One shared dialog, called like `window.confirm`.** `ConfirmProvider` mounts a
single `ConfirmDialog` in the root layout and `useConfirm()` returns
`confirm({ body, confirmLabel? }) => Promise<boolean>`, so a call site changes
from `if (!window.confirm(msg)) return;` to `if (!await confirm({ body: msg })) return;`.
Cancel is focused (the existing component's behaviour), which is the fix: the
native confirm focuses OK, so a stray Enter confirmed a delete. The messages
already named the record (`deleteConfirm(name)`), so they were reused as the body;
deletes get a "Delete" button, other confirms a plain "Confirm".

**Judged to be deletions or irreversible, and converted (38 call sites in 23 files):** every
`deleteConfirm`/`confirmDelete`/`removeConfirm` on a record (zones, enclosures,
vets, doctors, diets, medications, contacts, units, deliveries, maintenance
jobs, recurring jobs, fixed outgoings, published projects, website photos,
shelter-friend logo and contact), the Security page's issue-password, two-step
reset, archive, delete and deny-request, merges and renames that rewrite other
records (blood-test, procedure and immunization types, frequencies, doctors,
medications), "make standard" diet, a medication unit change, and the test-alert
mail to every admin.

**Not converted:** `StocktakeSheet`'s `leaveWarning` is a leave-guard — it runs
inside a navigation/`beforeunload` handler that needs a synchronous answer, which a
promise-based modal cannot give. The assistant cards' and `ResidentPicker`'s
`confirm()` are their own functions, not `window.confirm`. Six components already
used `ConfirmDialog` directly with their own state and were left alone.

**Offline banner: the failed fetch is the truth, `navigator.onLine` is a hint.**
`navigator.onLine` is true on Wi-Fi with no route out, the shelter's likely failure.
So `OfflineBanner` wraps `window.fetch`: a *rejected* same-origin fetch (not an
abort) shows the banner, any fetch that gets a response clears it, and while it is
showing a HEAD probe every 10 s lets it clear on its own. The `online`/`offline`
events set the same flag cheaply. A rejected cross-origin fetch is ignored, since a
third-party host being down says nothing about our connection.

**Network down versus session expired.** A dropped network *rejects* the fetch; an
expired session *returns a response* (a redirect or 401). The banner therefore only
reacts to the former, and the session-expiry stream's message to the latter, so the
two cannot both be on screen for one cause. If the session-expiry work also reacts to
fetch failures, the network banner should win and its message be suppressed.

**44 px** (`min-h-11`) is added to the action buttons of the Settings → table pages
(zones, enclosures, blood-test/procedure/immunization types, frequencies, Security).
Management's tables use the same styling but the item named admin tables, so they
are unchanged.
