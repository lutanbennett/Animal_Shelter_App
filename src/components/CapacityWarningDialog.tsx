"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { EnclosureOption } from "@/lib/enclosures/options";
import { capacityWarningLevel } from "./EnclosurePicker";

/**
 * "This enclosure is full — move anyway?" Shown before a move into an
 * enclosure that is at, over, or nearing capacity. It only warns; the move
 * is still allowed on confirm, because the person on the ground knows
 * whether the residents can share.
 */
export function CapacityWarningDialog({
  enclosure,
  pending = false,
  onCancel,
  onConfirm,
}: {
  /** The enclosure being moved into; null hides the dialog. */
  enclosure: EnclosureOption | null;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const w = t.residents.move.warning;

  useEffect(() => {
    if (!enclosure) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enclosure, onCancel]);

  if (!enclosure || typeof document === "undefined") return null;
  const level = capacityWarningLevel(enclosure);
  if (!level) return null;
  const capacity = enclosure.capacity ?? 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="capacity-warning-title"
        aria-describedby="capacity-warning-body"
        className="flex w-full max-w-md flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 rounded-full p-2 ${
              level === "over"
                ? "bg-danger/15 text-danger"
                : "bg-primary/15 text-primary"
            }`}
          >
            <TriangleAlert aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h2
              id="capacity-warning-title"
              className="text-lg font-semibold text-foreground"
            >
              {w.title[level]}
            </h2>
            <p id="capacity-warning-body" className="text-sm text-muted">
              {w.body(
                enclosure.name,
                t.enclosures.occupancy(enclosure.residentCount, capacity),
                t.enclosures.occupancy(enclosure.residentCount + 1, capacity),
              )}
            </p>
            <p className="text-sm text-muted">{w.question}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? t.common.saving : w.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
