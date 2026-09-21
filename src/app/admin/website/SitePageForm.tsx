"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TranslationPanel } from "@/components/TranslationPanel";
import type { SitePageSlug } from "@/lib/site/pages";
import type { TranslationRow } from "@/lib/translations/types";
import { updateSitePage } from "./actions";

export type SitePageRow = {
  id: string;
  slug: SitePageSlug;
  title: string;
  body: string;
};

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One site_pages row: its title and body as the admin wrote them, with
 * the other language's translation panel under each (0059) — so the
 * manager's queue and this page are the same editor, as on a resident.
 * Saving re-queues the translations through the trigger; the panels
 * remount on the refreshed rows.
 */
export function SitePageForm({
  page,
  translations,
  canManageTranslations,
  publicPath,
}: {
  page: SitePageRow;
  translations: { title?: TranslationRow; body?: TranslationRow };
  canManageTranslations: boolean;
  /** Where the page shows on the site — a route, or a section anchor. */
  publicPath: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateSitePage.bind(null, page.slug),
    undefined,
  );
  const { t } = useI18n();
  const p = t.admin.website.pages;
  const label = p.slugs[page.slug];

  return (
    <form
      id={`page-${page.slug}`}
      action={formAction}
      className="flex scroll-mt-4 flex-col gap-4 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-muted">{p.where[page.slug]}</p>
        </div>
        <Link
          href={publicPath}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t.admin.website.published.view}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${page.slug}-title`} className="text-sm font-medium text-muted">
          {p.title}
        </label>
        <input
          id={`${page.slug}-title`}
          name="title"
          required
          defaultValue={page.title}
          className={`${inputClass} sm:w-96`}
        />
        {translations.title && (
          <TranslationPanel
            key={translations.title.id + translations.title.updated_at}
            row={translations.title}
            canManage={canManageTranslations}
            recordPath="/admin/website"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${page.slug}-body`} className="text-sm font-medium text-muted">
          {p.body}
        </label>
        <p className="text-xs text-muted">{p.bodyHint}</p>
        <textarea
          id={`${page.slug}-body`}
          name="body"
          rows={Math.min(24, Math.max(8, page.body.split("\n").length + 2))}
          defaultValue={page.body}
          className={inputClass}
        />
        {translations.body && (
          <TranslationPanel
            key={translations.body.id + translations.body.updated_at}
            row={translations.body}
            canManage={canManageTranslations}
            recordPath="/admin/website"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : t.common.saveChanges}
        </button>
        {state && "error" in state && (
          <p className="text-sm text-danger">{state.error}</p>
        )}
        {state && "success" in state && (
          <p className="text-sm text-success">{state.success}</p>
        )}
      </div>
    </form>
  );
}
