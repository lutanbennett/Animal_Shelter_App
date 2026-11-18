# Release handover — written 2026-11-18 after `0.47.2`

A **delta**. The durable rules are in `docs/release-procedure.md` and the two releases' own records are
`docs/releases/2026-11-16-0-47-1.md` and `docs/releases/2026-11-18-0-47-2.md`. **All three outrank
this file.**

**This edition covers TWO releases, because `0.47.1` never wrote one.** That is the first fault not to
repeat: rule 3 of *The paperwork has a time budget too* says the record and the handover are **one
PR**, and on `0.47.1` only the record was written. Nothing caught it — there is no check for a stale
handover — and it surfaced on `0.47.2` only because Lutan asked outright whether the handover was
done. **If you are reading this after a release you ran, write the next edition in the record's PR.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.47.2`** — a **minor release that mailed nobody**.
`test.lannacare.org` and `uat.lannacare.org` serve `0.47.2` too. All three Pi clones **and all three
Workers** were built from `854891267`, and all three hosts answer `x-lanna-served-by: pi`.

**Production holds every migration on `main`: 408 applied, 0 pending, 0 drift either way.** It had
been eighteen behind. UAT is the same. Test's database (dev) was already current.

**Re-measure before trusting any of this**, and read **both** endpoints on all three hosts:
`/api/releases/current` reports the **Worker's** version whatever the Pi serves, which is what
exposed `0.47.0`'s UAT gap.

## What the two releases were

**`0.47.1` (2026-11-16, minor, no mail).** 27 PRs, nine migrations `0381`–`0389`: tax-deductible
donations, lazy Shelter Friends maps, the sold-out merchandise badge.

**`0.47.2` (2026-11-18, minor, no mail).** 38 PRs, eighteen migrations `0390`–`0407` — **the
multi-tenancy groundwork the whole board was waiting on.** It rewrote about 4,600 existing production
rows to stamp `shelter_id`, and `0397` then made the column `NOT NULL`.

## Five things that are different for you now

1. **Cloudflare deploys use an API token, not wrangler's OAuth login.** `.env.deploy.production` and
   `.env.deploy.uat` each hold `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Account Settings: Read,
   Workers Routes: Edit on both zones; no expiry). Every deploy prints a `deploy: wrangler auth:` line
   naming the layer it came from. **Test deliberately has no token and prints `wrangler's own OAuth
   login` — correct, not a fault.** Built after an OAuth token expired mid-upload and gave Lutan a
   `401 Authentication error [code: 10000]`, costing him a second run.
   `docs/decisions/2026-11-16-deploy-cloudflare-api-token.md`.
2. **The Worker deploy order is test → UAT → production**, reversed on `0.47.1` so Lutan's goes last
   and nothing of ours starts a build under it. **`#uatwk` is closed** — `0.47.0`'s headline warning.
3. **`scripts/check-release-order.mjs` exists and you must run it before any apply.** Some migrations
   must reach a database only *after* the code that makes them safe — the opposite of the usual
   direction, which no `-- consumer:` header can express. Today the registry holds `0392`, whose
   per-shelter policies blank the public site if no `x-shelter-id` arrives. It refuses unless
   `--worker-deployed <sha>` names a commit where `worker/shelter.mjs` and `worker/index.mjs` match
   `origin/main`.
4. **`scripts/check-scheduled-writers.mjs --env production` is now part of a release.** It reads the
   live `cron.job` list and every writing function. On `0.47.2` it found the nightly tax-ID purge
   would have started erroring silently at 03:41 under `0397` — and that **`0397` itself fixes it**.
5. **`npm run audit:register` is the audit that counts**, not `audit:prod` (which exits 1 on
   registered advisories). One high is registered and unreachable: `GHSA-5j98-mcp5-4vw2` (`glob`). The
   two **moderate** Next.js cache advisories are judged unreachable and now **held so by a CI check**,
   `check-next-cache-apis.mjs`.

## The Next.js advisory halt will interrupt you, in three places

Next 16.4.2 stops a **completed** build with a `SecurityFatalError` notice. The build is not broken
and the project is deliberately staying on 16.4.2
(`docs/decisions/2026-11-17-next-agent-upgrade-halt.md`).

- **`gates.mjs`** — handled: it recognises the halt and re-runs the build once.
- **`next dev`** — prints `Ready`, then halts. Retry; it came up in ~1s.
- **A deploy in Lutan's terminal** — an **interactive** "Upgrade now / Skip" menu. **Tell him Skip,
  never Upgrade now**: upgrading mid-deploy would ship an ungated dependency bump to production. If
  the command then exits, re-run it; the second attempt is the one that counts.

**It ends at `Running TypeScript ...` with no further output, which looks exactly like a hang.** On
`0.47.2` this cost two round trips with Lutan.

## Four traps this release paid for, none of which any check catches

