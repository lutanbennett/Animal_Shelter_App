import Link from "next/link";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { getT } from "@/lib/i18n/get-t";
import { formatBahtExact, formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { BillPhotosSection, type BillPhoto } from "@/components/BillPhotosSection";

type Row = {
  id: string;
  kind_id: string;
  premises_id: string | null;
  account_id: string | null;
  bill_date: string;
  amount: number | string;
  note: string | null;
};

/**
 * /bills/general — general bills already filed (materials, cleaning products, Other), each with the pages on it and an
 * add-a-page control. The whole page asks bills.general, the activity the general_bills policy asks; the add control asks
 * the same activity the upload route asks for a general_bill owner (mayFileBill: bills.general).
 */
export default async function GeneralBillsPage() {
  const { supabase, perms } = await requirePermission("bills.general");
  const { t, locale } = await getT();
  const g = t.bills.general;

  const [billsResult, kindsResult, premisesResult, accountsResult] = await Promise.all([
    supabase
      .from("general_bills")
      .select("id, kind_id, premises_id, account_id, bill_date, amount, note")
      .order("bill_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Row[]>(),
    supabase.from("bill_kinds").select("id, label").returns<{ id: string; label: string }[]>(),
    supabase.from("premises").select("id, name").returns<{ id: string; name: string }[]>(),
    supabase.from("bill_accounts").select("id, supplier, account_ref").returns<{ id: string; supplier: string; account_ref: string | null }[]>(),
  ]);

  const bills = billsResult.data ?? [];
  const photosByBill = new Map<string, BillPhoto[]>();
  let photoError: string | null = null;
  if (bills.length > 0) {
    const { data, error } = await supabase
      .from("attachments")
      .select("id, owner_id, drive_file_id, file_name")
      .eq("owner_type", "general_bill")
      .in("owner_id", bills.map((b) => b.id))
      .order("uploaded_at", { ascending: true })
      .returns<{ id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]>();
    if (error) photoError = error.message;
    for (const a of data ?? []) {
      const list = photosByBill.get(a.owner_id) ?? [];
      list.push({ id: a.id, url: driveImageUrl(a.drive_file_id), name: a.file_name ?? "", isPdf: /\.pdf$/i.test(a.file_name ?? "") });
      photosByBill.set(a.owner_id, list);
    }
  }

  const kindName = new Map((kindsResult.data ?? []).map((k) => [k.id, k.label]));
  const placeName = new Map((premisesResult.data ?? []).map((p) => [p.id, p.name]));
  const accountName = new Map((accountsResult.data ?? []).map((a) => [a.id, a.account_ref ? a.supplier + " · " + a.account_ref : a.supplier]));
  const canAdd = can(perms, "bills.general");
  const loadError = billsResult.error?.message ?? photoError;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{g.title}</h1>
        <p className="text-sm text-muted">{g.subtitle}</p>
      </div>
      {loadError && <p className="text-sm text-danger">{loadError}</p>}
      <Link href="/bills" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
        {g.backToBills}
      </Link>
      {bills.length === 0 ? (
        <p className="text-sm text-muted">{g.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((b) => {
            const photos = photosByBill.get(b.id) ?? [];
            return (
              <li key={b.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {[kindName.get(b.kind_id), b.premises_id ? placeName.get(b.premises_id) : null].filter(Boolean).join(" · ")}
                  </span>
                  <span className="font-medium text-foreground">{formatBahtExact(Number(b.amount), locale)}</span>
                </div>
                <span className="text-xs text-muted">
                  {[b.account_id ? accountName.get(b.account_id) : null, g.billDated(formatDate(b.bill_date, locale)), b.note, photos.length > 0 ? g.pages(photos.length) : g.noPages]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <BillPhotosSection kind="general_bill" ownerId={b.id} photos={photos} canAdd={canAdd} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
