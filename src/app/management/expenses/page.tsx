import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatBaht, formatDate, formatMonth, todayIso } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { requirePermission } from "@/lib/permissions/require";

type ExpenseRow = {
  source: string;
  row_id: string;
  bill_date: string;
  kind_id: string;
  kind_label: string | null;
  parent_label: string | null;
  amount: number | string;
  covers_month: string | null;
  note: string | null;
  receipt_file_id: string | null;
  receipt_count: number;
};

/**
 * Management → Expenses: what the shelter has spent, by type and by month, each line linking to its receipt. For an outside
 * accountant (docs/decisions/2026-11-05-accountant-card-expenses.md). It READS ONLY: there is no control on this page that
 * changes anything, so there is nothing to gate beyond the page itself. The figures come from expense_report() (0317), which asks
 * reports.expenses at read in the database, because the bill tables are readable only to the activities that write them.
 * Grouped on the date printed on the bill; fixed outgoings (a forecast) and money received are not read.
 */
export default async function ExpensesPage(props: PageProps<"/management/expenses">) {
  await requirePermission("reports.expenses", "read");
  const { t, locale } = await getT();
  const c = t.management.expenses;
  const searchParams = await props.searchParams;

  const thisYear = Number(todayIso().slice(0, 4));
  const asked = Number(Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year);
  const year = Number.isInteger(asked) && asked >= 2000 && asked <= thisYear + 1 ? asked : thisYear;

  const supabase = await createClient();
  const [report, waiting] = await Promise.all([
    supabase.rpc("expense_report", { p_from: `${year}-01-01`, p_to: `${year}-12-31` }),
    supabase.rpc("expense_waiting_count"),
  ]);
  const failed = report.error ?? waiting.error;
  const rows = ((report.data ?? []) as ExpenseRow[]).map((r) => ({ ...r, amountNum: Number(r.amount) }));
  const waitingCount = typeof waiting.data === "number" ? waiting.data : 0;

  const typeLabel = (r: ExpenseRow) => (r.parent_label ? `${r.parent_label} › ${r.kind_label}` : (r.kind_label ?? ""));

  const total = rows.reduce((sum, r) => sum + r.amountNum, 0);
  const byType = new Map<string, { sum: number; n: number }>();
  const byMonth = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = typeLabel(r);
    const cur = byType.get(k) ?? { sum: 0, n: 0 };
    byType.set(k, { sum: cur.sum + r.amountNum, n: cur.n + 1 });
    const m = r.bill_date.slice(0, 7);
    byMonth.set(m, [...(byMonth.get(m) ?? []), r]);
  }
  const typeRows = [...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const months = [...byMonth.keys()].sort().reverse();

  const receiptCell = (r: ExpenseRow) =>
    r.receipt_file_id ? (
      <span className="flex items-center gap-2">
        <a href={driveImageUrl(r.receipt_file_id)} target="_blank" rel="noreferrer" className="text-primary underline">
          {c.receipt}
        </a>
        {r.receipt_count > 1 && <span className="text-xs text-muted">{c.moreReceipts(r.receipt_count - 1)}</span>}
      </span>
    ) : (
      <span className="text-muted">{c.noReceipt}</span>
    );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
        <p className="text-sm text-muted">{c.subtitle}</p>
      </div>

      <nav className="flex items-center gap-3 text-sm" aria-label={c.year}>
        <Link href={`/management/expenses?year=${year - 1}`} className="text-primary underline">
          {c.previousYear}
        </Link>
        <span className="font-medium text-foreground">
          {c.year} {year}
        </span>
        {year < thisYear && (
          <Link href={`/management/expenses?year=${year + 1}`} className="text-primary underline">
            {c.nextYear}
          </Link>
        )}
      </nav>

      <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-foreground" role="status">
        <span className="font-medium">{c.waitingLead}</span> {waitingCount > 0 ? c.waiting(waitingCount) : c.allFiled}
      </p>

      {failed ? (
        <p className="text-sm text-danger">
          {c.couldntLoad}: {failed.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{c.nothing}</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {c.total}: {formatBaht(total, locale)}
            </h2>
            <h3 className="text-sm font-medium text-foreground">{c.byType}</h3>
            <table className="w-full max-w-xl text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1 pr-4 font-normal">{c.type}</th>
                  <th className="py-1 pr-4 font-normal" />
                  <th className="py-1 text-right font-normal">{c.amount}</th>
                </tr>
              </thead>
              <tbody>
                {typeRows.map(([label, v]) => (
                  <tr key={label} className="border-b border-border">
                    <td className="py-1 pr-4">{label}</td>
                    <td className="py-1 pr-4 text-muted">{c.bills(v.n)}</td>
                    <td className="py-1 text-right tabular-nums">{formatBaht(v.sum, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">{c.byMonth}</h2>
            {months.map((m) => {
              const list = byMonth.get(m) ?? [];
              const monthTotal = list.reduce((sum, r) => sum + r.amountNum, 0);
              return (
                <div key={m} className="flex flex-col gap-1 overflow-x-auto">
                  <h3 className="text-base font-medium text-foreground">
                    {formatMonth(`${m}-01`, locale, true)}: {formatBaht(monthTotal, locale)}
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="py-1 pr-3 font-normal">{c.date}</th>
                        <th className="py-1 pr-3 font-normal">{c.type}</th>
                        <th className="py-1 pr-3 font-normal">{c.source}</th>
                        <th className="py-1 pr-3 font-normal">{c.covers}</th>
                        <th className="py-1 pr-3 font-normal">{c.note}</th>
                        <th className="py-1 pr-3 text-right font-normal">{c.amount}</th>
                        <th className="py-1 font-normal">{c.receipt}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={`${r.source}-${r.row_id}`} className="border-b border-border align-top">
                          <td className="py-1 pr-3 whitespace-nowrap">{formatDate(r.bill_date, locale)}</td>
                          <td className="py-1 pr-3">{typeLabel(r)}</td>
                          <td className="py-1 pr-3">{c.sources[r.source] ?? r.source}</td>
                          <td className="py-1 pr-3 whitespace-nowrap">
                            {r.covers_month ? formatMonth(r.covers_month, locale, true) : ""}
                          </td>
                          <td className="py-1 pr-3">{r.note ?? ""}</td>
                          <td className="py-1 pr-3 text-right tabular-nums">{formatBaht(r.amountNum, locale)}</td>
                          <td className="py-1">{receiptCell(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        </>
      )}

      <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-muted">
        <span className="font-medium text-foreground">{c.basisLead}</span> {c.basis}
      </p>
    </main>
  );
}
