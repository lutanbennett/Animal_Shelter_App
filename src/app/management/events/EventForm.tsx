"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { DateInput } from "@/components/DateInput";
import { EVENT_STATUSES, type EventFields } from "@/lib/events/form";
import { createEvent, saveEvent } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";
const hintClass = "text-xs text-muted";

/**
 * Create or edit a fundraising event: words, dates, place, status and the optional links to a campaign and a project
 * folder. Whoever sees this page holds events.run, the activity both actions ask. A cancelled event cannot be on the
 * website, so choosing Cancelled says it will come off.
 */
export function EventForm({
  mode,
  eventId,
  initial,
  published,
  appeals,
  projects,
  canSeeAppeals,
  canSeeProjects,
}: {
  mode: "new" | "edit";
  eventId?: string;
  initial: EventFields;
  published: boolean;
  appeals: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  /** Whether this login may read campaigns / project folders. False means the list above is short because of access, not because there is nothing to choose. */
  canSeeAppeals: boolean;
  canSeeProjects: boolean;
}) {
  const { t } = useI18n();
  const f = t.eventsAdmin.form;
  const router = useRouter();
  const [fields, setFields] = useState<EventFields>(initial);
  const [pending, startTransition] = useTransition();
  // One per action: a request id kept from an unknown save must never reach another action.
  const saveEventCall = useWriteCall();
  const createEventCall = useWriteCall();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof EventFields>(key: K, value: EventFields[K]) => {
    setSaved(false);
    setFields((p) => ({ ...p, [key]: value }));
  };

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      if (mode === "new") {
        const result = await createEventCall((requestId) => createEvent(fields, requestId));
        if (!result.ok) return setError(result.error);
        router.push(`/management/events/${result.id}`);
        return;
      }
      const result = await saveEventCall((requestId) => saveEvent(eventId!, fields, requestId));
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
        <legend className="px-1 text-base font-semibold text-foreground">{f.heading}</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-title" className={labelClass}>{f.title}</label>
          <input id="ev-title" required value={fields.title} onChange={(e) => set("title", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-summary" className={labelClass}>{f.summary}</label>
          <textarea id="ev-summary" rows={2} value={fields.summary} onChange={(e) => set("summary", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.summaryHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-description" className={labelClass}>{f.description}</label>
          <textarea id="ev-description" rows={6} value={fields.description} onChange={(e) => set("description", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-date" className={labelClass}>{f.date}</label>
            <DateInput id="ev-date" value={fields.eventDate} onChange={(e) => set("eventDate", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-end" className={labelClass}>{f.endDate}</label>
            <DateInput id="ev-end" value={fields.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputClass} />
            <span className={hintClass}>{f.endDateHint}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-location" className={labelClass}>{f.location}</label>
          <input id="ev-location" value={fields.location} onChange={(e) => set("location", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-status" className={labelClass}>{f.status}</label>
          <select id="ev-status" value={fields.status} onChange={(e) => set("status", e.target.value as EventFields["status"])} className={inputClass}>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>{t.eventsAdmin.status[s]}</option>
            ))}
          </select>
          {fields.status === "cancelled" && published && <span className={hintClass}>{f.cancelTakesOff}</span>}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.linksHeading}</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-appeal" className={labelClass}>{f.appeal}</label>
          <select id="ev-appeal" value={fields.appealId} onChange={(e) => set("appealId", e.target.value)} className={inputClass}>
            <option value="">{f.appealNone}</option>
            {appeals.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <span className={hintClass}>{f.appealHint}</span>
          {!canSeeAppeals && <span role="note" className={hintClass}>{f.appealNoAccess}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-project" className={labelClass}>{f.project}</label>
          <select id="ev-project" value={fields.projectFolderId} onChange={(e) => set("projectFolderId", e.target.value)} className={inputClass}>
            <option value="">{f.projectNone}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className={hintClass}>{f.projectHint}</span>
          {!canSeeProjects && <span role="note" className={hintClass}>{f.projectNoAccess}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ev-links" className={labelClass}>{f.links}</label>
          <textarea id="ev-links" rows={3} inputMode="url" value={fields.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} className={inputClass} placeholder="https://" />
          <span className={hintClass}>{f.linksHint}</span>
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
