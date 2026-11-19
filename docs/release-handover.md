# Release handover — written 2026-11-20 after `0.47.5`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-20-0-47-5.md`. **Both outrank this file.**

**The handover was missed on three releases running and only ever caught by Lutan asking.** It is
written here, in the record's own PR, as rule 3 requires. `#hndvr` asked for a check and **it now
exists**: `scripts/check-release-handover.mjs` (#1733, advisory) fails when this file's first line
does not name the newest file in `docs/releases/`. So the instrument is no longer missing — but it is
advisory, and it cannot tell you the *contents* are current.

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.5`** — a **minor release that mailed nobody**.
`test.lannacare.org` and `uat.lannacare.org` serve `0.47.5` too, and **there is a fourth host now**:
`cooperjaidee.org`, the platform front door, which went live in this deploy. All four answer
`x-lanna-served-by: pi`, and all three Workers are `0.47.5`.

**Production and UAT both hold every migration on `main`: 422 applied, 0 pending, 0 drift.**

**Re-measure before trusting any of this, and read BOTH endpoints on all hosts.**
`/api/releases/current` reports the **Worker's** version whatever the Pi serves. This release passed
through that half-state twice on purpose, and `0.47.3` shipped in it.

## What `0.47.5` was

23 PRs, six migrations `0416`–`0421`. The operator console moved off `/admin` onto
`cooperjaidee.org`, with the **six console writes that `0419`–`0421` fix**, a per-shelter setup
checklist, add-or-link a login by email, and a receipts form. Everything else was instruments,
scripts and documents. **Two notes, both `admin: true`.**

## THE ONE THING TO READ BEFORE YOUR NEXT CUT: `unreleased` MAY BE EMPTY AND WRONG

**Eleven streams and 23 PRs merged, and `unreleased` was `[]`.** All 64 changed test plans had
answered the release-notes line `n/a`, each with a reason that held up **about shelter users** — and
missed that the release **deleted the Product admin tile and page from Settings**, which Admin had
used that same day.

- **`cut-release.mjs` refuses to write while `unreleased` is empty.** That refusal is what surfaced
  it. Treat it as a question, not an obstacle.
- **When you meet it, measure rather than accept it:**
  `git log <previous cut>..HEAD --name-only -- src/app src/components src/lib/manual src/lib/i18n worker`,
  then `check-deferred-notes.mjs`. Four changes and 64 `n/a` answers was the state here.
- **Ask who the change is visible to, not whether it is visible.** `admin: true` notes exist for
  exactly the case the `n/a` reasons keep missing: a product administrator or Admin is not a shelter
  user, and is the only person who reads release notes.
- **Do not invent visibility to fill the list.** The first candidate here was the stocktaking failure
  message, and its own plan says `0417` backfilled every shelter so nobody can reach it. **Read the
  plan, not the diff.**
- **The underlying process fault is the planner's** and is filed: the ordinary route produced no
  user-facing note from eleven streams of real work.

**`check-deferred-notes.mjs` is a REAL GATE on a release, not advisory.** `cut-release.mjs` refused
outright until all 16 flagged PRs were reviewed by name through `--deferred-reviewed "<one line
each>"`. Budget a few minutes for it, and know that five of the 16 "reasons" are the rule's own text
quoted into a plan, which makes the list longer than the real question.

**`--verify` needs an explicit base whenever the cut publishes a note added in the same PR** — which
is now the normal case, not the exception. Copy the working file aside **before** running the cut;
that file is `origin/main` plus exactly your notes. Plain `origin/main` fails two assertions on a
count that is correct.

## Traps that cost something this time

- **The harness's completion notification reports the WRAPPER's exit code.** A failed Pi launch was
  reported `completed (exit code 0)` while the real code was **255**. **Third release running.** Write
  `cmd > log 2>&1; echo "EXIT=$?"` and read **that** line, never the notification.
- **PowerShell's `Tee-Object` writes Lutan's deploy log as UTF-16LE**, so a plain `grep` of
  `.local/deploy-<version>.log` matches **nothing at all**. The file was 27,966 bytes and read as
  empty. **This is a second mechanism for the false conclusion the procedure already warns about** —
  deciding the handover was ignored; the first is `tee`'s buffering. **Check the size, then decode:**
  `tr -d '\000' < .local/deploy-<v>.log | grep …`. The BOM `377 376` is the tell.
- **A red dry-run can mean "apply".** `0420` failed with *cannot change return type of existing
  function* on both databases, because `0417`'s drop-and-recreate had been rolled back. The runner
  says so itself — **and check it in the files anyway**: the two return shapes were character-identical,
  which is the thing that makes the real apply work.
- **`deploy.mjs --plan`'s mail line is cosmetically wrong**, third release running: it picks between
  three fixed strings from `--no-mail` and `uat` alone (`scripts/deploy.mjs:392–395`) and never reads
  the `major` flag, while the real path calls `majorReleasesSince` at line 467. **Verify it in the
  source before you reassure Lutan**, because the line numbers move — `0.47.4`'s record said 389. Do
  **not** pass `--no-mail` to production to be safe: it suppresses the proof line.
- **`n/a: ` needs its reason immediately.** `n/a at the cut: …` fails `check-test-plan.mjs`. A cut plan
  also **cannot tick the release-notes line**, by construction.

## The Pi and the network

`lanna-pi.local` timed out throughout, as every release; **all three Pi builds ran over
`lanna-pi-mesh`**. **Meshnet dropped mid-release for the second release running**, after test and UAT
had used it — both routes then timed out while all four sites stayed healthy on `pi`. **That is
Lutan's second touch and the only thing he was asked for besides the deploy.** Ask him to turn Meshnet
back on; it worked first time afterwards.

**Read the served headers before concluding anything about the Pi.** Four `pi` answers mean the box is
fine and your route is broken:
`for h in lannacareforanimals.org test.lannacare.org uat.lannacare.org cooperjaidee.org; do curl -4 -sI "https://$h/login" | grep -i x-lanna-served-by; done`

**IPv6 is still preferred on this machine and it still has no IPv6 address** — Lutan reverted the
`netsh` fix after `0.47.3`, so the fault is live. **Use `curl -4` for everything.** Nothing failed
this release because of it, and `#fntlc` landed (local fonts), so no build needs Google Fonts at all
now: the font half of that fault is gone for good.

**The scoped Cloudflare API token held.** `--plan` showed wrangler using
`.env.deploy.production`'s token rather than its own OAuth login, and nothing expired mid-upload. The
`0.47.1` failure did not recur.

## `cooperjaidee.org` — new, and what is still unproven

The deploy created all four custom domains itself and both Cooper addresses answered 200 at once. The
zone must be **empty** for that: it held 0 of 200 records. **TRAP: Cloudflare's Recommendations panel
urges adding apex and `www` records, and following it breaks the deploy**, which refuses to overwrite.

**The address opening proves nothing.** Section F's real check is **signing in there, doing the
authenticator step, and saving a web address** — a missing allowed origin refuses every button while
every page renders. **Still outstanding, and it needs Lutan.**

## What is still open

- **`#flogn` — the clearest next job, and it needs HIS decision first.** A product administrator can
  link an existing login but cannot **create or invite** one, so a shelter cannot be onboarded end to
  end. **Do not reach for widening `security.createUser`:** a shelter's own Admin can grant themselves
  that card, which would hand every Admin the ability to mint logins.
- **`shelterError` maps every `42501` to "your second step has expired"**, which is why six broken
  writes hid for a day. A policy refusal is not an expired step-up.
- **`dev-signin.mjs <role>` breaks (`PGRST116`) once two shelters each hold a role keyed `admin`** —
  the intended end state. Plan around it.
- **The Thai sign-off, EIGHTH release running** (`#y1dqu`). **Still the largest standing gap.**
  Likewise **a signed-in look at production**, which Claude cannot do: no account there.
- Carried forward: the per-shelter policy click-throughs, `/admin/security` with a real code, the
  Cloudflare rate-limit rule (`#8t3rk`), the PromptPay id, the e-Donation screens.

## Now routine — stop treating these as open

- **`sync-home-icons.mjs` is done and the backlog of two skipped releases cost nothing**: 536 images,
  **536 unchanged, 0 updated**. Run it, but do not treat a missed one as damage.
- **`#pdmin` is CLOSED** (Lutan is the first product administrator) and **`#fntlc` is CLOSED** (local
  fonts). Do not re-raise either.
- **Merge on green with no approval round-trip**, every PR. **`test-plan` is advisory, permanently.**
  Neither is a decision he owes.
- **`audit` runs for real on a cut** (it changes `package.json`) and `skipped` elsewhere is not a pass.
  `audit:register` exiting 0 means *registered and unreachable*, which is what to write — not "clean".

## The two touches that are his, and stay his

**Major versus minor**, and the **production Worker deploy**. Against a target of two,
`0.47.5` cost him **exactly two** — the deploy, and restoring Meshnet. **That is the target met for
the first time in four releases**, and the only extra was the machine's networking again.

**One thing he settled this release that is worth not re-deriving:** told plainly that eleven streams
were shipping under a patch label, and offered `0.48.0`, he answered *"Keep 0.47.5"*. **The version is
derived from the mail answer, never from the word "minor"** — and he is content with that.