- **Git Bash lies about line endings.** `grep -c $'\r'` answered **0** and `od -c` showed only `\n` for
  a file Node read as CRLF — the MSYS tools strip CR in text mode. Editing `src/lib/releases.ts` on
  that assumption nearly shipped a broken release file. **Detect the ending inside the script**, then
  check the diff is the size you expect.
- **`pgrep -f "deploy-pi.sh"` matches its own ssh command string**, so a waiter built on it never
  reports the build finished. Use `pgrep -af "deploy-pi[.]sh"`.
- **The terminal panel can show a stale view.** It showed a frozen `Running TypeScript` line while the
  deploy was in fact bundling, and that produced a wrong "it has exited" report. **The process table
  is the instrument**: `Get-CimInstance Win32_Process`, and ask whether anything holds the checkout.
- **A launcher `ssh` returning is not the Pi build ending.** Confirm with the self-excluding `pgrep`
  before starting the next one. The Pi has 4 GiB and the OOM killer takes one of two concurrent builds.

Still true: **`python` is the Store stub** (use `node -e`), **bash heredocs with nested quotes fail**
(use the Write tool), **Lutan's log is UTF-16** (`tr -d '\000'` before `grep`).

## `lanna-pi.local` failed again; the mesh worked

The home-network name timed out for the whole of `0.47.2` and **all three Pi builds ran over
`lanna-pi-mesh`**. Read the served headers before concluding anything about the Pi: three `pi`
answers mean the box is healthy and your path is broken. Already in the runbook — follow it rather
than rediscovering it. **Do not put the mesh to Lutan as a question.**

**The power alarm is quieter, re-read rather than repeated.** The Pi has been **up 5 days 17 hours,
booted 2026-11-12 15:04** — no reboot since. And `journalctl --list-boots` now lists three boots, so
the journal **is** persistent, contrary to the note carried since `0.44.2`.

## Two things NOT to re-derive

**An empty `unreleased` does not mean "no release".** `cut-release.mjs` **refuses** to cut with an
empty list and has no override. On `0.47.2` all 38 PRs answered the release-notes line `n/a` and the
list was empty — a real state, not an error. **Both options went to Lutan** (publish one plain note,
or deploy under the old version) and **he chose the note**. Do not invent a note to get past the
refusal without asking, and do not assume the answer repeats.

**When a cut ADDS a note, `--verify` needs a hand-built base** (`origin/main`'s file plus exactly the
notes you added), or the count assertion fails on a count that is correct. The runbook has the
recipe; try plain `origin/main` first. Third release running.

## What is still open

- **`#shtci` is unblocked and is the clearest next job.** `claude/shared-tables-production` holds
  **one commit, on no PR**, held because production was eleven migrations behind. It no longer is. The
  standing instruction is *"merge it in or straight after the release that applies `0390`–`0400`, then
  `gh workflow run tenancy-shared-tables.yml`"*. **Lutan chose on 2026-11-18 to leave this to the
  planner, not the release manager.** Its backlog entry may still read as blocked — if so, that is a
  false block of the kind `CLAUDE.md` warns about.
- **Thirteen person-checks**, listed by name in `0.47.2`'s record under *What is not tested*. **Five
  are the same thing**: a browser click-through of the new per-shelter policies, needing a login
  Claude does not have. The database half was proved thoroughly — strict tenancy lint clean at 125 of
  125 tables on production and UAT, `role-cells` byte-identical, and the public site proved un-blanked
  against two controls.
- **The Thai sign-off, fifth release running.** `0.47.2` converted both dictionaries so text takes a
  shelter's own name; a test asserts Lanna's output is byte-for-byte unchanged, but
  `dictionary-shelter-prose` has no bilingual signature. **Still the project's largest standing gap**
  (`#y1dqu`). Likewise **a signed-in look at production**, which Claude cannot do: the public site is
  `locked` and it has no account there.
- Carried forward unclosed: the **Cloudflare rate-limit rule** (`#8t3rk`), the **foundation document
  store**'s two steps, the **PromptPay id and QR**, and **`SUPABASE_CANARY_TOKEN`** (a nightly check
  needs it; no deploy does).

## Now routine — stop treating these as open

- **`table-policy-commands` is closed**, not overtaken — `0.47.1` settled it on production.
- **On a no-mail release the deploy's own `no major release new to <env>, so no email` line is the
  measurement.** Do **not** pass `--no-mail` to production to be safe: it *suppresses* that line. UAT
  takes it by its own rule. On a release that does mail, read the message itself.
- **The UAT apply, the Pi's six sudo rules and reading the backup from Drive** are all settled and in
  the runbook. **One sentence from Lutan settles major, mail and the gaps.** Nine releases running.

## The two touches that are his by rule, and stay his

**Major versus minor**, and the **production Worker deploy**. `0.47.2` cost him **four** touches
against a target of two: the deploy, a re-run after the advisory halt, and two reports of an apparent
stall — one of which was my misreading of a stale terminal panel, not his machine.
