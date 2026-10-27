# Release handover — written 2026-10-27 after `0.40.7`

A **delta**. The release's own facts are in `docs/releases/2026-10-27-0-40-7.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.7` is deployed, verified, and it correctly mailed nobody.** Both databases read **274 of 274**
with `No drift`, all four migrations went on before any deploy, and every live role came through the
role rebuild with exactly the cells and cards it started with.

**It cost three touches — one answer and two commands.** The target is two. **The question round held
for the fourth release running**: the mail, the thirteen unsigned plans and the quiet-failure risk
were folded into ONE round before the cut. **Keep doing that.** The third touch was Cloudflare's API
timing out mid-release, which is nobody's fault and is not a process failure to fix.

**The previous edition's own correction worked again.** Every carried item below was re-measured, and
**two of them moved off the list rather than being passed on** — the OpenNext copy errors were finally
opened up and settled, and the archived-roles reporting fault was deleted by `0272` rather than filed.
**A carried item with no command attached to it is a rumour.**

**`doctor-cells` red is EXPECTED and is not a fault** — Lutan uses Doctor as his test role, one card
at a time (`docs/decisions/2026-10-25-doctor-is-the-test-role.md`). It reads `MISSING 12 of 13`.
**Never restore the Doctor's cards and never edit the check.** Report the number, change nothing.

**Re-measure before trusting any of this.** `git diff --stat fe1ed99e..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## Corrections and closures to the last edition

- **The OpenNext `Failed to copy` item is CLOSED, not carried. Do not carry it a seventh time.**
  Six editions said "counted, not recalled — still watch, do not act", and not one of them opened the
  build output. Lutan asked directly this release, so it was checked: all three packages
  (`age-encryption`, `color-string`, `data-uri-to-buffer`) **are present and complete** in
  `.open-next/server-functions/default/node_modules/`, every runtime `.js` file there. They are
  pure-ESM packages whose `exports` is a string rather than a map, which the copier mishandles while
  still landing the files; the only absentees are `.d.ts` declarations, which is the whole of the size
  difference. **The message is cosmetic.** Glance at it, do not count it.
- **The archived-roles reporting fault is GONE, not filed.** `0272` removed `roles.archived_at`
  entirely, so the checks can no longer list an archived role as live — the fault that led `0269` to
  reason about a role nobody could hold cannot recur. Nothing to carry.
- **`role-cards-coverage` is clean for the second release running, and `CLAUDE.md` still says it is
  not.** That paragraph records "it does not pass yet: on 2026-10-24 production named four roles". It
  now prints `Every held card is covered by its role's access`. **Someone should update it** — not
  mid-release, and re-run the check first rather than citing this file.
- **`strip-baked-env` held at 14 for a tenth release**, same 14 names both sides.
- **The home-icon count held at 50 while the card count rose 32 to 33** (`0271` adds Translations),
  which is exactly what the `0.40.5` correction predicts: `iconCatalogue()` counts distinct *pages*.
  **It verifies nothing about cards.** `cards-union`, `role-cards`, `role-cards-coverage` and
  `check-cards-count` are the real checks, and all four were clean.
- **The public-page and edge-cache checks are vacuous while `PUBLIC_SITE=locked`. Proven again.**
- **`release-prs.mjs` exited 0 with no squash-merge gap**, read from the command rather than a pipe.

## Where things stand

