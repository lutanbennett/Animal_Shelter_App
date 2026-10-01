"use client";

import Link from "next/link";
import { useState } from "react";

export type Shape = {
  id: string;
  name: string;
  capacity: number | null;
  count: number;
  points: [number, number][];
};

/** Plan at 1x fits the screen; 2x and 3x scroll inside the frame (pan). */
const ZOOMS = [1, 2, 3];

export function MapPrototype({ shapes }: { shapes: Shape[] }) {
  const [zoom, setZoom] = useState(1);
  const [picked, setPicked] = useState<Shape | null>(null);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Facility map — prototype</h1>
        <p className="text-sm text-muted">Tap a shape to open its enclosure.</p>
      </div>
      <div className="flex gap-2">
        {ZOOMS.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZoom(z)}
            aria-pressed={zoom === z}
            className={`min-h-11 min-w-11 rounded-lg border border-border px-3 text-sm ${zoom === z ? "bg-surface-hover font-semibold" : "bg-surface"}`}
          >
            {z}×
          </button>
        ))}
      </div>
      <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
        <div className="relative" style={{ width: `${zoom * 100}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prototype/placeholder-plan.svg" alt="Facility plan" className="block w-full" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {shapes.map((s) => (
              <polygon
                key={s.id}
                points={s.points.map((p) => p.join(",")).join(" ")}
                role="button"
                tabIndex={0}
                aria-label={s.name}
                onClick={() => setPicked(s)}
                onKeyDown={(e) => e.key === "Enter" && setPicked(s)}
                className={`cursor-pointer stroke-[0.4] ${picked?.id === s.id ? "fill-blue-500/50 stroke-blue-700" : "fill-blue-500/25 stroke-blue-600"}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="min-h-20 rounded-lg border border-border bg-surface p-4">
        {picked ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-foreground">{picked.name}</div>
              <div className="text-sm text-muted">
                {picked.count}
                {picked.capacity ? ` / ${picked.capacity}` : ""} residents
              </div>
            </div>
            <Link href={`/enclosures/${picked.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium">
              Open
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing selected.</p>
        )}
      </div>
    </main>
  );
}
