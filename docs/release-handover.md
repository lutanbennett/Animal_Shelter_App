# Release handover — written 2026-10-29 after `0.40.11`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-10-29-0-40-11.md`. **Both outrank this file.**

## START HERE

**`0.40.11` is deployed on BOTH environments and verified.** Same commit everywhere (`d9628a26`),
**282 of 282** with `No drift` on both databases, both crons healthy, cache purged and proved
byte-for-byte on both hosts, **40 cards** and every card check clean.

**The last edition's headline is already wrong, and you should not act on it.** It opened with
*"`audit` WILL BE RED on your cut, and that is now normal."* **It was GREEN on this cut.** The
advisory register that same handover filed as a backlog item was **built and merged inside this
release** (#1055): the PR `audit` job now runs `npm run audit:register`, which passes an advisory
that has a dated entry, a reason in checkable terms and a decision file, and **fails on anything
else**. The `glob` entry expires **2027-01-28**. **So a red `audit` means something genuinely new
again** — treat it as a real finding, not as the known noise.

**`npm run audit:prod` is unchanged and still exits 1.** That is not a contradiction: the register
wraps the PR job only, while the release step and the daily `advisories.yml` still read the raw
advisory. Run it at the release step as the runbook says, and expect the `glob` line.

**`doctor-cells` reads `MISSING 4 of 13` — READ IT FRESH.** Doctor is Lutan's test role and the
number moves as he tests. **But one thing is worth carrying:** three of the four missing cells
(`reference.add_while_recording`, `resident.adoption_news`, `resident.microchip`) are exactly what
`0281`'s new vet cards grant, so assigning those cards would close three of them.

**Re-measure before trusting any of this.** `git diff --stat d9628a26..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## The fault that cost two releases did NOT recur, and here is what it cost to avoid

`0.40.9` and `0.40.10` each cost Lutan an avoidable round-trip, and the rule written afterwards was
**one command at a time; nothing of yours running against shared state while a command of his is in
flight; the next command only after the previous one reports.**

**Following it cost no time at all**, which is the part worth internalising, because both earlier
failures came from trying to save ten minutes. Each command went over alone, the next step was
described in words only, and the apply was **verified** before the deploy command was written. The
test Worker deploy was not started until his production deploy had reported.

**What makes it free is using the genuine parallelism instead of the fake kind.** Both Pi builds, the
cache purge and the icon sync all ran while his command was outstanding — none of them builds
anything in the main checkout. By the time his deploy reported, only the test Worker deploy and the
paperwork were left. **The sequencing is not the cost; skipping it is.**

## Corrections and closures to the last edition

- **"`audit` red on every cut" — SUPERSEDED within one release** (above). Its backlog item is ticked.
- **The advisory register's history no longer needs leading with.** The last edition said to open
  with the 2026-10-25 decline if it came up. It is built; do not re-litigate it.
- **`release-prs.mjs` stayed fixed** — exit 0 on a **38-PR** range, resolving 8 squash merges from
  GitHub with no by-hand patching. Second release running; stop carrying it as a worry.
- **`strip-baked-env` held at 14** on both environments, third release running.
- **The Translations card is still held by nobody** (`0271`, deliberately) — the one carried item
  left from the `0.40.7` list, now joined by seven more unassigned cards (below).

## Where things stand

| | |
|---|---|
| Live, production | **`0.40.11`** — Worker `a25e33a2`, Pi at `d9628a26`, endpoints agree, cron healthy |
| Live, test | **`0.40.11`** — Worker `17f6d282`, Pi at `d9628a26`, endpoints agree, cron healthy |
| Previous release SHA, for the next range | **`d9628a26c9414a88f0d5bb51adf27658b393f979`** |
| Production database | **`282 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`282 applied, 0 pending`**, `No drift` |
| Next free migration number | **`0282`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None**, correctly. Ninth release running |
| Cards | **40** (was 33), every card check clean |
| Open PR not in the release | **#1082**, process documents only — deliberately left out, costless |

**Counters:** `npm ci` as step 1 **34** (skipped on `0.40.11`, reason measured below); no
production-only guard **36**; `strip-baked-env` at **14**; **Server Actions keys**: production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged.
**Releases that mailed: 1 in the last fifteen.**

## The method that keeps paying

**Read the table the migration writes, BEFORE it writes it.** `0280` took `reports.cashflow` off the
`dashboard` card, and the `0257` triggers recompute every role's cells from its cards — so a
narrowing there can silently remove a live cell. One `check-production.mjs role-cards` before the
apply settled it: **no role holds the `dashboard` card.** The prediction "all six roles unchanged"
was then confirmed by the after-picture. **Ninety seconds turned a "should be fine" into a fact.**

**Assert the data AND read the page.** `0.40.11` string-sorts **below** `0.40.9` exactly as `0.40.10`
did, so this boundary is **not behind us** — expect it at every further double-digit patch. Both
checks were run again and both passed.

**Applying a migration does NOT close a note whose step is a card being ASSIGNED.**
`check-deferred-notes.mjs` raised 11 candidates and the two that mattered both turned on this. The
seven new cards are held by nobody, so their notes stay withheld. **This will recur while the
security rebuild runs**, since it lands cards and their assignment separately by design.

**Skip `npm ci` only on a measured reason.** The `package.json` diff here was a **single added
`scripts` line** and `package-lock.json` was untouched — read, not assumed, and confirmed by the
build banner `▲ Next.js 16.4.2`.

## Two things a future release manager will meet

- **The classifier blocks `[Production Deploy]` intermittently** — it blocked `apply-migrations`
  **twice** on this release, as it did on `0.40.10`. **Try once, retry once, hand it to Lutan.** No
  workaround. **This is what makes a release cost three touches instead of two**, and it is now the
  only recurring cause of that.
- **`git reset --hard` is refused by the classifier and the runbook's worktree-reuse recipe names
  it.** `git checkout -b <branch> origin/main` does the same job and was used here.
  **Named by six editions now and still not corrected** in the runbook — one line.

## In flight and open

**Seven new cards are held by nobody** — three view-only (Food forecast, Medicine forecast, View
cashflow, `0280`) and four vet (Record vet care, Record microchip, Adoption news, Add while
recording, `0281`). They grant nothing until assigned in Settings → Who does what, **and their
release notes are deliberately withheld until then.** Row 6 of this release's manual list.

**The public Adopt page's new journey pages have not been seen signed-out**, because `PUBLIC_SITE`
is `locked` — the one change in this release aimed squarely at the public.

**Carried unchanged, and RE-MEASURE EACH before repeating it:** `0257`'s stale `-- consumer:` header;
`who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the Units screen, the
Pages preview and this release's five notes; the restore drill, still never exercised; and the two
unlooked-at items, the prescription form reading 4 and video playback on a real handset. **`tee`
under PowerShell still writes the deploy log as UTF-16** — `tr -d '\000'` before grepping.
