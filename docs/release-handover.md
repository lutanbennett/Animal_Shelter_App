# Release handover — written 2026-10-23 after `0.39.3`

A **delta**. The release's own facts are in `docs/releases/2026-10-23-0-39-3.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## START HERE: `0.39.3` is PAUSED, and you finish it before you cut anything

**The production Worker was never deployed.** Three of four builds are live at
`c0bdf272` — production Pi, test Pi, test Worker — and the **production Worker
fallback is still `0.39.2` @ `6764913d`**. Users have had `0.39.3` throughout,
because the Pi serves production; the gap is invisible until the Pi is
unavailable, at which point visitors would silently get an old build. Lutan was
out on the road and **chose to pause** rather than run it from there.

**Do these two, in this order, before your own cut:**

```bash
node scripts/deploy.mjs --env production | tee .local/deploy-0.39.3.log
node scripts/resend-calendar-reasons.mjs --env production --apply
```

**(1) is his**, nothing may be building in the main checkout when you hand it over
(see the pre-handover check below), and it will build from whatever `main`'s tip
then is — fine, and to be *recorded* rather than hidden.

**(2) is yours, and the order is not cosmetic.** `0.39.3`'s note 2 promises that
entries *already* in the calendar gain a `Reason:` line within 15 minutes, and
**that is not true on production yet**: the sweep runs inside the **Worker's own
bundled app** (`worker/index.mjs`, `await openNext.fetch(…)` — `STATUS_ALERT_SITE`
only builds the `Request` and is never fetched over the network), so it is
`0.39.2` code. **Run (2) before (1) and the old sweep rewrites every entry without
the Reason line and clears the out-of-date flag**, destroying the result and the
evidence together. It was left unrun for exactly that reason.

**Note 2's first half IS true**: booking or editing writes the entry from a server
action, which runs in the app on the Pi. No mail went out, so the untrue half is
visible only to someone reading `/releases`. Also deferred with the pause:
`sync-home-icons.mjs --env production`; no note here concerns icons.

## Corrections to the last edition

- **It said to take the one classifier retry and be ready for it not to work. The retry WORKED — and what was refused was a READ**: a `tail` of a local `.log` file came back `[Production Deploy]`, and the same content read fine through the `Grep` tool. **Eight releases, eight behaviours.** When a refusal names something you are plainly not doing, **try a different tool before concluding anything**, and never record a refused read as a gap you could not close.
- **It said `release-prs.mjs` is a coin-flip, five releases five answers. This time: exit 1, ONE orphan** — **#854**, squash-merged, so no `Merge pull request #N` subject to key on; found in one `gh pr list --search`. **Six releases, six answers.**
- **It said "first CI run green by construction" was 2. It is 3**, third release running, and `check-test-plan.mjs --base origin/main` caught **two** faults before CI saw them. Both are now written into the runbook so they stop recurring.
- **It said `strip-baked-env` read 14 and held. It read 14 again on test**, same list including both calendar names — "moved once then held" confirmed as the normal shape. Production's was never read, that deploy not having completed.
- **It said the Pi could now see the calendar. Re-confirmed**: all four `GOOGLE_*` names present in `.env.production.local` after `deploy-pi.sh` regenerated it, checked **by name** with the command the last edition left. **Last release's fix survives a redeploy.**

## Three things were wrong in the documents, and are now fixed in them

Not in the software — in the instructions. **The runbook's own handover command
could not have run in his shell** (`mkdir -p .local && node …`: neither `&&` nor
`mkdir -p` exists in PowerShell 5.1, so it would have run *neither* half), sitting
a few paragraphs below where that same document names the `&&` trap. **The gates
were described as three when there are four.** And **the two `check-test-plan`
catches every cut hits** are now written into `release-procedure.md` step 4
instead of being rediscovered.

**The lesson: when a document's instruction is wrong, fix the document.** All three
had been worked around silently before, which is why they were still there.

**The red `audit` is already settled — do not re-derive it.** A real finding, three
`next` advisories, one critical; it **did not hold the release** and the run still
concluded `success`. Two of the three are **not reachable here, measured**
(`/_next/image` 404s on both live sites, `"use cache"` appears nowhere); the third
is a Server Actions DoS. **The planner reached the same verdict independently** and
filed `next@16.4.2` under *Security*, so write no second decision file.

## The one thing to change about how you hand the deploy over

**Never hand over the production deploy while anything is building in the main
checkout.** I started the test Worker deploy there and handed Lutan the production
command before it had finished; Next refuses a second build in one checkout, so
his died a minute in on `Another next build process is already running`.

