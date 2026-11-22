# Release handover — written 2026-11-22 after `0.48.0`

This is a **delta** on the last edition, not a runbook. `docs/release-procedure.md` is the runbook and
outranks this file; `docs/releases/2026-11-22-0-48-0.md` is this release's record and holds the figures.
Where this file and either of those disagree, they are right.

## START HERE

**`0.48.0` is live on all four hosts, and it MAILED** — the first release to send mail in sixteen days.
Lutan asked for it in words (*"lets do a major release, email to be sent and note any gaps in test"*), so
the flag came from his answer and was then asserted, never inferred from the word "major".

**Production, `cooperjaidee.org`, test and UAT are all on `0.48.0` @ `050b44b0f`, both endpoints, every
one served by the Pi.** Production and UAT both hold every migration on `main`: `436 applied, 0 pending`,
`No drift` both ways. The tenancy catalogue lint `--strict` is **exit 0 on all three databases**, second
release running.

**MAILSTATUS**

**Cost to Lutan: COSTLINE.**

**Re-measure before trusting any of this.** Every figure here was read on 2026-11-22.

## THE LESSON OF THIS RELEASE: A GAP IN A TEST PLAN IS A PLACE TO LOOK, NOT A PLACE TO SIGN

He asked for the test gaps to be noted. Noting them is what found the release's only real fault.

**#1829's plan left three functional lines unchecked** — the browser console not read, a shelter-host
`/robots.txt` and a public page not loaded, and a signed-in page not loaded after `proxy.ts` and
`public-paths.ts` changed. **Two of the three could be closed from here, so they were** — and loading the
`/robots.txt` pair is exactly what turned up the fault below.

So: when a plan in the release says a line was not checked, ask whether **you** can check it before
writing it down as somebody else's. On this release, two of three could be, and it paid.

## `#thpfx` — THE `/th` ADDRESSES 500, AND THE PUBLIC-SITE LOCK IS HIDING IT

**Found on production, after the Pi was already serving the release.** `thPathRest()` in
`src/lib/public-paths.ts` maps `/th/<rest>` onto the page at `<rest>`, so the Thai site has its own
addresses for search engines.

**Where that rewrite has to RENDER a page it returns 500. Where the target merely redirects, `/th`
redirects identically.** That pattern is the diagnosis — one cause, not several:

| address | result |
|---|---|
| `lannacareforanimals.org/th` | **500** (bare `/` → 200) |
| `cooperjaidee.org/th/platform/about` | **500** (bare `/platform/about` → 200) |
| `/th/adopt`, `/th/donate`, `/th/foster`, `/th/volunteer`, `/th/our-work`, `/th/contact` | 307, same as their bare forms |

**It is NOT this release's, and that matters:** `/th` answered 500 on **all three** environments at one
minute, including test and UAT while both still served `0.47.10` @ `7a1aae4ea`. What `0.48.0` added was a
second instance in a visible place — `#cjseo` gave the product page a Thai address, and on
`cooperjaidee.org` that target renders rather than redirecting, so the 500 shows instead of being masked.

**THE MASK IS `PUBLIC_SITE=locked`.** Almost every public page 307s to the gate, so almost every `/th/`
address 307s too and looks fine. **The day the site unlocks, every `/th/` address starts answering 500.**

**Three things ruled out by reading rather than reasoning**, so nobody re-derives them:

- **Thai rendering is fine.** `/platform/about` with a `locale=th` cookie: 200, `<html lang="th">`, 5,418
  Thai characters, a Thai `<h1>`, 65,500 bytes against English's 55,009. **So the release note saying the
  page is in English and Thai is TRUE.**
- **The edge is fine.** `served-by: pi` on every reading, three times over, and both zones purged with
  every asset byte-identical to the build.
- **It is `/th`, not `/th/`.** `/th/` answers **308** on all four hosts and the 500 is where that redirect
  lands. A script testing `/th/` alone reads a clean redirect and concludes nothing is wrong, which is
  plausibly how this went unnoticed. The first write-up got this backwards and was corrected the same hour.

Filed as `#thpfx` under *Public website* with the full measurement. **Not held for, and not this
release's to fix** — a release ships what the build gave it. Nobody is waiting on Lutan.

## WHAT `0.47.10` LEFT OPEN AND THIS RELEASE CLOSED — STOP CARRYING IT

