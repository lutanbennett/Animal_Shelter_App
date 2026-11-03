import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { BillsSettings, type AccountRow, type KindRow, type PremisesRow } from "./BillsSettings";

/**
 * Bills settings: the places bills are paid for, the accounts at suppliers, and the kinds an invoice can be for
 * (premises, bill_accounts, bill_kinds; 0305). Opens for bills.sites, the activity the three tables' write policies ask,
 * and every control on it asks that same activity. Nothing is seeded: the shelter types its own places in.
 * docs/decisions/2026-11-03-bills-interface-half.md
 */
export default async function BillsSettingsPage() {
  const { supabase } = await requirePermission("bills.sites");
  const { t } = await getT();
  const s = t.bills.settings;

  const [premises, accounts, kinds] = await Promise.all([
    supabase
      .from("premises")
      .select("id, name, note, archived_at")
      .order("name")
      .returns<{ id: string; name: string; note: string | null; archived_at: string | null }[]>(),
    supabase
      .from("bill_accounts")
      .select("id, supplier, account_ref, note, premises_id, kind_id, archived_at")
      .order("supplier")
      .returns<{ id: string; supplier: string; account_ref: string | null; note: string | null; premises_id: string | null; kind_id: string | null; archived_at: string | null }[]>(),
    supabase
      .from("bill_kinds")
      .select("id, key, label, parent_id, sort, archived_at")
      .order("sort")
      .returns<{ id: string; key: string; label: string; parent_id: string | null; sort: number; archived_at: string | null }[]>(),
  ]);
  const loadError = premises.error ?? accounts.error ?? kinds.error;

  const premisesRows: PremisesRow[] = (premises.data ?? []).map((p) => ({ id: p.id, name: p.name, note: p.note ?? "", archived: p.archived_at != null }));
  const kindRows: KindRow[] = (kinds.data ?? []).map((k) => ({ id: k.id, key: k.key, label: k.label, parentId: k.parent_id, sort: k.sort, archived: k.archived_at != null }));
  const accountRows: AccountRow[] = (accounts.data ?? []).map((a) => ({
    id: a.id,
    supplier: a.supplier,
    accountRef: a.account_ref ?? "",
    note: a.note ?? "",
    premisesId: a.premises_id ?? "",
    kindId: a.kind_id ?? "",
    archived: a.archived_at != null,
  }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="max-w-3xl text-sm text-muted">{s.subtitle}</p>
        <Link href="/bills" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
          {s.backToBills}
        </Link>
      </div>
      {loadError && <p className="text-sm text-danger">{loadError.message}</p>}
      <BillsSettings premises={premisesRows} accounts={accountRows} kinds={kindRows} />
    </main>
  );
}
