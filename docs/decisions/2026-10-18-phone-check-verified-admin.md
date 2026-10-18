# The phone-width check makes a 2-step-verified admin (2026-10-18)

`/admin/security` redirects any session that has not passed 2-step, so the sweep never saw it.

**Choice:** `scripts/check-phone-width.mjs` now enrols a TOTP app on its *throwaway admin*, verifies it with a code it computes, and sets that factor as the approved one (`app_metadata.two_step_factor`, service role). It uses the app's own sign-in and the same helpers `check-two-step-session.mjs` proves, rather than touching how verification works.

**Rights held:** a real admin with 2-step satisfied, on dev only (the script refuses any other project). It lives for one run: the login, its role row and its factor are deleted in the script's cleanup (`--keep` leaves them; `--clean` sweeps ones over an hour old). Only the admin role gets this; the other roles are unchanged.

**Not fixed:** `/appointments` still refuses the doctor, because the dev Doctor role has no `medical.visits` cell. That is the known Doctor-landing defect, not a clinic problem.
