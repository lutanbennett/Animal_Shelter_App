"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * A pop-up for the Security page: a title, a close button and whatever the caller puts inside. Escape and a click
 * on the dark backdrop close it. Full width on a phone, a centred card on a PC.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto rounded-t-lg border border-border bg-background p-5 shadow-xl sm:max-w-md sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.admin.security.table.list.close}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
