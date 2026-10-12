import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { contactNameEmbed } from "@/lib/contacts/visibility";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import type { LevelKey } from "@/lib/permissions/catalogue";
import { requireFullResident } from "@/lib/residents/who-and-where";
import { residentPhotoSelect } from "@/lib/adoption-updates/options";
import { type MedicalArchiveKind } from "@/lib/medical-archive/kinds";
import { ShowArchivedToggle } from "@/components/ShowArchivedToggle";
import { MicrochipLine } from "@/components/MicrochipForm";
import { SECTION_ICONS, type HubSection } from "@/components/hub-icons";
import { RecordList } from "./sections/shared";
import type { SectionContext } from "./sections/types";
import { renderHousingSection } from "./sections/housing";
import { renderPhotosSection } from "./sections/photos";
import { renderAdoptionUpdatesSection } from "./sections/adoption-updates";
import { renderImmunizationsSection } from "./sections/immunizations";
import { renderClinicVisitsSection } from "./sections/clinic-visits";
import { renderPrescriptionsSection } from "./sections/prescriptions";
import { renderDietSection } from "./sections/diet";
import { renderWeightSection } from "./sections/weight";
import { renderProceduresSection } from "./sections/procedures";
import { renderBloodTestsSection } from "./sections/blood-tests";

/** Each tab's renderer, in sections/. They share the context built below; the guard stays in this file. */
const RENDERERS: Record<string, (ctx: SectionContext) => Promise<React.ReactNode>> = {
  housing: renderHousingSection,
  photos: renderPhotosSection,
  "adoption-updates": renderAdoptionUpdatesSection,
  immunizations: renderImmunizationsSection,
  "clinic-visits": renderClinicVisitsSection,
  prescriptions: renderPrescriptionsSection,
  diet: renderDietSection,
  weight: renderWeightSection,
  procedures: renderProceduresSection,
  "blood-tests": renderBloodTestsSection,
};

/**
 * The activity each tab of the record is read under. Housing, photos and adoption updates are the
 * resident's own record (resident.record); the medical tabs each have their cell, so a login with no
 * read of that part is refused, not shown an empty list.
 */
const SECTION_READS: Partial<Record<string, LevelKey>> = {
  immunizations: "medical.immunizations",
  "clinic-visits": "medical.visits",
  prescriptions: "medical.prescriptions",
  diet: "medical.diet",
  weight: "medical.weight",
  procedures: "medical.procedures",
  "blood-tests": "medical.blood_tests",
};

export default async function ResidentSectionPage(
  props: PageProps<"/residents/[id]/[section]">,
) {
  const { id, section } = await props.params;
  const { t, locale } = await getT();
  const title = (
    t.residents.sections.titles as Record<string, string | undefined>
  )[section];
  if (!title) notFound();
  await requireFullResident(SECTION_READS[section]);
  const SectionIcon = SECTION_ICONS[section as HubSection];

  const supabase = await createClient();

  const [residentResult, residentStateResult, perms] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, size, profile_photo_drive_file_id, microchip_number, microchip_implanted_on")
      .eq("id", id)
      .limit(1)
      .returns<
        {
          id: string;
          name: string;
          thai_name: string | null;
          size: string | null;
          profile_photo_drive_file_id: string | null;
          microchip_number: string | null;
          microchip_implanted_on: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("current_status, is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
    loadPermissions(),
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  // A deceased resident's record is read-only — in the database too
  // (migration 0026), so every "add a record" control below is dropped
  // rather than left to fail against a trigger.
  const residentState = residentStateResult.data?.[0];
  const isDeceased = residentState?.is_deceased ?? false;

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  // Archive (0124): a second list of archived rows behind ?archived=1, as on
  // contacts. The live queries below already skip archived rows; this only
  // adds the way to see and restore them. Who gets the button is
  // medical.archive: admin, management and staff, never a doctor or
  // volunteer, and nobody on a deceased resident.
  const showArchived = (await props.searchParams).archived === "1";
  // A doctor or volunteer reads a carer or sender name through a narrow view (0126): the contacts scope says which.
  const photoSelect = residentPhotoSelect(perms);
  const contactEmbed = (withArchive = false) => contactNameEmbed(perms, withArchive);
  const canArchive = (kind: MedicalArchiveKind) => !isDeceased && can(perms, "medical.archive");
  const archivedCount = async (
    table: "weight" | "prescriptions" | "clinic_visits" | "immunization_records",
  ) =>
    (
      await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("resident_id", id)
        .not("archived_at", "is", null)
    ).count ?? 0;
  const ra = t.recordArchive;
  const archivedToggle = (count: number) => (
    <ShowArchivedToggle
      count={count}
      shown={showArchived}
      href={`/residents/${id}/${section}${showArchived ? "" : "?archived=1"}`}
      labels={{ hidden: ra.archivedHidden, show: ra.showArchived, hide: ra.hideArchived }}
    />
  );
  const archivedList = <T extends { id: string; archive_reason: string | null }>(
    rows: T[],
    render: (row: T) => React.ReactNode,
  ) =>
    showArchived &&
    rows.length > 0 && (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">{ra.archivedHeading(rows.length)}</h2>
        <RecordList
          rows={rows}
          empty=""
          render={(row) => (
            <div className="flex flex-col gap-1 opacity-80">
              {render(row)}
              {row.archive_reason && (
                <span className="text-xs text-muted">{ra.reason(row.archive_reason)}</span>
              )}
            </div>
          )}
        />
      </section>
    );


  const ctx: SectionContext = {
    id,
    resident,
    residentState,
    isDeceased,
    perms,
    t,
    locale,
    supabase,
    showArchived,
    photoSelect,
    contactEmbed,
    canArchive,
    archivedCount,
    archivedToggle,
    archivedList,
  };
  const body = await RENDERERS[section]?.(ctx);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
        {SectionIcon && (
          <SectionIcon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
        )}
        {title}
      </h1>
      {/* The clinic-visit and procedure views are where a doctor reads a chip
          against a scanner, or finds it missing and records it (0116). */}
      {(section === "clinic-visits" || section === "procedures") && (
        <MicrochipLine
          residentId={id}
          number={resident.microchip_number}
          implantedOn={resident.microchip_implanted_on}
          canEdit={!isDeceased && can(perms, "resident.microchip")}
        />
      )}
      {body}
    </main>
  );
}
