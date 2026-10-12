import { formatDate, todayIso } from "@/lib/format";
import { localLabel } from "@/lib/translations/labels";
import { dietUnitLabel, sizeLabel } from "@/lib/i18n/enum-labels";
import { can } from "@/lib/permissions/can";
import { RecordRowActions } from "@/components/RecordRowActions";
import { endDietToday } from "@/app/diets/actions";
import { defaultDailyQuantity, formatQuantity } from "@/lib/diets/options";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";
import { Placeholder, RecordList } from "./shared";

export async function renderDietSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, isDeceased, perms, t, locale, supabase } = ctx;
  const { data, error } = await supabase
    .from("resident_diets")
    .select(
      "id, start_date, end_date, meals_per_day, daily_quantity, notes, diet_types:picker_diet_types(name, name_th, unit, daily_qty_small, daily_qty_medium, daily_qty_large)",
    )
    .eq("resident_id", id)
    .order("start_date", { ascending: false })
    .returns<
      {
        id: string;
        start_date: string;
        end_date: string | null;
        meals_per_day: number;
        daily_quantity: number | null;
        notes: string | null;
        diet_types: {
          name: string;
          name_th: string | null;
          unit: string;
          daily_qty_small: number;
          daily_qty_medium: number;
          daily_qty_large: number;
        } | null;
      }[]
    >();
  // Current = still running today (including one dated to start later);
  // past = its end date has passed. A closed record (deceased) has no
  // current diets whatever the dates say.
  const today = todayIso();
  const rows = data ?? [];
  const current = isDeceased
    ? []
    : rows.filter((row) => !row.end_date || row.end_date >= today);
  const past = rows.filter((row) => !current.includes(row));
  const renderDiet = (row: (typeof rows)[number], isCurrent: boolean) => {
    const type = row.diet_types;
    const unit = type ? dietUnitLabel(t, type.unit) : "";
    const quantity = type
      ? row.daily_quantity != null
        ? t.residents.sections.dailyQuantity(formatQuantity(row.daily_quantity), unit)
        : t.residents.sections.dailyQuantityDefault(
            formatQuantity(defaultDailyQuantity(type, resident.size)),
            unit,
            sizeLabel(t, resident.size ?? "Medium"),
          )
      : null;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">
              {(type ? localLabel(locale, type.name, type.name_th) : t.residents.sections.unknownDietType)}
            </span>
            <span className="text-xs text-muted">
              {[t.residents.sections.mealsPerDay(row.meals_per_day), quantity]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xs text-muted">
              {formatDate(row.start_date, locale)} –{" "}
              {row.end_date
                ? formatDate(row.end_date, locale)
                : t.residents.sections.ongoing}
            </span>
            {row.start_date > today && (
              <span className="text-xs text-primary">
                {t.residents.sections.startsOn(formatDate(row.start_date, locale))}
              </span>
            )}
          </div>
        </div>
        {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
        {!isDeceased && can(perms, "medical.diet") && (
          <RecordRowActions
            editHref={`/diets/${row.id}/edit`}
            subject={`${(type ? localLabel(locale, type.name, type.name_th) : t.residents.sections.unknownDietType)} · ${formatDate(row.start_date, locale)}`}
            endToday={
              isCurrent && row.start_date <= today
                ? endDietToday.bind(null, id, row.id)
                : null
            }
            labels={{ endToday: t.diets.endToday, ending: t.diets.ending }}
          />
        )}
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      {!isDeceased && (
        <div className="flex justify-end">
          <ActionLink
            href={`/diets/new?residentId=${id}`}
            label={t.residents.sections.addDiet}
            icon={SECTION_ICONS.diet}
            variant="primary"
            iconOnlyOnMobile={false}
          />
        </div>
      )}
      {error && <p className="text-sm text-danger">{error.message}</p>}
      {!resident.size && !isDeceased && (
        <p className="text-sm text-warning">{t.residents.hub.sizeNotSet}</p>
      )}
      {rows.length === 0 ? (
        <Placeholder>{t.residents.sections.empty.diet}</Placeholder>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">
              {t.residents.sections.currentDiets} ({current.length})
            </h2>
            <RecordList
              rows={current}
              empty={t.residents.sections.noCurrentDiets}
              render={(row) => renderDiet(row, true)}
            />
          </section>
          {past.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted">
                {t.residents.sections.pastDiets} ({past.length})
              </h2>
              <RecordList rows={past} empty="" render={(row) => renderDiet(row, false)} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
