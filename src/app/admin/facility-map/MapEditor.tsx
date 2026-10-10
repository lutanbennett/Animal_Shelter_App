"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Square, Hexagon, Undo2, X } from "lucide-react";
import { PanZoom } from "@/app/enclosures/map/PanZoom";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { ActionButton } from "@/components/ActionButton";
import { TranslationPanel } from "@/components/TranslationPanel";
import type { TranslationRow } from "@/lib/translations/types";
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
import { ROOM_DESCRIPTION_MAX, ROOM_NAME_MAX } from "@/lib/facility-map/rooms";
import { addRoom, deleteRoom, removePlan, saveRoomDetails, saveRoomShape, saveShape, undoReplace } from "./actions";
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
export type EditorRoom = {
  id: string;
  map_id: string;
  name: string;
  name_th: string | null;
  description: string | null;
  shape: Point[];
  /** The description's other-language row (0175 queues one), shown beside the box. */
  translation: TranslationRow | null;
};

type Item = { id: string; name: string; target: "zone" | "enclosure" | "room" };

/** A room's key in the editor's shape table, kept apart from the zone and enclosure ids. */
const roomKey = (id: string) => `room:${id}`;
/** The room being added: named, not drawn yet, so not in the table. */
const NEW_ROOM = "room:new";

// A dot that stays the same size on screen at any zoom: a zero-length segment with a round cap and a
// non-scaling stroke. (A circle's radius would grow with the plan.)
const DOT = "h0.0001";

