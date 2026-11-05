# Release handover — written 2026-11-05 after `0.43.2`, **the domain cutover**

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-05-0-43-2.md`. **Both outrank this file.**

## START HERE

**The system has moved. Production is `lannacareforanimals.org`.** `lannacare.org` is now **UAT**, on the
**dev** Supabase project, and it correctly wears the UAT badge. `test.lannacare.org` is unchanged.
Production's database never moved: still `dbkodyyxxhtygxcxmfcu`, **318 of 318** with no drift, same on dev.

**`0.43.2` did NOT mail** — verified at the inbox with a presence control, not inferred. The public site is
**still locked** (`PUBLIC_SITE: "locked"`, his decision); the unlock is a separate decision and the search
steps wait on it.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 8ec682d1..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version` on both
hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**He asked for "a minor release no email to be sent". On that `main`, that was a domain cutover.**

#1295, titled `DO NOT MERGE YET`, had merged seven hours earlier. Merging deployed nothing — but **every
deploy from that `main` performed the cutover**. Taken at face value, the release manager would have run
`deploy.mjs --env production` alone: that is **step 5 of a thirteen-step runbook**, with no freeze, no fresh
backup, the Pi still built for the old host and the Supabase Site URL still on the old one. Sign-in and
every Server Action would have broken, with a rollback the runbook itself calls *not rehearsed*.

- **No check catches this, and one of them actively looks like reassurance.** `check-site-hosts.mjs` prints
  `all right` **because the cutover state is internally consistent** — it is built to pass once the cutover
  commit is in. CI was green. The gates were green.
- **What caught it was `git log --oneline -1` before cutting**, then reading the decision file it named.
  **Do that every release.** It costs one command.
- He was asked before anything was cut, with the alternative of deploying the next day in order. He
  reaffirmed *"Cut now and we are deploying straight after"*. **A reaffirmed instruction is a decision —
  proceed, and record it as his.**

## New this release

- **THE PI TUNNEL CHANGE IS LUTAN'S, AND THE RUNBOOK DOES NOT SAY SO.** `/etc/cloudflared/config.yml` is
  root-owned and `sudo systemctl restart cloudflared` is **not** in the Pi's passwordless sudo list. That
  list is exactly four commands: `systemctl restart lanna-care`, `restart lanna-care-test`, and
  `is-active --quiet` for each. **So the Pi build and app restart are yours; anything touching cloudflared
  is his.** Establish this with `sudo -n -l` **before** a deploy, not by meeting a password prompt with the
  site half-moved. `release-procedure.md`'s exception list and `domain-checklist.md` step 4 should both name
  him; neither does yet.
- **Verify every command before handing it over, and prefer a script to a quoted one-liner.** The tunnel
  `sed` was tested against the live file with `diff` (exactly one line changed, the test ingress untouched),
  then wrapped in a self-verifying script on the Pi so his step was one short, PowerShell-safe command that
  backs up, refuses to restart if the wrong line moved, and is idempotent. The production deploy was
  `--plan`-ed first; so was UAT's, which resolved its eight secrets while his build ran.
- **`gates.mjs` can exit 0 while two gates are RED.** The first cut read `typecheck=2 lint=0 test=0 build=1`
  and the runner's own exit code was **0**. **Only the four-number line is the truth.** Worse, the background
  task's log file was truncated to its last **487 bytes**, losing both error messages — so **redirect gates
  to your scratchpad** and read that.
- **An untagged release note is a PLAIN STRING, not `{ text }`.** `ReleaseNote` is
  `string | {text, cards} | {text, admin: true}`; `{ text }` alone fails typecheck. That was this session's
  error and it cost a revert and a re-cut.
- **A card-creating migration can leave `role-cells`/`role-cards` byte-identical, and that is correct.**
  `0317` creates `view_expenses` but assigns it to no role. **Identical snapshots look exactly like a failed
  apply**, so prove it the other way: `reports.expenses` is absent from `activities-grantable`, which means a
  card grants it.
