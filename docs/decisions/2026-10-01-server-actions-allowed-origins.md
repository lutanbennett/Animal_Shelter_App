# Server Actions: allow the public hosts, because cloudflared rewrites `x-forwarded-host`

2026-10-01

## What broke

From 2026-09-30 20:54 — commit `d7a3961`, "Worker: production ORIGIN_HOST points
at the Pi" — **every Server Action on `lannacare.org` was rejected**. Not only
sign-in: every `"use server"` file in the app, so every form, every mutation and
the whole admin surface. `GET`s were unaffected, so the site looked healthy right
up to the moment anyone tried to do something, and the browser showed only
`A server error occurred` with an opaque digest (`3349748232@E80`).

The Pi's journal carried the real message:

```
`x-forwarded-host` header with value `pi.lannacare.org` does not match `origin`
header with value `www.lannacare.org` from a forwarded Server Actions request.
Aborting the action.
```

## Why

Next compares the browser's `Origin` against the app's own host, taken from
`x-forwarded-host` or `host`, and aborts the action when they differ — CSRF
protection, on by default, in production as well as development.

The request crosses two proxies, and the second undoes the first:

1. The browser asks for `www.lannacare.org`, so `Origin: https://www.lannacare.org`.
2. `worker/index.mjs` sets `x-forwarded-host` to that public host — correctly,
   and it has done so since `e8d3b5f` (2026-09-22) — then fetches
   `pi.lannacare.org`.
3. **cloudflared receives the request at `pi.lannacare.org` and sets
   `x-forwarded-host` to its own ingress hostname**, discarding the Worker's value.
4. Next compares `www.lannacare.org` against `pi.lannacare.org` and aborts.

`httpHostHeader: lannacare.org` in `scripts/pi/cloudflared-config.yml` is why
this was not caught by reasoning about the config: it does rewrite `Host`, so
redirects, cookies and `getSiteOrigin()` all see the public name. But it rewrites
`Host` **only** — `x-forwarded-host` is set separately by cloudflared and takes
precedence in Next's check. The config that makes everything else correct is the
same config that leaves this one header wrong.

## The fix

`experimental.serverActions.allowedOrigins` in `next.config.ts`:

```ts
allowedOrigins: ["lannacare.org", "*.lannacare.org"],
```

`node_modules/next/dist/docs/.../serverActions.md` is explicit that the entries
are **the hosts in the visitor's address bar**, not the internal host the server
reports — so `pi.lannacare.org` is deliberately *not* listed. The apex needs its
own entry because `*` stands for exactly one label and never matches the bare
name; `*.lannacare.org` covers `www.` and `test.`.

## What was considered and rejected

- **Stop cloudflared setting the header.** It has no option for that;
  `httpHostHeader` governs `Host` alone.
- **Listing `pi.lannacare.org`.** It would work, and it is the wrong shape: it
  tells Next to trust the internal hop rather than naming the origins the app is
  actually served on, and it would keep working if the public hostname changed,
  which is exactly when you would want it to fail.
- **Pointing `ORIGIN_HOST` back at the Worker.** A real mitigation, and the right
  emergency lever, but it gives up the Pi rather than fixing it.

## Worth remembering

The Worker, the tunnel and the app were each correct in isolation. The fault was
only in their composition, and only for `POST`, which is why five days of green
CI, a passing build and a working `test.lannacare.org` said nothing about it:
**`test.lannacare.org` is rendered by the Worker and never touches cloudflared**,
so the one environment that was exercised could not reproduce the one path that
was broken.