**`#tstok` is DONE.** The last edition's headline was *"test is the only environment with no deploy
credential of its own"*. It has one now: Lutan created the token, `.env.deploy.test` holds it (gitignored
by `.gitignore:13`), and **this release's test deploy is the proof** — `--plan` printed `wrangler auth:
API token from .env.deploy.test` **before** a ten-minute build was committed to, then the real deploy
finished and `test.lannacare.org` answers `0.48.0` on both endpoints. `wrangler whoami` separately showed
the OAuth login still valid, so test now has **two** working paths where that morning it had none.

**Delete the long `.env.local` passage the last edition carried.** The prohibition still stands and now
lives in the runbook (§6, *Worker, production*); it no longer needs a handover section.

## A MIGRATION AHEAD OF ITS READER, AND WHY THAT IS THE SAFE DIRECTION

`0435_shelter_drive_staged.sql` adds `staged boolean not null default false` to
`shelter_drive_credentials`. **No code on `main` reads it** — `git grep "staged" origin/main -- src/lib/google/`
returns nothing, and the five files that do are still unmerged on `claude/shelter-drive-move`, whose
session is live. `apply-migrations.mjs` warned that the declared consumer is *"not on origin/main at all"*.

**That warning is correct.** Schema first, reader later, with a default equal to today's behaviour. The
runbook already says an unsurprising warning is the point; this is what one looks like.

**For the planner, not for the next release manager:** the Drive move is owed and is **not** in this
release. `shelter-drive-connect`'s note still waits on a real consent **on production** — the one that
happened on 2026-11-22 was on dev.

## Traps that cost nothing this time but will

- **`main` moved under the release three times** (four backlog commits, two of them this session's own
  `#thpfx` work). The code-identity allow-list diff was **empty every time**, so the Pi builds stayed
  pinned and nothing was chased. Doing nothing was correct.
- **The three Server Actions keys look like a fault if compared across environments.** Production
  `cbd55beae8d8`, test `ecc41837fc0b`, UAT `cdeca9cbc4de`, each matching its own Pi build. Compare within
  an environment only.
- **`audit:register` passing is not `audit:prod` passing.** The register admits high and critical only, so
  a **moderate** can sit outside it and never show: `GHSA-g3hv-75wg-m249`, `minimatch`, via
  `@node-minify/core` → `@opennextjs/aws` → `@opennextjs/cloudflare`. Build-time tooling, in nothing the
  Worker or the Pi serves — so its absence from the register is correct, not an omission. Read both.
- **The `.open-next` liveness window must be minutes, not seconds.** UAT's bundling stage wrote **0 files
  in 120 s** while perfectly healthy: 15 in 180 s, 26 in 300 s, 212 in 600 s, with two node processes at
  1.9 GB and 918 MB. A 60-second window reads a working build as a stall.
- **`npm ci` can be answered by reading instead of running, but only by reading all four places.**
  `package-lock.json` byte-identical to the last release's SHA, and `next` at **16.4.6** in
  `package.json`, in the lockfile, in the installed tree and in the build banner. Any one alone is not it.

## What is still open

- **`#thpfx`** — above. Nobody is waiting on Lutan.
- **`#cnypd`** — the tenancy canary's production run. Built (#1831); the expensive half is establishing
  what a planted row sets off that a rollback does not undo, read from production's own triggers. **His.**
- **`#ykefa`** — blocked on `#cnypd`, and correctly still open.
- **The product page's Thai *wording* has not been read by anyone who reads Thai.** 5,418 Thai characters
  render; whether they say the right thing is **his**, and it is this release's headline test gap.
- **#1829's third unchecked line:** a signed-in page after `proxy.ts` changed. `updateSession`'s
  signed-out branch was exercised on every host; its signed-in branch was not, and Claude has no
  production account.
- **Dev carries one extra `schema_migrations` row**, `0422_keep_an_admin_per_shelter.sql`, for which no
  file has ever existed in git under that name. Known, dev-only, **unchanged since `0.47.10`** — not new
  drift, and `--drift test` will keep reporting it until the row is removed.

## Now routine — stop treating these as open

UAT's three one-time needs (its own Supabase token, the Pi's sudo rule for `lanna-care-uat`, its own purge
token) have all been done since 2026-11-09. The mesh route to the Pi is in place with an `~/.ssh/config`
alias; `lanna-pi.local` works only from the home network, and asking about it is what cost a third touch
on `0.47.0`. `test-plan` is **advisory, permanently** — never list it as a decision he owes.

## The two touches that are his, and stay his

**The email question** — put as *"should this release email you?"*, never as the two words — and the
**production Worker deploy**. He answered the first unprompted again, in his opening sentence.

**And tell him the mail reaches one person.** The shelter's own address is not on the production admin
list and `lannacareforanimals@gmail.com` is skipped by the relay with `E_RECIPIENT_NOT_ALLOWED`, so
"mails every admin" overstates the lever and makes the choice a false one. He knows; say it anyway rather
than implying a wider audience.
