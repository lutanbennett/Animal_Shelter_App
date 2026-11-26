# The website-lock order guarded the wrong step (#flrwh)

2026-11-26.

## The fault

`docs/decisions/2026-11-25-website-lock-truth.md` ordered the floor lift as: set Lanna's website `locked`, read it
back, **then the production Worker deploy**, then check from outside. In `0.49.2` the real public site went live
before any of that mattered: `lannacareforanimals.org/` served 78,877 bytes of real content (it had been the
24,462-byte construction page), with `robots.txt` serving `Allow: /`, until Lutan locked Lanna's own switch.

## Why the floor lifts at the Pi build, not the Worker deploy

`PUBLIC_SITE` is declared in `scripts/lib/runtime-config.mjs` as `where: "pi"`, `source: "wrangler"`.
`scripts/pi/write-env.mjs` copies every such var out of `wrangler.jsonc` into the Pi's env file **at build time**,
"so the Pi renders what the Worker would". Every page is served by the Pi (`x-lanna-served-by: pi`); the Worker is
the fallback. So a change to one of these vars goes live at the **Pi build**, which is the deployer's step and runs
before Lutan's Worker deploy. A guard placed in front of the Worker deploy guards nothing.

## The corrected order

The read-back now sits in front of the **production Pi build**, in three places: the 2026-11-25 decision file (old
order marked `SUPERSEDED 2026-11-26` in place), `docs/release-procedure.md` (a section 3 step before any deploy,
and a reminder at the Pi step in section 6), and `docs/shelter-onboarding-runbook.md` (its step 3, which carried the
same order).

## Every variable with the same trap

`grep -n 'source: "wrangler"' scripts/lib/runtime-config.mjs` on 2026-11-26 lists six; five are `where: "pi"`:

- `PUBLIC_SITE`, `APP_HOST`, `PUBLIC_HOST`, `PLATFORM_HOST`, `PLATFORM_SEARCH` — all go live at the Pi build.
- `SUPABASE_URL` is `where: "worker"` — it goes live at the Worker deploy, so it does not have the trap.

None is `where: "both"`. The planner's count of five matches.

## Can it be a check? Yes, and it is one

`scripts/check-wrangler-var-steps.mjs --base <previous release's deployed SHA>` diffs `wrangler.jsonc` against the
base, and for every var added, removed or changed in any env block names the step that makes it live, read from
`runtime-config.mjs` (`pi` → Pi build; `both` → whichever runs first, which is the Pi build; `worker` or unlisted →
Worker deploy; `write-env.mjs` copies only listed names). Pure logic in `scripts/lib/wrangler-var-steps.mjs`, tests
in `scripts/check-wrangler-var-steps.test.mjs`. Run against the commit that changed production's `PUBLIC_SITE` to
`open`, it prints `production PUBLIC_SITE: "locked" -> "open" applied at the Pi BUILD`, which is the line that
would have caught `0.49.2` before the first build.

Choices, with reasons:

- **It names steps; it does not fail on them.** A change applied at the Pi build is often correct (a host rename).
  What the check cannot know is what guard that change needs; a red exit on every such release would be filtered.
  Exit 1 only when it cannot read a file or has no `--base`.
- **`--base` is required.** The release tags stop at `v0.3.0`, so there is no reliable default; section 2 of the
  release procedure already establishes the previous deployed SHA.
- **Not in CI, and not in `deploy.mjs`.** A PR does not know the last deployed SHA, and `deploy.mjs` was owned by
  another stream this batch. Its home is release-procedure section 3, beside the other before-any-deploy checks.
  A later hook in `deploy-pi.sh` or `deploy.mjs` could run it automatically; not built here.
