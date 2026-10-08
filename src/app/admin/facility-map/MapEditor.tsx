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
import type { MapPlan } from "@/lib/facility-map/types";
import { formatDateTime } from "@/lib/format";
import { ROOM_KINDS, type RoomKind } from "@/lib/facility-map/rooms";
import { removePlan, saveRoom, saveShape, undoReplace } from "./actions";
import { AddPlan, ReplacePlan, preparePlanFile, sendPlan } from "./PlanUpload";

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

/**
 * A plan as the editor sees it: where its picture lives and what last happened to it, read from the
 * plan's history in the store (docs/decisions/2026-10-08-facility-map-plans-uploaded.md).
 */
export type EditorPlan = MapPlan & {
  /** False for a plan still committed under public/facility-maps/, which can be moved into the store. */
  stored: boolean;
  /** The committed file's name, for a plan not yet in the store. */
  fileName: string | null;
  lastChange: { at: string; by: string; action: "add" | "replace" | "undo" } | null;
  /** The replace an Undo would reverse, when there is one. */
  undo: { at: string; by: string; cleared: boolean } | null;
};
export type EditorRoom = { kind: RoomKind; map_id: string; shape: Point[] };

type Item = { id: string; name: string; target: "zone" | "enclosure" | "room" };

/** A room's key in the editor's shape table. Rooms are not zones or enclosures, so no id of theirs exists. */
const roomKey = (kind: RoomKind) => `room:${kind}`;

// A dot that stays the same size on screen at any zoom: a zero-length segment with a round cap and a
// non-scaling stroke. (A circle's radius would grow with the plan.)
const DOT = "h0.0001";

