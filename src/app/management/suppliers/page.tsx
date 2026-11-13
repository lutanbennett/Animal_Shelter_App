import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { SUPPLIER_COLUMNS, type Supplier } from "@/lib/suppliers/suppliers";
import { SuppliersTable, type SupplierRow } from "./SuppliersTable";

/**
 * Management → Suppliers (0338): the businesses the shelter buys from, read from `suppliers`, not `contacts`. Modelled on
 * Management → Contacts. Archived suppliers are hidden unless ?archived=1, the same link toggle.
 */
export default async function SuppliersAdminPage(props: PageProps<"/management/suppliers">) {
  const { supabase, perms } = await requirePermission("suppliers.directory", "edit");
  const { t } = await getT();
  const a = t.contacts.archive;
  const s = t.management.suppliers;
  const searchParams = await props.searchParams;
  const showArchived = searchParams.archived === "1";

  let suppliersQuery = supabase.from("suppliers").select(`${SUPPLIER_COLUMNS}, delivery_method`).order("name");
  if (!showArchived) suppliersQuery = suppliersQuery.is("archived_at", null);

  const [suppliersResult, archivedResult, friendsResult] = await Promise.all([
    suppliersQuery.returns<(Supplier & { delivery_method: string })[]>(),
    // Counted in both modes: hidden, it is what the toggle would reveal.
    supabase.from("suppliers").select("id", { count: "exact", head: true }).not("archived_at", "is", null),
    // Friends reads need friends.manage or friends.view (0155); a login with neither simply sees no badge.
    supabase.from("shelter_friends").select("supplier_id, published").not("supplier_id", "is", null).returns<{ supplier_id: string; published: boolean }[]>(),
  ]);
  const archivedCount = archivedResult.count ?? 0;
  const friends = new Map((friendsResult.data ?? []).map((row) => [row.supplier_id, row.published]));
  const suppliers: SupplierRow[] = (suppliersResult.data ?? []).map((supplier) => ({
    ...supplier,
    friend_published: friends.get(supplier.id) ?? null,
  }));
  const canEdit = can(perms, "suppliers.directory", "edit");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
          <p className="text-sm text-muted">{s.subtitle}</p>
        </div>
        {canEdit && (
          <ActionLink href="/management/suppliers/new" label={s.newButton} icon={ACTION_ICONS.add} variant="primary" iconOnlyOnMobile={false} />
        )}
      </div>

      {suppliersResult.error && (
        <p className="text-sm text-danger">
          {s.couldntLoad}: {suppliersResult.error.message}
        </p>
      )}
      {typeof searchParams.added === "string" && searchParams.added && (
        <p role="status" className="text-sm text-success">
          {s.added(searchParams.added)}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {archivedCount > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {showArchived ? a.archivedIncluded(archivedCount) : a.archivedHidden(archivedCount)}
            {/* A link, not a checkbox: flipping it changes the list straight away. */}
            <Link
              href={showArchived ? "/management/suppliers" : "/management/suppliers?archived=1"}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                showArchived ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {showArchived ? a.hideArchived : a.showArchived}
            </Link>
          </p>
        )}
        <SuppliersTable suppliers={suppliers} canEdit={canEdit} />
      </div>
    </main>
  );
}
