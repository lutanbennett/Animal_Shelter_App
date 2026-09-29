# 2026-09-28 — Waiting access requests: a count on System status and a task on My tasks, no mail

Since 0100, Settings → Security needs a 2-step-verified session, so finding
out whether anyone is waiting for a role cost a step-up, and nobody looked.

- **The count, never the people.** `/admin/status` and `/my` open at a
  normal sign-in, so both show only how many are waiting and how long the
  oldest has waited. `WaitingAccessRequests`
  (`src/lib/auth/access-requests.ts`) is the guarantee: the type has no
  field that could carry a name or an address, so a page built on it
  cannot leak one by accident. `scripts/check-access-requests-card.mjs`
  checks it end to end against dev with an aal1 admin and a requester
  carrying a distinctive name and address.
- **One definition of "waiting".** A login with no `user_roles` row,
  lifted out of the Security page into `accessRequestsAmong()`, which the
  page's list and the count both call. Archived people keep their row
  (0063), so they are never counted. The oldest is measured from the
  login's `created_at`: when they first arrived, not when they last tried.
- **Amber while anyone waits, green when nobody does, and outside the
  health report.** It needs an admin, nothing is broken, so it is never
  red. And it is not added to `runHealthChecks()`, so the alert schedule
  never sees it: a failed count (Supabase down) would otherwise mail as an
  outage that the Database tile already reports.
- **No mail — Lutan, 2026-09-28.** Asked whether a waiting request should
  mail the admins through the status-alert mailer; answer: card only.
- **A task for every admin, worked out rather than stored — Lutan,
  2026-09-28.** Lutan asked for "a task to review access that is assigned to
  all admins … just a one-off task", so it is not a recurring job. It is a
  third My tasks source (`src/lib/my-tasks/access-requests.ts`): one row,
  dated the day the oldest request arrived, shown to every admin while
  anyone waits and gone for all of them once nobody does. Storing it as a
  maintenance or recurring row would need someone to create and close it,
  and would go stale the moment another admin dealt with the request. It
  counts towards the nav badge — always today or overdue while it exists.
- **Cached for the minute, forgotten on a Security change.** The nav asks
  on every page an admin opens, so the count goes through the status
  page's one-minute cache; every Security action clears that key, so
  approving someone takes the task away at once rather than a minute later.
