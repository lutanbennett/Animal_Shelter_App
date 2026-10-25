import { can, type Permissions } from "@/lib/permissions/can";

/**
 * The Bills page and its inbox open for anyone who may file a bill for at least one thing: a delivery
 * (stock.delivery), a clinic visit (medical.visits at Edit) or a maintenance job (maintenance.bills).
 * The database asks the same question (can_use_bills_inbox, 0189). Nothing else is asked: a role that holds
 * one of those cards is offered the page, and whatever the database still refuses surfaces as a fault
 * (docs/card-access-faults.md). Pure and client-safe.
 */
export function canUseBills(perms: Permissions | null | undefined): boolean {
  if (!perms) return false;
  return can(perms, "stock.delivery") || can(perms, "medical.visits", "edit") || can(perms, "maintenance.bills");
}
