# 2026-11-08: the UAT runbook corrected from its first real run, and two small scripts

Lutan ran Parts 1 to 5 of `docs/uat-finalisation.md` on 2026-11-08 with Claude reading every output. Each
place the list was wrong or silent is fixed in the list itself, so a rebuild of UAT reads the corrected
version. Lutan: *"Yes, fix it now."*

## What the run found, and what changed

| Where | What happened | Fixed by |
|---|---|---|
| Every PowerShell part | An administrator window opens in `C:\WINDOWS\system32`; `New-Item .local` failed with access denied | The list starts with an explicit `cd C:\Development\Animal_Shelter_App` and says not to use *Run as administrator* |
| Part 2, step 6 | Supabase's Connect dialog no longer shows "Session pooler" at the top | It is under **Direct**, then the **Method** list |
| Part 2, step 9 | `pg_restore` was not on the PATH | The PostgreSQL 17 folder line for the window |
| Part 2, step 12 | The list said hundreds of errors were normal; there were four, all `DROP` | UAT already had its schema, so expect a few |
| Part 2, step 15 | `restore-errors.txt` and `$env:DB` were left out of the clean-up | Both named |
| Part 3 | Lutan asked why UAT is given production's folder id; the new folder was invisible from another Google account and landed outside **LCA Health system** | The list says the id is the source, the folder lives in the shelter account, and moving or renaming it keeps its id |
| Part 3 | `drive-remap-ids.mjs` rewrites only ids it has a copy of, and its re-run counts only original ids. A record pointing outside the copied tree would keep naming a production file, and nothing would say so | **New `scripts/check-drive-leftovers.mjs`** (read-only, dev/UAT only), now Part 3 step 8. Run for real on 2026-11-08: CLEAN, 25 columns |
| Part 4, step 2 | Lutan was rightly unsure which Google account; the inventory had no UAT client | The step names the account and project and why they differ from Supabase's; the new client is in `docs/google-cloud-inventory.md` |
| Part 4, step 4 | The only Resend key was named `Supabase UAT` and is in fact **production's** (made 23 September, when that database was called UAT) | UAT got its own key, `Supabase UAT (new project)`; the list and `docs/email-sending.md` say which is which and not to delete production's |
| Part 4, step 5 | The test could not be sent: the site is not live, so *Forgot password?* is unreachable | **New `scripts/send-reset-email.mjs`** sends the same request straight to Supabase (dev/UAT only). It worked |
| Part 5, step 4 | `scp` was run in the Pi window | The step says it runs on the PC, and what the error looks like if not |
| Part 5, step 6 | `./scripts/pi/setup-uat.sh`: *Permission denied*. It was committed without the executable bit; the other three Pi scripts have it | **`git update-index --chmod=+x`**. The step also explains the first-run `chgrp` warning and the line it must end on |
| Part 5, step 10 | The command replaces the whole tunnel config with no copy kept | A backup step before, `systemctl is-active` after. Claude diffed live against the repo first: only the UAT entry and comments differed |
| Part 5, step 12 | No **WAF** in Cloudflare's menu | Now **Security**, then **Security rules** (also in `docs/pi-hosting.md`) |
| Part 5 | Nothing proved the firewall covered the new address | New step 13: `curl.exe -sI` must give 403 **text/html** (the block page); text/plain is the app's own refusal and means the rule does not cover it |

## Why the two scripts are shaped this way

- **Both refuse anything but dev or UAT, decided by `appEnvForSupabaseUrl`** (the same guard as
  `drive-remap-ids.mjs`), and `--env production` outright. Neither has a reason to touch production.
- **`check-drive-leftovers.mjs` exits 1 on leftovers**, so it reads as a gate. It prints table and column
  names and counts, never an id. Its SQL inlines only ids that passed the same pattern `drive-remap-ids.mjs`
  uses, now shared from `scripts/lib/drive-map.mjs` with tests (malformed and injected ids are dropped).
- `drive-remap-ids.mjs` itself was **not** changed to use the shared parser: it ran correctly on production
  data on 2026-11-08, and touching a script that writes is not worth a tidy-up.

## Not done here

- The list's Parts 6 to 8 are unchanged: they have not been run yet. Part 6 waits for the next release cut.
- Production's email *Sender name* still reads `Lanna Care UAT` (`docs/domain-checklist.md`, section D). It is
  Lutan's dashboard step and was pointed out to him on the day.
- `#rqv5c`, `#u7d3b` and `#uat7p` were retitled on the `backlog` branch to say Parts 1 to 5 are done and what is
  left; none is ticked, because Part 6 is in each.
