# `sharp` is pinned past its advisory with an `overrides` entry (2026-10-07)

`sharp <0.35.5` carries a **high** advisory,
[GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)
(CVE-2026-96889), in the librsvg copy it bundles for SVG rendering. It is in
the **production** tree, so `npm run audit:prod` fails on it:

    @opennextjs/cloudflare@1.20.6   (a `dependencies` entry)
      -> wrangler
        -> miniflare
          -> sharp@0.35.4

`next` pulls the same `sharp@0.35.4` through its optional image-optimiser
dependency. `wrangler` itself is only a devDependency, which makes the chain
easy to misread as dev-only — it is not.

## Why an override, and not the fix npm offers

There is no newer release to move to. `miniflare` pins `sharp` at exactly
`0.35.4`, and every current `wrangler` pins that `miniflare`, so the version
resolver has nowhere to go. That is why `npm audit fix --force` reports
*"Will install wrangler@4.15.2, which is a breaking change"*: its only route
to a clean tree is to drag the Cloudflare chain **backwards** by a major
version — the chain that builds and deploys this app, including the
`strip-baked-env` and junction-symlink steps the deploy depends on. Accepting
a major regression of the build chain to clear a warning about an unreachable
code path is the larger risk by a wide margin.

So `package.json` gets:

```json
"overrides": { "sharp": "^0.35.5" }
```

`sharp` 0.35.5 is a patch release over 0.35.4 and satisfies `next`'s own
`^0.35.4`. `npm run audit:prod` goes from **4 high** to **found 0
vulnerabilities**.

## This is hygiene, not an incident — and the claim is checkable

The flaw is in SVG rendering inside `sharp`. Two things keep it out of reach,
both verified on 2026-10-07:

- `next.config.ts` sets `images: { unoptimized: true }` — there is no
  `/_next/image` optimiser on Workers, so the app renders plain `<img>` tags
  and photos go through `/api/photos/[fileId]`. `dangerouslyAllowSVG` is not
  set anywhere. Next's `sharp` is never invoked.
- `miniflare` is the local Worker simulator. It does not run in production.

No untrusted SVG reaches `sharp`. That is the same judgement recorded for the
`next/og` RCE in `2026-10-01-next-og-advisory-handled-as-routine.md`: the
dependency is vulnerable, the code path is unused, so this is "patch on the
next convenient day" rather than a hotfix.

**The claim expires** the same way that one does. It stops being true if
anyone sets `dangerouslyAllowSVG`, turns the image optimiser back on, or adds
server-side image processing through `sharp`. Anyone doing that must confirm
the resolved `sharp` is past the advisory first.

## The override is meant to be temporary

An `overrides` entry pins a transitive dependency behind its maintainer's
back: `miniflare` asked for exactly `0.35.4` and is getting `0.35.5` anyway.
That is sound for a patch bump and nothing else — it is not a licence to hold
the pin indefinitely. Once `wrangler` and `miniflare` ship a `sharp` past
0.35.5, the entry should be deleted and the resolver left to do its own job.
Filed as a follow-up on the `backlog` branch rather than here, per CLAUDE.md.

## What was not changed, deliberately

Neither CI workflow. The PR `audit` job is `continue-on-error: true` and
`advisories.yml` is allowed to fail on purpose; `ci.yml` says in terms *"Do
not 'tidy' the two to match"*, and
`2026-10-02-scheduled-audit-fails-on-purpose.md` has the reasoning. That
question was raised and rejected on 2026-10-06 and is not reopened here. This
PR removes the *cause* of the red, which is the only thing that should clear
it.
