import { can, type Permissions } from "@/lib/permissions/can";

/**
 * The Bills page and its inbox open for anyone who may file a bill for at least one thing: a delivery
 * (stock.delivery), a clinic visit (medical.visits at Edit) or a maintenance job (maintenance.bills).
 * The database asks the same question (can_use_bills_inbox, 0189). A visiting doctor (clinical scope
 * own_clinic) files no bill whatever else the role holds: record_attachment() fences a clinic login
 * out (0174, 0190), so the screen does not offer what it would refuse. Pure and client-safe.
 */
export function canUseBills(perms: Permissions | null | undefined): boolean {
  if (!perms || perms.scopes.clinical === "own_clinic") return false;
  return can(perms, "stock.delivery") || can(perms, "medical.visits", "edit") || can(perms, "maintenance.bills");
}
