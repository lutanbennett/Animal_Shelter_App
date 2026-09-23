import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { loadCarerOptions } from "@/lib/contacts/carers";
import {
  FOSTERED_ENCLOSURE,
  REHOME_ROLES,
  type RehomeKind,
} from "@/lib/placements/rehome";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { RehomeForm } from "./RehomeForm";
import { todayIso } from "@/lib/format";

export default async function RehomePage(props: PageProps<"/residents/[id]/rehome">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();

  const [
    residentResult,
    statusResult,
    stateResult,
    placementResult,
    previousResult,
    roleResult,
    carerOptions,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, resident_code")
      .eq("id", id)
      .limit(1)
      .returns<
        { id: string; name: string; thai_name: string | null; resident_code: string }[]
      >(),
    supabase
      .from("resident_list_view")
      .select("current_status, enclosure_name, enclosure_name_th, zone_name, zone_name_th")
      .eq("resident_id", id)
      .limit(1)
      .returns<
        {
          current_status: string | null;
          enclosure_name: string | null;

          enclosure_name_th: string | null;
          zone_name: string | null;
          zone_name_th: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("current_carer_id, is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ current_carer_id: string | null; is_deceased: boolean }[]>(),
    supabase
      .from("placement_history")
      .select("start_date")
      .eq("resident_id", id)
      .is("end_date", null)
      .limit(1)
      .returns<{ start_date: string }[]>(),
    // The placement before the current one — so a foster interrupted by a
    // hospital stay can resume with the same carer pre-selected.
    supabase
      .from("placement_history")
      .select("carer_id, enclosure:enclosures!enclosure_id(name)")
      .eq("resident_id", id)
      .not("end_date", "is", null)
      .order("end_date", { ascending: false })
      .limit(1)
      .returns<{ carer_id: string | null; enclosure: { name: string } | null }[]>(),
    supabase.rpc("current_user_role"),
    loadCarerOptions(supabase),
  ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const status = statusResult.data?.[0];
  const currentStatus = status?.current_status ?? null;
  const state = stateResult.data?.[0];
  const canRehome = REHOME_ROLES.has(roleResult.data ?? "");
  const Icon = PLACEMENT_ICONS.rehome;
  const today = todayIso();

  const carers = carerOptions.carers;
  const carerName = (carerId: string | null) =>
    carers.find((c) => c.id === carerId)?.name ?? null;

  const currentCarerId =
    currentStatus === "Fostered" ? (state?.current_carer_id ?? null) : null;
  const previous = previousResult.data?.[0];
  const fromHospitalCarerId =
    currentStatus === "Hospitalised" &&
    previous?.enclosure?.name === FOSTERED_ENCLOSURE &&
    previous.carer_id &&
    carers.some((c) => c.id === previous.carer_id)
      ? previous.carer_id
      : null;

  // ?type= picks the tab; otherwise a fostered resident is most likely
  // being adopted by their carer, and anyone else is going to foster.
  const requestedKind = searchParams.type;
  const defaultKind: RehomeKind =
    requestedKind === "adopt" || requestedKind === "foster"
      ? requestedKind
      : currentStatus === "Fostered"
        ? "adopt"
        : "foster";

  const blocked = !canRehome
    ? t.residents.rehome.notAuthorized
    : state?.is_deceased
      ? t.residents.rehome.errors.deceased
      : currentStatus === "Adopted"
        ? t.residents.rehome.errors.alreadyAdopted
        : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
          {t.residents.rehome.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{t.residents.rehome.pageSubtitle}</p>
      </div>

      {carerOptions.error && (
        <p className="text-sm text-danger">{carerOptions.error}</p>
      )}

      {blocked ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <RehomeForm
          residentId={id}
          current={{
            status: currentStatus,
            enclosureName: placeName(locale, status?.enclosure_name, status?.enclosure_name_th) || null,
            zoneName: placeName(locale, status?.zone_name, status?.zone_name_th) || null,
            carerName: carerName(currentCarerId),
            since: placementResult.data?.[0]?.start_date ?? null,
          }}
          carers={carers}
          currentCarerId={currentCarerId}
          defaultCarerId={currentCarerId ?? fromHospitalCarerId}
          fromHospitalCarerName={carerName(fromHospitalCarerId)}
          defaultKind={defaultKind}
          today={today}
        />
      )}
    </main>
  );
}
