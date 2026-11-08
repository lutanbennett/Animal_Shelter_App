import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/require";

/** There is no look-up list of suppliers: the list is Management → Suppliers (0338), and /suppliers/<id> is a supplier's page. Same gate as the page it forwards to. */
export default async function SuppliersIndexPage() {
  await requirePermission("suppliers.directory", "read");
  redirect("/management/suppliers");
}
