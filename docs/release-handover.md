# Release handover — written 2026-10-19 after `0.37.0`

**Read this first: the thing the last edition told you to fear is not the thing
that will bite you.** The previous handover led with the Pi running out of memory
and told you the swap fix had settled it. `0.37.0`'s production build was then
**killed four times** — and it was **not** a memory fault at all. It was a 4.4 GB
stale build cache. Three separate remedies for the memory fault were tried first
and all three failed, because they were answers to the wrong question.

- **The Pi build killer is now known, and it is the Turbopack cache.** One command diagnoses it. See *THE ONE THING*.
- **The automatic asset check ran by itself this time**, unlike `0.36.1`. `0.36.1`'s Defect 1 (a self-updating script running the old copy) is **fixed and proven** — `deploy-pi: restarting under the script from <sha>` appeared in the log.
- **The Pi's swap was never persisted** and would have vanished at the next reboot, taking `0.36.1`'s fix with it. Fixed on the live machine and proved by an actual reboot. The repo half is still open.

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release** and
is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction: **when something it warns about gets fixed, come back
and say so.** Honouring that, from the previous edition:

- **The deploy-command rule WORKED for a fourth release running.** Copy the production deploy command out of the runbook verbatim; do not compose one. **Keep the rule exactly as written.**
- **The opening-message shape has now worked six releases running.** One message carrying the version case, the silent-failure answer, the outstanding list **as a question**, and any quietly-breaking change **named separately** — answered in one round of clicks again. **It is still the single highest-leverage habit in this file.**
- **The record-PR prediction held for a FOURTH release.** #719 (`0.36.1`'s record) was in range and matched to its PR rather than orphaned. Settled; stop checking.
- **`release-prs.mjs` exited 0. Across seven releases: 1,1,1,0,1,0,0 — expect NEITHER.** Read the exit code directly, never through a pipe.
- **The per-file dry-run trap did NOT fire** — all three files `ok`. That is twice fired against five not. **Say which of the three cases you got.**
- **`npm ci` as step 1 earned its keep an eleventh time**, and `Next.js version : 16.3.8` matched `package.json`.
- **The cut's PR-number guess was RIGHT this time** (#731), after two wrong in a row. **It was still re-read after opening, and that is what made it safe to write down.** Keep writing the plan first — the first CI run was green by construction for a seventh release.
- **The `ERROR Failed to copy …` lines**: keep not investigating.
- **A production-only guard** has now gone thirteen releases without appearing.

---

## THE ONE THING THAT WILL BITE YOU: the Pi's build cache, not the Pi's memory

**`0.37.0`'s production build was killed by the kernel four times.** The cause:

| Clone | `.next/cache` | Result |
|---|---|---|
| Test | 1.2 GB | built first time, every time |
| Production | **4.4 GB** | killed 4× |

On a **4 GB** machine. Clearing it took `.next` from 4.9 GB to 450 MB and the next
build compiled in **52 s** and ran straight through.

> **THE DIAGNOSTIC, and it is one command. When one clone builds and its twin does
> not on the same machine, diff the clones before theorising about the machine:**
>
> ```bash
> ssh lutan@lanna-pi.local 'du -sh ~/Animal_Shelter_App/.next ~/Animal_Shelter_App/.next/cache ~/Animal_Shelter_App_test/.next/cache'
> ```
>
> **The fix, if production's cache is multiple GB:**
>
> ```bash
> ssh lutan@lanna-pi.local 'rm -rf ~/Animal_Shelter_App/.next/cache'
> ```
>
> It is regenerable build scratch, **not** the served files (`.next/static`,
> `.next/server`), so the site keeps serving while you do it. The next build is
> slower because it has no cache to reuse. That is fine.

### Why it masquerades as the memory fault, which is the part to internalise

Every surface reading says "out of memory", and the documented remedies all fail:

- **`free` reports 3.5–3.6 GB available after each kill** — the exact reading `0.36.0` used to rule out contention. True and irrelevant: a build cache is read as **mapped file pages**, which never appear as "used".
- **The kernel kills at *decreasing* RSS**: 2,799 → 2,680 → 2,254 MB. That reads as the machine degrading and sends you to a reboot. It is not degradation.
- **It dies in *compilation*, before the typecheck** — the log never prints `Compiled successfully`. **This is the tell.** Previous genuine OOM kills died at or after `Running TypeScript ...`. It also means **`ignoreBuildErrors` — one of the three candidate fixes on the Pi-memory backlog item — cannot help**, because the build never reaches the typecheck.
- **The twin clone builds fine on the same machine minutes earlier.** That asymmetry is the real evidence and it is in hand from the first failure.

