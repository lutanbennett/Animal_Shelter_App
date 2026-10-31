"use client";

import { useState, useTransition } from "react";
import { HeartCrack, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, formatDateTime } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import { EnclosurePicker } from "@/components/EnclosurePicker";
import type {
  AssistantClinic,
  AssistantImmunizationType,
  AssistantMedication,
  AssistantResident,
  AssistantRound,
} from "@/lib/assistant/data";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";
import { parseScheduleForm, scheduleToForm, type ScheduleFormValues } from "@/lib/prescriptions/schedule";
import { showsRoundTicks, tickVerdict } from "@/lib/prescriptions/rounds";
import { ScheduleDays } from "@/app/prescriptions/ScheduleDays";
import { isoLocal } from "@/lib/assistant/text";
import { doctorNameCore, type DoctorNamesByClinic } from "@/lib/clinics/doctors";
import type { CarerOption } from "@/lib/contacts/carers";
import type {
  DeathDraft,
  Draft,
  RehomeDraft,
  HospitalDraft,
  HospitalReturnDraft,
  MoveDraft,
  ClinicVisitDraft,
  WeightDraft,
  ImmunizationDraft,
  PrescriptionDraft,
  CarerReturnDraft,
  AssistantTrace,
} from "@/lib/assistant/types";
import {
  assistantAddPrescription,
  assistantRecordDeath,
  assistantRehome,
  assistantRecordImmunization,
  assistantReturnFromCarer,
  assistantBookClinicVisit,
  assistantLogWeight,
  assistantMove,
  assistantReturnFromHospital,
  assistantSendToHospital,
} from "@/app/assistant/actions";
import { assistantInputClass as inputClass } from "./AssistantInput";
import { immunizationStrings } from "@/lib/assistant/immunization-strings";
import { carerReturnStrings } from "@/lib/assistant/carer-return-strings";
import { DateInput } from "@/components/DateInput";

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
  /** Set when a model interpreted the sentence; handed to the audit row on Confirm. */
  trace?: AssistantTrace;
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  clinics: AssistantClinic[];
  /** Carers the foster / adopt card may choose from. */
  carers: CarerOption[];
  /** The vaccines the immunization card may tick. */
  immunizationTypes: AssistantImmunizationType[];
  /** The medicines the prescription card may choose. Empty without `medical.prescriptions`. */
  medications: AssistantMedication[];
  /** Morning / Lunch / Evening / Night, for the prescription card's ticks. */
  rounds: AssistantRound[];
  /** Each clinic's active doctors, offered on the clinic card. */
  doctors: DoctorNamesByClinic;
  /** Residents the name could have meant, when it could have meant several. */
  candidates: string[];
  onSettle: (outcome: AssistantOutcome) => void;
};

/**
 * Today where the person is — deliberately the asker's own clock, not the
 * shelter's `todayIso()` from @/lib/format, because the assistant resolves
 * "tomorrow" and weekday names against the calendar the asker is reading
 * them from. See docs/backlog.md for reconciling the two.
 */
function viewerToday() {
  return isoLocal(new Date());
}

