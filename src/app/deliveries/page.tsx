import Link from "next/link";
import { billCostParam } from "@/lib/bills/cost-param";
import { Receipt, Scale } from "lucide-react";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { formatBahtPrice, formatDateTime, todayIso } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import { can } from "@/lib/permissions/can";
import {
  countDaysByItem,
  sideOfCount,
  type DeliveryKind,
} from "@/lib/management/stock-receipts";
import { CONVERSION_COLUMNS, groupConversions, type ConversionRow, type EnteredLine } from "@/lib/units";
import { DeliverySteps } from "./DeliverySteps";
import { RecordDeliveryForm, type DeliveryFormItem } from "./RecordDeliveryForm";
import { DeleteDeliveryButton } from "./DeleteDeliveryButton";
import { BillPhotosSection } from "@/components/BillPhotosSection";
import { loadBillPhotos } from "@/lib/bills/photos";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { promotionOffers, type DescribedRow } from "@/lib/management/described-lines";
import { BillTotalsLine } from "./BillTotalsLine";
import { PromoteOffers } from "./PromoteOffers";
import type { BillTotals } from "./actions";

/**
 * /deliveries — record a delivery of one medication or food, and see (and
 * delete) the recent ones (backlog "Record stock deliveries, so Stock
 * between counts can state usage"; schema 0096). Outside /management, as
 * /stocktake is, because the people who take a delivery at the door are
 * staff (0096's write policy: admin, management, staff — not volunteers).
 * Reached from the menu (F-15: it had been a 20 px link at the top of
 * Stocktake), the Stocktake page's Record a delivery button, and Home.
 *
 * Two layouts of one screen, as Purchasing is: a phone gets one question
 * per screen (DeliverySteps), md and up the single form. Same server action,
 * same fields.
 */

type ItemRow = { id: string; name: string; name_th: string | null; unit: string; label_drive_file_id?: string | null };

type ReceiptRow = {
  id: string;
  item_kind: "medication" | "diet_type" | "described";
  medication_id: string | null;
  diet_type_id: string | null;
  /** The bill this line is on (0308); null on a delivery recorded before bills had several lines. */
  delivery_id: string | null;
  /** A described line's words (item_kind described): it has no medication or diet to name it. */
  description: string | null;
  promoted_medication_id: string | null;
  promoted_diet_type_id: string | null;
  quantity: number | string;
  unit: string | null;
  received_at: string;
  supplier_contact_id: string | null;
  cost: number | string | null;
  note: string | null;
  recorded_by: string | null;
  /** What was typed and the factor stamped then (0118); null = entered in the base unit. */
  entered: EnteredLine[] | null;
};

/** How many recent deliveries the list shows. */
const RECENT = 50;

