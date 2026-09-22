"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, formatDateTime } from "@/lib/format";
import { placeName } from "@/lib/enclosures/names";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import { EnclosurePicker } from "@/components/EnclosurePicker";
import {
  parseRequest,
  type Draft,
  type MoveDraft,
  type VetVisitDraft,
} from "@/lib/assistant/demo-parser";
import { assistantBookVetVisit, assistantMove } from "./actions";

export type AssistantResident = {
  id: string;
  name: string;
  thaiName: string | null;
  code: string;
  enclosureId: string | null;
  enclosureName: string | null;
  enclosureNameTh: string | null;
};

export type AssistantVet = { id: string; name: string; clinic_name: string | null };

type Turn = {
  id: number;
  request: string;
  draft: Draft | null;
  residentMatches: number;
  outcome: { kind: "done"; message: string; residentId: string } | { kind: "cancelled" } | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function residentLabel(r: AssistantResident) {
  return r.thaiName ? `${r.name} (${r.thaiName}) · ${r.code}` : `${r.name} · ${r.code}`;
}

function vetLabel(v: AssistantVet) {
  return v.clinic_name ? `${v.name} — ${v.clinic_name}` : v.name;
}

/**
 * The chat. Each request the person sends becomes a turn: their words, then
 * either "can't help with that" or an editable preview card that writes
 * nothing until Confirm. The parser runs in the browser against the rows
 * the page loaded; only Confirm calls the server.
 */
export function AssistantDemo({
  residents,
  zones,
  enclosures,
  vets,
}: {
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  vets: AssistantVet[];
}) {
  const { t } = useI18n();
  const a = t.assistant;
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  const parserData = {
    residents: residents.map((r) => ({
      id: r.id,
      name: r.name,
      thaiName: r.thaiName,
      code: r.code,
    })),
    enclosures: enclosures.map((e) => ({ id: e.id, name: e.name, nameTh: e.name_th })),
    vets: vets.map((v) => ({ id: v.id, name: v.name, clinicName: v.clinic_name })),
  };

  function submit(request: string) {
    const trimmed = request.trim();
    if (!trimmed) return;
    const parsed = parseRequest(trimmed, parserData);
    setTurns((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        request: trimmed,
        draft: parsed.draft,
        residentMatches: parsed.residentMatches,
        outcome: null,
      },
    ]);
    setText("");
  }

  function settle(id: number, outcome: Turn["outcome"]) {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, outcome } : turn)));
  }

  const examples = a.examples(
    residents[0]?.name ?? "Panda",
    enclosures[0]?.name ?? "A3",
    vets[0]?.name ?? "Dr Somchai",
  );

  return (
    <div className="flex max-w-2xl flex-1 flex-col gap-4">
      {turns.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="mb-2 font-medium text-muted">{a.tryTitle}</p>
          <ul className="flex flex-col gap-1">
            {examples.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => setText(example)}
                  className="text-left text-primary hover:underline"
                >
                  “{example}”
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {turns.map((turn) => (
          <li key={turn.id} className="flex flex-col gap-2">
            <p className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
              {turn.request}
            </p>
            {turn.outcome?.kind === "done" ? (
              <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2 text-sm text-foreground">
                <p>{turn.outcome.message}</p>
                <Link
                  href={`/residents/${turn.outcome.residentId}`}
                  className="text-primary hover:underline"
                >
                  {a.openResident}
                </Link>
              </div>
            ) : turn.outcome?.kind === "cancelled" ? (
              <p className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2 text-sm text-muted">
                {a.cancelled}
              </p>
            ) : turn.draft === null ? (
              <p className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2 text-sm text-foreground">
                {a.cantHelp}
              </p>
            ) : turn.draft.kind === "move" ? (
              <MoveCard
                turn={turn}
                draft={turn.draft}
                residents={residents}
                zones={zones}
                enclosures={enclosures}
                onSettle={(outcome) => settle(turn.id, outcome)}
              />
            ) : (
              <VetCard
                turn={turn}
                draft={turn.draft}
                residents={residents}
                vets={vets}
                onSettle={(outcome) => settle(turn.id, outcome)}
              />
            )}
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="sticky bottom-0 mt-auto flex gap-2 bg-background py-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={a.placeholder}
          aria-label={a.placeholder}
          autoComplete="off"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {a.send}
        </button>
      </form>
    </div>
  );
}

function Card({
  title,
  summary,
  hint,
  error,
  pending,
  canConfirm,
  notesStamp,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  summary: string;
  hint: string | null;
  error: string | null;
  pending: boolean;
  canConfirm: boolean;
  notesStamp: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const a = t.assistant;
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
        <p className="text-base font-semibold text-foreground">{summary}</p>
        {hint && <p className="mt-1 text-sm text-danger">{hint}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
      <p className="text-xs text-muted">{notesStamp}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending || !canConfirm}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? a.working : a.confirm}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}

function ResidentSelect({
  id,
  residents,
  value,
  onChange,
}: {
  id: string;
  residents: AssistantResident[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {t.assistant.fields.resident} <span className="text-danger">*</span>
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">{t.assistant.pickResident}</option>
        {residents.map((r) => (
          <option key={r.id} value={r.id}>
            {residentLabel(r)}
          </option>
        ))}
      </select>
    </div>
  );
}

function MoveCard({
  turn,
  draft,
  residents,
  zones,
  enclosures,
  onSettle,
}: {
  turn: Turn;
  draft: MoveDraft;
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  onSettle: (outcome: Turn["outcome"]) => void;
}) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [enclosureId, setEnclosureId] = useState(draft.enclosureId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = residents.find((r) => r.id === residentId) ?? null;
  const target = enclosures.find((e) => e.id === enclosureId) ?? null;
  const from = resident
    ? placeName(locale, resident.enclosureName, resident.enclosureNameTh) || t.common.dash
    : a.unknown;
  const summary = a.move.summary(
    resident ? `${resident.name} (${resident.code})` : a.unknown,
    from,
    target ? placeName(locale, target.name, target.name_th) : a.unknown,
    date ? formatDate(date, locale) : a.unknown,
  );

  function confirm() {
    if (!resident || !target || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantMove({
        residentId: resident.id,
        enclosureId: target.id,
        moveDate: date,
        request: turn.request,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSettle({
        kind: "done",
        message: a.move.done(
          `${resident.name} (${resident.code})`,
          placeName(locale, target.name, target.name_th),
        ),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.move.title}
      summary={summary}
      hint={turn.residentMatches > 1 && !draft.residentId ? a.severalMatch : a.fillBlanks}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!target && !!date}
      notesStamp={a.notesStamp(turn.request)}
      onConfirm={confirm}
      onCancel={() => onSettle({ kind: "cancelled" })}
    >
      <ResidentSelect
        id={`move-${turn.id}-resident`}
        residents={residents}
        value={residentId}
        onChange={setResidentId}
      />
      <EnclosurePicker
        zones={zones}
        enclosures={enclosures}
        value={enclosureId}
        onChange={setEnclosureId}
        currentEnclosureId={resident?.enclosureId ?? null}
        allowCurrent={false}
        required
        idPrefix={`move-${turn.id}`}
      />
      <div className="flex flex-col gap-1 sm:max-w-xs">
        <label htmlFor={`move-${turn.id}-date`} className="text-sm font-medium text-muted">
          {a.fields.date} <span className="text-danger">*</span>
        </label>
        <input
          id={`move-${turn.id}-date`}
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>
    </Card>
  );
}

function VetCard({
  turn,
  draft,
  residents,
  vets,
  onSettle,
}: {
  turn: Turn;
  draft: VetVisitDraft;
  residents: AssistantResident[];
  vets: AssistantVet[];
  onSettle: (outcome: Turn["outcome"]) => void;
}) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [vetId, setVetId] = useState(draft.vetId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [time, setTime] = useState(draft.time ?? "");
  const [reason, setReason] = useState(draft.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = residents.find((r) => r.id === residentId) ?? null;
  const vet = vets.find((v) => v.id === vetId) ?? null;
  // Built here, on the person's own clock, so "10am" is 10am where they are.
  const when = date && time ? new Date(`${date}T${time}`) : null;
  const whenLabel = when ? formatDateTime(when.toISOString(), locale) : a.unknown;
  const summary = a.vet.summary(
    resident ? `${resident.name} (${resident.code})` : a.unknown,
    vet ? vet.name : a.unknown,
    whenLabel,
  );

  function confirm() {
    if (!resident || !vet || !when) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantBookVetVisit({
        residentId: resident.id,
        vetId: vet.id,
        appointmentIso: when.toISOString(),
        reason: reason || null,
        request: turn.request,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSettle({
        kind: "done",
        message: a.vet.done(`${resident.name} (${resident.code})`, vet.name, whenLabel),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.vet.title}
      summary={summary}
      hint={turn.residentMatches > 1 && !draft.residentId ? a.severalMatch : a.fillBlanks}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!vet && !!when}
      notesStamp={a.notesStamp(turn.request)}
      onConfirm={confirm}
      onCancel={() => onSettle({ kind: "cancelled" })}
    >
      <ResidentSelect
        id={`vet-${turn.id}-resident`}
        residents={residents}
        value={residentId}
        onChange={setResidentId}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={`vet-${turn.id}-vet`} className="text-sm font-medium text-muted">
          {a.fields.vet} <span className="text-danger">*</span>
        </label>
        <select
          id={`vet-${turn.id}-vet`}
          value={vetId}
          onChange={(e) => setVetId(e.target.value)}
          className={inputClass}
        >
          <option value="">{a.pickVet}</option>
          {vets.map((v) => (
            <option key={v.id} value={v.id}>
              {vetLabel(v)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`vet-${turn.id}-date`} className="text-sm font-medium text-muted">
            {a.fields.date} <span className="text-danger">*</span>
          </label>
          <input
            id={`vet-${turn.id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`vet-${turn.id}-time`} className="text-sm font-medium text-muted">
            {a.fields.time} <span className="text-danger">*</span>
          </label>
          <input
            id={`vet-${turn.id}-time`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`vet-${turn.id}-reason`} className="text-sm font-medium text-muted">
          {a.fields.reason}
        </label>
        <input
          id={`vet-${turn.id}-reason`}
          type="text"
          value={reason}
          placeholder={t.vetVisits.reasonPlaceholder}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
      </div>
    </Card>
  );
}
