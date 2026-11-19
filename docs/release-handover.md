# Release handover — written 2026-11-19 after `0.47.3` and `0.47.4`

A **delta**. The durable rules are in `docs/release-procedure.md` and the two releases' own records are
`docs/releases/2026-11-19-0-47-3.md` and `docs/releases/2026-11-19-0-47-4.md`. **All three outrank
this file.**

**This edition covers TWO releases, and it is the SECOND edition running to say that.** The previous
one opened by naming the same fault on `0.47.1` and warning *"if you are reading this after a release
you ran, write the next edition in the record's PR"* — and then `0.47.3` and `0.47.4` both shipped
without one. **Both times it surfaced only because Lutan asked outright.** Three occurrences, every
one caught by him and never by us. Nothing checks for a stale handover; `#hndvr` now asks for a check
that would. **Until it exists, this is on you: write it in the record's PR.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.4`** — a **minor release that mailed nobody**.
`test.lannacare.org` and `uat.lannacare.org` serve `0.47.4` too. All three Pi clones **and all three
Workers** were built from `a50122039`, and all three hosts answer `x-lanna-served-by: pi`.

**Production holds every migration on `main`: 416 applied, 0 pending, 0 drift either way.** UAT is the
same. Test's database (dev) was already current.

**Re-measure before trusting any of this**, and read **both** endpoints on all three hosts:
`/api/releases/current` reports the **Worker's** version whatever the Pi serves. That is not theory —
it is how `0.47.3`'s half-finished state was visible at all.

## What the two releases were

**`0.47.3`** (minor, no mail): 35 PRs, eight migrations `0408`–`0415` — Product admin gaining
create-a-shelter and address mapping, per-shelter calendar credentials, writer-run visibility.
**Its production Worker was never deployed.**

**`0.47.4`** (minor, no mail): 5 PRs, **no migrations at all**, the first since `0.47.0` — a second
shelter's own Google Drive (`#cn7gk`, proved end to end) and a new shelter's Admin role and first
login. **Its production deploy closed `0.47.3`'s leftover**, `0.47.2` → `0.47.4` in one command.

## The fault that cost `0.47.3` its production Worker

Lutan's deploy is **last** and it is **his**, which makes it the step most exposed to `main` moving
underneath it. `0.47.3` took three attempts across the better part of an hour; a feature stream merged
into that gap; and the next attempt was refused:

```
deploy: production deploys only from a clean, pushed main:
  - main and origin/main differ (1 behind / 0 ahead)
```

**Both refusals are correct and neither has an override** — read in the source, not from the message:
`releaseProblems()` (`scripts/lib/release-guards.mjs:24`) refuses while `unreleased` has notes, and the
clean-pushed-main guard (`scripts/deploy.mjs:304–316`) is a bare `exit 2`. Once a stream merges **the
tree stops being a written-down release and there is nothing to retry.** Do not look for another path.

**Say this out loud when his deploy fails once: the window is closing.** The procedure already moved
UAT *ahead* of his command for this reason (`#uatwk`, `0.47.0`); `0.47.3` is the first time it reached
production. **Deferring was safe only because those migrations were purely additive**, so `0.47.2`'s
code ran correctly against the newer schema — **check that every time; `0.47.2`'s own record says the
opposite about its eighteen.**

## IPv6: the fault behind six failed steps, now measured

The deploy machine prefers IPv6 and **has no IPv6 address at all**. DNS still answers with one, so a
client that takes the first address and does not fall back stalls until its own timeout.

| | Font fetch | Cloudflare API |
|---|---|---|
| **IPv6 preferred** (`0.47.3`, first half of `0.47.4`) | 3 failures | 2 failures |
| **IPv4 preferred** | **0** | **0** |

**Why every diagnosis came back clean, and this is the general lesson:** `curl` and Node both do Happy
Eyeballs and silently fall back, so seventeen successful fetches of the exact failing URL "proved" the
network was fine — twice. **Turbopack fetches Google Fonts in its own Rust client, which does not fall
back**, and `wrangler` behaves the same against Cloudflare's API. **A reachability test run with a
forgiving client is not a reachability test**; `curl -4` against `curl -6` settles it in ten seconds.

**The fix, which Lutan runs elevated and reverts afterwards** — `netsh interface ipv6 set prefixpolicy
::ffff:0:0/96 45 4`, and `… 35 4` to restore. **It is reverted now, so assume the fault is live.**

**One refinement on `0.47.3`'s record, which was too confident:** the font half is **intermittent** —
it succeeded four times running even with IPv6 preferred, including in a fresh worktree where the
fonts genuinely had to be downloaded — while the **Cloudflare half is what the preference reliably
breaks.** Same cause, different severity.

**`#fntlc` is the permanent fix**: serve the five Google fonts (`Fraunces`, `Geist`, `Geist_Mono`,
`Noto_Sans_Thai`, `Source_Sans_3`) from the repository with `next/font/local`, so no build ever needs
the network. Until then, expect to ask him for the `netsh` line before his deploy.

## The Next.js advisory halt is GONE — delete it from your expectations

