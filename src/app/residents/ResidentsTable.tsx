"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawPrint, Pencil } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { CopyTagLink } from "@/components/CopyTagLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { statusLabel } from "@/lib/i18n/enum-labels";
import { residentPlace } from "@/lib/residents/place";
import { residentTagPath } from "@/lib/tags/links";

export type ResidentRow = {
  resident_id: string;
  name: string;
  resident_code: string;
  thai_name: string | null;
  other_names: string | null;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_id: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
  zone_internal: boolean | null;
};

function fullName(resident: Pick<ResidentRow, "name" | "thai_name">) {
  return resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
}

export function ResidentsTable({
  residents,
  tagOrigin,
}: {
  residents: ResidentRow[];
  /** Origin for each row's RFID-card link (src/lib/tags/origin.ts). */
  tagOrigin: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Whole-row click opens the resident. Clicks that land on the checkbox or
  // the name link itself are left alone so their own behaviour (toggle,
  // middle-click / cmd-click to open in a new tab) still works.
  function openResident(
    event: React.MouseEvent<HTMLTableRowElement>,
    residentId: string,
  ) {
    const target = event.target as HTMLElement;
    if (target.closest("a, input, button, label")) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    router.push(`/residents/${residentId}`);
  }

  function whereLabel(status: string | null) {
    const where = residentPlace(status);
    return where ? t.enclosures.hub[where] : t.common.dash;
  }

  const bookingHref =
    selected.size > 0
      ? `/vet-visits/new?residentIds=${[...selected].join(",")}`
      : "/vet-visits/new";
  const immunizationHref =
    selected.size > 0
      ? `/immunizations/new?residentIds=${[...selected].join(",")}`
      : "/immunizations/new";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm text-muted ${selected.size > 0 ? "" : "hidden md:block"}`}
        >
          {selected.size > 0
            ? t.residents.list.selectedCount(selected.size)
            : t.residents.list.selectPrompt}
        </p>
        <div className="ml-auto flex gap-2">
          <ActionLink
            href={immunizationHref}
            label={
              selected.size > 0
                ? t.residents.list.logImmunizationsCount(selected.size)
                : t.residents.list.logImmunizations
            }
            icon={SECTION_ICONS.immunizations}
          />
          <ActionLink
            href={bookingHref}
            label={
              selected.size > 0
                ? t.residents.list.bookVetVisitCount(selected.size)
                : t.residents.list.bookVetVisit
            }
            icon={SECTION_ICONS["vet-appointments"]}
          />
          <ActionLink
            href="/residents/new"
            label={t.residents.list.newResident}
            icon={PawPrint}
            variant="primary"
          />
        </div>
      </div>

      {/* Phones show only ID and name. The multi-select checkboxes and the
          enclosure/zone/status/location columns are desktop-only: on a phone
          several residents are picked from the forms themselves, and the
          enclosure browser at /enclosures covers the rest. */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="hidden w-10 px-4 py-2 md:table-cell" />
              <th className="px-4 py-2 font-medium">{t.residents.list.table.id}</th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.resident}
              </th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">
                {t.residents.list.table.enclosure}
              </th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">
                {t.residents.list.table.zone}
              </th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">
                {t.residents.list.table.status}
              </th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">
                {t.residents.list.table.location}
              </th>
              {/* Copy link (for the RFID card) and edit. The copy button
                  stays on phones: NFC cards are usually written from one. */}
              <th className="w-20 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {residents.map((resident) => (
              <tr
                key={resident.resident_id}
                onClick={(event) => openResident(event, resident.resident_id)}
                // Deceased rows only appear with "Show all" on, and are
                // dimmed so a list of mostly-living animals still reads at a
                // glance; the Status column names them outright.
                className={`cursor-pointer hover:bg-surface-hover ${
                  resident.current_status === "Deceased" ? "opacity-70" : ""
                }`}
              >
                <td className="hidden px-4 py-2 md:table-cell">
                  <input
                    type="checkbox"
                    checked={selected.has(resident.resident_id)}
                    onChange={() => toggle(resident.resident_id)}
                    className="h-4 w-4 accent-primary"
                    aria-label={t.residents.list.table.selectAriaLabel(
                      fullName(resident),
                    )}
                  />
                </td>
                <td className="px-4 py-2 text-muted">{resident.resident_code}</td>
                <td className="px-4 py-2 text-foreground">
                  <Link
                    href={`/residents/${resident.resident_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {fullName(resident)}
                  </Link>
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {placeName(locale, resident.enclosure_name, resident.enclosure_name_th) || t.common.dash}
                </td>
                {/* A resident in hospital or with a carer sits in the
                    Lifecycle pseudo-zone; that's the Status column's job,
                    so Zone stays blank rather than say "Lifecycle". */}
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.zone_name === SYSTEM_ZONE
                    ? t.common.dash
                    : placeName(locale, resident.zone_name, resident.zone_name_th) || t.common.dash}
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.current_status
                    ? statusLabel(t, resident.current_status)
                    : t.common.dash}
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {/* The place the On-site / Off-site filter uses, so the
                      two agree: Unassigned is on site, Hospital and Fostered
                      off it, Adopted and Deceased neither. */}
                  {whereLabel(resident.current_status)}
                </td>
                <td className="w-20 px-2 py-2 text-right whitespace-nowrap">
                  <CopyTagLink
                    path={residentTagPath(resident.resident_code)}
                    origin={tagOrigin}
                    name={fullName(resident)}
                  />
                  <Link
                    href={`/residents/${resident.resident_id}/edit`}
                    title={t.residents.list.table.editAriaLabel(fullName(resident))}
                    aria-label={t.residents.list.table.editAriaLabel(
                      fullName(resident),
                    )}
                    className="inline-flex rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {residents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  {t.residents.list.table.noMatches}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
