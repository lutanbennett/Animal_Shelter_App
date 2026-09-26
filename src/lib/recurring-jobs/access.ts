/**
 * Every role with app access reads recurring jobs (0095): anyone can be
 * given one, so anyone reads the rules. Writing them is management's
 * (canManage); recording an outcome is the date's team, checked in SQL.
 */
const READ_ROLES = new Set(["admin", "management", "staff", "vet", "volunteer"]);

export function canReadRecurringJobs(role: string | null | undefined): boolean {
  return role != null && READ_ROLES.has(role);
}
