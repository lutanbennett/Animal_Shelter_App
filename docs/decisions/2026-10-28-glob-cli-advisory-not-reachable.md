# The `glob` CLI advisory is not reachable here, and its offered fix would undo the cron fix

**2026-10-28, during the `0.40.9` release.** `npm run audit:prod` exits 1 with one advisory,
**`GHSA-5j98-mcp5-4vw2` — "glob CLI: Command injection via `-c/--cmd` executes matches with
`shell:true`"**, high severity, reported four times over the same dependency path.

**Decision: ship, do not fix.** Recorded here because `docs/release-procedure.md` requires a high or
critical to be either stopped-and-fixed or named in a decision file saying why it is not reachable,
and because the obvious remedy is actively dangerous.

## Why it is not reachable in this app

The advisory is against **`glob`'s command-line entry point**, not its library API. `glob@10.3.3`
declares `"bin": "./dist/cjs/src/bin.js"`, and the flaw is that **that binary**, given `-c`/`--cmd`,
runs the matched paths through a shell.

- **Nothing in this repository invokes it.** `grep -rn 'glob -c\|glob --cmd\|node-minify' package.json
  scripts/ worker/` returns nothing. There is no npm script, no deploy script and no Worker code that
  runs the `glob` binary at all, with or without `-c`.
- **It is not ours; it is four levels down a build-time chain.** The path is
  `@opennextjs/cloudflare` → `@opennextjs/aws` → `@node-minify/core` → `glob`. `@node-minify` is a
  minifier used while building the bundle, not something the Worker calls at runtime.
- **It is not in the deployed Worker.** `grep -c 'node-minify' .open-next/worker.js` returns **0**.
- **`--omit=dev` lists it as production only because of where it sits in the tree**, not because it
  runs in production.

Taking a shell-injection advisory seriously means asking *who controls the input to the shell*. Here
there is no invocation at all, so there is no input and no shell.

## Why the offered fix must NOT be taken

`npm audit` says:

```
fix available via `npm audit fix --force`
Will install @opennextjs/cloudflare@1.20.9, which is a breaking change
```

**`1.20.9` is OLDER than the `1.20.13` this project upgraded to a few hours earlier**, in `244a1731`
(#1005), **to fix a four-day production outage**. Adapter 1.20.6 throws on
`.next/server/preview-props.json`, which Next 16.4 added; the Worker crashed on every scheduled run,
and the 15-minute cron was dead from 2026-10-23T10:00Z to 2026-10-27T16:45Z — the calendar sweep,
every status-alert email and the translation drafts with it.

So `audit fix --force` would **trade an unreachable CLI flaw for a repeat of a real, four-day,
user-visible outage.** This is precisely the behaviour `CLAUDE.md` warns about — *"it is free to move
a dependency backwards across a major version"* — and it is the second time the same command has
offered to drag the Cloudflare chain backwards (the first was `wrangler@4.15.2` on 2026-10-07,
`docs/decisions/2026-10-07-sharp-override.md`).

**Do not run `npm audit fix --force` on this repository.** If a future session sees this advisory and
reaches for it, read this file first.

## What would change the answer

- **An upstream fix.** `@node-minify/core` moving to `glob` ≥ 10.5, or `@opennextjs/aws` dropping the
  minifier. Then it resolves itself on the next adapter bump and this file can be deleted.
- **Anything in this repo starting to run the `glob` binary**, especially with `-c`/`--cmd` on a path
  built from untrusted input. Nothing does today; the `grep` above is the check.
- **An adapter release ≥ 1.20.13 that also clears the advisory.** That is the version to take — never
  one below 1.20.13, whatever `audit fix` offers.

## Incidental, and worth knowing

The same adapter upgrade that caused this entry **resolved the four advisories that had been carried
since 2026-10-24** — `GHSA-27r3-jxmh-p828`, `GHSA-4qv8-2p9j-2685`, `GHSA-f72v-6w45-q472` and
`GHSA-xjj6-f33q-929c` (`body-parser`, `undici`). All four were confirmed **absent** from this
release's `audit:prod` output by grepping for each ID rather than by noticing the package names had
changed. `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` describes a state that
no longer exists; it is kept as history rather than deleted, because a release record cites it.
