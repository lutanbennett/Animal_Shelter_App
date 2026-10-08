"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { planHeight, pointsAttr, type Point } from "@/lib/facility-map/geometry";
import { PLAN_MAX_BYTES, PLAN_MAX_SIDE } from "@/lib/facility-map/plan-image";
import type { MapPlan } from "@/lib/facility-map/types";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { uploadPlan } from "./actions";
import type { EditorZone } from "./MapEditor";

/**
 * Adding and replacing a plan picture from the editor (docs/decisions/2026-10-08-facility-map-plans-uploaded.md).
 * A photo or a file, on a phone or a desk: the picture is opened in the browser first, so a file that is
 * not a picture is refused here in words, and a big phone photo is scaled to PLAN_MAX_SIDE and saved as
 * WebP before it is sent. The server reads the type and size from the bytes again either way.
 */

export type PreparedPlan = { blob: Blob; url: string; width: number; height: number };

const PASS_THROUGH = new Set(["image/webp", "image/png"]);

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Opens the file as a picture and returns what will be uploaded, or null when the browser cannot open
 * it (a PDF, an SVG with script, a corrupt file). A WebP or PNG that already fits is sent as it is, so a
 * clean export stays sharp. Anything else is drawn onto a canvas, which also bakes in a phone photo's
 * EXIF rotation (the server reads a JPEG's stored size, not its rotated one).
 */
export async function preparePlanFile(file: Blob): Promise<PreparedPlan | null> {
  if (file.type === "image/svg+xml") return null;
  const source = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = source;
    await img.decode();
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    if (PASS_THROUGH.has(file.type) && Math.max(w, h) <= PLAN_MAX_SIDE && file.size <= PLAN_MAX_BYTES) {
      return { blob: file, url: URL.createObjectURL(file), width: w, height: h };
    }
    const scale = Math.min(1, PLAN_MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff"; // a transparent PNG would turn black as a JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // WebP where the browser can write it (older Safari silently writes PNG instead), else JPEG.
    let blob = await canvasBlob(canvas, "image/webp", 0.9);
    if (!blob || blob.type !== "image/webp") blob = await canvasBlob(canvas, "image/jpeg", 0.9);
    if (blob && blob.size > PLAN_MAX_BYTES) blob = await canvasBlob(canvas, blob.type, 0.7);
    if (!blob) return null;
    return { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(source);
  }
}

/** Sends a prepared picture to `uploadPlan`, with every failure as a sentence. */
export async function sendPlan(prepared: PreparedPlan, fields: Record<string, string>, errors: { fileTooLarge: string; processingFailed: string }) {
  const ext = prepared.blob.type === "image/png" ? "png" : prepared.blob.type === "image/jpeg" ? "jpg" : "webp";
  const file = new File([prepared.blob], `plan.${ext}`, { type: prepared.blob.type });
  const form = new FormData();
  form.set("file", file);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return runUploadAction(file, errors, () => uploadPlan(form));
}

/** The hidden file input and the button that opens it. `accept="image/*"` offers the camera on a phone. */
function PickPicture({ label, busy, onPicked }: { label: string; busy: boolean; onPicked: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPicked(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9"
      >
        <ImageUp aria-hidden="true" className="h-4 w-4" />
        {label}
      </button>
    </>
  );
}

/** Revokes a preview's object URL when it is replaced or the component goes. */
function usePrepared() {
  const [prepared, setPrepared] = useState<PreparedPlan | null>(null);
  useEffect(() => () => { if (prepared) URL.revokeObjectURL(prepared.url); }, [prepared]);
  return [prepared, setPrepared] as const;
}

/** Add a plan for the overview or a zone with none yet, from a photo or a file. */
export function AddPlan({
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
  const [prepared, setPrepared] = usePrepared();
  const [busy, setBusy] = useState<"preparing" | "uploading" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (targets.length === 0) return null;
  const chosen = targets.some((x) => x.id === target) ? target : targets[0].id;

  return (
    <details className="rounded-lg border border-border bg-surface p-3" open={plans.length === 0}>
      <summary className="cursor-pointer text-sm font-semibold text-foreground">{m.addPlan}</summary>
      <div className="mt-3 flex flex-col gap-3 text-sm">
        <p className="text-muted">{m.addPlanHelp}</p>
        <label className="flex max-w-sm flex-col gap-1">
          <span className="font-medium text-foreground">{m.planFor}</span>
          <select value={chosen} onChange={(e) => setTarget(e.target.value)} className="min-h-11 rounded border border-border bg-background px-2 text-foreground md:min-h-9">
            {targets.map((x) => (
              <option key={x.id || "overview"} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <PickPicture
            label={prepared ? m.chooseAnother : m.choosePicture}
            busy={busy !== null}
            onPicked={async (file) => {
              setError(null);
              setBusy("preparing");
              const p = await preparePlanFile(file);
              setBusy(null);
              if (!p) setError(m.errors.unreadable);
              setPrepared(p);
            }}
          />
        </div>
        {busy && <p role="status" className="text-muted">{busy === "preparing" ? m.preparing : m.uploading}</p>}
        {prepared && (
          <>
            <img src={prepared.url} alt={m.newPictureAlt} className="max-h-64 w-auto self-start rounded border border-border" />
            <p className="text-muted">{m.pictureSize(prepared.width, prepared.height)}</p>
          </>
        )}
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div>
          <button
            type="button"
            disabled={busy !== null || !prepared}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-9"
            onClick={async () => {
              if (!prepared) return;
              setBusy("uploading");
              setError(null);
              const r = await sendPlan(prepared, { mode: "add", zoneId: chosen }, { fileTooLarge: m.errors.tooLarge, processingFailed: m.errors.uploadFailed });
              setBusy(null);
              if (!r.ok) setError(r.error);
              else {
                setPrepared(null);
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

export type OverlayShape = { id: string; name: string; shape: Point[] };

/**
 * Replace this plan's picture. Nothing is saved until the new picture has been seen with the shapes
 * already on the plan drawn over it, and a choice made: keep them (the same drawing, a sharper copy) or
 * clear them (a new layout, placed again). A picture of a different shape defaults to clearing, and says why.
 */
export function ReplacePlan({
  plan,
  overlay,
  placed,
  total,
  roomsPlaced,
  onReplaced,
}: {
  plan: MapPlan;
  overlay: OverlayShape[];
  placed: number;
  total: number;
  roomsPlaced: number;
  onReplaced: (message: string) => void;
}) {
  const { t } = useI18n();
  const m = t.admin.facilityMap;
  const [prepared, setPrepared] = usePrepared();
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState<"preparing" | "uploading" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reshaped = prepared ? Math.abs(prepared.width / prepared.height / (plan.width / plan.height) - 1) > 0.02 : false;
  const shapesOnPlan = placed + roomsPlaced;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <PickPicture
          label={prepared ? m.chooseAnother : m.replacePlan}
          busy={busy !== null}
          onPicked={async (file) => {
            setError(null);
            setBusy("preparing");
            const p = await preparePlanFile(file);
            setBusy(null);
            if (!p) {
              setError(m.errors.unreadable);
              return;
            }
            setPrepared(p);
            // A different shape cannot carry the old shapes; nothing to keep is nothing to clear.
            setKeep(shapesOnPlan === 0 || Math.abs(p.width / p.height / (plan.width / plan.height) - 1) <= 0.02);
          }}
        />
      </div>
      {busy && <p role="status" className="text-muted">{busy === "preparing" ? m.preparing : m.uploading}</p>}
      {error && !prepared && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      {prepared && (
        <section aria-label={m.replaceHeading} className="flex flex-col gap-3 rounded-lg border border-primary bg-surface p-3">
          <h3 className="font-semibold text-foreground">{m.replaceHeading}</h3>
          <p className="text-muted">{m.replaceShows(placed, total, roomsPlaced)}</p>
          <div className="relative w-full max-w-3xl overflow-hidden rounded border border-border bg-white" style={{ aspectRatio: `${prepared.width} / ${prepared.height}` }}>
            <img src={prepared.url} alt={m.newPictureAlt} className="absolute inset-0 h-full w-full" />
            <svg viewBox={`0 0 100 ${planHeight(prepared.width, prepared.height)}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
              {overlay.map((o) => (
                <polygon
                  key={o.id}
                  points={pointsAttr(o.shape, prepared.width, prepared.height)}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className={keep ? "fill-success/20 stroke-success" : "fill-danger/10 stroke-danger"}
                  strokeDasharray={keep ? undefined : "6 4"}
                />
              ))}
            </svg>
          </div>
          <p className="text-muted">{m.pictureSize(prepared.width, prepared.height)}</p>
          {reshaped && shapesOnPlan > 0 && (
            <p role="alert" className="rounded border border-warning/40 bg-warning/10 p-2 text-foreground">
              {m.reshaped}
            </p>
          )}

          {shapesOnPlan > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-medium text-foreground">{m.shapesQuestion}</legend>
              <label className="flex min-h-11 items-start gap-2">
                <input type="radio" name={`shapes-${plan.id}`} checked={keep} onChange={() => setKeep(true)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="font-medium text-foreground">{m.keepShapes}</span>
                  <span className="block text-muted">{m.keepShapesHelp}</span>
                </span>
              </label>
              <label className="flex min-h-11 items-start gap-2">
                <input type="radio" name={`shapes-${plan.id}`} checked={!keep} onChange={() => setKeep(false)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="font-medium text-foreground">{m.clearShapes}</span>
                  <span className="block text-muted">{m.clearShapesHelp}</span>
                </span>
              </label>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-9"
              onClick={async () => {
                setBusy("uploading");
                setError(null);
                const r = await sendPlan(
                  prepared,
                  { mode: "replace", planId: plan.id, shapes: keep ? "keep" : "clear" },
                  { fileTooLarge: m.errors.tooLarge, processingFailed: m.errors.uploadFailed },
                );
                setBusy(null);
                if (!r.ok) setError(r.error);
                else {
                  setPrepared(null);
                  onReplaced(keep || shapesOnPlan === 0 ? m.replacedKept : m.replacedCleared);
                }
              }}
            >
              {m.saveReplace}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                setPrepared(null);
                setError(null);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-hover md:min-h-9"
            >
              {m.cancel}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
