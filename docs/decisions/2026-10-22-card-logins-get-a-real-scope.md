# Card logins get a real resident scope, and `--remove` only removes what it names

Date: 2026-10-22. Stream: `claude/card-login-fix`. File: `scripts/dev-signin.mjs` only.

## What changed

1. **`--cards` builds its throwaway role with `scope_residents: "all"`** (was `who_and_where`). `who_and_where` is
   `on_volunteer_floor()`, so `src/app/residents/[id]/page.tsx` redirected every resident page to `/r/<id>`, which has no
   edit controls, and no card could reach the resident hub. The cards decide what the login can *do*; the scope only decides
   which residents it can *see*, and every real role that holds these cards is `all` or `own_clinic`.
2. **The role is upserted without `ignoreDuplicates`**, so a throwaway role left by an older run (`who_and_where`) is corrected
   on the next run instead of silently kept.
3. **`--remove` needs a name**: a role key, `--cards a,b`, or the word `all`. It deletes only that login and that throwaway
   role. Before this, it deleted every `dev-signin-` login on dev, so parallel streams signed each other out.
4. **A second run of the same cards reuses the login** (same user id). Only the password changes. Nothing needed a change
   beyond (3): the recreation came from running `--remove` between runs.

## Proved

`--cards residents` run twice gave the same login (`dev-signin-f012b073`) and a role with `scope_residents = all`; the three other
streams' `dev_signin_cards_*` roles were untouched; `--cards residents --remove` removed only that login and role. In the
browser on `localhost:3008`, `/residents/<id>` stayed on the full resident page for that login instead of redirecting to `/r/<id>`.

## The `roles` table on dev, read 2026-10-22 22:49 UTC (a measurement, not a permanent fact)

| key | scope_residents | scope_clinical |
|---|---|---|
| admin | all | any |
| doctor | own_clinic | own_clinic |
| head_of_maintenance | who_and_where | any |
| head_of_medical | who_and_where | any |
| management | all | any |
| public_viewer | all | any |
| second_in_command | who_and_where | any |
| staff | all | any |
| volunteer | who_and_where | any |
| dev_signin_cards_818748c6, _8e866d7e, _f9763f07 (other streams' throwaway roles, made before this fix) | who_and_where | any |
| dryrun_photo_viewer_d6b305 (a dry-run role) | all | any |

**Answer to the open question:** the real `doctor` role is `own_clinic`, so it is **not** caught by the `who_and_where` redirect.
Not caught are admin, management, staff, public_viewer, doctor. **Caught by it today:** `head_of_medical`, `second_in_command`,
`head_of_maintenance` and `volunteer`. `head_of_medical` is the one worth Lutan's attention for the medical card: it cannot open
a resident record on dev now. That matches the `0134` comment that the redirect is meant for the Heads. Nothing was changed
here; changing a real role's scope is not this stream's.

The three old `dev_signin_cards_*` roles still read `who_and_where`. They are corrected the next time their owner runs the same
`--cards` command.
