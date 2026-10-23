# Next 16.3.8 → 16.4.2: three advisories, one plausibly reachable (2026-10-23)

CI's `audit` job (#863, run 39877851568) named three advisories against `next`
16.0.0 – 16.4.0. We bumped `next` to **16.4.2** (the latest release, a minor
from 16.3.8) by an explicit `npm install next@16.4.2 --save-exact`, **not**
`npm audit fix --force`. Only `next` and its own transitive entries moved in
`package-lock.json`.

Reachability, **all re-checked today (2026-10-23) against this tree**:

| Advisory | Severity | Reachable? | Evidence |
|---|---|---|---|
| GHSA-2464-fhr4-w9xw, RCE in Image Optimization API with SVG | critical | No | `next.config` sets `images: { unoptimized: true }`; OpenNext on Workers has no `/_next/image` optimizer, photos go through `/api/photos/[fileId]` as plain `<img>` |
| GHSA-673q-mjm6-r5xr, RCE in `use cache` returning typed arrays | high | No | `grep -rn '"use cache"' src worker` returns 0 |
| GHSA-p3m5-59mp-jv5r, DoS in App Router Server Actions | lower | Plausibly | 75 files start with `"use server"` (the backlog item said 77; a stricter pattern) |

The Server Actions DoS is the real reason to bump; the other two cannot fire.

**The claim expires** if someone enables the image optimizer or adds `"use cache"`
while on a Next affected by these; re-check the installed version first.

Verification: `gates.mjs` typecheck/lint/test/build all exit 0; `opennext:build`
and a dev-server smoke test recorded in `docs/test-plans/next-16-4-2-bump.md`.
Still owed by the release manager: a test-environment smoke test before production.