function residentLabel(r: AssistantResident) {
  return r.thaiName ? `${r.name} (${r.thaiName}) · ${r.code}` : `${r.name} · ${r.code}`;
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
        <ActionButton
          icon={ACTION_ICONS.approve}
          variant="primary"
          onClick={onConfirm}
          disabled={pending || !canConfirm}
        >
          {pending ? a.working : a.confirm}
        </ActionButton>
        <ActionButton icon={X} onClick={onCancel} disabled={pending}>
          {t.common.cancel}
        </ActionButton>
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
      <DateInput
        id={id}
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
// The low-risk writes, which may go in without a card
// ---------------------------------------------------------------------------

/** What a write needs to know besides the draft, when there is no card around it. */
export type LowRiskContext = {
  request: string;
  trace?: AssistantTrace;
  residents: AssistantResident[];
  immunizationTypes: AssistantImmunizationType[];
  t: Dictionary;
  locale: Locale;
};

/**
 * The writes `isLowRiskWrite` marks (llm-tools.ts): one function per intent,
 * called by that intent's card on Confirm AND by the conversation when it
 * skips the card. One write path per intent, so the two can never drift —
 * and the server action, its card check and the database are identical
 * either way. Skipping the card is a courtesy, never a permission.
 */
export async function recordLowRisk(
  draft: WeightDraft | ImmunizationDraft,
  ctx: LowRiskContext,
): Promise<{ error: string } | AssistantOutcome> {
  const a = ctx.t.assistant;
  const resident = ctx.residents.find((r) => r.id === draft.residentId);
  if (!resident) return { error: a.lookups.whichResident };
  const who = `${resident.name} (${resident.code})`;

  if (draft.kind === "weight") {
    if (draft.weightKg === null || !(draft.weightKg > 0) || !draft.date) return { error: a.fillBlanks };
    const result = await assistantLogWeight({
      residentId: resident.id,
      weightKg: draft.weightKg,
      date: draft.date,
      request: ctx.request,
      trace: ctx.trace,
      draft,
    });
    if ("error" in result) return result;
    return { kind: "done", message: a.weight.done(who, draft.weightKg), residentId: resident.id };
  }

  const chosen = ctx.immunizationTypes.filter((ty) => draft.immunizationTypeIds.includes(ty.id));
  if (chosen.length === 0 || !draft.date) return { error: a.fillBlanks };
  const result = await assistantRecordImmunization({
    residentId: resident.id,
    immunizationTypeIds: chosen.map((ty) => ty.id),
    date: draft.date,
    request: ctx.request,
    trace: ctx.trace,
    draft,
  });
  if ("error" in result) return result;
  const names = chosen.map((ty) => (ctx.locale === "th" && ty.nameTh) || ty.name).join(", ");
  return { kind: "done", message: immunizationStrings(ctx.locale).done(who, names), residentId: resident.id };
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
        trace: ctx.trace,
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
        max={viewerToday()}
      />
    </Card>
  );
}

