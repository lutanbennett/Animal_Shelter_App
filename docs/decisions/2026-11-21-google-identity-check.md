# Google identity gets an instrument (#3zr7o)

**Shape.** `scripts/check-google-identity.mjs` (logic in `scripts/lib/google-identity.mjs`) reads each environment's
Google OAuth keys (`GOOGLE_OAUTH_*`, the app's; `BACKUP_GOOGLE_OAUTH_*`, the platform account's), runs a refresh probe,
and compares the verdict with `docs/google-identity-registry.json`, the written record. It exits 1 only when the two
**contradict**, in either direction. `check-planner-preflight.mjs` calls the same library and prints one line.

**No secret is printed. Ever.** Output is key names and verdicts (`refreshes`, `revoked`, `absent`, `partial`,
`client-rejected`), plus whether two identities are the same Drive account, decided in memory from hashes. Unlike
`check-drive-token.mjs`, it prints no client-id prefix and no account address. The repo is public.

**Q1, the inventory.** `docs/google-cloud-inventory.md` is marked a dated reading, not regenerated. Most of it
(project ownership, redirect URIs, consent screen) is console-only and the check cannot see it; regenerating would
either drop that or invent it. A banner says live state is the check's and that the check wins on disagreement.

**Q2, which env files.** Default is all three environments whose file is present (a missing file is reported as
unknown, not a failure). Cost: at most 6 probes, deduplicated by credential, so about 2 seconds on a PC with all
three files; the planner measured nothing slower. `--env <name>` probes one, `--no-probe` makes no network call.

**Q3, fail or report.** Fail on a **contradiction**, never on a bad state that is recorded. UAT's app token is
recorded as `revoked` (`#drvtk`), so it passes as "as recorded"; the day it refreshes, or the platform token dies,
the check goes red and says which line to change. A check that was red on a known state would be ignored, the fault
this item exists to fix. Unreachable Google (offline) is unknown, never red. In the preflight it is **warn only**,
so a known-revoked token cannot turn the preflight red; the standalone script is the one that fails.

**Found while building:** a worktree's `.env.local` is a copy and can lack keys the main checkout has (this one lacked
`BACKUP_GOOGLE_OAUTH_*`, so the check read `absent`). Not fixed here; for the planner.

**Limits.** It sees only this machine's env files, not Workers' secrets (use Settings, /admin) and not the console.