**Three remedies were tried before the right one, and two of them cost Lutan an
intervention each:** more swap priority (a genuine misconfiguration, fixed, did
not help), and a reboot (contradicted the handover's recorded answer, did not
help, and the next build was killed at 2,212 MB on a machine up 0 minutes).

**What went right and must not be lost:** `.next.prev` protected production through
**all four failures**. Each ended `BUILD FAILED — putting the previous .next back`
and `lannacare.org` kept serving `0.36.1` with `x-lanna-served-by: pi` throughout.
**That is #708's fallback proven in anger**, and it is why a four-failure evening
was an inconvenience rather than an outage.

### The swap: fixed on the machine, still open in the repo

`/etc/fstab` had **no swap entry at all**. `/swapfile2` was made by hand during
`0.36.0`, so **the fix `0.36.1` depended on would have vanished at the next
reboot** — silently. Now fixed live (`pri=200`, ahead of zram's 100) and **proved
by an actual reboot**. Expect:

```
/swapfile2   file        4194288   <used>   200
/dev/zram0   partition   2097136   <used>   100
```

**Check it with `cat /proc/swaps`** (`swapon` is not on the non-interactive `ssh`
PATH). If `/swapfile2` is missing or below zram, the repo half of the item has not
landed — `setup.sh` still writes `sw` with no `pri=`. **zram is compressed RAM, not
extra capacity**: it spends RAM to save RAM, so the real file must be preferred.

---

## THE SECOND THING: a Pi deploy can poison the edge cache

Unchanged in mechanism, **but the protection now works automatically.**
`/_next/static/**` is served `immutable` for a year, and `deploy-pi.sh` swaps
`.next` while requests arrive, so an asset request answered mid-swap can be cached
broken **for a year at whichever Cloudflare location served it**.

> **It presents as "only broken on mobile" and is INVISIBLE from the machine you
> deployed from**, because a phone on mobile data reaches a different edge.

**`check-assets.mjs` ran by itself on both environments this release** — no hand
invocation needed, unlike `0.36.1`:

```
check-assets: ok /_next/static/chunks/0kn54t5b570zx.css — 96232 bytes, identical to the build (CF-Cache-Status: MISS)
```

**Purge anyway, even when it is green.** The check only sees the edge it reaches.
`0.37.0` purged and then re-ran the check against the **freshly-purged, cold** edge
and it still came back identical — that is the strongest form of this evidence and
worth repeating.

### The purge is STILL Lutan's — check before you plan the release

```bash
node scripts/purge-cache.mjs --env production --dry-run
```

- **Prints what it would purge** → the token exists, **the purge is yours**, budget two touches.
- **Refuses naming `CLOUDFLARE_PURGE_TOKEN`** → **Lutan's**, from the dashboard (Caching → Configuration → Purge Everything), budget three. **Say so in the opening message**, not at the end.

**It refused on `0.37.0`**, so it is still his, three releases running. The
automation (#720) is built and needs one value in `.env.deploy.production`. It is
**not** a Worker secret. Its success path has **still never executed**.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.37.0`** @ `2b1dc2e5` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`2b1dc2e5`** — `node scripts/release-prs.mjs 2b1dc2e5 <the new release SHA>` |
| Production database | **`224 applied`, `0 pending`**, `No drift` at the end of this release. **Run `--status --env production` yourself.** |
| Dev database | `No drift`, 224 of 224. **Run `--drift test`; this row will be out of date.** |
| Next free migration number | **`0224`**. `origin/main`'s highest is `0223`. **Still check** — three landed in this release, one in the last |
| `unreleased` notes waiting | **0** at the moment the cut merged — **read nothing into that.** Two editions running have said 0 and been overtaken within hours |
| Open PRs | **run `gh pr list`.** #719–#731 are merged with **no gaps** — every number in the range is accounted for, which is unusual and will not hold |
| **The Pi's build cache** | **Cleared to 450 MB on 2026-10-19.** If it is GBs again, that is THE ONE THING above. Nobody knows yet whether it regrows every release |
| **The Pi's swap** | 6,143 MB, `/swapfile2` at **priority 200** ahead of zram, now persisted in `fstab` |
| `main` moves under you — including mid-cut | **Yes, every time.** On `0.37.0` it moved twice during assessment — six PRs merged between two reads of the same question. **Re-read; never carry a count forward** |

**All four builds came from the release SHA**, for the fifteenth release running,
both Pis pinned `--ref 2b1dc2e5`.

**Server Actions key checked on both pairs again** (ten times now): production
`cbd55beae8d8`, test `ecc41837fc0b`, both unchanged since `0.31.0` — they are
environment configuration, not build output, so **matching this file's values is
not evidence you checked.** Compare Worker against Pi, and look for the Pi's second
line, `the build in .next carries that key`.

### `0.37.0` was MAJOR, so the mail check is the normal way round

`0.36.1` inverted it; this one does not. **Assert `majorReleasesSince("<previous>")`
returns exactly the new version**, mechanically rather than by reading the `major:`
flag, then expect `deploy: release mail for <version> [UAT]: sent 1, skipped 1` —
skipping `lannacareforanimals@gmail.com` with `E_RECIPIENT_NOT_ALLOWED`, which is
expected and known.

**Then confirm it ARRIVED rather than inferring it from `sent 1`.** Reading Lutan's
mailbox was **refused by the classifier** on `0.37.0`, so ask him in chat. His
confirmation is better evidence than a log line, not worse.

**Why major, since `0.36.1`'s minor is also a precedent:** the two tests agreed
this time. Three new abilities *and* a new day *and* the first mail of it *and* an
announcement about features rather than an apology for a fix. `0.36.1` was minor
because all of those pointed the other way. **Put the standing test's answer to
Lutan, then let him weigh the audience against it, and record the reasoning either
way.**

---

## Lutan's time: the budget is two, `0.37.0` cost SIX

| # | What | Should it have been his? |
|---|---|---|
| 1 | Major versus minor, plus ship-with-gaps — one round of clicks | **Yes**, by design |
| 2 | The production Worker deploy | **Yes**, 2026-10-02 |
| 3 | The Pi swap-priority change | **No** — right fix, wrong problem |
| 4 | The Pi reboot | **No** — wrong diagnosis |
| 5 | Deleting the Turbopack cache | **Arguably** — needed no `sudo` |
| 6 | The Cloudflare cache purge | **Yes for now**, until the token exists |

**Touches 3–5 are a diagnosis failure, not a process one**, and *THE ONE THING*
above exists so the next session spends one command instead of three of his
interventions.

**Scores:** `0.34.0`/`0.35.0` two; `0.33.0`, `0.36.0`, `0.36.1` three; **`0.37.0`
six**; `0.28.0` five.

**The opening message is the whole technique and it now has a proven shape.** One
message, four things, answered in one round:

1. **The case for major or minor**, stated plainly, with a recommendation
2. **The silent-failure answer** — what could break quietly, read in code
3. **The whole outstanding-verification list, AS AN EXPLICIT QUESTION** — ship-with-gaps or hold
4. **Any quietly-breaking change, named separately from the count**

**And retract a warning out loud the moment it proves wrong.** `0.37.0`'s opening
message said a role with no tiles would land on a blank home. It cannot —
`check-home-screens.mjs` asserts *"a role holding nothing has only Residents"*. It
was withdrawn in plain words. **An unretracted false warning is worse than none.**

### The three allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json`:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
"Bash(ssh lutan@lanna-pi.local *)"
```

**Claude cannot read, add or revert them.** You find out when a command is refused.

**On `0.37.0` two of the three were refused and then worked on one retry:** the
production migration apply (refused with no explanation, handed to Lutan per the
runbook, then applied cleanly on a single considered retry after he said to
proceed) and the first Pi deploy (refused as `[Production Deploy]`, worked
immediately after). `gh pr merge 731 --merge` went through with no prompt.

**So: do not retry blind, but one considered retry after Lutan has said to proceed
is the established pattern and worked twice this release.** If it is refused again,
hand it over, say the dry-run was clean, and **ask him for the output**, or the
record cannot state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** It is what mails every admin.

**Read his deploy log; do not take "done" for an answer.**
`tr -d '\000' < deploy-0.37.0.log` (`tee` writes UTF-16), then grep for the
**project ref** (the arrow does not survive that conversion), `Next.js version`,
`strip-baked-env`, the Server Actions key, and the release-mail line.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan (**copied from the runbook**)
5. build **both Pis**, pinned `--ref` to the SHA his deploy reports

Because a Pi build can be pinned and a Worker build cannot, the Worker is what the
others are made to agree with.

**`0.37.0` is the first release where step 5 failing actually mattered.** The mail
goes out at step 4; the thing it announces went live at step 5, **four failures
later**. For that window production served `0.36.1` while every admin had been told
about `0.37.0`. Nothing was at risk and the Worker's `/api/releases/current`
already said `0.37.0`, but **the announcement preceded the reality by a long way.**

**That is an argument for reading `/api/version` promptly, not for changing the
order** — and it is exactly how the four failures were caught rather than mistaken
for successes, because `systemctl is-active` said `active` and the clone sat at the
release SHA through every one of them.

- **Seven releases now and the order has never been tested** — `main` held still every time.
- **`--upto` still has never been used in a real release.** Rehearse it before offering an order that depends on it.

---

## In flight

**Nothing was left open by the release itself.**

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** What is durable is the shape:

- A release's own two worktrees become free leftovers once their PRs merge. **On `0.37.0` the cut's worktree was already gone** by the time the record was written, cleared by something else — so do not assume you will be the one to clear them, and do not assume they are still there.
- `HELD — <session name>` means someone is in it. Ask; do not tear it down.
- **A stream can be in flight with no PR**, which `gh pr list` will not show. `git branch -a` is the check.
- **A PR can merge while you are mid-release.** Decide deliberately whether to fold it in, and if you do, re-run `release-prs.mjs`.
- **There are worktrees `worktree.mjs list` cannot see** — app-cut ones under `.claude/worktrees/`. They are not tracked by git, they can hold build output, and one on `0.37.0` still had a three-day-old `next dev` running inside it. See *Things that look alarming*.

**If you repeat a number from this handover, run the list first and quote what it
says** — or write "run the list" and no number at all.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-19.md` → *THE DEFECT THAT MATTERS* first.** Then *THE ONE THING* above. **Before the production Pi build, check the cache size** — one command, and it is the difference between a 52-second build and four kills.
2. **After both Pi builds, read `/api/version` on both hosts.** Never infer success from the service being up or the clone's SHA; that is how four failed builds looked identical to successes. Then **purge, even if the asset check was green** — and find out at the **START** whose job the purge is.
3. **Copy the production deploy command out of `docs/release-procedure.md` verbatim.** Four releases running.
4. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Never call the record PR "ready to merge when you say".
5. **`npm ci` in the main checkout before any deploy**, and read `node_modules/next/package.json` against `package.json`. Eleven releases running.
6. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values.
7. **Open with ONE message** carrying the four things above. Six releases running.
8. **Range starts at `2b1dc2e5`** — run `release-prs.mjs` against the **release SHA after the cut merges**, and re-run if `main` moves. Read its exit code directly. **The previous release's record PR will be in range and will not be flagged** (five releases running).
9. **Read both databases rather than trusting the table above.** `--env dev` is not a thing; the dev database is `--env test` and the drift check is `--drift test`.
10. **Decide major or minor with Lutan before cutting**, and remember the mail check inverts with the answer.
11. **Ask whether anything can fail silently**, and read the candidates in code. **A header is a statement of intent, not evidence — diff it.** `0.37.0`'s worked example: `0223`'s header said "NOTHING IN src/ READS THESE TABLES YET", which was true when it merged and **false by release time**, because the two app PRs that read all three tables had since landed. **Check the header against the release, not against the day it was written.**
11b. **When two migrations in one release touch the SAME object, check the later did not revert the earlier.** `0.37.0` had exactly that: `0221` and `0222` both `create or replace` `set_role_cards()`. Both were read in full; `0222` is `0221` plus one join. **`create or replace` fails loudly on a dropped column and goes quiet on a dropped `where` clause** — so read the clause.
12. **A migration whose guard is false on dev has never run anywhere.** Verify its effect against production before and after.
13. **Name a quietly-breaking change separately from the count** — and **retract it out loud if it turns out not to be one**.
14. **Expect a production-only guard.** None for thirteen releases.
15. **The production migration apply is yours, with an allow rule** — and if refused, one considered retry after Lutan says to proceed, then hand it over.
16. **Budget the Worker deploys at ~9–10 minutes each**, not overlapping. **Budget the Pi builds at 5 minutes each if the cache is healthy — and at an entire evening if it is not.**
17. **Check what is already on test before overwriting it.**
18. **Clear your own worktrees once their PRs merge** — but check they still exist first.
19. **Writing the cut's test plan *before* opening the PR makes the first CI run green.** Seven releases. **Then ticking the CI line is itself a commit, so a second run follows — wait for it and confirm its `headSha` matches your HEAD**, because the PR bar's cached reading can show the first run's result.
20. **The vet calendar is ANSWERED — stop asking.** Lutan, 2026-10-17: *"The vet calendar is only setup on test right now."* Dormant on production by configuration. **Do not infer otherwise from `strip-baked-env`'s list**, which comes from the build environment, not production's secrets. Until he sets it up, write `n/a: configured on test only, dormant on production (Lutan, 2026-10-17)`.

---

## The public site is still locked — on BOTH environments

`PUBLIC_SITE` is `locked`, so anonymous requests to `lannacare.org` **and**
`test.lannacare.org` get the "Staff testing site" gate. **"Deploy it to test and
check the public behaviour there" is not an available move on any environment**,
and offering it to Lutan is offering something that cannot be carried out.

**What you CAN do, and it is better evidence anyway:** test the enforcing layer
directly, against real rows, **as the `anon` role**, in a `begin … rollback`
harness (`set local role anon;`, then read the public views and call
`is_public_drive_file`).

Consequences to expect:

- **The public pages cannot be smoke-tested at all.** `0.37.0` is the first release in four where that did not hide the headline feature — the meme library, Posted labels and Approve photos are all internal. The three before it all put their headline in that blind spot.
- **A note asserting a number is hidden more completely than one asserting a layout.**
- **The edge-cache `HIT` check is vacuous**: the gate is served `no-store`, so there is no cached public page to get a `HIT` on. Write it `n/a` with that reason.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so strip the nulls before grepping, and the
arrow does not survive, so grep for the project ref; a backgrounded `deploy.mjs`
writing nothing for minutes is buffering; `-- consumer:` warnings naming files that
differ from the live release are the safe direction; and
`deploy: release mail … [UAT]` on production is the production setting and the mail
is real. Also:

- **`Killed` after `Creating an optimized production build ...` is the CACHE, not memory** — see *THE ONE THING*. `Killed` after `Running TypeScript ...` is the older memory fault. **The stage tells you which, and they have different fixes.**
- **A five-figure `lint` failure in the main checkout is almost certainly NOT your code.** `eslint` walks into `.claude/worktrees/`, where leftover app-cut worktrees hold `.next`/`.open-next` build output: on `0.37.0` that was **2,948 errors and 36,883 warnings**, and the first run **exhausted the V8 heap and aborted with exit 134** before reporting anything. **Check with `npx eslint --ignore-pattern '.claude/**'`** — if that is clean, the code is fine and CI will be green. Raised on the backlog. Note an orphaned `next dev` can be running in such a folder, regenerating `.next` as fast as you delete it, and `worktree.mjs list` cannot see any of this.
- **A `git merge backlog` can be left mid-conflict in the main checkout**, blocking every git command there with `you need to resolve your current index first`. It is shared by several sessions. The conflicts are always the same shape — a PR ticked an item while `backlog` added items above it — so keep the new items and `main`'s ticked versions, and verify the result is **additions only against `main`**.
- **A FAILED dry-run can be the correct result** when a file rebuilds a view naming columns an earlier *pending* file adds. The runner says so itself and still exits 0. **A red it does not explain is a real stop.**
- **`--drift test` exiting 1 with dev *ahead* is usually normal** — the schema-first rule working.
- **A `gates.mjs` run much faster than the last is a warm Turbopack cache.** Read the exit codes, not the timings. `gates.mjs` prints `test=0` as well as the three the template names.
- **A second CI run on the cut PR is correct and expected.**
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes about four minutes.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault** — the first comes from the origin Pi, the second from the Worker. **On `0.37.0` that window lasted four failed builds on production**, which is exactly why you read it rather than assume it closes.
- **A foreground deploy past the ten-minute tool cap is moved to the background, not killed.** Read its log file.
- **A Worker whose bundle was built at an earlier SHA still reports the right version** — `/api/version` reads `releases.ts`. The SHA in that response comes from the build, so it *is* the thing to compare, but only on `/api/version`.
- **A red `public-views` is almost certainly not yours** — it runs against the shared dev database.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" matches the viewport meta twice.
