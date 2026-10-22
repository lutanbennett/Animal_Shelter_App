# The Turbopack build cache is pruned above 3 GB

**Cause.** The main checkout reached 20+ GB, 18.5 GB of it `.next` (`.next/cache/turbopack` 13.4 GB, `.next/dev` 3.7 GB). Turbopack's filesystem cache only adds to itself. Feature worktrees never get old enough to matter; the main checkout builds for ever.

**Next's docs offer no size limit.** `node_modules/next/dist/docs/.../turbopackFileSystemCache.md` has only `turbopackFileSystemCacheForDev` / `ForBuild`, on or off. Off would make every release and `gates.mjs` build cold in the main checkout, so it was not taken. If a size switch appears in a later Next, prefer it and shrink this script to a safety net.

**What was built.** `node scripts/worktree.mjs clean [--max-gb N] [--dry-run]` removes `.next/cache` and `.next/dev` of the checkout it runs in when together they exceed N GB (default 3). It prints each folder's size, removes only those two paths, checks they are gone, and refuses (exit 1) while a `next` process runs from that checkout. `/plan-day` calls it in the daily main-checkout sync; `.claude/settings.json` allows exactly `worktree.mjs clean` and `clean --dry-run`, so it is not refused like the ad-hoc delete was.

**Threshold: 3 GB.** Reasoning, not measurement: a feature worktree's whole `.next` is 1.3-1.7 GB, so 3 GB is about two builds' worth of headroom and a fresh checkout is a no-op. The cost of pruning is one slower build.

**Still Lutan's, once (step 1).** Delete `.next` and the two folders under `.claude/worktrees` in the main checkout (about 19.5 GB), and move the loose `deploy-*.log` and `backup.log` there into `.local/` (`.local/` is already in `.gitignore`).

**Logs.** `deploy.mjs` never wrote the `deploy-*.log` files; the `tee` in `docs/release-procedure.md` did. The procedure now tees into `.local/`.

**`/clean-streams`** now looks for folders under `.claude/worktrees/` that git no longer knows.
