"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, todayIso } from "@/lib/format";
import { roleKeyLabel } from "@/lib/i18n/enum-labels";
import {
  REPEATS,
  TIMES_OF_DAY,
  WEEKDAYS,
  WEEKS_OF_MONTH,
  describeRule,
  isoWeekday,
  type RecurrenceRule,
  type Repeat,
  type TimeOfDay,
} from "@/lib/recurring-jobs/rule";
import type { RecurringJob } from "@/lib/recurring-jobs/queries";
import { canDoJob, jobIsRestricted, rolesForJob, type Eligibility } from "@/lib/recurring-jobs/eligibility";
import { previewRecurrence, saveRecurringJob } from "./actions";
import { OptionalDateInput } from "@/components/OptionalDateInput";

export type PersonOption = { id: string; name: string; role: string };
export type TeamMember = { id: string; name: string; archived: boolean; role?: string | null };

/** Screens a job is most often done on; anything else goes in "Other page…". */
const LINK_PRESETS = {
  stocktake: "/stocktake",
  stocktakeDiets: "/stocktake?tab=diets",
  maintenance: "/maintenance",
  residents: "/residents",
} as const;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-foreground";
const hintClass = "text-xs font-normal text-muted";

/**
 * Create or edit one recurring job. The preview under the rule asks the
 * database for the next dates as the rule is changed — the same function
 * the saved job will be evaluated with — so what it shows is what /my will do.
 */
