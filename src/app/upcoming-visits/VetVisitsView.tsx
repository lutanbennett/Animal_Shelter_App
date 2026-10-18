"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDaysIso, formatDate } from "@/lib/format";
import { groupVisits, isOverdue } from "@/lib/clinics/shelter-visits";

export type VisitRow = {
  id: string;
  residentId: string;
  residentName: string;
  photoUrl: string | null;
  clinicId: string;
  clinicName: string;
  doctor: string | null;
  reason: string | null;
  status: string;
  appointmentDate: string;
  /** The visit's day at the shelter, YYYY-MM-DD. */
  day: string;
  time: string;
  /** Null unless the visit is still Scheduled. */
  calendarUrl: string | null;
};

type Labels = {
  viewList: string; viewCalendar: string; viewWeek: string; viewMonth: string;
  today: string; tomorrow: string; overdue: string; overdueHint: string; earlier: string;
  allClinics: string; clinicFilter: string; showCompleted: string; showCancelled: string;
  hideOverdue: string; showOverdue: string; empty: string; emptyDay: string;
  previous: string; next: string; openResident: string; edit: string; view: string; addToCalendar: string; calendarNote: string; fallbackReason: string;
  noPhoto: string; weekOf: string; weekdays: string[];
  status: Record<string, string>;
};

const HIDE_KEY = "vetVisits.hideOverdue";

/** Monday of the week containing `iso`. */
function mondayOf(iso: string): string {
  const dow = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDaysIso(iso, -dow);
}

const asVisit = (r: VisitRow) => ({ status: r.status, appointment_date: r.appointmentDate });

