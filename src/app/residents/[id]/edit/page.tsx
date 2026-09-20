import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { estimatedAgeNow } from "@/lib/format";
import type { PhotoRow } from "@/components/PhotoGallery";
import { EditResidentForm, type EditableResident } from "./EditResidentForm";

export default async function EditResidentPage(
  props: PageProps<"/residents/[id]/edit">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [residentResult, photosResult, roleResult] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, animal_code, thai_name, other_names, species, breed, sex, estimated_age_years, age_estimated_on, bio, temperament_notes, past_story_notes, behaviour_notes, profile_photo_drive_file_id, ready_for_adoption, is_public_visible",
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
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const role = roleResult.data;
  const canEdit = role === "admin" || role === "staff";

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
          {t.residents.edit.pageTitle(displayName)}
        </h1>
        <p className="text-sm text-muted">{t.residents.edit.pageSubtitle}</p>
      </div>

      {photosResult.error && (
        <p className="text-sm text-danger">
          {t.residents.edit.couldntLoadPhotos}: {photosResult.error.message}
        </p>
      )}

      {canEdit ? (
        <EditResidentForm
          resident={resident}
          photos={photosResult.data ?? []}
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