- **Count assertions with `grep -c`, never off a `tail`.** `tail -12` said twelve release-guard assertions;
  there are **16**. The last edition warned about this with a `tail -15` and the warning still did not
  prevent it.

## Newly established, and worth not re-deriving

- **A Worker deploy releases the old custom domain by itself.** Step 6 said this was not established.
  `lannacare.org` was absent from the bound domains immediately and returned nothing; the dashboard agreed.
  **No manual removal.**
- **The purge token DOES cover `lannacareforanimals.org`** — step 8 was its first real use. The manual
  dashboard fallback was not needed.
- **The Pi's asset check fails as `ENOTFOUND` before the new host exists**, not against a parked page.
- **Production release mail has been mislabelled `[UAT]`** for at least two releases — `0.43.0` and `0.42.0`
  both arrived as *"[UAT] Lanna Care release …"* from *"Lanna Care UAT"*. The cutover's
  `RELEASE_MAIL_ENV: "Production"` fixes it **from the next mailing release**. Nobody had noticed.
- **`--base` was needed for the third release running**, again because the cut wrote a note of its own.
  Expect it whenever a release closes a step streams were waiting on.

## Corrections to the last edition

- **The stray `next start -p 3100` is GONE.** That edition's one outstanding item for Lutan is closed.
- **`npm ci` in the main checkout was deliberately skipped, and that was right.** `git diff
  beabcf7f..HEAD -- package.json package-lock.json` was **empty**, so the proven 484-package tree already
  matched the lockfile. **Check that diff first**: if it is empty there is nothing for `npm ci` to fix and
  running it only re-courts the `EPERM`. Read the `Next.js version :` banner on every build regardless — it
  matched `16.4.2` on all four.
- **`package-lock.json`'s version field was stale AGAIN.** Backlog `#jhd8s` has **not** landed;
  `cut-release.mjs` still does not touch the lockfile. Fix by hand and expect to do it again.
- **The production apply was NOT refused by the classifier** — the first clean one in four episodes. The
  pattern has already been put to him; do not ask for an allow rule.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged.** Never restore, never edit, never raise.
- **`release-prs.mjs` was not short a PR**, second release running. Cross-check anyway.

## In flight and open

- **UAT's zone cache has NEVER been purged**, and it matters slightly more than it sounds: that zone may
  still hold year-long `immutable` `/_next/static/**` from the **old production** build, which UAT would now
  serve stale. Needs a dashboard purge or `CLOUDFLARE_PURGE_TOKEN` in `.env.deploy.uat`.
- **Production's `CLOUDFLARE_ZONE_ID` is still the OLD zone**, which the Settings → System status visitor
  count reads. `domain-checklist.md` step 13(a).
- `scripts/pi/setup.sh` and `docs/pi-hosting.md` still call `lannacare.org` production. Step 13(b).
- **The Pi cannot resolve the apex `lannacareforanimals.org`** — its router cached the NXDOMAIN from lookups
  made while the domain did not exist. `www` resolves, and the **test** host's asset check passed from the
  same Pi, so neither the script nor the Pi's networking is at fault. Expect it to clear; re-run rather than
  treating it as standing.
- **Four plans shipped signed `pending:`**, on his instruction, listed in the record. Eighth release running.
- **The Pi build caches are 958–961 MB against a 1024 MB ceiling** on both clones. They will cross it soon.
- **Carried, re-measure each:** the restore drill, never exercised; the Worker-fallback 44-second gap.
  **`tee` under PowerShell still writes UTF-16** — read his terminal for the production deploy's own lines,
  which is how it was done this time.

**Next free migration number: `0318`.** `0317` is the highest on `main` and both databases read 318 of 318
with nothing applied that has no file. Check `origin/main` *and* open `*-schema` PRs anyway.
