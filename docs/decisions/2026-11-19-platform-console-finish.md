# 2026-11-19 — the platform console, finished and driven (#rcpfm, #adrus, #padpr)

**Step zero:** the gap was still there. The receipts step was drawn as a shelter's next step and nothing submitted it;
`product_admin_set_shelter_receipts` had no caller in `src/`.

## What was built

- **Receipts form (#rcpfm).** `setShelterReceipts` in `src/app/platform/actions.ts` and a form in the receipts row of
  `ProductAdminPanel.tsx`: receipt letters, the name printed on receipts, the address one line per row. It is drawn only at `aal2`
  and only on the shelter's next step. The Server Action checks product administrator and `aal2` (the courtesy) and the function
  checks them again (the security). **The same issuer block is written for both receipt countries (TH and US)** and carries
  **no registration and no statement lines**: `src/lib/donations/issuer.ts` says a receipt must not claim a status nobody has
  entered, so those stay empty until a person adds them. Letters cannot change once set (the function answers 23505); the screen
  says so in words. **Judgement call, for the PR:** one issuer block for both countries is the smallest form that is true; a
  per-country form is a follow-up if a shelter needs different wording per country.

## The underscore (#adrus): verdict is (b), the check was wrong, and it was not a web address

Read `0417` first. **The refusal was not on a web address.** `product_admin_map_host` (0414) accepts `pcf_proof.example.org`
(driven: it was added). The check that refused an underscore was `product_admin_login_exists`, the **email** lookup:
`'^[^@\s%_*]+@[^@\s%_*]+\.[^@\s%_*]+$'`. The comment said it stopped a wildcard becoming a search, but the function compares
`lower(u.email) = p_email` by **equality**, never `LIKE`, so no character in an address is a wildcard there, and an underscore is
ordinary in the local part (`jane_doe@example.org`). The check turned a valid address into "not an email address", and the console
showed that as an unexplained refusal. So outcome (2), loosen it, via a **new migration `0418`** (0417 is applied and never
edited). The shape check stays. Driven: `pcf_link_proof@example.invalid` is found and the link button enables; an unknown address
is refused in words and the button stays off.

**Not decided here, and worth saying:** `product_admin_map_host` accepts an underscore in a **web address**, and an underscore is not
legal in a hostname under the rules browsers and certificate authorities apply. That was never the filed fault, and loosening or
tightening it is not this stream's; recorded for the planner.

## Driving it found three defects the screen hid (0419, 0420, 0421)

The brief expected eight presses. They turned into one investigation, which the band note anticipated. **Cause, measured:** the
restrictive `shelter_scope_*` policies read the **`x-shelter-id` request header** and apply to every role, `security definer`
owners included. A product administrator's request names no shelter on the platform host and names a **different** one on dev
(`DEV_SHELTER_ID`), so a console function working on another shelter was refused or saw nothing. 0416's harness ran as the service
role, where `is_trusted_caller()` is true, so it never saw it. The console's error mapping then turned every `42501` into
*"your second step has expired"*, which hid it (and still would).

| Press | Before | Fix |
|---|---|---|
| Create shelter | refused (42501 on `site_pages`), shown as "second step expired" | 0419 |
| Add starting content, Set receipt numbers | same cause | 0419 |
| The setup checklist itself | read other shelters' rows as empty: pcf-proof had 2 hosts and 8 pages and the screen said "none" and "row is missing"; **test-shelter-2 read "Drive not connected" while its sign-in had stopped working** | 0420 |
| Remove an address | "not mapped to any shelter" (row hidden) | 0421 |
| Give an Admin role, Link an Admin login | 42501, shown as "second step expired" | 0421 |

**The fix, and why it is not a new way to grant access.** Each function, **after** its existing product-administrator and `aal2`
checks, sets `request.headers` to the shelter it is operating on with `set_config(..., is_local => true)`, does its work, and puts
the header back. Who may call the functions is unchanged; the rows touched are exactly the target shelter's; a product
administrator does **not** become a "trusted caller". Unmap is given a host, not a shelter, so it tries each shelter in turn.
`product_admin_shelters()` becomes a loop that builds each shelter's row under that shelter's scope. **Judgement call:** the alternative
was to make the platform host's requests "trusted", which widens far more. **This touches security-adjacent SQL, so it is
flagged for review rather than being assumed fine.**

**Not fixed, for the planner:** `shelterError` in `actions.ts` still maps every `42501` to the step-up message. A refusal from a
policy is not an expired step-up. That mapping is why this hid for a day; narrowing it needs the database to say which refusal it
is. Also, `scripts/dev-signin.mjs <role>` fails (`PGRST116`, two rows) once **two shelters each have a role keyed `admin`**: it looks
the role up by key across the whole database. Two shelters with an Admin role is the intended end state, so any dev shelter given
one breaks `dev-signin.mjs admin` for everyone. `scripts/` is another stream's this batch; reported, not edited.
The fixed Admin role cannot be deleted (`roles_guard_fixed`), so `pcf-proof`'s stays on dev.

## The presses, driven on dev at `aal2` (`dev-signin.mjs admin --aal2`, 2026-11-19)

| # | Press | Result |
|---|---|---|
| 1 | Create a shelter (needed as a setup) | after 0419: "Created …"; 8 pages, 1 content row |
| 2 | Add a web address | `pcf-proof.example.org` added; so was `pcf_proof.example.org` (see above) |
| 3 | Remove an address | after 0421: "Address removed." |
| 4 | Give a shelter an Admin role | after 0421: "Admin role created." |
| 5 | Link an Admin login by email | an underscore address found; "Login linked."; tick flips to `pcf_link_proof@example.invalid` |
| 6 | **Set a receipt series** | `LCA` refused in words (another shelter's); `PCF` set; **the tick flipped** |
| 7 | Add starting content | shelter with its content removed: "Starting content added." |
| 8 | Add a product administrator | unknown address refused in words; `pcf_padmin_proof@…` "Added." |
| 8b | Remove a product administrator | "Removed."; gone from the list |
| 9 | The step-up return | **pending: reason below** |

**The step-up return is only partly driven.** At `aal1` the page is read-only: one notice, no forms and no buttons, the link
points at `/admin/security/verify`. At `aal2` it is writable (everything above). What is not driven is **typing an authenticator code
on the verify screen and arriving back**: the script enrols its own factor and never hands the secret to the screen, so a person
with an authenticator has to do it. Read in code: `verify/actions.ts` sends the login to `/admin/security` if it holds an Admin role
and to `/platform` otherwise, so **a product administrator who is also a shelter Admin returns to the Admin security page, not the
console**. Not a defect on its face; noted.

## Left on dev, on purpose and disposable

Shelters `pcf-proof` and `pcf-proof2`; logins `pcf_link_proof@example.invalid`, `pcf_padmin_proof@example.invalid` and
`dev-signin-…-pcfproof@example.invalid` (a product administrator at `aal1`, used for the step-up screen). `--remove` was not run
(it deletes every other stream's logins).

## Not mine, so not done

`#flogn` (creating or inviting a login), `#shnms` (`display_name`/`short_name`), `#lkaud` (audit and rate limit on the email
lookup), the apex deploy (`cooperjaidee.org`, `docs/domain-checklist.md` section F). `#pltfd` is **not** ticked.
