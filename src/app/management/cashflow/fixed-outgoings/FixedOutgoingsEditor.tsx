"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { useState, useTransition } from "react";
import { formatBaht, formatMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FixedOutgoing, FixedOutgoingFields } from "@/lib/management/fixed-outgoings";
import { createFixedOutgoing, deleteFixedOutgoing, updateFixedOutgoing } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const BLANK: FixedOutgoingFields = {
  label: "",
  monthlyAmount: "",
  note: "",
  active: true,
  startsMonth: "",
  endsMonth: "",
};

const toFields = (line: FixedOutgoing): FixedOutgoingFields => ({
  label: line.label,
  monthlyAmount: String(Number(line.monthly_amount)),
  note: line.note ?? "",
  active: line.active,
  startsMonth: line.starts_on?.slice(0, 7) ?? "",
  endsMonth: line.ends_on?.slice(0, 7) ?? "",
});

type Notice = { kind: "ok" | "error"; text: string } | null;
type Outcome = { ok: true; success: string } | { ok: false; error: string };

/**
 * The list of lines, with one form used both to add and to edit. A line is
 * a named cost — the labels and hints say so, and there is nothing here to
 * attach a person to.
 */
export function FixedOutgoingsEditor({ lines, max }: { lines: FixedOutgoing[]; max: number }) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const m = t.management.fixedOutgoings;
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<FixedOutgoingFields>(BLANK);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const NEW = "new";
  const full = lines.length >= max;
  const monthlyTotal = lines
    .filter((l) => l.active)
    .reduce((sum, l) => sum + Number(l.monthly_amount), 0);

  function period(line: FixedOutgoing) {
    const start = line.starts_on ? formatMonth(line.starts_on, locale, true) : null;
    const end = line.ends_on ? formatMonth(line.ends_on, locale, true) : null;
    if (start && end) return m.periodRange(start, end);
    if (start) return m.periodFrom(start);
    if (end) return m.periodUntil(end);
    return m.periodAlways;
  }

  function open(target: string, initial: FixedOutgoingFields) {
    setEditing(target);
    setFields(initial);
    setNotice(null);
  }

  function run(action: () => Promise<Outcome>, closeOnSuccess = true) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setNotice({ kind: "ok", text: result.success });
        if (closeOnSuccess) setEditing(null);
      } else {
        setNotice({ kind: "error", text: result.error });
      }
    });
  }

  function save() {
    if (editing === NEW) run(() => createFixedOutgoing(fields));
    else if (editing) {
      const id = editing;
      run(() => updateFixedOutgoing(id, fields));
    }
  }

  async function remove(line: FixedOutgoing) {
    if (!await confirm({ body: m.confirmDelete(line.label), confirmLabel: t.common.delete })) return;
    run(() => deleteFixedOutgoing(line.id));
  }

  const set = <K extends keyof FixedOutgoingFields>(key: K, value: FixedOutgoingFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const form = (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="fo-label" className="text-sm font-medium text-muted">
            {m.form.label}
          </label>
          <input
            id="fo-label"
            value={fields.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder={m.form.labelPlaceholder}
            className={`${inputClass} w-64`}
          />
          <span className="text-xs text-muted">{m.form.labelHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fo-amount" className="text-sm font-medium text-muted">
            {m.form.amount}
          </label>
          <input
            id="fo-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={fields.monthlyAmount}
            onChange={(e) => set("monthlyAmount", e.target.value)}
            className={`${inputClass} w-36`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fo-starts" className="text-sm font-medium text-muted">
            {m.form.starts}
          </label>
          <input
            id="fo-starts"
            type="month"
            value={fields.startsMonth}
            onChange={(e) => set("startsMonth", e.target.value)}
            className={`${inputClass} w-40`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fo-ends" className="text-sm font-medium text-muted">
            {m.form.ends}
          </label>
          <input
            id="fo-ends"
            type="month"
            value={fields.endsMonth}
            onChange={(e) => set("endsMonth", e.target.value)}
            className={`${inputClass} w-40`}
          />
        </div>
      </div>
      <p className="text-xs text-muted">{m.form.rangeHint}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="fo-note" className="text-sm font-medium text-muted">
            {m.form.note}
          </label>
          <input
            id="fo-note"
            value={fields.note}
            onChange={(e) => set("note", e.target.value)}
            className={`${inputClass} min-w-48`}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={fields.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          {m.form.active}
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.common.saving : editing === NEW ? m.form.add : t.common.save}
        </button>
        <button
          type="button"
          onClick={() => setEditing(null)}
          disabled={pending}
          className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" data-testid="fixed-outgoings-count">
          {m.count(lines.length, max)} · {m.activeTotal(formatBaht(monthlyTotal, locale))}
        </p>
        {editing !== NEW && (
          <button
            type="button"
            onClick={() => open(NEW, BLANK)}
            disabled={full || pending}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {m.form.addLine}
          </button>
        )}
      </div>
      {full && <p className="text-sm text-muted">{m.capReached(max)}</p>}

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`text-sm ${notice.kind === "error" ? "text-danger" : "text-success"}`}
        >
          {notice.text}
        </p>
      )}

      {editing === NEW && form}

      {lines.length === 0 && editing !== NEW ? (
        <p className="text-sm text-muted">{m.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border">
          {lines.map((line) =>
            editing === line.id ? (
              <li key={line.id} className="p-3">
                {form}
              </li>
            ) : (
              <li
                key={line.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                  line.active ? "" : "opacity-60"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {line.label}
                    {!line.active && (
                      <span className="ml-2 text-xs font-normal text-muted">{m.inactive}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {period(line)}
                    {line.note ? ` · ${line.note}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {m.perMonth(formatBaht(Number(line.monthly_amount), locale))}
                  </span>
                  <button
                    type="button"
                    onClick={() => open(line.id, toFields(line))}
                    disabled={pending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(line)}
                    disabled={pending}
                    className="text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {t.common.delete}
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
