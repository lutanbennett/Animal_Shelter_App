# Release handover — written 2026-11-06 after `0.43.4`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-06-0-43-4.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`; `test.lannacare.org` is test on the dev project.
**`lannacare.org` (UAT) is mid-move to its OWN Supabase project** (`fsjagxmxjosauwmxwype`, in a second
Supabase account) and is **expected to refuse a deploy** until Lutan fills `.env.deploy.uat`. It runs
`0.43.3` against dev meanwhile. That is documented, not broken.

**`0.43.4` did NOT mail** — asserted at the cut, stated by the deploy, and confirmed at the inbox with a
presence control. The public site is **still locked** (`PUBLIC_SITE: "locked"`).

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat af21ad0d..origin/main`,
`gh pr list`, `--status --env production`, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**Same line as the last two editions, and it has now paid three times.** `git log --oneline -1` before
cutting, then **`--status --env production`**. On `0.43.2` that caught an unannounced domain cutover. On
`0.43.3` it came back clean in seconds. **On `0.43.4` it came back with eight pending migrations**, which
turned a request for *"a minor release no email"* into the largest release in a fortnight. Two commands.
Run them every time.

**He asks for releases in words that decide neither the version nor the size.** *"Please do a minor
release no email"* described eight notes and eight migrations. **"Minor" means the MIDDLE number in his
usage, which in this repo is the shape that MAILS.** He named the email, so the email is the answer:
`major: false`, last number. **Never offer "major or minor" as the question.**

## New this release

- **A cut may have to WRITE notes, and this one wrote three.** When the release applies the migration a
  withheld note was waiting on, that step closes *here*, and the truth rule puts the note in the PR that
  closes it. `check-deferred-notes.mjs` listed nine candidates; four said *"needs `03xx` applied to
  production"*; this release applied them. **Read the drafted wording in each decision file — then check
  it is still true.** Two drafts were changed on purpose: one promised a tagging control the card does not
  carry, and one carried *"not live yet"* about the very thing the release was making live.
- **`--base` was needed, for the reason it exists.** A cut that writes notes makes `origin/main` the wrong
  comparison. Rebuild the pre-cut file and pass it; without it **exactly** the two note assertions fail,
  which is the script working. **Expect to need it whenever the range has deferred notes.**
- **`#jhd8s` IS DONE — stop carrying it.** `package-lock.json`'s two version fields bumped themselves and
  a new three-way assertion proved it. Three records in a row had asked for this.
- **Run the production dry-run EARLY when several migrations are pending.** Eight files is where a
  surprise hurts, and the one "failure" is the documented non-fault: a file depending on an earlier
  pending file. **`apply-migrations.mjs` now prints that explanation itself**, so a red dry-run line is no
  longer something you must recognise from `CLAUDE.md`.
- **A stream can land underneath a release.** #1338 merged while this one was deploying, and its
  half-filled `.env.deploy.uat` is what made the UAT deploy refuse. **A refusal from an environment a
  stream is actively rebuilding is not a release blocker** — read that stream's decision file first, and
  do not take the tool's suggested remedy (here, generating a key into Lutan's own secrets file).

## Corrections to the last edition

- **`#jhd8s` is no longer carried** (above). The last edition said to expect to fix it by hand again.
- **`purge-cache.mjs`'s host literal is fixed.** Production maps to `lannacareforanimals.org` on
  `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS`. Only step 13(a)'s **visitor-count** zone id is still old.
- **`docs/test-plan-template.md`'s wrong hosts are FIXED**, in this release's record PR. The last edition
  recorded it *"for the planner"* and nothing happened, so it was corrected where it cost nothing.
- **Pi build caches: production read 984 MB** (kept; ceiling 1024). The edition before last claimed they
  would overflow soon; that was withdrawn, and this is **a reading, not a trend**. Read it again next
  release rather than making this a third data point in a story.

## In flight and open

- **Two standing jobs now need Lutan, and one should not.** `apply-migrations.mjs --env production` was
  refused twice by the permission classifier, so **he applied eight migrations by hand.** That is the
  second release job to need a narrow allow rule, after the Pi deploy. **Until it has one, budget a third
  touch and hand him the command** rather than working around the refusal.
- **Two migrations both numbered `0324`** are on `main`. Nothing is broken — `schema_migrations` is keyed
  by filename and both applied — but **the next free number is `0325`**, and `check-migration-numbers.mjs`
  cannot see a collision that exists only in the union of two individually correct branches.
- **`STATUS_READ_TOKEN` is unset on production, on purpose.** The new health feed answers 401 to everyone
  until Lutan sets it. Fail-closed, so never a blocker and never a release note. `#mzu7v`.
- **UAT's zone cache has still never been purged**; `.env.deploy.uat` has no `CLOUDFLARE_PURGE_TOKEN`.
- `scripts/pi/setup.sh` and `docs/pi-hosting.md` still call `lannacare.org` production. Step 13(b).
- **The restore drill, still never exercised.**
- **Two `pending:` plans from `0.43.3` are still unlooked-at**, and this release adds two of the same kind:
  the eight notes themselves, and the reels screens' Thai wording, which no Thai speaker has read.
- **`tee` under PowerShell still writes UTF-16** — read his terminal for the production deploy's own lines.

## The thing that keeps paying, in one line

**Read the live state; never accept "it's done".** Three releases running: a Worker list showing the old
version while he said the deploy had finished; a build still bundling while he said he was starting his;
and a *"Yes, carry on"* that answered a narrower question than a session would have wanted it to. Each
check cost about ten seconds.

**Next free migration number: `0325`.**
