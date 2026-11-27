# The platform front door signs in (#fdsgn)

**Decided 2026-11-28. Option (a): the front door signs in with no acting shelter.** Option (b), stamping a shelter on
the front door, was not taken, so nothing changes for `shelter_host_kind()` or for `0448`.

## The fault

`docs/domain-checklist.md` G2 seeds a front-door row with `shelter_id` null. A null row sends no `x-shelter-id`, and every
sign-in path read "no shelter on the request" as "this address is not registered", so a login with no role *here* (which
is every login on a front door, by construction) was signed out with *"This site isn't set up yet"*. Production's
`cooperjaidee.org` works only because `0390` stamped its rows with Lanna, which `0448` records as damage it left in place.

## The evidence, tested rather than quoted

1. `0382_shelters_and_host_map.sql:7-9` says an explicit null row is the platform front door and a missing row is
   unknown. Read 2026-11-28: true; `shelter_host_kind()` returns `front_door` / `unknown` exactly so.
2. `0448`'s header restores nullability for the front door. Read: true.
3. `grep -rln shelter_host_kind src/ scripts/` returned nothing before this change. Run: true.

## How the app tells a front door, and why not by calling `shelter_host_kind()`

The app asks `isPlatformHostname(requestHost(...))`: the request host against `PLATFORM_HOST`. That variable is already
the app's authority for the front door (`platformRedirect()`, every `/platform` page's not-found guard), it is set on
all three environments, and the host comes from the Worker's `x-lanna-public-host`, which the Worker always overwrites
(`worker/origin.mjs:113`), so a visitor cannot claim it. Calling `shelter_host_kind()` would have needed either a new
service-role call site in the app (a registry entry) or a Worker change and a Worker deploy, to learn the same thing.
`shelter_host_kind()` stays as it is for the Worker and the checks.

## The open question: what may a role-less login do on the front door?

Exactly what it already could, and no more: neither answer below is a card, and neither widens anything.

| The login | Lands on | Why it is true |
|---|---|---|
| on the product-admin list (`is_product_admin()`) | `/platform` (or its own `/platform/...` next) | the console; the database still requires aal2 for writes |
| holds a role at any shelter (`my_shelters()`) | `/platform/shelters`, the chooser (#apxld) | it lists the shelters, each signs in on its own address |
| neither | signed out, `?error=no_platform` | new message: *"You signed in, but this account has nothing here yet..."* |

Being refused with "site not set up" blamed the site for an account problem; being let in to an empty console would
move the wall. The third row says what is true. `siteNotSetUp` is unchanged and is now shown only on a host that is not
the front door and has no shelter, where it is true.

## Paths

All three found by the planner are covered: `src/app/auth/callback/route.ts` (Google), `src/app/login/actions.ts`
(password) and `src/lib/supabase/proxy.ts` (a role-less session on `/platform`, `/platform/*` or
`/admin/security/verify` on the front door is let through rather than signed out; the pages ask again). The rest of the
proxy's `no_site` stays for every other path, which on the front door `platformRedirect()` sends to `/platform` anyway.

## `check-deployed-hosts.mjs` is not taught this

It asks whether a row exists. After this change a null front-door row signs in, so a passing check no longer hides the
fault it hid. It cannot sign in, so it cannot prove sign-in either; the proof is the driven browser run in the PR.

## Production's two rows: a finding, not a change

Once this is deployed to production, nulling `cooperjaidee.org` and `www.cooperjaidee.org` would no longer break
sign-in for a product administrator. **They are not touched here.** Whether to null them is a separate change.
