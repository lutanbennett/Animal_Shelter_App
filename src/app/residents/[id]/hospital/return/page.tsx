import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { HOSPITAL_ROLES } from "@/lib/placements/hospital";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { ReturnFromHospitalForm } from "./ReturnFromHospitalForm";
import { todayIso } from "@/lib/format";

export default async function ReturnFromHospitalPage(
  props: PageProps<"/residents/[id]/hospital/return">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [residentResult, stateResult, placementResult, roleResult, options] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name, resident_code")
        .eq("id", id)
        .limit(1)
        .returns<
          { id: string; name: string; thai_name: string | null; resident_code: string }[]
        >(),
      supabase
        .from("resident_current_state")
        .select("current_status, active_hospital_previous_enclosure")
        .eq("resident_id", id)
        .limit(1)
        .returns<
          {
            current_status: string | null;
            active_hospital_previous_enclosure: string | null;
          }[]
        >(),
      supabase
        .from("placement_history")
        .select("start_date")
        .eq("resident_id", id)
        .is("end_date", null)
        .limit(1)
        .returns<{ start_date: string }[]>(),
      supabase.rpc("current_user_role"),
      loadEnclosureOptions(supabase),
    ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const state = stateResult.data?.[0];
  const currentStatus = state?.current_status ?? null;
  const canReturn = HOSPITAL_ROLES.has(roleResult.data ?? "");
  const Icon = PLACEMENT_ICONS.hospitalReturn;
  const today = todayIso();

  // previous_enclosure_id is only "where they'll return to" while the
  // resident is actually in hospital (it's set on every move as well). It's
  // offered as the default only if it's still a physical enclosure the
  // picker can show — it may have been deleted, or the resident may have
  // gone to hospital from a Lifecycle status such as Fostered.
  const previousEnclosureId =
    currentStatus === "Hospitalised"
      ? (state?.active_hospital_previous_enclosure ?? null)
      : null;
  const previousEnclosure =
    options.enclosures.find((e) => e.id === previousEnclosureId) ?? null;

  const blocked = !canReturn
    ? t.residents.hospitalReturn.notAuthorized
    : currentStatus === "Deceased"
      ? t.residents.hospitalReturn.errors.deceased
      : currentStatus !== "Hospitalised"
        ? t.residents.hospitalReturn.errors.notInHospital
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
          {t.residents.hospitalReturn.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">
          {t.residents.hospitalReturn.pageSubtitle}
        </p>
      </div>

      {options.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadEnclosures}: {options.error}
        </p>
      )}

      {blocked ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <ReturnFromHospitalForm
          residentId={id}
          admittedOn={placementResult.data?.[0]?.start_date ?? null}
          previousEnclosure={previousEnclosure}
          hadPreviousEnclosure={previousEnclosureId != null}
          zones={options.zones}
          enclosures={options.enclosures}
          today={today}
        />
      )}
    </main>
  );
}
