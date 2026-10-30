"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircleQuestionMark, Send, SkipForward, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DateInput } from "@/components/DateInput";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AskField, DetailsAsk } from "@/lib/assistant/interpret";
import { assistantInputClass as inputClass } from "./AssistantInput";

/**
 * The model asking for something the sentence left out (`request_details`).
 *
 * Built from the fields the server read off the action tool's own schema,
 * so there is no form per intent here: a date asks for a date, a choice
 * offers its options, a number a number. Ids are never among them: which
 * resident, enclosure or carer is chosen on the card, where the rows are.
 *
 * This is not the confirmation. Whatever the person answers goes back to the
 * model, and the result is still the ordinary card with Confirm on it.
 * Skip sends no values, and the card shows those fields blank. Closing the
 * dialog (Escape, or outside it) leaves the question waiting in the
 * conversation, with a button to open it again; Cancel ends the turn.
 */
export function AssistantDetails({
  turnId,
  ask,
  onAnswer,
  onClose,
  onCancel,
}: {
  turnId: number;
  ask: DetailsAsk;
  onAnswer: (values: Record<string, string>) => void;
  onClose: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const d = t.assistant.details;
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Captured and stopped here: the slide-over closes on Escape too, and one
    // Escape should close only this dialog, not the conversation behind it.
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const titleId = `assistant-details-${turnId}-title`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault();
          onAnswer(values);
        }}
        className="flex w-full max-w-md flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-primary/15 p-2 text-primary">
            <MessageCircleQuestionMark aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {d.title}
            </h2>
            {ask.question && <p className="text-sm text-muted">{ask.question}</p>}
          </div>
        </div>

        {ask.fields.map((field, i) => (
          <DetailField
            key={field.name}
            id={`assistant-details-${turnId}-${field.name}`}
            field={field}
            autoFocus={i === 0}
            value={values[field.name] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
          />
        ))}

        <div className="flex flex-wrap justify-end gap-2">
          <ActionButton icon={X} onClick={onCancel}>
            {d.cancel}
          </ActionButton>
          <ActionButton icon={SkipForward} onClick={() => onAnswer({})}>
            {d.skip}
          </ActionButton>
          <ActionButton icon={Send} variant="primary" type="submit">
            {d.send}
          </ActionButton>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function DetailField({
  id,
  field,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  field: AskField;
  value: string;
  onChange: (v: string) => void;
  autoFocus: boolean;
}) {
  const { t } = useI18n();
  const a = t.assistant;
  const labels: Record<string, string> = {
    date: a.fields.date,
    time: a.fields.time,
    reason: a.fields.reason,
    weightKg: a.fields.weightKg,
    causeOfDeath: a.fields.causeOfDeath,
    rehomeKind: a.rehome.kindLabel,
    ...a.details.fields,
  };
  // A field this screen has no word for shows its own name rather than another field's.
  const label = labels[field.name] ?? field.name;
  const optionLabel = (o: string) =>
    field.name === "rehomeKind" && (o === "foster" || o === "adopt") ? a.rehome.verbs[o] : o;

  let control: React.ReactNode;
  switch (field.input) {
    case "date":
      control = (
        <DateInput id={id} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      );
      break;
    case "choice":
      control = (
        <select id={id} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">{t.common.dash}</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {optionLabel(o)}
            </option>
          ))}
        </select>
      );
      break;
    default:
      control = (
        <input
          id={id}
          type={field.input === "time" ? "time" : field.input === "text" ? "text" : "number"}
          step={field.input === "integer" ? 1 : field.input === "number" ? "any" : undefined}
          inputMode={field.input === "number" ? "decimal" : field.input === "integer" ? "numeric" : undefined}
          maxLength={field.input === "text" ? 200 : undefined}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      {control}
    </div>
  );
}
