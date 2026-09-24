"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SiteContent } from "@/lib/site/content";
import {
  checkFacebookUrl,
  checkInstagramUrl,
  FACEBOOK_HOSTS,
  INSTAGRAM_HOSTS,
  linkErrorText,
} from "@/lib/links/validate";
import { updateSiteContent } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * The short labels and contact details on site_content: each label has
 * its English and Thai side by side (paired columns, 0059), the contact
 * ways are language-neutral. The long-form pages are SitePageForm.
 */
export function SiteSettingsForm({ content }: { content: SiteContent }) {
  const [state, formAction, pending] = useActionState(updateSiteContent, undefined);
  const { t } = useI18n();
  const s = t.admin.website.settings;

  // The social links are checked as they are typed, with the same rule
  // the action applies, and kept in state so a refused save doesn't
  // clear what was pasted (React resets a form's uncontrolled fields).
  const [facebookUrl, setFacebookUrl] = useState(content.facebook_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(content.instagram_url ?? "");
  const facebookError = linkErrorText(t.linkErrors, checkFacebookUrl(facebookUrl), FACEBOOK_HOSTS);
  const instagramError = linkErrorText(
    t.linkErrors,
    checkInstagramUrl(instagramUrl),
    INSTAGRAM_HOSTS,
  );

  function socialLink(
    name: "facebook_url" | "instagram_url",
    label: string,
    hint: string,
    value: string,
    setValue: (value: string) => void,
    error: string | null,
    placeholder: string,
  ) {
    const hintId = `${name}-hint`;
    return (
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {label}
        {/* Not type="url": the browser's own check would refuse a bare
            "facebook.com/…" that the validator accepts, and speak over
            its messages with one of its own. */}
        <input
          name={name}
          inputMode="url"
          autoComplete="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          className={inputClass}
        />
        {error ? (
          <span id={hintId} className="text-xs font-normal text-danger">
            {error}
          </span>
        ) : (
          <span id={hintId} className="text-xs font-normal">
            {hint}
          </span>
        )}
      </label>
    );
  }

  function pair(
    name: keyof SiteContent & string,
    label: string,
    hint?: string,
    rows?: number,
  ) {
    const thName = `${name}_th` as keyof SiteContent & string;
    const Field = rows ? "textarea" : "input";
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted">{label}</span>
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t.translations.language.en}
            <Field
              name={name}
              defaultValue={(content[name] as string | null) ?? ""}
              rows={rows}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t.translations.language.th}
            <Field
              name={thName}
              lang="th"
              defaultValue={(content[thName] as string | null) ?? ""}
              rows={rows}
              className={inputClass}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded border border-border bg-surface p-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">{s.heading}</h2>
        <p className="text-sm text-muted">{s.subtitle}</p>
      </div>

      {pair("tagline", s.tagline, s.taglineHint)}
      {pair("hero_alt", s.heroAlt, s.heroAltHint)}
      {pair("visiting_hours", s.visitingHours, s.visitingHoursHint, 3)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.contactEmail}
          <input
            name="contact_email"
            type="email"
            defaultValue={content.contact_email ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.contactPhone}
          <input
            name="contact_phone"
            type="tel"
            defaultValue={content.contact_phone ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.contactLine}
          <input
            name="contact_line"
            defaultValue={content.contact_line ?? ""}
            placeholder="@lannacare"
            className={inputClass}
          />
          <span className="text-xs font-normal">{s.contactLineHint}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.contactAddress}
          <input
            name="contact_address"
            defaultValue={content.contact_address ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted sm:col-span-2">
          {s.contactMapUrl}
          <input
            name="contact_map_url"
            type="url"
            defaultValue={content.contact_map_url ?? ""}
            placeholder="https://maps.app.goo.gl/…"
            className={inputClass}
          />
          <span className="text-xs font-normal">{s.contactMapUrlHint}</span>
        </label>
        {socialLink(
          "facebook_url",
          s.facebookUrl,
          s.facebookUrlHint,
          facebookUrl,
          setFacebookUrl,
          facebookError,
          "https://www.facebook.com/…",
        )}
        {socialLink(
          "instagram_url",
          s.instagramUrl,
          s.instagramUrlHint,
          instagramUrl,
          setInstagramUrl,
          instagramError,
          "https://www.instagram.com/…",
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || Boolean(facebookError || instagramError)}
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
