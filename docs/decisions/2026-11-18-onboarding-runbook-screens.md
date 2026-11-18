# 2026-11-18 — The onboarding runbook catches up with the product-admin screen (`#onbrb` advances, `#dcmds` closes)

Docs, a script header and one screenshot declaration. No `src/`, no migration, no behaviour change.

## What the screen does and does not do (read from PR #1709 and the page's own code)

`/admin/product-admin` **lists** every shelter with its hosts and **manages the PADMIN list** (Add/Remove, `aal2` only). It creates nothing, sets no names or receipt series, edits no lookup list, removes no shelter (`docs/decisions/2026-11-18-product-admin-screen.md`).

## NOT YET POSSIBLE notes: all four survive, each for a reason

| Where | Why it is still true |
|---|---|
| Step 1, create shelter and host | Writes to `shelters` / `shelter_hosts` have no login grant (0382); the screen only reads `product_admin_shelters()`. A create function is a migration, and none exists (`main`'s highest is 0413). |
| Step 6, names (`0400`) and receipt series (`0395`) | The screen does not show or edit them. |
| Step 6, bill kinds / frequencies / group origins | No screen added by the product-admin PR. |
| A shelter leaving | No script or screen removes a shelter. |

Their wording now says which half landed. Step 9 gained a check 6 (the shelter appears on the screen with key and host).

## Screenshot states reachable on dev

A dev sign-in is `aal1` and has no authenticator, and the signed-in login must also be on the PADMIN list (anyone else gets not-found). So the capturable state is the `aal1` view: shelters with hosts, the PADMIN list showing itself, and the step-up sentence with its link. **Not capturable on dev:** Add, Remove, their refusals, and the page after the code. The runbook says so in words. The one shot, `runbook-product-admin`, is declared in `scripts/manual-screenshots.mjs`; the PNG is produced by the next full manual re-run, as PADMIN. No picture was drawn or staged. (This is the same limit PR #1709 recorded; derived from its decision file and the page code, not re-driven in a browser.)

## Path decision: keep `docs/shelter-onboarding-runbook.md`

The file exists under that name, is linked from the runbook decision file and PR #1705, and "runbook" says what it is. Renaming to `shelter-onboarding.md` would churn those references for no gain. **For the planner to file:** `#onbrb`'s "done when" should name `docs/shelter-onboarding-runbook.md`, not `docs/shelter-onboarding.md`.

## `#dcmds`

README export path now `C:\Temp\<shelter>-export` (the script's own header and its `--out` check expect a Windows path outside the repo). `google-oauth-setup.mjs` Usage block names `--calendar` and says Drive and calendar tokens are separate; line 38 untouched, no behaviour changed. Ticked, title rewritten to say what was done. `#onbrb` is **not** ticked: it needs an end-to-end rehearsal, impossible while Step 1 cannot be followed.
