# Which absolute URLs the proxy may build, measured on a Pi-shaped server (#pihst)

## The class, three instances

All three are one mismatch: **the Pi's server is bound to `127.0.0.1` and cloudflared forwards `Host: localhost:<port>`, so
what Next computes as "this server's origin" is not the origin the visitor used.** Anything that compares the two, or
builds a URL from one and hands it to Next, misbehaves only on the Pi, never in `next dev`.

1. **2026-09-30, server actions.** cloudflared overwrote `x-forwarded-host`; Next compared the browser's `Origin` with it and
   aborted every `use server` call. Live mitigation: `serverActions.allowedOrigins: siteAllowedOrigins()`
   (`next.config.ts:188-199`). Not touched here. Aligning the bind with the forwarded host has history; it was not tried.
2. **2026-11-22, `#thpfx`.** `NextResponse.rewrite(<absolute url>)` was read as another origin and proxied outward over TLS:
   `Failed to proxy https://localhost:3001/ ... EPROTO`, HTTP 500. Fixed by a relative `rewrites().beforeFiles` rule.
3. **This item**, which asked whether the proxy still builds an absolute URL that hits instance 2.

## The harness (left behind, as `#thpfx` did not)

```
npx next build
node scripts/pi-shaped-check.mjs --port 3912
```

`scripts/pi-shaped-check.mjs` starts `next start --hostname 127.0.0.1`, sends each request with `Host: localhost:<port>` and
`x-forwarded-proto: https` (via `http.request`, since `fetch` cannot set `Host`), checks the status and `Location`, and fails
if the server log says `Failed to proxy`. It sets `APP_HOST`, `PUBLIC_HOST` and `PLATFORM_HOST` to made-up `.test` hosts so the
host redirects have something to do.

**It reproduces the original fault.** With the `/th` handling reverted in the working tree to
`NextResponse.rewrite(request.nextUrl.clone() with pathname = thRest)`, a production build answered `/th/adopt` 500 and
logged `Failed to proxy https://localhost:3912/adopt ... EPROTO ... wrong version number`. With the real code restored,
the same request answers 200. (The revert was never committed.)

## The measurement: the two absolute redirects are safe

`src/proxy.ts` builds `NextResponse.redirect("https://<host>...", 307)` in two places (the platform redirect, and
`hostRedirect`). On the same Pi-shaped server, all three redirect cases answered **307 with the right `Location`**, and the log
showed no `Failed to proxy`, **in the same build in which the absolute rewrite was failing**:

| Request (Host `localhost:<port>`) | Result |
|---|---|
| `/adopt`, public page asked on the app host | 307 `https://pub.pihst.test/adopt` |
| `/residents`, staff page asked on the public host | 307 `https://app.pihst.test/residents` |
| `/residents`, asked on the platform host | 307 `https://plat.pihst.test/platform` |

A redirect is only a `Location` header the browser follows itself; Next never fetches it, so there is no origin to compare.
That is why the two are unaffected. **They are left exactly as they are**; they are how host-to-host navigation works.

## Which absolute URLs the proxy may build

- **`NextResponse.redirect(<absolute>)`: allowed**, and needed for the cross-host moves. Measured safe.
- **`NextResponse.rewrite(...)`: never**, absolute or not, from `src/proxy.ts` or `src/lib/supabase/proxy.ts`. A rewrite is
  fetched by Next, so an absolute one is read as another origin. Rewrite with a relative `next.config.ts` rule keyed on a
  header the proxy sets. `src/lib/th-rewrite.test.mjs` already fails if `NextResponse.rewrite(` returns.
- `NextResponse.next(...)` has no URL and is fine.

## Guard: none added, on purpose

The existing source test already forbids the one construct that fails. A broader rule (no absolute URL in the proxy) would
forbid the redirects that were just measured to be fine. A guard matching today's strings adds little beyond the comment
now above the two redirects. The harness is the real guard: run it before shipping any new proxy behaviour.
**Bind and `scripts/pi/*.service` unchanged**; a Pi deploy is Lutan's.

## Could not verify

This is a Pi-**shaped** build, not the Pi: no cloudflared, no Worker, no TLS terminator, and Windows rather than the Pi's OS.
It does not prove production, UAT or test, and it is not wired into CI (`ci.yml` belongs to another stream; it needs a full
production build, about five minutes). Nothing here bears on `#thpfx`'s outstanding production proof.
