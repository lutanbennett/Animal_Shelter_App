import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { MAX_FIXED_OUTGOINGS, type FixedOutgoing } from "@/lib/management/fixed-outgoings";
import { FixedOutgoingsEditor } from "./FixedOutgoingsEditor";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Management → Cashflow → Fixed outgoings: the named monthly costs the
 * forecast adds on top of what the records imply. Lives beside Cashflow
 * because that is what it feeds; whether it later moves with the rest of
 * Management (the Management-vs-Settings split is undecided) is that
 * item's call.
 *
 * Not payroll: a line is a named cost, never a person. Salaries is one
 * total line for the whole staff, and the table refuses a 25th line
 * (0114, docs/decisions/2026-09-29-fixed-outgoings-not-payroll.md).
 */
export default async function FixedOutgoingsPage() {
  await requirePermission("reports.cashflow");
  const { t } = await getT();
  const m = t.management.fixedOutgoings;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_outgoings")
    .select("id, label, monthly_amount, note, active, starts_on, ends_on")
    .order("label")
    .returns<FixedOutgoing[]>();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/management/cashflow"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {m.backToCashflow}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>

      <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-muted">
        <span className="font-medium text-foreground">{m.notPayrollLead}</span> {m.notPayroll}
      </p>

      {error ? (
        <p className="text-sm text-danger">
          {m.couldntLoad}: {error.message}
        </p>
      ) : (
        <FixedOutgoingsEditor lines={data ?? []} max={MAX_FIXED_OUTGOINGS} />
      )}
    </main>
  );
}
