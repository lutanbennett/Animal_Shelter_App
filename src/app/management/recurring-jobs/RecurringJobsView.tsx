"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Clock, Hourglass, Link2, Plus, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { addDaysIso, formatDate, formatDateTime } from "@/lib/format";
import { describeRule, describeSpan, isoWeekday } from "@/lib/recurring-jobs/rule";
import type { RecurringJob } from "@/lib/recurring-jobs/queries";
import { RecurringJobForm, type PersonOption, type TeamMember } from "./RecurringJobForm";
import {
  deleteRecurringJob,
  handBackRecurringJob,
  handOverRecurringJobs,
  setRecurringJobActive,
} from "./actions";

export type { PersonOption };

export type JobSummary = {
  job: RecurringJob;
  team: TeamMember[];
  /** recurring_job_staffing (0095): 0 on an active job = stranded. */
  liveAssignees: number;
  nextDates: string[];
  overdueCount: number;
  dependsOnTitle: string | null;
};

export type CoveredDate = {
  jobId: string;
  title: string;
  occursOn: string;
  team: string[];
  usual: string[];
  note: string | null;
};

export type RecordEntry = {
  key: string;
  title: string;
  occursOn: string;
  outcome: "done" | "skipped";
  by: string;
  at: string;
  note: string | null;
};

const smallButton =
  "rounded border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function RecurringJobsView({
  jobs,
  people,
  handOverFrom,
  covered,
  record,
  today,
}: {
  jobs: JobSummary[];
  people: PersonOption[];
  handOverFrom: TeamMember[];
  covered: CoveredDate[];
  record: RecordEntry[];
  today: string;
}) {
  const { t } = useI18n();
  const rj = t.management.recurringJobs;
  // null = no form open; "new" = the create form; otherwise the job being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const stranded = jobs.filter((s) => s.job.active && s.liveAssignees === 0);
  const close = (text: string | null) => {
    setEditing(null);
    setMessage(text);
  };

  return (
    <div className="flex flex-col gap-8">
      {stranded.length > 0 && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-foreground"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          {rj.strandedBanner(stranded.length)}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {message && <p className="text-sm text-success">{message}</p>}
          {editing !== "new" && (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setEditing("new");
              }}
              className="ml-auto flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {rj.newJob}
            </button>
          )}
        </div>

        {editing === "new" && (
          <RecurringJobForm
            job={null}
            team={[]}
            people={people}
            otherJobs={jobs.map((s) => ({ id: s.job.id, title: s.job.title }))}
            onDone={close}
          />
        )}

        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">{rj.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((summary) =>
              editing === summary.job.id ? (
                <li key={summary.job.id}>
                  <RecurringJobForm
                    job={summary.job}
                    team={summary.team}
                    people={people}
                    otherJobs={jobs
                      .filter((s) => s.job.id !== summary.job.id)
                      .map((s) => ({ id: s.job.id, title: s.job.title }))}
                    onDone={close}
                  />
                </li>
              ) : (
                <li key={summary.job.id}>
                  <JobCard
                    summary={summary}
                    onEdit={() => {
                      setMessage(null);
                      setEditing(summary.job.id);
                    }}
                  />
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <HandOver people={people} from={handOverFrom} today={today} />
      <Covered covered={covered} />
      <Record record={record} />
    </div>
  );
}

