"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type PageAccordionItem = {
  slug: string;
  label: string;
  publicPath: string;
  updatedAt: string;
  /** A Thai translation exists but is still empty. */
  thaiMissing: boolean;
  editor: ReactNode;
};

/**
 * One row per information page; its editor opens in a popup (a native modal
 * <dialog>, full screen on a phone). A new page just adds an item. #<slug>
 * (or #page-<slug>) in the address opens that page's popup, on load and
 * whenever the hash changes, and opening one puts its slug in the address so
 * the link can be shared. Closing with unsaved typing asks first.
 *
 * `canEdit` is the same check updateSitePage asks (website.content, edit):
 * without it the row is shown but offers no Edit button and a #slug opens nothing.
 */
export function PagesAccordion({ items, canEdit }: { items: PageAccordionItem[]; canEdit: boolean }) {
  const { t, locale } = useI18n();
  const p = t.admin.website.pages;
  const [open, setOpen] = useState<string | null>(null);
  const dirty = useRef(false);
  // Bumped when unsaved typing is thrown away, so the editor remounts from the saved page.
  const [epoch, setEpoch] = useState<Record<string, number>>({});

  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1)).replace(/^page-/, "");
      if (!canEdit || !items.some((i) => i.slug === slug)) return;
      setOpen(slug);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items, canEdit]);

  const show = (slug: string) => {
    setOpen(slug);
    const url = new URL(window.location.href);
    url.hash = slug;
    window.history.replaceState(null, "", url);
  };

  const setDirty = useCallback((v: boolean) => {
    dirty.current = v;
  }, []);

  const close = useCallback(() => {
    if (dirty.current && !window.confirm(p.discardConfirm)) return false;
    if (dirty.current && open) setEpoch((e) => ({ ...e, [open]: (e[open] ?? 0) + 1 }));
    dirty.current = false;
    setOpen(null);
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
    return true;
  }, [p.discardConfirm, open]);

  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
  });

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.slug}
          id={`page-${item.slug}`}
          className="scroll-mt-4 rounded border border-border bg-surface"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-base font-semibold text-foreground">{item.label}</span>
              {item.thaiMissing && (
                <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                  {p.thaiMissing}
                </span>
              )}
            </div>
            <span className="text-xs text-muted">
              {p.lastEdited(fmt.format(new Date(item.updatedAt)))}
            </span>
            <Link
              href={item.publicPath}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t.admin.website.published.view}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
            {canEdit && (
              <button
                type="button"
                onClick={() => show(item.slug)}
                className="inline-flex min-h-11 items-center gap-1 rounded border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-surface md:min-h-9"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                {p.edit}
                <span className="sr-only"> {item.label}</span>
              </button>
            )}
          </div>
          {canEdit && (
            <PageDialog
              item={item}
              isOpen={open === item.slug}
              epoch={epoch[item.slug] ?? 0}
              onDirty={setDirty}
              onClose={close}
              title={p.editTitle(item.label)}
              closeLabel={p.closeEditor}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * The editor stays mounted while the popup is closed, so nothing is lost by
 * closing it and the translation panels keep their state. Typing anywhere in
 * it marks it dirty; the "saved" message (data-save-ok) clears that.
 */
function PageDialog({
  item,
  isOpen,
  epoch,
  onDirty,
  onClose,
  title,
  closeLabel,
}: {
  item: PageAccordionItem;
  isOpen: boolean;
  epoch: number;
  onDirty: (dirty: boolean) => void;
  onClose: () => boolean;
  title: string;
  closeLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  useEffect(() => {
    const d = ref.current;
    if (!d || !isOpen) return;
    const watch = new MutationObserver(() => {
      if (d.querySelector("[data-save-ok]")) onDirty(false);
    });
    watch.observe(d, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [isOpen, onDirty]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onInput={() => {
        onDirty(true);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-background p-0 text-foreground backdrop:bg-black/50 md:m-auto md:h-auto md:max-h-[92vh] md:w-[min(56rem,94vw)] md:rounded-lg md:border md:border-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border md:min-h-9 md:min-w-9"
          aria-label={closeLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div key={epoch} id={`page-${item.slug}-editor`} className="overflow-y-auto px-4 py-4">
        {item.editor}
      </div>
    </dialog>
  );
}
