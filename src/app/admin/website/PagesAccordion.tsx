"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
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
 * One row per information page, one editor open at a time. A new page just
 * adds an item. #<slug> (or #page-<slug>) in the address opens that row and
 * scrolls to it, on load and whenever the hash changes; opening a row puts
 * its slug in the address so the link can be shared.
 */
export function PagesAccordion({ items }: { items: PageAccordionItem[] }) {
  const { t, locale } = useI18n();
  const p = t.admin.website.pages;
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1)).replace(/^page-/, "");
      if (!items.some((i) => i.slug === slug)) return;
      setOpen(slug);
      requestAnimationFrame(() =>
        document.getElementById(`page-${slug}`)?.scrollIntoView({ block: "start" }),
      );
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items]);

  const toggle = (slug: string) => {
    const next = open === slug ? null : slug;
    setOpen(next);
    const url = new URL(window.location.href);
    url.hash = next ?? "";
    window.history.replaceState(null, "", url);
  };

  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
  });

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const isOpen = open === item.slug;
        return (
          <div
            key={item.slug}
            id={`page-${item.slug}`}
            className="scroll-mt-4 rounded border border-border bg-surface"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`page-${item.slug}-editor`}
                onClick={() => toggle(item.slug)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  aria-hidden
                />
                <span className="text-base font-semibold text-foreground">{item.label}</span>
                {item.thaiMissing && (
                  <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                    {p.thaiMissing}
                  </span>
                )}
              </button>
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
            </div>
            {/* Kept mounted while closed so a half-typed edit survives a collapse. */}
            <div id={`page-${item.slug}-editor`} hidden={!isOpen} className="px-4 pb-4">
              {item.editor}
            </div>
          </div>
        );
      })}
    </div>
  );
}
