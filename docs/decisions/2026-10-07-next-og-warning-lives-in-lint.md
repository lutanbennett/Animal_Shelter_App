# The `next/og` warning lives in lint, not in a closed backlog item (2026-10-07)

The backlog item for GHSA-vcvr-r3jv-pc5j (critical RCE in `next/og`
`ImageResponse`, next 16.2.0 – 16.3.5) was left open after the fix landed,
for one reason: it carried a standing warning that a future Open Graph feature
would reach for exactly that API, and a closed backlog item is not where that
person looks.

Re-verified 2026-10-07: `npm audit --omit=dev` finds 0 vulnerabilities, `next`
is pinned at 16.3.8 (the fixed version), and `grep -rnE "next/og|ImageResponse"
src worker` finds nothing.

**Chosen home: `scripts/check-next-og.mjs`, run as the last step of `npm run lint`
(so it runs in CI and in `gates.mjs`).** It fails only on the dangerous
combination — `next/og`, `ImageResponse` or an `opengraph-image` / `twitter-image`
/ `icon` / `apple-icon` convention file present, *and* the installed Next older
than 16.3.8. It passes silently today.

**Why this one:** it does not depend on anyone reading anything, and it still
works after the feature exists, which catches a later downgrade (a stray
`npm audit fix --force`, a bad lockfile merge) as well as a feature written
against an unpatched Next.

**Why not fail on any use of `next/og`:** with a patched Next that is legitimate,
and a check that cries wolf gets deleted. The check would be wrong the day the
first Open Graph image is correctly added.

**Why not the others alone:** a comment "where the code would go" has no file to
live in — there is nowhere today that an `ImageResponse` import naturally lands,
and Next's convention files are created fresh. This file, and the existing
`2026-10-01-next-og-advisory-handled-as-routine.md`, are the record; neither is
something anyone greps while adding the feature.

Raise `FIXED` in the script if a later advisory on the same API names a newer
version.
