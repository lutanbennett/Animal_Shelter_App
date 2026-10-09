"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS, ENCLOSURE_ICONS } from "@/components/hub-icons";
import type { EnclosureDetails } from "@/lib/enclosures/details";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { occupancyLevel, type OccupancyLevel } from "@/lib/enclosures/occupancy";
import { centroid, markerBoxes, planHeight, pointsAttr } from "@/lib/facility-map/geometry";
import type { FacilityMapData, MapPlan } from "@/lib/facility-map/types";
import { ZoneName } from "@/components/ZoneName";
import { OccupancyIndicator } from "../OccupancyIndicator";
import { EnclosureMaintenance, EnclosureNotes, EnclosureResidents } from "../[id]/EnclosureHub";
import { loadEnclosurePanel } from "./actions";
import { PanZoom } from "./PanZoom";

/**
 * The read-only facility map on /enclosures (step 2 of 3, docs/facility-map-scope.md): a hand-drawn
 * plan with a polygon laid over each place, overview → zone → enclosure. It takes plain data, not
 * the page, so it can move under Operations with the Enclosures page if that is decided.
 *
 * Colour is how full a place is (the list's own thresholds); the words in the card and each shape's
 * accessible name say the same, so colour is never the only signal. On a zone plan an enclosure
 * carries only small markers (medication, special diet, maintenance) and a room nothing, so the
 * drawing's own numbers stay readable (2026-10-09). A tap selects and never navigates, so a fat
 * finger never leaves the map by accident.
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
  /** A zone's colour, for the dot beside its name in the card; the outline stays an occupancy colour. */
  colour?: string | null;
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
  // Zone plans in the zones' own order (the shelter's, Settings → Zones), whatever order the rows came back in.
  const zonePlans = data.zones.map((z) => planOf.get(z.id)).filter((p): p is MapPlan => Boolean(p));

  const [planId, setPlanId] = useState<string>((overview ?? zonePlans[0] ?? data.plans[0]).id);
  const [pickedId, setPickedId] = useState<string | null>(null);
  // Enclosure details already fetched on this visit, so tapping back to one is instant.
  const [detailsCache] = useState(() => new Map<string, EnclosureDetails>());
  const plan =data.plans.find((p) => p.id === planId) ?? data.plans[0];
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
            colour: z.colour,
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
    // Left in the order they came: the shelter's (Settings → Enclosures), as the page sorted them.
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
              {p.kind === "overview" ? (
                m.overview
              ) : (
                <ZoneName name={zoneName(p.zone_id!)} colour={zoneById.get(p.zone_id!)?.colour} />
              )}
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

      {picked && <PickedCard item={picked} plan={plan} planOf={planOf} onOpenPlan={goTo} onClose={() => setPickedId(null)} cache={detailsCache} />}

      {unplacedCount > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{m.unplacedHeading(unplacedCount)}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.zones.map((z) => {
              const target = planOf.get(z.id);
              const label = placeName(locale, z.name, z.name_th);
              const body = (
                <>
                  <ZoneName name={label} colour={z.colour} className="font-medium text-foreground" />
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
}: {
  item: Item;
  plan: MapPlan;
  selected: boolean;
  onPick: () => void;
  ariaLabel: string;
}) {
  const k = plan.height / plan.width;
  const pts = pointsAttr(item.shape, plan.width, plan.height);
  const [cx, cy] = centroid(item.shape);
  const isRoom = item.kind === "room";
  const isZone = item.kind === "zone";
  const marks = item.kind === "enclosure" ? markerLayout(item, plan) : [];

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
      ) : marks.length > 0 ? (
        // Only the markers, small and inside the outline: the drawing's own numbers stay visible. The
        // count and the names are in the card and the accessible name, so nothing is lost by leaving them off.
        <g className="pointer-events-none" aria-hidden="true">
          {marks.map(({ Icon, x, y, size }, i) => (
            <g key={i}>
              <circle cx={x + size / 2} cy={y + size / 2} r={size * 0.62} className="fill-white/90" />
              <Icon x={x + size * 0.1} y={y + size * 0.1} width={size * 0.8} height={size * 0.8} className="text-neutral-900" strokeWidth={2.4} />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
}

/** An enclosure's markers, in a fixed order, each only when it applies; placed by `markerBoxes`. */
function markerLayout(item: Item, plan: MapPlan) {
  const icons = (
    [
      [item.meds, ENCLOSURE_ICONS.medication],
      [item.diet, ENCLOSURE_ICONS.specialDiet],
      [item.jobs, ENCLOSURE_ICONS.maintenance],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([, Icon]) => Icon);
  const boxes = markerBoxes(icons.length, item.shape, plan.width, plan.height);
  return icons.map((Icon, i) => ({ Icon, ...boxes[i] }));
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
  cache,
}: {
  item: Item;
  plan: MapPlan;
  planOf: Map<string, MapPlan>;
  onOpenPlan: (plan: MapPlan) => void;
  onClose: () => void;
  cache: Map<string, EnclosureDetails>;
}) {
  const { t } = useI18n();
  const m = t.enclosures.map;
  const zonePlan = item.kind === "zone" ? planOf.get(item.id) : undefined;
  const button = "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover";
  const ref = useRef<HTMLElement>(null);

  // On a phone the card is below the plan, off-screen: without this a tap looks as if it did nothing.
  // Only when its top is out of view, so a desktop that already shows it does not jump.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight - 160) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [item.id]);

  return (
    <section ref={ref} aria-live="polite" className="flex scroll-mt-4 flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:scroll-mt-[calc(var(--app-header-h)+1rem)]" data-plan={plan.id}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-base font-semibold text-foreground">
          <ZoneName name={item.name} colour={item.colour} />
        </h3>
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
        // Keyed, so tapping another enclosure starts its own load rather than showing the last one's.
        <EnclosureDetailsBody key={item.id} id={item.id} cache={cache} />
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

type Loaded = { state: "loading" } | { state: "error"; error: string } | { state: "ready"; details: EnclosureDetails };

/**
 * A tapped enclosure's details, loaded on the tap (the map carries only counts), built from the
 * enclosure page's own pieces. A failed load says so and keeps the plan usable; the full page is
 * one link away for what lives only there (move, log maintenance, the tag link).
 */
function EnclosureDetailsBody({ id, cache }: { id: string; cache: Map<string, EnclosureDetails> }) {
  const { t } = useI18n();
  const m = t.enclosures.map;
  const cached = cache.get(id);
  const [loaded, setLoaded] = useState<Loaded>(cached ? { state: "ready", details: cached } : { state: "loading" });
  const [attempt, setAttempt] = useState(cached ? -1 : 0); // -1: nothing to fetch

  useEffect(() => {
    if (attempt < 0) return;
    let live = true;
    loadEnclosurePanel(id)
      .then((result) => {
        if (!live) return;
        if (result.ok) {
          cache.set(id, result.details);
          setLoaded({ state: "ready", details: result.details });
        } else setLoaded({ state: "error", error: result.error });
      })
      .catch(() => live && setLoaded({ state: "error", error: m.detailsError }));
    return () => {
      live = false;
    };
  }, [id, attempt, cache, m.detailsError]);

  const fullPage = <ActionLink href={`/enclosures/${id}`} label={m.openFullPage} icon={ENCLOSURE_ICONS.enclosure} iconOnlyOnMobile={false} />;

  if (loaded.state === "loading") {
    return (
      <>
        <p role="status" className="text-sm text-muted">
          {m.detailsLoading}
        </p>
        <div>{fullPage}</div>
      </>
    );
  }
  if (loaded.state === "error") {
    return (
      <>
        <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground">
          {loaded.error}
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={ACTION_ICONS.refresh}
            onClick={() => {
              setLoaded({ state: "loading" });
              setAttempt((n) => Math.max(0, n) + 1);
            }}
          >
            {m.tryAgain}
          </ActionButton>
          {fullPage}
        </div>
      </>
    );
  }
  const { enclosure, residents, maintenanceJobs } = loaded.details;
  return (
    <>
      <EnclosureResidents residents={residents} compact />
      <div className="grid gap-3 md:grid-cols-2">
        <EnclosureNotes notes={enclosure.notes} />
        {/* Logging a job is an action, so it stays on the full page with the others. */}
        <EnclosureMaintenance enclosureId={enclosure.id} jobs={maintenanceJobs} canWriteMaintenance={false} />
      </div>
      <div>{fullPage}</div>
    </>
  );
}
