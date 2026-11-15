# Release handover — written 2026-11-15 after `0.47.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-15-0-47-0.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.0`** — a **major release, and it mailed**.
`test.lannacare.org` and `uat.lannacare.org` serve `0.47.0` too. All three Pi clones were built from
the cut `ca23f2c27` and all three hosts answer `x-lanna-served-by: pi`.

Five migrations — `0375`, `0377`, `0378`, `0379`, `0380`; **there is no `0376`**, a number a stream
gave back. Applied to all three databases, 0 pending, **no drift either direction**, both schema
assertions answered through the Management API. `0375` took the tenancy lint from **225 flagged to
zero** on production, test and UAT.

**ONE THING IS NOT DONE, AND IT IS THE FIRST THING YOU SHOULD FIX: UAT's Worker is still on
`0.46.0`.** Its Pi, which is the origin, serves `0.47.0`, so nobody sees a wrong page — but UAT's
**fallback** is a release behind, and a fallback matters precisely when things are already going
wrong. Your UAT deploy closes it. Read the next section before you plan your order.

**Re-measure before trusting any of this.** `git fetch`, `gh pr list`, `--status` on all three,
`/api/version` **and** `/api/releases/current` on all three hosts. The second endpoint is the one
that exposed the UAT gap: it reports the **Worker's** version whatever the Pi is serving.

## DEPLOY UAT'S WORKER *BEFORE* YOU HAND PRODUCTION'S TO LUTAN. THE RUNBOOK'S ORDER COST ME A DEPLOY

This is the one thing in this edition most likely to bite you, and it is cheap to avoid.

`deploy.mjs` refuses a UAT deploy unless `src/lib/releases.ts` has an **empty `unreleased` list**:
*uat ships only a written-down release*. That guard is right — UAT's database holds production's real
people, so it must never serve unreleased work.

