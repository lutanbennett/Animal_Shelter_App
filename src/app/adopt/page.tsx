import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { PublicHeader } from "./PublicHeader";

type PublicResident = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string | null;
  ready_for_adoption: boolean;
  bio: string | null;
  profile_photo_drive_file_id: string | null;
};

export default async function AdoptPage() {
  const supabase = await createClient();
  const { t } = await getT();

  const { data: residents, error } = await supabase
    .from("public_resident_profiles")
    .select(
      "id, name, species, breed, sex, ready_for_adoption, bio, profile_photo_drive_file_id",
    )
    .order("name")
    .returns<PublicResident[]>();

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="adopt" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.adopt.pageTitle}
          </h1>
          <p className="max-w-2xl text-sm text-muted">{t.adopt.pageSubtitle}</p>
        </div>

        {error && (
          <p className="text-sm text-danger">
            {t.adopt.couldntLoad}: {error.message}
          </p>
        )}

        {!error && (residents?.length ?? 0) === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
            {t.adopt.noneListed}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(residents ?? []).map((resident) => (
            <Link
              key={resident.id}
              href={`/adopt/${resident.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface hover:border-primary"
            >
              <div className="relative aspect-[4/3] w-full bg-background">
                {resident.profile_photo_drive_file_id ? (
                  <Image
                    src={driveImageUrl(resident.profile_photo_drive_file_id)}
                    alt={resident.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    {t.adopt.noPhoto}
                  </div>
                )}
                {resident.ready_for_adoption && (
                  <span className="absolute left-2 top-2 rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
                    {t.adopt.availableForAdoption}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
                  {resident.name}
                </h2>
                <p className="text-sm text-muted">
                  {[speciesLabel(t, resident.species), resident.breed]
                    .filter(Boolean)
                    .join(" · ") || t.adopt.detailsComingSoon}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
