import { mayFileRoute } from "@/lib/bills/kinds";
import type { Permissions } from "@/lib/permissions/can";

/**
 * The import page is offered to a login that may file at least one of the two kinds it files: a utility bill (bills.utilities)
 * or a general bill (bills.general), the activities the two tables' own actions and policies ask. Each ROW is then checked for its
 * own destination (parseBillImport), so a login holding one is offered the page and only its own kind's rows are added.
 * Pure and client-safe.
 */
export function canImportBills(perms: Permissions | null | undefined): boolean {
  return mayFileRoute(perms, "utility") || mayFileRoute(perms, "general");
}
