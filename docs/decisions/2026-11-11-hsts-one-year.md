# HSTS raised to a year (`#etr20`)

`worker/security-headers.mjs` now sends `strict-transport-security: max-age=31536000`. Still no `includeSubDomains` and no `preload`, as the item required.

Two of the item's conditions were marginal, so the reasoning is recorded:

- **Stable for a month since the CSP went enforcing (2026-10-07):** the file changed once since, on 2026-11-04 (`www.googleapis.com` added to `connect-src`, for video uploads). That touched the CSP only; the HSTS line has not changed since 2026-09-30.
- **Nothing about HTTPS on `lannacare.org` changed:** the item names a host that has since moved. Production is `lannacareforanimals.org` and `lannacare.org` now 301s to it (2026-11-08). HSTS is per host, the Worker sends the same header on every host, and each host is served over HTTPS by Cloudflare, so the year's commitment is one every host already meets. Without `includeSubDomains`, `pi.*` and any future subdomain are not bound.

It reaches browsers only when a release ships the Worker; the production Worker deploy is Lutan's.
