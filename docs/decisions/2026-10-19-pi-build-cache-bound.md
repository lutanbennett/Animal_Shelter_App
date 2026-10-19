# Pi build cache is pruned above 1 GB, and failed deploys announce themselves

**Cause.** Production clone .next/cache reached 4.4 GB on a 4 GB Pi (test clone: 1.2 GB, built every time). Clearing it took .next from 4.9 GB to 450 MB; the build then took 52 s. The kernel killed it four times, during compilation, before the typecheck. The ignoreBuildErrors idea is withdrawn.

**Ceiling: 1024 MB.** Test clone was healthy at 1.2 GB, a fresh build is ~450 MB; 1 GB leaves room and stays far below what starves the Pi. Chosen from those two observations, not measured further.

**Steady growth or one-off?** Not established. We have one reading per clone, no history. So the bound is permanent (prune each deploy), which is correct for either answer. If du on production shows it re-growing past 1 GB between releases, that is steady growth.

**Pruning is conservative:** only a path ending in .next/cache, printed before removal, never a glob.

**Loud failure.** deploy-pi.sh prints a boxed DEPLOY FAILED banner with the exit code (137 = killed) and exits 1; after restart it also fails unless /api/version shows the built version. Tested in scripts/pi/build-lib.test.mjs.

Also: swapfile fstab line gets pri=200; eslint ignores .claude/**.
