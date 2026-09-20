import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { SECTION_ICONS } from "@/components/hub-icons";
import { MoveResidentForm } from "./MoveResidentForm";

/** Roles whose placement_history insert policy admits ChangeEnclosure. */
const MOVE_ROLES = new Set(["admin", "management", "staff", "volunteer"]);

export default async function MoveResidentPage(
  props: PageProps<"/residents/[id]/move">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [residentResult, statusResult, stateResult, placementResult, roleResult, options] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name, animal_code")
        .eq("id", id)
        .limit(1)
        .returns<
          { id: string; name: string; thai_name: string | null; animal_code: string }[]
        >(),
      supabase
        .from("resident_list_view")
        .select("enclosure_id, enclosure_name, zone_name")
        .eq("resident_id", id)
        .limit(1)
        .returns<
          {
            enclosure_id: string | null;
            enclosure_name: string | null;
            zone_name: string | null;
          }[]
        >(),
      supabase
        .from("resident_current_state")
        .select("current_status, is_deceased")
        .eq("resident_id", id)
        .limit(1)
        .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
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
  const status = statusResult.data?.[0];
  const state = stateResult.data?.[0];
  const canMove = MOVE_ROLES.has(roleResult.data ?? "");
  // The hub only links here for residents in (or unassigned to) a physical
  // enclosure, but the URL is guessable — mirror moveResidentToEnclosure().
  const blocked = !canMove
    ? t.residents.move.notAuthorized
    : state?.is_deceased
      ? t.residents.move.errors.deceased
      : state?.current_status === "Hospitalised"
        ? t.residents.move.errors.inHospital
        : state?.current_status === "Fostered" || state?.current_status === "Adopted"
          ? t.residents.move.errors.withCarer
          : null;
  const Icon = SECTION_ICONS.housing;

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
          {t.residents.move.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.animal_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{t.residents.move.pageSubtitle}</p>
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
        <MoveResidentForm
          residentId={id}
          current={{
            enclosureId: status?.enclosure_id ?? null,
            enclosureName: status?.enclosure_name ?? null,
            zoneName: status?.zone_name ?? null,
            since: placementResult.data?.[0]?.start_date ?? null,
          }}
          zones={options.zones}
          enclosures={options.enclosures}
        />
      )}
    </main>
  );
}
