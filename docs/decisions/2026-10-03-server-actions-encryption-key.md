# The Worker and the Pi build with one Server Actions encryption key

2026-10-03. `scripts/lib/actions-key.mjs`, `scripts/actions-key.mjs`,
`scripts/check-actions-key.mjs`; wired into `scripts/deploy.mjs`,
`scripts/pi/write-env.mjs` and `scripts/pi/deploy-pi.sh`. Closes the backlog item
filed from `2026-10-02-origin-write-fallback.md`, which had reasoned this from
Next's self-hosting guide and not reproduced it.

## What was checked, and what happened

Hypothesis (the guide): builds without a shared `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
answer "Failed to find Server Action" to a form another build rendered.

Method, on this checkout, Next 16.3.8: `next build` four times; for each pair,
`next start` the first, `GET /login`, keep the hidden inputs of both forms on the
page (the sign-in form, which closes over state, and the Google form, a bare
action id), stop it, `next start` the second, and `POST` those inputs to `/login`
with a matching `Origin`. Builds A and C had no shared key (A random, C given one);
C and D were built with the same given key.

| Rendered by → posted to | Result |
|---|---|
| A → A (control) | works: `Invalid login credentials` (the action ran); Google form 303 |
| A → C (different keys) | **HTTP 500, `Failed to find Server Action "6054a5d1…"`**, both forms |
| C → A (different keys) | same 500, both forms |
| C → D (same key, two separate builds) | works, both forms |

An OpenNext (Worker) build made with that key records the same key and the same
164 action ids, login's two included, as the plain `next build` the Pi runs. So the
two kinds of build agree when given the same key.

## The finding: worse than the guide says

The guide talks about closure variables failing to decrypt. What fails is
**every** action, including ones that close over nothing: Next uses the key as the
salt of the action ids themselves (`serverReferenceHashSalt: encryptionKey`,
`next/dist/build/webpack-config.js`), so two builds with different keys give the
same action different ids and the second has never heard of the first's. The
guide's remedy is the right one; its stated symptom understates the problem.

It had not shown up because two builds in one checkout with a warm `.next/cache`
**reuse the key**: Next caches it in `.next/cache/.rscinfo` for 14 days and builds A
and B here came out identical. Successive deploys on one machine therefore agree
with each other. The Worker is built on the dev machine and the Pi on the Pi, so
they never share a cache and always differ. Until 2026-10-02 that did not matter,
because a write only ever reached the Pi's build. The write fallback made it
reachable: a page the Pi rendered just before it dropped is posted to the Worker's
build, and the reverse when it comes back.

## The fix

One key per environment (test, uat, production), set identically in two places:

- `scripts/deploy.mjs` puts `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` in the Worker
  build's environment, from the same values file as everything else.
- `scripts/pi/write-env.mjs` writes it to `.env.production.local`, which `next build`
  and `next start` both read on the Pi (checked: a build with the key only in that
  file records it). `next start` also prefers the variable to the manifest at run
  time, so the running server and its build cannot disagree.

It is a secret, so it sits where the other per-environment values do —
`.env.deploy.<env>`, or `.env.local` for test — never in the repo, and it needs no
Cloudflare secret: the build embeds it, as it embeds the random one today (the
bundle's manifest already carried a key; nothing new is exposed).

Rejected: one key for all environments (a test form should not be accepted by
production, and the separation costs one more line); a per-build key (defeats the
purpose); a new secret mechanism (the brief said use the existing one).

**Making a silent mismatch loud** was the point, since a mismatch reproduces the
bug and nothing errors until a form crosses over:

- Both builds refuse to start without a valid key (base64 of 16, 24 or 32 bytes).
- Both read the finished build's `.next/server/server-reference-manifest.json` and
  stop if its key is not the configured one — a `--skip-build` over an old build
  would otherwise slip through. `deploy-pi.sh` does it before the restart, so the
  running service keeps what it has.
- Both print a fingerprint (first 12 hex of a SHA-256; the key itself is never
  printed). `node scripts/actions-key.mjs --env <name>` prints the same on either
  machine. Equal fingerprints, equal keys.
- `scripts/check-actions-key.mjs`, in the CI `script-integrity` job, tests those
  helpers and fails if `deploy.mjs`, `write-env.mjs` or `deploy-pi.sh` stops
  carrying the key. It does not build; the cross-build behaviour is the experiment
  above, done once.

## What it does not do

- **Rotation** (a new key in all places, then both deploys) makes forms already open
  fail once, the same as any deploy. A reload fixes it.
- It is about the key only. Whether a page and a build made from *different code*
  agree (a deploy landing while a form is open) was not tested here and is out of
  scope; the experiment above used the same commit throughout.
- It takes effect only when **both** machines have the line in their values file
  and both have deployed. Until the first of those deploys, the old behaviour holds.
  Both deploys now refuse to run until the line is there.
