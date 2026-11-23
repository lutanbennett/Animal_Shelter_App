# `/th` answered 500 on the Pi: the Thai rewrite is now a config rewrite (#thpfx)

## Cause

`src/proxy.ts` served `/th/<page>` by calling `NextResponse.rewrite(url, { request })` with `url` cloned from
`request.nextUrl`. That URL is **absolute and built from what the visitor sent**: the Worker's `x-forwarded-proto: https`
and cloudflared's `Host: localhost:<port>`. On the Pi, `next start --hostname 127.0.0.1` computes its own origin from
its bind address, so the rewrite target (`https://localhost:3001`) was a *different origin* from the server's
(`127.0.0.1`). Next treats a rewrite to another origin as an external proxy, sent over TLS to a plain-http port:

    Failed to proxy https://localhost:3001/ Error: write EPROTO ... wrong version number

(read from `journalctl -u lanna-care-test` on the Pi, 22 Nov). Result: HTTP 500 wherever the target renders.

Reproduced locally only with the Pi's exact shape: production build, `next start --hostname 127.0.0.1`, header
`Host: localhost:<port>`, `x-forwarded-proto: https`. **`next dev`, a plain `next start`, and a request with the
Worker's other headers all answer 200**, which is why a dev check never showed it. Not the lock, not the edge, not
Thai content: those were ruled out by the measurements in the item and still stand.

## Fix

The path mapping moved to `next.config.ts` `rewrites().beforeFiles`: `/th/:path*` -> `/:path*`, only when the request
carries `x-locale-path: th`. The destination is relative, so there is no origin to compare. The proxy still decides
*whether* an address is a Thai one (`thPathRest()`), still sets/deletes the header, and still runs the gate on the bare
path; it no longer calls `NextResponse.rewrite`. `updateSession` lost its `rewriteTo` parameter.

The header condition keeps the rule narrow: the proxy deletes any client-sent `x-locale-path` first and sets it only
for an address `thPathRest()` accepts, so `/th/bills`, `/th/login` and `/th/api/..` are not reachable by the rewrite
(measured: `/th/bills` and `/th/login` still 307 to login).

## Proof (dev, production build, Pi-shaped request, site open)

`/th` 200 (Thai), `/th/` 308 -> `/th`, and `/th/adopt`, `/th/donate`, `/th/our-work`, `/th/platform/about`,
`/th/platform/features/x` each answer the same status as their bare targets; `<html lang="th">` on the Thai address,
`en` on the bare one, and a spoofed `x-locale-path` on `/adopt` stays English.

## Guard

`src/lib/th-rewrite.test.mjs` reads the sources: no `NextResponse.rewrite(` in either proxy file, and the config rule is
present and keyed on the header. It is a source test because the fault needs the Pi's bind shape to run; it stops the
same line coming back, it does not exercise Next. The live proof is the request set above.

## Not done

Production proof is outstanding (planner and Lutan): `/th`, `/th/platform/about` on production after the next Pi deploy.
`PUBLIC_SITE` was not touched anywhere. The tests were written after the fix, not before: the failure only exists in
a built server with a particular bind address, so a failing unit test was not possible first.