The collision is already in `release-procedure.md` ("two builds in one worktree
collide"). **Knowing the trap did not help, because I never checked the
precondition** — the same shape as the document faults above. So, concretely:
before the handover, `Get-Process node` returns nothing **and** your own test
deploy has *exited*, not merely printed its last interesting line.

**One mistake, three consequences**: his wasted run, the lost "one SHA" property
(by the second attempt `main` had moved), and the unfinished release — he was on
the road by the time it could be re-run.

## `main` moved mid-release, and doing nothing was right for the Pis

Three commits between the cut and the record — a `plan-day` skill fix and two
backlog commits, **nothing in `src/`, `worker/` or `supabase/`**. Both Pi builds
stayed pinned `--ref c0bdf272`, both logs carry
`deploy-pi: restarting under the script from c0bdf272`, and no Pi was rebuilt:
`0.38.1`'s lesson applied rather than re-learned.

**But it has a sting for the Worker.** `deploy.mjs` requires `HEAD == origin/main`
and takes **no `--ref`**, so once `main` moves after a cut there is no supported way
to build the Worker from the release SHA — it ships the moved tip or waits for a
quiet `main`. Here the gap was three docs; **had they touched `src/`, it would have
been a real decision. Check the diff rather than assuming cosmetic.**

## Where things stand

| | |
|---|---|
| Live | **`0.39.3`** @ `c0bdf272` — production Pi, test Pi, test Worker |
| Production Worker | **`0.39.2` @ `6764913d` — outstanding.** See START HERE. **Verify it yourself rather than taking any report**: it was reported deployed and was not. `wrangler deployments list --env production` had `v0.39.2` as its newest; cache-bypassed `/api/releases/current` answered `0.39.2` with `x-lanna-served-by: worker` |
| Previous release SHA, for the next range | **`c0bdf272`** — the cut's merge commit, regardless of which SHA the Worker ends up built from |
| Production database | **`249 applied`, `0 pending`**. **Run `--status --env production` yourself** |
| Dev database | **`No drift`, 249 of 249**, exit 0 — clean, fourth release running |
| Next free migration number | **`0249`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| `unreleased` and open PRs | **0 notes, no open PRs** at the cut — **read nothing into either.** Eleven editions have said 0 and been overtaken; **run `gh pr list` yourself** |
| Worktrees | The cut reused the one `free` leftover (`Animal_Shelter_vet-visit-booking-polish`) and the record reused it again — rule 2 satisfied twice, no `npm ci`. **Its folder name does not match its branch**, so cleanup by name will miss it |

**Counters:** all four builds from one SHA — **BROKEN after 23, reset to 0**: only
three builds exist, and a counter kept by rounding is worth nothing.
`npm ci` as step 1 **20**; first CI run green by construction **3**;
no production-only guard **22**; `strip-baked-env` **15**, held at 14 (test only
— production's was never read).

**Server Actions keys** (nineteenth check): test `ecc41837fc0b`, unchanged since
`0.31.0`, and each Pi printed `the build in .next.new carries that key`.
**Matching the values is not evidence you checked** — the Pi's own line is.
Production's Worker key was not read, that deploy not having completed.

## In flight and open

**The same three silent failures, unchanged as a set.** None is broken today and
none is a check to re-run — they are build-work on the backlog wanting the same
plumbing (`status_alert_runs` → mail): the public desexing sign-up that tells
nobody; Drive space, amber at 80% and red at 95%, that never emails; the nightly
retention job's plumbing.

**One gap closed by running something rather than handing it over.** Note 1's
`pending:` item needed a Residents-card-only login, and
`scripts/dev-signin.mjs --cards residents` makes exactly that: 18 zones where the
note says the list was empty, and Register succeeded. **A `pending:` item you can
run is not a handover.** The hub then showed no diet where the review promised one
— the row is in the database, read under the caller's own RLS, so it is the card's
boundary, not a lost write. **Chase what looks wrong; the answer is often "correct,
for a reason you had not established".**

**For a person:** as a clinic login, book from `/appointments` and confirm you land
back there (note 3's other half). **Still unlooked-at: the prescription form reading
4** (`0.38.1`) **and video playback on a real handset** (`0.38.0`).

**His, and his only open one: book one real vet visit on production and see it in
"Lanna Care: vet visits."** Today's grooming also asks him to share that calendar
with the Director.

**Moved to `release-procedure.md`** (unchanged, both re-checked): "a major release mails one person", "`test-plan` is advisory, permanently".
