"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Square, Hexagon, Undo2, X } from "lucide-react";
import { PanZoom } from "@/app/enclosures/map/PanZoom";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import {
  MIN_SHAPE_AREA,
  centroid,
  drawingToPercent,
  planHeight,
  pointsAttr,
  rectShape,
  shapeArea,
  type Point,
} from "@/lib/facility-map/geometry";
import { planImageUrl, type MapPlan } from "@/lib/facility-map/types";
import { addPlan, removePlan, saveShape } from "./actions";

/**
 * The place-on-map editor (step 3 of 3, docs/decisions/2026-10-04-facility-map-editor.md): pick a
 * plan, pick an enclosure (or, on the overview, a zone), and draw it. Nobody ever types a coordinate.
 *
 * Two tools: Rectangle (two opposite corners, the fast way for a kennel) and Polygon (a point per
 * corner, finished with Enter, the first point or the Done button). A placed shape shows a handle on
 * each corner to drag. Every shape is saved the moment it is finished, then the next enclosure still
 * off the plan is picked, so placing a zone is a run of drawing with nothing in between.
 */

export type EditorZone = { id: string; name: string; name_th: string | null; shape: Point[] | null };
export type EditorEnclosure = { id: string; name: string; name_th: string | null; zone_id: string; shape: Point[] | null };

type Tool = "rect" | "poly";
type Item = { id: string; name: string; target: "zone" | "enclosure" };

// A dot that stays the same size on screen at any zoom: a zero-length segment with a round cap and a
// non-scaling stroke. (A circle's radius would grow with the plan.)
const DOT = "h0.0001";

