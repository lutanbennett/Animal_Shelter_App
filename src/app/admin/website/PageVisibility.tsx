"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  hiddenPagesOf,
  isPageHidden,
  pageEntry,
  PUBLIC_MENU_GROUPS,
  PUBLIC_PAGES,
  sectionEntry,
  type PublicPage,
} from "@/lib/public-pages";
import { setPublicPageHidden } from "./actions";

/**
 * Settings → Website → Pages: which public pages are on. Each page and each menu section has a
 * Show / Hide switch and says in words what a visitor will then see. Home and Privacy are listed
 * as always on, with no switch. The record is hidden_public_pages (0256); the save is
 * setPublicPageHidden.
 */
export function PageVisibility({ hiddenPages }: { hiddenPages: string[] }) {
  const { t } = useI18n();
  const v = t.admin.website.visibility;
  const hidden = hiddenPagesOf(hiddenPages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(entry: string, hide: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setPublicPageHidden(entry, hide);
      if (!result.ok && "error" in result) setError(result.error);
    });
  }

  const nameOf = (page: PublicPage) => (page.menu?.label ?? page.label)(t);
  const groups = PUBLIC_MENU_GROUPS.map((group) => ({
    key: group.key,
    label: group.label(t),
    pages: PUBLIC_PAGES.filter((p) => p.menu?.group === group.key),
  }));
  const ungrouped = PUBLIC_PAGES.filter((p) => !p.neverHidden && p.menu && !p.menu.group);
  const alwaysOn = PUBLIC_PAGES.filter((p) => p.neverHidden);

  function PageRow({ page }: { page: PublicPage }) {
    const own = hidden.has(pageEntry(page.key));
    const effective = isPageHidden(page.key, hidden);
    const bySection = effective && !own;
    return (
      <li className="flex flex-col gap-1 rounded border border-border bg-background p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto font-medium text-foreground">
            {nameOf(page)} <span className="text-sm font-normal text-muted">{page.href}</span>
          </span>
          <span
            className={`rounded px-2 py-1 text-xs font-medium text-foreground ${effective ? "bg-warning/15" : "bg-success/15"}`}
          >
            {bySection ? v.hiddenBySection : effective ? v.hidden : v.shown}
          </span>
          <ActionButton
            compact
            icon={own ? ACTION_ICONS.publish : ACTION_ICONS.unpublish}
            disabled={pending}
            onClick={() => toggle(pageEntry(page.key), !own)}
          >
            {own ? v.show : v.hide}
          </ActionButton>
        </div>
        <p className="text-sm text-muted">{bySection ? v.pageHiddenBySectionNote : effective ? v.pageHiddenNote : v.pageShownNote}</p>
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
              <ActionButton
                compact
                icon={sectionHidden ? ACTION_ICONS.publish : ACTION_ICONS.unpublish}
                disabled={pending}
                onClick={() => toggle(sectionEntry(group.key), !sectionHidden)}
              >
                {sectionHidden ? v.show : v.hide}
              </ActionButton>
            </div>
            <p className="text-sm text-muted">{sectionHidden ? v.sectionHiddenNote : v.sectionShownNote}</p>
            <ul className="flex flex-col gap-2">
              {group.pages.map((page) => (
                <PageRow key={page.key} page={page} />
              ))}
            </ul>
          </div>
        );
      })}

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{v.otherPages}</h3>
        <ul className="flex flex-col gap-2">
          {ungrouped.map((page) => (
            <PageRow key={page.key} page={page} />
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{v.alwaysOn}</h3>
        <p className="text-sm text-muted">{v.homeNote}</p>
        <ul className="flex flex-wrap gap-2 text-sm text-foreground">
          {alwaysOn.map((page) => (
            <li key={page.key} className="rounded border border-border bg-background px-3 py-1">
              {nameOf(page)} <span className="text-muted">{page.href}</span>
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
