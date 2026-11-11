# 2026-11-11 — One build at a time on the Pi, by a kernel `flock` that refuses rather than waits (`#pm4kz`)

**Why:** the Pi has 4 GiB of RAM and `next build` peaks above 6 GB. In `0.44.2` three parallel builds
exhausted it and the production build died with a bare `Killed`. The runbook now says "one at a time",
but prose was already there and already wrong. This makes a second concurrent build impossible to start.
It does not block a release; the runbook rule held in the meantime.

## Mechanism

`scripts/pi/deploy-pi.sh` opens `/tmp/lanna-pi-build.lock` on fd 9 and takes `flock -n 9` (override the
path with `PI_BUILD_LOCK`, used only for testing). The path is fixed per **machine**, not per clone,
because the three clones are separate folders sharing one box. After taking it, the script writes
`<env> from <clone> (pid) since <time>` into the file, which is what a refused clone prints.

- **Where.** Just before `npm ci`, after the fetch, the re-exec, the release guard and the swap check.
  Released (`exec 9>&-`) after the manual PDFs, before the swap and restart. So the fetch, guards,
  restart and health check are not serialised; only the memory-hungry part is. The swap runs while the
  next clone may already be building, which is the same load the box carries today for a few seconds.
- **Refuses, never waits** (reasoning of `#gspxx`): a waiting deploy hides a 5-minute stall and a second
  script that nobody is watching. It exits 3 with plain words, names the holder and the command to rerun.
- **Missing `flock` is its own refusal** (exit 2), not "someone is building". The first draft reported a
  missing binary as a busy lock; the local test showed it.

## Alternative rejected: a pid lockfile like `scripts/lib/tree-lock.mjs`

An atomic `wx` file naming a pid, with a dead pid taken over. It works, but it needs the stale-lock
logic, and the stale case is exactly the event this exists for. An OOM kill (or a power cut) leaves the
file behind and relies on a pid check that pids being reused can fool. A kernel `flock` is released by
the kernel when the holding process dies, however it dies, so **there is no stale lock to clear and no
takeover code to get wrong.** (`tree-lock.mjs` is right for the dev tree, where Windows has no `flock`.)

## OOM kill, stale lock, and one trap

- **OOM kill / power cut:** the lock is gone with the process; the next deploy starts at once. The
  build is safe by design already (`.next.new` discarded, `.next` untouched).
- **Clearing a lock by hand:** never needed. `/tmp` is also cleared on reboot.
- **Trap, found and closed:** a child that inherits fd 9 and outlives a killed script would keep the
  lock. The build children (`npm ci`, `npm run build`, the manual PDFs) therefore run with `9>&-`, so
  only the script shell holds it. Tested: kill -9 the holder, the next build starts.

## Verification, and what is not verified

Git Bash has no `flock`, so the lock block was extracted from the script and run against a Perl `flock`
shim: holder + second refused (exit 3, names the holder), sequential acquire, kill -9 then re-acquire,
and no-`flock`. **The real `flock(1)` on the Pi is unexercised**, as is `setup.sh` step 2c. Both wait for
Lutan's next deploy / a Pi rebuild.

`docs/release-procedure.md` (around line 789) already says ONE at a time and is correct; its prose can
now be read as backed by this lock.
