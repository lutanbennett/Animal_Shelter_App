# An untagged Worker stays amber on the Release tile

2026-10-16. Backlog: "The production Worker's release check is amber".

## What changed

`checkRelease()` (`src/lib/status/health.ts`) used to give one amber for any tag
that was not `v<latest>`. It now still goes amber for both, but says which:

- **No tag at all.** What `wrangler secret put` leaves behind (a new Worker
  version from the same code). Wording: expected right after a hand-set
  setting, clears at the next deploy through `deploy.mjs`; otherwise ask who
  deployed last. `facts.tagProblem = "untagged"`.
- **Tagged as a different release.** Only a deploy that skipped or half-finished
  `deploy.mjs` produces this. `facts.tagProblem = "other"`.

## The question: with no tag, can the Worker know its code is the release?

No, not reliably. Everything the Worker can read about itself was stamped by the
build that produced it:

- `latestRelease.version` is bundled from `src/lib/releases.ts`, and is also what
  the check compares the tag *to*, so using it as evidence is circular.
- `BUILD_VERSION` / `BUILD_SHA` (`next.config.ts`) come from whatever checkout was
  built. A `wrangler deploy` of a release-versioned commit, or of a dirty tree on
  top of one, reports the same version. `deploy.mjs` refuses unreleased notes
  and a dirty tree, but that guard is exactly what a bypass skips.
- `CF_VERSION_METADATA` has an id, timestamp and the tag. No code hash.

So "untagged and the build says it is the latest release" cannot be told from a
bypassed deploy of that same version string.

## Rejected: downgrade to green when the build self-reports the latest release

(Plus `unreleased` empty, and `BUILD_SHA` present.) It would have made the tile
green after a hand-set secret. It also makes a real bypass of a release-looking
build read green, removing the one signal that says what is running. A false
amber costs a minute; a false green costs that signal. Rejected.

## Also not done

Checking `BUILD_SHA` against GitHub (a tagged release commit) would be a real
signal, but needs an outbound call from a status render and a tag convention that
does not exist. Left as a possible later step if the amber proves a nuisance.
