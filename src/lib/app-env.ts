/**
 * Which database this build talks to — so a tab on the dev database is
 * never mistaken for the live site, and the customer's UAT site is never
 * mistaken for Production. The layout puts it on <html data-env>;
 * globals.css recolours everything under data-env="dev"; AppHeader adds a
 * badge for dev and uat; generated PDFs carry a watermark for both.
 *
 * Derived from the Supabase URL `next build` inlines rather than from
 * NODE_ENV, which is "production" on test.lannacare.org as well
 * (wrangler.jsonc): the runtime isn't the thing worth telling apart, the
 * database is. Test shares the dev database, so it wears the dev colours
 * too. Anything that isn't a known non-production project renders as
 * production — a misconfigured public site should never come up badged.
 *
 * UAT wears production's exact colours (the customer should be testing the
 * real thing) and differs only by its badge and PDF watermark.
 *
 * scripts/deploy.mjs and scripts/lib/env.mjs import this file too, so a
 * deploy target and the badge its build will wear can't disagree.
 */
const DEV_PROJECT_REF = "qxkmhwybjggxvsfxsxbd";

/**
 * Empty until the cutover (docs/decisions.md, 2026-09-23). The project that
 * will be UAT is dbkodyyxxhtygxcxmfcu — which is *production's* until the
 * day it is demoted, so setting it early would put a UAT badge on the live
 * site. The cutover change sets it, in the same commit that points the
 * production environment at its new project.
 */
const UAT_PROJECT_REF: string = "";

export type AppEnv = "dev" | "uat" | "production";

/** The environment a Supabase URL belongs to (see the rules above). */
export function appEnvForSupabaseUrl(url: string): AppEnv {
  if (url.startsWith(`https://${DEV_PROJECT_REF}.`)) return "dev";
  if (UAT_PROJECT_REF && url.startsWith(`https://${UAT_PROJECT_REF}.`)) return "uat";
  return "production";
}

export function getAppEnv(): AppEnv {
  return appEnvForSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
}
