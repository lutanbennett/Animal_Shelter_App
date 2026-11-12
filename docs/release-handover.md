# Release handover — written 2026-11-12 after `0.44.3`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-11-0-44-3.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.44.3`**. `test.lannacare.org` is test on the dev
project and `uat.lannacare.org` is UAT on its own project (`fsjagxmxjosauwmxwype`), both also
`0.44.3`. All three databases hold **360** migrations, 0 pending, no drift either direction.

**The three hosts did NOT all build from one commit this time** — `main` moved twice mid-release, so
the builds come from `5867f864`, `6218fd73` and `f2c1b996`. **That is fine and was checked:** the
allow-list code-identity diff is **empty for both moves**, and the only differences are
`docs/planner-handover.md`, a test plan and `docs/backlog.md`. Report code identity, never SHA
equality — that property stays retired.

**`0.44.3` did NOT mail**, on Lutan's instruction given in words (*"no email"*). `major: false`, and
the deploy said so itself: `no major release new to production (was 0.44.2), so no email.`

The public site is **still locked** — read from the deploy's own binding list, `PUBLIC_SITE ("locked")`.

**DONE 2026-11-12 — the two cards `0.44.0` added are held at last.** Lutan assigned `approve_text` and
`diet_settings` right after this release; **measured on production, not taken on his word.** The text
waiting since `0.44.0` can now be approved. **Do not raise it again** — measure it, don't quote this line.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat <deployed>..origin/main`,
`gh pr list`, `--status` on all three, `/api/version` on all three hosts.

## ASK ABOUT THE EMAIL, NEVER "MAJOR OR MINOR"

He answered it himself again, unprompted — *"Lets do a minor release no email and note gaps in test
plans"* — and **that one sentence answered both decisions**, the email and the `pending:` test-plan
question. **Four releases running.** Do not ask him twice for what that sentence already settles.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT — IT IS NEW AND IT COST LUTAN TWO PRESSES

**If a deploy dies with *"The request to Cloudflare's API timed out"*, do NOT just retry. It is DNS on
the build machine, and one log read settles it.**

This is what `0.44.3` got wrong. Production's Worker deploy failed **twice**, and the second failure
was avoidable: the release manager told Lutan the network was flaky and running it again was the right
response, which was a guess presented as a diagnosis.

What it actually is, measured:

- The wrangler log (`…/xdg.config/.wrangler/logs/wrangler-*.log`) names the failing call: the
  **first** API request of the deploy, a `GET …/workers/services/lanna-animal-care` **before any
  upload**, dying after **10.8 s** with `errorType: ConnectionTimeout`.
- A **cold DNS lookup of `api.cloudflare.com` took 12.1 s** on this machine, twice, while every other
  host answered in under 70 ms. **12.1 > 10, so the first call can never connect.**
- Bandwidth is **not** the cause: 24 MB/s down, 7.8 MB/s up, ~40 MB payload.
- **Nothing is part-uploaded when this happens**, because the call that dies is a read that precedes
  the upload. Check the live version before assuming damage; here the Worker still answered `0.44.2`.

**The workaround, which worked first time:** warm the cache in the same command.

```
Resolve-DnsName api.cloudflare.com -Type A | Out-Null; node scripts/deploy.mjs --env production --skip-build --no-mail | tee .local/deploy-<ver>-retry.log
```

**`--skip-build` is the other half of the saving** — the failed attempt's build is still good, so the
retry is a ~20-second upload instead of another ~40-minute build. It is safe because `deploy.mjs`
still asserts the bundle carries that environment's Server Actions key (`builtKeyProblem`), so a
wrong-environment bundle is refused rather than shipped. Confirm it independently if you want: only
the target project's Supabase id should appear in `.open-next/assets/_next/static`.

**Two consequences worth knowing.** The same resolver fault caused six Supabase read timeouts and a
migration dry-run timeout in this release, so expect them and retry rather than reporting a database
problem. And **`check-public-views` fails with zero assertions and exit 1** when it bites — read the
exit code, never the count alone.

**The durable fix is Lutan's, not yours:** the NordLynx adapter is up advertising Nord's DNS servers
(`103.86.96.100`) with NordVPN not running, which is how a lookup goes from 4 ms to 12 s. A system
network setting. **It was not needed to ship, so do not block on it**, and he has not asked for it.

## THE PI: THE RULE NOW HAS A MECHANISM