export function VetVisitsView({
  rows, today, dayLabels, clinics, locale, labels, overdueHiddenTemplate,
}: {
  rows: VisitRow[];
  today: string;
  dayLabels: Record<string, string>;
  clinics: { id: string; name: string }[];
  locale: "en" | "th";
  labels: Labels;
  overdueHiddenTemplate: string;
}) {
  const [view, setView] = useState<"list" | "week" | "month">("list");
  const [clinic, setClinic] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [hideOverdue, setHideOverdue] = useState(false);
  const [anchor, setAnchor] = useState(today);

  // Remembered on this device only: a per-viewer convenience, so a blocked or private browser
  // simply starts with overdue shown.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(HIDE_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists in the browser; reading it during render would not match the server's HTML
        setHideOverdue(true);
      }
    } catch {
      // storage blocked: overdue stays visible
    }
  }, []);
  const toggleOverdue = (hide: boolean) => {
    setHideOverdue(hide);
    try {
      window.localStorage.setItem(HIDE_KEY, hide ? "1" : "0");
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!clinic || r.clinicId === clinic) &&
          (showCompleted || r.status !== "completed") &&
          (showCancelled || r.status !== "cancelled"),
      ),
    [rows, clinic, showCompleted, showCancelled],
  );
  const overdueCount = filtered.filter((r) => isOverdue(asVisit(r), today)).length;
  const shown = hideOverdue ? filtered.filter((r) => !isOverdue(asVisit(r), today)) : filtered;

  const dayLabel = (day: string) => dayLabels[day] ?? formatDate(`${day}T12:00:00+07:00`, locale);
  const chip = "rounded-full border px-3 py-1 text-xs font-medium";
  const on = "border-primary bg-primary text-primary-foreground";
  const off = "border-border text-muted hover:bg-surface-hover";

  const card = (r: VisitRow) => (
    <li key={r.id} className="flex gap-3 p-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-background">
        {r.photoUrl ? (
          <Image src={r.photoUrl} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[10px] text-muted">
            {labels.noPhoto}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Link href={`/residents/${r.residentId}`} className="font-medium text-primary hover:underline">
            {r.residentName}
          </Link>
          <span className="text-sm font-medium text-foreground">{r.time}</span>
        </div>
        <div className="text-xs text-muted">
          {[r.clinicName, r.doctor, r.reason ?? labels.fallbackReason].filter(Boolean).join(" · ")}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {r.status !== "scheduled" && (
            <span className="text-xs text-muted">{labels.status[r.status] ?? r.status}</span>
          )}
          <Link href={`/residents/${r.residentId}`} className="text-xs font-medium text-primary hover:underline">
            {labels.openResident}
          </Link>
          <Link href={`/clinic-visits/${r.id}`} className="text-xs font-medium text-primary hover:underline">
            {labels.view}
          </Link>
          <Link href={`/clinic-visits/${r.id}/edit`} className="text-xs font-medium text-primary hover:underline">
            {labels.edit}
          </Link>
          {r.calendarUrl && (
            <a href={r.calendarUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
              {labels.addToCalendar}
            </a>
          )}
        </div>
      </div>
    </li>
  );

  const list = () => {
    const groups = groupVisits(shown.map((r) => ({ ...r, status: r.status, appointment_date: r.appointmentDate })), today);
    if (groups.length === 0) return <p className="text-sm text-muted">{labels.empty}</p>;
    return (
      <div className="flex flex-col gap-5">
        {groups.map((g) => {
          const title =
            g.kind === "overdue"
              ? labels.overdue
              : g.kind === "today"
                ? `${labels.today} · ${dayLabel(g.day!)}`
                : g.kind === "tomorrow"
                  ? `${labels.tomorrow} · ${dayLabel(g.day!)}`
                  : dayLabel(g.day!);
          return (
            <section key={g.key} className="flex flex-col gap-2">
              <h2 className={`text-base font-semibold ${g.kind === "overdue" ? "text-danger" : "text-foreground"}`}>
                {title} <span className="text-sm font-normal text-muted">({g.visits.length})</span>
              </h2>
              {g.kind === "overdue" && <p className="text-xs text-muted">{labels.overdueHint}</p>}
              <ul className="divide-y divide-border rounded border border-border bg-surface">
                {g.visits.map(card)}
              </ul>
            </section>
          );
        })}
      </div>
    );
  };

  const calendar = () => {
    let start: string;
    let count: number;
    let heading: string;
    if (view === "week") {
      start = mondayOf(anchor);
      count = 7;
      heading = `${labels.weekOf} ${dayLabel(start)}`;
    } else {
      const first = `${anchor.slice(0, 7)}-01`;
      start = mondayOf(first);
      const daysIn = new Date(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)), 0).getDate();
      const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
      count = Math.ceil((lead + daysIn) / 7) * 7;
      heading = formatDate(`${first}T12:00:00+07:00`, locale).replace(/^\d+ /, "");
    }
    const move = (dir: number) => {
      if (view === "week") {
        setAnchor(addDaysIso(anchor, 7 * dir));
      } else {
        const d = new Date(`${anchor.slice(0, 7)}-15T12:00:00Z`);
        d.setUTCMonth(d.getUTCMonth() + dir);
        setAnchor(d.toISOString().slice(0, 10));
      }
    };
    const byDay = new Map<string, VisitRow[]>();
    for (const r of shown) byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]);
    const cells = Array.from({ length: count }, (_, i) => addDaysIso(start, i));
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => move(-1)} className={`${chip} ${off}`}>{labels.previous}</button>
          <span className="text-sm font-semibold text-foreground">{heading}</span>
          <button type="button" onClick={() => move(1)} className={`${chip} ${off}`}>{labels.next}</button>
        </div>
        <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted">
          {labels.weekdays.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px rounded border border-border bg-border">
          {cells.map((day) => {
            const items = byDay.get(day) ?? [];
            const outside = view === "month" && day.slice(0, 7) !== anchor.slice(0, 7);
            return (
              <div
                key={day}
                className={`flex min-h-24 min-w-0 flex-col gap-1 p-1 ${outside ? "bg-background opacity-60" : "bg-surface"} ${day === today ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <span className="text-xs text-muted">{Number(day.slice(8))}</span>
                {items.map((r) => (
                  <Link
                    key={r.id}
                    href={`/clinic-visits/${r.id}`}
                    title={`${r.time} ${r.residentName} · ${r.clinicName}`}
                    className={`truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:underline ${isOverdue(asVisit(r), today) ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}
                  >
                    {r.time} {r.residentName.split(" (")[0]} · {r.clinicName}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={`${chip} ${view === "list" ? on : off}`}>
          {labels.viewList}
        </button>
        <button type="button" aria-pressed={view === "week"} onClick={() => setView("week")} className={`${chip} hidden md:inline-block ${view === "week" ? on : off}`}>
          {labels.viewCalendar} · {labels.viewWeek}
        </button>
        <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")} className={`${chip} hidden md:inline-block ${view === "month" ? on : off}`}>
          {labels.viewCalendar} · {labels.viewMonth}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={labels.clinicFilter} value={clinic} onChange={(e) => setClinic(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
          <option value="">{labels.allClinics}</option>
          {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" aria-pressed={showCompleted} onClick={() => setShowCompleted(!showCompleted)} className={`${chip} ${showCompleted ? on : off}`}>
          {labels.showCompleted}
        </button>
        <button type="button" aria-pressed={showCancelled} onClick={() => setShowCancelled(!showCancelled)} className={`${chip} ${showCancelled ? on : off}`}>
          {labels.showCancelled}
        </button>
        <button type="button" aria-pressed={hideOverdue} onClick={() => toggleOverdue(!hideOverdue)} className={`${chip} ${hideOverdue ? on : off}`}>
          {labels.hideOverdue}
        </button>
      </div>
      {hideOverdue && overdueCount > 0 && (
        <p className="text-sm text-muted" role="status">
          {overdueHiddenTemplate.replace("999999", String(overdueCount))},{" "}
          <button type="button" onClick={() => toggleOverdue(false)} className="font-medium text-primary underline">
            {labels.showOverdue}
          </button>
        </p>
      )}
      <p className="text-xs text-muted">{labels.calendarNote}</p>
      {view === "list" ? list() : calendar()}
    </div>
  );
}
