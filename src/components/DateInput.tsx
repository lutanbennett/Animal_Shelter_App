"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { autoSlash, badDateMessage, dmyToIso, isoToDmy, normalizeTime } from "@/lib/date-input";

// A browser draws <input type="date"> in ITS OWN language, so a Chrome set to
// English (United States) shows mm/dd/yyyy whatever the page says. These two
// components show and accept DD/MM/YYYY on every device and still submit ISO
// YYYY-MM-DD (or YYYY-MM-DDTHH:MM), so no server action sees a difference.
// Inputs stay Gregorian in Thai too — see docs/decisions/2026-10-13-date-input.md.

type ChangeLike = { target: { value: string } };
type InputProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode" | "pattern" | "placeholder"
>;
type Props = InputProps & {
  value?: string;
  defaultValue?: string | null;
  onChange?: (e: ChangeLike) => void;
};



function outOfRange(iso: string, min?: string | number, max?: string | number) {
  if (min && iso < String(min).slice(0, 10)) return `Date must be ${isoToDmy(String(min).slice(0, 10))} or later.`;
  if (max && iso > String(max).slice(0, 10)) return `Date must be ${isoToDmy(String(max).slice(0, 10))} or earlier.`;
  return "";
}

/** Drop-in for `<input type="date">`: same props, `onChange` gets `e.target.value` as ISO. */
export function DateInput({ value, defaultValue, onChange, className, name, min, max, required, disabled, id, ...rest }: Props) {
  const [text, setText] = useState(isoToDmy((value ?? defaultValue ?? "") as string));
  const visible = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const iso = dmyToIso(text);

  // A controlled value changed from outside (a reset, a default filled in).
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== undefined && value !== iso) setText(isoToDmy(value));
  }

  useEffect(() => {
    const msg = text === "" ? "" : iso === "" ? badDateMessage(text) : outOfRange(iso, min, max);
    visible.current?.setCustomValidity(msg);
  }, [text, iso, min, max]);

  function commit(next: string) {
    setText(next);
    const nextIso = dmyToIso(next);
    if (next === "" || nextIso !== "") onChange?.({ target: { value: nextIso } });
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <input
        {...rest}
        id={id}
        ref={visible}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        required={required}
        disabled={disabled}
        value={text}
        onChange={(e) => commit(autoSlash(e.target.value))}
        onBlur={(e) => {
          const parsed = dmyToIso(e.target.value);
          if (parsed) commit(isoToDmy(parsed));
        }}
        className={`min-w-0 flex-1 ${className ?? ""}`}
      />
      {name && <input type="hidden" name={name} value={iso} disabled={disabled} />}
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        min={min}
        max={max}
        value={iso}
        onChange={(e) => commit(isoToDmy(e.target.value))}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        aria-label="Open calendar"
        onClick={() => {
          try {
            picker.current?.showPicker();
          } catch {
            visible.current?.focus();
          }
        }}
        className="shrink-0 rounded border border-border bg-surface p-2 text-muted hover:text-foreground disabled:opacity-50"
      >
        <CalendarDays size={18} aria-hidden />
      </button>
    </span>
  );
}

/** Drop-in for `<input type="datetime-local">`: DD/MM/YYYY plus a 24-hour HH:MM, submitted as `YYYY-MM-DDTHH:MM`. */
export function DateTimeInput({ value, defaultValue, onChange, className, name, required, disabled, id, min, max, ...rest }: Props) {
  const start = (value ?? defaultValue ?? "") as string;
  const [date, setDate] = useState(isoToDmy(start.slice(0, 10)));
  const [time, setTime] = useState(start.slice(11, 16));
  const timeRef = useRef<HTMLInputElement>(null);
  const dateIso = dmyToIso(date);
  const timeOk = normalizeTime(time);
  const combined = dateIso && timeOk ? `${dateIso}T${timeOk}` : "";

  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== undefined && value !== combined) {
      setDate(isoToDmy(value.slice(0, 10)));
      setTime(value.slice(11, 16));
    }
  }

  useEffect(() => {
    timeRef.current?.setCustomValidity(time === "" || timeOk ? "" : "Enter a 24-hour time as HH:MM, for example 14:30.");
  }, [time, timeOk]);

  function emit(d: string, t: string) {
    const di = dmyToIso(d);
    const ti = normalizeTime(t);
    if (di && ti) onChange?.({ target: { value: `${di}T${ti}` } });
    else if (d === "" && t === "") onChange?.({ target: { value: "" } });
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <DateInput
        {...rest}
        id={id}
        required={required}
        disabled={disabled}
        min={min ? String(min).slice(0, 10) : undefined}
        max={max ? String(max).slice(0, 10) : undefined}
        value={date === "" ? "" : dateIso}
        onChange={(e) => {
          const next = isoToDmy(e.target.value);
          setDate(next);
          emit(next, time);
        }}
        className={className}
      />
      <input
        ref={timeRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="HH:MM"
        aria-label="Time, 24-hour"
        maxLength={5}
        required={required}
        disabled={disabled}
        value={time}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d:]/g, "");
          const next = /^\d{2}$/.test(raw) && raw.length > time.length ? `${raw}:` : raw;
          setTime(next);
          emit(date, next);
        }}
        onBlur={() => timeOk && setTime(timeOk)}
        className={`w-24 ${className ?? ""}`}
      />
      {name && <input type="hidden" name={name} value={combined} disabled={disabled} />}
    </span>
  );
}