export default async function DeliveriesPage(props: PageProps<"/deliveries">) {
  const { supabase, perms } = await requirePermission("stock.delivery");

  const { t, locale } = await getT();
  const d = t.deliveries;
  const searchParams = await props.searchParams;
  const initialKind: DeliveryKind = searchParams.tab === "diets" ? "diet" : "medication";
  // Opened from a card in the Bills inbox ("Record a new delivery from this bill"): its photos move onto the delivery.
  const fromBill = typeof searchParams.fromBill === "string" && /^[0-9a-f-]{36}$/i.test(searchParams.fromBill) ? searchParams.fromBill : null;
  const billCost = billCostParam(searchParams.cost);

  const [medicationResult, dietResult, countsResult, suppliersResult, receiptsResult, conversionsResult] = await Promise.all([
    supabase.from("stock_medications").select("id, name, name_th, unit:dose_unit, label_drive_file_id").order("name").returns<ItemRow[]>(),
    supabase.from("stock_diet_types").select("id, name, name_th, unit").order("name").returns<ItemRow[]>(),
    supabase
      .from("stock_counts")
      .select("medication_id, diet_type_id, counted_at")
      .neq("source", "correction")
      .returns<{ medication_id: string | null; diet_type_id: string | null; counted_at: string }[]>(),
    // Every vendor, archived too: an old delivery still names its supplier.
    // The form offers only the live ones.
    supabase
      .from("stock_vendors")
      .select("id, name, archived_at")
      .order("name")
      .returns<{ id: string; name: string; archived_at: string | null }[]>(),
    supabase
      .from("stock_receipts")
      .select(
        "id, item_kind, medication_id, diet_type_id, delivery_id, description, promoted_medication_id, promoted_diet_type_id, quantity, unit, received_at, supplier_contact_id, cost, note, recorded_by, entered",
      )
      .order("received_at", { ascending: false })
      .limit(RECENT)
      .returns<ReceiptRow[]>(),
    supabase.from("item_unit_conversions").select(CONVERSION_COLUMNS).returns<ConversionRow[]>(),
  ]);

  const conversions = groupConversions(conversionsResult.data ?? []);
  const medications = medicationResult.data ?? [];
  const diets = dietResult.data ?? [];
  const toItem =
    (unitLabel: (unit: string) => string) =>
    (row: ItemRow): DeliveryFormItem => ({
      id: row.id,
      name: localLabel(locale, row.name, row.name_th),
      unit: unitLabel(row.unit),
      labelFileId: row.label_drive_file_id ?? null,
      conversions: conversions[row.id] ?? [],
    });

  const counts = countsResult.data ?? [];
  const countDays = {
    medication: countDaysByItem(
      counts.flatMap((c) => (c.medication_id ? [{ item_id: c.medication_id, counted_at: c.counted_at }] : [])),
    ),
    diet: countDaysByItem(
      counts.flatMap((c) => (c.diet_type_id ? [{ item_id: c.diet_type_id, counted_at: c.counted_at }] : [])),
    ),
  };

  // Every count instant per item, for the list's before / after tag.
  const countedAt = new Map<string, string[]>();
  for (const c of counts) {
    const id = c.medication_id ?? c.diet_type_id;
    if (!id) continue;
    const list = countedAt.get(id) ?? [];
    list.push(c.counted_at);
    countedAt.set(id, list);
  }

  const suppliers = suppliersResult.data ?? [];
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
  const itemName = new Map([...medications, ...diets].map((i) => [i.id, localLabel(locale, i.name, i.name_th)]));
  const receipts = receiptsResult.data ?? [];
  // A line on a bill shares the bill's photos and total (the header, 0308); a line from before bills keeps its own photos.
  const deliveryIds = [...new Set(receipts.flatMap((r) => (r.delivery_id ? [r.delivery_id] : [])))];
  const [billPhotos, headerPhotos, totalsResult, describedResult, recorders] = await Promise.all([
    loadBillPhotos(supabase, "stock_receipt", receipts.filter((r) => !r.delivery_id).map((r) => r.id)),
    loadBillPhotos(supabase, "stock_delivery", deliveryIds),
    deliveryIds.length
      ? supabase
          .from("stock_delivery_totals")
          .select("delivery_id, amount, lines, unpriced_lines, lines_cost, difference")
          .in("delivery_id", deliveryIds)
          .returns<{ delivery_id: string; amount: number | string | null; lines: number | string; unpriced_lines: number | string; lines_cost: number | string | null; difference: number | string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    // Every typed line, not only the recent ones: "typed more than once" is counted over all of them.
    supabase
      .from("stock_receipts")
      .select("id, description, unit, promoted_medication_id, promoted_diet_type_id")
      .eq("item_kind", "described")
      .returns<DescribedRow[]>(),
    loadAppUsersById(
      supabase,
      receipts.flatMap((r) => (r.recorded_by ? [r.recorded_by] : [])),
    ),
  ]);

  const num = (v: number | string | null) => (v == null ? null : Number(v));
  const totalsOf = new Map<string, BillTotals>(
    (totalsResult.data ?? []).map((x) => [
      x.delivery_id,
      { amount: num(x.amount), lines: Number(x.lines), unpricedLines: Number(x.unpriced_lines), linesCost: num(x.lines_cost), difference: num(x.difference) },
    ]),
  );
  const offers = promotionOffers(describedResult.data ?? []);
  // Adding to a list needs the Settings write for that list as well as the delivery activity the page already asks.
  const mayPromote = { medication: canEditItemSettings(perms, "medication"), diet: canEditItemSettings(perms, "diet") };
  const shownBills = new Set<string>();

  const formProps = {
    initialKind,
    today: todayIso(),
    items: {
      medication: medications.map(toItem((u) => doseUnitLabel(t, u))),
      diet: diets.map(toItem((u) => dietUnitLabel(t, u))),
    },
    countDays,
    suppliers: suppliers.filter((s) => s.archived_at == null).map(({ id, name }) => ({ id, name })),
    fromBill,
    billCost,
  };

  const loadError =
    medicationResult.error ?? dietResult.error ?? countsResult.error ?? suppliersResult.error ?? conversionsResult.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
        <p className="hidden text-sm text-muted md:block">{d.subtitle}</p>
        <Link
          href="/bills"
          className="mt-2 mr-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline md:min-h-0"
        >
          <Receipt aria-hidden="true" className="h-4 w-4" />
          {d.billsLink}
        </Link>
        {can(perms, "stock.usage") && (
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

      <div className="md:hidden">
        <DeliverySteps {...formProps} />
      </div>
      <div className="hidden md:block">
        <RecordDeliveryForm {...formProps} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{d.recent.title}</h2>
        {offers.length > 0 && (mayPromote.medication || mayPromote.diet) && (
          <PromoteOffers offers={offers} mayMedication={mayPromote.medication} mayDiet={mayPromote.diet} />
        )}
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
              // A described line (0308) has neither a medication nor a diet: its words are its name, its unit was typed.
              const isDescribed = r.item_kind === "described";
              const id = isDescribed ? "" : ((isMed ? r.medication_id : r.diet_type_id) ?? "");
              const unit = !r.unit ? "" : isDescribed ? r.unit : isMed ? doseUnitLabel(t, r.unit) : dietUnitLabel(t, r.unit);
              const name = isDescribed ? (r.description ?? "—") : (itemName.get(id) ?? "—");
              // The bill's total and photos are shown once, on its first line in the list.
              const firstOfBill = r.delivery_id != null && !shownBills.has(r.delivery_id);
              if (r.delivery_id) shownBills.add(r.delivery_id);
              const supplier = r.supplier_contact_id ? supplierName.get(r.supplier_contact_id) : undefined;
              const recorder = r.recorded_by ? recorders.get(r.recorded_by) : undefined;
              // On a day the item was counted, the minute shown can be the
              // count's own, so say which side of it the delivery fell.
              const side = isDescribed ? null : sideOfCount(r.received_at, countedAt.get(id) ?? []);
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {d.recent.line(name, formatQuantity(Number(r.quantity)), unit)}
                    </span>
                    {/* The amounts stored on the row, never a live conversion. */}
                    {r.entered && (
                      <span className="text-xs text-muted">
                        {r.entered
                          .map((line) =>
                            t.units.entry.recent(
                              formatQuantity(line.quantity),
                              localLabel(locale, line.unit, conversions[id]?.find((c) => c.unit === line.unit)?.unitTh),
                              formatQuantity(Number(r.quantity)),
                              unit,
                            ),
                          )
                          .join(" + ")}
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {[
                        formatDateTime(r.received_at, locale),
                        isDescribed ? d.kinds.described : isMed ? d.kinds.medication : d.kinds.diet,
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
                    {side && (
                      <span className="w-fit rounded bg-surface px-1.5 py-0.5 text-xs text-foreground">
                        {d.recent.side[side]}
                      </span>
                    )}
                    {isDescribed && <span className="text-xs text-muted">{d.recent.notStock}</span>}
                    {r.note && <span className="text-xs text-foreground">{r.note}</span>}
                    {r.delivery_id == null && (
                      <BillPhotosSection kind="stock_receipt" ownerId={r.id} photos={billPhotos.get(r.id) ?? []} canAdd={can(perms, "stock.delivery")} />
                    )}
                    {firstOfBill && r.delivery_id && (
                      <div className="mt-1 flex flex-col gap-1 rounded border border-border bg-surface px-3 py-2">
                        <BillTotalsLine totals={totalsOf.get(r.delivery_id) ?? null} />
                        <BillPhotosSection kind="stock_delivery" ownerId={r.delivery_id} photos={headerPhotos.get(r.delivery_id) ?? []} canAdd={can(perms, "stock.delivery")} />
                      </div>
                    )}
                  </div>
                  <DeleteDeliveryButton id={r.id} label={name === "—" ? "" : name} />
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
