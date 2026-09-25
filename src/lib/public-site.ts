/**
 * Whether this deployment's public website is locked behind sign-in.
 *
 * lannacare.org is UAT for good and test.lannacare.org is staff testing;
 * until go-live neither should show the public pages (/, /adopt, /r/…) to
 * strangers. `PUBLIC_SITE: "locked"` is set per Worker in wrangler.jsonc
 * (test, uat and — until the cutover moves it to lannacareforanimals.org —
 * production); OpenNext copies Worker vars onto process.env at request
 * time, the same way the Drive and service-role secrets arrive. Unset —
 * `next dev`, and the live site after the cutover — means open.
 *
 * Not derived from getAppEnv(): lannacare.org reports "production" until
 * the cutover sets UAT_PROJECT_REF, so an environment check would not fire
 * where it is needed today (docs/decisions.md, 2026-09-25).
 *
 * Read per request, never at module scope: on the Worker the var is only on
 * process.env once a request is being handled.
 */
export function isPublicSiteLocked(): boolean {
  return process.env.PUBLIC_SITE === "locked";
}
