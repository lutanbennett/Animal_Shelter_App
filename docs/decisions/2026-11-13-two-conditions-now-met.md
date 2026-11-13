# The `sharp` override is deleted; the test `/login` 503 did not reproduce (2026-11-13)

Closes `#qir2c` and `#q4m7t`, both parked on a condition that has since been met or measured.

## `#qir2c`: why removing the override was safe

`docs/decisions/2026-10-07-sharp-override.md` added `"overrides": { "sharp": "^0.35.5" }` because `miniflare`
pinned `sharp` 0.35.4, which carries GHSA-wq5f-xc86-pv6w. Three readings, taken 2026-11-13 before deleting:

- `miniflare` 5.20261023.0-beta asks for `sharp` **0.35.5** itself.
- `next` asks for `^0.35.4` and takes 0.35.5.
- Installed `node_modules/sharp` is **0.35.5**.

The override block was removed from `package.json`. `package-lock.json` is unchanged: it never recorded the override,
and `npm ci --dry-run` still accepts it. A fresh `npm install --package-lock-only` also resolved both `sharp` entries to
0.35.5 (it only added unrelated nested `@tailwindcss/oxide-wasm32-wasi` entries, which were discarded as noise).
`npm ls sharp` shows `next -> sharp@0.35.5` and `wrangler -> miniflare -> sharp@0.35.5 deduped`.

`npm run audit:register`: 1 high advisory (glob, GHSA-5j98-mcp5-4vw2), already registered. Nothing about `sharp`.

## `#q4m7t`: `/login` on test

Method: `curl` of `https://test.lannacare.org/login` (URL from `wrangler.jsonc`, route `test.lannacare.org`), 2026-11-13
~05:26 UTC, one request each, no deploy, no Pi access. Result: **200**, `x-lanna-served-by: pi`. `/` also 200 (`pi`);
`/about` 307 (`pi`).

**Not reproduced; this is not a claim it was fixed.** Limits: one reading, from one place (Bangkok edge), a day after
the sighting and after #1535 shipped. It cannot say what the original 503 was, which layer produced it, or whether the
Pi being away would now still render `/login` (that is covered by #1535's unit tests, not by this reading).
