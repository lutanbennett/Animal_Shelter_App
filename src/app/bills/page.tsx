import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";
import { canUseBills } from "@/lib/bills/access";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import { formatDateTime, todayIso } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { BillsInbox, type BillCard, type BillSuggestion } from "./BillsInbox";

/** How far back a delivery or visit is offered as a likely match. */
const LOOKBACK_DAYS = 14;

function daysAgo(days: number): string {
  return todayIso(Date.now() - days * 86_400_000);
}

/**
 * /bills — photos of purchase bills and clinic invoices, added as you go or all at once at night,
 * matched later to a delivery or a clinic visit. Opens for anyone who may file a bill for at least
 * one thing (canUseBills); the database decides what each person sees and moves (0189).
 * "Bills" on screen, never "receipts": Donation receipts (0168) are the shelter's own, to donors.
 */
export default async function BillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!canUseBills(perms)) refuseFor(perms);

  const { t, locale } = await getT();
  const b = t.bills;
  const forDeliveries = can(perms, "stock.delivery");
  const forVisits = can(perms, "medical.visits", "edit");
  const forJobs = can(perms, "maintenance.bills");
  const since = daysAgo(LOOKBACK_DAYS);

  const [cardsResult, receiptsResult, visitsResult, jobsResult] = await Promise.all([
    supabase
      .from("bills_inbox")
      .select("id, taken_by, created_at, bill_date, amount, note")
      .order("created_at", { ascending: true })
      .returns<{ id: string; taken_by: string; created_at: string; bill_date: string | null; amount: number | string | null; note: string | null }[]>(),
    forDeliveries
      ? supabase
          .from("stock_receipts")
          .select("id, item_kind, medication_id, diet_type_id, quantity, unit, received_at")
          .is("cost", null)
          .gte("received_at", since)
          .order("received_at", { ascending: false })
          .returns<{ id: string; item_kind: string; medication_id: string | null; diet_type_id: string | null; quantity: number | string; unit: string | null; received_at: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    forVisits
      ? supabase
          .from("clinic_visits")
          .select("id, appointment_date, reason, residents(name, thai_name)")
          .is("cost", null)
          .gte("appointment_date", since)
          .order("appointment_date", { ascending: false })
          .returns<{ id: string; appointment_date: string; reason: string | null; residents: { name: string; thai_name: string | null } | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    // Jobs still open, or touched in the last two weeks (a finished job still gets its receipts a few days later).
    forJobs
      ? supabase
          .from("maintenance")
          .select("id, job_code, title, status, updated_at")
          .or(`status.neq.Completed,updated_at.gte.${since}`)
          .order("updated_at", { ascending: false })
          .limit(30)
          .returns<{ id: string; job_code: string; title: string; status: string; updated_at: string }[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const cards = cardsResult.data ?? [];
  const receipts = receiptsResult.data ?? [];
  const visits = visitsResult.data ?? [];
  const jobs = jobsResult.data ?? [];

  // One query for every card's photos and one for which candidates already hold a bill photo.
  const candidateIds = [...receipts.map((r) => r.id), ...visits.map((v) => v.id)];
  const [photosResult, heldResult, medsResult, dietsResult, takers] = await Promise.all([
    cards.length
      ? supabase
          .from("attachments")
          .select("id, owner_id, drive_file_id, file_name")
          .eq("owner_type", "bill_inbox")
          .in("owner_id", cards.map((c) => c.id))
          .order("created_at", { ascending: true })
          .returns<{ id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase
          .from("attachments")
          .select("owner_id")
          .in("owner_type", ["stock_receipt", "clinic_visit"])
          .in("owner_id", candidateIds)
          .returns<{ owner_id: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    receipts.some((r) => r.medication_id)
      ? supabase.from("stock_medications").select("id, name, name_th").returns<{ id: string; name: string; name_th: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    receipts.some((r) => r.diet_type_id)
      ? supabase.from("stock_diet_types").select("id, name, name_th").returns<{ id: string; name: string; name_th: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    loadAppUsersById(supabase, cards.map((c) => c.taken_by)),
  ]);

  const withBill = new Set((heldResult.data ?? []).map((a) => a.owner_id));
  const itemName = new Map([...(medsResult.data ?? []), ...(dietsResult.data ?? [])].map((i) => [i.id, localLabel(locale, i.name, i.name_th)]));

  const suggestions: BillSuggestion[] = [
    ...receipts
      .filter((r) => !withBill.has(r.id))
      .map((r) => ({
        kind: "stock_receipt" as const,
        id: r.id,
        day: todayIso(new Date(r.received_at).getTime()),
        title: `${b.page.delivery}: ${itemName.get(r.medication_id ?? r.diet_type_id ?? "") ?? "—"}`,
        detail: `${Number(r.quantity)}${r.unit ? ` ${r.unit}` : ""}`,
      })),
    ...visits
      .filter((v) => !withBill.has(v.id) && todayIso(new Date(v.appointment_date).getTime()) <= todayIso())
      .map((v) => ({
        kind: "clinic_visit" as const,
        id: v.id,
        day: todayIso(new Date(v.appointment_date).getTime()),
        title: `${b.page.visit}: ${v.residents ? localLabel(locale, v.residents.name, v.residents.thai_name) : "—"}`,
        detail: v.reason ?? "",
      })),
    ...jobs.map((j) => ({
      kind: "maintenance_job" as const,
      id: j.id,
      day: todayIso(new Date(j.updated_at).getTime()),
      title: `${b.page.job}: ${j.title}`,
      detail: j.job_code,
    })),
  ];

  const photosByCard = new Map<string, BillCard["photos"]>();
  for (const p of photosResult.data ?? []) {
    const list = photosByCard.get(p.owner_id) ?? [];
    list.push({ id: p.id, url: driveImageUrl(p.drive_file_id), name: p.file_name ?? "", isPdf: /\.pdf$/i.test(p.file_name ?? "") });
    photosByCard.set(p.owner_id, list);
  }

  const cardProps: BillCard[] = cards.map((c) => {
    const taker = takers.get(c.taken_by);
    return {
      id: c.id,
      day: todayIso(new Date(c.created_at).getTime()),
      addedBy: b.page.addedBy(taker ? appUserLabel(taker) : "—", formatDateTime(c.created_at, locale)),
      amount: c.amount == null ? "" : String(c.amount),
      date: c.bill_date ?? "",
      note: c.note ?? "",
      photos: photosByCard.get(c.id) ?? [],
    };
  });

  const loadError = cardsResult.error ?? receiptsResult.error ?? visitsResult.error ?? jobsResult.error ?? photosResult.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{b.title}</h1>
        <p className="text-sm text-muted">{b.subtitle}</p>
      </div>
      {loadError && <p className="text-sm text-danger">{loadError.message}</p>}
      <BillsInbox cards={cardProps} suggestions={suggestions} canDeliver={forDeliveries} />
    </main>
  );
}
