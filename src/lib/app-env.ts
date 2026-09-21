/**
 * Which database this build talks to — so a tab on the dev database is
 * never mistaken for the live site. The layout puts it on <html data-env>
 * and globals.css recolours everything under data-env="dev"; AppHeader
 * adds a badge.
 *
 * Derived from the Supabase URL `next build` inlines rather than from
 * NODE_ENV, which is "production" on test.lannacare.org as well
 * (wrangler.jsonc): the runtime isn't the thing worth telling apart, the
 * database is. Test shares the dev database, so it wears the dev colours
 * too. Anything that isn't the known dev project renders as production —
 * a misconfigured public site should never come up in the dev scheme.
 */
const DEV_PROJECT_REF = "qxkmhwybjggxvsfxsxbd";

export type AppEnv = "dev" | "production";

export function getAppEnv(): AppEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.startsWith(`https://${DEV_PROJECT_REF}.`) ? "dev" : "production";
}