export function RecurringJobForm({
  job,
  team,
  people,
  eligibility,
  otherJobs,
  onDone,
}: {
  job: RecurringJob | null;
  team: TeamMember[];
  people: PersonOption[];
  /** The database's answer for each assignable role (role_can, via eligibility-load.ts). */
  eligibility: Eligibility;
  /** Jobs this one can be set to wait for (every job but itself). */
  otherJobs: { id: string; title: string }[];
  onDone: (message: string | null) => void;
}) {
  const { t, locale } = useI18n();
  const f = t.management.recurringJobs.form;
  const rj = t.management.recurringJobs;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = todayIso();
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(job?.time_of_day ?? "morning");
  const presetFor = (path: string | null) =>
    path === null
      ? "none"
      : ((Object.keys(LINK_PRESETS) as (keyof typeof LINK_PRESETS)[]).find((k) => LINK_PRESETS[k] === path) ?? "other");
  const [linkChoice, setLinkChoice] = useState<string>(presetFor(job?.link_path ?? null));
  const [linkOther, setLinkOther] = useState(presetFor(job?.link_path ?? null) === "other" ? (job?.link_path ?? "") : "");
  const [repeat, setRepeat] = useState<Repeat>(job?.repeat ?? "weekly");
  const [every, setEvery] = useState(String(job?.every ?? 1));
  const [weekdays, setWeekdays] = useState<number[]>(job?.weekdays ?? [isoWeekday(today)]);
  const [monthDay, setMonthDay] = useState(String(job?.month_day ?? 1));
  const [weekOfMonth, setWeekOfMonth] = useState(job?.week_of_month ?? 1);
  const [startsOn, setStartsOn] = useState(job?.starts_on ?? today);
  const [endsOn, setEndsOn] = useState(job?.ends_on ?? "");
  const [dependsOn, setDependsOn] = useState(job?.depends_on_job_id ?? "");
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(() => new Set(team.map((m) => m.id)));
  const [active, setActive] = useState(job?.active ?? true);

  const rule: RecurrenceRule = {
    repeat,
    every: Number(every),
    weekdays: repeat === "monthly_day" ? null : repeat === "monthly_weekday" ? weekdays.slice(0, 1) : weekdays,
    month_day: repeat === "monthly_day" ? Number(monthDay) : null,
    week_of_month: repeat === "monthly_weekday" ? weekOfMonth : null,
    starts_on: startsOn,
    ends_on: endsOn || null,
  };
  const ruleKey = JSON.stringify(rule);

  // The preview, a moment after the rule stops changing.
  const [preview, setPreview] = useState<{ key: string; dates: string[]; error?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewRecurrence(JSON.parse(ruleKey) as RecurrenceRule);
      if (!cancelled) {
        setPreview(
          result.ok
            ? { key: ruleKey, dates: result.dates }
            : { key: ruleKey, dates: [], error: result.error },
        );
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ruleKey]);

  const ruleChanged =
    job !== null &&
    JSON.stringify([job.repeat, job.every, job.weekdays, job.month_day, job.week_of_month, job.starts_on]) !==
      JSON.stringify([rule.repeat, rule.every, rule.weekdays, rule.month_day, rule.week_of_month, rule.starts_on]);

  const linkPath =
    linkChoice === "none" ? "" : linkChoice === "other" ? linkOther : LINK_PRESETS[linkChoice as keyof typeof LINK_PRESETS];

  // Everyone whose role can do the work on the job's page (eligibility.ts):
  // never a vet, and a volunteer is not offered maintenance. Anyone already
  // on the job who can't — given it before this filter, or the link has just
  // changed — or who has since left stays listed and flagged, so they can be
  // taken off rather than silently kept. Saving refuses the first kind.
  const eligible = (role: string | null | undefined) => canDoJob(role, linkPath, eligibility);
  type Option = TeamMember & { cannotDo: boolean };
  const options: Option[] = [
    ...people
      .filter((p) => eligible(p.role) || assigneeIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: `${p.name} — ${roleKeyLabel(t, p.role)}`,
        archived: false,
        cannotDo: !eligible(p.role),
      })),
    ...team
      .filter((m) => !people.some((p) => p.id === m.id))
      .map((m) => ({
        ...m,
        name: !m.archived && m.role ? `${m.name} — ${roleKeyLabel(t, m.role)}` : m.name,
        cannotDo: !m.archived && !eligible(m.role),
      })),
  ];
  // Roles in play, by key: the people offered and anyone already on the job.
  const roleKeys = [...new Set([...people.map((p) => p.role), ...team.flatMap((m) => (m.role ? [m.role] : []))])];
  const restricted = jobIsRestricted(linkPath, eligibility, roleKeys);

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRecurringJob(job?.id ?? null, {
        title,
        description,
        timeOfDay,
        linkPath,
        rule,
        dependsOnJobId: dependsOn || null,
        assigneeIds: [...assigneeIds],
        active,
      });
      if (!result.ok) {
        setError(result.error);
        if ("id" in result && !job) router.refresh();
        return;
      }
      router.refresh();
      onDone(rj.saved);
    });
  }

  const everyLabel = repeat === "weekly" ? f.everyWeeks : f.everyMonths;
  const everyHint = repeat === "weekly" ? f.everyHintWeeks : f.everyHintMonths;

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-lg border border-primary/40 bg-surface p-4"
    >
      <h3 className="text-base font-semibold text-foreground">
        {job ? f.editHeading(job.title) : f.newHeading}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          {f.title}
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={f.titlePlaceholder}
            maxLength={200}
            required
          />
        </label>
        <label className={labelClass}>
          {f.timeOfDay}
          <select className={inputClass} value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}>
            {TIMES_OF_DAY.map((value) => (
              <option key={value} value={value}>
                {rj.timesOfDay[value]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          {f.description}
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={f.descriptionPlaceholder}
            maxLength={4000}
          />
        </label>
        <div className={`${labelClass} md:col-span-2`}>
          <label htmlFor="rj-link">{f.link}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="rj-link"
              className={`${inputClass} sm:w-64`}
              value={linkChoice}
              onChange={(e) => setLinkChoice(e.target.value)}
            >
              <option value="none">{f.linkNone}</option>
              {(Object.keys(LINK_PRESETS) as (keyof typeof LINK_PRESETS)[]).map((key) => (
                <option key={key} value={key}>
                  {f.linkPresets[key]}
                </option>
              ))}
              <option value="other">{f.linkOther}</option>
            </select>
            {linkChoice === "other" && (
              <input
                className={inputClass}
                value={linkOther}
                onChange={(e) => setLinkOther(e.target.value)}
                placeholder={f.linkPlaceholder}
                aria-label={f.link}
                maxLength={500}
              />
            )}
          </div>
          <span className={hintClass}>{f.linkHint}</span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 rounded border border-border p-3">
        <legend className="px-1 text-sm font-semibold text-foreground">{f.repeat}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {REPEATS.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-foreground">
              <input type="radio" name="repeat" checked={repeat === value} onChange={() => setRepeat(value)} />
              {f.repeats[value]}
            </label>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {repeat === "weekly" && (
            <div className={`${labelClass} md:col-span-2`}>
              <span>{f.weekdays}</span>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => {
                  const on = weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setWeekdays(on ? weekdays.filter((d) => d !== day) : [...weekdays, day].sort((a, b) => a - b))
                      }
                      className={`min-w-12 rounded-full border px-3 py-1 text-xs font-medium ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted hover:bg-surface-hover"
                      }`}
                    >
                      {rj.rule.weekdayShort[day - 1]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {repeat === "monthly_day" && (
            <label className={labelClass}>
              {f.monthDay}
              <input
                type="number"
                min={1}
                max={31}
                className={inputClass}
                value={monthDay}
                onChange={(e) => setMonthDay(e.target.value)}
              />
            </label>
          )}

          {repeat === "monthly_weekday" && (
            <>
              <label className={labelClass}>
                {f.weekOfMonth}
                <select
                  className={inputClass}
                  value={weekOfMonth}
                  onChange={(e) => setWeekOfMonth(Number(e.target.value))}
                >
                  {WEEKS_OF_MONTH.map((n) => (
                    <option key={n} value={n}>
                      {rj.rule.ordinals[String(n) as keyof typeof rj.rule.ordinals]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                {f.weekday}
                <select
                  className={inputClass}
                  value={weekdays[0] ?? 1}
                  onChange={(e) => setWeekdays([Number(e.target.value)])}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {rj.rule.weekdayNames[day - 1]}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className={labelClass}>
            {everyLabel}
            <input
              type="number"
              min={1}
              max={52}
              className={inputClass}
              value={every}
              onChange={(e) => setEvery(e.target.value)}
            />
            <span className={hintClass}>{everyHint}</span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={labelClass}>
              {f.startsOn}
              <input
                type="date"
                className={inputClass}
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              {f.endsOn}
              <OptionalDateInput
                label={f.endsOn}
                className={inputClass}
                value={endsOn}
                min={startsOn}
                onValueChange={setEndsOn}
              />
            </label>
            <span className={`${hintClass} sm:col-span-2`}>{f.endsOnHint}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded bg-background p-3 text-sm" aria-live="polite">
          <span className="font-semibold text-foreground">
            {f.preview}: <span className="font-normal">{describeRule(t, rule)}</span>
          </span>
          {!preview || preview.key !== ruleKey ? (
            <span className="text-muted">{f.previewLoading}</span>
          ) : preview.error ? (
            <span className="text-danger">{preview.error}</span>
          ) : preview.dates.length === 0 ? (
            <span className="text-muted">{f.previewNone}</span>
          ) : (
            <ol className="flex flex-wrap gap-x-3 gap-y-1 text-foreground">
              {preview.dates.map((date) => (
                <li key={date} className="whitespace-nowrap">
                  {rj.rule.weekdayShort[isoWeekday(date) - 1]} {formatDate(date, locale)}
                </li>
              ))}
            </ol>
          )}
          <span className={hintClass}>{f.previewNote}</span>
          {ruleChanged && <span className="text-xs text-warning">{f.ruleChangeNote}</span>}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-foreground">{f.assignees}</legend>
          <span className={hintClass}>{f.assigneesHint}</span>
          <span className={hintClass}>{f.assigneesNoVets}</span>
          {restricted && (
            <span className={hintClass}>
              {f.assigneesRestricted(rolesForJob(linkPath, eligibility, roleKeys).map((role) => roleKeyLabel(t, role)).join(", "))}
            </span>
          )}
          <div className="mt-1 flex max-h-56 flex-col gap-1 overflow-y-auto rounded border border-border p-2">
            {options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={assigneeIds.has(option.id)}
                  onChange={() => setAssigneeIds((current) => toggle(current, option.id))}
                />
                <span className={option.archived || option.cannotDo ? "text-muted line-through" : undefined}>
                  {option.name}
                </span>
                {option.archived && <span className="text-xs text-danger">{f.archivedMember}</span>}
                {option.cannotDo && <span className="text-xs text-danger">{f.cannotDoMember}</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4">
          <label className={labelClass}>
            {f.dependsOn}
            <select className={inputClass} value={dependsOn} onChange={(e) => setDependsOn(e.target.value)}>
              <option value="">{f.dependsOnNone}</option>
              {otherJobs.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.title}
                </option>
              ))}
            </select>
            <span className={hintClass}>{f.dependsOnHint}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" className="mt-1" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="flex flex-col">
              <span className="font-medium">{f.active}</span>
              <span className={hintClass}>{f.activeHint}</span>
            </span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={isPending}>
          {isPending ? rj.saving : rj.save}
        </ActionButton>
        <ActionButton icon={ACTION_ICONS.clear} onClick={() => onDone(null)}>
          {rj.cancel}
        </ActionButton>
      </div>
    </form>
  );
}
