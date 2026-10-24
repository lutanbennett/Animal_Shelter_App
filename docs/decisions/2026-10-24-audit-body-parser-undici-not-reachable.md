# The `body-parser` and `undici` advisories are not reachable in the deployed Worker (2026-10-24)

`audit` went red on #894, the `0.40.0` cut, with **two high advisories**. It had been green
since the `next@16.4.2` bump in `0.39.4`. Fixed nothing, and this is why.

**`audit` cannot block.** It is `continue-on-error: true`, so it cannot fail a CI run or a
merge (`CLAUDE.md`). But a red `audit` asks for a reachability judgement, and hesitating over
one cost a release 45 minutes on 2026-10-07. So: judged, recorded, merged.

## What the advisories are, and where they come from

Both reach the tree **only** through `@opennextjs/cloudflare`, which sits in `dependencies`
(not `devDependencies`), which is why `npm audit --omit=dev` sees them at all.

| Advisory | Path | What it is |
|---|---|---|
| `body-parser` 2.0.0–2.3.0, GHSA-27r3-jxmh-p828 | `@opennextjs/cloudflare` → `@opennextjs/aws` → `express` | DoS via trailing bytes after a compressed request body |
| `undici` 7.0.0–7.30.0, GHSA-4qv8-2p9j-2685 / GHSA-f72v-6w45-q472 / GHSA-xjj6-f33q-929c | `@opennextjs/cloudflare` → `wrangler` → `miniflare` | DoS in the EventSource parser; SRI bypass via non-lowercase algorithm tokens; DoS on excessive content-encodings |

`body-parser` arrives via OpenNext's **AWS adapter**, which this app does not use — it deploys
to Cloudflare. `undici` arrives via **wrangler** (the CLI) and **miniflare** (the local
emulator). Neither is a thing a Worker runs.

## Reachability was measured, not argued

Grepping `worker.js` would prove nothing: it is a **2.2 KB entry shim**. The real artifact is
the bundled server function, `.open-next/server-functions/default/handler.mjs`, **21 MB**. In it:

```
undici matches: 0
body-parser matches: 0
bodyParser matches: 0
EventSource parser: 0
```

Matches do exist under `.open-next/server-functions/default/node_modules/` — a `workerd.exe`
binary, a `dotenvx` changelog, adapter source — but that is OpenNext's staging directory and
those are string mentions, not wired code. **The bundle that ships contains neither package.**

**Caveat, stated rather than hidden:** the `.open-next` build inspected was `0.39.5`'s test
Worker build. It carries because `package-lock.json` is **unchanged across the `0.40.0` range** —
the only `package.json` change is the `lint` script gaining `check-activity-lists.mjs` — so the
dependency tree is identical.

## Why no fix, including the one that looks free

**The `undici` fix must not be taken.** `npm audit fix --force` reports *"Will install
wrangler@4.35.0, which is a breaking change"*, and this repo is on **4.145.0** — a move
**backwards**, which is exactly the trap `CLAUDE.md` records from 2026-10-07, when the only fix
offered dragged the Cloudflare build and deploy chain back to `wrangler@4.15.2`.

**`body-parser` alone would take a non-breaking `npm audit fix`**, and it was still not taken:
it is a transitive dependency of the same build chain, it changes nothing reachable, and
touching the Cloudflare build and deploy chain in the middle of a release buys nothing. If it is
wanted, it belongs in its own PR with its own gates, not inside a cut.

## What would change this conclusion

- OpenNext beginning to bundle its AWS adapter into the Cloudflare output, which would put `express` and `body-parser` in the Worker.
- The app adopting `EventSource` or subresource-integrity handling that runs through `undici` in the Worker.
- `@opennextjs/cloudflare` moving to `devDependencies`, which would remove both from `audit:prod` without changing anything real — **worth noticing as cosmetic if it happens**, since it would make a red go away without making the app safer.

Neither of the first two is true today. **Do not re-derive this from scratch**; re-check the
bundle grep above against a current build instead.
