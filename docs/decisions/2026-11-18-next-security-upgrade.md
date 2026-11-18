# Next 16.4.2 -> 16.4.6, taken with an explicit install (#nxsec)

**Version:** `next` 16.4.2 -> 16.4.6 (exact pin kept). `npm audit --omit=dev` no longer lists either
`next` advisory: GHSA-mfr8-8qww-v76h (`unstable_cache` over `'use cache'`, >=16.3.0 <=16.4.4) and
GHSA-vc7v-qv4w-wrv8 (nested `'use cache'` leak, >=16.2.0 <=16.4.4). Neither was reachable here;
`scripts/check-next-cache-apis.mjs` still passes and guards it.

**Route:** plain `npm install next@16.4.6 --save-exact`, not `next upgrade --agent=security`. Read
`node_modules/next/dist/cli/next-upgrade.js`: `--agent` launches an AI agent session, copies codemod docs,
runs `@next/codemod upgrade ... --yes` and asks the agent to set `experimental.agentUpgrade` in the Next
config. For a patch bump that is more moving parts than a reviewer wants; the explicit install is a
two-file diff (`package.json`, `package-lock.json`) and trivial to revert. No `src/` or `worker/` file changed.

**Moved with it:** nothing else. `eslint-config-next` stays at 16.3.8 (it is not patch-locked to `next`,
and the brief forbids unrelated bumps); `@opennextjs/cloudflare` untouched.

**Deliberately not changed:** the `glob` chain (GHSA-5j98-mcp5-4vw2, registered, unreachable). The
`@opennextjs/cloudflare` major downgrade `npm audit` offers was not taken. `gates.mjs` and the audit
workflows untouched.

**Build halt:** see the PR body for the build exit code on the upgraded tree.
