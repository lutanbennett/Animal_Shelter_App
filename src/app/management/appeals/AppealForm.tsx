"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DateInput } from "@/components/DateInput";
import { parseBaht } from "@/lib/donations/donations";
import { APPEAL_STYLES, type AppealFields, type AppealStyle } from "@/lib/appeals/form";
import { AppealProgressDisplay } from "@/app/appeals/AppealProgressDisplay";
import { createAppeal, saveAppeal } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";
const hintClass = "text-xs text-muted";

/**
 * Create or edit an appeal's words, target, deadline, links and display style.
 * The style picker draws all three options live, filled to the appeal's real
 * figure (or an example 40% on a new appeal), so whoever writes it sees what
 * each looks like before choosing. The drawing is the public site's own
 * component, so the preview cannot drift from what visitors get.
 */
export function AppealForm({
  mode,
  appealId,
  initial,
  raised,
}: {
  mode: "new" | "edit";
  appealId?: string;
  initial: AppealFields;
  /** Baht raised so far; 0 on a new appeal. */
  raised: number;
}) {
  const { t, locale } = useI18n();
  const f = t.appealsAdmin.form;
  const router = useRouter();
  const [fields, setFields] = useState<AppealFields>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof AppealFields>(key: K, value: AppealFields[K]) => {
    setSaved(false);
    setFields((p) => ({ ...p, [key]: value }));
  };

  const target = parseBaht(fields.target) ?? 15000;
  const usingExample = raised <= 0;
  const shown = usingExample ? Math.round(target * 0.4) : raised;

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      if (mode === "new") {
        const result = await createAppeal(fields);
        if (!result.ok) return setError(result.error);
        router.push(`/management/appeals/${result.id}`);
        return;
      }
      const result = await saveAppeal(appealId!, fields);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.editHeading}</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="ap-title" className={labelClass}>{f.title}</label>
          <input id="ap-title" required value={fields.title} onChange={(e) => set("title", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.titleHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ap-wrong" className={labelClass}>{f.whatIsWrong}</label>
          <textarea id="ap-wrong" rows={4} value={fields.whatIsWrong} onChange={(e) => set("whatIsWrong", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.whatIsWrongHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ap-treatment" className={labelClass}>{f.treatment}</label>
          <textarea id="ap-treatment" rows={3} value={fields.treatmentNeeded} onChange={(e) => set("treatmentNeeded", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.treatmentHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ap-covers" className={labelClass}>{f.costCovers}</label>
          <textarea id="ap-covers" rows={2} value={fields.costCovers} onChange={(e) => set("costCovers", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.costCoversHint}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="ap-target" className={labelClass}>{f.target}</label>
            <input id="ap-target" required inputMode="decimal" value={fields.target} onChange={(e) => set("target", e.target.value)} className={`${inputClass} text-right`} />
            <span className={hintClass}>{f.targetHint}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="ap-deadline" className={labelClass}>{f.deadline}</label>
            <DateInput id="ap-deadline" value={fields.deadline} onChange={(e) => set("deadline", e.target.value)} className={inputClass} />
            <span className={hintClass}>{f.deadlineHint}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ap-links" className={labelClass}>{f.links}</label>
          <textarea id="ap-links" rows={3} inputMode="url" value={fields.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} className={inputClass} placeholder="https://" />
          <span className={hintClass}>{f.linksHint}</span>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.style}</legend>
        <span className={hintClass}>{f.styleHint}</span>
        <span className="text-sm text-muted">{usingExample ? f.previewExample : f.previewCurrent}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {APPEAL_STYLES.map((style: AppealStyle) => {
            const on = fields.displayStyle === style;
            return (
              <label
                key={style}
                className={`flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-3 ${on ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"}`}
              >
                <span className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground">
                  <input type="radio" name="ap-style" value={style} checked={on} onChange={() => set("displayStyle", style)} />
                  {f.styles[style]}
                </span>
                <div className="font-site rounded-xl border border-site-line bg-site-paper p-3 text-site-ink">
                  <AppealProgressDisplay style={style} raised={shown} target={target} locale={locale} t={t} />
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className={hintClass}>{f.thaiNote}</p>

      {error && (
        <p role="alert" className="rounded border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded border border-success/50 bg-success/10 px-3 py-2 text-sm text-success">
          {f.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {mode === "new" ? (pending ? f.creating : f.create) : pending ? f.saving : f.save}
      </button>
    </form>
  );
}
