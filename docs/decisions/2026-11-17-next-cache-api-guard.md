# A check keeps two Next.js cache APIs absent (`#cchgd`)

Decided 2026-11-17 by the stream; not a decision of Lutan's.

PR #1652 left `next@16.4.2` in place because advisory GHSA-mfr8-8qww-v76h (moderate) needs a `"use cache"`
function called through `unstable_cache()`, and neither is used (`docs/decisions/2026-11-17-next-agent-upgrade-halt.md`).
That holds only while they stay unused, and nothing read the condition.

`scripts/check-next-cache-apis.mjs`, one line in CI's `check` job, fails if `unstable_cache`, a `"use cache"`
directive, `cacheLife` or `cacheTag` appears in code under `src/` or `worker/`. The failure names the advisory
and the halt decision. The `check` job already skips docs-only PRs, so it runs whenever source changes.

**Watches:** those four, in `.js/.mjs/.cjs/.ts/.tsx` code, strings included (the directive is a string).
**Does not watch:** comments (a note explaining the ban must not trip it), `*.test.*`/`*.spec.*` and
`__fixtures__` (never shipped), `docs/`, and the script itself (it sits in `scripts/`).

**Not in `docs/advisory-register.json`:** that register feeds `audit-register.mjs`, which only reads high and
critical advisories. A moderate entry would guard nothing. If Next is upgraded past the fix, this check can go.
