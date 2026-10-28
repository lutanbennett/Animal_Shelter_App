# Release handover — written 2026-10-28 after `0.40.10`

A **delta**. **Two releases shipped on 2026-10-28** — `0.40.9` and `0.40.10` — and each has its own
record. The durable rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.10` is deployed on BOTH environments and verified.** Same commit everywhere, **280 of 280**
with no drift on either database, both crons healthy, cache purged and proved, 33 cards and every card
check clean.

**The one thing to read before your next release: `audit` WILL BE RED on your cut, and that is now
normal.** Until 2026-10-27 a broken trigger made the job skip every cut; #1041 fixed it, and
`0.40.10` was the first cut it genuinely ran on. **A cut always changes `package.json`, so the job
always runs, and the one open advisory (`glob`) is one we deliberately refuse to "fix"** — the fix
reinstalls the adapter that caused the four-day cron outage. **It cannot block a merge**
(`continue-on-error: true`, `ci.yml:251`). **Do not touch the check.** A backlog item is filed.

**`doctor-cells` now reads `MISSING 4 of 13`, not 12 — READ IT FRESH.** Doctor is Lutan's test role
and gains cards as he tests. The last edition warned about quoting a number from memory and the number
has already moved again. **Never restore its cards, never edit the check, report what you read.**

**Re-measure before trusting any of this.** `git diff --stat 5ebb4a98..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## The fault to actually fix, because it has now happened twice

**Two releases in a row, this session cost Lutan an avoidable round-trip, and he named the pattern:
*"this is two releases in a row now."*** Both were the same error — optimising the release manager's
end of the job at the expense of his.

- **`0.40.9`:** the test deploy was started in the main checkout **while his production deploy was
  building there**. Both write one `.open-next`; his died `ENOTEMPTY`, mine died `ENOENT`. The runbook
  already said *"Two builds in one worktree collide"*.
- **`0.40.10`:** **two commands were handed over in one message** and he ran the second first. The
  deploy refused itself — *"production is missing 1 migration(s) this commit carries"*. There is a
  standing rule against this (*never show commands early*): **a command in a code block gets run.**

**THE RULE, and it dissolves both:** **one command at a time; nothing of yours running against shared
state while a command of his is in flight; the next command only after the previous one reports.**
Now written into `docs/release-procedure.md` as a trap with both examples.

**The corollary worth internalising:** every one of these came from trying to save ten minutes. The
deploys take what they take. **Sequencing costs nothing and is the only thing that has gone wrong
twice.**

## Corrections and closures to the last edition

- **`release-prs.mjs` is FIXED — stop carrying it.** It exited 1 on three consecutive releases because
  squash-merged PRs leave no `Merge pull request #N` commit. #1041 taught it to resolve those from
  GitHub, and `0.40.10` came back complete, exit 0, with no by-hand patching.
- **The advisory register was OFFERED AND DECLINED on 2026-10-25, and is now filed again because the
  reason for declining has gone.** `docs/decisions/2026-10-25-audit-on-releases-not-every-pr.md`
  records it: *"Not included (offered, not chosen)"*. He declined it because the job would rarely run;
  it now runs on every cut. **If this comes up, lead with that history** — it is not a fresh idea.
- **Send to hospital stays CLOSED** (Doctor holds Manage medical). Do not re-raise it.
- **The cron item stays CLOSED on both environments.** Do not re-raise it.
- **`strip-baked-env` held at 14 on both environments**, two releases after the gap `0.40.8` left.
- **The four advisories retired in `0.40.9` have not returned**, confirmed by grepping each ID.

## Where things stand

| | |
|---|---|
| Live, production | **`0.40.10`** — Worker `2f7737af`, Pi at `5ebb4a98`, endpoints agree, cron healthy |
| Live, test | **`0.40.10`** — Worker `2ab4e083`, Pi at `5ebb4a98`, endpoints agree, cron healthy |
| Previous release SHA, for the next range | **`5ebb4a987670f64359948f323d85b87e9dbb75f9`** |
| Production database | **`280 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`280 applied, 0 pending`**, `No drift` |
| Next free migration number | **`0280`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None**, correctly. Eighth release running |
| Cards | **33**, `cards-union` and `role-cards-coverage` both clean |
| Worktrees | Cleaned out by another session mid-release; only the main checkout, `Backlog`, and one live stream remained |

**Counters:** `npm ci` as step 1 **33** (skipped on `0.40.10` with an empty lockfile diff as the
stated reason); no production-only guard **35**; `strip-baked-env` at **14**; **Server Actions keys**:
production `cbd55beae8d8`, test `ecc41837fc0b`, unchanged.
**Releases that mailed: 1 in the last fourteen.**

## The method that keeps paying

**Assert the data AND read the page — they prove different things.** `0.40.10` is the first
double-digit patch, and a string sort puts `"0.40.10"` **before** `"0.40.9"`. The assertions covered
the data; only reading the rendered page covered the page. **Nothing would have failed if the page had
sorted as text.** Expect this again at `0.41.10`, and at any further double-digit boundary.

**Close a `pending:` by asking the person while you have them.** This release reached **zero items
awaiting a person** — a first, against a trend of 5, 5, 13, 7, 13, 15 — because both were put to Lutan
**in the same round as the email question**, one of them by simply showing him the note and asking
whether it read correctly. **That cost one extra question and closed two plans.**

**When `main` moves, read what deployed rather than reasoning about it.** The test Worker reported
building from `092f0109`, not the release SHA. One `git diff --name-only` excluding `docs/` showed the
application code identical, so nothing was rebuilt to chase a SHA.

**Take the before-picture of the tables the migration writes.** Fifth release running.

## Two things a future release manager will meet

- **The classifier blocks `[Production Deploy]` intermittently** — it blocked `apply-migrations` twice
  on `0.40.10` and allowed the same command an hour earlier. **Try once, retry once, hand it to
  Lutan.** Do not work around it.
- **Cloudflare's API can time out from this machine for minutes.** Not bandwidth, not IPv6 — both
  measured and ruled out. **Retry; it clears.**
- **`git reset --hard` is refused by the classifier and the runbook's worktree-reuse recipe names it.**
  `git checkout -b <branch> origin/main` does the same job. **Named by five editions and still not
  corrected** — one line, and it has now cost more to keep writing down than to fix.

## In flight and open

**The advisory register** (above) is the one new backlog item, and it carries a real design trap in
its text: **a registered advisory stops being re-examined.** `glob` is harmless only because nothing
here runs its CLI; a register that stores "we looked once" would be worse than the red.

**The Translations card is still held by nobody** (`0271`, deliberately). It is the only carried item
left from the `0.40.7` list.

**Carried unchanged, and RE-MEASURE EACH before repeating it:** `0257`'s stale `-- consumer:` header;
`who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the Units screen, the
Pages preview and both of this release's notes; the restore drill, still never exercised; and the two
unlooked-at items, the prescription form reading 4 and video playback on a real handset. **`tee` under
PowerShell still writes the deploy log as UTF-16** — `tr -d '\000'` before grepping.
