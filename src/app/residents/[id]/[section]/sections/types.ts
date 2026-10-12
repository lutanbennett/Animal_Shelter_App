import type { createClient } from "@/lib/supabase/server";
import type { getT } from "@/lib/i18n/get-t";
import type { loadPermissions } from "@/lib/permissions/load";
import type { MedicalArchiveKind } from "@/lib/medical-archive/kinds";

/**
 * What the page has loaded once and hands to whichever section renderer it picks: the resident, their
 * state, the logged-in permissions, the dictionary, and the archive helpers. A renderer loads its own
 * section's rows and nothing else; the permission guard stays in page.tsx.
 */
export type SectionContext = {
  id: string;
  resident: {
    id: string;
    name: string;
    thai_name: string | null;
    size: string | null;
    profile_photo_drive_file_id: string | null;
    microchip_number: string | null;
    microchip_implanted_on: string | null;
  };
  residentState: { current_status: string | null; is_deceased: boolean } | undefined;
  isDeceased: boolean;
  perms: Awaited<ReturnType<typeof loadPermissions>>;
  t: Awaited<ReturnType<typeof getT>>["t"];
  locale: Awaited<ReturnType<typeof getT>>["locale"];
  supabase: Awaited<ReturnType<typeof createClient>>;
  showArchived: boolean;
  photoSelect: string;
  contactEmbed: (withArchive?: boolean) => string;
  canArchive: (kind: MedicalArchiveKind) => boolean;
  archivedCount: (
    table: "weight" | "prescriptions" | "clinic_visits" | "immunization_records",
  ) => Promise<number>;
  archivedToggle: (count: number) => React.ReactNode;
  archivedList: <T extends { id: string; archive_reason: string | null }>(
    rows: T[],
    render: (row: T) => React.ReactNode,
  ) => React.ReactNode;
};
