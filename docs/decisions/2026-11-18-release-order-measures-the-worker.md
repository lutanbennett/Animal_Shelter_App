# The release-order guard now observes the live Worker (2026-11-18)

`#ujqr5`'s "a Worker version endpoint would turn this assertion into a measurement" is done. The guard used to trust the commit the release manager typed after `--worker-deployed`; its own comment said nothing reports what the Worker runs. `GET /api/releases/current` (`worker/release-mail.mjs`) does, and the `0.47.2` record already read it on all three hosts.

## What changed
`scripts/check-release-order.mjs` fetches `<site>/api/releases/current` for the environment (`SITE_ORIGINS`, 15 s timeout) and passes `liveVersion` into `releaseOrderProblems()`, which stays pure (the fetch is injected like `read`). The live version must equal the `version` at the named commit's `src/lib/releases.ts`; the byte comparison of the Worker files stays. `/api/version` is untouched: it is the Pi's answer on purpose.

## Q1: what does a version prove?
It **corroborates**, it does not prove. The version is the release the Worker bundle was built from; two commits inside one release share it, so it cannot tell which commit. It does catch the real mistake (naming a commit from the wrong release, or a Worker never redeployed after a cut). So: version must match, AND bytes at the named commit must equal origin/main. Having the Worker report its commit would be stronger but needs a `worker/` change and deploy path; not built here.

## Q2: unreachable endpoint
**Refuse**, with a message that says "could not ask the live Worker", distinct from the "reports release X but you named release Y" mismatch. A guard that cannot tell must not look like one that passed, and 2026-11-18 showed unreachable is a real state. It only refuses when a guarded migration is pending, so unrelated releases never depend on the network.

## Limit that remains
The commit is still typed, not reported. Same-version, different-commit Workers are told apart only by the byte check against the named commit, which trusts that the named commit is what was deployed.
