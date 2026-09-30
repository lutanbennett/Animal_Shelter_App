# Test and UAT API tokens consolidate on the lanna account's project (2026-09-30)

Decided by Lutan in chat, 2026-09-30. Inventory and runbook:
`docs/google-cloud-inventory.md`. Nothing has been moved yet; the console actions
are Lutan's.

- **Scope is Test and UAT only.** Both stay on `lannacare.org` hosts. Production
  goes live on `lannacareforanimals.org` later and is dealt with then (cutover and
  "Give production its own Drive tree" items). The backlog item's original wording,
  which reached for the shelter's own account, is superseded for this stream.
- **Owner: `lannaanimalfoundationbwm@gmail.com`, project `Lanna Care - Dev`
  (`lanna-care-dev`).** It already holds the Drive client and the dev sign-in
  client, and its consent screen is published. So no new project: the only move is
  the UAT sign-in client, today in `LCA App` under `lutan.bennett2@gmail.com`, which
  is recreated in `lanna-care-dev` and re-pointed in Supabase (project
  `dbkodyyxxhtygxcxmfcu`). `LCA App` is then idle and deleted after a week.
- **A separate client for UAT rather than reusing dev's.** Sharing one secret
  between dev and UAT means rotating it breaks both.
- **Traps the runbook names:** the consent screen must stay *In production* (Testing
  expires tokens after 7 days, as on 2026-09-25); the UAT Supabase host must be an
  authorised domain; brand verification lives in Search Console under Lutan's
  account and may not carry to the lanna project; the apex TXT record stays.
- **Cost to know:** until the cutover `lannacare.org` is served against
  `dbkodyyxxhtygxcxmfcu`, so this moves the live site's sign-in client; do it when
  staff are not signing in.
- **Checkable:** `scripts/check-drive-token.mjs` prints the Cloud project number and
  Drive account a token acts as. On `.env.local`, 2026-09-30: project number
  `1036347359893`, `lannaanimalfoundationbwm@gmail.com`.
- **Not found:** the 90-day token expiry; the runbook says where to look.
