# deploy-pi.sh re-execs itself after checkout (option b)

**Problem:** the script resets the clone to the target ref, replacing the file bash is
reading, so a change to it ran one deploy late (0.36.1: none of #708's guards ran).

**Chosen: (b).** After the checkout, `bash -n` the new copy, then `exec bash "$SELF" args`
with `DEPLOY_PI_REEXECED=1`; the second run skips the fetch and the exec. Why not (c): a
launcher plus payload is two files to keep in step for a one-file problem, and it only moves the
same question to the launcher. Why not (a): it relies on memory for a failure nobody sees.

**Sharp edges, handled.** `exec` keeps the pid, so the `>> log 2>&1` redirect and the
`setsid nohup` wrapper carry over (tested). `$0` is relative and the script `cd`s, so the
absolute path and original args are saved first. A new script that does not parse is refused
*before* anything is built or swapped, exit 2, service untouched.

**What happens to the launcher's own updates (the required answer).** The part above the exec
(arg parsing, root and clone-pairing refusals, fetch, checkout, parse check, exec) still runs
from the OLD copy on the deploy that changes it. That is the irreducible bit; (c) would have the
same bit in the launcher. Mitigation: keep it short, and `docs/release-procedure.md` says to
look for `restarting under the script from <sha>` in the log. Its absence means the clone's
script predates this fix. The first deploy that brings this fix in is itself such a deploy
(old script does not exec), so its newer guards must still be checked by hand once.

**Left for the next real Pi deploy:** the `restarting under` line appears under the real
`setsid nohup`, with the service running. Not provable here (no Pi).

**Related:** closes the self-update backlog item. #708's item and the cache item are not closed
by this: they remain open on their own terms; only the "guards never ran" cause is fixed.
