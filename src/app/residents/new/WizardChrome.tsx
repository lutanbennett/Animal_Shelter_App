"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { REVIEW_STEP } from "./steps";

/**
 * The words the chrome speaks. Intake's come from its own dictionary
 * section; another wizard (the Shelter Friend one) passes its own, so the
 * four behaviours below are shared rather than copied.
 */
export type WizardLabels = Pick<
  Dictionary["residents"]["new"]["wizard"],
  "stepOf" | "goToStep" | "back" | "next" | "edit" | "notProvided" | "reviewIntro"
>;

function useLabels(labels?: WizardLabels): WizardLabels {
  const { t } = useI18n();
  return labels ?? t.residents.new.wizard;
}

/** One answer on the Review step: the field's label and what was entered. */
export type ReviewEntry = { label: string; value: string | null };

/** The answers from one step, with the step to jump back to when editing. */
export type ReviewGroup = { step: number; title: string; entries: ReviewEntry[] };

/**
 * The step numbers along the top. A step is clickable once it has been
 * visited — jumping forward past an unanswered required field is what
 * `onGo` guards against, not this.
 */
export function WizardProgress({
  current,
  maxVisited,
  titles,
  pending,
  onGo,
  labels,
}: {
  current: number;
  maxVisited: number;
  /** One per step, Review last; their count is the step count. */
  titles: string[];
  pending: boolean;
  onGo: (step: number) => void;
  labels?: WizardLabels;
}) {
  const w = useLabels(labels);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">
        {w.stepOf(current + 1, titles.length)} · {titles[current]}
      </h2>
      <ol className="flex flex-wrap items-center gap-1.5">
        {titles.map((title, i) => {
          const isCurrent = i === current;
          // Locked while the intake is in flight, so a rejected one always
          // comes back to the Review step it was sent from.
          const visited = i <= maxVisited && !pending;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!visited}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={w.goToStep(i + 1, title)}
                onClick={() => onGo(i)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : visited
                      ? "border-border text-foreground hover:bg-surface-hover"
                      : "border-border text-muted opacity-60"
                }`}
              >
                <span aria-hidden>{i + 1}</span>
                <span className="hidden sm:inline">{title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Back / Next, pinned to the bottom of the viewport. This is the form a
 * volunteer fills standing at the gate, so Next stays under the thumb
 * however long the step is; on the last step it becomes the one and only
 * Register press.
 */
export function WizardNav({
  current,
  pending,
  onBack,
  onNext,
  onRegister,
  reviewStep = REVIEW_STEP,
  finalActions,
  labels,
}: {
  current: number;
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
  onRegister?: () => void;
  /** Index of the Review step; defaults to intake's. */
  reviewStep?: number;
  /**
   * What replaces Next on the Review step, for a wizard that ends in a
   * choice rather than one Register press (Publish now / Save as a draft).
   * Each must be type="button", for the reason given below.
   */
  finalActions?: ReactNode;
  labels?: WizardLabels;
}) {
  const { t } = useI18n();
  const w = useLabels(labels);
  const isReview = current === reviewStep;

  return (
    <div className="sticky bottom-0 z-10 -mx-6 flex gap-3 border-t border-border bg-background px-6 py-3 sm:justify-end">
      {current > 0 && (
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="rounded border border-border px-4 py-3 text-base font-medium text-foreground hover:bg-surface-hover disabled:opacity-50 sm:mr-auto"
        >
          {w.back}
        </button>
      )}
      {isReview && finalActions ? (
        finalActions
      ) : isReview ? (
        /*
         * type="button", not "submit": the browser runs its own validation
         * before the submit event, and a required field left empty on a
         * hidden step would make it refuse silently (it can't focus what
         * it can't show). onRegister checks the steps itself, opens the
         * one at fault, and only then calls requestSubmit(). It also means
         * the form never carries a submit button on the field steps, so
         * Enter in a text box can't register a half-filled resident.
         */
        <button
          type="button"
          onClick={onRegister}
          disabled={pending}
          className="flex-1 rounded bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 sm:flex-none sm:px-10"
        >
          {pending
            ? t.residents.new.registering
            : t.residents.new.registerButton}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover sm:flex-none sm:px-10"
        >
          {w.next}
        </button>
      )}
    </div>
  );
}

/**
 * The Review step: every answer, grouped by the step it came from, with an
 * Edit link back to that step. Values are read out of the form's own
 * controls when the step opens (see buildReview in IntakeForm), so this is
 * a mirror of the single submission that follows — nothing has been
 * written yet.
 */
export function ReviewSummary({
  groups,
  onEdit,
  labels,
}: {
  groups: ReviewGroup[];
  onEdit: (step: number) => void;
  labels?: WizardLabels;
}) {
  const w = useLabels(labels);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{w.reviewIntro}</p>
      {groups.map((group) => (
        <section
          key={group.step}
          className="rounded border border-border bg-surface p-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              {group.title}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(group.step)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {w.edit}
            </button>
          </div>
          <dl className="mt-3 flex flex-col gap-2">
            {group.entries.map((entry) => (
              <div
                key={entry.label}
                className="grid gap-0.5 sm:grid-cols-[14rem_1fr] sm:gap-4"
              >
                <dt className="text-sm text-muted">{entry.label}</dt>
                <dd
                  className={`text-sm ${
                    entry.value === null
                      ? "text-muted italic"
                      : "text-foreground whitespace-pre-wrap"
                  }`}
                >
                  {entry.value ?? w.notProvided}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