**`deploy-pi.sh` enforces one build at a time as of this release** (#1495, per-machine `flock` at
`/tmp/lanna-pi-build.lock`, `docs/decisions/2026-11-11-pi-build-lock.md`). It refuses and names what
is building. So the prose rule that `0.44.2` had to correct is no longer only prose.

**Still run them one at a time and read each one's closing lines**, because the lock protects you from
the OOM killer, not from mistaking a git-updated clone for a deployed one. The Pi has 4 GiB and
`setup.sh` step 2b records that `next build` **peaks above 6 GB** there. Here the UAT build ran alone,
took the lock cleanly, and reported `serving 0.44.3 as expected`, `check-assets` identical to the build.

**One Pi build alongside one Worker deploy is still fine** — different machines. That is the
parallelism to use, and this release used it.

**Pin the Pi build to the shipped SHA** (`--ref <sha>`), not `main`'s tip. Done here for UAT. The
`0.38.1` trap is rebuilding a Pi to chase a moved SHA; when the code-identity diff is empty there is
nothing to do.

**TEST THE PORT, NOT THE PING** — carried from `0.44.2`, where it cost a touch. **ICMP is blocked on
that box**, so a failed ping proves nothing and "the Pi is down" is the wrong conclusion:

```bash
timeout 8 bash -c 'echo > /dev/tcp/192.168.68.81/2222' && echo OPEN
```

**The journal is persistent now** (`Storage=persistent`, capped 500 MB, folded into
`scripts/pi/setup.sh` step 2c). **Survival across a reboot is still unproven on purpose** — the
production host was not rebooted to find out. After the next reboot, `journalctl --list-boots` showing
more than one entry is the proof.

## A RACE THAT WILL BITE AGAIN: `npm ci` IN THE MAIN CHECKOUT

The first UAT Worker attempt exited 1 with `Cannot find module 'wrangler/package.json'`. The daily
`guarded-install.mjs` was running `npm ci` in the main checkout and had `node_modules` down to **109
entries** (it finished at 486, with `.package-lock.json` present, which is the marker of a complete
install).

**Wait it out. Do not install over the top of it, and do not conclude a script is broken.** If a
deploy fails on a missing module, check for a running `guarded-install.mjs` or `npm ci` before
anything else — `Get-CimInstance Win32_Process` showed it in one call.

## WHAT THIS RELEASE MEASURED, SO YOU NEED NOT RE-DERIVE IT

- **`check-public-views --env production`: 476 → 480 `ok`, 0 failures either side**, and the diff is
  exactly four added lines — `maintenance_job_picker`, `resident_photo_list` and `0357`'s two adopter
  functions, **all refused to anonymous visitors.**
- **`table-policy-commands`: 77 lines before and after, diff empty.** If you compare against an older
  record, note the records count **total output lines**, not `no policy` lines — counting the latter
  gives 74 and looks like a regression that is not there.
- **The four card checks are clean**, and `activities-grantable` matches its allow-list: 85 activities,
  5 Admin-only on purpose, **14 UNRULED**. This release added none of the 14.
- **Card grant changes take effect at the DEPLOY, not at the migration.** `0355` changes what the Bills
  card grants, but that lives in `src/lib/cards.ts`, so `role-cells` does not move when the migration
  applies. Run the card checks **after** the deploy; a cut plan predicting otherwise is wrong.

## THE TEST-PLAN POSITION, WHICH IS NOT A PROBLEM TO SOLVE

**34 PRs, 34 completed plans, one each, every one `Result: pass`.** That is the pre-deploy check in
`docs/release-smoke-test.md`, and it passed.

**18 of the 34 carry `pending:` on manual verification and 16 are reasoned `n/a:`.** Lutan asked for
these to be *noted*, which the record does. **`pending:` with a reason is an accepted state since
2026-11-05, so none is a defect** and none blocks anything. Worth a person's time:
`login-inapp-browser` (the headline change, unchecked on a real phone) and the three
`refusal-keys-group-*` plans (Thai nobody independent has read).

**`test-plan` stays advisory. Do not raise promoting it — that was settled on 2026-10-20.**

## WHAT IS NOT DONE, AND IS NOT YOURS TO DO

- The DNS resolver setting on the build machine (Lutan's; a system setting).
- The 14 UNRULED activities (a ruling, recorded, not failing).
- The 18 `pending:` manual checks (people and later events).
- ~~`approve_text` and `diet_settings` held by nobody~~ — **done 2026-11-12**, both on Management.