export function MapEditor({
  plans,
  zones,
  enclosures,
}: {
  plans: MapPlan[];
  zones: EditorZone[];
  enclosures: EditorEnclosure[];
}) {
  const { t, locale } = useI18n();
  const m = t.admin.facilityMap;
  const router = useRouter();
  const confirm = useConfirm();

  const overview = plans.find((p) => p.kind === "overview") ?? null;
  const zonePlans = zones.map((z) => plans.find((p) => p.zone_id === z.id)).filter((p): p is MapPlan => Boolean(p));
  const planList = [...(overview ? [overview] : []), ...zonePlans];

  const [planId, setPlanId] = useState<string | null>(planList[0]?.id ?? null);
  const plan = planList.find((p) => p.id === planId) ?? planList[0] ?? null;

  // The shapes as the editor holds them; each is written to the database the moment it is finished.
  const [shapes, setShapes] = useState<Record<string, Point[] | null>>(() =>
    Object.fromEntries([...zones, ...enclosures].map((x) => [x.id, x.shape])),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [redraw, setRedraw] = useState(false);
  const [tool, setTool] = useState<Tool>("rect");
  const [draft, setDraft] = useState<Point[]>([]);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [dragging, setDragging] = useState<{ index: number; shape: Point[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const zoneName = useCallback(
    (z: EditorZone) => placeName(locale, z.name, z.name_th),
    [locale],
  );

  // What can be drawn on this plan: the zones on the overview, a zone's enclosures on its own plan.
  const items: Item[] = useMemo(() => {
    if (!plan) return [];
    if (plan.kind === "overview") return zones.map((z) => ({ id: z.id, name: zoneName(z), target: "zone" as const }));
    return enclosures
      .filter((e) => e.zone_id === plan.zone_id)
      .map((e) => ({ id: e.id, name: placeName(locale, e.name, e.name_th), target: "enclosure" as const }));
  }, [plan, zones, enclosures, zoneName, locale]);

  const active = items.find((i) => i.id === activeId) ?? null;
  const activeShape = active ? (dragging ? dragging.shape : shapes[active.id]) : null;
  const drawing = Boolean(active) && (!shapes[active!.id] || redraw);
  const placedCount = items.filter((i) => shapes[i.id]).length;

  function reset() {
    setDraft([]);
    setCursor(null);
    setRedraw(false);
  }

  function pick(id: string | null, startRedraw = false) {
    setActiveId(id);
    setDraft([]);
    setCursor(null);
    setRedraw(startRedraw);
    setMessage(null);
  }

  function goToPlan(id: string) {
    setPlanId(id);
    pick(null);
  }

  /** The next item on this plan with nothing drawn, after `from` and wrapping round. */
  function nextUnplaced(from: string, now: Record<string, Point[] | null>): string | null {
    const at = items.findIndex((i) => i.id === from);
    for (let step = 1; step <= items.length; step++) {
      const candidate = items[(at + step) % items.length];
      if (candidate && !now[candidate.id]) return candidate.id;
    }
    return null;
  }

  async function save(item: Item, shape: Point[] | null) {
    setSaving(true);
    setMessage(null);
    const result = await saveShape(item.target, item.id, shape);
    setSaving(false);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return false;
    }
    const next = { ...shapes, [item.id]: result.shape };
    setShapes(next);
    setMessage({ kind: "ok", text: result.shape ? m.saved(item.name) : m.cleared(item.name) });
    return true;
  }

  async function finish(shape: Point[]) {
    if (!active) return;
    if (shapeArea(shape) < MIN_SHAPE_AREA) {
      setDraft([]);
      setMessage({ kind: "error", text: m.errors.tooSmall });
      return;
    }
    const item = active;
    const ok = await save(item, shape);
    if (!ok) return;
    setDraft([]);
    setCursor(null);
    setRedraw(false);
    // Straight on to the next one still to place; stay on this one when it was the last.
    const next = nextUnplaced(item.id, { ...shapes, [item.id]: shape });
    setActiveId(next ?? item.id);
  }

  async function clearShape(item: Item) {
    if (!(await confirm({ body: m.clearConfirm(item.name), confirmLabel: m.clear }))) return;
    if (await save(item, null)) {
      if (activeId === item.id) reset();
    }
  }

  function toPoint(e: { clientX: number; clientY: number }): Point | null {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm || !plan) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return drawingToPercent(p.x, p.y, plan.width, plan.height);
  }

  function onCanvasClick(e: React.MouseEvent) {
    if (!drawing || saving) return;
    const pt = toPoint(e);
    if (!pt) return;
    if (tool === "rect") {
      if (draft.length === 0) setDraft([pt]);
      else void finish(rectShape(draft[0], pt));
      return;
    }
    // A click back on the first point closes the polygon.
    if (draft.length >= 3 && plan) {
      const [x0, y0] = draft[0];
      const near = Math.hypot(x0 - pt[0], ((y0 - pt[1]) * plan.height) / plan.width) < 1.2;
      if (near) {
        void finish(draft);
        return;
      }
    }
    setDraft([...draft, pt]);
  }

  // Enter finishes a polygon, Backspace takes the last point back, Escape drops the lot.
  useEffect(() => {
    if (!drawing) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        setDraft([]);
        setCursor(null);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setDraft((d) => d.slice(0, -1));
      } else if (e.key === "Enter" && tool === "poly" && draft.length >= 3) {
        e.preventDefault();
        void finish(draft);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // finish() closes over the latest shapes and draft, which are in the dependency list through `draft`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing, tool, draft, activeId, shapes]);

  // --- dragging a corner of a placed shape ---
  function onHandleDown(e: React.PointerEvent, index: number) {
    if (!activeShape || drawing) return;
    e.stopPropagation(); // not the pan
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging({ index, shape: activeShape });
  }
  function onHandleMove(e: React.PointerEvent) {
    if (!dragging) return;
    const pt = toPoint(e);
    if (!pt) return;
    setDragging({ index: dragging.index, shape: dragging.shape.map((p, i) => (i === dragging.index ? pt : p)) });
  }
  async function onHandleUp() {
    if (!dragging || !active) return;
    const { shape } = dragging;
    const item = active;
    if (shapeArea(shape) < MIN_SHAPE_AREA) {
      setDragging(null);
      setMessage({ kind: "error", text: m.errors.tooSmall });
      return;
    }
    await save(item, shape);
    setDragging(null);
  }

  const k = plan ? plan.height / plan.width : 1;
  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9";

  return (
    <div className="flex flex-col gap-4">
      <AddPlan plans={plans} zones={zones} zoneName={zoneName} onAdded={(id) => { setPlanId(id); pick(null); router.refresh(); }} />

      {plan ? (
        <>
          <nav aria-label={m.plans} className="flex flex-wrap gap-2">
            {planList.map((p) => {
              const on = p.id === plan.id;
              const z = zones.find((x) => x.id === p.zone_id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => goToPlan(p.id)}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-medium md:min-h-9 ${
                    on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {p.kind === "overview" ? t.enclosures.map.overview : z ? zoneName(z) : t.common.dash}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {m.progress(placedCount, items.length)} · <span className="break-all">{plan.image_url.replace("/facility-maps/", "")}</span>
            </p>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                if (!(await confirm({ body: m.removePlanConfirm, confirmLabel: m.removePlan }))) return;
                const r = await removePlan(plan.id);
                if (!r.ok) setMessage({ kind: "error", text: r.error });
                else {
                  setPlanId(null);
                  pick(null);
                  router.refresh();
                }
              }}
            >
              <ACTION_ICONS.delete aria-hidden="true" className="h-4 w-4" />
              {m.removePlan}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            {/* The things to place */}
            <section aria-label={m.listLabel} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground">{plan.kind === "overview" ? m.zonesHeading : m.enclosuresHeading}</h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted">{plan.kind === "overview" ? m.noZones : m.noEnclosures}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {items.map((item) => {
                    const placed = Boolean(shapes[item.id]);
                    const on = item.id === activeId;
                    return (
                      <li key={item.id} className={`flex items-center gap-1.5 rounded-lg border p-1.5 ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => pick(on ? null : item.id)}
                          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-1.5 text-left text-sm md:min-h-9"
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${placed ? "bg-success text-white" : "border border-border text-transparent"}`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="min-w-0 break-words font-medium text-foreground">{item.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-muted">{placed ? m.placed : m.notPlaced}</span>
                        </button>
                        {placed && (
                          <>
                            <RowActionButton
                              label={m.redraw}
                              subject={item.name}
                              icon={ACTION_ICONS.edit}
                              onClick={() => pick(item.id, true)}
                            />
                            <RowActionButton
                              label={m.clear}
                              subject={item.name}
                              icon={ACTION_ICONS.clear}
                              onClick={() => void clearShape(item)}
                            />
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {plan.kind === "zone" && <p className="text-xs text-muted">{m.rooms}</p>}
            </section>

            {/* The plan */}
            <section className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label={m.tool} className="flex gap-1.5">
                  <button type="button" aria-pressed={tool === "rect"} onClick={() => { setTool("rect"); setDraft([]); }} className={`${btn} ${tool === "rect" ? "border-primary bg-primary/15" : ""}`}>
                    <Square aria-hidden="true" className="h-4 w-4" />
                    {m.toolRect}
                  </button>
                  <button type="button" aria-pressed={tool === "poly"} onClick={() => { setTool("poly"); setDraft([]); }} className={`${btn} ${tool === "poly" ? "border-primary bg-primary/15" : ""}`}>
                    <Hexagon aria-hidden="true" className="h-4 w-4" />
                    {m.toolPoly}
                  </button>
                </div>
                {drawing && tool === "poly" && (
                  <>
                    <button type="button" className={btn} disabled={draft.length === 0} onClick={() => setDraft(draft.slice(0, -1))}>
                      <Undo2 aria-hidden="true" className="h-4 w-4" />
                      {m.undoPoint}
                    </button>
                    <button type="button" className={`${btn} border-primary bg-primary text-primary-foreground hover:bg-primary-hover`} disabled={draft.length < 3 || saving} onClick={() => void finish(draft)}>
                      <Check aria-hidden="true" className="h-4 w-4" />
                      {m.done}
                    </button>
                  </>
                )}
                {drawing && (draft.length > 0 || redraw) && (
                  <button type="button" className={btn} onClick={() => { setDraft([]); setCursor(null); if (redraw) setRedraw(false); }}>
                    <X aria-hidden="true" className="h-4 w-4" />
                    {m.cancel}
                  </button>
                )}
              </div>

              <p className="text-sm text-muted" aria-live="polite">
                {!active ? m.hintPick : drawing ? (tool === "rect" ? (draft.length === 0 ? m.hintRect1(active.name) : m.hintRect2(active.name)) : m.hintPoly(active.name, draft.length)) : m.hintEdit(active.name)}
              </p>
              {message && (
                <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>
                  {message.text}
                </p>
              )}

              <PanZoom
                key={plan.id}
                aspect={plan.width / plan.height}
                doubleTapZoom={false}
                controlLabels={{ zoomIn: t.enclosures.map.zoomIn, zoomOut: t.enclosures.map.zoomOut, fit: t.enclosures.map.fit }}
              >
                <img src={plan.image_url} alt={m.planAlt} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
                <svg
                  ref={svgRef}
                  data-testid="editor-canvas"
                  viewBox={`0 0 100 ${planHeight(plan.width, plan.height)}`}
                  className={`absolute inset-0 h-full w-full ${drawing ? "cursor-crosshair" : ""}`}
                  onClick={onCanvasClick}
                  onPointerMove={(e) => {
                    if (drawing && e.pointerType === "mouse") setCursor(toPoint(e));
                  }}
                  onPointerLeave={() => setCursor(null)}
                >
                  {items.map((item) => {
                    const shape = item.id === activeId && dragging ? dragging.shape : shapes[item.id];
                    if (!shape) return null;
                    const on = item.id === activeId;
                    const [cx, cy] = centroid(shape);
                    return (
                      <g
                        key={item.id}
                        data-item={item.id}
                        onClick={() => {
                          if (!drawing) pick(item.id);
                        }}
                        style={{ pointerEvents: drawing ? "none" : "all" }}
                        className="cursor-pointer"
                      >
                        <polygon
                          points={pointsAttr(shape, plan.width, plan.height)}
                          strokeWidth={on ? 3 : 1.5}
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                          className={on ? "fill-primary/35 stroke-primary" : "fill-success/20 stroke-success"}
                        />
                        <text
                          x={cx}
                          y={cy * k}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={plan.kind === "overview" ? 3 : 2}
                          fontWeight={700}
                          className="pointer-events-none fill-neutral-900"
                          stroke="white"
                          strokeWidth={0.7}
                          paintOrder="stroke"
                        >
                          {item.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* corner handles on the picked shape */}
                  {!drawing && active && activeShape &&
                    activeShape.map(([x, y], i) => (
                      <path
                        key={i}
                        d={`M${x} ${y * k}${DOT}`}
                        data-handle={i}
                        stroke="white"
                        strokeWidth={16}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        className="cursor-move"
                        style={{ pointerEvents: "stroke", touchAction: "none" }}
                        onPointerDown={(e) => onHandleDown(e, i)}
                        onPointerMove={onHandleMove}
                        onPointerUp={() => void onHandleUp()}
                      />
                    ))}
                  {!drawing && active && activeShape &&
                    activeShape.map(([x, y], i) => (
                      <path key={`c${i}`} d={`M${x} ${y * k}${DOT}`} stroke="var(--color-primary, #d97706)" strokeWidth={9} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    ))}

                  {/* the shape being drawn */}
                  {drawing && draft.length > 0 && (
                    <g className="pointer-events-none">
                      {tool === "rect" ? (
                        <polygon
                          points={pointsAttr(rectShape(draft[0], cursor ?? draft[0]), plan.width, plan.height)}
                          className="fill-primary/25 stroke-primary"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : (
                        <polyline
                          points={pointsAttr([...draft, ...(cursor ? [cursor] : [])], plan.width, plan.height)}
                          fill="none"
                          className="stroke-primary"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                      {draft.map(([x, y], i) => (
                        <path key={i} d={`M${x} ${y * k}${DOT}`} stroke={i === 0 && draft.length >= 3 ? "var(--color-success, #16a34a)" : "var(--color-primary, #d97706)"} strokeWidth={i === 0 ? 11 : 8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                      ))}
                    </g>
                  )}
                </svg>
              </PanZoom>
              <p className="text-xs text-muted">{m.zoomHint}</p>
            </section>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">{m.noPlans}</p>
      )}
    </div>
  );
}

/**
 * Registers a plan image that is already in `public/facility-maps/`. The picture is loaded in the
 * browser to read its pixel size and prove the name is a real image; the server never touches it.
 */
function AddPlan({
  plans,
  zones,
  zoneName,
  onAdded,
}: {
  plans: MapPlan[];
  zones: EditorZone[];
  zoneName: (z: EditorZone) => string;
  onAdded: (id: string) => void;
}) {
  const { t } = useI18n();
  const m = t.admin.facilityMap;
  const hasOverview = plans.some((p) => p.kind === "overview");
  const free = zones.filter((z) => !plans.some((p) => p.zone_id === z.id));
  const targets = [...(hasOverview ? [] : [{ id: "", label: t.enclosures.map.overview }]), ...free.map((z) => ({ id: z.id, label: zoneName(z) }))];

  const [target, setTarget] = useState(targets[0]?.id ?? "");
  const [file, setFile] = useState("");
  const [size, setSize] = useState<{ w: number; h: number } | "bad" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (targets.length === 0) return null;
  const chosen = targets.some((x) => x.id === target) ? target : targets[0].id;
  const name = file.trim();

  return (
    <details className="rounded-lg border border-border bg-surface p-3" open={plans.length === 0}>
      <summary className="cursor-pointer text-sm font-semibold text-foreground">{m.addPlan}</summary>
      <div className="mt-3 flex flex-col gap-3 text-sm">
        <p className="text-muted">{m.addPlanHelp}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{m.planFor}</span>
            <select value={chosen} onChange={(e) => setTarget(e.target.value)} className="min-h-11 rounded border border-border bg-background px-2 text-foreground md:min-h-9">
              {targets.map((x) => (
                <option key={x.id || "overview"} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{m.fileName}</span>
            <input
              value={file}
              onChange={(e) => {
                setFile(e.target.value);
                setSize(null);
                setError(null);
              }}
              placeholder="main-zone-blue.webp"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 rounded border border-border bg-background px-2 text-foreground md:min-h-9"
            />
          </label>
        </div>
        {name && /\.(webp|png|jpe?g|svg)$/i.test(name) && (
          <img
            key={name}
            src={planImageUrl(name)}
            alt=""
            className="max-h-48 w-auto self-start rounded border border-border"
            onLoad={(e) => {
              const img = e.currentTarget;
              setSize(img.naturalWidth > 0 && img.naturalHeight > 0 ? { w: img.naturalWidth, h: img.naturalHeight } : "bad");
            }}
            onError={() => setSize("bad")}
          />
        )}
        {size === "bad" && <p className="text-danger">{m.notFound(name)}</p>}
        {size && size !== "bad" && <p className="text-muted">{m.sizeFound(size.w, size.h)}</p>}
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div>
          <button
            type="button"
            disabled={busy || !size || size === "bad"}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-9"
            onClick={async () => {
              if (!size || size === "bad") return;
              setBusy(true);
              setError(null);
              const r = await addPlan(chosen || null, name, size.w, size.h);
              setBusy(false);
              if (!r.ok) setError(r.error);
              else {
                setFile("");
                setSize(null);
                onAdded(r.id);
              }
            }}
          >
            <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
            {m.addPlanButton}
          </button>
        </div>
      </div>
    </details>
  );
}