export function MapEditor({
  plans,
  zones,
  enclosures,
  rooms,
  canManageTranslations,
}: {
  plans: EditorPlan[];
  zones: EditorZone[];
  enclosures: EditorEnclosure[];
  rooms: EditorRoom[];
  /** translations.manage: may write the description's translation in place, as on every prose field. */
  canManageTranslations: boolean;
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
  const fromProps = () => Object.fromEntries([...zones, ...enclosures].map((x) => [x.id, x.shape]));
  const [rawShapes, setRawShapes] = useState<Record<string, Point[] | null>>(fromProps);
  // The rooms, each on one plan (a room is on the site once, so drawing it on another plan moves it).
  const [roomList, setRoomList] = useState(rooms);
  // A room being added: named, waiting to be drawn. It is stored only once it has a shape.
  const [newRoom, setNewRoom] = useState<{ name: string; name_th: string } | null>(null);
  // A replace that cleared the shapes, an undo that put them back, or a saved description (whose
  // translation row the database writes) changes them on the server: take the fresh rows when the page
  // sends them, without losing which plan is open.
  const [seen, setSeen] = useState({ zones, enclosures, rooms });
  if (seen.zones !== zones || seen.enclosures !== enclosures || seen.rooms !== rooms) {
    setSeen({ zones, enclosures, rooms });
    setRawShapes(fromProps());
    setRoomList(rooms);
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
  // Every room is listed on every plan; one drawn on another plan shows here as on another plan.
  const roomItems: Item[] = useMemo(
    () => [
      ...roomList.map((r) => ({ id: roomKey(r.id), name: placeName(locale, r.name, r.name_th), target: "room" as const })),
      ...(newRoom ? [{ id: NEW_ROOM, name: placeName(locale, newRoom.name, newRoom.name_th), target: "room" as const }] : []),
    ],
    [roomList, newRoom, locale],
  );
  const items = useMemo(() => [...things, ...roomItems], [things, roomItems]);
  const shapes = useMemo(() => {
    const here: Record<string, Point[] | null> = { ...rawShapes };
    for (const r of roomList) here[roomKey(r.id)] = plan && r.map_id === plan.id ? r.shape : null;
    return here;
  }, [rawShapes, roomList, plan]);
  const roomOf = (itemId: string) => roomList.find((r) => roomKey(r.id) === itemId) ?? null;

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
    if (id !== NEW_ROOM) setNewRoom(null);
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

  /** The next zone or enclosure on this plan with nothing drawn, after `from` and wrapping round. */
  function nextUnplaced(from: string, now: Record<string, Point[] | null>): string | null {
    const at = things.findIndex((i) => i.id === from);
    for (let step = 1; step <= things.length; step++) {
      const candidate = things[(at + step) % things.length];
      if (candidate && !now[candidate.id]) return candidate.id;
    }
    return null;
  }

  /** Stores a zone's or an enclosure's shape (or clears it with `null`). */
  async function save(item: Item, shape: Point[] | null) {
    setSaving(true);
    setMessage(null);
    const result = await saveShape(item.target === "zone" ? "zone" : "enclosure", item.id, shape);
    setSaving(false);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return false;
    }
    setRawShapes((prev) => ({ ...prev, [item.id]: result.shape }));
    setMessage({ kind: "ok", text: result.shape ? m.saved(item.name) : m.cleared(item.name) });
    return true;
  }

  /**
   * Stores a room's shape on the open plan: a new room is created by it, an existing one is reshaped
   * or, drawn on another plan, moved here. Returns the room's item id, or null when it was refused.
   */
  async function saveRoom(item: Item, shape: Point[]): Promise<string | null> {
    const room = roomOf(item.id);
    if (!plan || (item.id === NEW_ROOM ? !newRoom : !room)) return null;
    setSaving(true);
    setMessage(null);
    if (item.id === NEW_ROOM && newRoom) {
      const r = await addRoom(plan.id, newRoom.name, newRoom.name_th, shape);
      setSaving(false);
      if (!r.ok) {
        setMessage({ kind: "error", text: r.error });
        return null;
      }
      setRoomList((prev) => [...prev, { id: r.id, map_id: plan.id, name: r.name, name_th: r.name_th, description: null, shape: r.shape, translation: null }]);
      setNewRoom(null);
      setMessage({ kind: "ok", text: m.roomAdded(placeName(locale, r.name, r.name_th)) });
      return roomKey(r.id);
    }
    if (!room) return null;
    const r = await saveRoomShape(room.id, plan.id, shape);
    setSaving(false);
    if (!r.ok) {
      setMessage({ kind: "error", text: r.error });
      return null;
    }
    setRoomList((prev) => prev.map((x) => (x.id === room.id ? { ...x, map_id: plan.id, shape: r.shape } : x)));
    setMessage({ kind: "ok", text: m.saved(item.name) });
    return item.id;
  }

  async function finish(shape: Point[]) {
    if (!active) return;
    if (shapeArea(shape) < MIN_SHAPE_AREA) {
      setDraft([]);
      setMessage({ kind: "error", text: m.errors.tooSmall });
      return;
    }
    const item = active;
    if (item.target === "room") {
      // A room stays picked, so its name and description can be written next. The editor never moves
      // on to another room by itself: the others are on their own plans, and drawing one here moves it.
      const id = await saveRoom(item, shape);
      if (!id) return;
      setDraft([]);
      setCursor(null);
      setRedraw(false);
      setActiveId(id);
      return;
    }
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

  /** A room cannot be off the map, so taking it off is deleting it, with what is written about it. */
  async function removeRoom(item: Item) {
    const room = roomOf(item.id);
    if (!room) return;
    if (!(await confirm({ body: m.deleteRoomConfirm(item.name), confirmLabel: m.deleteRoom }))) return;
    setSaving(true);
    setMessage(null);
    const r = await deleteRoom(room.id);
    setSaving(false);
    if (!r.ok) {
      setMessage({ kind: "error", text: r.error });
      return;
    }
    setRoomList((prev) => prev.filter((x) => x.id !== room.id));
    if (activeId === item.id) pick(null);
    setMessage({ kind: "ok", text: m.roomDeleted(item.name) });
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
    if (item.target === "room") await saveRoom(item, shape);
    else await save(item, shape);
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
              {/* The rooms that are not enclosures: every one listed on every plan, each drawn on one. */}
              <h2 className="mt-2 text-sm font-semibold text-foreground">{m.roomsHeading}</h2>
              <p className="text-xs text-muted">{m.rooms}</p>
              <ul className="flex flex-col gap-1.5">
                {roomItems.map((item) => {
                  const room = roomOf(item.id);
                  const placed = Boolean(shapes[item.id]);
                  const on = item.id === activeId;
                  return (
                    <li key={item.id} className={`flex flex-col gap-2 rounded-lg border p-1.5 ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => pick(on && item.id !== NEW_ROOM ? null : item.id)}
                          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-1.5 text-left text-sm md:min-h-9"
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${placed ? "bg-success text-white" : "border border-border text-transparent"}`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="min-w-0 break-words font-medium text-foreground">{item.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-muted">{placed ? m.placed : room ? m.onAnotherPlan : m.notPlaced}</span>
                        </button>
                        {placed && <RowActionButton label={m.redraw} subject={item.name} icon={ACTION_ICONS.edit} onClick={() => pick(item.id, true)} />}
                        {room && <RowActionButton label={m.deleteRoom} subject={item.name} icon={ACTION_ICONS.delete} onClick={() => void removeRoom(item)} />}
                      </div>
                      {on && room && (
                        <RoomDetails
                          key={`${room.id}:${room.name}:${room.name_th ?? ""}:${room.description ?? ""}`}
                          room={room}
                          canManageTranslations={canManageTranslations}
                          onSaved={(saved) => {
                            setRoomList((prev) => prev.map((x) => (x.id === room.id ? { ...x, ...saved } : x)));
                            setMessage({ kind: "ok", text: m.saved(placeName(locale, saved.name, saved.name_th)) });
                            // The database queues the description's translation: fetch its row for the panel.
                            router.refresh();
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
              {newRoom ? null : (
                <AddRoomForm
                  onStart={(names) => {
                    setNewRoom(names);
                    setActiveId(NEW_ROOM);
                    setDraft([]);
                    setCursor(null);
                    setRedraw(false);
                    setMessage(null);
                  }}
                />
              )}
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
                {drawing && (draft.length > 0 || redraw || activeId === NEW_ROOM) && (
                  <button
                    type="button"
                    className={btn}
                    onClick={() => {
                      // Cancelling a room being added drops it: nothing was stored.
                      if (activeId === NEW_ROOM) return pick(null);
                      setDraft([]);
                      setCursor(null);
                      if (redraw) setRedraw(false);
                    }}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    {m.cancel}
                  </button>
                )}
              </div>

              <p className="text-sm text-muted" aria-live="polite">
                {!active ? m.hintPick : drawing ? (tool === "rect" ? (draft.length === 0 ? m.hintRect1(active.name) : m.hintRect2(active.name)) : m.hintPoly(active.name, draft.length)) : m.hintEdit(active.name)}
              </p>
              {active && roomOf(active.id) && !shapes[active.id] && <p className="text-sm text-muted">{m.moveHint(active.name)}</p>}
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

const INPUT =
  "min-h-11 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-9";

/**
 * Add room: a name first (English, and Thai if it is known), then the room is drawn on the open plan like
 * any shape. Nothing is stored until it is drawn, so a room is never in the table without a place.
 */
function AddRoomForm({ onStart }: { onStart: (names: { name: string; name_th: string }) => void }) {
  const { t } = useI18n();
  const m = t.admin.facilityMap;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");

  if (!open) {
    return (
      <div>
        <ActionButton icon={ACTION_ICONS.add} compact onClick={() => setOpen(true)}>
          {m.addRoom}
        </ActionButton>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onStart({ name: name.trim(), name_th: nameTh.trim() });
      }}
    >
      <p className="text-xs text-muted">{m.addRoomHelp}</p>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {m.roomName}
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={ROOM_NAME_MAX} required autoFocus className={INPUT} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {m.roomNameTh}
        <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} maxLength={ROOM_NAME_MAX} lang="th" className={INPUT} />
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton icon={X} compact onClick={() => setOpen(false)}>
          {t.common.cancel}
        </ActionButton>
        <ActionButton type="submit" icon={Square} variant="primary" compact disabled={!name.trim()}>
          {m.drawRoom}
        </ActionButton>
      </div>
    </form>
  );
}

/**
 * A room's name in both languages (a label, typed here) and what it is for (prose: a few plain lines,
 * whose other language is the translation queue's, shown underneath exactly as on every other prose
 * field). Saved together; Rename is this form.
 */
function RoomDetails({
  room,
  canManageTranslations,
  onSaved,
}: {
  room: EditorRoom;
  canManageTranslations: boolean;
  onSaved: (saved: { name: string; name_th: string | null; description: string | null }) => void;
}) {
  const { t } = useI18n();
  const m = t.admin.facilityMap;
  const [name, setName] = useState(room.name);
  const [nameTh, setNameTh] = useState(room.name_th ?? "");
  const [description, setDescription] = useState(room.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const changed = name !== room.name || nameTh !== (room.name_th ?? "") || description !== (room.description ?? "");

  return (
    <div className="flex flex-col gap-2 px-1.5 pb-1">
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setPending(true);
          const r = await saveRoomDetails(room.id, { name, nameTh, description });
          setPending(false);
          if (!r.ok) setError(r.error);
          else onSaved({ name: r.name, name_th: r.name_th, description: r.description });
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {m.roomName}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={ROOM_NAME_MAX} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {m.roomNameTh}
          <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} maxLength={ROOM_NAME_MAX} lang="th" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {m.roomDescription}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={ROOM_DESCRIPTION_MAX}
            placeholder={m.roomDescriptionPlaceholder}
            className={INPUT}
          />
        </label>
        <p className="text-xs text-muted">{m.roomDescriptionHelp}</p>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <ActionButton type="submit" icon={ACTION_ICONS.save} variant="primary" compact disabled={!changed || pending || !name.trim()}>
            {pending ? t.common.saving : m.saveRoom}
          </ActionButton>
        </div>
      </form>
      {/* Outside the form: the panel is a form of its own. */}
      {room.description && room.translation && (
        <TranslationPanel
          key={room.translation.id + room.translation.updated_at}
          row={room.translation}
          canManage={canManageTranslations}
          recordPath="/admin/facility-map"
        />
      )}
    </div>
  );
}
