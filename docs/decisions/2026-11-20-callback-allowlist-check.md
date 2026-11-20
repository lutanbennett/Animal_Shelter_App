# 2026-11-20 — the sign-in redirect allow-list is checked by `check-deployed-hosts.mjs` (`#aucbk`)

**Choice: one script, not two.** The question is the same (which addresses does this environment answer on, and does
a second list know them), the `--env` is the same, and `addressesAnsweredOn()` already enumerates the addresses including
the `www.` forms. A second script would be a fourth place to keep in step. `scripts/check-deployed-hosts.mjs` now asks
`shelter_hosts` first, then the auth allow-list; the pure matcher is `missingCallbacks()` in `scripts/lib/deployed-hosts.mjs`.

**What the endpoint returns (read, not assumed):** `GET https://api.supabase.com/v1/projects/<ref>/config/auth` answers with
`uri_allow_list` (one comma-separated string) and `site_url`, as the backlog item believed. Dev's, 2026-11-20:
`http://localhost:3000/auth/callback,https://test.lannacare.org/auth/callback,https://lannacare.org/auth/callback,https://test.lannacare.org/**`,
`site_url` `https://test.lannacare.org`.

**Matching:** an exact `https://<host>/auth/callback` entry passes, and so does a glob entry (`**` any, `*` within a segment),
since GoTrue treats a wildcard as matching (dev holds `https://test.lannacare.org/**`). Only the asserted addresses are demanded,
so `test` and `uat`, which declare no `PLATFORM_HOST`, are not asked for it. Output prints `site_url`, the address an unlisted
sign-in is thrown to. It does not fail on it.

**Dev fails today, correctly:** `www.test.lannacare.org` has no entry. It was not added: no Supabase setting is changed here.
UAT and production run from the main checkout (the planner's), not from a worktree. Not in CI, for the reason in
`2026-11-20-deployed-hosts-check-runs-at-release.md`. `#nxtqs` (why an exact entry is not enough once `?next=` rides in the URL)
is a different stream's and stays open.
