# Every address must reach the build, not just the runtime (`#plhbd`)

**2026-11-20.** `0.47.5` put the operator console on its own address, `cooperjaidee.org`. Minutes after
the deploy, Lutan did the one check `docs/domain-checklist.md` section F insists on — **prove it by
saving, not by loading** — and pressing *Continue with Google* returned *"This page couldn't load. A
server error occurred."* while the page itself rendered perfectly.

**Section F predicted this exact failure in writing:** *"a missing allowed origin refuses every button
while every page renders."* It was right, and it is the reason that section tells you to press a
button rather than open a page.

## The mechanism, and why it is easy to miss

`next.config.ts` sets `serverActions.allowedOrigins` from `siteAllowedOrigins()`
(`src/lib/site-hosts.ts`), which reads `APP_HOST`, `PUBLIC_HOST` and `PLATFORM_HOST` from
`process.env`. **That evaluation happens when the config is read — at build time.**

`PLATFORM_HOST` was declared in `wrangler.jsonc` `vars`. **Those are runtime values.** A Worker var is
handed to the running Worker; it is not in the environment of the `next build` that produced the
bundle. So the allow-list was baked without the platform address, and every Server Action submitted
from it was refused.

**Two places exist precisely to carry these values across, and the third host was missed in both:**

| Place | What it does | What it had |
|---|---|---|
| `scripts/deploy.mjs` | pins hosts into the Worker build's env | `buildEnv.APP_HOST` and `buildEnv.PUBLIC_HOST`, **a line each**, under a comment reading *"The two addresses from wrangler.jsonc"* |
| `scripts/lib/runtime-config.mjs` | declares which wrangler vars `scripts/pi/write-env.mjs` copies to the Pi | entries for `APP_HOST` and `PUBLIC_HOST`, **no `PLATFORM_HOST` entry at all** |

**Confirmed on the live box rather than inferred:** the Pi's `~/Animal_Shelter_App/.env.production.local`
held `APP_HOST` and `PUBLIC_HOST` and **not** `PLATFORM_HOST`.

## The decision: one list, not a third line

The obvious fix is to add `buildEnv.PLATFORM_HOST = wranglerVars.PLATFORM_HOST;` and one registry
entry. **That fixes the instance and leaves the class**: the next address added to `site-hosts.ts`
would be missed in exactly the same two places, for exactly the same reason.

So `src/lib/site-hosts.ts` now exports **`SITE_HOST_VARS`**, the names of the variables that name an
address, `deploy.mjs` **loops over it**, and the registry gains the missing entry. A fourth address is
one edit, and two tests fail if the other two places are forgotten.

**Why not loop over every `*_HOST` var in `wrangler.jsonc` instead?** Because `ORIGIN_HOST` is also a
var ending in `_HOST` and is a different thing entirely — the Pi origin the Worker proxies to. Pinning
it into the build would change unrelated behaviour. The list has to be the addresses the site answers
on, which is what `site-hosts.ts` already knows.

## Why the existing tests could not have caught it, which is the lesson

`src/lib/site-hosts.test.mjs` **already** asserted that `siteAllowedOrigins` includes a platform host
and its `www.` form. **That test passed throughout, while production was broken.**

It passed because it hands the environment straight to the function:

```js
const plat = { APP_HOST: "app.example.org", PUBLIC_HOST: "site.example.net", PLATFORM_HOST: "cooper.example.com" };
assert.deepEqual(siteAllowedOrigins(plat).sort(), [...]);
```

**The function was never wrong. What was wrong was that nothing ever put the value into
`process.env`.** A unit test that supplies its own inputs cannot see a missing wire, and this one gave
positive assurance about a path that did not exist.

So the two new tests assert the **carrying**, not the computing: that every name in `SITE_HOST_VARS`
appears in `PI_WRANGLER_VARS`, and that `deploy.mjs` pins them with the loop rather than by name.
**Each was shown to fail on its own planted regression** — delete the registry entry, or put
`deploy.mjs` back to a line per host — and each plant was reverted.

**The general form, worth keeping:** when a value has to travel from one place to another to be true,
test the journey, not the destination. The destination usually already works.

## What this does not change

- **No card, no role and no route.** `allowedOrigins` is Next's own origin check on Server Actions. It
  grants nothing and is not part of the card system; the console's product-administrator and `aal2`
  checks are untouched.
- **`lannacareforanimals.org` was never affected** and its allow-list is identical before and after.
- **Environments with no platform host are unchanged.** Test and UAT declare none, so the loop assigns
  `undefined` exactly where the named lines did, and `clean()` already maps that to `null`.

## It is not true until it is deployed

The value is baked at build time, so **this cannot be fixed from a dashboard or a restart.** It needs
the merge, a Pi rebuild and a production Worker deploy — and the Worker deploy is Lutan's by rule.
Until then `cooperjaidee.org` keeps refusing every button, and the only honest verification of this
change is the saving proof section F asks for, done afterwards.
