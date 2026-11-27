# The runbook's Pi commands name `lanna-pi-mesh`, not `lanna-pi.local`

**2026-11-28, `#rbkpi` (`claude/release-runbook-fixes`).**

The `#rbkpi` brief noticed a question but left it open: the runbook gave seven Pi commands as
`ssh lutan@lanna-pi.local` and a few as `lanna-pi-mesh`. A paragraph then told the reader to use the mesh
name instead of `.local` "in every" command. That made the reader do the substitution by hand.

**Decided: every command names the mesh, and `.local` is the note.** All seven were converted in one change,
so no half-converted runbook was left in between. Reasons:

- The runbook's own text already said the mesh "works from the home network too, so when in doubt just use
  it". `.local` works only from home. A command that works everywhere is better than one that works in one
  place and comes with a note about the others.
- `0.47.0` ran all three Pi builds over the mesh with no other difference, and `0.50.0` used it throughout.
- The substitution was easy to miss. Missing it cost the third touch on `0.47.0`.

**What this does not change:** `~/.ssh/config` still has both names. `ssh -G lanna-pi-mesh` is still the
check that the alias is there. If the alias is missing, the mesh host name is in the network notes on the
Desktop (`CLAUDE.md`'s value-versus-meaning rule).

The same change fixed the detached-build recipe. The `ssh` that starts the build now runs in the background
from the start. A separate `ssh -n` reads progress, with `grep` and `tail` running on the Pi. The old
`… & sleep 20; tail` held the SSH session open until the build finished. Measured 2026-11-28: the read
shape (`ssh -n lanna-pi-mesh 'grep -icE … ~/deploy-prod.log; tail -2 …'`) returned in seconds from this PC.
