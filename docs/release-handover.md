# Release handover — written 2026-11-13 after `0.45.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-12-0-45-0.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.45.0`** — a **major release, and it mailed**.
`test.lannacare.org` and `uat.lannacare.org` are both on `0.45.0` too. All three databases hold
**367** migrations, 0 pending, **no drift either direction**.

**Five of the six builds came from ONE commit, `15854dd4`; the sixth did not, and saying so is the
point.** `main` moved two backlog commits (`46ceb197`) while the record was being written, so the UAT
Worker — deployed last — built from the later tip. **Report code identity, never SHA equality**: the
diff between the two is exactly `docs/backlog.md`, and filtered to everything outside `docs/` it is
empty. An earlier draft of this file said "all from one commit", which was **true when written and
false an hour later.** A claim about SHAs decays; a claim about code identity does not.

**The public site is still locked** — read that from the deploy's own binding list, not from here.

**Re-measure before trusting any of this.** `git fetch`, `gh pr list`, `--status` on all three,
`/api/version` **and** `/api/releases/current` on all three hosts.

## THE DNS FAULT IS GONE. DO NOT HAND OVER THE WORKAROUND BY DEFAULT

`0.44.3`'s handover led with this and was right to: a cold lookup of `api.cloudflare.com` took
**12.1 s** against a 10 s deadline, which killed production's Worker deploy twice and cost Lutan two
presses.

**Measured 2026-11-13, before handing the command over: the cold lookup is 0.1 s.**
`Get-DnsClientServerAddress` lists only the router (`192.168.1.1`, `192.168.68.1`) — **no NordLynx
adapter and no `103.86.96.100`.** Both Worker deploys this release ran first time.

So the `Resolve-DnsName api.cloudflare.com` prefix was **not** handed over, and should not be by
default: handing over a fix for a fault you have not measured is cargo cult. **Keep it as a
diagnosis, not a habit.** If a deploy dies with *"The request to Cloudflare's API timed out"*, read
the wrangler log before retrying, confirm the **first** API call is dying at ~10 s, then use the
warmed retry with `--skip-build`. The full reasoning stays in
`docs/releases/2026-11-11-0-44-3.md` and does not need recopying here again.

## ASK ABOUT THE EMAIL, NEVER "MAJOR OR MINOR"

**Five releases running he has answered both decisions himself, unprompted, in one sentence** — this
time *"Let's do a major release, email or be sent, gaps in testing to be noted"*. That settled the
email **and** the `pending:` test-plan question in the same breath. **Do not ask him twice for what
that sentence already settles**, and never offer him "major" and "minor" as the options.

## WHAT COST TIME THIS RELEASE, AND BOTH WERE MINE

- **`gates.mjs` was backgrounded through `| tail -30`, which discarded three of the four
  `=== gates:` lines.** The cut plan requires them, so the gates were re-run: **one wasted cycle,
  about six minutes.** The runbook names the `tail` trap in writing for deploys, and it applies to
  every script in it. **Use `| tee`, including when backgrounding.**
- **`table-policy-commands` was counted by hand** and gave 73 `no policy` lines, which read as a
  one-line improvement since `0.44.3`. Counted properly it is **77 total / 74 `no policy`,
  identical.** `0.44.3` recorded this same trap from the other direction. **Count it, and do not read
  it over.**

## THREE THINGS NOW CLOSED THAT EARLIER EDITIONS LEFT OPEN

- **The Pi's persistent journal is PROVEN.** `0.44.3` left it open deliberately, saying the next
  reboot would be the proof. `journalctl --list-boots` now lists **four** boots, including the
  2026-11-11 08:39 one `0.44.2` could not see. **Closed; stop carrying it.**
- **A Claude session can run the UAT apply, and nothing prompts.** The runbook said no session had
  ever run it, so the first would find out. It ran straight through, and `assert-schema --env uat`
  answered from the **Management API**, not the weaker direct-database route. **That line in
  `docs/release-procedure.md` can go.**
- **The note-audience question is measured, not pending.** `/releases` was loaded with two card-keyed
  logins: a `who_does_what` holder sees both tagged notes, a `my_tasks`-only login sees neither, and
  both see the untagged ones. `0.44.3` had to leave this to a person. **Closed.**

## NEW, AND NOT YOURS TO FIX: THE PI MAY BE LOSING POWER

The persistent journal paid for itself immediately. **The Pi has rebooted three times since
11 November** (11-11 18:18, 11-12 10:44, 11-12 14:57). The boot that ended at 14:59:48 stops dead
with **no shutdown sequence at all**, and the boot before it logged **2 under-voltage/throttling
entries**. That is consistent with a power fault rather than a clean restart.

**NOT ESTABLISHED:** that under-voltage caused the reboots. It is hardware and power — Lutan's, and he
has not asked for it. **It did not affect this release:** all three services were `active`, 3.1 GiB
was free, and all three Pi builds succeeded first time, run one at a time.

## BACKUPS: THE ALARMING READING IS THE WRONG ONE

`0361` rewrites rows, so the pre-production gate asks for a fresh backup. Two traps in a row:

1. **Taking one by hand refuses.** `BACKUP_GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN` are not in
   `.env.deploy.production`, and the script offers `--shared-drive-token` to borrow the app's token
   instead. **Do not take that flag** — the app's token is deliberately not used for backups, and a
   refusal's suggested remedy is not advice.
2. **`backup.log` is 0 bytes dated 4 October and no Windows task runs `backup.mjs`.** Read alone,
   that says production has never been backed up. **It is not true.** Drive holds nightly encrypted
   dumps at 20:00Z — newest `lannacare-production-2026-11-11T2000Z.dump.age`, older ones pruned.

**The gate is met by a backup about twenty hours old. Check Drive, never the log.** Open, for the
planner rather than for a release: where the nightly run actually lives.

## THE TEST-PLAN POSITION, WHICH IS NOT A PROBLEM TO SOLVE

**33 PRs, 33 completed plans, one each, none `Result: fail`.**

**19 of the 33 carry `pending:` on manual verification and 14 are reasoned `n/a:`.** He asked for
these to be *noted*, which the record does. **`pending:` with a reason is an accepted state since
2026-11-05, so none is a defect** and none blocks anything. Worth a person's time: the **Thai nobody
independent has read** (the offline page and the four `refusal-keys-group-*` plans) and the **phone
checks** on the adopter-media and bill-import pages.

**DO NOT PUT THE RELEASE MAIL ON A PERSON'S LIST. READ THE MESSAGE.** Its title and sender name sat
there for three releases as something only a person could check, and that was simply untrue: one
Gmail query returns the subject (`[Production] …`) and the sender name (`Lanna Care Production`).
Closed by measurement this release, `#w4k9n` with it. **That was this release's avoidable third
touch** — the one place to take a press off him next time.

**`test-plan` stays advisory. Do not raise promoting it — settled 2026-10-20.**

## WHAT IS NOT DONE, AND IS NOT YOURS TO DO

- **The Pi's power/under-voltage question** (new this release; hardware).
- The two open steps on the **foundation document store** — assigning either card in Settings, and
  Lutan's go on the information protection. Its release note is held back until both close, and
  `check-deferred-notes.mjs` will raise it again next release.
- The shelter's own **PromptPay id and QR image**, which is why `donate-promptpay-qr` published no note.
- The **19 `pending:` manual checks** (people and later events).
- Where the **nightly backup** runs from.
- ~~The 14 UNRULED activities~~ — **ruled: `0361` carried the last five of the fourteen.**
- ~~The DNS resolver setting on the build machine~~ — **gone, and measured gone.**