| | |
|---|---|
| Live | **`0.40.7`** — production Worker `2b34b693` tagged `v0.40.7`, test Worker `39c24ac6`; both Pi clones at `fe1ed99e` |
| Previous release SHA, for the next range | **`fe1ed99e924b48666387219566231dc635ab0fe5`** |
| Production database | **`274 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 274 of 274** |
| Next free migration number | **`0274`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** The production deploy printed `no major release new to production (was 0.40.6), so no email.` |
| Cards | **33** (`0271` adds Translations), `cards-union` and `role-cards-coverage` both clean |
| Public site | **`PUBLIC_SITE=locked`** |
| Worktrees | The record's (a fresh one — **all six leftovers were `HELD`**, so rule 2's reuse was unavailable, not skipped). **A `/clean-streams` round is still owed** |

**Counters:** `npm ci` as step 1 **30**; no production-only guard **32**; `strip-baked-env` **25**, at
**14**, tenth consecutive release; **Server Actions keys** (twenty-ninth check): production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged across eight releases.
**Releases that mailed: 1 in the last eleven.**

## The method that keeps paying

**Take the before-picture of the table the migration writes, and diff it afterwards.** Third release
running that this has earned its ninety seconds. Here it turned the release's riskiest-looking change
into a one-line fact: **deleting the `staff` role took nothing from anybody**, because `role-cells` and
`role-cards` read identically on both sides for all six live roles. Without it, "no live role lost
anything" would have been an argument from a migration header.

**Read an exit code from the thing you are measuring, not from what printed it.** Still the highest
value habit here, and this release is the sharpest example yet: the background wrapper reported the
test deploy as **exit 0** while the deploy itself had **exited 1**. Reading the wrapper would have
recorded a successful deploy that had failed.

**A deploy that LOOKS failed and a deploy that IS failed are different claims.** Both Worker deploys
threw red errors this release and they needed opposite responses — the test one had uploaded and only
failed a cron write (leave it), the first production one had uploaded nothing (re-run it). The only
thing that separates them is `wrangler deployments list`. **Never re-run a deploy on the strength of
an error message.**

## Two things a future release manager will meet

- **Cloudflare's API can time out from this machine for minutes at a stretch**, as `fetch failed` or
  `ConnectTimeoutError`, hitting `wrangler`, `purge-cache.mjs` and `check-production.mjs` alike. It is
  **not** bandwidth and **not** IPv6 — both were measured and ruled out. **Retry; it clears.** The
  purge succeeded on its second attempt and the deploy on its second run. Do not start tuning timeouts.
- **`git reset --hard` is refused by the classifier, and the runbook's worktree-reuse recipe names
  it.** `git checkout -b <branch> origin/main` in a clean worktree lands at the same commit and was
  used again here. **Still worth correcting in `docs/release-procedure.md`** — one line, named by the
  last two editions and still not done.

## In flight and open

**Send to hospital is held by no live role**, and after `0270` so are **Manage medical** and
**Assistant**. Deleting `staff` removed their only (dead) holder, so nothing changed in practice, but
the gap is unchanged from `0.40.6`: it closes when Lutan gives someone **Manage medical** in Settings
to Who does what. **Row 1 of his list and the one open item with a live consequence.**

**The new Translations card is deliberately held by nobody** (`0271`). It was left out of the release
notes on purpose, because a note would promise a screen nobody can reach. Row 8 of his list.

**The production 15-minute cron has not run since 2026-10-23**, so the calendar sweep, status-alert
mail and translation drafts are all stopped. **Already on the backlog twice** (Lutan's; the recorded
fix is a Worker deploy or the Cloudflare trigger). This release *was* a Worker deploy, so **check
whether it restarted** — `node scripts/check-production.mjs calendar-cron` — before anyone works on it.

**Thirteen `pending:` plans shipped as a stated gap** on Lutan's explicit decision — the highest yet.
The trend is **5, 5, 5, 13, 7, 13**. Worth watching as a trend rather than a per-release footnote.
**The quiet-failure risk was raised separately from the count, in the same round**, which is the rule:
two of the six notes hide buttons, and a wrong card mapping shows as a button that simply is not
there. He chose to deploy both environments and look afterwards.

**Carried unchanged, nothing new to say, and RE-MEASURE EACH before repeating it:** `0257`'s stale
`-- consumer:` header; `who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the
Units screen and of the new Pages preview; one real vet visit on production; the restore drill, still
never exercised; and the two unlooked-at items, the prescription form reading 4 and video playback on
a real handset. **`tee` under PowerShell still writes the deploy log as UTF-16** — `tr -d '\000'`
before grepping, used again and it works.
