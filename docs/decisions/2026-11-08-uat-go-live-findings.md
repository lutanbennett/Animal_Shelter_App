# 2026-11-08: what putting UAT live found, and the fixes

UAT went live at `uat.lannacare.org` on 0.43.6 on 2026-11-08, with Lutan doing Parts 6 and 7 of
`docs/uat-finalisation.md` and Claude reading every output. Six things went wrong or nearly did. Each is
fixed where it will be read next time. Lutan: *"Yes, do it now."*

## Findings

1. **A key left out of `.env.deploy.uat` is not "off".** `loadEnv` layers the deploy file over `.env.local`,
   so the deploy's preview offered to push `.env.local`'s `GOOGLE_CALENDAR_ID` and `_REFRESH_TOKEN` (Test's
   calendar) to UAT, and suggested `--allow-dev-fallthrough`. The flag was not used. The runbook had said
   to leave the calendar lines out; that was wrong. **Fix:** both lines present and empty (the deploy skips
   an empty value, and `calendarConfigured()` reads empty as off). `check-uat-ready` now fails on a missing
   calendar line as well as a set one, and passes on empty. The UAT Worker already held both calendar
   secrets from older deploys (`--secrets` only adds); they were deleted with `wrangler secret delete`.
2. **The sign-in secret was pasted over the Drive secret.** Every Drive call failed with *invalid_client*
   on UAT. Measured by comparing `.env.deploy.uat` with `.env.local` (verdict only). **Fix:**
   `check-uat-ready` fails when any of the three shared `GOOGLE_OAUTH_*` differs from `.env.local`'s, and
   the runbook's Part 4 says which line takes the sign-in secret.
3. **The restore drops seven grants.** `--no-privileges` relies on default privileges, which cover tables;
   the `private` card functions and `private.resident_current_state` have explicit grants (0263, 0265,
   0086) and lost them. Residents said *permission denied for view resident_current_state*. Fixed on UAT
   with the migrations' own grant lines, then every one of 163 tables and views was read as the signed-in
   login (0 refused) and nothing was found open to `anon`. **Runbook Part 2 now carries the grants;** a real
   disaster restore has the same gap, filed as `#rg7pv` on the backlog branch, because a hand-kept list of
   grants will rot.
4. **"UAT's token lacks `database_read`" (release handover, 0.43.6) was wrong.** In a window without the
   other account's shell token, `--status` and the drift read UAT fine. Corrected in place in
   `docs/release-handover.md`, marked SUPERSEDED, keeping it under its line limit.
5. **The Pi deploy's clean-up failed** (*rm: cannot remove '.next.prev/…'*), because the group
   `setup-uat.sh` adds the deploy user to only applies from the next login. The deploy itself had
   succeeded; the leftover was removed from a fresh login. **Runbook Part 5:** reconnect after setup.
6. **The redirect rule missed `www` at first** (522). **Runbook Part 7** now says to check the second line,
   and gives the whole expression.

Also corrected: Part 6 now uses `npm.cmd` (Windows refuses `npm.ps1`; the setting is not changed), applies
UAT's migrations before deploying, says a Worker setting between releases is a `wrangler secret put` and
not a deploy, and that `lannacare.org` having no address is the outside proof the Worker let it go.

## A stale record, and how it was found

`docs/domain-checklist.md` section D still listed production's email sender name as outstanding, though
`#prx2t` closed it on 2026-10-29 (the mail says "LCA System"). On 2026-11-08 Claude repeated it to Lutan
and copied it into `docs/email-sending.md` in #1393. Both are corrected; the checklist line says it is done
and not to ask him. The lesson is the same as `confirmations-already-given`: check the backlog item, not a
checklist that nobody ticks.
