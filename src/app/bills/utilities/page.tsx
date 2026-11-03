import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";
import { getT } from "@/lib/i18n/get-t";
import { formatBaht, formatDate, formatMonth, todayIso } from "@/lib/format";
import { kindsFor, tailoringOf, type BillKind } from "@/lib/bills/kinds";
import { UtilityForm } from "./UtilityForm";

type Row = {
  id: string;
  kind_id: string;
  premises_id: string | null;
  account_id: string | null;
  bill_date: string;
  covers_month: string;
  amount: number | string;
  note: string | null;
};

/**
 * /bills/utilities — utility bills (water, electricity and the like) by the month they cover, so one can be compared with
 * another over time. Cost only, no units. The whole page asks bills.utilities, the activity the utility_bills policy asks.
 */
export default async function UtilitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!can(perms, "bills.utilities")) refuseFor(perms);

  const { t, locale } = await getT();
  const u = t.bills.utilities;

  const [billsResult, kindsResult, premisesResult, accountsResult] = await Promise.all([
    supabase
      .from("utility_bills")
      .select("id, kind_id, premises_id, account_id, bill_date, covers_month, amount, note")
      .order("covers_month", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Row[]>(),
    supabase
      .from("bill_kinds")
      .select("id, key, label, parent_id, sort, archived_at")
      .order("sort")
      .returns<{ id: string; key: string; label: string; parent_id: string | null; sort: number; archived_at: string | null }[]>(),
    supabase.from("premises").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
    supabase
      .from("bill_accounts")
      .select("id, supplier, account_ref, premises_id, kind_id, archived_at")
      .order("supplier")
      .returns<{ id: string; supplier: string; account_ref: string | null; premises_id: string | null; kind_id: string | null; archived_at: string | null }[]>(),
  ]);

  const bills = billsResult.data ?? [];
  const allKinds: BillKind[] = (kindsResult.data ?? []).map((k) => ({
    id: k.id,
    key: k.key,
    label: k.label,
    parentId: k.parent_id,
    sort: k.sort,
    archived: k.archived_at != null,
  }));
  const kindName = new Map(allKinds.map((k) => [k.id, k.label]));
  const placeName = new Map((premisesResult.data ?? []).map((p) => [p.id, p.name]));
  const accountLabel = (a: { supplier: string; account_ref: string | null }) => (a.account_ref ? a.supplier + " · " + a.account_ref : a.supplier);
  const accountName = new Map((accountsResult.data ?? []).map((a) => [a.id, accountLabel(a)]));

  const choosable = kindsFor(perms, allKinds).filter((k) => tailoringOf(k, allKinds).route === "utility");
  const places = (premisesResult.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  const accounts = (accountsResult.data ?? [])
    .filter((a) => a.archived_at == null)
    .map((a) => ({ id: a.id, label: accountLabel(a), premisesId: a.premises_id, kindId: a.kind_id }));

  // One row per month covered, newest first, with a total per kind so water and electricity read side by side.
  const months = [...new Set(bills.map((b) => b.covers_month))];
  const kindsUsed = [...new Set(bills.map((b) => b.kind_id))];
  const total = (month: string, kindId?: string) =>
    bills.filter((b) => b.covers_month === month && (!kindId || b.kind_id === kindId)).reduce((s, b) => s + Number(b.amount), 0);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{u.title}</h1>
        <p className="text-sm text-muted">{u.subtitle}</p>
      </div>
      {billsResult.error && <p className="text-sm text-danger">{billsResult.error.message}</p>}
      <Link href="/bills" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
        {u.backToBills}
      </Link>

      <UtilityForm
        kinds={choosable.map((k) => ({ id: k.id, label: k.label, parentId: k.parentId }))}
        places={places}
        accounts={accounts}
        today={todayIso()}
      />

      {months.length === 0 ? (
        <p className="text-sm text-muted">{u.none}</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">{u.compare}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">{u.month}</th>
                    {kindsUsed.map((k) => (
                      <th key={k} className="px-3 py-2 text-right font-medium">
                        {kindName.get(k) ?? "—"}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-medium">{u.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{formatMonth(m, locale, true)}</td>
                      {kindsUsed.map((k) => (
                        <td key={k} className="px-3 py-2 text-right text-foreground">
                          {bills.some((b) => b.covers_month === m && b.kind_id === k) ? formatBaht(total(m, k), locale) : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-medium text-foreground">{formatBaht(total(m), locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">{u.bills}</h2>
            {months.map((m) => (
              <div key={m} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-foreground">{formatMonth(m, locale, true)}</h3>
                <ul className="flex flex-col gap-2">
                  {bills
                    .filter((b) => b.covers_month === m)
                    .map((b) => (
                      <li key={b.id} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 text-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {[kindName.get(b.kind_id), b.premises_id ? placeName.get(b.premises_id) : null].filter(Boolean).join(" · ")}
                          </span>
                          <span className="font-medium text-foreground">{formatBaht(Number(b.amount), locale)}</span>
                        </div>
                        <span className="text-xs text-muted">
                          {[b.account_id ? accountName.get(b.account_id) : null, u.billDated(formatDate(b.bill_date, locale)), b.note]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
