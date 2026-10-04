"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";
import { clampView, zoomAbout, type View } from "@/lib/facility-map/geometry";

const TAP_SLOP = 8; // px a finger may wander and still be a tap, not a pan
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_ZOOM = 2.5;

const HOME: View = { scale: 1, x: 0, y: 0 };

type Pt = { x: number; y: number };

/**
 * A frame the size of the plan image that its children (the image and the SVG laid over it) pan and
 * zoom inside, together, as one transformed layer. Pointer Events only, no library:
 *
 *   one finger drags · two fingers pinch about their midpoint · double-tap zooms in and back ·
 *   ctrl/⌘-wheel (a trackpad pinch) zooms about the cursor · the +, − and fit buttons do the same
 *   without a gesture, for a keyboard or a hand that cannot pinch.
 *
 * The plan is clamped to cover the frame, so it cannot be lost off-screen. `touch-action: none` is on
 * the frame only, so the rest of the page still scrolls under a finger. A gesture that moved is
 * swallowed before it reaches a shape (`onClickCapture`), so a pan never selects what it ended over.
 */
export function PanZoom({
  aspect,
  controlLabels,
  children,
}: {
  /** The image's width ÷ height. */
  aspect: number;
  controlLabels: { zoomIn: string; zoomOut: string; fit: string };
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(HOME);
  const viewRef = useRef<View>(HOME);
  const pointers = useRef(new Map<number, Pt>());
  const drag = useRef<{ from: Pt; view: View; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; mid: Pt; view: View } | null>(null);
  const swallowClick = useRef(false);
  const lastTap = useRef<{ at: number; pt: Pt } | null>(null);

  const size = useCallback(() => {
    const r = frame.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }, []);

  const apply = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const local = (e: { clientX: number; clientY: number }): Pt => {
    const { left, top } = size();
    return { x: e.clientX - left, y: e.clientY - top };
  };

  const zoomTo = useCallback(
    (scale: number, at?: Pt) => {
      const { w, h } = size();
      apply(zoomAbout(viewRef.current, scale, at?.x ?? w / 2, at?.y ?? h / 2, w, h));
    },
    [apply, size],
  );

  // React registers wheel listeners as passive, which cannot preventDefault; the page must not zoom.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const v = viewRef.current;
      const next = zoomAbout(v, v.scale * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      viewRef.current = next;
      setView(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    const pt = local(e);
    if (pointers.current.size === 0) swallowClick.current = false;
    pointers.current.set(e.pointerId, pt);
    if (pointers.current.size === 1) {
      drag.current = { from: pt, view: viewRef.current, moved: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        view: viewRef.current,
      };
      drag.current = null;
      swallowClick.current = true;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);
    const { w, h } = size();

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const start = pinch.current;
      const scale = start.view.scale * (dist / start.dist);
      // Keep the plan point that was under the starting midpoint under the current one.
      const cx = (start.mid.x - start.view.x) / start.view.scale;
      const cy = (start.mid.y - start.view.y) / start.view.scale;
      apply(clampView({ scale, x: mid.x - cx * scale, y: mid.y - cy * scale }, w, h));
      return;
    }

    const d = drag.current;
    if (!d) return;
    const dx = pt.x - d.from.x;
    const dy = pt.y - d.from.y;
    if (!d.moved && Math.hypot(dx, dy) > TAP_SLOP) {
      d.moved = true;
      swallowClick.current = true;
      // Capture only now: capturing on press would retarget the tap's click away from the shape.
      frame.current?.setPointerCapture(e.pointerId);
    }
    if (d.moved) apply(clampView({ scale: d.view.scale, x: d.view.x + dx, y: d.view.y + dy }, w, h));
  }

  function onPointerUp(e: React.PointerEvent) {
    const pt = local(e);
    const wasTap = drag.current && !drag.current.moved && pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    // The last finger of a pinch must not turn into a drag.
    drag.current = null;

    if (!wasTap) {
      lastTap.current = null;
      return;
    }
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && now - prev.at < DOUBLE_TAP_MS && Math.hypot(pt.x - prev.pt.x, pt.y - prev.pt.y) < 30) {
      lastTap.current = null;
      if (viewRef.current.scale > 1.05) apply(HOME);
      else zoomTo(DOUBLE_TAP_ZOOM, pt);
    } else {
      lastTap.current = { at: now, pt };
    }
  }

  function onPointerCancel(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
    lastTap.current = null;
  }

  const controlButton =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface/95 text-foreground shadow hover:bg-surface-hover disabled:opacity-40";

  return (
    <div
      className="relative mx-auto w-full"
      style={{ aspectRatio: String(aspect), maxWidth: `calc(75vh * ${aspect})` }}
    >
      <div
        ref={frame}
        data-testid="map-frame"
        className={`absolute inset-0 touch-none select-none overflow-hidden rounded-lg border border-border bg-white ${
          view.scale > 1.001 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={(e) => {
          if (swallowClick.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <div
          data-testid="map-layer"
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          {children}
        </div>
        <div
          className="absolute bottom-2 right-2 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <button type="button" aria-label={controlLabels.zoomIn} onClick={() => zoomTo(viewRef.current.scale * 1.6)} className={controlButton}>
            <Plus aria-hidden="true" className="h-5 w-5" />
          </button>
          <button type="button" aria-label={controlLabels.zoomOut} onClick={() => zoomTo(viewRef.current.scale / 1.6)} disabled={view.scale <= 1.001} className={controlButton}>
            <Minus aria-hidden="true" className="h-5 w-5" />
          </button>
          <button type="button" aria-label={controlLabels.fit} onClick={() => apply(HOME)} disabled={view.scale <= 1.001} className={controlButton}>
            <Maximize2 aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
