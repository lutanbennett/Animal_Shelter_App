import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate, formatWeightDelta, formatWeightKg } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { ArchiveRecordControl } from "@/components/ArchiveRecordControl";
import { WeightChart } from "@/components/WeightChart";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS, SECTION_ICONS } from "@/components/hub-icons";
import { RowActionLink } from "@/components/RowAction";
import type { SectionContext } from "./types";
import { RecordList } from "./shared";

export async function renderWeightSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, isDeceased, perms, t, locale, supabase, showArchived, canArchive, archivedCount, archivedToggle, archivedList } = ctx;
  const { data, error } = await supabase
    .from("weight")
    .select("id, date, weight_kg, notes, clinic_visits(appointment_date)")
    .is("archived_at", null)
    .eq("resident_id", id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        date: string;
        weight_kg: number;
        notes: string | null;
        clinic_visits: { appointment_date: string } | null;
      }[]
    >();
  const rows = data ?? [];
  const weightCount = await archivedCount("weight");
  const { data: archivedWeights } = showArchived
    ? await supabase
        .from("weight")
        .select("id, date, weight_kg, notes, archive_reason, clinic_visits(appointment_date)")
        .not("archived_at", "is", null)
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            weight_kg: number;
            notes: string | null;
            archive_reason: string | null;
            clinic_visits: { appointment_date: string } | null;
          }[]
        >()
    : { data: [] };
  // Newest first, so the trend reads latest vs the one before it and
  // vs the very first reading on file.
  const latest = rows[0];
  const previous = rows[1];
  const first = rows.length > 1 ? rows[rows.length - 1] : undefined;
  const deltaTile = (
    label: string,
    from: { date: string; weight_kg: number } | undefined,
  ) => {
    if (!latest || !from) return null;
    const delta = latest.weight_kg - from.weight_kg;
    const percent = (delta / from.weight_kg) * 100;
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted">{label}</span>
        <span className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          {formatWeightDelta(delta, locale)}
        </span>
        <span className="text-xs text-muted">
          {t.weight.stats.percentSince(
            `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent).toFixed(1)}`,
            formatDate(from.date, locale),
          )}
        </span>
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      {!isDeceased && (
        <div className="flex justify-end">
          <ActionLink
            href={`/weight/new?residentId=${id}`}
            label={t.residents.sections.logWeight}
            icon={SECTION_ICONS.weight}
            variant="primary"
            iconOnlyOnMobile={false}
          />
        </div>
      )}
      {error && <p className="text-sm text-danger">{error.message}</p>}
      {latest && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">{t.weight.stats.latest}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatWeightKg(latest.weight_kg, locale)}
              </span>
              <span className="text-xs text-muted">
                {formatDate(latest.date, locale)}
              </span>
            </div>
            {deltaTile(t.weight.stats.sincePrevious, previous)}
            {deltaTile(t.weight.stats.sinceFirst, first)}
          </div>
          <WeightChart
            points={rows.map((row) => ({
              id: row.id,
              date: row.date,
              weightKg: row.weight_kg,
            }))}
          />
        </div>
      )}
      <RecordList
        rows={rows}
        empty={t.residents.sections.empty.weight}
        render={(row) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {formatWeightKg(row.weight_kg, locale)}
              </span>
              <span className="text-right text-xs text-muted">
                {formatDate(row.date, locale)}
                {row.clinic_visits &&
                  ` · ${t.residents.sections.linkedVisit(
                    formatDate(row.clinic_visits.appointment_date, locale),
                  )}`}
              </span>
            </div>
            {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
            {(!isDeceased || canArchive("weight")) && (
              <div className="flex items-start justify-end gap-3">
                {!isDeceased && can(perms, "medical.weight") && (
                  <RowActionLink
                    href={`/weight/${row.id}/edit`}
                    label={t.common.edit}
                    subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
                    icon={ACTION_ICONS.edit}
                  />
                )}
                {canArchive("weight") && (
                  <ArchiveRecordControl
                    kind="weight"
                    residentId={id}
                    id={row.id}
                    archived={false}
                    subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
                  />
                )}
              </div>
            )}
          </div>
        )}
      />
      {archivedToggle(weightCount)}
      {archivedList(archivedWeights ?? [], (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{formatWeightKg(row.weight_kg, locale)}</span>
            <span className="text-right text-xs text-muted">
              {formatDate(row.date, locale)}
              {row.clinic_visits &&
                ` · ${t.residents.sections.linkedVisit(
                  formatDate(row.clinic_visits.appointment_date, locale),
                )}`}
            </span>
          </div>
          {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
          {canArchive("weight") && (
            <div className="flex justify-end">
              <ArchiveRecordControl
                kind="weight"
                residentId={id}
                id={row.id}
                archived
                subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
