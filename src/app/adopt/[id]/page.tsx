import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { speciesLabel, sexLabel, sizeLabel } from "@/lib/i18n/enum-labels";
import { formatAge } from "@/lib/format";
import { PublicHeader } from "../PublicHeader";
import { PhotoGallery } from "./PhotoGallery";

type PublicResident = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  ready_for_adoption: boolean;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  profile_photo_drive_file_id: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
};

export default async function PublicResidentPage(
  props: PageProps<"/adopt/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { t } = await getT();

  const [residentsResult, photosResult] = await Promise.all([
    supabase
      .from("public_resident_profiles")
      .select(
        "id, name, species, breed, sex, size, ready_for_adoption, bio, temperament_notes, past_story_notes, profile_photo_drive_file_id, estimated_age_years, age_estimated_on",
      )
      .eq("id", id)
      .limit(1)
      .returns<PublicResident[]>(),
    supabase
      .from("public_resident_photos")
      .select("drive_file_id")
      .eq("resident_id", id)
      .order("uploaded_at")
      .returns<{ drive_file_id: string }[]>(),
  ]);

  const resident = residentsResult.data?.[0];
  if (!resident) notFound();

  // Profile photo first (it's the resident's chosen cover shot), then the
  // rest of their gallery, deduplicated — record_attachment always inserts
  // an attachments row for the profile photo too, so it'd otherwise appear
  // twice.
  const photoIds = [
    resident.profile_photo_drive_file_id,
    ...(photosResult.data ?? []).map((p) => p.drive_file_id),
  ].filter((fileId, index, all): fileId is string => {
    return Boolean(fileId) && all.indexOf(fileId) === index;
  });

  const details = [
    resident.species && {
      label: t.adopt.details.species,
      value: speciesLabel(t, resident.species),
    },
    resident.breed && { label: t.adopt.details.breed, value: resident.breed },
    resident.sex && {
      label: t.adopt.details.sex,
      value: sexLabel(t, resident.sex),
    },
    resident.size && {
      label: t.adopt.details.size,
      value: sizeLabel(t, resident.size),
    },
    resident.estimated_age_years != null && {
      label: t.adopt.details.age,
      value: formatAge(t, resident.estimated_age_years, resident.age_estimated_on),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="adopt" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-12">
        <Link
          href="/adopt"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          {t.adopt.backToAll}
        </Link>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <PhotoGallery residentName={resident.name} photoIds={photoIds} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {resident.ready_for_adoption && (
                <span className="w-fit rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
                  {t.adopt.availableForAdoption}
                </span>
              )}
              <h1 className="text-2xl font-semibold text-foreground">
                {resident.name}
              </h1>
            </div>

            {details.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="text-muted">{detail.label}</dt>
                    <dd className="text-foreground">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {resident.bio && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.about(resident.name)}
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  {resident.bio}
                </p>
              </div>
            )}

            {resident.temperament_notes && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.temperament}
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  {resident.temperament_notes}
                </p>
              </div>
            )}

            {resident.past_story_notes && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.theirStory}
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  {resident.past_story_notes}
                </p>
              </div>
            )}

            <div className="mt-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
              {t.adopt.interestedEmail(resident.name)}{" "}
              <a
                href="mailto:lannacareforanimals@gmail.com"
                className="text-primary underline hover:text-primary-hover"
              >
                lannacareforanimals@gmail.com
              </a>{" "}
              {t.adopt.emailCta}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
