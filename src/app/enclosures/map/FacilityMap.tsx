"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { occupancyLevel, type OccupancyLevel } from "@/lib/enclosures/occupancy";
import { bounds, centroid, planHeight, pointsAttr } from "@/lib/facility-map/geometry";
import type { FacilityMapData, MapPlan } from "@/lib/facility-map/types";
import { OccupancyIndicator } from "../OccupancyIndicator";
import { PanZoom } from "./PanZoom";

/**
 * The read-only facility map on /enclosures (step 2 of 3, docs/facility-map-scope.md): a hand-drawn
 * plan with a polygon laid over each place, overview → zone → enclosure. It takes plain data, not
 * the page, so it can move under Shelter Operations with the Enclosures page if that is decided.
 *
 * Colour is how full a place is (the list's own thresholds); the count on each enclosure and the
 * words in the card say the same, so colour is never the only signal. A tap selects; the card's
 * Open button is what navigates, so a fat finger never leaves the map by accident.
 */

// Static class names, so Tailwind sees them.
const TONE_SHAPE: Record<OccupancyLevel, string> = {
  ok: "fill-success/20 stroke-success",
  near: "fill-primary/25 stroke-primary",
  full: "fill-primary/25 stroke-primary",
  over: "fill-danger/25 stroke-danger",
  unknown: "fill-neutral-400/20 stroke-neutral-500",
};
const TONE_SHAPE_ON: Record<OccupancyLevel, string> = {
  ok: "fill-success/45 stroke-success",
  near: "fill-primary/50 stroke-primary",
  full: "fill-primary/50 stroke-primary",
  over: "fill-danger/50 stroke-danger",
  unknown: "fill-neutral-400/45 stroke-neutral-600",
};
const TONE_SWATCH: Record<OccupancyLevel, string> = {
  ok: "bg-success",
  near: "bg-primary",
  full: "bg-primary",
  over: "bg-danger",
  unknown: "bg-neutral-400",
};

// A room is deliberately not an occupancy colour: it holds no one, so it must not read as "empty" or "full".
const ROOM_SHAPE = "fill-sky-500/20 stroke-sky-700";
const ROOM_SHAPE_ON = "fill-sky-500/45 stroke-sky-800";

type Item = {
  kind: "zone" | "enclosure" | "room";
  id: string;
  name: string;
  shape: NonNullable<FacilityMapData["enclosures"][number]["shape"]>;
  level: OccupancyLevel;
  count: number;
  capacity: number | null;
  jobs: number;
  diet: number;
  meds: number;
};

