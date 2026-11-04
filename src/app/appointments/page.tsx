import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/require";

/**
 * /appointments used to list the visits booked with a doctor login's own clinics. That clinic
 * scope no longer exists (docs/decisions/2026-11-02-clinic-scope-inert.md), so the page could only
 * ever say "not linked". The Appointments menu entry has always led to the shelter-wide list;
 * this keeps the address, and its card guard, working for old bookmarks and links.
 */
export default async function AppointmentsPage() {
  await requirePermission("medical.visits", "read");
  redirect("/upcoming-visits");
}
