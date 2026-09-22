"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, formatDateTime } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import { EnclosurePicker } from "@/components/EnclosurePicker";
import type { AssistantResident, AssistantVet } from "@/lib/assistant/data";
import { isoLocal } from "@/lib/assistant/text";
import type {
  Draft,
  HospitalDraft,
  HospitalReturnDraft,
  MoveDraft,
  VetVisitDraft,
  WeightDraft,
} from "@/lib/assistant/types";
import {
  assistantBookVetVisit,
  assistantLogWeight,
  assistantMove,
  assistantReturnFromHospital,
  assistantSendToHospital,
} from "@/app/assistant/actions";
import { assistantInputClass as inputClass } from "./AssistantInput";

/**
 * The preview cards: one per writing intent, all the same shape.
 *
 * A card is what the assistant understood, laid out as a small form with
 * a blank wherever the sentence didn't say. Nothing is written until
 * Confirm, and Confirm calls the app's own server action — so a card is
 * the move page, the hospital page or the weight form with the fields
 * already filled in, not a second way to write the row.
 */

export type AssistantOutcome =
  | { kind: "done"; message: string; residentId: string | null }
  | { kind: "cancelled" };

/** What every card needs: the sentence it came from, and the rows to pick from. */
export type CardContext = {
  /** Unique within the conversation; only used to keep field ids apart. */
  turnId: number;
  request: string;
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  vets: AssistantVet[];
  /** Residents the name could have meant, when it could have meant several. */
  candidates: string[];
  onSettle: (outcome: AssistantOutcome) => void;
};

/** Today where the person is, never where the server is. */
function todayIso() {
  return isoLocal(new Date());
}

function residentLabel(r: AssistantResident) {
  return r.thaiName ? `${r.name} (${r.thaiName}) · ${r.code}` : `${r.name} · ${r.code}`;
}

function vetLabel(v: AssistantVet) {
  return v.clinic_name ? `${v.name} — ${v.clinic_name}` : v.name;
}

// ---------------------------------------------------------------------------
// Shared furniture
// ---------------------------------------------------------------------------

