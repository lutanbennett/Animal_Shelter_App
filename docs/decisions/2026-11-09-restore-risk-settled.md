# Restore risk is settled: the drill has been exercised three times, and production risk is negligible

**2026-11-09.** Lutan, reading `docs/release-handover.md`'s carried line *"the restore drill has
still never been exercised"*: **"We have done a restore already."** Then, on what I claimed was
left: **"Given we restored the production backup into UAT I think risk on production at this stage
is negligible."** And on the one item I had called unrehearsed — repointing the app at a new
project — **"didn't we prove that by setting those things up in UAT?"**

He was right on all three counts. This file records the evidence, so the line is settled with
measurement rather than overwritten with another opinion, and so nobody raises a production restore
drill again.

## The evidence: three restores, all of them ticked

| Item | What was restored, and where | Date | Record |
|---|---|---|---|
| `#q2vp7` | Local rehearsal from a production backup (`restore-rehearsal.mjs`), 100 tables, 6,458 rows | ticked 2026-10-13 | `2026-10-13-restore-rehearsal-local.md` |
| `#xa1jk` | A production backup into a **real throwaway Supabase project**, and **signed in**: 82 public tables, 324 policies, 304 residents, a real password sign-in reading 304 of 304 | 2026-10-19 | `2026-10-19-restore-drill-real-supabase.md` |
| `#rg7pv` | A fresh production backup into **UAT's own project**: 923 of 923 privileges, none missing and none extra; 163 tables read as a signed-in login, 7 refused exactly as on Test | 2026-11-09 | `2026-11-09-restore-puts-back-the-backups-privileges.md` |

No step of the README recipe is now only read rather than run.

## Why the line survived yesterday's correction pass, and what that pass did not have

`2026-11-09-handover-stale-undone-lines.md` corrected four stale "still outstanding" lines and
**deliberately left this one**, reasoning that `#rg7pv` rehearses *privileges* rather than the drill,
and that replacing an unverified claim with another unverified claim would be the same fault in
reverse. **That reasoning was right about `#rg7pv` and is not being overturned.**

What it did not weigh is **`#xa1jk`**. The drill proper was exercised on **2026-10-19**, three weeks
before either document was written, into a real Supabase project with a real sign-in — and
`README.md` has carried a *"What the drill proved"* paragraph ever since. So the line was stale from
19 October, not from yesterday, and the evidence to settle it was already in the repository.

That is the same file's own rule 1 applied one step further: *never accept "it's not done" either.*
It looked for the evidence in the newest item and stopped. **A "still never" line is re-measured
against every item that could have done the job, not only the one that merged that morning.**

## The second claim, narrowed rather than deleted

`2026-10-19-restore-drill-real-supabase.md` says *"storage buckets and files are not in a `pg_dump` —
uploaded files are a disaster-recovery gap with no backup path today"*, and `README.md` repeats it as
*"uploaded files and photos are not in these backups"*. Both overstate it, and both are corrected in
place rather than removed.

**What is true:** resident photos, blood-work PDFs and documents live in **Google Drive**
(`README.md`, "Google Drive API for file/photo storage"), which a Supabase disaster does not touch,
and UAT has its own copy of that tree. The **only** thing in a Supabase Storage bucket is the
**facility map plan images** (`src/lib/facility-map/plan-store.ts`, private bucket,
`2026-10-08-facility-map-plans-uploaded.md`). A `pg_dump` still does not contain them, so the gap is
real — it is a handful of floor plans that are uploaded from the system anyway, not the shelter's
photographs.

Measured rather than reasoned: `grep -rn "storage.from(" src/ worker/` returns **4 hits in 1 file**,
`src/lib/facility-map/plan-store.ts`.

## Why repointing the app is not on the residue list

Standing UAT up **is** that rewiring, performed end to end on 2026-11-08 and 2026-11-09 and written
down as `docs/uat-finalisation.md`, in eight parts with timings:

- **Part 1** — UAT's own `.env.deploy.uat`, its own Supabase keys, nothing inherited.
- **Part 2** — production's data into a **brand-new project ref** (`fsjagxmxjosauwmxwype`). That is the restore.
- **Part 3** — its own Drive copy and its own Drive token.
- **Part 4** — its own Google sign-in client, wired into Supabase Auth, and its own mail sender.
- **Part 5** — the Pi: its own service, its own cloudflared, its own sudoers entry (`#sud8p`).
- **Part 6** — `deploy.mjs --env uat --secrets`, the custom domain bound, then **signed in with Google** and the UAT badge seen.
- **Parts 7–8** — DNS, the `x-lanna-served-by` check, and saving something for real.

Two things make it stronger than a rehearsal. `deploy.mjs` **refuses** to push a Supabase secret
that exists only in `.env.local` to UAT (`deploy: uat would push dev's database secret(s)`), so the
failure most likely to pass unnoticed is now mechanically prevented. And it caught a real trap in
flight: the sign-in secret was pasted onto the Drive line and every photo failed with
`invalid_client` — a fault met on a quiet Saturday instead of during an outage.

Sign-in is **Google**, so the 2026-10-19 consequence about restored password hashes and a mass
password reset barely applies: configure the provider and people are back in. MFA/TOTP still is not
restored by design and everyone re-enrols.

## What is genuinely left

1. **Up to 24 hours of data lost.** The Pi backs up at 03:00 Bangkok daily (`scripts/pi/setup.sh`,
   `--keep-days 14`, newest five never pruned). That is the exposure, it is a design choice, and no
   amount of restore rehearsal changes it.
2. **The facility map plan images**, per above.
3. **Doing it under pressure rather than at leisure.** `docs/uat-finalisation.md` is what takes the
   edge off that, and it is the asset the three restores produced.

A restore into production *itself* has still not happened, which is what
`2026-11-09-restore-puts-back-the-backups-privileges.md` means by *"this is the recipe for the day it
does"*. **That is not a gap to close by drilling it**, and on Lutan's judgement above it is not to be
raised as one: restoring production into production is the disaster, not the rehearsal for it.

## What this changes in the documents

- `docs/release-handover.md` — the carried line, corrected in place and dated.
- `docs/releases/2026-11-08-0-43-6.md` — *"not verified"* list, corrected in place with the original
  text kept, because a release record describes what was believed on the day.
- `docs/decisions/2026-10-19-restore-drill-real-supabase.md` and `README.md` — the storage gap
  narrowed to the facility plans.
- `docs/test-plan-template.md` — section 8 told every stream *"the README restore recipe has never
  been exercised"*, which has been false since 2026-10-19 and was being copied into every test plan.

No backlog item is opened or closed by this: all three restore items were already ticked.
