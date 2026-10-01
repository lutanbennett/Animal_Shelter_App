# The critical `next/og` advisory is routine for this app (2026-10-01)

CI's `audit` job (#262) reported GHSA-vcvr-r3jv-pc5j, a critical remote code
execution in `next/og` `ImageResponse`, against `next` 16.2.0 – 16.3.5. We
bumped `next` and `eslint-config-next` to **16.3.8** (an explicit version
bump, not `npm audit fix --force`); `npm audit` then reports 0
vulnerabilities.

**Why it was handled as hygiene, not an incident:** the app does not use the
affected API. Checked 2026-10-01 across `src/` and `worker/`: no import of
`next/og`, no `ImageResponse`, and none of the convention files that use it
implicitly (`opengraph-image*`, `twitter-image*`, `icon.tsx`/`icon.ts`,
`apple-icon*`). Open Graph tags come from `generateMetadata` with a
`metadataBase` from `getSiteOrigin()`.

**The claim expires.** It stops being true the moment someone adds an
`opengraph-image.tsx`, `twitter-image.tsx`, a generated `icon.tsx`, or imports
`next/og`. Anyone doing that must confirm the installed Next is past the
advisory first. The check to repeat:
`grep -rnE "next/og|ImageResponse" src worker`, plus a search of `src/app`
for the file names above.
