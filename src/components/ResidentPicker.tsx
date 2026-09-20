"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { statusLabel } from "@/lib/i18n/enum-labels";

export type ResidentOption = {
  id: string;
  name: string;
  thai_name: string | null;
  current_status: string | null;
};

function residentLabel(r: ResidentOption) {
  return r.thai_name ? `${r.name} (${r.thai_name})` : r.name;
}

/**
 * Modal multi-select for residents. Renders as chips + an "Add" trigger
 * rather than an inline list, since the full resident list (300+ at
 * production scale) is too long to embed directly in a form. Reusable
 * across any form that needs to attach one or more residents (vet visits,
 * immunizations, procedures, weight logs, ...).
 *
 * `single` turns it into a one-resident chooser (radio rows, picking one
 * replaces the previous choice) for places that want exactly one resident,
 * such as the home page's featured resident.
 */
export function ResidentPicker({
  residents,
  selectedIds,
  onChange,
  triggerLabel,
  single = false,
}: {
  residents: ResidentOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  triggerLabel?: string;
  single?: boolean;
}) {
  const { t } = useI18n();
  const resolvedTriggerLabel = triggerLabel ?? t.residents.picker.selectResidents;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set(selectedIds));
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedResidents = useMemo(
    () => residents.filter((r) => selectedIds.includes(r.id)),
    [residents, selectedIds],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residents;
    return residents.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.thai_name?.toLowerCase().includes(term),
    );
  }, [residents, search]);

  function openPicker() {
    setPending(new Set(selectedIds));
    setSearch("");
    setOpen(true);
  }

  function toggle(id: string) {
    setPending((prev) => {
      if (single) return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    onChange([...pending]);
    setOpen(false);
  }

  function removeSelected(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {selectedResidents.map((r) => (
          <span
            key={r.id}
            className="flex items-center gap-1.5 rounded-full bg-surface-hover px-3 py-1 text-sm text-foreground"
          >
            {residentLabel(r)}
            <button
              type="button"
              onClick={() => removeSelected(r.id)}
              aria-label={t.residents.picker.removeAriaLabel(residentLabel(r))}
              className="text-muted hover:text-danger"
            >
              &times;
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={openPicker}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {selectedResidents.length === 0
            ? resolvedTriggerLabel
            : single
              ? t.common.change
              : t.common.addMore}
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="flex max-h-[80vh] w-full max-w-lg flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {single
                    ? resolvedTriggerLabel
                    : t.residents.picker.selectResidents}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.residents.picker.close}
                  className="text-muted hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              <input
                ref={searchRef}
                type="search"
                placeholder={t.residents.picker.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
              />

              {!single && (
                <p className="text-xs text-muted">
                  {t.residents.picker.selectedCount(pending.size)}
                </p>
              )}

              <div className="flex-1 overflow-y-auto rounded border border-border">
                {filtered.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-surface-hover"
                  >
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={single ? "resident-picker-choice" : undefined}
                      checked={pending.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex-1 text-foreground">
                      {residentLabel(r)}
                    </span>
                    {r.current_status && (
                      <span className="text-xs text-muted">
                        {statusLabel(t, r.current_status)}
                      </span>
                    )}
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-muted">
                    {t.residents.picker.noMatches}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  {single
                    ? t.common.done
                    : t.residents.picker.done(pending.size)}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