export function MapEditor({
  plans,
  zones,
  enclosures,
  rooms,
}: {
  plans: EditorPlan[];
  zones: EditorZone[];
  enclosures: EditorEnclosure[];
  rooms: EditorRoom[];
}) {
  const { t, locale } = useI18n();
  const m = t.admin.facilityMap;
  const router = useRouter();
  const confirm = useConfirm();

  const overview = plans.find((p) => p.kind === "overview") ?? null;
  const zonePlans = zones.map((z) => plans.find((p) => p.zone_id === z.id)).filter((p): p is EditorPlan => Boolean(p));
  const planList = [...(overview ? [overview] : []), ...zonePlans];

  const [planId, setPlanId] = useState<string | null>(planList[0]?.id ?? null);
  const plan = planList.find((p) => p.id === planId) ?? planList[0] ?? null;

  // The shapes as the editor holds them; each is written to the database the moment it is finished.
  const fromProps = () => ({
    ...Object.fromEntries([...zones, ...enclosures].map((x) => [x.id, x.shape])),
    ...Object.fromEntries(rooms.map((r) => [roomKey(r.kind), r.shape])),
  });
  const [rawShapes, setRawShapes] = useState<Record<string, Point[] | null>>(fromProps);
  // Which plan each room is on (one place for the whole site, so drawing it elsewhere moves it).
  const [roomPlans, setRoomPlans] = useState<Partial<Record<RoomKind, string>>>(() => Object.fromEntries(rooms.map((r) => [r.kind, r.map_id])));
  // A replace that cleared the shapes, or an undo that put them back, changes them on the server: take
  // the fresh rows when the page sends them, without losing which plan is open.
  const [seen, setSeen] = useState({ zones, enclosures, rooms });
  if (seen.zones !== zones || seen.enclosures !== enclosures || seen.rooms !== rooms) {
    setSeen({ zones, enclosures, rooms });
    setRawShapes(fromProps());
    setRoomPlans(Object.fromEntries(rooms.map((r) => [r.kind, r.map_id])));
  }
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
  const things: Item[] = useMemo(() => {
    if (!plan) return [];
    if (plan.kind === "overview") return zones.map((z) => ({ id: z.id, name: zoneName(z), target: "zone" as const }));
    return enclosures
      .filter((e) => e.zone_id === plan.zone_id)
      .map((e) => ({ id: e.id, name: placeName(locale, e.name, e.name_th), target: "enclosure" as const }));
  }, [plan, zones, enclosures, zoneName, locale]);
  // The three rooms are offered on every plan; one drawn on another plan shows here as not placed.
  const roomItems: Item[] = useMemo(
    () => ROOM_KINDS.map((kind) => ({ id: roomKey(kind), name: t.enclosures.map.roomKinds[kind], target: "room" as const })),
    [t],
  );
  const items = useMemo(() => [...things, ...roomItems], [things, roomItems]);
  const shapes = useMemo(() => {
    const here: Record<string, Point[] | null> = { ...rawShapes };
    for (const kind of ROOM_KINDS) if (!plan || roomPlans[kind] !== plan.id) here[roomKey(kind)] = null;
    return here;
  }, [rawShapes, roomPlans, plan]);

  const active = items.find((i) => i.id === activeId) ?? null;
  const activeShape = active ? (dragging ? dragging.shape : shapes[active.id]) : null;
  const drawing = Boolean(active) && (!shapes[active!.id] || redraw);
  const placedCount = things.filter((i) => shapes[i.id]).length;
  const roomsPlaced = roomItems.filter((i) => shapes[i.id]).length;
  const overlay = items.flatMap((i) => (shapes[i.id] ? [{ id: i.id, name: i.name, shape: shapes[i.id]! }] : []));
  const [planBusy, setPlanBusy] = useState(false);

  /** Puts a committed plan into the store as it is: the same picture, so its shapes are kept. */
  async function moveIntoStore(p: EditorPlan) {
    setPlanBusy(true);
    setMessage(null);
    const blob = await fetch(p.image_url).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
    const prepared = blob ? await preparePlanFile(blob) : null;
    const r = prepared
      ? await sendPlan(prepared, { mode: "replace", planId: p.id, shapes: "keep" }, { fileTooLarge: m.errors.tooLarge, processingFailed: m.errors.uploadFailed })
      : { ok: false as const, error: m.errors.unreadable };
    setPlanBusy(false);
    if (!r.ok) setMessage({ kind: "error", text: r.error });
    else router.refresh();
  }

  async function undoLastReplace(p: EditorPlan) {
    if (!p.undo) return;
    if (!(await confirm({ body: p.undo.cleared ? m.undoConfirmCleared : m.undoConfirmKept, confirmLabel: m.undoReplace }))) return;
    setPlanBusy(true);
    setMessage(null);
    const r = await undoReplace(p.id);
    setPlanBusy(false);
    if (!r.ok) setMessage({ kind: "error", text: r.error });
    else router.refresh();
  }

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
    // Stay in the same group: after the last enclosure the editor does not wander on to a room.
    const pool = from.startsWith("room:") ? roomItems : things;
    const at = pool.findIndex((i) => i.id === from);
    for (let step = 1; step <= pool.length; step++) {
      const candidate = pool[(at + step) % pool.length];
      if (candidate && !now[candidate.id]) return candidate.id;
    }
    return null;
  }

  async function save(item: Item, shape: Point[] | null) {
    setSaving(true);
    setMessage(null);
    const result =
      item.target === "room" && plan
        ? await saveRoom(item.id.slice("room:".length), plan.id, shape)
        : await saveShape(item.target === "room" ? "enclosure" : item.target, item.id, shape);
    setSaving(false);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return false;
    }
    setRawShapes((prev) => ({ ...prev, [item.id]: result.shape }));
    if (item.target === "room" && plan) {
      const kind = item.id.slice("room:".length) as RoomKind;
      setRoomPlans((prev) => ({ ...prev, [kind]: result.shape ? plan.id : undefined }));
    }
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
              {m.progress(placedCount, things.length)} ·{" "}
              <span className="break-all">
                {!plan.stored
                  ? m.committedFile(plan.fileName ?? "")
                  : plan.lastChange
                    ? m.lastChange[plan.lastChange.action](formatDateTime(plan.lastChange.at, locale), plan.lastChange.by)
                    : m.pictureSize(plan.width, plan.height)}
              </span>
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

          <details key={plan.id} className="rounded-lg border border-border bg-surface p-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">{m.pictureHeading}</summary>
            <div className="mt-3 flex flex-col gap-3 text-sm">
              {!plan.stored ? (
                <>
                  <p className="text-muted">{m.committedHelp}</p>
                  <div>
                    <button type="button" className={btn} disabled={planBusy} onClick={() => void moveIntoStore(plan)}>
                      {m.moveIntoStore}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted">{m.replaceHelp}</p>
                  <ReplacePlan
                    plan={plan}
                    overlay={overlay}
                    placed={placedCount}
                    total={things.length}
                    roomsPlaced={roomsPlaced}
                    onReplaced={(text) => {
                      setMessage({ kind: "ok", text });
                      router.refresh();
                    }}
                  />
                  {plan.undo && (
                    <div className="flex flex-col gap-2 border-t border-border pt-3">
                      <p className="text-muted">{m.undoHelp(formatDateTime(plan.undo.at, locale), plan.undo.by)}</p>
                      <div>
                        <button type="button" className={btn} disabled={planBusy} onClick={() => void undoLastReplace(plan)}>
                          <Undo2 aria-hidden="true" className="h-4 w-4" />
                          {m.undoReplace}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </details>
          {message && !active && (
            <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>
              {message.text}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            {/* The things to place */}
            <section aria-label={m.listLabel} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground">{plan.kind === "overview" ? m.zonesHeading : m.enclosuresHeading}</h2>
              {things.length === 0 ? (
                <p className="text-sm text-muted">{plan.kind === "overview" ? m.noZones : m.noEnclosures}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {things.map((item) => {
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
              {/* The rooms that are not enclosures: the same three on every plan. */}
              <h2 className="mt-2 text-sm font-semibold text-foreground">{m.roomsHeading}</h2>
              <p className="text-xs text-muted">{m.rooms}</p>
              <ul className="flex flex-col gap-1.5">
                {roomItems.map((item) => {
                  const kind = item.id.slice("room:".length) as RoomKind;
                  const placed = Boolean(shapes[item.id]);
                  const elsewhere = !placed && Boolean(roomPlans[kind]);
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
                        <span className="ml-auto shrink-0 text-xs text-muted">{placed ? m.placed : elsewhere ? m.onAnotherPlan : m.notPlaced}</span>
                      </button>
                      {placed && (
                        <>
                          <RowActionButton label={m.redraw} subject={item.name} icon={ACTION_ICONS.edit} onClick={() => pick(item.id, true)} />
                          <RowActionButton label={m.clear} subject={item.name} icon={ACTION_ICONS.clear} onClick={() => void clearShape(item)} />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
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
              {message && active && (
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
