"use client";

import { useRef, useState } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useKeptForm } from "@/lib/use-kept-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TranslationPanel } from "@/components/TranslationPanel";
import type { SitePageSlug } from "@/lib/site/pages";
import type { TranslationRow } from "@/lib/translations/types";
import { updateSitePage } from "./actions";
import { BodyToolbar } from "@/components/BodyToolbar";
import { SitePagePreview, type PagePreviewContext } from "./SitePagePreview";

export type SitePageRow = {
  id: string;
  slug: SitePageSlug;
  title: string;
  body: string;
  updated_at: string;
};

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * One site_pages row: its title and body as the admin wrote them, with
 * the other language's translation panel under each (0059) — so the
 * manager's queue and this page are the same editor, as on a resident.
 * Saving re-queues the translations through the trigger; the panels
 * remount on the refreshed rows.
 *
 * The panel carries its own <form>, and forms can't nest, so the page
 * form element holds only the save button and the inputs point at it
 * with `form=` — the panels then sit between the fields as siblings.
 */
export function SitePageForm({
  page,
  translations,
  canManageTranslations,
  starterBody,
  previewContext,
}: {
  page: SitePageRow;
  translations: { title?: TranslationRow; body?: TranslationRow };
  canManageTranslations: boolean;
  /**
   * The standard text the public page shows while the body is empty
   * (sitePageStarter), put in the box so the admin edits it rather than
   * starting from nothing. It is saved only when they save.
   */
  starterBody?: string;
  /** What the live preview needs besides the typed text (read on the server). */
  previewContext: PagePreviewContext;
}) {
  const [state, onSubmit, pending] = useKeptForm(
    updateSitePage.bind(null, page.slug),
    undefined,
  );
  const { t } = useI18n();
  const p = t.admin.website.pages;
  const formId = `page-${page.slug}-form`;
  const showStarter = !page.body && Boolean(starterBody);
  const body = showStarter ? starterBody! : page.body;
  const [draft, setDraft] = useState(body);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [titleDraft, setTitleDraft] = useState(page.title);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">{p.where[page.slug]}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${page.slug}-title`} className="text-sm font-medium text-muted">
          {p.title}
        </label>
        <input
          id={`${page.slug}-title`}
          name="title"
          form={formId}
          required
          defaultValue={page.title}
          onChange={(e) => setTitleDraft(e.target.value)}
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
        <p className="text-xs text-muted">{p.marks.hint}</p>
        <BodyToolbar target={bodyRef} />
        {showStarter && <p className="text-xs font-medium text-warning">{p.starterNote}</p>}
        <textarea
          id={`${page.slug}-body`}
          ref={bodyRef}
          name="body"
          form={formId}
          rows={Math.min(24, Math.max(8, body.split("\n").length + 2))}
          defaultValue={body}
          onChange={(e) => setDraft(e.target.value)}
          className={inputClass}
        />
        <details className="rounded border border-border px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-muted">{p.preview}</summary>
          <p className="mb-2 mt-1 text-xs text-muted">{p.previewHint}</p>
          <SitePagePreview slug={page.slug} title={titleDraft} body={draft} context={previewContext} />
        </details>
        {translations.body && (
          <TranslationPanel
            key={translations.body.id + translations.body.updated_at}
            row={translations.body}
            canManage={canManageTranslations}
            recordPath="/admin/website"
            pageBody
          />
        )}
      </div>

      <form id={formId} onSubmit={onSubmit} className="flex items-center gap-3">
        <ActionButton type="submit" icon={ACTION_ICONS.save} variant="primary" disabled={pending}>
          {pending ? t.common.saving : t.common.saveChanges}
        </ActionButton>
        {state && !state.ok && (
          <p className="text-sm text-danger">{state.error}</p>
        )}
        {state && state.ok && (
          <p data-save-ok className="text-sm text-success">{state.success}</p>
        )}
      </form>
    </div>
  );
}
