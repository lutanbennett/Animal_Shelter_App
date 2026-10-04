import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import { refuse } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";
import { loadOneResident, loadPickableResidents } from "@/lib/medical/residents";
import { ResidentPicker } from "../ResidentPicker";
import { MedicalPhotoUploader } from "./MedicalPhotoUploader";

/**
 * Add Medical Photos, a job of the Head of Medical (docs/decisions/2026-10-04-medical-jobs-app.md).
 *
 * The resident is read through `resident_who_and_where` for the picker and the header (the same
 * view the weight page uses); the upload goes to its own route, /api/medical/residents/[id]/photos,
 * which reads `medical_photo_residents` and files in the Medical folder only. She can add photos
 * but not look at them again (`attachments` is not hers), and the page says so rather than
 * implying a gallery.
 */
export default async function AddMedicalPhotosPage(props: PageProps<"/medical/photos">) {
  const { perms } = await requirePermission("photos.resident_add");
  if (perms.scopes.clinical !== "any") refuse(perms.role.key);
  const { t, locale } = await getT();
  const p = t.medicalJobs.photos;
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const residentId = one(sp.resident);
  const q = one(sp.q);

  const supabase = await createClient();
  const shell = (children: React.ReactNode) => (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
      {children}
    </main>
  );

  if (residentId) {
    const { resident, error } = await loadOneResident(supabase, residentId);
    const back = (
      <Link href="/medical/photos" className="text-base font-medium text-primary hover:underline">
        {p.back}
      </Link>
    );
    if (error || !resident) {
      return shell(
        <>
          <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-foreground">
            {error ?? p.notFound}
          </p>
          {back}
        </>,
      );
    }
    if (resident.status === "Deceased") {
      return shell(
        <>
          <p className="rounded-lg border border-border bg-surface p-4 text-foreground">{p.closed}</p>
          {back}
        </>,
      );
    }
    const name = locale === "th" && resident.thaiName?.trim() ? resident.thaiName.trim() : resident.name;
    return shell(
      <>
        <div className="flex items-center gap-3">
          <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {resident.photoFileId ? (
              <Image
                src={driveImageUrl(resident.photoFileId, 400)}
                alt={t.medicalJobs.picker.photoAlt(name)}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <PawPrint aria-label={t.medicalJobs.picker.noPhoto} role="img" className="h-10 w-10 text-muted" />
            )}
          </span>
          <div className="min-w-0">
            <p className="break-words text-2xl font-semibold text-foreground">{name}</p>
            {resident.enclosure && (
              <p className="break-words text-base text-muted">
                {placeName(locale, resident.enclosure.name, resident.enclosure.nameTh)}
              </p>
            )}
          </div>
        </div>
        <MedicalPhotoUploader residentId={residentId} />
        <p className="text-sm text-muted">{p.goesIn}</p>
        <p className="text-sm text-muted">{p.noView}</p>
        {back}
      </>,
    );
  }

  const { residents, error } = await loadPickableResidents(supabase);
  return shell(
    <>
      <p className="text-base text-muted">{p.pickIntro}</p>
      <ResidentPicker t={t} locale={locale} base="/medical/photos" residents={residents} query={q} error={error} />
    </>,
  );
}