function Card({
  title,
  summary,
  hint,
  hintTone,
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
  /** Red is for "this one needs a decision", not for ordinary blanks. */
  hintTone: "danger" | "muted";
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
        {hint && (
          <p
            className={`mt-1 text-sm ${hintTone === "danger" ? "text-danger" : "text-muted"}`}
          >
            {hint}
          </p>
        )}
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

/**
 * "Which one do you mean?" — shown when a name matched more than one
 * resident. The name is the thing that was ambiguous, so the choice is
 * made on everything else about them: the code, where they are, and their
 * face. Picking one collapses it back to the ordinary select.
 */
function ResidentCandidates({
  candidates,
  onPick,
}: {
  candidates: AssistantResident[];
  onPick: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted">{t.assistant.whichOne}</p>
      <ul className="flex flex-wrap gap-2">
        {candidates.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onPick(r.id)}
              className="flex w-36 flex-col gap-2 rounded-lg border border-border bg-background p-2 text-left transition hover:bg-surface-hover"
            >
              {r.photoFileId ? (
                <img
                  src={driveImageUrl(r.photoFileId)}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-hover text-center text-xs text-muted">
                  {t.enclosures.hub.noPhoto}
                </div>
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {r.thaiName ? `${r.name} (${r.thaiName})` : r.name}
              </span>
              <span className="text-xs text-muted">{r.code}</span>
              <span className="truncate text-xs text-muted">
                {placeName(locale, r.enclosureName, r.enclosureNameTh) || t.common.dash}
              </span>
            </button>
          </li>
        ))}
      </ul>
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
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
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

function DateField({
  id,
  label,
  value,
  onChange,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:max-w-xs">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label} <span className="text-danger">*</span>
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

/**
 * The resident field, as either a picker (the name was ambiguous and
 * nothing has been chosen yet) or a select.
 */
function ResidentField({
  ctx,
  idPrefix,
  residentId,
  onChange,
}: {
  ctx: CardContext;
  idPrefix: string;
  residentId: string;
  onChange: (id: string) => void;
}) {
  const candidates = ctx.candidates
    .map((id) => ctx.residents.find((r) => r.id === id))
    .filter((r): r is AssistantResident => !!r);

  if (candidates.length > 1 && !residentId) {
    return <ResidentCandidates candidates={candidates} onPick={onChange} />;
  }
  return (
    <ResidentSelect
      id={`${idPrefix}-${ctx.turnId}-resident`}
      residents={ctx.residents}
      value={residentId}
      onChange={onChange}
    />
  );
}

/** The line under every card's fields, and the hint above them. */
function useCardChrome(ctx: CardContext, residentChosen: boolean) {
  const { t } = useI18n();
  const a = t.assistant;
  const ambiguous = ctx.candidates.length > 1 && !residentChosen;
  return {
    notesStamp: a.notesStamp(ctx.request),
    hint: ambiguous ? a.severalMatch : a.fillBlanks,
    hintTone: (ambiguous ? "danger" : "muted") as "danger" | "muted",
  };
}

// ---------------------------------------------------------------------------
// One card per writing intent
// ---------------------------------------------------------------------------

function MoveCard({ ctx, draft }: { ctx: CardContext; draft: MoveDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [enclosureId, setEnclosureId] = useState(draft.enclosureId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const target = ctx.enclosures.find((e) => e.id === enclosureId) ?? null;
  const from = resident
    ? placeName(locale, resident.enclosureName, resident.enclosureNameTh) || t.common.dash
    : a.unknown;
  const chrome = useCardChrome(ctx, !!residentId);

  function confirm() {
    if (!resident || !target || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantMove({
        residentId: resident.id,
        enclosureId: target.id,
        moveDate: date,
        request: ctx.request,
        draft: { ...draft, residentId: resident.id, enclosureId: target.id, date },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
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
      summary={a.move.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        from,
        target ? placeName(locale, target.name, target.name_th) : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!target && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="move"
        residentId={residentId}
        onChange={setResidentId}
      />
      <EnclosurePicker
        zones={ctx.zones}
        enclosures={ctx.enclosures}
        value={enclosureId}
        onChange={setEnclosureId}
        currentEnclosureId={resident?.enclosureId ?? null}
        allowCurrent={false}
        required
        idPrefix={`move-${ctx.turnId}`}
      />
      <DateField
        id={`move-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={todayIso()}
      />
    </Card>
  );
}

function VetCard({ ctx, draft }: { ctx: CardContext; draft: VetVisitDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [vetId, setVetId] = useState(draft.vetId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [time, setTime] = useState(draft.time ?? "");
  const [reason, setReason] = useState(draft.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const vet = ctx.vets.find((v) => v.id === vetId) ?? null;
  // Built here, on the person's own clock, so "10am" is 10am where they are.
  const when = date && time ? new Date(`${date}T${time}`) : null;
  const whenLabel = when ? formatDateTime(when.toISOString(), locale) : a.unknown;
  const chrome = useCardChrome(ctx, !!residentId);

  function confirm() {
    if (!resident || !vet || !when) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantBookVetVisit({
        residentId: resident.id,
        vetId: vet.id,
        appointmentIso: when.toISOString(),
        reason: reason || null,
        request: ctx.request,
        draft: {
          ...draft,
          residentId: resident.id,
          vetId: vet.id,
          date,
          time,
          reason: reason || null,
        },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.vet.done(`${resident.name} (${resident.code})`, vet.name, whenLabel),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.vet.title}
      summary={a.vet.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        vet ? vet.name : a.unknown,
        whenLabel,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!vet && !!when}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="vet"
        residentId={residentId}
        onChange={setResidentId}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={`vet-${ctx.turnId}-vet`} className="text-sm font-medium text-muted">
          {a.fields.vet} <span className="text-danger">*</span>
        </label>
        <select
          id={`vet-${ctx.turnId}-vet`}
          value={vetId}
          onChange={(e) => setVetId(e.target.value)}
          className={inputClass}
        >
          <option value="">{a.pickVet}</option>
          {ctx.vets.map((v) => (
            <option key={v.id} value={v.id}>
              {vetLabel(v)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`vet-${ctx.turnId}-date`} className="text-sm font-medium text-muted">
            {a.fields.date} <span className="text-danger">*</span>
          </label>
          <input
            id={`vet-${ctx.turnId}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`vet-${ctx.turnId}-time`} className="text-sm font-medium text-muted">
            {a.fields.time} <span className="text-danger">*</span>
          </label>
          <input
            id={`vet-${ctx.turnId}-time`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`vet-${ctx.turnId}-reason`} className="text-sm font-medium text-muted">
          {a.fields.reason}
        </label>
        <input
          id={`vet-${ctx.turnId}-reason`}
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

/**
 * Sending to hospital takes a date and nothing else, so unlike a move it
 * defaults to today — the hub's own send-to-hospital form does the same,
 * and "send Panda to the vet hospital" almost always means now.
 */
function HospitalCard({ ctx, draft }: { ctx: CardContext; draft: HospitalDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [date, setDate] = useState(draft.date ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const chrome = useCardChrome(ctx, !!residentId);

  function confirm() {
    if (!resident || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantSendToHospital({
        residentId: resident.id,
        date,
        request: ctx.request,
        draft: { ...draft, residentId: resident.id, date },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.hospital.done(`${resident.name} (${resident.code})`),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.hospital.title}
      summary={a.hospital.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="hospital"
        residentId={residentId}
        onChange={setResidentId}
      />
      <DateField
        id={`hospital-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={todayIso()}
      />
    </Card>
  );
}

/**
 * Coming back needs somewhere to come back to. The default is the
 * enclosure the resident left, which is what the hub's return form offers
 * — but any physical enclosure is allowed, because a resident back from
 * hospital may need isolation first.
 */
function HospitalReturnCard({
  ctx,
  draft,
}: {
  ctx: CardContext;
  draft: HospitalReturnDraft;
}) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  /** Where this resident left from, if they are in hospital now. */
  const cameFrom = (id: string) =>
    ctx.residents.find((r) => r.id === id)?.hospitalPreviousEnclosureId ?? "";

  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [enclosureId, setEnclosureId] = useState(
    draft.enclosureId ?? (draft.residentId ? cameFrom(draft.residentId) : ""),
  );
  const [date, setDate] = useState(draft.date ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const target = ctx.enclosures.find((e) => e.id === enclosureId) ?? null;
  const chrome = useCardChrome(ctx, !!residentId);

  /** Choosing a different resident re-seeds where they go back to. */
  function chooseResident(id: string) {
    setResidentId(id);
    setEnclosureId(cameFrom(id));
  }

  function confirm() {
    if (!resident || !target || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantReturnFromHospital({
        residentId: resident.id,
        enclosureId: target.id,
        date,
        request: ctx.request,
        draft: { ...draft, residentId: resident.id, enclosureId: target.id, date },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.hospitalReturn.done(
          `${resident.name} (${resident.code})`,
          placeName(locale, target.name, target.name_th),
        ),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.hospitalReturn.title}
      summary={a.hospitalReturn.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        target ? placeName(locale, target.name, target.name_th) : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!target && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="hospital-return"
        residentId={residentId}
        onChange={chooseResident}
      />
      {/* The picker reads its zone from `value` when it mounts, so it is
          remounted whenever a new resident re-seeds that value — otherwise
          the enclosure would be set with the zone above it still blank. */}
      <EnclosurePicker
        key={residentId}
        zones={ctx.zones}
        enclosures={ctx.enclosures}
        value={enclosureId}
        onChange={setEnclosureId}
        required
        idPrefix={`hospital-return-${ctx.turnId}`}
      />
      <DateField
        id={`hospital-return-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={todayIso()}
      />
    </Card>
  );
}

function WeightCard({ ctx, draft }: { ctx: CardContext; draft: WeightDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [weight, setWeight] = useState(draft.weightKg === null ? "" : String(draft.weightKg));
  const [date, setDate] = useState(draft.date ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const weightKg = Number(weight);
  const weightOk = weight.trim() !== "" && Number.isFinite(weightKg) && weightKg > 0;
  const chrome = useCardChrome(ctx, !!residentId);

  function confirm() {
    if (!resident || !weightOk || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantLogWeight({
        residentId: resident.id,
        weightKg,
        date,
        request: ctx.request,
        draft: { ...draft, residentId: resident.id, weightKg, date },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.weight.done(`${resident.name} (${resident.code})`, weightKg),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.weight.title}
      summary={a.weight.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        weightOk ? String(weightKg) : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && weightOk && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="weight"
        residentId={residentId}
        onChange={setResidentId}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`weight-${ctx.turnId}-kg`}
            className="text-sm font-medium text-muted"
          >
            {a.fields.weightKg} <span className="text-danger">*</span>
          </label>
          <input
            id={`weight-${ctx.turnId}-kg`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </div>
        <DateField
          id={`weight-${ctx.turnId}-date`}
          label={a.fields.date}
          value={date}
          onChange={setDate}
          max={todayIso()}
        />
      </div>
    </Card>
  );
}

/** The card for whichever intent the parser claimed. */
export function AssistantCard({ ctx, draft }: { ctx: CardContext; draft: Draft }) {
  switch (draft.kind) {
    case "move":
      return <MoveCard ctx={ctx} draft={draft} />;
    case "vet":
      return <VetCard ctx={ctx} draft={draft} />;
    case "hospital":
      return <HospitalCard ctx={ctx} draft={draft} />;
    case "hospital-return":
      return <HospitalReturnCard ctx={ctx} draft={draft} />;
    case "weight":
      return <WeightCard ctx={ctx} draft={draft} />;
    default:
      // The lookups never reach a card; they are answered inline.
      return null;
  }
}
