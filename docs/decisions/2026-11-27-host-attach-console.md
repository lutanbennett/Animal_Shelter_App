# Console host attach: the button (#hstau step 3)

## What shipped

Each address on a shelter's **Website** tab in the product console (`/platform`) now has two buttons, **Attach at next deploy**
and **Stop attaching at next deploy**. They call `setShelterHostAttach` (`src/app/platform/actions.ts`), which calls
`product_admin_set_host_attach(p_shelter, p_host, p_attach)`. They are drawn under the same `canWrite` (product administrator
plus aal2) as the neighbouring Make website / Remove buttons, and not for the console's own address, exactly as Remove is not.

## Which overload, and why

Only one exists. `0447` **drops** `0446`'s `(p_host, p_attach)` form, because the restrictive per-shelter policy on
`shelter_hosts` hid every row from it (`2026-11-27-console-host-attach-schema.md`). So the call sends `p_shelter`, `p_host` and
`p_attach`; the console already knows the shelter because it lists hosts per shelter.

## The wording: the press is an instruction, not an attachment

Setting the flag changes nothing at Cloudflare. `scripts/deploy.mjs` reads the flag and passes the host as `--domain` on the
**next deploy of that environment**. So the button labels say *at next deploy*, a note above the list says a deploy does the
attaching, and the confirmation after a press says *nothing has changed at Cloudflare yet* and to press **Check it answers**
after the deploy. Unmarking says the address keeps answering until that deploy removes it.

## Deliverable 5: should the console show what is attached at Cloudflare now?

**Decided: not in this stream, and not as a Cloudflare read.** The console already has the fact that matters to a user,
**Check it answers** (`checkShelterHost`), which asks the address itself; a Cloudflare domain list would add the account id and
an API token to the app, which `2026-11-23-console-host-live.md` recorded the app does not hold. Out of scope here.

**What IS missing, and is smaller:** the console cannot show the *flag* either. `product_admin_shelters()` returns `hosts text[]`
and not `attach_to_worker`, and `shelter_hosts` is revoked from `authenticated` (`0382`). So after a reload the page cannot say
which addresses are marked; it says so in its own note. Fixing it is one migration, not written here (the day's migration slot
belonged to another stream). **Specification, for the planner:** replace `product_admin_shelters()` adding one output column
`attached_hosts text[]` = `coalesce((select array_agg(h.host order by h.host) from public.shelter_hosts h where h.shelter_id =
s.id and h.attach_to_worker), '{}')`, same gate, same owner; then the panel shows "marked for the next deploy" beside each such
host and draws only the one button that applies. Note `0447`'s finding: a definer read of `shelter_hosts` needs the shelter
header set, as `product_admin_shelters()` already manages for `hosts`, so copy what it does there.

## Proof (dev, 2026-11-27, driven with `playwright-core` at aal2 as a product administrator)

On the disposable `rehearsal-2026-11-20.example.invalid`: flag read through the Management API `false`; **Attach at next deploy**
pressed, confirmation shown, flag `true`; **Stop attaching** pressed, flag `false`. Left `false`, so the next test deploy does
not try to attach a `.invalid` name.
