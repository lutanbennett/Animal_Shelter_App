import { APP_ACCESS_ROLES } from "@/lib/auth/app-access";
import { canWriteMaintenance } from "@/lib/maintenance/queries";

/**
 * Who can actually do a recurring job, worked out from where it is done:
 * its link_path (backlog, "Recurring jobs: only offer people who can
 * actually do the job", 2026-09-27). A job knows a link, not a permission,
 * and the link is the thing that fails in someone's face — so the link is
 * what decides, rather than a second "capability" field that could say
 * stocktake while the link says maintenance. docs/decisions.md (2026-09-27)
 * has the reasoning.
 *
 * Each rule borrows the predicate the target page itself uses, where that
 * predicate is client-safe, so a page's guard and this list can only drift
 * if someone changes one and not the other in the same file. A path no rule
 * matches — no link at all, /residents, /my — can be done by any assignable
 * role.
 *
 * Vets are not assignable at all (Lutan, 2026-09-27): a vet's work comes
 * from their vet appointments and the residents on them, not from the
 * shelter's routine, so no recurring job goes to one whatever it links to.
 *
 * Pure and client-safe: the form filters its picker with it as the link
 * changes, and scripts/check-recurring-job-eligibility.mjs runs it.
 */

/**
 * The roles that can be given a recurring job at all: everyone with app
 * access but vets. 0095 lets any app role be an assignee (and read the
 * rules); this is narrower, and the actions enforce it.
 */
export const ASSIGNABLE_ROLES = APP_ACCESS_ROLES.filter((role) => role !== "vet");

type Rule = { prefix: string; allows: (role: string) => boolean };

/** canManage (require-management.ts), which lives beside server-only code. */
const isManager = (role: string) => role === "admin" || role === "management";

/**
 * The two stock pages' rules. They ask about ANOTHER person's role (an
 * assignee), which can() cannot answer: it reads the caller's own cells, and
 * a non-admin cannot read role_permissions. Answering for any role needs a
 * database function that does not exist yet, so until it does these two lists
 * stay as they were, equal to the seeded cells of stock.count and
 * stock.delivery (0132). The permissions-catalogue decision names the
 * follow-up; scripts/check-permission-catalogue.mjs fails if they drift from
 * the seed.
 */
export const STOCK_COUNT_ROLES: readonly string[] = ["admin", "management", "staff", "volunteer"];
export const STOCK_DELIVERY_ROLES: readonly string[] = ["admin", "management", "staff"];

/** Longest prefix wins, so /management/… is decided by /management, not by nothing. */
const RULES: Rule[] = [
  { prefix: "/admin", allows: (role) => role === "admin" },
  { prefix: "/management", allows: isManager },
  { prefix: "/stocktake", allows: (role) => STOCK_COUNT_ROLES.includes(role) },
  { prefix: "/deliveries", allows: (role) => STOCK_DELIVERY_ROLES.includes(role) },
  // The work on the board is logging and updating jobs; a volunteer reads it
  // and adds photos, but cannot move a job on.
  { prefix: "/maintenance", allows: canWriteMaintenance },
];

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

/** Can someone with `role` do a job that links to `linkPath`? */
export function canDoJob(role: string | null | undefined, linkPath: string | null | undefined): boolean {
  if (!role || !(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return false;
  const rule = ruleFor(linkPath);
  return rule ? rule.allows(role) : true;
}

/** The roles that can do it, in the usual order — for "only … are listed". */
export function rolesForJob(linkPath: string | null | undefined): string[] {
  return ASSIGNABLE_ROLES.filter((role) => canDoJob(role, linkPath));
}

/** True when the link narrows who can do the job below every assignable role. */
export function jobIsRestricted(linkPath: string | null | undefined): boolean {
  return rolesForJob(linkPath).length < ASSIGNABLE_ROLES.length;
}
