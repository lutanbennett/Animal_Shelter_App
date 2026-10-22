import Image from "next/image";
import { PawPrint } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ConfirmItem } from "@/lib/clinics/calendar-import";
import type { ClinicRef, ResidentRef } from "@/lib/clinics/calendar-import-match";
import { driveImageUrl } from "@/lib/google/drive-client";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";
import { confirmCalendarEntry, dismissCalendarEntry } from "./confirm-actions";
import { shelterTime } from "@/lib/clinics/shelter-visits";

/**
 * "Calendar entries to confirm": entries typed into the shelter calendar that did not read as one clear
 * visit. Plain forms, no client code: one tap on Create visit books it, Dismiss hides it. Nothing is chosen
 * for the person except a single close candidate, which is shown and still needs the tap.
 */
export function ConfirmList({
  t,
  locale,
  items,
  clinics,
  liveResidents,
  photos,
}: {
  t: Dictionary;
  locale: Locale;
  items: ConfirmItem[];
  clinics: ClinicRef[];
  liveResidents: ResidentRef[];
  photos: Record<string, string | null>;
}) {
  const c = t.shelterVisits.confirm;
  if (items.length === 0) return null;
  const sorted = [...clinics].sort((a, b) => a.name.localeCompare(b.name));
  const everyone = [...liveResidents].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section aria-labelledby="calendar-confirm" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <h2 id="calendar-confirm" className="text-lg font-semibold text-foreground">
          {c.title} <span className="text-sm font-normal text-muted">({c.count(items.length)})</span>
        </h2>
        <p className="text-sm text-muted">{c.intro}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((it) => {
          const d = it.decision;
          const when = it.start ? (it.allDay ? `${formatDate(it.start, locale)} · ${c.allDay}` : `${formatDate(it.start, locale)} · ${shelterTime(it.start)}`) : "";
          return (
            <li key={it.eventId} className="flex flex-col gap-2 rounded-md border border-border p-3">
              <p className="font-medium text-foreground break-words">{it.title || "—"}</p>
              <p className="text-sm text-muted">{when}</p>
              <p className="text-sm text-danger">{c.reasons[d.reason]}</p>
              <form action={confirmCalendarEntry} className="flex flex-col gap-3">
                <input type="hidden" name="eventId" value={it.eventId} />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">{c.clinic}</span>
                  <select name="clinicId" required defaultValue={d.clinic?.id ?? (d.clinicCandidates.length === 1 ? d.clinicCandidates[0].id : "")} className="rounded-md border border-border bg-background px-2 py-2">
                    <option value="">{c.chooseClinic}</option>
                    {sorted.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </label>
                {(d.matches.length ? d.matches : [{ text: "", candidates: [] as ResidentRef[], picked: null, problem: null }]).map((m, i) => (
                  <fieldset key={`${m.text}-${i}`} className="flex flex-col gap-2">
                    {m.text && <legend className="text-sm text-muted">{c.resident(m.text)}</legend>}
                    {m.candidates.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {m.candidates.map((r) => (
                          <label key={r.id} className="flex w-28 cursor-pointer flex-col items-center gap-1 rounded-md border border-border p-2 text-center has-[:checked]:border-primary has-[:checked]:bg-background">
                            <input type="radio" name={`pick-${i}`} value={r.id} required defaultChecked={m.candidates.length === 1} className="sr-only" />
                            <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-background">
                              {photos[r.id] ? <Image src={driveImageUrl(photos[r.id]!, 200)} alt="" fill sizes="64px" className="object-cover" /> : <PawPrint className="h-8 w-8 text-muted" aria-hidden />}
                            </span>
                            <span className="break-words text-sm font-semibold">{r.name}</span>
                            {r.code && <span className="text-xs text-muted">{r.code}</span>}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <>
                        {m.text && <p className="text-sm text-muted">{c.noCandidates}</p>}
                        <select name={`pick-${i}`} required defaultValue="" className="rounded-md border border-border bg-background px-2 py-2 text-sm">
                          <option value="">{c.chooseResident}</option>
                          {everyone.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}{r.code ? ` (${r.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </fieldset>
                ))}
                <div className="flex gap-2">
                  <button type="submit" disabled={it.allDay} className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {c.confirm}
                  </button>
                  <button type="submit" formAction={dismissCalendarEntry} formNoValidate className="min-h-11 rounded-md border border-border px-4 text-sm">
                    {c.dismiss}
                  </button>
                </div>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