function JobCard({ summary, onEdit }: { summary: JobSummary; onEdit: () => void }) {
  const { t, locale } = useI18n();
  const rj = t.management.recurringJobs;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { job } = summary;
  const stranded = job.active && summary.liveAssignees === 0;

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <article
      className={`flex flex-col gap-2 rounded-lg border border-l-4 bg-surface p-3 text-sm ${
        stranded ? "border-danger/60 border-l-danger" : job.active ? "border-border border-l-primary" : "border-border border-l-transparent opacity-75"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
            {job.title}
            {!job.active && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
                {rj.paused}
              </span>
            )}
          </h3>
          <p className="text-foreground">
            {describeRule(t, job)} · <span className="text-muted">{describeSpan(t, locale, job)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <button type="button" className={smallButton} onClick={onEdit} disabled={isPending}>
            {rj.edit}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={isPending}
            onClick={() => run(() => setRecurringJobActive(job.id, !job.active))}
          >
            {job.active ? rj.pause : rj.resume}
          </button>
          <button
            type="button"
            className={`${smallButton} hover:border-danger hover:text-danger`}
            disabled={isPending}
            onClick={() => {
              if (window.confirm(rj.confirmDelete(job.title))) run(() => deleteRecurringJob(job.id));
            }}
          >
            {rj.delete}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock aria-hidden="true" className="h-3 w-3" />
          {rj.timesOfDay[job.time_of_day]}
        </span>
        <span className={`flex items-center gap-1 ${stranded ? "font-medium text-danger" : ""}`}>
          <Users aria-hidden="true" className="h-3 w-3" />
          {summary.team.length === 0
            ? rj.unassigned
            : summary.team.map((member, i) => (
                <span key={member.id}>
                  {i > 0 && ", "}
                  <span className={member.archived ? "line-through" : undefined}>{member.name}</span>
                  {member.archived && ` (${rj.left})`}
                </span>
              ))}
        </span>
        {summary.dependsOnTitle && (
          <span className="flex items-center gap-1">
            <Hourglass aria-hidden="true" className="h-3 w-3" />
            {rj.waitsFor(summary.dependsOnTitle)}
          </span>
        )}
        {job.link_path && (
          <Link href={job.link_path} className="flex items-center gap-1 text-primary hover:underline">
            <Link2 aria-hidden="true" className="h-3 w-3" />
            {rj.opens(job.link_path)}
          </Link>
        )}
      </div>

      {stranded && <p className="text-xs font-medium text-danger">{rj.stranded}</p>}

      {job.active && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1 text-muted">
            <CalendarClock aria-hidden="true" className="h-3 w-3" />
            {rj.nextDates}:{" "}
            {summary.nextDates.length === 0 ? (
              rj.noNextDates
            ) : (
              <span className="text-foreground">
                {summary.nextDates
                  .map((date) => `${rj.rule.weekdayShort[isoWeekday(date) - 1]} ${formatDate(date, locale)}`)
                  .join(" · ")}
              </span>
            )}
          </span>
          {summary.overdueCount > 0 && (
            <span className="font-medium text-danger">{rj.overdue(summary.overdueCount)}</span>
          )}
        </div>
      )}

      {job.description && <p className="whitespace-pre-line text-xs text-foreground/80">{job.description}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </article>
  );
}

function HandOver({ people, from, today }: { people: PersonOption[]; from: TeamMember[]; today: string }) {
  const { t } = useI18n();
  const h = t.management.recurringJobs.handOver;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fromId, setFromId] = useState("");
  const [toIds, setToIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"dates" | "permanent">("dates");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysIso(today, 6));
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok?: string; error?: string; failed?: string[] } | null>(null);

  const fromPerson = from.find((p) => p.id === fromId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await handOverRecurringJobs({
        fromUserId: fromId,
        toUserIds: [...toIds],
        mode,
        startDate,
        endDate,
        note,
      });
      if (outcome.error) {
        setResult({ error: outcome.error });
        return;
      }
      setResult({
        ok: mode === "dates" ? h.done(outcome.changed ?? 0) : h.donePermanent(outcome.changed ?? 0),
        failed: outcome.failed,
      });
      router.refresh();
    });
  }

  const inputClass =
    "rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{h.heading}</h2>
        <p className="text-sm text-muted">{h.intro}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 font-medium text-foreground">
            {h.from}
            <select
              className={inputClass}
              value={fromId}
              onChange={(e) => {
                const id = e.target.value;
                setFromId(id);
                // Someone who has left can only be handed over for good.
                if (from.find((p) => p.id === id)?.archived) setMode("permanent");
              }}
            >
              <option value="">{h.fromPlaceholder}</option>
              {from.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.archived ? ` (${t.management.recurringJobs.left})` : ""}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1">
            <legend className="font-medium text-foreground">{h.mode}</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="handover-mode"
                checked={mode === "dates"}
                disabled={fromPerson?.archived}
                onChange={() => setMode("dates")}
              />
              {h.modeDates}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="handover-mode"
                checked={mode === "permanent"}
                onChange={() => setMode("permanent")}
              />
              {h.modePermanent}
            </label>
          </fieldset>
          {mode === "dates" && (
            <>
              <label className="flex flex-col gap-1 font-medium text-foreground">
                {h.startDate}
                <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 font-medium text-foreground">
                {h.endDate}
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
              <label className="flex min-w-48 flex-1 flex-col gap-1 font-medium text-foreground">
                {h.note}
                <input
                  className={inputClass}
                  value={note}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={h.notePlaceholder}
                />
              </label>
            </>
          )}
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-medium text-foreground">{h.to}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {people
              .filter((p) => p.id !== fromId)
              .map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={toIds.has(p.id)}
                    onChange={() =>
                      setToIds((current) => {
                        const next = new Set(current);
                        if (next.has(p.id)) next.delete(p.id);
                        else next.add(p.id);
                        return next;
                      })
                    }
                  />
                  {p.name}
                </label>
              ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !fromId || toIds.size === 0}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {h.submit}
          </button>
          {result?.ok && <span className="text-success">{result.ok}</span>}
          {result?.error && <span className="text-danger">{result.error}</span>}
        </div>
        {result?.failed && result.failed.length > 0 && (
          <div className="text-xs text-danger">
            {h.failed}
            <ul className="list-disc pl-5">
              {result.failed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </section>
  );
}

function Covered({ covered }: { covered: CoveredDate[] }) {
  const { t, locale } = useI18n();
  const c = t.management.recurringJobs.covered;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{c.heading}</h2>
        <p className="text-sm text-muted">{c.intro}</p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {covered.length === 0 ? (
        <p className="text-sm text-muted">{c.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          {covered.map((row) => (
            <li key={`${row.jobId}:${row.occursOn}`} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span className="min-w-0">
                <span className="font-medium text-foreground">{formatDate(row.occursOn, locale)}</span> ·{" "}
                {row.title} → <span className="font-medium text-foreground">{row.team.join(", ")}</span>{" "}
                <span className="text-muted">
                  {row.usual.length > 0 && c.instead(row.usual.join(", "))}
                  {row.note && ` · ${row.note}`}
                </span>
              </span>
              <button
                type="button"
                className={smallButton}
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    const result = await handBackRecurringJob(row.jobId, row.occursOn);
                    if (result.error) setError(result.error);
                    router.refresh();
                  })
                }
              >
                {c.handBack}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Record({ record }: { record: RecordEntry[] }) {
  const { t, locale } = useI18n();
  const r = t.management.recurringJobs.record;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{r.heading}</h2>
        <p className="text-sm text-muted">{r.intro}</p>
      </div>
      {record.length === 0 ? (
        <p className="text-sm text-muted">{r.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          {record.map((row) => (
            <li key={row.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 p-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  row.outcome === "done" ? "bg-success/15 text-success" : "bg-surface-hover text-muted"
                }`}
              >
                {row.outcome === "done" ? r.done : r.skipped}
              </span>
              <span className="font-medium text-foreground">{row.title}</span>
              <span className="text-foreground">{formatDate(row.occursOn, locale)}</span>
              <span className="text-xs text-muted">{r.by(row.by, formatDateTime(row.at, locale))}</span>
              {row.note && <span className="w-full text-xs text-foreground/80">“{row.note}”</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
