import { formatDate, todayIso } from "@/lib/format";
import { dietUnitLabel, sizeLabel } from "@/lib/i18n/enum-labels";
import { can } from "@/lib/permissions/can";
import { RecordRowActions } from "@/components/RecordRowActions";
import { endDietToday } from "@/app/diets/actions";
import { formatQuantity } from "@/lib/diets/options";
import { withUnit } from "@/lib/unit-list";
import { lineAmount, loadDietOptions } from "@/lib/diets/recipes";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";
import { Placeholder, RecordList } from "./shared";

export async function renderDietSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, isDeceased, perms, t, locale, supabase } = ctx;
  const [{ data, error }, recipes] = await Promise.all([
    supabase
      .from("resident_diets")
      .select("id, diet_id, start_date, end_date, meals_per_day, portion_factor, notes")
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<
        {
          id: string;
          diet_id: string;
          start_date: string;
          end_date: string | null;
          meals_per_day: number;
          portion_factor: number | null;
          notes: string | null;
        }[]
      >(),
    loadDietOptions(supabase, locale),
  ]);
  const dietById = new Map((recipes.data ?? []).map((d) => [d.id, d]));
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
    const diet = dietById.get(row.diet_id);
    const name = diet?.name ?? t.residents.sections.unknownDietType;
    const factor = row.portion_factor != null && row.portion_factor !== 1 ? row.portion_factor : null;
    // What goes in the bowl: every ingredient at this resident's size, times the portion.
    const recipe = diet?.lines.map((line) => {
      const amount = lineAmount(line, resident.size) * (factor ?? 1);
      return `${withUnit(formatQuantity(amount), line.servingUnit ?? dietUnitLabel(t, line.unit))} ${line.ingredient}`;
    });
    const quantity = [
      recipe && recipe.length > 0 ? `${t.residents.sections.recipeFor(sizeLabel(t, resident.size ?? "Medium"))}: ${recipe.join(", ")}` : null,
      factor != null ? t.residents.sections.portion(formatQuantity(factor)) : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">
              {name}
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
            subject={`${name} · ${formatDate(row.start_date, locale)}`}
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