export function FacilityMap({ data }: { data: FacilityMapData }) {
  const { t, locale } = useI18n();
  const m = t.enclosures.map;

  const planOf = useMemo(() => new Map(data.plans.filter((p) => p.zone_id).map((p) => [p.zone_id!, p])), [data.plans]);
  const overview = data.plans.find((p) => p.kind === "overview") ?? null;
  const zoneById = useMemo(() => new Map(data.zones.map((z) => [z.id, z])), [data.zones]);
  // Zone plans in the zones' own (alphabetical) order, whatever order the rows came back in.
  const zonePlans = data.zones.map((z) => planOf.get(z.id)).filter((p): p is MapPlan => Boolean(p));

  const [planId, setPlanId] = useState<string>((overview ?? zonePlans[0] ?? data.plans[0]).id);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const plan = data.plans.find((p) => p.id === planId) ?? data.plans[0];
  const zone = plan.zone_id ? (zoneById.get(plan.zone_id) ?? null) : null;

  const zoneName = (id: string) => {
    const z = zoneById.get(id);
    return z ? placeName(locale, z.name, z.name_th) : t.common.dash;
  };

  // What is drawn on this plan, and what could be but is not placed yet.
  const { items, unplaced } = useMemo(() => {
    if (plan.kind === "overview") {
      const placed: Item[] = [];
      const rest: typeof data.zones = [];
      for (const z of data.zones) {
        if (z.enclosure_count === 0 && !planOf.has(z.id)) continue; // nothing to find there
        if (!z.shape) rest.push(z);
        else
          placed.push({
            kind: "zone",
            id: z.id,
            name: placeName(locale, z.name, z.name_th),
            shape: z.shape,
            level: occupancyLevel(z.resident_count, z.capacity),
            count: z.resident_count,
            capacity: z.capacity,
            jobs: 0,
            diet: 0,
            meds: 0,
          });
      }
      return { items: placed, unplaced: { zones: rest, enclosures: [] as FacilityMapData["enclosures"] } };
    }
    const placed: Item[] = [];
    const rest: FacilityMapData["enclosures"] = [];
    for (const e of data.enclosures) {
      if (e.zone_id !== plan.zone_id) continue;
      if (!e.shape) rest.push(e);
      else
        placed.push({
          kind: "enclosure",
          id: e.id,
          name: placeName(locale, e.name, e.name_th),
          shape: e.shape,
          level: occupancyLevel(e.resident_count, e.capacity),
          count: e.resident_count,
          capacity: e.capacity,
          jobs: e.open_jobs,
          diet: e.special_diet_count,
          meds: e.medication_count,
        });
    }
    rest.sort((a, b) => a.name.localeCompare(b.name));
    return { items: placed, unplaced: { zones: [] as typeof data.zones, enclosures: rest } };
  }, [data, plan, planOf, locale]);

  // The rooms drawn on this plan (Medical room, Kitchen, Storage). They are not enclosures: no count, no
  // capacity, and nothing for a tap to open, so they are their own kind of item rather than a flavour of one.
  const roomItems: Item[] = useMemo(
    () =>
      data.rooms
        .filter((r) => r.map_id === plan.id)
        .map((r) => ({ kind: "room" as const, id: r.id, name: m.roomKinds[r.kind], shape: r.shape, level: "unknown" as const, count: 0, capacity: null, jobs: 0, diet: 0, meds: 0 })),
    [data.rooms, plan.id, m.roomKinds],
  );
  const drawn = [...items, ...roomItems];

  const picked = drawn.find((i) => i.id === pickedId) ?? null;

  function goTo(next: MapPlan) {
    setPlanId(next.id);
    setPickedId(null);
  }

  const planTitle = plan.kind === "overview" ? m.overview : zone ? placeName(locale, zone.name, zone.name_th) : t.common.dash;
  const unplacedCount = unplaced.zones.length + unplaced.enclosures.length;

  return (
    <div className="flex flex-col gap-4">
      {/* The plans, as the way up and down: the overview, then a zone's own. */}
      <nav aria-label={m.plans} className="flex flex-wrap gap-2">
        {[...(overview ? [overview] : []), ...zonePlans].map((p) => {
          const active = p.id === plan.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => goTo(p)}
              className={`min-h-11 rounded-lg border px-3 text-sm font-medium ${
                active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {p.kind === "overview" ? m.overview : zoneName(p.zone_id!)}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{planTitle}</h2>
        <p className="text-sm text-muted">{drawn.length > 0 ? m.hint : plan.kind === "overview" ? m.emptyOverview : m.emptyZone(planTitle)}</p>
      </div>

      <PanZoom key={plan.id} aspect={plan.width / plan.height} controlLabels={{ zoomIn: m.zoomIn, zoomOut: m.zoomOut, fit: m.fit }}>
        {/* The drawing is a plain <img>, the shapes an inline SVG: no server-side image work. */}
        <img src={plan.image_url} alt={m.planAlt(planTitle)} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
        <svg viewBox={`0 0 100 ${planHeight(plan.width, plan.height)}`} className="absolute inset-0 h-full w-full" role="group" aria-label={planTitle}>
          {drawn.map((item) => (
            <MapShape
              key={item.id}
              item={item}
              plan={plan}
              // A plan that is one enclosure (the Cat Zone) has nothing to tell apart: the card says it all.
              showChip={items.length > 1}
              selected={item.id === pickedId}
              onPick={() => setPickedId(item.id)}
              ariaLabel={
                item.kind === "room"
                  ? m.roomAria(item.name)
                  : item.kind === "zone"
                  ? m.zoneAria(item.name, item.count)
                  : m.enclosureAria(item.name, item.count, item.capacity, item.level === "unknown" ? m.noCapacity : t.enclosures.levels[item.level])
              }
            />
          ))}
        </svg>
      </PanZoom>

      <Legend />

      {picked && <PickedCard item={picked} plan={plan} planOf={planOf} onOpenPlan={goTo} onClose={() => setPickedId(null)} />}

      {unplacedCount > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{m.unplacedHeading(unplacedCount)}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.zones.map((z) => {
              const target = planOf.get(z.id);
              const label = placeName(locale, z.name, z.name_th);
              const body = (
                <>
                  <span className="min-w-0 break-words font-medium text-foreground">{label}</span>
                  <span className="shrink-0 text-xs text-muted">{t.enclosures.enclosuresCount(z.enclosure_count)}</span>
                </>
              );
              const cls = "flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-hover";
              return (
                <li key={z.id}>
                  {target ? (
                    <button type="button" onClick={() => goTo(target)} className={`${cls} w-full text-left`}>
                      {body}
                    </button>
                  ) : (
                    <Link href={`/enclosures?zone=${z.id}`} className={cls}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
            {unplaced.enclosures.map((e) => (
              <li key={e.id}>
                <Link href={`/enclosures/${e.id}`} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-hover">
                  <span className="min-w-0 break-words font-medium text-foreground">{placeName(locale, e.name, e.name_th)}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {e.capacity ? t.enclosures.occupancy(e.resident_count, e.capacity) : t.enclosures.residentsCount(e.resident_count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * One place on the plan. Two polygons: the visible one, and over it a transparent one with a wide
 * stroke that nobody sees but a thumb hits — a 55 px kennel left no slack for a fat finger in the
 * prototype. Both strokes are `non-scaling`, so the outline stays crisp at any zoom.
 */
function MapShape({
  item,
  plan,
  selected,
  onPick,
  ariaLabel,
  showChip,
}: {
  showChip: boolean;
  item: Item;
  plan: MapPlan;
  selected: boolean;
  onPick: () => void;
  ariaLabel: string;
}) {
  const k = plan.height / plan.width;
  const pts = pointsAttr(item.shape, plan.width, plan.height);
  const b = bounds(item.shape);
  const [cx, cy] = centroid(item.shape);
  const isRoom = item.kind === "room";
  const isZone = item.kind === "zone" || isRoom; // a room is labelled in its middle, like a zone
  const chip = item.capacity ? `${item.count}/${item.capacity}` : String(item.count);
  const chipW = 1.4 + chip.length * 1.45;
  const chipX = b.minX + 0.5;
  const chipY = b.minY * k + 0.5;

  return (
    <g
      // A room opens nothing, so it is a button that selects, not a link.
      role={isRoom ? "button" : "link"}
      tabIndex={0}
      aria-label={ariaLabel}
      aria-current={selected ? "true" : undefined}
      className="cursor-pointer outline-none [&:focus-visible>polygon:first-child]:stroke-[5]"
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
    >
      <polygon
        points={pts}
        strokeWidth={selected ? 4 : 2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray={isRoom ? "5 3" : undefined}
        className={isRoom ? (selected ? ROOM_SHAPE_ON : ROOM_SHAPE) : selected ? TONE_SHAPE_ON[item.level] : TONE_SHAPE[item.level]}
      />
      {/* the hit area */}
      <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={22} strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ pointerEvents: "all" }} />
      {isZone ? (
        <text
          x={cx}
          y={cy * k}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={3.2}
          fontWeight={700}
          className="pointer-events-none fill-neutral-900"
          stroke="white"
          strokeWidth={0.9}
          paintOrder="stroke"
        >
          {item.name}
        </text>
      ) : showChip ? (
        <g className="pointer-events-none">
          <rect x={chipX} y={chipY} width={chipW} height={3.5} rx={0.9} className="fill-white stroke-neutral-700" strokeWidth={0.15} />
          <text x={chipX + chipW / 2} y={chipY + 1.8} textAnchor="middle" dominantBaseline="middle" fontSize={2.4} fontWeight={700} className="fill-neutral-900">
            {chip}
          </text>
          {[
            [item.jobs, ENCLOSURE_ICONS.maintenance],
            [item.diet, ENCLOSURE_ICONS.specialDiet],
            [item.meds, ENCLOSURE_ICONS.medication],
          ]
            .filter(([n]) => (n as number) > 0)
            .map(([, Icon], i) => {
              const MarkIcon = Icon as typeof ENCLOSURE_ICONS.medication;
              return <MarkIcon key={i} x={chipX + chipW + 0.4 + i * 3.4} y={chipY + 0.2} width={3} height={3} className="text-neutral-900" strokeWidth={2.4} />;
            })}
        </g>
      ) : null}
    </g>
  );
}

function Legend() {
  const { t } = useI18n();
  // Capacity is mandatory on an enclosure, so "no capacity" is not worth a legend entry.
  const levels: OccupancyLevel[] = ["ok", "near", "over"];
  const words: Record<OccupancyLevel, string> = {
    ok: t.enclosures.levels.ok,
    near: `${t.enclosures.levels.near} / ${t.enclosures.levels.full}`,
    full: t.enclosures.levels.full,
    over: t.enclosures.levels.over,
    unknown: t.enclosures.noCapacity,
  };
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {levels.map((level) => (
        <li key={level} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${TONE_SWATCH[level]}`} />
          {words[level]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <ENCLOSURE_ICONS.maintenance aria-hidden="true" className="h-3.5 w-3.5" />
        {t.enclosures.hasOpenMaintenance}
      </li>
      <li className="flex items-center gap-1.5">
        <ENCLOSURE_ICONS.specialDiet aria-hidden="true" className="h-3.5 w-3.5" />
        {t.enclosures.specialDietLabel}
      </li>
      <li className="flex items-center gap-1.5">
        <ENCLOSURE_ICONS.medication aria-hidden="true" className="h-3.5 w-3.5" />
        {t.enclosures.map.medicationLabel}
      </li>
    </ul>
  );
}

function PickedCard({
  item,
  plan,
  planOf,
  onOpenPlan,
  onClose,
}: {
  item: Item;
  plan: MapPlan;
  planOf: Map<string, MapPlan>;
  onOpenPlan: (plan: MapPlan) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const m = t.enclosures.map;
  const zonePlan = item.kind === "zone" ? planOf.get(item.id) : undefined;
  const button = "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover";
  return (
    <section aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4" data-plan={plan.id}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-base font-semibold text-foreground">{item.name}</h3>
        <button type="button" onClick={onClose} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-sm text-muted hover:text-foreground" aria-label={m.close}>
          ✕
        </button>
      </div>
      {item.kind === "room" ? <p className="text-sm text-muted">{m.roomNote}</p> : <OccupancyIndicator count={item.count} capacity={item.capacity} />}
      {item.kind === "enclosure" && (item.jobs > 0 || item.diet > 0 || item.meds > 0) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
          {item.jobs > 0 && (
            <span className="flex items-center gap-1.5">
              <ENCLOSURE_ICONS.maintenance aria-hidden="true" className="h-4 w-4" />
              {t.enclosures.openJobsTitle(item.jobs)}
            </span>
          )}
          {item.diet > 0 && (
            <span className="flex items-center gap-1.5">
              <ENCLOSURE_ICONS.specialDiet aria-hidden="true" className="h-4 w-4" />
              {t.enclosures.specialDiets(item.diet)}
            </span>
          )}
          {item.meds > 0 && (
            <span className="flex items-center gap-1.5">
              <ENCLOSURE_ICONS.medication aria-hidden="true" className="h-4 w-4" />
              {m.medications(item.meds)}
            </span>
          )}
        </div>
      )}
      {item.kind === "room" ? null : item.kind === "enclosure" ? (
        <Link href={`/enclosures/${item.id}`} className={button}>
          {m.openEnclosure}
        </Link>
      ) : zonePlan ? (
        <button type="button" onClick={() => onOpenPlan(zonePlan)} className={button}>
          {m.openPlan}
        </button>
      ) : (
        <Link href={`/enclosures?zone=${item.id}`} className={button}>
          {m.seeInList}
        </Link>
      )}
    </section>
  );
}
