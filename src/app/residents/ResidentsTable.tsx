"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawPrint } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { statusLabel } from "@/lib/i18n/enum-labels";

export type ResidentRow = {
  resident_id: string;
  name: string;
  animal_code: string;
  thai_name: string | null;
  other_names: string | null;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
  zone_internal: boolean | null;
};

function fullName(resident: Pick<ResidentRow, "name" | "thai_name">) {
  return resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
}

export function ResidentsTable({ residents }: { residents: ResidentRow[] }) {
  const { t } = useI18n();
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {residents.map((resident) => (
              <tr
                key={resident.resident_id}
                onClick={(event) => openResident(event, resident.resident_id)}
                className="cursor-pointer hover:bg-surface-hover"
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
                <td className="px-4 py-2 text-muted">{resident.animal_code}</td>
                <td className="px-4 py-2 text-foreground">
                  <Link
                    href={`/residents/${resident.resident_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {fullName(resident)}
                  </Link>
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.enclosure_name ?? t.common.dash}
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.zone_name ?? t.common.dash}
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.current_status
                    ? statusLabel(t, resident.current_status)
                    : t.common.dash}
                </td>
                <td className="hidden px-4 py-2 text-muted md:table-cell">
                  {resident.zone_internal === null
                    ? t.common.dash
                    : resident.zone_internal
                      ? t.admin.zones.table.internal
                      : t.admin.zones.table.external}
                </td>
              </tr>
            ))}
            {residents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
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
