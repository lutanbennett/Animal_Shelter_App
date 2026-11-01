"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  hiddenPagesOf,
  isPageHidden,
  pageEntry,
  PUBLIC_MENU_GROUPS,
  PUBLIC_PAGES,
  sectionEntry,
  type PublicPage,
} from "@/lib/public-pages";
import { isSitePageSlug } from "@/lib/site/pages";
import { useState, useTransition } from "react";
import { setPublicPageHidden } from "./actions";

/** What the card shows about a page whose wording is edited: when, and whether Thai is waiting. */
export type PageEditorMeta = { updatedAt: string; thaiMissing: boolean };

/**
 * Settings → Website → Pages: one card per public page, carrying everything that used to be
 * spread down three stacked lists — the page's name, when it was last edited, whether its Thai
 * is still empty, its Show / Hide switch, and Edit, which opens the page's own edit page.
 * (The Show / Hide list and the four page photos were above the editor, so the main job on the
 * screen was the furthest down it.)
 *
 * The two lists behind it do not match and neither is dropped: every public page in PUBLIC_PAGES
 * gets a card, a page whose wording is written in the app also gets Edit (`page.editor`), and a
 * page built from what is entered elsewhere — Appeals, Shop, Desexing, Our work — gets only its
 * switch. Home and Privacy are always on, so they have no switch; Home still has Edit, because
 * Our story is a section of it. The three menu sections are the headings the cards are grouped
 * under, each with its own switch, so hiding a section hides its pages and each card says so.
 *
 * `canEdit` is website.content, the activity updateSitePage and setPublicPageHidden both ask
 * (actions.ts). Without it a card is shown with neither Edit nor a switch, and an old #slug link
 * opens nothing.
 */
export function PageCards({
  hiddenPages,
  editors,
  canEdit,
}: {
  hiddenPages: string[];
  /** By site page slug: what that page's editor has to say on the card. */
  editors: Record<string, PageEditorMeta>;
  canEdit: boolean;
}) {
  const { t, locale } = useI18n();
  const v = t.admin.website.visibility;
  const p = t.admin.website.pages;
  const router = useRouter();
  const hidden = hiddenPagesOf(hiddenPages);
  const [pending, startTransition] = useTransition();
  const saveHidden = useWriteCall();
  const [error, setError] = useState<string | null>(null);

  // The editor used to open in a popup on this tab, so a shared link was #<slug> (or the older
  // #page-<slug>). It is a page of its own now: send those links on to it, on load and whenever
  // the hash changes, so a link someone saved still lands on the page they meant.
  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1)).replace(/^page-/, "");
      if (!canEdit || !slug || !isSitePageSlug(slug)) return;
      router.replace(`/admin/website/pages/${slug}`);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [canEdit, router]);

  function toggle(entry: string, hide: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await saveHidden((requestId) => setPublicPageHidden(entry, hide, requestId));
      if (!result.ok && "error" in result) setError(result.error);
    });
  }

  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium" });
  const nameOf = (page: PublicPage) => (page.menu?.label ?? page.label)(t);

  const groups = PUBLIC_MENU_GROUPS.map((group) => ({
    key: group.key,
    label: group.label(t),
    pages: PUBLIC_PAGES.filter((pg) => pg.menu?.group === group.key),
  }));
  const ungrouped = PUBLIC_PAGES.filter((pg) => !pg.neverHidden && pg.menu && !pg.menu.group);
  const alwaysOn = PUBLIC_PAGES.filter((pg) => pg.neverHidden);

  function PageCard({ page }: { page: PublicPage }) {
    const own = hidden.has(pageEntry(page.key));
    const effective = isPageHidden(page.key, hidden);
    const bySection = effective && !own;
    const meta = page.editor ? editors[page.editor] : undefined;

    return (
      <li className="flex flex-col gap-2 rounded border border-border bg-background p-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="mr-auto flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{nameOf(page)}</span>
            <span className="text-sm text-muted">{page.href}</span>
            {meta?.thaiMissing && (
              <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                {p.thaiMissing}
              </span>
            )}
          </span>

          {page.neverHidden ? (
            <span className="rounded bg-success/15 px-2 py-1 text-xs font-medium text-foreground">
              {v.alwaysOn}
            </span>
          ) : (
            <span
              className={`rounded px-2 py-1 text-xs font-medium text-foreground ${effective ? "bg-warning/15" : "bg-success/15"}`}
            >
              {bySection ? v.hiddenBySection : effective ? v.hidden : v.shown}
            </span>
          )}

          <Link
            href={page.href}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t.admin.website.published.view}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>

          {/* setPublicPageHidden asks website.content; Home and Privacy have no switch at all. */}
          {canEdit && !page.neverHidden && (
            <ActionButton
              compact
              icon={own ? ACTION_ICONS.publish : ACTION_ICONS.unpublish}
              disabled={pending}
              onClick={() => toggle(pageEntry(page.key), !own)}
            >
              {own ? v.show : v.hide}
              <span className="sr-only"> {nameOf(page)}</span>
            </ActionButton>
          )}

          {/* updateSitePage asks website.content, and only a page whose words live in the app has an editor. */}
          {canEdit && page.editor && (
            <Link
              href={`/admin/website/pages/${page.editor}`}
              className="inline-flex min-h-11 items-center gap-1 rounded border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-background md:min-h-9"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {p.edit}
              <span className="sr-only"> {nameOf(page)}</span>
            </Link>
          )}
        </div>

        <p className="text-sm text-muted">
          {page.neverHidden
            ? v.pageShownNote
            : bySection
              ? v.pageHiddenBySectionNote
              : effective
                ? v.pageHiddenNote
                : v.pageShownNote}
          {meta && ` ${p.lastEdited(fmt.format(new Date(meta.updatedAt)))}`}
        </p>
      </li>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{v.heading}</h2>
        <p className="text-sm text-muted">{v.subtitle}</p>
        <p className="text-sm font-medium text-foreground">{v.delay}</p>
      </div>

      {groups.map((group) => {
        const sectionHidden = hidden.has(sectionEntry(group.key));
        return (
          <div key={group.key} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-auto text-base font-semibold text-foreground">
                {v.sectionAll}: {group.label}
              </h3>
              <span
                className={`rounded px-2 py-1 text-xs font-medium text-foreground ${sectionHidden ? "bg-warning/15" : "bg-success/15"}`}
              >
                {sectionHidden ? v.hidden : v.shown}
              </span>
              {canEdit && (
                <ActionButton
                  compact
                  icon={sectionHidden ? ACTION_ICONS.publish : ACTION_ICONS.unpublish}
                  disabled={pending}
                  onClick={() => toggle(sectionEntry(group.key), !sectionHidden)}
                >
                  {sectionHidden ? v.show : v.hide}
                  <span className="sr-only"> {group.label}</span>
                </ActionButton>
              )}
            </div>
            <p className="text-sm text-muted">
              {sectionHidden ? v.sectionHiddenNote : v.sectionShownNote}
            </p>
            <ul className="flex flex-col gap-2">
              {group.pages.map((page) => (
                <PageCard key={page.key} page={page} />
              ))}
            </ul>
          </div>
        );
      })}

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{v.otherPages}</h3>
        <ul className="flex flex-col gap-2">
          {ungrouped.map((page) => (
            <PageCard key={page.key} page={page} />
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{v.alwaysOn}</h3>
        <p className="text-sm text-muted">{v.homeNote}</p>
        <ul className="flex flex-col gap-2">
          {alwaysOn.map((page) => (
            <PageCard key={page.key} page={page} />
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