The previous edition gave it a section and told you it would interrupt you in three places. On
`16.4.6` (PR #1699) **it did not occur once** across two releases: the gates builds, six Pi builds and
six Worker builds, all first time. Treat the old warning as history. `brief-blocks.md` still describes
it as live and should be rewritten.

## Product administrators now exist

**Lutan is the first product administrator on production** (2026-11-19), placed by
`scripts/add-product-admin.mjs` — dry run by default, `--apply` plus `--confirm <address>`, idempotent,
and it **refuses to remove the last one** because an empty list cannot be added to through the app.
`0411` seeds nobody on purpose, so the first row must come from outside RLS; nothing did that until
now, which is why the screen shipped **live and unreachable** in `0.47.3` and gained a second
unreachable capability in `0.47.4`.

**He has since driven it**, closing presses four test plans had left `pending:` across two releases —
**and it found the next blocker:** a PADMIN can **link** an existing login but cannot **create or
invite** one, so a shelter still cannot be onboarded end to end. That is `#flogn`.

## Traps still live, and the new ones

- **The harness's completion notification reports the WRAPPER's exit code, not the work's.** Both
  failed Worker deploys were reported `completed (exit code 0)` while `EXIT=1` sat in the output. Write
  `cmd > log 2>&1; echo "EXIT=$?"` and **read that line**, never the notification.
- **A command is not verified until it is verified as the person will paste it.** The `netsh` line went
  to Lutan with a trailing backslash from a code block and failed on *"The parameter is incorrect"*.
- **A launcher `ssh` returning is not the Pi build starting**, and **silence is not a stall.** One UAT
  build was reported away and had never run (the clone's HEAD proved it; read the log's byte count);
  a Worker build sat on one line for five minutes while `node.exe` burned 253 seconds of CPU
  (`Get-CimInstance Win32_Process` is the instrument).
- **`check-shelter-settings.mjs` counts shelters WITH SETTINGS, not shelters** — it answered
  `1 shelter(s)` while production held two. Read `public.shelters` when you mean shelters.

Still true: **Git Bash lies about line endings**, **`python` is the Store stub**, **bash heredocs with
nested quotes fail** (use the Write tool), **`pgrep -f "deploy-pi.sh"` matches its own ssh**.

## The Pi: the mesh is the route, and it can drop too

`lanna-pi.local` timed out throughout both releases; **all six Pi builds ran over `lanna-pi-mesh`**,
as the runbook already says. **New this time: Meshnet itself dropped**, so both routes failed together
for several minutes — the laptop had `NordLynx` and `NordWhisper` tunnels up, which alone explains the
home route failing, and Lutan restored Meshnet when asked. **That is the only case where the Pi is
genuinely unreachable and it is worth asking him about**; everything else is the runbook's three-`pi`
check, which held throughout (the box was up 6 days, load 0.00).

## What is still open

- **`#flogn` — the clearest next job, and it needs HIS decision first.** A PADMIN cannot create or
  invite a shelter's first login. **Do not reach for widening `security.createUser`**: a shelter's own
  Admin can grant themselves that card, which would hand every Admin the ability to mint logins.
- **`#fntlc`** — local fonts, above. **`#pdmin` is CLOSED**; do not re-raise it.
- **The Thai sign-off, SEVENTH release running** (`#y1dqu`); both releases added strings. **Still the
  largest standing gap.** Likewise **a signed-in look at production**, which Claude cannot do: the
  public site is `locked` and it has no account there.
- **`sync-home-icons.mjs --env production` has not run for two releases** — cosmetic, the Drive folder
  only. Carried forward unclosed: the per-shelter policy click-throughs, `/admin/security` with a real
  code, the **Cloudflare rate-limit rule** (`#8t3rk`), the **PromptPay id**, the e-Donation screens.

## Now routine — stop treating these as open

- **`#shtci` is closed**, and `#uatwk` and `table-policy-commands` before it. **`#swrun`'s production
  step is done**: `0413` is on, and the strict tenancy lint went `125 of 125` → `128 of 128` with
  **0 flagged either side** — measure it that way, before and after, not after alone.
- **`deploy.mjs --plan`'s mail line is cosmetically wrong.** It says *"a major release … would be
  mailed"* on every release that is not `--no-mail` or UAT, never reading the `major` flag
  (`scripts/deploy.mjs:389`). **The real deploy is correct**; its `no major release new to <env>, so no
  email` line is the measurement. Do **not** pass `--no-mail` to production to be safe — it suppresses
  that line. And **`check-deferred-notes.mjs` ignores the range you give it** (8 candidates for a 5-PR
  release); under-listing is the fault it prevents, so read the extras rather than narrowing it.
- **One sentence from Lutan settles major, mail and the gaps.** Eleven releases running. **But ask
  about the mail when he has not said**: *"lets try a new release"* settles neither.

## The two touches that are his by rule, and stay his

**Major versus minor**, and the **production Worker deploy**. Against a target of two touches,
`0.47.3` cost him **four and still did not finish**, and `0.47.4` cost **three** — the deploy, the
`netsh` change, and restoring Meshnet. Every one of the extras was the machine's network, not the
software.
