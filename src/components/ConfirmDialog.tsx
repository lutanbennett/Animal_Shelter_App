"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * "Are you sure?" for an action that can't be taken back.
 *
 * Sibling of CapacityWarningDialog, which warns about a move that is still
 * ordinary work; this one is for the irreversible kind, so it spells out
 * what will happen in a list rather than a sentence and defaults to the
 * danger tone with the cancel button focused.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  consequences = [],
  confirmLabel,
  pendingLabel,
  pending = false,
  icon: Icon = TriangleAlert,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  /** Bullet list of what confirming will do. */
  consequences?: string[];
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  icon?: LucideIcon;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  const { t } = useI18n();
  if (!open || typeof document === "undefined") return null;

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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="flex w-full max-w-md flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-danger/15 p-2 text-danger">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <p id="confirm-dialog-body" className="text-sm text-muted">
              {body}
            </p>
            {consequences.length > 0 && (
              <ul className="ml-4 list-disc text-sm text-muted">
                {consequences.map((consequence) => (
                  <li key={consequence}>{consequence}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            autoFocus
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:brightness-110 disabled:opacity-50"
          >
            {pending ? (pendingLabel ?? t.common.saving) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
