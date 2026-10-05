/**
 * Facility map geometry (0142). Pure and dependency-free so the page, the map component and the
 * place-on-map editor to come read one definition of "a shape".
 *
 * A shape is `[[x, y], …]` in percent (0–100) of the plan image, x across and y down, at least
 * three points. The database refuses anything else (`map_shape_valid`), but `jsonb` comes back
 * untyped, so everything here re-checks rather than trusting the column.
 */
export type Point = [number, number];

export function parseShape(value: unknown): Point[] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const points: Point[] = [];
  for (const p of value) {
    if (!Array.isArray(p) || p.length !== 2) return null;
    const [x, y] = p;
    if (typeof x !== "number" || typeof y !== "number") return null;
    if (!(x >= 0 && x <= 100 && y >= 0 && y <= 100)) return null;
    points.push([x, y]);
  }
  return points;
}

/**
 * The image's drawing space: 100 units across, `100 × height / width` down. Scaling y by the image's
 * aspect keeps the SVG undistorted, so text and icons laid over the plan stay round and legible
 * (the scope's `preserveAspectRatio="none"` stretches them).
 */
export function planHeight(width: number, height: number): number {
  return (100 * height) / width;
}

/** A shape's `points` attribute in drawing space. */
export function pointsAttr(shape: Point[], width: number, height: number): string {
  const k = height / width;
  return shape.map(([x, y]) => `${x},${y * k}`).join(" ");
}

/** The area-weighted centre of a polygon, in percent; falls back to the bounding box for a sliver. */
export function centroid(shape: Point[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < shape.length; i++) {
    const [x0, y0] = shape[i];
    const [x1, y1] = shape[(i + 1) % shape.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(area) < 1e-6) {
    const b = bounds(shape);
    return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2];
  }
  return [cx / (3 * area), cy / (3 * area)];
}

export function bounds(shape: Point[]) {
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Pan and zoom of the plan: scale ≥ 1, offset in screen pixels (`transform: translate() scale()` from 0,0). */
export type View = { scale: number; x: number; y: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 6;

/** Keeps the plan covering the whole frame, so it can never be panned or zoomed out of sight. */
export function clampView(view: View, frameW: number, frameH: number): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
  return {
    scale,
    x: Math.min(0, Math.max(frameW - frameW * scale, view.x)),
    y: Math.min(0, Math.max(frameH - frameH * scale, view.y)),
  };
}

/** Zooms to `scale` keeping the frame point (px, py) fixed under the finger or cursor. */
export function zoomAbout(view: View, scale: number, px: number, py: number, frameW: number, frameH: number): View {
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  const k = next / view.scale;
  return clampView({ scale: next, x: px - (px - view.x) * k, y: py - (py - view.y) * k }, frameW, frameH);
}

/** Two decimals of a percent is about 0.1 px on a 1500 px plan: plenty, and keeps the stored jsonb short. */
export function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A point in the SVG's drawing space (x 0–100, y 0–planHeight) as a percent of the image, clamped onto it. */
export function drawingToPercent(x: number, y: number, width: number, height: number): Point {
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  return [roundPct(clamp(x)), roundPct(clamp((y * width) / height))];
}

/** The four corners, clockwise from the top left, of the box two opposite corners span. */
export function rectShape(a: Point, b: Point): Point[] {
  const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

/** Twice the polygon's signed area, in percent²; 0 for a line or a pile of points. */
export function shapeArea(shape: Point[]): number {
  let a = 0;
  for (let i = 0; i < shape.length; i++) {
    const [x0, y0] = shape[i];
    const [x1, y1] = shape[(i + 1) % shape.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
}

/** Shapes smaller than this (percent², about 3×3 px on a 1500 px plan) are a slip of the finger, not a place. */
export const MIN_SHAPE_AREA = 0.04;
