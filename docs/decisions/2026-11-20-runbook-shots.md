# The three runbook screenshots (#onbrb fault 3)

Captured with `node scripts/manual-screenshots.mjs --only=runbook-product-admin,runbook-settings-lookups,runbook-who-does-what`
(`MANUAL_BASE_URL` on port 3011). The script drives its own Edge, so the built-in
pane's direct-load hydration fault did not apply; every image was looked at and
shows real content.

- **The platform shot is from the Lanna dev shelter's console, with one address
  covered.** The console lists every shelter, and Lanna's Admin login line showed a
  real person's email. The repo is public, so that rectangle is painted over in the
  PNG; every other address in it is an `example.invalid` proof login.
- **Settings and Who does what are from `rehearsal-2026-11-20`**, not Lanna. On Lanna,
  Who does what listed dozens of other streams' `dev-signin` roles, which would mislead
  a reader following the runbook; a brand-new shelter shows what the runbook describes
  (Admin only, a Create a role button). Its Drive notice is red, which is correct for a
  new shelter before Step 4.
- The script has no way to take a session except by a person signing in, so the
  dev-sign-in cookies were written into its session file
  (`lca-manual-screenshots-session.json` in the OS temp folder). Nothing in the repo
  changed for that.
- The Who does what image is the top of the page only (not `full`), as registered.
