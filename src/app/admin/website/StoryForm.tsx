"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { updateSiteContent } from "./actions";

export type SiteContentRow = {
  tagline: string;
  story_heading: string;
  story_body: string;
  contact_email: string | null;
  contact_address: string | null;
};

export function StoryForm({ content }: { content: SiteContentRow }) {
  const [state, formAction, pending] = useActionState(
    updateSiteContent,
    undefined,
  );
  const { t } = useI18n();

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="tagline" className="text-sm font-medium text-muted">
          {t.admin.website.story.tagline}
        </label>
        <p className="text-xs text-muted">{t.admin.website.story.taglineHint}</p>
        <input
          id="tagline"
          name="tagline"
          defaultValue={content.tagline}
          className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="story_heading"
          className="text-sm font-medium text-muted"
        >
          {t.admin.website.story.storyHeading}
        </label>
        <input
          id="story_heading"
          name="story_heading"
          defaultValue={content.story_heading}
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="story_body" className="text-sm font-medium text-muted">
          {t.admin.website.story.story}
        </label>
        <p className="text-xs text-muted">{t.admin.website.story.storyHint}</p>
        <textarea
          id="story_body"
          name="story_body"
          defaultValue={content.story_body}
          rows={10}
          className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="contact_email"
            className="text-sm font-medium text-muted"
          >
            {t.admin.website.story.contactEmail}
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={content.contact_email ?? ""}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="contact_address"
            className="text-sm font-medium text-muted"
          >
            {t.admin.website.story.contactAddress}
          </label>
          <input
            id="contact_address"
            name="contact_address"
            defaultValue={content.contact_address ?? ""}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>
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
