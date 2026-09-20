import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { SYSTEM_ZONE, loadEnclosureOptions } from "@/lib/enclosures/options";
import { REHOME_ROLES } from "@/lib/placements/rehome";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { ReturnToShelterForm } from "./ReturnToShelterForm";

export default async function ReturnToShelterPage(
  props: PageProps<"/residents/[id]/rehome/return">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [
    residentResult,
    stateResult,
    placementResult,
    lastPhysicalResult,
    roleResult,
    options,
  ] = await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name, animal_code")
        .eq("id", id)
        .limit(1)
        .returns<
          { id: string; name: string; thai_name: string | null; animal_code: string }[]
        >(),
      supabase
        .from("resident_current_state")
        .select("current_status, current_carer_id")
        .eq("resident_id", id)
        .limit(1)
        .returns<
          { current_status: string | null; current_carer_id: string | null }[]
        >(),
      supabase
        .from("placement_history")
        .select("start_date")
        .eq("resident_id", id)
        .is("end_date", null)
        .limit(1)
        .returns<{ start_date: string }[]>(),
      // The last physical enclosure they were in — not simply the current
      // row's previous_enclosure_id, which for an adoption that followed a
      // foster (or a foster that followed a hospital stay) is another
      // Lifecycle bucket.
      supabase
        .from("placement_history")
        .select("enclosure_id, enclosure:enclosures!enclosure_id!inner(zones!inner(name))")
        .eq("resident_id", id)
        .neq("enclosure.zones.name", SYSTEM_ZONE)
        .order("start_date", { ascending: false })
        .limit(1)
        .returns<{ enclosure_id: string }[]>(),
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
  const withCarer = currentStatus === "Fostered" || currentStatus === "Adopted";
  const canReturn = REHOME_ROLES.has(roleResult.data ?? "");
  const Icon = PLACEMENT_ICONS.returnToShelter;
  const today = new Date().toISOString().slice(0, 10);

  const carerResult =
    withCarer && state?.current_carer_id
      ? await supabase
          .from("contacts")
          .select("name")
          .eq("id", state.current_carer_id)
          .limit(1)
          .returns<{ name: string }[]>()
      : null;

  // Offer the last physical enclosure as the default only if the picker
  // can still show it — it may have been deleted since.
  const previousEnclosureId = withCarer
    ? (lastPhysicalResult.data?.[0]?.enclosure_id ?? null)
    : null;
  const previousEnclosure =
    options.enclosures.find((e) => e.id === previousEnclosureId) ?? null;

  const blocked = !canReturn
    ? t.residents.shelterReturn.notAuthorized
    : currentStatus === "Deceased"
      ? t.residents.shelterReturn.errors.deceased
      : !withCarer
        ? t.residents.shelterReturn.errors.notWithCarer
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
          {t.residents.shelterReturn.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.animal_code})
          </span>
        </h1>
        <p className="text-sm text-muted">
          {t.residents.shelterReturn.pageSubtitle}
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
        <ReturnToShelterForm
          residentId={id}
          status={currentStatus ?? "Fostered"}
          carerName={carerResult?.data?.[0]?.name ?? null}
          leftOn={placementResult.data?.[0]?.start_date ?? null}
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
