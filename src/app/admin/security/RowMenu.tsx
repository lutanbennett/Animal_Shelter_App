"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type RowMenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "danger";
};

/**
 * The "…" menu on a person's row: the actions used now and then (edit name, temporary password, archive, delete).
 * Each item runs the same confirm and server action it always did; this only changes where the button lives.
 * On a phone the list opens as a full-width sheet at the foot of the screen.
 */
export function RowMenu({ items, label, disabled }: { items: RowMenuItem[]; label: string; disabled?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.admin.security.table.list.menu}: ${label}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-border p-1.5 text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="menu"
          className="fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-lg border border-border bg-background py-1 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 sm:w-64 sm:rounded-lg"
        >
          {items.map((item) => (
            <li key={item.key} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-hover ${
                  item.tone === "danger" ? "text-danger" : "text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