function ClinicCard({ ctx, draft }: { ctx: CardContext; draft: ClinicVisitDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [clinicId, setClinicId] = useState(draft.clinicId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [time, setTime] = useState(draft.time ?? "");
  const [reason, setReason] = useState(draft.reason ?? "");
  // "with Dr Somchai" arrives as "Somchai"; when the clinic is known and
  // lists that doctor, start from the list's own spelling.
  const [doctorName, setDoctorName] = useState(() => {
    const said = draft.doctorName ?? "";
    const core = doctorNameCore(said);
    const listed = core
      ? (ctx.doctors[draft.clinicId ?? ""] ?? []).filter((n) => doctorNameCore(n) === core)
      : [];
    return listed.length === 1 ? listed[0] : said;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const clinic = ctx.clinics.find((c) => c.id === clinicId) ?? null;
  // Built here, on the person's own clock, so "10am" is 10am where they are.
  const when = date && time ? new Date(`${date}T${time}`) : null;
  const whenLabel = when ? formatDateTime(when.toISOString(), locale) : a.unknown;
  const chrome = useCardChrome(ctx, !!residentId);

  // The doctor is optional and never blocks Confirm. A name the clinic's
  // list doesn't have is still written (the database adds it, as on the
  // booking form), but the card says so rather than doing it silently.
  const doctor = doctorName.trim();
  const roster = ctx.doctors[clinicId] ?? [];
  const sameName = (x: string, y: string) =>
    x.trim().replace(/\s+/g, " ").toLowerCase() === y.trim().replace(/\s+/g, " ").toLowerCase();
  const listedAs = roster.find((n) => sameName(n, doctor)) ?? null;
  const alike = doctor && !listedAs
    ? roster.filter((n) => doctorNameCore(n) === doctorNameCore(doctor))
    : [];
  const doctorNote = !doctor || !clinic || listedAs
    ? null
    : alike.length === 1
      ? null
      : a.vet.doctorNew(clinic.name);

  function confirm() {
    if (!resident || !clinic || !when) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantBookClinicVisit({
        residentId: resident.id,
        clinicId: clinic.id,
        appointmentIso: when.toISOString(),
        reason: reason || null,
        doctorName: doctor || null,
        request: ctx.request,
        trace: ctx.trace,
        draft: {
          ...draft,
          residentId: resident.id,
          clinicId: clinic.id,
          date,
          time,
          reason: reason || null,
          doctorName: doctor || null,
        },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.vet.done(`${resident.name} (${resident.code})`, clinic.name, whenLabel, doctor || null),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.vet.title}
      summary={a.vet.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        clinic ? clinic.name : a.unknown,
        whenLabel,
        doctor || null,
      )}
      hint={chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!clinic && !!when}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="clinic"
        residentId={residentId}
        onChange={setResidentId}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={`clinic-${ctx.turnId}-clinic`} className="text-sm font-medium text-muted">
          {a.fields.vet} <span className="text-danger">*</span>
        </label>
        <select
          id={`clinic-${ctx.turnId}-clinic`}
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className={inputClass}
        >
          <option value="">{a.pickVet}</option>
          {ctx.clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`clinic-${ctx.turnId}-date`} className="text-sm font-medium text-muted">
            {a.fields.date} <span className="text-danger">*</span>
          </label>
          <DateInput
            id={`clinic-${ctx.turnId}-date`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`clinic-${ctx.turnId}-time`} className="text-sm font-medium text-muted">
            {a.fields.time} <span className="text-danger">*</span>
          </label>
          <input
            id={`clinic-${ctx.turnId}-time`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`clinic-${ctx.turnId}-reason`} className="text-sm font-medium text-muted">
          {a.fields.reason}
        </label>
        <input
          id={`clinic-${ctx.turnId}-reason`}
          type="text"
          value={reason}
          placeholder={t.vetVisits.reasonPlaceholder}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`clinic-${ctx.turnId}-doctor`} className="text-sm font-medium text-muted">
          {t.vetVisits.doctorName}
        </label>
        <input
          id={`clinic-${ctx.turnId}-doctor`}
          type="text"
          autoComplete="off"
          list={roster.length > 0 ? `clinic-${ctx.turnId}-doctors` : undefined}
          value={doctorName}
          placeholder={t.vetVisits.doctorNamePlaceholder}
          onChange={(e) => setDoctorName(e.target.value)}
          className={inputClass}
        />
        {roster.length > 0 && (
          <datalist id={`clinic-${ctx.turnId}-doctors`}>
            {roster.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        )}
        {alike.length === 1 && (
          <p className="text-xs text-muted">
            {a.vet.doctorAlike(alike[0])}{" "}
            <button
              type="button"
              onClick={() => setDoctorName(alike[0])}
              className="font-medium underline"
            >
              {a.vet.doctorUse(alike[0])}
            </button>
          </p>
        )}
        {doctorNote && <p className="text-xs text-muted">{doctorNote}</p>}
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
  const [date, setDate] = useState(draft.date ?? viewerToday());
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
        trace: ctx.trace,
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
        max={viewerToday()}
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
  const [date, setDate] = useState(draft.date ?? viewerToday());
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
        trace: ctx.trace,
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
        max={viewerToday()}
      />
    </Card>
  );
}

function WeightCard({ ctx, draft }: { ctx: CardContext; draft: WeightDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [weight, setWeight] = useState(draft.weightKg === null ? "" : String(draft.weightKg));
  const [date, setDate] = useState(draft.date ?? viewerToday());
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
      // The same function the conversation calls when it skips this card.
      const result = await recordLowRisk(
        { ...draft, residentId: resident.id, weightKg, date },
        { request: ctx.request, trace: ctx.trace, residents: ctx.residents, immunizationTypes: ctx.immunizationTypes, t, locale },
      );
      if ("error" in result) return setError(result.error);
      ctx.onSettle(result);
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
          max={viewerToday()}
        />
      </div>
    </Card>
  );
}

/** The card for whichever intent the parser claimed. */
/**
 * Who the card is about, said in the words a person can check against the
 * animal in front of them: name, code, and where the shelter has them.
 * Shown under the resident field on the destructive cards, because a
 * first name alone is not enough to be sure which animal is being closed.
 */
function ResidentIdentity({
  resident,
  line,
}: {
  resident: AssistantResident | null;
  line: (code: string, place: string) => string;
}) {
  const { t, locale } = useI18n();
  if (!resident) return null;
  const place = placeName(locale, resident.enclosureName, resident.enclosureNameTh) || t.common.dash;
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
      {resident.photoFileId ? (
        <img
          src={driveImageUrl(resident.photoFileId)}
          alt=""
          className="size-14 rounded-md object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {resident.thaiName ? `${resident.name} (${resident.thaiName})` : resident.name}
        </p>
        <p className="text-xs text-muted">{line(resident.code, place)}</p>
      </div>
    </div>
  );
}

function DeathCard({ ctx, draft }: { ctx: CardContext; draft: DeathDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const d = t.residents.deceased;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  // Never defaulted: the day of a death is the person's to give.
  const [date, setDate] = useState(draft.date ?? "");
  const [cause, setCause] = useState(draft.causeOfDeath ?? "");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const chrome = useCardChrome(ctx, !!residentId);

  function record() {
    if (!resident || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantRecordDeath({
        residentId: resident.id,
        date,
        causeOfDeath: cause.trim() || null,
        request: ctx.request,
        trace: ctx.trace,
        draft: { ...draft, residentId: resident.id, date, causeOfDeath: cause.trim() || null },
      });
      setConfirming(false);
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.death.done(`${resident.name} (${resident.code})`),
        residentId: resident.id,
      });
    });
  }

  return (
    <>
      <Card
        title={a.death.title}
        summary={a.death.summary(
          resident ? `${resident.name} (${resident.code})` : a.unknown,
          date ? formatDate(date, locale) : a.unknown,
        )}
        hint={!date ? a.death.dateNeeded : chrome.hint}
        hintTone={chrome.hintTone}
        error={error}
        pending={pending}
        canConfirm={!!resident && !!date}
        notesStamp={chrome.notesStamp}
        onConfirm={() => setConfirming(true)}
        onCancel={() => ctx.onSettle({ kind: "cancelled" })}
      >
        <ResidentField
          ctx={ctx}
          idPrefix="death"
          residentId={residentId}
          onChange={setResidentId}
        />
        <ResidentIdentity resident={resident} line={a.death.who} />
        <DateField
          id={`death-${ctx.turnId}-date`}
          label={d.fields.date}
          value={date}
          onChange={setDate}
          max={viewerToday()}
        />
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`death-${ctx.turnId}-cause`}
            className="text-sm font-medium text-muted"
          >
            {a.fields.causeOfDeath}
          </label>
          <input
            id={`death-${ctx.turnId}-cause`}
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            placeholder={d.fields.causeOfDeathPlaceholder}
            className={inputClass}
          />
        </div>
      </Card>
      {/* The same dialog, in the same words, as the deceased page. */}
      <ConfirmDialog
        open={confirming}
        icon={HeartCrack}
        title={d.confirm.title(resident ? `${resident.name} (${resident.code})` : "")}
        body={d.confirm.body}
        consequences={d.whatHappens.items}
        confirmLabel={d.confirm.confirmButton}
        pendingLabel={d.recording}
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={record}
      />
    </>
  );
}

function RehomeCard({ ctx, draft }: { ctx: CardContext; draft: RehomeDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [kind, setKind] = useState<"foster" | "adopt" | "">(draft.rehomeKind ?? "");
  const [carerId, setCarerId] = useState(draft.carerId ?? "");
  const [date, setDate] = useState(draft.date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const carer = ctx.carers.find((c) => c.id === carerId) ?? null;
  const chrome = useCardChrome(ctx, !!residentId);

  function confirm() {
    if (!resident || !carer || !kind || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantRehome({
        residentId: resident.id,
        rehomeKind: kind,
        carerId: carer.id,
        date,
        request: ctx.request,
        trace: ctx.trace,
        draft: {
          ...draft,
          residentId: resident.id,
          rehomeKind: kind,
          carerId: carer.id,
          date,
        },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: a.rehome.done(
          `${resident.name} (${resident.code})`,
          a.rehome.kinds[kind],
          carer.name,
        ),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={a.rehome.title}
      summary={a.rehome.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        kind ? a.rehome.verbs[kind] : a.unknown,
        carer ? carer.name : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={!carer && ctx.carers.length > 0 ? chrome.hint : !carer ? a.rehome.carerMissing : chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!carer && !!kind && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="rehome"
        residentId={residentId}
        onChange={setResidentId}
      />
      <ResidentIdentity resident={resident} line={a.rehome.who} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`rehome-${ctx.turnId}-kind`} className="text-sm font-medium text-muted">
          {a.rehome.kindLabel} <span className="text-danger">*</span>
        </label>
        <select
          id={`rehome-${ctx.turnId}-kind`}
          value={kind}
          onChange={(e) => setKind(e.target.value as "foster" | "adopt" | "")}
          className={inputClass}
        >
          <option value="">{a.rehome.pickKind}</option>
          <option value="foster">{a.rehome.verbs.foster}</option>
          <option value="adopt">{a.rehome.verbs.adopt}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`rehome-${ctx.turnId}-carer`} className="text-sm font-medium text-muted">
          {a.rehome.carerLabel} <span className="text-danger">*</span>
        </label>
        <select
          id={`rehome-${ctx.turnId}-carer`}
          value={carerId}
          onChange={(e) => setCarerId(e.target.value)}
          className={inputClass}
        >
          <option value="">{a.rehome.pickCarer}</option>
          {ctx.carers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <DateField
        id={`rehome-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={viewerToday()}
      />
    </Card>
  );
}

function CarerReturnCard({ ctx, draft }: { ctx: CardContext; draft: CarerReturnDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const s = carerReturnStrings(locale);
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [enclosureId, setEnclosureId] = useState(draft.enclosureId ?? "");
  const [date, setDate] = useState(draft.date ?? viewerToday());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const target = ctx.enclosures.find((e) => e.id === enclosureId) ?? null;
  const carer = ctx.carers.find((c) => c.id === draft.carerId) ?? null;
  const chrome = useCardChrome(ctx, !!residentId);
  // Said here rather than only at Confirm; the helper refuses it either way.
  const withCarer = !resident || resident.status === "Fostered" || resident.status === "Adopted";

  function confirm() {
    if (!resident || !target || !date) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantReturnFromCarer({
        residentId: resident.id,
        enclosureId: target.id,
        date,
        request: ctx.request,
        trace: ctx.trace,
        draft: { ...draft, residentId: resident.id, enclosureId: target.id, date },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: s.done(
          `${resident.name} (${resident.code})`,
          placeName(locale, target.name, target.name_th),
        ),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={s.title}
      summary={s.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        target ? placeName(locale, target.name, target.name_th) : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={
        !withCarer
          ? s.notWithCarer
          : draft.carerName
            ? s.unknownCarer(draft.carerName)
            : !target
              ? s.pickEnclosure
              : chrome.hint
      }
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!target && !!date && withCarer}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="carer-return"
        residentId={residentId}
        onChange={setResidentId}
      />
      <ResidentIdentity resident={resident} line={a.rehome.who} />
      {carer && <p className="text-sm text-muted">{s.fromCarer(carer.name)}</p>}
      <EnclosurePicker
        zones={ctx.zones}
        enclosures={ctx.enclosures}
        value={enclosureId}
        onChange={setEnclosureId}
        required
        idPrefix={`carer-return-${ctx.turnId}`}
      />
      <DateField
        id={`carer-return-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={viewerToday()}
      />
    </Card>
  );
}

function ImmunizationCard({ ctx, draft }: { ctx: CardContext; draft: ImmunizationDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const s = immunizationStrings(locale);
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [typeIds, setTypeIds] = useState<string[]>(draft.immunizationTypeIds);
  const [date, setDate] = useState(draft.date ?? viewerToday());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const chosen = ctx.immunizationTypes.filter((ty) => typeIds.includes(ty.id));
  const label = (ty: AssistantImmunizationType) => (locale === "th" && ty.nameTh) || ty.name;
  const chrome = useCardChrome(ctx, !!residentId);

  function toggle(id: string) {
    setTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirm() {
    if (!resident || chosen.length === 0 || !date) return;
    setError(null);
    startTransition(async () => {
      // The same function the conversation calls when it skips this card.
      const result = await recordLowRisk(
        { ...draft, residentId: resident.id, immunizationTypeIds: chosen.map((ty) => ty.id), date },
        { request: ctx.request, trace: ctx.trace, residents: ctx.residents, immunizationTypes: ctx.immunizationTypes, t, locale },
      );
      if ("error" in result) return setError(result.error);
      ctx.onSettle(result);
    });
  }

  return (
    <Card
      title={s.title}
      summary={s.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        chosen.length ? chosen.map(label).join(", ") : a.unknown,
        date ? formatDate(date, locale) : a.unknown,
      )}
      hint={chosen.length === 0 ? s.typeMissing : chrome.hint}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && chosen.length > 0 && !!date}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField
        ctx={ctx}
        idPrefix="immunization"
        residentId={residentId}
        onChange={setResidentId}
      />
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-muted">
          {s.typesLabel} <span className="text-danger">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ctx.immunizationTypes.map((ty) => (
            <label key={ty.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={typeIds.includes(ty.id)}
                onChange={() => toggle(ty.id)}
              />
              {label(ty)}
            </label>
          ))}
        </div>
      </fieldset>
      <DateField
        id={`immunization-${ctx.turnId}-date`}
        label={a.fields.date}
        value={date}
        onChange={setDate}
        max={viewerToday()}
      />
    </Card>
  );
}

/**
 * The prescription card. The sentence gives the medicine, the amount and
 * when it starts; which DAYS it falls on is the form's own picker (0283),
 * reused here rather than described in words, and the times on those days
 * are the round ticks. `timesPerDay` from the sentence pre-ticks that many,
 * in the order the form shows them.
 *
 * Confirm runs `recordPrescription` — `createPrescription` without its
 * redirect — so this is the prescription form with its fields filled in,
 * not a second way to write the row.
 */
function PrescriptionCard({ ctx, draft }: { ctx: CardContext; draft: PrescriptionDraft }) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const p = a.prescription;
  const [residentId, setResidentId] = useState(draft.residentId ?? "");
  const [medicationId, setMedicationId] = useState(draft.medicationId ?? "");
  const [dose, setDose] = useState(draft.doseQuantity === null ? "" : String(draft.doseQuantity));
  const [startDate, setStartDate] = useState(draft.startDate ?? viewerToday());
  const [endDate, setEndDate] = useState(draft.endDate ?? "");
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [schedule, setSchedule] = useState<ScheduleFormValues>(() =>
    scheduleToForm(null, draft.startDate ?? viewerToday()),
  );
  const [roundIds, setRoundIds] = useState<string[]>(() =>
    ctx.rounds.slice(0, Math.min(Math.max(draft.timesPerDay ?? 1, 1), ctx.rounds.length)).map((r) => r.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resident = ctx.residents.find((r) => r.id === residentId) ?? null;
  const medication = ctx.medications.find((m) => m.id === medicationId) ?? null;
  const doseQuantity = dose.trim() === "" ? null : Number(dose);
  const doseOk = doseQuantity === null || (Number.isFinite(doseQuantity) && doseQuantity > 0);
  // The form's own validator, so this card and /prescriptions/new agree about
  // what a day pattern means and when the ticks are owed.
  const parsedSchedule = parseScheduleForm(schedule);
  const rx = "schedule" in parsedSchedule ? parsedSchedule.schedule : null;
  const scheduleOk = "schedule" in parsedSchedule;
  const ticksShown = showsRoundTicks(rx);
  const ticksOk = scheduleOk && tickVerdict(rx, roundIds.length) === "ok";
  const chrome = useCardChrome(ctx, !!residentId);
  const medicationLabel = (m: AssistantMedication) => localLabel(locale, m.name, m.nameTh);

  function toggleRound(id: string) {
    setRoundIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirm() {
    if (!resident || !medication || !startDate || !doseOk || !scheduleOk || !ticksOk) return;
    setError(null);
    startTransition(async () => {
      const result = await assistantAddPrescription({
        residentId: resident.id,
        medicationId: medication.id,
        doseQuantity,
        startDate,
        endDate: endDate || null,
        schedule,
        roundIds: ticksShown ? roundIds : [],
        notes: notes.trim() || null,
        request: ctx.request,
        trace: ctx.trace,
        draft: {
          ...draft,
          residentId: resident.id,
          medicationId: medication.id,
          doseQuantity,
          startDate,
          endDate: endDate || null,
          notes: notes.trim() || null,
        },
      });
      if ("error" in result) return setError(result.error);
      ctx.onSettle({
        kind: "done",
        message: p.done(`${resident.name} (${resident.code})`, medicationLabel(medication)),
        residentId: resident.id,
      });
    });
  }

  return (
    <Card
      title={p.title}
      summary={p.summary(
        resident ? `${resident.name} (${resident.code})` : a.unknown,
        medication ? medicationLabel(medication) : a.unknown,
        startDate ? formatDate(startDate, locale) : a.unknown,
      )}
      hint={medication ? chrome.hint : p.pickMedication}
      hintTone={chrome.hintTone}
      error={error}
      pending={pending}
      canConfirm={!!resident && !!medication && !!startDate && doseOk && scheduleOk && ticksOk}
      notesStamp={chrome.notesStamp}
      onConfirm={confirm}
      onCancel={() => ctx.onSettle({ kind: "cancelled" })}
    >
      <ResidentField ctx={ctx} idPrefix="prescription" residentId={residentId} onChange={setResidentId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`prescription-${ctx.turnId}-medication`} className="text-sm font-medium text-muted">
            {p.medicationLabel} <span className="text-danger">*</span>
          </label>
          <select
            id={`prescription-${ctx.turnId}-medication`}
            value={medicationId}
            onChange={(e) => setMedicationId(e.target.value)}
            className={inputClass}
          >
            <option value="">{p.pickMedication}</option>
            {ctx.medications.map((m) => (
              <option key={m.id} value={m.id}>
                {medicationLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`prescription-${ctx.turnId}-dose`} className="text-sm font-medium text-muted">
            {medication ? p.doseLabelWithUnit(medication.doseUnit) : p.doseLabel}
          </label>
          <input
            id={`prescription-${ctx.turnId}-dose`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField
          id={`prescription-${ctx.turnId}-start`}
          label={p.startLabel}
          value={startDate}
          onChange={setStartDate}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor={`prescription-${ctx.turnId}-end`} className="text-sm font-medium text-muted">
            {p.endLabel}
          </label>
          <DateInput
            id={`prescription-${ctx.turnId}-end`}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted">{p.daysLabel}</p>
        <ScheduleDays value={schedule} onChange={setSchedule} startDate={startDate} />
      </div>
      {ticksShown && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-muted">
            {p.roundsLabel} <span className="text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {ctx.rounds.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={roundIds.includes(r.id)} onChange={() => toggleRound(r.id)} />
                {localLabel(locale, r.name, r.nameTh)}
              </label>
            ))}
          </div>
          {!ticksOk && <p className="text-sm text-danger">{t.prescriptions.days.errors.ticksNone}</p>}
        </fieldset>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor={`prescription-${ctx.turnId}-notes`} className="text-sm font-medium text-muted">
          {p.notesLabel}
        </label>
        <input
          id={`prescription-${ctx.turnId}-notes`}
          type="text"
          maxLength={200}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>
    </Card>
  );
}

export function AssistantCard({ ctx, draft }: { ctx: CardContext; draft: Draft }) {
  switch (draft.kind) {
    case "move":
      return <MoveCard ctx={ctx} draft={draft} />;
    case "clinic":
      return <ClinicCard ctx={ctx} draft={draft} />;
    case "hospital":
      return <HospitalCard ctx={ctx} draft={draft} />;
    case "hospital-return":
      return <HospitalReturnCard ctx={ctx} draft={draft} />;
    case "weight":
      return <WeightCard ctx={ctx} draft={draft} />;
    case "death":
      return <DeathCard ctx={ctx} draft={draft} />;
    case "rehome":
      return <RehomeCard ctx={ctx} draft={draft} />;
    case "carer-return":
      return <CarerReturnCard ctx={ctx} draft={draft} />;
    case "immunization":
      return <ImmunizationCard ctx={ctx} draft={draft} />;
    case "prescription":
      return <PrescriptionCard ctx={ctx} draft={draft} />;
    default:
      // The lookups never reach a card; they are answered inline.
      return null;
  }
}
