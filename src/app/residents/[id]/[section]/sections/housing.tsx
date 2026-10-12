import { formatDate } from "@/lib/format";
import { placeName } from "@/lib/enclosures/names";
import { placementTypeLabel } from "@/lib/i18n/enum-labels";
import { ActionLink } from "@/components/ActionLink";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { PLACEMENT_ACTION_PATHS, availablePlacementActions } from "@/lib/placements/available";
import type { SectionContext } from "./types";
import { RecordList } from "./shared";

export async function renderHousingSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, residentState, isDeceased, t, locale, supabase, contactEmbed } = ctx;
  // placement_history has two FKs to enclosures (enclosure_id and
  // previous_enclosure_id), so each embed has to name its FK or
  // PostgREST rejects the whole query as ambiguous.
  const { data, error } = await supabase
    .from("placement_history")
    .select(
      `id, placement_type, start_date, end_date, notes, cause_of_death, enclosure:enclosures!enclosure_id(name, name_th), previous_enclosure:enclosures!previous_enclosure_id(name, name_th), carer:${contactEmbed(true)}`,
    )
    .eq("resident_id", id)
    .order("start_date", { ascending: false })
    .returns<
      {
        id: string;
        placement_type: string;
        start_date: string;
        end_date: string | null;
        notes: string | null;
        cause_of_death: string | null;
        enclosure: { name: string; name_th: string | null } | null;
        previous_enclosure: { name: string; name_th: string | null } | null;
        // An archived carer is still named — this is their history —
        // with the badge, so nobody tries to place a new animal there.
        carer: {
          name: string;
          archived_at: string | null;
          archive_reason: string | null;
        } | null;
      }[]
    >();
  // Which placement actions apply depends on the lifecycle status — see
  // availablePlacementActions() for the table. The last one is primary.
  // A deceased resident has none, which is also how the read-only rule
  // shows up here.
  const actions = availablePlacementActions(
    isDeceased ? "Deceased" : residentState?.current_status,
  );
  return (
    <div className="flex flex-col gap-4">
      {actions.length > 0 && (
        <div className="flex justify-end gap-2">
          {actions.map((key, index) => (
            <ActionLink
              key={key}
              href={`/residents/${id}${PLACEMENT_ACTION_PATHS[key]}`}
              label={t.residents.hub.placementActions[key]}
              icon={PLACEMENT_ICONS[key]}
              variant={index === actions.length - 1 ? "primary" : "secondary"}
            />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-danger">{error.message}</p>
      )}
      <RecordList
        rows={data ?? []}
        empty={t.residents.sections.empty.housing}
        render={(row) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {placementTypeLabel(t, row.placement_type)}
              </span>
              <span className="text-xs text-muted">
                {formatDate(row.start_date, locale)} –{" "}
                {row.end_date
                  ? formatDate(row.end_date, locale)
                  : t.residents.sections.present}
              </span>
            </div>
            {row.enclosure?.name && (
              <span className="flex flex-wrap items-center gap-x-1 text-xs text-muted">
                {[
                  row.previous_enclosure?.name
                    ? `${placeName(locale, row.previous_enclosure.name, row.previous_enclosure.name_th)} → ${placeName(locale, row.enclosure.name, row.enclosure.name_th)}`
                    : placeName(locale, row.enclosure.name, row.enclosure.name_th),
                  row.carer?.name && (row.placement_type === "Adopt" ? t.residents.hub.adopter(row.carer.name) : t.residents.hub.carer(row.carer.name)),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {row.carer?.archived_at && (
                  <ArchivedBadge
                    label={t.contacts.archive.badge}
                    title={
                      row.carer.archive_reason
                        ? t.contacts.archive.reason(row.carer.archive_reason)
                        : undefined
                    }
                  />
                )}
              </span>
            )}
            {row.cause_of_death && (
              <span className="text-xs text-muted">
                {t.residents.deceased.banner.cause(row.cause_of_death)}
              </span>
            )}
            {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
          </div>
        )}
      />
    </div>
  );
}
