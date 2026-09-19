"use client";

import Link from "next/link";
import { useState } from "react";
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
        <p className="text-sm text-muted">
          {selected.size > 0
            ? t.residents.list.selectedCount(selected.size)
            : t.residents.list.selectPrompt}
        </p>
        <div className="flex gap-2">
          <Link
            href={immunizationHref}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {selected.size > 0
              ? t.residents.list.logImmunizationsCount(selected.size)
              : t.residents.list.logImmunizations}
          </Link>
          <Link
            href={bookingHref}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {selected.size > 0
              ? t.residents.list.bookVetVisitCount(selected.size)
              : t.residents.list.bookVetVisit}
          </Link>
          <Link
            href="/residents/new"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.residents.list.newResident}
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="w-10 px-4 py-2" />
              <th className="px-4 py-2 font-medium">{t.residents.list.table.id}</th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.resident}
              </th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.enclosure}
              </th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.zone}
              </th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.status}
              </th>
              <th className="px-4 py-2 font-medium">
                {t.residents.list.table.location}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {residents.map((resident) => (
              <tr
                key={resident.resident_id}
                className="relative hover:bg-surface-hover"
              >
                <td className="relative z-10 px-4 py-2">
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
                    className="after:absolute after:inset-0 after:content-[''] hover:text-primary hover:underline"
                  >
                    {fullName(resident)}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">
                  {resident.enclosure_name ?? t.common.dash}
                </td>
                <td className="px-4 py-2 text-muted">
                  {resident.zone_name ?? t.common.dash}
                </td>
                <td className="px-4 py-2 text-muted">
                  {resident.current_status
                    ? statusLabel(t, resident.current_status)
                    : t.common.dash}
                </td>
                <td className="px-4 py-2 text-muted">
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
