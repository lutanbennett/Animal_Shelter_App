import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { estimatedAgeNow } from "@/lib/format";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import type { PhotoRow } from "@/components/PhotoGallery";
import {
  EditResidentForm,
  type EditableResident,
  type HousingState,
} from "./EditResidentForm";

export default async function EditResidentPage(
  props: PageProps<"/residents/[id]/edit">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [
    residentResult,
    photosResult,
    roleResult,
    statusResult,
    stateResult,
    options,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, resident_code, thai_name, other_names, species, breed, sex, estimated_age_years, age_estimated_on, bio, temperament_notes, past_story_notes, behaviour_notes, profile_photo_drive_file_id, ready_for_adoption, is_public_visible",
      )
      .eq("id", id)
      .limit(1)
      .returns<EditableResident[]>(),
    supabase
      .from("attachments")
      .select("id, drive_file_id, file_name, sub_folder, date_taken")
      .eq("owner_type", "resident")
      .eq("owner_id", id)
      .order("uploaded_at", { ascending: true })
      .returns<PhotoRow[]>(),
    supabase.rpc("current_user_role"),
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
  const role = roleResult.data;
  const canEdit =
    role === "admin" || role === "management" || role === "staff";
  const status = statusResult.data?.[0];
  const currentStatus = stateResult.data?.[0]?.current_status ?? null;
  const housing: HousingState = {
    enclosureId: status?.enclosure_id ?? null,
    enclosureName: status?.enclosure_name ?? null,
    zoneName: status?.zone_name ?? null,
    isDeceased: stateResult.data?.[0]?.is_deceased ?? false,
    isHospitalised: currentStatus === "Hospitalised",
    isWithCarer: currentStatus === "Fostered" || currentStatus === "Adopted",
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.residents.edit.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{t.residents.edit.pageSubtitle}</p>
      </div>

      {photosResult.error && (
        <p className="text-sm text-danger">
          {t.residents.edit.couldntLoadPhotos}: {photosResult.error.message}
        </p>
      )}

      {options.error && (
        <p className="text-sm text-danger">
          {t.residents.new.couldntLoadEnclosures}: {options.error}
        </p>
      )}

      {/* A deceased resident's record is read-only, enforced by the
          database (migration 0026) — don't offer a form whose every save
          would be rejected. */}
      {housing.isDeceased ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {t.residents.deceased.recordClosed}
        </p>
      ) : canEdit ? (
        <EditResidentForm
          resident={resident}
          photos={photosResult.data ?? []}
          housing={housing}
          zones={options.zones}
          enclosures={options.enclosures}
          ageNow={estimatedAgeNow(
            resident.estimated_age_years,
            resident.age_estimated_on,
          )}
        />
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {t.residents.edit.notAuthorized}
        </p>
      )}
    </main>
  );
}
