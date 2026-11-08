import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { CreateSupplierForm } from "../CreateSupplierForm";

/**
 * Management → Suppliers → New supplier: the form on its own page so the list stays the first thing on
 * /management/suppliers (as for contacts). Same gate as the createSupplier action.
 */
export default async function NewSupplierPage() {
  await requirePermission("suppliers.directory", "edit");
  const { t } = await getT();
  const s = t.management.suppliers;
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.newTitle}</h1>
        <p className="text-sm text-muted">{s.newSubtitle}</p>
      </div>
      <CreateSupplierForm listHref="/management/suppliers" />
    </main>
  );
}