**What happened.** The runbook puts UAT last, after Lutan's production Worker. His build took around
twenty-five minutes. In that window three feature PRs merged (#1603, #1604, #1605), and #1605 put two
notes into `unreleased`. By the time UAT's turn came, `main` was no longer a written-down release and
the deploy exited 2. **There is no flag, and do not go looking for one** — emptying `unreleased` to
get past it is exactly the workaround the rules forbid, so the right outcome was to record it and
stop. It is backlog item `#uatwk` and defect 4 in the record.

**The fix costs nothing: run test, then UAT, then hand Lutan production's.** The runbook's reason for
putting UAT last is *"his is the one that must not be killed"* — and that reason is **better served**
by his going last, because then nothing of yours runs after it at all. Deploying UAT while the tree is
still the released tree removes the race entirely.

**Whatever order you choose, `main` moves during a release and you must measure the SHA per build.**
Mine did: the Pi builds and test's Worker came from `ca23f2c27`, and the production Worker from
`737549902` after those three PRs merged. Read each build log's own `built from` line.

## `lanna-pi.local` ONLY WORKS FROM THE HOME NETWORK, AND THE MESH IS NOW AN ALIAS

**`ssh lutan@lanna-pi.local` timed out, and it reads exactly like a dead Pi.** The Pi was completely
fine. The laptop was on a different network, and the ssh config aims at the FR205's forward, which
admits only this PC's two home addresses.

**Do this first, before you conclude anything about the Pi:**

```bash
for h in lannacareforanimals.org test.lannacare.org uat.lannacare.org; do curl -sI "https://$h/login" | grep -i x-lanna-served-by; done
```

Three `pi` answers mean the Pi is healthy and the **path** is broken, not the box.

**The route is `ssh lanna-pi-mesh`**, a NordVPN Meshnet alias added to `~/.ssh/config` on 2026-11-15
with Lutan's go. It works from home too, so there is no need to decide which network you are on. It
is **port 22, not 2222** — the mesh reaches the Pi's own sshd with no forward in front of it. All
three of this release's Pi builds ran over it with no other difference. `ssh -G lanna-pi-mesh` is the
one-line check that the alias is still there. `docs/release-procedure.md` now names all of this in
the Pi section. **Do not put the mesh to Lutan as a question** — it is already his decision.

## THE DEFERRED-NOTE STEP COST ONE ADDED NOTE, SO THE `--verify` BASE HAD TO BE HAND-BUILT

`0.46.0` added none and ran `--verify` against plain `origin/main`. **This release added exactly
one** — the 90-day report-photo retention note, whose manual step this release closed — so
`origin/main:src/lib/releases.ts` was no longer the pre-cut state and the count assertion failed by
exactly one.

**Try plain `origin/main` first**, as `0.46.0` advised; build a base only when the count assertion
fails, and then by exactly the notes your cut added. Mine then passed all 17 assertions first time
with `nothing invented (note count equal) [7 vs 7]`, and that equality **is** the evidence that six
notes were carried character-identical and one was added on purpose.

Ten candidates were in range; reading each one's own test plan settled that **one** had its step
closed by this release. Budget a lookup per candidate — it is the step that makes the release-note
truth rule real rather than decorative.

## WHAT COST TIME, AND MOST OF IT WAS NOT MINE

- **The unreachable Pi** — one touch of Lutan's, and the only one of the three that was avoidable by
  somebody. Both halves are now fixed at source: the runbook section and the ssh alias.
- **`python` is the Microsoft Store stub on this machine.** Any heredoc through it dies with an
  install prompt. Use `node -e`. **Bash heredocs with nested quotes also failed twice** — writing the
  file with the Write tool is the reliable route, and I lost time to this three times in one release.
- **PowerShell's `tee` buffers, and the log looks frozen.** Lutan reasonably read a 17 KB log that
  had not changed for minutes as a finished deploy; it had another twenty minutes to run. Check
  `.open-next`'s newest file timestamp, the node processes' memory, and `/api/releases/current`
  instead. And his log is **UTF-16**, so `grep` matches nothing on it without `tr -d '\000'`.
- **A Pi build that looks like it finished in 20 seconds has not.** Read the log: mine said
  `Compiled successfully in 87s` plus two 25-second PDF renders, with a warm 802 MB Turbopack cache.
  Suspect the reading, not the box — but then go and settle it.

## THINGS THAT ARE NOW ROUTINE — STOP TREATING THEM AS OPEN

- **The release mail is read from the message, not left for a person.** Third release running. One
  Gmail query gives the subject (`[Production] …`), the sender name (`Lanna Care Production`, which is
  the check that would catch a UAT Worker mailing real admins) and the recipient list, and the deploy
  log says `sent 1, skipped 1` independently. **Never put it on a manual list.**
- **`lannacareforanimals@gmail.com` skipped with `E_RECIPIENT_NOT_ALLOWED` is expected**, not a
  delivery failure. The shelter's own address is refused by the relay; it is a known open question.
- **A Claude session runs the UAT apply and nothing prompts**, and `assert-schema --env uat` answers
  from the Management API.
- **The Pi's six sudo rules are all present**; the UAT clone restarts itself, no password.
- **One sentence from Lutan settles major, mail and the testing gaps.** Seven releases running.

## THE PI: THE POWER ALARM IS STILL QUIET, SO RE-READ IT RATHER THAN CARRYING IT

`0.45.0` recorded three reboots since 11 November, one with no shutdown sequence. **Still no further
reboot** — one unbroken boot, now about three days. **Still NOT ESTABLISHED** what caused the three,
and still hardware and Lutan's. **Re-read it next release instead of repeating the alarm.**

## WHAT IS STILL OPEN, AND NONE OF IT IS YOURS TO CLOSE ALONE

- **UAT's Worker deploy** — above, and item `#uatwk`.
- **The Thai sign-off.** A reader has been through the strings; the signature has not been given.
  **This remains the largest standing gap in the project**, and `#y1dqu` is the weekly routine for it.
- **`table-policy-commands` is overtaken, not solved.** It could not be reconciled with either of the
  last two records (80 lines / 77 `no policy` today against 76 and 78, same applied set, same code).
  **After `0375` the answer is zero on every table**, so close it as overtaken and do not re-derive it.
- **A signed-in look at the new screens on production.** While the public site is `locked` a
  signed-out check only sees the redirect, and Claude has no production account.
- **The phone checks** on the merchandise and report screens, and three **click-throughs** the record
  lists by name.
- **The Cloudflare rate-limit rule** for the report form (`#8t3rk`), the two open steps on the
  **foundation document store** (no card assigned, and Lutan's go on the information protection), the
  shelter's **PromptPay id and QR image**, and where the **nightly backup** runs from — check Drive,
  **never `backup.log`**, which is 0 bytes and dated 4 October.

## THE TWO TOUCHES THAT ARE HIS BY RULE, AND STAY HIS

**Major versus minor**, because it mails every admin and cannot be undone, and the **production Worker
deploy**. This release took **three** touches against a target of two; the third was the unreachable
Pi, and it is the one the runbook fix is meant to prevent happening again.
