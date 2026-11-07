/**
 * Which database this build talks to — so a tab on the dev database is
 * never mistaken for the live site, and the customer's UAT site is never
 * mistaken for Production. The layout puts it on <html data-env>;
 * globals.css recolours everything under data-env="dev"; AppHeader adds a
 * badge for dev and uat; generated PDFs carry a watermark for both.
 *
 * Derived from the Supabase URL `next build` inlines rather than from
 * NODE_ENV, which is "production" on the test site as well
 * (wrangler.jsonc): the runtime isn't the thing worth telling apart, the
 * database is. Test shares the dev database, so it wears the dev colours
 * too. Anything that isn't a known non-production project renders as
 * production — a misconfigured public site should never come up badged.
 *
 * UAT wears its own blue-indigo (globals.css data-env="uat"), with a badge,
 * a fixed-colour header strip and a PDF watermark. Lutan, 2026-11-06: "just
 * needs to be different to prod"; test is teal, production orange.
 * SUPERSEDED 2026-11-07, kept so the reasoning survives: "UAT wears
 * production's exact colours (the customer should be testing the real thing)
 * and differs only by its badge and PDF watermark." Lutan reversed it, so do
 * not undo this to match production.
 *
 * scripts/deploy.mjs and scripts/lib/env.mjs import this file too, so a
 * deploy target and the badge its build will wear can't disagree.
 */
const DEV_PROJECT_REF = "qxkmhwybjggxvsfxsxbd";

/**
 * UAT's own Supabase project, "Lanna Care For Animals - UAT", in the second
 * Supabase account (docs/decisions/2026-11-06-uat-own-database.md). It is NOT
 * dbkodyyxxhtygxcxmfcu: that is PRODUCTION's, and putting it here would badge
 * the live site as UAT. Anything that is neither this nor the dev project
 * renders as production, so a wrong ref here fails toward "no badge".
 */
const UAT_PROJECT_REF: string = "fsjagxmxjosauwmxwype";

export type AppEnv = "dev" | "uat" | "production";

/** The environment a Supabase URL belongs to (see the rules above). */
export function appEnvForSupabaseUrl(url: string): AppEnv {
  if (url.startsWith(`https://${DEV_PROJECT_REF}.`)) return "dev";
  if (UAT_PROJECT_REF && url.startsWith(`https://${UAT_PROJECT_REF}.`)) return "uat";
  return "production";
}

/**
 * The environment this build wears: the project alone decides, since UAT has
 * its own. (Between 2026-11-05 and the move to its own database UAT shared
 * the dev project and a NEXT_PUBLIC_APP_ENV pin told them apart; the pin is
 * gone, so no variable can relabel a build.)
 */
export function getAppEnv(): AppEnv {
  // Written out as a literal so Next inlines it at build time.
  return appEnvForSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
}
