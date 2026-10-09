import { APP_ACCESS_ROLES } from "@/lib/auth/app-access";
import type { ActivityKey, Level } from "@/lib/permissions/catalogue";
import { ROUTES } from "@/lib/permissions/routes";

/**
 * Who can actually do a recurring job, worked out from where it is done:
 * its link_path (backlog, "Recurring jobs: only offer people who can
 * actually do the job", 2026-09-27). A job knows a link, not a permission,
 * and the link is the thing that fails in someone's face — so the link is
 * what decides, rather than a second "capability" field that could say
 * stocktake while the link says maintenance. docs/decisions.md (2026-09-27)
 * has the reasoning.
 *
 * Every rule is one or more cells asked of the database. A page registered in
 * the route registry (permissions/routes.ts) is decided by the activity that
 * registry names: "may this role do it" is a question for the database, asked
 * as role_can() (0133) and carried here as an `Eligibility`, because can()
 * answers only about the caller and an assignee is someone else. Nothing here
 * names a role. The two landing pages, /management and /admin, are not
 * registered (a landing opens for anyone who may open one of its pages), so
 * they are decided by "any of the pages under it"
 * (decisions/2026-10-04-permissions-sweep-rest.md). A path no rule matches —
 * no link at all, /residents, /my — can be done by any assignable role.
 *
 * Doctors are not assignable at all (Lutan, 2026-09-27): a doctor's work comes
 * from their clinic visits and the residents on them, not from the
 * shelter's routine, so no recurring job goes to one whatever it links to.
 *
 * Pure and client-safe: the form filters its picker with it as the link
 * changes, and scripts/check-recurring-job-eligibility.mjs runs it.
 */

/**
 * The built-in roles that can be given a recurring job: everyone with app
 * access but doctors. 0095 lets any app role be an assignee (and read the
 * rules); this is narrower, and the actions enforce it. It is the ENUM gate
 * for queries over app_users.role, which every configured role also passes
 * (each borrows a legacy value); it is not the list of keys eligibility is
 * asked about. Those are the keys of the people concerned (app_users.role_key,
 * 0146), because a configured role's enum value is not its key
 * (decisions/2026-10-05-rota-eligibility.md).
 */
export const ASSIGNABLE_ROLES = APP_ACCESS_ROLES.filter((role) => role !== "doctor");

/** Keys that are never assignable whatever they hold: a doctor's work comes from clinic visits, and a public viewer is not staff. */
const NEVER_ASSIGNABLE = ["doctor", "public_viewer"];

/** The cell a page asks for: the activity its route registers, at the level that opens it. */
export type Need = { activity: ActivityKey; level: Level };

/**
 * The database's answers, for the roles that were asked: need (`needKey`) →
 * the roles that hold it. Built on the server by loadEligibility()
 * (eligibility-load.ts) from role_can(), and handed to the form and to
 * canDoJob, which stay pure. A role or a need that was not asked about is
 * absent, so it reads as "cannot": a missing answer never grants anything.
 */
export type Eligibility = Readonly<Record<string, readonly string[]>>;

export const needKey = (need: Need): string => `${need.activity}:${need.level}`;

/** A role can do a job under `prefix` when it holds any one of `needs`. */
type Rule = { prefix: string; needs: readonly Need[] };

/** The cell a job linked to this page needs: Edit unless the entry says the page opens lower than the work does. */
const jobNeed = (route: (typeof ROUTES)[number]): Need => ({
  activity: route.activity,
  level: route.jobLevel ?? route.level ?? "edit",
});

/** Longest prefix wins, so a page is decided by its own entry before its landing's. */
const RULES: Rule[] = [
  // Every registered page, from its route entry.
  ...ROUTES.map((route): Rule => ({ prefix: route.path, needs: [jobNeed(route)] })),
  // The landings: open for whoever can open any page under them.
  ...["/management", "/admin"].map((prefix): Rule => ({
    prefix,
    needs: ROUTES.filter((r) => r.path.startsWith(prefix + "/")).map(jobNeed),
  })),
];

/** Every cell the rules ask role_can() about, once each: what loadEligibility has to fetch. */
export const JOB_NEEDS: readonly Need[] = [
  ...new Map(RULES.flatMap((rule) => rule.needs).map((need) => [needKey(need), need])).values(),
];

/**
 * The cells a set of links needs, for a caller that knows which pages it cares about (My tasks asks
 * about its own jobs' pages, not the whole registry). A link no rule matches needs nothing.
 */
export function needsForLinks(linkPaths: readonly (string | null | undefined)[]): readonly Need[] {
  return [
    ...new Map(
      linkPaths.flatMap((link) => ruleFor(link)?.needs ?? []).map((need) => [needKey(need), need]),
    ).values(),
  ];
}

/** The path part of a link: no query, no fragment, no trailing slash. */
function pathOf(linkPath: string): string {
  const path = linkPath.split(/[?#]/)[0].replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

function ruleFor(linkPath: string | null | undefined): Rule | null {
  if (!linkPath) return null;
  const path = pathOf(linkPath.trim());
  let best: Rule | null = null;
  for (const rule of RULES) {
    if ((path === rule.prefix || path.startsWith(rule.prefix + "/")) && (!best || rule.prefix.length > best.prefix.length)) {
      best = rule;
    }
  }
  return best;
}

/** Can someone whose role KEY is `role` do a job that links to `linkPath`? `eligibility` is the database's answer for that key. */
export function canDoJob(
  role: string | null | undefined,
  linkPath: string | null | undefined,
  eligibility: Eligibility,
): boolean {
  if (!role || NEVER_ASSIGNABLE.includes(role)) return false;
  const rule = ruleFor(linkPath);
  if (!rule) return true;
  return rule.needs.some((need) => eligibility[needKey(need)]?.includes(role) ?? false);
}

/** Which of `roles` (keys) can do it, in the given order — for "only … are listed". */
export function rolesForJob(
  linkPath: string | null | undefined,
  eligibility: Eligibility,
  roles: readonly string[],
): string[] {
  return roles.filter((role) => canDoJob(role, linkPath, eligibility));
}

/** True when the link narrows who can do the job below every one of `roles`. */
export function jobIsRestricted(
  linkPath: string | null | undefined,
  eligibility: Eligibility,
  roles: readonly string[],
): boolean {
  return rolesForJob(linkPath, eligibility, roles).length < roles.length;
}
