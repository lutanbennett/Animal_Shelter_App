import Link from "next/link";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatBahtPrice, formatDateTime, todayIso } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import { canManage } from "@/lib/auth/require-management";
import { canRecordDelivery, countDaysByItem, type DeliveryKind } from "@/lib/management/stock-receipts";
import { RecordDeliveryForm, type DeliveryFormItem } from "./RecordDeliveryForm";
import { DeleteDeliveryButton } from "./DeleteDeliveryButton";

/**
 * /deliveries — record a delivery of one medication or food, and see (and
 * delete) the recent ones (backlog "Record stock deliveries, so Stock
 * between counts can state usage"; schema 0096). Outside /management, as
 * /stocktake is, because the people who take a delivery at the door are
 * staff (0096's write policy: admin, management, staff — not volunteers).
 * Reached from Management → Medications / Diets, the Stocktake page and
 * Management → Stock between counts.
 */

type ItemRow = { id: string; name: string; unit: string };

type ReceiptRow = {
  id: string;
  item_kind: "medication" | "diet_type";
  medication_id: string | null;
  diet_type_id: string | null;
  quantity: number | string;
  unit: string | null;
  received_at: string;
  supplier_contact_id: string | null;
  cost: number | string | null;
  note: string | null;
  recorded_by: string | null;
};

/** How many recent deliveries the list shows. */
const RECENT = 50;

export default async function DeliveriesPage(props: PageProps<"/deliveries">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await supabase.rpc("current_user_role");
  if (!canRecordDelivery(role)) redirect("/");

  const { t, locale } = await getT();
  const d = t.deliveries;
  const searchParams = await props.searchParams;
  const initialKind: DeliveryKind = searchParams.tab === "diets" ? "diet" : "medication";

  const [medicationResult, dietResult, countsResult, suppliersResult, receiptsResult] = await Promise.all([
    supabase.from("medication").select("id, name, unit:dose_unit").order("name").returns<ItemRow[]>(),
    supabase.from("diet_types").select("id, name, unit").order("name").returns<ItemRow[]>(),
    supabase
      .from("stock_counts")
      .select("medication_id, diet_type_id, counted_at")
      .returns<{ medication_id: string | null; diet_type_id: string | null; counted_at: string }[]>(),
    // Every vendor, archived too: an old delivery still names its supplier.
    // The form offers only the live ones.
    supabase
      .from("contacts")
      .select("id, name, archived_at")
      .eq("type", "Vendor")
      .order("name")
      .returns<{ id: string; name: string; archived_at: string | null }[]>(),
    supabase
      .from("stock_receipts")
      .select(
        "id, item_kind, medication_id, diet_type_id, quantity, unit, received_at, supplier_contact_id, cost, note, recorded_by",
      )
      .order("received_at", { ascending: false })
      .limit(RECENT)
      .returns<ReceiptRow[]>(),
  ]);

  const medications = medicationResult.data ?? [];
  const diets = dietResult.data ?? [];
  const toItem =
    (unitLabel: (unit: string) => string) =>
    (row: ItemRow): DeliveryFormItem => ({ id: row.id, name: row.name, unit: unitLabel(row.unit) });

  const counts = countsResult.data ?? [];
  const countDays = {
    medication: countDaysByItem(
      counts.flatMap((c) => (c.medication_id ? [{ item_id: c.medication_id, counted_at: c.counted_at }] : [])),
    ),
    diet: countDaysByItem(
      counts.flatMap((c) => (c.diet_type_id ? [{ item_id: c.diet_type_id, counted_at: c.counted_at }] : [])),
    ),
  };

  const suppliers = suppliersResult.data ?? [];
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
  const itemName = new Map([...medications, ...diets].map((i) => [i.id, i.name]));
  const receipts = receiptsResult.data ?? [];
  const recorders = await loadAppUsersById(
    supabase,
    receipts.flatMap((r) => (r.recorded_by ? [r.recorded_by] : [])),
  );

  const loadError =
    medicationResult.error ?? dietResult.error ?? countsResult.error ?? suppliersResult.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
        <p className="text-sm text-muted">{d.subtitle}</p>
        {canManage(role) && (
          <Link
            href="/management/stock-usage"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Scale aria-hidden="true" className="h-4 w-4" />
            {t.management.stockUsage.link}
          </Link>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-danger">
          {d.couldntLoad}: {loadError.message}
        </p>
      )}

      <RecordDeliveryForm
        initialKind={initialKind}
        today={todayIso()}
        items={{
          medication: medications.map(toItem((u) => doseUnitLabel(t, u))),
          diet: diets.map(toItem((u) => dietUnitLabel(t, u))),
        }}
        countDays={countDays}
        suppliers={suppliers.filter((s) => s.archived_at == null).map(({ id, name }) => ({ id, name }))}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{d.recent.title}</h2>
        {receiptsResult.error && (
          <p className="text-sm text-danger">
            {d.couldntLoad}: {receiptsResult.error.message}
          </p>
        )}
        {receipts.length === 0 && !receiptsResult.error ? (
          <p className="text-sm text-muted">{d.recent.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {receipts.map((r) => {
              const isMed = r.item_kind === "medication";
              const id = (isMed ? r.medication_id : r.diet_type_id) ?? "";
              const unit = r.unit ? (isMed ? doseUnitLabel(t, r.unit) : dietUnitLabel(t, r.unit)) : "";
              const supplier = r.supplier_contact_id ? supplierName.get(r.supplier_contact_id) : undefined;
              const recorder = r.recorded_by ? recorders.get(r.recorded_by) : undefined;
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {d.recent.line(itemName.get(id) ?? "—", formatQuantity(Number(r.quantity)), unit)}
                    </span>
                    <span className="text-xs text-muted">
                      {[
                        formatDateTime(r.received_at, locale),
                        isMed ? d.kinds.medication : d.kinds.diet,
                        supplier ? d.recent.from(supplier) : null,
                        r.cost == null
                          ? null
                          : Number(r.cost) === 0
                            ? d.recent.donated
                            : formatBahtPrice(Number(r.cost), locale),
                        recorder ? d.recent.by(appUserLabel(recorder)) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {r.note && <span className="text-xs text-foreground">{r.note}</span>}
                  </div>
                  <DeleteDeliveryButton id={r.id} label={itemName.get(id) ?? ""} />
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted">{d.recent.note(RECENT)}</p>
      </section>
    </main>
  );
}
