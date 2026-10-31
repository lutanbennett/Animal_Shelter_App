# Release handover — written 2026-10-31 after `0.41.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-10-31-0-41-0.md`. **Both outrank this file.**

## START HERE

**`0.41.0` is deployed on BOTH environments and verified.** All four surfaces from **one** SHA,
`73a4bdc5`: both Pi clones (pinned with `--ref`), the production Worker (`a4fadc9c`, tagged `v0.41.0`
in `wrangler deployments list`) and the test Worker (`6c600aee`). **296 of 296** applied, `No drift`
on both databases, cron healthy, cache purged and proved byte-for-byte on both hosts.

**It MAILED** — the first in eleven releases, on Lutan's answer — and the message was confirmed
**delivered**, not just `sent 1`. Cost him **two touches**, which is the target.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 73a4bdc5..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## Read this before the next release: the Anthropic SDK comes out

**Lutan stopped this release to say `@anthropic-ai/sdk` should not be in it** — he had asked for it
not to be used — then decided: *"you can continue the release, we will take it out in the next
release."* So **the next release owes its removal**: the dependency, `src/lib/assistant/llm-claude.ts`,
and the `claude` branch of `src/lib/assistant/llm.ts`. The backlog item is already on `main`
(`22805187`), filed by the backlog manager.

Three things worth knowing before you touch it:

- **It ships dormant today.** One file imports it, behind a dynamic `import()` at `llm.ts:108`,
  reached only when `ASSISTANT_LLM_PROVIDER` resolves to `claude` **and** `ANTHROPIC_API_KEY` is set.
  `strip-baked-env` named fourteen variables and none of the assistant LLM ones, so nothing is baked
  into the production bundle.
- **One thing nobody has checked: whether `ANTHROPIC_API_KEY` exists as a production Worker
  secret.** The bundle is clean; the secret store was never read. If it is set, the assistant has
  been able to make paid calls. **Read it before you conclude anything.**
- **No check was ever going to catch this.** `scripts/check-llm-vendor-imports.mjs` *permits* that
  one file by design. Lutan found it by reading a mechanical line in a release report — which is the
  argument for keeping those lines in.

## Corrections and closures to the last edition

- **The "Pi build fails when a release DELETES a page" fault did NOT bite, and its check is cheap.**
  `git diff --diff-filter=D --name-only <prev>..HEAD -- 'src/app/**/page.tsx' 'src/app/**/route.ts'`
  printed nothing, so there was nothing to do. **#1125 ships the fix**, which by its own nature takes
  effect on the **next** Pi deploy, not the one that shipped it — so the next release is the first
  that can rely on it. Keep running the diff until one release has proved it.
- **The two `~/stale-next-types-{prod,test}-0.40.11` folders on the Pi are now safe to delete**: the
  previous edition said to wait for a later successful Pi deploy, and this release's two both
  succeeded. Left in place, because Claude's remote writes outside `deploy-pi.sh` are refused. One
  `ssh` line for Lutan, worth nothing on its own — **do not spend a touch on it; fold it into some
  round he is already answering.**
- **`doctor-cells` now reads `MISSING 3 of 12`, not `4 of 13`.** Nothing was restored and nothing was
  lost: `0291` retired `reference.add_while_recording` from the expectation list. Same three cells
  (`photos.resident_add`, `resident.adoption_news`, `resident.microchip`). **A count that shrinks
  looks exactly like a quiet regression, so read the reason rather than the number.** Still expected,
  still Lutan's card-by-card testing.
- **The `audit` job ran for real on the cut PR and passed** — `package.json` changed, so it was not
  skipped. `audit:prod` still exits 1 on the `glob` advisories; `audit:register` exits **0**, which is
  the gate since #1055. The 2026-10-25 scoping works: `check-docs-only.mjs:108` writes `docs-only=`
  and `deps-changed=` together.
- **`npm ci` in the main checkout was NECESSARY this time**, the first release in several — a new
  production dependency had landed. The empty-diff reason for skipping it does not hold every
  release; **run the diff, don't carry the habit.**

## New: `0292` is live and the write wrapper is real, on exactly one path

`write_requests` is on production, and the Pi failover wrapper is live — but **only
`/admin/units` is on `WRAPPED_WRITE_PATHS`.** Stream (D), the other 56 `runAction` call sites, is
outstanding. The release note was written narrowly to match, naming that one screen; **do not widen
the claim until (D) lands.** `docs/decisions/2026-10-31-write-request-wrapper.md` §6 is the paper.

## The method that kept paying

**Predict the after-picture, then read it.** Predicted before the apply: *no role's permission cells
move at all*, because `0295` grants on the **`assistant` card** which no role holds, and `0291`'s own
header records no `card_grants` or `role_permissions` row behind the activity it retires. Observed:
every figure identical. A prediction that is confirmed costs nothing; one that is wrong is the
finding.

**When a log file is missing, read the terminal.** `.local/deploy-0.41.0.log` did not appear on disk
while Lutan's build ran — `Tee-Object` buffers — and an `ls` at that moment looked exactly like a
deploy started without the `tee`. It was not. `mcp__terminal__read_terminal` had the whole log,
including the pre-build lines. **Now promoted into `docs/release-procedure.md`.**

**Verify that someone else really filed it.** He said the backlog manager was filing the SDK removal.
It was there (`22805187`) — but "someone else is handling it" is exactly the claim that leaves an item
unfiled, and it costs one `git log` to check.

## In flight and open

- **Manage medical**: still unassigned, so only its holders and Admin can record a death. The
  record-a-death note is still withheld. Unchanged for two releases — **worth putting to him in the
  next round he is already answering**, not as a question of its own.
- **The `assistant` card holds `assistant.record` again (`0295`), and no role holds that card**, so
  the assistant can write for nobody but Admin until Lutan assigns it on Settings → Who does what.
  The note is withheld until then. *(The broader unassigned-card count was not re-measured.)*
- **Fourteen plans' manual items**, shipped open on his decision and grouped in the record. Two
  clusters do all the work: a bilingual read of Thai wording (5), and a model machine that does not
  exist (6).
- **The whole signed-out surface is unverified**, and this release changed **every** public page's
  frame (#1115) plus added `/shop` to the footer and the search-engine list. `PUBLIC_SITE` is
  `locked`, so the only page an anonymous visitor reaches is the gate. **The release that unlocks the
  site inherits all of it at once** — budget for that rather than discovering it.
- **Nothing behind sign-in was verified either**, on either environment: no account. Date handling for
  Thailand is in that gap, and the deploy landed at ~23:00 Thai time, the window where a UTC bug shows.
- **Carried unchanged, re-measure each:** the restore drill, never exercised; video playback on a real
  handset; `0257`'s stale `-- consumer:` header. **`tee` under PowerShell still writes UTF-16** —
  `tr -d '\000'` before grepping. (A GNU `tee` from the Bash tool does not; this release's test log is
  plain.)

**Next free migration number: `0296`.** Check `origin/main` *and* open `*-schema` PRs anyway.
